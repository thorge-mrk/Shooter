import * as THREE from 'three';
import { resolveCircleCollisionsXZ } from './Physics.js';
import { createBeveledBox, createFlutedCylinder } from './GeometryUtils.js';
import { createQualityMaterial } from './Textures.js';

export const TANK_MAX_HP = 350;
export const TANK_RESPAWN_MS = 18000;
export const TANK_CANNON_COOLDOWN_MS = 2100;

function lerpAngle(current, target, alpha) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * alpha;
}

export class TankSystem {
  constructor(scene, textureLib, castShadows = true) {
    this.scene = scene;
    this.textureLib = textureLib;
    this.tanks = [];
    this.shells = [];
    this.hitMeshes = [];
    this.quality = 'balanced';
    this.castShadows = castShadows;

    this._rebuildMaterials();
    this.shellMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    this.shellGeo = new THREE.SphereGeometry(0.18, 10, 10);
  }

  _rebuildMaterials() {
    const armorTex = this.textureLib.getTextureSet('tankArmor', 2, 2, this.quality === 'ultra' ? 8 : 2);
    const steelTex = this.textureLib.getTextureSet('steel', 2, 2, this.quality === 'ultra' ? 8 : 2);

    this.armorMat = createQualityMaterial({
      map: armorTex.map,
      normalMap: armorTex.normalMap,
      roughnessMap: armorTex.roughnessMap,
      roughness: 0.48,
      metalness: 0.38,
      clearcoat: 0.14
    }, this.quality);

    this.darkMat = createQualityMaterial({
      color: 0x1b2128,
      normalMap: steelTex.normalMap,
      roughness: 0.76,
      metalness: 0.32
    }, this.quality);

    this.barrelMat = createQualityMaterial({
      color: 0x2b323d,
      map: steelTex.map,
      normalMap: steelTex.normalMap,
      roughness: 0.32,
      metalness: 0.76,
      clearcoat: 0.22
    }, this.quality);

    this.opticMat = createQualityMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      roughness: 0.12,
      metalness: 0.9,
      clearcoat: 0.9
    }, this.quality);
  }

  setQuality(quality) {
    this.quality = quality;
    this.castShadows = quality !== 'fast';
  }

  spawnTanks(pads) {
    this.clear();
    this._rebuildMaterials();
    pads.forEach((pad, idx) => {
      const tank = this._createTankEntity(idx, pad);
      this.tanks.push(tank);
      this.scene.add(tank.root);
    });
  }

  _createTankEntity(id, pad) {
    const root = new THREE.Group();
    root.position.set(pad.x, pad.y || 0, pad.z);
    root.rotation.y = pad.yaw || 0;

    const hull = new THREE.Group();
    const tagTank = (mesh) => {
      mesh.castShadow = this.castShadows;
      mesh.receiveShadow = this.castShadows;
      mesh.userData = { entityType: 'tank', tankId: id };
      this.hitMeshes.push(mesh);
      return mesh;
    };

    // Main Beveled Composite Hull
    const body = tagTank(new THREE.Mesh(createBeveledBox(3.24, 1.04, 5.2, 0.08, 3), this.armorMat));
    body.position.set(0, 0.96, 0);
    hull.add(body);

    // Sloped Front Glacis Plate + Lower Bow Armor
    const glacis = tagTank(new THREE.Mesh(createBeveledBox(3.12, 0.54, 1.35, 0.06, 3), this.armorMat));
    glacis.position.set(0, 1.04, -2.56);
    glacis.rotation.x = 0.46;
    hull.add(glacis);

    // Explosive Reactive Armor (ERA) Bricks on Front & Side Skirts
    const eraGeo = createBeveledBox(0.46, 0.24, 0.14, 0.025, 2);
    for (let i = -2; i <= 2; i++) {
      const era = new THREE.Mesh(eraGeo, this.barrelMat);
      era.position.set(i * 0.54, 1.16, -2.62);
      era.rotation.x = 0.46;
      hull.add(era);
    }

    // Heavy Tracks + Beveled Side Ballistic Skirts
    const trackGeo = createBeveledBox(0.74, 0.92, 5.48, 0.07, 3);
    const trackL = tagTank(new THREE.Mesh(trackGeo, this.darkMat));
    trackL.position.set(-1.76, 0.48, 0);
    const trackR = tagTank(new THREE.Mesh(trackGeo, this.darkMat));
    trackR.position.set(1.76, 0.48, 0);
    hull.add(trackL, trackR);

    const skirtGeo = createBeveledBox(0.14, 0.52, 4.95, 0.03, 2);
    const skirtL = new THREE.Mesh(skirtGeo, this.armorMat);
    skirtL.position.set(-2.14, 0.78, 0);
    const skirtR = new THREE.Mesh(skirtGeo, this.armorMat);
    skirtR.position.set(2.14, 0.78, 0);
    hull.add(skirtL, skirtR);

    // Rear Engine Louvers & Tow Shackles
    const deckGrille = new THREE.Mesh(createBeveledBox(2.2, 0.12, 1.5, 0.03, 2), this.darkMat);
    deckGrille.position.set(0, 1.48, 1.55);
    hull.add(deckGrille);

    // 6 Road Wheels + Drive Sprockets per side
    for (let w = -2.1; w <= 2.1; w += 0.84) {
      for (const sx of [-1.84, 1.84]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.58, 14), this.barrelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(sx, 0.36, w);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.64, 10), this.darkMat);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(sx, 0.36, w);
        hull.add(wheel, hub);
      }
    }

    // Sculpted Angular Turret
    const turret = new THREE.Group();
    turret.position.set(0, 1.62, 0.08);

    const turretBody = tagTank(new THREE.Mesh(createBeveledBox(2.42, 0.86, 3.18, 0.09, 3), this.armorMat));
    turretBody.position.set(0, 0.36, 0.15);
    turret.add(turretBody);

    // Angled Turret Cheeks (Abrams/Leopard 2 style)
    const cheekGeo = createBeveledBox(0.95, 0.78, 1.15, 0.06, 2);
    const cheekL = tagTank(new THREE.Mesh(cheekGeo, this.armorMat));
    cheekL.position.set(-0.74, 0.36, -1.25);
    cheekL.rotation.y = 0.28;
    const cheekR = tagTank(new THREE.Mesh(cheekGeo, this.armorMat));
    cheekR.position.set(0.74, 0.36, -1.25);
    cheekR.rotation.y = -0.28;
    turret.add(cheekL, cheekR);

    // Commander Cupola + CITV Thermal Sight + Smoke Grenade Launchers
    const cupola = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.28, 14), this.barrelMat);
    cupola.position.set(0.58, 0.88, 0.35);
    const citvOptic = new THREE.Mesh(createBeveledBox(0.32, 0.26, 0.32, 0.04, 2), this.opticMat);
    citvOptic.position.set(-0.56, 0.9, -0.35);
    turret.add(cupola, citvOptic);

    for (const side of [-1, 1]) {
      for (let s = 0; s < 3; s++) {
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.32, 8), this.darkMat);
        tube.position.set(side * 1.24, 0.42 + s * 0.12, -0.65 - s * 0.08);
        tube.rotation.x = 0.65;
        tube.rotation.z = side * -0.22;
        turret.add(tube);
      }
    }

    // 120mm Smoothbore Cannon + Bore Evacuator (Fume Extractor) + Muzzle Reference Sensor
    const cannonPivot = new THREE.Group();
    cannonPivot.position.set(0, 0.38, -1.35);
    const cannonSlide = new THREE.Group();

    const mantlet = new THREE.Mesh(createBeveledBox(0.68, 0.56, 0.54, 0.06, 2), this.darkMat);
    mantlet.position.set(0, 0, -0.1);
    cannonSlide.add(mantlet);

    const cannonBarrel = new THREE.Mesh(createFlutedCylinder(0.115, 0.14, 3.68, 16, 6, 8, 0.005), this.barrelMat);
    cannonBarrel.rotation.x = Math.PI / 2;
    cannonBarrel.position.set(0, 0, -1.78);
    cannonBarrel.castShadow = this.castShadows;
    cannonSlide.add(cannonBarrel);

    const evacuator = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.68, 14), this.armorMat);
    evacuator.rotation.x = Math.PI / 2;
    evacuator.position.set(0, 0, -1.65);
    cannonSlide.add(evacuator);

    const muzzleBrake = new THREE.Mesh(createBeveledBox(0.32, 0.28, 0.42, 0.04, 2), this.darkMat);
    muzzleBrake.position.set(0, 0, -3.62);
    cannonSlide.add(muzzleBrake);

    cannonPivot.add(cannonSlide);
    turret.add(cannonPivot);

    // Coaxial 7.62mm MG
    const coax = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 1.15, 10), this.darkMat);
    coax.rotation.x = Math.PI / 2;
    coax.position.set(0.42, 0.36, -1.72);
    turret.add(coax);

    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), beaconMat);
    beacon.position.set(-0.58, 0.96, 0.65);
    turret.add(beacon);

    root.add(hull);
    root.add(turret);

    return {
      id,
      pad: { ...pad },
      root,
      hull,
      turret,
      cannonPivot,
      cannonSlide,
      beacon,
      beaconMat,
      x: pad.x,
      y: pad.y || 0,
      z: pad.z,
      yaw: pad.yaw || 0,
      turretYaw: pad.yaw || 0,
      barrelPitch: 0,
      barrelRecoil: 0,
      targetX: pad.x,
      targetZ: pad.z,
      targetYaw: pad.yaw || 0,
      targetTurretYaw: pad.yaw || 0,
      hasRemoteTarget: false,
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

  findNearestEnterableTank(pos, maxDist = 5.2) {
    let best = null;
    let bestD = maxDist;
    for (const t of this.tanks) {
      if (t.destroyed || t.driverId) continue;
      const d = Math.hypot(t.x - pos.x, t.z - pos.z);
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    return best;
  }

  triggerBarrelRecoil(tank) {
    if (tank) tank.barrelRecoil = 0.65;
  }

  driveTank(tank, forwardInput, turnInput, aimYaw, aimPitch, colliders, dt, terrainHeightFn = null) {
    if (!tank || tank.destroyed) return;
    tank.hasRemoteTarget = false;

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

    const dirX = -Math.sin(tank.yaw);
    const dirZ = -Math.cos(tank.yaw);
    const pos = { x: tank.x + dirX * tank.speed * dt, z: tank.z + dirZ * tank.speed * dt };
    resolveCircleCollisionsXZ(pos, 2.55, colliders);

    tank.x = pos.x;
    tank.z = pos.z;
    tank.y = terrainHeightFn ? terrainHeightFn(tank.x, tank.z) : 0;

    const localTarget = aimYaw - tank.yaw;
    let diff = localTarget - (tank.turretYaw - tank.yaw);
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const maxStep = 2.8 * dt;
    const curLocal = tank.turretYaw - tank.yaw;
    const nextLocal = curLocal + Math.sign(diff) * Math.min(Math.abs(diff), maxStep);
    tank.turretYaw = tank.yaw + nextLocal;
    tank.barrelPitch = Math.max(-0.12, Math.min(0.32, aimPitch));

    this._applyTankTransforms(tank, terrainHeightFn);
  }

  setRemoteTarget(tank, x, z, yaw, turretYaw) {
    tank.targetX = x;
    tank.targetZ = z;
    tank.targetYaw = yaw;
    tank.targetTurretYaw = turretYaw;
    tank.hasRemoteTarget = true;
  }

  _applyTankTransforms(tank, terrainHeightFn = null) {
    const groundY = terrainHeightFn ? terrainHeightFn(tank.x, tank.z) : tank.y;
    tank.y = groundY;
    tank.root.position.set(tank.x, groundY, tank.z);
    tank.root.rotation.y = tank.yaw;

    if (terrainHeightFn) {
      const fwdX = -Math.sin(tank.yaw);
      const fwdZ = -Math.cos(tank.yaw);
      const hFront = terrainHeightFn(tank.x + fwdX * 1.8, tank.z + fwdZ * 1.8);
      const hBack = terrainHeightFn(tank.x - fwdX * 1.8, tank.z - fwdZ * 1.8);
      tank.hull.rotation.x = Math.atan2(hFront - hBack, 3.6);
    } else {
      tank.hull.rotation.x = 0;
    }

    tank.turret.rotation.y = tank.turretYaw - tank.yaw;
    tank.cannonPivot.rotation.x = tank.barrelPitch;
    tank.cannonSlide.position.z = tank.barrelRecoil;

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

    const origin = new THREE.Vector3(tank.x, tank.y + 2.08, tank.z).addScaledVector(worldDir, 4.9);
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

  update(dt, nowMs, colliders, onShellImpact, terrainHeightFn = null, localId = '') {
    const remoteBlend = 1 - Math.exp(-12 * dt);

    for (const tank of this.tanks) {
      if (tank.barrelRecoil > 0) {
        tank.barrelRecoil = Math.max(0, tank.barrelRecoil - dt * 2.2);
      }

      if (tank.destroyed && tank.destroyedAt > 0 && nowMs - tank.destroyedAt >= TANK_RESPAWN_MS) {
        tank.destroyed = false;
        tank.destroyedAt = 0;
        tank.hp = TANK_MAX_HP;
        tank.driverId = '';
        tank.x = tank.pad.x;
        tank.z = tank.pad.z;
        tank.y = terrainHeightFn ? terrainHeightFn(tank.x, tank.z) : (tank.pad.y || 0);
        tank.yaw = tank.pad.yaw || 0;
        tank.turretYaw = tank.yaw;
        tank.speed = 0;
        tank.coaxAmmo = 60;
        tank.hasRemoteTarget = false;
      }

      if (!tank.destroyed && tank.driverId !== localId && tank.hasRemoteTarget) {
        const dist = Math.hypot(tank.targetX - tank.x, tank.targetZ - tank.z);
        if (dist > 14) {
          tank.x = tank.targetX;
          tank.z = tank.targetZ;
        } else {
          tank.x += (tank.targetX - tank.x) * remoteBlend;
          tank.z += (tank.targetZ - tank.z) * remoteBlend;
        }
        tank.yaw = lerpAngle(tank.yaw, tank.targetYaw, remoteBlend);
        tank.turretYaw = lerpAngle(tank.turretYaw, tank.targetTurretYaw, remoteBlend);
      }

      this._applyTankTransforms(tank, terrainHeightFn);
    }

    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i];
      s.life -= dt;
      s.vel.y -= 9.5 * dt;

      const step = s.vel.clone().multiplyScalar(dt);
      const nextPos = s.pos.clone().add(step);

      let hit = false;
      const groundY = terrainHeightFn ? terrainHeightFn(nextPos.x, nextPos.z) : 0;
      if (nextPos.y <= groundY + 0.18) {
        nextPos.y = groundY + 0.18;
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

      if (!hit) {
        for (const t of this.tanks) {
          if (t.destroyed) continue;
          const dx = nextPos.x - t.x;
          const dz = nextPos.z - t.z;
          if (dx * dx + dz * dz < 6.8 && nextPos.y < t.y + 2.9) {
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
    this.armorMat?.dispose();
    this.darkMat?.dispose();
    this.barrelMat?.dispose();
    this.opticMat?.dispose();
    this.shellMat.dispose();
    this.shellGeo.dispose();
  }
}
