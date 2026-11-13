import * as THREE from 'three';
import { createSkyDome, createHarborWater } from './Shaders.js';
import { buildTerrainGeometry, getTerrainHeight } from './Terrain.js';

export const MAP_CONFIGS = {
  harbor: {
    id: 'harbor',
    name: 'Sunlit Cargo Harbor',
    sky: {
      zenithColor: 0x26547c,
      horizonColor: 0xf4a261,
      groundColor: 0x1b263b,
      sunColor: 0xffcf87,
      sunGlow: 1.25
    },
    fogColor: 0xd99b72,
    fogDensity: 0.0044,
    sunColor: 0xffd296,
    sunIntensity: 2.45,
    sunPos: [58, 38, 46],
    hemiSky: 0xfde2c4,
    hemiGround: 0x3f4c5c,
    hemiIntensity: 0.92,
    groundTex: 'harborDeck',
    wallTex: 'concrete',
    size: 96,
    spawns: [
      { x: -36, z: -36, yaw: -Math.PI * 0.75 },
      { x: 36, z: 36, yaw: Math.PI * 0.25 },
      { x: 36, z: -36, yaw: Math.PI * 0.75 },
      { x: -36, z: 36, yaw: -Math.PI * 0.25 },
      { x: 0, z: -39, yaw: Math.PI }
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
      { x: 0, y: 1.3, z: 0, w: 6.2, h: 2.6, d: 6.2, mat: 'concrete', stepable: true },
      { x: -4.6, y: 0.65, z: 0, w: 3.0, h: 1.3, d: 3.2, mat: 'crateWood', stepable: true },
      { x: 4.6, y: 0.65, z: 0, w: 3.0, h: 1.3, d: 3.2, mat: 'crateWood', stepable: true },
      { x: -13, y: 1.6, z: -14, w: 3.2, h: 3.2, d: 8.6, mat: 'containerBlue' },
      { x: 13, y: 1.6, z: 14, w: 3.2, h: 3.2, d: 8.6, mat: 'containerRust' },
      { x: -13, y: 1.6, z: 15, w: 8.6, h: 3.2, d: 3.2, mat: 'containerYellow' },
      { x: 13, y: 1.6, z: -15, w: 8.6, h: 3.2, d: 3.2, mat: 'containerOlive' },
      { x: -26, y: 1.6, z: -23, w: 8.2, h: 3.2, d: 3.2, mat: 'containerRust' },
      { x: -26, y: 4.8, z: -23, w: 8.2, h: 3.2, d: 3.2, mat: 'containerYellow' },
      { x: 26, y: 1.6, z: 23, w: 8.2, h: 3.2, d: 3.2, mat: 'containerBlue' },
      { x: 26, y: 4.8, z: 23, w: 8.2, h: 3.2, d: 3.2, mat: 'containerOlive' },
      { x: -7.5, y: 0.75, z: -7.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: 7.5, y: 0.75, z: 7.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: 7.5, y: 0.75, z: -7.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: -7.5, y: 0.75, z: 7.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: -21, y: 0.7, z: 10, w: 4.2, h: 1.4, d: 1.2, mat: 'concrete' },
      { x: 21, y: 0.7, z: -10, w: 4.2, h: 1.4, d: 1.2, mat: 'concrete' },
      { x: 24, y: 1.5, z: -22, w: 3.2, h: 3.0, d: 7.6, mat: 'containerYellow' },
      { x: -24, y: 1.5, z: 22, w: 3.2, h: 3.0, d: 7.6, mat: 'containerBlue' }
    ],
    buildings: [
      { type: 'harborOffice', x: 0, z: -31, yaw: 0 },
      { type: 'harborOffice', x: 0, z: 31, yaw: Math.PI },
      { type: 'guardTower', x: -33, z: 0, yaw: Math.PI / 2 },
      { type: 'guardTower', x: 33, z: 0, yaw: -Math.PI / 2 }
    ]
  },

  desert: {
    id: 'desert',
    name: 'Desert Dunes & Outpost',
    sky: {
      zenithColor: 0x2c6aa0,
      horizonColor: 0xf7d69e,
      groundColor: 0xc2a16b,
      sunColor: 0xfff0c2,
      sunGlow: 1.15
    },
    fogColor: 0xe6cfa4,
    fogDensity: 0.0046,
    sunColor: 0xffe6b3,
    sunIntensity: 2.35,
    sunPos: [52, 62, 34],
    hemiSky: 0xfff3d6,
    hemiGround: 0x9c7b4d,
    hemiIntensity: 0.9,
    groundTex: 'sandstone',
    wallTex: 'concrete',
    size: 96,
    spawns: [
      { x: -34, z: -34, yaw: -Math.PI * 0.75 },
      { x: 34, z: 34, yaw: Math.PI * 0.25 },
      { x: 34, z: -34, yaw: Math.PI * 0.75 },
      { x: -34, z: 34, yaw: -Math.PI * 0.25 },
      { x: 0, z: -38, yaw: Math.PI }
    ],
    tankPads: [
      { x: -22, z: 0, yaw: -Math.PI / 2 },
      { x: 22, z: 0, yaw: Math.PI / 2 }
    ],
    supplyPads: [
      { x: 0, z: 0 },
      { x: 0, z: 22 },
      { x: 0, z: -22 },
      { x: -20, z: 18 }
    ],
    blocks: [
      { x: 0, y: 1.2, z: 0, w: 6.5, h: 2.4, d: 6.5, mat: 'concrete', stepable: true },
      { x: -12, y: 1.5, z: -12, w: 3.2, h: 3.0, d: 8.0, mat: 'containerOlive' },
      { x: 12, y: 1.5, z: 12, w: 3.2, h: 3.0, d: 8.0, mat: 'containerRust' },
      { x: 14, y: 1.5, z: -14, w: 7.5, h: 3.0, d: 3.2, mat: 'containerYellow' },
      { x: -14, y: 1.5, z: 14, w: 7.5, h: 3.0, d: 3.2, mat: 'containerOlive' },
      { x: -7, y: 0.75, z: 7, w: 2.3, h: 1.5, d: 2.3, mat: 'crateWood', stepable: true },
      { x: 7, y: 0.75, z: -7, w: 2.3, h: 1.5, d: 2.3, mat: 'crateWood', stepable: true }
    ],
    buildings: [
      { type: 'desertHouse', x: 0, z: -28, yaw: 0 },
      { type: 'desertHouse', x: 0, z: 28, yaw: Math.PI },
      { type: 'desertFort', x: -28, z: -18, yaw: Math.PI / 2 },
      { type: 'desertFort', x: 28, z: 18, yaw: -Math.PI / 2 }
    ],
    palms: [
      [-10, -24], [10, -24], [-10, 24], [10, 24],
      [-26, 22], [26, -22], [-34, 8], [34, -8]
    ],
    cacti: [
      [-18, -5], [18, 5], [-8, 16], [8, -16],
      [-30, -30], [30, 30], [25, -30], [-25, 30]
    ]
  },

  snow: {
    id: 'snow',
    name: 'Alpine Snow Peaks',
    sky: {
      zenithColor: 0x1e3a5f,
      horizonColor: 0x9ec5e8,
      groundColor: 0x6b8299,
      sunColor: 0xe0f2fe,
      sunGlow: 1.05
    },
    fogColor: 0xaac7e0,
    fogDensity: 0.0052,
    sunColor: 0xdbeafe,
    sunIntensity: 2.15,
    sunPos: [44, 52, -38],
    hemiSky: 0xbae6fd,
    hemiGround: 0x475569,
    hemiIntensity: 0.92,
    groundTex: 'snow',
    wallTex: 'steel',
    size: 96,
    spawns: [
      { x: -34, z: -32, yaw: -Math.PI * 0.75 },
      { x: 34, z: 32, yaw: Math.PI * 0.25 },
      { x: 32, z: -32, yaw: Math.PI * 0.75 },
      { x: -32, z: 32, yaw: -Math.PI * 0.25 },
      { x: 0, z: -38, yaw: Math.PI }
    ],
    tankPads: [
      { x: 0, z: -24, yaw: 0 },
      { x: 0, z: 24, yaw: Math.PI }
    ],
    supplyPads: [
      { x: 0, z: 0 },
      { x: -20, z: 0 },
      { x: 20, z: 0 },
      { x: 0, z: 14 }
    ],
    blocks: [
      { x: 0, y: 1.2, z: 0, w: 6.2, h: 2.4, d: 6.2, mat: 'concrete', stepable: true },
      { x: -23, y: 1.6, z: -19, w: 7.2, h: 3.2, d: 3.2, mat: 'containerBlue' },
      { x: 23, y: 1.6, z: 19, w: 7.2, h: 3.2, d: 3.2, mat: 'containerBlue' },
      { x: -23, y: 1.6, z: 19, w: 3.2, h: 3.2, d: 7.2, mat: 'containerOlive' },
      { x: 23, y: 1.6, z: -19, w: 3.2, h: 3.2, d: 7.2, mat: 'containerOlive' },
      { x: -14, y: 0.75, z: -7, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: 14, y: 0.75, z: 7, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true }
    ],
    buildings: [
      { type: 'alpineCabin', x: -14, z: 0, yaw: Math.PI / 2 },
      { type: 'alpineCabin', x: 14, z: 0, yaw: -Math.PI / 2 },
      { type: 'radarBunker', x: 0, z: -14, yaw: 0 },
      { type: 'radarBunker', x: 0, z: 14, yaw: Math.PI }
    ],
    trees: [
      [-18, -30], [18, 30], [-30, 14], [30, -14],
      [-28, -8], [28, 8], [-12, 26], [12, -26],
      [-34, -22], [34, 22], [-22, 34], [22, -34]
    ]
  }
};

