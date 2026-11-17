/**
 * Shift events, one plant at a time. Rates are teaching weights, not a change
 * to any frozen number in the sim.
 *
 * Sources:
 * - PWR steam-generator tube leak: US NRC information notices and the PWR
 *   systems manual. A tube leak puts primary activity on the steam line, so
 *   the steam-line radiation alarm is the first panel mark. Isolate and cool.
 * - PWR RCP trip: loss of flow in that loop. Power has to come down or the
 *   core heats. NRC PWR manual, reactor coolant pumps.
 * - PWR pressurizer spray stuck open: spray cuts pressure. If it stays open,
 *   pressure falls toward saturation. NRC pressurizer description.
 * - BWR recirc pump trip: flow falls, voids rise, power falls. NRC BWR manual.
 * - BWR MSIV closure: steam is bottled up, pressure spikes, the reactor scrams.
 *   NRC BWR manual, main steam isolation.
 * - BWR feedwater heater out: colder feedwater adds reactivity. Power rises
 *   unless the operator takes rods or flow. Standard BWR transient training.
 * - Pebble blower trip and moisture in helium: HTR-PM safety analyses and IAEA
 *   HTGR training material. A blower trip is a loss of forced cooling. Moisture
 *   in helium is a chemical attack and a reactivity insert via graphite.
 * - Pebble jam: the discharge line stops. Online fuelling cannot clear a jammed
 *   sphere. IAEA TECDOC descriptions of pebble handling.
 * - Salt freeze-valve cooling air lost, off-gas pressure, a line cooling toward
 *   the liquidus: MSRE operating experience (ORNL-4658, Haubenreich and Engel).
 *   The freeze valve is a plug of salt held frozen by cooling air. Heat opens it.
 *   Lose the cooling air and the plug thaws and the fuel drains on its own: the
 *   designed safe shutdown. Off-gas takes fission gas. A cold salt line can
 *   freeze and plug, which stops the loop.
 * - Trips at power: an RCP trip at full power trips the reactor on low flow
 *   (NRC PWR manual, reactor protection). One pump of several leaves the others
 *   running, so total flow falls, it does not go to zero. A BWR recirc trip
 *   leaves one pump and natural circulation, about half flow, and power falls
 *   with the voids (NRC BWR manual). An HTR-PM blower trip at power scrams.
 */
import type { SiteKind } from "./plantLoops";
import type { SitePanel } from "./siteControls";

export interface ShiftEvent {
  id: string;
  kind: SiteKind;
  title: string;
  /** What makes it eligible. Not a sim timer. */
  trigger: string;
  /** Relative weight among this type's events. Higher is more often. */
  weight: number;
  panel: string;
  /** What the hall and the cutaway should show. */
  hall: string;
  right: string;
  wrong: string;
}

