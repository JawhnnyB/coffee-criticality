/** Pillar F — the plant has a voice. Web Audio only. No sample library. */

export type BedKind = "cafe" | "plant" | "menu" | "lot";
export type FootKind = "wood" | "stone" | "grass" | "asphalt" | "metal" | "curb" | "stripe";

type Period = "morning" | "midday" | "afternoon";

const MASTER = 0.18;
const DUCK = 0.28;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let music: GainNode | null = null;
let sfx: GainNode | null = null;
let muted = false;
try {
  muted = localStorage.getItem("cc.mute") === "1";
} catch {
  /* */
}
let lastFoot = -1;
let unlocked = false;
let gesturing = false;
let duckAmt = 1;
let kettleAcc = 0;
let noise: AudioBuffer | null = null;

type Voice = {
  kind: BedKind;
  period: Period;
  nodes: AudioNode[];
  osc: OscillatorNode[];
  gain: GainNode;
};
let bed: Voice | null = null;
let dying: Voice | null = null;
let steamGain: GainNode | null = null;
let steamSrc: AudioBufferSourceNode | null = null;
let coreOsc: OscillatorNode | null = null;
let coreGain: GainNode | null = null;

function ac() {
  if (ctx) return ctx;
  const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  try {
    ctx = new C({ latencyHint: "interactive" });
  } catch {
    ctx = new C();
  }
  master = ctx.createGain();
  music = ctx.createGain();
  sfx = ctx.createGain();
  master.gain.value = muted ? 0 : MASTER;
  music.gain.value = 1;
  sfx.gain.value = 1;
  music.connect(master);
  sfx.connect(master);
  master.connect(ctx.destination);
  return ctx;
}

function bus() {
  ac();
  return { c: ctx!, master: master!, music: music!, sfx: sfx! };
}

function noiseBuf() {
  const c = ac();
  if (noise) return noise;
  const n = Math.floor(c.sampleRate * 1.2);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  noise = buf;
  return buf;
}

export function isMuted() {
  return muted;
}

