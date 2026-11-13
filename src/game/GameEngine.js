import * as THREE from 'three';
import { TextureLibrary } from './Textures.js';
import { buildArenaMap, MAP_CONFIGS } from './MapBuilder.js';
import { createWeaponInventory, buildViewmodelMesh, applyWeaponSkin } from './Weapons.js';
import { ParticleSystem } from './Particles.js';
import { TankSystem, TANK_CANNON_COOLDOWN_MS } from './TankSystem.js';
import { GrenadeSystem } from './GrenadeSystem.js';
import { RemotePlayerManager } from './RemotePlayers.js';
import { BotManager } from './BotAI.js';
import { PlayerController } from './PlayerController.js';

export function detectGraphicsCapability() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isTouchDevice: false, canRun4K: true };
  }
  const hasCoarsePointer = Boolean(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  const touchPoints = Number(navigator.maxTouchPoints || 0);
  const isIPadUA = /iPad|Macintosh.*Mobile/i.test(navigator.userAgent || '');
  const isTouchDevice = hasCoarsePointer || touchPoints > 0 || isIPadUA;
  return {
    isTouchDevice,
    canRun4K: !isTouchDevice
  };
}

export class GameEngine {
  constructor({ container, soundEngine, network, ui }) {
    this.container = container;
    this.sound = soundEngine;
    this.network = network;
    this.ui = ui;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(78, window.innerWidth / window.innerHeight, 0.08, 420);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Performance & Graphics Quality ('ultra' [4K PC] | 'balanced' [HD Clean] | 'fast' [720p Low Poly])
    this.capability = detectGraphicsCapability();
    this.quality = 'balanced';
    this.autoFps = true;
    this.fps = 60;
    this.frameMs = 16.6;
    this.frameCount = 0;
    this.fpsAccum = 0;
    this.currentPixelRatio = 1.25;
    this.lowFpsStreak = 0;
    this.elapsedSec = 0;
    this._switchingQuality = false;

    // Loadout Customization
    this.operatorId = 'vanguard';
    this.skinId = 'factory';

    this.textures = new TextureLibrary();
    this.particles = new ParticleSystem(this.scene);
    this.tanks = new TankSystem(this.scene, this.textures, true);
    this.grenades = new GrenadeSystem(this.scene, this.sound);
    this.remotes = new RemotePlayerManager(this.scene, true, this.textures, this.quality);
    this.bots = new BotManager(this.scene, true);
    this.controller = new PlayerController(this.camera, this.renderer.domElement, (mode) => {
      this.ui.applyInputMode(mode, this.controller.pointerLocked);
    });

    this.raycaster = new THREE.Raycaster();
    this.viewmodelRoot = new THREE.Group();
    this.camera.add(this.viewmodelRoot);
    this.viewmodelLight = new THREE.PointLight(0xfff5e6, 0.95, 2.4);
    this.viewmodelLight.position.set(-0.14, 0.24, -0.15);
    this.camera.add(this.viewmodelLight);
    this.viewmodels = {};
    this._initViewmodels();

    // Match state
    this.isRunning = false;
    this.isPaused = false;
    this.mode = 'practice';
    this.mapData = null;
    this.mapId = 'harbor';
    this.killLimit = 15;
    this.durationSec = 180;
    this.matchStartAt = 0;
    this.roundEnded = false;
    this.botDifficulty = 'tactical';

    // Local Player
    this.localId = 'local';
    this.localName = 'Operator';
    this.hp = 100;
    this.alive = true;
    this.respawnAt = 0;
    this.killerName = '';
    this.kills = 0;
    this.deaths = 0;
    this.inTankId = -1;

    // Weapon & Animation state
    this.inventory = createWeaponInventory();
    this.activeSlot = 0;
    this.lastShotAt = 0;
    this.reloading = false;
    this.reloadEndAt = 0;
    this.recoilOffset = 0;
    this.recoilRecoverPitch = 0;
    this.drawDrop = 0;
    this.vmFlashTimer = 0;
    this.walkBobPhase = 0;
    this.prevTrigger = false;

    this.mpPlayers = {};
    this.scoreboardHeld = false;

    this._bindControllerCallbacks();
    this._applyQualitySettings(false);
    this._loadMenuDiorama('harbor');
    window.addEventListener('resize', () => this._onResize());
    this._onResize();

    this.lastFrameTime = performance.now();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _initViewmodels() {
    for (const old of Object.values(this.viewmodels)) {
      this.viewmodelRoot.remove(old);
    }
    this.viewmodels = {};
    const specs = createWeaponInventory();
    for (const item of specs) {
      const id = item.spec.id;
      const vm = buildViewmodelMesh(id, {
        skinId: this.skinId,
        operatorId: this.operatorId,
        textureLib: this.textures,
        quality: this.quality
      });
      vm.position.set(item.spec.hipPos[0], item.spec.hipPos[1], item.spec.hipPos[2]);
      vm.rotation.y = 0.085;
      vm.visible = false;
      this.viewmodelRoot.add(vm);
      this.viewmodels[id] = vm;
    }
  }

  setLoadout(operatorId, skinId) {
    if (operatorId) this.operatorId = operatorId;
    if (skinId) this.skinId = skinId;
    for (const vm of Object.values(this.viewmodels)) {
      applyWeaponSkin(vm, {
        skinId: this.skinId,
        operatorId: this.operatorId,
        textureLib: this.textures,
        quality: this.quality
      });
    }
    if (this.isRunning && this.mode === 'multiplayer') {
      this._syncLocalState(true);
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

  setQuality(quality, autoFps = this.autoFps, forceAllowUltra = false) {
    let normalized = quality === 'high' ? 'ultra' : (quality || 'balanced');
    if (normalized === 'ultra' && !this.capability.canRun4K && !forceAllowUltra) {
      normalized = 'balanced';
    }
    const changed = this.quality !== normalized;
    this.quality = normalized;
    this.autoFps = Boolean(autoFps);
    this._applyQualitySettings(changed);
    return this.quality;
  }

  _applyQualitySettings(rebuildScene = false) {
    if (this._switchingQuality) return;
    this._switchingQuality = true;
    try {
      const dpr = window.devicePixelRatio || 1;
      if (this.quality === 'ultra' || this.quality === 'high') {
        this.quality = 'ultra';
        this.currentPixelRatio = Math.min(Math.max(dpr, 1.5), 2.5);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMappingExposure = 1.08;
      } else if (this.quality === 'balanced') {
        this.currentPixelRatio = Math.min(dpr, 1.35);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMappingExposure = 1.08;
      } else {
        this.quality = 'fast';
        const hdRatio = 720 / Math.max(1, window.innerHeight || 720);
        this.currentPixelRatio = Math.min(1.0, Math.max(0.65, hdRatio));
        this.renderer.shadowMap.enabled = false;
        this.renderer.toneMappingExposure = 1.05;
      }

      this.remotes.setQuality(this.quality);
      this.bots.castShadows = this.quality !== 'fast';
      this.tanks.castShadows = this.quality !== 'fast';

      this.renderer.setPixelRatio(this.currentPixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight, false);

      if (rebuildScene) {
        this._initViewmodels();
        this._updateViewmodelVisibility();
        if (this.mapData) {
          const activeMap = this.mapId || 'harbor';
          this.mapData.dispose();
          this.mapData = buildArenaMap(this.scene, this.textures, activeMap, this.quality);
        }
        // Keep active tanks' shadows cleanly synchronized without resetting positions
        if (this.tanks && Array.isArray(this.tanks.tanks)) {
          const cast = this.quality !== 'fast';
          for (const t of this.tanks.tanks) {
            t.root?.traverse((obj) => {
              if (obj.isMesh) {
                obj.castShadow = cast;
                obj.receiveShadow = cast;
              }
            });
          }
        }
      }
    } finally {
      this._switchingQuality = false;
      this.lastFrameTime = performance.now();
    }
  }

  _loadMenuDiorama(mapId = 'harbor') {
    if (this.isRunning) return;
    if (this.mapData) {
      this.mapData.dispose();
      this.mapData = null;
    }
    this.mapId = mapId;
    this.mapData = buildArenaMap(this.scene, this.textures, mapId, this.quality);
    this.lastFrameTime = performance.now();
  }

  previewMenuMap(mapId) {
    if (!this.isRunning && mapId && mapId !== this.mapId) {
      this._loadMenuDiorama(mapId);
    }
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.quality === 'fast') {
      this.currentPixelRatio = Math.min(1.0, Math.max(0.65, 720 / Math.max(1, h)));
      this.renderer.setPixelRatio(this.currentPixelRatio);
    }
    this.renderer.setSize(w, h, false);
  }

  startPracticeMatch({
    mapId = 'harbor',
    botCount = 3,
    killLimit = 15,
    difficulty = 'tactical',
    playerName = 'Operator',
    operatorId = this.operatorId,
    skinId = this.skinId
  }) {
    this._teardownMatch();
    this.mode = 'practice';
    this.mapId = mapId;
    this.killLimit = killLimit;
    this.durationSec = 180;
    this.botDifficulty = difficulty;
    this.localId = 'local';
    this.localName = playerName || 'Operator';
    this.setLoadout(operatorId, skinId);

    this._loadArena(mapId);
    this.bots.spawnBots(botCount, this.mapData.config.spawns, difficulty, this.quality, this.textures);
    this._spawnLocalPlayer(0);

    this.matchStartAt = Date.now();
    this.roundEnded = false;
    this.isRunning = true;
    this.isPaused = false;
    this.controller.setActive(true);
    this.ui.showHud();
    this.ui.applyInputMode(this.controller.currentMode, this.controller.pointerLocked);
    this.lastFrameTime = performance.now();
  }

  startMultiplayerMatch(room, localUser) {
    this._teardownMatch();
    this.mode = 'multiplayer';
    this.mapId = room.mapId || 'harbor';
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

    this.handleRemotePlayersUpdate(room.players || {});
    this._syncLocalState(true);
    this.lastFrameTime = performance.now();
  }

  resetMultiplayerRound(room) {
    if (!this.isRunning || this.mode !== 'multiplayer') return;
    this.kills = 0;
    this.deaths = 0;
    this.roundEnded = false;
    this.matchStartAt = room.roundStartAt || Date.now();
    this.ui.setScoreboardVisible(false);

    this.tanks.spawnTanks(this.mapData.config.tankPads);
    const uids = Object.keys(room.players || {}).sort();
    const spawnIdx = Math.max(0, uids.indexOf(this.localId));
    this._spawnLocalPlayer(spawnIdx);
    this.controller.setActive(true);
    this._syncLocalState(true);
  }

  _loadArena(mapId) {
    this.mapData = buildArenaMap(this.scene, this.textures, mapId, this.quality);
    this.tanks.spawnTanks(this.mapData.config.tankPads);
  }

  _spawnLocalPlayer(spawnIndex) {
    const spawns = this.mapData.config.spawns;
    const sp = spawns[spawnIndex % spawns.length];
    const groundY = this.mapData.terrainHeightFn ? this.mapData.terrainHeightFn(sp.x, sp.z) : 0;
    this.controller.pos.set(sp.x, groundY + 1.7, sp.z);
    this.controller.vel.set(0, 0, 0);
    this.controller.velY = 0;
    this.controller.yaw = sp.yaw || 0;
    this.controller.pitch = 0;
    this.controller.recoil.reset();
    this.hp = 100;
    this.alive = true;
    this.inTankId = -1;
    this.inventory = createWeaponInventory();
    this.activeSlot = 0;
    this.reloading = false;
    this.drawDrop = 0.02;
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
    this._loadMenuDiorama(this.mapId || 'harbor');
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
    if (this.activeSlot !== slot) {
      this.drawDrop = 0.2;
      this.controller.recoil.reset();
    }
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
      if (mesh.userData.muzzleFlash) {
        mesh.userData.muzzleFlash.visible = false;
      }
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

    const { pitch: aimPitch, yaw: aimYaw } = this.controller.getEffectiveAngles();
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(aimPitch, aimYaw, 0, 'YXZ')).normalize();
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
      this.inTankId = -1;
      if (tank) {
        tank.driverId = '';
        const exitX = tank.x + Math.cos(tank.yaw) * 3.4;
        const exitZ = tank.z - Math.sin(tank.yaw) * 3.4;
        const exitY = (this.mapData?.terrainHeightFn ? this.mapData.terrainHeightFn(exitX, exitZ) : 0) + 1.7;
        this.controller.pos.set(exitX, exitY, exitZ);
        this.controller.vel.set(0, 0, 0);

        if (this.mode === 'multiplayer') {
          this.network.syncTankState(tank.id, {
            driverUid: '',
            x: tank.x,
            z: tank.z,
            yaw: tank.yaw,
            turretYaw: tank.turretYaw,
            hp: tank.hp
          });
          this.network.sendEvent({ type: 'tankExit', tankId: tank.id });
        }
      }
      this._updateViewmodelVisibility();
      if (this.mode === 'multiplayer') this._syncLocalState(true);
      return;
    }

    const near = this.tanks.findNearestEnterableTank(this.controller.pos, 5.4);
    if (near) {
      near.driverId = this.localId;
      this.inTankId = near.id;
      this.reloading = false;
      this.controller.touchAds = false;
      this.controller.recoil.reset();
      this._updateViewmodelVisibility();
      if (this.mode === 'multiplayer') {
        this.network.syncTankState(near.id, {
          driverUid: this.localId,
          x: near.x,
          z: near.z,
          yaw: near.yaw,
          turretYaw: near.turretYaw,
          hp: near.hp
        });
        this.network.sendEvent({ type: 'tankClaim', tankId: near.id });
        this._syncLocalState(true);
      }
    }
  }

