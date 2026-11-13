import * as THREE from 'three';
import { createBeveledBox, createFlutedCylinder, createArchwayGroup } from './GeometryUtils.js';
import { createQualityMaterial, createTerminalDisplayTexture } from './Textures.js';

const _materialBankCache = new WeakMap();
const _fallbackBankCache = new Map();

function normalizeQuality(quality = 'balanced') {
  if (quality === 'high') return 'ultra';
  if (quality === 'ultra' || quality === 'fast' || quality === 'balanced') return quality;
  return 'balanced';
}

function safeTerminalTexture(opts) {
  if (typeof document === 'undefined') return null;
  return createTerminalDisplayTexture(opts);
}

/**
 * Builds or retrieves a cached PBR material palette for a given textureLib + quality preset.
 */
export function getArchitecturePalette(textureLib = null, quality = 'balanced') {
  const q = normalizeQuality(quality);
  if (textureLib && typeof textureLib.getTextureSet === 'function') {
    let byQuality = _materialBankCache.get(textureLib);
    if (!byQuality) {
      byQuality = new Map();
      _materialBankCache.set(textureLib, byQuality);
    }
    if (byQuality.has(q)) return byQuality.get(q);

    const aniso = q === 'ultra' ? 8 : q === 'balanced' ? 4 : 1;
    const concreteTex = textureLib.getTextureSet('concrete', 2, 2, aniso);
    const concreteWideTex = textureLib.getTextureSet('concrete', 4, 2, aniso);
    const sandstoneTex = textureLib.getTextureSet('sandstone', 2, 2, aniso);
    const marbleTex = textureLib.getTextureSet('marbleColumn', 1, 2, aniso);
    const mossyTex = textureLib.getTextureSet('mossyStone', 2, 2, aniso);
    const steelTex = textureLib.getTextureSet('steel', 2, 2, aniso);
    const armorTex = textureLib.getTextureSet('tankArmor', 2, 2, aniso);
    const woodTex = textureLib.getTextureSet('bark', 2, 2, aniso);
    const crateTex = textureLib.getTextureSet('crateWood', 1, 1, aniso);
    const snowTex = textureLib.getTextureSet('snow', 2, 2, aniso);
    const deckTex = textureLib.getTextureSet('harborDeck', 2, 2, aniso);

    const palette = {
      concrete: createQualityMaterial({
        color: 0xb6bec8,
        map: concreteTex.map,
        normalMap: concreteTex.normalMap,
        roughnessMap: concreteTex.roughnessMap,
        roughness: 0.78,
        metalness: 0.08,
        clearcoat: 0.05
      }, q),
      concreteWall: createQualityMaterial({
        color: 0xaab3be,
        map: concreteWideTex.map,
        normalMap: concreteWideTex.normalMap,
        roughnessMap: concreteWideTex.roughnessMap,
        roughness: 0.76,
        metalness: 0.08,
        clearcoat: 0.06
      }, q),
      concreteDark: createQualityMaterial({
        color: 0x64707d,
        map: concreteTex.map,
        normalMap: concreteTex.normalMap,
        roughnessMap: concreteTex.roughnessMap,
        roughness: 0.82,
        metalness: 0.12
      }, q),
      sandstone: createQualityMaterial({
        color: 0xdcc092,
        map: sandstoneTex.map,
        normalMap: sandstoneTex.normalMap,
        roughnessMap: sandstoneTex.roughnessMap,
        roughness: 0.84,
        metalness: 0.05,
        clearcoat: 0.04
      }, q),
      sandstoneTrim: createQualityMaterial({
        color: 0xb89664,
        map: sandstoneTex.map,
        normalMap: sandstoneTex.normalMap,
        roughnessMap: sandstoneTex.roughnessMap,
        roughness: 0.78,
        metalness: 0.08
      }, q),
      marble: createQualityMaterial({
        color: 0xdce4ee,
        map: marbleTex.map,
        normalMap: marbleTex.normalMap,
        roughnessMap: marbleTex.roughnessMap,
        roughness: 0.46,
        metalness: 0.1,
        clearcoat: 0.28
      }, q),
      mossyStone: createQualityMaterial({
        color: 0x848f83,
        map: mossyTex.map,
        normalMap: mossyTex.normalMap,
        roughnessMap: mossyTex.roughnessMap,
        roughness: 0.84,
        metalness: 0.06
      }, q),
      steel: createQualityMaterial({
        color: 0x64748b,
        map: steelTex.map,
        normalMap: steelTex.normalMap,
        roughnessMap: steelTex.roughnessMap,
        roughness: 0.42,
        metalness: 0.68,
        clearcoat: 0.22
      }, q),
      steelDark: createQualityMaterial({
        color: 0x26313f,
        map: steelTex.map,
        normalMap: steelTex.normalMap,
        roughnessMap: steelTex.roughnessMap,
        roughness: 0.38,
        metalness: 0.74,
        clearcoat: 0.25
      }, q),
      steelChrome: createQualityMaterial({
        color: 0xcbd5e1,
        map: steelTex.map,
        normalMap: steelTex.normalMap,
        roughness: 0.24,
        metalness: 0.86,
        clearcoat: 0.45
      }, q),
      armorOlive: createQualityMaterial({
        color: 0x5c6b50,
        map: armorTex.map,
        normalMap: armorTex.normalMap,
        roughnessMap: armorTex.roughnessMap,
        roughness: 0.52,
        metalness: 0.42,
        clearcoat: 0.14
      }, q),
      rustMetal: createQualityMaterial({
        color: 0x8f3f26,
        map: steelTex.map,
        normalMap: steelTex.normalMap,
        roughness: 0.68,
        metalness: 0.46
      }, q),
      navalMetal: createQualityMaterial({
        color: 0x1e4875,
        map: steelTex.map,
        normalMap: steelTex.normalMap,
        roughness: 0.48,
        metalness: 0.55
      }, q),
      hazardAmber: createQualityMaterial({
        color: 0xd97706,
        map: steelTex.map,
        normalMap: steelTex.normalMap,
        roughness: 0.44,
        metalness: 0.36
      }, q),
      crimsonPaint: createQualityMaterial({
        color: 0xb91c1c,
        roughness: 0.55,
        metalness: 0.22,
        clearcoat: 0.18
      }, q),
      emeraldPaint: createQualityMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.35,
        roughness: 0.32,
        metalness: 0.28
      }, q),
      darkWood: createQualityMaterial({
        color: 0x6e4b2e,
        map: woodTex.map,
        normalMap: woodTex.normalMap,
        roughnessMap: woodTex.roughnessMap,
        roughness: 0.82,
        metalness: 0.05
      }, q),
      crateWood: createQualityMaterial({
        color: 0xa67c52,
        map: crateTex.map,
        normalMap: crateTex.normalMap,
        roughnessMap: crateTex.roughnessMap,
        roughness: 0.76,
        metalness: 0.08
      }, q),
      snowCap: createQualityMaterial({
        color: 0xe6eff8,
        map: snowTex.map,
        normalMap: snowTex.normalMap,
        roughnessMap: snowTex.roughnessMap,
        roughness: 0.72,
        metalness: 0.04
      }, q),
      stairTread: createQualityMaterial({
        color: 0x475569,
        map: deckTex.map,
        normalMap: deckTex.normalMap,
        roughnessMap: deckTex.roughnessMap,
        roughness: 0.56,
        metalness: 0.48
      }, q),
      windowGlass: new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        emissive: 0x0c4a6e,
        emissiveIntensity: 0.22,
        roughness: 0.12,
        metalness: 0.25,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        transparent: true,
        opacity: 0.38
      }),
      warmWindowGlass: new THREE.MeshPhysicalMaterial({
        color: 0xfde68a,
        emissive: 0xd97706,
        emissiveIntensity: 0.42,
        roughness: 0.16,
        metalness: 0.15,
        clearcoat: 0.9,
        transparent: true,
        opacity: 0.48
      }),
      clearcoatScreenGlass: new THREE.MeshPhysicalMaterial({
        color: 0xdbeafe,
        roughness: 0.06,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        transparent: true,
        opacity: 0.28
      }),
      solarCell: createQualityMaterial({
        color: 0x0f172a,
        emissive: 0x1e3a8a,
        emissiveIntensity: 0.22,
        roughness: 0.18,
        metalness: 0.82,
        clearcoat: 0.85
      }, q),
      goldBronze: createQualityMaterial({
        color: 0xd4a238,
        emissive: 0x78500d,
        emissiveIntensity: 0.14,
        roughness: 0.28,
        metalness: 0.84,
        clearcoat: 0.55
      }, q),
      terracotta: createQualityMaterial({
        color: 0xc2633a,
        map: sandstoneTex.map,
        normalMap: sandstoneTex.normalMap,
        roughness: 0.68,
        metalness: 0.06,
        clearcoat: 0.12
      }, q),
      terracottaDark: createQualityMaterial({
        color: 0x7c361d,
        map: sandstoneTex.map,
        normalMap: sandstoneTex.normalMap,
        roughness: 0.74,
        metalness: 0.08
      }, q),
      rubberTire: createQualityMaterial({
        color: 0x1c2128,
        roughness: 0.86,
        metalness: 0.12
      }, q),
      glacialIce: new THREE.MeshPhysicalMaterial({
        color: 0x93ddfd,
        emissive: 0x0ea5e9,
        emissiveIntensity: 0.16,
        roughness: 0.12,
        metalness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        transparent: true,
        opacity: 0.78
      }),
      ledCyan: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
      ledGreen: new THREE.MeshBasicMaterial({ color: 0x22c55e }),
      ledAmber: new THREE.MeshBasicMaterial({ color: 0xf59e0b }),
      ledRed: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
      warmLightBar: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
      coolLightBar: new THREE.MeshBasicMaterial({ color: 0xe0f2fe })
    };

    byQuality.set(q, palette);
    return palette;
  }

  if (_fallbackBankCache.has(q)) return _fallbackBankCache.get(q);
  const fallback = {
    concrete: createQualityMaterial({ color: 0x9aa3ad, roughness: 0.78, metalness: 0.08 }, q),
    concreteWall: createQualityMaterial({ color: 0x949ea8, roughness: 0.76, metalness: 0.08 }, q),
    concreteDark: createQualityMaterial({ color: 0x525c68, roughness: 0.82, metalness: 0.12 }, q),
    sandstone: createQualityMaterial({ color: 0xd6ba8b, roughness: 0.84, metalness: 0.05 }, q),
    sandstoneTrim: createQualityMaterial({ color: 0xb08d5b, roughness: 0.78, metalness: 0.08 }, q),
    marble: createQualityMaterial({ color: 0xd8e0ea, roughness: 0.44, metalness: 0.1, clearcoat: 0.28 }, q),
    mossyStone: createQualityMaterial({ color: 0x6f7a6e, roughness: 0.84, metalness: 0.06 }, q),
    steel: createQualityMaterial({ color: 0x526071, roughness: 0.42, metalness: 0.68, clearcoat: 0.22 }, q),
    steelDark: createQualityMaterial({ color: 0x25303d, roughness: 0.38, metalness: 0.74, clearcoat: 0.25 }, q),
    steelChrome: createQualityMaterial({ color: 0xcbd5e1, roughness: 0.24, metalness: 0.86, clearcoat: 0.45 }, q),
    armorOlive: createQualityMaterial({ color: 0x4e5c43, roughness: 0.52, metalness: 0.42 }, q),
    rustMetal: createQualityMaterial({ color: 0x8a3b22, roughness: 0.68, metalness: 0.45 }, q),
    navalMetal: createQualityMaterial({ color: 0x1c456e, roughness: 0.48, metalness: 0.55 }, q),
    hazardAmber: createQualityMaterial({ color: 0xd97706, roughness: 0.44, metalness: 0.36 }, q),
    crimsonPaint: createQualityMaterial({ color: 0xb91c1c, roughness: 0.55, metalness: 0.22 }, q),
    emeraldPaint: createQualityMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.35, roughness: 0.32, metalness: 0.28 }, q),
    darkWood: createQualityMaterial({ color: 0x6b472a, roughness: 0.82, metalness: 0.05 }, q),
    crateWood: createQualityMaterial({ color: 0x926942, roughness: 0.76, metalness: 0.08 }, q),
    snowCap: createQualityMaterial({ color: 0xe2ecf5, roughness: 0.75, metalness: 0.04 }, q),
    stairTread: createQualityMaterial({ color: 0x475569, roughness: 0.56, metalness: 0.48 }, q),
    windowGlass: new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0c4a6e,
      emissiveIntensity: 0.22,
      roughness: 0.12,
      metalness: 0.25,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.38
    }),
    warmWindowGlass: new THREE.MeshPhysicalMaterial({
      color: 0xfde68a,
      emissive: 0xd97706,
      emissiveIntensity: 0.42,
      roughness: 0.16,
      metalness: 0.15,
      clearcoat: 0.9,
      transparent: true,
      opacity: 0.48
    }),
    clearcoatScreenGlass: new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      roughness: 0.06,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      transparent: true,
      opacity: 0.28
    }),
    solarCell: createQualityMaterial({ color: 0x0f172a, emissive: 0x1e3a8a, emissiveIntensity: 0.22, roughness: 0.18, metalness: 0.82 }, q),
    goldBronze: createQualityMaterial({ color: 0xd4a238, roughness: 0.28, metalness: 0.84, clearcoat: 0.5 }, q),
    terracotta: createQualityMaterial({ color: 0xc2633a, roughness: 0.68, metalness: 0.06 }, q),
    terracottaDark: createQualityMaterial({ color: 0x7c361d, roughness: 0.74, metalness: 0.08 }, q),
    rubberTire: createQualityMaterial({ color: 0x1c2128, roughness: 0.86, metalness: 0.12 }, q),
    glacialIce: new THREE.MeshPhysicalMaterial({
      color: 0x93ddfd,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.16,
      roughness: 0.12,
      metalness: 0.08,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.78
    }),
    ledCyan: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
    ledGreen: new THREE.MeshBasicMaterial({ color: 0x22c55e }),
    ledAmber: new THREE.MeshBasicMaterial({ color: 0xf59e0b }),
    ledRed: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
    warmLightBar: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
    coolLightBar: new THREE.MeshBasicMaterial({ color: 0xe0f2fe })
  };
  _fallbackBankCache.set(q, fallback);
  return fallback;
}

/**
 * Helper that transforms a local box at (lx, ly, lz) with dimensions (w, h, d) inside a group
 * positioned at (originX, originY, originZ) with Y-rotation `yaw`, and pushes an exact rotated AABB collider.
 */
function pushRotatedBoxCollider(colliders, originX, originY, originZ, yaw, {
  lx = 0,
  ly = 0,
  lz = 0,
  w = 1,
  h = 1,
  d = 1,
  localYaw = 0,
  stepable = false,
  exactMinY = false,
  minYPad = 0.45
}) {
  if (!Array.isArray(colliders)) return;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const wx = originX + lx * cos + lz * sin;
  const wy = originY + ly;
  const wz = originZ - lx * sin + lz * cos;

  const totalYaw = yaw + localYaw;
  const absCos = Math.abs(Math.cos(totalYaw));
  const absSin = Math.abs(Math.sin(totalYaw));
  const hw = (w * absCos + d * absSin) * 0.5;
  const hd = (w * absSin + d * absCos) * 0.5;

  colliders.push({
    minX: wx - hw,
    maxX: wx + hw,
    minY: exactMinY ? wy - h * 0.5 : wy - h * 0.5 - minYPad,
    maxY: wy + h * 0.5,
    minZ: wz - hd,
    maxZ: wz + hd,
    stepable: Boolean(stepable)
  });
}

function createBuilderContext(parentGroup, worldMeshes, colliders, {
  x = 0,
  y = 0,
  z = 0,
  yaw = 0,
  castShadows = true
}) {
  const root = new THREE.Group();
  root.position.set(x, y, z);
  root.rotation.y = yaw;
  parentGroup.add(root);

  const registerMesh = (mesh, addToWorld = true) => {
    mesh.castShadow = castShadows;
    mesh.receiveShadow = castShadows;
    if (addToWorld && Array.isArray(worldMeshes)) {
      worldMeshes.push(mesh);
    }
    return mesh;
  };

  const addBevelBox = ({
    lx = 0,
    ly = 0,
    lz = 0,
    w = 1,
    h = 1,
    d = 1,
    bevel = 0.04,
    segments = 3,
    mat,
    rx = 0,
    ry = 0,
    rz = 0,
    collider = true,
    stepable = false,
    exactMinY = false,
    minYPad = 0.45,
    worldRegister = true
  }) => {
    const mesh = new THREE.Mesh(createBeveledBox(w, h, d, bevel, segments), mat);
    mesh.position.set(lx, ly, lz);
    if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
    registerMesh(mesh, worldRegister);
    root.add(mesh);

    if (collider) {
      pushRotatedBoxCollider(colliders, x, y, z, yaw, {
        lx,
        ly,
        lz,
        w,
        h,
        d,
        localYaw: ry,
        stepable,
        exactMinY,
        minYPad
      });
    }
    return mesh;
  };

  return { root, registerMesh, addBevelBox };
}

/**
 * 1. Columns & Pillars (`addDetailedColumn`)
 * Builds a realistic 4.2m architectural column at (x, y, z) with:
 * - Beveled stepped pedestal plinth (`createBeveledBox`)
 * - Torus base molding (`TorusGeometry`)
 * - Classical fluted shaft (`createFlutedCylinder` with 14 flutes & entasis)
 * - Astragal neck ring + carved echinus & abacus capital (`createBeveledBox`)
 * - Optional weathered stone/concrete/sandstone material and AABB collider.
 */