export function setMuted(v: boolean) {
  muted = v;
  const { c, master: m } = bus();
  m.gain.cancelScheduledValues(c.currentTime);
  m.gain.setTargetAtTime(v ? 0 : MASTER, c.currentTime, 0.04);
  try {
    localStorage.setItem("cc.mute", v ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function onGesture() {
  if (gesturing) return;
  gesturing = true;
  const c = ac();
  if (c.state === "suspended") void c.resume();
  try {
    if (localStorage.getItem("cc.mute") === "1") setMuted(true);
  } catch {
    /* ignore */
  }
}

export function unlockAudio() {
  if (unlocked) {
    onGesture();
    return;
  }
  unlocked = true;
  try {
    if (localStorage.getItem("cc.mute") === "1") muted = true;
  } catch {
    /* ignore */
  }
  window.addEventListener("pointerdown", onGesture, { capture: true });
  window.addEventListener("keydown", onGesture, { capture: true });
  window.addEventListener("touchend", onGesture, { capture: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && ctx?.state === "suspended") void ctx.resume();
  });
  onGesture();
}

function killVoice(v: Voice, when: number) {
  const { c } = bus();
  v.gain.gain.cancelScheduledValues(c.currentTime);
  v.gain.gain.setTargetAtTime(0.0001, c.currentTime, 0.06);
  window.setTimeout(() => {
    for (const o of v.osc) {
      try {
        o.stop();
      } catch {
        /* stopped */
      }
      try {
        o.disconnect();
      } catch {
        /* */
      }
    }
    for (const n of v.nodes) {
      try {
        n.disconnect();
      } catch {
        /* */
      }
    }
    try {
      v.gain.disconnect();
    } catch {
      /* */
    }
    if (dying === v) dying = null;
  }, when);
}

function periodFilter(kind: BedKind, period: Period) {
  const base = kind === "plant" ? 260 : kind === "lot" ? 380 : kind === "menu" ? 420 : 520;
  if (period === "morning") return base * 1.18;
  if (period === "afternoon") return base * 0.72;
  return base;
}

function periodGain(kind: BedKind, period: Period) {
  const base = kind === "plant" ? 0.034 : kind === "lot" ? 0.028 : kind === "menu" ? 0.04 : 0.048;
  if (period === "afternoon") return base * 0.82;
  if (period === "morning") return base * 1.06;
  return base;
}

function makeBed(kind: BedKind, period: Period): Voice {
  const { c, music: dest } = bus();
  const gain = c.createGain();
  gain.gain.value = 0.0001;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = periodFilter(kind, period);
  filter.Q.value = 0.7;
  filter.connect(gain);
  gain.connect(dest);
  const osc: OscillatorNode[] = [];
  const nodes: AudioNode[] = [filter];

  const tone = (freq: number, type: OscillatorType, g = 1) => {
    const o = c.createOscillator();
    const og = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    og.gain.value = g;
    o.connect(og);
    og.connect(filter);
    o.start();
    osc.push(o);
    nodes.push(og);
  };

  if (kind === "cafe") {
    tone(110, "sine", 1);
    tone(165, "sine", 0.22);
    tone(330, "triangle", 0.05);
  } else if (kind === "plant") {
    tone(58, "sine", 1);
    tone(87, "sine", 0.18);
    const lfo = c.createOscillator();
    const lfoG = c.createGain();
    lfo.frequency.value = 0.11;
    lfoG.gain.value = 0.008;
    lfo.connect(lfoG);
    lfoG.connect(gain.gain);
    lfo.start();
    osc.push(lfo);
    nodes.push(lfoG);
  } else if (kind === "lot") {
    tone(48, "sine", 0.7);
    const src = c.createBufferSource();
    src.buffer = noiseBuf();
    src.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 240;
    const ng = c.createGain();
    ng.gain.value = 0.35;
    src.connect(lp);
    lp.connect(ng);
    ng.connect(filter);
    src.start();
    nodes.push(src, lp, ng);
  } else {
    tone(82, "triangle", 1);
    tone(123, "sine", 0.15);
  }

  return { kind, period, nodes, osc, gain };
}

function playBedNow(kind: BedKind, period: Period) {
  const { c } = bus();
  if (bed && bed.kind === kind) {
    if (bed.period !== period) {
      bed.period = period;
      const f = bed.nodes[0];
      if (f instanceof BiquadFilterNode) {
        f.frequency.setTargetAtTime(periodFilter(kind, period), c.currentTime, 0.2);
      }
      bed.gain.gain.setTargetAtTime(periodGain(kind, period), c.currentTime, 0.2);
    }
    return;
  }
  if (dying) killVoice(dying, 20);
  if (bed) {
    dying = bed;
    killVoice(bed, 320);
    bed = null;
  }
  const v = makeBed(kind, period);
  v.gain.gain.setTargetAtTime(periodGain(kind, period), c.currentTime, 0.08);
  bed = v;
}

export function playBed(kind: BedKind) {
  playBedNow(kind, "midday");
}

function duckTo(mode: string) {
  const { c, music: m } = bus();
  const next =
    mode === "pause" || mode === "dialogue" || mode === "incident" || mode === "academy" || mode === "still"
      ? DUCK
      : 1;
  if (Math.abs(next - duckAmt) < 0.01) return;
  duckAmt = next;
  m.gain.cancelScheduledValues(c.currentTime);
  m.gain.setTargetAtTime(next, c.currentTime, 0.07);
}

function stopSteam() {
  if (steamSrc) {
    try {
      steamSrc.stop();
    } catch {
      /* */
    }
    try {
      steamSrc.disconnect();
    } catch {
      /* */
    }
    steamSrc = null;
  }
  if (steamGain) {
    try {
      steamGain.disconnect();
    } catch {
      /* */
    }
    steamGain = null;
  }
}

function setSteam(level: number) {
  const { c, sfx: dest } = bus();
  const target = Math.max(0.0001, level);
  if (!steamSrc || !steamGain) {
    const src = c.createBufferSource();
    src.buffer = noiseBuf();
    src.loop = true;
    const hp = c.createBiquadFilter();
    hp.type = "bandpass";
    hp.frequency.value = 1400;
    hp.Q.value = 0.6;
    const g = c.createGain();
    g.gain.value = 0.0001;
    src.connect(hp);
    hp.connect(g);
    g.connect(dest);
    src.start();
    steamSrc = src;
    steamGain = g;
  }
  steamGain.gain.setTargetAtTime(target, c.currentTime, 0.12);
}

function setCore(on: boolean) {
  const { c, music: dest } = bus();
  const target = on ? 0.016 : 0.0001;
  if (!coreOsc || !coreGain) {
    if (!on) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = 42;
    g.gain.value = 0.0001;
    const lfo = c.createOscillator();
    const lfoG = c.createGain();
    lfo.frequency.value = 0.35;
    lfoG.gain.value = 0.006;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    o.connect(g);
    g.connect(dest);
    o.start();
    lfo.start();
    coreOsc = o;
    coreGain = g;
  }
  coreGain.gain.setTargetAtTime(target, c.currentTime, 0.12);
}

function playKettle() {
  if (muted) return;
  const { c, sfx: dest } = bus();
  const t0 = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.value = 1760;
  g.gain.setValueAtTime(0.012, t0);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.05);
  o.connect(g);
  g.connect(dest);
  o.start(t0);
  o.stop(t0 + 0.06);
  o.onended = () => {
    try {
      o.disconnect();
      g.disconnect();
    } catch {
      /* */
    }
  };
}

export function bedForRoom(room: string, mode: string): BedKind {
  if (
    mode === "splash" ||
    mode === "menu" ||
    mode === "how" ||
    mode === "credits" ||
    mode === "role" ||
    mode === "build" ||
    mode === "intro" ||
    mode === "brief" ||
    mode === "eod" ||
    mode === "ending"
  ) {
    return "menu";
  }
  if (room === "cafe" || room === "parlor" || room === "breakroom") return "cafe";
  if (room === "gate") return "lot";
  return "plant";
}

export function syncWorld(w: {
  room: string;
  period: Period;
  mode: string;
  valveSteam: boolean;
  dt: number;
}) {
  if (!ctx && !gesturing) return;
  const c = ac();
  if (c.state === "suspended") return;
  const kind = bedForRoom(w.room, w.mode);
  playBedNow(kind, w.period);
  duckTo(w.mode);
  const cafe = w.room === "cafe" || w.room === "breakroom";
  const steam =
    w.room === "cafe"
      ? 0.014
      : w.room === "breakroom"
        ? 0.01
        : w.valveSteam
          ? 0.05
          : w.room === "reactor"
            ? 0.018
            : 0;
  setSteam(steam);
  setCore(w.room === "reactor" && (w.mode === "play" || w.mode === "pause" || w.mode === "dialogue"));
  if (cafe && (w.mode === "play" || w.mode === "dialogue")) {
    kettleAcc += w.dt;
    if (kettleAcc >= 2.6) {
      kettleAcc = 0;
      playKettle();
    }
  } else {
    kettleAcc = 0;
  }
}

function burst(freq: number, dur: number, gain: number, type: OscillatorType = "triangle", freqTo?: number) {
  if (muted) return;
  const { c, sfx: dest } = bus();
  const t0 = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (freqTo) o.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), t0 + dur * 0.75);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  o.connect(g);
  g.connect(dest);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
  o.onended = () => {
    try {
      o.disconnect();
      g.disconnect();
    } catch {
      /* */
    }
  };
}

