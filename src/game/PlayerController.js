import * as THREE from 'three';
import { resolveCylinderCollisions } from './Physics.js';
import { resolveEffectiveInputMode } from './InputMode.js';

export class PlayerController {
  constructor(camera, domElement, onInputModeChange) {
    this.camera = camera;
    this.domElement = domElement;
    this.onInputModeChange = onInputModeChange;

    this.pos = new THREE.Vector3(0, 1.7, 0);
    this.velY = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = true;

    this.keys = new Set();
    this.mouseFire = false;
    this.mouseAds = false;

    this.touchMove = { x: 0, y: 0 };
    this.touchFire = false;
    this.touchAds = false;
    this.touchJumpQueued = false;

    this.sensitivity = 1.0;
    this.overrideMode = 'auto';
    this.hasTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    this.pointerLocked = false;
    this.lastKeyboardAt = 0;
    this.lastMouseAt = 0;
    this.lastTouchAt = 0;
    this.currentMode = this.hasTouch ? 'touch' : 'desktop';

    this.isActive = false;
    this.onWeaponSwitch = null;
    this.onReload = null;
    this.onQuickGrenade = null;
    this.onInteractTank = null;
    this.onScoreboardToggle = null;
    this.onPause = null;

    this._bindEvents();
  }

  setActive(active) {
    this.isActive = active;
    if (!active) {
      this.keys.clear();
      this.mouseFire = false;
      this.mouseAds = false;
      this.touchFire = false;
      this.touchAds = false;
      this.touchMove = { x: 0, y: 0 };
      if (document.pointerLockElement === this.domElement) {
        document.exitPointerLock?.();
      }
    }
  }

  requestPointerLock() {
    if (!this.isActive) return;
    if (this.currentMode !== 'desktop') return;
    if (document.pointerLockElement !== this.domElement) {
      this.domElement.requestPointerLock?.();
    }
  }

  setOverrideMode(mode) {
    this.overrideMode = mode;
    this._refreshInputMode(true);
  }

  setSensitivity(val) {
    this.sensitivity = val;
  }

