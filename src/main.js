import * as THREE from 'three';
import { isFirebaseConfigured } from './firebase/config.js';
import { NetworkManager } from './firebase/network.js';
import { SoundEngine } from './audio/SoundEngine.js';
import { UIManager } from './ui/UIManager.js';
import { GameEngine } from './game/GameEngine.js';
import { buildSoldierMesh, animateSoldierModel } from './game/SoldierMesh.js';
import { buildWeaponShowcaseMesh } from './game/Weapons.js';

const sound = new SoundEngine();
const network = new NetworkManager();
const ui = new UIManager();
const engine = new GameEngine({
  container: document.getElementById('game-container'),
  soundEngine: sound,
  network,
  ui
});

// Expose engine on window for testing & diagnostics
window.coldboreEngine = engine;

// ---------------------------------------------------------------------------
// Interactive 3D Operator & Weapon Armory Preview Bay (ResizeObserver + Studio IBL)
// ---------------------------------------------------------------------------
function createStudioEnvTexture() {
  const w = 64;
  const h = 32;
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const v = y / (h - 1); // 0 = bottom in DataTexture, 1 = top
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const idx = (y * w + x) * 4;
      let r, g, b;
      if (v > 0.54) {
        // Cool studio ceiling softbox + warm sun key lobe
        const t = (v - 0.54) / 0.46;
        const sunLobe = Math.pow(Math.max(0, Math.cos((u - 0.25) * Math.PI * 2)), 6) * 58;
        r = 165 + t * 55 + sunLobe;
        g = 185 + t * 48 + sunLobe * 0.9;
        b = 212 + t * 38 + sunLobe * 0.72;
      } else if (v > 0.46) {
        // Warm bright horizon band
        r = 214;
        g = 212;
        b = 205;
      } else {
        // Neutral charcoal workshop floor bounce
        const t = v / 0.46;
        r = 38 + t * 48;
        g = 42 + t * 50;
        b = 50 + t * 56;
      }
      data[idx] = Math.min(255, Math.round(r));
      data[idx + 1] = Math.min(255, Math.round(g));
      data[idx + 2] = Math.min(255, Math.round(b));
      data[idx + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

class ArmoryPreviewBay {
  constructor(canvas, textureLib) {
    this.canvas = canvas;
    this.textures = textureLib;
    this.target = 'operator';
    this.operatorId = 'vanguard';
    this.skinId = 'factory';
    this.quality = 'balanced';
    this.activeGroup = null;
    this.activeSoldier = null;
    this.isActiveTab = false;
    this.yawOffset = 0.28;
    this.dragVel = 0;
    this._dragging = false;
    this._lastDragX = 0;

    if (!this.canvas) return;

    this.scene = new THREE.Scene();
    this.scene.environment = createStudioEnvTexture();
    this.scene.environmentIntensity = 0.85;
    this.camera = new THREE.PerspectiveCamera(30, 4 / 3, 0.1, 40);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    const hemi = new THREE.HemisphereLight(0xeef5ff, 0x334155, 1.18);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff7ea, 2.35);
    key.position.set(3.2, 4.6, 4.2);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xdbeafe, 1.0);
    fill.position.set(-3.4, 2.2, 3.0);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xf59e0b, 0.85);
    rim.position.set(-2.5, 3.0, -3.5);
    this.scene.add(rim);

    // Clean bevel-edged matte studio pedestal disc
    const pedGeo = new THREE.CylinderGeometry(0.66, 0.72, 0.06, 36);
    const pedMat = new THREE.MeshStandardMaterial({ color: 0x2a231c, roughness: 0.72, metalness: 0.18 });
    this.pedestal = new THREE.Mesh(pedGeo, pedMat);
    this.pedestal.position.y = -0.03;
    this.scene.add(this.pedestal);

    const rimGeo = new THREE.TorusGeometry(0.67, 0.015, 8, 42);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd9821e, roughness: 0.4, metalness: 0.5 });
    const pedRing = new THREE.Mesh(rimGeo, rimMat);
    pedRing.rotation.x = Math.PI / 2;
    pedRing.position.y = 0.03;
    this.pedestal.add(pedRing);

    this._bindInteractions();
    this.resize();
    this.rebuild();

    if (typeof ResizeObserver !== 'undefined' && this.canvas.parentElement) {
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(this.canvas.parentElement);
    }
    window.addEventListener('resize', () => this.resize());

    this.lastTime = performance.now();
    this._tick = this._tick.bind(this);
    requestAnimationFrame(this._tick);
  }

  _bindInteractions() {
    const host = this.canvas.parentElement || this.canvas;
    host.addEventListener('pointerdown', (e) => {
      if (e.target?.closest?.('.preview-tabs')) return;
      this._dragging = true;
      this._lastDragX = e.clientX;
      this.dragVel = 0;
      if (host.setPointerCapture) {
        try { host.setPointerCapture(e.pointerId); } catch {}
      }
    });
    host.addEventListener('pointermove', (e) => {
      if (!this._dragging) return;
      const dx = e.clientX - this._lastDragX;
      this._lastDragX = e.clientX;
      this.yawOffset += dx * 0.011;
      this.dragVel = dx * 0.28;
    });
    const endDrag = () => { this._dragging = false; };
    host.addEventListener('pointerup', endDrag);
    host.addEventListener('pointercancel', endDrag);
  }

  setVisible(visible) {
    this.isActiveTab = Boolean(visible);
    if (this.isActiveTab) {
      this.resize();
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  resize() {
    if (!this.canvas || !this.renderer || !this.camera) return;
    const host = this.canvas.parentElement || this.canvas;
    const rect = host.getBoundingClientRect();
    const w = rect.width > 20 ? Math.round(rect.width) : 640;
    const h = rect.height > 20 ? Math.round(rect.height) : 440;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setConfig({ target, operatorId, skinId, quality }) {
    let changed = false;
    if (target && target !== this.target) { this.target = target; changed = true; }
    if (operatorId && operatorId !== this.operatorId) { this.operatorId = operatorId; changed = true; }
    if (skinId && skinId !== this.skinId) { this.skinId = skinId; changed = true; }
    if (quality && quality !== this.quality) { this.quality = quality; changed = true; }
    if (changed) {
      this.rebuild();
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  rebuild() {
    if (!this.scene) return;
    if (this.activeGroup) {
      this.scene.remove(this.activeGroup);
      this.activeGroup = null;
      this.activeSoldier = null;
    }

    if (this.target === 'operator') {
      this.pedestal.visible = true;
      const soldier = buildSoldierMesh('preview', this.operatorId.toUpperCase(), 0x38bdf8, false, {
        operatorId: this.operatorId,
        skinId: this.skinId,
        textureLib: this.textures,
        quality: this.quality === 'fast' ? 'balanced' : 'ultra',
        showNameTag: false
      });
      if (soldier.nameSprite) soldier.nameSprite.visible = false;
      this.activeSoldier = soldier;
      this.activeGroup = soldier.root;
      this.activeGroup.rotation.y = this.yawOffset;
      this.scene.add(this.activeGroup);
      this.camera.position.set(0, 1.02, 3.85);
      this.camera.lookAt(0, 0.94, 0);
    } else {
      this.pedestal.visible = false;
      const weapon = buildWeaponShowcaseMesh(this.target, {
        skinId: this.skinId,
        operatorId: this.operatorId,
        textureLib: this.textures,
        quality: this.quality === 'fast' ? 'balanced' : 'ultra'
      });
      this.activeGroup = weapon;
      this.activeGroup.rotation.y = this.yawOffset;
      this.scene.add(this.activeGroup);
      this.camera.position.set(0, 0.06, 1.25);
      this.camera.lookAt(0, 0.01, 0);
    }
  }

  _tick(now) {
    requestAnimationFrame(this._tick);
    if (engine.isRunning || !this.isActiveTab) return;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (!this._dragging) {
      if (Math.abs(this.dragVel) > 0.01) {
        this.yawOffset += this.dragVel * dt;
        this.dragVel *= Math.exp(-dt * 4.5);
      } else {
        this.yawOffset += dt * 0.42;
      }
    }

    if (this.activeGroup) {
      this.activeGroup.rotation.y = this.yawOffset;
      if (this.activeSoldier) {
        animateSoldierModel(this.activeSoldier, dt, 0, 0, false);
      }
    }
    this.renderer.render(this.scene, this.camera);
  }
}

const armoryPreview = new ArmoryPreviewBay(
  document.getElementById('loadout-preview-canvas'),
  engine.textures
);

// Hardware 4K Guard & Tabbed Lobby Wiring
ui.syncCapability(engine.capability);
ui.syncQualityControls(engine.quality);

let activeLobbyTab = 'play';
function openLobbyTab(tabId) {
  activeLobbyTab = ui.setActiveTab(tabId);
  armoryPreview.setVisible(activeLobbyTab === 'armory');
  if (activeLobbyTab === 'armory') {
    requestAnimationFrame(() => armoryPreview.resize());
  }
}

if (ui.el.navTabs) {
  ui.el.navTabs.forEach((btn) => {
    btn.addEventListener('click', () => openLobbyTab(btn.dataset.tab));
  });
}
if (ui.el.btnQuickArmory) {
  ui.el.btnQuickArmory.addEventListener('click', () => openLobbyTab('armory'));
}
if (ui.el.btnArmoryBack) {
  ui.el.btnArmoryBack.addEventListener('click', () => openLobbyTab('play'));
}

function applyLoadoutSelection() {
  const operatorId = ui.el.loadoutOperator?.value || 'vanguard';
  const skinId = ui.el.loadoutSkin?.value || 'factory';
  engine.setLoadout(operatorId, skinId);
  ui.updateArmoryTag(operatorId, skinId);
  armoryPreview.setConfig({ operatorId, skinId });
}

if (ui.el.loadoutOperator) {
  ui.el.loadoutOperator.addEventListener('change', applyLoadoutSelection);
}
if (ui.el.loadoutSkin) {
  ui.el.loadoutSkin.addEventListener('change', applyLoadoutSelection);
}
if (ui.el.previewTabs) {
  ui.el.previewTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      ui.el.previewTabs.forEach((b) => b.classList.toggle('active', b === btn));
      armoryPreview.setConfig({ target: btn.dataset.target });
    });
  });
}

