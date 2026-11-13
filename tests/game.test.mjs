import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveCylinderCollisions,
  resolveCircleCollisionsXZ,
  bounceSphereAgainstColliders
} from '../src/game/Physics.js';
import { resolveEffectiveInputMode } from '../src/game/InputMode.js';
import { getTerrainHeight } from '../src/game/TerrainMath.js';
import { NetSnapshotBuffer, lerpAngle } from '../src/game/NetSnapshotBuffer.js';
import { RecoilSystem } from '../src/game/RecoilSystem.js';

test('resolveCylinderCollisions pushes player out of wall horizontally', () => {
  const colliders = [{ minX: 2, maxX: 4, minY: 0, maxY: 3, minZ: -2, maxZ: 2 }];
  const pos = { x: 1.8, y: 1.7, z: 0 };
  const floorY = resolveCylinderCollisions(pos, 0.45, 1.7, colliders, 0);
  assert.ok(pos.x <= 2 - 0.45 + 1e-6);
  assert.equal(floorY, 0);
});

test('resolveCylinderCollisions respects hilly terrainHeightFn floor', () => {
  const pos = { x: 18, y: 4.5, z: -16 };
  const floorY = resolveCylinderCollisions(pos, 0.45, 1.7, [], (x, z) => getTerrainHeight('desert', x, z));
  assert.ok(floorY > 0);
});

test('resolveCylinderCollisions lets player stand atop stepable platform', () => {
  const colliders = [{ minX: -2, maxX: 2, minY: 0, maxY: 1.4, minZ: -2, maxZ: 2 }];
  const pos = { x: 0, y: 3.1, z: 0 };
  const floorY = resolveCylinderCollisions(pos, 0.45, 1.7, colliders, 0);
  assert.equal(floorY, 1.4);
  assert.equal(pos.x, 0);
});

test('resolveCircleCollisionsXZ keeps tank outside walls', () => {
  const colliders = [{ minX: -1, maxX: 1, minY: 0, maxY: 3, minZ: -1, maxZ: 1 }];
  const tankPos = { x: 1.5, z: 0 };
  resolveCircleCollisionsXZ(tankPos, 2.5, colliders);
  assert.ok(tankPos.x >= 3.5 - 1e-6);
});

test('bounceSphereAgainstColliders bounces grenade off ground and wall', () => {
  const colliders = [{ minX: 1, maxX: 3, minY: 0, maxY: 3, minZ: -2, maxZ: 2 }];
  const pos = { x: 0.9, y: 0.1, z: 0 };
  const vel = { x: 5, y: -4, z: 0 };
  const bounced = bounceSphereAgainstColliders(pos, vel, 0.16, colliders, 0.5);
  assert.equal(bounced, true);
  assert.ok(vel.y > 0);
  assert.ok(vel.x < 0);
});

test('resolveEffectiveInputMode handles desktop, iPad keyboard+touch, and prevents synthetic Safari mouse takeover', () => {
  assert.equal(resolveEffectiveInputMode({ hasTouch: false, now: 1000 }), 'desktop');
  assert.equal(resolveEffectiveInputMode({ hasTouch: true, pointerLocked: true, now: 1000 }), 'desktop');
  assert.equal(
    resolveEffectiveInputMode({
      hasTouch: true,
      keysHeldCount: 1,
      lastKeyboardAt: 900,
      lastTouchAt: 950,
      now: 1000
    }),
    'hybrid'
  );
  // Synthetic Safari mouse event 200ms after touch must NOT hide touch controls
  assert.equal(
    resolveEffectiveInputMode({
      hasTouch: true,
      lastTouchAt: 800,
      lastMouseAt: 980,
      now: 1000
    }),
    'touch'
  );
  // Genuine mouse activity >1200ms after touch switches back to desktop
  assert.equal(
    resolveEffectiveInputMode({
      hasTouch: true,
      lastTouchAt: 500,
      lastMouseAt: 2200,
      now: 2500
    }),
    'desktop'
  );
});

test('getTerrainHeight produces flat harbor dock and undulating hills on desert and snow', () => {
  assert.equal(getTerrainHeight('harbor', 20, 20), 0);
  const desertHeights = [getTerrainHeight('desert', 20, -18), getTerrainHeight('desert', -25, 22)];
  const snowHeights = [getTerrainHeight('snow', 20, 20), getTerrainHeight('snow', -22, -24)];
  assert.ok(desertHeights.some((h) => h > 0.5));
  assert.ok(snowHeights.some((h) => h > 0.5));
});

test('NetSnapshotBuffer interpolates smoothly without overshooting or teleporting', () => {
  const buf = new NetSnapshotBuffer(100);
  buf.push({ t: 1000, x: 0, y: 0, z: 0, vx: 10, vz: 0, yaw: -Math.PI + 0.1, pitch: 0 });
  buf.push({ t: 1100, x: 10, y: 0, z: 0, vx: 10, vz: 0, yaw: Math.PI - 0.1, pitch: 0.2 });

  // Render at 1150ms -> targetTime = 1050ms -> exact midpoint between 1000 and 1100
  const mid = buf.sample(1150);
  assert.ok(Math.abs(mid.x - 5) < 1e-6);
  assert.ok(Math.abs(mid.pitch - 0.1) < 1e-6);
  // Shortest-arc angle wraparound stays near PI/-PI instead of wrapping through 0
  assert.ok(Math.abs(Math.abs(mid.yaw) - Math.PI) < 0.05);

  // Far ahead renderTime caps damped extrapolation at 65ms lead so strafes don't teleport
  const capped = buf.sample(1600);
  assert.ok(capped.x > 10 && capped.x < 10.5);
});

test('RecoilSystem returns 100% back to origin after firing stops and supports downward control', () => {
  const recoil = new RecoilSystem();
  recoil.addKick(0.06, 0.02);
  assert.ok(recoil.pitchOffset > 0.05);

  // Manual downward pull counteracts active recoil first without pushing base pitch below origin
  const leftover = recoil.absorbManualAimDelta(-0.02);
  assert.equal(leftover, 0);
  assert.ok(Math.abs(recoil.pitchOffset - 0.04) < 1e-6);

  // After stopping fire, simulate ~1 second of frames -> offset decays cleanly back to exact 0
  for (let i = 0; i < 60; i++) {
    recoil.update(1 / 60, false);
  }
  assert.equal(recoil.pitchOffset, 0);
  assert.equal(recoil.yawOffset, 0);
  assert.equal(recoil.cameraPunch, 0);
  assert.ok(Math.abs(lerpAngle(0, 0, 1)) === 0);
});
