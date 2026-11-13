import * as THREE from 'three';

export function createNameTagSprite(name, colorHex = '#38bdf8') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 52;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(10, 14, 20, 0.78)';
  ctx.beginPath();
  ctx.roundRect(10, 8, 236, 36, 8);
  ctx.fill();
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 20px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((name || 'Operator').slice(0, 14), 128, 27);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.45, 0.3, 1);
  sprite.position.set(0, 2.28, 0);
  return { sprite, tex, mat };
}

export function buildSoldierMesh(entityId, name, color = 0x3b4958, castShadows = true) {
  const root = new THREE.Group();

  const bduMat = new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.1 });
  const rigMat = new THREE.MeshStandardMaterial({ color: 0x1e252e, roughness: 0.65, metalness: 0.2 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.25 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: 0.85, metalness: 0.1 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd6a888, roughness: 0.76 });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.18, metalness: 0.88 });
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x171b21, roughness: 0.38, metalness: 0.74 });
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.92 });

  const hitMeshes = [];
  const tagPart = (mesh, isHead = false) => {
    mesh.userData = { entityType: 'player', playerId: entityId, isHead };
    mesh.castShadow = castShadows;
    hitMeshes.push(mesh);
    return mesh;
  };

  // Articulated Left & Right Legs (pivoted at hip y = 0.84)
  const makeLeg = (xOffset) => {
    const hip = new THREE.Group();
    hip.position.set(xOffset, 0.84, 0);
    const thigh = tagPart(new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.24, 4, 8), bduMat));
    thigh.position.set(0, -0.2, 0);
    const shin = tagPart(new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.085, 0.34, 8), bduMat));
    shin.position.set(0, -0.52, 0);
    const kneepad = new THREE.Mesh(new THREE.SphereGeometry(0.095, 8, 6), rigMat);
    kneepad.position.set(0, -0.37, -0.05);
    const boot = tagPart(new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.12, 4, 8), bootMat));
    boot.rotation.x = Math.PI / 2;
    boot.position.set(0, -0.75, -0.04);
    hip.add(thigh, shin, kneepad, boot);
    return hip;
  };

  const legL = makeLeg(-0.14);
  const legR = makeLeg(0.14);

  // Upper Body Torso Pivot (at waist y = 0.86)
  const upperBody = new THREE.Group();
  upperBody.position.set(0, 0.86, 0);

  // Tactical Belt & Sculpted Torso + Plate Carrier
  const pelvis = tagPart(new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.19, 0.16, 10), rigMat));
  pelvis.position.set(0, 0.04, 0);
  const chest = tagPart(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.48, 10), bduMat));
  chest.scale.set(1.12, 1, 0.72);
  chest.position.set(0, 0.34, 0);
  const carrier = tagPart(new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.21, 0.38, 10), rigMat));
  carrier.scale.set(1.16, 1, 0.82);
  carrier.position.set(0, 0.36, 0);

  // Backpack radio pouch
  const pack = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.3, 8), accentMat);
  pack.scale.set(1.2, 1, 0.75);
  pack.position.set(0, 0.38, 0.17);
  upperBody.add(pelvis, chest, carrier, pack);

  // Head & Ballistic Helmet
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.74, 0);
  const neck = tagPart(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.12, 8), skinMat));
  neck.position.set(0, -0.06, 0);
  const head = tagPart(new THREE.Mesh(new THREE.SphereGeometry(0.155, 10, 8), skinMat), true);
  head.scale.set(0.95, 1.08, 1.02);
  head.position.set(0, 0.06, 0);

  // Curved Helmet Dome + Visor Goggles + Comms Mic
  const helmet = tagPart(new THREE.Mesh(new THREE.SphereGeometry(0.175, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58), rigMat), true);
  helmet.position.set(0, 0.08, 0.01);
  helmet.rotation.x = -0.14;
  const visor = tagPart(new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.08, 10, 1, false, -Math.PI * 0.36, Math.PI * 0.72), visorMat), true);
  visor.position.set(0, 0.08, -0.02);
  visor.rotation.y = Math.PI;
  headGroup.add(neck, head, helmet, visor);
  upperBody.add(headGroup);

  // Articulated Arms + Weapon Pivot
  const armPivot = new THREE.Group();
  armPivot.position.set(0, 0.5, 0);

  const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.095, 8, 8), rigMat);
  shoulderL.position.set(-0.27, 0.02, 0);
  const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.095, 8, 8), rigMat);
  shoulderR.position.set(0.27, 0.02, 0);

  const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.32, 4, 8), bduMat);
  armR.rotation.x = Math.PI / 2 - 0.15;
  armR.position.set(0.26, -0.06, -0.2);

  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.34, 4, 8), bduMat);
  armL.rotation.set(Math.PI / 2 - 0.12, 0, -0.42);
  armL.position.set(-0.14, -0.09, -0.24);

  // Rifle + Barrel + Muzzle Flash
  const rifleBody = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.042, 0.5, 8), gunMat);
  rifleBody.rotation.x = Math.PI / 2;
  rifleBody.position.set(0.14, -0.06, -0.4);
  const rifleBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.34, 8), gunMat);
  rifleBarrel.rotation.x = Math.PI / 2;
  rifleBarrel.position.set(0.14, -0.04, -0.74);

  const muzzleFlash = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 6), flashMat);
  muzzleFlash.rotation.x = -Math.PI / 2;
  muzzleFlash.position.set(0.14, -0.04, -0.96);
  muzzleFlash.visible = false;

  armPivot.add(shoulderL, shoulderR, armR, armL, rifleBody, rifleBarrel, muzzleFlash);
  upperBody.add(armPivot);

  root.add(legL, legR, upperBody);

  const tag = createNameTagSprite(name);
  root.add(tag.sprite);

  return {
    root,
    legL,
    legR,
    upperBody,
    headGroup,
    armPivot,
    muzzleFlash,
    flashTimer: 0,
    walkPhase: Math.random() * Math.PI * 2,
    hitMeshes,
    materials: [bduMat, rigMat, accentMat, bootMat, skinMat, visorMat, gunMat, flashMat, tag.mat],
    tagTex: tag.tex
  };
}

