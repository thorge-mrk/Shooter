import * as THREE from 'three';
import { TextureLibrary } from './Textures.js';
import { buildArenaMap, MAP_CONFIGS } from './MapBuilder.js';
import { createWeaponInventory, buildViewmodelMesh } from './Weapons.js';
import { ParticleSystem } from './Particles.js';
import { TankSystem, TANK_CANNON_COOLDOWN_MS } from './TankSystem.js';
import { GrenadeSystem } from './GrenadeSystem.js';
import { RemotePlayerManager } from './RemotePlayers.js';
import { BotManager } from './BotAI.js';
import { PlayerController } from './PlayerController.js';

export class GameEngine {
  constructor({ container, soundEngine, network, ui }) {
    this.container = container;
    this.sound = soundEngine;
    this.network = network;
    this.ui = ui;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(78, window.innerWidth / window.innerHeight, 0.08, 320);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.textures = new TextureLibrary();
    this.particles = new ParticleSystem(this.scene);
    this.tanks = new TankSystem(this.scene, this.textures, true);
    this.grenades = new GrenadeSystem(this.scene, this.sound);
    this.remotes = new RemotePlayerManager(this.scene, true);
    this.bots = new BotManager(this.scene, true);
    this.controller = new PlayerController(this.camera, this.renderer.domElement, (mode) => {
      this.ui.applyInputMode(mode, this.controller.pointerLocked);
    });

    this.raycaster = new THREE.Raycaster();
    this.viewmodelRoot = new THREE.Group();
    this.camera.add(this.viewmodelRoot);
    this.viewmodels = {};
    this._initViewmodels();

    // Settings & Performance state
    this.quality = 'balanced';
    this.autoFps = true;
    this.fps = 60;
    this.frameCount = 0;
    this.fpsAccum = 0;
    this.currentPixelRatio = 1.25;
    this.lowFpsStreak = 0;

    // Match state
    this.isRunning = false;
    this.isPaused = false;
    this.mode = 'practice'; // 'practice' | 'multiplayer'
    this.mapData = null;
    this.mapId = 'compound';
    this.killLimit = 15;
    this.durationSec = 180;
    this.matchStartAt = 0;
    this.roundEnded = false;

    // Local Player state
    this.localId = 'local';
    this.localName = 'Operator';
    this.hp = 100;
    this.alive = true;
    this.respawnAt = 0;
    this.killerName = '';
    this.kills = 0;
    this.deaths = 0;
    this.inTankId = -1;

    // Weapon state
    this.inventory = createWeaponInventory();
    this.activeSlot = 0;
    this.lastShotAt = 0;
    this.reloading = false;
    this.reloadEndAt = 0;
    this.recoilOffset = 0;
    this.walkBobPhase = 0;
    this.prevTrigger = false;

    // Multiplayer scoreboard cache
    this.mpPlayers = {};
    this.scoreboardHeld = false;

    this._bindControllerCallbacks();
    this._applyQualitySettings();
    window.addEventListener('resize', () => this._onResize());
    this._onResize();

    this.lastFrameTime = performance.now();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _initViewmodels() {
    for (const id of ['rifle', 'shotgun', 'sniper', 'pistol', 'grenade']) {
      const vm = buildViewmodelMesh(id);
      vm.visible = false;
      this.viewmodelRoot.add(vm);
      this.viewmodels[id] = vm;
    }
  }

  _bindControllerCallbacks() {
    this.controller.onWeaponSwitch = (slot) => this.switchWeapon(slot);
    this.controller.onReload = () => this.startReload();
    this.controller.onQuickGrenade = () => this.throwQuickGrenade();
    this.controller.onInteractTank = () => this.toggleTank();
    this.controller.onScoreboardToggle = (held) => {
      if (!this.isRunning || this.roundEnded) return;
      this.scoreboardHeld = held;
      if (held) this._refreshScoreboard(false);
      this.ui.setScoreboardVisible(held);
    };
    this.controller.onPause = () => {
      if (!this.isRunning) return;
      this.setPaused(!this.isPaused);
    };
  }

  setQuality(quality, autoFps) {
    this.quality = quality;
    this.autoFps = autoFps;
    this._applyQualitySettings();
  }

  _applyQualitySettings() {
    const dpr = window.devicePixelRatio || 1;
    if (this.quality === 'high') {
      this.currentPixelRatio = Math.min(dpr, 2.0);
      this.renderer.shadowMap.enabled = true;
    } else if (this.quality === 'balanced') {
      this.currentPixelRatio = Math.min(dpr, 1.35);
      this.renderer.shadowMap.enabled = true;
    } else {
      this.currentPixelRatio = 1.0;
      this.renderer.shadowMap.enabled = false;
    }
    this.renderer.setPixelRatio(this.currentPixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  startPracticeMatch({ mapId = 'compound', botCount = 3, killLimit = 15, playerName = 'Operator' }) {
    this._teardownMatch();
    this.mode = 'practice';
    this.mapId = mapId;
    this.killLimit = killLimit;
    this.durationSec = 180;
    this.localId = 'local';
    this.localName = playerName || 'Operator';

    this._loadArena(mapId);
    this.bots.spawnBots(botCount, this.mapData.config.spawns);
    this._spawnLocalPlayer(0);

    this.matchStartAt = Date.now();
    this.roundEnded = false;
    this.isRunning = true;
    this.isPaused = false;
    this.controller.setActive(true);
    this.ui.showHud();
    this.ui.applyInputMode(this.controller.currentMode, this.controller.pointerLocked);
  }

  startMultiplayerMatch(room, localUser) {
    this._teardownMatch();
    this.mode = 'multiplayer';
    this.mapId = room.mapId || 'compound';
    this.killLimit = room.killLimit || 15;
    this.durationSec = room.durationSec || 180;
    this.localId = localUser.uid;
    this.localName = localUser.displayName || 'Operator';

    this._loadArena(this.mapId);
    const uids = Object.keys(room.players || {}).sort();
    const spawnIdx = Math.max(0, uids.indexOf(this.localId));
    this._spawnLocalPlayer(spawnIdx);

    this.matchStartAt = room.roundStartAt || Date.now();
    this.roundEnded = false;
    this.isRunning = true;
    this.isPaused = false;
    this.controller.setActive(true);
    this.ui.showHud();
    this.ui.applyInputMode(this.controller.currentMode, this.controller.pointerLocked);
  }

  _loadArena(mapId) {
    this.mapData = buildArenaMap(this.scene, this.textures, mapId, this.quality);
    this.tanks.spawnTanks(this.mapData.config.tankPads);
  }

  _spawnLocalPlayer(spawnIndex) {
    const spawns = this.mapData.config.spawns;
    const sp = spawns[spawnIndex % spawns.length];
    this.controller.pos.set(sp.x, sp.y, sp.z);
    this.controller.velY = 0;
    this.controller.yaw = sp.yaw || 0;
    this.controller.pitch = 0;
    this.hp = 100;
    this.alive = true;
    this.inTankId = -1;
    this.inventory = createWeaponInventory();
    this.activeSlot = 0;
    this.reloading = false;
    this.ui.showEliminated(false);
    this._updateViewmodelVisibility();
  }

  setPaused(paused) {
    this.isPaused = paused;
    this.controller.setActive(!paused && !this.roundEnded);
    if (paused) {
      this.ui.openSettings(true);
    } else {
      this.ui.closeSettings();
    }
  }

  quitMatch() {
    this._teardownMatch();
    this.ui.closeSettings();
    this.ui.showMenu();
  }

  _teardownMatch() {
    this.isRunning = false;
    this.isPaused = false;
    this.controller.setActive(false);
    if (this.mapData) {
      this.mapData.dispose();
      this.mapData = null;
    }
    this.tanks.clear();
    this.grenades.clear();
    this.particles.dispose();
    this.particles = new ParticleSystem(this.scene);
    this.remotes.clear();
    this.bots.clear();
    this.kills = 0;
    this.deaths = 0;
    this.mpPlayers = {};
    this._updateViewmodelVisibility();
  }

  switchWeapon(slot) {
    if (!this.isRunning || !this.alive || this.inTankId >= 0) return;
    if (slot < 0 || slot >= this.inventory.length) return;
    this.activeSlot = slot;
    this.reloading = false;
    this.controller.touchAds = false;
    this._updateViewmodelVisibility();
  }

  _updateViewmodelVisibility() {
    const show = this.isRunning && this.alive && this.inTankId < 0;
    const activeId = this.inventory[this.activeSlot]?.spec.id;
    for (const [id, mesh] of Object.entries(this.viewmodels)) {
      mesh.visible = show && id === activeId;
    }
  }

  startReload() {
    if (!this.isRunning || !this.alive || this.inTankId >= 0) return;
    const w = this.inventory[this.activeSlot];
    if (!w || w.spec.type === 'grenade' || this.reloading) return;
    if (w.mag >= w.spec.magSize || w.reserve <= 0) return;
    this.reloading = true;
    this.reloadEndAt = performance.now() + w.spec.reloadMs;
    this.sound.playReload();
  }

  throwQuickGrenade() {
    if (!this.isRunning || !this.alive || this.inTankId >= 0) return;
    const fragSlot = this.inventory[4];
    if (!fragSlot || fragSlot.mag <= 0) return;
    const now = performance.now();
    if (now - this.lastShotAt < 450) return;
    this.lastShotAt = now;
    fragSlot.mag -= 1;

    const dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(this.controller.pitch, this.controller.yaw, 0, 'YXZ')).normalize();
    const origin = this.controller.pos.clone().addScaledVector(dir, 0.7);
    this.grenades.throwGrenade(origin, dir, this.localId, true);

    if (this.mode === 'multiplayer') {
      this.network.sendEvent({
        type: 'grenade',
        ox: origin.x, oy: origin.y, oz: origin.z,
        dx: dir.x, dy: dir.y, dz: dir.z
      });
    }
  }

  toggleTank() {
    if (!this.isRunning || !this.alive) return;
    if (this.inTankId >= 0) {
      const tank = this.tanks.getTankById(this.inTankId);
      if (tank) {
        tank.driverId = '';
        this.controller.pos.set(tank.x + 3.2, 1.7, tank.z);
        if (this.mode === 'multiplayer') {
          this.network.sendEvent({ type: 'tankExit', tankId: tank.id });
        }
      }
      this.inTankId = -1;
      this._updateViewmodelVisibility();
      return;
    }

    const near = this.tanks.findNearestEnterableTank(this.controller.pos, 5.2);
    if (near) {
      near.driverId = this.localId;
      this.inTankId = near.id;
      this.reloading = false;
      this.controller.touchAds = false;
      this._updateViewmodelVisibility();
      if (this.mode === 'multiplayer') {
        this.network.sendEvent({ type: 'tankClaim', tankId: near.id });
      }
    }
  }

  // Multiplayer incoming snapshots & events
  handleRemotePlayersUpdate(playersObj) {
    this.mpPlayers = playersObj || {};
    if (!this.isRunning || this.mode !== 'multiplayer') return;
    this.remotes.syncSnapshot(this.mpPlayers, this.localId);

    // Host checks win condition
    if (this.network.isHost && !this.roundEnded) {
      for (const p of Object.values(this.mpPlayers)) {
        if ((p.kills || 0) >= this.killLimit) {
          this._endRound(p.name || 'Operator');
          break;
        }
      }
    }
  }

  handleNetworkRoomUpdate(room) {
    if (!room || !this.isRunning || this.mode !== 'multiplayer') return;
    if (room.tanks) {
      for (const [idStr, tData] of Object.entries(room.tanks)) {
        const tank = this.tanks.getTankById(Number(idStr));
        if (!tank || tank.driverId === this.localId) continue;
        tank.hp = tData.hp ?? tank.hp;
        tank.driverId = tData.driverUid || '';
        tank.destroyed = tank.hp <= 0;
        if (!tank.driverId && !tank.destroyed && typeof tData.x === 'number') {
          tank.x = tData.x;
          tank.z = tData.z;
          tank.yaw = tData.yaw || 0;
          tank.turretYaw = tData.turretYaw || 0;
        }
        // Mirror active driver state
        if (tank.driverId && this.mpPlayers[tank.driverId]) {
          const dp = this.mpPlayers[tank.driverId];
          tank.x = dp.x ?? tank.x;
          tank.z = dp.z ?? tank.z;
          tank.yaw = dp.tankYaw ?? tank.yaw;
          tank.turretYaw = dp.tankTurretYaw ?? tank.turretYaw;
        }
      }
    }
  }

  handleNetworkEvent(ev) {
    if (!this.isRunning || this.mode !== 'multiplayer') return;
    if (ev.senderUid === this.localId) return;

    if (ev.type === 'shot') {
      const start = new THREE.Vector3(ev.sx, ev.sy, ev.sz);
      const end = new THREE.Vector3(ev.ex, ev.ey, ev.ez);
      this.particles.spawnTracer(start, end);
      const dist = start.distanceTo(this.controller.pos);
      this.sound.playShot(ev.weaponId, Math.max(0.1, 1 - dist / 70));
    } else if (ev.type === 'hit' && ev.targetUid === this.localId && this.alive) {
      this._applyDamageToLocal(ev.damage, ev.attackerName || 'Enemy', ev.weaponLabel || 'GUN', ev.senderUid);
    } else if (ev.type === 'tankDamage') {
      const tank = this.tanks.getTankById(ev.tankId);
      if (tank) this._damageTank(tank, ev.damage, ev.attackerUid, ev.attackerName, false);
    } else if (ev.type === 'grenade') {
      this.grenades.throwGrenade(
        new THREE.Vector3(ev.ox, ev.oy, ev.oz),
        new THREE.Vector3(ev.dx, ev.dy, ev.dz),
        ev.senderUid,
        false
      );
    } else if (ev.type === 'tankFire') {
      const origin = new THREE.Vector3(ev.ox, ev.oy, ev.oz);
      const dir = new THREE.Vector3(ev.dx, ev.dy, ev.dz);
      this.tanks.spawnShell(origin, dir, ev.senderUid, false);
      const dist = origin.distanceTo(this.controller.pos);
      this.sound.playTankCannon(Math.max(0.15, 1 - dist / 85));
    } else if (ev.type === 'tankClaim') {
      const tank = this.tanks.getTankById(ev.tankId);
      if (tank && !tank.driverId) tank.driverId = ev.senderUid;
    } else if (ev.type === 'tankExit') {
      const tank = this.tanks.getTankById(ev.tankId);
      if (tank && tank.driverId === ev.senderUid) tank.driverId = '';
    } else if (ev.type === 'kill') {
      if (ev.killerUid === this.localId && ev.victimUid !== this.localId) {
        this.kills += 1;
        this.sound.playKillChime();
      }
      this.ui.pushKillfeed(ev.killerName, ev.weaponLabel, ev.victimName);
    } else if (ev.type === 'roundEnd') {
      this._endRound(ev.winnerName || 'Operator', false);
    } else if (ev.type === 'roundReset') {
      this.kills = 0;
      this.deaths = 0;
      this.roundEnded = false;
      this.ui.setScoreboardVisible(false);
      this._spawnLocalPlayer(0);
      this.controller.setActive(true);
    }
  }

  _loop(now) {
    requestAnimationFrame(this._loop);
    const dt = Math.min(0.05, (now - this.lastFrameTime) / 1000);
    this.lastFrameTime = now;

    // FPS tracking & Adaptive PixelRatio scaler for iPad 30-60 FPS
    this.frameCount++;
    this.fpsAccum += dt;
    if (this.fpsAccum >= 0.5) {
      this.fps = this.frameCount / this.fpsAccum;
      this.frameCount = 0;
      this.fpsAccum = 0;

      if (this.autoFps && this.isRunning) {
        if (this.fps < 33) {
          this.lowFpsStreak++;
          if (this.lowFpsStreak >= 2 && this.currentPixelRatio > 0.85) {
            this.currentPixelRatio = Math.max(0.85, this.currentPixelRatio - 0.2);
            this.renderer.setPixelRatio(this.currentPixelRatio);
            if (this.currentPixelRatio <= 0.9) this.renderer.shadowMap.enabled = false;
          }
        } else {
          this.lowFpsStreak = 0;
        }
      }
    }

    if (!this.isRunning) {
      // Gentle idle camera pan behind menu
      const t = now * 0.00018;
      this.camera.position.set(Math.sin(t) * 28, 12, Math.cos(t) * 28);
      this.camera.lookAt(0, 2, 0);
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (!this.isPaused && !this.roundEnded) {
      this._updateMatch(dt, now);
    }

    this.renderer.render(this.scene, this.camera);
  }

  _updateMatch(dt, nowMs) {
    // Round timer check
    const elapsedSec = (Date.now() - this.matchStartAt) / 1000;
    const remainingSec = Math.max(0, this.durationSec - elapsedSec);
    if (remainingSec <= 0 && !this.roundEnded) {
      if (this.mode === 'practice' || this.network.isHost) {
        const leader = this._getScoreboardEntries().sort((a, b) => b.kills - a.kills)[0];
        this._endRound(leader?.name || this.localName);
      }
    }

    // Handle local respawn
    if (!this.alive) {
      const left = Math.max(0, (this.respawnAt - nowMs) / 1000);
      this.ui.showEliminated(true, this.killerName, left);
      if (nowMs >= this.respawnAt) {
        this._spawnLocalPlayer(Math.floor(Math.random() * this.mapData.config.spawns.length));
      }
    }

    // Reload completion
    if (this.reloading && nowMs >= this.reloadEndAt) {
      const w = this.inventory[this.activeSlot];
      if (w) {
        const need = w.spec.magSize - w.mag;
        const take = Math.min(need, w.reserve);
        w.mag += take;
        w.reserve -= take;
      }
      this.reloading = false;
    }

    // Movement & Camera
    let moveMag = 0;
    const activeWeapon = this.inventory[this.activeSlot];
    const isAds = this.alive && this.inTankId < 0 && this.controller.isAds();

    if (this.alive) {
      if (this.inTankId >= 0) {
        const tank = this.tanks.getTankById(this.inTankId);
        if (!tank || tank.destroyed) {
          this.inTankId = -1;
          this._updateViewmodelVisibility();
        } else {
          const { forward, strafe } = this.controller.getMovementAxes();
          this.tanks.driveTank(tank, forward, -strafe, this.controller.yaw, this.controller.pitch, this.mapData.colliders, dt);
          this.controller.pos.set(tank.x, 2.0, tank.z);
          this._updateTankChaseCamera(tank);
          this._handleTankFiring(tank, nowMs);
          if (this.mode === 'multiplayer') {
            this.network.syncTankState(tank.id, {
              x: tank.x, z: tank.z, yaw: tank.yaw, turretYaw: tank.turretYaw, hp: tank.hp, driverUid: this.localId
            });
          }
        }
      } else {
        moveMag = this.controller.updateOnFoot(dt, this.mapData.colliders, isAds);
        this.camera.position.copy(this.controller.pos);
        this.camera.rotation.set(this.controller.pitch, this.controller.yaw, 0, 'YXZ');
        this._updateFovAndViewmodel(dt, activeWeapon, isAds, moveMag);
        this._handleOnFootFiring(nowMs, activeWeapon, isAds);
      }
    }

    // Update Supply Crates
    this._updateSupplyCrates(dt, nowMs);

    // Update Tanks, Grenades, Particles, Remotes, Bots
    this.tanks.update(dt, nowMs, this.mapData.colliders, (pos, ownerId, isLocal) => {
      this._triggerExplosion(pos, 8.2, 130, 145, ownerId, isLocal, '120MM CANNON');
    });

    this.grenades.update(dt, this.mapData.colliders, (pos, ownerId, isLocal) => {
      this._triggerExplosion(pos, 7.5, 115, 115, ownerId, isLocal, 'HE-67 FRAG');
    });

    this.particles.update(dt);
    this.remotes.update(dt);

    if (this.mode === 'practice') {
      this._updateBots(dt, nowMs);
    } else {
      this.network.syncPlayerState({
        x: this.controller.pos.x,
        y: this.controller.pos.y,
        z: this.controller.pos.z,
        yaw: this.controller.yaw,
        pitch: this.controller.pitch,
        alive: this.alive,
        hp: this.hp,
        kills: this.kills,
        deaths: this.deaths,
        weapon: this.activeSlot,
        inTankId: this.inTankId,
        tankYaw: this.inTankId >= 0 ? (this.tanks.getTankById(this.inTankId)?.yaw || 0) : 0,
        tankTurretYaw: this.inTankId >= 0 ? (this.tanks.getTankById(this.inTankId)?.turretYaw || 0) : 0
      });
    }

    // Update HUD
    const nearTank = this.alive && this.inTankId < 0 ? this.tanks.findNearestEnterableTank(this.controller.pos, 5.2) : null;
    const drivingTank = this.inTankId >= 0 ? this.tanks.getTankById(this.inTankId) : null;
    const cannonReadyPct = drivingTank ? Math.min(1, (nowMs - drivingTank.lastCannonAt) / TANK_CANNON_COOLDOWN_MS) : 1;
    const isScoped = Boolean(isAds && activeWeapon?.spec.isScope);

    this.ui.updateHud({
      hp: this.hp,
      activeSlot: this.activeSlot,
      weaponState: activeWeapon,
      grenadesCount: this.inventory[4].mag,
      reloading: this.reloading,
      isScoped,
      moveSpread: moveMag,
      inTank: Boolean(drivingTank),
      tankHp: drivingTank?.hp || 0,
      cannonReadyPct,
      coaxAmmo: drivingTank?.coaxAmmo || 0,
      nearTank: Boolean(nearTank),
      fps: this.fps,
      timerSec: remainingSec,
      killLimit: this.killLimit,
      playerCount: this.mode === 'practice' ? 1 + this.bots.bots.length : Math.max(1, Object.keys(this.mpPlayers).length)
    });
  }

  _updateTankChaseCamera(tank) {
    const targetFov = 82;
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov += (targetFov - this.camera.fov) * 0.2;
      this.camera.updateProjectionMatrix();
    }

    const lookTarget = new THREE.Vector3(tank.x, 2.35, tank.z);
    const backDir = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(this.controller.pitch * 0.45, this.controller.yaw, 0, 'YXZ')).normalize();
    const desiredCamPos = lookTarget.clone().addScaledVector(backDir, 8.6);
    desiredCamPos.y = Math.max(1.4, desiredCamPos.y + 1.6);

    // Wall-clamp raycast so chase cam doesn't clip behind concrete blocks
    const rayDir = new THREE.Vector3().subVectors(desiredCamPos, lookTarget);
    const dist = rayDir.length();
    rayDir.normalize();
    this.raycaster.set(lookTarget, rayDir);
    this.raycaster.far = dist;
    const hits = this.raycaster.intersectObjects(this.mapData.worldMeshes, false);
    if (hits.length > 0) {
      this.camera.position.copy(lookTarget).addScaledVector(rayDir, Math.max(2.2, hits[0].distance - 0.45));
    } else {
      this.camera.position.copy(desiredCamPos);
    }
    this.camera.lookAt(lookTarget.x - Math.sin(this.controller.yaw) * 4, lookTarget.y + Math.sin(this.controller.pitch) * 3, lookTarget.z - Math.cos(this.controller.yaw) * 4);
  }

  _updateFovAndViewmodel(dt, weaponState, isAds, moveMag) {
    const targetFov = isAds ? (weaponState?.spec.adsFov || 58) : 78;
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 14);
      this.camera.updateProjectionMatrix();
    }

