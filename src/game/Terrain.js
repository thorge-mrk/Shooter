import * as THREE from 'three';
import { getTerrainHeight, getTerrainSlopeAndSplat } from './TerrainMath.js';

export { getTerrainHeight, getTerrainSlopeAndSplat };

export function resolveTerrainSegments(segmentsOrQuality = 'balanced') {
  if (typeof segmentsOrQuality === 'string') {
    if (segmentsOrQuality === 'ultra' || segmentsOrQuality === 'high') return 84;
    if (segmentsOrQuality === 'fast') return 40;
    return 64;
  }
  if (typeof segmentsOrQuality === 'number' && Number.isFinite(segmentsOrQuality)) {
    return Math.max(40, Math.round(segmentsOrQuality));
  }
  return 64;
}

export function buildTerrainGeometry(mapId, size = 104, segmentsOrQuality = 64) {
  const segments = resolveTerrainSegments(segmentsOrQuality);
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const { height, splat } = getTerrainSlopeAndSplat(mapId, x, z);
    pos.setY(i, height);

    const idx = i * 3;
    colors[idx] = splat[0];     // R = road / asphalt / dock deck
    colors[idx + 1] = splat[1]; // G = primary biome ground (sand / snow / turf)
    colors[idx + 2] = splat[2]; // B = cliff rock / mossy stone
  }

  pos.needsUpdate = true;
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  return geo;
}

