import * as THREE from 'three';
import { createBeveledBox, createFlutedCylinder } from './GeometryUtils.js';
import { SKIN_CATALOG, resolveSkinCatalogEntry, createQualityMaterial, TextureLibrary } from './Textures.js';

export const WEAPON_SPECS = [
  {
    id: 'rifle',
    slot: 0,
    name: 'M4A1 TACTICAL',
    shortName: 'M4 TAC',
    type: 'auto',
    damage: 28,
    headshotMult: 2.2,
    fireRateMs: 105,
    reloadMs: 1650,
    magSize: 30,
    reserveMax: 120,
    pellets: 1,
    spreadHip: 0.014,
    spreadAds: 0.0025,
    recoilPitch: 0.019,
    recoilYaw: 0.007,
    adsFov: 54,
    range: 170,
    hipPos: [0.15, -0.145, -0.33],
    adsPos: [0.0, -0.125, -0.28]
  },
  {
    id: 'shotgun',
    slot: 1,
    name: 'M1014 SHOTGUN',
    shortName: 'M1014',
    type: 'semi',
    damage: 16,
    headshotMult: 1.5,
    fireRateMs: 560,
    reloadMs: 1850,
    magSize: 8,
    reserveMax: 32,
    pellets: 8,
    spreadHip: 0.064,
    spreadAds: 0.044,
    recoilPitch: 0.048,
    recoilYaw: 0.015,
    adsFov: 60,
    range: 55,
    hipPos: [0.155, -0.15, -0.34],
    adsPos: [0.0, -0.13, -0.29]
  },
  {
    id: 'sniper',
    slot: 2,
    name: 'AWP TACTICAL',
    shortName: 'AWP',
    type: 'semi',
    damage: 94,
    headshotMult: 2.1,
    fireRateMs: 1100,
    reloadMs: 2050,
    magSize: 5,
    reserveMax: 20,
    pellets: 1,
    spreadHip: 0.055,
    spreadAds: 0.0002,
    recoilPitch: 0.052,
    recoilYaw: 0.009,
    adsFov: 22,
    isScope: true,
    range: 250,
    hipPos: [0.16, -0.155, -0.36],
    adsPos: [0.0, -0.13, -0.27]
  },
  {
    id: 'pistol',
    slot: 3,
    name: 'USP-S SIDEARM',
    shortName: 'USP-S',
    type: 'semi',
    damage: 25,
    headshotMult: 2.25,
    fireRateMs: 165,
    reloadMs: 1200,
    magSize: 12,
    reserveMax: 48,
    pellets: 1,
    spreadHip: 0.01,
    spreadAds: 0.002,
    recoilPitch: 0.015,
    recoilYaw: 0.005,
    adsFov: 60,
    range: 115,
    hipPos: [0.135, -0.14, -0.30],
    adsPos: [0.0, -0.118, -0.26]
  },
  {
    id: 'grenade',
    slot: 4,
    name: 'HE-67 FRAG GRENADE',
    shortName: 'FRAG',
    type: 'grenade',
    damage: 120,
    fireRateMs: 700,
    magSize: 2,
    reserveMax: 2,
    adsFov: 70,
    hipPos: [0.14, -0.145, -0.31],
    adsPos: [0.10, -0.13, -0.28]
  }
];

export function createWeaponInventory() {
  return WEAPON_SPECS.map((spec) => ({
    spec,
    mag: spec.magSize,
    reserve: spec.reserveMax
  }));
}

// Operator sleeve & glove profiles for all 6 tactical operators (+ common aliases)
const OPERATOR_ARM_PROFILES = {
  vanguard: {
    sleeve: '#252d38',
    cuff: '#1b222b',
    glove: '#20242c',
    knuckle: '#15181e',
    watchAccent: '#f59e0b'
  },
  spectre: {
    sleeve: '#161920',
    cuff: '#0f1218',
    glove: '#161921',
    knuckle: '#0d1015',
    watchAccent: '#38bdf8'
  },
  phantom: {
    sleeve: '#161920',
    cuff: '#0f1218',
    glove: '#161921',
    knuckle: '#0d1015',
    watchAccent: '#38bdf8'
  },
  ghost: {
    sleeve: '#1e222a',
    cuff: '#14171d',
    glove: '#181b22',
    knuckle: '#0f1217',
    watchAccent: '#38bdf8'
  },
  nomad: {
    sleeve: '#b89768',
    cuff: '#7d6340',
    glove: '#3b3125',
    knuckle: '#241e16',
    watchAccent: '#d97706'
  },
  sandstorm: {
    sleeve: '#b89768',
    cuff: '#7d6340',
    glove: '#3b3125',
    knuckle: '#241e16',
    watchAccent: '#d97706'
  },
  frost: {
    sleeve: '#cbd5e1',
    cuff: '#64748b',
    glove: '#334155',
    knuckle: '#1e293b',
    watchAccent: '#0ea5e9'
  },
  glacier: {
    sleeve: '#cbd5e1',
    cuff: '#64748b',
    glove: '#334155',
    knuckle: '#1e293b',
    watchAccent: '#0ea5e9'
  },
  arctic: {
    sleeve: '#cbd5e1',
    cuff: '#64748b',
    glove: '#334155',
    knuckle: '#1e293b',
    watchAccent: '#0ea5e9'
  },
  corsair: {
    sleeve: '#172554',
    cuff: '#0f172a',
    glove: '#1a2438',
    knuckle: '#101726',
    watchAccent: '#10b981'
  },
  ranger: {
    sleeve: '#364d32',
    cuff: '#233321',
    glove: '#242b22',
    knuckle: '#171c15',
    watchAccent: '#10b981'
  },
  stalker: {
    sleeve: '#364d32',
    cuff: '#233321',
    glove: '#242b22',
    knuckle: '#171c15',
    watchAccent: '#10b981'
  },
  titan: {
    sleeve: '#27272a',
    cuff: '#18181b',
    glove: '#221c1e',
    knuckle: '#7f1d1d',
    watchAccent: '#ef4444'
  },
  juggernaut: {
    sleeve: '#3a2824',
    cuff: '#241917',
    glove: '#241f1e',
    knuckle: '#161312',
    watchAccent: '#f97316'
  },
  sentinel: {
    sleeve: '#1e325c',
    cuff: '#14213d',
    glove: '#1b2436',
    knuckle: '#111724',
    watchAccent: '#60a5fa'
  },
  warden: {
    sleeve: '#2e3846',
    cuff: '#1d242e',
    glove: '#20252d',
    knuckle: '#14181e',
    watchAccent: '#eab308'
  }
};

// Weapon-specific first-person hand & forearm placement (`gripConfig` per `weaponId`)
export const WEAPON_GRIP_CONFIG = {
  rifle: {
    rightHandPos: [0, -0.055, 0.08],
    rightHandRot: [-0.24, -0.08, 0.14],
    rightElbowPos: [0.12, -0.14, 0.24],
    leftHandPos: [-0.015, -0.015, -0.22],
    leftHandRot: [0.06, 0.22, -0.32],
    leftElbowPos: [-0.15, -0.14, 0.14],
    leftGripStyle: 'cclamp',
    triggerReach: [0.005, 0.02, -0.042]
  },
  shotgun: {
    rightHandPos: [0, -0.055, 0.08],
    rightHandRot: [-0.24, -0.08, 0.14],
    rightElbowPos: [0.12, -0.14, 0.24],
    leftHandPos: [-0.012, -0.02, -0.20],
    leftHandRot: [0.05, 0.18, -0.26],
    leftElbowPos: [-0.15, -0.14, 0.14],
    leftGripStyle: 'cclamp',
    triggerReach: [0.005, 0.02, -0.042]
  },
  sniper: {
    rightHandPos: [0, -0.055, 0.08],
    rightHandRot: [-0.22, -0.08, 0.12],
    rightElbowPos: [0.12, -0.14, 0.24],
    leftHandPos: [-0.015, -0.018, -0.25],
    leftHandRot: [0.06, 0.2, -0.28],
    leftElbowPos: [-0.15, -0.14, 0.14],
    leftGripStyle: 'cclamp',
    triggerReach: [0.005, 0.02, -0.042]
  },
  pistol: {
    rightHandPos: [0, -0.055, 0.08],
    rightHandRot: [-0.2, -0.06, 0.1],
    rightElbowPos: [0.12, -0.14, 0.24],
    leftHandPos: [-0.018, -0.045, 0.055],
    leftHandRot: [-0.16, 0.28, -0.18],
    leftElbowPos: [-0.15, -0.14, 0.14],
    leftGripStyle: 'pistolSupport',
    triggerReach: [0.004, 0.022, -0.044]
  },
  grenade: {
    rightHandPos: [0, -0.055, 0.08],
    rightHandRot: [0.08, -0.14, 0.18],
    rightElbowPos: [0.12, -0.14, 0.24],
    leftHandPos: [-0.06, -0.02, -0.06],
    leftHandRot: [0.14, 0.34, -0.22],
    leftElbowPos: [-0.15, -0.14, 0.14],
    leftGripStyle: 'grenadePin',
    triggerReach: [0.006, 0.024, -0.036]
  }
};

let _fallbackTexLib = null;
const _watchScreenTexCache = new Map();

function getSharedTextureLib(textureLib) {
  if (textureLib) return textureLib;
  if (typeof document !== 'undefined') {
    if (!_fallbackTexLib) {
      _fallbackTexLib = new TextureLibrary();
    }
    return _fallbackTexLib;
  }
  return null;
}

function getWatchScreenTexture(accentHex = '#38bdf8') {
  if (typeof document === 'undefined') return null;
  if (_watchScreenTexCache.has(accentHex)) {
    return _watchScreenTexCache.get(accentHex);
  }
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Deep OLED tactical screen background
  ctx.fillStyle = '#040a12';
  ctx.fillRect(0, 0, 160, 128);

  // Subtle radar grid
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
  ctx.lineWidth = 1;
  for (let x = 16; x < 160; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 128);
    ctx.stroke();
  }
  for (let y = 16; y < 128; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(160, y);
    ctx.stroke();
  }

  // Bezel border
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, 152, 120);

  // Top telemetry header bar
  ctx.fillStyle = accentHex;
  ctx.fillRect(10, 10, 140, 20);
  ctx.fillStyle = '#03070e';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('COLDBORE // GPS', 16, 24);

  // Vitals & Azimuth
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('74 BPM', 14, 54);

  ctx.fillStyle = accentHex;
  ctx.font = 'bold 12px monospace';
  ctx.fillText('AZM 284° NW', 14, 74);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px monospace';
  ctx.fillText('SAT: LOCKED', 14, 90);

  // ECG / Telemetry bars along bottom
  for (let i = 0; i < 12; i++) {
    const bh = 6 + ((i * 11 + 5) % 16);
    ctx.fillStyle = i % 2 === 0 ? accentHex : '#475569';
    ctx.fillRect(14 + i * 11, 114 - bh, 7, bh);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  _watchScreenTexCache.set(accentHex, tex);
  return tex;
}

