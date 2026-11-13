import { isFirebaseConfigured } from './firebase/config.js';
import { NetworkManager } from './firebase/network.js';
import { SoundEngine } from './audio/SoundEngine.js';
import { UIManager } from './ui/UIManager.js';
import { GameEngine } from './game/GameEngine.js';

const sound = new SoundEngine();
const network = new NetworkManager();
const ui = new UIManager();
const engine = new GameEngine({
  container: document.getElementById('game-container'),
  soundEngine: sound,
  network,
  ui
});

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

network.onPlayersUpdate = (players) => {
  engine.handleRemotePlayersUpdate(players);
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
  engine.startPracticeMatch({
    mapId,
    botCount,
    killLimit,
    difficulty,
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
