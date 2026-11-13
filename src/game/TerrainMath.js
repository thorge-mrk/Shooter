function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function smoothPlateauMask(x, z, radius = 14) {
  const d = Math.hypot(x, z);
  if (d < radius) return 0;
  return smoothstep(radius, radius + 16, d);
}

function roadPathMask(x, z) {
  // Extended cross-shaped tactical avenues + inner & outer ring paths for 230m-250m maps
  const distAxis = Math.min(Math.abs(x), Math.abs(z));
  const axisRoad = 1 - smoothstep(2.6, 6.8, distAxis);
  const r = Math.hypot(x, z);
  const innerRing = 1 - smoothstep(1.5, 4.2, Math.abs(r - 24.0));
  const outerRing = 1 - smoothstep(1.8, 5.0, Math.abs(r - 64.0));
  const centerPad = 1 - smoothstep(5.0, 10.5, r);
  return Math.max(axisRoad * 0.72, innerRing * 0.55, outerRing * 0.48, centerPad);
}

/**
 * Returns [0..1] mask indicating how strongly (x, z) lies inside the East/Southeast
 * Sandy Coastal Beach Cove of the Harbor map (x > 52, z > -60).
 */
export function getHarborBeachFactor(x, z) {
  if (x <= 48 || z <= -64) return 0;
  const eastRamp = smoothstep(48, 58, x);
  const northCutoff = 1 - smoothstep(46, 64, -z);
  const southCutoff = 1 - smoothstep(96, 112, z);
  return eastRamp * northCutoff * southCutoff;
}

export function getTerrainHeight(mapId, x, z) {
  if (mapId === 'cargoyard') {
    return 0;
  }

  const maxCoord = Math.max(Math.abs(x), Math.abs(z));

  if (mapId === 'harbor' || mapId === 'compound') {
    // 1. North deep-water shipping channel (z < -66) where the 58m Cargo Ship sails along z = -84
    if (z < -65.5) {
      const channelDrop = smoothstep(-65.5, -70.0, -z); // Wait: -z > 65.5 -> use smoothstep(65.5, 70.0, -z)
      const depth = smoothstep(65.5, 70.5, -z);
      return -2.45 * depth;
    }

    // 2. Central & Western harbor container dockyard (-48 <= x <= 50 and -65.5 <= z <= 46) is strictly flat y = 0
    if (x >= -48 && x <= 50 && z >= -65.5 && z <= 46) {
      return 0;
    }

    // 3. East / Southeast Sandy Coastal Beach Cove (x > 50, z > -64):
    // Gently rises onto a low sandy dune berm (+0.8m to +1.38m around x = 56..70)
    // and then slopes smoothly down to sea level and shallow surf (-0.25m at x = 92..114)
    const beachFactor = getHarborBeachFactor(x, z);
    if (beachFactor > 0.001 && x > 50) {
      const bermRise = smoothstep(50, 62, x) * (1 - smoothstep(64, 86, x));
      const shoreSlope = smoothstep(78, 106, x);
      const duneRipple =
        Math.sin(x * 0.09 + z * 0.07) * 0.22 +
        Math.cos((x - z) * 0.12) * 0.14;
      const coveCurve = Math.sin(z * 0.045 - 0.4) * 0.18;
      const beachY =
        bermRise * (1.08 + duneRipple + coveCurve) +
        (1 - shoreSlope) * smoothstep(50, 56, x) * 0.22 -
        shoreSlope * 0.25;
      const clampedBeachY = Math.max(-0.25, Math.min(1.4, beachY));
      if (beachFactor >= 0.95) {
        return clampedBeachY;
      }
      // Smooth blend with outer coastal headlands on the far SE corner
      const edgeFadeHarbor = Math.max(0, Math.min(1, (112 - maxCoord) / 12));
      const headlandWave =
        Math.max(0, 1.1 + Math.sin(x * 0.065) * Math.cos(z * 0.06) * 1.15) *
        (0.35 + 0.65 * edgeFadeHarbor);
      return clampedBeachY * beachFactor + Math.min(3.2, headlandWave) * (1 - beachFactor);
    }

    // 4. Outer Western & Southern coastal headlands & berms (x < -48 or z > 46)
    const edgeFadeHarbor = Math.max(0, Math.min(1, (112 - maxCoord) / 12));
    const westDist = Math.max(0, -48 - x);
    const southDist = Math.max(0, z - 46);
    const outerDist = Math.max(westDist, southDist);
    const outerRamp = smoothstep(0.5, 14.0, outerDist);
    const avenueClearance = smoothstep(5.0, 14.0, Math.min(Math.abs(x), Math.abs(z)));
    const wave1 = Math.sin(x * 0.068 + 0.4) * Math.cos(z * 0.064 - 0.5) * 1.45;
    const wave2 = Math.cos((x - z) * 0.052) * 0.95;
    const ridge = Math.abs(Math.sin(x * 0.042 + z * 0.038)) * 1.15;
    const raw = Math.max(0, 1.05 + wave1 + wave2 + ridge);
    return Math.min(3.5, raw * outerRamp * (0.32 + 0.68 * avenueClearance) * (0.35 + 0.65 * edgeFadeHarbor));
  }

  const edgeFade = Math.max(0, Math.min(1, (121 - maxCoord) / 14));

  if (mapId === 'desert') {
    const dune1 = Math.sin(x * 0.058 + 0.6) * Math.cos(z * 0.052 - 0.3) * 2.95;
    const dune2 = Math.sin((x + z) * 0.036) * 2.15;
    const macroDune = Math.cos(x * 0.024 - z * 0.028 + 0.9) * 1.65;
    const ridge = Math.abs(Math.sin(x * 0.034 - z * 0.031)) * 1.68;
    const microRipple = Math.sin(x * 0.2 + z * 0.15) * 0.16;
    const outerEscarpment = smoothstep(52, 98, maxCoord) * 1.85;
    const pathDip = 1 - roadPathMask(x, z) * 0.28;
    const raw = (dune1 + dune2 + macroDune + ridge + microRipple + outerEscarpment + 2.45) * 0.66 * pathDip;
    const mask = smoothPlateauMask(x, z, 7);
    return Math.max(0, raw * mask * (0.35 + 0.65 * edgeFade));
  }

  if (mapId === 'snow' || mapId === 'nightops') {
    const hill1 = Math.cos(x * 0.055) * Math.sin(z * 0.062) * 3.35;
    const hill2 = Math.sin(x * 0.032 - z * 0.036) * 2.55;
    const alpinePeak = Math.cos(x * 0.022 + z * 0.025) * 1.75;
    const mound = Math.cos((x - 15) * 0.075) * Math.cos((z + 12) * 0.075) * 1.25;
    const glacialRidge =
      Math.abs(Math.cos(x * 0.044 + z * 0.04)) * 1.35 +
      smoothstep(48, 96, maxCoord) * 2.15;
    const pathDip = 1 - roadPathMask(x, z) * 0.25;
    const raw = (hill1 + hill2 + alpinePeak + mound + glacialRidge + 2.75) * 0.66 * pathDip;
    const mask = smoothPlateauMask(x, z, 8);
    return Math.max(0, raw * mask * (0.32 + 0.68 * edgeFade));
  }

  return 0;
}