  _syncLocalState(force = false) {
    if (this.mode !== 'multiplayer') return;
    this.network.syncPlayerState({
      x: this.controller.pos.x,
      y: this.controller.pos.y,
      z: this.controller.pos.z,
      vx: this.controller.vel.x,
      vy: this.controller.vel.y,
      vz: this.controller.vel.z,
      yaw: this.controller.yaw,
      pitch: this.controller.pitch,
      alive: this.alive,
      hp: this.hp,
      kills: this.kills,
      deaths: this.deaths,
      weapon: this.activeSlot,
      inTankId: this.inTankId,
      operatorId: this.operatorId,
      skinId: this.skinId
    }, force);
  }

  handleSinglePlayerChange(uid, data) {
    if (!uid || !data) return;
    this.mpPlayers[uid] = data;
    if (!this.isRunning || this.mode !== 'multiplayer') return;
    this.remotes.upsertPlayer(uid, data, this.localId, this.network.getServerNow());
    for (const tank of this.tanks.tanks) {
      if (tank.driverId === uid && (data.inTankId !== tank.id || data.alive === false)) {
        tank.driverId = '';
      }
    }
    if (this.network.isHost && !this.roundEnded && (data.kills || 0) >= this.killLimit) {
      this._endRound(data.name || 'Operator');
    }
  }