export const SITE_EVENTS: ShiftEvent[] = [
  {
    id: "sg-tube",
    kind: "pwr",
    title: "Steam generator tube leak",
    trigger: "While the primary is at power and the steam line is open.",
    weight: 1,
    panel: "Steam-line radiation alarm.",
    hall: "A mark on the steam-generator tubes. Arrows still move.",
    right: "Cut power, isolate the steam generator, hold the primary.",
    wrong: "Leave it online. The alarm stays and the secondary carries activity.",
  },
  {
    id: "rcp-trip",
    kind: "pwr",
    title: "Reactor coolant pump trip",
    trigger: "One loop at power.",
    weight: 1,
    panel: "Loop flow at zero. Temperature split widens.",
    hall: "That loop's arrows stop.",
    right: "Run the plant back with the loop that still has a pump.",
    wrong: "Hold full power on one pump. The core outlet climbs.",
  },
  {
    id: "spray-stuck",
    kind: "pwr",
    title: "Pressurizer spray stuck open",
    trigger: "Pressurizer in auto and the plant near the band.",
    weight: 1,
    panel: "Pressure falling. Spray light stays on.",
    hall: "Pressurizer spray line stays lit.",
    right: "Shut the spray valve by hand and watch saturation.",
    wrong: "Wait. Pressure keeps falling toward the boiling point.",
  },
  {
    id: "recirc-trip",
    kind: "bwr",
    title: "Recirc pump trip",
    trigger: "In the power range, one recirc pump.",
    weight: 1,
    panel: "Recirc flow down. Power down with the voids.",
    hall: "Recirc arrows stop. The core port dulls.",
    right: "Leave the rods. Let the lower flow set the lower power.",
    wrong: "Pull rods to get the power back. The voids are the plant telling you no.",
  },
  {
    id: "msiv",
    kind: "bwr",
    title: "Main steam isolation",
    trigger: "Steam line open at power.",
    weight: 1,
    panel: "Pressure up. Scram.",
    hall: "Main steam arrows stop. Rods in from below.",
    right: "Confirm the scram and the isolation. Do not reopen into a live line.",
    wrong: "Try to hold power with the steam bottled up. Pressure is already the trip.",
  },
  {
    id: "heater-out",
    kind: "bwr",
    title: "Feedwater heater out",
    trigger: "On the line, feedwater heaters in service.",
    weight: 1,
    panel: "Feedwater colder. Power wants to rise.",
    hall: "Feedwater line still moves. No new leak mark.",
    right: "Drop recirc or insert rods until power is back in the band.",
    wrong: "Do nothing. Colder feed keeps adding reactivity.",
  },
  {
    id: "blower-trip",
    kind: "pebble",
    title: "Helium blower trip",
    trigger: "Blower carrying heat at power.",
    weight: 1,
    panel: "Blower speed zero. Outlet starts to climb.",
    hall: "Helium arrows stop.",
    right: "Scram and keep the shutdown cooling path.",
    wrong: "Stay at power with no blower. The pebbles keep their heat.",
  },
  {
    id: "pebble-jam",
    kind: "pebble",
    title: "Pebble jam in the discharge",
    trigger: "Online fuelling, a pebble in the discharge line.",
    weight: 1,
    panel: "Discharge counter stuck. Burnup on that pebble stops moving.",
    hall: "The loading tube is dark. Core arrows still move if the blower is up.",
    right: "Stop fuelling. Leave the blower on. Clear the line before the next pass.",
    wrong: "Force another pebble in. The line stays jammed.",
  },
  {
    id: "helium-moisture",
    kind: "pebble",
    title: "Moisture in the helium",
    trigger: "Helium loop closed and a steam-generator tube weeping.",
    weight: 1,
    panel: "Moisture alarm on the helium.",
    hall: "A mark on the steam generator. Helium arrows still move.",
    right: "Scram, isolate the steam generator, dry the helium.",
    wrong: "Keep blowing wet helium through graphite.",
  },
  {
    id: "freeze-cooling",
    kind: "msr",
    title: "Freeze-valve cooling air lost",
    trigger: "At power. The plug is held frozen by cooling air until a drain is ordered.",
    weight: 1,
    panel: "Cooling air low. Plug temperature rising.",
    hall: "The cooling air line on the freeze valve is still.",
    right: "Restore the cooling air. If the plug opens anyway, the drain is the designed shutdown.",
    wrong: "Pull rods to hold power while the plug thaws. The salt leaves anyway.",
  },
  {
    id: "offgas",
    kind: "msr",
    title: "Off-gas high pressure",
    trigger: "While the salt is circulating and fission gas is being stripped.",
    weight: 1,
    panel: "Off-gas pressure high.",
    hall: "The off-gas line is marked. Salt arrows still move.",
    right: "Cut power and line up the spare off-gas path.",
    wrong: "Keep full power into a blocked off-gas line.",
  },
  {
    id: "salt-freeze",
    kind: "msr",
    title: "Salt line cooling",
    trigger: "A fuel-salt line off the heated path.",
    weight: 1,
    panel: "Line temperature falling toward the freeze point.",
    hall: "That pipe's arrows slow. Heater tape should be on.",
    right: "Put the heat trace back on and keep the pump running.",
    wrong: "Let it cool. The line freezes and the loop stops.",
  },
];

