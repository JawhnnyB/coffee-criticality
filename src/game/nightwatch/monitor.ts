/**
 * The passive Plant Monitor: the site's readings, live from the day's run, around the clock.
 * It alarms only on things that are wrong at any power: a reactor trip, core ΔT above its band (the high side,
 * as an overtemperature ΔT alarm does; a low ΔT at low power is normal), or power above 104%. A plant at reduced
 * power is not an alarm, so feed flow tracks power rather than a fixed band.
 */
import { DT_BAND, thermalState } from "../plant";
import type { RunState } from "../plant";
import { sitePower, type SiteKind } from "../plantLoops";
import { siteWatch, type Metric } from "./model";

export interface MonitorState {
  site: SiteKind;
  power: number;
  tripped: boolean;
  values: { m: Metric; v: number; alarm: boolean }[];
  alarms: string[];
  /** Shift by the clock: day 06-14, swing 14-22, night 22-06. */
  shift: "Day" | "Swing" | "Night";
}

export function shiftAt(minutes: number): MonitorState["shift"] {
  const h = Math.floor(((minutes % 1440) + 1440) % 1440 / 60);
  return h >= 6 && h < 14 ? "Day" : h >= 14 && h < 22 ? "Swing" : "Night";
}

const FLOW_IDS = new Set(["pflow", "cflow", "blower", "pump"]);
const POWER_IDS = new Set(["feed", "steam"]);

export function monitorState(site: SiteKind, run: RunState | null | undefined, minutes: number): MonitorState {
  const tripped = !!run?.scram;
  const power = tripped ? 0 : sitePower(run) * 100;
  const flow = run && run.history.length ? run.flowPct : 100;
  const th = thermalState(site, { powerPct: power, flowPct: flow });
  const w = siteWatch(site);
  const alarms: string[] = [];
  const values = w.metrics.map((m) => {
    let v = m.base;
    let alarm = false;
    if (m.id === "power") {
      v = power;
      alarm = power > 104;
    } else if (m.id === "hot" || m.id === "steamT") v = th.tHot;
    else if (m.id === "cold") v = th.tCold;
    else if (FLOW_IDS.has(m.id)) v = flow;
    else if (POWER_IDS.has(m.id)) v = power;
    else if (m.ratio) v = tripped ? 0.6 : 0.8 + 0.2 * (power / 100);
    // Time of night drift on the grid: the load falls after midnight.
    if (m.id === "grid") v = 100 + 0.6 * Math.sin((minutes / 1440) * 2 * Math.PI);
    if (alarm) alarms.push(m.id);
    return { m, v, alarm };
  });
  if (!tripped && power > 5 && th.dT > DT_BAND[site].hi) {
    alarms.push("dT");
    for (const x of values) if (x.m.id === "hot" || x.m.id === "cold" || x.m.id === "steamT") x.alarm = true;
  }
  if (tripped) alarms.push("trip");
  return { site, power, tripped, values, alarms, shift: shiftAt(minutes) };
}

export function monitorAlarm(site: SiteKind, run: RunState | null | undefined, minutes: number): boolean {
  return monitorState(site, run, minutes).alarms.length > 0;
}