  handleSinglePlayerRemove(uid) {
    delete this.mpPlayers[uid];
    if (!this.isRunning || this.mode !== 'multiplayer') return;
    this.remotes.removePlayer(uid);
    for (const tank of this.tanks.tanks) {
      if (tank.driverId === uid) tank.driverId = '';
    }
  }

  handleRemotePlayersUpdate(playersObj) {
    this.mpPlayers = playersObj || {};
    if (!this.isRunning || this.mode !== 'multiplayer') return;
    this.remotes.syncSnapshot(this.mpPlayers, this.localId, this.network.getServerNow());

    for (const tank of this.tanks.tanks) {
      if (tank.driverId && tank.driverId !== this.localId) {
        const dp = this.mpPlayers[tank.driverId];
        if (!dp || dp.inTankId !== tank.id || dp.alive === false) {
          tank.driverId = '';
        }
      }
    }

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
        tank.destroyed = tank.hp <= 0;

        const candidateUid = tData.driverUid || '';
        const candidatePlayer = candidateUid ? this.mpPlayers[candidateUid] : null;
        const confirmedDriver = candidateUid && candidatePlayer && candidatePlayer.inTankId === tank.id && candidatePlayer.alive !== false
          ? candidateUid
          : '';
        tank.driverId = confirmedDriver;

        if (!tank.destroyed && typeof tData.x === 'number') {
          this.tanks.setRemoteTarget(
            tank,
            tData.x,
            tData.z,
            tData.yaw ?? tank.yaw,
            tData.turretYaw ?? tank.turretYaw
          );
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
      this.remotes.triggerShotFlash(ev.senderUid);
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
      const tank = this.tanks.tanks.find((t) => t.driverId === ev.senderUid);
      if (tank) this.tanks.triggerBarrelRecoil(tank);
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
      this.resetMultiplayerRound({ roundStartAt: ev.roundStartAt, players: this.mpPlayers });
    }
  }