export function addDetailedColumn(group, worldMeshes, colliders, {
  x = 0,
  y = undefined,
  z = 0,
  height = 4.2,
  radius = 0.36,
  style = 'marble',
  mat = null,
  trimMat = null,
  textureLib = null,
  quality = 'balanced',
  castShadows = true,
  hasCollider = true,
  terrainHeightFn = null
} = {}) {
  const baseY = y !== undefined ? y : (typeof terrainHeightFn === 'function' ? terrainHeightFn(x, z) : 0);
  const pal = getArchitecturePalette(textureLib, quality);

  const mainMat = mat || (
    style === 'sandstone' ? pal.sandstone
      : style === 'concrete' ? pal.concrete
      : style === 'mossyStone' || style === 'weatheredStone' ? pal.mossyStone
      : style === 'steel' ? pal.steel
      : pal.marble
  );
  const accentMat = trimMat || (
    style === 'sandstone' ? pal.sandstoneTrim
      : style === 'concrete' ? pal.concreteDark
      : style === 'mossyStone' || style === 'weatheredStone' ? pal.concreteDark
      : pal.concrete
  );

  const colGroup = new THREE.Group();
  colGroup.position.set(x, baseY, z);
  group.add(colGroup);

  const scaleY = height / 4.2;
  const r = radius;

  // 1. Beveled stepped pedestal plinth (two-tier base + recessed panel reliefs)
  const plinth1H = 0.28 * scaleY;
  const plinth2H = 0.26 * scaleY;
  const plinth1 = new THREE.Mesh(createBeveledBox(r * 3.15, plinth1H, r * 3.15, 0.04, 3), accentMat);
  plinth1.position.set(0, plinth1H * 0.5, 0);

  const plinth2 = new THREE.Mesh(createBeveledBox(r * 2.65, plinth2H, r * 2.65, 0.035, 3), mainMat);
  plinth2.position.set(0, plinth1H + plinth2H * 0.5, 0);

  const reliefH = plinth2H * 0.55;
  const relief1 = new THREE.Mesh(createBeveledBox(r * 1.9, reliefH, r * 2.74, 0.02, 2), accentMat);
  relief1.position.set(0, plinth1H + plinth2H * 0.5, 0);
  const relief2 = new THREE.Mesh(createBeveledBox(r * 2.74, reliefH, r * 1.9, 0.02, 2), accentMat);
  relief2.position.set(0, plinth1H + plinth2H * 0.5, 0);

  colGroup.add(plinth1, plinth2, relief1, relief2);

  // 2. Attic Torus base moldings (lower & upper torus rings)
  const baseTopY = plinth1H + plinth2H;
  const torusLower = new THREE.Mesh(new THREE.TorusGeometry(r * 1.08, r * 0.16, 10, 24), accentMat);
  torusLower.rotation.x = Math.PI * 0.5;
  torusLower.position.set(0, baseTopY + r * 0.12, 0);

  const torusUpper = new THREE.Mesh(new THREE.TorusGeometry(r * 0.98, r * 0.11, 10, 24), mainMat);
  torusUpper.rotation.x = Math.PI * 0.5;
  torusUpper.position.set(0, baseTopY + r * 0.29, 0);
  colGroup.add(torusLower, torusUpper);

  // 3. Classical fluted shaft (14 flutes & entasis)
  const shaftStart = baseTopY + r * 0.36;
  const capTotalH = 0.52 * scaleY;
  const shaftH = Math.max(1.2, height - shaftStart - capTotalH);
  const shaftGeo = createFlutedCylinder(r * 0.86, r, shaftH, 28, 10, 14, 0.02);
  const shaft = new THREE.Mesh(shaftGeo, mainMat);
  shaft.position.set(0, shaftStart + shaftH * 0.5, 0);
  colGroup.add(shaft);

  // 4. Astragal neck ring + carved echinus & abacus capital
  const neckY = shaftStart + shaftH;
  const astragal = new THREE.Mesh(new THREE.TorusGeometry(r * 0.9, r * 0.1, 10, 24), accentMat);
  astragal.rotation.x = Math.PI * 0.5;
  astragal.position.set(0, neckY + 0.03 * scaleY, 0);

  const echinusH = 0.22 * scaleY;
  const echinus = new THREE.Mesh(createBeveledBox(r * 2.45, echinusH, r * 2.45, 0.055, 3), mainMat);
  echinus.position.set(0, neckY + 0.06 * scaleY + echinusH * 0.5, 0);

  // Carved corner volutes / brackets under the abacus
  const voluteGeo = createBeveledBox(r * 0.52, echinusH * 0.82, r * 0.52, 0.03, 2);
  const vOff = r * 1.06;
  for (const [vx, vz] of [[-vOff, -vOff], [vOff, -vOff], [-vOff, vOff], [vOff, vOff]]) {
    const vol = new THREE.Mesh(voluteGeo, accentMat);
    vol.position.set(vx, neckY + 0.08 * scaleY + echinusH * 0.5, vz);
    colGroup.add(vol);
  }

  const abacusH = 0.24 * scaleY;
  const abacus = new THREE.Mesh(createBeveledBox(r * 2.95, abacusH, r * 2.95, 0.04, 3), accentMat);
  abacus.position.set(0, height - abacusH * 0.5, 0);

  colGroup.add(astragal, echinus, abacus);

  colGroup.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = castShadows;
      child.receiveShadow = castShadows;
    }
  });
  if (Array.isArray(worldMeshes)) {
    worldMeshes.push(plinth1, plinth2, shaft, echinus, abacus);
  }

  if (hasCollider && Array.isArray(colliders)) {
    const cRad = r * 1.38;
    colliders.push({
      minX: x - cRad,
      maxX: x + cRad,
      minY: baseY - 0.35,
      maxY: baseY + height,
      minZ: z - cRad,
      maxZ: z + cRad,
      stepable: false
    });
  }

  colGroup.updateMatrixWorld(true);
  return colGroup;
}

/**
 * 2A. Monumental Vaulted Archway (`addMonumentalArchway`)
 * Uses `createArchwayGroup` to place freestanding or connected stone/concrete/steel archways (`span: 4.2m to 5.6m`)
 * with flanking classical pilasters and cornice cresting. Players & vehicles can pass cleanly underneath.
 */
export function addMonumentalArchway(group, worldMeshes, colliders, {
  x = 0,
  y = undefined,
  z = 0,
  yaw = 0,
  span = 4.6,
  pierWidth = 0.96,
  pierHeight = 3.2,
  depth = 1.35,
  style = 'sandstone',
  flankingColumns = true,
  textureLib = null,
  quality = 'balanced',
  castShadows = true,
  terrainHeightFn = null
} = {}) {
  const baseY = y !== undefined ? y : (typeof terrainHeightFn === 'function' ? terrainHeightFn(x, z) : 0);
  const pal = getArchitecturePalette(textureLib, quality);

  const mat = style === 'concrete' ? pal.concreteWall
    : style === 'marble' ? pal.marble
    : style === 'mossyStone' ? pal.mossyStone
    : style === 'steel' ? pal.steel
    : pal.sandstone;

  const trimMat = style === 'concrete' ? pal.steelDark
    : style === 'marble' ? pal.concrete
    : style === 'mossyStone' ? pal.concreteDark
    : style === 'steel' ? pal.steelDark
    : pal.sandstoneTrim;

  const root = new THREE.Group();
  root.position.set(x, baseY, z);
  root.rotation.y = yaw;
  group.add(root);

  const archData = createArchwayGroup({
    span,
    pierWidth,
    pierHeight,
    depth,
    mat,
    trimMat,
    castShadows,
    voussoirs: 11
  });
  root.add(archData.group);

  // Upper monumental cornice & parapet entablature above lintel
  const corniceY = archData.totalHeight + 0.16;
  const cornice = new THREE.Mesh(
    createBeveledBox(archData.totalWidth + 0.36, 0.38, depth + 0.28, 0.045, 3),
    trimMat
  );
  cornice.position.set(0, corniceY, 0);
  cornice.castShadow = castShadows;
  cornice.receiveShadow = castShadows;
  root.add(cornice);

  // Flanking engaged fluted pilasters on front & rear of both piers
  if (flankingColumns) {
    const pilasterH = pierHeight - 0.36;
    const pilasterGeo = createFlutedCylinder(0.19, 0.22, pilasterH, 18, 6, 14, 0.014);
    const capGeo = createBeveledBox(0.52, 0.18, 0.52, 0.03, 2);
    for (const pier of archData.pierColliders) {
      for (const zSign of [-1, 1]) {
        const pz = zSign * (depth * 0.5 + 0.08);
        const pil = new THREE.Mesh(pilasterGeo, trimMat);
        pil.position.set(pier.dx, 0.36 + pilasterH * 0.5, pz);
        pil.castShadow = castShadows;
        const cap = new THREE.Mesh(capGeo, mat);
        cap.position.set(pier.dx, 0.36 + pilasterH + 0.08, pz);
        cap.castShadow = castShadows;
        root.add(pil, cap);
      }
    }
  }

  root.traverse((obj) => {
    if (obj.isMesh && Array.isArray(worldMeshes)) {
      worldMeshes.push(obj);
    }
  });

  // Left & Right pier colliders
  for (const pier of archData.pierColliders) {
    pushRotatedBoxCollider(colliders, x, baseY, z, yaw, {
      lx: pier.dx,
      ly: pier.h * 0.5,
      lz: 0,
      w: pier.w,
      h: pier.h,
      d: pier.d,
      stepable: false,
      exactMinY: false
    });
  }

  // Overhead arch lintel / spandrel collider (exactMinY so players walk underneath freely!)
  const slabMinY = Math.max(2.35, archData.topSlab.yMin);
  const slabMaxY = corniceY + 0.19;
  const slabH = Math.max(0.4, slabMaxY - slabMinY);
  pushRotatedBoxCollider(colliders, x, baseY, z, yaw, {
    lx: 0,
    ly: slabMinY + slabH * 0.5,
    lz: 0,
    w: archData.topSlab.w,
    h: slabH,
    d: archData.topSlab.d,
    stepable: true,
    exactMinY: true
  });

  root.updateMatrixWorld(true);
  return root;
}

/**
 * 2B. Walkable Bridge Arch (`addWalkableBridgeArch`)
 * Uses `createArchwayGroup` (`span: 4.2m to 5.6m`) to build an elevated vaulted bridge arch with
 * side parapets, tubular safety rails, and stepable multi-step approach staircases on both sides
 * so players can BOTH walk underneath the arch AND climb onto the bridge deck!
 */
export function addWalkableBridgeArch(group, worldMeshes, colliders, {
  x = 0,
  y = undefined,
  z = 0,
  yaw = 0,
  span = 4.8,
  pierWidth = 1.05,
  deckWidth = 3.1,
  style = 'concrete',
  withStairs = true,
  textureLib = null,
  quality = 'balanced',
  castShadows = true,
  terrainHeightFn = null
} = {}) {
  const baseY = y !== undefined ? y : (typeof terrainHeightFn === 'function' ? terrainHeightFn(x, z) : 0);
  const pal = getArchitecturePalette(textureLib, quality);

  const mainMat = style === 'sandstone' ? pal.sandstone
    : style === 'mossyStone' ? pal.mossyStone
    : style === 'steel' ? pal.steel
    : pal.concreteWall;
  const trimMat = style === 'sandstone' ? pal.sandstoneTrim
    : style === 'steel' ? pal.steelDark
    : pal.concreteDark;

  const ctx = createBuilderContext(group, worldMeshes, colliders, {
    x,
    y: baseY,
    z,
    yaw,
    castShadows
  });

  // 8 stepable stairs * 0.32m rise = 2.56m bridge deck top height!
  const stepCount = 8;
  const stepRise = 0.32;
  const deckTopY = stepCount * stepRise; // 2.56m
  const deckThickness = 0.28; // Underside at 2.28m (> 1.7m player height so players walk freely underneath!)

  // Build the vaulted archway underneath using `createArchwayGroup`
  const rawPierH = 1.55;
  const archObj = createArchwayGroup({
    span,
    pierWidth,
    pierHeight: rawPierH,
    depth: deckWidth,
    mat: mainMat,
    trimMat,
    castShadows,
    voussoirs: 9
  });
  // Scale arch group vertically so its top aligns cleanly with deckTopY (2.56m)
  const archScaleY = deckTopY / archObj.totalHeight;
  archObj.group.scale.set(1, archScaleY, 1);
  ctx.root.add(archObj.group);
  archObj.group.traverse((child) => {
    if (child.isMesh && Array.isArray(worldMeshes)) {
      worldMeshes.push(child);
    }
  });

  // Left & Right arch pier colliders (leaving the 4.8m central span 100% open underneath!)
  const totalDeckW = archObj.totalWidth + 0.6;
  for (const pier of archObj.pierColliders) {
    pushRotatedBoxCollider(colliders, x, baseY, z, yaw, {
      lx: pier.dx,
      ly: ( deckTopY - deckThickness ) * 0.5,
      lz: 0,
      w: pier.w,
      h: deckTopY - deckThickness,
      d: deckWidth,
      stepable: false,
      exactMinY: false
    });
  }

  // Walkable top bridge deck slab (top at 2.56m, bottom at 2.28m with exactMinY: true)
  ctx.addBevelBox({
    lx: 0,
    ly: deckTopY - deckThickness * 0.5,
    lz: 0,
    w: totalDeckW,
    h: deckThickness,
    d: deckWidth + 0.16,
    bevel: 0.04,
    mat: trimMat,
    collider: true,
    stepable: true,
    exactMinY: true
  });

  // Bridge side parapets & tubular steel railings along front (+Z) and back (-Z) edges of the deck
  const parapetH = 0.78;
  const parapetZ = deckWidth * 0.5 - 0.14;
  for (const zSign of [-1, 1]) {
    // Left & right parapet segments with a central firing embrasure
    const segW = (totalDeckW - 1.4) * 0.5;
    for (const xSign of [-1, 1]) {
      ctx.addBevelBox({
        lx: xSign * (totalDeckW * 0.5 - segW * 0.5),
        ly: deckTopY + parapetH * 0.5,
        lz: zSign * parapetZ,
        w: segW,
        h: parapetH,
        d: 0.26,
        bevel: 0.03,
        mat: mainMat,
        collider: true,
        stepable: true,
        exactMinY: true
      });
    }
    // Tubular steel safety rail across the top of the parapet
    const topRail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, totalDeckW - 0.2, 10),
      pal.steelChrome
    );
    topRail.rotation.z = Math.PI * 0.5;
    topRail.position.set(0, deckTopY + parapetH + 0.22, zSign * parapetZ);
    ctx.registerMesh(topRail, false);
    ctx.root.add(topRail);

    for (let px = -totalDeckW * 0.45; px <= totalDeckW * 0.45 + 0.01; px += totalDeckW * 0.3) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.28, 8), pal.steelDark);
      post.position.set(px, deckTopY + parapetH + 0.11, zSign * parapetZ);
      ctx.registerMesh(post, false);
      ctx.root.add(post);
    }
  }

  // Stepable approach staircases on both ends (-X and +X) leading up to deckTopY (2.56m)
  if (withStairs) {
    const treadDepth = 0.56;
    const stairW = Math.min(2.2, deckWidth - 0.5);
    const halfDeckX = totalDeckW * 0.5;

    for (const xDir of [-1, 1]) {
      // Stair stringer side cheeks
      const runLen = stepCount * treadDepth;
      for (const zSide of [-1, 1]) {
        const stringer = new THREE.Mesh(
          createBeveledBox(runLen + 0.2, 0.22, 0.12, 0.025, 2),
          pal.steelDark
        );
        stringer.position.set(
          xDir * (halfDeckX + runLen * 0.5),
          deckTopY * 0.48,
          zSide * (stairW * 0.5 + 0.06)
        );
        stringer.rotation.z = -xDir * Math.atan2(deckTopY, runLen);
        ctx.registerMesh(stringer, false);
        ctx.root.add(stringer);
      }

      for (let s = 1; s <= stepCount; s++) {
        // s = 1 is lowest step (outermost), s = stepCount is highest step (nearest to deck)
        const stepsFromDeck = stepCount - s;
        const stepTopY = s * stepRise;
        const stepX = xDir * (halfDeckX + (stepsFromDeck + 0.5) * treadDepth);
        const boxH = s <= 3 ? stepTopY : 0.32;
        const boxCenterY = stepTopY - boxH * 0.5;

        ctx.addBevelBox({
          lx: stepX,
          ly: boxCenterY,
          lz: 0,
          w: treadDepth + 0.04,
          h: boxH,
          d: stairW,
          bevel: 0.025,
          segments: 2,
          mat: s % 2 === 0 ? pal.stairTread : trimMat,
          collider: true,
          stepable: true,
          exactMinY: s > 3
        });
      }
    }
  }

  ctx.root.updateMatrixWorld(true);
  return ctx.root;
}

/**
 * Helper to build a framed window wall segment with lower sill wall, left/right jambs,
 * upper header lintel, dark steel window frame + mullions, and semi-transparent reflective glass pane.
 */
function addFramedWindowWall(ctx, pal, {
  lx = 0,
  lz = 0,
  length = 6.0,
  height = 3.2,
  thickness = 0.48,
  alongZ = false,
  wallMat,
  trimMat,
  glassMat,
  windowWidth = 2.4,
  sillHeight = 1.04,
  windowHeight = 1.18
}) {
  const rotY = alongZ ? Math.PI * 0.5 : 0;
  const sideW = Math.max(0.45, (length - windowWidth) * 0.5);
  const headerH = Math.max(0.38, height - sillHeight - windowHeight);

  const placePart = (offsetAlong, ly, partW, partH, partD, mat, collider = true, stepable = false, exactMinY = false, worldReg = true) => {
    const px = alongZ ? lx : lx + offsetAlong;
    const pz = alongZ ? lz + offsetAlong : lz;
    return ctx.addBevelBox({
      lx: px,
      ly,
      lz: pz,
      w: partW,
      h: partH,
      d: partD,
      bevel: 0.035,
      segments: 3,
      mat,
      ry: rotY,
      collider,
      stepable,
      exactMinY,
      worldRegister: worldReg
    });
  };

  // Left & Right full-height pier jambs
  const pierOffset = windowWidth * 0.5 + sideW * 0.5;
  placePart(-pierOffset, height * 0.5, sideW, height, thickness, wallMat, true, false, false);
  placePart(pierOffset, height * 0.5, sideW, height, thickness, wallMat, true, false, false);

  // Lower sill wall below window (stepable/vaultable cover)
  placePart(0, sillHeight * 0.5, windowWidth, sillHeight, thickness, wallMat, true, true, false);
  // Beveled window sill ledge
  placePart(0, sillHeight + 0.04, windowWidth + 0.16, 0.1, thickness + 0.12, trimMat, false, false, true, false);

  // Overhead window lintel header (exactMinY so nobody hits their head)
  placePart(0, sillHeight + windowHeight + headerH * 0.5, windowWidth, headerH, thickness, wallMat, true, false, true);

  // Dark steel window frame + vertical & horizontal mullions
  const winCenterY = sillHeight + windowHeight * 0.5;
  placePart(0, winCenterY, 0.07, windowHeight, 0.1, pal.steelDark, false, false, true, false);
  placePart(0, winCenterY, windowWidth, 0.06, 0.1, pal.steelDark, false, false, true, false);

  // Semi-transparent reflective glass pane (visual only so players can shoot/see through!)
  placePart(0, winCenterY, windowWidth - 0.08, windowHeight - 0.08, 0.04, glassMat || pal.windowGlass, false, false, true, false);
}

/**
 * Helper to build a wall with a wide walkable doorway opening (`doorWidth: 2.3m`, `doorHeight: 2.34m`).
 */