export function animateSoldierModel(model, dt, horizontalSpeed, aimPitch, isMoving) {
  if (!model) return;

  if (model.flashTimer > 0) {
    model.flashTimer -= dt;
    model.muzzleFlash.visible = model.flashTimer > 0;
    model.muzzleFlash.rotation.z += dt * 35;
  } else {
    model.muzzleFlash.visible = false;
  }

  const blend = Math.min(1, dt * 12);
  if (isMoving && horizontalSpeed > 0.35) {
    const cadence = Math.min(14, 6 + horizontalSpeed * 0.95);
    model.walkPhase += dt * cadence;
    const amp = Math.min(0.68, horizontalSpeed * 0.08);
    const swing = Math.sin(model.walkPhase) * amp;
    model.legL.rotation.x += (swing - model.legL.rotation.x) * blend;
    model.legR.rotation.x += (-swing - model.legR.rotation.x) * blend;
    model.upperBody.position.y += (0.86 + Math.abs(Math.cos(model.walkPhase)) * 0.035 - model.upperBody.position.y) * blend;
    model.upperBody.rotation.y += (Math.cos(model.walkPhase) * 0.06 - model.upperBody.rotation.y) * blend;
  } else {
    model.walkPhase += dt * 2.2;
    model.legL.rotation.x += (0 - model.legL.rotation.x) * blend;
    model.legR.rotation.x += (0 - model.legR.rotation.x) * blend;
    model.upperBody.position.y += (0.86 + Math.sin(model.walkPhase) * 0.008 - model.upperBody.position.y) * blend;
    model.upperBody.rotation.y += (0 - model.upperBody.rotation.y) * blend;
  }

  model.armPivot.rotation.x = aimPitch;
  model.headGroup.rotation.x = aimPitch * 0.55;
}
