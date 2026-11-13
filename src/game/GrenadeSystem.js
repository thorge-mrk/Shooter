import * as THREE from 'three';
import { bounceSphereAgainstColliders } from './Physics.js';

export class GrenadeSystem {
  constructor(scene, soundEngine) {
    this.scene = scene;
    this.soundEngine = soundEngine;
    this.grenades = [];
    this.bodyGeo = new THREE.SphereGeometry(0.14, 10, 8);
    this.bodyMat = new THREE.MeshStandardMaterial({ color: 0x4b5d43, roughness: 0.6, metalness: 0.25 });
    this.ledGeo = new THREE.SphereGeometry(0.05, 6, 6);
    this.ledMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  }

  throwGrenade(origin, dir, ownerId, isLocal) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(this.bodyGeo, this.bodyMat);
    const led = new THREE.Mesh(this.ledGeo, this.ledMat);
    led.position.y = 0.14;
    group.add(body, led);
    group.position.copy(origin);
    this.scene.add(group);

    const vel = dir.clone().multiplyScalar(21.5);
    vel.y += 4.2;

    this.grenades.push({
      mesh: group,
      led,
      pos: origin.clone(),
      vel,
      ownerId,
      isLocal,
      fuse: 2.15,
      elapsed: 0
    });
  }

  update(dt, colliders, onExplode, terrainHeightFn = 0) {
    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i];
      g.fuse -= dt;
      g.elapsed += dt;

      g.vel.y -= 18.0 * dt;
      g.pos.x += g.vel.x * dt;
      g.pos.y += g.vel.y * dt;
      g.pos.z += g.vel.z * dt;

      const bounced = bounceSphereAgainstColliders(g.pos, g.vel, 0.16, colliders, 0.44, terrainHeightFn);
      if (bounced) {
        this.soundEngine?.playGrenadeBounce();
      }

      g.mesh.position.copy(g.pos);
      g.mesh.rotation.x += dt * 7;
      g.mesh.rotation.z += dt * 5;
      g.led.visible = Math.floor(g.elapsed * 10) % 2 === 0;

      if (g.fuse <= 0) {
        this.scene.remove(g.mesh);
        this.grenades.splice(i, 1);
        if (onExplode) {
          onExplode(g.pos.clone(), g.ownerId, g.isLocal);
        }
      }
    }
  }

  clear() {
    for (const g of this.grenades) {
      this.scene.remove(g.mesh);
    }
    this.grenades = [];
  }

  dispose() {
    this.clear();
    this.bodyGeo.dispose();
    this.bodyMat.dispose();
    this.ledGeo.dispose();
    this.ledMat.dispose();
  }
}
