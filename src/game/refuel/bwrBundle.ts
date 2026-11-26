/**
 * The BWR bundle bench: one 10×10 bundle, drawn as three stacked layers, in one boiling channel.
 *
 * The owner, 26 November 2026, approved the BWR plan in docs/reactor-refuelling-by-type.md. A BWR's Friday at an
 * outage is not a radial shuffle; it's designing the reload bundle. What makes a BWR bundle a design problem:
 *
 *   - The coolant boils on the way up. Water moderates and steam doesn't, so the bottom of the core is the better
 *     moderator and power leans toward the bottom.
 *   - So bundles are built in layers. Gadolinia (a burnable absorber) holds down the bottom early in the cycle, and
 *     part-length rods stop short of the top, leaving room for water and steam where moderation is thinnest.
 *     GNF2's fact sheet: the vacated volume above part-length rods improves cold shutdown margin, and its water rods
 *     carry unboiled water to the upper bundle for moderation.
 *   - Within a layer, pins next to the water gap between channels (the edges and corners) see more thermal flux,
 *     so they run hot unless their enrichment is lower.
 *
 * The model: 12 axial nodes (four per layer) in one channel. Void comes from a simple energy balance up the channel
 * (subcooled at the bottom, then quality rising with the power below, void from a slip relation). Each node's k∞
 * depends on its layer's pins and its void; solveAxial gives the shape; void and power are iterated together.
 * Pin powers within a layer come from enrichment and position. All numbers are teaching numbers, typical of a modern
 * 10×10 bundle, not any vendor's design. Teaching model, not a license.
 */
import { solveAxial } from "./axial";

export const SIZE = 10;
export const LAYERS = 3;
export const NODES_PER_LAYER = 4;
export const NODES = LAYERS * NODES_PER_LAYER;
/** Active fuel height, cm. */
export const HEIGHT_CM = 366;

export type Pin = "L" | "H" | "G";
export const PIN_ENRICH: Record<Pin, number> = { L: 3.4, H: 4.8, G: 3.8 };
export const PIN_NAME: Record<Pin, string> = { L: "Low enrichment (3.4%)", H: "High enrichment (4.8%)", G: "Gadolinia (3.8% + Gd)" };

const idx = (r: number, c: number) => r * SIZE + c;

/** Two large water rods near the middle, each taking a 2×2 block: 8 positions, 92 fuel pins. */
export const WATER_RODS: ReadonlySet<number> = new Set([idx(3, 5), idx(3, 6), idx(4, 5), idx(4, 6), idx(5, 3), idx(5, 4), idx(6, 3), idx(6, 4)]);

/** Part-length rods: around the water rods and along the outer rows. They stop below the top layer. */
export const PART_LENGTH: ReadonlySet<number> = new Set([
  idx(2, 5), idx(2, 6), idx(4, 7), idx(5, 2), idx(7, 3), idx(7, 4),
  idx(0, 3), idx(0, 6), idx(3, 0), idx(6, 0), idx(9, 3), idx(9, 6), idx(3, 9), idx(6, 9),
]);

export const FUEL_PINS = SIZE * SIZE - WATER_RODS.size;

/** Is there a fuel pin here in this layer (0 bottom, 2 top)? */
export function hasPin(layer: number, i: number): boolean {
  if (WATER_RODS.has(i)) return false;
  if (layer === LAYERS - 1 && PART_LENGTH.has(i)) return false;
  return true;
}

/** A bundle: one pin map per layer, bottom first. Positions with no pin are ignored. */
export type Bundle = Pin[][];

export function uniformBundle(pin: Pin): Bundle {
  return Array.from({ length: LAYERS }, () => new Array<Pin>(SIZE * SIZE).fill(pin));
}

/** A bundle that passes, for tests and for the TIP trace before any outage. */
export function referenceBundle(): Bundle {
  const b = uniformBundle("H");
  for (let layer = 0; layer < LAYERS; layer++) {
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++) {
        const edge = r === 0 || c === 0 || r === SIZE - 1 || c === SIZE - 1;
        if (edge) b[layer][idx(r, c)] = "L";
      }
  }
  for (const [r, c] of [[2, 2], [2, 7], [7, 2], [7, 7], [4, 2], [2, 4], [7, 5], [5, 7]]) b[0][idx(r, c)] = "G";
  for (const [r, c] of [[2, 2], [2, 7], [7, 2], [7, 7], [4, 2], [2, 4]]) b[1][idx(r, c)] = "G";
  return b;
}

// --- Pins within a layer ---------------------------------------------------------------------------------------

/** How much thermal flux a position sees relative to the bundle middle: more by the water gap and the water rods. */
export function positionWeight(layer: number, i: number): number {
  const r = Math.floor(i / SIZE);
  const c = i % SIZE;
  const edgeR = r === 0 || r === SIZE - 1;
  const edgeC = c === 0 || c === SIZE - 1;
  let w = 1;
  if (edgeR || edgeC) w += 0.12;
  if (edgeR && edgeC) w += 0.1;
  const nb: number[] = [];
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const rr = r + dr;
    const cc = c + dc;
    if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE) nb.push(idx(rr, cc));
  }
  const wet = nb.filter((j) => !hasPin(layer, j)).length;
  w += 0.06 * wet;
  return w;
}