// Live Graphics Tier switching from Menu Header Bar & Settings Modal
function applyGraphicsTier(quality, forceAllowUltra = false) {
  const autoFps = ui.el.settingAutofps ? ui.el.settingAutofps.checked : true;
  engine.setQuality(quality, autoFps, forceAllowUltra);
  ui.syncQualityControls(engine.quality);
  armoryPreview.setConfig({ quality: engine.quality });
}

if (ui.el.tierButtons) {
  ui.el.tierButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      applyGraphicsTier(btn.dataset.quality);
    });
  });
}
if (ui.el.settingQuality) {
  ui.el.settingQuality.addEventListener('change', (e) => {
    applyGraphicsTier(e.target.value);
  });
}

if (ui.el.mapPills) {
  ui.el.mapPills.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mapId = btn.dataset.map;
      ui.syncMapPills(mapId);
      engine.previewMenuMap(mapId);
    });
  });
}

const practiceMapSelect = document.getElementById('practice-map');
if (practiceMapSelect) {
  practiceMapSelect.addEventListener('change', (e) => {
    ui.syncMapPills(e.target.value);
    engine.previewMenuMap(e.target.value);
  });
}
applyLoadoutSelection();
openLobbyTab('play');

// ---------------------------------------------------------------------------
// Firebase Lobby & Matchmaking
// ---------------------------------------------------------------------------
let currentRoom = null;
let lobbyPollTimer = null;

