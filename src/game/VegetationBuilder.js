import * as THREE from 'three';
import { createBeveledBox, createFlutedCylinder } from './GeometryUtils.js';
import { createQualityMaterial } from './Textures.js';
import { applyWindSwayShader } from './Shaders.js';

function seededRand(seed = 1337) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Creates a sculpted organic rock geometry by perturbing an icosahedron/dodecahedron
 * with deterministic multi-frequency rocky facets.
 */
function createSculptedRockGeometry(radius = 1.0, detail = 1, seed = 42, scaleY = 0.78) {
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n1 = Math.sin(x * 2.7 + seed) * Math.cos(y * 2.3 - seed * 0.5) * Math.sin(z * 2.9 + seed * 0.3);
    const n2 = Math.cos((x + z) * 4.1 + seed * 1.7) * 0.12;
    const factor = 1.0 + n1 * 0.18 + n2;
    pos.setXYZ(
      i,
      x * factor,
      y * factor * scaleY,
      z * factor
    );
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a multi-blade grass tuft geometry with vertices starting at y = 0 and rising to y = 0.68
 * so GPU wind sway bends the upper blades naturally.
 */
function createGrassTuftGeometry() {
  const bladeCount = 5;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let b = 0; b < bladeCount; b++) {
    const angle = (b / bladeCount) * Math.PI * 2 + (b % 2) * 0.28;
    const tilt = 0.14 + (b % 3) * 0.06;
    const offsetR = 0.05 + (b % 2) * 0.04;
    const ox = Math.cos(angle) * offsetR;
    const oz = Math.sin(angle) * offsetR;
    const nx = -Math.sin(angle);
    const nz = Math.cos(angle);
    const rx = Math.cos(angle);
    const rz = Math.sin(angle);

    const w0 = 0.065;
    const w1 = 0.042;
    const hMid = 0.32 + (b % 2) * 0.05;
    const hTop = 0.64 + (b % 3) * 0.07;

    const baseIdx = positions.length / 3;
    // 0: bottom left, 1: bottom right, 2: mid left, 3: mid right, 4: tip
    positions.push(
      ox - nx * w0, 0.0, oz - nz * w0,
      ox + nx * w0, 0.0, oz + nz * w0,
      ox - nx * w1 + rx * tilt * 0.45, hMid, oz - nz * w1 + rz * tilt * 0.45,
      ox + nx * w1 + rx * tilt * 0.45, hMid, oz + nz * w1 + rz * tilt * 0.45,
      ox + rx * tilt, hTop, oz + rz * tilt
    );

    for (let k = 0; k < 5; k++) {
      normals.push(rx * 0.25, 0.94, rz * 0.25);
    }
    uvs.push(0, 0, 1, 0, 0, 0.5, 1, 0.5, 0.5, 1);

    indices.push(
      baseIdx + 0, baseIdx + 1, baseIdx + 2,
      baseIdx + 1, baseIdx + 3, baseIdx + 2,
      baseIdx + 2, baseIdx + 3, baseIdx + 4
    );
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a multi-frond woodland/coastal fern rosette geometry with local y in [0, 0.72].
 */
function createFernRosetteGeometry() {
  const frondCount = 6;
  const positions = [];
  const normals = [];
  const indices = [];

  for (let i = 0; i < frondCount; i++) {
    const angle = (i / frondCount) * Math.PI * 2;
    const rx = Math.cos(angle);
    const rz = Math.sin(angle);
    const nx = -rz;
    const nz = rx;

    const baseIdx = positions.length / 3;
    positions.push(
      rx * 0.05 - nx * 0.06, 0.04, rz * 0.05 - nz * 0.06,
      rx * 0.05 + nx * 0.06, 0.04, rz * 0.05 + nz * 0.06,
      rx * 0.36 - nx * 0.16, 0.38, rz * 0.36 - nz * 0.16,
      rx * 0.36 + nx * 0.16, 0.38, rz * 0.36 + nz * 0.16,
      rx * 0.68, 0.52, rz * 0.68
    );

    for (let k = 0; k < 5; k++) {
      normals.push(rx * 0.2, 0.96, rz * 0.2);
    }

    indices.push(
      baseIdx + 0, baseIdx + 1, baseIdx + 2,
      baseIdx + 1, baseIdx + 3, baseIdx + 2,
      baseIdx + 2, baseIdx + 3, baseIdx + 4
    );
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a tall coastal/oasis reed cluster geometry with local y in [0, 1.35].
 */
function createReedClusterGeometry() {
  const stalkCount = 4;
  const positions = [];
  const normals = [];
  const indices = [];

  for (let s = 0; s < stalkCount; s++) {
    const a = (s / stalkCount) * Math.PI * 2 + 0.4;
    const ox = Math.cos(a) * 0.09;
    const oz = Math.sin(a) * 0.09;
    const nx = -Math.sin(a);
    const nz = Math.cos(a);
    const leanX = Math.cos(a) * 0.18;
    const leanZ = Math.sin(a) * 0.18;
    const h = 1.12 + (s % 2) * 0.22;

    const baseIdx = positions.length / 3;
    positions.push(
      ox - nx * 0.035, 0.0, oz - nz * 0.035,
      ox + nx * 0.035, 0.0, oz + nz * 0.035,
      ox - nx * 0.028 + leanX * 0.45, h * 0.52, oz - nz * 0.028 + leanZ * 0.45,
      ox + nx * 0.028 + leanX * 0.45, h * 0.52, oz + nz * 0.028 + leanZ * 0.45,
      ox + leanX, h, oz + leanZ
    );

    for (let k = 0; k < 5; k++) {
      normals.push(0, 1, 0);
    }

    indices.push(
      baseIdx + 0, baseIdx + 1, baseIdx + 2,
      baseIdx + 1, baseIdx + 3, baseIdx + 2,
      baseIdx + 2, baseIdx + 3, baseIdx + 4
    );
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Places a sculpted multi-segment natural rock/sandstone/glacier arch that players can walk under or climb onto.
 */
export function addNaturalRockArch(
  group,
  worldMeshes,
  colliders,
  {
    x = 0,
    y = 0,
    z = 0,
    yaw = 0,
    span = 5.4,
    height = 4.2,
    depth = 2.6,
    rockMat,
    capMat,
    castShadows = true,
    geometriesToDispose = []
  }
) {
  const archGroup = new THREE.Group();
  archGroup.position.set(x, y, z);
  archGroup.rotation.y = yaw;

  const halfSpan = span * 0.5;
  const pierRadius = 1.25;

  // Left & Right natural rock buttress piers
  const pierGeoL = createSculptedRockGeometry(pierRadius, 1, 17, 1.45);
  const pierGeoR = createSculptedRockGeometry(pierRadius, 1, 31, 1.45);
  geometriesToDispose.push(pierGeoL, pierGeoR);

  for (let tier = 0; tier < 2; tier++) {
    const scale = tier === 0 ? 1.08 : 0.88;
    const py = tier === 0 ? 1.05 : 2.55;
    const meshL = new THREE.Mesh(pierGeoL, rockMat);
    meshL.position.set(-halfSpan, py, 0);
    meshL.scale.set(scale, scale, scale * 0.95);
    meshL.castShadow = castShadows;
    meshL.receiveShadow = castShadows;

    const meshR = new THREE.Mesh(pierGeoR, rockMat);
    meshR.position.set(halfSpan, py, 0);
    meshR.scale.set(scale, scale, scale * 0.95);
    meshR.castShadow = castShadows;
    meshR.receiveShadow = castShadows;

    archGroup.add(meshL, meshR);
    worldMeshes.push(meshL, meshR);
  }

  // Sculpted arch bridge segments spanning overhead
  const segCount = 7;
  for (let i = 0; i < segCount; i++) {
    const t = i / (segCount - 1);
    const angle = Math.PI * (1.0 - t);
    const ax = Math.cos(angle) * halfSpan;
    const ay = 2.35 + Math.sin(angle) * (height - 2.1);

    const segGeo = createBeveledBox(1.55, 0.92, depth * 0.88, 0.18, 3);
    geometriesToDispose.push(segGeo);
    const segMesh = new THREE.Mesh(segGeo, i === 3 && capMat ? capMat : rockMat);
    segMesh.position.set(ax, ay, 0);
    segMesh.rotation.z = (angle - Math.PI * 0.5) * 0.65;
    segMesh.castShadow = castShadows;
    segMesh.receiveShadow = castShadows;
    archGroup.add(segMesh);
    worldMeshes.push(segMesh);

    if (capMat) {
      const capGeo = createBeveledBox(1.42, 0.24, depth * 0.82, 0.08, 2);
      geometriesToDispose.push(capGeo);
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.set(ax, ay + 0.48, 0);
      capMesh.rotation.z = segMesh.rotation.z * 0.5;
      capMesh.receiveShadow = castShadows;
      archGroup.add(capMesh);
    }
  }

  group.add(archGroup);

  // World-space colliders for left pier, right pier, and elevated walkable arch bridge deck
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const pushLocalCollider = (lx, minYOffset, maxYOffset, w, d, stepable = false) => {
    const wx = x + lx * cos;
    const wz = z - lx * sin;
    const rx = (Math.abs(cos) * w + Math.abs(sin) * d) * 0.5;
    const rz = (Math.abs(sin) * w + Math.abs(cos) * d) * 0.5;
    colliders.push({
      minX: wx - rx,
      maxX: wx + rx,
      minY: y + minYOffset,
      maxY: y + maxYOffset,
      minZ: wz - rz,
      maxZ: wz + rz,
      stepable
    });
  };

  pushLocalCollider(-halfSpan, -0.5, height * 0.88, 2.2, depth * 0.85, false);
  pushLocalCollider(halfSpan, -0.5, height * 0.88, 2.2, depth * 0.85, false);
  // Overhead arch span collider (minY = y + 2.55 so 1.7m players walk freely underneath!)
  pushLocalCollider(0, 2.55, height + 0.35, span + 1.2, depth * 0.82, true);

  return archGroup;
}

/**
 * Places a cluster of 2-4 sculpted boulders with optional moss/snow cap and physics collider.
 */
export function addBoulderCluster(
  group,
  worldMeshes,
  colliders,
  {
    x = 0,
    y = 0,
    z = 0,
    scale = 1.0,
    seed = 101,
    rockMat,
    capMat = null,
    castShadows = true,
    stepable = true,
    geometriesToDispose = []
  }
) {
  const cluster = new THREE.Group();
  cluster.position.set(x, y, z);

  const mainGeo = createSculptedRockGeometry(1.15 * scale, 1, seed, 0.72);
  const sideGeo1 = createSculptedRockGeometry(0.72 * scale, 1, seed + 13, 0.68);
  const sideGeo2 = createSculptedRockGeometry(0.54 * scale, 1, seed + 29, 0.64);
  geometriesToDispose.push(mainGeo, sideGeo1, sideGeo2);

  const mainRock = new THREE.Mesh(mainGeo, rockMat);
  mainRock.position.set(0, 0.55 * scale, 0);
  mainRock.rotation.y = (seed % 7) * 0.8;
  mainRock.castShadow = castShadows;
  mainRock.receiveShadow = castShadows;

  const side1 = new THREE.Mesh(sideGeo1, rockMat);
  side1.position.set(0.85 * scale, 0.36 * scale, 0.42 * scale);
  side1.rotation.set(0.2, 1.1, -0.15);
  side1.castShadow = castShadows;
  side1.receiveShadow = castShadows;

  const side2 = new THREE.Mesh(sideGeo2, rockMat);
  side2.position.set(-0.68 * scale, 0.28 * scale, -0.45 * scale);
  side2.rotation.set(-0.15, 2.2, 0.1);
  side2.castShadow = castShadows;
  side2.receiveShadow = castShadows;

  cluster.add(mainRock, side1, side2);
  worldMeshes.push(mainRock, side1, side2);

  if (capMat) {
    const capGeo = createSculptedRockGeometry(0.82 * scale, 1, seed + 5, 0.26);
    geometriesToDispose.push(capGeo);
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(0, 1.05 * scale, 0);
    cap.receiveShadow = castShadows;
    cluster.add(cap);
  }

  group.add(cluster);

  const r = 1.05 * scale;
  colliders.push({
    minX: x - r,
    maxX: x + r,
    minY: y - 0.6,
    maxY: y + 1.25 * scale,
    minZ: z - r,
    maxZ: z + r,
    stepable
  });

  return cluster;
}

/**
 * Places a biome-authentic high-detail tree with roots, fluted/ringed bark trunk, branches,
 * and wind-swaying foliage canopies.
 */
export function addDetailedTree(
  group,
  colliders,
  {
    type = 'coastalPine',
    x = 0,
    y = 0,
    z = 0,
    scale = 1.0,
    seed = 1,
    trunkMat,
    foliageMat,
    secondaryFoliageMat = null,
    snowCapMat = null,
    castShadows = true,
    geometriesToDispose = []
  }
) {
  const tree = new THREE.Group();
  tree.position.set(x, y, z);
  tree.rotation.y = (seed * 1.37) % (Math.PI * 2);
  tree.scale.setScalar(scale);

  if (type === 'coastalPine' || type === 'maritimeOak') {
    const trunkH = type === 'coastalPine' ? 4.4 : 3.6;
    const trunkGeo = createFlutedCylinder(0.22, 0.36, trunkH, 12, 5, 8, 0.02);
    geometriesToDispose.push(trunkGeo);

    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(0, trunkH * 0.5, 0);
    trunk.rotation.z = type === 'coastalPine' ? 0.08 : 0.03;
    trunk.castShadow = castShadows;
    trunk.receiveShadow = castShadows;
    tree.add(trunk);

    // Flared root buttresses
    const rootGeo = createBeveledBox(0.26, 0.55, 0.72, 0.06, 2);
    geometriesToDispose.push(rootGeo);
    for (let r = 0; r < 3; r++) {
      const a = (r / 3) * Math.PI * 2 + 0.3;
      const root = new THREE.Mesh(rootGeo, trunkMat);
      root.position.set(Math.cos(a) * 0.28, 0.22, Math.sin(a) * 0.28);
      root.rotation.y = -a + Math.PI * 0.5;
      root.rotation.x = 0.35;
      root.castShadow = castShadows;
      tree.add(root);
    }

    // Wind-swept boughs & multi-lobe foliage canopy (translated so local position.y > 0.25 for wind sway!)
    const lobes = type === 'coastalPine'
      ? [
          { lx: 0.25, ly: trunkH - 0.2, lz: 0.0, rx: 1.85, ry: 0.82, rz: 1.75 },
          { lx: 0.62, ly: trunkH + 0.55, lz: 0.28, rx: 1.55, ry: 0.72, rz: 1.48 },
          { lx: -0.35, ly: trunkH + 0.35, lz: -0.32, rx: 1.35, ry: 0.68, rz: 1.32 },
          { lx: 0.18, ly: trunkH + 1.15, lz: 0.05, rx: 1.15, ry: 0.62, rz: 1.12 }
        ]
      : [
          { lx: 0.0, ly: trunkH + 0.4, lz: 0.0, rx: 2.05, ry: 1.15, rz: 2.0 },
          { lx: 0.85, ly: trunkH + 0.1, lz: 0.45, rx: 1.45, ry: 0.95, rz: 1.4 },
          { lx: -0.78, ly: trunkH + 0.15, lz: -0.4, rx: 1.4, ry: 0.92, rz: 1.38 }
        ];

    lobes.forEach((lobe, idx) => {
      const lobeGeo = createSculptedRockGeometry(1.0, 1, seed + idx * 19, 1.0);
      lobeGeo.scale(lobe.rx, lobe.ry, lobe.rz);
      lobeGeo.translate(0, 0.65, 0); // Shift local y > 0.15 so applyWindSwayShader sways canopy!
      geometriesToDispose.push(lobeGeo);

      const mat = idx % 2 === 1 && secondaryFoliageMat ? secondaryFoliageMat : foliageMat;
      const canopy = new THREE.Mesh(lobeGeo, mat);
      canopy.position.set(lobe.lx, lobe.ly - 0.65, lobe.lz);
      canopy.castShadow = castShadows;
      canopy.receiveShadow = castShadows;
      tree.add(canopy);
    });
  } else if (type === 'datePalm') {
    // Curved ringed trunk + 10 arching palm fronds
    const segs = 7;
    const segGeo = createFlutedCylinder(0.19, 0.24, 0.82, 10, 2, 6, 0.012);
    geometriesToDispose.push(segGeo);

    let topX = 0;
    let topY = 0.35;
    for (let i = 0; i < segs; i++) {
      const t = i / (segs - 1);
      const seg = new THREE.Mesh(segGeo, trunkMat);
      topX = Math.sin(t * 1.15) * 0.68;
      topY = 0.4 + i * 0.72;
      seg.position.set(topX, topY, 0);
      seg.rotation.z = -t * 0.22;
      const s = 1.0 - t * 0.26;
      seg.scale.set(s, 1, s);
      seg.castShadow = castShadows;
      seg.receiveShadow = castShadows;
      tree.add(seg);
    }

    const frondGeo = createBeveledBox(0.68, 0.07, 2.75, 0.025, 4);
    frondGeo.translate(0, 0, 1.35);
    const fPos = frondGeo.attributes.position;
    for (let i = 0; i < fPos.count; i++) {
      const fz = fPos.getZ(i);
      const t = Math.max(0, Math.min(1, fz / 2.75));
      // Arch upward then droop gracefully at tip; outer vertices have y > 0.15 for wind sway
      const archY = Math.sin(t * Math.PI) * 0.52 - t * t * 0.22;
      const taperX = 1.0 - Math.abs(t - 0.45) * 0.65;
      fPos.setX(i, fPos.getX(i) * Math.max(0.25, taperX));
      fPos.setY(i, fPos.getY(i) + archY);
    }
    fPos.needsUpdate = true;
    frondGeo.computeVertexNormals();
    geometriesToDispose.push(frondGeo);

    // Coconut/crown bulb at top of trunk
    const crownBulb = new THREE.Mesh(createSculptedRockGeometry(0.32, 1, seed + 7, 0.85), trunkMat);
    crownBulb.position.set(topX, topY + 0.25, 0);
    tree.add(crownBulb);

    for (let f = 0; f < 10; f++) {
      const angle = (f / 10) * Math.PI * 2;
      const tierTilt = f % 2 === 0 ? -0.18 : 0.12;
      const frond = new THREE.Mesh(frondGeo, f % 2 === 0 ? foliageMat : (secondaryFoliageMat || foliageMat));
      frond.position.set(topX, topY + 0.28, 0);
      frond.rotation.y = angle;
      frond.rotation.x = tierTilt;
      frond.castShadow = castShadows;
      tree.add(frond);
    }
  } else if (type === 'desertAcacia') {
    // Forked savannah/oasis acacia with flat umbrella canopy tiers
    const trunkGeo = createFlutedCylinder(0.18, 0.32, 3.2, 10, 4, 7, 0.018);
    const branchGeo = createFlutedCylinder(0.09, 0.15, 2.1, 8, 2, 5, 0.01);
    geometriesToDispose.push(trunkGeo, branchGeo);

    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(0, 1.6, 0);
    trunk.castShadow = castShadows;
    tree.add(trunk);

    const umbrellaConfigs = [
      { bx: -0.95, by: 3.35, bz: 0.35, rz: 0.48, rx: -0.18, cw: 2.35, ch: 0.42 },
      { bx: 0.92, by: 3.55, bz: -0.3, rz: -0.45, rx: 0.15, cw: 2.15, ch: 0.38 },
      { bx: 0.05, by: 3.85, bz: 0.65, rz: -0.1, rx: -0.42, cw: 1.95, ch: 0.36 }
    ];

    umbrellaConfigs.forEach((u, idx) => {
      const bMesh = new THREE.Mesh(branchGeo, trunkMat);
      bMesh.position.set(u.bx * 0.55, 2.65, u.bz * 0.55);
      bMesh.rotation.set(u.rx, 0, u.rz);
      bMesh.castShadow = castShadows;
      tree.add(bMesh);

      const padGeo = new THREE.CylinderGeometry(u.cw * 0.82, u.cw, u.ch, 9);
      padGeo.translate(0, 0.65, 0);
      geometriesToDispose.push(padGeo);
      const pad = new THREE.Mesh(padGeo, idx % 2 === 0 ? foliageMat : (secondaryFoliageMat || foliageMat));
      pad.position.set(u.bx, u.by - 0.65, u.bz);
      pad.castShadow = castShadows;
      pad.receiveShadow = castShadows;
      tree.add(pad);
    });
  } else if (type === 'saguaro') {
    const mainGeo = createFlutedCylinder(0.24, 0.28, 3.6, 12, 4, 10, 0.024);
    const armVertGeo = createFlutedCylinder(0.16, 0.18, 1.45, 10, 2, 8, 0.018);
    const armHorizGeo = createBeveledBox(0.68, 0.32, 0.32, 0.09, 2);
    geometriesToDispose.push(mainGeo, armVertGeo, armHorizGeo);

    const mainStem = new THREE.Mesh(mainGeo, foliageMat);
    mainStem.position.set(0, 1.8, 0);
    mainStem.castShadow = castShadows;

    const armL = new THREE.Mesh(armVertGeo, foliageMat);
    armL.position.set(-0.56, 2.35, 0);
    armL.castShadow = castShadows;
    const elbowL = new THREE.Mesh(armHorizGeo, foliageMat);
    elbowL.position.set(-0.32, 1.68, 0);

    const armR = new THREE.Mesh(armVertGeo, foliageMat);
    armR.position.set(0.56, 2.05, 0);
    armR.castShadow = castShadows;
    const elbowR = new THREE.Mesh(armHorizGeo, foliageMat);
    elbowR.position.set(0.32, 1.38, 0);

    tree.add(mainStem, armL, elbowL, armR, elbowR);
  } else {
    // Tall Alpine Spruce / Snow-laden Fir with 5 layered bough tiers and snow caps
    const trunkGeo = createFlutedCylinder(0.18, 0.34, 2.8, 10, 3, 8, 0.018);
    geometriesToDispose.push(trunkGeo);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(0, 1.4, 0);
    trunk.castShadow = castShadows;
    tree.add(trunk);

    const tiers = 5;
    for (let t = 0; t < tiers; t++) {
      const radius = 2.05 - t * 0.33;
      const coneH = 1.65 - t * 0.14;
      const tierY = 2.15 + t * 1.02;

      const coneGeo = new THREE.ConeGeometry(radius, coneH, 10);
      coneGeo.translate(0, 0.55, 0); // Enable wind-sway vertex displacement
      geometriesToDispose.push(coneGeo);

      const bough = new THREE.Mesh(coneGeo, t % 2 === 0 ? foliageMat : (secondaryFoliageMat || foliageMat));
      bough.position.set(0, tierY - 0.55, 0);
      bough.rotation.y = t * 0.45;
      bough.castShadow = castShadows;
      bough.receiveShadow = castShadows;
      tree.add(bough);

      if (snowCapMat) {
        const snowGeo = new THREE.ConeGeometry(radius * 0.88, coneH * 0.42, 10);
        snowGeo.translate(0, 0.55, 0);
        geometriesToDispose.push(snowGeo);
        const snowCap = new THREE.Mesh(snowGeo, snowCapMat);
        snowCap.position.set(0, tierY - 0.26, 0);
        snowCap.rotation.y = bough.rotation.y;
        snowCap.receiveShadow = castShadows;
        tree.add(snowCap);
      }
    }
  }

  group.add(tree);

  const r = 0.42 * scale;
  colliders.push({
    minX: x - r,
    maxX: x + r,
    minY: y - 0.5,
    maxY: y + 4.8 * scale,
    minZ: z - r,
    maxZ: z + r
  });

  return tree;
}

/**
 * Places organic climbing vine & ivy clusters clinging to architectural walls, arches, and cliffs
 * with wind-swaying leaf clusters.
 */
export function addClimbingVines(
  group,
  {
    x = 0,
    y = 0,
    z = 0,
    yaw = 0,
    height = 3.2,
    width = 1.6,
    stemMat,
    leafMat,
    castShadows = false,
    geometriesToDispose = []
  }
) {
  const vineGroup = new THREE.Group();
  vineGroup.position.set(x, y, z);
  vineGroup.rotation.y = yaw;

  const strandCount = 3;
  const stemGeo = new THREE.CylinderGeometry(0.025, 0.04, height, 6, 4);
  const leafGeo = createBeveledBox(0.34, 0.28, 0.14, 0.04, 2);
  leafGeo.translate(0, 0.45, 0); // Local y > 0.15 so wind shader sways the hanging ivy leaves
  geometriesToDispose.push(stemGeo, leafGeo);

  for (let s = 0; s < strandCount; s++) {
    const sx = (s - 1) * (width * 0.34);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(sx, height * 0.5, 0.04);
    stem.rotation.z = (s - 1) * 0.06;
    vineGroup.add(stem);

    const leavesPerStrand = 5;
    for (let l = 0; l < leavesPerStrand; l++) {
      const ly = 0.45 + (l / (leavesPerStrand - 1)) * (height - 0.65);
      const lx = sx + Math.sin(l * 1.9 + s) * 0.16;
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(lx, ly - 0.45, 0.09);
      leaf.rotation.set(0.18, (l % 2 === 0 ? 1 : -1) * 0.25, (l - 2) * 0.14);
      leaf.castShadow = castShadows;
      vineGroup.add(leaf);
    }
  }

  group.add(vineGroup);
  return vineGroup;
}

/**
 * Populates a map with:
 * 1. Natural Rock & Sandstone/Glacier Arches + Sculpted Cliff Boulders
 * 2. High-Detail Biome Trees (Coastal Pines/Oaks, Date Palms/Acacias/Saguaros, Alpine Spruces/Firs)
 * 3. Dense GPU-Instanced Undergrowth (Tall Grass Blades, Ferns, Reeds, Low Shrubs) with GPU Wind Sway
 * 4. Climbing Vines & Ivy on buildings and arches
 */
export function populateMapNature(
  group,
  worldMeshes,
  colliders,
  {
    mapId = 'harbor',
    terrainHeightFn = () => 0,
    textureLib,
    quality = 'balanced',
    castShadows = true
  } = {}
) {
  const normId = mapId === 'compound' ? 'harbor' : mapId === 'cargoyard' ? 'desert' : mapId === 'nightops' ? 'snow' : mapId;
  const aniso = quality === 'ultra' || quality === 'high' ? 8 : quality === 'balanced' ? 4 : 1;

  const geometriesToDispose = [];
  const materialsToDispose = [];
  const windMaterials = [];

  const registerMat = (mat, windOpts = null) => {
    if (windOpts) {
      applyWindSwayShader(mat, windOpts);
      windMaterials.push(mat);
    }
    materialsToDispose.push(mat);
    return mat;
  };

  const barkTex = textureLib ? textureLib.getTextureSet('bark', 2, 4, aniso) : {};
  const rockTex = textureLib ? textureLib.getTextureSet(normId === 'harbor' ? 'mossyStone' : 'rockCliff', 3, 3, aniso) : {};
  const sandTex = textureLib ? textureLib.getTextureSet('sandstone', 3, 3, aniso) : {};
  const snowTex = textureLib ? textureLib.getTextureSet('snow', 3, 3, aniso) : {};

  const trunkMat = registerMat(
    createQualityMaterial(
      {
        color: normId === 'desert' ? 0x85603f : 0x523a28,
        map: barkTex.map,
        normalMap: barkTex.normalMap,
        roughnessMap: barkTex.roughnessMap,
        roughness: 0.88,
        metalness: 0.04
      },
      quality
    )
  );

  const rockMat = registerMat(
    createQualityMaterial(
      {
        color: normId === 'desert' ? 0xc89d6c : normId === 'snow' ? 0x64748b : 0x6b726a,
        map: normId === 'desert' ? sandTex.map : rockTex.map,
        normalMap: normId === 'desert' ? sandTex.normalMap : rockTex.normalMap,
        roughnessMap: normId === 'desert' ? sandTex.roughnessMap : rockTex.roughnessMap,
        roughness: 0.86,
        metalness: 0.06
      },
      quality
    )
  );

  const capMat = registerMat(
    createQualityMaterial(
      {
        color: normId === 'snow' ? 0xe8f1f8 : normId === 'desert' ? 0xdcbe8c : 0x4d6b3c,
        map: normId === 'snow' ? snowTex.map : normId === 'desert' ? sandTex.map : rockTex.map,
        normalMap: normId === 'snow' ? snowTex.normalMap : rockTex.normalMap,
        roughness: 0.82,
        metalness: 0.04
      },
      quality
    )
  );

  // Wind-swaying canopy, frond, grass, fern, reed, shrub, and ivy materials
  const primaryFoliageColor = normId === 'snow' ? 0x1d4732 : normId === 'desert' ? 0x4b772e : 0x2d5a36;
  const secondaryFoliageColor = normId === 'snow' ? 0x26583e : normId === 'desert' ? 0x628b38 : 0x3b6e42;

  const canopyMat1 = registerMat(
    createQualityMaterial({ color: primaryFoliageColor, roughness: 0.78, metalness: 0.04 }, quality),
    { amplitude: 0.14, speed: 2.0, heightThreshold: 0.15 }
  );
  const canopyMat2 = registerMat(
    createQualityMaterial({ color: secondaryFoliageColor, roughness: 0.76, metalness: 0.04 }, quality),
    { amplitude: 0.16, speed: 2.25, heightThreshold: 0.15 }
  );
  const cactusMat = registerMat(
    createQualityMaterial({ color: 0x3d6b33, roughness: 0.8, metalness: 0.04 }, quality),
    { amplitude: 0.03, speed: 1.5, heightThreshold: 0.5 }
  );

  const grassColor = normId === 'snow' ? 0x5c7664 : normId === 'desert' ? 0x8c9648 : 0x497839;
  const fernColor = normId === 'snow' ? 0x355843 : normId === 'desert' ? 0x5f7d37 : 0x386b32;
  const reedColor = normId === 'snow' ? 0x7b8c7c : normId === 'desert' ? 0x9ca352 : 0x688744;

  const grassMat = registerMat(
    createQualityMaterial({ color: grassColor, roughness: 0.76, metalness: 0.02, side: THREE.DoubleSide }, quality),
    { amplitude: 0.16, speed: 2.4, heightThreshold: 0.08 }
  );
  const fernMat = registerMat(
    createQualityMaterial({ color: fernColor, roughness: 0.74, metalness: 0.03, side: THREE.DoubleSide }, quality),
    { amplitude: 0.13, speed: 2.1, heightThreshold: 0.08 }
  );
  const reedMat = registerMat(
    createQualityMaterial({ color: reedColor, roughness: 0.75, metalness: 0.03, side: THREE.DoubleSide }, quality),
    { amplitude: 0.19, speed: 2.2, heightThreshold: 0.12 }
  );
  const shrubMat = registerMat(
    createQualityMaterial({ color: secondaryFoliageColor, roughness: 0.8, metalness: 0.03 }, quality),
    { amplitude: 0.09, speed: 1.9, heightThreshold: 0.12 }
  );
  const vineLeafMat = registerMat(
    createQualityMaterial({ color: 0x3a6b33, roughness: 0.74, metalness: 0.03 }, quality),
    { amplitude: 0.11, speed: 2.3, heightThreshold: 0.12 }
  );

  // 1. Natural Rock Arches & Cliff Boulders across the enlarged 230m-250m maps
  const archSpecs =
    normId === 'harbor'
      ? [
          { x: -72, z: -22, yaw: 0.35, span: 5.6, height: 4.3, depth: 2.6 },
          { x: -64, z: 58, yaw: -2.45, span: 5.4, height: 4.2, depth: 2.5 },
          { x: 58, z: 76, yaw: 0.65, span: 5.4, height: 4.1, depth: 2.5 }
        ]
      : normId === 'desert'
        ? [
            { x: -56, z: 18, yaw: 0.42, span: 6.2, height: 4.8, depth: 2.9 },
            { x: 56, z: -18, yaw: -2.72, span: 6.2, height: 4.8, depth: 2.9 },
            { x: -42, z: -68, yaw: 0.85, span: 5.8, height: 4.5, depth: 2.7 },
            { x: 42, z: 68, yaw: -2.28, span: 5.8, height: 4.5, depth: 2.7 }
          ]
        : [
            { x: -54, z: -14, yaw: 0.25, span: 5.8, height: 4.6, depth: 2.8 },
            { x: 54, z: 14, yaw: -2.85, span: 5.8, height: 4.6, depth: 2.8 },
            { x: -38, z: 66, yaw: 0.72, span: 5.6, height: 4.5, depth: 2.6 },
            { x: 38, z: -66, yaw: -2.42, span: 5.6, height: 4.5, depth: 2.6 }
          ];

  for (const a of archSpecs) {
    addNaturalRockArch(group, worldMeshes, colliders, {
      ...a,
      y: terrainHeightFn(a.x, a.z),
      rockMat,
      capMat,
      castShadows,
      geometriesToDispose
    });
  }

  const boulderCoords =
    normId === 'harbor'
      ? [
          // East & Southeast Sandy Beach Cove coastal boulders (x > 54)
          [58, -32, 1.15], [74, -24, 1.25], [86, -8, 1.35], [64, 8, 1.05],
          [84, 24, 1.3], [70, 42, 1.15], [88, 52, 1.28], [62, 68, 1.2],
          // West & South rocky headlands
          [-64, -36, 1.25], [-78, 4, 1.35], [-68, 48, 1.2], [-36, 68, 1.18],
          [12, 74, 1.15], [-84, -18, 1.3]
        ]
      : normId === 'desert'
        ? [
            [-48, -28, 1.25], [48, 28, 1.25], [-28, -56, 1.2], [28, 56, 1.2],
            [-68, 24, 1.35], [68, -24, 1.35], [-32, 44, 1.05], [32, -44, 1.05],
            [-82, -46, 1.4], [82, 46, 1.4], [-74, 68, 1.3], [74, -68, 1.3],
            [-18, -84, 1.25], [18, 84, 1.25]
          ]
        : [
            [-46, -24, 1.25], [46, 24, 1.25], [-26, -54, 1.25], [26, 54, 1.25],
            [-64, 28, 1.3], [64, -28, 1.3], [-42, 42, 1.1], [42, -42, 1.1],
            [-78, -44, 1.35], [78, 44, 1.35], [-72, 68, 1.3], [72, -68, 1.3],
            [-22, 82, 1.25], [22, -82, 1.25]
          ];

  boulderCoords.forEach(([bx, bz, bScale], idx) => {
    addBoulderCluster(group, worldMeshes, colliders, {
      x: bx,
      y: terrainHeightFn(bx, bz),
      z: bz,
      scale: bScale,
      seed: 200 + idx * 17,
      rockMat,
      capMat,
      castShadows,
      stepable: true,
      geometriesToDispose
    });
  });

  // Weathered coastal driftwood logs on the Harbor Sandy Beach Cove (x > 55)
  if (normId === 'harbor') {
    const driftwoodGeo = createFlutedCylinder(0.18, 0.24, 4.2, 10, 3, 7, 0.02);
    geometriesToDispose.push(driftwoodGeo);
    const driftwoodSpots = [
      [66, -14, 0.45],
      [76, 6, -0.62],
      [72, 30, 1.12],
      [82, 42, -0.35],
      [63, 52, 0.82]
    ];
    for (const [dx, dz, dyaw] of driftwoodSpots) {
      const dy = terrainHeightFn(dx, dz);
      const log = new THREE.Mesh(driftwoodGeo, trunkMat);
      log.position.set(dx, dy + 0.16, dz);
      log.rotation.set(Math.PI * 0.5, dyaw, 0.08);
      log.castShadow = castShadows;
      log.receiveShadow = castShadows;
      group.add(log);
    }
  }

  // 2. High-Detail Biome Trees across the enlarged 230m-250m maps
  if (normId === 'harbor') {
    const harborTrees = [
      // Upper sandy beach dune ridge & southeast cove
      [56, -38, 'coastalPine', 1.05],
      [60, -8, 'coastalPine', 1.08],
      [58, 22, 'maritimeOak', 1.0],
      [62, 48, 'coastalPine', 1.12],
      [52, 68, 'maritimeOak', 1.04],
      // West & South coastal headlands
      [-58, -28, 'coastalPine', 1.08],
      [-66, 0, 'maritimeOak', 1.05],
      [-58, 28, 'coastalPine', 1.1],
      [-74, -46, 'coastalPine', 1.15],
      [-74, 46, 'maritimeOak', 1.08],
      [-42, 58, 'coastalPine', 1.05],
      [-14, 64, 'maritimeOak', 1.0],
      [18, 62, 'coastalPine', 1.06],
      [-84, 18, 'coastalPine', 1.12],
      [-84, -18, 'maritimeOak', 1.04],
      [-52, 78, 'coastalPine', 1.1],
      [28, 78, 'coastalPine', 1.08]
    ];
    harborTrees.forEach(([tx, tz, tType, tScale], idx) => {
      addDetailedTree(group, colliders, {
        type: tType,
        x: tx,
        y: terrainHeightFn(tx, tz),
        z: tz,
        scale: tScale,
        seed: 300 + idx * 23,
        trunkMat,
        foliageMat: canopyMat1,
        secondaryFoliageMat: canopyMat2,
        castShadows,
        geometriesToDispose
      });
    });
  } else if (normId === 'desert') {
    const desertTrees = [
      [-14, -34, 'datePalm', 1.08],
      [14, -34, 'datePalm', 1.04],
      [-14, 34, 'datePalm', 1.05],
      [14, 34, 'datePalm', 1.08],
      [-38, 32, 'desertAcacia', 1.12],
      [38, -32, 'desertAcacia', 1.12],
      [-52, 12, 'datePalm', 1.15],
      [52, -12, 'datePalm', 1.15],
      [-48, -42, 'desertAcacia', 1.06],
      [48, 42, 'desertAcacia', 1.06],
      [-26, -8, 'saguaro', 0.98],
      [26, 8, 'saguaro', 0.98],
      [-12, 22, 'saguaro', 0.92],
      [12, -22, 'saguaro', 0.92],
      [-56, -58, 'saguaro', 1.08],
      [56, 58, 'saguaro', 1.08],
      [-76, -24, 'desertAcacia', 1.14],
      [76, 24, 'desertAcacia', 1.14],
      [-72, 54, 'datePalm', 1.12],
      [72, -54, 'datePalm', 1.12],
      [-28, -76, 'datePalm', 1.1],
      [28, 76, 'datePalm', 1.1],
      [-86, 8, 'saguaro', 1.05],
      [86, -8, 'saguaro', 1.05],
      [-64, 82, 'saguaro', 1.06],
      [64, -82, 'saguaro', 1.06]
    ];
    desertTrees.forEach(([tx, tz, tType, tScale], idx) => {
      addDetailedTree(group, colliders, {
        type: tType,
        x: tx,
        y: terrainHeightFn(tx, tz),
        z: tz,
        scale: tScale,
        seed: 400 + idx * 19,
        trunkMat,
        foliageMat: tType === 'saguaro' ? cactusMat : canopyMat1,
        secondaryFoliageMat: canopyMat2,
        castShadows,
        geometriesToDispose
      });
    });
  } else {
    // Dense snow-dusted pine forests across the 250m x 250m Alpine Glacier Peaks
    const snowTrees = [
      [-24, -38, 1.08], [24, 38, 1.08], [-38, 18, 1.12], [38, -18, 1.12],
      [-36, -12, 0.98], [36, 12, 0.98], [-16, 36, 1.04], [16, -36, 1.04],
      [-48, -32, 1.16], [48, 32, 1.16], [-32, 48, 1.08], [32, -48, 1.08],
      [-56, 0, 1.14], [56, 0, 1.14],
      [-72, -52, 1.2], [72, 52, 1.2], [-72, 52, 1.18], [72, -52, 1.18],
      [-84, -18, 1.15], [84, 18, 1.15], [-84, 24, 1.12], [84, -24, 1.12],
      [-48, -76, 1.18], [48, 76, 1.18], [-48, 76, 1.14], [48, -76, 1.14],
      [-18, -82, 1.1], [18, 82, 1.1], [-64, -22, 1.08], [64, 22, 1.08]
    ];
    snowTrees.forEach(([tx, tz, tScale], idx) => {
      addDetailedTree(group, colliders, {
        type: 'alpineSpruce',
        x: tx,
        y: terrainHeightFn(tx, tz),
        z: tz,
        scale: tScale,
        seed: 500 + idx * 29,
        trunkMat,
        foliageMat: canopyMat1,
        secondaryFoliageMat: canopyMat2,
        snowCapMat: capMat,
        castShadows,
        geometriesToDispose
      });
    });
  }

  // 3. Climbing Vines & Ivy on Coastal / Temple Archways
  const vineSpots =
    normId === 'harbor'
      ? [
          { x: -72, z: -20.5, yaw: 0.35, height: 2.9, width: 1.4 },
          { x: -64, z: 59.5, yaw: -2.45, height: 2.9, width: 1.4 }
        ]
      : normId === 'desert'
        ? [
            { x: -56, z: 19.4, yaw: 0.42, height: 3.1, width: 1.5 },
            { x: 56, z: -19.4, yaw: -2.72, height: 3.1, width: 1.5 }
          ]
        : [
            { x: -12.5, z: -2.2, yaw: Math.PI / 2, height: 2.8, width: 1.4 },
            { x: 12.5, z: 2.2, yaw: -Math.PI / 2, height: 2.8, width: 1.4 }
          ];

  for (const v of vineSpots) {
    addClimbingVines(group, {
      ...v,
      y: terrainHeightFn(v.x, v.z),
      stemMat: trunkMat,
      leafMat: vineLeafMat,
      castShadows: false,
      geometriesToDispose
    });
  }

  // 4. Dense InstancedMesh Undergrowth (Tall Grass, Ferns, Coastal/Oasis Reeds, and Low Shrubs)
  const densityScale = quality === 'ultra' || quality === 'high' ? 1.0 : quality === 'balanced' ? 0.7 : 0.0;
  const rand = seededRand(normId === 'harbor' ? 701 : normId === 'desert' ? 809 : 907);
  const dummy = new THREE.Object3D();
  const spreadSpan = normId === 'harbor' ? 204 : 224;

  const isValidUndergrowthSpot = (wx, wz) => {
    const maxC = Math.max(Math.abs(wx), Math.abs(wz));
    if (maxC > spreadSpan * 0.5) return false;
    if (normId === 'harbor') {
      // Never place grass in the deep north shipping channel or below the surf waterline
      if (wz < -64) return false;
      const wy = terrainHeightFn(wx, wz);
      if (wy < -0.05) return false;
      // Keep the paved container dockyard (-48 <= wx <= 50 && wz <= 46) clean;
      // allow rich beach grass & reeds on the East/Southeast Sandy Beach Cove (wx > 51) and outer headlands!
      if (wx >= -48 && wx <= 50.5 && wz >= -64 && wz <= 46) return false;
      return true;
    }
    // Avoid central spawn/supply pad plaza & primary roads
    if (Math.hypot(wx, wz) < 10.5) return false;
    if (Math.min(Math.abs(wx), Math.abs(wz)) < 4.2) return false;
    return true;
  };

  if (densityScale > 0) {
    const grassCount = Math.round((normId === 'harbor' ? 340 : 440) * densityScale);
    const fernCount = Math.round(135 * densityScale);
    const reedCount = Math.round((normId === 'harbor' ? 140 : 95) * densityScale);

    const grassGeo = createGrassTuftGeometry();
    const fernGeo = createFernRosetteGeometry();
    const reedGeo = createReedClusterGeometry();
    geometriesToDispose.push(grassGeo, fernGeo, reedGeo);

    const grassInst = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
    const fernInst = new THREE.InstancedMesh(fernGeo, fernMat, fernCount);
    const reedInst = new THREE.InstancedMesh(reedGeo, reedMat, reedCount);

    const populateInstances = (instMesh, count, minScale, maxScale) => {
      let placed = 0;
      let attempts = 0;
      while (placed < count && attempts < count * 10) {
        attempts++;
        const wx = (rand() - 0.5) * spreadSpan;
        const wz = (rand() - 0.5) * spreadSpan;
        if (!isValidUndergrowthSpot(wx, wz)) continue;

        const wy = terrainHeightFn(wx, wz);
        const s = minScale + rand() * (maxScale - minScale);
        dummy.position.set(wx, wy - 0.02, wz);
        dummy.rotation.set((rand() - 0.5) * 0.12, rand() * Math.PI * 2, (rand() - 0.5) * 0.12);
        dummy.scale.set(s, s * (0.85 + rand() * 0.35), s);
        dummy.updateMatrix();
        instMesh.setMatrixAt(placed, dummy.matrix);
        placed++;
      }
      instMesh.count = placed;
      instMesh.instanceMatrix.needsUpdate = true;
      instMesh.receiveShadow = castShadows;
      group.add(instMesh);
    };

    populateInstances(grassInst, grassCount, 0.85, 1.48);
    populateInstances(fernInst, fernCount, 0.8, 1.38);
    populateInstances(reedInst, reedCount, 0.92, 1.48);
  }

  // Low Shrubs / Bushes
  const shrubCount = quality === 'fast' ? 24 : Math.round(72 * (quality === 'ultra' ? 1.0 : 0.75));
  const shrubGeo = createSculptedRockGeometry(0.58, 1, 77, 0.68);
  shrubGeo.translate(0, 0.38, 0);
  geometriesToDispose.push(shrubGeo);

  const shrubInst = new THREE.InstancedMesh(shrubGeo, shrubMat, shrubCount);
  let shrubsPlaced = 0;
  let shrubAttempts = 0;
  while (shrubsPlaced < shrubCount && shrubAttempts < shrubCount * 12) {
    shrubAttempts++;
    const wx = (rand() - 0.5) * spreadSpan;
    const wz = (rand() - 0.5) * spreadSpan;
    if (!isValidUndergrowthSpot(wx, wz)) continue;
    const wy = terrainHeightFn(wx, wz);
    const s = 0.75 + rand() * 0.68;
    dummy.position.set(wx, wy - 0.05, wz);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.set(s * 1.15, s * 0.85, s * 1.15);
    dummy.updateMatrix();
    shrubInst.setMatrixAt(shrubsPlaced, dummy.matrix);
    shrubsPlaced++;
  }
  shrubInst.count = shrubsPlaced;
  shrubInst.instanceMatrix.needsUpdate = true;
  shrubInst.castShadow = castShadows;
  shrubInst.receiveShadow = castShadows;
  group.add(shrubInst);

  return {
    update: (_dt, elapsedSec) => {
      for (let i = 0; i < windMaterials.length; i++) {
        const u = windMaterials[i].userData?.windUniforms;
        if (u && u.uWindTime) {
          u.uWindTime.value = elapsedSec;
        }
      }
    },
    dispose: () => {
      for (const g of geometriesToDispose) g.dispose();
      for (const m of materialsToDispose) m.dispose();
    }
  };
}
