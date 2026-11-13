import * as THREE from 'three';
import { createBeveledBox, createFlutedCylinder } from './GeometryUtils.js';
import { SKIN_CATALOG, resolveSkinCatalogEntry, createQualityMaterial } from './Textures.js';

export const OPERATOR_CATALOG = [
  {
    id: 'vanguard',
    name: 'VANGUARD',
    Name: 'VANGUARD',
    role: 'Heavy Breacher',
    Role: 'Heavy Breacher',
    defaultSkin: 'factory',
    primaryColor: 0x252d38,
    accentColor: 0xf59e0b,
    headgear: 'nvg',
    rig: 'heavy'
  },
  {
    id: 'spectre',
    name: 'SPECTRE',
    Name: 'SPECTRE',
    role: 'Ghost Recon',
    Role: 'Ghost Recon',
    defaultSkin: 'carbon',
    primaryColor: 0x161920,
    accentColor: 0x38bdf8,
    headgear: 'stealth_hood',
    rig: 'recon'
  },
  {
    id: 'nomad',
    name: 'NOMAD',
    Name: 'NOMAD',
    role: 'Arid Specialist',
    Role: 'Arid Specialist',
    defaultSkin: 'desert_camo',
    primaryColor: 0xb89768,
    accentColor: 0xd97706,
    headgear: 'shemagh',
    rig: 'comms'
  },
  {
    id: 'frost',
    name: 'FROST',
    Name: 'FROST',
    role: 'Arctic Warfare',
    Role: 'Arctic Warfare',
    defaultSkin: 'arctic_camo',
    primaryColor: 0xcbd5e1,
    accentColor: 0x0ea5e9,
    headgear: 'arctic_visor',
    rig: 'thermal'
  },
  {
    id: 'corsair',
    name: 'CORSAIR',
    Name: 'CORSAIR',
    role: 'Maritime CQB',
    Role: 'Maritime CQB',
    defaultSkin: 'naval',
    primaryColor: 0x172554,
    accentColor: 0x10b981,
    headgear: 'rebreather',
    rig: 'maritime'
  },
  {
    id: 'titan',
    name: 'TITAN',
    Name: 'TITAN',
    role: 'Armored Exosuit',
    Role: 'Armored Exosuit',
    defaultSkin: 'crimson',
    primaryColor: 0x27272a,
    accentColor: 0xef4444,
    headgear: 'blast_helmet',
    rig: 'exosuit'
  }
];

for (const op of OPERATOR_CATALOG) {
  Object.defineProperty(OPERATOR_CATALOG, op.id, {
    value: op,
    enumerable: false,
    configurable: true
  });
}

export const ENEMY_CLASS_CATALOG = [
  {
    id: 'scout',
    name: 'Syndicate Scout',
    Name: 'Syndicate Scout',
    hp: 85,
    moveSpeed: 6.0,
    burstSize: 3,
    burstIntervalMs: 190,
    damage: 10,
    clothColor: 0x2b3440,
    color: 0x14867c,
    rigColor: 0x1a2029,
    accent: 0x2dd4bf,
    scale: 0.96,
    role: 'flanker',
    Role: 'flanker',
    headgear: 'stealth_hood',
    rig: 'recon'
  },
  {
    id: 'trooper',
    name: 'Syndicate Trooper',
    Name: 'Syndicate Trooper',
    hp: 100,
    moveSpeed: 4.8,
    burstSize: 3,
    burstIntervalMs: 250,
    damage: 12,
    clothColor: 0x333a47,
    color: 0xb92b27,
    rigColor: 0x1b2028,
    accent: 0xf87171,
    scale: 1.0,
    role: 'assault',
    Role: 'assault',
    headgear: 'nvg',
    rig: 'comms'
  },
  {
    id: 'breacher',
    name: 'Heavy Breacher',
    Name: 'Heavy Breacher',
    hp: 120,
    moveSpeed: 5.2,
    burstSize: 2,
    burstIntervalMs: 310,
    damage: 15,
    clothColor: 0x3b352f,
    color: 0xc26512,
    rigColor: 0x201d1a,
    accent: 0xfbbf24,
    scale: 1.04,
    role: 'rusher',
    Role: 'rusher',
    headgear: 'rebreather',
    rig: 'heavy'
  },
  {
    id: 'marksman',
    name: 'Recon Marksman',
    Name: 'Recon Marksman',
    hp: 90,
    moveSpeed: 4.4,
    burstSize: 1,
    burstIntervalMs: 650,
    damage: 22,
    clothColor: 0x353f31,
    color: 0x5b7f1e,
    rigColor: 0x1f251d,
    accent: 0xbef264,
    scale: 0.98,
    role: 'sniper',
    Role: 'sniper',
    headgear: 'arctic_visor',
    rig: 'recon'
  },
  {
    id: 'juggernaut',
    name: 'Armored Juggernaut',
    Name: 'Armored Juggernaut',
    hp: 150,
    moveSpeed: 3.9,
    burstSize: 5,
    burstIntervalMs: 165,
    damage: 14,
    clothColor: 0x2f3646,
    color: 0x46529e,
    rigColor: 0x1b1f29,
    accent: 0x93c5fd,
    scale: 1.08,
    role: 'heavy',
    Role: 'heavy',
    headgear: 'blast_helmet',
    rig: 'exosuit'
  }
];

for (const cls of ENEMY_CLASS_CATALOG) {
  Object.defineProperty(ENEMY_CLASS_CATALOG, cls.id, {
    value: cls,
    enumerable: false,
    configurable: true
  });
}

function toHexCss(numColor = 0x38bdf8) {
  if (typeof numColor === 'string') return numColor;
  return `#${Number(numColor).toString(16).padStart(6, '0')}`;
}

export function createNameTagSprite(name, colorHex = '#38bdf8') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 52;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(10, 14, 20, 0.82)';
  ctx.beginPath();
  ctx.roundRect(8, 8, 240, 36, 8);
  ctx.fill();
  ctx.strokeStyle = toHexCss(colorHex);
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 18px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((name || 'Operator').slice(0, 18), 128, 27);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.48, 0.3, 1);
  sprite.position.set(0, 2.24, 0);
  return { sprite, tex, mat };
}

function resolveSoldierAppearance(colorOrConfig, extraOptions = null) {
  const isObj = typeof colorOrConfig === 'object' && colorOrConfig !== null;
  const baseCfg = isObj ? colorOrConfig : { color: colorOrConfig };
  const cfg = extraOptions && typeof extraOptions === 'object' ? { ...baseCfg, ...extraOptions } : baseCfg;

  const opSpec = cfg.operatorId
    ? OPERATOR_CATALOG.find((o) => o.id === cfg.operatorId) || OPERATOR_CATALOG[0]
    : null;
  const enemySpec = cfg.enemyClass
    ? ENEMY_CLASS_CATALOG.find((e) => e.id === cfg.enemyClass) || ENEMY_CLASS_CATALOG[1]
    : null;

  const rawSkinId = cfg.skinId || (opSpec ? opSpec.defaultSkin : null);
  const skinSpec = rawSkinId ? resolveSkinCatalogEntry(rawSkinId) : null;
  const skinId = skinSpec ? skinSpec.id : rawSkinId;

  const primaryColor =
    (enemySpec ? enemySpec.color : null) ??
    (skinSpec ? new THREE.Color(skinSpec.primary).getHex() : null) ??
    (opSpec ? opSpec.primaryColor : null) ??
    cfg.color ??
    0x3b4958;

  const accentColor =
    (enemySpec ? enemySpec.accent : null) ??
    (opSpec ? opSpec.accentColor : null) ??
    (skinSpec ? new THREE.Color(skinSpec.accent).getHex() : 0x38bdf8);

  const clothColor =
    enemySpec && enemySpec.clothColor !== undefined
      ? enemySpec.clothColor
      : skinSpec
        ? new THREE.Color(skinSpec.cloth).getHex()
        : new THREE.Color(primaryColor).multiplyScalar(0.82).getHex();

  const rigColor =
    enemySpec && enemySpec.rigColor !== undefined
      ? enemySpec.rigColor
      : skinSpec
        ? new THREE.Color(skinSpec.secondary).getHex()
        : 0x1b222c;

  const headgear = (opSpec && opSpec.headgear) || (enemySpec && enemySpec.headgear) || 'nvg';
  const rig = (opSpec && opSpec.rig) || (enemySpec && enemySpec.rig) || 'heavy';
  const scale = enemySpec && enemySpec.scale ? enemySpec.scale : 1.0;
  const quality = cfg.quality || 'balanced';
  const textureLib = cfg.textureLib || null;
  const showNameTag = cfg.showNameTag !== undefined ? Boolean(cfg.showNameTag) : true;

  return {
    opSpec,
    enemySpec,
    skinId,
    skinSpec,
    primaryColor,
    accentColor,
    clothColor,
    rigColor,
    headgear,
    rig,
    scale,
    quality,
    textureLib,
    showNameTag
  };
}