function addDoorwayWall(ctx, pal, {
  lx = 0,
  lz = 0,
  length = 7.2,
  height = 3.2,
  thickness = 0.5,
  alongZ = false,
  wallMat,
  trimMat,
  doorWidth = 2.35,
  doorHeight = 2.34
}) {
  const rotY = alongZ ? Math.PI * 0.5 : 0;
  const sideW = Math.max(0.5, (length - doorWidth) * 0.5);
  const lintelH = Math.max(0.36, height - doorHeight);

  const placePart = (offsetAlong, ly, partW, partH, partD, mat, collider = true, exactMinY = false, worldReg = true) => {
    const px = alongZ ? lx : lx + offsetAlong;
    const pz = alongZ ? lz + offsetAlong : lz;
    return ctx.addBevelBox({
      lx: px,
      ly,
      lz: pz,
      w: partW,
      h: partH,
      d: partD,
      bevel: 0.038,
      segments: 3,
      mat,
      ry: rotY,
      collider,
      stepable: false,
      exactMinY,
      worldRegister: worldReg
    });
  };

  const pierOffset = doorWidth * 0.5 + sideW * 0.5;
  placePart(-pierOffset, height * 0.5, sideW, height, thickness, wallMat, true, false);
  placePart(pierOffset, height * 0.5, sideW, height, thickness, wallMat, true, false);

  // Overhead doorway lintel (exactMinY = 2.34m > 1.7m player height so players walk through freely!)
  placePart(0, doorHeight + lintelH * 0.5, doorWidth + 0.1, lintelH, thickness, wallMat, true, true);

  // Beveled steel/stone doorway jamb pilasters & header trim
  placePart(-doorWidth * 0.5 + 0.06, doorHeight * 0.5, 0.14, doorHeight, thickness + 0.1, trimMat, false, true, false);
  placePart(doorWidth * 0.5 - 0.06, doorHeight * 0.5, 0.14, doorHeight, thickness + 0.1, trimMat, false, true, false);
  placePart(0, doorHeight + 0.06, doorWidth + 0.24, 0.14, thickness + 0.14, trimMat, false, true, false);
}

/**
 * Helper to add a tubular steel safety railing segment along X or Z at height `deckY`.
 */
function addSafetyRailing(ctx, pal, {
  lx = 0,
  deckY = 2.56,
  lz = 0,
  length = 4.0,
  alongZ = false,
  height = 0.96,
  withCollider = true
}) {
  const rotY = alongZ ? Math.PI * 0.5 : 0;
  const g = new THREE.Group();
  g.position.set(lx, deckY, lz);
  g.rotation.y = rotY;

  // Top & mid horizontal tubular rails
  const topRail = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, length, 10), pal.steelChrome);
  topRail.rotation.z = Math.PI * 0.5;
  topRail.position.set(0, height, 0);

  const midRail = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, length, 8), pal.steel);
  midRail.rotation.z = Math.PI * 0.5;
  midRail.position.set(0, height * 0.52, 0);

  // Bottom kickplate
  const kickplate = new THREE.Mesh(createBeveledBox(length, 0.16, 0.08, 0.02, 2), pal.steelDark);
  kickplate.position.set(0, 0.08, 0);
  g.add(topRail, midRail, kickplate);

  const postCount = Math.max(2, Math.round(length / 1.45) + 1);
  for (let i = 0; i < postCount; i++) {
    const px = -length * 0.5 + (i / (postCount - 1)) * length;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.044, height + 0.04, 10), pal.steelDark);
    post.position.set(px, height * 0.5, 0);
    g.add(post);
  }

  g.traverse((m) => {
    if (m.isMesh) ctx.registerMesh(m, false);
  });
  ctx.root.add(g);

  if (withCollider) {
    ctx.addBevelBox({
      lx,
      ly: deckY + 0.34,
      lz,
      w: alongZ ? 0.18 : length,
      h: 0.68,
      d: alongZ ? length : 0.18,
      bevel: 0.02,
      mat: pal.steelDark,
      collider: true,
      stepable: true,
      exactMinY: true,
      worldRegister: false
    });
  }
}

/**
 * Helper to add a real 8-step walkable staircase along the +X (or -X) side of a building,
 * leading from ground (`0m`) at `+Z` up to `deckTopY = 2.56m` at `-Z`, with an upper landing bridge
 * connecting seamlessly onto the 2nd floor / roof deck!
 */
function addBuildingStaircaseBay(ctx, pal, {
  stairX = 3.85,
  startZ = 2.0,
  dirZ = -1,
  stepCount = 8,
  stepRise = 0.32,
  treadDepth = 0.55,
  stairWidth = 1.44,
  trimMat
}) {
  const deckTopY = stepCount * stepRise; // 2.56m
  const runLength = stepCount * treadDepth;

  // Outer staircase safety railing & stringer beam
  const outerX = stairX + (stairX >= 0 ? 1 : -1) * (stairWidth * 0.5 + 0.08);
  const midZ = startZ + dirZ * (runLength * 0.5);
  const stringer = new THREE.Mesh(
    createBeveledBox(0.14, 0.26, runLength + 0.35, 0.025, 2),
    pal.steelDark
  );
  stringer.position.set(outerX, deckTopY * 0.48, midZ);
  stringer.rotation.x = dirZ * Math.atan2(deckTopY, runLength);
  ctx.registerMesh(stringer, false);
  ctx.root.add(stringer);

  // Slanted tubular handrail along outer stair edge
  const railTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, Math.hypot(runLength, deckTopY), 10),
    pal.steelChrome
  );
  railTube.position.set(outerX, deckTopY * 0.5 + 0.86, midZ);
  railTube.rotation.x = dirZ * Math.atan2(deckTopY, runLength) + Math.PI * 0.5;
  ctx.registerMesh(railTube, false);
  ctx.root.add(railTube);

  for (let s = 1; s <= stepCount; s++) {
    const stepTopY = s * stepRise;
    const stepZ = startZ + dirZ * ((s - 0.5) * treadDepth);
    const boxH = s <= 3 ? stepTopY : 0.30;
    const boxCenterY = stepTopY - boxH * 0.5;

    ctx.addBevelBox({
      lx: stairX,
      ly: boxCenterY,
      lz: stepZ,
      w: stairWidth,
      h: boxH,
      d: treadDepth + 0.04,
      bevel: 0.025,
      segments: 2,
      mat: s % 2 === 0 ? pal.stairTread : (trimMat || pal.concreteDark),
      collider: true,
      stepable: true,
      exactMinY: s > 3
    });
  }

  // Top landing platform at deckTopY (2.56m) connecting stair top to the 2nd floor deck
  const landingZ = startZ + dirZ * (runLength + 0.62);
  ctx.addBevelBox({
    lx: stairX,
    ly: deckTopY - 0.14,
    lz: landingZ,
    w: stairWidth + 0.18,
    h: 0.28,
    d: 1.32,
    bevel: 0.035,
    mat: trimMat || pal.stairTread,
    collider: true,
    stepable: true,
    exactMinY: true
  });

  // Safety rail around the back & outer side of the top landing
  addSafetyRailing(ctx, pal, {
    lx: stairX,
    deckY: deckTopY,
    lz: landingZ + dirZ * 0.62,
    length: stairWidth + 0.16,
    alongZ: false,
    height: 0.92,
    withCollider: true
  });
}

/**
 * 3. Multi-Story Enterable Buildings with Walkable Interiors & Stairs (`addDetailedBuilding`)
 * Supports building types: `'harborOffice'`, `'guardTower'`, `'desertHouse'`, `'desertFort'`, `'alpineCabin'`, `'radarBunker'`.
 * Supports both `(group, worldMeshes, colliders, options)` AND legacy `(group, worldMeshes, colliders, terrainHeightFn, spec, mats, castShadows)` signatures!
 * Returns `{ radarDish, animatedScreens, group }` for map update loop.
 */
export function addDetailedBuilding(
  group,
  worldMeshes,
  colliders,
  arg4 = {},
  arg5 = {},
  arg6 = {},
  arg7 = true,
  arg8 = 'balanced',
  arg9 = null
) {
  let opts;
  if (typeof arg4 === 'function') {
    opts = {
      ...arg5,
      terrainHeightFn: arg4,
      mats: arg6,
      castShadows: arg7,
      quality: arg8,
      textureLib: arg9
    };
  } else {
    opts = arg4 || {};
  }

  const {
    type = 'harborOffice',
    x = 0,
    y = undefined,
    z = 0,
    yaw = 0,
    terrainHeightFn = null,
    textureLib = null,
    quality = 'balanced',
    castShadows = true
  } = opts;

  const baseY = y !== undefined ? y : (typeof terrainHeightFn === 'function' ? terrainHeightFn(x, z) : 0);
  const pal = getArchitecturePalette(textureLib, quality);
  const ctx = createBuilderContext(group, worldMeshes, colliders, {
    x,
    y: baseY,
    z,
    yaw,
    castShadows
  });

  let radarDish = null;
  const animatedScreens = [];

  // Shared constants so every building has a 100% walkable ground floor + 8-step staircase + 2nd floor deck
  const deckTopY = 2.56; // 8 steps * 0.32m = 2.56m
  const slabThickness = 0.26; // Underside at 2.30m (> 1.7m player height)
  const wallH = 2.56;

  // Choose theme materials per building type
  let wallMat = pal.concreteWall;
  let trimMat = pal.steelDark;
  let glassMat = pal.windowGlass;
  let accentHex = '#38bdf8';
  let termTitle = 'PORT-CTRL // NODE';

  if (type === 'desertHouse' || type === 'desertFort') {
    wallMat = pal.sandstone;
    trimMat = pal.sandstoneTrim;
    glassMat = pal.warmWindowGlass;
    accentHex = '#f59e0b';
    termTitle = type === 'desertFort' ? 'CITADEL // DEF-NET' : 'OUTPOST // COMMS';
  } else if (type === 'alpineCabin') {
    wallMat = pal.darkWood;
    trimMat = pal.mossyStone;
    glassMat = pal.warmWindowGlass;
    accentHex = '#fbbf24';
    termTitle = 'ALPINE // THERMAL';
  } else if (type === 'radarBunker') {
    wallMat = pal.concreteWall;
    trimMat = pal.steelDark;
    glassMat = pal.windowGlass;
    accentHex = '#10b981';
    termTitle = 'RADAR // DEEP-SCAN';
  } else if (type === 'guardTower') {
    wallMat = pal.concreteWall;
    trimMat = pal.steelDark;
    glassMat = pal.windowGlass;
    accentHex = '#38bdf8';
    termTitle = 'OVERWATCH // TOWER';
  } else if (type === 'portWarehouse') {
    wallMat = pal.steel;
    trimMat = pal.steelDark;
    glassMat = pal.windowGlass;
    accentHex = '#f59e0b';
    termTitle = 'CARGO BAY // LOGISTICS';
  }

  // Room dimensions tailored per building type (leaving center (0,0,0) open & walkable)
  const roomW = type === 'guardTower' ? 4.8
    : type === 'portWarehouse' ? 8.8
    : type === 'desertFort' ? 6.0
    : type === 'alpineCabin' ? 6.8
    : type === 'radarBunker' ? 6.8
    : 7.4;

  const roomD = type === 'guardTower' ? 5.2
    : type === 'portWarehouse' ? 6.6
    : type === 'alpineCabin' ? 5.6
    : type === 'radarBunker' ? 5.6
    : 6.0;

  const halfW = roomW * 0.5;
  const halfD = roomD * 0.5;
  const wallT = 0.44;

  // 1. Ground Floor Perimeter Beveled Walls (with wide walkable doorways & framed windows)
  // Front wall (+Z): Wide walkable main entrance doorway
  addDoorwayWall(ctx, pal, {
    lx: 0,
    lz: halfD,
    length: roomW + wallT,
    height: wallH,
    thickness: wallT,
    alongZ: false,
    wallMat,
    trimMat,
    doorWidth: type === 'portWarehouse' ? 2.9 : 2.35,
    doorHeight: 2.30
  });

  // Back wall (-Z): Secondary walkable doorway on radarBunker/harborOffice/guardTower/portWarehouse, or framed window wall
  if (type === 'radarBunker' || type === 'harborOffice' || type === 'guardTower' || type === 'portWarehouse') {
    addDoorwayWall(ctx, pal, {
      lx: 0,
      lz: -halfD,
      length: roomW + wallT,
      height: wallH,
      thickness: wallT,
      alongZ: false,
      wallMat,
      trimMat,
      doorWidth: 2.25,
      doorHeight: 2.30
    });
  } else {
    addFramedWindowWall(ctx, pal, {
      lx: 0,
      lz: -halfD,
      length: roomW + wallT,
      height: wallH,
      thickness: wallT,
      alongZ: false,
      wallMat,
      trimMat,
      glassMat,
      windowWidth: 2.4,
      sillHeight: 1.0,
      windowHeight: 1.12
    });
  }

  // Left wall (-X): Framed window opening with reflective glass pane
  addFramedWindowWall(ctx, pal, {
    lx: -halfW,
    lz: 0,
    length: roomD - wallT,
    height: wallH,
    thickness: wallT,
    alongZ: true,
    wallMat,
    trimMat,
    glassMat,
    windowWidth: Math.min(2.3, roomD - 1.8),
    sillHeight: 1.0,
    windowHeight: 1.12
  });

  // Right wall (+X): Secondary doorway + framed observation slit adjacent to the staircase bay
  addDoorwayWall(ctx, pal, {
    lx: halfW,
    lz: 0,
    length: roomD - wallT,
    height: wallH,
    thickness: wallT,
    alongZ: true,
    wallMat,
    trimMat,
    doorWidth: 2.0,
    doorHeight: 2.30
  });

  // 2. Second Floor / Roof Deck Slab (exactMinY: true so ground floor is 100% walkable underneath!)
  ctx.addBevelBox({
    lx: 0,
    ly: deckTopY - slabThickness * 0.5,
    lz: 0,
    w: roomW + wallT * 1.4,
    h: slabThickness,
    d: roomD + wallT * 1.4,
    bevel: 0.04,
    mat: trimMat,
    collider: true,
    stepable: true,
    exactMinY: true
  });

  // 3. Real 8-Step Walkable Staircase along the +X side leading onto the 2nd floor / roof deck!
  const stairBayX = halfW + wallT * 0.5 + 0.78;
  addBuildingStaircaseBay(ctx, pal, {
    stairX: stairBayX,
    startZ: halfD - 0.25,
    dirZ: -1,
    stepCount: 8,
    stepRise: 0.32,
    treadDepth: 0.55,
    stairWidth: 1.42,
    trimMat
  });

  // 4. Interior Ceiling Light Fixtures on the underside of the 2nd floor slab (ly = 2.26m)
  for (const lxLight of [-roomW * 0.24, roomW * 0.24]) {
    const housing = new THREE.Mesh(createBeveledBox(1.1, 0.08, 0.28, 0.02, 2), pal.steelDark);
    housing.position.set(lxLight, deckTopY - slabThickness - 0.04, 0);
    const diffuser = new THREE.Mesh(
      createBeveledBox(0.96, 0.05, 0.18, 0.015, 2),
      type === 'desertHouse' || type === 'alpineCabin' ? pal.warmLightBar : pal.coolLightBar
    );
    diffuser.position.set(lxLight, deckTopY - slabThickness - 0.07, 0);
    ctx.registerMesh(housing, false);
    ctx.registerMesh(diffuser, false);
    ctx.root.add(housing, diffuser);
  }

  // 5. Interior 3D Control Terminal against the interior left-rear wall (keeping (0,0,0) open!)
  const termLocalX = -halfW + 0.62;
  const termLocalZ = -halfD + 0.85;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const termWorldX = x + termLocalX * cos + termLocalZ * sin;
  const termWorldZ = z - termLocalX * sin + termLocalZ * cos;
  const termRes = addControlTerminal3D(group, worldMeshes, colliders, {
    x: termWorldX,
    y: baseY,
    z: termWorldZ,
    yaw: yaw + Math.PI * 0.25,
    title: termTitle,
    lines: [
      `BLDG: ${type.toUpperCase()}`,
      'STAIR ACCESS: 2ND DECK',
      'DEFENSE GRID: ONLINE'
    ],
    accentHex,
    quality,
    castShadows,
    textureLib,
    hasCollider: false
  });
  if (termRes?.screenMesh) animatedScreens.push(termRes.screenMesh);

  // Exterior Door Display Panel beside the front entrance doorway
  const doorPanelLocalX = 1.62;
  const doorPanelLocalZ = halfD + wallT * 0.5 + 0.06;
  const dpWorldX = x + doorPanelLocalX * cos + doorPanelLocalZ * sin;
  const dpWorldZ = z - doorPanelLocalX * sin + doorPanelLocalZ * cos;
  const dpRes = addDoorDisplayPanel3D(group, worldMeshes, colliders, {
    x: dpWorldX,
    y: baseY + 1.35,
    z: dpWorldZ,
    yaw,
    title: 'SECTOR ACCESS',
    statusText: 'OPEN // CLEAR',
    accentHex,
    quality,
    castShadows,
    textureLib
  });
  if (dpRes?.screenMesh) animatedScreens.push(dpRes.screenMesh);

  // 6. Second-Floor / Roof Parapet Walls, Tubular Steel Safety Railings & Type-Specific Superstructures
  const parapetH = 0.82;
  // Front roof parapet (+Z) with central firing cutout + tubular safety rail
  for (const xSign of [-1, 1]) {
    ctx.addBevelBox({
      lx: xSign * (halfW * 0.62),
      ly: deckTopY + parapetH * 0.5,
      lz: halfD,
      w: roomW * 0.36,
      h: parapetH,
      d: 0.32,
      bevel: 0.03,
      mat: wallMat,
      collider: true,
      stepable: true,
      exactMinY: true
    });
  }
  addSafetyRailing(ctx, pal, {
    lx: 0,
    deckY: deckTopY,
    lz: halfD,
    length: roomW * 0.32,
    alongZ: false,
    height: 0.92,
    withCollider: false
  });

  // Left roof safety railing (-X)
  addSafetyRailing(ctx, pal, {
    lx: -halfW,
    deckY: deckTopY,
    lz: 0,
    length: roomD - 0.3,
    alongZ: true,
    height: 0.96,
    withCollider: true
  });

  // Back roof parapet (-Z)
  ctx.addBevelBox({
    lx: -0.6,
    ly: deckTopY + parapetH * 0.5,
    lz: -halfD,
    w: roomW - 1.2,
    h: parapetH,
    d: 0.32,
    bevel: 0.03,
    mat: wallMat,
    collider: true,
    stepable: true,
    exactMinY: true
  });

  // Right roof railing (+X) on the front half (leaving the rear landing open for the staircase entry!)
  addSafetyRailing(ctx, pal, {
    lx: halfW,
    deckY: deckTopY,
    lz: halfD * 0.45,
    length: roomD * 0.48,
    alongZ: true,
    height: 0.96,
    withCollider: true
  });

  // Type-specific Roof Superstructures & Architectural Features
  if (type === 'harborOffice') {
    // Upper Harbor Control Pergola Canopy + HVAC Chiller Unit + Solar Array
    const hvacX = -halfW + 1.25;
    const hvacZ = -halfD + 1.15;
    ctx.addBevelBox({
      lx: hvacX,
      ly: deckTopY + 0.52,
      lz: hvacZ,
      w: 1.55,
      h: 1.04,
      d: 1.25,
      bevel: 0.04,
      mat: pal.steel,
      collider: true,
      stepable: true,
      exactMinY: true
    });
    const fanShroud = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.16, 16), pal.steelDark);
    fanShroud.position.set(hvacX, deckTopY + 1.08, hvacZ);
    ctx.registerMesh(fanShroud, false);
    ctx.root.add(fanShroud);

    // Angled rooftop solar panel array
    const solarPanel = new THREE.Mesh(createBeveledBox(2.2, 0.08, 1.2, 0.02, 2), pal.solarCell);
    solarPanel.position.set(1.1, deckTopY + 0.68, -halfD + 1.05);
    solarPanel.rotation.x = 0.38;
    ctx.registerMesh(solarPanel, false);
    ctx.root.add(solarPanel);

    // Front entrance cantilevered steel canopy
    ctx.addBevelBox({
      lx: 0,
      ly: 2.46,
      lz: halfD + 0.95,
      w: 3.4,
      h: 0.16,
      d: 1.45,
      bevel: 0.025,
      mat: pal.steelDark,
      collider: false
    });
  } else if (type === 'guardTower') {
    // Second-floor Overwatch Cabin with 4 corner steel posts & high canopy roof (minY = 4.95m > 2.56m + 1.7m!)
    const cabH = 2.45;
    for (const [cx, cz] of [[-1.65, -1.65], [1.65, -1.65], [-1.65, 1.65], [1.65, 1.65]]) {
      ctx.addBevelBox({
        lx: cx,
        ly: deckTopY + cabH * 0.5,
        lz: cz,
        w: 0.28,
        h: cabH,
        d: 0.28,
        bevel: 0.025,
        mat: pal.steelDark,
        collider: false
      });
    }
    // Overwatch cabin canopy roof + rotating dish on top
    ctx.addBevelBox({
      lx: 0,
      ly: deckTopY + cabH + 0.16,
      lz: 0,
      w: 3.9,
      h: 0.32,
      d: 3.9,
      bevel: 0.04,
      mat: pal.steelDark,
      collider: false
    });
    const searchlight = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.42, 12), pal.warmLightBar);
    searchlight.rotation.x = Math.PI * 0.4;
    searchlight.position.set(0, deckTopY + cabH + 0.05, 1.98);
    ctx.registerMesh(searchlight, false);
    ctx.root.add(searchlight);
  } else if (type === 'desertHouse') {
    // Slanted crimson sun awning over the front doorway + classical sandstone columns + rooftop pergola
    const awning = new THREE.Mesh(createBeveledBox(3.8, 0.14, 1.65, 0.03, 2), pal.crimsonPaint);
    awning.position.set(0, 2.42, halfD + 0.92);
    awning.rotation.x = 0.24;
    ctx.registerMesh(awning, false);
    ctx.root.add(awning);

    // Rooftop solar water heater tank & collector panel
    const waterTank = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.35, 14), pal.steelChrome);
    waterTank.rotation.z = Math.PI * 0.5;
    waterTank.position.set(-halfW + 1.35, deckTopY + 0.88, -halfD + 1.0);
    const collector = new THREE.Mesh(createBeveledBox(1.5, 0.08, 1.1, 0.02, 2), pal.solarCell);
    collector.position.set(-halfW + 1.35, deckTopY + 0.48, -halfD + 1.45);
    collector.rotation.x = 0.42;
    ctx.registerMesh(waterTank, false);
    ctx.registerMesh(collector, false);
    ctx.root.add(waterTank, collector);
  } else if (type === 'desertFort') {
    // Castle-style crenellated battlements (beveled merlons around the roof parapet) + corner watch turret
    for (let mx = -halfW + 0.6; mx <= halfW - 0.6; mx += 1.35) {
      ctx.addBevelBox({
        lx: mx,
        ly: deckTopY + parapetH + 0.28,
        lz: -halfD,
        w: 0.62,
        h: 0.52,
        d: 0.36,
        bevel: 0.03,
        mat: pal.sandstoneTrim,
        collider: false
      });
    }
    // Corner watch turret drum on (-halfW, -halfD)
    const turret = new THREE.Mesh(
      createFlutedCylinder(0.75, 0.82, 1.45, 16, 4, 10, 0.015),
      pal.sandstoneTrim
    );
    turret.position.set(-halfW + 0.95, deckTopY + 0.72, -halfD + 0.95);
    ctx.registerMesh(turret, true);
    ctx.root.add(turret);
  } else if (type === 'alpineCabin') {
    // Stone & brick chimney stack on the rear corner + high timber gable roof shelter over the left half of deck
    const chimX = -halfW + 0.85;
    const chimZ = -halfD + 0.85;
    ctx.addBevelBox({
      lx: chimX,
      ly: deckTopY + 1.35,
      lz: chimZ,
      w: 0.92,
      h: 2.7,
      d: 0.92,
      bevel: 0.04,
      mat: pal.mossyStone,
      collider: true,
      stepable: false,
      exactMinY: true
    });
    // Snow-capped chimney crown
    ctx.addBevelBox({
      lx: chimX,
      ly: deckTopY + 2.78,
      lz: chimZ,
      w: 1.12,
      h: 0.22,
      d: 1.12,
      bevel: 0.03,
      mat: pal.snowCap,
      collider: false
    });
  } else if (type === 'radarBunker') {
    // Reinforced armored roof pedestal + Rotating 3D Parabolic Radar Dish Assembly!
    const pedX = -halfW + 1.45;
    const pedZ = -halfD + 1.35;
    ctx.addBevelBox({
      lx: pedX,
      ly: deckTopY + 0.48,
      lz: pedZ,
      w: 1.45,
      h: 0.96,
      d: 1.45,
      bevel: 0.045,
      mat: pal.steelDark,
      collider: true,
      stepable: true,
      exactMinY: true
    });

    const mast = new THREE.Mesh(
      createFlutedCylinder(0.22, 0.30, 1.45, 16, 4, 8, 0.012),
      pal.steel
    );
    mast.position.set(pedX, deckTopY + 1.55, pedZ);
    ctx.registerMesh(mast, false);
    ctx.root.add(mast);

    // Rotating radar pivot group
    const dishPivot = new THREE.Group();
    dishPivot.position.set(pedX, deckTopY + 2.38, pedZ);

    const yoke = new THREE.Mesh(createBeveledBox(0.55, 0.42, 0.55, 0.03, 2), pal.steelDark);
    const dishShell = new THREE.Mesh(
      new THREE.SphereGeometry(1.18, 16, 12, 0, Math.PI),
      pal.steelChrome
    );
    dishShell.rotation.x = -0.38;
    dishShell.position.set(0, 0.22, 0.18);

    const feedArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.95, 8), pal.steelDark);
    feedArm.rotation.x = Math.PI * 0.5 - 0.38;
    feedArm.position.set(0, 0.42, 0.55);

    const feedBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), pal.ledGreen);
    feedBeacon.position.set(0, 0.62, 0.95);

    dishPivot.add(yoke, dishShell, feedArm, feedBeacon);
    dishPivot.traverse((m) => {
      if (m.isMesh) ctx.registerMesh(m, false);
    });
    ctx.root.add(dishPivot);
    radarDish = dishPivot;
  } else if (type === 'portWarehouse') {
    // Industrial warehouse rooftop cargo hoist I-beam + twin ventilator turbines + loading bay hazard awning
    ctx.addBevelBox({
      lx: 0,
      ly: 2.48,
      lz: halfD + 0.85,
      w: 3.9,
      h: 0.18,
      d: 1.35,
      bevel: 0.03,
      mat: pal.hazardAmber,
      collider: false
    });
    ctx.addBevelBox({
      lx: -halfW + 1.5,
      ly: deckTopY + 0.62,
      lz: -halfD + 1.25,
      w: 2.1,
      h: 1.24,
      d: 1.4,
      bevel: 0.04,
      mat: pal.navalMetal,
      collider: true,
      stepable: true,
      exactMinY: true
    });
    for (const vx of [0.8, 2.2]) {
      const vent = new THREE.Mesh(
        createFlutedCylinder(0.38, 0.34, 0.56, 16, 4, 12, 0.015),
        pal.steelChrome
      );
      vent.position.set(vx, deckTopY + 0.32, -halfD + 1.15);
      ctx.registerMesh(vent, false);
      ctx.root.add(vent);
    }
  }

  ctx.root.updateMatrixWorld(true);
  return {
    radarDish,
    animatedScreens,
    group: ctx.root
  };
}

