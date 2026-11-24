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
import { nightPace, type NightPace } from "../frameRate";

/**
 * Night grade. Start at 100.
 * Early catch +6. Late catch +2. Miss -18. Finding -10 more. False report -8.
 * Catch bonuses stop at 100 before false reports come off, so one false report
 * on an otherwise clean night is 92, a B, not an A.
 * A trip or a relief is F, whatever the arithmetic.
 * A >= 95, B >= 85, C >= 72, D >= 60, else F.
 * Worked check: two late catches and one silent miss that is a finding = 76, a C.
 * Three early catches stay at 100, an A.
 */
export const GRADE_POINTS = { early: 6, late: 2, miss: -18, finding: -10, falseReport: -8 } as const;
export type GradeLetter = "A" | "B" | "C" | "D" | "F";

export function gradeLetter(score: number): GradeLetter {
  if (score >= 95) return "A";
  if (score >= 85) return "B";
  if (score >= 72) return "C";
  if (score >= 60) return "D";
  return "F";
}

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
  { id: "hardhat-corridor", camera: "aux", visual: "hardhat" },
  { id: "fog", camera: "yard", visual: "fog" },
  { id: "gull", camera: "intake", visual: "gull" },
  { id: "pool-ripple", camera: "pool", visual: "ripple" },
  { id: "moth", camera: "aux", visual: "moth" },
  { id: "glove", camera: "aux", visual: "glove" },
  { id: "bulb", camera: "turbine", visual: "bulb" },
  { id: "cup", camera: "turbine", visual: "cup" },
  { id: "hangtag", camera: "pool", visual: "hangtag" },
  { id: "boot", camera: "intake", visual: "boot" },
  { id: "clipboard", camera: "yard", visual: "clipboard" },
  { id: "cable", camera: "aux", visual: "cable" },
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
        { id: "dw-floor", title: "Water on the drywell floor", camera: "core", accept: ["leak"], effect: { dwp: 8 }, develop: 22, escalate: 60, consequence: "trip", visual: "puddle", log: "Drywell floor drain rate up. Pump A seal walked down." },
        { id: "recirc-oil", title: "Recirc pump oil level low", camera: "core", accept: ["equipment"], effect: { cflow: -14 }, develop: 20, escalate: 50, consequence: "finding", visual: "sightLow", log: "Recirc pump A oil level low. Pump taken off and the spare put on." },
        { id: "torus-warm", title: "Suppression pool warming", camera: "pzr", accept: ["leak"], effect: { pool2: 8 }, develop: 28, escalate: 70, consequence: "finding", visual: "tempNeedle", log: "Suppression pool warming. Cooling started." },
        { id: "srv-seat", title: "Relief valve off its seat", camera: "pzr", accept: ["equipment"], effect: { press: -0.28 }, develop: 18, escalate: 48, consequence: "trip", visual: "steamWisp", log: "A relief valve off its seat. Fuses pulled before the low-pressure trip." },
        { id: "tunnel-rad", title: "Steam tunnel monitor stepped up", camera: "steamline", accept: ["radiation"], effect: { gMsl: 1.1 }, develop: 16, escalate: 44, consequence: "trip", visual: "sideBeacon", log: "Steam tunnel monitor stepped up. A fuel leak check was started." },
        { id: "tunnel-flow", title: "Steam flow down in the tunnel", camera: "steamline", accept: ["leak"], effect: { steam: -12 }, develop: 20, escalate: 50, consequence: "finding", visual: "flowNeedle", log: "One steam line flow down. Valve stroked and the flow came back." },
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
        { id: "cavity-hot", title: "Cavity outlet running hot", camera: "core", accept: ["equipment"], effect: { hot: 22 }, develop: 20, escalate: 52, consequence: "trip", visual: "ductHot", log: "Helium outlet climbing. Blower speed raised before the high-temperature trip." },
        { id: "cavity-rad", title: "Fuel handling monitor up", camera: "core", accept: ["radiation"], effect: { gCav: 2.6 }, develop: 18, escalate: 48, consequence: "finding", visual: "cavityBeacon", log: "Fuel handling monitor up. The discharge was held and surveyed." },
        { id: "tube-weep", title: "Steam generator tube weeping into the helium", camera: "pzr", accept: ["leak"], effect: { moist: 3.2 }, develop: 24, escalate: 58, consequence: "trip", visual: "steamWisp", log: "Moisture in the helium. The generator was isolated." },
        { id: "blower-hot", title: "Blower motor running hot", camera: "pzr", accept: ["equipment"], effect: { blower: -12 }, develop: 18, escalate: 46, consequence: "trip", visual: "motorHot", log: "Blower motor hot. Speed cut and the spare blower started." },
        { id: "discharge-bridge", title: "Pebbles bridged in the discharge", camera: "steamline", accept: ["equipment"], effect: { gCav: 2.4 }, develop: 20, escalate: 55, consequence: "finding", visual: "bridge", log: "Pebbles bridged in the discharge. Cleared from the panel." },
        { id: "pebble-dust", title: "Dust in the discharge line", camera: "steamline", accept: ["foreign"], effect: { gCav: 2.8 }, develop: 16, escalate: 50, consequence: "finding", visual: "dust", log: "Graphite dust in the discharge. Line vacuumed and the count restarted." },
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
        { id: "trace-out", title: "Second trace heater zone out", camera: "core", accept: ["electrical"], effect: { cold: -18 }, develop: 24, escalate: 60, consequence: "trip", visual: "traceDark", log: "A second trace heater zone out. The spare bus was closed." },
        { id: "cell-band", title: "Dark band on the cell window", camera: "core", accept: ["electrical"], effect: { cold: -16 }, develop: 22, escalate: 56, consequence: "finding", visual: "cellBand", log: "A dark band on the cell window. The heater zone behind it was replaced." },
        { id: "fan-down", title: "Freeze valve fan stopped", camera: "pzr", accept: ["equipment"], effect: { plug: 55 }, develop: 22, escalate: 55, consequence: "trip", visual: "fanStop", log: "Freeze valve fan stopped. The second fan was started." },
        { id: "plug-warm", title: "Freeze plug running warm", camera: "pzr", accept: ["equipment"], effect: { plug: 48 }, develop: 26, escalate: 62, consequence: "finding", visual: "plugGauge", log: "Freeze plug warm, still frozen. Cooling air raised." },
        { id: "bed-rad", title: "Charcoal bed monitor up", camera: "steamline", accept: ["radiation"], effect: { gOff: 2.6 }, develop: 18, escalate: 48, consequence: "trip", visual: "beacon", log: "Off-gas charcoal bed monitor up. Flow shifted to the spare bed." },
        { id: "bed-plug", title: "Off-gas line plugging", camera: "steamline", accept: ["equipment"], effect: { cover: 2.6 }, develop: 22, escalate: 58, consequence: "finding", visual: "linePlug", log: "Off-gas line plugging. Heat traced on and the pressure came down." },
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
      { id: "rcp-oil", title: "RCP oil under the coupling", camera: "core", accept: ["leak"], effect: { sump: 20 }, develop: 24, escalate: 58, consequence: "finding", visual: "oilSheen", log: "Oil under RCP 1A. Wiped, and the leakoff valve seated." },
      { id: "sump-rise", title: "Containment sump rising", camera: "core", accept: ["leak"], effect: { sump: 22, pzrl: -8 }, develop: 28, escalate: 68, consequence: "trip", visual: "sumpHigh", log: "Containment sump rising with no named leak. Power held while the floor was walked." },
      { id: "spray-by", title: "Pressurizer spray valve leaking by", camera: "pzr", accept: ["leak"], effect: { press: -0.4, pzrl: -6 }, develop: 22, escalate: 52, consequence: "finding", visual: "sprayLeak", log: "Spray valve leaking by. Isolated. Pressure came back." },
      { id: "heater-stuck", title: "Pressurizer backup heaters stuck on", camera: "pzr", accept: ["electrical"], effect: { press: 0.5 }, develop: 16, escalate: 42, consequence: "trip", visual: "heaterGlow", log: "Backup heaters stuck on. Breaker opened before the high-pressure trip." },
      { id: "msl-step", title: "Steam line monitor stepped up", camera: "steamline", accept: ["radiation"], effect: { gMsl: 1.2 }, develop: 14, escalate: 40, consequence: "trip", visual: "beacon", log: "Steam line monitor stepped up. Blowdown sampled." },
      { id: "sg-packing", title: "Steam valve packing weeping", camera: "steamline", accept: ["leak"], effect: { sgp: -0.45 }, develop: 20, escalate: 50, consequence: "finding", visual: "packingWeep", log: "Main steam valve packing weeping. Gland tightened." },
    ],
    [{ id: "hum", camera: "pzr", visual: "flicker" }],
  );
}