function addBlockWithCollider(group, worldMeshes, colliders, { x, y, z, w, h, d, mat, castShadows, stepable = false }) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadows;
  mesh.receiveShadow = castShadows;
  group.add(mesh);
  worldMeshes.push(mesh);
  colliders.push({
    minX: x - w / 2,
    maxX: x + w / 2,
    minY: y - h / 2 - 1.2,
    maxY: y + h / 2,
    minZ: z - d / 2,
    maxZ: z + d / 2,
    stepable
  });
  return mesh;
}

function addBuilding(group, worldMeshes, colliders, terrainHeightFn, spec, mats, castShadows) {
  const ty = terrainHeightFn(spec.x, spec.z);
  const { x, z } = spec;

  if (spec.type === 'desertHouse') {
    // Enterable Desert Sandstone Compound House with archway, roof parapet, awning & glowing windows
    const wallMat = mats.sandstoneWall;
    const trimMat = mats.darkWood;
    const awningMat = mats.awning;
    const windowMat = mats.warmGlow;

    // Back wall, Left & Right walls, Front pillars leaving wide doorway
    addBlockWithCollider(group, worldMeshes, colliders, { x, y: ty + 2.0, z: z - 3.6, w: 9.2, h: 4.0, d: 0.7, mat: wallMat, castShadows });
    addBlockWithCollider(group, worldMeshes, colliders, { x: x - 4.25, y: ty + 2.0, z, w: 0.7, h: 4.0, d: 7.2, mat: wallMat, castShadows });
    addBlockWithCollider(group, worldMeshes, colliders, { x: x + 4.25, y: ty + 2.0, z, w: 0.7, h: 4.0, d: 7.2, mat: wallMat, castShadows });
    addBlockWithCollider(group, worldMeshes, colliders, { x: x - 2.95, y: ty + 2.0, z: z + 3.6, w: 3.3, h: 4.0, d: 0.7, mat: wallMat, castShadows });
    addBlockWithCollider(group, worldMeshes, colliders, { x: x + 2.95, y: ty + 2.0, z: z + 3.6, w: 3.3, h: 4.0, d: 0.7, mat: wallMat, castShadows });
    // Lintel over doorway + Roof slab + Parapet trim
    addBlockWithCollider(group, worldMeshes, colliders, { x, y: ty + 3.55, z: z + 3.6, w: 2.8, h: 0.9, d: 0.7, mat: wallMat, castShadows });
    addBlockWithCollider(group, worldMeshes, colliders, { x, y: ty + 4.2, z, w: 9.8, h: 0.45, d: 8.2, mat: trimMat, castShadows, stepable: true });

    // Shade awning & warm interior light strip
    const awning = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.14, 1.8), awningMat);
    awning.position.set(x, ty + 3.1, z + 4.7);
    awning.rotation.x = 0.25;
    awning.castShadow = castShadows;
    const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.45), windowMat);
    lantern.position.set(x, ty + 3.7, z);
    group.add(awning, lantern);
  } else if (spec.type === 'desertFort') {
    const wallMat = mats.sandstoneWall;
    const trimMat = mats.darkWood;
    addBlockWithCollider(group, worldMeshes, colliders, { x, y: ty + 2.3, z, w: 5.4, h: 4.6, d: 5.4, mat: wallMat, castShadows });
    addBlockWithCollider(group, worldMeshes, colliders, { x, y: ty + 4.9, z: z - 2.5, w: 5.8, h: 0.8, d: 0.6, mat: trimMat, castShadows });
    addBlockWithCollider(group, worldMeshes, colliders, { x, y: ty + 4.9, z: z + 2.5, w: 5.8, h: 0.8, d: 0.6, mat: trimMat, castShadows });
  } else if (spec.type === 'harborOffice') {
    const wallMat = mats.concreteWall;
    const steelMat = mats.steelDark;
    const glassMat = mats.cyanGlass;
    // Two-story port terminal facade with glass control bridge
    addBlockWithCollider(group, worldMeshes, colliders, { x: x - 3.6, y: ty + 1.8, z, w: 4.2, h: 3.6, d: 2.4, mat: wallMat, castShadows });
    addBlockWithCollider(group, worldMeshes, colliders, { x: x + 3.6, y: ty + 1.8, z, w: 4.2, h: 3.6, d: 2.4, mat: wallMat, castShadows });
    addBlockWithCollider(group, worldMeshes, colliders, { x, y: ty + 3.85, z, w: 12.0, h: 0.5, d: 2.8, mat: steelMat, castShadows, stepable: true });
    const glass = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 0.3), glassMat);
    glass.position.set(x, ty + 2.2, z);
    group.add(glass);
  } else if (spec.type === 'guardTower') {
    const steelMat = mats.steelDark;
    const wallMat = mats.concreteWall;
    addBlockWithCollider(group, worldMeshes, colliders, { x, y: ty + 2.1, z, w: 2.8, h: 4.2, d: 7.4, mat: wallMat, castShadows });
    const booth = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 3.2), steelMat);
    booth.position.set(x, ty + 5.1, z);
    booth.castShadow = castShadows;
    group.add(booth);
  } else if (spec.type === 'alpineCabin') {
    const woodMat = mats.darkWood;
    const snowMat = mats.snowCap;
    const glowMat = mats.warmGlow;
    addBlockWithCollider(group, worldMeshes, colliders, { x, y: ty + 1.75, z, w: 3.4, h: 3.5, d: 8.6, mat: woodMat, castShadows });
    // Pitched snow-covered roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 2.1, 4), snowMat);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(0.75, 1, 1.65);
    roof.position.set(x, ty + 4.45, z);
    roof.castShadow = castShadows;
    // Glowing cabin windows
    const win1 = new THREE.Mesh(new THREE.BoxGeometry(3.52, 0.85, 1.4), glowMat);
    win1.position.set(x, ty + 2.1, z - 2.0);
    const win2 = new THREE.Mesh(new THREE.BoxGeometry(3.52, 0.85, 1.4), glowMat);
    win2.position.set(x, ty + 2.1, z + 2.0);
    group.add(roof, win1, win2);
  } else if (spec.type === 'radarBunker') {
    const wallMat = mats.concreteWall;
    const steelMat = mats.steelDark;
    addBlockWithCollider(group, worldMeshes, colliders, { x, y: ty + 1.6, z, w: 7.6, h: 3.2, d: 3.4, mat: wallMat, castShadows });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 2.4, 8), steelMat);
    mast.position.set(x, ty + 4.3, z);
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.95, 10, 8, 0, Math.PI), steelMat);
    dish.position.set(x, ty + 5.5, z);
    dish.rotation.x = -0.35;
    group.add(mast, dish);
    return dish; // animated rotating radar dish!
  }
  return null;
}

