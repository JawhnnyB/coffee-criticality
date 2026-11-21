/**
 * Night Watch: the overnight shift at the site, 00:00 to 06:00, five nights.
 *
 * The loop follows the two genres the owner pointed at. From the camera-watch survival games: a fixed office,
 * a tablet of cameras, a clock that must reach 06:00, and one scarce resource (here, coffee: watching the
 * cameras drains it). From the anomaly-spotting games: nothing jumps out; something is different, and the job is
 * to notice it on the right camera and file the right report.
 *
 * Every anomaly is a real kind of plant problem. It shows on a camera first and moves the plant's readings; if
 * nobody reports it, a reading crosses its alarm (the annunciator flashes), and then the event runs its course: a
 * reactor trip ends the night, a finding costs credibility. Oddities are harmless liminal things (a light that
 * flickers, a chair in a corridor). Reporting one is a false report. Telling the two apart is the lesson.
 *
 * Numbers: temperatures come from the game's thermal model (plant.ts) for the site. Pressures are the published
 * nominal values for each type (PWR 15.5 MPa primary and 6.9 MPa steam; BWR 7.0 MPa; HTR-PM helium 7 MPa; MSRE
 * cover gas 5 psig). Radiation is shown against its own normal level (×N), not in dose units, under the
 * project's rule that player-visible dose values need an approved source.
 */
import { thermalState } from "../plant";
import type { SiteKind } from "../plantLoops";

export type Category = "leak" | "radiation" | "equipment" | "electrical" | "access" | "foreign";

export const CATEGORY_LABEL: Record<Category, string> = {
  leak: "Leak",
  radiation: "Radiation",
  equipment: "Pump or machine",
  electrical: "Electrical",
  access: "Door or barrier",
  foreign: "Something left behind",
};

export interface Metric {
  id: string;
  label: string;
  unit: string;
  base: number;
  /** Alarm when the reading leaves [lo, hi]. */
  lo: number;
  hi: number;
  digits: number;
  /** Shown as a level against normal (radiation) rather than a number. */
  ratio?: boolean;
}

export interface Camera {
  id: string;
  name: string;
  /** Which scene the camera draws. */
  scene: string;
}

export interface EventDef {
  id: string;
  title: string;
  camera: string;
  /** Reports that count as a catch. */
  accept: Category[];
  /** Change in each reading when fully developed (added to its base; ratio metrics multiply). */
  effect: Record<string, number>;
  /** Game minutes from start until the readings are fully developed. */
  develop: number;
  /** Game minutes from start until the event runs its course if nobody reports it. */
  escalate: number;
  consequence: "trip" | "finding";
  /** What the camera shows (scene layer). */
  visual: string;
  /** One line for the shift log afterwards. */
  log: string;
}

export interface Oddity {
  id: string;
  camera: string;
  visual: string;
}

export interface SiteWatch {
  metrics: Metric[];
  cameras: Camera[];
  events: EventDef[];
  oddities: Oddity[];
}

const SHARED_CAMERAS: Camera[] = [
  { id: "turbine", name: "Turbine deck", scene: "turbine" },
  { id: "aux", name: "Aux building, 2nd floor", scene: "corridor" },
  { id: "pool", name: "Spent fuel pool", scene: "pool" },
  { id: "yard", name: "Switchyard", scene: "yard" },
  { id: "intake", name: "Intake structure", scene: "intake" },
];

