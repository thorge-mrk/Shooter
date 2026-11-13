export class UIManager {
  constructor() {
    this.el = {
      menuOverlay: document.getElementById('menu-overlay'),
      hud: document.getElementById('hud'),
      sniperScope: document.getElementById('sniper-scope'),
      damageVignette: document.getElementById('damage-vignette'),
      hudTelemetry: document.getElementById('hud-telemetry'),
      inputModeBadge: document.getElementById('input-mode-badge'),
      hudTimer: document.getElementById('hud-timer'),
      hudGoal: document.getElementById('hud-goal'),
      hudPlayersCount: document.getElementById('hud-players-count'),
      killfeed: document.getElementById('killfeed'),
      crosshair: document.getElementById('crosshair'),
      hitmarker: document.getElementById('hitmarker'),
      interactPrompt: document.getElementById('interact-prompt'),
      interactText: document.getElementById('interact-text'),
      eliminationBanner: document.getElementById('elimination-banner'),
      elimSub: document.getElementById('elim-sub'),
      pointerLockHint: document.getElementById('pointer-lock-hint'),
      hudHp: document.getElementById('hud-hp'),
      hudHpBar: document.getElementById('hud-hp-bar'),
      tankStatusCard: document.getElementById('tank-status-card'),
      hudTankHp: document.getElementById('hud-tank-hp'),
      hudTankBar: document.getElementById('hud-tank-bar'),
      hudCannonReady: document.getElementById('hud-cannon-ready'),
      hudCoaxAmmo: document.getElementById('hud-coax-ammo'),
      hudWeaponName: document.getElementById('hud-weapon-name'),
      hudAmmoMag: document.getElementById('hud-ammo-mag'),
      hudAmmoRes: document.getElementById('hud-ammo-res'),
      hudReloading: document.getElementById('hud-reloading'),
      hudGrenadesBadge: document.getElementById('hud-grenades-badge'),
      weaponSlots: Array.from(document.querySelectorAll('.weapon-slot')),
      touchControls: document.getElementById('touch-controls'),
      touchMoveZone: document.getElementById('touch-move-zone'),
      touchTankBtn: document.getElementById('t-btn-tank'),
      scoreboardOverlay: document.getElementById('scoreboard-overlay'),
      sbTitle: document.getElementById('sb-title'),
      sbSubtitle: document.getElementById('sb-subtitle'),
      sbBody: document.getElementById('sb-body'),
      sbRoundEndActions: document.getElementById('sb-round-end-actions'),
      sbWinnerText: document.getElementById('sb-winner-text'),
      btnCloseSb: document.getElementById('btn-close-sb'),
      btnNextRound: document.getElementById('btn-next-round'),
      btnLeaveMatch: document.getElementById('btn-leave-match'),

      fbStatusPill: document.getElementById('firebase-status-pill'),
      userProfile: document.getElementById('user-profile'),
      userAvatar: document.getElementById('user-avatar'),
      userName: document.getElementById('user-name'),
      userEmail: document.getElementById('user-email'),
      signinPrompt: document.getElementById('signin-prompt'),
      mpFeedback: document.getElementById('mp-feedback'),
      roomList: document.getElementById('room-list'),
      waitingRoom: document.getElementById('waiting-room'),
      wrCode: document.getElementById('wr-code'),
      wrMeta: document.getElementById('wr-meta'),
      wrPlayers: document.getElementById('wr-players'),
      btnStartMpMatch: document.getElementById('btn-start-mp-match'),
      wrWaitNote: document.getElementById('wr-wait-note'),

      settingsModal: document.getElementById('settings-modal'),
      btnQuitMatch: document.getElementById('btn-quit-match'),
      settingQuality: document.getElementById('setting-quality'),
      settingAutofps: document.getElementById('setting-autofps'),
      settingInputMode: document.getElementById('setting-input-mode'),
      settingSensitivity: document.getElementById('setting-sensitivity'),
      sensVal: document.getElementById('sens-val'),
      settingSound: document.getElementById('setting-sound')
    };

    this.hitmarkerTimer = null;
    this.damageTimer = null;
  }

  showMenu() {
    this.el.menuOverlay.classList.remove('hidden');
    this.el.hud.classList.add('hidden');
    this.el.sniperScope.classList.add('hidden');
    this.el.scoreboardOverlay.classList.add('hidden');
  }

  showHud() {
    this.el.menuOverlay.classList.add('hidden');
    this.el.hud.classList.remove('hidden');
  }

  setMpFeedback(message = '') {
    if (!message) {
      this.el.mpFeedback.classList.add('hidden');
      this.el.mpFeedback.textContent = '';
    } else {
      this.el.mpFeedback.textContent = message;
      this.el.mpFeedback.classList.remove('hidden');
    }
  }

  updateFirebaseStatus(configured, user) {
    if (!configured) {
      this.el.fbStatusPill.textContent = 'OFFLINE';
      this.el.fbStatusPill.classList.remove('online');
    } else if (user) {
      this.el.fbStatusPill.textContent = 'ONLINE';
      this.el.fbStatusPill.classList.add('online');
    } else {
      this.el.fbStatusPill.textContent = 'SIGN IN';
      this.el.fbStatusPill.classList.remove('online');
    }

    if (user) {
      this.el.userProfile.classList.remove('hidden');
      this.el.signinPrompt.classList.add('hidden');
      this.el.userName.textContent = user.displayName || 'Operator';
      this.el.userEmail.textContent = user.email || 'Google Account';
      this.el.userAvatar.src = user.photoURL || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="%2338bdf8"/></svg>';
    } else {
      this.el.userProfile.classList.add('hidden');
      this.el.signinPrompt.classList.remove('hidden');
    }
  }

  renderRoomList(rooms, onJoin) {
    this.el.roomList.innerHTML = '';
    if (!rooms || rooms.length === 0) {
      this.el.roomList.innerHTML = '<div class="room-empty">No active rooms — create one or enter a room code.</div>';
      return;
    }

    for (const r of rooms) {
      const row = document.createElement('div');
      row.className = 'room-item';
      row.innerHTML = `
        <div>
          <div class="room-item-title">${r.id} · ${r.mapId.toUpperCase()}</div>
          <div class="room-item-sub">Host: ${r.hostName} · ${r.playerCount}/5 Players · First to ${r.killLimit}</div>
        </div>
      `;
      const btn = document.createElement('button');
      btn.className = 'btn-accent';
      btn.textContent = 'JOIN';
      btn.onclick = () => onJoin(r.id);
      row.appendChild(btn);
      this.el.roomList.appendChild(row);
    }
  }

  updateWaitingRoom(room, localUid) {
    if (!room) {
      this.el.waitingRoom.classList.add('hidden');
      this.el.roomList.classList.remove('hidden');
      return;
    }

    this.el.waitingRoom.classList.remove('hidden');
    this.el.roomList.classList.add('hidden');
    this.el.wrCode.textContent = room.id;
    this.el.wrMeta.textContent = `${room.mapId.toUpperCase()} · First to ${room.killLimit} Kills`;

    const players = Object.values(room.players || {});
    this.el.wrPlayers.innerHTML = '';
    players.forEach((p) => {
      const div = document.createElement('div');
      div.className = 'wr-player-row';
      div.innerHTML = `<span>${p.name}${p.uid === room.hostUid ? ' (HOST)' : ''}</span><span>${p.uid === localUid ? 'YOU' : 'READY'}</span>`;
      this.el.wrPlayers.appendChild(div);
    });

    const isHost = room.hostUid === localUid;
    this.el.btnStartMpMatch.classList.toggle('hidden', !isHost);
    this.el.wrWaitNote.textContent = isHost
      ? `Lobby: ${players.length}/5 players connected.`
      : 'Waiting for host to launch match...';
  }

  applyInputMode(mode, pointerLocked) {
    if (mode === 'desktop') {
      this.el.inputModeBadge.textContent = 'MOUSE + KB';
      this.el.touchControls.classList.add('hidden');
      this.el.pointerLockHint.classList.toggle('hidden', pointerLocked);
    } else if (mode === 'hybrid') {
      this.el.inputModeBadge.textContent = 'KB + TOUCH AIM';
      this.el.touchControls.classList.remove('hidden');
      this.el.touchMoveZone.classList.add('hidden');
      this.el.pointerLockHint.classList.add('hidden');
    } else {
      this.el.inputModeBadge.textContent = 'TOUCH';
      this.el.touchControls.classList.remove('hidden');
      this.el.touchMoveZone.classList.remove('hidden');
      this.el.pointerLockHint.classList.add('hidden');
    }
  }

  updateHud({ hp, activeSlot, weaponState, grenadesCount, reloading, isScoped, moveSpread, inTank, tankHp, cannonReadyPct, coaxAmmo, nearTank, fps, pingMs, timerSec, killLimit, playerCount }) {
    this.el.hudTelemetry.textContent = `${Math.round(fps)} FPS · ${Math.max(1, Math.round(pingMs || 1))} ms`;

    const mins = Math.floor(Math.max(0, timerSec) / 60);
    const secs = Math.floor(Math.max(0, timerSec) % 60);
    this.el.hudTimer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    this.el.hudGoal.textContent = `FIRST TO ${killLimit}`;
    this.el.hudPlayersCount.textContent = `${playerCount}/5`;

    this.el.hudHp.textContent = Math.max(0, Math.ceil(hp));
    this.el.hudHpBar.style.width = `${Math.max(0, Math.min(100, hp))}%`;

    this.el.tankStatusCard.classList.toggle('hidden', !inTank);
    if (inTank) {
      this.el.hudTankHp.textContent = Math.max(0, Math.ceil(tankHp));
      this.el.hudTankBar.style.width = `${Math.max(0, Math.min(100, (tankHp / 350) * 100))}%`;
      this.el.hudCannonReady.textContent = cannonReadyPct >= 1 ? 'CANNON READY' : `RELOAD ${Math.round(cannonReadyPct * 100)}%`;
      this.el.hudCoaxAmmo.textContent = `MG ${coaxAmmo}/60`;
    }

    if (inTank) {
      this.el.interactPrompt.classList.remove('hidden');
      this.el.interactText.textContent = 'EXIT TANK';
      this.el.touchTankBtn.classList.remove('hidden');
      this.el.touchTankBtn.textContent = 'EXIT';
    } else if (nearTank) {
      this.el.interactPrompt.classList.remove('hidden');
      this.el.interactText.textContent = 'DRIVE TANK';
      this.el.touchTankBtn.classList.remove('hidden');
      this.el.touchTankBtn.textContent = 'DRIVE';
    } else {
      this.el.interactPrompt.classList.add('hidden');
      this.el.touchTankBtn.classList.add('hidden');
    }

    this.el.sniperScope.classList.toggle('hidden', !isScoped);
    this.el.crosshair.classList.toggle('hidden', isScoped);
    const gap = Math.round(5 + moveSpread * 12);
    this.el.crosshair.style.setProperty('--gap', `${gap}px`);

    this.el.weaponSlots.forEach((btn, i) => {
      btn.classList.toggle('active', i === activeSlot);
    });

    this.el.hudGrenadesBadge.textContent = String(grenadesCount);

    if (inTank) {
      this.el.hudWeaponName.textContent = '120MM TANK CANNON';
      this.el.hudAmmoMag.textContent = cannonReadyPct >= 1 ? '1' : '0';
      this.el.hudAmmoRes.textContent = '∞';
      this.el.hudReloading.classList.add('hidden');
    } else if (weaponState) {
      this.el.hudWeaponName.textContent = weaponState.spec.name;
      if (weaponState.spec.type === 'grenade') {
        this.el.hudAmmoMag.textContent = String(grenadesCount);
        this.el.hudAmmoRes.textContent = '2';
      } else {
        this.el.hudAmmoMag.textContent = String(weaponState.mag);
        this.el.hudAmmoRes.textContent = String(weaponState.reserve);
      }
      this.el.hudReloading.classList.toggle('hidden', !reloading);
    }
  }

  flashHitmarker(isHeadshot = false) {
    this.el.hitmarker.classList.remove('hidden', 'headshot');
    if (isHeadshot) this.el.hitmarker.classList.add('headshot');
    clearTimeout(this.hitmarkerTimer);
    this.hitmarkerTimer = setTimeout(() => {
      this.el.hitmarker.classList.add('hidden');
    }, 130);
  }

  flashDamage() {
    this.el.damageVignette.style.opacity = '1';
    clearTimeout(this.damageTimer);
    this.damageTimer = setTimeout(() => {
      this.el.damageVignette.style.opacity = '0';
    }, 180);
  }

  showEliminated(visible, killerName = '', secondsLeft = 3) {
    this.el.eliminationBanner.classList.toggle('hidden', !visible);
    if (visible) {
      this.el.elimSub.textContent = `Eliminated by ${killerName} · Respawning in ${Math.ceil(secondsLeft)}s`;
    }
  }

  pushKillfeed(killerName, weaponLabel, victimName) {
    const item = document.createElement('div');
    item.className = 'kf-item';
    item.innerHTML = `<span class="kf-killer">${killerName}</span><span class="kf-weapon">[${weaponLabel}]</span><span class="kf-victim">${victimName}</span>`;
    this.el.killfeed.prepend(item);
    while (this.el.killfeed.children.length > 5) {
      this.el.killfeed.lastChild.remove();
    }
    setTimeout(() => item.remove(), 5500);
  }

  renderScoreboard(entries, localId, { roundEnded = false, winnerName = '', canRestart = false, mapName = '' } = {}) {
    const sorted = [...entries].sort((a, b) => (b.kills - a.kills) || (a.deaths - b.deaths));
    this.el.sbTitle.textContent = roundEnded ? 'ROUND COMPLETE' : 'SCOREBOARD';
    this.el.sbSubtitle.textContent = `${mapName} · Free-For-All`;
    this.el.sbBody.innerHTML = '';

    sorted.forEach((p, idx) => {
      const tr = document.createElement('tr');
      if (p.id === localId) tr.className = 'me';
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${p.name}${p.id === localId ? ' (YOU)' : ''}</td>
        <td><strong>${p.kills}</strong></td>
        <td>${p.deaths}</td>
        <td>${p.alive ? 'ACTIVE' : 'RESPAWN'}</td>
      `;
      this.el.sbBody.appendChild(tr);
    });

    this.el.sbRoundEndActions.classList.toggle('hidden', !roundEnded);
    this.el.btnCloseSb.classList.toggle('hidden', roundEnded);
    this.el.btnNextRound.classList.toggle('hidden', !canRestart);
    if (roundEnded) {
      this.el.sbWinnerText.textContent = winnerName ? `WINNER: ${winnerName.toUpperCase()}` : 'MATCH COMPLETE';
      this.el.scoreboardOverlay.classList.remove('hidden');
    }
  }

  setScoreboardVisible(visible) {
    this.el.scoreboardOverlay.classList.toggle('hidden', !visible);
  }

  openSettings(inMatch) {
    this.el.btnQuitMatch.classList.toggle('hidden', !inMatch);
    this.el.settingsModal.classList.remove('hidden');
  }

  closeSettings() {
    this.el.settingsModal.classList.add('hidden');
  }
}