function blendHexColors(hexA, hexB, t = 0.5) {
  const cA = new THREE.Color(hexA);
  const cB = new THREE.Color(hexB);
  cA.lerp(cB, t);
  return cA;
}

function resolveOperatorProfile(operatorId = 'vanguard') {
  if (!operatorId) return OPERATOR_ARM_PROFILES.vanguard;
  if (typeof operatorId === 'object' && operatorId.id) {
    return resolveOperatorProfile(operatorId.id);
  }
  const key = String(operatorId).toLowerCase().trim();
  if (OPERATOR_ARM_PROFILES[key]) return OPERATOR_ARM_PROFILES[key];
  for (const [k, prof] of Object.entries(OPERATOR_ARM_PROFILES)) {
    if (key.includes(k) || k.includes(key)) return prof;
  }
  return OPERATOR_ARM_PROFILES.vanguard;
}

function mapRoleToSkinCategory(role) {
  if (role === 'primary') return 'primary';
  if (role === 'secondary' || role === 'accent') return 'accent';
  if (role === 'barrel' || role === 'opticBody' || role === 'hardware') return 'hardware';
  return role;
}

function buildRoleMaterials({ skinId = 'factory', operatorId = 'vanguard', textureLib = null, quality = 'balanced' }) {
  const skinSpec = resolveSkinCatalogEntry(skinId);
  const opProfile = resolveOperatorProfile(operatorId);
  const texLib = getSharedTextureLib(textureLib);
  const skinTex = texLib ? texLib.getSkinTextureSet(skinSpec.id) : null;

  const isCustomSkin = skinSpec.id !== 'factory';
  const sleeveColor = isCustomSkin
    ? blendHexColors(opProfile.sleeve, skinSpec.cloth, 0.35)
    : new THREE.Color(opProfile.sleeve);
  const cuffColor = isCustomSkin
    ? blendHexColors(opProfile.cuff, skinSpec.secondary, 0.28)
    : new THREE.Color(opProfile.cuff);
  const gloveColor = isCustomSkin
    ? blendHexColors(opProfile.glove, skinSpec.secondary, 0.18)
    : new THREE.Color(opProfile.glove);
  const knuckleColor = isCustomSkin
    ? blendHexColors(opProfile.knuckle, skinSpec.accent, 0.15)
    : new THREE.Color(opProfile.knuckle);

  const watchAccent = skinSpec.emissive && skinSpec.emissive !== '#000000'
    ? skinSpec.emissive
    : (opProfile.watchAccent || '#38bdf8');
  const reticleHex = skinSpec.emissive && skinSpec.emissive !== '#000000'
    ? skinSpec.emissive
    : '#ff3b30';

  // 1. PRIMARY: Upper/Lower receiver, slide, or main chassis — gets primary 256x256 custom skin texture
  const primaryMat = createQualityMaterial({
    color: skinTex?.map ? 0xffffff : skinSpec.primary,
    map: skinTex?.map || null,
    normalMap: skinTex?.normalMap || null,
    normalScale: new THREE.Vector2(0.95, 0.95),
    roughnessMap: skinTex?.roughnessMap || null,
    roughness: skinSpec.roughness,
    metalness: skinSpec.metalness,
    clearcoat: skinSpec.clearcoat,
    clearcoatRoughness: 0.24,
    emissive: skinSpec.emissive || '#000000',
    emissiveMap: skinTex?.emissiveMap || null,
    emissiveIntensity: (skinSpec.emissiveIntensity || 0) * (skinTex?.emissiveMap ? 0.85 : 0.12)
  }, quality);

  // 2. SECONDARY / ACCENT: Handguard rails, bolt carrier, mag baseplate, stock cheek rest —
  // gets contrasting two-tone gunsmith secondary/accent metallic finish
  const secondaryMat = createQualityMaterial({
    color: skinSpec.secondary,
    normalMap: skinTex?.normalMap || null,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughnessMap: skinTex?.roughnessMap || null,
    roughness: Math.min(0.76, skinSpec.roughness + 0.1),
    metalness: Math.max(0.28, skinSpec.metalness * 0.72),
    clearcoat: (skinSpec.clearcoat || 0.12) * 0.5
  }, quality);

  const accentMat = createQualityMaterial({
    color: skinSpec.accent,
    normalMap: skinTex?.normalMap || null,
    normalScale: new THREE.Vector2(0.5, 0.5),
    roughnessMap: skinTex?.roughnessMap || null,
    roughness: 0.24,
    metalness: 0.82,
    clearcoat: 0.58,
    emissive: skinSpec.emissive || '#000000',
    emissiveIntensity: (skinSpec.emissiveIntensity || 0) * 0.28
  }, quality);

  // 3. HARDWARE: Barrel, muzzle brake, suppressor, optic housing, rubber grip panels —
  // stays realistic dark gunmetal / hard-coat anodized black with subtle metallic sheen
  const barrelColor = blendHexColors('#181f29', skinSpec.secondary, 0.14);
  const barrelMat = createQualityMaterial({
    color: barrelColor,
    normalMap: skinTex?.normalMap || null,
    normalScale: new THREE.Vector2(0.42, 0.42),
    roughnessMap: skinTex?.roughnessMap || null,
    roughness: 0.28,
    metalness: 0.86,
    clearcoat: 0.3
  }, quality);

  const opticBodyMat = createQualityMaterial({
    color: '#12161d',
    normalMap: skinTex?.normalMap || null,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughness: 0.42,
    metalness: 0.58,
    clearcoat: 0.22
  }, quality);

  // Contrasting brushed steel / titanium bolt carrier group material
  const boltCarrierMat = createQualityMaterial({
    color: blendHexColors('#cbd5e1', skinSpec.accent, 0.32),
    normalMap: skinTex?.normalMap || null,
    normalScale: new THREE.Vector2(0.4, 0.4),
    roughness: 0.2,
    metalness: 0.92,
    clearcoat: 0.65
  }, quality);

  // 12-gauge shotgun shell crimson hull
  const shellHullMat = createQualityMaterial({
    color: '#b91c1c',
    roughness: 0.38,
    metalness: 0.15,
    clearcoat: 0.35
  }, quality);

  const opticLensMat = createQualityMaterial({
    color: '#0ea5e9',
    roughness: 0.06,
    metalness: 0.88,
    clearcoat: 0.96,
    emissive: watchAccent,
    emissiveIntensity: 0.28,
    transparent: true,
    opacity: 0.38
  }, quality);

  const reticleMat = new THREE.MeshBasicMaterial({
    color: reticleHex
  });

  const brassMat = createQualityMaterial({
    color: '#d4af37',
    roughness: 0.2,
    metalness: 0.9,
    clearcoat: 0.48
  }, quality);

  const sleeveMat = createQualityMaterial({
    color: sleeveColor,
    normalMap: skinTex?.normalMap || null,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughnessMap: skinTex?.roughnessMap || null,
    roughness: 0.78,
    metalness: 0.08,
    clearcoat: 0.06
  }, quality);

  const cuffMat = createQualityMaterial({
    color: cuffColor,
    normalMap: skinTex?.normalMap || null,
    normalScale: new THREE.Vector2(0.65, 0.65),
    roughness: 0.68,
    metalness: 0.14,
    clearcoat: 0.1
  }, quality);

  const gloveMat = createQualityMaterial({
    color: gloveColor,
    normalMap: skinTex?.normalMap || null,
    normalScale: new THREE.Vector2(0.62, 0.62),
    roughness: 0.58,
    metalness: 0.2,
    clearcoat: 0.22
  }, quality);

  const knuckleMat = createQualityMaterial({
    color: knuckleColor,
    normalMap: skinTex?.normalMap || null,
    normalScale: new THREE.Vector2(0.8, 0.8),
    roughness: 0.25,
    metalness: 0.68,
    clearcoat: 0.72
  }, quality);

  const watchBodyMat = createQualityMaterial({
    color: '#161b22',
    roughness: 0.24,
    metalness: 0.86,
    clearcoat: 0.5
  }, quality);

  const watchScreenTex = getWatchScreenTexture(watchAccent);
  const watchScreenMat = new THREE.MeshBasicMaterial({
    color: watchScreenTex ? 0xffffff : watchAccent,
    map: watchScreenTex || null
  });

  return {
    primary: primaryMat,
    secondary: secondaryMat,
    accent: accentMat,
    hardware: barrelMat,
    barrel: barrelMat,
    opticBody: opticBodyMat,
    boltCarrier: boltCarrierMat,
    shellHull: shellHullMat,
    opticLens: opticLensMat,
    reticle: reticleMat,
    brass: brassMat,
    sleeve: sleeveMat,
    cuff: cuffMat,
    glove: gloveMat,
    knuckle: knuckleMat,
    watchBody: watchBodyMat,
    watchScreen: watchScreenMat
  };
}

/**
 * Dynamically updates the two-tone blueprint PBR skin (`primary`, `accent`, `hardware`)
 * and operator sleeve/glove materials on an existing viewmodel or showcase group.
 */