  _loop(now) {
    requestAnimationFrame(this._loop);
    const frameStart = performance.now();
    const rawDtSec = Math.max(0.0005, (now - this.lastFrameTime) / 1000);
    const dt = Math.min(0.05, rawDtSec);
    this.lastFrameTime = now;
    this.elapsedSec += dt;

    // Ignore >350ms synchronous load/tab-switch gaps so HUD FPS/latency reflects active runtime performance
    if (rawDtSec <= 0.35) {
      const rawFps = Math.min(240, 1 / rawDtSec);
      const rawMs = Math.max(1, rawDtSec * 1000);
      const emaAlpha = 1 - Math.exp(-rawDtSec * 5.5);
      this.fps = this.fps + (rawFps - this.fps) * emaAlpha;
      this.frameMs = this.frameMs + (rawMs - this.frameMs) * emaAlpha;
    }

    this.frameCount++;
    this.fpsAccum += Math.min(0.2, rawDtSec);
    if (this.fpsAccum >= 0.25) {
      this.frameCount = 0;
      this.fpsAccum = 0;

      if (this.autoFps && this.isRunning && this.quality !== 'fast') {
        if (this.fps < 32) {
          this.lowFpsStreak++;
          if (this.lowFpsStreak >= 3 && this.currentPixelRatio > 0.85) {
            this.currentPixelRatio = Math.max(0.85, this.currentPixelRatio - 0.15);
            this.renderer.setPixelRatio(this.currentPixelRatio);
          }
        } else {
          this.lowFpsStreak = 0;
        }
      }
    }

    if (this.mapData) {
      this.mapData.update(dt, this.elapsedSec);
    }

    if (!this.isRunning) {
      const t = now * 0.00018;
      // Offset lookAt slightly left so the dynamic sunlit 3D arena fills the open right side of the menu
      this.camera.position.set(Math.sin(t) * 34, 13.5 + Math.sin(t * 1.6) * 2.2, Math.cos(t) * 34);
      this.camera.lookAt(-3.5, 3.2, 0);
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (!this.isPaused && !this.roundEnded) {
      this._updateMatch(dt, now);
    }

    this.renderer.render(this.scene, this.camera);
    const workMs = Math.max(0.4, performance.now() - frameStart);
    if (rawDtSec <= 0.35) {
      // Track tight active CPU/render frame latency when GPU renders asynchronously or fast
      this.frameMs = this.frameMs * 0.72 + Math.min(this.frameMs, workMs * 1.15 + 0.5) * 0.28;
    }
  }

  _updateMatch(dt, nowMs) {
    const elapsedSec = (Date.now() - this.matchStartAt) / 1000;
    const remainingSec = Math.max(0, this.durationSec - elapsedSec);
    if (remainingSec <= 0 && !this.roundEnded) {
      if (this.mode === 'practice' || this.network.isHost) {
        const leader = this._getScoreboardEntries().sort((a, b) => b.kills - a.kills)[0];
        this._endRound(leader?.name || this.localName);
      }
    }

    if (!this.alive) {
      const left = Math.max(0, (this.respawnAt - nowMs) / 1000);
      this.ui.showEliminated(true, this.killerName, left);
      if (nowMs >= this.respawnAt) {
        this._spawnLocalPlayer(Math.floor(Math.random() * this.mapData.config.spawns.length));
      }
    }

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

    const activeFiring = this.controller.isFiring() && this.alive && this.inTankId < 0;
    this.controller.recoil.update(dt, activeFiring);

    let moveMag = 0;
    const activeWeapon = this.inventory[this.activeSlot];
    const isAds = this.alive && this.inTankId < 0 && this.controller.isAds();
    const terrainFn = this.mapData.terrainHeightFn;

    const FIXED_STEP = 1 / 60;
    let remDt = dt;
    let substeps = 0;
    while (remDt > 0.0001 && substeps < 4) {
      const stepDt = Math.min(FIXED_STEP, remDt);
      remDt -= stepDt;
      substeps++;

      if (this.alive) {
        if (this.inTankId >= 0) {
          const tank = this.tanks.getTankById(this.inTankId);
          if (!tank || tank.destroyed) {
            this.inTankId = -1;
            this._updateViewmodelVisibility();
          } else {
            const { forward, strafe } = this.controller.getMovementAxes();
            this.tanks.driveTank(tank, forward, -strafe, this.controller.yaw, this.controller.pitch, this.mapData.colliders, stepDt, terrainFn);
            this.controller.pos.set(tank.x, tank.y + 2.0, tank.z);
          }
        } else {
          moveMag = Math.max(moveMag, this.controller.updateOnFoot(stepDt, this.mapData.colliders, isAds, terrainFn));
        }
      }

      this.tanks.update(stepDt, nowMs, this.mapData.colliders, (pos, ownerId, isLocal) => {
        this._triggerExplosion(pos, 8.2, 130, 145, ownerId, isLocal, '120MM CANNON');
      }, terrainFn, this.localId);

      this.grenades.update(stepDt, this.mapData.colliders, (pos, ownerId, isLocal) => {
        this._triggerExplosion(pos, 7.5, 115, 115, ownerId, isLocal, 'HE-67 FRAG');
      }, terrainFn);
    }

    if (this.alive) {
      if (this.inTankId >= 0) {
        const tank = this.tanks.getTankById(this.inTankId);
        if (tank && !tank.destroyed) {
          this._updateTankChaseCamera(tank);
          this._handleTankFiring(tank, nowMs);
          if (this.mode === 'multiplayer') {
            this.network.syncTankState(tank.id, {
              x: tank.x, z: tank.z, yaw: tank.yaw, turretYaw: tank.turretYaw, hp: tank.hp, driverUid: this.localId
            });
          }
        }
      } else {
        const { pitch: effPitch, yaw: effYaw } = this.controller.getEffectiveAngles();
        this.camera.position.copy(this.controller.pos);
        this.camera.rotation.set(effPitch, effYaw, 0, 'YXZ');
        this._updateFovAndViewmodel(dt, activeWeapon, isAds, moveMag);
        this._handleOnFootFiring(nowMs, activeWeapon, isAds);
      }
    }

    this._updateSupplyCrates(dt, nowMs);
    this.particles.update(dt, terrainFn);
    this.remotes.update(dt, this.mode === 'multiplayer' ? this.network.getServerNow() : nowMs);

    if (this.mode === 'practice') {
      this._updateBots(dt, nowMs);
    } else {
      this._syncLocalState(false);
    }

    const nearTank = this.alive && this.inTankId < 0 ? this.tanks.findNearestEnterableTank(this.controller.pos, 5.4) : null;
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
      frameMs: this.frameMs,
      pingMs: this.mode === 'practice' ? 1 : (this.network.pingMs || 1),
      mode: this.mode,
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

    const lookTarget = new THREE.Vector3(tank.x, tank.y + 2.35, tank.z);
    const backDir = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(this.controller.pitch * 0.45, this.controller.yaw, 0, 'YXZ')).normalize();
    const desiredCamPos = lookTarget.clone().addScaledVector(backDir, 8.6);
    const groundAtCam = this.mapData.terrainHeightFn ? this.mapData.terrainHeightFn(desiredCamPos.x, desiredCamPos.z) : 0;
    desiredCamPos.y = Math.max(groundAtCam + 1.4, desiredCamPos.y + 1.6);

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
    const punchFov = (this.controller.recoil.cameraPunch || 0) * 80;
    const targetFov = (isAds ? (weaponState?.spec.adsFov || 58) : 78) + punchFov;
    if (Math.abs(this.camera.fov - targetFov) > 0.08) {
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 16);
      this.camera.updateProjectionMatrix();
    }

