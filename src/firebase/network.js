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
import { initFirebase, reinitFirebase } from './config.js';

function randomRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export class NetworkManager {
  constructor() {
    this.auth = null;
    this.db = null;
    this.user = null;
    this.roomId = null;
    this.isHost = false;
    this.unsubscribers = [];
    this.lastStateSend = 0;
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

  async reloadConfig() {
    const services = await reinitFirebase();
    if (!services) {
      this.auth = null;
      this.db = null;
      this.user = null;
      if (this.onAuthChange) this.onAuthChange(null);
      return false;
    }
    this.auth = services.auth;
    this.db = services.db;
    onAuthStateChanged(this.auth, (user) => {
      this.user = user;
      if (this.onAuthChange) this.onAuthChange(user);
    });
    return true;
  }

  async signInWithGoogle() {
    if (!this.auth) throw new Error('Firebase is not configured yet.');
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
      if (playerCount > 0 && playerCount < 5 && ageMs < 1000 * 60 * 90) {
        rooms.push({
          id: child.key,
          mapId: val.mapId || 'compound',
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
    if (!this.db || !this.user) throw new Error('Sign in with Google first.');
    await this.leaveRoom();

    const code = randomRoomCode();
    const roomRef = ref(this.db, `rooms/${code}`);
    await set(roomRef, {
      mapId,
      killLimit,
      durationSec,
      status: 'waiting',
      hostUid: this.user.uid,
      hostName: this.user.displayName || 'Operator',
      createdAt: Date.now(),
      roundStartAt: null
    });

    await this._joinRoomInternal(code, true);
    return code;
  }

  async joinRoom(rawCode) {
    if (!this.db || !this.user) throw new Error('Sign in with Google first.');
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
      yaw: 0,
      pitch: 0,
      weapon: 0,
      inTankId: -1,
      tankYaw: 0,
      tankTurretYaw: 0,
      updatedAt: serverTimestamp()
    };

    await set(playerRef, initialPlayer);
    onDisconnect(playerRef).remove();

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

    const joinedAt = Date.now() - 1000;
    const eventsUnsub = onChildAdded(ref(this.db, `rooms/${code}/events`), (snap) => {
      const ev = snap.val();
      if (!ev || (ev.ts && ev.ts < joinedAt)) return;
      if (this.onEvent) this.onEvent(ev, snap.key);
    });

    this.unsubscribers.push(metaUnsub, playersUnsub, eventsUnsub);
  }

  async startMatch() {
    if (!this.db || !this.roomId || !this.isHost) return;
    await update(ref(this.db, `rooms/${this.roomId}`), {
      status: 'playing',
      roundStartAt: Date.now(),
      tanks: {
        0: { hp: 350, driverUid: '', x: -20, z: -18, yaw: 0, turretYaw: 0, destroyedAt: 0 },
        1: { hp: 350, driverUid: '', x: 20, z: 18, yaw: Math.PI, turretYaw: Math.PI, destroyedAt: 0 }
      }
    });
  }

  async restartRound() {
    if (!this.db || !this.roomId || !this.isHost) return;
    const snap = await get(ref(this.db, `rooms/${this.roomId}/players`));
    const updates = {
      status: 'playing',
      roundStartAt: Date.now(),
      events: null
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
    await this.sendEvent({ type: 'roundReset' });
  }

  syncPlayerState(state) {
    if (!this.db || !this.roomId || !this.user) return;
    const now = performance.now();
    if (now - this.lastStateSend < 50) return; // 20 Hz cap
    this.lastStateSend = now;

    update(ref(this.db, `rooms/${this.roomId}/players/${this.user.uid}`), {
      ...state,
      updatedAt: Date.now()
    }).catch(() => {});
  }

  syncTankState(tankId, tankState) {
    if (!this.db || !this.roomId) return;
    update(ref(this.db, `rooms/${this.roomId}/tanks/${tankId}`), tankState).catch(() => {});
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
    for (const unsub of this.unsubscribers) {
      try { unsub(); } catch {}
    }
    this.unsubscribers = [];

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
        // Ignore cleanup errors on disconnect
      }
    } else {
      this.roomId = null;
      this.isHost = false;
    }
  }
}