    const isScoped = Boolean(isAds && weaponState?.spec.isScope);
    const vm = weaponState ? this.viewmodels[weaponState.spec.id] : null;
    if (!vm) return;

    vm.visible = !isScoped;
    if (isScoped) return;

    const target = isAds ? weaponState.spec.adsPos : weaponState.spec.hipPos;
    this.recoilOffset = Math.max(0, this.recoilOffset - dt * 0.35);

    if (moveMag > 0.1 && this.controller.onGround) {
      this.walkBobPhase += dt * (isAds ? 6 : 10);
    }
    const bobX = Math.cos(this.walkBobPhase) * (isAds ? 0.002 : 0.009) * moveMag;
    const bobY = Math.abs(Math.sin(this.walkBobPhase)) * (isAds ? 0.002 : 0.01) * moveMag;
    const reloadTilt = this.reloading ? -0.45 : 0;

    vm.position.x += (target[0] + bobX - vm.position.x) * Math.min(1, dt * 16);
    vm.position.y += (target[1] - bobY - (this.reloading ? 0.08 : 0) - vm.position.y) * Math.min(1, dt * 16);
    vm.position.z += (target[2] + this.recoilOffset - vm.position.z) * Math.min(1, dt * 20);
    vm.rotation.x += (this.recoilOffset * 1.4 + reloadTilt - vm.rotation.x) * Math.min(1, dt * 16);
  }

  _handleOnFootFiring(nowMs, weaponState, isAds) {
    const triggerDown = this.controller.isFiring();
    const justPressed = triggerDown && !this.prevTrigger;
    this.prevTrigger = triggerDown;

    if (!weaponState) return;
    if (weaponState.spec.type === 'grenade') {
      if (justPressed && weaponState.mag > 0) {
        this.throwQuickGrenade();
      }
      return;
    }

    const wantFire = weaponState.spec.type === 'auto' ? triggerDown : justPressed;
    if (!wantFire || this.reloading) return;
    if (nowMs - this.lastShotAt < weaponState.spec.fireRateMs) return;

    if (weaponState.mag <= 0) {
      this.startReload();
      return;
    }

    this.lastShotAt = nowMs;
    weaponState.mag -= 1;
    this.sound.playShot(weaponState.spec.id, 1.0);

    // Recoil kick
    this.recoilOffset = Math.min(0.08, this.recoilOffset + 0.032);
    this.controller.pitch = Math.min(1.45, this.controller.pitch + weaponState.spec.recoilPitch * (isAds ? 0.65 : 1));
    this.controller.yaw += (Math.random() - 0.5) * weaponState.spec.recoilYaw;

    const spread = isAds ? weaponState.spec.spreadAds : weaponState.spec.spreadHip;
    const origin = this.camera.position.clone();
    const baseDir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(this.controller.pitch, this.controller.yaw, 0, 'YXZ')).normalize();
    const muzzleStart = origin.clone().addScaledVector(baseDir, 0.55);
    muzzleStart.y -= 0.1;

    const targetMeshes = [
      ...this.mapData.worldMeshes,
      ...this.tanks.hitMeshes,
      ...(this.mode === 'practice' ? this.bots.getHitMeshes() : this.remotes.getHitMeshes())
    ];

    for (let p = 0; p < weaponState.spec.pellets; p++) {
      const dir = baseDir.clone();
      dir.x += (Math.random() - 0.5) * spread * 2;
      dir.y += (Math.random() - 0.5) * spread * 2;
      dir.z += (Math.random() - 0.5) * spread * 2;
      dir.normalize();

      this.raycaster.set(origin, dir);
      this.raycaster.far = weaponState.spec.range;
      const hits = this.raycaster.intersectObjects(targetMeshes, false);

      let endPoint = origin.clone().addScaledVector(dir, 75);
      if (hits.length > 0) {
        const hit = hits[0];
        endPoint = hit.point;
        const meta = hit.object.userData;

        if (meta?.entityType === 'player') {
          const isHead = Boolean(meta.isHead);
          const dmg = Math.round(weaponState.spec.damage * (isHead ? weaponState.spec.headshotMult : 1));
          this.ui.flashHitmarker(isHead);
          this.sound.playHitmarker(isHead);
          this._registerHitOnTarget(meta.playerId, dmg, weaponState.spec.shortName, isHead);
        } else if (meta?.entityType === 'tank') {
          const tank = this.tanks.getTankById(meta.tankId);
          if (tank) {
            const dmg = Math.max(4, Math.round(weaponState.spec.damage * 0.25));
            this.ui.flashHitmarker(false);
            this.sound.playHitmarker(false);
            this._damageTank(tank, dmg, this.localId, this.localName, true);
          }
          this.particles.spawnImpact(hit.point, hit.face?.normal, 4);
        } else {
          this.particles.spawnImpact(hit.point, hit.face?.normal, 4);
        }
      }

      this.particles.spawnTracer(muzzleStart, endPoint);
      if (this.mode === 'multiplayer' && p === 0) {
        this.network.sendEvent({
          type: 'shot',
          weaponId: weaponState.spec.id,
          sx: muzzleStart.x, sy: muzzleStart.y, sz: muzzleStart.z,
          ex: endPoint.x, ey: endPoint.y, ez: endPoint.z
        });
      }
    }

    if (weaponState.mag === 0 && weaponState.reserve > 0) {
      this.startReload();
    }
  }

  _handleTankFiring(tank, nowMs) {
    const primary = this.controller.isFiring();
    const secondary = this.controller.isAds();

    if (primary && nowMs - tank.lastCannonAt >= TANK_CANNON_COOLDOWN_MS) {
      tank.lastCannonAt = nowMs;
      const { origin, dir } = this.tanks.getCannonMuzzlePose(tank);
      this.tanks.spawnShell(origin, dir, this.localId, true);
      this.sound.playTankCannon(1.0);

      if (this.mode === 'multiplayer') {
        this.network.sendEvent({
          type: 'tankFire',
          ox: origin.x, oy: origin.y, oz: origin.z,
          dx: dir.x, dy: dir.y, dz: dir.z
        });
      }
    }

    if (secondary && tank.coaxAmmo > 0 && nowMs - tank.lastCoaxAt >= 120) {
      tank.lastCoaxAt = nowMs;
      tank.coaxAmmo -= 1;
      const { origin, dir } = this.tanks.getCannonMuzzlePose(tank);
      dir.x += (Math.random() - 0.5) * 0.025;
      dir.y += (Math.random() - 0.5) * 0.025;
      dir.z += (Math.random() - 0.5) * 0.025;
      dir.normalize();
      this.sound.playShot('coax', 0.9);

      const targetMeshes = [
        ...this.mapData.worldMeshes,
        ...(this.mode === 'practice' ? this.bots.getHitMeshes() : this.remotes.getHitMeshes())
      ];
      this.raycaster.set(origin, dir);
      this.raycaster.far = 140;
      const hits = this.raycaster.intersectObjects(targetMeshes, false);
      const endPoint = hits.length > 0 ? hits[0].point : origin.clone().addScaledVector(dir, 80);
      this.particles.spawnTracer(origin, endPoint);

      if (hits.length > 0 && hits[0].object.userData?.entityType === 'player') {
        const meta = hits[0].object.userData;
        this.ui.flashHitmarker(false);
        this.sound.playHitmarker(false);
        this._registerHitOnTarget(meta.playerId, 18, 'TANK MG', false);
      }
    }
  }

  _triggerExplosion(pos, radius, playerMaxDmg, tankMaxDmg, ownerId, isLocal, weaponLabel) {
    this.particles.spawnExplosion(pos, radius);
    const distToCam = pos.distanceTo(this.camera.position);
    this.sound.playExplosion(Math.max(0.15, 1 - distToCam / 95));

    // Only owner/local applies authoritative damage to avoid duplicate explosion hits
    if (!isLocal) return;

    // Damage local player if in blast radius
    if (this.alive && this.inTankId < 0) {
      const d = pos.distanceTo(this.controller.pos);
      if (d < radius) {
        const dmg = Math.round(playerMaxDmg * (1 - d / radius));
        if (dmg > 4) {
          this._applyDamageToLocal(dmg, ownerId === this.localId ? 'Self' : this._resolveName(ownerId), weaponLabel, ownerId);
        }
      }
    }

    // Damage tanks in blast radius
    for (const tank of this.tanks.tanks) {
      if (tank.destroyed) continue;
      const d = Math.hypot(tank.x - pos.x, tank.z - pos.z);
      if (d < radius + 1.5) {
        const dmg = Math.round(tankMaxDmg * Math.max(0.2, 1 - d / (radius + 1.5)));
        this._damageTank(tank, dmg, ownerId, this._resolveName(ownerId), true);
      }
    }

    // Damage bots or remote players
    if (this.mode === 'practice') {
      for (const bot of this.bots.bots) {
        if (!bot.alive || bot.inTankId >= 0) continue;
        const d = pos.distanceTo(bot.pos);
        if (d < radius) {
          const dmg = Math.round(playerMaxDmg * (1 - d / radius));
          if (dmg > 4) this._damageBot(bot, dmg, ownerId, weaponLabel);
        }
      }
    } else {
      for (const [uid, ent] of this.remotes.remotes.entries()) {
        if (ent.data.alive === false || (ent.data.inTankId ?? -1) >= 0) continue;
        const d = pos.distanceTo(ent.currentPos);
        if (d < radius) {
          const dmg = Math.round(playerMaxDmg * (1 - d / radius));
          if (dmg > 4) {
            this.ui.flashHitmarker(false);
            this._registerHitOnTarget(uid, dmg, weaponLabel, false);
          }
        }
      }
    }
  }

  _damageTank(tank, dmg, attackerId, attackerName, broadcast = false) {
    if (tank.destroyed) return;
    tank.hp -= dmg;
    if (broadcast && this.mode === 'multiplayer') {
      this.network.sendEvent({
        type: 'tankDamage',
        tankId: tank.id,
        damage: dmg,
        attackerUid: attackerId,
        attackerName
      });
    }
    if (tank.hp <= 0) {
      tank.hp = 0;
      tank.destroyed = true;
      tank.destroyedAt = performance.now();
      const pos = new THREE.Vector3(tank.x, 1.5, tank.z);
      this.particles.spawnExplosion(pos, 9);
      this.sound.playExplosion(1.0);

      if (tank.driverId === this.localId && this.alive) {
        this.inTankId = -1;
        this._updateViewmodelVisibility();
        this._applyDamageToLocal(200, attackerName || 'Tank Explosion', 'TANK DESTROYED', attackerId);
      } else if (this.mode === 'practice' && tank.driverId?.startsWith('bot_')) {
        const bot = this.bots.bots.find((b) => b.id === tank.driverId);
        if (bot) {
          bot.inTankId = -1;
          this._damageBot(bot, 200, attackerId, 'TANK DESTROYED');
        }
      }
      tank.driverId = '';
    }
  }

  _registerHitOnTarget(targetId, damage, weaponLabel) {
    if (this.mode === 'practice') {
      const bot = this.bots.bots.find((b) => b.id === targetId);
      if (bot) this._damageBot(bot, damage, this.localId, weaponLabel);
    } else {
      this.network.sendEvent({
        type: 'hit',
        targetUid: targetId,
        damage,
        attackerName: this.localName,
        weaponLabel
      });
    }
  }

  _damageBot(bot, damage, attackerId, weaponLabel) {
    if (!bot.alive) return;
    bot.hp -= damage;
    if (bot.hp <= 0) {
      bot.hp = 0;
      bot.alive = false;
      bot.deaths += 1;
      bot.respawnAt = performance.now() + 3000;
      const killerName = this._resolveName(attackerId);

      if (attackerId === this.localId) {
        this.kills += 1;
        this.sound.playKillChime();
      } else {
        const killerBot = this.bots.bots.find((b) => b.id === attackerId);
        if (killerBot) killerBot.kills += 1;
      }

      this.ui.pushKillfeed(killerName, weaponLabel, bot.name);
      this._checkPracticeWinner();
    }
  }

  _applyDamageToLocal(damage, attackerName, weaponLabel, attackerId = '') {
    if (!this.alive) return;
    this.hp -= damage;
    this.ui.flashDamage();

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.deaths += 1;
      this.killerName = attackerName || 'Enemy';
      this.respawnAt = performance.now() + 3000;
      this.inTankId = -1;
      this._updateViewmodelVisibility();
      this.ui.pushKillfeed(this.killerName, weaponLabel, this.localName);

      if (this.mode === 'practice') {
        const killerBot = this.bots.bots.find((b) => b.id === attackerId);
        if (killerBot) killerBot.kills += 1;
        this._checkPracticeWinner();
      } else {
        this.network.sendEvent({
          type: 'kill',
          killerUid: attackerId,
          killerName: this.killerName,
          weaponLabel,
          victimUid: this.localId,
          victimName: this.localName
        });
      }
    }
  }

  _checkPracticeWinner() {
    if (this.roundEnded) return;
    if (this.kills >= this.killLimit) {
      this._endRound(this.localName);
      return;
    }
    for (const bot of this.bots.bots) {
      if (bot.kills >= this.killLimit) {
        this._endRound(bot.name);
        return;
      }
    }
  }

  _updateBots(dt, nowMs) {
    const targets = [
      { id: this.localId, pos: this.controller.pos.clone(), alive: this.alive },
      ...this.bots.bots.map((b) => ({ id: b.id, pos: b.pos.clone(), alive: b.alive }))
    ];

    this.bots.update(dt, nowMs, {
      colliders: this.mapData.colliders,
      worldMeshes: this.mapData.worldMeshes,
      spawns: this.mapData.config.spawns,
      tankSystem: this.tanks,
      targets,
      onBotShoot: (bot, target) => {
        const dir = new THREE.Vector3().subVectors(target.pos, bot.pos).normalize();
        dir.x += (Math.random() - 0.5) * 0.08;
        dir.y += (Math.random() - 0.5) * 0.06;
        dir.z += (Math.random() - 0.5) * 0.08;
        dir.normalize();
        const end = bot.pos.clone().addScaledVector(dir, bot.pos.distanceTo(target.pos));
        this.particles.spawnTracer(bot.pos.clone().add(new THREE.Vector3(0, -0.2, 0)), end);
        this.sound.playShot('rifle', Math.max(0.12, 1 - bot.pos.distanceTo(this.controller.pos) / 65));

        if (Math.random() < 0.45) {
          if (target.id === this.localId && this.inTankId < 0) {
            this._applyDamageToLocal(14, bot.name, 'M4 TAC', bot.id);
          } else {
            const victimBot = this.bots.bots.find((b) => b.id === target.id);
            if (victimBot) this._damageBot(victimBot, 18, bot.id, 'M4 TAC');
          }
        }
      },
      onBotGrenade: (bot, target) => {
        const dir = new THREE.Vector3().subVectors(target.pos, bot.pos).normalize();
        this.grenades.throwGrenade(bot.pos.clone().add(new THREE.Vector3(0, 0.2, 0)), dir, bot.id, true);
      },
      onBotTankFire: (bot, tank) => {
        const { origin, dir } = this.tanks.getCannonMuzzlePose(tank);
        this.tanks.spawnShell(origin, dir, bot.id, true);
        this.sound.playTankCannon(Math.max(0.15, 1 - origin.distanceTo(this.controller.pos) / 85));
      }
    });
  }

  _updateSupplyCrates(dt, nowMs) {
    for (const c of this.mapData.supplyCrates) {
      if (!c.active) {
        if (nowMs >= c.respawnAt) {
          c.active = true;
          c.mesh.visible = true;
        }
        continue;
      }

      c.mesh.rotation.y += dt * 1.8;
      if (this.alive && this.inTankId < 0) {
        const dx = this.controller.pos.x - c.x;
        const dz = this.controller.pos.z - c.z;
        if (dx * dx + dz * dz < 2.2) {
          c.active = false;
          c.mesh.visible = false;
          c.respawnAt = nowMs + 15000;
          this.hp = Math.min(100, this.hp + 40);
          for (const w of this.inventory) {
            if (w.spec.type === 'grenade') w.mag = Math.min(2, w.mag + 1);
            else w.reserve = w.spec.reserveMax;
          }
          this.sound.playReload();
        }
      }
    }
  }

  _resolveName(id) {
    if (id === this.localId) return this.localName;
    if (this.mode === 'practice') {
      return this.bots.bots.find((b) => b.id === id)?.name || 'Bot';
    }
    return this.mpPlayers[id]?.name || 'Operator';
  }

  _getScoreboardEntries() {
    if (this.mode === 'practice') {
      return [
        { id: this.localId, name: this.localName, kills: this.kills, deaths: this.deaths, alive: this.alive },
        ...this.bots.bots.map((b) => ({ id: b.id, name: b.name, kills: b.kills, deaths: b.deaths, alive: b.alive }))
      ];
    }
    return Object.entries(this.mpPlayers).map(([uid, p]) => ({
      id: uid,
      name: p.name || 'Operator',
      kills: uid === this.localId ? this.kills : (p.kills || 0),
      deaths: uid === this.localId ? this.deaths : (p.deaths || 0),
      alive: p.alive !== false
    }));
  }

  _refreshScoreboard(roundEnded, winnerName = '') {
    const entries = this._getScoreboardEntries();
    const mapName = MAP_CONFIGS[this.mapId]?.name || 'Arena';
    const canRestart = this.mode === 'practice' || this.network.isHost;
    this.ui.renderScoreboard(entries, this.localId, { roundEnded, winnerName, canRestart, mapName });
  }

  _endRound(winnerName, broadcast = true) {
    if (this.roundEnded) return;
    this.roundEnded = true;
    this.controller.setActive(false);
    if (broadcast && this.mode === 'multiplayer' && this.network.isHost) {
      this.network.sendEvent({ type: 'roundEnd', winnerName });
    }
    this._refreshScoreboard(true, winnerName);
  }

  restartRound() {
    if (this.mode === 'practice') {
      this.startPracticeMatch({
        mapId: this.mapId,
        botCount: this.bots.bots.length,
        killLimit: this.killLimit,
        playerName: this.localName
      });
    } else if (this.network.isHost) {
      this.network.restartRound();
    }
  }
}
