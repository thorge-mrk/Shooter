import * as THREE from 'three';
import { resolveCircleCollisionsXZ } from './Physics.js';

export const TANK_MAX_HP = 350;
export const TANK_RESPAWN_MS = 18000;
export const TANK_CANNON_COOLDOWN_MS = 2100;

export class TankSystem {
  constructor(scene, textureLib, castShadows = true) {
    this.scene = scene;
    this.tanks = [];
    this.shells = [];
    this.hitMeshes = [];

    const steelTex = textureLib.getTextureSet('steel', 2, 2, 2);
    this.armorMat = new THREE.MeshStandardMaterial({
      color: 0x5c6652,
      map: steelTex.map,
      roughness: 0.58,
      metalness: 0.35
    });
    this.darkMat = new THREE.MeshStandardMaterial({ color: 0x1e242b, roughness: 0.75, metalness: 0.3 });
    this.barrelMat = new THREE.MeshStandardMaterial({ color: 0x2a313b, roughness: 0.4, metalness: 0.65 });
    this.shellMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    this.shellGeo = new THREE.SphereGeometry(0.18, 8, 8);
    this.castShadows = castShadows;
  }

  spawnTanks(pads) {
    this.clear();
    pads.forEach((pad, idx) => {
      const tank = this._createTankEntity(idx, pad);
      this.tanks.push(tank);
      this.scene.add(tank.root);
    });
  }

