import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.tracers = [];
    this.particles = [];
    this.rings = [];
    this.maxParticles = 140;

    this.tracerGeo = new THREE.CylinderGeometry(0.018, 0.006, 1, 5);
    this.tracerGeo.rotateX(Math.PI / 2);
    this.tracerMat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.9 });

    this.particleGeo = new THREE.DodecahedronGeometry(0.11, 0);
    this.ringGeo = new THREE.RingGeometry(0.45, 0.72, 20);
    this.ringGeo.rotateX(-Math.PI / 2);

    this.sparkMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    this.smokeMat = new THREE.MeshBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.72 });
    this.fireMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.92 });
    this.ringMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    this.upVec = new THREE.Vector3(0, 1, 0);
  }

  spawnTracer(start, end) {
    const delta = new THREE.Vector3().subVectors(end, start);
    const totalLen = delta.length();
    if (totalLen < 0.4) return;
    const dir = delta.clone().divideScalar(totalLen);

    // Sleek glowing tapered tracer streak spanning the shot
    const beamLen = Math.min(totalLen, 36);
    const mesh = new THREE.Mesh(this.tracerGeo, this.tracerMat);
    const mid = start.clone().addScaledVector(dir, Math.min(totalLen * 0.5, beamLen * 0.55));
    mesh.position.copy(mid);
    mesh.lookAt(end);
    mesh.scale.set(1, 1, beamLen);
    this.scene.add(mesh);

    this.tracers.push({ mesh, life: 0.075, maxLife: 0.075 });
  }

  spawnImpact(pos, normal, count = 5) {
    for (let i = 0; i < count; i++) {
      this._spawnParticle(pos, {
        vx: (normal?.x || 0) * 3.5 + (Math.random() - 0.5) * 5.2,
        vy: (normal?.y || 0.6) * 3.5 + Math.random() * 4.2,
        vz: (normal?.z || 0) * 3.5 + (Math.random() - 0.5) * 5.2,
        scale: 0.45 + Math.random() * 0.55,
        life: 0.24 + Math.random() * 0.18,
        mat: i === 0 ? this.smokeMat : this.sparkMat,
        gravity: 14
      });
    }
  }

  spawnExplosion(pos, radius = 6) {
    const count = Math.min(28, Math.round(radius * 3.4));
    for (let i = 0; i < count; i++) {
      const isFire = i % 2 === 0;
      const speed = (0.4 + Math.random() * 0.85) * radius * 2.1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.55;
      this._spawnParticle(pos, {
        vx: Math.cos(theta) * Math.cos(phi) * speed,
        vy: Math.sin(phi) * speed + 2.8,
        vz: Math.sin(theta) * Math.cos(phi) * speed,
        scale: isFire ? 2.4 + Math.random() * 2.4 : 3.2 + Math.random() * 2.6,
        life: isFire ? 0.34 + Math.random() * 0.22 : 0.72 + Math.random() * 0.45,
        mat: isFire ? this.fireMat : this.smokeMat,
        gravity: isFire ? 8.5 : -1.8
      });
    }

    const ring = new THREE.Mesh(this.ringGeo, this.ringMat);
    ring.position.set(pos.x, Math.max(0.1, pos.y), pos.z);
    this.scene.add(ring);
    this.rings.push({ mesh: ring, life: 0.28, maxLife: 0.28, targetRadius: radius * 1.15 });
  }

  _spawnParticle(pos, cfg) {
    if (this.particles.length >= this.maxParticles) {
      const oldest = this.particles.shift();
      this.scene.remove(oldest.mesh);
    }
    const mesh = new THREE.Mesh(this.particleGeo, cfg.mat);
    mesh.position.copy(pos);
    mesh.scale.setScalar(cfg.scale);
    this.scene.add(mesh);
    this.particles.push({
      mesh,
      vx: cfg.vx,
      vy: cfg.vy,
      vz: cfg.vz,
      life: cfg.life,
      maxLife: cfg.life,
      baseScale: cfg.scale,
      gravity: cfg.gravity
    });
  }

  update(dt, terrainHeightFn = null) {
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.scene.remove(t.mesh);
        this.tracers.splice(i, 1);
      } else {
        const s = t.life / t.maxLife;
        t.mesh.scale.x = s;
        t.mesh.scale.y = s;
      }
    }

    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      if (r.life <= 0) {
        this.scene.remove(r.mesh);
        this.rings.splice(i, 1);
      } else {
        const progress = 1 - r.life / r.maxLife;
        const scale = 0.5 + progress * r.targetRadius;
        r.mesh.scale.setScalar(scale);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.vy -= p.gravity * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      const floor = terrainHeightFn ? terrainHeightFn(p.mesh.position.x, p.mesh.position.z) + 0.08 : 0.08;
      if (p.mesh.position.y < floor) {
        p.mesh.position.y = floor;
        p.vy *= -0.3;
      }
      const ratio = p.life / p.maxLife;
      p.mesh.scale.setScalar(Math.max(0.05, p.baseScale * ratio));
    }
  }

  dispose() {
    for (const t of this.tracers) this.scene.remove(t.mesh);
    for (const r of this.rings) this.scene.remove(r.mesh);
    for (const p of this.particles) this.scene.remove(p.mesh);
    this.tracers = [];
    this.rings = [];
    this.particles = [];
    this.tracerGeo.dispose();
    this.particleGeo.dispose();
    this.ringGeo.dispose();
    this.sparkMat.dispose();
    this.smokeMat.dispose();
    this.fireMat.dispose();
    this.ringMat.dispose();
    this.tracerMat.dispose();
  }
}