/**
 * Dynamically updates an existing soldier model's PBR material palette and procedural skin textures.
 */
export function applySoldierSkin(model, skinId, textureLib = null, quality = 'balanced') {
  if (!model || !model.materialMap) return;
  const skinSpec = resolveSkinCatalogEntry(skinId);
  const skinTex =
    textureLib && typeof textureLib.getSkinTextureSet === 'function'
      ? textureLib.getSkinTextureSet(skinSpec.id)
      : null;
  const isTextileSkin =
    skinSpec.id === 'desert_camo' ||
    skinSpec.id === 'woodland' ||
    skinSpec.id === 'arctic_camo';

  const { bduMat, armorMat, rigMat, accentMat, iffMat, visorMat } = model.materialMap;
  if (bduMat) {
    bduMat.color.set(skinTex && isTextileSkin ? 0xdbe3ee : skinSpec.cloth);
    if ('map' in bduMat) bduMat.map = skinTex && isTextileSkin ? skinTex.map : null;
    if ('normalMap' in bduMat && quality !== 'fast') bduMat.normalMap = skinTex && isTextileSkin ? skinTex.normalMap : null;
    if ('roughnessMap' in bduMat) bduMat.roughnessMap = null;
    if (bduMat.normalScale) bduMat.normalScale.set(0.32, 0.32);
    if ('roughness' in bduMat) bduMat.roughness = 0.88;
    if ('metalness' in bduMat) bduMat.metalness = 0.02;
    if ('clearcoat' in bduMat) bduMat.clearcoat = 0.0;
    bduMat.needsUpdate = true;
  }

  if (armorMat) {
    armorMat.color.set(skinTex ? 0xffffff : skinSpec.primary);
    if ('map' in armorMat) armorMat.map = skinTex ? skinTex.map : null;
    if ('normalMap' in armorMat && quality !== 'fast') armorMat.normalMap = skinTex ? skinTex.normalMap : null;
    if ('roughnessMap' in armorMat && quality !== 'fast') armorMat.roughnessMap = skinTex ? skinTex.roughnessMap : null;
    if (armorMat.normalScale) armorMat.normalScale.set(0.32, 0.32);
    if ('roughness' in armorMat) {
      armorMat.roughness = skinTex && skinTex.roughnessMap
        ? Math.min(0.95, Math.max(0.56, skinSpec.roughness + 0.32))
        : 0.56;
    }
    if ('metalness' in armorMat) armorMat.metalness = Math.min(0.38, Math.max(0.18, skinSpec.metalness * 0.65));
    if ('clearcoat' in armorMat) armorMat.clearcoat = Math.min(0.18, (skinSpec.clearcoat || 0.08) * 0.6);
    armorMat.needsUpdate = true;
  }

  if (rigMat) {
    rigMat.color.set(skinSpec.secondary);
    if ('roughness' in rigMat) rigMat.roughness = 0.84;
    if ('metalness' in rigMat) rigMat.metalness = 0.06;
    if ('clearcoat' in rigMat) rigMat.clearcoat = 0.0;
    rigMat.needsUpdate = true;
  }

  if (accentMat && !model.enemySpec) {
    accentMat.color.set(skinSpec.accent);
    if ('emissiveIntensity' in accentMat) accentMat.emissiveIntensity = 0.0;
    accentMat.needsUpdate = true;
  }

  if (iffMat && !model.enemySpec) {
    iffMat.color.set(skinSpec.accent);
    if ('emissive' in iffMat) iffMat.emissive.set(skinSpec.accent);
    iffMat.needsUpdate = true;
  }

  if (visorMat && !model.enemySpec && 'emissive' in visorMat) {
    visorMat.emissive.set(skinSpec.accent);
    visorMat.needsUpdate = true;
  }
}

/**
 * Builds a realistic 1.83m tall (1 unit = 1m) multi-joint articulated tactical Operator or Syndicate Enemy mesh:
 * - `bodyGroup` -> `torsoPivot` at waist height (y = 1.00m) with V-taper chest, oblique waist, curved ballistic plates,
 *   collar gaiter, and spine hydration pack / radio.
 * - 2-segment articulated legs (`leftLeg` -> `leftKneePivot`, `rightLeg` -> `rightKneePivot`) with hip at y = 0.90m,
 *   knee at y = -0.41m, and sculpted combat boots resting cleanly at y = 0.00m.
 * - 2-segment articulated arms (`leftArm` -> `leftElbowPivot`, `rightArm` -> `rightElbowPivot`) with rounded deltoid
 *   caps, patch panels, elbow pads, tapered forearms, tactical wrist watch/comms, and sculpted gloved hands with
 *   thumb + curled fingers gripping the 3rd-person suppressed carbine across the chest.
 * - `headGroup` inside `torsoPivot` at y = 0.62m (1.62m world height) with sculpted neck, jawline/balaclava,
 *   anatomical cranium dome, ear-pro headset cups with mic boom, and class-specific visor/NVG/hood details.
 */