async function refreshRooms() {
  if (!network.db || !network.user || engine.isRunning) {
    if (!network.user) ui.renderRoomList([], () => {});
    return;
  }
  try {
    const rooms = await network.listRooms();
    ui.renderRoomList(rooms, async (code) => {
      ui.setMpFeedback('');
      try {
        await network.joinRoom(code);
      } catch (err) {
        ui.setMpFeedback(err.message || 'Could not join room.');
      }
    });
  } catch (err) {
    console.warn('Room list error:', err);
  }
}

network.onAuthChange = (user) => {
  ui.updateFirebaseStatus(isFirebaseConfigured(), user);
  ui.setMpFeedback('');
  if (user) {
    refreshRooms();
    if (!lobbyPollTimer) {
      lobbyPollTimer = setInterval(refreshRooms, 4000);
    }
  } else {
    currentRoom = null;
    if (lobbyPollTimer) {
      clearInterval(lobbyPollTimer);
      lobbyPollTimer = null;
    }
    ui.updateWaitingRoom(null, '');
    ui.renderRoomList([], () => {});
  }
};

network.onRoomUpdate = (room) => {
  currentRoom = room;
  if (!room) {
    ui.updateWaitingRoom(null, '');
    if (engine.isRunning && engine.mode === 'multiplayer') {
      engine.quitMatch();
    }
    refreshRooms();
    return;
  }

  if (room.status === 'waiting') {
    ui.updateWaitingRoom(room, network.user?.uid || '');
  } else if (room.status === 'playing') {
    if (!engine.isRunning) {
      engine.startMultiplayerMatch(room, network.user);
    } else if (room.roundStartAt && room.roundStartAt !== engine.matchStartAt) {
      engine.resetMultiplayerRound(room);
    } else {
      engine.handleNetworkRoomUpdate(room);
    }
  }
};

network.onPlayerChange = (uid, data) => {
  engine.handleSinglePlayerChange(uid, data);
};

