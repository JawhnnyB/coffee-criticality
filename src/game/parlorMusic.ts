/**
 * The Music app's four tracks, one per season. Every note is generated in code. No audio file is shipped.
 * public/music/manifest.json says how each track is made, and a test checks the two agree.
 *
 * The pattern generator is pure, so the tests can check it. The player schedules notes on the
 * shared audio context through the Music bus, and holds the existing bed down while a track plays.
 */
import { playbackBus, setMusicHold } from "./audio";
import { SEASONS, type Season } from "./parlorOS";

export interface TrackDef {
  season: Season;
  title: string;
  bpm: number;
  /** MIDI note of the scale's root. */
  root: number;
  /** Scale steps in semitones from the root. */
  scale: number[];
  /** Chord root for each bar, as a scale degree. */
  progression: number[];
  lead: OscillatorType;
  pad: OscillatorType;
  /** Chance (0–1) that the lead plays on an eighth note. Lower is sparser. */
  density: number;
}

export const TRACKS: Record<Season, TrackDef> = {
  spring: {
    season: "spring",
    title: "Spring rain, first light",
    bpm: 96,
    root: 57,
    scale: [0, 2, 4, 7, 9],
    progression: [0, 3, 4, 0],
    lead: "triangle",
    pad: "sine",
    density: 0.55,
  },
  summer: {
    season: "summer",
    title: "Summer glare on the taskbar",
    bpm: 116,
    root: 60,
    scale: [0, 2, 4, 5, 7, 9, 11],
    progression: [0, 4, 5, 3],
    lead: "triangle",
    pad: "sine",
    density: 0.7,
  },
  fall: {
    season: "fall",
    title: "Fall leaves, long shadows",
    bpm: 88,
    root: 57,
    scale: [0, 2, 3, 5, 7, 9, 10],
    progression: [0, 5, 3, 6],
    lead: "sine",
    pad: "triangle",
    density: 0.5,
  },
  winter: {
    season: "winter",
    title: "Winter, cream lamps",
    bpm: 72,
    root: 50,
    scale: [0, 2, 3, 5, 7, 8, 10],
    progression: [0, 5, 2, 6],
    lead: "sine",
    pad: "triangle",
    density: 0.3,
  },
};

export function trackFor(season: Season): TrackDef {
  return TRACKS[season];
}

/** MIDI note to frequency, equal temperament, A4 = 440 Hz. */
export function freqOf(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** A small seeded generator. Same seed, same tune: the pattern is reproducible and testable. */
export function rng(seed: number): () => number {
  let x = (seed >>> 0) || 1;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    return x / 4294967296;
  };
}

export interface NoteEvent {
  /** Position in eighth notes from the start of the track. */
  at: number;
  /** Length in eighth notes. */
  len: number;
  midi: number;
  kind: "lead" | "pad" | "bass";
}

/** Eighth notes in one bar. */
export const EIGHTHS_PER_BAR = 8;

/** The notes for one bar. Pure: same track, same bar, same seed, same notes. */
export function barEvents(track: TrackDef, bar: number, seed = 1): NoteEvent[] {
  const random = rng(seed * 7919 + bar * 104729 + track.bpm);
  const degree = track.progression[bar % track.progression.length];
  const scaleAt = (d: number) => {
    const n = track.scale.length;
    const octave = Math.floor(d / n);
    return track.root + track.scale[((d % n) + n) % n] + 12 * octave;
  };
  const events: NoteEvent[] = [];
  const base = bar * EIGHTHS_PER_BAR;
  // Pad: the chord (root, third, fifth) held through the bar.
  for (const step of [0, 2, 4]) {
    events.push({ at: base, len: EIGHTHS_PER_BAR, midi: scaleAt(degree + step) - 12, kind: "pad" });
  }
  // Bass: the chord root on beats one and three.
  events.push({ at: base, len: 2, midi: scaleAt(degree) - 24, kind: "bass" });
  events.push({ at: base + 4, len: 2, midi: scaleAt(degree) - 24, kind: "bass" });
  // Lead: a few notes chosen from the scale, around the chord.
  for (let i = 0; i < EIGHTHS_PER_BAR; i++) {
    if (random() > track.density) continue;
    const pick = Math.floor(random() * 5) - 1 + degree;
    events.push({ at: base + i, len: 1 + (random() < 0.3 ? 1 : 0), midi: scaleAt(pick) + 12, kind: "lead" });
  }
  return events;
}

/** Seconds per eighth note. */
export function eighthSeconds(bpm: number): number {
  return 60 / bpm / 2;
}

/**
 * Plays one track in a loop on the shared audio context. Start only from a click (the Music app's
 * Play button), so no music runs before the player asks for it.
 */
export class TrackPlayer {
  private season: Season | null = null;
  private timer: number | null = null;
  private nextAt = 0;
  private bar = 0;
  private gain: GainNode | null = null;
  private ctx: AudioContext | null = null;
  private level = 0.8;

  get playing(): boolean {
    return this.timer !== null;
  }

  get current(): Season | null {
    return this.season;
  }

  start(season: Season) {
    if (typeof window === "undefined") return;
    this.stop();
    const { c, dest } = playbackBus();
    this.ctx = c;
    this.gain = c.createGain();
    this.gain.gain.value = this.level;
    this.gain.connect(dest);
    this.season = season;
    this.bar = 0;
    this.nextAt = c.currentTime + 0.1;
    setMusicHold(true);
    this.timer = window.setInterval(() => this.pump(), 100);
    this.pump();
  }

  stop() {
    if (this.timer !== null && typeof window !== "undefined") window.clearInterval(this.timer);
    this.timer = null;
    if (this.gain) {
      try {
        this.gain.disconnect();
      } catch {
        /* already gone */
      }
    }
    this.gain = null;
    setMusicHold(false);
  }

  /** The next season's track, in calendar order. */
  skip() {
    if (!this.season) return;
    const i = SEASONS.indexOf(this.season);
    this.start(SEASONS[(i + 1) % SEASONS.length]);
  }

  setVolume(v: number) {
    this.level = Math.max(0, Math.min(1, v));
    if (this.gain && this.ctx) this.gain.gain.setTargetAtTime(this.level, this.ctx.currentTime, 0.05);
  }

  private pump() {
    if (!this.ctx || !this.gain || !this.season) return;
    const track = TRACKS[this.season];
    const step = eighthSeconds(track.bpm);
    while (this.nextAt < this.ctx.currentTime + 0.35) {
      for (const e of barEvents(track, this.bar, 1)) {
        // e.at counts eighths from the start of the track; this bar starts at nextAt.
        const offset = (e.at - this.bar * EIGHTHS_PER_BAR) * step;
        this.voice(track, e, this.nextAt + offset, step);
      }
      this.nextAt += EIGHTHS_PER_BAR * step;
      this.bar += 1;
    }
  }

  private voice(track: TrackDef, e: NoteEvent, when: number, step: number) {
    const c = this.ctx!;
    const out = this.gain!;
    const o = c.createOscillator();
    const g = c.createGain();
    const dur = Math.max(0.05, e.len * step);
    const type = e.kind === "lead" ? track.lead : e.kind === "pad" ? track.pad : "triangle";
    const peak = e.kind === "lead" ? 0.16 : e.kind === "pad" ? 0.05 : 0.1;
    o.type = type;
    o.frequency.value = freqOf(e.midi);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(peak, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(out);
    o.start(when);
    o.stop(when + dur + 0.05);
  }
}
