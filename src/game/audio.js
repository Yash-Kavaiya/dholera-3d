/**
 * Dholera Rising — City Ops: tiny WebAudio stinger synth.
 *
 * No assets, no network, no dependency on the ambient audio module. The context
 * is created lazily on the first user gesture (the intro Start button).
 */

export function createAudio() {
  let ctx = null;
  let enabled = true;

  function ensure() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      return ctx;
    }
    try {
      const AudioCtor = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioCtor) return null;
      ctx = new AudioCtor();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, start, duration, { type = "triangle", gain = 0.05, slide = 0 } = {}) {
    const audio = ensure();
    if (!audio || !enabled) return;
    const t0 = audio.currentTime + start;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + duration);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.03, duration * 0.25));
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(amp).connect(audio.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  return {
    get enabled() {
      return enabled;
    },
    ensure,
    toggle() {
      enabled = !enabled;
      if (enabled) ensure();
      return enabled;
    },
    /** Mission reward arpeggio. */
    mission() {
      tone(523.25, 0, 0.2, { type: "triangle", gain: 0.05 });
      tone(659.25, 0.09, 0.22, { type: "triangle", gain: 0.045 });
      tone(783.99, 0.18, 0.3, { type: "triangle", gain: 0.05 });
      tone(1046.5, 0.3, 0.42, { type: "sine", gain: 0.035 });
    },
    /** Soft two-note blip for a collected shard. */
    shard() {
      tone(1046.5, 0, 0.09, { type: "sine", gain: 0.035, slide: 220 });
      tone(1568, 0.07, 0.14, { type: "sine", gain: 0.025 });
    },
    levelUp() {
      [392, 523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => tone(freq, i * 0.075, 0.24, { type: "triangle", gain: 0.045 }));
    },
    ui() {
      tone(660, 0, 0.06, { type: "sine", gain: 0.022 });
    },
    rover() {
      tone(110, 0, 0.3, { type: "sawtooth", gain: 0.018, slide: 60 });
      tone(220, 0.05, 0.18, { type: "triangle", gain: 0.02, slide: 40 });
    },
    complete() {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => tone(freq, i * 0.12, 0.55, { type: "triangle", gain: 0.05 }));
    },
  };
}
