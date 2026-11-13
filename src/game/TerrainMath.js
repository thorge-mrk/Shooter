function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function smoothPlateauMask(x, z, radius = 11.5) {
  const d = Math.hypot(x, z);
  if (d < radius) return 0;
  return smoothstep(radius, radius + 13, d);
}

function roadPathMask(x, z) {
  // Compacted cross-shaped tactical avenues + inner & outer ring paths for 175m-185m maps
  const distAxis = Math.min(Math.abs(x), Math.abs(z));
  const axisRoad = 1 - smoothstep(2.4, 6.2, distAxis);
  const r = Math.hypot(x, z);
  const innerRing = 1 - smoothstep(1.4, 3.8, Math.abs(r - 20.0));
  const outerRing = 1 - smoothstep(1.6, 4.4, Math.abs(r - 50.0));
  const centerPad = 1 - smoothstep(4.5, 9.5, r);
  return Math.max(axisRoad * 0.72, innerRing * 0.55, outerRing * 0.48, centerPad);
}

/**
 * Returns [0..1] mask indicating how strongly (x, z) lies inside the East/Southeast
 * Sandy Coastal Beach Cove of the compacted 175m Harbor map (x > 36, z > -46).
 */
export function getHarborBeachFactor(x, z) {
  if (x <= 36 || z <= -54) return 0;
  const eastRamp = smoothstep(36, 44, x);
  const northCutoff = smoothstep(-54, -40, z);
  const southCutoff = 1 - smoothstep(66, 82, z);
  return eastRamp * northCutoff * southCutoff;
}

export function getTerrainHeight(mapId, x, z) {
  if (mapId === 'cargoyard') {
    return 0;
  }

  const maxCoord = Math.max(Math.abs(x), Math.abs(z));

  if (mapId === 'harbor' || mapId === 'compound') {
    // 1. North wading shipping channel (z < -46): drops smoothly to -0.95m (water at y = -0.25m)
    //    East sandy ocean cove seabed (x > 52): slopes smoothly down to -0.85m
    const channelDrop = smoothstep(46.0, 50.0, -z);
    const channelY = -0.95 * channelDrop;
    const eastSeabedY = -0.85 * smoothstep(52.0, 68.0, x);

    if (z < -46.0) {
      if (x >= -36) {
        return Math.min(channelY, eastSeabedY);
      }
      // Smoothly taper NW headland down into the -0.95m North channel
      const westDistNW = Math.max(0, -36 - x);
      const nwRamp = smoothstep(0.5, 11.0, westDistNW);
      const nwRaw = Math.max(0, 1.0 + Math.sin(x * 0.075 + 0.4) * Math.cos(z * 0.07 - 0.5) * 1.25);
      const nwHeadland = Math.min(2.8, nwRaw * nwRamp);
      return nwHeadland * (1 - channelDrop) + channelY * channelDrop;
    }

    // 2. Central & Western harbor container dockyard (-36 <= x <= 36 and -46 <= z <= 34) is strictly flat y = 0
    if (x >= -36 && x <= 36 && z >= -46 && z <= 34) {
      return 0;
    }

    // 3. East / Southeast Sandy Coastal Beach Cove (x > 36, z >= -46):
    //    Rises onto a sandy dune berm (+0.8m to +1.2m around x = 40..50) and slopes cleanly
    //    across the y = -0.25m shoreline (x ~ 58) into shallow sandy seabed (-0.85m at x = 68..86)
    const beachFactor = getHarborBeachFactor(x, z);
    if (beachFactor > 0.001 && x > 36) {
      const northBermFade = smoothstep(-46.0, -35.0, z);
      const bermRise = smoothstep(36.0, 43.0, x) * (1 - smoothstep(47.0, 56.0, x)) * northBermFade;
      const duneRipple =
        Math.sin(x * 0.11 + z * 0.08) * 0.14 +
        Math.cos((x - z) * 0.13) * 0.10;
      const coveCurve = Math.sin(z * 0.055 - 0.4) * 0.12;
      const beachY = bermRise * (1.04 + duneRipple + coveCurve) + eastSeabedY;
      const clampedBeachY = Math.max(-0.85, Math.min(1.25, beachY));

      if (beachFactor >= 0.96 || z <= 58) {
        return clampedBeachY;
      }

      // Smooth blend with southern headland in the far SE corner
      const edgeFadeHarbor = Math.max(0, Math.min(1, (85 - maxCoord) / 10));
      const headlandWave =
        Math.max(0, 1.0 + Math.sin(x * 0.075) * Math.cos(z * 0.07) * 1.05) *
        (0.35 + 0.65 * edgeFadeHarbor);
      return clampedBeachY * beachFactor + Math.min(2.8, headlandWave) * (1 - beachFactor);
    }

    // 4. Outer Western & Southern coastal headlands & berms (x < -36 or z > 34)
    const edgeFadeHarbor = Math.max(0, Math.min(1, (85 - maxCoord) / 10));
    const westDist = Math.max(0, -36 - x);
    const southDist = Math.max(0, z - 34);
    const outerDist = Math.max(westDist, southDist);
    const outerRamp = smoothstep(0.5, 11.5, outerDist);
    const avenueClearance = smoothstep(4.2, 12.0, Math.min(Math.abs(x), Math.abs(z)));
    const wave1 = Math.sin(x * 0.078 + 0.4) * Math.cos(z * 0.074 - 0.5) * 1.35;
    const wave2 = Math.cos((x - z) * 0.062) * 0.85;
    const ridge = Math.abs(Math.sin(x * 0.052 + z * 0.048)) * 1.05;
    const raw = Math.max(0, 1.0 + wave1 + wave2 + ridge);
    return Math.min(3.1, raw * outerRamp * (0.35 + 0.65 * avenueClearance) * (0.35 + 0.65 * edgeFadeHarbor));
  }

  // Compacted 185m x 185m arenas for Desert and Snow
  const edgeFade = Math.max(0, Math.min(1, (91 - maxCoord) / 10));

  if (mapId === 'desert') {
    const dune1 = Math.sin(x * 0.068 + 0.6) * Math.cos(z * 0.062 - 0.3) * 2.85;
    const dune2 = Math.sin((x + z) * 0.044) * 2.05;
    const macroDune = Math.cos(x * 0.030 - z * 0.034 + 0.9) * 1.55;
    const ridge = Math.abs(Math.sin(x * 0.042 - z * 0.038)) * 1.58;
    const microRipple = Math.sin(x * 0.22 + z * 0.17) * 0.14;
    const outerEscarpment = smoothstep(42, 78, maxCoord) * 1.85;
    const pathDip = 1 - roadPathMask(x, z) * 0.28;
    const raw = (dune1 + dune2 + macroDune + ridge + microRipple + outerEscarpment + 2.55) * 0.66 * pathDip;
    const mask = smoothPlateauMask(x, z, 11.5);
    return Math.max(0, raw * mask * (0.35 + 0.65 * edgeFade));
  }

  if (mapId === 'snow' || mapId === 'nightops') {
    const hill1 = Math.cos(x * 0.064) * Math.sin(z * 0.072) * 3.25;
    const hill2 = Math.sin(x * 0.040 - z * 0.044) * 2.45;
    const alpinePeak = Math.cos(x * 0.028 + z * 0.032) * 1.65;
    const mound = Math.cos((x - 12) * 0.085) * Math.cos((z + 10) * 0.085) * 1.20;
    const glacialRidge =
      Math.abs(Math.cos(x * 0.052 + z * 0.048)) * 1.32 +
      smoothstep(40, 76, maxCoord) * 2.05;
    const pathDip = 1 - roadPathMask(x, z) * 0.25;
    const raw = (hill1 + hill2 + alpinePeak + mound + glacialRidge + 2.75) * 0.66 * pathDip;
    const mask = smoothPlateauMask(x, z, 8);
    return Math.max(0, raw * mask * (0.35 + 0.65 * edgeFade));
  }

  return 0;
}

