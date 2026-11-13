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
    spreadHip: 0.018,
    spreadAds: 0.004,
    recoilPitch: 0.022,
    recoilYaw: 0.009,
    adsFov: 54,
    range: 160,
    hipPos: [0.23, -0.22, -0.44],
    adsPos: [0.0, -0.145, -0.34]
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
    spreadHip: 0.068,
    spreadAds: 0.048,
    recoilPitch: 0.055,
    recoilYaw: 0.018,
    adsFov: 60,
    range: 55,
    hipPos: [0.24, -0.23, -0.45],
    adsPos: [0.0, -0.155, -0.36]
  },
  {
    id: 'sniper',
    slot: 2,
    name: 'AWP TACTICAL',
    shortName: 'AWP',
    type: 'semi',
    damage: 90,
    headshotMult: 2.0,
    fireRateMs: 1150,
    reloadMs: 2100,
    magSize: 5,
    reserveMax: 20,
    pellets: 1,
    spreadHip: 0.065,
    spreadAds: 0.0006,
    recoilPitch: 0.075,
    recoilYaw: 0.015,
    adsFov: 22,
    isScope: true,
    range: 240,
    hipPos: [0.25, -0.24, -0.48],
    adsPos: [0.0, -0.15, -0.3]
  },
  {
    id: 'pistol',
    slot: 3,
    name: 'USP-S SIDEARM',
    shortName: 'USP-S',
    type: 'semi',
    damage: 24,
    headshotMult: 2.25,
    fireRateMs: 165,
    reloadMs: 1200,
    magSize: 12,
    reserveMax: 48,
    pellets: 1,
    spreadHip: 0.012,
    spreadAds: 0.003,
    recoilPitch: 0.018,
    recoilYaw: 0.006,
    adsFov: 60,
    range: 110,
    hipPos: [0.21, -0.21, -0.38],
    adsPos: [0.0, -0.135, -0.32]
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
    hipPos: [0.22, -0.22, -0.38],
    adsPos: [0.15, -0.18, -0.34]
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

  const gunmetal = new THREE.MeshStandardMaterial({ color: 0x202630, roughness: 0.36, metalness: 0.78 });
  const darkPolymer = new THREE.MeshStandardMaterial({ color: 0x16191f, roughness: 0.72, metalness: 0.15 });
  const tanPolymer = new THREE.MeshStandardMaterial({ color: 0x9e835c, roughness: 0.65, metalness: 0.1 });
  const oliveChassis = new THREE.MeshStandardMaterial({ color: 0x4b5d43, roughness: 0.62, metalness: 0.22 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0x26292e, roughness: 0.85, metalness: 0.05 });
  const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x3b444b, roughness: 0.88, metalness: 0.05 });
  const redDotMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });

  const addBox = (w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    group.add(m);
    return m;
  };

  if (weaponId === 'rifle') {
    // Receiver & handguard
    addBox(0.068, 0.088, 0.34, gunmetal, 0, 0, 0);
    addBox(0.062, 0.07, 0.24, tanPolymer, 0, 0.005, -0.27);
    // Barrel + tactical suppressor
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.22, 10), gunmetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.014, -0.46);
    group.add(barrel);
    const supp = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.15, 12), darkPolymer);
    supp.rotation.x = Math.PI / 2;
    supp.position.set(0, 0.014, -0.58);
    group.add(supp);
    // Magazine + grip + stock
    addBox(0.042, 0.14, 0.065, darkPolymer, 0, -0.1, -0.04, 0.18, 0, 0);
    addBox(0.044, 0.11, 0.052, tanPolymer, 0, -0.085, 0.11, -0.25, 0, 0);
    addBox(0.052, 0.1, 0.18, tanPolymer, 0, -0.01, 0.25);
    // Holo sight housing + glowing dot
    addBox(0.046, 0.046, 0.075, darkPolymer, 0, 0.066, 0.02);
    addBox(0.006, 0.006, 0.006, redDotMat, 0, 0.068, 0.02);
    // Tactical gloved hand & forearm
    addBox(0.078, 0.068, 0.11, gloveMat, -0.02, -0.045, -0.23);
    addBox(0.082, 0.082, 0.24, sleeveMat, -0.12, -0.11, -0.06, 0.25, -0.45, 0);
  } else if (weaponId === 'shotgun') {
    addBox(0.072, 0.09, 0.36, gunmetal, 0, 0, 0);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 10), gunmetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.35);
    group.add(barrel);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.36, 10), darkPolymer);
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0, -0.012, -0.32);
    group.add(tube);
    // Pump forend
    addBox(0.068, 0.064, 0.19, darkPolymer, 0, -0.018, -0.28);
    addBox(0.055, 0.11, 0.22, darkPolymer, 0, -0.02, 0.24, -0.1, 0, 0);
    addBox(0.08, 0.068, 0.11, gloveMat, -0.01, -0.05, -0.26);
    addBox(0.082, 0.082, 0.24, sleeveMat, -0.11, -0.12, -0.08, 0.25, -0.42, 0);
  } else if (weaponId === 'sniper') {
    addBox(0.068, 0.092, 0.44, oliveChassis, 0, -0.005, 0.02);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.017, 0.54, 10), gunmetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.018, -0.44);
    group.add(barrel);
    addBox(0.03, 0.036, 0.06, gunmetal, 0, 0.02, -0.71);
    // Elevated scope
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.024, 0.28, 12), darkPolymer);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.085, -0.02);
    group.add(scope);
    addBox(0.024, 0.04, 0.03, gunmetal, 0, 0.055, -0.09);
    addBox(0.024, 0.04, 0.03, gunmetal, 0, 0.055, 0.05);
    // Thumbhole stock + bolt handle
    addBox(0.055, 0.11, 0.22, oliveChassis, 0, -0.015, 0.28);
    addBox(0.06, 0.014, 0.014, gunmetal, 0.05, 0.02, 0.08);
    addBox(0.075, 0.065, 0.1, gloveMat, -0.01, -0.05, -0.22);
    addBox(0.08, 0.08, 0.22, sleeveMat, -0.11, -0.12, -0.04, 0.25, -0.45, 0);
  } else if (weaponId === 'pistol') {
    addBox(0.042, 0.048, 0.2, gunmetal, 0, 0.02, -0.04);
    addBox(0.038, 0.034, 0.19, darkPolymer, 0, -0.015, -0.035);
    addBox(0.036, 0.11, 0.052, darkPolymer, 0, -0.07, 0.03, -0.22, 0, 0);
    const supp = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.16, 12), darkPolymer);
    supp.rotation.x = Math.PI / 2;
    supp.position.set(0, 0.02, -0.22);
    group.add(supp);
    addBox(0.052, 0.075, 0.08, gloveMat, 0, -0.065, 0.03);
    addBox(0.066, 0.066, 0.2, sleeveMat, 0.05, -0.13, 0.16, 0.3, 0.2, 0);
  } else if (weaponId === 'grenade') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), oliveChassis);
    group.add(body);
    addBox(0.032, 0.035, 0.032, gunmetal, 0, 0.056, 0);
    addBox(0.016, 0.06, 0.026, tanPolymer, 0.032, 0.035, 0, 0, 0, -0.25);
    addBox(0.072, 0.065, 0.085, gloveMat, 0, -0.03, 0.02);
    addBox(0.075, 0.075, 0.22, sleeveMat, 0.06, -0.12, 0.15, 0.35, 0.25, 0);
  }

  return group;
}