const SHARED_EVENTS: EventDef[] = [
  {
    id: "feed-pump",
    title: "Feed pump B tripped",
    camera: "turbine",
    accept: ["equipment"],
    effect: { feed: -45, steam: -12 },
    develop: 6,
    escalate: 40,
    consequence: "trip",
    visual: "pumpStopped",
    log: "Feed pump B tripped on low suction pressure. Runback on one pump.",
  },
  {
    id: "radwaste-leak",
    title: "Radwaste line weeping",
    camera: "aux",
    accept: ["leak", "radiation"],
    effect: { gAux: 6 },
    develop: 30,
    escalate: 70,
    consequence: "finding",
    visual: "puddle",
    log: "Radwaste line flange weeping under the pipe chase. Area roped off, flange retorqued.",
  },
  {
    id: "lhra-door",
    title: "Locked high radiation door open",
    camera: "aux",
    accept: ["access"],
    effect: {},
    develop: 1,
    escalate: 50,
    consequence: "finding",
    visual: "doorAjar",
    log: "Locked high radiation area door found ajar. Latch adjusted, area surveyed, door locked.",
  },
  {
    id: "pool-fme",
    title: "Tool bag at the pool edge",
    camera: "pool",
    accept: ["foreign"],
    effect: {},
    develop: 1,
    escalate: 60,
    consequence: "finding",
    visual: "toolBag",
    log: "Unattended tool bag inside the pool's foreign-material exclusion line. Removed and logged.",
  },
  {
    id: "pool-level",
    title: "Fuel pool level falling",
    camera: "pool",
    accept: ["leak"],
    effect: { pool: -0.6 },
    develop: 45,
    escalate: 90,
    consequence: "finding",
    visual: "poolLow",
    log: "Fuel pool gate seal leaking by. Makeup started, seal reinflated.",
  },
  {
    id: "yard-arc",
    title: "Insulator flashover in the switchyard",
    camera: "yard",
    accept: ["electrical"],
    effect: { grid: -6 },
    develop: 4,
    escalate: 30,
    consequence: "trip",
    visual: "arc",
    log: "Arcing on a switchyard insulator in the fog. Line taken out of service before it faulted.",
  },
  {
    id: "intake-debris",
    title: "Debris on the intake screens",
    camera: "intake",
    accept: ["foreign", "equipment"],
    effect: { vacuum: -8 },
    develop: 25,
    escalate: 55,
    consequence: "trip",
    visual: "debris",
    log: "Leaves and debris loading the traveling screens. Screens on fast wash, condenser vacuum recovered.",
  },
];

const SHARED_ODDITIES: Oddity[] = [
  { id: "flicker", camera: "aux", visual: "flicker" },
  { id: "chair", camera: "aux", visual: "chair" },
  { id: "hardhat-corridor", camera: "turbine", visual: "hardhat" },
  { id: "fog", camera: "yard", visual: "fog" },
  { id: "gull", camera: "intake", visual: "gull" },
  { id: "pool-ripple", camera: "pool", visual: "ripple" },
];

function shared(prefix: Metric[], cams: Camera[], events: EventDef[], oddities: Oddity[]): SiteWatch {
  const common: Metric[] = [
    { id: "feed", label: "Feedwater flow", unit: "%", base: 100, lo: 85, hi: 110, digits: 0 },
    { id: "steam", label: "Steam flow", unit: "%", base: 100, lo: 92, hi: 108, digits: 0 },
    { id: "vacuum", label: "Condenser vacuum", unit: "%", base: 100, lo: 95, hi: 101, digits: 0 },
    { id: "grid", label: "Grid voltage", unit: "%", base: 100, lo: 97, hi: 103, digits: 1 },
    { id: "pool", label: "Fuel pool level", unit: "m", base: 7.0, lo: 6.7, hi: 7.3, digits: 2 },
    { id: "gAux", label: "Gamma, aux building", unit: "", base: 1, lo: 0, hi: 3, digits: 1, ratio: true },
  ];
  return { metrics: [...prefix, ...common], cameras: [...cams, ...SHARED_CAMERAS], events: [...events, ...SHARED_EVENTS], oddities: [...oddities, ...SHARED_ODDITIES] };
}

