export class RecoilSystem {
  constructor() {
    this.pitchOffset = 0;
    this.yawOffset = 0;
    this.holdTimer = 0;
    this.cameraPunch = 0;
  }

  reset() {
    this.pitchOffset = 0;
    this.yawOffset = 0;
    this.holdTimer = 0;
    this.cameraPunch = 0;
  }

  addKick(pitchKick, yawKick, punch = 0.015) {
    this.pitchOffset = Math.min(0.28, this.pitchOffset + pitchKick);
    this.yawOffset = Math.max(-0.14, Math.min(0.14, this.yawOffset + yawKick));
    this.holdTimer = 0.085;
    this.cameraPunch = Math.min(0.045, this.cameraPunch + punch);
  }

  // If the user pulls down manually while recoil is active, let it counteract recoil offset cleanly
  absorbManualAimDelta(deltaPitch) {
    if (deltaPitch < 0 && this.pitchOffset > 0) {
      const absorbed = Math.min(this.pitchOffset, -deltaPitch);
      this.pitchOffset -= absorbed;
      return deltaPitch + absorbed;
    }
    return deltaPitch;
  }

  // Smoothly returns weapon 100% back to original starting aim point after shooting stops
  update(dt, isFiring) {
    if (this.cameraPunch > 0) {
      this.cameraPunch = Math.max(0, this.cameraPunch - dt * 0.22);
    }

    if (this.holdTimer > 0) {
      this.holdTimer = Math.max(0, this.holdTimer - dt);
      return;
    }

    if (isFiring) return;

    const decay = Math.exp(-10.5 * dt);
    this.pitchOffset *= decay;
    this.yawOffset *= decay;

    if (Math.abs(this.pitchOffset) < 0.0003) this.pitchOffset = 0;
    if (Math.abs(this.yawOffset) < 0.0003) this.yawOffset = 0;
  }
}
