/**
 * The taskbar in the plant: rules only, so node tests can check them. ShiftBar.tsx draws it.
 * (Named barRules, not shiftBar, so it never clashes with ShiftBar.tsx on a case-insensitive disk.)
 *
 * The owner, 24 November 2026: the cameras, the plant data, the Academy and the music should be one click
 * away while you play, on a taskbar that deliberately breaks the fourth wall. The plant is one task on an
 * engineer's workstation, and you are the person at the desk looking in on the story.
 *
 * Opening anything from the bar opens Parlor OS with that app in front. The plant's clock stops while the
 * desktop is open (sim.ts already does this), so stepping out never costs the shift time.
 */
import { visibleApps, type AppId, type VisibilityInput } from "./parlorOS";
import type { MonitorState } from "./nightwatch/monitor";

/** Saved in the shift's flags: the player hid the taskbar in Settings. */
export const BAR_OFF_FLAG = "ui:taskbarOff";

/** The screens the bar sits under: walking the plant, and talking or deciding inside it. */
export const BAR_MODES = ["play", "dialogue", "incident"] as const;

export interface BarTask {
  id: AppId;
  /** The tab's words on a wide screen. */
  label: string;
  /** Three or four letters on a phone. */
  short: string;
  /** What the tab opens, said plainly for a screen reader and the hover tip. */
  tip: string;
}

/** In order: what you watch, what you read, what you study, what you listen to. */
export const BAR_TASKS: readonly BarTask[] = [
  { id: "nightwatch", label: "Cameras", short: "CAM", tip: "Open the camera feeds" },
  { id: "monitor", label: "Plant data", short: "DATA", tip: "Open the Plant Monitor" },
  { id: "academy", label: "Academy", short: "EDU", tip: "Open the Academy" },
  { id: "music", label: "Music", short: "MUS", tip: "Open the Music app" },
];

/** True when the bar is drawn. Hidden in Settings, and during the night rotation, which has its own screen. */
export function barShown(mode: string, flags: Record<string, boolean>): boolean {
  if (flags[BAR_OFF_FLAG] || flags["rot:nights"]) return false;
  return (BAR_MODES as readonly string[]).includes(mode);
}

/** Launching steps out of the plant, so it waits for the conversation or decision on screen to finish. */
export function canLaunch(mode: string): boolean {
  return mode === "play";
}

/** The bar's tabs, limited to apps the desktop would show now (the cameras and data need a designed plant). */
export function barTasks(input: VisibilityInput): BarTask[] {
  const shown = new Set(visibleApps(input).map((a) => a.id));
  return BAR_TASKS.filter((t) => shown.has(t.id));
}

/** The plant's own tab: this shift, by day. Day names already read "Day 2 · Tags". Narrow screens get "Unit 1 · D2", phones "D2". */
export function shiftTaskLabel(day: number, dayName: string, phone = false, tiny = false): string {
  if (tiny) return `D${day}`;
  if (phone) return `Unit 1 · D${day}`;
  return `Unit 1 · ${dayName || `Day ${day}`}`;
}

/** The live reading on the Plant data tab: power, or TRIP. Alarm when the Plant Monitor alarms. */
export function dataChip(st: Pick<MonitorState, "power" | "tripped" | "alarms">): { text: string; alarm: boolean } {
  if (st.tripped) return { text: "TRIP", alarm: true };
  return { text: `${Math.round(st.power)}%`, alarm: st.alarms.length > 0 };
}

/** The player's own clock, beside the plant's: the one place the game admits there is a room outside it. */
export function realClock(d: Date, clock24: boolean): string {
  const h = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (clock24) return `${String(h).padStart(2, "0")}:${mm}`;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${h < 12 ? "AM" : "PM"}`;
}