export function buildSoldierMesh(
  entityId,
  name,
  colorOrConfig = 0x3b4958,
  castShadows = true,
  extraOptions = null
) {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const app = resolveSoldierAppearance(colorOrConfig, extraOptions);
  const {
    quality,
    textureLib,
    skinId,
    skinSpec,
    primaryColor,
    accentColor,
    clothColor,
    rigColor,
    headgear,
    rig
  } = app;

  const resolvedSkinId = skinSpec ? skinSpec.id : skinId;
  const skinTex =
    textureLib && resolvedSkinId && typeof textureLib.getSkinTextureSet === 'function'
      ? textureLib.getSkinTextureSet(resolvedSkinId)
      : null;
  const hasSkinMap = Boolean(skinTex && skinTex.map && !app.enemySpec);
  const isTextileSkin =
    resolvedSkinId === 'desert_camo' ||
    resolvedSkinId === 'woodland' ||
    resolvedSkinId === 'arctic_camo';

  // Woven tactical BDU fabric: strictly matte (roughness 0.88, metalness 0.02, zero clearcoat)
  const bduMat = createQualityMaterial(
    {
      color: hasSkinMap && isTextileSkin ? 0xdbe3ee : clothColor,
      map: hasSkinMap && isTextileSkin ? skinTex.map : null,
      normalMap: !app.enemySpec && isTextileSkin && skinTex ? skinTex.normalMap : null,
      normalScale: new THREE.Vector2(0.32, 0.32),
      roughnessMap: null,
      roughness: 0.88,
      metalness: 0.02,
      clearcoat: 0.0
    },
    quality
  );

  // Matte anodized ballistic ceramic / Kevlar armor plating (calm 0.32 normalScale, no plastic glare)
  const armorMat = createQualityMaterial(
    {
      color: hasSkinMap ? 0xffffff : primaryColor,
      map: hasSkinMap ? skinTex.map : null,
      normalMap: !app.enemySpec && skinTex ? skinTex.normalMap : null,
      normalScale: new THREE.Vector2(0.32, 0.32),
      roughnessMap: !app.enemySpec && skinTex ? skinTex.roughnessMap : null,
      roughness:
        !app.enemySpec && skinTex && skinTex.roughnessMap
          ? Math.min(0.95, Math.max(0.56, (skinSpec?.roughness ?? 0.56) + 0.32))
          : 0.56,
      metalness:
        !app.enemySpec && skinSpec
          ? Math.min(0.38, Math.max(0.18, skinSpec.metalness * 0.65))
          : 0.24,
      clearcoat:
        !app.enemySpec && skinSpec
          ? Math.min(0.18, (skinSpec.clearcoat || 0.08) * 0.6)
          : 0.08
    },
    quality
  );

  // Heavy ballistic Cordura nylon webbing, pouches, belt & holsters
  const rigMat = createQualityMaterial(
    {
      color: rigColor,
      roughness: 0.84,
      metalness: 0.06,
      clearcoat: 0.0
    },
    quality
  );

  // Matte anodized trim hardware (buckles, knee caps, valves — non-emissive)
  const accentMat = createQualityMaterial(
    {
      color: accentColor,
      roughness: 0.48,
      metalness: 0.34,
      clearcoat: 0.12
    },
    quality
  );

  // Crisp small tactical IFF chevrons, shoulder patches, helmet visors & optic lenses ONLY
  const iffMat = createQualityMaterial(
    {
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 0.38,
      roughness: 0.32,
      metalness: 0.38,
      clearcoat: 0.16
    },
    quality
  );

  const bootMat = createQualityMaterial(
    {
      color: 0x14181f,
      roughness: 0.84,
      metalness: 0.08,
      clearcoat: 0.0
    },
    quality
  );

  const skinMat = createQualityMaterial(
    {
      color: 0xd4a587,
      roughness: 0.74,
      metalness: 0.02,
      clearcoat: 0.0
    },
    quality
  );

  const visorMat = createQualityMaterial(
    {
      color: 0x0b1322,
      emissive: accentColor,
      emissiveIntensity: app.enemySpec ? 0.38 : 0.22,
      roughness: 0.16,
      metalness: 0.85,
      clearcoat: 0.62
    },
    quality
  );

  const gunMat = createQualityMaterial(
    {
      color: 0x181d24,
      roughness: 0.42,
      metalness: 0.72,
      clearcoat: 0.14
    },
    quality
  );

  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffd166,
    transparent: true,
    opacity: 0.92
  });

  const hitMeshes = [];
  const tagPart = (mesh, hitZone = 'torso') => {
    const isHead = hitZone === 'head';
    mesh.userData = {
      entityType: 'player',
      playerId: entityId,
      isHead,
      hitZone
    };
    mesh.castShadow = castShadows;
    mesh.receiveShadow = castShadows;
    hitMeshes.push(mesh);
    return mesh;
  };

  const styleDeco = (mesh) => {
    mesh.castShadow = castShadows;
    mesh.receiveShadow = castShadows;
    return mesh;
  };

  // ============================================================================
  // 1. ARTICULATED 2-SEGMENT LEGS (Hip at y = 0.90m, Knee at -0.41m, Boot sole at 0.00m)
  // ============================================================================
  const makeLeg = (xOffset, isRight) => {
    const hip = new THREE.Group();
    hip.position.set(xOffset, 0.90, 0);

    // Rounded hip ball joint so stride rotation stays organic and gap-free
    const hipJoint = tagPart(
      new THREE.Mesh(new THREE.SphereGeometry(0.106, 12, 10), bduMat),
      'limb'
    );
    hipJoint.scale.set(0.96, 0.92, 1.02);
    hipJoint.position.set(0, -0.02, 0);

    // Sculpted anatomical upper thigh (y = 0 to -0.41m) with quadriceps contour
    const upperThigh = tagPart(
      new THREE.Mesh(new THREE.CylinderGeometry(0.112, 0.092, 0.38, 14), bduMat),
      'limb'
    );
    upperThigh.scale.set(0.98, 1.0, 1.08);
    upperThigh.position.set(0, -0.205, 0);

    // Sculpted front quadriceps muscle sweep
    const quadSweep = tagPart(
      new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.20, 6, 10), bduMat),
      'limb'
    );
    quadSweep.scale.set(1.05, 1.0, 0.78);
    quadSweep.position.set(0, -0.19, -0.032);

    // Outer beveled ballistic thigh plate contoured smoothly along leg angle
    const thighPlate = styleDeco(
      new THREE.Mesh(createBeveledBox(0.048, 0.205, 0.142, 0.016, 2), armorMat)
    );
    thighPlate.rotation.z = isRight ? -0.05 : 0.05;
    thighPlate.position.set(isRight ? 0.088 : -0.088, -0.195, 0);

    hip.add(hipJoint, upperThigh, quadSweep, thighPlate);

    if (isRight) {
      // Right thigh drop-leg Kydex holster + sidearm pistol + dual leg straps
      for (const sy of [-0.14, -0.25]) {
        const legStrap = styleDeco(
          new THREE.Mesh(new THREE.CylinderGeometry(0.112, 0.106, 0.026, 12), rigMat)
        );
        legStrap.position.set(0, sy, 0);
        hip.add(legStrap);
      }

      const holsterBody = styleDeco(
        new THREE.Mesh(createBeveledBox(0.066, 0.175, 0.112, 0.016, 2), rigMat)
      );
      holsterBody.position.set(0.112, -0.195, -0.01);

      const pistolSlide = styleDeco(
        new THREE.Mesh(createBeveledBox(0.036, 0.065, 0.085, 0.008, 2), gunMat)
      );
      pistolSlide.position.set(0.114, -0.105, -0.01);

      const pistolGrip = styleDeco(
        new THREE.Mesh(createBeveledBox(0.034, 0.075, 0.045, 0.008, 2), accentMat)
      );
      pistolGrip.rotation.x = -0.28;
      pistolGrip.position.set(0.114, -0.08, 0.032);

      hip.add(holsterBody, pistolSlide, pistolGrip);
    } else {
      // Left thigh cargo mag pouch + CAT combat tourniquet
      const thighStrap = styleDeco(
        new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.105, 0.03, 12), rigMat)
      );
      thighStrap.position.set(0, -0.195, 0);

      const thighPouch = styleDeco(
        new THREE.Mesh(createBeveledBox(0.056, 0.145, 0.095, 0.014, 2), rigMat)
      );
      thighPouch.position.set(-0.106, -0.195, -0.012);

      const tourniquetTab = styleDeco(
        new THREE.Mesh(createBeveledBox(0.022, 0.065, 0.028, 0.005, 2), accentMat)
      );
      tourniquetTab.position.set(-0.132, -0.18, -0.012);

      hip.add(thighStrap, thighPouch, tourniquetTab);
    }

    // Articulated knee pivot at y = -0.41m relative to hip (0.49m world height)
    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.41, 0);

    const kneeJoint = tagPart(
      new THREE.Mesh(new THREE.SphereGeometry(0.086, 12, 10), bduMat),
      'limb'
    );
    kneeJoint.position.set(0, 0, 0);

    // Contoured hard-shell knee pad + high-impact cap
    const kneePad = styleDeco(
      new THREE.Mesh(createBeveledBox(0.128, 0.122, 0.082, 0.026, 2), armorMat)
    );
    kneePad.position.set(0, 0.005, -0.062);

    const kneeCapAccent = styleDeco(
      new THREE.Mesh(createBeveledBox(0.082, 0.044, 0.024, 0.008, 2), accentMat)
    );
    kneeCapAccent.position.set(0, 0.005, -0.098);

    // Tapered calf / shin (y = 0 to -0.37m inside kneePivot)
    const calf = tagPart(
      new THREE.Mesh(new THREE.CylinderGeometry(0.090, 0.068, 0.36, 14), bduMat),
      'limb'
    );
    calf.scale.set(0.96, 1.0, 1.06);
    calf.position.set(0, -0.185, 0.006);

    // Gastrocnemius rear calf muscle curve
    const calfMuscle = tagPart(
      new THREE.Mesh(new THREE.SphereGeometry(0.078, 10, 8), bduMat),
      'limb'
    );
    calfMuscle.scale.set(0.92, 1.45, 0.95);
    calfMuscle.position.set(0, -0.13, 0.028);

    // Contoured front shin guard greave
    const shinGuard = styleDeco(
      new THREE.Mesh(createBeveledBox(0.104, 0.225, 0.062, 0.018, 2), armorMat)
    );
    shinGuard.position.set(0, -0.19, -0.048);

    if (rig === 'exosuit') {
      const exoStrut = styleDeco(
        new THREE.Mesh(createFlutedCylinder(0.022, 0.02, 0.32, 10, 4, 6, 0.004), gunMat)
      );
      exoStrut.position.set(isRight ? 0.092 : -0.092, -0.185, 0);
      kneePivot.add(exoStrut);
    }

    // Ankle joint at y = -0.37m
    const ankleJoint = tagPart(
      new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 8), rigMat),
      'limb'
    );
    ankleJoint.position.set(0, -0.37, 0);

    // Sculpted combat boot (-0.37m to -0.49m inside kneePivot -> sole rests at exact y = 0.00m)
    const bootCuff = styleDeco(
      new THREE.Mesh(new THREE.CylinderGeometry(0.076, 0.082, 0.075, 12), rigMat)
    );
    bootCuff.position.set(0, -0.375, 0.004);

    const bootUpper = tagPart(
      new THREE.Mesh(createBeveledBox(0.118, 0.096, 0.205, 0.026, 2), bootMat),
      'limb'
    );
    bootUpper.position.set(0, -0.422, -0.024);

    const bootHeel = styleDeco(
      new THREE.Mesh(createBeveledBox(0.122, 0.068, 0.085, 0.016, 2), rigMat)
    );
    bootHeel.position.set(0, -0.436, 0.042);

    const bootToe = styleDeco(
      new THREE.Mesh(new THREE.SphereGeometry(0.060, 12, 8), armorMat)
    );
    bootToe.scale.set(1.04, 0.72, 1.38);
    bootToe.position.set(0, -0.442, -0.122);

    const bootSole = tagPart(
      new THREE.Mesh(createBeveledBox(0.132, 0.038, 0.272, 0.010, 2), bootMat),
      'limb'
    );
    // -0.471 - (0.038 / 2) = -0.490m inside kneePivot -> 0.90 - 0.41 - 0.49 = 0.000m world height
    bootSole.position.set(0, -0.471, -0.034);

    kneePivot.add(
      kneeJoint,
      kneePad,
      kneeCapAccent,
      calf,
      calfMuscle,
      shinGuard,
      ankleJoint,
      bootCuff,
      bootUpper,
      bootHeel,
      bootToe,
      bootSole
    );
    hip.add(kneePivot);

    return { hip, kneePivot };
  };

  const leftLegObj = makeLeg(-0.135, false);
  const rightLegObj = makeLeg(0.135, true);
  const leftLeg = leftLegObj.hip;
  const rightLeg = rightLegObj.hip;
  const leftKneePivot = leftLegObj.kneePivot;
  const rightKneePivot = rightLegObj.kneePivot;

  // ============================================================================
  // 2. PELVIS & BATTLE BELT (Inside bodyGroup around y = 0.90m - 1.00m)
  // ============================================================================
  const pelvis = tagPart(
    new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.185, 0.16, 14), bduMat),
    'torso'
  );
  pelvis.scale.set(1.14, 1.0, 0.78);
  pelvis.position.set(0, 0.92, 0);

  const groinPad = tagPart(
    new THREE.Mesh(createBeveledBox(0.18, 0.13, 0.055, 0.018, 2), armorMat),
    'torso'
  );
  groinPad.rotation.x = 0.12;
  groinPad.position.set(0, 0.87, -0.135);

  const belt = styleDeco(
    new THREE.Mesh(createBeveledBox(0.445, 0.078, 0.295, 0.022, 2), rigMat)
  );
  belt.position.set(0, 0.96, 0);

  const beltBuckle = styleDeco(
    new THREE.Mesh(createBeveledBox(0.074, 0.052, 0.032, 0.008, 2), accentMat)
  );
  beltBuckle.position.set(0, 0.96, -0.152);

  const sidePouchL = styleDeco(
    new THREE.Mesh(createBeveledBox(0.068, 0.115, 0.095, 0.016, 2), rigMat)
  );
  sidePouchL.position.set(-0.228, 0.955, 0.01);

  const sidePouchR = styleDeco(
    new THREE.Mesh(createBeveledBox(0.068, 0.115, 0.095, 0.016, 2), rigMat)
  );
  sidePouchR.position.set(0.228, 0.955, 0.01);

  const rearIfak = styleDeco(
    new THREE.Mesh(createBeveledBox(0.155, 0.105, 0.082, 0.018, 2), rigMat)
  );
  rearIfak.position.set(0, 0.96, 0.162);

  bodyGroup.add(
    leftLeg,
    rightLeg,
    pelvis,
    groinPad,
    belt,
    beltBuckle,
    sidePouchL,
    sidePouchR,
    rearIfak
  );

  // ============================================================================
  // 3. TORSO PIVOT (Inside bodyGroup at waist height y = 1.00m)
  // ============================================================================
  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 1.00, 0);
  bodyGroup.add(torsoPivot);

  // Anatomical oblique waist transition blending pelvis into upper ribcage
  const waistObliques = tagPart(
    new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.185, 0.20, 14), bduMat),
    'torso'
  );
  waistObliques.scale.set(1.12, 1.0, 0.74);
  waistObliques.position.set(0, 0.09, 0);

  // Sculpted V-taper upper chest & latissimus dorsi ribcage
  const upperChest = tagPart(
    new THREE.Mesh(new THREE.CylinderGeometry(0.246, 0.202, 0.36, 16), bduMat),
    'torso'
  );
  upperChest.scale.set(1.16, 1.0, 0.75);
  upperChest.position.set(0, 0.31, 0);

  // Trapezius / upper shoulder slope bridge
  const trapsSlope = tagPart(
    new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.255, 0.11, 14), bduMat),
    'torso'
  );
  trapsSlope.scale.set(1.18, 1.0, 0.68);
  trapsSlope.position.set(0, 0.51, 0.008);

  // Collar / neck gaiter ring at top of torso
  const collarGaiter = styleDeco(
    new THREE.Mesh(new THREE.TorusGeometry(0.112, 0.034, 10, 18), rigMat)
  );
  collarGaiter.rotation.x = Math.PI / 2 + 0.08;
  collarGaiter.position.set(0, 0.545, 0.005);

  // Contoured multi-curve front & rear ballistic plate-carrier plates
  const frontPlateLower = tagPart(
    new THREE.Mesh(createBeveledBox(0.325, 0.26, 0.072, 0.024, 3), armorMat),
    'torso'
  );
  frontPlateLower.position.set(0, 0.21, -0.148);

  const frontPlateUpper = tagPart(
    new THREE.Mesh(createBeveledBox(0.295, 0.17, 0.068, 0.022, 3), armorMat),
    'torso'
  );
  frontPlateUpper.rotation.x = 0.14;
  frontPlateUpper.position.set(0, 0.38, -0.142);

  const backPlate = tagPart(
    new THREE.Mesh(createBeveledBox(0.32, 0.36, 0.074, 0.026, 3), armorMat),
    'torso'
  );
  backPlate.position.set(0, 0.28, 0.142);

  const cummerbund = styleDeco(
    new THREE.Mesh(createBeveledBox(0.475, 0.15, 0.275, 0.022, 2), rigMat)
  );
  cummerbund.position.set(0, 0.17, 0);

  // Shoulder yoke straps
  for (const side of [-1, 1]) {
    const yoke = styleDeco(
      new THREE.Mesh(createBeveledBox(0.088, 0.052, 0.27, 0.016, 2), rigMat)
    );
    yoke.position.set(side * 0.142, 0.47, 0);
    torsoPivot.add(yoke);
  }

  // 3 STANAG Magazine pouches on front chest carrier
  for (let i = -1; i <= 1; i++) {
    const magPouch = styleDeco(
      new THREE.Mesh(createBeveledBox(0.076, 0.135, 0.052, 0.014, 2), rigMat)
    );
    magPouch.position.set(i * 0.094, 0.165, -0.192);

    const magTop = styleDeco(
      new THREE.Mesh(createBeveledBox(0.060, 0.042, 0.036, 0.008, 2), gunMat)
    );
    magTop.position.set(i * 0.094, 0.245, -0.192);
    torsoPivot.add(magPouch, magTop);
  }

  // Chest admin panel + glowing tactical IFF badge + PTT comms module
  const adminPouch = styleDeco(
    new THREE.Mesh(createBeveledBox(0.165, 0.082, 0.040, 0.012, 2), rigMat)
  );
  adminPouch.position.set(0, 0.355, -0.182);

  const iffStrip = styleDeco(
    new THREE.Mesh(createBeveledBox(0.072, 0.024, 0.016, 0.005, 2), iffMat)
  );
  iffStrip.position.set(0, 0.355, -0.202);

  const pttBox = styleDeco(
    new THREE.Mesh(createBeveledBox(0.042, 0.052, 0.026, 0.006, 2), gunMat)
  );
  pttBox.position.set(-0.115, 0.42, -0.162);

  // Spine Hydration Pack / Dorsal Assault Pack + Radio + Whip Antenna
  const backpack = styleDeco(
    new THREE.Mesh(createBeveledBox(0.265, 0.34, 0.125, 0.028, 2), armorMat)
  );
  backpack.position.set(0, 0.28, 0.215);

  const hydrationBladder = styleDeco(
    new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.22, 6, 10), rigMat)
  );
  hydrationBladder.position.set(0, 0.29, 0.275);

  const packPouch = styleDeco(
    new THREE.Mesh(createBeveledBox(0.21, 0.135, 0.058, 0.018, 2), rigMat)
  );
  packPouch.position.set(0, 0.19, 0.282);

  const radioBox = styleDeco(
    new THREE.Mesh(createBeveledBox(0.082, 0.155, 0.062, 0.014, 2), gunMat)
  );
  radioBox.position.set(-0.132, 0.36, 0.182);

  const antenna = styleDeco(
    new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0085, 0.38, 6), gunMat)
  );
  antenna.position.set(-0.142, 0.61, 0.182);

  // Rig-specific dorsal & collar attachments
  if (rig === 'heavy') {
    const neckArmor = styleDeco(
      new THREE.Mesh(new THREE.TorusGeometry(0.142, 0.034, 8, 16), armorMat)
    );
    neckArmor.rotation.x = Math.PI / 2;
    neckArmor.position.set(0, 0.49, 0);

    const breachRam = styleDeco(
      new THREE.Mesh(createFlutedCylinder(0.036, 0.036, 0.44, 10, 4, 8, 0.005), gunMat)
    );
    breachRam.rotation.z = 0.26;
    breachRam.position.set(0.138, 0.30, 0.245);
    torsoPivot.add(neckArmor, breachRam);
  } else if (rig === 'maritime') {
    for (const side of [-0.072, 0.072]) {
      const o2Tank = styleDeco(
        new THREE.Mesh(createFlutedCylinder(0.054, 0.054, 0.33, 12, 4, 8, 0.003), accentMat)
      );
      o2Tank.position.set(side, 0.28, 0.28);
      torsoPivot.add(o2Tank);
    }
  } else if (rig === 'thermal') {
    const parkaCollar = styleDeco(
      new THREE.Mesh(new THREE.TorusGeometry(0.148, 0.042, 8, 16), bduMat)
    );
    parkaCollar.rotation.x = Math.PI / 2;
    parkaCollar.position.set(0, 0.49, 0);

    const cryoCore = styleDeco(
      new THREE.Mesh(createFlutedCylinder(0.046, 0.046, 0.27, 12, 4, 10, 0.004), accentMat)
    );
    cryoCore.position.set(0, 0.29, 0.295);
    torsoPivot.add(parkaCollar, cryoCore);
  } else if (rig === 'exosuit') {
    const spine = styleDeco(
      new THREE.Mesh(createFlutedCylinder(0.042, 0.042, 0.46, 12, 6, 8, 0.006), gunMat)
    );
    spine.position.set(0, 0.27, 0.29);

    for (const side of [-0.142, 0.142]) {
      const exoPod = styleDeco(
        new THREE.Mesh(createBeveledBox(0.092, 0.30, 0.115, 0.022, 2), armorMat)
      );
      exoPod.position.set(side, 0.30, 0.265);
      const podVent = styleDeco(
        new THREE.Mesh(createBeveledBox(0.028, 0.14, 0.020, 0.006, 2), iffMat)
      );
      podVent.position.set(side, 0.30, 0.324);
      torsoPivot.add(exoPod, podVent);
    }
    torsoPivot.add(spine);
  } else if (rig === 'comms') {
    const satDish = styleDeco(
      new THREE.Mesh(createBeveledBox(0.105, 0.155, 0.042, 0.012, 2), accentMat)
    );
    satDish.position.set(0.122, 0.37, 0.215);
    const antennaR = styleDeco(
      new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.008, 0.42, 6), gunMat)
    );
    antennaR.position.set(0.138, 0.64, 0.195);
    torsoPivot.add(satDish, antennaR);
  }

  torsoPivot.add(
    waistObliques,
    upperChest,
    trapsSlope,
    collarGaiter,
    frontPlateLower,
    frontPlateUpper,
    backPlate,
    cummerbund,
    adminPouch,
    iffStrip,
    pttBox,
    backpack,
    hydrationBladder,
    packPouch,
    radioBox,
    antenna
  );

  // ============================================================================
  // 4. HEAD & HELMET (headGroup inside torsoPivot at y = 0.62m -> 1.62m world height)
  // ============================================================================
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.62, 0);
  torsoPivot.add(headGroup);

  // Sculpted neck & ribbed balaclava throat
  const neck = tagPart(
    new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.086, 0.125, 12), skinMat),
    'head'
  );
  neck.position.set(0, -0.045, 0.005);

  const balaclavaNeck = styleDeco(
    new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.095, 0.09, 12), rigMat)
  );
  balaclavaNeck.position.set(0, -0.035, 0.005);

  // Anatomical cranium dome
  const cranium = tagPart(
    new THREE.Mesh(new THREE.SphereGeometry(0.138, 16, 14), skinMat),
    'head'
  );
  cranium.scale.set(0.94, 1.08, 1.03);
  cranium.position.set(0, 0.075, 0);

  // Sculpted jawline & lower balaclava mask
  const jawline = tagPart(
    new THREE.Mesh(createBeveledBox(0.158, 0.096, 0.148, 0.032, 3), rigMat),
    'head'
  );
  jawline.rotation.x = 0.08;
  jawline.position.set(0, 0.022, -0.034);

  const chinGuard = styleDeco(
    new THREE.Mesh(createBeveledBox(0.092, 0.042, 0.048, 0.012, 2), armorMat)
  );
  chinGuard.position.set(0, -0.008, -0.096);

  // High-Cut FAST Ballistic Helmet Dome (reaches ~1.83m world height)
  const helmet = tagPart(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.162, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
      armorMat
    ),
    'head'
  );
  helmet.position.set(0, 0.096, 0.006);
  helmet.rotation.x = -0.12;

  // Rear helmet battery pack counterweight & crisp rear helmet IFF strobe strip
  const helmetBattery = styleDeco(
    new THREE.Mesh(createBeveledBox(0.082, 0.058, 0.042, 0.010, 2), rigMat)
  );
  helmetBattery.position.set(0, 0.095, 0.162);

  const helmetIff = styleDeco(
    new THREE.Mesh(createBeveledBox(0.052, 0.016, 0.012, 0.004, 2), iffMat)
  );
  helmetIff.position.set(0, 0.102, 0.184);

  // Wrap-around ballistic visor
  const visor = tagPart(
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.148,
        0.148,
        0.074,
        16,
        1,
        false,
        -Math.PI * 0.38,
        Math.PI * 0.76
      ),
      visorMat
    ),
    'head'
  );
  visor.position.set(0, 0.080, -0.016);
  visor.rotation.y = Math.PI;

  // Ear-pro tactical headset cups + ARC rails + curved mic boom
  for (const side of [-1, 1]) {
    const earCup = styleDeco(
      new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.050, 0.040, 12), rigMat)
    );
    earCup.rotation.z = Math.PI / 2;
    earCup.position.set(side * 0.148, 0.068, 0.008);

    const earSeal = styleDeco(
      new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.012, 8, 12), bootMat)
    );
    earSeal.rotation.y = Math.PI / 2;
    earSeal.position.set(side * 0.132, 0.068, 0.008);

    const rail = styleDeco(
      new THREE.Mesh(createBeveledBox(0.022, 0.030, 0.145, 0.006, 2), gunMat)
    );
    rail.position.set(side * 0.154, 0.114, -0.008);
    headGroup.add(earCup, earSeal, rail);
  }

  // Headset mic boom extending from left ear-pro cup to mouth
  const micBoom = styleDeco(
    new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.135, 8), gunMat)
  );
  micBoom.rotation.set(Math.PI / 2 - 0.25, 0, -0.46);
  micBoom.position.set(-0.112, 0.032, -0.068);

  const micTip = styleDeco(
    new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), bootMat)
  );
  micTip.scale.set(1.0, 0.85, 1.4);
  micTip.position.set(-0.078, 0.018, -0.128);
  headGroup.add(micBoom, micTip);

  // Operator & Enemy Headgear Specializations
  if (headgear === 'nvg') {
    const nvgMount = styleDeco(
      new THREE.Mesh(createBeveledBox(0.056, 0.050, 0.044, 0.008, 2), gunMat)
    );
    nvgMount.position.set(0, 0.142, -0.150);
    headGroup.add(nvgMount);

    for (const tx of [-0.066, -0.023, 0.023, 0.066]) {
      const tube = styleDeco(
        new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.020, 0.086, 8), gunMat)
      );
      tube.rotation.x = Math.PI / 2;
      tube.position.set(tx, 0.122, -0.182);

      const lens = styleDeco(
        new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.01, 8), iffMat)
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(tx, 0.122, -0.224);
      headGroup.add(tube, lens);
    }
  } else if (headgear === 'stealth_hood') {
    const hood = tagPart(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.178, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.72),
        bduMat
      ),
      'head'
    );
    hood.scale.set(1.04, 1.06, 1.12);
    hood.position.set(0, 0.086, 0.016);

    const opticBar = styleDeco(
      new THREE.Mesh(createBeveledBox(0.185, 0.024, 0.040, 0.008, 2), iffMat)
    );
    opticBar.position.set(0, 0.082, -0.148);
    headGroup.add(hood, opticBar);
  } else if (headgear === 'shemagh') {
    const wrap = styleDeco(
      new THREE.Mesh(new THREE.TorusGeometry(0.124, 0.044, 10, 16), bduMat)
    );
    wrap.rotation.x = Math.PI / 2 + 0.12;
    wrap.position.set(0, 0.004, -0.008);

    const brim = styleDeco(
      new THREE.Mesh(createBeveledBox(0.225, 0.024, 0.118, 0.008, 2), armorMat)
    );
    brim.position.set(0, 0.152, -0.112);
    headGroup.add(wrap, brim);
  } else if (headgear === 'arctic_visor') {
    const goggleFrame = styleDeco(
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.154,
          0.154,
          0.086,
          16,
          1,
          false,
          -Math.PI * 0.44,
          Math.PI * 0.88
        ),
        rigMat
      )
    );
    goggleFrame.position.set(0, 0.084, -0.016);
    goggleFrame.rotation.y = Math.PI;

    const snowGoggles = styleDeco(
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.158,
          0.158,
          0.062,
          16,
          1,
          false,
          -Math.PI * 0.40,
          Math.PI * 0.80
        ),
        visorMat
      )
    );
    snowGoggles.position.set(0, 0.084, -0.018);
    snowGoggles.rotation.y = Math.PI;
    headGroup.add(goggleFrame, snowGoggles);
  } else if (headgear === 'rebreather') {
    for (const side of [-1, 1]) {
      const filterCan = styleDeco(
        new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.033, 0.082, 10), gunMat)
      );
      filterCan.rotation.set(0.35, 0, side * 0.45);
      filterCan.position.set(side * 0.080, 0.014, -0.132);

      const filterCap = styleDeco(
        new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.014, 10), accentMat)
      );
      filterCap.rotation.set(0.35, 0, side * 0.45);
      filterCap.position.set(side * 0.096, 0.004, -0.164);
      headGroup.add(filterCan, filterCap);
    }
  } else if (headgear === 'blast_helmet') {
    const blastShield = tagPart(
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.168,
          0.174,
          0.165,
          16,
          1,
          false,
          -Math.PI * 0.54,
          Math.PI * 1.08
        ),
        armorMat
      ),
      'head'
    );
    blastShield.position.set(0, 0.072, -0.012);
    blastShield.rotation.y = Math.PI;

    const eyeSlit = styleDeco(
      new THREE.Mesh(createBeveledBox(0.175, 0.022, 0.030, 0.006, 2), iffMat)
    );
    eyeSlit.position.set(0, 0.090, -0.158);
    headGroup.add(blastShield, eyeSlit);
  }

  headGroup.add(
    neck,
    balaclavaNeck,
    cranium,
    jawline,
    chinGuard,
    helmet,
    helmetBattery,
    helmetIff,
    visor
  );

  // ============================================================================
  // 5. ARTICULATED 2-SEGMENT ARMS & TACTICAL CARBINE (Attached to torsoPivot)
  // ============================================================================
  const isHeavyPauldron = rig === 'heavy' || rig === 'exosuit';
  const pauldronW = isHeavyPauldron ? 0.132 : 0.108;
  const pauldronH = isHeavyPauldron ? 0.148 : 0.120;

  const makeArm = (isRight) => {
    const side = isRight ? 1 : -1;
    const arm = new THREE.Group();
    arm.position.set(side * 0.232, 0.44, -0.01);

    // Rounded shoulder deltoid cap blending upper arm seamlessly into torso shoulder
    const deltoidCap = tagPart(
      new THREE.Mesh(new THREE.SphereGeometry(0.078, 12, 10), bduMat),
      'limb'
    );
    deltoidCap.scale.set(1.02, 1.12, 0.98);
    deltoidCap.position.set(0, -0.015, 0);

    // Contoured shoulder pauldron armor angled cleanly down the deltoid + IFF shoulder chevron patch
    const pauldron = styleDeco(
      new THREE.Mesh(createBeveledBox(pauldronW, pauldronH, 0.132, 0.028, 2), armorMat)
    );
    pauldron.rotation.z = -side * 0.16;
    pauldron.position.set(side * 0.024, -0.025, 0);

    const patchPanel = styleDeco(
      new THREE.Mesh(createBeveledBox(0.016, 0.056, 0.070, 0.005, 2), iffMat)
    );
    patchPanel.rotation.z = -side * 0.16;
    patchPanel.position.set(side * (0.024 + pauldronW * 0.5), -0.028, 0);

    // Upper arm biceps/triceps segment (y = 0 to -0.26m from shoulder)
    const upperArmMesh = tagPart(
      new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.056, 0.25, 12), bduMat),
      'limb'
    );
    upperArmMesh.position.set(0, -0.13, 0);

    // Articulated elbow pivot at y = -0.26m relative to shoulder
    const elbowPivot = new THREE.Group();
    elbowPivot.position.set(0, -0.26, 0);

    const elbowJoint = tagPart(
      new THREE.Mesh(new THREE.SphereGeometry(0.056, 10, 8), bduMat),
      'limb'
    );

    const elbowPad = styleDeco(
      new THREE.Mesh(createBeveledBox(0.076, 0.088, 0.052, 0.018, 2), armorMat)
    );
    elbowPad.position.set(0, 0, 0.032);

    // Tapered forearm (y = 0 to -0.22m inside elbowPivot)
    const forearmMesh = tagPart(
      new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.042, 0.22, 12), bduMat),
      'limb'
    );
    forearmMesh.position.set(0, -0.11, 0);

    // Tactical wrist watch / GPS comms on forearm cuff
    const wristBand = styleDeco(
      new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.045, 0.032, 10), rigMat)
    );
    wristBand.position.set(0, -0.19, 0);

    if (!isRight) {
      const gpsScreen = styleDeco(
        new THREE.Mesh(createBeveledBox(0.036, 0.045, 0.016, 0.004, 2), iffMat)
      );
      gpsScreen.position.set(0.032, -0.185, -0.018);
      elbowPivot.add(gpsScreen);
    } else {
      const watchDial = styleDeco(
        new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 10), gunMat)
      );
      watchDial.rotation.x = Math.PI / 2;
      watchDial.position.set(0, -0.19, -0.044);
      elbowPivot.add(watchDial);
    }

    // Sculpted gloved hand with palm, knuckle guard, thumb, and curled 4-finger group
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.23, 0);

    const palm = tagPart(
      new THREE.Mesh(createBeveledBox(0.042, 0.078, 0.076, 0.014, 2), rigMat),
      'limb'
    );
    const knucklePlate = styleDeco(
      new THREE.Mesh(createBeveledBox(0.018, 0.036, 0.072, 0.006, 2), armorMat)
    );
    knucklePlate.position.set(side * 0.022, 0.006, 0);

    // Sculpted thumb wrapping inward around grip/handguard
    const thumb = styleDeco(
      new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.036, 4, 6), rigMat)
    );
    thumb.rotation.set(0.55, 0, -side * 0.65);
    thumb.position.set(-side * 0.018, -0.012, -0.038);

    // Curled 4-finger group gripping the weapon
    const fingerGroup = new THREE.Group();
    fingerGroup.position.set(0, -0.042, 0);
    for (let f = 0; f < 4; f++) {
      const finger = styleDeco(
        new THREE.Mesh(new THREE.CapsuleGeometry(0.0085, 0.034, 4, 6), rigMat)
      );
      finger.rotation.z = side * 1.15;
      finger.position.set(-side * 0.014, -0.008, -0.027 + f * 0.018);
      fingerGroup.add(finger);
    }

    handGroup.add(palm, knucklePlate, thumb, fingerGroup);
    elbowPivot.add(elbowJoint, elbowPad, forearmMesh, wristBand, handGroup);
    arm.add(deltoidCap, pauldron, patchPanel, upperArmMesh, elbowPivot);

    return { arm, elbowPivot, handGroup };
  };

  const leftArmObj = makeArm(false);
  const rightArmObj = makeArm(true);
  const leftArm = leftArmObj.arm;
  const rightArm = rightArmObj.arm;
  const leftElbowPivot = leftArmObj.elbowPivot;
  const rightElbowPivot = rightArmObj.elbowPivot;

  // Pose rightArm/rightElbowPivot (trigger hand) and leftArm/leftElbowPivot (support hand)
  // in an authentic tactical ready stance holding the carbine across the chest
  rightArm.rotation.set(0.52, -0.18, -0.14);
  rightElbowPivot.rotation.set(1.06, -0.24, 0.14);

  leftArm.rotation.set(0.76, 0.42, 0.28);
  leftElbowPivot.rotation.set(0.86, 0.34, -0.18);

  // Weapon & arm pitch mount inside torsoPivot
  const armPivot = new THREE.Group();
  armPivot.position.set(0, 0.34, 0);

  const rifleGroup = new THREE.Group();
  rifleGroup.position.set(0.115, -0.085, 0.04);

  const receiver = styleDeco(
    new THREE.Mesh(createBeveledBox(0.054, 0.102, 0.35, 0.012, 2), gunMat)
  );
  receiver.position.set(0, 0, -0.34);

  const handguard = styleDeco(
    new THREE.Mesh(createBeveledBox(0.046, 0.076, 0.28, 0.010, 2), armorMat)
  );
  handguard.position.set(0, 0.008, -0.58);

  const buttstock = styleDeco(
    new THREE.Mesh(createBeveledBox(0.044, 0.108, 0.19, 0.012, 2), gunMat)
  );
  buttstock.position.set(0, -0.01, -0.12);

  const rifleMag = styleDeco(
    new THREE.Mesh(createBeveledBox(0.034, 0.16, 0.064, 0.008, 2), rigMat)
  );
  rifleMag.rotation.x = 0.22;
  rifleMag.position.set(0, -0.112, -0.39);

  const rifleGrip = styleDeco(
    new THREE.Mesh(createBeveledBox(0.034, 0.098, 0.046, 0.008, 2), rigMat)
  );
  rifleGrip.rotation.x = -0.28;
  rifleGrip.position.set(0, -0.082, -0.25);

  const foregrip = styleDeco(
    new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.017, 0.086, 8), rigMat)
  );
  foregrip.position.set(0, -0.064, -0.55);

  const opticHousing = styleDeco(
    new THREE.Mesh(createBeveledBox(0.044, 0.050, 0.092, 0.008, 2), gunMat)
  );
  opticHousing.position.set(0, 0.072, -0.35);

  const opticLens = styleDeco(
    new THREE.Mesh(createBeveledBox(0.030, 0.030, 0.012, 0.003, 2), iffMat)
  );
  opticLens.position.set(0, 0.074, -0.31);

  const peqBox = styleDeco(
    new THREE.Mesh(createBeveledBox(0.040, 0.026, 0.074, 0.006, 2), gunMat)
  );
  peqBox.position.set(0, 0.056, -0.60);

  const barrel = styleDeco(
    new THREE.Mesh(createFlutedCylinder(0.014, 0.016, 0.18, 10, 4, 8, 0.002), gunMat)
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.01, -0.76);

  const suppressor = styleDeco(
    new THREE.Mesh(createFlutedCylinder(0.023, 0.023, 0.20, 12, 4, 10, 0.003), gunMat)
  );
  suppressor.rotation.x = Math.PI / 2;
  suppressor.position.set(0, 0.01, -0.91);

  rifleGroup.add(
    receiver,
    handguard,
    buttstock,
    rifleMag,
    rifleGrip,
    foregrip,
    opticHousing,
    opticLens,
    peqBox,
    barrel,
    suppressor
  );

  const muzzleFlash = new THREE.Mesh(new THREE.ConeGeometry(0.092, 0.25, 6), flashMat);
  muzzleFlash.rotation.x = -Math.PI / 2;
  muzzleFlash.position.set(0.115, -0.075, -1.04);
  muzzleFlash.visible = false;

  armPivot.add(rifleGroup, muzzleFlash);
  torsoPivot.add(leftArm, rightArm, armPivot);

  if (app.scale !== 1.0) {
    root.scale.setScalar(app.scale);
  }

  // Seamless zero-draw-cost padded hitboxes for fair & reliable FPS hit registration
  const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
  const bodyHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.38, 0.54), hitboxMat);
  bodyHitbox.position.set(0, 0.72, 0);
  bodyHitbox.userData = {
    entityType: 'player',
    playerId: entityId,
    isHead: false,
    hitZone: 'torso'
  };

  const headHitbox = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), hitboxMat);
  headHitbox.position.set(0, 1.66, 0);
  headHitbox.userData = {
    entityType: 'player',
    playerId: entityId,
    isHead: true,
    hitZone: 'head'
  };

  bodyGroup.add(bodyHitbox, headHitbox);
  hitMeshes.push(bodyHitbox, headHitbox);

  const tag = createNameTagSprite(name, toHexCss(accentColor));
  tag.sprite.visible = app.showNameTag;
  root.add(tag.sprite);

  return {
    root,
    bodyGroup,
    torsoPivot,
    upperBody: torsoPivot,
    headGroup,
    leftLeg,
    rightLeg,
    legL: leftLeg,
    legR: rightLeg,
    leftKneePivot,
    rightKneePivot,
    kneeL: leftKneePivot,
    kneeR: rightKneePivot,
    leftArm,
    rightArm,
    leftElbowPivot,
    rightElbowPivot,
    armPivot,
    rifleGroup,
    muzzleFlash,
    flashTimer: 0,
    flinchTimer: 0,
    recoilKick: 0,
    crouchAmount: 0,
    walkPhase: Math.random() * Math.PI * 2,
    breathPhase: Math.random() * Math.PI * 2,
    hitMeshes,
    materialMap: {
      bduMat,
      armorMat,
      rigMat,
      accentMat,
      iffMat,
      bootMat,
      skinMat,
      visorMat,
      gunMat
    },
    materials: [
      bduMat,
      armorMat,
      rigMat,
      accentMat,
      iffMat,
      bootMat,
      skinMat,
      visorMat,
      gunMat,
      flashMat,
      hitboxMat,
      tag.mat
    ],
    tagTex: tag.tex,
    tagSprite: tag.sprite,
    operatorSpec: app.opSpec,
    enemySpec: app.enemySpec
  };
}

