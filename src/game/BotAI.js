import * as THREE from 'three';
import { buildSoldierMesh, animateSoldierModel } from './SoldierMesh.js';
import { resolveCylinderCollisions } from './Physics.js';

const BOT_NAMES = ['Viper-AI', 'Kestrel-AI', 'Titan-AI', 'Specter-AI'];
const BOT_COLORS = [0x991b1b, 0x0f766e, 0x92400e, 0x4c1d95];

const DIFFICULTY_PRESETS = {
  casual: {
    reactionMs: 650,
    burstIntervalMs: 360,
    burstSize: 2,
    burstPauseMs: 950,
    hitChance: 0.24,
    damage: 10,
    spread: 0.13,
    turnRate: 4.2,
    moveSpeed: 4.0
  },
  tactical: {
    reactionMs: 420,
    burstIntervalMs: 260,
    burstSize: 3,
    burstPauseMs: 750,
    hitChance: 0.34,
    damage: 12,
    spread: 0.095,
    turnRate: 5.8,
    moveSpeed: 4.8
  },
  veteran: {
    reactionMs: 260,
    burstIntervalMs: 185,
    burstSize: 4,
    burstPauseMs: 520,
    hitChance: 0.48,
    damage: 15,
    spread: 0.065,
    turnRate: 7.5,
    moveSpeed: 5.6
  }
};

function lerpAngle(current, target, alpha) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * alpha;
}

export class BotManager {
  constructor(scene, castShadows = true) {
    this.scene = scene;
    this.castShadows = castShadows;
    this.bots = [];
    this.raycaster = new THREE.Raycaster();
    this.difficulty = 'tactical';
  }

