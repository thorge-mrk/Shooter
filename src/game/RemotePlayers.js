import * as THREE from 'three';
import { buildSoldierMesh, applySoldierSkin, animateSoldierModel } from './SoldierMesh.js';
import { NetSnapshotBuffer, lerpAngle } from './NetSnapshotBuffer.js';

const TEAM_COLORS = [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b, 0xa855f7];

export class RemotePlayerManager {
  constructor(scene, castShadows = true, textureLib = null, quality = 'balanced') {
    this.scene = scene;
    this.castShadows = castShadows;
    this.textureLib = textureLib;
    this.quality = quality;
    this.remotes = new Map();
    this.colorIndex = 0;
  }

  setQuality(quality) {
    this.quality = quality;
    this.castShadows = quality !== 'fast';
  }

  upsertPlayer(uid, data, localUid, serverNowMs) {
    if (uid === localUid || !data) return;
    const feetY = (data.y ?? 1.7) - 1.7;
    const snapTime = typeof data.t === 'number' ? data.t : serverNowMs;
    const snap = {
      t: snapTime,
      x: data.x || 0,
      y: feetY,
      z: data.z || 0,
      vx: data.vx || 0,
      vz: data.vz || 0,
      yaw: data.yaw || 0,
      pitch: data.pitch || 0
    };

    const operatorId = data.operatorId || 'vanguard';
    const skinId = data.skinId || 'factory';

    let entity = this.remotes.get(uid);
    if (!entity) {
      const color = TEAM_COLORS[this.colorIndex++ % TEAM_COLORS.length];
      const model = buildSoldierMesh(uid, data.name || 'Operator', color, this.castShadows, {
        operatorId,
        skinId,
        color,
        textureLib: this.textureLib,
        quality: this.quality
      });
      this.scene.add(model.root);
      const buffer = new NetSnapshotBuffer(95);
      buffer.push(snap);
      entity = {
        uid,
        data: { ...data },
        operatorId,
        skinId,
        model,
        buffer,
        currentPos: new THREE.Vector3(snap.x, snap.y, snap.z),
        currentYaw: snap.yaw,
        currentPitch: snap.pitch
      };
      this.remotes.set(uid, entity);
    } else {
      const prevInTank = typeof entity.data.inTankId === 'number' && entity.data.inTankId >= 0;
      const nextInTank = typeof data.inTankId === 'number' && data.inTankId >= 0;
      const prevAlive = entity.data.alive !== false;
      const nextAlive = data.alive !== false;

      if (entity.skinId !== skinId && this.textureLib) {
        entity.skinId = skinId;
        applySoldierSkin(entity.model, skinId, this.textureLib, this.quality);
      }

      entity.data = { ...data };
      const jumpDist = Math.hypot(snap.x - entity.currentPos.x, snap.z - entity.currentPos.z);

      // Snap cleanly on tank exit, respawn, or long-distance teleport
      if ((prevInTank && !nextInTank) || (!prevAlive && nextAlive) || jumpDist > 14) {
        entity.buffer.clear(snap);
        entity.currentPos.set(snap.x, snap.y, snap.z);
        entity.currentYaw = snap.yaw;
        entity.currentPitch = snap.pitch;
      } else {
        entity.buffer.push(snap);
      }
    }
  }

  removePlayer(uid) {
    const entity = this.remotes.get(uid);
    if (entity) {
      this._removeEntity(entity);
      this.remotes.delete(uid);
    }
  }

  syncSnapshot(playersObj, localUid, serverNowMs = Date.now()) {
    const seen = new Set();
    for (const [uid, data] of Object.entries(playersObj || {})) {
      if (uid === localUid || !data) continue;
      seen.add(uid);
      this.upsertPlayer(uid, data, localUid, serverNowMs);
    }
    for (const uid of this.remotes.keys()) {
      if (!seen.has(uid)) {
        this.removePlayer(uid);
      }
    }
  }

  triggerShotFlash(uid) {
    const entity = this.remotes.get(uid);
    if (entity) {
      entity.model.flashTimer = 0.065;
    }
  }

  update(dt, serverNowMs = Date.now()) {
    const smoothAlpha = 1 - Math.exp(-18 * dt);

    for (const entity of this.remotes.values()) {
      const alive = entity.data.alive !== false;
      const inTank = typeof entity.data.inTankId === 'number' && entity.data.inTankId >= 0;
      entity.model.root.visible = alive && !inTank;

      if (!entity.model.root.visible) continue;

      const sampled = entity.buffer.sample(serverNowMs);
      if (!sampled) continue;

      const prevX = entity.currentPos.x;
      const prevZ = entity.currentPos.z;

      entity.currentPos.x += (sampled.x - entity.currentPos.x) * smoothAlpha;
      entity.currentPos.y += (sampled.y - entity.currentPos.y) * smoothAlpha;
      entity.currentPos.z += (sampled.z - entity.currentPos.z) * smoothAlpha;

      entity.currentYaw = lerpAngle(entity.currentYaw, sampled.yaw, smoothAlpha);
      entity.currentPitch += (sampled.pitch - entity.currentPitch) * smoothAlpha;

      entity.model.root.position.copy(entity.currentPos);
      entity.model.root.rotation.y = entity.currentYaw;
      entity.model.root.updateMatrixWorld(false);

      const frameSpeed = dt > 0.0001
        ? Math.hypot(entity.currentPos.x - prevX, entity.currentPos.z - prevZ) / dt
        : 0;
      const netSpeed = Math.hypot(sampled.vx || 0, sampled.vz || 0);
      const animSpeed = Math.max(frameSpeed, netSpeed * 0.75);

      animateSoldierModel(
        entity.model,
        dt,
        animSpeed,
        entity.currentPitch,
        entity.model.flashTimer > 0,
        { crouchAmount: entity.data.crouch || 0 }
      );
    }
  }

  getHitMeshes() {
    const list = [];
    for (const entity of this.remotes.values()) {
      if (entity.model.root.visible) {
        entity.model.root.updateMatrixWorld(true);
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