export function applyWeaponSkin(
  viewmodelGroup,
  optionsOrSkinId = {},
  maybeOperatorId = 'vanguard',
  maybeTextureLib = null,
  maybeQuality = 'balanced'
) {
  if (!viewmodelGroup) return;

  let skinId = 'factory';
  let operatorId = 'vanguard';
  let textureLib = null;
  let quality = 'balanced';

  if (typeof optionsOrSkinId === 'string') {
    skinId = optionsOrSkinId;
    operatorId = maybeOperatorId || viewmodelGroup.userData?.operatorId || 'vanguard';
    textureLib = maybeTextureLib || viewmodelGroup.userData?.textureLib || null;
    quality = maybeQuality || viewmodelGroup.userData?.quality || 'balanced';
  } else if (optionsOrSkinId && typeof optionsOrSkinId === 'object') {
    skinId = optionsOrSkinId.skinId ?? viewmodelGroup.userData?.skinId ?? 'factory';
    operatorId = optionsOrSkinId.operatorId ?? viewmodelGroup.userData?.operatorId ?? 'vanguard';
    textureLib = optionsOrSkinId.textureLib ?? viewmodelGroup.userData?.textureLib ?? null;
    quality = optionsOrSkinId.quality ?? viewmodelGroup.userData?.quality ?? 'balanced';
  }

  const prevMaterials = viewmodelGroup.userData?.roleMaterials;
  const newMaterials = buildRoleMaterials({ skinId, operatorId, textureLib, quality });

  viewmodelGroup.traverse((child) => {
    if (!child.isMesh) return;
    const partRole = child.userData?.partRole;
    const skinRole = child.userData?.skinRole;
    if (partRole && newMaterials[partRole]) {
      child.material = newMaterials[partRole];
    } else if (skinRole && newMaterials[skinRole]) {
      child.material = newMaterials[skinRole];
    }
  });

  if (prevMaterials) {
    const disposed = new Set();
    for (const mat of Object.values(prevMaterials)) {
      if (mat && !disposed.has(mat) && typeof mat.dispose === 'function') {
        disposed.add(mat);
        mat.dispose();
      }
    }
  }

  viewmodelGroup.userData.skinId = skinId;
  viewmodelGroup.userData.operatorId = operatorId;
  viewmodelGroup.userData.textureLib = textureLib;
  viewmodelGroup.userData.quality = quality;
  viewmodelGroup.userData.roleMaterials = newMaterials;
}

/**
 * Builds a single forearm connecting `elbowPos` cleanly into `wristPos` with rolled/ribbed
 * operator sleeve cuff, velcro wrist strap, and (on the left wrist) an illuminated tactical
 * GPS/telemetry wristwatch angled toward the first-person camera.
 */
function buildConnectedForearm(parentGroup, addPart, {
  side = 'left',
  elbowPos = [-0.15, -0.14, 0.14],
  wristPos = [-0.025, -0.028, -0.18],
  armRadius = 0.039
}) {
  const isLeft = side === 'left';
  const sign = isLeft ? -1 : 1;

  const start = new THREE.Vector3(elbowPos[0], elbowPos[1], elbowPos[2]);
  const end = new THREE.Vector3(wristPos[0], wristPos[1], wristPos[2]);
  const delta = new THREE.Vector3().subVectors(end, start);
  const length = Math.max(0.12, delta.length());
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

  const armGroup = new THREE.Group();
  armGroup.position.copy(mid);

  // Align cylinder +Y axis from elbow to wrist, keeping dorsal/camera side consistent
  const upAxis = new THREE.Vector3(0, 1, 0);
  const dir = delta.clone().normalize();
  armGroup.quaternion.setFromUnitVectors(upAxis, dir);

  // Ripstop/creased forearm sleeve (fluted cylinder for natural tactical cloth folds)
  const sleeveGeo = createFlutedCylinder(
    armRadius * 0.82,
    armRadius * 1.06,
    length,
    16,
    6,
    8,
    0.0022
  );
  addPart(sleeveGeo, 'sleeve', 0, 0, 0, 0, 0, 0, armGroup);

  // Forearm outer seam & reinforced elbow/ulna panel
  const seamGeo = createBeveledBox(armRadius * 0.92, length * 0.68, 0.014, 0.004, 2);
  addPart(seamGeo, 'cuff', sign * armRadius * 0.6, -length * 0.06, -armRadius * 0.42, 0, 0, 0, armGroup);

  // Rolled / ribbed operator sleeve cuff near the wrist (+Y end of the forearm cylinder)
  const wristY = length * 0.5 - 0.022;
  const cuffGeo = createFlutedCylinder(
    armRadius * 0.85,
    armRadius * 0.9,
    0.046,
    16,
    3,
    12,
    0.0018
  );
  addPart(cuffGeo, 'cuff', 0, wristY, 0, 0, 0, 0, armGroup);

  // Ribbed cuff trim ring
  const trimGeo = createFlutedCylinder(
    armRadius * 0.87,
    armRadius * 0.87,
    0.012,
    16,
    2,
    10,
    0.0012
  );
  addPart(trimGeo, 'glove', 0, wristY + 0.02, 0, 0, 0, 0, armGroup);

  // Hook-and-loop velcro wrist strap
  const strapGeo = createBeveledBox(armRadius * 1.78, 0.018, armRadius * 1.76, 0.005, 2);
  addPart(strapGeo, 'opticBody', 0, wristY + 0.012, 0, 0, 0, 0, armGroup);

  // Left wrist illuminated tactical GPS/telemetry wristwatch facing the camera
  if (isLeft) {
    const watchGroup = new THREE.Group();
    // Place on upper-inner aspect of left wrist facing the player camera
    watchGroup.position.set(armRadius * 0.68, wristY + 0.004, armRadius * 0.48);
    watchGroup.rotation.set(0.18, 0.58, -0.15);

    // Heavy-duty nylon watch band wrapping wrist
    const bandGeo = createBeveledBox(armRadius * 1.84, 0.026, armRadius * 1.84, 0.006, 2);
    addPart(bandGeo, 'opticBody', -armRadius * 0.55, 0, -armRadius * 0.38, 0, 0, 0, watchGroup);

    // Ruggedized titanium watch bezel housing
    const bezelGeo = createBeveledBox(0.04, 0.034, 0.014, 0.0035, 3);
    addPart(bezelGeo, 'watchBody', 0, 0, 0.004, 0, 0, 0, watchGroup);

    // Raised protective bezel guard rails
    const guardGeo = createBeveledBox(0.042, 0.005, 0.016, 0.0015, 2);
    addPart(guardGeo, 'accent', 0, 0.015, 0.005, 0, 0, 0, watchGroup);
    addPart(guardGeo, 'accent', 0, -0.015, 0.005, 0, 0, 0, watchGroup);

    // Tactile side crown buttons
    const crownGeo = createBeveledBox(0.005, 0.008, 0.006, 0.0015, 2);
    addPart(crownGeo, 'accent', 0.021, 0.007, 0.004, 0, 0, 0, watchGroup);
    addPart(crownGeo, 'accent', 0.021, -0.007, 0.004, 0, 0, 0, watchGroup);

    // Illuminated OLED telemetry screen
    const screenGeo = createBeveledBox(0.032, 0.025, 0.004, 0.001, 2);
    addPart(screenGeo, 'watchScreen', 0, 0, 0.0105, 0, 0, 0, watchGroup);

    // Sapphire glass cover & active GPS LED indicator dot
    const glassGeo = createBeveledBox(0.032, 0.025, 0.002, 0.0005, 2);
    addPart(glassGeo, 'opticLens', 0, 0, 0.012, 0, 0, 0, watchGroup);

    const ledGeo = createBeveledBox(0.0038, 0.0038, 0.0038, 0.001, 2);
    addPart(ledGeo, 'reticle', -0.014, 0.011, 0.0115, 0, 0, 0, watchGroup);

    armGroup.add(watchGroup);
  }

  parentGroup.add(armGroup);
  return armGroup;
}

/**
 * Builds the Right Hand (Trigger Hand) positioned naturally around the weapon's pistol grip
 * (`[0, -0.055, 0.08]`), with a sculpted palm, carbon-knuckle guard, 3 curled grip fingers
 * wrapping the front strap, thumb wrapping the left side, and a distinct articulated index
 * finger reaching forward onto the trigger blade.
 */
function buildRightTriggerHand(parentGroup, addPart, gripCfg) {
  const handPos = gripCfg.rightHandPos || [0, -0.055, 0.08];
  const handRot = gripCfg.rightHandRot || [-0.24, -0.08, 0.14];

  const handGroup = new THREE.Group();
  handGroup.position.set(handPos[0], handPos[1], handPos[2]);
  handGroup.rotation.set(handRot[0], handRot[1], handRot[2]);

  // Sculpted palm & dorsal metacarpal block wrapping right side of pistol grip
  const palmGeo = createBeveledBox(0.032, 0.056, 0.054, 0.006, 3);
  addPart(palmGeo, 'glove', 0.016, -0.004, 0.004, 0, 0, 0, handGroup);

  // Padded dorsal leather/Kevlar backplate
  const backplateGeo = createBeveledBox(0.01, 0.048, 0.046, 0.003, 2);
  addPart(backplateGeo, 'cuff', 0.031, -0.002, 0.006, 0, 0, 0, handGroup);

  // Molded carbon-knuckle armor bridge across the 4 metacarpal heads
  const knuckleBridgeGeo = createBeveledBox(0.014, 0.052, 0.02, 0.0035, 3);
  addPart(knuckleBridgeGeo, 'knuckle', 0.028, -0.002, -0.018, 0, 0.12, 0, handGroup);

  // Wrist gauntlet cuff connecting cleanly to right forearm
  const gauntletGeo = createBeveledBox(0.036, 0.044, 0.034, 0.005, 2);
  addPart(gauntletGeo, 'cuff', 0.014, -0.008, 0.034, 0.15, 0, 0, handGroup);

  // 1. ARTICULATED INDEX FINGER (Trigger Finger) reaching forward onto the trigger blade
  const indexGroup = new THREE.Group();
  indexGroup.position.set(0.022, 0.022, -0.016);
  // Knuckle pod
  addPart(createBeveledBox(0.01, 0.011, 0.011, 0.0025, 2), 'knuckle', 0.004, 0.002, 0, 0, 0, 0, indexGroup);
  // Proximal phalanx extending forward along right side of trigger guard
  addPart(
    createBeveledBox(0.01, 0.01, 0.028, 0.003, 2),
    'glove',
    -0.002,
    0.001,
    -0.014,
    0.08,
    0.18,
    0,
    indexGroup
  );
  // Dorsal carbon finger pad
  addPart(
    createBeveledBox(0.004, 0.008, 0.018, 0.0015, 2),
    'knuckle',
    0.003,
    0.002,
    -0.014,
    0.08,
    0.18,
    0,
    indexGroup
  );
  // Middle & distal phalanx curving inward onto the trigger blade at [0, -0.035, 0.038]
  addPart(
    createBeveledBox(0.009, 0.0095, 0.024, 0.0028, 2),
    'glove',
    -0.012,
    0.002,
    -0.031,
    0.12,
    0.68,
    0,
    indexGroup
  );
  handGroup.add(indexGroup);

  // 2. THREE CURLED GRIP FINGERS (Middle, Ring, Little) wrapping the front strap of the pistol grip
  const gripFingerY = [0.004, -0.012, -0.027];
  const gripFingerLen = [0.028, 0.026, 0.022];
  for (let i = 0; i < 3; i++) {
    const fy = gripFingerY[i];
    const fl = gripFingerLen[i];

    // Raised carbon knuckle pod
    addPart(
      createBeveledBox(0.01, 0.01, 0.011, 0.0025, 2),
      'knuckle',
      0.026,
      fy,
      -0.02,
      0,
      0,
      0,
      handGroup
    );

    // Proximal phalanx wrapping forward to front of grip
    addPart(
      createBeveledBox(0.01, 0.011, fl, 0.003, 2),
      'glove',
      0.014,
      fy,
      -0.026,
      0,
      0.72,
      0,
      handGroup
    );

    // Middle/Distal phalanx curled tightly across the front strap of the pistol grip
    addPart(
      createBeveledBox(0.026, 0.01, 0.011, 0.003, 2),
      'glove',
      -0.002,
      fy - 0.001,
      -0.032,
      0,
      0.1,
      0,
      handGroup
    );

    // Fingertip wrapping onto left side of grip
    addPart(
      createBeveledBox(0.011, 0.0095, 0.018, 0.0025, 2),
      'glove',
      -0.016,
      fy,
      -0.022,
      0,
      -0.35,
      0,
      handGroup
    );
  }

  // 3. THUMB wrapping around the upper-left side of the pistol grip
  // Thumb metacarpal wrapping over backstrap
  addPart(
    createBeveledBox(0.028, 0.014, 0.015, 0.0035, 2),
    'glove',
    0.0,
    0.022,
    0.016,
    0.15,
    -0.35,
    0.18,
    handGroup
  );
  // Thumb proximal & distal segments resting along left side of receiver/grip
  addPart(
    createBeveledBox(0.012, 0.012, 0.028, 0.003, 2),
    'glove',
    -0.018,
    0.02,
    -0.004,
    0.18,
    0.12,
    0,
    handGroup
  );
  addPart(
    createBeveledBox(0.005, 0.009, 0.016, 0.0015, 2),
    'knuckle',
    -0.022,
    0.023,
    -0.004,
    0.18,
    0.12,
    0,
    handGroup
  );

  parentGroup.add(handGroup);
  return handGroup;
}