/** Nominal readings and the site's own cameras and events. */
export function siteWatch(site: SiteKind): SiteWatch {
  const t = thermalState(site, { powerPct: 100, flowPct: 100 });
  const hot = Math.round(t.tHot);
  const cold = Math.round(t.tCold);
  if (site === "bwr") {
    return shared(
      [
        { id: "power", label: "Reactor power", unit: "%", base: 100, lo: 90, hi: 104, digits: 0 },
        { id: "press", label: "Reactor pressure", unit: "MPa", base: 7.0, lo: 6.8, hi: 7.25, digits: 2 },
        { id: "level", label: "Vessel water level", unit: "cm", base: 0, lo: -30, hi: 30, digits: 0 },
        { id: "cflow", label: "Core flow (recirc)", unit: "%", base: 100, lo: 90, hi: 108, digits: 0 },
        { id: "steamT", label: "Steam dome temperature", unit: "°C", base: hot, lo: hot - 6, hi: hot + 4, digits: 0 },
        { id: "feedT", label: "Feedwater temperature", unit: "°C", base: 216, lo: 205, hi: 225, digits: 0 },
        { id: "dwp", label: "Drywell pressure", unit: "kPa(g)", base: 3, lo: -2, hi: 9, digits: 1 },
        { id: "pool2", label: "Suppression pool temperature", unit: "°C", base: 30, lo: 15, hi: 35, digits: 1 },
        { id: "gMsl", label: "Gamma, main steam lines", unit: "", base: 1, lo: 0, hi: 1.5, digits: 2, ratio: true },
      ],
      [
        { id: "core", name: "Drywell, recirc pump A", scene: "drywell" },
        { id: "pzr", name: "Suppression pool", scene: "torus" },
        { id: "steamline", name: "Main steam tunnel", scene: "tunnel" },
      ],
      [
        { id: "recirc-seal", title: "Recirc pump seal leaking", camera: "core", accept: ["leak"], effect: { dwp: 8, cflow: -3 }, develop: 30, escalate: 70, consequence: "trip", visual: "puddle", log: "Recirc pump A seal leaking into the drywell. Drywell floor drain rate rising; pump taken off line." },
        { id: "srv-weep", title: "Relief valve weeping to the pool", camera: "pzr", accept: ["leak"], effect: { pool2: 6, press: -0.08 }, develop: 35, escalate: 80, consequence: "finding", visual: "steamWisp", log: "A safety relief valve weeping to the suppression pool. Pool cooling started." },
        { id: "msl-rad", title: "Main steam line radiation rising", camera: "steamline", accept: ["radiation"], effect: { gMsl: 2.5 }, develop: 20, escalate: 50, consequence: "trip", visual: "beacon", log: "Main steam line radiation up: a fuel pin leaking fission gas. Power reduced to find it." },
      ],
      [{ id: "drip", camera: "steamline", visual: "condensate" }],
    );
  }
  if (site === "pebble") {
    return shared(
      [
        { id: "power", label: "Reactor power", unit: "%", base: 100, lo: 90, hi: 104, digits: 0 },
        { id: "hot", label: "Helium outlet (hot duct)", unit: "°C", base: hot, lo: hot - 30, hi: hot + 15, digits: 0 },
        { id: "cold", label: "Helium inlet (cold)", unit: "°C", base: cold, lo: cold - 15, hi: cold + 15, digits: 0 },
        { id: "press", label: "Helium pressure", unit: "MPa", base: 7.0, lo: 6.85, hi: 7.15, digits: 2 },
        { id: "blower", label: "Helium blower speed", unit: "%", base: 100, lo: 92, hi: 106, digits: 0 },
        { id: "moist", label: "Moisture in helium", unit: "×", base: 1, lo: 0, hi: 3, digits: 1, ratio: true },
        { id: "gCav", label: "Gamma, fuel handling", unit: "", base: 1, lo: 0, hi: 3, digits: 1, ratio: true },
      ],
      [
        { id: "core", name: "Reactor cavity", scene: "cavity" },
        { id: "pzr", name: "Blower and steam generator", scene: "blower" },
        { id: "steamline", name: "Pebble discharge line", scene: "discharge" },
      ],
      [
        { id: "blower-vib", title: "Blower bearing vibrating", camera: "pzr", accept: ["equipment"], effect: { blower: -9, hot: 18 }, develop: 25, escalate: 60, consequence: "trip", visual: "shake", log: "Helium blower bearing vibration rising. Blower slowed and swapped before it tripped." },
        { id: "moisture", title: "Water getting into the helium", camera: "pzr", accept: ["leak"], effect: { moist: 4, press: 0.08 }, develop: 30, escalate: 65, consequence: "trip", visual: "steamWisp", log: "Moisture in the helium: a steam generator tube weeping into the primary. Unit shut down and the generator isolated." },
        { id: "pebble-jam", title: "Pebble jammed in the discharge", camera: "steamline", accept: ["equipment", "foreign"], effect: { gCav: 2.2 }, develop: 20, escalate: 80, consequence: "finding", visual: "jam", log: "A pebble wedged in the discharge line. Cleared remotely; burnup counter reset." },
      ],
      [{ id: "cavity-glow", camera: "core", visual: "warmGlow" }],
    );
  }
  if (site === "msr") {
    return shared(
      [
        { id: "power", label: "Reactor power", unit: "%", base: 100, lo: 90, hi: 104, digits: 0 },
        { id: "hot", label: "Fuel salt out", unit: "°C", base: hot, lo: hot - 15, hi: hot + 10, digits: 0 },
        { id: "cold", label: "Fuel salt in", unit: "°C", base: cold, lo: cold - 12, hi: cold + 10, digits: 0 },
        { id: "cover", label: "Pump bowl cover gas", unit: "psig", base: 5, lo: 3, hi: 7, digits: 1 },
        { id: "pump", label: "Fuel pump speed", unit: "%", base: 100, lo: 95, hi: 104, digits: 0 },
        { id: "plug", label: "Freeze plug temperature", unit: "°C", base: 380, lo: 300, hi: 420, digits: 0 },
        { id: "gOff", label: "Gamma, off-gas system", unit: "", base: 1, lo: 0, hi: 3, digits: 1, ratio: true },
      ],
      [
        { id: "core", name: "Reactor cell window", scene: "cell" },
        { id: "pzr", name: "Freeze valve", scene: "freeze" },
        { id: "steamline", name: "Off-gas charcoal beds", scene: "offgas" },
      ],
      [
        { id: "freeze-air", title: "Freeze valve cooling air low", camera: "pzr", accept: ["equipment"], effect: { plug: 55 }, develop: 30, escalate: 60, consequence: "trip", visual: "frostGone", log: "Freeze valve cooling air fan stopped. Plug warming; second fan started before it thawed." },
        { id: "offgas-press", title: "Off-gas pressure rising", camera: "steamline", accept: ["radiation", "equipment"], effect: { cover: 2.4, gOff: 2.5 }, develop: 30, escalate: 70, consequence: "finding", visual: "beacon", log: "Off-gas line partly plugged with salt mist. Cover gas pressure up; line heated and cleared." },
        { id: "cell-heater", title: "Line heater out on a salt line", camera: "core", accept: ["electrical"], effect: { cold: -16 }, develop: 35, escalate: 75, consequence: "trip", visual: "heaterDark", log: "A trace heater zone failed on the return line. Spare zone energized before the salt froze." },
      ],
      [{ id: "cell-shadow", camera: "core", visual: "shadow" }],
    );
  }
  return shared(
    [
      { id: "power", label: "Reactor power", unit: "%", base: 100, lo: 90, hi: 104, digits: 0 },
      { id: "hot", label: "Hot leg temperature", unit: "°C", base: hot, lo: hot - 5, hi: hot + 4, digits: 0 },
      { id: "cold", label: "Cold leg temperature", unit: "°C", base: cold, lo: cold - 5, hi: cold + 4, digits: 0 },
      { id: "press", label: "Primary pressure", unit: "MPa", base: 15.5, lo: 15.2, hi: 15.9, digits: 2 },
      { id: "pzrl", label: "Pressurizer level", unit: "%", base: 55, lo: 45, hi: 65, digits: 0 },
      { id: "pflow", label: "Primary coolant flow", unit: "%", base: 100, lo: 92, hi: 105, digits: 0 },
      { id: "sgp", label: "Steam generator pressure", unit: "MPa", base: 6.9, lo: 6.6, hi: 7.2, digits: 2 },
      { id: "sump", label: "Containment sump level", unit: "cm", base: 10, lo: 0, hi: 25, digits: 0 },
      { id: "gMsl", label: "Gamma, main steam line", unit: "", base: 1, lo: 0, hi: 1.5, digits: 2, ratio: true },
    ],
    [
      { id: "core", name: "Containment, RCP 1A", scene: "containment" },
      { id: "pzr", name: "Pressurizer cubicle", scene: "pressurizer" },
      { id: "steamline", name: "Main steam valve room", scene: "msiv" },
    ],
    [
      { id: "rcp-seal", title: "RCP seal leaking", camera: "core", accept: ["leak"], effect: { sump: 28, pzrl: -6 }, develop: 30, escalate: 70, consequence: "trip", visual: "puddle", log: "RCP 1A seal leakoff high, water under the pump. Pump stopped, power reduced to three loops." },
      { id: "porv", title: "Pressurizer relief valve weeping", camera: "pzr", accept: ["leak"], effect: { press: -0.45, pzrl: -4 }, develop: 30, escalate: 60, consequence: "trip", visual: "steamWisp", log: "A pressurizer relief valve weeping by its seat. Block valve shut; pressure recovered." },
      { id: "sg-tube", title: "Steam generator tube leaking", camera: "steamline", accept: ["radiation", "leak"], effect: { gMsl: 2.5, pzrl: -5 }, develop: 25, escalate: 60, consequence: "trip", visual: "beacon", log: "Main steam line radiation up: a steam generator tube leaking primary to secondary. Generator isolated." },
    ],
    [{ id: "hum", camera: "pzr", visual: "flicker" }],
  );
}