export interface LayerResult {
  pins: number;
  avgEnrich: number;
  gad: number;
  /** k∞ with no void and no gadolinia burnout: the lattice on its own. */
  kFuel: number;
  /** Relative pin power, average 1 over the layer's pins (NaN where no pin). */
  pinPower: number[];
  /** Hottest pin's relative power in the layer: the local peaking factor. */
  localPeak: number;
  hotPin: number;
}

/** Gadolinia still in the pins: 1 at the start of the cycle, 0 once it's burned out. */
export function layerOf(b: Bundle, layer: number, gadLeft = 1): LayerResult {
  const map = b[layer];
  let n = 0;
  let e = 0;
  let gad = 0;
  for (let i = 0; i < SIZE * SIZE; i++) {
    if (!hasPin(layer, i)) continue;
    n++;
    e += PIN_ENRICH[map[i]];
    if (map[i] === "G") gad++;
  }
  const avgEnrich = e / Math.max(1, n);
  const raw: number[] = [];
  let sum = 0;
  for (let i = 0; i < SIZE * SIZE; i++) {
    if (!hasPin(layer, i)) {
      raw.push(Number.NaN);
      continue;
    }
    const p = map[i];
    let v = positionWeight(layer, i) * (PIN_ENRICH[p] / avgEnrich);
    if (p === "G") v *= 1 - 0.65 * gadLeft;
    raw.push(v);
    sum += v;
  }
  const avg = sum / Math.max(1, n);
  const pinPower = raw.map((v) => v / avg);
  let localPeak = 0;
  let hotPin = -1;
  pinPower.forEach((v, i) => {
    if (Number.isFinite(v) && v > localPeak) {
      localPeak = v;
      hotPin = i;
    }
  });
  return { pins: n, avgEnrich, gad, kFuel: 1 + 0.11 * (avgEnrich - 2), pinPower, localPeak, hotPin };
}

// --- The channel --------------------------------------------------------------------------------------------------

/** Steam-to-water density ratio near 7 MPa, and a simple slip ratio. */
const RHO_RATIO = 0.05;
const SLIP = 1.4;
/** Fraction of the channel's power that goes into heating the water up to boiling. */
const SUBCOOLED = 0.12;
/** Bundle exit quality at rated flow. */
const EXIT_QUALITY = 0.16;
/** Each gadolinia pin's worth at the start of the cycle, in k∞, per 92 pins. */
export const TUNE = { gadWorth: 0.006, voidSlope: 0.14, vacatedGain: 0.35, m2: 250 };

export interface BundleResult {
  /** Node power, bottom to top, average 1. */
  power: number[];
  /** Void fraction per node. */
  voidFrac: number[];
  layers: LayerResult[];
  /** Axial peaking: the hottest node over the average. */
  fz: number;
  /** Hottest pin anywhere: node power × the layer's local peak, scaled for the layer's pin count. */
  hottestPin: number;
  hotNode: number;
  /** Bundle k∞ at the start of the cycle, power-weighted: what blades and gadolinia must hold down. */
  kBoc: number;
  /** Enrichment averaged over every pellet in the bundle. */
  avgEnrich: number;
  gadPins: number;
}

export interface CycleState {
  /** Share of the gadolinia left (1 start of cycle, 0 burned out). */
  gadLeft: number;
  /** k∞ already burned out of each layer, bottom first. */
  burned: [number, number, number];
}

export const BOC: CycleState = { gadLeft: 1, burned: [0, 0, 0] };