/**
 * Builds the Left Hand (Support / Forend C-Clamp Hand or Two-Handed Pistol / Grenade Pin Hand)
 * with carbon-knuckle glove backplate, 4 curled fingers wrapping under the handguard, and an
 * angled C-clamp thumb resting along the side/top rail.
 */
function buildLeftSupportHand(parentGroup, addPart, gripCfg) {
  const handPos = gripCfg.leftHandPos || [-0.015, -0.015, -0.22];
  const handRot = gripCfg.leftHandRot || [0.06, 0.22, -0.32];
  const style = gripCfg.leftGripStyle || 'cclamp';

  const handGroup = new THREE.Group();
  handGroup.position.set(handPos[0], handPos[1], handPos[2]);
  handGroup.rotation.set(handRot[0], handRot[1], handRot[2]);

  // Sculpted glove palm & metacarpal block along left side of handguard/forend
  const palmGeo = createBeveledBox(0.028, 0.052, 0.062, 0.006, 3);
  addPart(palmGeo, 'glove', -0.016, -0.004, 0, 0, 0, 0, handGroup);

  // Dorsal carbon-knuckle glove backplate facing camera/left
  const backplateGeo = createBeveledBox(0.01, 0.044, 0.052, 0.003, 2);
  addPart(backplateGeo, 'cuff', -0.028, 0.0, 0.002, 0, 0, 0, handGroup);

  // Molded carbon-knuckle armor bridge across the 4 knuckles
  const knuckleBridgeGeo = createBeveledBox(0.014, 0.02, 0.054, 0.0035, 3);
  addPart(knuckleBridgeGeo, 'knuckle', -0.024, -0.022, -0.004, 0, 0, -0.25, handGroup);

  // Wrist gauntlet overlap connecting to left forearm
  const gauntletGeo = createBeveledBox(0.034, 0.042, 0.034, 0.005, 2);
  addPart(gauntletGeo, 'cuff', -0.014, -0.008, 0.038, 0, 0, 0, handGroup);

  if (style === 'cclamp') {
    // 4 CURLED FINGERS wrapping underneath the bottom of the handguard/pump/forend
    const fingerZ = [-0.024, -0.009, 0.006, 0.021];
    const fingerLen = [0.028, 0.031, 0.029, 0.024];
    for (let i = 0; i < 4; i++) {
      const fz = fingerZ[i];
      const fl = fingerLen[i];

      // Individual carbon knuckle pod
      addPart(
        createBeveledBox(0.01, 0.01, 0.011, 0.0025, 2),
        'knuckle',
        -0.022,
        -0.024,
        fz,
        0,
        0,
        0,
        handGroup
      );

      // Proximal phalanx wrapping under bottom rail/handguard
      addPart(
        createBeveledBox(fl, 0.011, 0.011, 0.003, 2),
        'glove',
        -0.004,
        -0.028,
        fz,
        0,
        0,
        0.18,
        handGroup
      );

      // Dorsal finger armor pad
      addPart(
        createBeveledBox(fl * 0.65, 0.004, 0.008, 0.0015, 2),
        'knuckle',
        -0.004,
        -0.033,
        fz,
        0,
        0,
        0.18,
        handGroup
      );

      // Distal phalanx curling up the right underside of the handguard
      addPart(
        createBeveledBox(0.01, 0.022, 0.01, 0.0028, 2),
        'glove',
        0.016,
        -0.019,
        fz,
        0,
        0,
        -0.35,
        handGroup
      );
    }

    // ANGLED C-CLAMP THUMB resting along the side/top rail
    addPart(
      createBeveledBox(0.015, 0.032, 0.015, 0.0035, 2),
      'glove',
      -0.014,
      0.024,
      0.004,
      0.28,
      0,
      -0.38,
      handGroup
    );
    addPart(
      createBeveledBox(0.024, 0.012, 0.028, 0.003, 2),
      'glove',
      0.0,
      0.04,
      -0.016,
      0.08,
      -0.22,
      -0.12,
      handGroup
    );
    addPart(
      createBeveledBox(0.016, 0.005, 0.018, 0.0015, 2),
      'knuckle',
      0.0,
      0.046,
      -0.016,
      0.08,
      -0.22,
      -0.12,
      handGroup
    );
  } else if (style === 'pistolSupport') {
    // Two-handed support grip on pistol: 4 fingers wrapping across front of right hand's grip fingers,
    // plus forward-pointing combat support thumb along the left frame
    const fingerY = [0.01, -0.004, -0.018, -0.031];
    for (let i = 0; i < 4; i++) {
      const fy = fingerY[i];
      addPart(
        createBeveledBox(0.01, 0.01, 0.011, 0.0025, 2),
        'knuckle',
        -0.02,
        fy,
        -0.02,
        0,
        0,
        0,
        handGroup
      );
      addPart(
        createBeveledBox(0.03, 0.0105, 0.011, 0.003, 2),
        'glove',
        0.002,
        fy,
        -0.024,
        0,
        -0.18,
        0,
        handGroup
      );
    }
    // Thumbs-forward support thumb along frame
    addPart(
      createBeveledBox(0.013, 0.013, 0.036, 0.003, 2),
      'glove',
      -0.01,
      0.028,
      -0.016,
      0.08,
      -0.12,
      0,
      handGroup
    );
  } else {
    // Grenade pull-ring pinch grip
    addPart(
      createBeveledBox(0.012, 0.012, 0.032, 0.003, 2),
      'glove',
      0.012,
      0.016,
      -0.014,
      0.15,
      -0.35,
      0,
      handGroup
    );
    addPart(
      createBeveledBox(0.011, 0.011, 0.03, 0.003, 2),
      'glove',
      0.014,
      0.002,
      -0.016,
      -0.1,
      -0.35,
      0,
      handGroup
    );
  }

  parentGroup.add(handGroup);
  return handGroup;
}

/**
 * Builds the complete AAA First-Person Tactical Arms, Wrists (with Left Telemetry Watch),
 * and Weapon-Specific Gloved Hands (`_buildFirstPersonArms`).
 */
export function _buildFirstPersonArms(
  skin = 'factory',
  operator = 'vanguard',
  textureLib = null,
  quality = 'balanced',
  weaponId = 'rifle',
  targetGroup = null,
  addPartFn = null
) {
  const armsRoot = targetGroup || new THREE.Group();
  const gripCfg = WEAPON_GRIP_CONFIG[weaponId] || WEAPON_GRIP_CONFIG.rifle;

  const localAddPart = addPartFn || ((geo, role, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, parent = armsRoot) => {
    const mesh = new THREE.Mesh(geo);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.userData.partRole = role;
    mesh.userData.skinRole = mapRoleToSkinCategory(role);
    parent.add(mesh);
    return mesh;
  });

  const rHandPos = gripCfg.rightHandPos;
  const lHandPos = gripCfg.leftHandPos;

  // Left Forearm entering from lower-left `[-0.15, -0.14, 0.14]` angled cleanly to support wrist
  buildConnectedForearm(armsRoot, localAddPart, {
    side: 'left',
    elbowPos: gripCfg.leftElbowPos || [-0.15, -0.14, 0.14],
    wristPos: [lHandPos[0] - 0.014, lHandPos[1] - 0.01, lHandPos[2] + 0.036],
    armRadius: 0.039
  });

  // Left Gloved Hand (Support / Forend C-Clamp Hand)
  buildLeftSupportHand(armsRoot, localAddPart, gripCfg);

  // Right Forearm entering from lower-right `[0.12, -0.14, 0.24]` angled cleanly to trigger wrist
  buildConnectedForearm(armsRoot, localAddPart, {
    side: 'right',
    elbowPos: gripCfg.rightElbowPos || [0.12, -0.14, 0.24],
    wristPos: [rHandPos[0] + 0.016, rHandPos[1] - 0.01, rHandPos[2] + 0.036],
    armRadius: 0.039
  });

  // Right Gloved Hand (Trigger Hand with articulated index finger on trigger blade)
  buildRightTriggerHand(armsRoot, localAddPart, gripCfg);

  if (!targetGroup) {
    applyWeaponSkin(armsRoot, {
      skinId: typeof skin === 'string' ? skin : (skin?.id || 'factory'),
      operatorId: typeof operator === 'string' ? operator : (operator?.id || 'vanguard'),
      textureLib,
      quality
    });
  }

  return armsRoot;
}