/** Night 1 to 4. Night 1 teaches. Night 4 is the finale. Later nights are the endless watch. */
export const NIGHTS = [
  { events: 3, oddities: 2, escalateScale: 1.3, brews: 3 },
  { events: 4, oddities: 3, escalateScale: 1.1, brews: 1 },
  { events: 5, oddities: 4, escalateScale: 1.0, brews: 1 },
  { events: 6, oddities: 4, escalateScale: 0.85, brews: 1 },
];

/** Nights 1 to 4 are the rotation. After that, more events and a faster board, one pot. */
export function nightPlan(night: number): { events: number; oddities: number; escalateScale: number; brews: number } {
  const base = NIGHTS[Math.max(0, Math.min(NIGHTS.length - 1, night - 1))];
  if (night <= NIGHTS.length) return base;
  const extra = night - NIGHTS.length;
  return {
    events: Math.min(8, base.events + extra),
    oddities: Math.min(6, base.oddities + Math.floor(extra / 2)),
    escalateScale: Math.max(0.45, Math.round((base.escalateScale - extra * 0.08) * 100) / 100),
    brews: 1,
  };
}

/** Applied when the night is dealt. Relaxed stretches the events and adds a pot. Nuke does the opposite. */
export function paceMods(pace: NightPace = nightPace()): { esc: number; brews: number; drain: number } {
  if (pace === "relaxed") return { esc: 1.35, brews: 1, drain: 0.7 };
  if (pace === "nuke") return { esc: 0.72, brews: -1, drain: 1.4 };
  return { esc: 1, brews: 0, drain: 1 };
}