export function evaluate(b: Bundle, state: CycleState = BOC): BundleResult {
  const layers = [0, 1, 2].map((l) => layerOf(b, l, state.gadLeft));
  const vacated = PART_LENGTH.size / FUEL_PINS;
  const h = HEIGHT_CM / NODES;
  let power = new Array(NODES).fill(1);
  let voidFrac = new Array(NODES).fill(0);
  let kInf: number[] = [];
  for (let it = 0; it < 40; it++) {
    // Quality up the channel from the power below each node's middle.
    const total = power.reduce((x, y) => x + y, 0);
    let below = 0;
    const nextVoid = power.map((p) => {
      const mid = (below + p / 2) / total;
      below += p;
      const x = EXIT_QUALITY * Math.max(0, (mid - SUBCOOLED) / (1 - SUBCOOLED));
      return x / (x + SLIP * (1 - x) * RHO_RATIO);
    });
    voidFrac = voidFrac.map((v, i) => 0.5 * v + 0.5 * nextVoid[i]);
    kInf = voidFrac.map((a, node) => {
      const layer = Math.floor(node / NODES_PER_LAYER);
      const L = layers[layer];
      const extraWater = layer === LAYERS - 1 ? vacated : 0;
      const moderation = 1 - TUNE.voidSlope * a + TUNE.vacatedGain * extraWater * a;
      const gad = TUNE.gadWorth * L.gad * (FUEL_PINS / Math.max(1, L.pins)) * state.gadLeft;
      return L.kFuel * moderation - gad - state.burned[layer];
    });
    // An effective migration area: this one channel stands in for the whole core's axial coupling, set so a plain
    // bundle leans to the bottom the way a BWR core does (axial peaking around 1.6), not the bare-pin 60 cm².
    const m2 = voidFrac.map((a) => TUNE.m2 / Math.pow(1 - 0.3 * a, 2));
    const r = solveAxial(kInf, m2, h, 0.35, power);
    power = power.map((p, i) => 0.5 * p + 0.5 * r.power[i]);
  }
  const avg = power.reduce((x, y) => x + y, 0) / NODES;
  power = power.map((p) => p / avg);
  let fz = 0;
  let hottestPin = 0;
  let hotNode = 0;
  power.forEach((p, node) => {
    fz = Math.max(fz, p);
    const L = layers[Math.floor(node / NODES_PER_LAYER)];
    const perPin = p * (FUEL_PINS / L.pins) * L.localPeak;
    if (perPin > hottestPin) {
      hottestPin = perPin;
      hotNode = node;
    }
  });
  const kBoc = kInf.reduce((s, k, i) => s + k * power[i], 0) / NODES;
  const pellets = layers.reduce((s, L) => s + L.pins, 0);
  const avgEnrich = layers.reduce((s, L) => s + L.avgEnrich * L.pins, 0) / pellets;
  const gadPins = layers.reduce((s, L) => s + L.gad, 0);
  return { power, voidFrac, layers, fz, hottestPin, hotNode, kBoc, avgEnrich, gadPins };
}

// --- The limits --------------------------------------------------------------------------------------------------

export const LIMITS = {
  /** Axial peaking. */
  fz: 1.45,
  /** Local (pin) peaking in any layer. */
  local: 1.3,
  /** Hottest pin over the bundle-average pin: a teaching stand-in for the linear heat rate limit. */
  hottestPin: 1.8,
  /** Start-of-cycle k∞ the blades and gadolinia can hold. */
  kBoc: 1.16,
  /** Enrichment window: enough energy for the cycle, and no more than the fuel budget buys. */
  enrichMin: 3.9,
  enrichMax: 4.4,
};

export interface Check {
  id: "fz" | "local" | "hot" | "kboc" | "enrich";
  label: string;
  value: string;
  ok: boolean;
  why: string;
}

export function checks(r: BundleResult): Check[] {
  const local = Math.max(...r.layers.map((L) => L.localPeak));
  return [
    {
      id: "enrich",
      label: "Average enrichment",
      value: `${r.avgEnrich.toFixed(2)}%`,
      ok: r.avgEnrich >= LIMITS.enrichMin && r.avgEnrich <= LIMITS.enrichMax,
      why: `Between ${LIMITS.enrichMin}% (enough energy to last the cycle) and ${LIMITS.enrichMax}% (what the fuel budget buys).`,
    },
    {
      id: "kboc",
      label: "Start-of-cycle k∞",
      value: r.kBoc.toFixed(3),
      ok: r.kBoc <= LIMITS.kBoc,
      why: `At or under ${LIMITS.kBoc}. Above that, the control blades can't hold the fresh fuel down. Gadolinia is how you lower it.`,
    },
    {
      id: "fz",
      label: "Axial peaking",
      value: r.fz.toFixed(2),
      ok: r.fz <= LIMITS.fz,
      why: `At or under ${LIMITS.fz}. Boiling makes power lean to the bottom; gadolinia low down pushes it back up.`,
    },
    {
      id: "local",
      label: "Pin peaking",
      value: local.toFixed(2),
      ok: local <= LIMITS.local,
      why: `At or under ${LIMITS.local} in every layer. Edges and corners sit by the water gap and run hot: give them lower enrichment.`,
    },
    {
      id: "hot",
      label: "Hottest pin",
      value: r.hottestPin.toFixed(2),
      ok: r.hottestPin <= LIMITS.hottestPin,
      why: `At or under ${LIMITS.hottestPin} times the average pin, a teaching stand-in for the linear heat rate limit.`,
    },
  ];
}

export function passes(r: BundleResult): boolean {
  return checks(r).every((c) => c.ok);
}

/** Where the bundle is in the cycle, for the TIP trace on a week without an outage. */
export function cycleState(phase: "boc" | "moc" | "eoc" | "eq"): CycleState {
  if (phase === "moc") return { gadLeft: 0.35, burned: [0.05, 0.03, 0.01] };
  if (phase === "eoc") return { gadLeft: 0, burned: [0.1, 0.07, 0.03] };
  return BOC;
}

/** A bundle read back from storage, or null if it isn't one. */
export function validBundle(x: unknown): Bundle | null {
  if (!Array.isArray(x) || x.length !== LAYERS) return null;
  for (const l of x) {
    if (!Array.isArray(l) || l.length !== SIZE * SIZE) return null;
    if (!l.every((p) => p === "L" || p === "H" || p === "G")) return null;
  }
  return x as Bundle;
}
