/**
 * Night Watch sound: what the camera microphones and the room pick up. A 60 Hz transformer hum with its
 * harmonic, an HVAC rush (filtered noise), and a burst of static on every feed change. Routed through the
 * game's playback bus, so the master mute silences it.
 */
import { playbackBus } from "../audio";

interface Running {
  stop: () => void;
  static: () => void;
  setTension: (x: number) => void;
  chime: () => void;
  squelch: () => void;
  duck: (on: boolean) => void;
}

let live: Running | null = null;

function noiseBuffer(c: AudioContext, seconds: number) {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** Start the room tone. Safe to call twice; returns the controls. Null where there is no audio. */
export function startAmbience(): Running | null {
  if (live) return live;
  let c: AudioContext;
  let dest: GainNode;
  try {
    ({ c, dest } = playbackBus());
  } catch {
    return null;
  }
  const out = c.createGain();
  out.gain.value = 0;
  out.gain.setTargetAtTime(0.5, c.currentTime, 1.5);
  out.connect(dest);
  // Transformer hum: 60 Hz and 120 Hz, slowly beating.
  const hum = c.createGain();
  hum.gain.value = 0.05;
  hum.connect(out);
  const oscs = [60, 120, 180.4].map((f, k) => {
    const o = c.createOscillator();
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.value = [1, 0.55, 0.15][k];
    o.connect(g).connect(hum);
    o.start();
    return o;
  });
  // HVAC: low-passed noise, breathing.
  const air = c.createBufferSource();
  air.buffer = noiseBuffer(c, 4);
  air.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 420;
  const airGain = c.createGain();
  airGain.gain.value = 0.06;
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 0.025;
  lfo.connect(lfoGain).connect(airGain.gain);
  lfo.start();
  air.connect(lp).connect(airGain).connect(out);
  air.start();
  const staticBuf = noiseBuffer(c, 0.35);
  live = {
    stop() {
      const now = c.currentTime;
      const end = now + 0.3;
      // Ramp to silence before the nodes stop, so leaving a shift does not click.
      try {
        out.gain.cancelScheduledValues(now);
        out.gain.setValueAtTime(out.gain.value, now);
        out.gain.linearRampToValueAtTime(0, end);
      } catch {
        /* already gone */
      }
      const halt = end + 0.02;
      try {
        for (const o of oscs) o.stop(halt);
        lfo.stop(halt);
        air.stop(halt);
      } catch {
        /* already stopped */
      }
      live = null;
      setTimeout(() => {
        air.buffer = null;
        try {
          out.disconnect();
        } catch {
          /* already disconnected */
        }
      }, 320);
    },
    static() {
      const s = c.createBufferSource();
      s.buffer = staticBuf;
      const hp = c.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 1800;
      const g = c.createGain();
      g.gain.setValueAtTime(0.12, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
      s.connect(hp).connect(g).connect(out);
      s.start();
    },
    setTension(x: number) {
      hum.gain.setTargetAtTime(0.05 + 0.04 * Math.max(0, Math.min(1, x)), c.currentTime, 2);
    },
    chime() {
      const now = c.currentTime;
      for (const [f, delay] of [[880, 0], [660, 0.12]] as const) {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, now + delay);
        g.gain.exponentialRampToValueAtTime(0.05, now + delay + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.28);
        o.connect(g).connect(out);
        o.start(now + delay);
        o.stop(now + delay + 0.3);
      }
    },
    squelch() {
      const s = c.createBufferSource();
      s.buffer = staticBuf;
      const hp = c.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 900;
      const g = c.createGain();
      g.gain.setValueAtTime(0.08, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
      s.connect(hp).connect(g).connect(out);
      s.start();
      s.stop(c.currentTime + 0.12);
    },
    duck(on: boolean) {
      hum.gain.setTargetAtTime(on ? 0.01 : 0.05, c.currentTime, 0.4);
      airGain.gain.setTargetAtTime(on ? 0.015 : 0.06, c.currentTime, 0.4);
    },
  };
  return live;
}

export function stopAmbience() {
  live?.stop();
}