export const NIGHT_MINUTES = 360;
/** Real seconds for one game minute at 1×. A night is about seven and a half minutes. */
export const SECONDS_PER_MINUTE = 1.25;

/** Game minutes from real seconds. Speed is the test hook only; 8 plays eight times faster. */
export function gameMinutes(realSeconds: number, speed = 1): number {
  return (realSeconds * Math.max(0, speed)) / SECONDS_PER_MINUTE;
}
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
  /** Came from the day week, not from tonight's draw. */
  fromDays?: boolean;
  /** Night 4's stacked pair. */
  finale?: boolean;
}

export interface ActiveOddity {
  def: Oddity;
  start: number;
  end: number;
}

export interface Night {
  site: SiteKind;
  night: number;
  /** The number that dealt this night. Shown on the turnover so a night can be shared. */
  seed: number;
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
  /** Minutes the tablet was up on each camera, in order. */
  gaze: { camera: string; from: number; to: number }[];
  /** How long the current camera has been up, in game minutes. */
  streak: number;
  streakCam: string;
  /** A replay does not move trust or grade flags. */
  replay: boolean;
  /** Coffee drain against the standard night. Set when the night is dealt. */
  drain: number;
  /** Extra radio lines from the day week, spoken at a minute. */
  carriedRadio: { at: number; text: string }[];
  /** Elena's turnover is the short set when the day log was hidden. */
  curt: boolean;
  /** Jordan's radio voice, from how the week ended. */
  voice: "plain" | "warm" | "terse";
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

/** Jordan, when the week ended well. */
export const JORDAN_WARM = [
  "Evening, control. Yard lights are on. Starting at the turbine.",
  "Aux corridor's quiet. Door latches look shut from here.",
  "Pool deck's dry. Walking the rail, slowly. Hi, camera.",
  "Containment entry logged. Just me in the airlock. Spooky.",
  "Steam valve room's warm. Nothing weeping. Good.",
  "Intake's clear, screens turning. The fish are being weird again.",
  "Switchyard's dark except the sodium lamp. I love that lamp.",
  "Back at the turbine. Thanks for watching my back tonight.",
];

/** Jordan, when the week ended badly: polite, short, and keeping his own log (docs/characters.md). */
export const JORDAN_TERSE = [
  "Starting rounds.",
  "Turbine. Fine.",
  "Aux. Fine.",
  "Pool. Fine.",
  "Containment. Logged it myself.",
  "Steam line. Nothing.",
  "Intake. Nothing.",
  "Yard. Done. Writing my own log tonight.",
];

/** Radio traffic so far, oldest first: the rover calling in each space, the van at the gate. */
export function radio(n: Night): string[] {
  const lines: string[] = ["00:00 Control, night watch on station."];
  if (n.voice === "plain") {
    let last = -1;
    for (const rd of n.rounds) {
      if (rd.start > n.minute) break;
      if (rd.start - last > 30) lines.push(`${clock(rd.start)} ${ROVER}: starting rounds.`);
      lines.push(`${clock(rd.start)} ${ROVER}: ${cameraName(n, rd.camera).toLowerCase()}.`);
      last = rd.start;
    }
  } else {
    const set = n.voice === "warm" ? JORDAN_WARM : JORDAN_TERSE;
    set.forEach((text, i) => {
      const at = 20 + i * 40;
      if (n.minute >= at) lines.push(`${clock(at)} ${ROVER}: ${text}`);
    });
  }
  if (n.night === 1) {
    const silent = n.events.find((e) => e.def.id === "lhra-door" || e.def.id === "pool-fme");
    if (silent && n.minute >= silent.start + 6) {
      const what = silent.def.id === "pool-fme" ? "tool bag by the pool looked wrong on my way past." : "aux corridor door looked wrong on my way past.";
      lines.push(`${clock(silent.start + 6)} Jordan: ${what} Can you check the camera?`);
    }
  }
  for (const line of n.carriedRadio) if (n.minute >= line.at) lines.push(line.text);
  if (n.minute >= VAN_AT) lines.push(`${clock(VAN_AT)} Gate: day shift supervisor on site.`);
  return lines;
}

/** One night's seed, consumed by the next newNight. Test hook only. Never a button. */
let pendingSeed: number | null = null;
export function setNextNightSeed(seed: number | null) {
  pendingSeed = seed;
}

/** Lay out the night: events and oddities, spread so nothing starts in the first 15 or last 30 minutes. */
function isSilent(def: EventDef): boolean {
  return Object.keys(def.effect).length === 0;
}

/** One camera-only event per night. The rest move a gauge, so a flashing board can be caught. */
function capSilents(events: ActiveEvent[], watch: SiteWatch, scale: number) {
  const at = events.map((e, i) => (isSilent(e.def) ? i : -1)).filter((i) => i >= 0);
  if (at.length <= 1) return;
  const finale = events.findIndex((e) => e.finale && isSilent(e.def));
  const keep = finale >= 0 ? finale : at[0];
  const used = new Set(events.map((e) => e.def.id));
  const loud = watch.events.filter((d) => !isSilent(d) && !used.has(d.id));
  const any = watch.events.filter((d) => !isSilent(d));
  let n = 0;
  for (const i of at) {
    if (i === keep) continue;
    const def = loud[n] ?? any[n % Math.max(1, any.length)];
    n += 1;
    if (!def) continue;
    const prev = events[i];
    events[i] = { def: { ...def, escalate: Math.round(def.escalate * scale) }, start: prev.start, caughtAt: null, early: false, doneAt: null };
  }
}

export function newNight(site: SiteKind, night: number, seed = night * 7919 + site.length): Night {
  const use = pendingSeed ?? seed;
  pendingSeed = null;
  const watch = siteWatch(site);
  const cfg = nightPlan(night);
  const pace = paceMods();
  const scale = cfg.escalateScale * pace.esc;
  const r = rng(use);
  const pool = watch.events.slice();
  const events: ActiveEvent[] = [];
  const span = NIGHT_MINUTES - 120;
  for (let k = 0; k < cfg.events && pool.length; k++) {
    const def = pool.splice(Math.floor(r() * pool.length), 1)[0];
    const start = Math.round(15 + (span * (k + r() * 0.8)) / cfg.events);
    events.push({ def: { ...def, escalate: Math.round(def.escalate * scale) }, start, caughtAt: null, early: false, doneAt: null });
  }
  const oddities: ActiveOddity[] = [];
  for (let k = 0; k < cfg.oddities; k++) {
    const def = watch.oddities[Math.floor(r() * watch.oddities.length)];
    const start = Math.round(20 + r() * (NIGHT_MINUTES - 80));
    oddities.push({ def, start, end: start + 25 + Math.round(r() * 35) });
  }
  if (night === 1) {
    // One silent door, one oddity on another camera, one event that can flash.
    const place = (id: string, start: number): ActiveEvent | null => {
      const def = watch.events.find((e) => e.id === id);
      if (!def) return null;
      return { def: { ...def, escalate: Math.round(def.escalate * scale) }, start, caughtAt: null, early: false, doneAt: null };
    };
    const silent = place("lhra-door", 70) ?? place("pool-fme", 70);
    const flash = place("feed-pump", 150);
    const thirdSrc = events.find((e) => e.def.id !== "lhra-door" && e.def.id !== "pool-fme" && e.def.id !== "feed-pump" && Object.keys(e.def.effect).length > 0);
    const third = thirdSrc
      ? { ...thirdSrc, def: { ...thirdSrc.def }, start: 200 + (use % 70) }
      : place("yard-arc", 200 + (use % 70));
    if (silent && flash && third) {
      events.length = 0;
      events.push(silent, flash, third);
    }
    const gull = watch.oddities.find((o) => o.visual === "gull");
    if (gull) {
      const rest = oddities.find((o) => o.def.visual !== "gull");
      const other = rest?.def ?? watch.oddities.find((o) => o.visual !== "gull");
      oddities.length = 0;
      oddities.push({ def: gull, start: 45, end: 110 });
      if (other) oddities.push({ def: other, start: 190, end: 240 });
    }
  }
  if (night === 4) {
    const want = ["lhra-door", "pool-level"];
    for (const id of want) {
      let hit = events.find((e) => e.def.id === id);
      if (!hit) {
        const def = watch.events.find((e) => e.id === id);
        const idx = events.findIndex((e) => !want.includes(e.def.id));
        if (def && idx >= 0) {
          events[idx] = { def: { ...def, escalate: Math.round(def.escalate * scale) }, start: 270, caughtAt: null, early: false, doneAt: null, finale: true };
          hit = events[idx];
        }
      }
      if (hit) {
        hit.start = 270;
        hit.finale = true;
      }
    }
  }
  capSilents(events, watch, scale);
  return {
    site,
    night,
    seed: use,
    watch,
    minute: 0,
    coffee: COFFEE.max,
    brewsLeft: Math.max(1, cfg.brews + pace.brews),
    brewing: 0,
    tablet: false,
    camera: watch.cameras[0].id,
    events,
    oddities,
    rounds: roundsFor(rng(seed * 31 + 7)),
    falseReports: 0,
    findings: 0,
    log: [],
    gaze: [],
    streak: 0,
    streakCam: watch.cameras[0].id,
    replay: false,
    drain: pace.drain,
    carriedRadio: [],
    curt: false,
    voice: "plain",
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
    if (d > 0.05 || (e.doneAt !== null && e.def.consequence === "finding")) {
      v.push(e.def.visual);
      v.push(`${e.def.visual}:${Math.min(1, d).toFixed(3)}`);
    }
  }
  const o = oddityOn(n, camera);
  if (o) v.push(o.def.visual);
  const rd = n.rounds.find((x) => x.camera === camera && n.minute >= x.start && n.minute < x.end);
  if (rd) v.push(`rover:${((n.minute - rd.start) / (rd.end - rd.start)).toFixed(3)}`);
  if (camera === "yard" && n.minute >= VAN_AT) v.push(`van:${Math.min(1, (n.minute - VAN_AT) / 12).toFixed(3)}`);
  return v;
}

export type ReportResult = { ok: true; event: ActiveEvent; early: boolean } | { ok: false; reason: "nothing" | "wrong-kind" | "logged" };

/** Elena takes the chair. Anything already on a camera and still open is a miss. The night is an F. */
export function relieve(n: Night) {
  if (n.over) return;
  for (const e of n.events) {
    if (e.caughtAt !== null || e.doneAt !== null || n.minute < e.start) continue;
    e.doneAt = n.minute;
    if (e.def.consequence === "finding") n.findings += 1;
  }
  n.over = { why: "relieved", at: n.minute };
}

/** File a report from the camera being watched. */
export function report(n: Night, category: Category): ReportResult {
  if (n.over) return { ok: false, reason: "nothing" };
  const e = liveOn(n, n.camera);
  if (!e) {
    const recent = n.events.some((ev) => ev.def.camera === n.camera && ev.caughtAt !== null && n.minute - ev.caughtAt <= 40);
    if (recent) return { ok: false, reason: "logged" };
    n.falseReports += 1;
    n.log.push(`${clock(n.minute)} False report from ${cameraName(n, n.camera)}.`);
    if (n.falseReports >= FALSE_REPORT_LIMIT) relieve(n);
    return { ok: false, reason: "nothing" };
  }
  if (!e.def.accept.includes(category)) {
    n.falseReports += 1;
    n.log.push(`${clock(n.minute)} Report from ${cameraName(n, n.camera)} named the wrong kind of problem.`);
    if (n.falseReports >= FALSE_REPORT_LIMIT) relieve(n);
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
    n.coffee = Math.max(0, n.coffee - (n.tablet ? COFFEE.tablet : COFFEE.desk) * (n.drain || 1) * dt);
    if (n.coffee === 0) n.tablet = false;
  }
  if (n.tablet) {
    const open = n.gaze[n.gaze.length - 1];
    if (!open || open.camera !== n.camera) n.gaze.push({ camera: n.camera, from: n.minute - dt, to: n.minute });
    else open.to = n.minute;
    if (n.streakCam === n.camera) n.streak += dt;
    else {
      n.streakCam = n.camera;
      n.streak = dt;
    }
  } else n.streak = 0;
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

/** 0 before four minutes on one feed, 1 after ten. The picture loses at most 15% contrast. */
export function fatigueOf(n: Night): number {
  if (n.streak <= 4) return 0;
  return Math.min(1, (n.streak - 4) / 6);
}

/** How many times the tablet came up on this camera at or after a minute. */
export function looksAfter(n: Night, camera: string, minute: number): number {
  return n.gaze.filter((g) => g.camera === camera && g.from >= minute - 0.05).length;
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

/** Points, then a letter. A trip or a relief fails the night outright. */
export function grade(n: Night): { points: number; letter: GradeLetter } {
  if (n.over?.why === "trip" || n.over?.why === "relieved") return { points: 0, letter: "F" };
  let points = 100;
  for (const e of n.events) {
    if (e.caughtAt !== null) points += e.early ? GRADE_POINTS.early : GRADE_POINTS.late;
    else if (e.doneAt !== null) {
      points += GRADE_POINTS.miss;
      if (e.def.consequence === "finding") points += GRADE_POINTS.finding;
    }
  }
  // Bonuses stop at 100. A false report still comes off after that.
  if (points > 100) points = 100;
  points += n.falseReports * GRADE_POINTS.falseReport;
  points = Math.max(0, Math.min(100, points));
  return { points, letter: gradeLetter(points) };
}
