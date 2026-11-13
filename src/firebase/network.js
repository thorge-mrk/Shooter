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
  onChildChanged,
  onChildRemoved,
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
    this.pingDisconnectRef = null;
    this.unsubscribers = [];
    this.lastStateSend = 0;
    this.lastPos = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };
    this.pingMs = 0;
    this.serverTimeOffset = 0;
    this.pingTimer = null;
    this.playersMap = {};

    this.onAuthChange = null;
    this.onRoomUpdate = null;
    this.onEvent = null;
    this.onPlayerChange = null;
    this.onPlayerRemove = null;
    this.onPlayersUpdate = null;
  }

  getServerNow() {
    return Date.now() + this.serverTimeOffset;
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

    // Track Firebase server clock offset so all clients share a unified timeline for snapshot interpolation
    onValue(ref(this.db, '.info/serverTimeOffset'), (snap) => {
      this.serverTimeOffset = snap.val() || 0;
    });

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
    this.playersMap = {};

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
      t: this.getServerNow(),
      updatedAt: serverTimestamp()
    };

    await set(playerRef, initialPlayer);
    this.playerDisconnectRef = onDisconnect(playerRef);
    await this.playerDisconnectRef.remove();

    const pingRef = ref(this.db, `rooms/${code}/pings/${this.user.uid}`);
    this.pingDisconnectRef = onDisconnect(pingRef);
    await this.pingDisconnectRef.remove();

    // Listen to room metadata & tanks (lightweight fields)
    const metaUnsub = onValue(ref(this.db, `rooms/${code}`), (snap) => {
      if (!snap.exists()) {
        if (this.onRoomUpdate) this.onRoomUpdate(null);
        return;
      }
      const data = snap.val();
      this.isHost = data.hostUid === this.user?.uid;
      if (this.onRoomUpdate) this.onRoomUpdate({ id: code, ...data });
    });

    // Per-player child listeners so only changed remote players are processed (no self-echo!)
    const playersRef = ref(this.db, `rooms/${code}/players`);
    const handleUpsert = (snap) => {
      const uid = snap.key;
      const val = snap.val();
      if (!val) return;
      this.playersMap[uid] = val;
      if (uid !== this.user?.uid && this.onPlayerChange) {
        this.onPlayerChange(uid, val);
      }
      if (this.onPlayersUpdate) {
        this.onPlayersUpdate(this.playersMap);
      }
    };

    const pAdd = onChildAdded(playersRef, handleUpsert);
    const pChg = onChildChanged(playersRef, handleUpsert);
    const pRem = onChildRemoved(playersRef, (snap) => {
      const uid = snap.key;
      delete this.playersMap[uid];
      if (this.onPlayerRemove) this.onPlayerRemove(uid);
      if (this.onPlayersUpdate) this.onPlayersUpdate(this.playersMap);
    });

    const joinedAt = this.getServerNow() - 1200;
    const eventsUnsub = onChildAdded(ref(this.db, `rooms/${code}/events`), (snap) => {
      const ev = snap.val();
      if (!ev || (ev.ts && ev.ts < joinedAt)) return;
      if (this.onEvent) this.onEvent(ev, snap.key);
    });

    this.unsubscribers.push(metaUnsub, pAdd, pChg, pRem, eventsUnsub);
    this._startPingLoop();
  }

  _startPingLoop() {
    this._stopPingLoop();
    const probe = async () => {
      if (!this.db || !this.roomId || !this.user) return;
      const t0 = performance.now();
      try {
        // Write to isolated pings/${uid} node so players/* listeners don't receive useless ping noise
        await set(ref(this.db, `rooms/${this.roomId}/pings/${this.user.uid}`), Date.now());
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
    const moved = Math.abs(state.x - this.lastPos.x) > 0.02 ||
      Math.abs(state.y - this.lastPos.y) > 0.02 ||
      Math.abs(state.z - this.lastPos.z) > 0.02 ||
      Math.abs(state.yaw - this.lastPos.yaw) > 0.02 ||
      Math.abs(state.pitch - this.lastPos.pitch) > 0.02;

    const minInterval = moved ? 33 : 180; // 30 Hz when moving, 5.5 Hz heartbeat when idle
    if (!force && now - this.lastStateSend < minInterval) return;

    this.lastStateSend = now;
    this.lastPos = { x: state.x, y: state.y, z: state.z, yaw: state.yaw, pitch: state.pitch };

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
      t: this.getServerNow()
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
      ts: this.getServerNow()
    });
  }

  async leaveRoom() {
    this._stopPingLoop();
    for (const unsub of this.unsubscribers) {
      try { unsub(); } catch {}
    }
    this.unsubscribers = [];
    this.playersMap = {};

    if (this.playerDisconnectRef) {
      try { await this.playerDisconnectRef.cancel(); } catch {}
      this.playerDisconnectRef = null;
    }
    if (this.pingDisconnectRef) {
      try { await this.pingDisconnectRef.cancel(); } catch {}
      this.pingDisconnectRef = null;
    }

    if (this.db && this.roomId && this.user) {
      const code = this.roomId;
      const uid = this.user.uid;
      this.roomId = null;
      this.isHost = false;
      try {
        await remove(ref(this.db, `rooms/${code}/players/${uid}`));
        await remove(ref(this.db, `rooms/${code}/pings/${uid}`));
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
