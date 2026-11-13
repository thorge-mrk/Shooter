import * as THREE from 'three';
import { buildSoldierMesh, animateSoldierModel, ENEMY_CLASS_CATALOG } from './SoldierMesh.js';
import { resolveCylinderCollisions } from './Physics.js';

const BOT_CALLSIGNS = [
  'Viper',
  'Kestrel',
  'Titan',
  'Specter',
  'Havoc',
  'Reaper',
  'Longshot',
  'Bulwark'
];

export const DIFFICULTY = {
  casual: {
    speed: 5.4,
    fireIntervalMs: [520, 820],
    reactionDelayMs: 650,
    burstLength: [2, 3],
    burstPauseMs: [750, 1150],
    hitChance: 0.20,
    spread: 0.14,
    damage: 7,
    sightRange: 80,
    crouchChance: 0.12,
    turnRate: 4.5
  },
  tactical: {
    speed: 6.8,
    fireIntervalMs: [310, 520],
    reactionDelayMs: 320,
    burstLength: [3, 5],
    burstPauseMs: [450, 720],
    hitChance: 0.34,
    spread: 0.085,
    damage: 10,
    sightRange: 100,
    crouchChance: 0.45,
    turnRate: 6.4
  },
  veteran: {
    speed: 7.9,
    fireIntervalMs: [210, 360],
    reactionDelayMs: 160,
    burstLength: [4, 7],
    burstPauseMs: [280, 480],
    hitChance: 0.48,
    spread: 0.05,
    damage: 13,
    sightRange: 120,
    crouchChance: 0.78,
    turnRate: 8.6
  }
};

export const DIFFICULTY_PRESETS = DIFFICULTY;