export function eventsFor(kind: SiteKind): ShiftEvent[] {
  return SITE_EVENTS.filter((e) => e.kind === kind);
}

/** Pick from the type's list. `roll` is 0 to 1. */
export function pickEvent(kind: SiteKind, roll: number): ShiftEvent {
  const list = eventsFor(kind);
  const total = list.reduce((s, e) => s + e.weight, 0);
  let x = Math.max(0, Math.min(0.999999, roll)) * total;
  for (const e of list) {
    x -= e.weight;
    if (x < 0) return e;
  }
  return list[list.length - 1];
}

export interface EventView {
  panel: string;
  hall: string;
  /** 0 to 1. Arrow speed in the hall and the cutaway. */
  flow: number;
  tubeMark: boolean;
  scram: boolean;
  ended: boolean;
  /** New pump, recirc or blower command for the bench, percent. Absent: the operator's flow stands. */
  benchFlow?: number;
}

type Outcome = Partial<Pick<EventView, "flow" | "tubeMark" | "scram" | "benchFlow">>;

/**
 * What each answer does to the plant. One row per event, so nothing falls through to a default by accident.
 * Half flow is the floor of the bench's flow control (50%).
 */
const OUTCOMES: Record<string, { right: Outcome; wrong: Outcome }> = {
  "sg-tube": { right: { tubeMark: true }, wrong: { tubeMark: true } },
  "rcp-trip": { right: { flow: 0.5, benchFlow: 50 }, wrong: { flow: 0.5, scram: true } },
  "spray-stuck": { right: {}, wrong: { scram: true } },
  "recirc-trip": { right: { flow: 0.5, benchFlow: 50 }, wrong: { flow: 0.5, benchFlow: 50 } },
  msiv: { right: { flow: 0, scram: true }, wrong: { flow: 0, scram: true } },
  "heater-out": { right: {}, wrong: {} },
  "blower-trip": { right: { flow: 0, scram: true }, wrong: { flow: 0, scram: true } },
  "pebble-jam": { right: {}, wrong: {} },
  "helium-moisture": { right: { tubeMark: true, scram: true }, wrong: { tubeMark: true } },
  "freeze-cooling": { right: {}, wrong: { flow: 0, scram: true } },
  offgas: { right: {}, wrong: {} },
  "salt-freeze": { right: {}, wrong: { flow: 0, scram: true } },
};

/** What the player sees after the right or the wrong response. */
export function resolveEvent(event: ShiftEvent, right: boolean): EventView {
  const row = OUTCOMES[event.id];
  if (!row) throw new Error(`No outcome for event ${event.id}`);
  const o = right ? row.right : row.wrong;
  return {
    panel: right ? event.right : event.wrong,
    hall: event.hall,
    flow: o.flow ?? 1,
    tubeMark: o.tubeMark ?? false,
    scram: o.scram ?? false,
    ended: !right,
    ...(o.benchFlow !== undefined ? { benchFlow: o.benchFlow } : {}),
  };
}

/** Every event has an outcome row. Used by the tests. */
export const OUTCOME_IDS = Object.keys(OUTCOMES);

/** Apply a resolved event onto a panel the controls layer already built. */
export function paintEvent(panel: SitePanel, view: EventView): SitePanel {
  return {
    ...panel,
    lines: [view.panel, ...panel.lines],
    flow: view.flow,
    arrows: view.flow > 0.02 && !view.scram,
    tubeMark: view.tubeMark || panel.tubeMark,
    glow: view.scram ? Math.min(panel.glow, 0.05) : panel.glow,
  };
}
