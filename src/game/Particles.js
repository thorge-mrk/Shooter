import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.tracers = [];
    this.particles = [];
    this.maxParticles = 140;

    this.particleGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    this.sparkMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    this.smokeMat = new THREE.MeshBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.75 });
    this.fireMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.9 });
    this.tracerMat = new THREE.LineBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.85 });
  }

  spawnTracer(start, end) {
    const geom = new THREE.BufferGeometry().setFromPoints([start.clone(), end.clone()]);
    const line = new THREE.Line(geom, this.tracerMat);
    this.scene.add(line);
    this.tracers.push({ line, geom, life: 0.065 });
  }

  spawnImpact(pos, normal, count = 5) {
    for (let i = 0; i < count; i++) {
      this._spawnBoxParticle(pos, {
        vx: (normal?.x || 0) * 3 + (Math.random() - 0.5) * 5,
        vy: (normal?.y || 0.5) * 3 + Math.random() * 4,
        vz: (normal?.z || 0) * 3 + (Math.random() - 0.5) * 5,
        scale: 0.4 + Math.random() * 0.5,
        life: 0.25 + Math.random() * 0.2,
        mat: this.sparkMat,
        gravity: 14
      });
    }
  }

  spawnExplosion(pos, radius = 6) {
    const count = Math.min(28, Math.round(radius * 3.5));
    for (let i = 0; i < count; i++) {
      const isFire = i % 2 === 0;
      const speed = (0.4 + Math.random() * 0.8) * radius * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.55;
      this._spawnBoxParticle(pos, {
        vx: Math.cos(theta) * Math.cos(phi) * speed,
        vy: Math.sin(phi) * speed + 2.5,
        vz: Math.sin(theta) * Math.cos(phi) * speed,
        scale: isFire ? 2.2 + Math.random() * 2.2 : 2.8 + Math.random() * 2.5,
        life: isFire ? 0.35 + Math.random() * 0.25 : 0.65 + Math.random() * 0.45,
        mat: isFire ? this.fireMat : this.smokeMat,
        gravity: isFire ? 8 : -1.5
      });
    }
  }

  _spawnBoxParticle(pos, cfg) {
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

  update(dt) {
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.scene.remove(t.line);
        t.geom.dispose();
        this.tracers.splice(i, 1);
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
      if (p.mesh.position.y < 0.08) {
        p.mesh.position.y = 0.08;
        p.vy *= -0.3;
      }
      const ratio = p.life / p.maxLife;
      p.mesh.scale.setScalar(Math.max(0.05, p.baseScale * ratio));
    }
  }

  dispose() {
    for (const t of this.tracers) {
      this.scene.remove(t.line);
      t.geom.dispose();
    }
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
    }
    this.tracers = [];
    this.particles = [];
    this.particleGeo.dispose();
    this.sparkMat.dispose();
    this.smokeMat.dispose();
    this.fireMat.dispose();
    this.tracerMat.dispose();
  }
}