  _refreshInputMode(force = false) {
    const next = resolveEffectiveInputMode({
      overrideMode: this.overrideMode,
      hasTouch: this.hasTouch,
      pointerLocked: this.pointerLocked,
      lastKeyboardAt: this.lastKeyboardAt,
      lastMouseAt: this.lastMouseAt,
      lastTouchAt: this.lastTouchAt,
      now: performance.now()
    });
    if (force || next !== this.currentMode) {
      this.currentMode = next;
      this.onInputModeChange?.(next);
    }
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (!this.isActive) return;
      if (e.code === 'Escape') {
        this.onPause?.();
        return;
      }
      if (e.code === 'Tab') {
        e.preventDefault();
        this.onScoreboardToggle?.(true);
        return;
      }

      this.lastKeyboardAt = performance.now();
      this._refreshInputMode();

      this.keys.add(e.code);
      if (e.code === 'Digit1') this.onWeaponSwitch?.(0);
      else if (e.code === 'Digit2') this.onWeaponSwitch?.(1);
      else if (e.code === 'Digit3') this.onWeaponSwitch?.(2);
      else if (e.code === 'Digit4') this.onWeaponSwitch?.(3);
      else if (e.code === 'Digit5') this.onWeaponSwitch?.(4);
      else if (e.code === 'KeyR') this.onReload?.();
      else if (e.code === 'KeyG') this.onQuickGrenade?.();
      else if (e.code === 'KeyE') this.onInteractTank?.();
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Tab') {
        this.onScoreboardToggle?.(false);
      }
      this.keys.delete(e.code);
    });

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.domElement;
      if (this.pointerLocked) {
        this.lastMouseAt = performance.now();
      }
      this._refreshInputMode(true);
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isActive) return;
      // Ignore synthetic mouse events from touch taps
      if (e.sourceCapabilities?.firesTouchEvents) return;
      if (Math.abs(e.movementX) > 0 || Math.abs(e.movementY) > 0) {
        this.lastMouseAt = performance.now();
        this._refreshInputMode();
      }
      if (this.pointerLocked) {
        const scale = 0.0021 * this.sensitivity;
        this.yaw -= e.movementX * scale;
        this.pitch -= e.movementY * scale;
        this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
      }
    });

    this.domElement.addEventListener('mousedown', (e) => {
      if (!this.isActive) return;
      if (this.currentMode === 'desktop' && !this.pointerLocked) {
        this.requestPointerLock();
        return;
      }
      if (e.button === 0) this.mouseFire = true;
      if (e.button === 2) this.mouseAds = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseFire = false;
      if (e.button === 2) this.mouseAds = false;
    });

    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch bindings on HUD overlay zones
    const moveZone = document.getElementById('touch-move-zone');
    const aimZone = document.getElementById('touch-aim-zone');
    const knob = document.getElementById('joystick-knob');
    const base = document.getElementById('joystick-base');

    let moveTouchId = null;
    let moveOrigin = { x: 0, y: 0 };

    if (moveZone && knob && base) {
      moveZone.addEventListener('touchstart', (e) => {
        if (!this.isActive || moveTouchId !== null) return;
        const t = e.changedTouches[0];
        moveTouchId = t.identifier;
        const rect = base.getBoundingClientRect();
        moveOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        this.lastTouchAt = performance.now();
        this._refreshInputMode();
      }, { passive: false });

      moveZone.addEventListener('touchmove', (e) => {
        if (moveTouchId === null) return;
        for (const t of e.changedTouches) {
          if (t.identifier === moveTouchId) {
            e.preventDefault();
            const maxR = 44;
            const dx = t.clientX - moveOrigin.x;
            const dy = t.clientY - moveOrigin.y;
            const dist = Math.hypot(dx, dy);
            const clamped = Math.min(dist, maxR);
            const angle = Math.atan2(dy, dx);
            const kx = Math.cos(angle) * clamped;
            const ky = Math.sin(angle) * clamped;
            knob.style.transform = `translate(${kx}px, ${ky}px)`;
            this.touchMove.x = kx / maxR;
            this.touchMove.y = ky / maxR;
          }
        }
      }, { passive: false });

      const endMove = (e) => {
        for (const t of e.changedTouches) {
          if (t.identifier === moveTouchId) {
            moveTouchId = null;
            this.touchMove.x = 0;
            this.touchMove.y = 0;
            knob.style.transform = 'translate(0px, 0px)';
          }
        }
      };
      moveZone.addEventListener('touchend', endMove);
      moveZone.addEventListener('touchcancel', endMove);
    }

    let aimTouchId = null;
    let lastAimPos = { x: 0, y: 0 };
    if (aimZone) {
      aimZone.addEventListener('touchstart', (e) => {
        if (!this.isActive || aimTouchId !== null) return;
        const t = e.changedTouches[0];
        aimTouchId = t.identifier;
        lastAimPos = { x: t.clientX, y: t.clientY };
        this.lastTouchAt = performance.now();
        this._refreshInputMode();
      }, { passive: false });

      aimZone.addEventListener('touchmove', (e) => {
        if (aimTouchId === null) return;
        for (const t of e.changedTouches) {
          if (t.identifier === aimTouchId) {
            e.preventDefault();
            const dx = t.clientX - lastAimPos.x;
            const dy = t.clientY - lastAimPos.y;
            lastAimPos = { x: t.clientX, y: t.clientY };
            const scale = 0.0042 * this.sensitivity;
            this.yaw -= dx * scale;
            this.pitch -= dy * scale;
            this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
          }
        }
      }, { passive: false });

      const endAim = (e) => {
        for (const t of e.changedTouches) {
          if (t.identifier === aimTouchId) {
            aimTouchId = null;
          }
        }
      };
      aimZone.addEventListener('touchend', endAim);
      aimZone.addEventListener('touchcancel', endAim);
    }

    const bindTouchBtn = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.lastTouchAt = performance.now();
        this._refreshInputMode();
        onDown?.();
      }, { passive: false });
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onUp?.();
      }, { passive: false });
      el.addEventListener('touchcancel', () => onUp?.());
    };

    bindTouchBtn('t-btn-fire', () => { this.touchFire = true; }, () => { this.touchFire = false; });
    bindTouchBtn('t-btn-ads', () => { this.touchAds = !this.touchAds; }, null);
    bindTouchBtn('t-btn-jump', () => { this.touchJumpQueued = true; }, null);
    bindTouchBtn('t-btn-reload', () => { this.onReload?.(); }, null);
    bindTouchBtn('t-btn-grenade', () => { this.onQuickGrenade?.(); }, null);
    bindTouchBtn('t-btn-tank', () => { this.onInteractTank?.(); }, null);
  }

  getMovementAxes() {
    let forward = 0;
    let strafe = 0;
    if (this.keys.has('KeyW')) forward += 1;
    if (this.keys.has('KeyS')) forward -= 1;
    if (this.keys.has('KeyD')) strafe += 1;
    if (this.keys.has('KeyA')) strafe -= 1;

    forward -= this.touchMove.y;
    strafe += this.touchMove.x;

    const len = Math.hypot(forward, strafe);
    if (len > 1) {
      forward /= len;
      strafe /= len;
    }
    return { forward, strafe };
  }

  isFiring() {
    return this.mouseFire || this.touchFire;
  }

  isAds() {
    return this.mouseAds || this.touchAds;
  }

  updateOnFoot(dt, colliders, isAds) {
    // Optional arrow-key aim fallback for keyboard-only play
    const arrowSpeed = 2.2 * this.sensitivity;
    if (this.keys.has('ArrowLeft')) this.yaw += arrowSpeed * dt;
    if (this.keys.has('ArrowRight')) this.yaw -= arrowSpeed * dt;
    if (this.keys.has('ArrowUp')) this.pitch = Math.min(1.45, this.pitch + arrowSpeed * 0.7 * dt);
    if (this.keys.has('ArrowDown')) this.pitch = Math.max(-1.45, this.pitch - arrowSpeed * 0.7 * dt);

    const { forward, strafe } = this.getMovementAxes();
    const sprinting = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) && !isAds && forward > 0.2;
    const speed = isAds ? 4.8 : sprinting ? 10.6 : 7.8;

    const fwdX = -Math.sin(this.yaw);
    const fwdZ = -Math.cos(this.yaw);
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);

    this.pos.x += (fwdX * forward + rightX * strafe) * speed * dt;
    this.pos.z += (fwdZ * forward + rightZ * strafe) * speed * dt;

    if ((this.keys.has('Space') || this.touchJumpQueued) && this.onGround) {
      this.velY = 8.4;
      this.onGround = false;
    }
    this.touchJumpQueued = false;

    this.velY -= 22.0 * dt;
    this.pos.y += this.velY * dt;

    const floorY = resolveCylinderCollisions(this.pos, 0.44, 1.7, colliders, 0);
    if (this.pos.y - 1.7 <= floorY) {
      this.pos.y = floorY + 1.7;
      this.velY = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    return Math.hypot(forward, strafe);
  }
}