function addHarborCranesAndShips(group, castShadows) {
  const craneMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.45, metalness: 0.4 });
  const steelDark = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.5 });
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.7 });
  const shipDeckMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.65 });
  const containerBlue = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 });

  for (const xPos of [-38, 38]) {
    const legA = new THREE.Mesh(new THREE.BoxGeometry(1.4, 22, 1.4), craneMat);
    legA.position.set(xPos, 11, -18);
    legA.castShadow = castShadows;
    const legB = new THREE.Mesh(new THREE.BoxGeometry(1.4, 22, 1.4), craneMat);
    legB.position.set(xPos, 11, 18);
    legB.castShadow = castShadows;
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 46), craneMat);
    crossBeam.position.set(xPos, 21.5, 0);
    const trolley = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.4, 3.8), steelDark);
    trolley.position.set(xPos, 19.8, xPos < 0 ? -6 : 6);
    group.add(legA, legB, crossBeam, trolley);
  }

  // Anchored freighter ship out on the golden-hour harbor sea
  const ship = new THREE.Group();
  ship.position.set(-76, -0.6, 56);
  ship.rotation.y = 0.28;
  const hull = new THREE.Mesh(new THREE.BoxGeometry(14, 5.5, 48), hullMat);
  hull.position.set(0, 1.5, 0);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(13.2, 1.2, 46), shipDeckMat);
  deck.position.set(0, 4.5, 0);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(10, 7.5, 8), shipDeckMat);
  bridge.position.set(0, 8.5, -16);
  const cargo1 = new THREE.Mesh(new THREE.BoxGeometry(9.5, 3.8, 18), containerBlue);
  cargo1.position.set(0, 6.8, 6);
  ship.add(hull, deck, bridge, cargo1);
  group.add(ship);

  for (let i = -40; i <= 40; i += 16) {
    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.7, 10), steelDark);
    b1.position.set(i, 0.35, 47.2);
    const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.7, 10), steelDark);
    b2.position.set(47.2, 0.35, i);
    group.add(b1, b2);
  }

  return { mats: [craneMat, steelDark, hullMat, shipDeckMat, containerBlue], ship };
}