network.onPlayerRemove = (uid) => {
  engine.handleSinglePlayerRemove(uid);
};

network.onPlayersUpdate = (players) => {
  engine.mpPlayers = players || {};
};

network.onEvent = (ev) => {
  engine.handleNetworkEvent(ev);
};

network.initialize().then((configured) => {
  ui.updateFirebaseStatus(configured, network.user);
});

// Auth buttons
document.getElementById('btn-google-login').addEventListener('click', async () => {
  sound.unlock();
  ui.setMpFeedback('');
  try {
    await network.signInWithGoogle();
  } catch (err) {
    ui.setMpFeedback(err.message || 'Google Sign-In failed.');
  }
});

document.getElementById('btn-signout').addEventListener('click', async () => {
  await network.signOutUser();
});

// Solo Bot Practice
document.getElementById('btn-start-practice').addEventListener('click', () => {
  sound.unlock();
  const mapId = document.getElementById('practice-map').value;
  const botCount = Number(document.getElementById('practice-bots').value);
  const difficulty = document.getElementById('practice-difficulty').value;
  const killLimit = Number(document.getElementById('practice-kills').value);
  const operatorId = ui.el.loadoutOperator?.value || 'vanguard';
  const skinId = ui.el.loadoutSkin?.value || 'factory';
  engine.startPracticeMatch({
    mapId,
    botCount,
    killLimit,
    difficulty,
    operatorId,
    skinId,
    playerName: network.user?.displayName || 'Operator'
  });
});

// Multiplayer Lobby
document.getElementById('btn-refresh-rooms').addEventListener('click', refreshRooms);

document.getElementById('btn-create-room').addEventListener('click', async () => {
  sound.unlock();
  ui.setMpFeedback('');
  if (!network.user) {
    ui.setMpFeedback('Sign in with Google first to create a room.');
    return;
  }
  const mapId = document.getElementById('mp-map').value;
  const [killLimit, durationSec] = document.getElementById('mp-rules').value.split('-').map(Number);
  try {
    await network.createRoom({ mapId, killLimit, durationSec });
  } catch (err) {
    ui.setMpFeedback(err.message || 'Could not create room.');
  }
});

document.getElementById('btn-join-code').addEventListener('click', async () => {
  sound.unlock();
  ui.setMpFeedback('');
  const code = document.getElementById('input-room-code').value;
  try {
    await network.joinRoom(code);
  } catch (err) {
    ui.setMpFeedback(err.message || 'Could not join room.');
  }
});

document.getElementById('btn-leave-room').addEventListener('click', async () => {
  await network.leaveRoom();
  ui.updateWaitingRoom(null, '');
  refreshRooms();
});

document.getElementById('btn-start-mp-match').addEventListener('click', async () => {
  sound.unlock();
  await network.startMatch();
});

// In-Game HUD buttons
document.getElementById('btn-pause').addEventListener('click', () => {
  if (engine.isRunning) engine.setPaused(true);
});

document.getElementById('btn-scoreboard').addEventListener('click', () => {
  if (!engine.isRunning) return;
  const hidden = ui.el.scoreboardOverlay.classList.contains('hidden');
  if (hidden) engine._refreshScoreboard(engine.roundEnded);
  ui.setScoreboardVisible(hidden);
});

document.getElementById('btn-close-sb').addEventListener('click', () => {
  ui.setScoreboardVisible(false);
});

document.getElementById('btn-next-round').addEventListener('click', () => {
  ui.setScoreboardVisible(false);
  engine.restartRound();
});

document.getElementById('btn-leave-match').addEventListener('click', async () => {
  engine.quitMatch();
  if (currentRoom) await network.leaveRoom();
  refreshRooms();
});

ui.el.weaponSlots.forEach((btn) => {
  btn.addEventListener('click', () => {
    const slot = Number(btn.dataset.slot);
    engine.switchWeapon(slot);
  });
});

// Settings Modal
document.getElementById('btn-open-settings').addEventListener('click', () => {
  ui.syncQualityControls(engine.quality);
  ui.openSettings(engine.isRunning);
});

document.getElementById('btn-close-settings').addEventListener('click', () => {
  if (engine.isRunning) engine.setPaused(false);
  else ui.closeSettings();
});