/** Night 1 to 5: how many events, how long they take to run their course, coffee. */
export const NIGHTS = [
  { events: 3, oddities: 2, escalateScale: 1.3, brews: 3 },
  { events: 4, oddities: 3, escalateScale: 1.15, brews: 3 },
  { events: 5, oddities: 4, escalateScale: 1.0, brews: 2 },
  { events: 6, oddities: 5, escalateScale: 0.9, brews: 2 },
  { events: 7, oddities: 6, escalateScale: 0.8, brews: 1 },
];

export const NIGHT_MINUTES = 360;
/** Coffee drains per game minute while the tablet is up, and slowly while it is down. */
export const COFFEE = { max: 100, tablet: 0.55, desk: 0.12, brewMinutes: 6 };
export const FALSE_REPORT_LIMIT = 3;

/** Small deterministic generator so a night replays the same. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

export interface ActiveEvent {
  def: EventDef;
  start: number;
  /** Set when reported correctly: the crew is on it; readings recover over 8 minutes. */
  caughtAt: number | null;
  /** The report came before any alarm sounded. */
  early: boolean;
  /** Ran its course. */
  doneAt: number | null;
}

export interface ActiveOddity {
  def: Oddity;
  start: number;
  end: number;
}

export interface Night {
  site: SiteKind;
  night: number;
  watch: SiteWatch;
  minute: number;
  coffee: number;
  brewsLeft: number;
  brewing: number;
  tablet: boolean;
  camera: string;
  events: ActiveEvent[];
  oddities: ActiveOddity[];
  falseReports: number;
  findings: number;
  log: string[];
  /** The night rover's rounds: who is on which camera, when. Not anomalies: reporting one is a false report. */
  rounds: Round[];
  /** "trip" or "relieved" ends early; "dawn" is a survived night. */
  over: null | { why: "dawn" | "trip" | "relieved"; at: number; cause?: string };
}

