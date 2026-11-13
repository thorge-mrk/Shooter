export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.noiseBuffer = null;
  }

  unlock() {
    if (!this.enabled) return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this._createNoiseBuffer();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
  }

  _createNoiseBuffer() {
    if (!this.ctx) return;
    const len = this.ctx.sampleRate * 1.2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buf;
  }

  _noiseBurst({ duration = 0.12, filterFreq = 1800, filterType = 'bandpass', gain = 0.25 }) {
    if (!this.enabled || !this.ctx || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, now);

    const amp = this.ctx.createGain();
    amp.gain.setValueAtTime(gain, now);
    amp.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(filter);
    filter.connect(amp);
    amp.connect(this.ctx.destination);

    src.start(now);
    src.stop(now + duration);
  }

  _tone({ freqStart = 200, freqEnd = 60, duration = 0.1, type = 'triangle', gain = 0.2 }) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);

    const amp = this.ctx.createGain();
    amp.gain.setValueAtTime(gain, now);
    amp.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(amp);
    amp.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  playShot(weaponId, distanceScale = 1.0) {
    this.unlock();
    if (!this.enabled || !this.ctx) return;
    const vol = Math.max(0.08, Math.min(1, distanceScale));

    switch (weaponId) {
      case 'rifle':
        this._noiseBurst({ duration: 0.11, filterFreq: 1900, filterType: 'bandpass', gain: 0.28 * vol });
        this._tone({ freqStart: 190, freqEnd: 55, duration: 0.08, type: 'sawtooth', gain: 0.18 * vol });
        break;
      case 'shotgun':
        this._noiseBurst({ duration: 0.22, filterFreq: 950, filterType: 'lowpass', gain: 0.42 * vol });
        this._tone({ freqStart: 140, freqEnd: 38, duration: 0.16, type: 'triangle', gain: 0.3 * vol });
        break;
      case 'sniper':
        this._noiseBurst({ duration: 0.28, filterFreq: 2600, filterType: 'highpass', gain: 0.36 * vol });
        this._tone({ freqStart: 320, freqEnd: 42, duration: 0.22, type: 'sawtooth', gain: 0.28 * vol });
        break;
      case 'pistol':
        this._noiseBurst({ duration: 0.06, filterFreq: 2400, filterType: 'bandpass', gain: 0.14 * vol });
        this._tone({ freqStart: 280, freqEnd: 95, duration: 0.05, type: 'sine', gain: 0.12 * vol });
        break;
      case 'coax':
        this._noiseBurst({ duration: 0.07, filterFreq: 1600, filterType: 'bandpass', gain: 0.2 * vol });
        this._tone({ freqStart: 160, freqEnd: 70, duration: 0.05, type: 'square', gain: 0.11 * vol });
        break;
      default:
        this._noiseBurst({ duration: 0.1, filterFreq: 1800, gain: 0.2 * vol });
    }
  }

  playTankCannon(distanceScale = 1.0) {
    this.unlock();
    if (!this.enabled || !this.ctx) return;
    const vol = Math.max(0.1, Math.min(1, distanceScale));
    this._noiseBurst({ duration: 0.52, filterFreq: 520, filterType: 'lowpass', gain: 0.55 * vol });
    this._tone({ freqStart: 110, freqEnd: 28, duration: 0.42, type: 'triangle', gain: 0.45 * vol });
  }

  playExplosion(distanceScale = 1.0) {
    this.unlock();
    if (!this.enabled || !this.ctx) return;
    const vol = Math.max(0.12, Math.min(1, distanceScale));
    this._noiseBurst({ duration: 0.65, filterFreq: 680, filterType: 'lowpass', gain: 0.58 * vol });
    this._tone({ freqStart: 95, freqEnd: 24, duration: 0.48, type: 'sine', gain: 0.42 * vol });
  }

  playGrenadeBounce() {
    if (!this.enabled || !this.ctx) return;
    this._tone({ freqStart: 640, freqEnd: 320, duration: 0.04, type: 'triangle', gain: 0.08 });
  }

  playHitmarker(isHeadshot = false) {
    if (!this.enabled || !this.ctx) return;
    if (isHeadshot) {
      this._tone({ freqStart: 1450, freqEnd: 980, duration: 0.07, type: 'sine', gain: 0.22 });
    } else {
      this._tone({ freqStart: 880, freqEnd: 520, duration: 0.045, type: 'triangle', gain: 0.15 });
    }
  }

  playReload() {
    if (!this.enabled || !this.ctx) return;
    this._tone({ freqStart: 520, freqEnd: 740, duration: 0.06, type: 'square', gain: 0.06 });
  }

  playKillChime() {
    if (!this.enabled || !this.ctx) return;
    this._tone({ freqStart: 660, freqEnd: 990, duration: 0.12, type: 'sine', gain: 0.14 });
  }
}
