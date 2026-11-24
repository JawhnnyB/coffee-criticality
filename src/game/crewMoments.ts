/**
 * Crew moments (roadmap step 50). DRAFT, written by Claude on 23 November 2026, waiting for the owner's approval.
 * Every line is listed in docs/crew-moments-draft.md for review.
 *
 * A tier scene (socialScenes.ts) is about who someone is. A moment is about what you did this week: it plays only
 * when the week's own record says it happened (s.residue, s.hides, s.catches, s.maintDone, flags). Each plays once,
 * at most one per conversation, and never on the same conversation as a tier scene.
 * "Heard" is a flag ("moment:<id>"), so the save format does not change. sim's pickChoice applies the choices.
 * Voice: the cast's own. Short, concrete. No real names, places or dose numbers.
 */
import type { Line, NpcId, Residue } from "./content";

export interface MomentState {
  day: number;
  residue: Residue;
  hides: number;
  catches: number;
  maintDone: boolean;
  flags: Record<string, boolean>;
}

export interface Moment {
  id: string;
  npc: NpcId;
  title: string;
  /** One line for the crew page once heard. */
  known: string;
  /** Not before this day. */
  day: number;
  when: (s: MomentState) => boolean;
  lines: Line[];
}

export const MOMENTS: Moment[] = [
  {
    id: "valve-said",
    npc: "tommy",
    title: "The repack",
    known: "Tommy repacked Valve 14 because you said it out loud.",
    day: 2,
    when: (s) => s.residue.valve === "caught",
    lines: [
      { speaker: "Tommy", text: "Repacked Fourteen this morning. Packing was cooked. Another week and it would've sprayed.", mood: "even" },
      {
        speaker: "Tommy",
        text: "Work order had your name on the first line. I don't see that much.",
        mood: "warm",
        choices: [
          { id: "mom-valve-said-a", label: "It was dripping. I wrote it down.", reply: "That's all it ever is. Most people skip the writing.", trust: 2 },
          { id: "mom-valve-said-b", label: "You did the hard part.", reply: "I did the second part. Second part's easy when the first part's there.", trust: 2 },
        ],
      },
    ],
  },
  {
    id: "valve-hid",
    npc: "tommy",
    title: "The drip tray",
    known: "Tommy found the drip tray under Valve 14 full. He asked. He didn't accuse.",
    day: 2,
    when: (s) => s.residue.valve === "hid",
    lines: [
      { speaker: "Tommy", text: "Somebody put a drip tray under Fourteen. Tray's full. No work order.", mood: "even" },
      { speaker: "Tommy", text: "I'm not asking who. I'm asking if it gets written today.", mood: "sharp" },
      {
        speaker: "Tommy",
        text: "Because I'm the one who opens it.",
        mood: "even",
        choices: [
          { id: "mom-valve-hid-a", label: "It was me. I'll write it now.", reply: "Then it's a leak, not a secret. I can fix a leak.", trust: 3, culture: 1, flag: "momentOwned" },
          { id: "mom-valve-hid-b", label: "Probably condensate.", reply: "Condensate doesn't leave white crust on the bonnet.", trust: -2 },
        ],
      },
    ],
  },
  {
    id: "tag-moved",
    npc: "elena",
    title: "The tag on 2B",
    known: "Elena knows the clearance tag on 2B moved. She waited for you to say it.",
    day: 3,
    when: (s) => s.residue.tag === "hid",
    lines: [
      { speaker: "Elena", text: "Clearance tag on 2B is on the wrong breaker. It was right yesterday.", mood: "even" },
      { speaker: "Elena", text: "A tag that moves is worse than no tag. Somebody trusts it.", mood: "sharp" },
      {
        speaker: "Elena",
        text: "I'm going to ask once.",
        mood: "even",
        choices: [
          { id: "mom-tag-moved-a", label: "I moved it. I'll walk it back with you.", reply: "Good. We hang it together and we both sign.", trust: 3, culture: 1, flag: "momentOwned" },
          { id: "mom-tag-moved-b", label: "Night shift had the board.", reply: "Night shift wrote theirs down. That's how I know it wasn't them.", trust: -2 },
        ],
      },
    ],
  },
  {
    id: "dose-said",
    npc: "priya",
    title: "Next to the tank",
    known: "Priya walked the aux stairs with the survey you called in.",
    day: 4,
    when: (s) => s.residue.dose === "caught",
    lines: [
      { speaker: "Priya", text: "I walked the aux stairs with your survey. The reading was where you said.", mood: "even" },
      { speaker: "Priya", text: "A number on a sheet is a rumor. You went and stood next to it.", mood: "warm" },
      {
        speaker: "Priya",
        text: "What made you go back?",
        mood: "soft",
        choices: [
          { id: "mom-dose-said-a", label: "The dosimeter didn't match the map.", reply: "Then you believed the instrument over the drawing. Keep doing that.", trust: 3 },
          { id: "mom-dose-said-b", label: "Habit.", reply: "Good habits look like luck from the outside.", trust: 2 },
        ],
      },
    ],
  },
  {
    id: "log-unedited",
    npc: "holt",
    title: "Read twice",
    known: "Holt read your log twice. He said that is rare.",
    day: 5,
    when: (s) => s.residue.log === "caught",
    lines: [
      { speaker: "Holt", text: "I read your log twice. Yesterday's entry has a correction in it, initialled.", mood: "even" },
      { speaker: "Holt", text: "Most logs are clean because somebody cleaned them. Yours is clean because it's right.", mood: "even" },
      {
        speaker: "Holt",
        text: "Keep the corrections in. I fund the corrections.",
        mood: "even",
        choices: [
          { id: "mom-log-unedited-a", label: "The correction was the point.", reply: "Then you understand the budget better than my predecessor.", trust: 3 },
          { id: "mom-log-unedited-b", label: "I almost rewrote it.", reply: "Almost is the honest word. I'll take almost.", trust: 2 },
        ],
      },
    ],
  },
  {
    id: "marcus-check",
    npc: "marcus",
    title: "Check my math",
    known: "Marcus asked you to check his numbers before he showed the floor.",
    day: 3,
    when: (s) => s.catches >= 4,
    lines: [
      { speaker: "Marcus", text: "I'm presenting the heat balance at two. Would you check the inputs first?", mood: "tired" },
      { speaker: "Marcus", text: "You've caught four things this week. I'd rather be wrong in front of you than in front of the room.", mood: "even" },
      {
        speaker: "Marcus",
        text: "If it's wrong, tell me plainly.",
        mood: "soft",
        choices: [
          { id: "mom-marcus-check-a", label: "Feedwater flow is an hour old. Pull the new one.", reply: "It is. Thank you. Quietly, thank you.", trust: 3, flag: "marcusChecked" },
          { id: "mom-marcus-check-b", label: "Looks fine to me.", reply: "Looks fine is what I said yesterday.", trust: 1 },
        ],
      },
    ],
  },
  {
    id: "jordan-distance",
    npc: "jordan",
    title: "Not on that hour",
    known: "Jordan asked to be taken off the log for an hour you hid something in.",
    day: 3,
    when: (s) => s.hides >= 2,
    lines: [
      { speaker: "Jordan", text: "Can you take my name off the log for the hour that didn't get written?", mood: "even" },
      { speaker: "Jordan", text: "I wasn't part of it. I'd like the log to say so.", mood: "sharp" },
      {
        speaker: "Jordan",
        text: "I've done this before. I'm not doing it again.",
        mood: "soft",
        choices: [
          { id: "mom-jordan-distance-a", label: "You were there. Let's write it right instead.", reply: "Then I'll sign it. Next to yours.", trust: 3, culture: 1, flag: "momentOwned" },
          { id: "mom-jordan-distance-b", label: "I'll take your name off.", reply: "Thanks. That's the distance.", trust: -1 },
        ],
      },
    ],
  },
  {
    id: "mabel-maint",
    npc: "mabel",
    title: "Tommy smiling",
    known: "Mabel saw Tommy come in smiling after the maintenance you finished.",
    day: 3,
    when: (s) => s.maintDone,
    lines: [
      { speaker: "Mabel", text: "Tommy came in for his coffee smiling. Tommy does not smile before ten.", mood: "wry" },
      { speaker: "Mabel", text: "He said the work order closed with the try done and signed. Somebody finished the sentence.", mood: "warm" },
      {
        speaker: "Mabel",
        text: "That's a good morning's work.",
        mood: "warm",
        choices: [
          { id: "mom-mabel-maint-a", label: "He did the work. I signed the try.", reply: "Both halves. That's why he smiled.", trust: 2 },
          { id: "mom-mabel-maint-b", label: "It was just paperwork.", reply: "Paperwork is the part that remembers. Pour yourself one.", trust: 1 },
        ],
      },
    ],
  },
  {
    id: "elena-nights",
    npc: "elena",
    title: "Next rotation",
    known: "Elena told you nights are next. She will take your turnover at six.",
    day: 4,
    when: (s) => s.hides === 0 && s.catches >= 3,
    lines: [
      { speaker: "Elena", text: "You're on nights next rotation. Watch desk, eight cameras, one coffee pot that works.", mood: "even" },
      { speaker: "Elena", text: "Nights are quiet. Quiet is when things sit on a camera for an hour and nobody looks.", mood: "even" },
      {
        speaker: "Elena",
        text: "I take your turnover at six. Bring me a clean log.",
        mood: "warm",
        choices: [
          { id: "mom-elena-nights-a", label: "Clean and honest. In that order?", reply: "Honest first. Clean is what honest looks like at six.", trust: 2 },
          { id: "mom-elena-nights-b", label: "What do I watch first?", reply: "Whatever you looked at least.", trust: 2 },
        ],
      },
    ],
  },
  {
    id: "jordan-rounds",
    npc: "jordan",
    title: "Wave at the camera",
    known: "Jordan walks the night rounds. He said to watch for his torch.",
    day: 5,
    when: () => true,
    lines: [
      { speaker: "Jordan", text: "When you're on nights, I'm the one walking rounds. Turbine deck, aux, the pool, the yard.", mood: "even" },
      { speaker: "Jordan", text: "You'll see a torch on the cameras. That's me. Don't report me.", mood: "wry" },
      {
        speaker: "Jordan",
        text: "If something's wrong where I've just walked, call me. I'd rather turn around.",
        mood: "even",
        choices: [
          { id: "mom-jordan-rounds-a", label: "I'll call. Keep your radio on.", reply: "Always on. Battery's the one thing I check twice.", trust: 2 },
          { id: "mom-jordan-rounds-b", label: "I'll wave back.", reply: "Camera can't see you. Wave anyway.", trust: 1 },
        ],
      },
    ],
  },
];

const heardKey = (id: string) => `moment:${id}`;

/** The first moment due for this person now, if any. */
export function dueMoment(s: MomentState, npc: NpcId): Moment | null {
  for (const m of MOMENTS) {
    if (m.npc !== npc || s.day < m.day || s.flags[heardKey(m.id)]) continue;
    if (m.when(s)) return m;
  }
  return null;
}

/** Mark a moment heard. */
export function markMoment(flags: Record<string, boolean>, id: string) {
  flags[heardKey(id)] = true;
}

/** What the crew page says about moments already heard. */
export function knownMoments(flags: Record<string, boolean>, npc: NpcId): string[] {
  return MOMENTS.filter((m) => m.npc === npc && flags[heardKey(m.id)]).map((m) => m.known);
}