/**
 * 4A. In-World 3D Control Terminal (`addControlTerminal3D`)
 * - Slanted beveled steel console base, dual side bolsters, recessed 3D bezel frame
 * - High-DPI canvas screen (`createTerminalDisplayTexture`)
 * - Protective clearcoat glass overlay (`MeshPhysicalMaterial` with `opacity: 0.28, transparent: true`)
 * - Illuminated keyboard deck with micro-buttons, and status LEDs.
 */
export function addControlTerminal3D(group, worldMeshes, colliders, {
  x = 0,
  y = 0,
  z = 0,
  yaw = 0,
  title = 'SYS-NODE // COLDBORE',
  subtitle = 'TACTICAL UPLINK ONLINE',
  lines = ['SECTOR STATUS: NOMINAL', 'ARMOR TELEMETRY: SYNCED', 'AMMUNITION BAY: ACTIVE'],
  accentHex = '#38bdf8',
  quality = 'balanced',
  castShadows = true,
  textureLib = null,
  hasCollider = true
} = {}) {
  const pal = getArchitecturePalette(textureLib, quality);
  const ctx = createBuilderContext(group, worldMeshes, colliders, {
    x,
    y,
    z,
    yaw,
    castShadows
  });

  // 1. Beveled steel plinth & slanted console pedestal cabinet
  ctx.addBevelBox({
    lx: 0,
    ly: 0.08,
    lz: 0,
    w: 1.12,
    h: 0.16,
    d: 0.78,
    bevel: 0.03,
    mat: pal.steelDark,
    collider: false
  });
  ctx.addBevelBox({
    lx: 0,
    ly: 0.56,
    lz: -0.04,
    w: 0.98,
    h: 0.86,
    d: 0.58,
    bevel: 0.04,
    mat: pal.steel,
    collider: hasCollider,
    stepable: false
  });

  // 2. Dual armored side bolsters / cheek guards
  for (const xSign of [-1, 1]) {
    ctx.addBevelBox({
      lx: xSign * 0.52,
      ly: 0.78,
      lz: 0,
      w: 0.11,
      h: 1.36,
      d: 0.68,
      bevel: 0.025,
      mat: pal.steelDark,
      collider: false
    });
  }

  // 3. Slanted illuminated keyboard deck with micro-buttons & status LEDs
  const deckGroup = new THREE.Group();
  deckGroup.position.set(0, 0.98, 0.16);
  deckGroup.rotation.x = 0.30;
  ctx.root.add(deckGroup);

  const keyDeck = new THREE.Mesh(createBeveledBox(0.92, 0.1, 0.42, 0.022, 2), pal.steelDark);
  ctx.registerMesh(keyDeck, false);
  deckGroup.add(keyDeck);

  // Micro-buttons matrix
  const btnGeo = createBeveledBox(0.068, 0.028, 0.048, 0.006, 2);
  for (let row = -1; row <= 1; row++) {
    for (let col = -4; col <= 4; col++) {
      const isAccent = (row === -1 && col === 4) || (row === 1 && col === -4);
      const btn = new THREE.Mesh(btnGeo, isAccent ? pal.ledAmber : pal.steelChrome);
      btn.position.set(col * 0.086, 0.058, row * 0.072 + 0.02);
      deckGroup.add(btn);
    }
  }

  // Status LEDs along top of keyboard deck
  const ledGeo = new THREE.SphereGeometry(0.018, 8, 8);
  const ledMats = [pal.ledGreen, pal.ledCyan, pal.ledAmber, pal.ledRed];
  for (let i = 0; i < 4; i++) {
    const led = new THREE.Mesh(ledGeo, ledMats[i]);
    led.position.set(-0.34 + i * 0.08, 0.058, -0.14);
    deckGroup.add(led);
  }

  // 4. Recessed 3D Monitor Bezel Frame + High-DPI Canvas Screen + Protective Clearcoat Glass Overlay
  const monitorGroup = new THREE.Group();
  monitorGroup.position.set(0, 1.28, -0.08);
  monitorGroup.rotation.x = -0.22;
  ctx.root.add(monitorGroup);

  const bezelBack = new THREE.Mesh(createBeveledBox(0.96, 0.58, 0.12, 0.028, 3), pal.steelDark);
  ctx.registerMesh(bezelBack, false);
  monitorGroup.add(bezelBack);

  // Raised 3D bezel frame bars around screen perimeter
  const frameTop = new THREE.Mesh(createBeveledBox(0.98, 0.06, 0.16, 0.015, 2), pal.steel);
  frameTop.position.set(0, 0.27, 0.02);
  const frameBot = new THREE.Mesh(createBeveledBox(0.98, 0.06, 0.16, 0.015, 2), pal.steel);
  frameBot.position.set(0, -0.27, 0.02);
  const frameL = new THREE.Mesh(createBeveledBox(0.06, 0.58, 0.16, 0.015, 2), pal.steel);
  frameL.position.set(-0.46, 0, 0.02);
  const frameR = new THREE.Mesh(createBeveledBox(0.06, 0.58, 0.16, 0.015, 2), pal.steel);
  frameR.position.set(0.46, 0, 0.02);
  monitorGroup.add(frameTop, frameBot, frameL, frameR);

  const screenTex = safeTerminalTexture({ title, subtitle, lines, accentHex });
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: screenTex,
    emissive: 0xffffff,
    emissiveMap: screenTex,
    emissiveIntensity: 0.92,
    roughness: 0.2,
    metalness: 0.1
  });
  const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.46), screenMat);
  screenMesh.position.set(0, 0, 0.064);
  monitorGroup.add(screenMesh);

  // Protective clearcoat glass overlay (`MeshPhysicalMaterial` with `opacity: 0.28, transparent: true`)
  const glassOverlayMat = new THREE.MeshPhysicalMaterial({
    color: 0xdbeafe,
    opacity: 0.28,
    transparent: true,
    roughness: 0.06,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04
  });
  const glassMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.47), glassOverlayMat);
  glassMesh.position.set(0, 0, 0.076);
  monitorGroup.add(glassMesh);

  ctx.root.updateMatrixWorld(true);
  return {
    group: ctx.root,
    screenMesh,
    glassMesh
  };
}

/**
 * 4B. In-World 3D Med/Ammo Resupply Station (`addMedAmmoStation3D`)
 * Wall/floor-mounted armored resupply cabinet with beveled frame, 3D medical cross emblem,
 * ammo cases, glowing telemetry screen, and floor halo pad.
 */
export function addMedAmmoStation3D(group, worldMeshes, colliders, {
  x = 0,
  y = 0,
  z = 0,
  yaw = 0,
  quality = 'balanced',
  castShadows = true,
  textureLib = null,
  hasCollider = false
} = {}) {
  const pal = getArchitecturePalette(textureLib, quality);
  const ctx = createBuilderContext(group, worldMeshes, colliders, {
    x,
    y,
    z,
    yaw,
    castShadows
  });

  // 1. Beveled octagonal/square floor halo pad at (0, 0, 0) where the player steps to resupply
  ctx.addBevelBox({
    lx: 0,
    ly: 0.04,
    lz: 0,
    w: 1.56,
    h: 0.08,
    d: 1.56,
    bevel: 0.025,
    mat: pal.steelDark,
    collider: false,
    worldRegister: false
  });
  const haloStripGeo = createBeveledBox(1.36, 0.025, 0.08, 0.008, 2);
  for (const zSign of [-1, 1]) {
    const strip = new THREE.Mesh(haloStripGeo, pal.ledGreen);
    strip.position.set(0, 0.082, zSign * 0.64);
    ctx.root.add(strip);
  }

  // 2. Armored Resupply Cabinet offset behind the pad (lz = -0.68) so pad center remains 100% walkable
  const cabZ = -0.68;
  ctx.addBevelBox({
    lx: 0,
    ly: 0.94,
    lz: cabZ - 0.18,
    w: 1.44,
    h: 1.88,
    d: 0.16,
    bevel: 0.03,
    mat: pal.steelDark,
    collider: hasCollider,
    stepable: false
  });
  // Left, Right, Top, Bottom & Middle shelf dividers
  ctx.addBevelBox({ lx: -0.66, ly: 0.94, lz: cabZ, w: 0.12, h: 1.88, d: 0.42, bevel: 0.025, mat: pal.steel, collider: false });
  ctx.addBevelBox({ lx: 0.66, ly: 0.94, lz: cabZ, w: 0.12, h: 1.88, d: 0.42, bevel: 0.025, mat: pal.steel, collider: false });
  ctx.addBevelBox({ lx: 0, ly: 1.82, lz: cabZ, w: 1.46, h: 0.14, d: 0.46, bevel: 0.025, mat: pal.steel, collider: false });
  ctx.addBevelBox({ lx: 0, ly: 0.92, lz: cabZ, w: 1.24, h: 0.09, d: 0.38, bevel: 0.02, mat: pal.steelDark, collider: false });

  // 3. 3D Medical Cross Emblem & Trauma Kit on Left Bay
  ctx.addBevelBox({
    lx: -0.34,
    ly: 1.36,
    lz: cabZ - 0.02,
    w: 0.44,
    h: 0.44,
    d: 0.16,
    bevel: 0.025,
    mat: pal.marble,
    collider: false
  });
  const crossH = new THREE.Mesh(createBeveledBox(0.28, 0.09, 0.06, 0.012, 2), pal.emeraldPaint);
  crossH.position.set(-0.34, 1.36, cabZ + 0.07);
  const crossV = new THREE.Mesh(createBeveledBox(0.09, 0.28, 0.06, 0.012, 2), pal.emeraldPaint);
  crossV.position.set(-0.34, 1.36, cabZ + 0.07);
  ctx.root.add(crossH, crossV);

  // 4. Heavy Ballistic Ammo Cases on Right & Lower Bays
  ctx.addBevelBox({
    lx: 0.28,
    ly: 1.14,
    lz: cabZ,
    w: 0.48,
    h: 0.28,
    d: 0.30,
    bevel: 0.025,
    mat: pal.armorOlive,
    collider: false
  });
  ctx.addBevelBox({
    lx: 0.24,
    ly: 0.52,
    lz: cabZ,
    w: 0.56,
    h: 0.34,
    d: 0.32,
    bevel: 0.025,
    mat: pal.armorOlive,
    collider: false
  });
  ctx.addBevelBox({
    lx: -0.32,
    ly: 0.50,
    lz: cabZ,
    w: 0.42,
    h: 0.30,
    d: 0.28,
    bevel: 0.025,
    mat: pal.crimsonPaint,
    collider: false
  });

  // 5. Glowing Telemetry Screen + Clearcoat Glass Overlay on Upper Right Bay
  const screenTex = safeTerminalTexture({
    title: 'RESUPPLY // BAY',
    subtitle: 'MED + AMMO READY',
    lines: ['TRAUMA GEL: 100%', '7.62 / 5.56: FULL'],
    accentHex: '#22c55e'
  });
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: screenTex,
    emissive: 0xffffff,
    emissiveMap: screenTex,
    emissiveIntensity: 0.88
  });
  const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.28), screenMat);
  screenMesh.position.set(0.26, 1.52, cabZ + 0.08);
  const glassMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.30), pal.clearcoatScreenGlass);
  glassMesh.position.set(0.26, 1.52, cabZ + 0.09);
  ctx.root.add(screenMesh, glassMesh);

  ctx.root.updateMatrixWorld(true);
  return {
    group: ctx.root,
    screenMesh
  };
}

