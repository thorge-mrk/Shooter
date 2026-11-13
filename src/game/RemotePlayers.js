import * as THREE from 'three';
import { buildSoldierMesh } from './SoldierMesh.js';

const TEAM_COLORS = [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b, 0xa855f7];

export class RemotePlayerManager {
  constructor(scene, castShadows = true) {
    this.scene = scene;
    this.castShadows = castShadows;
    this.remotes = new Map();
  }

  syncSnapshot(playersObj, localUid) {
    const seen = new Set();
    const entries = Object.entries(playersObj || {});

    entries.forEach(([uid, data], index) => {
      if (uid === localUid || !data) return;
      seen.add(uid);

      let entity = this.remotes.get(uid);
      if (!entity) {
        const color = TEAM_COLORS[index % TEAM_COLORS.length];
        const model = buildSoldierMesh(uid, data.name || 'Operator', color, this.castShadows);
        this.scene.add(model.root);
        entity = {
          uid,
          data: { ...data },
          model,
          targetPos: new THREE.Vector3(data.x || 0, (data.y || 1.7) - 1.7, data.z || 0),
          currentPos: new THREE.Vector3(data.x || 0, (data.y || 1.7) - 1.7, data.z || 0),
          targetYaw: data.yaw || 0,
          targetPitch: data.pitch || 0
        };
        this.remotes.set(uid, entity);
      } else {
        entity.data = { ...data };
        entity.targetPos.set(data.x || 0, (data.y || 1.7) - 1.7, data.z || 0);
        entity.targetYaw = data.yaw || 0;
        entity.targetPitch = data.pitch || 0;
      }
    });

    for (const [uid, entity] of this.remotes.entries()) {
      if (!seen.has(uid)) {
        this._removeEntity(entity);
        this.remotes.delete(uid);
      }
    }
  }

  update(dt) {
    const lerpAlpha = Math.min(1, dt * 14);
    for (const entity of this.remotes.values()) {
      const alive = entity.data.alive !== false;
      const inTank = typeof entity.data.inTankId === 'number' && entity.data.inTankId >= 0;
      entity.model.root.visible = alive && !inTank;

      if (!entity.model.root.visible) continue;

      entity.currentPos.lerp(entity.targetPos, lerpAlpha);
      entity.model.root.position.copy(entity.currentPos);
      entity.model.root.rotation.y = entity.targetYaw;
      entity.model.armPivot.rotation.x = entity.targetPitch;
      entity.model.headGroup.rotation.x = entity.targetPitch * 0.65;
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