export interface Round {
  camera: string;
  start: number;
  end: number;
}

/** The rover walks the plant twice a night, along the same route, a camera at a time. */
const ROUTE = ["turbine", "aux", "pool", "core", "pzr", "steamline", "intake", "yard"];
export const ROVER = "Jordan";
/** Elena's van: headlights on the yard camera before six. */
export const VAN_AT = 345;

export function roundsFor(r: () => number): Round[] {
  const out: Round[] = [];
  for (const start of [60 + Math.round(r() * 20), 210 + Math.round(r() * 20)]) {
    let t = start;
    for (const camera of ROUTE) {
      const dur = 6 + Math.round(r() * 4);
      out.push({ camera, start: t, end: t + dur });
      t += dur + 3;
    }
  }
  return out;
}

/** Radio traffic so far, oldest first: the rover calling in each space, the van at the gate. */
export function radio(n: Night): string[] {
  const lines: string[] = ["00:00 Control, night watch on station."];
  let last = -1;
  for (const rd of n.rounds) {
    if (rd.start > n.minute) break;
    if (rd.start - last > 30) lines.push(`${clock(rd.start)} ${ROVER}: starting rounds.`);
    lines.push(`${clock(rd.start)} ${ROVER}: ${cameraName(n, rd.camera).toLowerCase()}.`);
    last = rd.start;
  }
  if (n.minute >= VAN_AT) lines.push(`${clock(VAN_AT)} Gate: day shift supervisor on site.`);
  return lines;
}

