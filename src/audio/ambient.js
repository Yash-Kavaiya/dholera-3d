/**
 * Procedural Web Audio API sound generator for Dholera 3D
 * Generates ambient wind, ocean waves, highway rumble, and footsteps without any external audio files.
 */
class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.masterGain = null;
    this.windGain = null;
    this.windFilter = null;
    this.seaGain = null;
    this.highwayGain = null;
    this.stepGain = null;
    this.lastStepTime = 0;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Wind Generator (White noise through resonant bandpass)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = "bandpass";
    this.windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    whiteNoise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    whiteNoise.start();

    // Ocean Waves Generator (Pink-ish filtered noise with LFO)
    const seaNoise = this.ctx.createBufferSource();
    seaNoise.buffer = noiseBuffer;
    seaNoise.loop = true;

    const seaFilter = this.ctx.createBiquadFilter();
    seaFilter.type = "lowpass";
    seaFilter.frequency.setValueAtTime(450, this.ctx.currentTime);

    this.seaGain = this.ctx.createGain();
    this.seaGain.gain.setValueAtTime(0, this.ctx.currentTime);

    seaNoise.connect(seaFilter);
    seaFilter.connect(this.seaGain);
    this.seaGain.connect(this.masterGain);
    seaNoise.start();

    // Highway hum
    const highwayNoise = this.ctx.createBufferSource();
    highwayNoise.buffer = noiseBuffer;
    highwayNoise.loop = true;

    const highwayFilter = this.ctx.createBiquadFilter();
    highwayFilter.type = "lowpass";
    highwayFilter.frequency.setValueAtTime(140, this.ctx.currentTime);

    this.highwayGain = this.ctx.createGain();
    this.highwayGain.gain.setValueAtTime(0, this.ctx.currentTime);

    highwayNoise.connect(highwayFilter);
    highwayFilter.connect(this.highwayGain);
    this.highwayGain.connect(this.masterGain);
    highwayNoise.start();
  }

  toggle() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    this.enabled = !this.enabled;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.enabled ? 0.35 : 0, this.ctx.currentTime, 0.1);
    }
    return this.enabled;
  }

  update(cameraPos, isWalking, walkMoving) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Wind modulation by altitude
    const alt = Math.max(10, cameraPos.y);
    const windFreq = Math.min(1200, 200 + Math.sqrt(alt) * 8);
    const windVol = Math.min(0.2, 0.04 + (alt / 15000) * 0.12);
    this.windFilter.frequency.setTargetAtTime(windFreq, now, 0.3);
    this.windGain.gain.setTargetAtTime(windVol, now, 0.3);

    // Ocean modulation: louder near shoreX (east)
    const distToShore = Math.abs(cameraPos.x - 12000);
    const seaVol = distToShore < 14000 ? Math.max(0, (1 - distToShore / 14000) * 0.15) : 0;
    this.seaGain.gain.setTargetAtTime(seaVol, now, 0.5);

    // Highway rumble when near expressway
    const distToKadipur = Math.hypot(cameraPos.x - 700, cameraPos.z + 2800);
    const highwayVol = distToKadipur < 5000 ? Math.max(0, (1 - distToKadipur / 5000) * 0.1) : 0;
    this.highwayGain.gain.setTargetAtTime(highwayVol, now, 0.5);

    // Footsteps in walk mode
    if (isWalking && walkMoving && now - this.lastStepTime > 0.45) {
      this.playFootstep();
      this.lastStepTime = now;
    }
  }

  playFootstep() {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(75 + Math.random() * 20, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }
}

export const sound = new AudioManager();