    const isScoped = Boolean(isAds && weaponState?.spec.isScope);
    const vm = weaponState ? this.viewmodels[weaponState.spec.id] : null;
    if (!vm) return;

    vm.visible = !isScoped;
    if (vm.userData.muzzleFlash) {
      if (this.vmFlashTimer > 0 && !isScoped) {
        this.vmFlashTimer -= dt;
        vm.userData.muzzleFlash.visible = this.vmFlashTimer > 0;
        vm.userData.muzzleFlash.rotation.z += dt * 45;
      } else {
        vm.userData.muzzleFlash.visible = false;
      }
    }

    if (isScoped) return;

    const target = isAds ? weaponState.spec.adsPos : weaponState.spec.hipPos;
    this.recoilOffset = Math.max(0, this.recoilOffset - dt * 0.36);
    this.drawDrop = Math.max(0, this.drawDrop - dt * 1.15);

    if (moveMag > 0.1 && this.controller.onGround) {
      this.walkBobPhase += dt * (isAds ? 6 : 10.5);
    } else {
      this.walkBobPhase += dt * 1.6;
    }

    const bobX = Math.cos(this.walkBobPhase) * (moveMag > 0.1 ? (isAds ? 0.002 : 0.009) * moveMag : 0.0015);
    const bobY = Math.abs(Math.sin(this.walkBobPhase)) * (moveMag > 0.1 ? (isAds ? 0.002 : 0.01) * moveMag : 0.002);
    const reloadTilt = this.reloading ? -0.52 : 0;