/** Lay out the night: events and oddities, spread so nothing starts in the first 15 or last 30 minutes. */
export function newNight(site: SiteKind, night: number, seed = night * 7919 + site.length): Night {
  const watch = siteWatch(site);
  const cfg = NIGHTS[Math.max(0, Math.min(4, night - 1))];
  const r = rng(seed);
  const pool = watch.events.slice();
  const events: ActiveEvent[] = [];
  const span = NIGHT_MINUTES - 120;
  for (let k = 0; k < cfg.events && pool.length; k++) {
    const def = pool.splice(Math.floor(r() * pool.length), 1)[0];
    const start = Math.round(15 + (span * (k + r() * 0.8)) / cfg.events);
    events.push({ def: { ...def, escalate: Math.round(def.escalate * cfg.escalateScale) }, start, caughtAt: null, early: false, doneAt: null });
  }
  const oddities: ActiveOddity[] = [];
  for (let k = 0; k < cfg.oddities; k++) {
    const def = watch.oddities[Math.floor(r() * watch.oddities.length)];
    const start = Math.round(20 + r() * (NIGHT_MINUTES - 80));
    oddities.push({ def, start, end: start + 25 + Math.round(r() * 35) });
  }
  return {
    site,
    night,
    watch,
    minute: 0,
    coffee: COFFEE.max,
    brewsLeft: cfg.brews,
    brewing: 0,
    tablet: false,
    camera: watch.cameras[0].id,
    events,
    oddities,
    rounds: roundsFor(rng(seed * 31 + 7)),
    falseReports: 0,
    findings: 0,
    log: [],
    over: null,
  };
}

/** How far an event has developed, 0 to 1, and back to 0 over 8 minutes once caught. */
export function development(e: ActiveEvent, minute: number): number {
  if (minute < e.start) return 0;
  const up = Math.min(1, (minute - e.start) / Math.max(1, e.def.develop));
  if (e.caughtAt === null) return e.doneAt !== null && e.def.consequence === "finding" ? 1 : up;
  const atCatch = Math.min(1, (e.caughtAt - e.start) / Math.max(1, e.def.develop));
  return Math.max(0, atCatch * (1 - (minute - e.caughtAt) / 8));
}

/** Readings now. Small steady drift so the board never looks frozen. */
export function readings(n: Night): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of n.watch.metrics) {
    const wobble = Math.sin(n.minute * 0.37 + m.id.length * 1.7) * (m.ratio ? 0.04 : (m.hi - m.lo) * 0.02);
    out[m.id] = m.base + wobble;
  }
  for (const e of n.events) {
    const d = development(e, n.minute);
    if (!d) continue;
    for (const [id, delta] of Object.entries(e.def.effect)) {
      const m = n.watch.metrics.find((x) => x.id === id);
      if (!m) continue;
      out[id] += m.ratio ? delta * d : delta * d;
    }
  }
  if (n.over?.why === "trip") out.power = 0;
  return out;
}

/** Readings outside their band. */
export function alarms(n: Night, r = readings(n)): string[] {
  return n.watch.metrics.filter((m) => r[m.id] < m.lo || r[m.id] > m.hi).map((m) => m.id);
}

/** The event (if any) live on a camera now: started, not caught, not run its course. */
export function liveOn(n: Night, camera: string): ActiveEvent | null {
  return n.events.find((e) => e.def.camera === camera && n.minute >= e.start && e.caughtAt === null && e.doneAt === null) ?? null;
}

export function oddityOn(n: Night, camera: string): ActiveOddity | null {
  return n.oddities.find((o) => o.def.camera === camera && n.minute >= o.start && n.minute < o.end) ?? null;
}

/** Visual layers for a camera now: what the scene should draw. */
export function visualsOn(n: Night, camera: string): string[] {
  const v: string[] = [];
  for (const e of n.events) {
    if (e.def.camera !== camera || n.minute < e.start) continue;
    const d = development(e, n.minute);
    if (d > 0.05 || (e.doneAt !== null && e.def.consequence === "finding")) v.push(e.def.visual);
  }
  const o = oddityOn(n, camera);
  if (o) v.push(o.def.visual);
  const rd = n.rounds.find((x) => x.camera === camera && n.minute >= x.start && n.minute < x.end);
  if (rd) v.push(`rover:${((n.minute - rd.start) / (rd.end - rd.start)).toFixed(3)}`);
  if (camera === "yard" && n.minute >= VAN_AT) v.push(`van:${Math.min(1, (n.minute - VAN_AT) / 12).toFixed(3)}`);
  return v;
}