function lerpAngle(current, target, alpha) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * alpha;
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export class BotManager {
  constructor(scene, castShadows = true) {
    this.scene = scene;
    this.castShadows = castShadows;
    this.bots = [];
    this.raycaster = new THREE.Raycaster();
    this.difficulty = 'tactical';
    this._losFrom = new THREE.Vector3();
    this._losTo = new THREE.Vector3();
    this._losDir = new THREE.Vector3();
  }

  spawnBots(count, spawns, difficulty = 'tactical', qualityOrTex = 'balanced', texOrQuality = null) {
    this.clear();
    this.difficulty = DIFFICULTY[difficulty] ? difficulty : 'tactical';
    const diff = DIFFICULTY[this.difficulty];

    let quality = 'balanced';
    let textureLib = null;
    if (typeof qualityOrTex === 'string') {
      quality = qualityOrTex;
      textureLib = texOrQuality || null;
    } else if (qualityOrTex && typeof qualityOrTex === 'object') {
      textureLib = qualityOrTex;
      quality = typeof texOrQuality === 'string' ? texOrQuality : 'balanced';
    } else if (typeof texOrQuality === 'string') {
      quality = texOrQuality;
    }

    for (let i = 0; i < count; i++) {
      const sp = spawns[(i + 1) % spawns.length];
      const classSpec = ENEMY_CLASS_CATALOG[i % ENEMY_CLASS_CATALOG.length];
      const id = `bot_${i}`;
      const callsign = BOT_CALLSIGNS[i % BOT_CALLSIGNS.length];
      const roleTag = classSpec.id.charAt(0).toUpperCase() + classSpec.id.slice(1);
      const name = `${callsign}-${roleTag}`;

      const model = buildSoldierMesh(
        id,
        name,
        {
          enemyClass: classSpec.id,
          quality,
          textureLib
        },
        this.castShadows
      );
      model.root.position.set(sp.x, (sp.y || 1.7) - 1.7, sp.z);
      this.scene.add(model.root);

      this.bots.push({
        id,
        name,
        enemyClass: classSpec.id,
        classSpec,
        maxHp: classSpec.hp,
        hp: classSpec.hp,
        prevHp: classSpec.hp,
        model,
        pos: new THREE.Vector3(sp.x, sp.y || 1.7, sp.z),
        velY: 0,
        yaw: sp.yaw || 0,
        pitch: 0,
        alive: true,
        respawnAt: 0,
        kills: 0,
        deaths: 0,
        inTankId: -1,
        roamTarget: new THREE.Vector3(
          (Math.random() - 0.5) * 60,
          sp.y || 1.7,
          (Math.random() - 0.5) * 60
        ),
        coverTarget: null,
        coverSearchAt: 0,
        retargetAt: 0,
        acquiredTargetId: '',
        targetSeenSince: 0,
        lastSeenAt: 0,
        alertedUntil: 0,
        shotsInBurst: 0,
        targetBurstLen: randInt(diff.burstLength[0], diff.burstLength[1]),
        burstCooldownUntil: 0,
        nextShotAt: 0,
        lastShotAt: 0,
        lastGrenadeAt: 0,
        crouchAmount: 0,
        wantsCrouch: false,
        crouchToggleAt: 0,
        currentStrafe: 0,
        strafeDir: Math.random() < 0.5 ? 1 : -1,
        flankAngleRad: (35 + Math.random() * 20) * (Math.PI / 180),
        stuckTime: 0,
        unstuckUntil: 0,
        unstuckDirX: 0,
        unstuckDirZ: 0
      });
    }
  }

  getHitMeshes() {
    const out = [];
    for (const bot of this.bots) {
      if (bot.alive && bot.inTankId < 0) {
        bot.model.root.updateMatrixWorld(true);
        out.push(...bot.model.hitMeshes);
      }
    }
    return out;
  }

  /**
   * Checks whether an XZ coordinate with cylinder `radius` overlaps any blocking collider
   * in the vertical body band `[footY + 0.35, footY + 1.55]` or leaves the `±78m` safe zone.
   */
  _isBlockedAtXZ(x, z, footY, colliders, radius = 0.45, terrainHeightFn = null) {
    if (Math.abs(x) > 78 || Math.abs(z) > 78) return true;
    if (!colliders || colliders.length === 0) return false;

    const effFootY = terrainHeightFn ? Math.max(footY, terrainHeightFn(x, z)) : footY;
    const minBandY = effFootY + 0.35;
    const maxBandY = effFootY + 1.55;

    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (c.maxY <= effFootY + 0.38 && (c.stepable || (c.maxY - (c.minY ?? 0)) <= 0.55)) {
        continue;
      }
      const cMinY = c.minY ?? -2;
      if (c.maxY <= minBandY || cMinY >= maxBandY) {
        continue;
      }
      if (
        x > c.minX - radius &&
        x < c.maxX + radius &&
        z > c.minZ - radius &&
        z < c.maxZ + radius
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks whether a low climbable ledge/curb/crate sits immediately ahead so the bot can step-jump cleanly.
   */
  _hasStepLedgeAhead(x, z, footY, dirX, dirZ, colliders) {
    if (!colliders || colliders.length === 0) return false;
    const probeX = x + dirX * 0.62;
    const probeZ = z + dirZ * 0.62;
    const probeRadius = 0.52;
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (
        probeX > c.minX - probeRadius &&
        probeX < c.maxX + probeRadius &&
        probeZ > c.minZ - probeRadius &&
        probeZ < c.maxZ + probeRadius
      ) {
        const cMinY = c.minY ?? 0;
        if ((c.stepable || (c.maxY > footY + 0.16 && c.maxY <= footY + 1.45)) && cMinY <= footY + 0.65) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Multi-probe fan obstacle steering: tests fan ray offsets `[0, ±0.55, ±1.1, ±1.6]` rad
   * at lookahead distances `0.85m` and `1.75m` (plus short-corridor and alcove fallbacks),
   * returning the unobstructed unit direction with highest alignment to desired travel.
   */
  _computeSteeredDirection(pos, desiredX, desiredZ, stepDist, colliders, strafeSign = 1, terrainHeightFn = null) {
    const len = Math.hypot(desiredX, desiredZ);
    if (len < 1e-5) {
      return { x: 0, z: 0, blocked: false };
    }
    const ux = desiredX / len;
    const uz = desiredZ / len;
    const footY = pos.y - 1.7;
    const s = strafeSign >= 0 ? 1 : -1;

    const frontAngles = [0, s * 0.55, -s * 0.55, s * 1.1, -s * 1.1, s * 1.6, -s * 1.6];
    const escapeAngles = [s * 2.15, -s * 2.15, Math.PI];

    const evaluateAngle = (ang, probeDists) => {
      const cosA = Math.cos(ang);
      const sinA = Math.sin(ang);
      const cx = ux * cosA - uz * sinA;
      const cz = ux * sinA + uz * cosA;
      for (let d = 0; d < probeDists.length; d++) {
        const dist = probeDists[d];
        if (this._isBlockedAtXZ(pos.x + cx * dist, pos.z + cz * dist, footY, colliders, 0.45, terrainHeightFn)) {
          return null;
        }
      }
      return { x: cx, z: cz, align: cx * ux + cz * uz };
    };

    const farProbeDists = [Math.min(0.45, Math.max(0.28, stepDist)), 0.85, 1.30, 1.75];
    let best = null;

    for (let i = 0; i < frontAngles.length; i++) {
      const cand = evaluateAngle(frontAngles[i], farProbeDists);
      if (cand && (!best || cand.align > best.align + 1e-4)) {
        best = cand;
      }
    }
    if (best) {
      return { x: best.x, z: best.z, blocked: false };
    }

    // Tight interior/doorway clearance fallback (0.42m & 0.85m)
    const nearProbeDists = [0.42, 0.85];
    for (let i = 0; i < frontAngles.length; i++) {
      const cand = evaluateAngle(frontAngles[i], nearProbeDists);
      if (cand && (!best || cand.align > best.align + 1e-4)) {
        best = cand;
      }
    }
    if (best) {
      return { x: best.x, z: best.z, blocked: false };
    }

    // Dead-end alcove turnaround escape probes
    for (let i = 0; i < escapeAngles.length; i++) {
      const cand = evaluateAngle(escapeAngles[i], nearProbeDists);
      if (cand) {
        return { x: cand.x, z: cand.z, blocked: false };
      }
    }

    return { x: -uz * s, z: ux * s, blocked: true };
  }

  /**
   * Searches colliders within 18m for a rock, column, crate, or wall between the bot and target,
   * returning a sheltered cover position on the side opposite to the target.
   */
  _findCoverPosition(botPos, targetPos, colliders) {
    if (!colliders || colliders.length === 0) return null;

    let bestPoint = null;
    let bestScore = Infinity;

    const toTargetX = targetPos.x - botPos.x;
    const toTargetZ = targetPos.z - botPos.z;
    const targetDist = Math.hypot(toTargetX, toTargetZ) || 1;
    const dirTX = toTargetX / targetDist;
    const dirTZ = toTargetZ / targetDist;
    const footY = botPos.y - 1.7;

    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      const height = c.maxY - (c.minY ?? 0);
      if (height < 1.05) continue;

      const w = c.maxX - c.minX;
      const d = c.maxZ - c.minZ;
      if (w > 22 || d > 22) continue;

      const cx = (c.minX + c.maxX) * 0.5;
      const cz = (c.minZ + c.maxZ) * 0.5;
      const distToBot = Math.hypot(cx - botPos.x, cz - botPos.z);
      if (distToBot > 18.0 || distToBot < 0.4) continue;

      const fromTargetX = cx - targetPos.x;
      const fromTargetZ = cz - targetPos.z;
      const fromTargetLen = Math.hypot(fromTargetX, fromTargetZ) || 1;
      const shelterDirX = fromTargetX / fromTargetLen;
      const shelterDirZ = fromTargetZ / fromTargetLen;

      const projExtent = Math.abs(shelterDirX) * w * 0.5 + Math.abs(shelterDirZ) * d * 0.5 + 0.85;
      const coverX = Math.max(-76, Math.min(76, cx + shelterDirX * projExtent));
      const coverZ = Math.max(-76, Math.min(76, cz + shelterDirZ * projExtent));
      if (this._isBlockedAtXZ(coverX, coverZ, footY, colliders, 0.45)) continue;

      const moveDist = Math.hypot(coverX - botPos.x, coverZ - botPos.z);
      if (moveDist > 18.0) continue;

      const toObsX = (cx - botPos.x) / distToBot;
      const toObsZ = (cz - botPos.z) / distToBot;
      const alignment = toObsX * dirTX + toObsZ * dirTZ;
      const alignmentBonus = alignment > -0.15 ? 1.0 - alignment * 0.4 : 1.5;

      const score = moveDist * alignmentBonus;
      if (score < bestScore) {
        bestScore = score;
        bestPoint = new THREE.Vector3(coverX, botPos.y, coverZ);
      }
    }

    return bestPoint;
  }

  /**
   * Finds nearby high ground or long-range overwatch position for Recon Marksman bots.
   */
  _findMarksmanVantage(botPos, targetPos, terrainHeightFn, colliders = null) {
    const awayX = botPos.x - targetPos.x;
    const awayZ = botPos.z - targetPos.z;
    const baseAngle = Math.atan2(awayZ, awayX);

    let bestVantage = null;
    let bestY = -Infinity;

    for (let i = -2; i <= 2; i++) {
      const ang = baseAngle + i * 0.35;
      const sampleDist = 10 + Math.abs(i) * 2;
      const sx = Math.max(-76, Math.min(76, botPos.x + Math.cos(ang) * sampleDist));
      const sz = Math.max(-76, Math.min(76, botPos.z + Math.sin(ang) * sampleDist));
      const sy = typeof terrainHeightFn === 'function' ? terrainHeightFn(sx, sz) : 0;
      if (colliders && this._isBlockedAtXZ(sx, sz, sy, colliders, 0.45, terrainHeightFn)) {
        continue;
      }
      const dTarget = Math.hypot(sx - targetPos.x, sz - targetPos.z);
      const rangeScore = dTarget >= 24 && dTarget <= 45 ? 2.5 : 0;
      const totalScore = sy + rangeScore;

      if (totalScore > bestY) {
        bestY = totalScore;
        bestVantage = new THREE.Vector3(sx, sy + 1.7, sz);
      }
    }

    return bestVantage;
  }

  update(
    dt,
    nowMs,
    {
      colliders,
      worldMeshes,
      spawns,
      tankSystem,
      terrainHeightFn,
      targets,
      onBotShoot,
      onBotGrenade,
      onBotTankFire
    }
  ) {
    const diff = DIFFICULTY[this.difficulty] || DIFFICULTY.tactical;

    for (const bot of this.bots) {
      const spec = bot.classSpec || ENEMY_CLASS_CATALOG[1];

      if (!bot.alive) {
        bot.model.root.visible = false;
        if (nowMs >= bot.respawnAt) {
          const sp = spawns[Math.floor(Math.random() * spawns.length)];
          const sx = Math.max(-76, Math.min(76, sp.x + (Math.random() - 0.5) * 2.4));
          const sz = Math.max(-76, Math.min(76, sp.z + (Math.random() - 0.5) * 2.4));
          const sy = (terrainHeightFn ? terrainHeightFn(sx, sz) : 0) + 1.7;
          bot.pos.set(sx, sy, sz);
          bot.velY = 0;
          bot.maxHp = spec.hp;
          bot.hp = spec.hp;
          bot.prevHp = spec.hp;
          bot.alive = true;
          bot.inTankId = -1;
          bot.acquiredTargetId = '';
          bot.targetSeenSince = 0;
          bot.lastSeenAt = 0;
          bot.alertedUntil = 0;
          bot.coverTarget = null;
          bot.shotsInBurst = 0;
          bot.targetBurstLen = randInt(diff.burstLength[0], diff.burstLength[1]);
          bot.burstCooldownUntil = 0;
          bot.nextShotAt = 0;
          bot.crouchAmount = 0;
          bot.wantsCrouch = false;
          bot.stuckTime = 0;
          bot.unstuckUntil = 0;
          bot.unstuckDirX = 0;
          bot.unstuckDirZ = 0;
          if (bot.model) {
            bot.model.flinchTimer = 0;
          }
        }
        continue;
      }

      // Detect damage taken since last frame -> trigger hit flinch, alert state & evasive cover search
      if (bot.prevHp === undefined) bot.prevHp = bot.hp;
      if (bot.hp < bot.prevHp) {
        if (bot.model) {
          bot.model.flinchTimer = 0.22;
        }
        bot.alertedUntil = nowMs + 4800;
        bot.strafeDir = -bot.strafeDir;
        if (bot.hp < bot.maxHp * 0.65) {
          bot.coverSearchAt = 0;
          bot.wantsCrouch = Math.random() < Math.min(0.95, diff.crouchChance + 0.25);
        }
      }
      bot.prevHp = bot.hp;

      const isAlerted = nowMs < (bot.alertedUntil || 0);
      const maxSightRange =
        (spec.id === 'marksman' ? diff.sightRange * 1.15 : diff.sightRange) *
        (isAlerted ? 1.25 : 1.0);

      // Find closest visible or nearby target
      let bestTarget = null;
      let bestDist = Infinity;
      let bestLOS = false;

      for (const t of targets) {
        if (!t.alive || t.id === bot.id) continue;
        const d = bot.pos.distanceTo(t.pos);
        const los = d < maxSightRange && this._hasLineOfSight(bot.pos, t.pos, worldMeshes);
        const scoreDist = los ? d * 0.52 : d;
        if (scoreDist < bestDist) {
          bestDist = scoreDist;
          bestTarget = t;
          bestLOS = los;
        }
      }

      if (bot.inTankId >= 0) {
        bot.model.root.visible = false;
        const tank = tankSystem.getTankById(bot.inTankId);
        if (!tank || tank.destroyed) {
          bot.inTankId = -1;
          continue;
        }

        let fwd = 0.55;
        let turn = 0;
        let aimYaw = tank.turretYaw;
        let aimPitch = 0;

        if (bestTarget) {
          const dx = bestTarget.pos.x - tank.x;
          const dz = bestTarget.pos.z - tank.z;
          aimYaw = Math.atan2(-dx, -dz);
          const dist = Math.hypot(dx, dz);
          aimPitch = Math.min(0.15, dist * 0.0018);

          let hullDiff = aimYaw - tank.yaw;
          while (hullDiff > Math.PI) hullDiff -= Math.PI * 2;
          while (hullDiff < -Math.PI) hullDiff += Math.PI * 2;
          turn = Math.max(-1, Math.min(1, hullDiff * 1.4));
          fwd = dist > 22 ? 0.8 : dist < 11 ? -0.35 : 0.2;

          if (bestLOS && nowMs - bot.lastShotAt > 3100) {
            bot.lastShotAt = nowMs;
            onBotTankFire(bot, tank);
          }
        }

        tankSystem.driveTank(tank, fwd, turn, aimYaw, aimPitch, colliders, dt, terrainHeightFn);
        bot.pos.set(tank.x, tank.y + 2.0, tank.z);
        continue;
      }

      bot.model.root.visible = true;

      // Occasional tank boarding when near empty tank
      const nearTank = tankSystem ? tankSystem.findNearestEnterableTank(bot.pos, 5.5) : null;
      if (nearTank && Math.random() < 0.008) {
        nearTank.driverId = bot.id;
        bot.inTankId = nearTank.id;
        continue;
      }

      const prevX = bot.pos.x;
      const prevZ = bot.pos.z;
      // Blend difficulty speed with class-specific mobility factor (normalized around trooper 4.8)
      const classSpeedFactor = (spec.moveSpeed || 4.8) / 4.8;
      const botMoveSpeed = diff.speed * (0.65 + 0.35 * classSpeedFactor) * (1 - bot.crouchAmount * 0.32);

      const isLowHp = bot.hp < bot.maxHp * 0.58;
      const isCoolingBurst = nowMs < bot.burstCooldownUntil;
      const wantsCover = isLowHp || isCoolingBurst;
      const inUnstuck = nowMs < (bot.unstuckUntil || 0);

      let rawMoveX = 0;
      let rawMoveZ = 0;
      let desiredMoveSpeed = 0;
      let inCombat = false;

      if (bestTarget && (bestLOS || isAlerted || bot.pos.distanceTo(bestTarget.pos) < 36)) {
        inCombat = true;
        const dx = bestTarget.pos.x - bot.pos.x;
        const dy = bestTarget.pos.y - bot.pos.y;
        const dz = bestTarget.pos.z - bot.pos.z;
        const horiz = Math.hypot(dx, dz) || 0.001;
        const realDist = Math.hypot(dx, dy, dz);

        const desiredYaw = Math.atan2(-dx, -dz);
        const desiredPitch = Math.max(-0.55, Math.min(0.55, Math.atan2(dy, horiz)));

        // Smoothly rotate toward the target before opening fire
        bot.yaw = lerpAngle(bot.yaw, desiredYaw, Math.min(1, diff.turnRate * dt));
        bot.pitch += (desiredPitch - bot.pitch) * Math.min(1, diff.turnRate * dt);

        // Target acquisition reaction timer (`targetSeenSince`)
        if (bestLOS) {
          if (bot.acquiredTargetId !== bestTarget.id || !bot.targetSeenSince) {
            bot.acquiredTargetId = bestTarget.id;
            bot.targetSeenSince = nowMs;
            bot.shotsInBurst = 0;
            bot.targetBurstLen = randInt(diff.burstLength[0], diff.burstLength[1]);
          }
          bot.lastSeenAt = nowMs;
        } else if (nowMs - (bot.lastSeenAt || 0) > 480) {
          bot.targetSeenSince = 0;
          bot.shotsInBurst = 0;
        }

        // Update strafe & flank weave timer + tactical crouch-peeking
        if (nowMs > bot.retargetAt) {
          bot.strafeDir = Math.random() < 0.5 ? 1 : -1;
          bot.flankAngleRad = (35 + Math.random() * 20) * (Math.PI / 180);
          bot.retargetAt = nowMs + 800 + Math.random() * 850;
        }

        if (nowMs > bot.crouchToggleAt) {
          const roleCrouchBias = spec.id === 'marksman' ? 0.25 : spec.id === 'breacher' ? -0.1 : 0;
          const effCrouchChance = Math.max(0.05, Math.min(0.92, diff.crouchChance + roleCrouchBias));
          bot.wantsCrouch = bestLOS && Math.random() < effCrouchChance;
          bot.crouchToggleAt = nowMs + 950 + Math.random() * 900;
        }

        // 1. Tactical Cover-Seeking behind rocks/columns/walls when HP is low or between bursts
        if (!inUnstuck && wantsCover && nowMs > bot.coverSearchAt) {
          bot.coverTarget = this._findCoverPosition(bot.pos, bestTarget.pos, colliders);
          bot.coverSearchAt = nowMs + 600;
        } else if (!wantsCover && spec.id !== 'scout' && spec.id !== 'breacher') {
          bot.coverTarget = null;
        }

        let moveVecX = 0;
        let moveVecZ = 0;

        if (
          !inUnstuck &&
          bot.coverTarget &&
          Math.hypot(bot.coverTarget.x - bot.pos.x, bot.coverTarget.z - bot.pos.z) > 0.75
        ) {
          const cdx = bot.coverTarget.x - bot.pos.x;
          const cdz = bot.coverTarget.z - bot.pos.z;
          const clen = Math.hypot(cdx, cdz) || 1;
          moveVecX = cdx / clen;
          moveVecZ = cdz / clen;
          bot.currentStrafe = bot.strafeDir * 0.4;
        } else if (spec.id === 'scout' || spec.id === 'breacher') {
          // 2. Flanking behavior: angle 35-55 degrees around the target while advancing
          const toTargetYaw = Math.atan2(dx, dz);
          const flankYaw = toTargetYaw + bot.strafeDir * bot.flankAngleRad;
          const minRange = spec.id === 'breacher' ? 5.5 : 8.5;

          if (realDist > minRange) {
            moveVecX = Math.sin(flankYaw);
            moveVecZ = Math.cos(flankYaw);
          } else {
            moveVecX = Math.cos(bot.yaw) * bot.strafeDir;
            moveVecZ = -Math.sin(bot.yaw) * bot.strafeDir;
          }
          bot.currentStrafe = bot.strafeDir;

          if (!inUnstuck && nowMs > bot.coverSearchAt && realDist > 12) {
            bot.coverTarget = this._findCoverPosition(bot.pos, bestTarget.pos, colliders);
            bot.coverSearchAt = nowMs + 1400;
          }
        } else if (spec.id === 'marksman') {
          // 3. Recon Marksman: hold high ground / medium-long range (24-45m)
          const rightX = Math.cos(bot.yaw);
          const rightZ = -Math.sin(bot.yaw);
          const fwdX = -Math.sin(bot.yaw);
          const fwdZ = -Math.cos(bot.yaw);

          if (realDist < 24) {
            const vantage = this._findMarksmanVantage(bot.pos, bestTarget.pos, terrainHeightFn, colliders);
            if (vantage) {
              const vdx = vantage.x - bot.pos.x;
              const vdz = vantage.z - bot.pos.z;
              const vlen = Math.hypot(vdx, vdz) || 1;
              moveVecX = vdx / vlen;
              moveVecZ = vdz / vlen;
            } else {
              moveVecX = -fwdX * 0.85 + rightX * bot.strafeDir * 0.35;
              moveVecZ = -fwdZ * 0.85 + rightZ * bot.strafeDir * 0.35;
            }
          } else if (realDist > 45) {
            moveVecX = fwdX * 0.7 + rightX * bot.strafeDir * 0.3;
            moveVecZ = fwdZ * 0.7 + rightZ * bot.strafeDir * 0.3;
          } else {
            moveVecX = rightX * bot.strafeDir * 0.42;
            moveVecZ = rightZ * bot.strafeDir * 0.42;
          }
          bot.currentStrafe = bot.strafeDir * 0.5;
        } else {
          // Trooper & Juggernaut: disciplined assault spacing & suppressive advance
          const rightX = Math.cos(bot.yaw);
          const rightZ = -Math.sin(bot.yaw);
          const fwdX = -Math.sin(bot.yaw);
          const fwdZ = -Math.cos(bot.yaw);
          const idealMax = spec.id === 'juggernaut' ? 16 : 22;
          const idealMin = spec.id === 'juggernaut' ? 6 : 9;
          const approach = realDist > idealMax ? 0.68 : realDist < idealMin ? -0.42 : 0;
          const strafeWeight = spec.id === 'juggernaut' ? 0.45 : 0.85;

          moveVecX = rightX * bot.strafeDir * strafeWeight + fwdX * approach;
          moveVecZ = rightZ * bot.strafeDir * strafeWeight + fwdZ * approach;
          bot.currentStrafe = bot.strafeDir * strafeWeight;
        }

        const moveNorm = Math.hypot(moveVecX, moveVecZ);
        if (moveNorm > 1.0) {
          moveVecX /= moveNorm;
          moveVecZ /= moveNorm;
        }

        rawMoveX = moveVecX;
        rawMoveZ = moveVecZ;
        desiredMoveSpeed = botMoveSpeed;

        // Burst-fire discipline (`shotsInBurst`, `burstCooldownUntil`) after `reactionDelayMs`
        if (bestLOS && bot.targetSeenSince > 0) {
          let aimError = desiredYaw - bot.yaw;
          while (aimError > Math.PI) aimError -= Math.PI * 2;
          while (aimError < -Math.PI) aimError += Math.PI * 2;

          const reactionElapsed = nowMs - bot.targetSeenSince;
          if (
            reactionElapsed >= diff.reactionDelayMs &&
            nowMs >= bot.burstCooldownUntil &&
            nowMs >= bot.nextShotAt &&
            Math.abs(aimError) < 0.38
          ) {
            bot.lastShotAt = nowMs;
            bot.shotsInBurst += 1;
            bot.model.flashTimer = 0.065;

            const baseInterval = randRange(diff.fireIntervalMs[0], diff.fireIntervalMs[1]);
            const classRateScale =
              spec.id === 'marksman' ? 1.35 : spec.id === 'juggernaut' ? 0.82 : 1.0;
            bot.nextShotAt = nowMs + baseInterval * classRateScale;

            const classDmgMult = (spec.damage || 12) / 12;
            const shotCfg = {
              hitChance:
                spec.id === 'marksman'
                  ? Math.min(0.75, diff.hitChance * 1.28)
                  : diff.hitChance,
              damage: Math.max(1, Math.round(diff.damage * (0.7 + 0.3 * classDmgMult))),
              spread: spec.id === 'marksman' ? diff.spread * 0.6 : diff.spread,
              burstSize: bot.targetBurstLen,
              burstIntervalMs: Math.round(baseInterval)
            };
            onBotShoot(bot, bestTarget, shotCfg);

            if (bot.shotsInBurst >= bot.targetBurstLen) {
              bot.shotsInBurst = 0;
              bot.targetBurstLen = randInt(diff.burstLength[0], diff.burstLength[1]);
              bot.burstCooldownUntil =
                nowMs + randRange(diff.burstPauseMs[0], diff.burstPauseMs[1]);
            }
          }

          if (realDist > 12 && realDist < 29 && nowMs - bot.lastGrenadeAt > 11000) {
            bot.lastGrenadeAt = nowMs;
            onBotGrenade(bot, bestTarget);
          }
        }
      } else {
        bot.acquiredTargetId = '';
        bot.targetSeenSince = 0;
        bot.shotsInBurst = 0;
        bot.wantsCrouch = false;
        bot.currentStrafe = 0;

        if (
          nowMs > bot.retargetAt ||
          Math.hypot(bot.roamTarget.x - bot.pos.x, bot.roamTarget.z - bot.pos.z) < 2.5
        ) {
          if (bestTarget && Math.random() < 0.72) {
            bot.roamTarget.set(
              Math.max(-72, Math.min(72, bestTarget.pos.x)),
              bestTarget.pos.y,
              Math.max(-72, Math.min(72, bestTarget.pos.z))
            );
          } else {
            bot.roamTarget.set((Math.random() - 0.5) * 68, 1.7, (Math.random() - 0.5) * 68);
          }
          bot.retargetAt = nowMs + 2100 + Math.random() * 1300;
        }
        const dx = bot.roamTarget.x - bot.pos.x;
        const dz = bot.roamTarget.z - bot.pos.z;
        const len = Math.hypot(dx, dz) || 1;
        bot.pitch += (0 - bot.pitch) * Math.min(1, 6 * dt);
        rawMoveX = dx / len;
        rawMoveZ = dz / len;
        desiredMoveSpeed = botMoveSpeed * 0.92;
      }

      // Multi-probe steered displacement (honoring active unstuck escape tangent)
      let steerVecX = 0;
      let steerVecZ = 0;
      let intendedSpeed = 0;
      const rawLen = Math.hypot(rawMoveX, rawMoveZ);
      if ((rawLen > 0.05 && desiredMoveSpeed > 0.01) || inUnstuck) {
        const wantX = inUnstuck && (bot.unstuckDirX || bot.unstuckDirZ) ? bot.unstuckDirX : rawMoveX;
        const wantZ = inUnstuck && (bot.unstuckDirX || bot.unstuckDirZ) ? bot.unstuckDirZ : rawMoveZ;
        const effSpeed = inUnstuck ? Math.max(desiredMoveSpeed, botMoveSpeed * 0.92) : desiredMoveSpeed * Math.min(1, rawLen);
        const stepDist = effSpeed * dt;
        const steered = this._computeSteeredDirection(
          bot.pos,
          wantX,
          wantZ,
          stepDist,
          colliders,
          bot.strafeDir,
          terrainHeightFn
        );
        steerVecX = steered.x;
        steerVecZ = steered.z;
        intendedSpeed = effSpeed;

        if (!inCombat && (steerVecX !== 0 || steerVecZ !== 0)) {
          const steeredYaw = Math.atan2(-steerVecX, -steerVecZ);
          bot.yaw = lerpAngle(bot.yaw, steeredYaw, Math.min(1, diff.turnRate * dt));
        }

        bot.pos.x += steerVecX * intendedSpeed * dt;
        bot.pos.z += steerVecZ * intendedSpeed * dt;
      }

      // Clamp bots inside map safe zone (±78m) so they never rub boundary walls indefinitely
      const clampedX = Math.max(-78, Math.min(78, bot.pos.x));
      const clampedZ = Math.max(-78, Math.min(78, bot.pos.z));
      if (clampedX !== bot.pos.x || clampedZ !== bot.pos.z) {
        bot.pos.x = clampedX;
        bot.pos.z = clampedZ;
        bot.roamTarget.set((Math.random() - 0.5) * 60, bot.pos.y, (Math.random() - 0.5) * 60);
        bot.coverTarget = null;
      }

      // Smoothly interpolate crouchAmount for crouch-peeking animations
      const targetCrouch = bot.wantsCrouch ? 1 : 0;
      bot.crouchAmount =
        (bot.crouchAmount || 0) +
        (targetCrouch - (bot.crouchAmount || 0)) * Math.min(1, dt * 8.5);

      bot.velY -= 22 * dt;
      bot.pos.y += bot.velY * dt;
      let floorY = resolveCylinderCollisions(
        bot.pos,
        0.42,
        1.7,
        colliders,
        terrainHeightFn || 0
      );
      if (bot.pos.y - 1.7 <= floorY) {
        bot.pos.y = floorY + 1.7;
        bot.velY = 0;
      }

      // Track real post-collision XZ displacement for immediate corner wall-slide & unstuck escape
      const safeDt = Math.max(0.0001, dt);
      let moveSpeed = dt > 0.0001 ? Math.hypot(bot.pos.x - prevX, bot.pos.z - prevZ) / safeDt : 0;

      if (intendedSpeed > 1.0 && moveSpeed < 0.45) {
        bot.stuckTime = (bot.stuckTime || 0) + dt;

        if (bot.stuckTime > 0.28) {
          const footY = bot.pos.y - 1.7;
          const dirX = steerVecX || rawMoveX;
          const dirZ = steerVecZ || rawMoveZ;
          const dLen = Math.hypot(dirX, dirZ) || 1;
          const ux = dirX / dLen;
          const uz = dirZ / dLen;

          const t1x = -uz * bot.strafeDir;
          const t1z = ux * bot.strafeDir;
          const t2x = -t1x;
          const t2z = -t1z;
          let slideX = t1x;
          let slideZ = t1z;
          if (this._isBlockedAtXZ(bot.pos.x + t1x * 0.65, bot.pos.z + t1z * 0.65, footY, colliders, 0.42, terrainHeightFn)) {
            if (!this._isBlockedAtXZ(bot.pos.x + t2x * 0.65, bot.pos.z + t2z * 0.65, footY, colliders, 0.42, terrainHeightFn)) {
              slideX = t2x;
              slideZ = t2z;
            }
          }

          const slideDist = Math.max(0.06, intendedSpeed * dt * 1.1);
          bot.pos.x = Math.max(-78, Math.min(78, bot.pos.x + slideX * slideDist));
          bot.pos.z = Math.max(-78, Math.min(78, bot.pos.z + slideZ * slideDist));
          floorY = resolveCylinderCollisions(bot.pos, 0.42, 1.7, colliders, terrainHeightFn || 0);
          if (bot.pos.y - 1.7 <= floorY) {
            bot.pos.y = floorY + 1.7;
            bot.velY = 0;
          }

          if (bot.velY === 0 && this._hasStepLedgeAhead(bot.pos.x, bot.pos.z, footY, ux, uz, colliders)) {
            bot.velY = 5.4;
          }
        }

        if (bot.stuckTime > 0.55) {
          const footY = bot.pos.y - 1.7;
          const dirX = steerVecX || rawMoveX;
          const dirZ = steerVecZ || rawMoveZ;
          const dLen = Math.hypot(dirX, dirZ) || 1;
          const ux = dirX / dLen;
          const uz = dirZ / dLen;

          bot.strafeDir = -bot.strafeDir;
          bot.coverTarget = null;
          bot.coverSearchAt = nowMs + 950;
          bot.unstuckUntil = nowMs + 750;
          bot.stuckTime = 0;

          const s = bot.strafeDir;
          const escapeCandidates = [
            [-uz * s, ux * s],
            [uz * s, -ux * s],
            [-ux * 0.55 - uz * s * 0.83, -uz * 0.55 + ux * s * 0.83],
            [-ux * 0.55 + uz * s * 0.83, -uz * 0.55 - ux * s * 0.83],
            [-ux, -uz]
          ];
          let chosenX = -uz * s;
          let chosenZ = ux * s;
          for (let i = 0; i < escapeCandidates.length; i++) {
            const [ex, ez] = escapeCandidates[i];
            if (
              !this._isBlockedAtXZ(bot.pos.x + ex * 0.85, bot.pos.z + ez * 0.85, footY, colliders, 0.44, terrainHeightFn) &&
              !this._isBlockedAtXZ(bot.pos.x + ex * 1.65, bot.pos.z + ez * 1.65, footY, colliders, 0.44, terrainHeightFn)
            ) {
              chosenX = ex;
              chosenZ = ez;
              break;
            }
          }
          bot.unstuckDirX = chosenX;
          bot.unstuckDirZ = chosenZ;
          bot.roamTarget.set(
            Math.max(-72, Math.min(72, bot.pos.x + chosenX * 14)),
            bot.pos.y,
            Math.max(-72, Math.min(72, bot.pos.z + chosenZ * 14))
          );
          bot.retargetAt = nowMs + 1100;
        }

        moveSpeed = dt > 0.0001 ? Math.hypot(bot.pos.x - prevX, bot.pos.z - prevZ) / safeDt : 0;
      } else {
        bot.stuckTime = Math.max(0, (bot.stuckTime || 0) - dt * 2.5);
      }

      bot.model.root.position.set(bot.pos.x, bot.pos.y - 1.7, bot.pos.z);
      bot.model.root.rotation.y = bot.yaw;

      animateSoldierModel(
        bot.model,
        dt,
        moveSpeed,
        bot.pitch,
        bot.model.flashTimer > 0,
        {
          crouchAmount: bot.crouchAmount || 0,
          strafe: bot.currentStrafe || 0,
          hitFlinch: bot.model.flinchTimer || 0
        }
      );
    }
  }

  _hasLineOfSight(from, to, worldMeshes) {
    if (!worldMeshes || worldMeshes.length === 0) return true;
    this._losFrom.set(from.x, from.y - 0.15, from.z);
    this._losTo.set(to.x, to.y - 0.15, to.z);
    this._losDir.subVectors(this._losTo, this._losFrom);
    const dist = this._losDir.length();
    if (dist < 0.1) return true;
    this._losDir.divideScalar(dist);
    this.raycaster.set(this._losFrom, this._losDir);
    this.raycaster.far = dist;
    const hits = this.raycaster.intersectObjects(worldMeshes, false);
    return hits.length === 0;
  }

  clear() {
    for (const bot of this.bots) {
      this.scene.remove(bot.model.root);
      bot.model.root.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
      });
      bot.model.materials.forEach((m) => m.dispose());
      if (bot.model.tagTex) bot.model.tagTex.dispose();
    }
    this.bots = [];
  }
}