document.getElementById('btn-resume-game').addEventListener('click', () => {
  const quality = ui.el.settingQuality.value;
  const autoFps = ui.el.settingAutofps.checked;
  const inputMode = ui.el.settingInputMode.value;
  const sens = Number(ui.el.settingSensitivity.value);
  const soundOn = ui.el.settingSound.checked;

  engine.setQuality(quality, autoFps);
  ui.syncQualityControls(engine.quality);
  armoryPreview.setConfig({ quality: engine.quality });
  engine.controller.setOverrideMode(inputMode);
  engine.controller.setSensitivity(sens);
  sound.setEnabled(soundOn);

  if (engine.isRunning) engine.setPaused(false);
  else ui.closeSettings();
});

ui.el.settingSensitivity.addEventListener('input', (e) => {
  ui.el.sensVal.textContent = Number(e.target.value).toFixed(1);
});

document.getElementById('btn-quit-match').addEventListener('click', async () => {
  engine.quitMatch();
  if (currentRoom) await network.leaveRoom();
  refreshRooms();
});

// ---------------------------------------------------------------------------
// Automated Headless E2E Verification Hook (?e2e=menu | harbor | desert | snow | fast)
// ---------------------------------------------------------------------------
const e2eParams = new URLSearchParams(window.location.search);
const e2eMode = e2eParams.get('e2e');
if (e2eMode) {
  const op = e2eParams.get('op') || 'vanguard';
  const skin = e2eParams.get('skin') || 'damascus';
  const quality = e2eParams.get('quality') || 'balanced';
  const target = e2eParams.get('target') || 'operator';
  const tab = e2eParams.get('tab') || 'play';
  const mapPreview = e2eParams.get('map');

  if (ui.el.loadoutOperator) ui.el.loadoutOperator.value = op;
  if (ui.el.loadoutSkin) ui.el.loadoutSkin.value = skin;
  applyLoadoutSelection();
  applyGraphicsTier(quality, true);
  if (ui.el.previewTabs) {
    ui.el.previewTabs.forEach((b) => b.classList.toggle('active', b.dataset.target === target));
  }
  armoryPreview.setConfig({ target, operatorId: op, skinId: skin, quality: engine.quality });

  if (e2eMode === 'menu') {
    if (mapPreview) {
      ui.syncMapPills(mapPreview);
      engine.previewMenuMap(mapPreview);
    }
    openLobbyTab(tab);
  } else if (e2eMode === 'harbor' || e2eMode === 'desert' || e2eMode === 'snow') {
    engine.startPracticeMatch({
      mapId: e2eMode,
      botCount: 4,
      killLimit: 15,
      difficulty: 'tactical',
      operatorId: op,
      skinId: skin,
      playerName: 'ColdboreLead'
    });
    const slot = Number(e2eParams.get('slot') || 0);
    engine.switchWeapon(slot);

    // Position camera at a scenic vantage point to verify biome landmarks + 1P weapon + HUD
    if (e2eMode === 'harbor') {
      // Overlooking container yard, forklift, sandy beach cove & shipping channel with cargo ship
      const gx = Number(e2eParams.get('x') ?? 24);
      const gz = Number(e2eParams.get('z') ?? -30);
      const gy = (engine.mapData.terrainHeightFn ? engine.mapData.terrainHeightFn(gx, gz) : 0) + 1.75;
      engine.controller.pos.set(gx, gy, gz);
      engine.controller.yaw = Number(e2eParams.get('yaw') ?? -0.35);
      engine.controller.pitch = Number(e2eParams.get('pitch') ?? -0.04);
    } else if (e2eMode === 'desert') {
      // Overlooking stepped desert temple courtyard, obelisks, guardian sculptures, broken vases & sand mounds
      const gx = Number(e2eParams.get('x') ?? -20);
      const gz = Number(e2eParams.get('z') ?? 24);
      const gy = (engine.mapData.terrainHeightFn ? engine.mapData.terrainHeightFn(gx, gz) : 0) + 1.75;
      engine.controller.pos.set(gx, gy, gz);
      engine.controller.yaw = Number(e2eParams.get('yaw') ?? -0.68);
      engine.controller.pitch = Number(e2eParams.get('pitch') ?? -0.04);
    } else if (e2eMode === 'snow') {
      // Overlooking walkable glacier viaduct bridge arch, snowcat vehicle, ice spires & alpine bunker
      const gx = Number(e2eParams.get('x') ?? -16);
      const gz = Number(e2eParams.get('z') ?? 24);
      const gy = (engine.mapData.terrainHeightFn ? engine.mapData.terrainHeightFn(gx, gz) : 0) + 1.75;
      engine.controller.pos.set(gx, gy, gz);
      engine.controller.yaw = Number(e2eParams.get('yaw') ?? -0.52);
      engine.controller.pitch = Number(e2eParams.get('pitch') ?? -0.04);
    }
  }
}