export type ReportResult = { ok: true; event: ActiveEvent; early: boolean } | { ok: false; reason: "nothing" | "wrong-kind" };

/** File a report from the camera being watched. */
export function report(n: Night, category: Category): ReportResult {
  if (n.over) return { ok: false, reason: "nothing" };
  const e = liveOn(n, n.camera);
  if (!e) {
    n.falseReports += 1;
    n.log.push(`${clock(n.minute)} False report from ${cameraName(n, n.camera)}.`);
    if (n.falseReports >= FALSE_REPORT_LIMIT) n.over = { why: "relieved", at: n.minute };
    return { ok: false, reason: "nothing" };
  }
  if (!e.def.accept.includes(category)) {
    n.falseReports += 1;
    n.log.push(`${clock(n.minute)} Report from ${cameraName(n, n.camera)} named the wrong kind of problem.`);
    if (n.falseReports >= FALSE_REPORT_LIMIT) n.over = { why: "relieved", at: n.minute };
    return { ok: false, reason: "wrong-kind" };
  }
  e.caughtAt = n.minute;
  // Early: before any of its readings had crossed an alarm.
  const before = alarms(n);
  e.early = !Object.keys(e.def.effect).some((id) => before.includes(id));
  n.log.push(`${clock(n.minute)} ${e.def.log}`);
  return { ok: true, event: e, early: e.early };
}

/** Advance the night by dt game minutes. */
export function tick(n: Night, dt: number): void {
  if (n.over) return;
  n.minute = Math.min(NIGHT_MINUTES, n.minute + dt);
  if (n.brewing > 0) {
    n.brewing = Math.max(0, n.brewing - dt);
    n.tablet = false;
    if (n.brewing === 0) n.coffee = COFFEE.max;
  } else {
    n.coffee = Math.max(0, n.coffee - (n.tablet ? COFFEE.tablet : COFFEE.desk) * dt);
    if (n.coffee === 0) n.tablet = false;
  }
  for (const e of n.events) {
    if (e.caughtAt !== null || e.doneAt !== null) continue;
    if (n.minute >= e.start + e.def.escalate) {
      e.doneAt = n.minute;
      if (e.def.consequence === "trip") {
        n.log.push(`${clock(n.minute)} REACTOR TRIP. ${e.def.title}, unreported, ran its course.`);
        n.over = { why: "trip", at: n.minute, cause: e.def.title };
        return;
      }
      n.findings += 1;
      n.log.push(`${clock(n.minute)} Found by the day shift instead: ${e.def.title.toLowerCase()}.`);
    }
  }
  if (n.minute >= NIGHT_MINUTES) n.over = { why: "dawn", at: NIGHT_MINUTES };
}

export function brew(n: Night): boolean {
  if (n.over || n.brewing > 0 || n.brewsLeft <= 0) return false;
  n.brewsLeft -= 1;
  n.brewing = COFFEE.brewMinutes;
  n.tablet = false;
  return true;
}

export function setTablet(n: Night, up: boolean): boolean {
  if (n.over || n.brewing > 0 || (up && n.coffee <= 0)) return false;
  n.tablet = up;
  return true;
}

export function cameraName(n: Night, id: string): string {
  return n.watch.cameras.find((c) => c.id === id)?.name ?? id;
}

export function clock(minute: number): string {
  const m = Math.floor(minute);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export interface Score {
  caught: number;
  early: number;
  missed: number;
  findings: number;
  falseReports: number;
  survived: boolean;
}

export function score(n: Night): Score {
  const caught = n.events.filter((e) => e.caughtAt !== null);
  return {
    caught: caught.length,
    early: caught.filter((e) => e.early).length,
    missed: n.events.filter((e) => e.doneAt !== null).length,
    findings: n.findings,
    falseReports: n.falseReports,
    survived: n.over?.why === "dawn",
  };
}
