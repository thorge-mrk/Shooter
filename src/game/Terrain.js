import * as THREE from 'three';
import { getTerrainHeight } from './TerrainMath.js';

export { getTerrainHeight };

export function buildTerrainGeometry(mapId, size = 104, segments = 56) {
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  if (mapId !== 'harbor' && mapId !== 'cargoyard') {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, getTerrainHeight(mapId, x, z));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  return geo;
}
