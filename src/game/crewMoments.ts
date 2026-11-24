/**
 * Crew moments (roadmap step 50). DRAFT, written by Claude on 23 November 2026, waiting for the owner's approval.
 * Every line is listed in docs/crew-moments-draft.md for review.
 *
 * A tier scene (socialScenes.ts) is about who someone is. A moment is about what you did this week: it plays only
 * when the week's own record says it happened (s.residue, s.hides, s.catches, s.maintDone, flags). Each plays once,
 * at most one per conversation, and never on the same conversation as a tier scene.
 * "Heard" is a flag ("moment:<id>"), so the save format does not change. sim's pickChoice applies the choices.
 * Voice: the cast's own. Each moment is a real conversation: what was at stake, something the speaker got wrong
 * once, a genuine thank-you or a plain apology, and replies that sound like a person. No real names or dose numbers.
 * Lines stay short (about 120 characters, like the tier scenes) so they fit a phone.
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
    known: "Tommy repacked Valve 14. The packing came apart in his hand. He thanked you, properly.",
    day: 2,
    when: (s) => s.residue.valve === "caught",
    lines: [
      { speaker: "Tommy", text: "Got a minute? I repacked Valve 14 this morning.", mood: "even" },
      { speaker: "Tommy", text: "Pulled the old packing and it came apart in my hand. Like wet paper.", mood: "even" },
      { speaker: "Tommy", text: "That's a hot line. Another week and it wouldn't have been a drip. It'd have been spray, with somebody beside it.", mood: "sharp" },
      { speaker: "Tommy", text: "Probably me. I'm the one who walks past it every morning.", mood: "even" },
      { speaker: "Tommy", text: "So I want to say this properly, because people don't. Thank you.", mood: "warm" },
      {
        speaker: "Tommy",
        text: "You saw a drip, you wrote it down, and you put your name on it. That's not small.",
        mood: "warm",
        choices: [
          { id: "mom-valve-said-a", label: "I almost didn't. It looked like nothing.", reply: "Most things do on the first day. You wrote it anyway. That's the part I'm thanking you for.", trust: 3 },
          { id: "mom-valve-said-b", label: "I'm glad nobody was standing there.", reply: "Me too. Next time you see something on my side of the house, come find me first. I mean that.", trust: 3 },
        ],
      },
    ],
  },
  {
    id: "valve-hid",
    npc: "tommy",
    title: "The drip tray",
    known: "Tommy found the drip tray under Valve 14 and told you about the flange he once hid.",
    day: 2,
    when: (s) => s.residue.valve === "hid",
    lines: [
      { speaker: "Tommy", text: "Somebody put a drip tray under Valve 14. No work order. No tag.", mood: "even" },
      { speaker: "Tommy", text: "Tray was full when I found it. White crust all down the bonnet.", mood: "even" },
      { speaker: "Tommy", text: "I'm not here to find out who. I want to tell you something instead.", mood: "soft" },
      { speaker: "Tommy", text: "My second year, I hid a weeping flange. Wrapped a rag on it. Told myself I'd write it after the outage.", mood: "soft" },
      { speaker: "Tommy", text: "It let go on nights. A guy I trained with took the spray. He was all right. I wasn't, for a long time.", mood: "tired" },
      {
        speaker: "Tommy",
        text: "So if it was you, I get it. I just need it written today. I'm the one who has to open it.",
        mood: "even",
        choices: [
          { id: "mom-valve-hid-a", label: "It was me. I'm sorry. I'll write it now, and walk it down with you.", reply: "Thank you. That's harder to say than it is to hide. Come on, we'll write it together. Nobody's getting yelled at today.", trust: 3, culture: 1, flag: "momentOwned" },
          { id: "mom-valve-hid-b", label: "I don't know anything about it.", reply: "Okay. If that changes, my door's open. It always is.", trust: -2 },
        ],
      },
    ],
  },
  {
    id: "tag-moved",
    npc: "elena",
    title: "The tag on 2B",
    known: "Elena asked about the tag on 2B, and told you about the one she moved years ago.",
    day: 3,
    when: (s) => s.residue.tag === "hid",
    lines: [
      { speaker: "Elena", text: "Do you have a minute? Somewhere quieter.", mood: "even" },
      { speaker: "Elena", text: "The clearance tag on 2B is on the wrong breaker. Yesterday it was right.", mood: "even" },
      { speaker: "Elena", text: "A tag is a promise to the person downstream. This one is dead. You can put your hands in.", mood: "sharp" },
      { speaker: "Elena", text: "Years ago I moved a tag to save twenty minutes on a turnover. Nobody got hurt.", mood: "soft" },
      { speaker: "Elena", text: "I've thought about who could have, most weeks since.", mood: "soft" },
      {
        speaker: "Elena",
        text: "I'm not asking to catch you. If it was you, I want to fix it with you, not around you.",
        mood: "even",
        choices: [
          { id: "mom-tag-moved-a", label: "It was me. I moved it to finish faster. I should have stopped and asked.", reply: "Thank you for telling me. Really. We'll rehang it together and both sign. And now you'll think about who's downstream, too.", trust: 3, culture: 1, flag: "momentOwned" },
          { id: "mom-tag-moved-b", label: "It must have been night shift.", reply: "Night shift wrote theirs down. I checked before I asked you. I'll fix it. I hope you'll come to me next time.", trust: -2 },
        ],
      },
    ],
  },
  {
    id: "dose-said",
    npc: "priya",
    title: "Next to the wall",
    known: "Priya moved the contractors' scaffold because of the survey you called in.",
    day: 4,
    when: (s) => s.residue.dose === "caught",
    lines: [
      { speaker: "Priya", text: "I walked the aux stairs this morning with the survey you called in.", mood: "even" },
      { speaker: "Priya", text: "The reading was right where you said. Higher than the map. Higher than last month.", mood: "even" },
      { speaker: "Priya", text: "There's a resin line behind that wall that's been loading up. Nobody knew.", mood: "sharp" },
      { speaker: "Priya", text: "Contractors were going to stage scaffolding there tomorrow. Six of them, most of a shift.", mood: "even" },
      { speaker: "Priya", text: "I've waved off a reading like that before, because the map said it couldn't be. You didn't.", mood: "soft" },
      {
        speaker: "Priya",
        text: "They'll never know your name. So I wanted you to hear it from someone. Thank you.",
        mood: "warm",
        choices: [
          { id: "mom-dose-said-a", label: "My dosimeter didn't match the map. I nearly decided it was broken.", reply: "Almost everyone does. The instrument was right and the drawing was wrong. Trust the thing in your pocket.", trust: 3 },
          { id: "mom-dose-said-b", label: "I'm glad they won't be standing there.", reply: "So am I. I'm moving the scaffold today. Come see the new survey if you like. You earned the look.", trust: 3 },
        ],
      },
    ],
  },
  {
    id: "log-unedited",
    npc: "holt",
    title: "Read twice",
    known: "Holt read your log twice, and told you about the log he once rewrote.",
    day: 5,
    when: (s) => s.residue.log === "caught",
    lines: [
      { speaker: "Holt", text: "I read your log last night. Twice.", mood: "even" },
      { speaker: "Holt", text: "There's a correction on yesterday's entry. A line through it, your initials, the right number beside it.", mood: "even" },
      { speaker: "Holt", text: "Most logs I read are perfect. They're perfect because somebody fixed them afterwards.", mood: "sharp" },
      { speaker: "Holt", text: "Early on, I tidied a log so a shift would look cleaner to my supervisor.", mood: "soft" },
      { speaker: "Holt", text: "It cost us three days in an investigation, because the record didn't match what happened.", mood: "even" },
      {
        speaker: "Holt",
        text: "So, thank you for leaving it honest. It makes my job possible.",
        mood: "warm",
        choices: [
          { id: "mom-log-unedited-a", label: "I nearly rewrote it. The correction looked bad.", reply: "It looks like the truth. That's all a log has to look like. Leave the corrections in. I'll back you every time.", trust: 3 },
          { id: "mom-log-unedited-b", label: "I thought you'd be annoyed about the mistake.", reply: "The mistake was a number. The correction is the part I trust. If anyone gives you grief for one, send them to me.", trust: 3 },
        ],
      },
    ],
  },
  {
    id: "marcus-check",
    npc: "marcus",
    title: "Check my sheet",
    known: "Marcus asked you to check his boron sheet before startup. You caught it.",
    day: 3,
    when: (s) => s.catches >= 4,
    lines: [
      { speaker: "Marcus", text: "Can I ask you something slightly embarrassing?", mood: "tired" },
      { speaker: "Marcus", text: "I'm signing the boron sheet for tonight's power ascension. I've checked it three times.", mood: "even" },
      { speaker: "Marcus", text: "When I've checked something three times, that's usually when I've stopped seeing it.", mood: "soft" },
      {
        speaker: "Marcus",
        text: "You've caught four things this week other people walked past. Would you look before I sign?",
        mood: "soft",
        choices: [
          { id: "mom-marcus-check-a", label: "The worth on line three is last week's. Pull the new one.", reply: "...It is. That would have had us diluting on an old number. Thank you. Genuinely. I owe you a coffee, and the next check you ask for.", trust: 3, flag: "marcusChecked" },
          { id: "mom-marcus-check-b", label: "It looks fine to me. You know it better than I do.", reply: "Maybe. I'll go through it once more on my own. Thanks for listening, anyway. It helps to say it out loud.", trust: 1 },
        ],
      },
    ],
  },
  {
    id: "jordan-distance",
    npc: "jordan",
    title: "To your face",
    known: "Jordan told you to your face that he won't sign a short log again.",
    day: 3,
    when: (s) => s.hides >= 2,
    lines: [
      { speaker: "Jordan", text: "Hey. This is awkward, so I'm just going to say it.", mood: "even" },
      { speaker: "Jordan", text: "Some things this week didn't get written down. I don't know all of it, and I'm not asking.", mood: "even" },
      { speaker: "Jordan", text: "But my name's on the log for those hours. I've been the name on a log like that before. Never again.", mood: "sharp" },
      { speaker: "Jordan", text: "So either we write it right, together, or I need my name off it.", mood: "even" },
      {
        speaker: "Jordan",
        text: "I'm sorry. I like working with you. That's why I'm saying it to your face.",
        mood: "soft",
        choices: [
          { id: "mom-jordan-distance-a", label: "You're right. I left things out. Let's write it properly. I'll sign next to you.", reply: "Thank you. I know that wasn't easy. Honestly, it makes me trust you more, not less.", trust: 3, culture: 1, flag: "momentOwned" },
          { id: "mom-jordan-distance-b", label: "Fine. I'll take your name off.", reply: "Okay. Thanks for not making it harder. If you ever want to fix it, I'll still sign.", trust: -1 },
        ],
      },
    ],
  },
  {
    id: "mabel-maint",
    npc: "mabel",
    title: "Tommy smiling",
    known: "Mabel thanked you for Tommy, because Tommy won't say it.",
    day: 3,
    when: (s) => s.maintDone,
    lines: [
      { speaker: "Mabel", text: "Sit a second. Tommy came in for his coffee smiling. Tommy does not smile before ten.", mood: "wry" },
      { speaker: "Mabel", text: "He said the pump job closed out with the try done and signed. First one in months he didn't have to chase.", mood: "warm" },
      { speaker: "Mabel", text: "Forty years on that floor taught me the plant isn't kept safe by the big decisions.", mood: "even" },
      { speaker: "Mabel", text: "It's kept safe by somebody finishing the dull last line, so the next person doesn't have to wonder.", mood: "even" },
      {
        speaker: "Mabel",
        text: "So, thank you. From me and from him. He won't say it, so I'm saying it for him.",
        mood: "warm",
        choices: [
          { id: "mom-mabel-maint-a", label: "He did the real work. I just made sure it was closed.", reply: "Both halves. That's why he smiled. This one's on the house.", trust: 2 },
          { id: "mom-mabel-maint-b", label: "It was only paperwork.", reply: "Paperwork is the plant remembering. Don't let anyone tell you it's only. Now drink your coffee.", trust: 1 },
        ],
      },
    ],
  },
  {
    id: "elena-nights",
    npc: "elena",
    title: "I asked for you",
    known: "Elena asked for you on nights, and told you about her twenty minutes.",
    day: 4,
    when: (s) => s.hides === 0 && s.catches >= 3,
    lines: [
      { speaker: "Elena", text: "Walk with me. They've put you on nights next rotation.", mood: "even" },
      { speaker: "Elena", text: "Watch desk. Eight cameras. A coffee pot that mostly works.", mood: "wry" },
      { speaker: "Elena", text: "I asked for you. Nights are quiet, and quiet is when something sits on a camera for an hour.", mood: "even" },
      { speaker: "Elena", text: "My first nights, a pump stopped at three in the morning. The board told me twenty minutes after the camera did.", mood: "soft" },
      { speaker: "Elena", text: "I've never forgotten those twenty minutes. I need someone who looks.", mood: "soft" },
      {
        speaker: "Elena",
        text: "I take your turnover at six. Bring me an honest log, even if it's an ugly one.",
        mood: "warm",
        choices: [
          { id: "mom-elena-nights-a", label: "Thank you for asking for me. I won't make you regret it.", reply: "You'll make mistakes. Everyone does. Tell me about them at six and we'll be fine.", trust: 2 },
          { id: "mom-elena-nights-b", label: "What should I watch first?", reply: "Whatever you've looked at least. And the things that don't make a sound. Those are the ones that matter.", trust: 2 },
        ],
      },
    ],
  },
  {
    id: "jordan-rounds",
    npc: "jordan",
    title: "Wave at the camera",
    known: "Jordan walks the night rounds. Watch for his torch, and call him if he walks past something.",
    day: 5,
    when: () => true,
    lines: [
      { speaker: "Jordan", text: "Heard you're coming to nights. I'm the one who walks the rounds.", mood: "even" },
      { speaker: "Jordan", text: "Turbine deck, aux building, the pool, out to the yard and back.", mood: "even" },
      { speaker: "Jordan", text: "You'll see a torch moving on the cameras. That's me. Please don't report me. The paperwork is a nightmare.", mood: "wry" },
      { speaker: "Jordan", text: "Seriously, though. If something's wrong where I've just walked, call me. I'd much rather turn around.", mood: "even" },
      {
        speaker: "Jordan",
        text: "It's lonely out there at four in the morning. It helps knowing somebody's watching.",
        mood: "soft",
        choices: [
          { id: "mom-jordan-rounds-a", label: "I'll be watching. Keep your radio on.", reply: "Always. Battery's the one thing I check twice. See you on the cameras.", trust: 2 },
          { id: "mom-jordan-rounds-b", label: "I'll wave, even if you can't see me.", reply: "Then I'll wave at the camera dome every time I pass it. Deal.", trust: 2 },
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