function addPalmTree(group, x, y, z, colliders, castShadows, trunkMat, frondMat) {
  const root = new THREE.Group();
  root.position.set(x, y, z);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, 4.8, 7), trunkMat);
  trunk.position.set(0, 2.4, 0);
  trunk.rotation.z = 0.08;
  trunk.castShadow = castShadows;
  root.add(trunk);

  const crown = new THREE.Group();
  crown.position.set(-0.35, 4.8, 0);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.6, 5), frondMat);
    frond.rotation.z = -1.15;
    frond.rotation.y = angle;
    frond.position.set(Math.cos(angle) * 1.1, -0.15, Math.sin(angle) * 1.1);
    frond.castShadow = castShadows;
    crown.add(frond);
  }
  root.add(crown);
  group.add(root);

  colliders.push({
    minX: x - 0.55,
    maxX: x + 0.55,
    minY: y,
    maxY: y + 4.8,
    minZ: z - 0.55,
    maxZ: z + 0.55
  });
  return crown;
}

function addCactus(group, x, y, z, colliders, castShadows, cactusMat) {
  const trunk = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 1.5, 4, 7), cactusMat);
  trunk.position.set(x, y + 0.95, z);
  trunk.castShadow = castShadows;
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.65, 4, 6), cactusMat);
  arm.position.set(x + 0.35, y + 1.15, z);
  arm.rotation.z = -0.5;
  group.add(trunk, arm);

  colliders.push({
    minX: x - 0.45,
    maxX: x + 0.45,
    minY: y,
    maxY: y + 2.0,
    minZ: z - 0.45,
    maxZ: z + 0.45
  });
}

