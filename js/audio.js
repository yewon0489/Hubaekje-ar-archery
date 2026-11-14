/**
 * Spatial Audio Controller
 * Manages Web Audio API sound synthesis and stereo panning for archery feedback.
 */
class SoundController {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Bowstring release whoosh sound
  playRelease(power) {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320 + power * 380, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);
    gain.gain.setValueAtTime(0.25 + power * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.20);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.20);
  }

  // 3D Spatial Impact Thud + Shaft Resonance ("팅-!")
  playSpatialHit(isBullseye, panVal = 0) {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    let dest = this.ctx.destination;
    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, panVal));
      panner.connect(dest);
      dest = panner;
    }

    // Heavy Wood Impact Thud (150Hz -> 35Hz)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(150, now);
    osc1.frequency.exponentialRampToValueAtTime(35, now + 0.18);
    gain1.gain.setValueAtTime(0.45, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.20);
    osc1.connect(gain1);
    gain1.connect(dest);
    osc1.start(now);
    osc1.stop(now + 0.20);

    // Shaft Resonance Twang ("팅-!")
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(isBullseye ? 940 : 680, now);
    osc2.frequency.exponentialRampToValueAtTime(isBullseye ? 470 : 340, now + 0.32);
    gain2.gain.setValueAtTime(isBullseye ? 0.35 : 0.22, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(dest);
    osc2.start(now);
    osc2.stop(now + 0.35);
  }

  // Victory fanfare on 5th target hit
  playFanfare() {
    if (this.muted || !this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.38);
      }, idx * 110);
    });
  }
}

window.sound = new SoundController();
