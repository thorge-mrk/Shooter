import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveCylinderCollisions,
  resolveCircleCollisionsXZ,
  bounceSphereAgainstColliders
} from '../src/game/Physics.js';
import { resolveEffectiveInputMode } from '../src/game/InputMode.js';

test('resolveCylinderCollisions pushes player out of wall horizontally', () => {
  const colliders = [{ minX: 2, maxX: 4, minY: 0, maxY: 3, minZ: -2, maxZ: 2 }];
  const pos = { x: 1.8, y: 1.7, z: 0 };
  const floorY = resolveCylinderCollisions(pos, 0.45, 1.7, colliders, 0);
  assert.ok(pos.x <= 2 - 0.45 + 1e-6);
  assert.equal(floorY, 0);
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

test('resolveEffectiveInputMode handles desktop, iPad keyboard+touch, and touch-only', () => {
  assert.equal(
    resolveEffectiveInputMode({ hasTouch: false, now: 1000 }),
    'desktop'
  );
  assert.equal(
    resolveEffectiveInputMode({ hasTouch: true, pointerLocked: true, now: 1000 }),
    'desktop'
  );
  assert.equal(
    resolveEffectiveInputMode({
      hasTouch: true,
      pointerLocked: false,
      lastKeyboardAt: 900,
      lastTouchAt: 950,
      now: 1000
    }),
    'hybrid'
  );
  assert.equal(
    resolveEffectiveInputMode({
      hasTouch: true,
      pointerLocked: false,
      lastKeyboardAt: 0,
      lastTouchAt: 950,
      now: 1000
    }),
    'touch'
  );
  assert.equal(
    resolveEffectiveInputMode({
      hasTouch: true,
      lastMouseAt: 980,
      lastTouchAt: 500,
      now: 1000
    }),
    'desktop'
  );
});