function rustle(dur: number, gain: number, hp: number) {
  if (muted) return;
  const { c, sfx: dest } = bus();
  const t0 = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuf();
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = hp;
  f.Q.value = 0.8;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  src.connect(f);
  f.connect(g);
  g.connect(dest);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
  src.onended = () => {
    try {
      src.disconnect();
      f.disconnect();
      g.disconnect();
    } catch {
      /* */
    }
  };
}

export function playBlip(kind: "ok" | "warn" | "click") {
  if (kind === "ok") burst(520, 0.16, 0.07);
  else if (kind === "warn") burst(220, 0.18, 0.07, "triangle", 160);
  else burst(340, 0.1, 0.05);
}

/**
 * Animal Crossing-style mouth blip. Procedural on purpose: this file is Web Audio only,
 * and a pitch is the whole "voice." No sample, no phonemes.
 * Drop is the pitch envelope so it reads as a tick, not a beep.
 */
const VOICE: Record<string, { f: number; type: OscillatorType; drop: number; gain: number }> = {
  mabel: { f: 186, type: "sine", drop: 0.78, gain: 0.07 },
  holt: { f: 138, type: "triangle", drop: 0.86, gain: 0.065 },
  elena: { f: 294, type: "triangle", drop: 0.74, gain: 0.06 },
  tommy: { f: 164, type: "square", drop: 0.9, gain: 0.028 },
  marcus: { f: 246, type: "sine", drop: 0.62, gain: 0.06 },
  priya: { f: 370, type: "sine", drop: 0.8, gain: 0.055 },
  jordan: { f: 330, type: "triangle", drop: 0.7, gain: 0.055 },
  player: { f: 220, type: "sine", drop: 0.76, gain: 0.06 },
  narrator: { f: 262, type: "triangle", drop: 0.8, gain: 0.05 },
};

