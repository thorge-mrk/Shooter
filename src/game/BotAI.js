import * as THREE from 'three';
import { buildSoldierMesh } from './SoldierMesh.js';
import { resolveCylinderCollisions } from './Physics.js';

const BOT_NAMES = ['Viper-AI', 'Kestrel-AI', 'Titan-AI', 'Specter-AI'];
const BOT_COLORS = [0xb91c1c, 0x0f766e, 0x7c2d12, 0x6d28d9];

export class BotManager {
  constructor(scene, castShadows = true) {
    this.scene = scene;
    this.castShadows = castShadows;
    this.bots = [];
    this.raycaster = new THREE.Raycaster();
  }

  spawnBots(count, spawns) {
    this.clear();
    for (let i = 0; i < count; i++) {
      const sp = spawns[(i + 1) % spawns.length];
      const id = `bot_${i}`;
      const name = BOT_NAMES[i % BOT_NAMES.length];
      const model = buildSoldierMesh(id, name, BOT_COLORS[i % BOT_COLORS.length], this.castShadows);
      model.root.position.set(sp.x, 0, sp.z);
      this.scene.add(model.root);

      this.bots.push({
        id,
        name,
        model,
        pos: new THREE.Vector3(sp.x, sp.y, sp.z),
        velY: 0,
        yaw: sp.yaw || 0,
        pitch: 0,
        hp: 100,
        alive: true,
        respawnAt: 0,
        kills: 0,
        deaths: 0,
        inTankId: -1,
        roamTarget: new THREE.Vector3((Math.random() - 0.5) * 60, 1.7, (Math.random() - 0.5) * 60),
        retargetAt: 0,
        lastShotAt: 0,
        lastGrenadeAt: 0,
        strafeDir: Math.random() < 0.5 ? 1 : -1
      });
    }
  }

  getHitMeshes() {
    const out = [];
    for (const bot of this.bots) {
      if (bot.alive && bot.inTankId < 0) {
        out.push(...bot.model.hitMeshes);
      }
    }
    return out;
  }