/**
 * 4C. In-World 3D Door Display & Access Control Panel (`addDoorDisplayPanel3D`)
 */
export function addDoorDisplayPanel3D(group, worldMeshes, colliders, {
  x = 0,
  y = 1.35,
  z = 0,
  yaw = 0,
  title = 'SECTOR ACCESS',
  statusText = 'UNLOCKED // CLEAR',
  accentHex = '#38bdf8',
  quality = 'balanced',
  castShadows = true,
  textureLib = null
} = {}) {
  const pal = getArchitecturePalette(textureLib, quality);
  const root = new THREE.Group();
  root.position.set(x, y, z);
  root.rotation.y = yaw;
  group.add(root);

  const chassis = new THREE.Mesh(createBeveledBox(0.46, 0.64, 0.1, 0.02, 2), pal.steelDark);
  chassis.castShadow = castShadows;
  root.add(chassis);

  const screenTex = safeTerminalTexture({
    title,
    subtitle: statusText,
    lines: ['AUTH: BIOMETRIC', 'SEAL: NOMINAL'],
    accentHex
  });
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: screenTex,
    emissive: 0xffffff,
    emissiveMap: screenTex,
    emissiveIntensity: 0.85
  });
  const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.22), screenMat);
  screenMesh.position.set(0, 0.14, 0.054);

  const glassMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.24), pal.clearcoatScreenGlass);
  glassMesh.position.set(0, 0.14, 0.062);
  root.add(screenMesh, glassMesh);

  // Keypad buttons + status LED
  const keyGeo = createBeveledBox(0.065, 0.045, 0.025, 0.006, 2);
  for (let r = 0; r < 3; r++) {
    for (let c = -1; c <= 1; c++) {
      const k = new THREE.Mesh(keyGeo, pal.steelChrome);
      k.position.set(c * 0.09, -0.06 - r * 0.065, 0.055);
      root.add(k);
    }
  }
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), pal.ledGreen);
  led.position.set(0.14, -0.25, 0.058);
  root.add(led);

  root.updateMatrixWorld(true);
  return { group: root, screenMesh };
}

/**
 * 5A. High-Detail Beveled Military Crate (`addMilitaryCrate`)
 * Built with beveled planks, overhanging reinforced lid, skid pallet runners, corner brackets & latches.
 */
export function addMilitaryCrate(group, worldMeshes, colliders, {
  x = 0,
  y = undefined,
  z = 0,
  w = 2.2,
  h = 1.45,
  d = 2.2,
  yaw = 0,
  variant = 'wood',
  stepable = true,
  quality = 'balanced',
  castShadows = true,
  textureLib = null,
  terrainHeightFn = null
} = {}) {
  const baseY = y !== undefined ? y : (typeof terrainHeightFn === 'function' ? terrainHeightFn(x, z) : 0);
  const pal = getArchitecturePalette(textureLib, quality);
  const mainMat = variant === 'olive' ? pal.armorOlive
    : variant === 'steel' ? pal.steel
    : pal.crateWood;
  const bracketMat = pal.steelDark;

  const ctx = createBuilderContext(group, worldMeshes, colliders, {
    x,
    y: baseY,
    z,
    yaw,
    castShadows
  });

  // Base pallet skids
  const skidH = Math.min(0.14, h * 0.1);
  for (const xSign of [-1, 1]) {
    ctx.addBevelBox({
      lx: xSign * (w * 0.34),
      ly: skidH * 0.5,
      lz: 0,
      w: w * 0.22,
      h: skidH,
      d: d * 0.96,
      bevel: 0.02,
      mat: bracketMat,
      collider: false,
      worldRegister: false
    });
  }

  // Main beveled crate body (registers exact AABB collider)
  ctx.addBevelBox({
    lx: 0,
    ly: h * 0.5,
    lz: 0,
    w: w * 0.94,
    h: h * 0.86,
    d: d * 0.94,
    bevel: 0.045,
    segments: 3,
    mat: mainMat,
    collider: true,
    stepable
  });

  // Overhanging beveled lid
  const lidH = Math.max(0.14, h * 0.14);
  ctx.addBevelBox({
    lx: 0,
    ly: h - lidH * 0.5,
    lz: 0,
    w: w,
    h: lidH,
    d: d,
    bevel: 0.035,
    segments: 3,
    mat: mainMat,
    collider: false
  });

  // Vertical corner reinforcement bumpers & side diagonal battens
  const postW = Math.min(0.16, w * 0.09);
  const ox = w * 0.47;
  const oz = d * 0.47;
  for (const [cx, cz] of [[-ox, -oz], [ox, -oz], [-ox, oz], [ox, oz]]) {
    ctx.addBevelBox({
      lx: cx,
      ly: h * 0.48,
      lz: cz,
      w: postW,
      h: h * 0.88,
      d: postW,
      bevel: 0.02,
      mat: bracketMat,
      collider: false,
      worldRegister: false
    });
  }

  // Side latch clasps
  for (const zSign of [-1, 1]) {
    ctx.addBevelBox({
      lx: 0,
      ly: h * 0.52,
      lz: zSign * (d * 0.48),
      w: w * 0.68,
      h: 0.12,
      d: 0.06,
      bevel: 0.015,
      mat: bracketMat,
      collider: false,
      worldRegister: false
    });
  }

  ctx.root.updateMatrixWorld(true);
  return ctx.root;
}

/**
 * 5B. Ribbed Barrel Cluster (`addRibbedBarrelCluster`)
 * Cluster of 200L fluted/ribbed steel drums with torus rolling hoops and bung plugs on a beveled spill pallet.
 */
export function addRibbedBarrelCluster(group, worldMeshes, colliders, {
  x = 0,
  y = undefined,
  z = 0,
  yaw = 0,
  count = 3,
  quality = 'balanced',
  castShadows = true,
  textureLib = null,
  terrainHeightFn = null
} = {}) {
  const baseY = y !== undefined ? y : (typeof terrainHeightFn === 'function' ? terrainHeightFn(x, z) : 0);
  const pal = getArchitecturePalette(textureLib, quality);
  const ctx = createBuilderContext(group, worldMeshes, colliders, {
    x,
    y: baseY,
    z,
    yaw,
    castShadows
  });

  // Beveled steel/wood spill containment pallet
  ctx.addBevelBox({
    lx: 0,
    ly: 0.08,
    lz: 0,
    w: 1.76,
    h: 0.16,
    d: 1.76,
    bevel: 0.03,
    mat: pal.steelDark,
    collider: false
  });

  const offsets = [
    [-0.42, -0.36, pal.rustMetal],
    [0.44, -0.32, pal.navalMetal],
    [0.02, 0.42, pal.armorOlive],
    [-0.44, 0.40, pal.hazardAmber]
  ];

  const drumGeo = createFlutedCylinder(0.33, 0.33, 1.02, 20, 8, 12, 0.008);
  const hoopGeo = new THREE.TorusGeometry(0.34, 0.02, 8, 20);
  const num = Math.max(1, Math.min(4, count));

  for (let i = 0; i < num; i++) {
    const [bx, bz, drumMat] = offsets[i];
    const bGroup = new THREE.Group();
    bGroup.position.set(bx, 0.16, bz);

    const drum = new THREE.Mesh(drumGeo, drumMat);
    drum.position.set(0, 0.51, 0);
    ctx.registerMesh(drum, true);
    bGroup.add(drum);

    for (const hy of [0.06, 0.36, 0.68, 0.98]) {
      const hoop = new THREE.Mesh(hoopGeo, pal.steelDark);
      hoop.rotation.x = Math.PI * 0.5;
      hoop.position.set(0, hy, 0);
      ctx.registerMesh(hoop, false);
      bGroup.add(hoop);
    }

    const bung = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 8), pal.steelChrome);
    bung.position.set(0.14, 1.03, 0.06);
    bGroup.add(bung);

    ctx.root.add(bGroup);
  }

  pushRotatedBoxCollider(colliders, x, baseY, z, yaw, {
    lx: 0,
    ly: 0.58,
    lz: 0,
    w: 1.68,
    h: 1.16,
    d: 1.68,
    stepable: true
  });

  ctx.root.updateMatrixWorld(true);
  return ctx.root;
}

/**
 * 5C. Armored Vehicle Wreck (`addArmoredWreck`)
 * Multi-part beveled APC / tactical recon hulk with sloped glacis, wheels, fenders, turret ring & open hatch.
 */
export function addArmoredWreck(group, worldMeshes, colliders, {
  x = 0,
  y = undefined,
  z = 0,
  yaw = 0,
  variant = 'olive',
  quality = 'balanced',
  castShadows = true,
  textureLib = null,
  terrainHeightFn = null
} = {}) {
  const baseY = y !== undefined ? y : (typeof terrainHeightFn === 'function' ? terrainHeightFn(x, z) : 0);
  const pal = getArchitecturePalette(textureLib, quality);
  const hullMat = variant === 'desert' ? pal.sandstoneTrim : variant === 'rust' ? pal.rustMetal : pal.armorOlive;

  const ctx = createBuilderContext(group, worldMeshes, colliders, {
    x,
    y: baseY,
    z,
    yaw,
    castShadows
  });

  // Lower armored chassis + upper troop cabin
  ctx.addBevelBox({
    lx: 0,
    ly: 0.68,
    lz: 0,
    w: 2.28,
    h: 0.86,
    d: 4.55,
    bevel: 0.07,
    mat: hullMat,
    collider: true,
    stepable: true
  });
  ctx.addBevelBox({
    lx: 0,
    ly: 1.36,
    lz: 0.35,
    w: 2.08,
    h: 0.72,
    d: 3.1,
    bevel: 0.06,
    mat: hullMat,
    collider: true,
    stepable: true
  });

  // Sloped engine glacis hood & armored windshield visor
  ctx.addBevelBox({
    lx: 0,
    ly: 1.08,
    lz: -1.62,
    w: 2.04,
    h: 0.42,
    d: 1.25,
    bevel: 0.05,
    mat: hullMat,
    rx: 0.28,
    collider: false
  });

  // Roof turret ring + angled open hatch lid
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.64, 0.24, 16), pal.steelDark);
  ring.position.set(0, 1.82, 0.25);
  ctx.registerMesh(ring, false);
  ctx.root.add(ring);

  // 4 heavy fluted off-road wheels
  const wheelGeo = createFlutedCylinder(0.48, 0.48, 0.38, 18, 4, 10, 0.02);
  for (const [wx, wz] of [[-1.16, -1.42], [1.16, -1.42], [-1.16, 1.42], [1.16, 1.42]]) {
    const wheel = new THREE.Mesh(wheelGeo, pal.steelDark);
    wheel.rotation.z = Math.PI * 0.5;
    wheel.position.set(wx, 0.48, wz);
    ctx.registerMesh(wheel, false);
    ctx.root.add(wheel);
  }

  ctx.root.updateMatrixWorld(true);
  return ctx.root;
}

/**
 * 5D. Industrial Generator (`addIndustrialGenerator`)
 * Heavy diesel generator skid with beveled housing, louvered vents, turbine barrel, exhaust stacks & gauge panel.
 */
export function addIndustrialGenerator(group, worldMeshes, colliders, {
  x = 0,
  y = undefined,
  z = 0,
  yaw = 0,
  quality = 'balanced',
  castShadows = true,
  textureLib = null,
  terrainHeightFn = null
} = {}) {
  const baseY = y !== undefined ? y : (typeof terrainHeightFn === 'function' ? terrainHeightFn(x, z) : 0);
  const pal = getArchitecturePalette(textureLib, quality);
  const ctx = createBuilderContext(group, worldMeshes, colliders, {
    x,
    y: baseY,
    z,
    yaw,
    castShadows
  });

  // Heavy steel skid base
  ctx.addBevelBox({
    lx: 0,
    ly: 0.12,
    lz: 0,
    w: 1.48,
    h: 0.24,
    d: 2.95,
    bevel: 0.03,
    mat: pal.steelDark,
    collider: false
  });

  // Main beveled yellow/steel acoustic generator enclosure
  ctx.addBevelBox({
    lx: 0,
    ly: 0.92,
    lz: -0.15,
    w: 1.32,
    h: 1.42,
    d: 2.25,
    bevel: 0.05,
    mat: pal.hazardAmber,
    collider: true,
    stepable: true
  });

  // Louvered intake grilles on sides + rear cylindrical alternator drum
  for (const xSign of [-1, 1]) {
    ctx.addBevelBox({
      lx: xSign * 0.67,
      ly: 0.95,
      lz: -0.25,
      w: 0.06,
      h: 0.88,
      d: 1.45,
      bevel: 0.015,
      mat: pal.steelDark,
      collider: false,
      worldRegister: false
    });
  }

  const altDrum = new THREE.Mesh(
    createFlutedCylinder(0.44, 0.44, 0.72, 18, 6, 12, 0.015),
    pal.steel
  );
  altDrum.rotation.x = Math.PI * 0.5;
  altDrum.position.set(0, 0.82, 1.12);
  ctx.registerMesh(altDrum, true);
  ctx.root.add(altDrum);

  // Twin vertical exhaust mufflers & stacks
  for (const lxStack of [-0.36, 0.36]) {
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.95, 12), pal.steelDark);
    stack.position.set(lxStack, 1.98, -0.75);
    ctx.registerMesh(stack, false);
    ctx.root.add(stack);
  }

  ctx.root.updateMatrixWorld(true);
  return ctx.root;
}

/**
 * 5E. Floodlight Tower (`addFloodlightTower`)
 * Tall concrete-ballasted steel mast with climbing rungs, cross-arm gantry, and 3 angled floodlight projectors.
 */
export function addFloodlightTower(group, worldMeshes, colliders, {
  x = 0,
  y = undefined,
  z = 0,
  yaw = 0,
  height = 6.8,
  quality = 'balanced',
  castShadows = true,
  textureLib = null,
  terrainHeightFn = null
} = {}) {
  const baseY = y !== undefined ? y : (typeof terrainHeightFn === 'function' ? terrainHeightFn(x, z) : 0);
  const pal = getArchitecturePalette(textureLib, quality);
  const ctx = createBuilderContext(group, worldMeshes, colliders, {
    x,
    y: baseY,
    z,
    yaw,
    castShadows
  });

  // Heavy beveled concrete ballast block + junction box
  ctx.addBevelBox({
    lx: 0,
    ly: 0.46,
    lz: 0,
    w: 1.32,
    h: 0.92,
    d: 1.32,
    bevel: 0.045,
    mat: pal.concrete,
    collider: true,
    stepable: true
  });
  ctx.addBevelBox({
    lx: 0,
    ly: 1.35,
    lz: 0.44,
    w: 0.48,
    h: 0.62,
    d: 0.24,
    bevel: 0.02,
    mat: pal.hazardAmber,
    collider: false
  });

  // Tapered fluted steel mast
  const mastH = Math.max(3.5, height - 0.9);
  const mast = new THREE.Mesh(
    createFlutedCylinder(0.13, 0.23, mastH, 16, 6, 8, 0.012),
    pal.steelDark
  );
  mast.position.set(0, 0.9 + mastH * 0.5, 0);
  ctx.registerMesh(mast, true);
  ctx.root.add(mast);

  // Top cross-arm gantry + 3 high-output LED floodlight heads
  const topY = height;
  ctx.addBevelBox({
    lx: 0,
    ly: topY,
    lz: 0,
    w: 2.1,
    h: 0.16,
    d: 0.36,
    bevel: 0.025,
    mat: pal.steel,
    collider: false
  });

  for (const lxLamp of [-0.76, 0, 0.76]) {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(lxLamp, topY + 0.18, 0.14);
    lampGroup.rotation.x = 0.48;

    const hood = new THREE.Mesh(createBeveledBox(0.46, 0.32, 0.24, 0.02, 2), pal.steelDark);
    const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.24), pal.coolLightBar);
    lens.position.set(0, 0, 0.125);
    lampGroup.add(hood, lens);
    ctx.root.add(lampGroup);
  }

  ctx.root.updateMatrixWorld(true);
  return ctx.root;
}

/**
 * 5F. Concrete K-Rail Jersey Barrier (`addJerseyBarrier`)
 * Multi-tier sloped beveled concrete profile with forklift slots, rebar lifting loops & hazard reflectors.
 */
export function addJerseyBarrier(group, worldMeshes, colliders, {
  x = 0,
  y = undefined,
  z = 0,
  length = 3.6,
  yaw = 0,
  quality = 'balanced',
  castShadows = true,
  textureLib = null,
  terrainHeightFn = null
} = {}) {
  const baseY = y !== undefined ? y : (typeof terrainHeightFn === 'function' ? terrainHeightFn(x, z) : 0);
  const pal = getArchitecturePalette(textureLib, quality);
  const ctx = createBuilderContext(group, worldMeshes, colliders, {
    x,
    y: baseY,
    z,
    yaw,
    castShadows
  });

  // Base flange, sloped middle tier, and narrow upper crest
  ctx.addBevelBox({
    lx: 0,
    ly: 0.14,
    lz: 0,
    w: length,
    h: 0.28,
    d: 0.74,
    bevel: 0.03,
    mat: pal.concreteDark,
    collider: false
  });
  ctx.addBevelBox({
    lx: 0,
    ly: 0.52,
    lz: 0,
    w: length - 0.04,
    h: 0.52,
    d: 0.52,
    bevel: 0.035,
    mat: pal.concrete,
    collider: true,
    stepable: true
  });
  ctx.addBevelBox({
    lx: 0,
    ly: 0.92,
    lz: 0,
    w: length - 0.08,
    h: 0.36,
    d: 0.30,
    bevel: 0.03,
    mat: pal.concrete,
    collider: true,
    stepable: true
  });

  // Steel rebar lifting loops + amber hazard reflector strips
  const loopGeo = new THREE.TorusGeometry(0.075, 0.018, 8, 14, Math.PI);
  for (const xSign of [-1, 1]) {
    const loop = new THREE.Mesh(loopGeo, pal.steelDark);
    loop.position.set(xSign * (length * 0.32), 1.09, 0);
    ctx.root.add(loop);

    const reflector = new THREE.Mesh(createBeveledBox(0.36, 0.12, 0.33, 0.01, 2), pal.hazardAmber);
    reflector.position.set(xSign * (length * 0.36), 0.92, 0);
    ctx.root.add(reflector);
  }

  ctx.root.updateMatrixWorld(true);
  return ctx.root;
}