/**
 * Builds a high-detail 3D weapon viewmodel with selective two-tone custom gunsmith blueprint
 * skinning (`userData.skinRole`: `'primary'`, `'accent'`, `'hardware'`) and first-person tactical hands.
 */
export function buildViewmodelMesh(weaponId, options = {}) {
  const opts = typeof options === 'string'
    ? { skinId: options }
    : (options || {});

  const {
    skinId = 'factory',
    operatorId = 'vanguard',
    textureLib = null,
    quality = 'balanced',
    isShowcase = false
  } = opts;

  const group = new THREE.Group();
  group.userData.weaponId = weaponId;

  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffd166,
    transparent: true,
    opacity: 0.92
  });
  const flashCoreMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.96
  });

  const addPart = (geo, role, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, parent = group, explicitSkinRole = null) => {
    const mesh = new THREE.Mesh(geo);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.userData.partRole = role;
    mesh.userData.skinRole = explicitSkinRole || mapRoleToSkinCategory(role);
    parent.add(mesh);
    return mesh;
  };

  const addBox = (w, h, d, role, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, bevel = null, parent = group, explicitSkinRole = null) => {
    const b = bevel !== null ? bevel : Math.min(w, h, d) * 0.18;
    const geo = createBeveledBox(w, h, d, b, 3);
    return addPart(geo, role, x, y, z, rx, ry, rz, parent, explicitSkinRole);
  };

  const addFluted = (rTop, rBot, len, role, x = 0, y = 0, z = 0, rx = Math.PI / 2, ry = 0, rz = 0, flutes = 10, depth = 0.0018, parent = group, explicitSkinRole = null) => {
    const geo = createFlutedCylinder(rTop, rBot, len, 18, 6, flutes, depth);
    return addPart(geo, role, x, y, z, rx, ry, rz, parent, explicitSkinRole);
  };

  let muzzleFlash = null;
  const attachMuzzleFlash = (x, y, z, scale = 1.0) => {
    const flashGroup = new THREE.Group();
    flashGroup.position.set(x, y, z);

    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(0.044 * scale, 0.165 * scale, 8), flashMat);
    cone1.rotation.x = -Math.PI / 2;

    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.074 * scale, 0.062 * scale, 8), flashMat);
    cone2.rotation.x = Math.PI / 2;

    const core = new THREE.Mesh(new THREE.ConeGeometry(0.024 * scale, 0.11 * scale, 6), flashCoreMat);
    core.rotation.x = -Math.PI / 2;

    flashGroup.add(cone1, cone2, core);
    flashGroup.visible = false;
    group.add(flashGroup);
    muzzleFlash = flashGroup;
  };

  if (weaponId === 'rifle') {
    // 1. Beveled Upper & Lower Receiver (M4A1 Tactical — PRIMARY skinRole)
    addBox(0.062, 0.05, 0.27, 'primary', 0, 0.017, 0.0, 0, 0, 0, 0.007, group, 'primary');
    addBox(0.058, 0.046, 0.21, 'primary', 0, -0.02, 0.012, 0, 0, 0, 0.006, group, 'primary');
    // Flared Magazine Well (ACCENT skinRole)
    addBox(0.062, 0.042, 0.08, 'secondary', 0, -0.036, -0.044, 0.08, 0, 0, 0.005, group, 'accent');
    // Trigger Guard & Curved Match Trigger aligned with right index finger at [0, -0.035, 0.038]
    addBox(0.018, 0.006, 0.058, 'barrel', 0, -0.048, 0.036, 0, 0, 0, 0.002, group, 'hardware');
    addBox(0.008, 0.022, 0.01, 'accent', 0, -0.034, 0.038, 0.35, 0, 0, 0.002, group, 'accent');
    // Ambidextrous Fire Selector Lever + Red Mode Indicator & Bolt Catch
    addBox(0.066, 0.008, 0.022, 'accent', 0, -0.012, 0.068, 0, 0, 0.15, 0.002, group, 'accent');
    addBox(0.068, 0.003, 0.008, 'reticle', 0, -0.012, 0.068, 0, 0, 0.15, 0.0005, group, 'accent');
    addBox(0.065, 0.016, 0.014, 'barrel', 0, 0.002, -0.015, 0, 0, 0, 0.002, group, 'hardware');
    // Ambidextrous Radian-Style Charging Handle Latch
    addBox(0.052, 0.012, 0.028, 'accent', 0, 0.036, 0.134, 0, 0, 0, 0.003, group, 'accent');

    // 2. Ejection Port, Contrasting Bolt Carrier Group (BCG), Dust Cover & Brass Deflector
    addBox(0.006, 0.022, 0.078, 'opticBody', 0.029, 0.018, -0.025, 0, 0, 0, 0.0015, group, 'hardware');
    // Contrasting metallic Bolt Carrier Group visible inside ejection port
    addFluted(0.01, 0.01, 0.072, 'boltCarrier', 0.027, 0.018, -0.025, Math.PI / 2, 0, 0, 8, 0.0012, group, 'accent');
    // Open hinged dust cover & spring rod
    addBox(0.012, 0.005, 0.076, 'accent', 0.033, 0.005, -0.025, 0, 0, -0.35, 0.0015, group, 'accent');
    addBox(0.015, 0.024, 0.022, 'secondary', 0.032, 0.018, 0.025, 0, 0.25, 0, 0.004, group, 'accent');

    // 3. Forward Assist Plunger on Upper Right Rear
    addFluted(0.0075, 0.0085, 0.038, 'barrel', 0.03, 0.012, 0.092, Math.PI / 2 - 0.1, -0.24, 0, 8, 0.001, group, 'hardware');
    addFluted(0.009, 0.009, 0.01, 'accent', 0.035, 0.01, 0.112, Math.PI / 2 - 0.1, -0.24, 0, 10, 0.0012, group, 'accent');

    // 4. 12-Tooth Full-Length Picatinny Top Rail (HARDWARE skinRole)
    addBox(0.032, 0.008, 0.51, 'barrel', 0, 0.044, -0.12, 0, 0, 0, 0.002, group, 'hardware');
    for (let i = 0; i < 12; i++) {
      const tz = 0.105 - i * 0.042;
      addBox(0.035, 0.006, 0.018, 'barrel', 0, 0.05, tz, 0, 0, 0, 0.0015, group, 'hardware');
    }

    // 5. Octagonal Free-Float Vented M-LOK Handguard (PRIMARY chassis + ACCENT rails + HARDWARE inner barrel/gas system)
    addBox(0.056, 0.058, 0.26, 'primary', 0, 0.01, -0.262, 0, 0, 0, 0.01, group, 'primary');
    // Recessed dark ventilation slots showing inner gas tube & barrel
    addBox(0.059, 0.015, 0.215, 'opticBody', 0, 0.022, -0.262, 0, 0, 0, 0.002, group, 'hardware');
    addBox(0.059, 0.014, 0.215, 'opticBody', 0, -0.004, -0.262, 0, 0, 0, 0.002, group, 'hardware');
    // Stainless steel gas tube visible inside top handguard vent
    addFluted(0.0035, 0.0035, 0.23, 'boltCarrier', 0, 0.031, -0.24, Math.PI / 2, 0, 0, 6, 0.0002, group, 'accent');
    // M-LOK vertical bridges & side rail sections (ACCENT skinRole)
    for (let s = 0; s < 5; s++) {
      const sz = -0.165 - s * 0.048;
      addBox(0.062, 0.054, 0.012, 'secondary', 0, 0.01, sz, 0, 0, 0, 0.0025, group, 'accent');
    }
    addBox(0.064, 0.012, 0.095, 'accent', 0, 0.009, -0.225, 0, 0, 0, 0.002, group, 'accent');
    // Front folding backup sight & angled M-LOK hand-stop
    addBox(0.028, 0.014, 0.028, 'opticBody', 0, 0.055, -0.365, 0, 0, 0, 0.003, group, 'hardware');
    addBox(0.026, 0.024, 0.036, 'opticBody', 0, -0.026, -0.285, 0.25, 0, 0, 0.004, group, 'hardware');

    // 6. Fluted Barrel + Tactical Suppressor (HARDWARE skinRole)
    addFluted(0.0135, 0.0145, 0.24, 'barrel', 0, 0.014, -0.445, Math.PI / 2, 0, 0, 10, 0.0022, group, 'hardware');
    addBox(0.024, 0.032, 0.028, 'barrel', 0, 0.008, -0.375, 0, 0, 0, 0.003, group, 'hardware');
    addFluted(0.024, 0.024, 0.024, 'accent', 0, 0.014, -0.505, Math.PI / 2, 0, 0, 12, 0.0015, group, 'accent');
    addFluted(0.0225, 0.0225, 0.16, 'barrel', 0, 0.014, -0.59, Math.PI / 2, 0, 0, 12, 0.0016, group, 'hardware');
    addFluted(0.02, 0.022, 0.012, 'opticBody', 0, 0.014, -0.672, Math.PI / 2, 0, 0, 8, 0.001, group, 'hardware');

    // 7. Illuminated Holographic / Reflex Sight Window with Crisp Bullseye Reticle
    addBox(0.042, 0.014, 0.076, 'opticBody', 0, 0.056, 0.01, 0, 0, 0, 0.003, group, 'hardware');
    addBox(0.0065, 0.032, 0.068, 'opticBody', -0.019, 0.074, 0.01, 0, 0, 0, 0.002, group, 'hardware');
    addBox(0.0065, 0.032, 0.068, 'opticBody', 0.019, 0.074, 0.01, 0, 0, 0, 0.002, group, 'hardware');
    addBox(0.044, 0.0065, 0.068, 'opticBody', 0, 0.091, 0.01, 0, 0, 0, 0.002, group, 'hardware');
    addBox(0.047, 0.012, 0.016, 'accent', 0, 0.064, 0.018, 0, 0, 0, 0.002, group, 'accent');
    // Coated reflector glass window
    addBox(0.031, 0.024, 0.0025, 'opticLens', 0, 0.074, 0.01, 0.06, 0, 0, 0.0005, group, 'opticLens');
    // Glowing holographic bullseye reticle inside the glass lens (center dot + outer circle + 4 cardinal ticks)
    addBox(0.0028, 0.0028, 0.002, 'reticle', 0, 0.074, 0.008, 0, 0, 0, 0.0005, group, 'reticle');
    const holoRing = new THREE.Mesh(new THREE.TorusGeometry(0.0078, 0.0009, 8, 24));
    holoRing.position.set(0, 0.074, 0.008);
    holoRing.userData.partRole = 'reticle';
    holoRing.userData.skinRole = 'reticle';
    group.add(holoRing);
    // 4 cardinal reticle stadia ticks (12, 3, 6, 9 o'clock)
    addBox(0.0012, 0.0036, 0.0015, 'reticle', 0, 0.083, 0.008, 0, 0, 0, 0.0003, group, 'reticle');
    addBox(0.0012, 0.0036, 0.0015, 'reticle', 0, 0.065, 0.008, 0, 0, 0, 0.0003, group, 'reticle');
    addBox(0.0036, 0.0012, 0.0015, 'reticle', -0.009, 0.074, 0.008, 0, 0, 0, 0.0003, group, 'reticle');
    addBox(0.0036, 0.0012, 0.0015, 'reticle', 0.009, 0.074, 0.008, 0, 0, 0, 0.0003, group, 'reticle');

    // 8. Curved Polymer Magazine (ACCENT body + HARDWARE ribs + ACCENT baseplate)
    addBox(0.036, 0.082, 0.058, 'secondary', 0, -0.078, -0.044, 0.13, 0, 0, 0.005, group, 'accent');
    addBox(0.035, 0.082, 0.056, 'secondary', 0, -0.142, -0.059, 0.27, 0, 0, 0.005, group, 'accent');
    for (let r = 0; r < 3; r++) {
      addBox(0.039, 0.01, 0.044, 'opticBody', 0, -0.092 - r * 0.026, -0.047 - r * 0.006, 0.2, 0, 0, 0.002, group, 'hardware');
    }
    addBox(0.04, 0.014, 0.064, 'accent', 0, -0.184, -0.072, 0.27, 0, 0, 0.003, group, 'accent');

    // 9. Ergonomic Pistol Grip aligned with Right Trigger Hand at [0, -0.055, 0.08]
    addBox(0.036, 0.108, 0.046, 'secondary', 0, -0.068, 0.084, -0.26, 0, 0, 0.007, group, 'accent');
    addBox(0.039, 0.064, 0.03, 'opticBody', 0, -0.072, 0.086, -0.26, 0, 0, 0.004, group, 'hardware');

    // 10. Adjustable Crane Stock (HARDWARE buffer tube + ACCENT cheek weld + PRIMARY lower strut)
    addFluted(0.016, 0.016, 0.19, 'barrel', 0, 0.014, 0.215, Math.PI / 2, 0, 0, 6, 0.001, group, 'hardware');
    addBox(0.052, 0.054, 0.165, 'secondary', 0, 0.006, 0.248, 0, 0, 0, 0.01, group, 'accent');
    addBox(0.034, 0.068, 0.135, 'primary', 0, -0.024, 0.26, 0.18, 0, 0, 0.007, group, 'primary');
    addBox(0.022, 0.018, 0.055, 'accent', 0, -0.052, 0.238, 0, 0, 0, 0.003, group, 'accent');
    addBox(0.05, 0.108, 0.022, 'opticBody', 0, -0.01, 0.334, 0, 0, 0, 0.005, group, 'hardware');

    if (!isShowcase) {
      _buildFirstPersonArms(skinId, operatorId, textureLib, quality, 'rifle', group, addPart);
    }

    attachMuzzleFlash(0, 0.014, -0.685, 0.92);
  } else if (weaponId === 'shotgun') {
    // 1. Beveled Combat Receiver (M1014 Combat — PRIMARY skinRole)
    addBox(0.064, 0.082, 0.33, 'primary', 0, 0.004, -0.035, 0, 0, 0, 0.009, group, 'primary');
    // Top Picatinny Rail (HARDWARE skinRole)
    addBox(0.03, 0.007, 0.22, 'barrel', 0, 0.047, -0.03, 0, 0, 0, 0.002, group, 'hardware');
    for (let i = 0; i < 6; i++) {
      addBox(0.033, 0.005, 0.018, 'barrel', 0, 0.051, 0.06 - i * 0.036, 0, 0, 0, 0.0015, group, 'hardware');
    }
    // Recessed Ejection Port + Contrasting Metallic Bolt Carrier & Knurled Charging Handle
    addBox(0.006, 0.024, 0.098, 'opticBody', 0.03, 0.014, -0.055, 0, 0, 0, 0.002, group, 'hardware');
    addFluted(0.01, 0.01, 0.09, 'boltCarrier', 0.028, 0.014, -0.055, Math.PI / 2, 0, 0, 8, 0.0012, group, 'accent');
    addFluted(0.007, 0.007, 0.028, 'accent', 0.042, 0.014, -0.082, 0, 0, Math.PI / 2, 10, 0.0012, group, 'accent');

    // Trigger Guard, Safety Button & Match Trigger aligned with right hand at [0, -0.055, 0.08]
    addBox(0.018, 0.006, 0.054, 'barrel', 0, -0.046, 0.036, 0, 0, 0, 0.002, group, 'hardware');
    addBox(0.008, 0.02, 0.01, 'accent', 0, -0.034, 0.038, 0.32, 0, 0, 0.002, group, 'accent');

    // 2. Heavy Fluted Barrel + Elevated Ventilated Rib + Under-Barrel Tubular Magazine
    addFluted(0.0175, 0.0185, 0.45, 'barrel', 0, 0.022, -0.39, Math.PI / 2, 0, 0, 8, 0.0018, group, 'hardware');
    // Elevated Ventilated Barrel Rib with 9 Cooling Bridge Posts
    addBox(0.012, 0.004, 0.41, 'barrel', 0, 0.045, -0.38, 0, 0, 0, 0.001, group, 'hardware');
    for (let r = 0; r < 9; r++) {
      addBox(0.01, 0.008, 0.014, 'barrel', 0, 0.039, -0.20 - r * 0.045, 0, 0, 0, 0.001, group, 'hardware');
    }
    // Breacher stand-off muzzle choke
    addFluted(0.0195, 0.0185, 0.045, 'opticBody', 0, 0.022, -0.615, Math.PI / 2, 0, 0, 6, 0.0022, group, 'hardware');
    // Under-barrel magazine tube + anodized follower cap + barrel clamp
    addFluted(0.0155, 0.0155, 0.4, 'secondary', 0, -0.012, -0.37, Math.PI / 2, 0, 0, 6, 0.001, group, 'accent');
    addFluted(0.0165, 0.0165, 0.026, 'accent', 0, -0.012, -0.575, Math.PI / 2, 0, 0, 10, 0.0014, group, 'accent');
    addBox(0.038, 0.058, 0.022, 'barrel', 0, 0.005, -0.51, 0, 0, 0, 0.004, group, 'hardware');

    // 3. Ribbed Pump Forend positioned at z = -0.20 for Left Hand [-0.012, -0.02, -0.20]
    addBox(0.06, 0.054, 0.195, 'secondary', 0, -0.018, -0.22, 0, 0, 0, 0.01, group, 'accent');
    for (let i = 0; i < 7; i++) {
      addBox(0.064, 0.046, 0.012, 'opticBody', 0, -0.018, -0.142 - i * 0.026, 0, 0, 0, 0.003, group, 'hardware');
    }

    // 4. Ghost-Ring Rear Sight & Fiber-Optic Front Sight
    addBox(0.034, 0.012, 0.032, 'opticBody', 0, 0.052, 0.085, 0, 0, 0, 0.002, group, 'hardware');
    addBox(0.005, 0.018, 0.022, 'opticBody', -0.015, 0.062, 0.085, 0, 0, 0, 0.0015, group, 'hardware');
    addBox(0.005, 0.018, 0.022, 'opticBody', 0.015, 0.062, 0.085, 0, 0, 0, 0.0015, group, 'hardware');
    const ghostRing = new THREE.Mesh(new THREE.TorusGeometry(0.0095, 0.002, 8, 18));
    ghostRing.position.set(0, 0.064, 0.085);
    ghostRing.userData.partRole = 'barrel';
    ghostRing.userData.skinRole = 'hardware';
    group.add(ghostRing);
    addBox(0.024, 0.016, 0.022, 'opticBody', 0, 0.048, -0.565, 0, 0, 0, 0.002, group, 'hardware');
    addBox(0.005, 0.016, 0.008, 'barrel', 0, 0.058, -0.565, 0, 0, 0, 0.001, group, 'hardware');
    addBox(0.0042, 0.0042, 0.005, 'reticle', 0, 0.064, -0.562, 0, 0, 0, 0.001, group, 'reticle');

    // 5. Shell-Holder Saddle on Receiver Side with 5 Crimson Red / Brass 12-Gauge Shells
    addBox(0.01, 0.056, 0.165, 'opticBody', -0.034, 0.004, -0.03, 0, 0, 0, 0.0025, group, 'hardware');
    for (let s = 0; s < 5; s++) {
      const sz = 0.032 - s * 0.031;
      addFluted(0.0095, 0.0095, 0.046, 'shellHull', -0.041, 0.0, sz, 0, 0, 0, 10, 0.0004, group, 'accent');
      addFluted(0.0102, 0.0102, 0.015, 'brass', -0.041, 0.025, sz, 0, 0, 0, 12, 0.0005, group, 'accent');
    }

    // 6. Tactical Stock & Pistol Grip aligned with Right Hand at [0, -0.055, 0.08]
    addBox(0.036, 0.105, 0.046, 'secondary', 0, -0.068, 0.084, -0.26, 0, 0, 0.007, group, 'accent');
    addBox(0.039, 0.062, 0.03, 'opticBody', 0, -0.072, 0.086, -0.26, 0, 0, 0.004, group, 'hardware');
    addBox(0.05, 0.058, 0.19, 'secondary', 0, -0.006, 0.215, -0.06, 0, 0, 0.009, group, 'accent');
    addBox(0.036, 0.072, 0.17, 'primary', 0, -0.032, 0.225, 0.08, 0, 0, 0.007, group, 'primary');
    addBox(0.052, 0.112, 0.024, 'opticBody', 0, -0.02, 0.318, 0, 0, 0, 0.005, group, 'hardware');

    if (!isShowcase) {
      _buildFirstPersonArms(skinId, operatorId, textureLib, quality, 'shotgun', group, addPart);
    }

    attachMuzzleFlash(0, 0.022, -0.645, 1.35);
  } else if (weaponId === 'sniper') {
    // 1. Beveled Tactical Chassis & Thumbhole Stock (AWP Tactical — PRIMARY skinRole)
    addBox(0.064, 0.076, 0.45, 'primary', 0, -0.006, -0.095, 0, 0, 0, 0.01, group, 'primary');
    // Upper receiver action & scope Picatinny rail (HARDWARE skinRole)
    addBox(0.052, 0.036, 0.24, 'barrel', 0, 0.036, -0.06, 0, 0, 0, 0.006, group, 'hardware');
    // Spiral-Fluted Contrasting Bolt Carrier visible in ejection port
    addFluted(0.011, 0.011, 0.11, 'boltCarrier', 0.016, 0.036, -0.05, Math.PI / 2, 0, 0, 10, 0.0014, group, 'accent');
    // Trigger Guard & Match Two-Stage Trigger aligned with right hand at [0, -0.055, 0.08]
    addBox(0.018, 0.006, 0.054, 'barrel', 0, -0.048, 0.036, 0, 0, 0, 0.002, group, 'hardware');
    addBox(0.008, 0.02, 0.01, 'accent', 0, -0.034, 0.038, 0.28, 0, 0, 0.002, group, 'accent');
    // Detachable .338 Lapua Mag box magazine (ACCENT skinRole)
    addBox(0.042, 0.078, 0.096, 'secondary', 0, -0.064, -0.065, 0.06, 0, 0, 0.005, group, 'accent');
    addBox(0.045, 0.014, 0.102, 'accent', 0, -0.104, -0.065, 0.06, 0, 0, 0.003, group, 'accent');
    // Sculpted thumbhole stock assembly & ergonomic grip pillar at z = 0.084
    addBox(0.038, 0.1, 0.046, 'secondary', 0, -0.064, 0.084, -0.22, 0, 0, 0.007, group, 'accent');
    addBox(0.041, 0.06, 0.03, 'opticBody', 0, -0.066, 0.085, -0.22, 0, 0, 0.004, group, 'hardware');
    addBox(0.052, 0.038, 0.23, 'primary', 0, -0.002, 0.22, 0, 0, 0, 0.008, group, 'primary');
    addBox(0.048, 0.032, 0.22, 'primary', 0, -0.066, 0.215, 0.06, 0, 0, 0.007, group, 'primary');
    addBox(0.05, 0.078, 0.058, 'primary', 0, -0.034, 0.305, 0, 0, 0, 0.007, group, 'primary');
    addBox(0.052, 0.112, 0.024, 'opticBody', 0, -0.032, 0.345, 0, 0, 0, 0.005, group, 'hardware');

    // 2. Adjustable Cheek Riser (ACCENT + HARDWARE)
    addBox(0.056, 0.032, 0.135, 'secondary', 0, 0.032, 0.215, 0, 0, 0, 0.007, group, 'accent');
    addFluted(0.005, 0.005, 0.032, 'barrel', 0, 0.016, 0.18, 0, 0, 0, 6, 0.0005, group, 'hardware');
    addFluted(0.005, 0.005, 0.032, 'barrel', 0, 0.016, 0.25, 0, 0, 0, 6, 0.0005, group, 'hardware');
    addFluted(0.008, 0.008, 0.01, 'accent', 0.029, 0.018, 0.215, 0, 0, Math.PI / 2, 8, 0.001, group, 'accent');

    // 3. Heavy Fluted Free-Floating Barrel (HARDWARE)
    addFluted(0.0145, 0.0185, 0.56, 'barrel', 0, 0.02, -0.51, Math.PI / 2, 0, 0, 10, 0.0028, group, 'hardware');

    // 4. Multi-Chamber Tank-Style Muzzle Brake (HARDWARE)
    addBox(0.038, 0.038, 0.082, 'barrel', 0, 0.02, -0.81, 0, 0, 0, 0.005, group, 'hardware');
    for (let c = 0; c < 3; c++) {
      const cz = -0.784 - c * 0.022;
      addBox(0.042, 0.02, 0.012, 'opticBody', 0, 0.02, cz, 0, 0, 0, 0.0015, group, 'hardware');
    }

    // 5. Dual Scope Rings + Illuminated Dual-Lens Telescopic Scope with Etched Ocular Reticle
    addBox(0.034, 0.046, 0.028, 'barrel', 0, 0.058, -0.135, 0, 0, 0, 0.004, group, 'hardware');
    addBox(0.034, 0.046, 0.028, 'barrel', 0, 0.058, 0.005, 0, 0, 0, 0.004, group, 'hardware');
    addBox(0.042, 0.01, 0.02, 'accent', 0, 0.052, -0.135, 0, 0, 0, 0.002, group, 'accent');
    addBox(0.042, 0.01, 0.02, 'accent', 0, 0.052, 0.005, 0, 0, 0, 0.002, group, 'accent');
    // Main 34mm scope tube
    addFluted(0.0175, 0.0175, 0.28, 'opticBody', 0, 0.088, -0.06, Math.PI / 2, 0, 0, 8, 0.0005, group, 'hardware');
    // Front objective bell & coated objective lens
    addFluted(0.03, 0.0185, 0.095, 'opticBody', 0, 0.088, -0.215, Math.PI / 2, 0, 0, 12, 0.0008, group, 'hardware');
    addFluted(0.031, 0.031, 0.016, 'accent', 0, 0.088, -0.258, Math.PI / 2, 0, 0, 16, 0.001, group, 'accent');
    const objLens = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.006, 20));
    objLens.rotation.x = Math.PI / 2;
    objLens.position.set(0, 0.088, -0.26);
    objLens.userData.partRole = 'opticLens';
    objLens.userData.skinRole = 'opticLens';
    group.add(objLens);
    // Ocular bell, fast-focus diopter ring & illuminated dual-lens ocular with mil-dot reticle
    addFluted(0.021, 0.025, 0.075, 'opticBody', 0, 0.088, 0.095, Math.PI / 2, 0, 0, 12, 0.0008, group, 'hardware');
    addFluted(0.0255, 0.0255, 0.014, 'accent', 0, 0.088, 0.126, Math.PI / 2, 0, 0, 14, 0.001, group, 'accent');
    const ocuLens = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.005, 20));
    ocuLens.rotation.x = Math.PI / 2;
    ocuLens.position.set(0, 0.088, 0.132);
    ocuLens.userData.partRole = 'opticLens';
    ocuLens.userData.skinRole = 'opticLens';
    group.add(ocuLens);
    // Illuminated etched mil-dot crosshair & rangefinder ring inside ocular lens
    const scopeRing = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.0008, 8, 24));
    scopeRing.position.set(0, 0.088, 0.135);
    scopeRing.userData.partRole = 'reticle';
    scopeRing.userData.skinRole = 'reticle';
    group.add(scopeRing);
    addBox(0.032, 0.0009, 0.001, 'reticle', 0, 0.088, 0.135, 0, 0, 0, 0.0002, group, 'reticle');
    addBox(0.0009, 0.032, 0.001, 'reticle', 0, 0.088, 0.135, 0, 0, 0, 0.0002, group, 'reticle');
    addBox(0.0026, 0.0026, 0.0015, 'reticle', 0, 0.088, 0.1355, 0, 0, 0, 0.0004, group, 'reticle');

    // Elevation, windage & parallax turrets with brass zero-stop indicator
    addFluted(0.012, 0.012, 0.022, 'opticBody', 0, 0.112, -0.06, 0, 0, 0, 12, 0.0012, group, 'hardware');
    addFluted(0.0115, 0.0115, 0.004, 'brass', 0, 0.102, -0.06, 0, 0, 0, 12, 0.0006, group, 'accent');
    addFluted(0.0125, 0.0125, 0.005, 'accent', 0, 0.121, -0.06, 0, 0, 0, 12, 0.001, group, 'accent');
    addFluted(0.011, 0.011, 0.02, 'opticBody', 0.024, 0.088, -0.06, 0, 0, Math.PI / 2, 12, 0.0012, group, 'hardware');
    addFluted(0.011, 0.011, 0.018, 'opticBody', -0.024, 0.088, -0.06, 0, 0, Math.PI / 2, 12, 0.0012, group, 'hardware');

    // 6. Swept Bolt Handle & Oversized Fluted Tactical Bolt Knob
    addBox(0.044, 0.01, 0.012, 'barrel', 0.036, 0.028, 0.035, 0, -0.25, -0.18, 0.002, group, 'hardware');
    addFluted(0.0125, 0.0085, 0.026, 'accent', 0.058, 0.022, 0.042, 0, 0, Math.PI / 2 + 0.2, 12, 0.0018, group, 'accent');

    // 7. Folding Bipod Mounted Forward Under Forend (ahead of left support hand at z = -0.25)
    addBox(0.038, 0.022, 0.042, 'barrel', 0, -0.048, -0.295, 0, 0, 0, 0.004, group, 'hardware');
    addFluted(0.007, 0.008, 0.18, 'barrel', -0.023, -0.056, -0.39, Math.PI / 2, 0, 0, 8, 0.001, group, 'hardware');
    addFluted(0.007, 0.008, 0.18, 'barrel', 0.023, -0.056, -0.39, Math.PI / 2, 0, 0, 8, 0.001, group, 'hardware');
    addFluted(0.01, 0.009, 0.024, 'opticBody', -0.023, -0.056, -0.485, Math.PI / 2, 0, 0, 8, 0.0015, group, 'hardware');
    addFluted(0.01, 0.009, 0.024, 'opticBody', 0.023, -0.056, -0.485, Math.PI / 2, 0, 0, 8, 0.0015, group, 'hardware');

    if (!isShowcase) {
      _buildFirstPersonArms(skinId, operatorId, textureLib, quality, 'sniper', group, addPart);
    }

    attachMuzzleFlash(0, 0.02, -0.85, 1.5);
  } else if (weaponId === 'pistol') {
    // 1. Beveled Machined Slide with Front & Rear Serrations (USP-S Sidearm — PRIMARY skinRole)
    addBox(0.038, 0.042, 0.195, 'primary', 0, 0.022, 0.01, 0, 0, 0, 0.006, group, 'primary');
    // Recessed ejection port + Contrasting Match Barrel Hood & Extractor
    addBox(0.026, 0.018, 0.044, 'boltCarrier', 0.005, 0.036, 0.022, 0, 0, 0, 0.002, group, 'accent');
    addBox(0.004, 0.007, 0.032, 'accent', 0.019, 0.024, 0.052, 0, 0, 0, 0.001, group, 'accent');
    // Rear & front CNC slide serration ribs
    for (let i = 0; i < 6; i++) {
      addBox(0.041, 0.03, 0.004, 'barrel', 0, 0.021, 0.062 + i * 0.0065, 0.18, 0, 0, 0.001, group, 'hardware');
    }
    for (let i = 0; i < 4; i++) {
      addBox(0.041, 0.028, 0.004, 'barrel', 0, 0.021, -0.05 - i * 0.0065, 0.18, 0, 0, 0.001, group, 'hardware');
    }

    // 2. Polymer Frame with Trigger Guard, Under-Barrel Tactical Light & Stippled Grip
    addBox(0.035, 0.028, 0.188, 'secondary', 0, -0.01, 0.012, 0, 0, 0, 0.005, group, 'accent');
    // Under-barrel tactical weapon light / laser module (HARDWARE)
    addBox(0.032, 0.022, 0.06, 'opticBody', 0, -0.026, -0.044, 0, 0, 0, 0.004, group, 'hardware');
    addFluted(0.008, 0.008, 0.01, 'opticLens', 0, -0.026, -0.074, Math.PI / 2, 0, 0, 12, 0.0005, group, 'opticLens');
    // Squared trigger guard & curved match trigger aligned with right index finger at [0, -0.032, 0.038]
    addBox(0.014, 0.006, 0.052, 'secondary', 0, -0.042, 0.038, 0, 0, 0, 0.002, group, 'accent');
    addBox(0.014, 0.026, 0.007, 'secondary', 0, -0.03, 0.014, 0.18, 0, 0, 0.002, group, 'accent');
    addBox(0.007, 0.018, 0.009, 'accent', 0, -0.028, 0.038, 0.35, 0, 0, 0.0015, group, 'accent');
    // Ergonomic grip + stippled side panels at z = 0.08 for right hand [0, -0.055, 0.08]
    addBox(0.034, 0.106, 0.048, 'secondary', 0, -0.064, 0.08, -0.22, 0, 0, 0.006, group, 'accent');
    addBox(0.037, 0.072, 0.034, 'opticBody', 0, -0.066, 0.081, -0.22, 0, 0, 0.003, group, 'hardware');
    // Slide release & decocking lever
    addBox(0.04, 0.008, 0.026, 'accent', 0, 0.002, 0.062, 0, 0, 0, 0.0015, group, 'accent');

    // 3. Raised Suppressor-Height Tritium 3-Dot Night Sights
    addBox(0.022, 0.013, 0.014, 'barrel', 0, 0.047, 0.092, 0, 0, 0, 0.002, group, 'hardware');
    addBox(0.0032, 0.0032, 0.0032, 'reticle', -0.0055, 0.049, 0.099, 0, 0, 0, 0.0005, group, 'reticle');
    addBox(0.0032, 0.0032, 0.0032, 'reticle', 0.0055, 0.049, 0.099, 0, 0, 0, 0.0005, group, 'reticle');
    addBox(0.006, 0.014, 0.014, 'barrel', 0, 0.047, -0.075, 0, 0, 0, 0.0015, group, 'hardware');
    addBox(0.0038, 0.0038, 0.0038, 'reticle', 0, 0.05, -0.069, 0, 0, 0, 0.0005, group, 'reticle');

    // 4. Threaded Cylindrical Suppressor (ACCENT booster + HARDWARE baffle tube)
    addFluted(0.009, 0.009, 0.026, 'accent', 0, 0.022, -0.098, Math.PI / 2, 0, 0, 10, 0.0008, group, 'accent');
    addFluted(0.0175, 0.0175, 0.022, 'accent', 0, 0.022, -0.116, Math.PI / 2, 0, 0, 12, 0.0012, group, 'accent');
    addFluted(0.0168, 0.0168, 0.16, 'barrel', 0, 0.022, -0.20, Math.PI / 2, 0, 0, 10, 0.0014, group, 'hardware');
    addFluted(0.014, 0.016, 0.01, 'opticBody', 0, 0.022, -0.282, Math.PI / 2, 0, 0, 8, 0.001, group, 'hardware');

    // 5. Magazine Baseplate (ACCENT)
    addBox(0.038, 0.016, 0.058, 'accent', 0, -0.12, 0.093, -0.22, 0, 0, 0.004, group, 'accent');

    if (!isShowcase) {
      _buildFirstPersonArms(skinId, operatorId, textureLib, quality, 'pistol', group, addPart);
    }

    attachMuzzleFlash(0, 0.022, -0.296, 0.65);
  } else if (weaponId === 'grenade') {
    const grenOffsetZ = isShowcase ? 0 : 0.04;
    const grenOffsetY = isShowcase ? 0 : -0.032;

    // 1. Segmented Fragmentation Body (HE-67 Frag — PRIMARY skinRole)
    const coreBody = new THREE.Mesh(new THREE.SphereGeometry(0.049, 20, 16));
    coreBody.scale.set(1.0, 1.12, 1.0);
    coreBody.position.set(0, grenOffsetY, grenOffsetZ);
    coreBody.userData.partRole = 'primary';
    coreBody.userData.skinRole = 'primary';
    group.add(coreBody);

    // Fragmentation waffle bands & meridian ribs
    const bandHeights = [-0.026, -0.009, 0.009, 0.026];
    const bandRadii = [0.043, 0.049, 0.049, 0.043];
    for (let b = 0; b < bandHeights.length; b++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(bandRadii[b], 0.0032, 8, 20));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, grenOffsetY + bandHeights[b], grenOffsetZ);
      ring.userData.partRole = b === 3 ? 'accent' : 'secondary';
      ring.userData.skinRole = 'accent';
      group.add(ring);
    }
    for (let m = 0; m < 8; m++) {
      const angle = (m / 8) * Math.PI * 2;
      const rx = Math.cos(angle) * 0.046;
      const rz = Math.sin(angle) * 0.046;
      addBox(0.01, 0.056, 0.01, 'primary', rx, grenOffsetY, grenOffsetZ + rz, 0, -angle, 0, 0.003, group, 'primary');
    }

    // 2. M213 Fuze Head & Threaded Collar (HARDWARE)
    addFluted(0.018, 0.022, 0.022, 'barrel', 0, grenOffsetY + 0.056, grenOffsetZ, 0, 0, 0, 10, 0.0012, group, 'hardware');
    addBox(0.032, 0.028, 0.03, 'barrel', 0, grenOffsetY + 0.074, grenOffsetZ, 0, 0, 0, 0.005, group, 'hardware');

    // 3. Stamped Steel Spoon Safety Lever (ACCENT)
    addBox(0.024, 0.01, 0.044, 'secondary', 0.008, grenOffsetY + 0.089, grenOffsetZ, 0, 0, 0, 0.003, group, 'accent');
    addBox(0.014, 0.072, 0.022, 'secondary', 0.041, grenOffsetY + 0.042, grenOffsetZ, 0, 0, -0.32, 0.003, group, 'accent');
    addBox(0.012, 0.028, 0.02, 'secondary', 0.051, grenOffsetY + 0.002, grenOffsetZ, 0, 0, -0.08, 0.0025, group, 'accent');

    // 4. Cotter Pin & Metallic Pull-Ring (ACCENT / BRASS)
    addFluted(0.0026, 0.0026, 0.042, 'accent', 0, grenOffsetY + 0.075, grenOffsetZ, Math.PI / 2, 0, 0, 6, 0.0002, group, 'accent');
    const pullRing = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.003, 10, 24));
    pullRing.position.set(-0.024, grenOffsetY + 0.068, grenOffsetZ - 0.018);
    pullRing.rotation.set(0.35, 0.4, 0.2);
    pullRing.userData.partRole = 'brass';
    pullRing.userData.skinRole = 'accent';
    group.add(pullRing);

    if (!isShowcase) {
      _buildFirstPersonArms(skinId, operatorId, textureLib, quality, 'grenade', group, addPart);
    }
  }

  group.userData.muzzleFlash = muzzleFlash;
  applyWeaponSkin(group, { skinId, operatorId, textureLib, quality });
  return group;
}