  _createTankEntity(id, pad) {
    const root = new THREE.Group();
    root.position.set(pad.x, 0, pad.z);
    root.rotation.y = pad.yaw || 0;

    // Hull group
    const hull = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.1, 5.1), this.armorMat);
    body.position.set(0, 0.95, 0);
    body.castShadow = this.castShadows;
    body.receiveShadow = this.castShadows;
    body.userData = { entityType: 'tank', tankId: id };
    hull.add(body);

    // Sloped front glacis
    const glacis = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.55, 1.2), this.armorMat);
    glacis.position.set(0, 1.05, -2.55);
    glacis.rotation.x = 0.48;
    glacis.userData = { entityType: 'tank', tankId: id };
    hull.add(glacis);

    // Left & right tracks
    const trackL = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.95, 5.4), this.darkMat);
    trackL.position.set(-1.75, 0.48, 0);
    trackL.castShadow = this.castShadows;
    trackL.userData = { entityType: 'tank', tankId: id };
    hull.add(trackL);

    const trackR = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.95, 5.4), this.darkMat);
    trackR.position.set(1.75, 0.48, 0);
    trackR.castShadow = this.castShadows;
    trackR.userData = { entityType: 'tank', tankId: id };
    hull.add(trackR);

    // Turret group (rotates independently)
    const turret = new THREE.Group();
    turret.position.set(0, 1.65, 0.1);

    const turretBody = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.88, 3.1), this.armorMat);
    turretBody.position.set(0, 0.35, 0.15);
    turretBody.castShadow = this.castShadows;
    turretBody.userData = { entityType: 'tank', tankId: id };
    turret.add(turretBody);

    // Main 120mm cannon barrel (points along -Z in turret space)
    const cannonPivot = new THREE.Group();
    cannonPivot.position.set(0, 0.38, -1.35);
    const cannonBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 3.6, 12), this.barrelMat);
    cannonBarrel.rotation.x = Math.PI / 2;
    cannonBarrel.position.set(0, 0, -1.7);
    cannonBarrel.castShadow = this.castShadows;
    cannonPivot.add(cannonBarrel);

    const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.34, 12), this.darkMat);
    muzzleBrake.rotation.x = Math.PI / 2;
    muzzleBrake.position.set(0, 0, -3.55);
    cannonPivot.add(muzzleBrake);
    turret.add(cannonPivot);

    // Coaxial MG barrel
    const coax = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8), this.darkMat);
    coax.rotation.x = Math.PI / 2;
    coax.position.set(0.45, 0.36, -1.65);
    turret.add(coax);

    // Status beacon light on cupola
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), beaconMat);
    beacon.position.set(-0.55, 0.92, 0.55);
    turret.add(beacon);

    root.add(hull);
    root.add(turret);

    this.hitMeshes.push(body, glacis, trackL, trackR, turretBody);

    return {
      id,
      pad: { ...pad },
      root,
      hull,
      turret,
      cannonPivot,
      beacon,
      beaconMat,
      x: pad.x,
      z: pad.z,
      yaw: pad.yaw || 0,
      turretYaw: pad.yaw || 0,
      barrelPitch: 0,
      speed: 0,
      hp: TANK_MAX_HP,
      driverId: '',
      destroyed: false,
      destroyedAt: 0,
      lastCannonAt: 0,
      lastCoaxAt: 0,
      coaxAmmo: 60
    };
  }

  getTankById(id) {
    return this.tanks.find((t) => t.id === id) || null;
  }

  findNearestEnterableTank(pos, maxDist = 5.0) {
    let best = null;
    let bestD = maxDist;
    for (const t of this.tanks) {
      if (t.destroyed || t.driverId) continue;
      const dx = t.x - pos.x;
      const dz = t.z - pos.z;
      const d = Math.hypot(dx, dz);
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    return best;
  }

  driveTank(tank, forwardInput, turnInput, aimYaw, aimPitch, colliders, dt) {
    if (!tank || tank.destroyed) return;

    const maxSpeed = 13.5;
    const accel = 22.0;
    const targetSpeed = forwardInput * maxSpeed;

    if (forwardInput !== 0) {
      tank.speed += Math.sign(targetSpeed - tank.speed) * Math.min(Math.abs(targetSpeed - tank.speed), accel * dt);
    } else {
      tank.speed *= Math.max(0, 1 - 5.5 * dt);
    }

    const turnRate = 1.65;
    tank.yaw += turnInput * turnRate * dt;

    // Move along tank forward (-Z in Three.js)
    const dirX = -Math.sin(tank.yaw);
    const dirZ = -Math.cos(tank.yaw);
    const pos = { x: tank.x + dirX * tank.speed * dt, z: tank.z + dirZ * tank.speed * dt };
    resolveCircleCollisionsXZ(pos, 2.55, colliders);

    tank.x = pos.x;
    tank.z = pos.z;

    // Smooth turret traverse toward desired world yaw
    const localTarget = aimYaw - tank.yaw;
    let diff = localTarget - (tank.turretYaw - tank.yaw);
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const maxStep = 2.8 * dt;
    const curLocal = tank.turretYaw - tank.yaw;
    const nextLocal = curLocal + Math.sign(diff) * Math.min(Math.abs(diff), maxStep);
    tank.turretYaw = tank.yaw + nextLocal;
    tank.barrelPitch = Math.max(-0.12, Math.min(0.32, aimPitch));

    this._applyTankTransforms(tank);
  }

  _applyTankTransforms(tank) {
    tank.root.position.set(tank.x, 0, tank.z);
    tank.root.rotation.y = tank.yaw;
    tank.turret.rotation.y = tank.turretYaw - tank.yaw;
    tank.cannonPivot.rotation.x = tank.barrelPitch;

    if (tank.destroyed) {
      tank.beaconMat.color.setHex(0xef4444);
      tank.root.visible = false;
    } else {
      tank.root.visible = true;
      tank.beaconMat.color.setHex(tank.driverId ? 0x38bdf8 : 0xf59e0b);
    }
  }

  getCannonMuzzlePose(tank) {
    const worldDir = new THREE.Vector3(0, 0, -1);
    const euler = new THREE.Euler(tank.barrelPitch, tank.turretYaw, 0, 'YXZ');
    worldDir.applyEuler(euler).normalize();

    const origin = new THREE.Vector3(tank.x, 2.08, tank.z).addScaledVector(worldDir, 4.9);
    return { origin, dir: worldDir };
  }

  spawnShell(origin, dir, ownerId, isLocal) {
    const mesh = new THREE.Mesh(this.shellGeo, this.shellMat);
    mesh.position.copy(origin);
    this.scene.add(mesh);
    this.shells.push({
      mesh,
      pos: origin.clone(),
      vel: dir.clone().multiplyScalar(68),
      ownerId,
      isLocal,
      life: 3.5
    });
  }

  update(dt, nowMs, colliders, onShellImpact) {
    // Respawn destroyed tanks
    for (const tank of this.tanks) {
      if (tank.destroyed && tank.destroyedAt > 0 && nowMs - tank.destroyedAt >= TANK_RESPAWN_MS) {
        tank.destroyed = false;
        tank.destroyedAt = 0;
        tank.hp = TANK_MAX_HP;
        tank.driverId = '';
        tank.x = tank.pad.x;
        tank.z = tank.pad.z;
        tank.yaw = tank.pad.yaw || 0;
        tank.turretYaw = tank.yaw;
        tank.speed = 0;
        tank.coaxAmmo = 60;
      }
      this._applyTankTransforms(tank);
    }

    // Update flying tank shells
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i];
      s.life -= dt;
      s.vel.y -= 9.5 * dt;

      const step = s.vel.clone().multiplyScalar(dt);
      const nextPos = s.pos.clone().add(step);

      let hit = false;
      if (nextPos.y <= 0.18) {
        nextPos.y = 0.18;
        hit = true;
      }

      if (!hit) {
        for (let cIdx = 0; cIdx < colliders.length; cIdx++) {
          const c = colliders[cIdx];
          if (
            nextPos.x >= c.minX && nextPos.x <= c.maxX &&
            nextPos.y >= c.minY && nextPos.y <= c.maxY &&
            nextPos.z >= c.minZ && nextPos.z <= c.maxZ
          ) {
            hit = true;
            break;
          }
        }
      }

      // Check direct hit against tanks
      if (!hit) {
        for (const t of this.tanks) {
          if (t.destroyed) continue;
          const dx = nextPos.x - t.x;
          const dz = nextPos.z - t.z;
          if (dx * dx + dz * dz < 6.8 && nextPos.y < 2.9) {
            hit = true;
            break;
          }
        }
      }

      s.pos.copy(nextPos);
      s.mesh.position.copy(nextPos);

      if (hit || s.life <= 0) {
        this.scene.remove(s.mesh);
        this.shells.splice(i, 1);
        if (onShellImpact) {
          onShellImpact(s.pos.clone(), s.ownerId, s.isLocal);
        }
      }
    }
  }

  clear() {
    for (const t of this.tanks) {
      this.scene.remove(t.root);
      t.root.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
      });
      t.beaconMat.dispose();
    }
    for (const s of this.shells) {
      this.scene.remove(s.mesh);
    }
    this.tanks = [];
    this.shells = [];
    this.hitMeshes = [];
  }

  dispose() {
    this.clear();
    this.armorMat.dispose();
    this.darkMat.dispose();
    this.barrelMat.dispose();
    this.shellMat.dispose();
    this.shellGeo.dispose();
  }
}