/**
 * 5G. Industrial Pipeline Run (`addPipeRun`)
 * Parallel insulated steel pipelines with bolted flange rings, beveled H-frame cradles, and crimson valve wheel.
 */
export function addPipeRun(group, worldMeshes, colliders, {
  x = 0,
  y = undefined,
  z = 0,
  length = 6.2,
  height = 1.15,
  yaw = 0,
  pipeCount = 2,
  quality = 'balanced',
  castShadows = true,
  textureLib = null,
  terrainHeightFn = null
} = {}) {
  const baseY = y !== undefined ? y : (typeof terrainHeightFn === 'function' ? terrainHeightFn(x, z) : 0);
  const pal = getArchitecturePalette(textureLib, quality);
  const ctx = createBuilderContext(group, worldMeshes, colliders, {
    x,
    y: baseY,
    z,
    yaw,
    castShadows
  });

  const numPipes = Math.max(1, Math.min(3, pipeCount));
  const cradleSpanZ = numPipes * 0.62 + 0.36;

  // Support cradles along the pipe run
  const supportPositions = [-length * 0.38, 0, length * 0.38];
  for (const sx of supportPositions) {
    ctx.addBevelBox({
      lx: sx,
      ly: height * 0.45,
      lz: 0,
      w: 0.34,
      h: height * 0.9,
      d: cradleSpanZ,
      bevel: 0.03,
      mat: pal.concreteDark,
      collider: false
    });
  }

  // Parallel steel pipes + bolted flange rings
  const pipeGeo = new THREE.CylinderGeometry(0.22, 0.22, length, 16);
  const flangeGeo = new THREE.CylinderGeometry(0.30, 0.30, 0.08, 16);

  for (let p = 0; p < numPipes; p++) {
    const pz = (p - (numPipes - 1) * 0.5) * 0.62;
    const pipe = new THREE.Mesh(pipeGeo, p % 2 === 0 ? pal.steel : pal.rustMetal);
    pipe.rotation.z = Math.PI * 0.5;
    pipe.position.set(0, height, pz);
    ctx.registerMesh(pipe, true);
    ctx.root.add(pipe);

    for (let fx = -length * 0.42; fx <= length * 0.42 + 0.01; fx += length * 0.28) {
      const flange = new THREE.Mesh(flangeGeo, pal.steelDark);
      flange.rotation.z = Math.PI * 0.5;
      flange.position.set(fx, height, pz);
      ctx.registerMesh(flange, false);
      ctx.root.add(flange);
    }
  }

  // Crimson pressure shutoff valve wheel on center cradle
  const valveWheel = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.028, 8, 16), pal.crimsonPaint);
  valveWheel.position.set(0, height + 0.38, (numPipes - 1) * 0.31);
  const valveStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.24, 8), pal.steelChrome);
  valveStem.position.set(0, height + 0.25, (numPipes - 1) * 0.31);
  ctx.root.add(valveWheel, valveStem);

  pushRotatedBoxCollider(colliders, x, baseY, z, yaw, {
    lx: 0,
    ly: (height + 0.24) * 0.5,
    lz: 0,
    w: length,
    h: height + 0.24,
    d: cradleSpanZ,
    stepable: height <= 1.35
  });

  ctx.root.updateMatrixWorld(true);
  return ctx.root;
}

/**
 * 6A. Moving 58m Cargo Container Ship (`addCargoShip`)
 * Builds a 58m-long seagoing container vessel in the harbor shipping channel with:
 * - Crimson antifouling lower waterline hull + dark charcoal/naval steel upper freeboard hull & flared bow
 * - White multi-story aft bridge superstructure with port/starboard bridge wings & tinted windows
 * - Rotating marine radar mast & twin-flue smokestack funnel
 * - 20 colorful corrugated shipping containers stacked in multi-tier bays on the main cargo deck
 * - Returns `{ group, update(dt, elapsedSec) }` so `MapBuilder.js` sails the ship smoothly along the channel!
 */
export function addCargoShip(group, worldMeshes, colliders, {
  x = 0,
  y = -0.55,
  z = -84,
  yaw = 0,
  travelRange = 46,
  speed = 0.14,
  quality = 'balanced',
  castShadows = true,
  textureLib = null
} = {}) {
  const pal = getArchitecturePalette(textureLib, quality);
  const shipGroup = new THREE.Group();
  shipGroup.position.set(x, y, z);
  shipGroup.rotation.y = yaw;
  group.add(shipGroup);

  const reg = (m) => {
    m.castShadow = castShadows;
    m.receiveShadow = castShadows;
    return m;
  };

  // 1. Lower crimson antifouling waterline hull (54m x 2.2m x 13.2m) + upper charcoal steel freeboard hull (56m x 3.6m x 13.6m)
  const lowerHull = reg(new THREE.Mesh(createBeveledBox(54.0, 2.2, 13.2, 0.22, 3), pal.crimsonPaint));
  lowerHull.position.set(0, 0.9, 0);

  const upperHull = reg(new THREE.Mesh(createBeveledBox(55.5, 3.6, 13.6, 0.24, 3), pal.steelDark));
  upperHull.position.set(0.4, 3.4, 0);

  // Flared bow stem & forecastle (+X is bow, -X is stern)
  const bowCone = reg(new THREE.Mesh(new THREE.ConeGeometry(7.2, 8.8, 4), pal.steelDark));
  bowCone.rotation.z = -Math.PI * 0.5;
  bowCone.rotation.x = Math.PI * 0.25;
  bowCone.scale.set(1.0, 1.0, 0.66);
  bowCone.position.set(30.2, 3.5, 0);

  const bulbousBow = reg(new THREE.Mesh(createBeveledBox(5.2, 1.8, 4.4, 0.45, 3), pal.crimsonPaint));
  bulbousBow.position.set(28.8, 0.7, 0);

  // Weather deck & raised coaming bulwarks
  const mainDeck = reg(new THREE.Mesh(createBeveledBox(54.8, 0.65, 13.0, 0.1, 2), pal.stairTread));
  mainDeck.position.set(0.5, 5.35, 0);

  const bowForecastle = reg(new THREE.Mesh(createBeveledBox(7.5, 1.4, 12.2, 0.14, 2), pal.steelDark));
  bowForecastle.position.set(25.2, 6.1, 0);

  shipGroup.add(lowerHull, upperHull, bowCone, bulbousBow, mainDeck, bowForecastle);

  // 2. White Multi-Story Bridge Superstructure at Stern (-X) with Bridge Wings, Tinted Windows, Radar Mast & Smokestack Funnel
  const bridgeX = -20.5;
  const tier1 = reg(new THREE.Mesh(createBeveledBox(8.6, 2.8, 11.8, 0.12, 3), pal.marble));
  tier1.position.set(bridgeX, 7.0, 0);

  const tier2 = reg(new THREE.Mesh(createBeveledBox(7.4, 2.6, 10.6, 0.12, 3), pal.marble));
  tier2.position.set(bridgeX + 0.3, 9.6, 0);

  const tier3 = reg(new THREE.Mesh(createBeveledBox(6.2, 2.4, 9.4, 0.1, 3), pal.marble));
  tier3.position.set(bridgeX + 0.6, 12.0, 0);

  // Navigation bridge deck with port & starboard cantilevered bridge wings (15.4m span)
  const navBridge = reg(new THREE.Mesh(createBeveledBox(5.6, 2.2, 15.4, 0.1, 3), pal.marble));
  navBridge.position.set(bridgeX + 1.0, 14.2, 0);

  const bridgeRoof = reg(new THREE.Mesh(createBeveledBox(6.2, 0.45, 15.8, 0.08, 2), pal.steelDark));
  bridgeRoof.position.set(bridgeX + 1.0, 15.5, 0);

  // Tinted wrap-around bridge windows
  const frontGlass = new THREE.Mesh(createBeveledBox(0.18, 1.1, 14.6, 0.02, 2), pal.windowGlass);
  frontGlass.position.set(bridgeX + 3.82, 14.35, 0);
  const sideGlassP = new THREE.Mesh(createBeveledBox(4.8, 1.1, 0.18, 0.02, 2), pal.windowGlass);
  sideGlassP.position.set(bridgeX + 1.0, 14.35, -7.65);
  const sideGlassS = new THREE.Mesh(createBeveledBox(4.8, 1.1, 0.18, 0.02, 2), pal.windowGlass);
  sideGlassS.position.set(bridgeX + 1.0, 14.35, 7.65);

  // Port (Red) & Starboard (Green) navigation wing beacons
  const portBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), pal.ledRed);
  portBeacon.position.set(bridgeX + 2.2, 15.8, -7.6);
  const stbdBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), pal.ledGreen);
  stbdBeacon.position.set(bridgeX + 2.2, 15.8, 7.6);

  // Smokestack funnel behind bridge
  const funnel = reg(new THREE.Mesh(createBeveledBox(3.4, 4.4, 3.8, 0.16, 3), pal.hazardAmber));
  funnel.position.set(bridgeX - 2.6, 15.2, 0);
  const funnelCap = reg(new THREE.Mesh(createBeveledBox(3.6, 0.75, 4.0, 0.1, 2), pal.steelDark));
  funnelCap.position.set(bridgeX - 2.6, 17.6, 0);

  // Radar mast & rotating scanner bar
  const radarMast = reg(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 3.8, 10), pal.steelChrome));
  radarMast.position.set(bridgeX + 1.4, 17.5, 0);
  const radarScanner = new THREE.Mesh(createBeveledBox(0.32, 0.28, 3.2, 0.04, 2), pal.marble);
  radarScanner.position.set(bridgeX + 1.4, 19.45, 0);

  shipGroup.add(
    tier1, tier2, tier3, navBridge, bridgeRoof,
    frontGlass, sideGlassP, sideGlassS,
    portBeacon, stbdBeacon,
    funnel, funnelCap, radarMast, radarScanner
  );

  // 3. 20 Colorful Corrugated Shipping Containers Stacked in 4 Bays x 2 Rows x 2-3 Tiers High
  const containerMats = [
    pal.navalMetal,
    pal.crimsonPaint,
    pal.hazardAmber,
    pal.armorOlive,
    pal.rustMetal,
    pal.steel
  ];
  const bayXPositions = [-9.5, -0.5, 8.5, 17.5];
  const rowZPositions = [-3.2, 3.2];
  const cW = 8.2;
  const cH = 2.65;
  const cD = 5.4;
  const cGeo = createBeveledBox(cW, cH, cD, 0.09, 2);
  const ribGeo = createBeveledBox(0.22, cH * 0.9, cD + 0.1, 0.02, 2);

  let cIdx = 0;
  for (let b = 0; b < bayXPositions.length; b++) {
    const bx = bayXPositions[b];
    const maxTiers = b === 1 || b === 2 ? 3 : 2;
    for (let r = 0; r < rowZPositions.length; r++) {
      const rz = rowZPositions[r];
      for (let t = 0; t < maxTiers; t++) {
        const cy = 5.65 + (t + 0.5) * cH;
        const cMat = containerMats[cIdx % containerMats.length];
        cIdx++;

        const box = reg(new THREE.Mesh(cGeo, cMat));
        box.position.set(bx, cy, rz);
        shipGroup.add(box);

        for (const rxOff of [-cW * 0.32, 0, cW * 0.32]) {
          const rib = new THREE.Mesh(ribGeo, pal.steelDark);
          rib.position.set(bx + rxOff, cy, rz);
          shipGroup.add(rib);
        }
      }
    }
  }

  shipGroup.updateMatrixWorld(true);
  const baseX = x;
  const baseY = y;
  const baseZ = z;

  return {
    group: shipGroup,
    update: (_dt, elapsedSec) => {
      // Smoothly sail along the harbor shipping channel with gentle ocean heave, pitch, and roll
      const swayX = Math.sin(elapsedSec * speed) * travelRange;
      const headingSign = Math.cos(elapsedSec * speed) >= 0 ? 1 : -1;
      shipGroup.position.x = baseX + swayX;
      shipGroup.position.y = baseY + Math.sin(elapsedSec * 0.95) * 0.24;
      shipGroup.position.z = baseZ + Math.cos(elapsedSec * 0.42) * 0.85;
      shipGroup.rotation.z = Math.sin(elapsedSec * 0.72) * 0.016 * headingSign;
      shipGroup.rotation.x = Math.cos(elapsedSec * 0.84) * 0.018;
      radarScanner.rotation.y = elapsedSec * 2.6;
    }
  };
}

/**
 * 6B. Industrial Harbor Forklift (`addForklift`)
 * Builds a detailed warehouse/dockyard forklift with:
 * - Safety yellow/amber counterweight body & black steel chassis step
 * - 4-post black steel overhead roll-cage guard (ROPS) + glowing amber roof beacon
 * - 4 fluted rubber tires with steel wheel hubs
 * - Driver seat, angled steering column & steering wheel, hydraulic control levers
 * - Dual vertical hydraulic mast rails, lift cylinder, steel fork carriage, twin L-forks, and pallet/crate load!
 */
export function addForklift(group, worldMeshes, colliders, {
  x = 0,
  y = undefined,
  z = 0,
  yaw = 0,
  withLoad = true,
  forkHeight = 0.38,
  quality = 'balanced',
  castShadows = true,
  textureLib = null,
  terrainHeightFn = null
} = {}) {
  const baseY = y !== undefined ? y : (typeof terrainHeightFn === 'function' ? terrainHeightFn(x, z) : 0);
  const pal = getArchitecturePalette(textureLib, quality);
  const ctx = createBuilderContext(group, worldMeshes, colliders, {
    x,
    y: baseY,
    z,
    yaw,
    castShadows
  });

  // 1. Lower steel chassis & safety yellow/amber counterweight rear body (+Z is front forks, -Z is rear counterweight)
  ctx.addBevelBox({
    lx: 0,
    ly: 0.44,
    lz: -0.18,
    w: 1.34,
    h: 0.56,
    d: 2.25,
    bevel: 0.05,
    mat: pal.hazardAmber,
    collider: true,
    stepable: true
  });

  // Heavy rounded rear counterweight block
  ctx.addBevelBox({
    lx: 0,
    ly: 0.64,
    lz: -0.92,
    w: 1.38,
    h: 0.78,
    d: 0.76,
    bevel: 0.09,
    mat: pal.hazardAmber,
    collider: false
  });
  ctx.addBevelBox({
    lx: 0,
    ly: 0.64,
    lz: -1.31,
    w: 1.05,
    h: 0.42,
    d: 0.08,
    bevel: 0.02,
    mat: pal.steelDark,
    collider: false,
    worldRegister: false
  });

  // 2. 4 Rubber Tires (larger front drive wheels at +Z, smaller rear steering wheels at -Z)
  const frontWheelGeo = createFlutedCylinder(0.36, 0.36, 0.28, 16, 2, 10, 0.016);
  const rearWheelGeo = createFlutedCylinder(0.28, 0.28, 0.24, 14, 2, 8, 0.014);
  const hubGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.30, 12);

  for (const xSign of [-1, 1]) {
    const fw = new THREE.Mesh(frontWheelGeo, pal.rubberTire);
    fw.rotation.z = Math.PI * 0.5;
    fw.position.set(xSign * 0.72, 0.36, 0.62);
    const fHub = new THREE.Mesh(hubGeo, pal.hazardAmber);
    fHub.rotation.z = Math.PI * 0.5;
    fHub.position.set(xSign * 0.73, 0.36, 0.62);

    const rw = new THREE.Mesh(rearWheelGeo, pal.rubberTire);
    rw.rotation.z = Math.PI * 0.5;
    rw.position.set(xSign * 0.68, 0.28, -0.82);
    const rHub = new THREE.Mesh(hubGeo, pal.steelChrome);
    rHub.rotation.z = Math.PI * 0.5;
    rHub.position.set(xSign * 0.69, 0.28, -0.82);

    ctx.registerMesh(fw, false);
    ctx.registerMesh(rw, false);
    ctx.root.add(fw, fHub, rw, rHub);
  }

  // 3. Operator Seat, Steering Column, Steering Wheel & Hydraulic Levers
  ctx.addBevelBox({
    lx: 0,
    ly: 0.96,
    lz: -0.25,
    w: 0.56,
    h: 0.16,
    d: 0.52,
    bevel: 0.03,
    mat: pal.rubberTire,
    collider: false,
    worldRegister: false
  });
  ctx.addBevelBox({
    lx: 0,
    ly: 1.24,
    lz: -0.46,
    w: 0.54,
    h: 0.48,
    d: 0.14,
    bevel: 0.03,
    mat: pal.rubberTire,
    collider: false,
    worldRegister: false
  });

  // Dashboard & steering wheel
  ctx.addBevelBox({
    lx: 0,
    ly: 0.96,
    lz: 0.48,
    w: 0.88,
    h: 0.48,
    d: 0.36,
    bevel: 0.03,
    mat: pal.steelDark,
    collider: false,
    worldRegister: false
  });
  const steerCol = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.48, 8), pal.steelDark);
  steerCol.position.set(0, 1.28, 0.36);
  steerCol.rotation.x = -0.45;
  const steerWheel = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 8, 16), pal.rubberTire);
  steerWheel.position.set(0, 1.48, 0.26);
  steerWheel.rotation.x = Math.PI * 0.5 - 0.45;
  ctx.root.add(steerCol, steerWheel);

  // 4. Black Steel Overhead Roll-Cage Guard (ROPS) + Amber Strobe Beacon
  for (const [px, pz] of [[-0.58, -0.78], [0.58, -0.78], [-0.58, 0.58], [0.58, 0.58]]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 1.42, 8), pal.steelDark);
    post.position.set(px, 1.44, pz);
    ctx.registerMesh(post, false);
    ctx.root.add(post);
  }
  ctx.addBevelBox({
    lx: 0,
    ly: 2.16,
    lz: -0.1,
    w: 1.26,
    h: 0.1,
    d: 1.48,
    bevel: 0.02,
    mat: pal.steelDark,
    collider: true,
    stepable: true
  });
  const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.08, 10), pal.steelDark);
  beaconBase.position.set(0, 2.24, -0.55);
  const beaconGlobe = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.14, 10), pal.ledAmber);
  beaconGlobe.position.set(0, 2.34, -0.55);
  ctx.root.add(beaconBase, beaconGlobe);

  // 5. Dual Vertical Hydraulic Mast Rails + Central Lift Cylinder + Steel Forks + Pallet/Crate Load
  const mastZ = 0.96;
  const mastH = 2.55;
  for (const xSign of [-1, 1]) {
    ctx.addBevelBox({
      lx: xSign * 0.42,
      ly: mastH * 0.5 + 0.12,
      lz: mastZ,
      w: 0.12,
      h: mastH,
      d: 0.16,
      bevel: 0.02,
      mat: pal.steelDark,
      collider: false
    });
  }
  const liftCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, mastH * 0.88, 10), pal.steelChrome);
  liftCyl.position.set(0, mastH * 0.46 + 0.12, mastZ);
  ctx.root.add(liftCyl);

  // Fork carriage backrest & twin horizontal steel forks
  const fy = Math.max(0.18, forkHeight);
  ctx.addBevelBox({
    lx: 0,
    ly: fy + 0.34,
    lz: mastZ + 0.1,
    w: 1.06,
    h: 0.58,
    d: 0.08,
    bevel: 0.015,
    mat: pal.steelDark,
    collider: false
  });
  for (const xSign of [-1, 1]) {
    ctx.addBevelBox({
      lx: xSign * 0.32,
      ly: fy,
      lz: mastZ + 0.72,
      w: 0.14,
      h: 0.06,
      d: 1.24,
      bevel: 0.01,
      mat: pal.steel,
      collider: false
    });
  }

  if (withLoad) {
    // Wooden pallet +strapped supply cargo crate on the forks
    ctx.addBevelBox({
      lx: 0,
      ly: fy + 0.09,
      lz: mastZ + 0.74,
      w: 1.18,
      h: 0.12,
      d: 1.18,
      bevel: 0.02,
      mat: pal.darkWood,
      collider: false
    });
    ctx.addBevelBox({
      lx: 0,
      ly: fy + 0.58,
      lz: mastZ + 0.74,
      w: 1.12,
      h: 0.86,
      d: 1.12,
      bevel: 0.04,
      mat: pal.crateWood,
      collider: true,
      stepable: true
    });
  }

  ctx.root.updateMatrixWorld(true);
  return ctx.root;
}