/**
 * Animates the multi-joint articulated 3rd-person Operator / Syndicate Enemy model:
 * - Hip swing + authentic knee flexion (`Math.max(0, ...)` bending during stride recovery)
 * - Vertical pelvis bob (`bodyGroup.position.y`) and crouch lowering (`-0.24 * crouchAmount`)
 * - Upper-body counter-rotation (`torsoPivot.rotation.y`) & forward combat lean (`torsoPivot.rotation.x`)
 * - Idle breathing cycle (chest rise & weapon micro-sway)
 * - Smooth firing recoil kick on `rightArm`, `leftArm`, and `torsoPivot`
 * - Hit-flinch impulse (`model.flinchTimer` / `extra.hitFlinch`) when taking damage
 */
export function animateSoldierModel(
  model,
  dt,
  speed = 0,
  pitch = 0,
  isFiring = false,
  extra = {}
) {
  if (!model) return;

  const safeDt = Math.min(0.1, Math.max(0.0001, dt || 0.016));
  const blend = Math.min(1, safeDt * 12);

  // 1. Muzzle flash & firing recoil impulse
  if (model.flashTimer > 0) {
    model.flashTimer = Math.max(0, model.flashTimer - safeDt);
    model.muzzleFlash.visible = model.flashTimer > 0;
    model.muzzleFlash.rotation.z += safeDt * 38;
  } else if (model.muzzleFlash) {
    model.muzzleFlash.visible = false;
  }

  const firingNow = Boolean(isFiring || model.flashTimer > 0);
  if (firingNow) {
    model.recoilKick = Math.min(1, (model.recoilKick || 0) + safeDt * 22);
  } else {
    model.recoilKick = Math.max(0, (model.recoilKick || 0) - safeDt * 9.5);
  }
  const recoil = model.recoilKick || 0;

  // 2. Hit-flinch impulse when taking damage
  if (extra && typeof extra.hitFlinch === 'number' && extra.hitFlinch > (model.flinchTimer || 0)) {
    model.flinchTimer = extra.hitFlinch;
  }
  if (model.flinchTimer > 0) {
    model.flinchTimer = Math.max(0, model.flinchTimer - safeDt);
  }
  const flinchRatio = Math.min(1, (model.flinchTimer || 0) / 0.22);
  const flinchImpulse = Math.sin(flinchRatio * Math.PI) * flinchRatio;

  // 3. Smooth crouch interpolation
  const targetCrouch = Math.max(0, Math.min(1, extra?.crouchAmount || 0));
  model.crouchAmount = (model.crouchAmount || 0) + (targetCrouch - (model.crouchAmount || 0)) * Math.min(1, safeDt * 10);
  const crouch = model.crouchAmount;
  const strafe = Math.max(-1, Math.min(1, extra?.strafe || 0));

  const leftLeg = model.leftLeg || model.legL;
  const rightLeg = model.rightLeg || model.legR;
  const leftKnee = model.leftKneePivot || model.kneeL;
  const rightKnee = model.rightKneePivot || model.kneeR;
  const torso = model.torsoPivot || model.upperBody;
  const body = model.bodyGroup;

  // 4. Multi-joint walk/run cycle vs idle breathing
  model.breathPhase = (model.breathPhase || 0) + safeDt * 2.2;
  const breathSin = Math.sin(model.breathPhase);
  const breathCos = Math.cos(model.breathPhase * 0.7);

  if (speed > 0.25) {
    const cadence = Math.min(14.0, 6.0 + speed * 0.94);
    model.walkPhase = (model.walkPhase || 0) + safeDt * cadence;
    const p = model.walkPhase;
    const sinP = Math.sin(p);
    const cosP = Math.cos(p);
    const speedNorm = Math.min(1, speed / 7.0);
    const amp = Math.min(0.68, speed * 0.084) * (1 - crouch * 0.22);

    // Hip swing + crouch hip flexion
    const targetHipL = sinP * amp - crouch * 0.42;
    const targetHipR = -sinP * amp - crouch * 0.42;
    if (leftLeg && rightLeg) {
      leftLeg.rotation.x += (targetHipL - leftLeg.rotation.x) * blend;
      rightLeg.rotation.x += (targetHipR - rightLeg.rotation.x) * blend;
      leftLeg.rotation.z += (strafe * 0.08 - leftLeg.rotation.z) * blend;
      rightLeg.rotation.z += (strafe * 0.08 - rightLeg.rotation.z) * blend;
    }

    // Authentic knee flexion (Math.max(0, ...) bending backward during stride + crouch bend)
    if (leftKnee && rightKnee) {
      const targetKneeL = Math.max(0, -Math.sin(p - 0.35)) * amp * 1.28 + crouch * 0.58;
      const targetKneeR = Math.max(0, Math.sin(p - 0.35)) * amp * 1.28 + crouch * 0.58;
      leftKnee.rotation.x += (targetKneeL - leftKnee.rotation.x) * blend;
      rightKnee.rotation.x += (targetKneeR - rightKnee.rotation.x) * blend;
    }

    // Pelvis vertical bob + crouch lowering (-0.24 * crouchAmount)
    if (body) {
      const bobY = Math.abs(cosP) * 0.034 * speedNorm - 0.24 * crouch;
      body.position.y += (bobY - body.position.y) * blend;
    }

    // Upper-body counter-rotation & forward combat lean proportional to movement speed
    if (torso) {
      const targetTorsoY = cosP * 0.078 * speedNorm;
      const targetTorsoX = -(Math.min(0.17, speed * 0.019) + crouch * 0.16) + recoil * 0.075 + flinchImpulse * 0.24;
      const targetTorsoZ = sinP * 0.026 - strafe * 0.055 + flinchImpulse * 0.11;

      torso.position.y += (1.00 + breathSin * 0.004 - torso.position.y) * blend;
      torso.rotation.y += (targetTorsoY - torso.rotation.y) * blend;
      torso.rotation.x += (targetTorsoX - torso.rotation.x) * blend;
      torso.rotation.z += (targetTorsoZ - torso.rotation.z) * blend;
    }
  } else {
    // Idle tactical stance with subtle breathing & crouch support
    if (leftLeg && rightLeg) {
      const idleHip = -crouch * 0.42;
      leftLeg.rotation.x += (idleHip - leftLeg.rotation.x) * blend;
      rightLeg.rotation.x += (idleHip - rightLeg.rotation.x) * blend;
      leftLeg.rotation.z += (0 - leftLeg.rotation.z) * blend;
      rightLeg.rotation.z += (0 - rightLeg.rotation.z) * blend;
    }

    if (leftKnee && rightKnee) {
      const idleKnee = Math.max(0, crouch * 0.58);
      leftKnee.rotation.x += (idleKnee - leftKnee.rotation.x) * blend;
      rightKnee.rotation.x += (idleKnee - rightKnee.rotation.x) * blend;
    }

    if (body) {
      const targetBodyY = -0.24 * crouch + breathSin * 0.005;
      body.position.y += (targetBodyY - body.position.y) * blend;
    }

    if (torso) {
      const targetTorsoX = -crouch * 0.15 + breathSin * 0.012 + recoil * 0.075 + flinchImpulse * 0.24;
      const targetTorsoY = breathCos * 0.01;
      const targetTorsoZ = flinchImpulse * 0.11;

      torso.position.y += (1.00 + breathSin * 0.007 - torso.position.y) * blend;
      torso.rotation.x += (targetTorsoX - torso.rotation.x) * blend;
      torso.rotation.y += (targetTorsoY - torso.rotation.y) * blend;
      torso.rotation.z += (targetTorsoZ - torso.rotation.z) * blend;
    }
  }

  // 5. Articulated arms, elbows, and weapon recoil + aim pitch
  const clampedPitch = Math.max(-0.65, Math.min(0.65, pitch || 0));
  const swayX = breathSin * 0.012;
  const swayY = breathCos * 0.010;

  if (model.rightArm && model.leftArm) {
    const targetRightArmX = 0.52 + clampedPitch * 0.65 - recoil * 0.14 + swayX;
    const targetLeftArmX = 0.76 + clampedPitch * 0.65 - recoil * 0.12 + swayX;

    model.rightArm.rotation.x += (targetRightArmX - model.rightArm.rotation.x) * blend;
    model.rightArm.rotation.y += (-0.18 + swayY - model.rightArm.rotation.y) * blend;

    model.leftArm.rotation.x += (targetLeftArmX - model.leftArm.rotation.x) * blend;
    model.leftArm.rotation.y += (0.42 + swayY - model.leftArm.rotation.y) * blend;
  }

  if (model.rightElbowPivot && model.leftElbowPivot) {
    const targetRightElbowX = 1.06 + recoil * 0.18;
    const targetLeftElbowX = 0.86 + recoil * 0.14;
    model.rightElbowPivot.rotation.x += (targetRightElbowX - model.rightElbowPivot.rotation.x) * blend;
    model.leftElbowPivot.rotation.x += (targetLeftElbowX - model.leftElbowPivot.rotation.x) * blend;
  }

  if (model.armPivot) {
    model.armPivot.rotation.x = clampedPitch * 0.72 - recoil * 0.09 + swayX * 0.5;
    model.armPivot.rotation.y = -(torso ? torso.rotation.y * 0.35 : 0) + swayY;
    model.armPivot.position.z = recoil * 0.032;
  }

  if (model.headGroup) {
    model.headGroup.rotation.x = clampedPitch * 0.55 - flinchImpulse * 0.18;
    model.headGroup.rotation.y = -(torso ? torso.rotation.y * 0.65 : 0);
    model.headGroup.rotation.z = flinchImpulse * 0.08;
  }
}