/**
 * Computes terrain height, world slope magnitude, and normalized 3-layer splat weights:
 * splat = [roadWeight, groundWeight, rockWeight]
 * - R (roadWeight): paved dock / compacted path / tactical road
 * - G (groundWeight): primary biome surface (sand dunes / snowpack / beach sand & seabed)
 * - B (rockWeight): steep cliff rock / coastal mossy turf / exposed bedrock
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
    const inChannel = smoothstep(45.5, 49.0, -z);
    const inDockX = 1 - smoothstep(32, 37, Math.abs(x));
    const inDockZ = (1 - smoothstep(30, 35, z)) * (1 - smoothstep(42, 47, -z));
    const innerDock = inDockX * inDockZ * (1 - beachFactor) * (1 - inChannel);

    roadW = Math.max(innerDock, pathAmt * 0.56 * (1 - beachFactor) * (1 - inChannel)) * (1 - smoothstep(0.18, 0.45, slope));
    rockW = (smoothstep(0.14, 0.42, slope) + smoothstep(1.1, 2.4, height) * 0.68) * (1 - beachFactor * 0.85) * (1 - inChannel * 0.9);
    // East beach cove & submerged channel/seabed get high groundW (warm coastal sand)
    groundW = Math.max(0.02, (1 - innerDock) * 0.82 + beachFactor * 2.6 + inChannel * 2.4);
  } else {
    roadW = pathAmt * (1 - smoothstep(0.18, 0.38, slope)) * (1 - smoothstep(1.8, 3.6, height) * 0.6);
    rockW = smoothstep(0.20, 0.52, slope) * 1.15 + smoothstep(2.2, 4.4, height) * 0.55;
    groundW = Math.max(0.08, 1.0 - roadW * 0.85 - rockW * 0.75);
  }

  const sum = roadW + groundW + rockW || 1;
  return {
    height,
    slope,
    splat: [roadW / sum, groundW / sum, rockW / sum]
  };
}
