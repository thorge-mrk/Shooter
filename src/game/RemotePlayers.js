import * as THREE from 'three';
import { buildSoldierMesh, animateSoldierModel } from './SoldierMesh.js';

const TEAM_COLORS = [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b, 0xa855f7];

function lerpAngle(current, target, alpha) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * alpha;
}

export class RemotePlayerManager {
  constructor(scene, castShadows = true) {
    this.scene = scene;
    this.castShadows = castShadows;
    this.remotes = new Map();
  }

  syncSnapshot(playersObj, localUid) {
    const seen = new Set();
    const entries = Object.entries(playersObj || {});
    const now = performance.now();

    entries.forEach(([uid, data], index) => {
      if (uid === localUid || !data) return;
      seen.add(uid);

      const feetY = (data.y ?? 1.7) - 1.7;
      let entity = this.remotes.get(uid);
      if (!entity) {
        const color = TEAM_COLORS[index % TEAM_COLORS.length];
        const model = buildSoldierMesh(uid, data.name || 'Operator', color, this.castShadows);
        this.scene.add(model.root);
        entity = {
          uid,
          data: { ...data },
          model,
          anchorPos: new THREE.Vector3(data.x || 0, feetY, data.z || 0),
          currentPos: new THREE.Vector3(data.x || 0, feetY, data.z || 0),
          vel: new THREE.Vector3(data.vx || 0, data.vy || 0, data.vz || 0),
          lastPacketAt: now,
          targetYaw: data.yaw || 0,
          currentYaw: data.yaw || 0,
          targetPitch: data.pitch || 0,
          currentPitch: data.pitch || 0
        };
        this.remotes.set(uid, entity);
      } else {
        const prevInTank = typeof entity.data.inTankId === 'number' && entity.data.inTankId >= 0;
        const nextInTank = typeof data.inTankId === 'number' && data.inTankId >= 0;

        entity.data = { ...data };
        entity.anchorPos.set(data.x || 0, feetY, data.z || 0);
        entity.vel.set(data.vx || 0, data.vy || 0, data.vz || 0);
        entity.lastPacketAt = now;
        entity.targetYaw = data.yaw || 0;
        entity.targetPitch = data.pitch || 0;

        // If player just exited a tank or respawned far away, snap cleanly so they don't slide across the map
        if ((prevInTank && !nextInTank) || entity.currentPos.distanceTo(entity.anchorPos) > 14) {
          entity.currentPos.copy(entity.anchorPos);
        }
      }
    });

    for (const [uid, entity] of this.remotes.entries()) {
      if (!seen.has(uid)) {
        this._removeEntity(entity);
        this.remotes.delete(uid);
      }
    }
  }

  triggerShotFlash(uid) {
    const entity = this.remotes.get(uid);
    if (entity) {
      entity.model.flashTimer = 0.065;
    }
  }

  update(dt) {
    const now = performance.now();
    const posAlpha = 1 - Math.exp(-11 * dt);
    const rotAlpha = 1 - Math.exp(-14 * dt);

    for (const entity of this.remotes.values()) {
      const alive = entity.data.alive !== false;
      const inTank = typeof entity.data.inTankId === 'number' && entity.data.inTankId >= 0;
      entity.model.root.visible = alive && !inTank;

      if (!entity.model.root.visible) continue;

      // Dead-reckoning prediction capped at 180ms so high-latency players glide smoothly without warping
      const ageSec = Math.min(0.18, Math.max(0, (now - entity.lastPacketAt) / 1000));
      const predictedX = entity.anchorPos.x + entity.vel.x * ageSec;
      const predictedY = entity.anchorPos.y + entity.vel.y * ageSec * 0.5;
      const predictedZ = entity.anchorPos.z + entity.vel.z * ageSec;

      const prevX = entity.currentPos.x;
      const prevZ = entity.currentPos.z;

      entity.currentPos.x += (predictedX - entity.currentPos.x) * posAlpha;
      entity.currentPos.y += (predictedY - entity.currentPos.y) * posAlpha;
      entity.currentPos.z += (predictedZ - entity.currentPos.z) * posAlpha;

      entity.currentYaw = lerpAngle(entity.currentYaw, entity.targetYaw, rotAlpha);
      entity.currentPitch += (entity.targetPitch - entity.currentPitch) * rotAlpha;

      entity.model.root.position.copy(entity.currentPos);
      entity.model.root.rotation.y = entity.currentYaw;

      const frameSpeed = dt > 0.0001
        ? Math.hypot(entity.currentPos.x - prevX, entity.currentPos.z - prevZ) / dt
        : 0;
      const netSpeed = Math.hypot(entity.vel.x, entity.vel.z);
      const animSpeed = Math.max(frameSpeed, netSpeed * 0.8);

      animateSoldierModel(entity.model, dt, animSpeed, entity.currentPitch, animSpeed > 0.35);
    }
  }

  getHitMeshes() {
    const list = [];
    for (const entity of this.remotes.values()) {
      if (entity.model.root.visible) {
        list.push(...entity.model.hitMeshes);
      }
    }
    return list;
  }

  _removeEntity(entity) {
    this.scene.remove(entity.model.root);
    entity.model.root.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
    });
    entity.model.materials.forEach((m) => m.dispose());
    entity.model.tagTex.dispose();
  }

  clear() {
    for (const entity of this.remotes.values()) {
      this._removeEntity(entity);
    }
    this.remotes.clear();
  }
}