    const targetYaw = isAds ? 0.0 : 0.085;
    vm.position.x += (target[0] + bobX - vm.position.x) * Math.min(1, dt * 16);
    vm.position.y += (target[1] - bobY - this.drawDrop - (this.reloading ? 0.09 : 0) - vm.position.y) * Math.min(1, dt * 16);
    vm.position.z += (target[2] + this.recoilOffset - vm.position.z) * Math.min(1, dt * 20);
    vm.rotation.x += (this.recoilOffset * 1.5 + reloadTilt - this.drawDrop * 1.2 - vm.rotation.x) * Math.min(1, dt * 16);
    vm.rotation.y += (targetYaw - vm.rotation.y) * Math.min(1, dt * 16);
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
    this.vmFlashTimer = 0.055;

    const spread = isAds ? weaponState.spec.spreadAds : weaponState.spec.spreadHip;
    const { pitch: aimPitch, yaw: aimYaw } = this.controller.getEffectiveAngles();
    const origin = this.camera.position.clone();
    const baseDir = new THREE.Vector3(0, 0, -1)
      .applyEuler(new THREE.Euler(aimPitch, aimYaw, 0, 'YXZ'))
      .normalize();
    const muzzleStart = origin.clone().addScaledVector(baseDir, 0.55);
    muzzleStart.y -= 0.1;