/**
 * Computes terrain height, world slope magnitude, and normalized 3-layer splat weights:
 * splat = [roadWeight, groundWeight, rockWeight]
 * - R (roadWeight): paved dock / compacted path / tactical road
 * - G (groundWeight): primary biome surface (sand dunes / snowpack / coastal beach & turf)
 * - B (rockWeight): steep cliff rock / mossy stone / exposed bedrock
 */
export function getTerrainSlopeAndSplat(mapId, x, z) {
  const eps = 0.4;
  const height = getTerrainHeight(mapId, x, z);
  const hx1 = getTerrainHeight(mapId, x + eps, z);
  const hx0 = getTerrainHeight(mapId, x - eps, z);
  const hz1 = getTerrainHeight(mapId, x, z + eps);
  const hz0 = getTerrainHeight(mapId, x, z - eps);

  const dx = (hx1 - hx0) / (2 * eps);
  const dz = (hz1 - hz0) / (2 * eps);
  const slope = Math.min(1, Math.hypot(dx, dz));

  const pathAmt = roadPathMask(x, z);

  let roadW = 0;
  let groundW = 0;
  let rockW = 0;

  if (mapId === 'harbor' || mapId === 'compound') {
    const beachFactor = getHarborBeachFactor(x, z);
    const inDockX = 1 - smoothstep(44, 52, Math.abs(x));
    const inDockZ = (1 - smoothstep(42, 50, z)) * (1 - smoothstep(58, 65, -z));
    const innerDock = inDockX * inDockZ * (1 - beachFactor);

    roadW = Math.max(innerDock, pathAmt * 0.62 * (1 - beachFactor)) * (1 - smoothstep(0.18, 0.45, slope));
    rockW = (smoothstep(0.18, 0.5, slope) + smoothstep(1.45, 2.8, height) * 0.55) * (1 - beachFactor * 0.82);
    // In beachZone (x > 52), boost groundW (splat.g) strongly for golden coastal sand blending
    groundW = Math.max(0.02, (1 - innerDock) * 0.86 + beachFactor * 2.4);
  } else {
    roadW = pathAmt * (1 - smoothstep(0.18, 0.38, slope)) * (1 - smoothstep(1.8, 3.6, height) * 0.6);
    rockW = smoothstep(0.22, 0.55, slope) * 1.15 + smoothstep(2.4, 4.8, height) * 0.55;
    groundW = Math.max(0.08, 1.0 - roadW * 0.85 - rockW * 0.75);
  }

  const sum = roadW + groundW + rockW || 1;
  return {
    height,
    slope,
    splat: [roadW / sum, groundW / sum, rockW / sum]
  };
}