  update(dt, nowMs, { colliders, worldMeshes, spawns, tankSystem, targets, onBotShoot, onBotGrenade, onBotTankFire }) {
    for (const bot of this.bots) {
      if (!bot.alive) {
        bot.model.root.visible = false;
        if (nowMs >= bot.respawnAt) {
          const sp = spawns[Math.floor(Math.random() * spawns.length)];
          bot.pos.set(sp.x + (Math.random() - 0.5) * 2, sp.y, sp.z + (Math.random() - 0.5) * 2);
          bot.hp = 100;
          bot.alive = true;
          bot.inTankId = -1;
        }
        continue;
      }

      // Acquire closest alive target (player or other bot)
      let bestTarget = null;
      let bestDist = Infinity;
      for (const t of targets) {
        if (!t.alive || t.id === bot.id) continue;
        const d = bot.pos.distanceTo(t.pos);
        if (d < bestDist) {
          bestDist = d;
          bestTarget = t;
        }
      }

      // If driving a tank
      if (bot.inTankId >= 0) {
        bot.model.root.visible = false;
        const tank = tankSystem.getTankById(bot.inTankId);
        if (!tank || tank.destroyed) {
          bot.inTankId = -1;
          continue;
        }

        let fwd = 0.6;
        let turn = 0;
        let aimYaw = tank.turretYaw;
        let aimPitch = 0;

        if (bestTarget) {
          const dx = bestTarget.pos.x - tank.x;
          const dz = bestTarget.pos.z - tank.z;
          aimYaw = Math.atan2(-dx, -dz);
          const dist = Math.hypot(dx, dz);
          aimPitch = Math.min(0.15, dist * 0.0018);

          let hullDiff = aimYaw - tank.yaw;
          while (hullDiff > Math.PI) hullDiff -= Math.PI * 2;
          while (hullDiff < -Math.PI) hullDiff += Math.PI * 2;
          turn = Math.max(-1, Math.min(1, hullDiff * 1.4));
          fwd = dist > 20 ? 0.85 : dist < 10 ? -0.4 : 0.2;

          if (nowMs - bot.lastShotAt > 2600 && this._hasLineOfSight(new THREE.Vector3(tank.x, 2.2, tank.z), bestTarget.pos, worldMeshes)) {
            bot.lastShotAt = nowMs;
            onBotTankFire(bot, tank);
          }
        }

        tankSystem.driveTank(tank, fwd, turn, aimYaw, aimPitch, colliders, dt);
        bot.pos.set(tank.x, 2.0, tank.z);
        continue;
      }

      bot.model.root.visible = true;

      // Check if an empty tank is nearby to board
      const nearTank = tankSystem.findNearestEnterableTank(bot.pos, 6.0);
      if (nearTank && Math.random() < 0.015) {
        nearTank.driverId = bot.id;
        bot.inTankId = nearTank.id;
        continue;
      }

      const hasLOS = bestTarget ? this._hasLineOfSight(bot.pos, bestTarget.pos, worldMeshes) : false;

      if (bestTarget && hasLOS) {
        const dx = bestTarget.pos.x - bot.pos.x;
        const dy = bestTarget.pos.y - bot.pos.y;
        const dz = bestTarget.pos.z - bot.pos.z;
        const horiz = Math.hypot(dx, dz);

        bot.yaw = Math.atan2(-dx, -dz);
        bot.pitch = Math.max(-0.5, Math.min(0.5, Math.atan2(dy, horiz)));

        // Strafe & engage
        if (nowMs > bot.retargetAt) {
          bot.strafeDir = Math.random() < 0.5 ? 1 : -1;
          bot.retargetAt = nowMs + 900 + Math.random() * 900;
        }
        const rightX = Math.cos(bot.yaw);
        const rightZ = -Math.sin(bot.yaw);
        const moveSpeed = 4.6;
        bot.pos.x += rightX * bot.strafeDir * moveSpeed * dt;
        bot.pos.z += rightZ * bot.strafeDir * moveSpeed * dt;

        // Shoot with fair AI reaction cadence
        if (nowMs - bot.lastShotAt > 480 + Math.random() * 240) {
          bot.lastShotAt = nowMs;
          onBotShoot(bot, bestTarget);
        }

        // Occasional grenade throw if target > 12m away
        if (bestDist > 12 && bestDist < 28 && nowMs - bot.lastGrenadeAt > 9500) {
          bot.lastGrenadeAt = nowMs;
          onBotGrenade(bot, bestTarget);
        }
      } else {
        // Roam toward waypoint or target
        if (nowMs > bot.retargetAt || bot.pos.distanceTo(bot.roamTarget) < 2.5) {
          if (bestTarget && Math.random() < 0.65) {
            bot.roamTarget.copy(bestTarget.pos);
          } else {
            bot.roamTarget.set((Math.random() - 0.5) * 68, 1.7, (Math.random() - 0.5) * 68);
          }
          bot.retargetAt = nowMs + 2200 + Math.random() * 1500;
        }
        const dx = bot.roamTarget.x - bot.pos.x;
        const dz = bot.roamTarget.z - bot.pos.z;
        const len = Math.hypot(dx, dz) || 1;
        bot.yaw = Math.atan2(-dx, -dz);
        bot.pitch = 0;
        const roamSpeed = 5.6;
        bot.pos.x += (dx / len) * roamSpeed * dt;
        bot.pos.z += (dz / len) * roamSpeed * dt;
      }

      // Gravity & AABB collision
      bot.velY -= 22 * dt;
      bot.pos.y += bot.velY * dt;
      const floorY = resolveCylinderCollisions(bot.pos, 0.42, 1.7, colliders, 0);
      if (bot.pos.y - 1.7 <= floorY) {
        bot.pos.y = floorY + 1.7;
        bot.velY = 0;
      }

      bot.model.root.position.set(bot.pos.x, bot.pos.y - 1.7, bot.pos.z);
      bot.model.root.rotation.y = bot.yaw;
      bot.model.armPivot.rotation.x = bot.pitch;
      bot.model.headGroup.rotation.x = bot.pitch * 0.6;
    }
  }

  _hasLineOfSight(from, to, worldMeshes) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const dist = dir.length();
    if (dist < 0.1) return true;
    dir.normalize();
    this.raycaster.set(from, dir);
    this.raycaster.far = dist;
    const hits = this.raycaster.intersectObjects(worldMeshes, false);
    return hits.length === 0;
  }

  clear() {
    for (const bot of this.bots) {
      this.scene.remove(bot.model.root);
      bot.model.root.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
      });
      bot.model.materials.forEach((m) => m.dispose());
      bot.model.tagTex.dispose();
    }
    this.bots = [];
  }
}
