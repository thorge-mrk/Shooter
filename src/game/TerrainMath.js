function smoothPlateauMask(x, z, radius = 14) {
  const d = Math.hypot(x, z);
  if (d < radius) return 0;
  return Math.min(1, (d - radius) / 16);
}

export function getTerrainHeight(mapId, x, z) {
  if (mapId === 'harbor' || mapId === 'cargoyard') {
    return 0;
  }

  const edgeFade = Math.max(0, Math.min(1, (48 - Math.max(Math.abs(x), Math.abs(z))) / 10));

  if (mapId === 'desert') {
    const dune1 = Math.sin(x * 0.075 + 0.6) * Math.cos(z * 0.068 - 0.3) * 2.6;
    const dune2 = Math.sin((x + z) * 0.045) * 1.9;
    const ridge = Math.abs(Math.sin(x * 0.04 - z * 0.035)) * 1.4;
    const raw = (dune1 + dune2 + ridge + 2.2) * 0.65;
    const mask = smoothPlateauMask(x, z, 7);
    return Math.max(0, raw * mask * (0.35 + 0.65 * edgeFade));
  }

  if (mapId === 'snow') {
    const hill1 = Math.cos(x * 0.065) * Math.sin(z * 0.072) * 3.1;
    const hill2 = Math.sin(x * 0.038 - z * 0.042) * 2.3;
    const mound = Math.cos((x - 15) * 0.09) * Math.cos((z + 12) * 0.09) * 1.1;
    const raw = (hill1 + hill2 + mound + 2.8) * 0.68;
    const mask = smoothPlateauMask(x, z, 8);
    return Math.max(0, raw * mask * (0.3 + 0.7 * edgeFade));
  }

  return 0;
}