  spawnBots(count, spawns, difficulty = 'tactical') {
    this.clear();
    this.difficulty = difficulty;
    for (let i = 0; i < count; i++) {
      const sp = spawns[(i + 1) % spawns.length];
      const id = `bot_${i}`;
      const name = BOT_NAMES[i % BOT_NAMES.length];
      const model = buildSoldierMesh(id, name, BOT_COLORS[i % BOT_COLORS.length], this.castShadows);
      model.root.position.set(sp.x, (sp.y || 1.7) - 1.7, sp.z);
      this.scene.add(model.root);

      this.bots.push({
        id,
        name,
        model,
        pos: new THREE.Vector3(sp.x, sp.y || 1.7, sp.z),
        velY: 0,
        yaw: sp.yaw || 0,
        pitch: 0,
        hp: 100,
        alive: true,
        respawnAt: 0,
        kills: 0,
        deaths: 0,
        inTankId: -1,
        roamTarget: new THREE.Vector3((Math.random() - 0.5) * 60, sp.y || 1.7, (Math.random() - 0.5) * 60),
        retargetAt: 0,
        acquiredTargetId: '',
        acquiredAt: 0,
        burstRemaining: 0,
        nextBurstAt: 0,
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

  update(dt, nowMs, { colliders, worldMeshes, spawns, tankSystem, terrainHeightFn, targets, onBotShoot, onBotGrenade, onBotTankFire }) {
    const cfg = DIFFICULTY_PRESETS[this.difficulty] || DIFFICULTY_PRESETS.tactical;

    for (const bot of this.bots) {
      if (!bot.alive) {
        bot.model.root.visible = false;
        if (nowMs >= bot.respawnAt) {
          const sp = spawns[Math.floor(Math.random() * spawns.length)];
          const sx = sp.x + (Math.random() - 0.5) * 2;
          const sz = sp.z + (Math.random() - 0.5) * 2;
          const sy = (terrainHeightFn ? terrainHeightFn(sx, sz) : 0) + 1.7;
          bot.pos.set(sx, sy, sz);
          bot.hp = 100;
          bot.alive = true;
          bot.inTankId = -1;
          bot.acquiredTargetId = '';
        }
        continue;
      }

      // Find closest visible or nearby target
      let bestTarget = null;
      let bestDist = Infinity;
      let bestLOS = false;

      for (const t of targets) {
        if (!t.alive || t.id === bot.id) continue;
        const d = bot.pos.distanceTo(t.pos);
        const los = d < 65 && this._hasLineOfSight(bot.pos, t.pos, worldMeshes);
        const scoreDist = los ? d * 0.55 : d;
        if (scoreDist < bestDist) {
          bestDist = scoreDist;
          bestTarget = t;
          bestLOS = los;
        }
      }

      if (bot.inTankId >= 0) {
        bot.model.root.visible = false;
        const tank = tankSystem.getTankById(bot.inTankId);
        if (!tank || tank.destroyed) {
          bot.inTankId = -1;
          continue;
        }

        let fwd = 0.55;
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
          fwd = dist > 22 ? 0.8 : dist < 11 ? -0.35 : 0.2;

          if (bestLOS && nowMs - bot.lastShotAt > 3100) {
            bot.lastShotAt = nowMs;
            onBotTankFire(bot, tank);
          }
        }

        tankSystem.driveTank(tank, fwd, turn, aimYaw, aimPitch, colliders, dt, terrainHeightFn);
        bot.pos.set(tank.x, tank.y + 2.0, tank.z);
        continue;
      }

      bot.model.root.visible = true;

      // Occasional tank boarding when near empty tank
      const nearTank = tankSystem.findNearestEnterableTank(bot.pos, 5.5);
      if (nearTank && Math.random() < 0.008) {
        nearTank.driverId = bot.id;
        bot.inTankId = nearTank.id;
        continue;
      }

      let moveSpeed = 0;
      const prevX = bot.pos.x;
      const prevZ = bot.pos.z;

      if (bestTarget && bestLOS) {
        const dx = bestTarget.pos.x - bot.pos.x;
        const dy = bestTarget.pos.y - bot.pos.y;
        const dz = bestTarget.pos.z - bot.pos.z;
        const horiz = Math.hypot(dx, dz);
        const realDist = Math.hypot(dx, dy, dz);

        const desiredYaw = Math.atan2(-dx, -dz);
        const desiredPitch = Math.max(-0.55, Math.min(0.55, Math.atan2(dy, horiz)));

        // Smooth human turning instead of instant 180 snap
        bot.yaw = lerpAngle(bot.yaw, desiredYaw, Math.min(1, cfg.turnRate * dt));
        bot.pitch += (desiredPitch - bot.pitch) * Math.min(1, cfg.turnRate * dt);

        // Reaction timer before opening fire
        if (bot.acquiredTargetId !== bestTarget.id) {
          bot.acquiredTargetId = bestTarget.id;
          bot.acquiredAt = nowMs + cfg.reactionMs + Math.random() * 180;
          bot.burstRemaining = cfg.burstSize;
          bot.nextBurstAt = bot.acquiredAt;
        }

        // Strafe & keep comfortable combat distance
        if (nowMs > bot.retargetAt) {
          bot.strafeDir = Math.random() < 0.5 ? 1 : -1;
          bot.retargetAt = nowMs + 950 + Math.random() * 950;
        }
        const rightX = Math.cos(bot.yaw);
        const rightZ = -Math.sin(bot.yaw);
        const fwdX = -Math.sin(bot.yaw);
        const fwdZ = -Math.cos(bot.yaw);
        const approach = realDist > 22 ? 0.55 : realDist < 8 ? -0.45 : 0;

        bot.pos.x += (rightX * bot.strafeDir + fwdX * approach) * cfg.moveSpeed * dt;
        bot.pos.z += (rightZ * bot.strafeDir + fwdZ * approach) * cfg.moveSpeed * dt;

        // Burst-fire cadence
        let aimError = desiredYaw - bot.yaw;
        while (aimError > Math.PI) aimError -= Math.PI * 2;
        while (aimError < -Math.PI) aimError += Math.PI * 2;

        if (nowMs >= bot.acquiredAt && Math.abs(aimError) < 0.45) {
          if (bot.burstRemaining > 0 && nowMs - bot.lastShotAt >= cfg.burstIntervalMs) {
            bot.lastShotAt = nowMs;
            bot.burstRemaining -= 1;
            bot.model.flashTimer = 0.065;
            onBotShoot(bot, bestTarget, cfg);
            if (bot.burstRemaining === 0) {
              bot.nextBurstAt = nowMs + cfg.burstPauseMs + Math.random() * 350;
            }
          } else if (bot.burstRemaining === 0 && nowMs >= bot.nextBurstAt) {
            bot.burstRemaining = cfg.burstSize;
          }
        }

        if (realDist > 13 && realDist < 28 && nowMs - bot.lastGrenadeAt > 11000) {
          bot.lastGrenadeAt = nowMs;
          onBotGrenade(bot, bestTarget);
        }
      } else {
        bot.acquiredTargetId = '';
        if (nowMs > bot.retargetAt || Math.hypot(bot.roamTarget.x - bot.pos.x, bot.roamTarget.z - bot.pos.z) < 2.5) {
          if (bestTarget && Math.random() < 0.65) {
            bot.roamTarget.copy(bestTarget.pos);
          } else {
            bot.roamTarget.set((Math.random() - 0.5) * 68, 1.7, (Math.random() - 0.5) * 68);
          }
          bot.retargetAt = nowMs + 2200 + Math.random() * 1400;
        }
        const dx = bot.roamTarget.x - bot.pos.x;
        const dz = bot.roamTarget.z - bot.pos.z;
        const len = Math.hypot(dx, dz) || 1;
        const desiredYaw = Math.atan2(-dx, -dz);
        bot.yaw = lerpAngle(bot.yaw, desiredYaw, Math.min(1, cfg.turnRate * dt));
        bot.pitch += (0 - bot.pitch) * Math.min(1, 6 * dt);
        const roamSpeed = cfg.moveSpeed * 1.12;
        bot.pos.x += (dx / len) * roamSpeed * dt;
        bot.pos.z += (dz / len) * roamSpeed * dt;
      }

      bot.velY -= 22 * dt;
      bot.pos.y += bot.velY * dt;
      const floorY = resolveCylinderCollisions(bot.pos, 0.42, 1.7, colliders, terrainHeightFn || 0);
      if (bot.pos.y - 1.7 <= floorY) {
        bot.pos.y = floorY + 1.7;
        bot.velY = 0;
      }

      moveSpeed = dt > 0.0001 ? Math.hypot(bot.pos.x - prevX, bot.pos.z - prevZ) / dt : 0;
      bot.model.root.position.set(bot.pos.x, bot.pos.y - 1.7, bot.pos.z);
      bot.model.root.rotation.y = bot.yaw;
      animateSoldierModel(bot.model, dt, moveSpeed, bot.pitch, moveSpeed > 0.35);
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