/**
 * Builds a centered, showcase-ready 3D weapon model (without first-person arms) for the Menu 3D Preview Bay.
 */
export function buildWeaponShowcaseMesh(
  weaponId,
  skinId = 'factory',
  textureLib = null,
  quality = 'ultra'
) {
  let resolvedSkin = skinId;
  let resolvedTexLib = textureLib;
  let resolvedQuality = quality;

  if (skinId && typeof skinId === 'object') {
    resolvedSkin = skinId.skinId || 'factory';
    resolvedTexLib = skinId.textureLib || null;
    resolvedQuality = skinId.quality || 'ultra';
  }

  const innerModel = buildViewmodelMesh(weaponId, {
    skinId: resolvedSkin,
    textureLib: resolvedTexLib,
    quality: resolvedQuality,
    isShowcase: true
  });

  // Compute exact geometric bounds to center the weapon in the 3D Preview Bay
  const box = new THREE.Box3().setFromObject(innerModel);
  const center = new THREE.Vector3();
  box.getCenter(center);
  innerModel.position.sub(center);

  const pivot = new THREE.Group();
  pivot.userData.weaponId = weaponId;
  pivot.userData.isShowcase = true;

  // Present side profile by default and normalize scale per weapon class
  const scaleMap = {
    rifle: 1.08,
    shotgun: 1.08,
    sniper: 0.92,
    pistol: 1.85,
    grenade: 2.75
  };
  const scale = scaleMap[weaponId] || 1.0;

  const orientGroup = new THREE.Group();
  orientGroup.rotation.y = Math.PI * 0.5;
  orientGroup.scale.setScalar(scale);
  orientGroup.add(innerModel);

  pivot.add(orientGroup);

  // Sync userData references so applyWeaponSkin(showcaseMesh, ...) works directly on pivot too
  pivot.userData.skinId = innerModel.userData.skinId;
  pivot.userData.operatorId = innerModel.userData.operatorId;
  pivot.userData.textureLib = innerModel.userData.textureLib;
  pivot.userData.quality = innerModel.userData.quality;
  pivot.userData.roleMaterials = innerModel.userData.roleMaterials;

  pivot.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return pivot;
}