/**
 * 6C. Heavy Port Gantry Crane (`addGantryCrane`)
 * Builds a towering harbor container gantry crane with 4 portal legs (with AABB leg colliders),
 * upper girder bridge, seaside cantilever boom, operator cabin, and spreader block.
 */
export function addGantryCrane(group, worldMeshes, colliders, {
  x = 0,
  y = 0,
  z = 0,
  yaw = 0,
  spanZ = 28,
  height = 22,
  quality = 'balanced',
  castShadows = true,
  textureLib = null
} = {}) {
  const pal = getArchitecturePalette(textureLib, quality);
  const ctx = createBuilderContext(group, worldMeshes, colliders, {
    x,
    y,
    z,
    yaw,
    castShadows
  });

  const halfSpanZ = spanZ * 0.5;
  const legSpreadX = 4.2;

  // 4 Portal Legs with bogie wheel trucks and AABB colliders
  for (const lxSign of [-1, 1]) {
    for (const lzSign of [-1, 1]) {
      const lx = lxSign * legSpreadX;
      const lz = lzSign * halfSpanZ;
      ctx.addBevelBox({
        lx,
        ly: 0.45,
        lz,
        w: 1.6,
        h: 0.9,
        d: 2.2,
        bevel: 0.05,
        mat: pal.steelDark,
        collider: true,
        stepable: true
      });
      ctx.addBevelBox({
        lx,
        ly: height * 0.5,
        lz,
        w: 1.25,
        h: height,
        d: 1.25,
        bevel: 0.06,
        mat: pal.crimsonPaint,
        collider: true,
        stepable: false
      });
    }
    // Portal cross-tie beam at mid-height and top
    ctx.addBevelBox({
      lx: lxSign * legSpreadX,
      ly: 7.2,
      lz: 0,
      w: 0.95,
      h: 0.95,
      d: spanZ + 1.2,
      bevel: 0.05,
      mat: pal.crimsonPaint,
      collider: false
    });
  }

  // Main upper horizontal gantry boom extending out over the shipping channel (-Z)
  const boomLen = spanZ + 18;
  for (const lxSign of [-1, 1]) {
    ctx.addBevelBox({
      lx: lxSign * legSpreadX,
      ly: height + 0.8,
      lz: -4.5,
      w: 1.15,
      h: 1.65,
      d: boomLen,
      bevel: 0.06,
      mat: pal.crimsonPaint,
      collider: false
    });
  }

  // Trolley & operator cabin suspended under the boom
  ctx.addBevelBox({
    lx: 0,
    ly: height - 0.55,
    lz: -3.5,
    w: legSpreadX * 2 + 1.4,
    h: 1.1,
    d: 3.8,
    bevel: 0.05,
    mat: pal.steelDark,
    collider: false
  });
  ctx.addBevelBox({
    lx: 0,
    ly: height - 1.65,
    lz: -2.8,
    w: 2.4,
    h: 1.4,
    d: 2.6,
    bevel: 0.05,
    mat: pal.marble,
    collider: false
  });
  const cabGlass = new THREE.Mesh(createBeveledBox(2.2, 0.85, 2.68, 0.02, 2), pal.windowGlass);
  cabGlass.position.set(0, height - 1.65, -2.8);
  ctx.root.add(cabGlass);

  // Spreader beam suspended by steel cables
  ctx.addBevelBox({
    lx: 0,
    ly: height - 7.5,
    lz: -3.5,
    w: 3.2,
    h: 0.65,
    d: 8.2,
    bevel: 0.04,
    mat: pal.hazardAmber,
    collider: false
  });

  ctx.root.updateMatrixWorld(true);
  return ctx.root;
}

/**
 * 6D. Coastal Timber Jetty & Pilings (`addTimberJetty`)
 * Walkable weathered wooden pier & timber pilings extending out into the Harbor Sandy Beach Cove.
 */
export function addTimberJetty(group, worldMeshes, colliders, {
  x = 78,
  y = 0.25,
  z = 16,
  yaw = 0,
  length = 16.0,
  width = 3.4,
  quality = 'balanced',
  castShadows = true,
  textureLib = null
} = {}) {
  const pal = getArchitecturePalette(textureLib, quality);
  const ctx = createBuilderContext(group, worldMeshes, colliders, {
    x,
    y,
    z,
    yaw,
    castShadows
  });

  // Walkable heavy timber plank deck
  ctx.addBevelBox({
    lx: 0,
    ly: 0.55,
    lz: 0,
    w: length,
    h: 0.24,
    d: width,
    bevel: 0.03,
    mat: pal.darkWood,
    collider: true,
    stepable: true
  });

  // Timber piling posts along both sides of the jetty
  const pairCount = Math.max(4, Math.round(length / 3.2));
  const pilingGeo = createFlutedCylinder(0.18, 0.21, 2.2, 10, 3, 6, 0.012);
  const ropeRingGeo = new THREE.TorusGeometry(0.21, 0.035, 8, 14);

  for (let i = 0; i < pairCount; i++) {
    const px = -length * 0.45 + (i / (pairCount - 1)) * (length * 0.9);
    for (const zSign of [-1, 1]) {
      const pz = zSign * (width * 0.5 + 0.12);
      const piling = new THREE.Mesh(pilingGeo, pal.darkWood);
      piling.position.set(px, 0.35, pz);
      ctx.registerMesh(piling, true);
      ctx.root.add(piling);

      const rope = new THREE.Mesh(ropeRingGeo, pal.sandstoneTrim);
      rope.rotation.x = Math.PI * 0.5;
      rope.position.set(px, 1.15, pz);
      ctx.root.add(rope);
    }
  }

  ctx.root.updateMatrixWorld(true);
  return ctx.root;
}

/**
 * 7A. Broken & Toppled Ancient Column Ruin (`addBrokenColumnRuin`)
 * Placed in the Desert Temple Ruins:
 * - Stepped sandstone pedestal plinth + fractured lower fluted column stump
 * - 2-3 fallen fluted column drums & carved capital half-buried in the desert sand (stepable cover!)
 */
export function addBrokenColumnRuin(group, worldMeshes, colliders, {
  x = 0,
  y = undefined,
  z = 0,
  yaw = 0,
  radius = 0.44,
  stumpHeight = 1.65,
  quality = 'balanced',
  castShadows = true,
  textureLib = null,
  terrainHeightFn = null
} = {}) {
  const baseY = y !== undefined ? y : (typeof terrainHeightFn === 'function' ? terrainHeightFn(x, z) : 0);
  const pal = getArchitecturePalette(textureLib, quality);
  const ctx = createBuilderContext(group, worldMeshes, colliders, {
    x,
    y: baseY,
    z,
    yaw,
    castShadows
  });

  // 1. Standing stepped plinth + fractured fluted shaft stump
  ctx.addBevelBox({
    lx: 0,
    ly: 0.22,
    lz: 0,
    w: radius * 3.1,
    h: 0.44,
    d: radius * 3.1,
    bevel: 0.04,
    mat: pal.sandstoneTrim,
    collider: true,
    stepable: true
  });

  const stumpGeo = createFlutedCylinder(radius * 0.92, radius, stumpHeight, 24, 6, 14, 0.02);
  const stump = new THREE.Mesh(stumpGeo, pal.sandstone);
  stump.position.set(0, 0.44 + stumpHeight * 0.5, 0);
  ctx.registerMesh(stump, true);
  ctx.root.add(stump);

  pushRotatedBoxCollider(colliders, x, baseY, z, yaw, {
    lx: 0,
    ly: (0.44 + stumpHeight) * 0.5,
    lz: 0,
    w: radius * 2.3,
    h: 0.44 + stumpHeight,
    d: radius * 2.3,
    stepable: stumpHeight <= 1.45
  });

  // 2. Fallen fluted column drums lying on the sand along +X
  const drumGeo = createFlutedCylinder(radius * 0.9, radius * 0.92, 1.15, 22, 4, 14, 0.018);
  const drum1 = new THREE.Mesh(drumGeo, pal.sandstone);
  drum1.position.set(1.55, radius * 0.82, 0.18);
  drum1.rotation.set(0.08, 0.22, Math.PI * 0.47);
  ctx.registerMesh(drum1, true);

  const drum2 = new THREE.Mesh(drumGeo, pal.sandstone);
  drum2.position.set(2.92, radius * 0.76, -0.15);
  drum2.rotation.set(-0.06, -0.18, Math.PI * 0.51);
  ctx.registerMesh(drum2, true);

  ctx.root.add(drum1, drum2);

  // Stepable collider for the fallen column drums
  pushRotatedBoxCollider(colliders, x, baseY, z, yaw, {
    lx: 2.25,
    ly: radius * 0.85,
    lz: 0,
    w: 2.65,
    h: radius * 1.7,
    d: radius * 2.1,
    stepable: true
  });

  // 3. Toppled carved echinus/abacus capital block at the end of the fallen shaft
  ctx.addBevelBox({
    lx: 4.05,
    ly: 0.38,
    lz: 0.12,
    w: 0.95,
    h: 0.86,
    d: 0.95,
    bevel: 0.04,
    mat: pal.sandstoneTrim,
    rz: 0.32,
    ry: 0.25,
    collider: true,
    stepable: true
  });

  ctx.root.updateMatrixWorld(true);
  return ctx.root;
}

/**
 * 7B. Ancient Desert Sculptures (`addDesertSculpture`)
 * Supports `variant`:
 * - `'obelisk'`: Carved sandstone Obelisk on stepped temple pedestal with bronze relief bands & gleaming gold/bronze pyramidion tip
 * - `'jackalGuardian'`: Seated/striding Anubis/Jackal Guardian Statue on stepped sandstone pedestal with gold collar, pointed ears & ceremonial staff
 * - `'horusStatue'`: Regal Horus Falcon Guardian Statue on stepped sandstone pedestal with solar disc crown & carved wings
 * - `'monolith'`: Weathered carved desert stele monolith with recessed hieroglyph bands & bronze sun emblem
 */
export function addDesertSculpture(group, worldMeshes, colliders, {
  x = 0,
  y = undefined,
  z = 0,
  yaw = 0,
  variant = 'obelisk',
  scale = 1.0,
  quality = 'balanced',
  castShadows = true,
  textureLib = null,
  terrainHeightFn = null
} = {}) {
  const baseY = y !== undefined ? y : (typeof terrainHeightFn === 'function' ? terrainHeightFn(x, z) : 0);
  const pal = getArchitecturePalette(textureLib, quality);
  const ctx = createBuilderContext(group, worldMeshes, colliders, {
    x,
    y: baseY,
    z,
    yaw,
    castShadows
  });

  const s = scale;

  // Shared two-tier stepped sandstone temple pedestal with carved relief frieze
  const pedW = (variant === 'obelisk' ? 2.1 : 2.35) * s;
  const pedD = (variant === 'obelisk' ? 2.1 : 2.85) * s;
  const pedH = 1.12 * s;

  ctx.addBevelBox({
    lx: 0,
    ly: 0.24 * s,
    lz: 0,
    w: pedW * 1.18,
    h: 0.48 * s,
    d: pedD * 1.18,
    bevel: 0.045,
    mat: pal.sandstoneTrim,
    collider: true,
    stepable: true
  });
  ctx.addBevelBox({
    lx: 0,
    ly: 0.78 * s,
    lz: 0,
    w: pedW,
    h: 0.64 * s,
    d: pedD,
    bevel: 0.04,
    mat: pal.sandstone,
    collider: true,
    stepable: true
  });
  // Gold/bronze relief frieze band around pedestal
  ctx.addBevelBox({
    lx: 0,
    ly: 0.82 * s,
    lz: 0,
    w: pedW + 0.06,
    h: 0.14 * s,
    d: pedD + 0.06,
    bevel: 0.015,
    mat: pal.goldBronze,
    collider: false
  });

  if (variant === 'obelisk') {
    // Tapered sandstone obelisk shaft + carved relief bands + gleaming gold/bronze pyramidion tip
    const shaftH = 4.6 * s;
    const shaftGeo = new THREE.CylinderGeometry(0.42 * s, 0.68 * s, shaftH, 4, 4);
    shaftGeo.rotateY(Math.PI * 0.25);
    const shaft = new THREE.Mesh(shaftGeo, pal.sandstone);
    shaft.position.set(0, pedH + shaftH * 0.5, 0);
    ctx.registerMesh(shaft, true);
    ctx.root.add(shaft);

    // Carved bronze/sandstone Trim collar rings along obelisk shaft
    for (const [ry, rw] of [[1.65, 1.02], [2.85, 0.88], [4.05, 0.76], [5.25, 0.64]]) {
      ctx.addBevelBox({
        lx: 0,
        ly: ry * s,
        lz: 0,
        w: rw * s,
        h: 0.14 * s,
        d: rw * s,
        bevel: 0.02,
        mat: ry > 4.5 ? pal.goldBronze : pal.sandstoneTrim,
        collider: false
      });
    }

    // Gleaming Gold/Bronze Pyramidion Tip at apex
    const tipH = 0.98 * s;
    const tipGeo = new THREE.ConeGeometry(0.44 * s, tipH, 4);
    tipGeo.rotateY(Math.PI * 0.25);
    const tip = new THREE.Mesh(tipGeo, pal.goldBronze);
    tip.position.set(0, pedH + shaftH + tipH * 0.5 - 0.02, 0);
    ctx.registerMesh(tip, true);
    ctx.root.add(tip);

    pushRotatedBoxCollider(colliders, x, baseY, z, yaw, {
      lx: 0,
      ly: (pedH + shaftH) * 0.5,
      lz: 0,
      w: 1.35 * s,
      h: pedH + shaftH,
      d: 1.35 * s,
      stepable: false
    });
  } else if (variant === 'jackalGuardian') {
    // Guardian Jackal/Anubis Statue on the stepped sandstone pedestal (+Z facing forward)
    // Seated/striding legs & paws extending forward
    for (const xSign of [-1, 1]) {
      ctx.addBevelBox({
        lx: xSign * 0.42 * s,
        ly: pedH + 0.22 * s,
        lz: 0.42 * s,
        w: 0.34 * s,
        h: 0.44 * s,
        d: 1.35 * s,
        bevel: 0.04,
        mat: pal.sandstoneTrim,
        collider: false
      });
    }
    // Haunches & muscular torso
    ctx.addBevelBox({
      lx: 0,
      ly: pedH + 0.78 * s,
      lz: -0.22 * s,
      w: 1.18 * s,
      h: 1.15 * s,
      d: 1.12 * s,
      bevel: 0.06,
      mat: pal.sandstone,
      collider: false
    });
    ctx.addBevelBox({
      lx: 0,
      ly: pedH + 1.65 * s,
      lz: -0.08 * s,
      w: 1.26 * s,
      h: 1.05 * s,
      d: 0.86 * s,
      bevel: 0.06,
      mat: pal.sandstone,
      collider: false
    });
    // Broad ceremonial gold/bronze Usekh chest collar
    ctx.addBevelBox({
      lx: 0,
      ly: pedH + 2.08 * s,
      lz: 0.02 * s,
      w: 1.34 * s,
      h: 0.22 * s,
      d: 0.94 * s,
      bevel: 0.03,
      mat: pal.goldBronze,
      collider: false
    });
    // Nemes headdress & sculpted Jackal head with elongated snout + tall pointed ears
    ctx.addBevelBox({
      lx: 0,
      ly: pedH + 2.56 * s,
      lz: 0.02 * s,
      w: 0.78 * s,
      h: 0.76 * s,
      d: 0.78 * s,
      bevel: 0.05,
      mat: pal.sandstoneTrim,
      collider: false
    });
    ctx.addBevelBox({
      lx: 0,
      ly: pedH + 2.50 * s,
      lz: 0.56 * s,
      w: 0.38 * s,
      h: 0.34 * s,
      d: 0.68 * s,
      bevel: 0.04,
      mat: pal.sandstone,
      collider: false
    });
    // Tall pointed jackal ears & glowing amber eyes
    for (const xSign of [-1, 1]) {
      ctx.addBevelBox({
        lx: xSign * 0.24 * s,
        ly: pedH + 3.18 * s,
        lz: -0.05 * s,
        w: 0.16 * s,
        h: 0.62 * s,
        d: 0.22 * s,
        bevel: 0.02,
        mat: pal.goldBronze,
        collider: false
      });
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045 * s, 8, 8), pal.ledAmber);
      eye.position.set(xSign * 0.21 * s, pedH + 2.66 * s, 0.38 * s);
      ctx.root.add(eye);
    }
    // Ceremonial gold Was-scepter staff held vertically at right side
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.045 * s, 0.045 * s, 2.9 * s, 10), pal.goldBronze);
    staff.position.set(0.68 * s, pedH + 1.55 * s, 0.45 * s);
    ctx.registerMesh(staff, false);
    ctx.root.add(staff);

    pushRotatedBoxCollider(colliders, x, baseY, z, yaw, {
      lx: 0,
      ly: (pedH + 2.8 * s) * 0.5,
      lz: 0,
      w: 1.65 * s,
      h: pedH + 2.8 * s,
      d: 2.15 * s,
      stepable: false
    });
  } else if (variant === 'horusStatue') {
    // Regal Horus Falcon Guardian Statue on stepped sandstone pedestal
    ctx.addBevelBox({
      lx: 0,
      ly: pedH + 1.15 * s,
      lz: 0,
      w: 1.32 * s,
      h: 2.15 * s,
      d: 1.05 * s,
      bevel: 0.06,
      mat: pal.sandstone,
      collider: false
    });
    // Folded sandstone wings & bronze pectoral plate
    ctx.addBevelBox({
      lx: 0,
      ly: pedH + 1.85 * s,
      lz: 0.05 * s,
      w: 1.48 * s,
      h: 0.34 * s,
      d: 1.12 * s,
      bevel: 0.04,
      mat: pal.goldBronze,
      collider: false
    });
    // Falcon head, hooked beak, and glowing golden Solar Disc Crown
    ctx.addBevelBox({
      lx: 0,
      ly: pedH + 2.48 * s,
      lz: 0.06 * s,
      w: 0.82 * s,
      h: 0.72 * s,
      d: 0.82 * s,
      bevel: 0.05,
      mat: pal.sandstoneTrim,
      collider: false
    });
    ctx.addBevelBox({
      lx: 0,
      ly: pedH + 2.42 * s,
      lz: 0.54 * s,
      w: 0.28 * s,
      h: 0.28 * s,
      d: 0.36 * s,
      bevel: 0.03,
      rx: 0.25,
      mat: pal.goldBronze,
      collider: false
    });
    const sunDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.46 * s, 0.46 * s, 0.16 * s, 20), pal.goldBronze);
    sunDisc.rotation.x = Math.PI * 0.5;
    sunDisc.position.set(0, pedH + 3.16 * s, 0.06 * s);
    ctx.registerMesh(sunDisc, true);
    ctx.root.add(sunDisc);

    pushRotatedBoxCollider(colliders, x, baseY, z, yaw, {
      lx: 0,
      ly: (pedH + 2.9 * s) * 0.5,
      lz: 0,
      w: 1.65 * s,
      h: pedH + 2.9 * s,
      d: 1.65 * s,
      stepable: false
    });
  } else {
    // Weathered Carved Desert Monolith Stele
    const monoH = 3.4 * s;
    ctx.addBevelBox({
      lx: 0,
      ly: pedH + monoH * 0.5,
      lz: 0,
      w: 1.85 * s,
      h: monoH,
      d: 0.78 * s,
      bevel: 0.06,
      mat: pal.sandstone,
      collider: true,
      stepable: false
    });
    const emblem = new THREE.Mesh(new THREE.TorusGeometry(0.42 * s, 0.06 * s, 10, 20), pal.goldBronze);
    emblem.position.set(0, pedH + monoH * 0.68, 0.41 * s);
    ctx.root.add(emblem);
  }

  ctx.root.updateMatrixWorld(true);
  return ctx.root;
}