function addPineTree(group, x, y, z, colliders, castShadows, trunkMat, leafMat, snowMat) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 2.2, 8), trunkMat);
  trunk.position.set(x, y + 1.1, z);
  trunk.castShadow = castShadows;

  const c1 = new THREE.Mesh(new THREE.ConeGeometry(2.15, 3.0, 9), leafMat);
  c1.position.set(x, y + 3.0, z);
  c1.castShadow = castShadows;
  const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.65, 2.6, 9), leafMat);
  c2.position.set(x, y + 4.7, z);
  c2.castShadow = castShadows;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.8, 9), snowMat);
  cap.position.set(x, y + 6.2, z);
  cap.castShadow = castShadows;

  group.add(trunk, c1, c2, cap);
  colliders.push({
    minX: x - 0.65,
    maxX: x + 0.65,
    minY: y,
    maxY: y + 4.2,
    minZ: z - 0.65,
    maxZ: z + 0.65
  });
}

function createSnowWeather(count = 420) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 90;
    positions[i * 3 + 1] = Math.random() * 24;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 90;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xf0f9ff,
    size: 0.24,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  return {
    points,
    update: (dt, elapsedSec) => {
      const arr = geo.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        arr[idx + 1] -= (3.6 + (i % 5) * 0.4) * dt;
        arr[idx] += Math.sin(elapsedSec + i) * 0.75 * dt;
        if (arr[idx + 1] < 0) {
          arr[idx + 1] = 24;
          arr[idx] = (Math.random() - 0.5) * 90;
          arr[idx + 2] = (Math.random() - 0.5) * 90;
        }
      }
      geo.attributes.position.needsUpdate = true;
    },
    dispose: () => {
      geo.dispose();
      mat.dispose();
    }
  };
}

