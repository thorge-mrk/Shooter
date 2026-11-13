import * as THREE from 'three';

export const MAP_CONFIGS = {
  compound: {
    id: 'compound',
    name: 'Sunlit Military Compound',
    skyColor: 0x8ec5ea,
    fogColor: 0xb8d4e8,
    fogDensity: 0.0055,
    sunColor: 0xfff5e0,
    sunIntensity: 2.2,
    sunPos: [48, 72, 34],
    hemiSky: 0xdbeafe,
    hemiGround: 0x8b7355,
    hemiIntensity: 0.85,
    groundTex: 'sandstone',
    wallTex: 'concrete',
    size: 96,
    spawns: [
      { x: -34, y: 1.7, z: -34, yaw: -Math.PI * 0.75 },
      { x: 34, y: 1.7, z: 34, yaw: Math.PI * 0.25 },
      { x: 34, y: 1.7, z: -34, yaw: Math.PI * 0.75 },
      { x: -34, y: 1.7, z: 34, yaw: -Math.PI * 0.25 },
      { x: 0, y: 1.7, z: -38, yaw: Math.PI }
    ],
    tankPads: [
      { x: -24, z: 0, yaw: -Math.PI / 2 },
      { x: 24, z: 0, yaw: Math.PI / 2 }
    ],
    supplyPads: [
      { x: 0, z: 0 },
      { x: 0, z: 22 },
      { x: 0, z: -22 },
      { x: -16, z: -18 }
    ],
    blocks: [
      // Central tactical monument & sniper tower deck
      { x: 0, y: 1.4, z: 0, w: 6, h: 2.8, d: 6, mat: 'concrete', stepable: true },
      { x: -4.5, y: 0.7, z: 0, w: 3.2, h: 1.4, d: 3.2, mat: 'concrete', stepable: true },
      { x: 4.5, y: 0.7, z: 0, w: 3.2, h: 1.4, d: 3.2, mat: 'concrete', stepable: true },

      // Shipping container lanes (wide tank lanes between them)
      { x: -13, y: 1.6, z: -14, w: 3.2, h: 3.2, d: 8.5, mat: 'containerBlue' },
      { x: 13, y: 1.6, z: 14, w: 3.2, h: 3.2, d: 8.5, mat: 'containerRust' },
      { x: -13, y: 1.6, z: 15, w: 8.5, h: 3.2, d: 3.2, mat: 'containerOlive' },
      { x: 13, y: 1.6, z: -15, w: 8.5, h: 3.2, d: 3.2, mat: 'containerBlue' },

      // Stacked double container cover
      { x: -25, y: 1.6, z: -22, w: 7.5, h: 3.2, d: 3.2, mat: 'containerRust' },
      { x: -25, y: 4.8, z: -22, w: 7.5, h: 3.2, d: 3.2, mat: 'containerOlive' },
      { x: 25, y: 1.6, z: 22, w: 7.5, h: 3.2, d: 3.2, mat: 'containerOlive' },
      { x: 25, y: 4.8, z: 22, w: 7.5, h: 3.2, d: 3.2, mat: 'containerBlue' },

      // Courtyard concrete walls & arches
      { x: 0, y: 1.8, z: -28, w: 12, h: 3.6, d: 1.8, mat: 'concrete' },
      { x: 0, y: 1.8, z: 28, w: 12, h: 3.6, d: 1.8, mat: 'concrete' },
      { x: -32, y: 1.8, z: 0, w: 1.8, h: 3.6, d: 12, mat: 'concrete' },
      { x: 32, y: 1.8, z: 0, w: 1.8, h: 3.6, d: 12, mat: 'concrete' },

      // Low tactical Jersey barriers & wooden crates for head-glitch/peek battles
      { x: -7, y: 0.75, z: -7, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: 7, y: 0.75, z: 7, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: 7, y: 0.75, z: -7, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: -7, y: 0.75, z: 7, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },

      { x: -20, y: 0.7, z: 9, w: 4, h: 1.4, d: 1.2, mat: 'concrete' },
      { x: 20, y: 0.7, z: -9, w: 4, h: 1.4, d: 1.2, mat: 'concrete' },
      { x: 24, y: 0.85, z: -22, w: 2.2, h: 1.7, d: 2.2, mat: 'crateWood' },
      { x: -24, y: 0.85, z: 22, w: 2.2, h: 1.7, d: 2.2, mat: 'crateWood' }
    ]
  },

  cargoyard: {
    id: 'cargoyard',
    name: 'Industrial Cargo Yard',
    skyColor: 0xd9a773,
    fogColor: 0xc29b78,
    fogDensity: 0.006,
    sunColor: 0xffd2a1,
    sunIntensity: 2.1,
    sunPos: [-50, 45, 38],
    hemiSky: 0xfde68a,
    hemiGround: 0x334155,
    hemiIntensity: 0.8,
    groundTex: 'asphalt',
    wallTex: 'steel',
    size: 96,
    spawns: [
      { x: -36, y: 1.7, z: 0, yaw: -Math.PI / 2 },
      { x: 36, y: 1.7, z: 0, yaw: Math.PI / 2 },
      { x: 0, y: 1.7, z: -36, yaw: Math.PI },
      { x: 0, y: 1.7, z: 36, yaw: 0 },
      { x: -28, y: 1.7, z: -28, yaw: -Math.PI * 0.75 }
    ],
    tankPads: [
      { x: -18, z: -24, yaw: 0 },
      { x: 18, z: 24, yaw: Math.PI }
    ],
    supplyPads: [
      { x: 0, z: 0 },
      { x: -22, z: 16 },
      { x: 22, z: -16 },
      { x: 0, z: -26 }
    ],
    blocks: [
      { x: 0, y: 1.6, z: 0, w: 8, h: 3.2, d: 3.2, mat: 'containerRust' },
      { x: -10, y: 1.6, z: -10, w: 3.2, h: 3.2, d: 9, mat: 'containerBlue' },
      { x: 10, y: 1.6, z: 10, w: 3.2, h: 3.2, d: 9, mat: 'containerBlue' },
      { x: 12, y: 1.6, z: -12, w: 9, h: 3.2, d: 3.2, mat: 'containerOlive' },
      { x: -12, y: 1.6, z: 12, w: 9, h: 3.2, d: 3.2, mat: 'containerOlive' },
      { x: -24, y: 1.8, z: 0, w: 3.5, h: 3.6, d: 10, mat: 'steel' },
      { x: 24, y: 1.8, z: 0, w: 3.5, h: 3.6, d: 10, mat: 'steel' },
      { x: 0, y: 0.85, z: 16, w: 2.4, h: 1.7, d: 2.4, mat: 'crateWood', stepable: true },
      { x: 0, y: 0.85, z: -16, w: 2.4, h: 1.7, d: 2.4, mat: 'crateWood', stepable: true },
      { x: -28, y: 1.6, z: 22, w: 8, h: 3.2, d: 3.2, mat: 'containerRust' },
      { x: 28, y: 1.6, z: -22, w: 8, h: 3.2, d: 3.2, mat: 'containerRust' }
    ]
  },

  nightops: {
    id: 'nightops',
    name: 'Alpine Night Ops Outpost',
    skyColor: 0x0f172a,
    fogColor: 0x162238,
    fogDensity: 0.007,
    sunColor: 0x93c5fd,
    sunIntensity: 1.5,
    sunPos: [36, 58, -32],
    hemiSky: 0x60a5fa,
    hemiGround: 0x334155,
    hemiIntensity: 0.78,
    groundTex: 'snow',
    wallTex: 'steel',
    size: 96,
    spawns: [
      { x: -34, y: 1.7, z: -30, yaw: -Math.PI * 0.75 },
      { x: 34, y: 1.7, z: 30, yaw: Math.PI * 0.25 },
      { x: 32, y: 1.7, z: -32, yaw: Math.PI * 0.75 },
      { x: -32, y: 1.7, z: 32, yaw: -Math.PI * 0.25 },
      { x: 0, y: 1.7, z: 0, yaw: 0 }
    ],
    tankPads: [
      { x: 0, z: -28, yaw: 0 },
      { x: 0, z: 28, yaw: Math.PI }
    ],
    supplyPads: [
      { x: -18, z: 0 },
      { x: 18, z: 0 },
      { x: 0, z: 14 },
      { x: 0, z: -14 }
    ],
    blocks: [
      { x: -8, y: 1.8, z: 0, w: 2.2, h: 3.6, d: 10, mat: 'concrete' },
      { x: 8, y: 1.8, z: 0, w: 2.2, h: 3.6, d: 10, mat: 'concrete' },
      { x: 0, y: 1.6, z: -14, w: 8, h: 3.2, d: 3, mat: 'steel' },
      { x: 0, y: 1.6, z: 14, w: 8, h: 3.2, d: 3, mat: 'steel' },
      { x: -22, y: 1.6, z: -18, w: 7, h: 3.2, d: 3.2, mat: 'containerBlue' },
      { x: 22, y: 1.6, z: 18, w: 7, h: 3.2, d: 3.2, mat: 'containerBlue' },
      { x: -22, y: 1.6, z: 18, w: 3.2, h: 3.2, d: 7, mat: 'containerOlive' },
      { x: 22, y: 1.6, z: -18, w: 3.2, h: 3.2, d: 7, mat: 'containerOlive' },
      { x: -14, y: 0.75, z: -7, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood' },
      { x: 14, y: 0.75, z: 7, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood' }
    ]
  }
};

export function buildArenaMap(scene, textureLib, mapId = 'compound', quality = 'balanced') {
  const cfg = MAP_CONFIGS[mapId] || MAP_CONFIGS.compound;
  const anisotropy = quality === 'high' ? 4 : quality === 'balanced' ? 2 : 1;
  const castShadows = quality !== 'fast';

  const group = new THREE.Group();
  const colliders = [];
  const worldMeshes = [];
  const supplyCrates = [];

  scene.background = new THREE.Color(cfg.skyColor);
  scene.fog = new THREE.FogExp2(cfg.fogColor, cfg.fogDensity);

  // Lighting: 1 Hemisphere + 1 tight Directional Sun for crisp shadows & fast GPU
  const hemi = new THREE.HemisphereLight(cfg.hemiSky, cfg.hemiGround, cfg.hemiIntensity);
  group.add(hemi);

  const sun = new THREE.DirectionalLight(cfg.sunColor, cfg.sunIntensity);
  sun.position.set(...cfg.sunPos);
  if (castShadows) {
    sun.castShadow = true;
    const mapSize = quality === 'high' ? 2048 : 1024;
    sun.shadow.mapSize.set(mapSize, mapSize);
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 165;
    const d = 52;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0008;
  }
  group.add(sun);

  // Material factory (reuses materials cleanly across all meshes)
  const matCache = new Map();
  const getMat = (kind, rx = 1, ry = 1) => {
    const key = `${kind}:${rx}:${ry}`;
    if (matCache.has(key)) return matCache.get(key);
    const tex = textureLib.getTextureSet(kind, rx, ry, anisotropy);
    const mat = new THREE.MeshStandardMaterial({
      map: tex.map,
      bumpMap: tex.bumpMap || null,
      bumpScale: tex.bumpMap ? 0.04 : 0,
      roughness: kind.startsWith('container') || kind === 'steel' ? 0.52 : 0.86,
      metalness: kind.startsWith('container') || kind === 'steel' ? 0.35 : 0.05
    });
    matCache.set(key, mat);
    return mat;
  };

  // Ground Plane
  const half = cfg.size / 2;
  const groundMat = getMat(cfg.groundTex, 18, 18);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(cfg.size, cfg.size), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = castShadows;
  group.add(ground);
  worldMeshes.push(ground);

  // Perimeter Boundary Walls
  const wallH = 6.5;
  const wallT = 2.0;
  const wallMat = getMat(cfg.wallTex, 12, 2);
  const perimeterSpecs = [
    { x: 0, y: wallH / 2, z: -half - wallT / 2, w: cfg.size + wallT * 2, h: wallH, d: wallT },
    { x: 0, y: wallH / 2, z: half + wallT / 2, w: cfg.size + wallT * 2, h: wallH, d: wallT },
    { x: -half - wallT / 2, y: wallH / 2, z: 0, w: wallT, h: wallH, d: cfg.size },
    { x: half + wallT / 2, y: wallH / 2, z: 0, w: wallT, h: wallH, d: cfg.size }
  ];

  for (const p of perimeterSpecs) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, p.d), wallMat);
    mesh.position.set(p.x, p.y, p.z);
    mesh.receiveShadow = castShadows;
    group.add(mesh);
    worldMeshes.push(mesh);
    colliders.push({
      minX: p.x - p.w / 2,
      maxX: p.x + p.w / 2,
      minY: 0,
      maxY: p.h,
      minZ: p.z - p.d / 2,
      maxZ: p.z + p.d / 2
    });
  }

  // Arena Cover Blocks
  for (const b of cfg.blocks) {
    const rx = Math.max(1, Math.round(Math.max(b.w, b.d) / 3));
    const ry = Math.max(1, Math.round(b.h / 2));
    const mat = getMat(b.mat, rx, ry);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat);
    mesh.position.set(b.x, b.y, b.z);
    mesh.castShadow = castShadows;
    mesh.receiveShadow = castShadows;
    group.add(mesh);
    worldMeshes.push(mesh);

    colliders.push({
      minX: b.x - b.w / 2,
      maxX: b.x + b.w / 2,
      minY: b.y - b.h / 2,
      maxY: b.y + b.h / 2,
      minZ: b.z - b.d / 2,
      maxZ: b.z + b.d / 2,
      stepable: Boolean(b.stepable)
    });
  }

  // Tank Spawn Pad Markings
  const padMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7, metalness: 0.2 });
  for (const tp of cfg.tankPads) {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.06, 7.6), padMat);
    pad.position.set(tp.x, 0.03, tp.z);
    pad.rotation.y = tp.yaw;
    pad.receiveShadow = castShadows;
    group.add(pad);
  }

  // Supply Crates (HP + Ammo + Frag refill)
  const supplyMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x15803d,
    emissiveIntensity: 0.45,
    roughness: 0.35
  });
  cfg.supplyPads.forEach((sp, idx) => {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.95), supplyMat);
    crate.position.set(sp.x, 0.75, sp.z);
    group.add(crate);
    supplyCrates.push({
      id: idx,
      mesh: crate,
      x: sp.x,
      z: sp.z,
      active: true,
      respawnAt: 0
    });
  });

  scene.add(group);

  return {
    config: cfg,
    group,
    colliders,
    worldMeshes,
    supplyCrates,
    sun,
    dispose: () => {
      scene.remove(group);
      group.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
      });
      for (const m of matCache.values()) m.dispose();
      padMat.dispose();
      supplyMat.dispose();
    }
  };
}