export function voiceFor(speaker: string) {
  const s = speaker.toLowerCase();
  if (s.includes("mabel")) return "mabel";
  if (s.includes("holt")) return "holt";
  if (s.includes("elena")) return "elena";
  if (s.includes("tommy")) return "tommy";
  if (s.includes("marcus")) return "marcus";
  if (s.includes("priya")) return "priya";
  if (s.includes("jordan")) return "jordan";
  if (s.includes("you") || s.includes("player")) return "player";
  return "narrator";
}

export function playVoice(who: string) {
  const v = VOICE[voiceFor(who)] ?? VOICE.narrator;
  const jitter = 0.94 + Math.random() * 0.1;
  const f = v.f * jitter;
  burst(f, 0.048, v.gain, v.type, Math.max(40, f * v.drop));
}

const FOOT: Record<FootKind, { f: number; n: number }> = {
  wood: { f: 186, n: 0.028 },
  stone: { f: 142, n: 0.034 },
  metal: { f: 248, n: 0.022 },
  asphalt: { f: 118, n: 0.04 },
  grass: { f: 96, n: 0.045 },
  curb: { f: 128, n: 0.036 },
  stripe: { f: 118, n: 0.04 },
};

export function playFoot(floor: FootKind | boolean, phase: number) {
  const step = Math.floor(phase);
  if (step === lastFoot || step % 2 !== 1) return;
  lastFoot = step;
  const kind: FootKind = typeof floor === "boolean" ? (floor ? "wood" : "asphalt") : floor;
  const spec = FOOT[kind] ?? FOOT.wood;
  const jitter = 0.92 + Math.random() * 0.16;
  burst(spec.f * jitter, 0.055, 0.035 * (0.85 + Math.random() * 0.3), "triangle");
  rustle(0.04, spec.n * jitter, kind === "metal" ? 1800 : 700);
}

export function playDoor() {
  burst(88, 0.16, 0.06, "triangle", 62);
  rustle(0.12, 0.03, 400);
}

export function playSit() {
  burst(96, 0.14, 0.05, "sine", 70);
  rustle(0.1, 0.025, 500);
}

export function playStand() {
  burst(140, 0.1, 0.04, "triangle", 180);
}

export function playTalk() {
  rustle(0.08, 0.03, 2100);
  burst(420, 0.07, 0.025, "sine");
}

export function playCatch() {
  burst(392, 0.18, 0.055, "sine");
  burst(588, 0.16, 0.045, "sine");
  rustle(0.06, 0.02, 1600);
}

export function playReport() {
  burst(392, 0.22, 0.06, "triangle", 523);
  rustle(0.14, 0.028, 1800);
}

export function playHide() {
  burst(220, 0.2, 0.06, "triangle", 140);
  rustle(0.16, 0.03, 300);
}

/** CATCH hit. */
export function playHuntHit() {
  playCatch();
}

/** CATCH miss. */
export function playHuntMiss() {
  burst(160, 0.2, 0.08, "triangle", 90);
  rustle(0.1, 0.04, 280);
}

/** Music ducks on a DELAY event. */
export function duckHit() {
  const { c, music: m } = bus();
  m.gain.cancelScheduledValues(c.currentTime);
  m.gain.setTargetAtTime(0.32, c.currentTime, 0.03);
  m.gain.setTargetAtTime(Math.max(0.32, duckAmt), c.currentTime + 0.28, 0.14);
}

let lastPeriodTick = 0;
/** Tick rate follows period T — long T is a slow clock. */
export function playPeriodTick(T: number) {
  const interval = Math.max(0.11, Math.min(1.35, (T > 40 ? 24 : T) / 14));
  const now = (typeof performance !== "undefined" ? performance.now() : Date.now()) / 1000;
  if (now - lastPeriodTick < interval) return;
  lastPeriodTick = now;
  const f = T > 20 ? 170 : T > 8 ? 240 : 390;
  burst(f, 0.07, 0.028, "sine");
}

export function getAudioProbe() {
  return {
    muted,
    bed: bed?.kind ?? null,
    period: bed?.period ?? null,
    duck: duckAmt,
    ctx: ctx?.state ?? "none",
    steam: steamGain ? steamGain.gain.value : 0,
    core: coreGain ? coreGain.gain.value : 0,
    unlocked: gesturing,
  };
}