/**
 * 7C. Intact & Broken Terracotta Vases / Amphorae Cluster (`addPotteryCluster`)
 * Places a cluster of lathe-sculpted terracotta vases & two-handled amphorae alongside
 * shattered terracotta shards and a spilled golden sand mound around the desert temple & bazaar!
 */
export function addPotteryCluster(group, worldMeshes, colliders, {
  x = 0,
  y = undefined,
  z = 0,
  yaw = 0,
  scale = 1.0,
  quality = 'balanced',
  castShadows = true,
  textureLib = null,
  terrainHeightFn = null
} = {}) {
  const baseY = y !== undefined ? y : (typeof terrainHeightFn === 'function' ? terrainHeightFn(x, z) : 0);
  const pal = getArchitecturePalette(textureLib, quality);
  const root = new THREE.Group();
  root.position.set(x, baseY, z);
  root.rotation.y = yaw;
  root.scale.setScalar(scale);
  group.add(root);

  // 1. Spilled sand mound base under the pottery & broken shards
  const sandMoundGeo = new THREE.SphereGeometry(0.95, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
  sandMoundGeo.scale(1.25, 0.24, 1.1);
  const sandMound = new THREE.Mesh(sandMoundGeo, pal.sandstone);
  sandMound.receiveShadow = castShadows;
  root.add(sandMound);

  // 2. Lathe-sculpted tall amphora profile (foot -> curved belly -> shoulder -> neck -> flared lip)
  const amphoraPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.16, 0.0),
    new THREE.Vector2(0.13, 0.10),
    new THREE.Vector2(0.32, 0.42),
    new THREE.Vector2(0.34, 0.66),
    new THREE.Vector2(0.15, 0.92),
    new THREE.Vector2(0.14, 1.12),
    new THREE.Vector2(0.21, 1.22),
    new THREE.Vector2(0.17, 1.24),
    new THREE.Vector2(0.11, 1.10)
  ];
  const amphoraGeo = new THREE.LatheGeometry(amphoraPts, 18);

  // Wide-bellied water jar profile
  const jarPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.20, 0.0),
    new THREE.Vector2(0.38, 0.34),
    new THREE.Vector2(0.36, 0.58),
    new THREE.Vector2(0.18, 0.78),
    new THREE.Vector2(0.24, 0.88),
    new THREE.Vector2(0.19, 0.90)
  ];
  const jarGeo = new THREE.LatheGeometry(jarPts, 18);
  const handleGeo = new THREE.TorusGeometry(0.14, 0.024, 8, 14, Math.PI * 1.1);

  // Standing Tall Amphora #1 with twin curved handles & decorative band
  const vase1 = new THREE.Group();
  vase1.position.set(-0.32, 0.04, -0.18);
  const v1Mesh = new THREE.Mesh(amphoraGeo, pal.terracotta);
  v1Mesh.castShadow = castShadows;
  v1Mesh.receiveShadow = castShadows;
  vase1.add(v1Mesh);

  const band1 = new THREE.Mesh(new THREE.CylinderGeometry(0.345, 0.335, 0.12, 18), pal.terracottaDark);
  band1.position.set(0, 0.56, 0);
  vase1.add(band1);

  for (const xSign of [-1, 1]) {
    const h = new THREE.Mesh(handleGeo, pal.terracottaDark);
    h.position.set(xSign * 0.20, 0.94, 0);
    h.rotation.z = xSign * -0.35;
    vase1.add(h);
  }
  root.add(vase1);

  // Standing Wide Terracotta Jar #2
  const vase2 = new THREE.Mesh(jarGeo, pal.terracottaDark);
  vase2.position.set(0.38, 0.04, -0.24);
  vase2.castShadow = castShadows;
  vase2.receiveShadow = castShadows;
  root.add(vase2);

  // Toppled / Tilted Half-Buried Amphora Neck & Belly #3
  const tippedVase = new THREE.Mesh(jarGeo, pal.terracotta);
  tippedVase.position.set(-0.12, 0.22, 0.42);
  tippedVase.rotation.set(1.28, 0.45, 0.32);
  tippedVase.scale.setScalar(0.78);
  tippedVase.castShadow = castShadows;
  root.add(tippedVase);

  // 3. Shattered / Broken Terracotta Vase Fragments & Rim Shards scattered in spilled sand
  const shardGeo = new THREE.CylinderGeometry(0.28, 0.24, 0.34, 10, 1, true, 0, Math.PI * 0.68);
  const shardPositions = [
    [0.34, 0.12, 0.38, 1.35, 0.4, 0.8],
    [0.58, 0.09, 0.18, 1.48, 1.9, -0.3],
    [0.14, 0.10, 0.62, 1.42, -0.8, 0.5],
    [-0.52, 0.08, 0.32, 1.52, 2.5, 0.2]
  ];
  for (let i = 0; i < shardPositions.length; i++) {
    const [sx, sy, sz, rx, ry, rz] = shardPositions[i];
    const shard = new THREE.Mesh(shardGeo, i % 2 === 0 ? pal.terracotta : pal.terracottaDark);
    shard.position.set(sx, sy, sz);
    shard.rotation.set(rx, ry, rz);
    shard.castShadow = castShadows;
    root.add(shard);
  }

  if (Array.isArray(worldMeshes)) {
    worldMeshes.push(v1Mesh, vase2, tippedVase);
  }
  if (Array.isArray(colliders)) {
    const r = 0.72 * scale;
    colliders.push({
      minX: x - r,
      maxX: x + r,
      minY: baseY - 0.3,
      maxY: baseY + 1.15 * scale,
      minZ: z - r,
      maxZ: z + r,
      stepable: true
    });
  }

  root.updateMatrixWorld(true);
  return root;
}

/**
 * 7D. Windblown Sand Pile / Dune Mound (`addSandDuneMound`)
 * Smooth sculpted sand heap banked up against ancient desert walls, broken columns, and bazaar buildings.
 */
export function addSandDuneMound(group, worldMeshes, colliders, {
  x = 0,
  y = undefined,
  z = 0,
  yaw = 0,
  radiusX = 2.6,
  radiusZ = 1.8,
  height = 0.95,
  quality = 'balanced',
  castShadows = true,
  textureLib = null,
  terrainHeightFn = null
} = {}) {
  const baseY = y !== undefined ? y : (typeof terrainHeightFn === 'function' ? terrainHeightFn(x, z) : 0);
  const pal = getArchitecturePalette(textureLib, quality);
  const moundGroup = new THREE.Group();
  moundGroup.position.set(x, baseY, z);
  moundGroup.rotation.y = yaw;
  group.add(moundGroup);

  const domeGeo = new THREE.SphereGeometry(1.0, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52);
  const pos = domeGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    const pz = pos.getZ(i);
    // Wind-rippled crest & asymmetric leeward slipface
    const ripple = Math.sin(px * 6.5 + pz * 3.2) * 0.045 * py;
    const skew = pz * 0.14 * py;
    pos.setXYZ(i, (px + skew) * radiusX, Math.max(0, (py + ripple) * height), pz * radiusZ);
  }
  pos.needsUpdate = true;
  domeGeo.computeVertexNormals();

  const mainMound = new THREE.Mesh(domeGeo, pal.sandstone);
  mainMound.position.set(0, -0.06, 0);
  mainMound.castShadow = castShadows;
  mainMound.receiveShadow = castShadows;
  moundGroup.add(mainMound);

  if (Array.isArray(worldMeshes)) {
    worldMeshes.push(mainMound);
  }
  pushRotatedBoxCollider(colliders, x, baseY, z, yaw, {
    lx: 0,
    ly: height * 0.38,
    lz: 0,
    w: radiusX * 1.45,
    h: height * 0.76,
    d: radiusZ * 1.45,
    stepable: true
  });

  moundGroup.updateMatrixWorld(true);
  return moundGroup;
}

/**
 * 8A. Tracked Arctic Snowcat Vehicle (`addSnowcatVehicle`)
 * Heavy alpine snow-groomer / arctic utility vehicle for the Snow Glacier map with:
 * - Wide caterpillar rubber-and-steel track assemblies + road wheels & drive sprockets
 * - Insulated high-visibility crimson/amber armored cabin with heated panoramic windshield
 * - Front hydraulic snowplow V-blade & rear cargo flatbed with arctic supply drums
 */
export function addSnowcatVehicle(group, worldMeshes, colliders, {
  x = 0,
  y = undefined,
  z = 0,
  yaw = 0,
  quality = 'balanced',
  castShadows = true,
  textureLib = null,
  terrainHeightFn = null
} = {}) {
  const baseY = y !== undefined ? y : (typeof terrainHeightFn === 'function' ? terrainHeightFn(x, z) : 0);
  const pal = getArchitecturePalette(textureLib, quality);
  const ctx = createBuilderContext(group, worldMeshes, colliders, {
    x,
    y: baseY,
    z,
    yaw,
    castShadows
  });

  // 1. Left & Right wide arctic caterpillar track pods (+Z is front plow, -Z is rear cargo deck)
  const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.68, 14);
  for (const xSign of [-1, 1]) {
    const tx = xSign * 1.18;
    ctx.addBevelBox({
      lx: tx,
      ly: 0.42,
      lz: 0,
      w: 0.72,
      h: 0.76,
      d: 3.95,
      bevel: 0.14,
      mat: pal.rubberTire,
      collider: false
    });
    // Steel track frame rail
    ctx.addBevelBox({
      lx: tx,
      ly: 0.42,
      lz: 0,
      w: 0.76,
      h: 0.28,
      d: 3.35,
      bevel: 0.04,
      mat: pal.hazardAmber,
      collider: false
    });
    for (const wz of [-1.45, -0.5, 0.5, 1.45]) {
      const wMesh = new THREE.Mesh(wheelGeo, pal.steelChrome);
      wMesh.rotation.z = Math.PI * 0.5;
      wMesh.position.set(tx, 0.34, wz);
      ctx.registerMesh(wMesh, false);
      ctx.root.add(wMesh);
    }
  }

  // 2. Main chassis deck + High-visibility Crimson Forward Cab + Rear Flatbed Cargo Deck
  ctx.addBevelBox({
    lx: 0,
    ly: 0.84,
    lz: 0,
    w: 2.48,
    h: 0.32,
    d: 4.15,
    bevel: 0.05,
    mat: pal.steelDark,
    collider: true,
    stepable: true
  });

  // Forward insulated cab
  ctx.addBevelBox({
    lx: 0,
    ly: 1.58,
    lz: 0.68,
    w: 2.24,
    h: 1.24,
    d: 2.15,
    bevel: 0.08,
    mat: pal.crimsonPaint,
    collider: true,
    stepable: true
  });

  // Heated panoramic front windshield & side windows
  const windshield = new THREE.Mesh(createBeveledBox(1.96, 0.68, 0.12, 0.02, 2), pal.windowGlass);
  windshield.position.set(0, 1.72, 1.74);
  windshield.rotation.x = -0.18;
  ctx.root.add(windshield);

  // Roof lightbar & dual amber beacons
  ctx.addBevelBox({
    lx: 0,
    ly: 2.26,
    lz: 1.35,
    w: 1.55,
    h: 0.14,
    d: 0.24,
    bevel: 0.02,
    mat: pal.coolLightBar,
    collider: false
  });
  for (const xSign of [-1, 1]) {
    const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), pal.ledAmber);
    strobe.position.set(xSign * 0.78, 2.28, 0.2);
    ctx.root.add(strobe);
  }

  // Rear flatbed cargo crate & snow cap
  ctx.addBevelBox({
    lx: 0,
    ly: 1.38,
    lz: -1.15,
    w: 1.75,
    h: 0.78,
    d: 1.45,
    bevel: 0.04,
    mat: pal.armorOlive,
    collider: true,
    stepable: true
  });

  // 3. Front Hydraulic Snowplow Dozer Blade (+Z)
  ctx.addBevelBox({
    lx: 0,
    ly: 0.58,
    lz: 2.35,
    w: 0.92,
    h: 0.24,
    d: 0.85,
    bevel: 0.03,
    mat: pal.steelDark,
    collider: false
  });
  ctx.addBevelBox({
    lx: 0,
    ly: 0.66,
    lz: 2.82,
    w: 3.15,
    h: 0.96,
    d: 0.28,
    bevel: 0.05,
    mat: pal.hazardAmber,
    rx: 0.18,
    collider: true,
    stepable: true
  });

  ctx.root.updateMatrixWorld(true);
  return ctx.root;
}

/**
 * 8B. Glacial Ice Spires & Snowdrift Cluster (`addIceSpireCluster`)
 * Sculpted translucent clearcoat glacial blue ice spires emerging from a snowdrift mound in the Snow map.
 */
export function addIceSpireCluster(group, worldMeshes, colliders, {
  x = 0,
  y = undefined,
  z = 0,
  yaw = 0,
  scale = 1.0,
  quality = 'balanced',
  castShadows = true,
  textureLib = null,
  terrainHeightFn = null
} = {}) {
  const baseY = y !== undefined ? y : (typeof terrainHeightFn === 'function' ? terrainHeightFn(x, z) : 0);
  const pal = getArchitecturePalette(textureLib, quality);
  const cluster = new THREE.Group();
  cluster.position.set(x, baseY, z);
  cluster.rotation.y = yaw;
  cluster.scale.setScalar(scale);
  group.add(cluster);

  // Sculpted snowdrift base mound
  const driftGeo = new THREE.SphereGeometry(1.75, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
  driftGeo.scale(1.2, 0.42, 1.05);
  const drift = new THREE.Mesh(driftGeo, pal.snowCap);
  drift.receiveShadow = castShadows;
  cluster.add(drift);

  // 3faceted crystalline glacial ice spires
  const spireSpecs = [
    { lx: 0.0, lz: 0.0, r: 0.68, h: 3.4, rx: 0.08, rz: -0.06 },
    { lx: -0.78, lz: 0.35, r: 0.48, h: 2.25, rx: -0.14, rz: 0.18 },
    { lx: 0.72, lz: -0.28, r: 0.44, h: 1.95, rx: 0.12, rz: -0.22 }
  ];

  for (const sp of spireSpecs) {
    const spireGeo = new THREE.ConeGeometry(sp.r, sp.h, 6);
    const spire = new THREE.Mesh(spireGeo, pal.glacialIce);
    spire.position.set(sp.lx, sp.h * 0.46, sp.lz);
    spire.rotation.set(sp.rx, 0.4, sp.rz);
    spire.castShadow = castShadows;
    spire.receiveShadow = castShadows;
    cluster.add(spire);
    if (Array.isArray(worldMeshes)) worldMeshes.push(spire);
  }

  if (Array.isArray(colliders)) {
    const cRad = 1.28 * scale;
    colliders.push({
      minX: x - cRad,
      maxX: x + cRad,
      minY: baseY - 0.4,
      maxY: baseY + 3.1 * scale,
      minZ: z - cRad,
      maxZ: z + cRad,
      stepable: false
    });
  }

  cluster.updateMatrixWorld(true);
  return cluster;
}