export function buildArenaMap(scene, textureLib, mapId = 'harbor', quality = 'balanced') {
  const normalizedId = mapId === 'compound' ? 'harbor' : mapId === 'cargoyard' ? 'desert' : mapId === 'nightops' ? 'snow' : mapId;
  const cfg = MAP_CONFIGS[normalizedId] || MAP_CONFIGS.harbor;
  const anisotropy = quality === 'high' ? 4 : quality === 'balanced' ? 2 : 1;
  const castShadows = quality !== 'fast';

  const group = new THREE.Group();
  const colliders = [];
  const worldMeshes = [];
  const supplyCrates = [];
  const extraMaterials = [];
  const animatedCrowns = [];
  const animatedRadars = [];
  const terrainHeightFn = (x, z) => getTerrainHeight(cfg.id, x, z);

  scene.background = new THREE.Color(cfg.sky.horizonColor);
  scene.fog = new THREE.FogExp2(cfg.fogColor, cfg.fogDensity);

  const sunVec = new THREE.Vector3(...cfg.sunPos);
  const skyDome = createSkyDome({ ...cfg.sky, sunDir: sunVec });
  group.add(skyDome.mesh);

  let water = null;
  let harborShip = null;
  if (cfg.id === 'harbor') {
    water = createHarborWater(sunVec);
    group.add(water.mesh);
    const hProps = addHarborCranesAndShips(group, castShadows);
    extraMaterials.push(...hProps.mats);
    harborShip = hProps.ship;
  }

  let snowWeather = null;
  if (cfg.id === 'snow') {
    snowWeather = createSnowWeather(quality === 'fast' ? 220 : 420);
    group.add(snowWeather.points);
  }

  const hemi = new THREE.HemisphereLight(cfg.hemiSky, cfg.hemiGround, cfg.hemiIntensity);
  group.add(hemi);

  const sun = new THREE.DirectionalLight(cfg.sunColor, cfg.sunIntensity);
  sun.position.copy(sunVec);
  if (castShadows) {
    sun.castShadow = true;
    const mapSize = quality === 'high' ? 2048 : 1024;
    sun.shadow.mapSize.set(mapSize, mapSize);
    sun.shadow.camera.near = 12;
    sun.shadow.camera.far = 175;
    const d = 54;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0007;
  }
  group.add(sun);

  const matCache = new Map();
  const getMat = (kind, rx = 1, ry = 1) => {
    const key = `${kind}:${rx}:${ry}`;
    if (matCache.has(key)) return matCache.get(key);
    const tex = textureLib.getTextureSet(kind, rx, ry, anisotropy);
    const mat = new THREE.MeshStandardMaterial({
      map: tex.map,
      bumpMap: tex.bumpMap || null,
      bumpScale: tex.bumpMap ? 0.045 : 0,
      roughness: kind.startsWith('container') || kind === 'steel' ? 0.46 : 0.85,
      metalness: kind.startsWith('container') || kind === 'steel' ? 0.32 : 0.04
    });
    matCache.set(key, mat);
    return mat;
  };

  // Sculpted Terrain Mesh
  const terrainGeo = buildTerrainGeometry(cfg.id, cfg.size, cfg.id === 'harbor' ? 4 : 52);
  const groundMat = getMat(cfg.groundTex, 18, 18);
  const ground = new THREE.Mesh(terrainGeo, groundMat);
  ground.receiveShadow = castShadows;
  group.add(ground);
  worldMeshes.push(ground);

  if (cfg.id === 'harbor') {
    const quayMat = getMat('concrete', 16, 1);
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(cfg.size + 1.2, 3.2, cfg.size + 1.2), quayMat);
    skirt.position.set(0, -1.62, 0);
    group.add(skirt);
  }

  // Perimeter Boundary Walls
  const half = cfg.size / 2;
  const wallH = cfg.id === 'harbor' ? 1.8 : 6.0;
  const wallT = 1.8;
  const wallMat = getMat(cfg.wallTex, 14, 1);
  const perimeterSpecs = [
    { x: 0, z: -half - wallT / 2, w: cfg.size + wallT * 2, d: wallT },
    { x: 0, z: half + wallT / 2, w: cfg.size + wallT * 2, d: wallT },
    { x: -half - wallT / 2, z: 0, w: wallT, d: cfg.size },
    { x: half + wallT / 2, z: 0, w: wallT, d: cfg.size }
  ];

  for (const p of perimeterSpecs) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(p.w, wallH, p.d), wallMat);
    mesh.position.set(p.x, wallH / 2, p.z);
    mesh.receiveShadow = castShadows;
    group.add(mesh);
    worldMeshes.push(mesh);
    colliders.push({
      minX: p.x - p.w / 2,
      maxX: p.x + p.w / 2,
      minY: -2,
      maxY: 16,
      minZ: p.z - p.d / 2,
      maxZ: p.z + p.d / 2
    });
  }

  // Cover Blocks
  for (const b of cfg.blocks) {
    const baseTerrainY = terrainHeightFn(b.x, b.z);
    const centerY = baseTerrainY + b.y;
    const rx = Math.max(1, Math.round(Math.max(b.w, b.d) / 3));
    const ry = Math.max(1, Math.round(b.h / 2));
    const mat = getMat(b.mat, rx, ry);
    addBlockWithCollider(group, worldMeshes, colliders, {
      x: b.x, y: centerY, z: b.z, w: b.w, h: b.h, d: b.d, mat, castShadows, stepable: Boolean(b.stepable)
    });
  }

  // Architectural Buildings
  const buildingMats = {
    sandstoneWall: new THREE.MeshStandardMaterial({ color: 0xd6ba8b, roughness: 0.88 }),
    concreteWall: getMat('concrete', 3, 2),
    steelDark: new THREE.MeshStandardMaterial({ color: 0x26303d, roughness: 0.5, metalness: 0.45 }),
    darkWood: new THREE.MeshStandardMaterial({ color: 0x6b472a, roughness: 0.82 }),
    awning: new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.78 }),
    snowCap: new THREE.MeshStandardMaterial({ color: 0xe2ecf5, roughness: 0.85 }),
    cyanGlass: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.15, metalness: 0.8, opacity: 0.75, transparent: true }),
    warmGlow: new THREE.MeshBasicMaterial({ color: 0xfde68a })
  };
  extraMaterials.push(
    buildingMats.sandstoneWall,
    buildingMats.steelDark,
    buildingMats.darkWood,
    buildingMats.awning,
    buildingMats.snowCap,
    buildingMats.cyanGlass,
    buildingMats.warmGlow
  );

  for (const bSpec of cfg.buildings || []) {
    const radar = addBuilding(group, worldMeshes, colliders, terrainHeightFn, bSpec, buildingMats, castShadows);
    if (radar) animatedRadars.push(radar);
  }

  // Foliage & Plants
  if (cfg.palms) {
    const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x7c5836, roughness: 0.9 });
    const palmFrondMat = new THREE.MeshStandardMaterial({ color: 0x4d7c2f, roughness: 0.75 });
    extraMaterials.push(palmTrunkMat, palmFrondMat);
    for (const [px, pz] of cfg.palms) {
      animatedCrowns.push(addPalmTree(group, px, terrainHeightFn(px, pz), pz, colliders, castShadows, palmTrunkMat, palmFrondMat));
    }
  }

  if (cfg.cacti) {
    const cactusMat = new THREE.MeshStandardMaterial({ color: 0x3f6a34, roughness: 0.82 });
    extraMaterials.push(cactusMat);
    for (const [cx, cz] of cfg.cacti) {
      addCactus(group, cx, terrainHeightFn(cx, cz), cz, colliders, castShadows, cactusMat);
    }
  }

  if (cfg.trees) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x1e4631, roughness: 0.85 });
    extraMaterials.push(trunkMat, leafMat);
    for (const [tx, tz] of cfg.trees) {
      addPineTree(group, tx, terrainHeightFn(tx, tz), tz, colliders, castShadows, trunkMat, leafMat, buildingMats.snowCap);
    }
  }

  // Tank Pads
  const padMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.65, metalness: 0.25 });
  const hydratedTankPads = cfg.tankPads.map((tp) => {
    const ty = terrainHeightFn(tp.x, tp.z);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.14, 7.6), padMat);
    pad.position.set(tp.x, ty + 0.04, tp.z);
    pad.rotation.y = tp.yaw;
    pad.receiveShadow = castShadows;
    group.add(pad);
    return { ...tp, y: ty };
  });

  // Supply Crates
  const supplyMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x16a34a,
    emissiveIntensity: 0.65,
    roughness: 0.3
  });
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });

  cfg.supplyPads.forEach((sp, idx) => {
    const ty = terrainHeightFn(sp.x, sp.z);
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), supplyMat);
    crate.position.set(sp.x, ty + 0.85, sp.z);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.96, 18), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(sp.x, ty + 0.08, sp.z);
    group.add(crate, ring);
    supplyCrates.push({
      id: idx,
      mesh: crate,
      ring,
      baseY: ty + 0.85,
      x: sp.x,
      z: sp.z,
      active: true,
      respawnAt: 0
    });
  });

  const hydratedSpawns = cfg.spawns.map((sp) => ({
    ...sp,
    y: terrainHeightFn(sp.x, sp.z) + 1.7
  }));

  scene.add(group);

  return {
    config: { ...cfg, spawns: hydratedSpawns, tankPads: hydratedTankPads },
    group,
    colliders,
    worldMeshes,
    supplyCrates,
    terrainHeightFn,
    sun,
    update: (dt, elapsedSec) => {
      if (water) water.update(elapsedSec);
      if (snowWeather) snowWeather.update(dt, elapsedSec);
      if (harborShip) {
        harborShip.position.y = -0.6 + Math.sin(elapsedSec * 0.9) * 0.25;
        harborShip.rotation.z = Math.sin(elapsedSec * 0.7) * 0.015;
      }
      for (let i = 0; i < animatedCrowns.length; i++) {
        animatedCrowns[i].rotation.z = Math.sin(elapsedSec * 1.4 + i) * 0.06;
      }
      for (const r of animatedRadars) {
        r.rotation.y = elapsedSec * 1.1;
      }
    },
    dispose: () => {
      scene.remove(group);
      skyDome.dispose();
      if (water) water.dispose();
      if (snowWeather) snowWeather.dispose();
      group.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
      });
      for (const m of matCache.values()) m.dispose();
      for (const m of extraMaterials) m.dispose();
      padMat.dispose();
      supplyMat.dispose();
      ringMat.dispose();
    }
  };
}
