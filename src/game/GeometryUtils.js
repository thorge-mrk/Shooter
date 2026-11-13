import * as THREE from 'three';

const _v = new THREE.Vector3();
const _n = new THREE.Vector3();

/**
 * Creates a true beveled/filleted 3D BoxGeometry with smooth edge normals and clean UV mapping
 * so no object in the game looks like a sharp-edged placeholder cube.
 */
export function createBeveledBox(width = 1, height = 1, depth = 1, bevel = 0.04, segments = 3) {
  const segs = Math.max(2, segments);
  const geo = new THREE.BoxGeometry(width, height, depth, segs, segs, segs);
  const r = Math.min(bevel, width * 0.35, height * 0.35, depth * 0.35);
  if (r <= 0.0001) return geo;

  const hx = Math.max(0.0001, width * 0.5 - r);
  const hy = Math.max(0.0001, height * 0.5 - r);
  const hz = Math.max(0.0001, depth * 0.5 - r);

  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const cx = Math.max(-hx, Math.min(hx, x));
    const cy = Math.max(-hy, Math.min(hy, y));
    const cz = Math.max(-hz, Math.min(hz, z));

    _v.set(x - cx, y - cy, z - cz);
    const len = _v.length();
    if (len > 1e-5) {
      _n.copy(_v). divideScalar(len);
      pos.setXYZ(i, cx + _n.x * r, cy + _n.y * r, cz + _n.z * r);
      norm.setXYZ(i, _n.x, _n.y, _n.z);
    }
  }

  pos.needsUpdate = true;
  norm.needsUpdate = true;
  return geo;
}

/**
 * Creates a fluted or ribbed cylinder (for architectural columns, barrels, suppressors, and struts).
 */
export function createFlutedCylinder(
  radiusTop = 0.35,
  radiusBottom = 0.38,
  height = 4.0,
  radialSegments = 24,
  heightSegments = 8,
  fluteCount = 12,
  fluteDepth = 0.018
) {
  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments);
  const pos = geo.attributes.position;
  const halfH = height * 0.5;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 1e-4 || Math.abs(y) > halfH - 0.02) continue;

    const angle = Math.atan2(z, x);
    // Gentle entasis (classical column curve) + vertical flutes
    const hNorm = (y + halfH) / height;
    const entasis = 1.0 + Math.sin(hNorm * Math.PI) * 0.03;
    const flute = Math.cos(angle * fluteCount) * fluteDepth;
    const newR = Math.max(0.02, r * entasis - Math.max(0, flute));
    const scale = newR / r;
    pos.setX(i, x * scale);
    pos.setZ(i, z * scale);
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a true 3D archway (two beveled piers + vaulted arch voussoirs + keystone) as a Group.
 */
export function createArchwayGroup({
  span = 3.6,
  pierWidth = 0.85,
  pierHeight = 3.2,
  depth = 1.1,
  mat,
  trimMat,
  castShadows = true,
  voussoirs = 9
}) {
  const group = new THREE.Group();
  const radius = span * 0.5;
  const leftX = -(radius + pierWidth * 0.5);
  const rightX = radius + pierWidth * 0.5;

  // Base plinths
  const plinthGeo = createBeveledBox(pierWidth * 1.18, 0.36, depth * 1.16, 0.04, 3);
  const plinthL = new THREE.Mesh(plinthGeo, trimMat || mat);
  plinthL.position.set(leftX, 0.18, 0);
  const plinthR = new THREE.Mesh(plinthGeo, trimMat || mat);
  plinthR.position.set(rightX, 0.18, 0);

  // Main piers
  const pierGeo = createBeveledBox(pierWidth, pierHeight, depth, 0.05, 3);
  const pierL = new THREE.Mesh(pierGeo, mat);
  pierL.position.set(leftX, pierHeight * 0.5, 0);
  const pierR = new THREE.Mesh(pierGeo, mat);
  pierR.position.set(rightX, pierHeight * 0.5, 0);

  // Impost capitals at springline
  const capGeo = createBeveledBox(pierWidth * 1.16, 0.26, depth * 1.14, 0.035, 3);
  const capL = new THREE.Mesh(capGeo, trimMat || mat);
  capL.position.set(leftX, pierHeight, 0);
  const capR = new THREE.Mesh(capGeo, trimMat || mat);
  capR.position.set(rightX, pierHeight, 0);

  group.add(plinthL, plinthR, pierL, pierR, capL, capR);

  // Voussoir arch blocks along semi-circle + prominent central keystone
  const archR = radius + pierWidth * 0.46;
  const segLen = (Math.PI * archR) / voussoirs;
  for (let i = 0; i < voussoirs; i++) {
    const isKeystone = i === Math.floor(voussoirs / 2);
    const t = (i + 0.5) / voussoirs;
    const angle = Math.PI * (1 - t);
    const vx = Math.cos(angle) * archR;
    const vy = pierHeight + Math.sin(angle) * archR;

    const vGeo = createBeveledBox(
      isKeystone ? pierWidth * 1.08 : pierWidth * 0.92,
      segLen * (isKeystone ? 1.16 : 1.05),
      isKeystone ? depth * 1.12 : depth,
      0.04,
      2
    );
    const vMesh = new THREE.Mesh(vGeo, isKeystone && trimMat ? trimMat : mat);
    vMesh.position.set(vx, vy, 0);
    vMesh.rotation.z = angle - Math.PI * 0.5;
    group.add(vMesh);
  }

  // Top entablature / bridge deck spandrel beam above the arch
  const topY = pierHeight + archR + pierWidth * 0.55;
  const totalW = span + pierWidth * 2.2;
  const lintelGeo = createBeveledBox(totalW, 0.52, depth * 1.08, 0.045, 3);
  const lintel = new THREE.Mesh(lintelGeo, trimMat || mat);
  lintel.position.set(0, topY, 0);
  group.add(lintel);

  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = castShadows;
      child.receiveShadow = castShadows;
    }
  });

  return {
    group,
    totalWidth: totalW,
    totalHeight: topY + 0.26,
    openingWidth: span,
    openingHeight: pierHeight + radius * 0.65,
    pierColliders: [
      { dx: leftX, w: pierWidth, h: topY, d: depth },
      { dx: rightX, w: pierWidth, h: topY, d: depth }
    ],
    topSlab: { yMin: pierHeight + radius * 0.72, yMax: topY + 0.26, w: totalW, d: depth }
  };
}
