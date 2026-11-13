export class NetSnapshotBuffer {
  constructor(interpDelayMs = 95) {
    this.interpDelayMs = interpDelayMs;
    this.snapshots = [];
    this.maxSnapshots = 10;
  }

  push(snap) {
    const t = snap.t;
    if (this.snapshots.length > 0 && t <= this.snapshots[this.snapshots.length - 1].t) {
      // Replace newer-or-equal timestamp cleanly
      this.snapshots[this.snapshots.length - 1] = snap;
      return;
    }
    this.snapshots.push(snap);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  clear(snap = null) {
    this.snapshots = snap ? [snap] : [];
  }

  sample(renderTimeMs) {
    const count = this.snapshots.length;
    if (count === 0) return null;
    if (count === 1) return { ...this.snapshots[0] };

    const targetTime = renderTimeMs - this.interpDelayMs;

    // Older than oldest buffered packet
    if (targetTime <= this.snapshots[0].t) {
      return { ...this.snapshots[0] };
    }

    // Between two buffered snapshots -> smooth exact linear interpolation
    for (let i = 0; i < count - 1; i++) {
      const a = this.snapshots[i];
      const b = this.snapshots[i + 1];
      if (targetTime >= a.t && targetTime <= b.t) {
        const span = Math.max(1, b.t - a.t);
        const alpha = (targetTime - a.t) / span;
        return {
          x: a.x + (b.x - a.x) * alpha,
          y: a.y + (b.y - a.y) * alpha,
          z: a.z + (b.z - a.z) * alpha,
          vx: a.vx + (b.vx - a.vx) * alpha,
          vz: a.vz + (b.vz - a.vz) * alpha,
          yaw: lerpAngle(a.yaw, b.yaw, alpha),
          pitch: a.pitch + (b.pitch - a.pitch) * alpha
        };
      }
    }

    // Slightly ahead of latest packet -> gentle damped extrapolation (capped at 65ms so strafes never overshoot!)
    const latest = this.snapshots[count - 1];
    const leadSec = Math.min(0.065, Math.max(0, (targetTime - latest.t) / 1000));
    const decay = 0.65;
    return {
      x: latest.x + (latest.vx || 0) * leadSec * decay,
      y: latest.y,
      z: latest.z + (latest.vz || 0) * leadSec * decay,
      vx: latest.vx || 0,
      vz: latest.vz || 0,
      yaw: latest.yaw,
      pitch: latest.pitch
    };
  }
}

export function lerpAngle(current, target, alpha) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * alpha;
}
