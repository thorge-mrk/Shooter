import * as THREE from 'three';
import { getHarborBeachFactor, getTerrainHeight, getTerrainSlopeAndSplat } from './TerrainMath.js';

export { getTerrainHeight, getTerrainSlopeAndSplat };

export function resolveTerrainSegments(segmentsOrQuality = 'balanced') {
  if (typeof segmentsOrQuality === 'string') {
    if (segmentsOrQuality === 'ultra' || segmentsOrQuality === 'high') return 96;
    if (segmentsOrQuality === 'fast') return 56;
    return 84;
  }
  if (typeof segmentsOrQuality === 'number' && Number.isFinite(segmentsOrQuality)) {
    return Math.max(40, Math.round(segmentsOrQuality));
  }
  return 84;
}

export function buildTerrainGeometry(mapId, size = 104, segmentsOrQuality = 64, quality = null) {
  const segments = resolveTerrainSegments(segmentsOrQuality);
  const effectiveQuality = quality || (typeof segmentsOrQuality === 'string' ? segmentsOrQuality : 'balanced');
  const normId = mapId === 'compound' ? 'harbor' : mapId === 'cargoyard' ? 'desert' : mapId === 'nightops' ? 'snow' : mapId;

  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const isFast = effectiveQuality === 'fast';

  // Crisp, bright Venge.io-style biome vertex colors for 720p LOW POLY mode
  let roadCol;
  let groundCol;
  let rockCol;
  let turfCol;
  if (isFast) {
    if (normId === 'harbor') {
      roadCol = new THREE.Color(0x9aa8b8);
      groundCol = new THREE.Color(0xe8d09e); // Golden beach & sandy seabed
      turfCol = new THREE.Color(0x639452);   // Crisp coastal headland grass
      rockCol = new THREE.Color(0x6e7b70);
    } else if (normId === 'desert') {
      roadCol = new THREE.Color(0xd1b388);
      groundCol = new THREE.Color(0xe6c78c);
      rockCol = new THREE.Color(0xc2935b);
    } else {
      roadCol = new THREE.Color(0x94a3b8);
      groundCol = new THREE.Color(0xeaf2f8);
      rockCol = new THREE.Color(0x74899e);
    }
  }

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const { height, splat } = getTerrainSlopeAndSplat(mapId, x, z);
    pos.setY(i, height);

    const idx = i * 3;
    if (isFast) {
      let gCol = groundCol;
      if (normId === 'harbor') {
        const beachOrSea = Math.max(getHarborBeachFactor(x, z), z < -45.5 ? 1 : 0, height < -0.08 ? 1 : 0);
        gCol = turfCol.clone().lerp(groundCol, Math.min(1, beachOrSea));
      }
      const r = roadCol.r * splat[0] + gCol.r * splat[1] + rockCol.r * splat[2];
      const g = roadCol.g * splat[0] + gCol.g * splat[1] + rockCol.g * splat[2];
      const b = roadCol.b * splat[0] + gCol.b * splat[1] + rockCol.b * splat[2];
      colors[idx] = r;
      colors[idx + 1] = g;
      colors[idx + 2] = b;
    } else {
      colors[idx] = splat[0];     // R = road / asphalt / dock deck
      colors[idx + 1] = splat[1]; // G = primary biome ground (sand / snow / seabed)
      colors[idx + 2] = splat[2]; // B = cliff rock / coastal mossy stone
    }
  }

  pos.needsUpdate = true;
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  if (isFast) {
    const flatGeo = geo.toNonIndexed();
    flatGeo.computeVertexNormals();
    geo.dispose();
    return flatGeo;
  }

  geo.computeVertexNormals();
  return geo;
}
