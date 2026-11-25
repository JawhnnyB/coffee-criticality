/**
 * The move from the day week to the nights, as moments with people instead of menu cards.
 *
 * The owner, 25 November 2026: "the move to nights is a menu, not a moment." So: Elena at her van at dusk hands
 * you the rotation; the days off are a short beat with the crew still in it; and each night opens with someone,
 * in their own voice (docs/characters.md): Elena's turnover on night 1, Jordan's radio check on night 2, a note
 * from Mabel on night 3, Holt on the phone on night 4. A night stood again gets its own line from the same person.
 *
 * Pure data, so node tests can read it. NightWatch.tsx draws it.
 */
import type { NpcId } from "../content";

export interface SceneLine {
  /** Who speaks. Null is the narration. */
  who: NpcId | null;
  text: string;
}

export interface RotationScene {
  /** The small caps line at the top: time and place. */
  where: string;
  title: string;
  /** Whose portrait sits beside the scene. */
  face: NpcId | null;
  lines: SceneLine[];
}

export interface WeekMood {
  /** The day week held (ended "a"). */
  held: boolean;
  hides: number;
  /** Trust, for the person in the scene. */
  trust: Partial<Record<NpcId, number>>;
  /** A week after the first: they've done a rotation with you before. */
  returning: boolean;
}

/** Elena at her van at dusk, the evening the week ends. */
export function vanScene(m: WeekMood): RotationScene {
  const lines: SceneLine[] = [{ who: null, text: "Dusk on the lot. Elena's van is the only one with the engine running." }];
  if (m.hides >= 3) {
    lines.push({ who: "elena", text: "Three things went unsaid this week. I'm still putting you on nights. I'd rather you stood them with me watching." });
  } else if (!m.held) {
    lines.push({ who: "elena", text: "That week didn't hold. You know it, and I know it. Nights are where you show me what you learned from it." });
  } else {
    lines.push({ who: "elena", text: m.returning ? "Another good week. Thank you. You know what comes next." : "Good week. I mean that. Now the part nobody likes." });
  }
  lines.push(
    { who: "elena", text: "Three days off, then four nights in Control. Eighteen hundred to six. Jordan roves; you watch the cameras and the board." },
    { who: "elena", text: "Sleep on your days off. Properly. Tired eyes are how a night goes wrong. I'll do your first turnover myself." },
  );
  return { where: "Dusk · Lot", title: "Elena's van", face: "elena", lines };
}

/** The three days off. Short, and the crew is still in your life. */
export function daysOffScene(m: WeekMood): RotationScene {
  const lines: SceneLine[] = [{ who: null, text: "Three days off. You sleep wrong for two of them." }];
  if (m.held) lines.push({ who: null, text: "The week held. You still wake at the wrong hour, reaching for a radio that isn't there." });
  else if (m.hides >= 3) lines.push({ who: null, text: "You keep replaying the things you didn't say. They're louder at four in the morning." });
  else lines.push({ who: null, text: "The plant is someone else's problem until eighteen hundred on Monday. You try to believe that." });
  if ((m.trust.jordan ?? 0) >= 45 && m.hides < 3) lines.push({ who: "jordan", text: "A text from Jordan: a photo of lane two, and nothing else. You know what it means." });
  else lines.push({ who: "mabel", text: "A text from Mabel: \"Sleep. The kettle will still be here.\"" });
  return { where: "Days off", title: "Three days off", face: null, lines };
}

/** Each night opens with someone. Night 1 Elena, 2 Jordan, 3 Mabel (a note), 4 Holt (the phone). */
export function openerScene(night: number, again: boolean, m: WeekMood): RotationScene {
  const n = Math.min(4, Math.max(1, night));
  if (n === 1) {
    return {
      where: "18:00 · Control",
      title: again ? "Night 1, again" : "The turnover",
      face: "elena",
      lines: again
        ? [
            { who: "elena", text: "We're standing night one again. Not as a punishment. The plant doesn't grade on a curve, and neither do I." },
            { who: "elena", text: "Same desk, same cameras. This time, look at the camera before the board tells you to." },
          ]
        : [
            { who: "elena", text: "Eighteen hundred. Here's the log. Read it twice, then tell me what it says in your own words." },
            { who: "elena", text: "Cameras first, then the board. If you see something on a camera before the board knows, that's the catch." },
            { who: "elena", text: "Jordan's on the radio if you need eyes. I'll be back at six. You've got this." },
          ],
    };
  }
  if (n === 2) {
    const cold = !m.held;
    return {
      where: "18:00 · Control · Radio",
      title: again ? "Night 2, again" : "Radio check",
      face: "jordan",
      lines: again
        ? [{ who: "jordan", text: "Same night again. No shame in it. You see more the second time through. Radio check?" }]
        : cold
          ? [
              { who: "jordan", text: "Radio check." },
              { who: "jordan", text: "Loud and clear. Rounds start at the turbine. Call if you need me." },
            ]
          : [
              { who: "jordan", text: "Radio check from the turbine deck. Loud and clear? Great. I'm your legs tonight. You're my eyes." },
              { who: "jordan", text: "If a camera looks weird, call it. I'd rather walk for nothing than walk past something." },
            ],
    };
  }
  if (n === 3) {
    return {
      where: "18:00 · Control · The desk",
      title: again ? "Night 3, again" : "A thermos on the desk",
      face: "mabel",
      lines: again
        ? [
            { who: null, text: "The thermos is back, with a new note." },
            { who: "mabel", text: "\"Again? Good. The second pot is always better than the first. M.\"" },
          ]
        : [
            { who: null, text: "There's a thermos on the watch desk, and a note taped to it." },
            { who: "mabel", text: "\"Night three is the hard one. Your body thinks it's morning. Drink this and keep looking. M.\"" },
          ],
    };
  }
  return {
    where: "18:00 · Control · Phone",
    title: again ? "Night 4, again" : "Holt calls the desk",
    face: "holt",
    lines: again
      ? [{ who: "holt", text: "Holt. We're standing it again. That's the system working, not failing. Thank you for standing it." }]
      : [
          { who: "holt", text: "Holt. Last night of the rotation. I won't keep you." },
          { who: "holt", text: "Whatever the board says at six, I want the log honest more than I want it clean. Thank you for standing these." },
        ],
  };
}
