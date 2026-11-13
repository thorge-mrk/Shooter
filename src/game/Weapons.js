import * as THREE from 'three';

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
    hipPos: [0.22, -0.21, -0.42],
    adsPos: [0.0, -0.145, -0.33]
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
    hipPos: [0.23, -0.22, -0.43],
    adsPos: [0.0, -0.155, -0.35]
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
    hipPos: [0.24, -0.23, -0.46],
    adsPos: [0.0, -0.15, -0.3]
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
    hipPos: [0.2, -0.2, -0.37],
    adsPos: [0.0, -0.135, -0.31]
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
    hipPos: [0.21, -0.21, -0.37],
    adsPos: [0.15, -0.18, -0.33]
  }
];

export function createWeaponInventory() {
  return WEAPON_SPECS.map((spec) => ({
    spec,
    mag: spec.magSize,
    reserve: spec.reserveMax
  }));
}

export function buildViewmodelMesh(weaponId) {
  const group = new THREE.Group();

  const gunmetal = new THREE.MeshStandardMaterial({ color: 0x202731, roughness: 0.34, metalness: 0.8 });
  const darkPolymer = new THREE.MeshStandardMaterial({ color: 0x16191f, roughness: 0.68, metalness: 0.16 });
  const tanPolymer = new THREE.MeshStandardMaterial({ color: 0xa48860, roughness: 0.62, metalness: 0.1 });
  const oliveChassis = new THREE.MeshStandardMaterial({ color: 0x485b40, roughness: 0.58, metalness: 0.24 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0x26292e, roughness: 0.82, metalness: 0.08 });
  const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x3b444b, roughness: 0.85, metalness: 0.05 });
  const redDotMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.9 });

  const addBox = (w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    group.add(m);
    return m;
  };

  let muzzleFlash = null;
  const attachMuzzleFlash = (x, y, z, scale = 1.0) => {
    const flashGroup = new THREE.Group();
    flashGroup.position.set(x, y, z);
    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(0.045 * scale, 0.16 * scale, 6), flashMat);
    cone1.rotation.x = -Math.PI / 2;
    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.075 * scale, 0.06 * scale, 6), flashMat);
    cone2.rotation.x = Math.PI / 2;
    flashGroup.add(cone1, cone2);
    flashGroup.visible = false;
    group.add(flashGroup);
    muzzleFlash = flashGroup;
  };

  const addForearm = (x, y, z, rx, ry, radius = 0.044) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(radius, 0.22, 4, 8), sleeveMat);
    arm.position.set(x, y, z);
    arm.rotation.set(rx, ry, 0);
    group.add(arm);
  };

  const addGlove = (x, y, z, scale = 1.0) => {
    const hand = new THREE.Mesh(new THREE.CapsuleGeometry(0.038 * scale, 0.065 * scale, 4, 8), gloveMat);
    hand.rotation.x = Math.PI / 2;
    hand.position.set(x, y, z);
    group.add(hand);
  };

  if (weaponId === 'rifle') {
    addBox(0.064, 0.084, 0.34, gunmetal, 0, 0, 0);
    addBox(0.058, 0.066, 0.24, tanPolymer, 0, 0.005, -0.27);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.22, 10), gunmetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.014, -0.46);
    group.add(barrel);
    const supp = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.15, 12), darkPolymer);
    supp.rotation.x = Math.PI / 2;
    supp.position.set(0, 0.014, -0.58);
    group.add(supp);
    addBox(0.04, 0.14, 0.062, darkPolymer, 0, -0.1, -0.04, 0.18, 0, 0);
    addBox(0.042, 0.11, 0.05, tanPolymer, 0, -0.085, 0.11, -0.25, 0, 0);
    addBox(0.05, 0.095, 0.18, tanPolymer, 0, -0.01, 0.25);
    addBox(0.044, 0.044, 0.072, darkPolymer, 0, 0.064, 0.02);
    addBox(0.006, 0.006, 0.006, redDotMat, 0, 0.066, 0.02);
    addGlove(-0.02, -0.045, -0.23);
    addForearm(-0.12, -0.11, -0.06, Math.PI / 2 + 0.25, -0.45);
    attachMuzzleFlash(0, 0.014, -0.68, 0.9);
  } else if (weaponId === 'shotgun') {
    addBox(0.068, 0.086, 0.36, gunmetal, 0, 0, 0);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 10), gunmetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.35);
    group.add(barrel);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.36, 10), darkPolymer);
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0, -0.012, -0.32);
    group.add(tube);
    addBox(0.064, 0.062, 0.19, darkPolymer, 0, -0.018, -0.28);
    addBox(0.052, 0.105, 0.22, darkPolymer, 0, -0.02, 0.24, -0.1, 0, 0);
    addGlove(-0.01, -0.05, -0.26);
    addForearm(-0.11, -0.12, -0.08, Math.PI / 2 + 0.25, -0.42);
    attachMuzzleFlash(0, 0.02, -0.58, 1.35);
  } else if (weaponId === 'sniper') {
    addBox(0.066, 0.088, 0.44, oliveChassis, 0, -0.005, 0.02);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.017, 0.54, 10), gunmetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.018, -0.44);
    group.add(barrel);
    addBox(0.03, 0.036, 0.06, gunmetal, 0, 0.02, -0.71);
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.024, 0.28, 12), darkPolymer);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.085, -0.02);
    group.add(scope);
    addBox(0.022, 0.04, 0.03, gunmetal, 0, 0.055, -0.09);
    addBox(0.022, 0.04, 0.03, gunmetal, 0, 0.055, 0.05);
    addBox(0.052, 0.105, 0.22, oliveChassis, 0, -0.015, 0.28);
    addBox(0.06, 0.014, 0.014, gunmetal, 0.05, 0.02, 0.08);
    addGlove(-0.01, -0.05, -0.22);
    addForearm(-0.11, -0.12, -0.04, Math.PI / 2 + 0.25, -0.45);
    attachMuzzleFlash(0, 0.02, -0.74, 1.5);
  } else if (weaponId === 'pistol') {
    addBox(0.04, 0.046, 0.2, gunmetal, 0, 0.02, -0.04);
    addBox(0.036, 0.032, 0.19, darkPolymer, 0, -0.015, -0.035);
    addBox(0.034, 0.11, 0.05, darkPolymer, 0, -0.07, 0.03, -0.22, 0, 0);
    const supp = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.16, 12), darkPolymer);
    supp.rotation.x = Math.PI / 2;
    supp.position.set(0, 0.02, -0.22);
    group.add(supp);
    addGlove(0, -0.06, 0.03, 0.9);
    addForearm(0.05, -0.13, 0.16, Math.PI / 2 + 0.3, 0.2, 0.038);
    attachMuzzleFlash(0, 0.02, -0.32, 0.65);
  } else if (weaponId === 'grenade') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), oliveChassis);
    group.add(body);
    addBox(0.03, 0.032, 0.03, gunmetal, 0, 0.055, 0);
    addBox(0.014, 0.058, 0.024, tanPolymer, 0.03, 0.034, 0, 0, 0, -0.25);
    addGlove(0, -0.03, 0.02, 0.95);
    addForearm(0.06, -0.12, 0.15, Math.PI / 2 + 0.35, 0.25, 0.04);
  }

  group.userData.muzzleFlash = muzzleFlash;
  return group;
}
