import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  ref,
  set,
  get,
  update,
  push,
  remove,
  onValue,
  onChildAdded,
  onDisconnect,
  serverTimestamp
} from 'firebase/database';
import { initFirebase } from './config.js';

function randomRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

export class NetworkManager {
  constructor() {
    this.auth = null;
    this.db = null;
    this.user = null;
    this.roomId = null;
    this.isHost = false;
    this.playerDisconnectRef = null;
    this.unsubscribers = [];
    this.lastStateSend = 0;
    this.pingMs = 0;
    this.pingTimer = null;

    this.onAuthChange = null;
    this.onRoomUpdate = null;
    this.onEvent = null;
    this.onPlayersUpdate = null;
  }

  async initialize() {
    const services = await initFirebase();
    if (!services) {
      this.auth = null;
      this.db = null;
      return false;
    }

    this.auth = services.auth;
    this.db = services.db;

    try {
      await getRedirectResult(this.auth);
    } catch {
      // Ignore stale redirect state
    }

    onAuthStateChanged(this.auth, (user) => {
      this.user = user;
      if (this.onAuthChange) this.onAuthChange(user);
    });

    return true;
  }

  async signInWithGoogle() {
    if (!this.auth) throw new Error('Firebase unavailable.');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(this.auth, provider);
    } catch (err) {
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(this.auth, provider);
      } else {
        throw err;
      }
    }
  }

  async signOutUser() {
    await this.leaveRoom();
    if (this.auth) {
      await signOut(this.auth);
    }
  }

  async listRooms() {
    if (!this.db) return [];
    const snap = await get(ref(this.db, 'rooms'));
    if (!snap.exists()) return [];
    const rooms = [];
    const now = Date.now();
    snap.forEach((child) => {
      const val = child.val();
      const playerCount = val.players ? Object.keys(val.players).length : 0;
      const ageMs = now - (val.createdAt || now);
      if (playerCount > 0 && playerCount < 5 && ageMs < 1000 * 60 * 60) {
        rooms.push({
          id: child.key,
          mapId: val.mapId || 'harbor',
          killLimit: val.killLimit || 15,
          durationSec: val.durationSec || 180,
          status: val.status || 'waiting',
          hostName: val.hostName || 'Operator',
          playerCount
        });
      }
    });
    return rooms;
  }

  async createRoom({ mapId, killLimit, durationSec }) {
    if (!this.db || !this.user) throw new Error('Please sign in with Google first.');
    await this.leaveRoom();

    const code = randomRoomCode();
    const roomRef = ref(this.db, `rooms/${code}`);
    await set(roomRef, {
      mapId,
      killLimit,
      durationSec,
      status: 'waiting',
      hostUid: this.user.uid,
      hostName: (this.user.displayName || 'Operator').slice(0, 18),
      createdAt: Date.now(),
      roundStartAt: 0
    });

    await this._joinRoomInternal(code, true);
    return code;
  }

  async joinRoom(rawCode) {
    if (!this.db || !this.user) throw new Error('Please sign in with Google first.');
    const code = rawCode.trim().toUpperCase();
    if (!code) throw new Error('Enter a room code.');

    const snap = await get(ref(this.db, `rooms/${code}`));
    if (!snap.exists()) throw new Error(`Room ${code} not found.`);
    const room = snap.val();
    const playerCount = room.players ? Object.keys(room.players).length : 0;
    if (playerCount >= 5 && !room.players?.[this.user.uid]) {
      throw new Error(`Room ${code} is full (max 5 players).`);
    }

    await this.leaveRoom();
    await this._joinRoomInternal(code, room.hostUid === this.user.uid);
    return code;
  }

  async _joinRoomInternal(code, isHost) {
    this.roomId = code;
    this.isHost = isHost;

    const playerRef = ref(this.db, `rooms/${code}/players/${this.user.uid}`);
    const initialPlayer = {
      uid: this.user.uid,
      name: (this.user.displayName || 'Operator').slice(0, 18),
      photoURL: this.user.photoURL || '',
      alive: true,
      hp: 100,
      kills: 0,
      deaths: 0,
      x: 0,
      y: 1.7,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: 0,
      pitch: 0,
      weapon: 0,
      inTankId: -1,
      updatedAt: serverTimestamp()
    };

    await set(playerRef, initialPlayer);
    this.playerDisconnectRef = onDisconnect(playerRef);
    await this.playerDisconnectRef.remove();

    const metaUnsub = onValue(ref(this.db, `rooms/${code}`), (snap) => {
      if (!snap.exists()) {
        if (this.onRoomUpdate) this.onRoomUpdate(null);
        return;
      }
      const data = snap.val();
      this.isHost = data.hostUid === this.user?.uid;
      if (this.onRoomUpdate) this.onRoomUpdate({ id: code, ...data });
    });

    const playersUnsub = onValue(ref(this.db, `rooms/${code}/players`), (snap) => {
      const players = snap.exists() ? snap.val() : {};
      if (this.onPlayersUpdate) this.onPlayersUpdate(players);
    });

    const joinedAt = Date.now() - 1200;
    const eventsUnsub = onChildAdded(ref(this.db, `rooms/${code}/events`), (snap) => {
      const ev = snap.val();
      if (!ev || (ev.ts && ev.ts < joinedAt)) return;
      if (this.onEvent) this.onEvent(ev, snap.key);
    });

    this.unsubscribers.push(metaUnsub, playersUnsub, eventsUnsub);
    this._startPingLoop();
  }

  _startPingLoop() {
    this._stopPingLoop();
    const probe = async () => {
      if (!this.db || !this.roomId || !this.user) return;
      const t0 = performance.now();
      try {
        await set(ref(this.db, `rooms/${this.roomId}/players/${this.user.uid}/pingAt`), Date.now());
        const rtt = Math.max(1, Math.round(performance.now() - t0));
        this.pingMs = this.pingMs ? Math.round(this.pingMs * 0.55 + rtt * 0.45) : rtt;
      } catch {
        // Ignore transient probe failures
      }
    };
    probe();
    this.pingTimer = setInterval(probe, 2500);
  }

  _stopPingLoop() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    this.pingMs = 0;
  }

  async startMatch() {
    if (!this.db || !this.roomId || !this.isHost) return;
    const roundStartAt = Date.now();
    await update(ref(this.db, `rooms/${this.roomId}`), {
      status: 'playing',
      roundStartAt,
      events: null,
      tanks: {
        0: { hp: 350, driverUid: '', x: -24, z: 0, yaw: -Math.PI / 2, turretYaw: -Math.PI / 2 },
        1: { hp: 350, driverUid: '', x: 24, z: 0, yaw: Math.PI / 2, turretYaw: Math.PI / 2 }
      }
    });
  }

  async restartRound() {
    if (!this.db || !this.roomId || !this.isHost) return;
    const snap = await get(ref(this.db, `rooms/${this.roomId}/players`));
    const roundStartAt = Date.now();
    const updates = {
      status: 'playing',
      roundStartAt,
      events: null,
      tanks: {
        0: { hp: 350, driverUid: '', x: -24, z: 0, yaw: -Math.PI / 2, turretYaw: -Math.PI / 2 },
        1: { hp: 350, driverUid: '', x: 24, z: 0, yaw: Math.PI / 2, turretYaw: Math.PI / 2 }
      }
    };
    if (snap.exists()) {
      snap.forEach((child) => {
        updates[`players/${child.key}/kills`] = 0;
        updates[`players/${child.key}/deaths`] = 0;
        updates[`players/${child.key}/hp`] = 100;
        updates[`players/${child.key}/alive`] = true;
        updates[`players/${child.key}/inTankId`] = -1;
      });
    }
    await update(ref(this.db, `rooms/${this.roomId}`), updates);
    await this.sendEvent({ type: 'roundReset', roundStartAt });
  }

  syncPlayerState(state, force = false) {
    if (!this.db || !this.roomId || !this.user) return;
    const now = performance.now();
    if (!force && now - this.lastStateSend < 36) return; // ~28 Hz responsive sync
    this.lastStateSend = now;

    const payload = {
      ...state,
      x: round2(state.x),
      y: round2(state.y),
      z: round2(state.z),
      vx: round2(state.vx || 0),
      vy: round2(state.vy || 0),
      vz: round2(state.vz || 0),
      yaw: round2(state.yaw),
      pitch: round2(state.pitch),
      updatedAt: Date.now()
    };

    update(ref(this.db, `rooms/${this.roomId}/players/${this.user.uid}`), payload).catch(() => {});
  }

  syncTankState(tankId, tankState) {
    if (!this.db || !this.roomId) return;
    const payload = { ...tankState };
    if (typeof payload.x === 'number') payload.x = round2(payload.x);
    if (typeof payload.z === 'number') payload.z = round2(payload.z);
    if (typeof payload.yaw === 'number') payload.yaw = round2(payload.yaw);
    if (typeof payload.turretYaw === 'number') payload.turretYaw = round2(payload.turretYaw);
    update(ref(this.db, `rooms/${this.roomId}/tanks/${tankId}`), payload).catch(() => {});
  }

  async sendEvent(payload) {
    if (!this.db || !this.roomId || !this.user) return;
    const evRef = push(ref(this.db, `rooms/${this.roomId}/events`));
    await set(evRef, {
      ...payload,
      senderUid: this.user.uid,
      ts: Date.now()
    });
  }

  async leaveRoom() {
    this._stopPingLoop();
    for (const unsub of this.unsubscribers) {
      try { unsub(); } catch {}
    }
    this.unsubscribers = [];

    if (this.playerDisconnectRef) {
      try { await this.playerDisconnectRef.cancel(); } catch {}
      this.playerDisconnectRef = null;
    }

    if (this.db && this.roomId && this.user) {
      const code = this.roomId;
      const uid = this.user.uid;
      this.roomId = null;
      this.isHost = false;
      try {
        await remove(ref(this.db, `rooms/${code}/players/${uid}`));
        const snap = await get(ref(this.db, `rooms/${code}/players`));
        if (!snap.exists() || snap.numChildren() === 0) {
          await remove(ref(this.db, `rooms/${code}`));
        }
      } catch {
        // Ignore cleanup errors
      }
    } else {
      this.roomId = null;
      this.isHost = false;
    }
  }
}
