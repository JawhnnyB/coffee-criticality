/**
 * The mission board in the corner of the screen, in place of the little site plan: what the day asks of you, in
 * order, with the next thing marked. Done items are ticked, optional ones sit quietly at the end, and the first
 * thing still to do is "now". The live direction (sim's objective) goes under it as "next step".
 * Pure: the HUD in GameApp draws it.
 */

export type MissionState = "done" | "now" | "todo" | "optional";

export interface Mission {
  id: string;
  label: string;
  state: MissionState;
}

const OPTIONAL = /\(optional\)/i;

export function missionBoard(goals: { id: string; label: string; done: boolean }[]): Mission[] {
  const out: Mission[] = [];
  let now = false;
  for (const g of goals) {
    const optional = OPTIONAL.test(g.label);
    const label = g.label.replace(OPTIONAL, "").trim();
    let state: MissionState;
    if (g.done) state = "done";
    else if (optional) state = "optional";
    else if (!now) {
      state = "now";
      now = true;
    } else state = "todo";
    out.push({ id: g.id, label, state });
  }
  // Required first in their order, then the optional ones; done items stay where they were.
  return [...out.filter((m) => m.state !== "optional"), ...out.filter((m) => m.state === "optional")];
}

/** The walk in to a night watch: two things, the first one live until you reach Control. */
export function nightMissions(atDesk: boolean): Mission[] {
  return [
    { id: "walk", label: "Walk to the watch desk in Control", state: atDesk ? "done" : "now" },
    { id: "watch", label: "Take the watch", state: atDesk ? "now" : "todo" },
  ];
}