    const targetMeshes = [
      ...this.mapData.worldMeshes,
      ...this.tanks.hitMeshes,
      ...(this.mode === 'practice' ? this.bots.getHitMeshes() : this.remotes.getHitMeshes())
    ];

    for (let p = 0; p < weaponState.spec.pellets; p++) {
      const dir = baseDir.clone();
      if (spread > 0) {
        dir.x += (Math.random() - 0.5) * spread * 2;
        dir.y += (Math.random() - 0.5) * spread * 2;
        dir.z += (Math.random() - 0.5) * spread * 2;
        dir.normalize();
      }

      this.raycaster.set(origin, dir);
      this.raycaster.far = weaponState.spec.range;
      const hits = this.raycaster.intersectObjects(targetMeshes, false);

      let endPoint = origin.clone().addScaledVector(dir, 85);
      if (hits.length > 0) {
        const hit = hits[0];
        endPoint = hit.point;
        const meta = hit.object.userData;

        if (meta?.entityType === 'player') {
          const isHead = Boolean(meta.isHead);
          const dmg = Math.round(weaponState.spec.damage * (isHead ? weaponState.spec.headshotMult : 1));
          this.ui.flashHitmarker(isHead);
          this.sound.playHitmarker(isHead);
          this._registerHitOnTarget(meta.playerId, dmg, weaponState.spec.shortName);
        } else if (meta?.entityType === 'tank') {
          const tank = this.tanks.getTankById(meta.tankId);
          if (tank) {
            const dmg = Math.max(4, Math.round(weaponState.spec.damage * 0.25));
            this.ui.flashHitmarker(false);
            this.sound.playHitmarker(false);
            this._damageTank(tank, dmg, this.localId, this.localName, true);
          }
          this.particles.spawnImpact(hit.point, hit.face?.normal, 5);
        } else {
          this.particles.spawnImpact(hit.point, hit.face?.normal, 5);
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

    this.recoilOffset = Math.min(0.085, this.recoilOffset + 0.034);
    const pitchKick = weaponState.spec.recoilPitch * (isAds ? 0.58 : 1);
    const yawKick = (Math.random() - 0.5) * 2 * weaponState.spec.recoilYaw * (isAds ? 0.6 : 1);
    const punch = weaponState.spec.id === 'sniper' ? 0.032 : weaponState.spec.id === 'shotgun' ? 0.028 : 0.012;
    this.controller.recoil.addKick(pitchKick, yawKick, punch);

    if (weaponState.mag === 0 && weaponState.reserve > 0) {
      this.startReload();
    }
  }

  _handleTankFiring(tank, nowMs) {
    const primary = this.controller.isFiring();
    const secondary = this.controller.isAds();

    if (primary && nowMs - tank.lastCannonAt >= TANK_CANNON_COOLDOWN_MS) {
      tank.lastCannonAt = nowMs;
      this.tanks.triggerBarrelRecoil(tank);
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
        this._registerHitOnTarget(meta.playerId, 18, 'TANK MG');
      }
    }
  }

  _triggerExplosion(pos, radius, playerMaxDmg, tankMaxDmg, ownerId, isLocal, weaponLabel) {
    this.particles.spawnExplosion(pos, radius);
    const distToCam = pos.distanceTo(this.camera.position);
    this.sound.playExplosion(Math.max(0.15, 1 - distToCam / 95));

    if (!isLocal) return;

    if (this.alive && this.inTankId < 0) {
      const d = pos.distanceTo(this.controller.pos);
      if (d < radius) {
        const dmg = Math.round(playerMaxDmg * (1 - d / radius));
        if (dmg > 4) {
          this._applyDamageToLocal(dmg, ownerId === this.localId ? 'Self' : this._resolveName(ownerId), weaponLabel, ownerId);
        }
      }
    }

    for (const tank of this.tanks.tanks) {
      if (tank.destroyed) continue;
      const d = Math.hypot(tank.x - pos.x, tank.z - pos.z);
      if (d < radius + 1.5) {
        const dmg = Math.round(tankMaxDmg * Math.max(0.2, 1 - d / (radius + 1.5)));
        this._damageTank(tank, dmg, ownerId, this._resolveName(ownerId), true);
      }
    }

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
            this._registerHitOnTarget(uid, dmg, weaponLabel);
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
      const pos = new THREE.Vector3(tank.x, tank.y + 1.5, tank.z);
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
      if (this.mode === 'multiplayer') {
        this.network.syncTankState(tank.id, { hp: 0, driverUid: '' });
      }
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
    if (bot.model) bot.model.flinchTimer = 0.22;
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
      if (this.inTankId >= 0) {
        const tank = this.tanks.getTankById(this.inTankId);
        if (tank) {
          tank.driverId = '';
          if (this.mode === 'multiplayer') {
            this.network.syncTankState(tank.id, { driverUid: '' });
          }
        }
      }
      this.inTankId = -1;
      this._updateViewmodelVisibility();
      this.ui.pushKillfeed(this.killerName, weaponLabel, this.localName);

      if (this.mode === 'practice') {
        const killerBot = this.bots.bots.find((b) => b.id === attackerId);
        if (killerBot) killerBot.kills += 1;
        this._checkPracticeWinner();
      } else {
        this._syncLocalState(true);
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
      terrainHeightFn: this.mapData.terrainHeightFn,
      targets,
      onBotShoot: (bot, target, cfg) => {
        const dir = new THREE.Vector3().subVectors(target.pos, bot.pos).normalize();
        dir.x += (Math.random() - 0.5) * cfg.spread;
        dir.y += (Math.random() - 0.5) * cfg.spread * 0.7;
        dir.z += (Math.random() - 0.5) * cfg.spread;
        dir.normalize();
        const muzzle = bot.pos.clone().add(new THREE.Vector3(0, -0.25, 0)).addScaledVector(dir, 0.75);
        const end = bot.pos.clone().addScaledVector(dir, bot.pos.distanceTo(target.pos));
        this.particles.spawnTracer(muzzle, end);
        this.sound.playShot('rifle', Math.max(0.12, 1 - bot.pos.distanceTo(this.controller.pos) / 85));

        if (Math.random() < cfg.hitChance) {
          if (target.id === this.localId && this.inTankId < 0) {
            this._applyDamageToLocal(cfg.damage, bot.name, 'M4 TAC', bot.id);
          } else {
            const victimBot = this.bots.bots.find((b) => b.id === target.id);
            if (victimBot) this._damageBot(victimBot, cfg.damage + 4, bot.id, 'M4 TAC');
          }
        }
      },
      onBotGrenade: (bot, target) => {
        const dir = new THREE.Vector3().subVectors(target.pos, bot.pos).normalize();
        this.grenades.throwGrenade(bot.pos.clone().add(new THREE.Vector3(0, 0.2, 0)), dir, bot.id, true);
      },
      onBotTankFire: (bot, tank) => {
        this.tanks.triggerBarrelRecoil(tank);
        const { origin, dir } = this.tanks.getCannonMuzzlePose(tank);
        this.tanks.spawnShell(origin, dir, bot.id, true);
        this.sound.playTankCannon(Math.max(0.15, 1 - origin.distanceTo(this.controller.pos) / 95));
      }
    });
  }

  _updateSupplyCrates(dt, nowMs) {
    for (const c of this.mapData.supplyCrates) {
      if (!c.active) {
        if (nowMs >= c.respawnAt) {
          c.active = true;
          c.mesh.visible = true;
          c.ring.visible = true;
        }
        continue;
      }

      c.mesh.rotation.y += dt * 1.8;
      c.mesh.position.y = c.baseY + Math.sin(this.elapsedSec * 2.5 + c.id) * 0.12;
      if (this.alive && this.inTankId < 0) {
        const dx = this.controller.pos.x - c.x;
        const dz = this.controller.pos.z - c.z;
        if (dx * dx + dz * dz < 2.2) {
          c.active = false;
          c.mesh.visible = false;
          c.ring.visible = false;
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
        difficulty: this.botDifficulty,
        playerName: this.localName,
        operatorId: this.operatorId,
        skinId: this.skinId
      });
    } else if (this.network.isHost) {
      this.network.restartRound();
    }
  }
}
