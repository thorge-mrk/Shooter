import * as THREE from 'three';

export function createNameTagSprite(name, colorHex = '#38bdf8') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 56;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(10, 14, 20, 0.72)';
  ctx.fillRect(8, 8, 240, 40);
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, 240, 40);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((name || 'Operator').slice(0, 14), 128, 29);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.5, 0.34, 1);
  sprite.position.set(0, 2.25, 0);
  return { sprite, tex, mat };
}

export function buildSoldierMesh(entityId, name, color = 0x3b4958, castShadows = true) {
  const root = new THREE.Group();

  const armorMat = new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.15 });
  const vestMat = new THREE.MeshStandardMaterial({ color: 0x1e242c, roughness: 0.8, metalness: 0.12 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd1a384, roughness: 0.78 });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25, metalness: 0.8 });
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x181c22, roughness: 0.4, metalness: 0.7 });

  const hitMeshes = [];

  const tagPart = (mesh, isHead = false) => {
    mesh.userData = { entityType: 'player', playerId: entityId, isHead };
    mesh.castShadow = castShadows;
    hitMeshes.push(mesh);
    return mesh;
  };

  // Legs
  const legL = tagPart(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.78, 0.26), armorMat));
  legL.position.set(-0.15, 0.39, 0);
  const legR = tagPart(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.78, 0.26), armorMat));
  legR.position.set(0.15, 0.39, 0);

  // Torso & tactical vest
  const torso = tagPart(new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.68, 0.32), vestMat));
  torso.position.set(0, 1.12, 0);

  // Head + tactical helmet + visor (for headshots!)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.66, 0);
  const head = tagPart(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.32), skinMat), true);
  const helmet = tagPart(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.37), vestMat), true);
  helmet.position.set(0, 0.13, 0);
  const visor = tagPart(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.06), visorMat), true);
  visor.position.set(0, 0.04, -0.17);
  headGroup.add(head, helmet, visor);

  // Arms + third-person gun
  const armPivot = new THREE.Group();
  armPivot.position.set(0, 1.32, 0);

  const armR = tagPart(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.5), armorMat));
  armR.position.set(0.34, -0.05, -0.2);
  const armL = tagPart(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.45), armorMat));
  armL.position.set(-0.28, -0.08, -0.22);
  armL.rotation.y = -0.35;

  const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.65), gunMat);
  rifle.position.set(0.22, -0.05, -0.45);
  armPivot.add(armR, armL, rifle);

  root.add(legL, legR, torso, headGroup, armPivot);

  const tag = createNameTagSprite(name);
  root.add(tag.sprite);

  return {
    root,
    headGroup,
    armPivot,
    hitMeshes,
    materials: [armorMat, vestMat, skinMat, visorMat, gunMat, tag.mat],
    tagTex: tag.tex
  };
}
