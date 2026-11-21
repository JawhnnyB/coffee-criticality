/**
 * Written by Claude, approved by the owner on 20 November 2026 (docs/decisions-pending.md, "Crew scenes").
 * One scene per person per tier. Each ends with a choice; sim's pickChoice applies its trust, culture and flag.
 * Voice: the existing cast's, short and concrete. No real names, places or dose numbers.
 */
import type { Line, NpcId } from "./content";

export interface Scene {
  tier: 1 | 2 | 3;
  title: string;
  /** One line for the crew page once heard. */
  known: string;
  lines: Line[];
  /** Flags that must be set before this scene can play. */
  needs?: string[];
  needsHint?: string;
}

export const SCENES: Record<NpcId, Scene[]> = {
  mabel: [
    {
      tier: 1,
      title: "The kettle",
      known: "The kettle came out of the old control room. She never let it go cold.",
      lines: [
        { speaker: "Mabel", text: "This kettle sat behind the old board for eleven years. Night shift kept it hot so nobody left the desk to wait for water.", mood: "warm" },
        {
          speaker: "Mabel",
          text: "How do you take it?",
          mood: "soft",
          choices: [
            { id: "soc-mabel-1a", label: "Black. Like the log should read.", reply: "Good answer. Sit.", trust: 3 },
            { id: "soc-mabel-1b", label: "However you make it.", reply: "Then you'll get it strong.", trust: 2 },
            { id: "soc-mabel-1c", label: "No time today.", reply: "Make time to be wrong slowly. It's cheaper than fast.", trust: 0 },
          ],
        },
      ],
    },
    {
      tier: 2,
      title: "The one she didn't chalk",
      known: "Her first year, she let a reading pass. Nobody was hurt. She still counts it.",
      lines: [
        { speaker: "Mabel", text: "Every mark on the north wall is a catch somebody said out loud.", mood: "even" },
        { speaker: "Mabel", text: "There's one that isn't up there. My first year. A level read high and I decided the gauge was wrong. It wasn't.", mood: "soft" },
        {
          speaker: "Mabel",
          text: "Nobody got hurt. That's the trouble with it.",
          mood: "soft",
          choices: [
            { id: "soc-mabel-2a", label: "Did you ever say it out loud?", reply: "Just now. To you. Took long enough.", trust: 4, flag: "mabelHeard" },
            { id: "soc-mabel-2b", label: "Nobody got hurt.", reply: "That's what I told myself for thirty years. It didn't make the wall any longer.", trust: 1 },
          ],
        },
      ],
    },
    {
      tier: 3,
      title: "The chalk",
      known: "She handed you the chalk. The wall is yours to keep honest.",
      lines: [
        { speaker: "Mabel", text: "My hands shake on the high marks now.", mood: "warm" },
        { speaker: "Mabel", text: "And the lot greens are slow because I made them slow. You can have the fast ones.", mood: "wry" },
        {
          speaker: "Mabel",
          text: "Here. Chalk.",
          mood: "warm",
          choices: [
            { id: "soc-mabel-3a", label: "I'll chalk what's said, not what's pretty.", reply: "Then the wall stays worth reading.", trust: 3, culture: 1, flag: "mabelChalk" },
            { id: "soc-mabel-3b", label: "Keep it. It's your wall.", reply: "It was never mine. That was the point of it.", trust: 2, flag: "mabelChalk" },
          ],
        },
      ],
    },
  ],
  holt: [
    {
      tier: 1,
      title: "Volume",
      known: "Bring him numbers, not adjectives.",
      lines: [
        { speaker: "Holt", text: "People bring me adjectives. 'Concerning.' 'Robust.' I can't fund an adjective.", mood: "even" },
        {
          speaker: "Holt",
          text: "Bring me volume.",
          mood: "even",
          choices: [
            { id: "soc-holt-1a", label: "I'll bring the log, unedited.", reply: "Unedited is the only kind I read twice.", trust: 3 },
            { id: "soc-holt-1b", label: "How many catches is enough?", reply: "Enough that nobody remembers the first one.", trust: 2 },
          ],
        },
      ],
    },
    {
      tier: 2,
      title: "The review line",
      known: "The review budget is the first line he defends. The director before him cut it once.",
      lines: [
        { speaker: "Holt", text: "The review budget is the first line I defend every year. The man in this chair before me cut it.", mood: "even" },
        { speaker: "Holt", text: "A pump ran with a tag on it. Nobody was hurt. The paperwork after cost more than five years of reviews.", mood: "sharp" },
        {
          speaker: "Holt",
          text: "I'm telling you because you'll sit in this chair, or next to it.",
          mood: "even",
          choices: [
            { id: "soc-holt-2a", label: "Then I'll keep the line funded.", reply: "Keep it used. Funded is easy.", trust: 3 },
            { id: "soc-holt-2b", label: "Why tell me now?", reply: "Because you've been bringing volume.", trust: 3 },
          ],
        },
      ],
    },
    {
      tier: 3,
      title: "Last vote",
      known: "He put you on the review board. The junior vote goes last, so it isn't an echo.",
      lines: [
        { speaker: "Holt", text: "You're on Thursday's review board.", mood: "even" },
        { speaker: "Holt", text: "You vote last. The junior vote goes last so it can't be an echo of mine.", mood: "even" },
        {
          speaker: "Holt",
          text: "Questions.",
          mood: "even",
          choices: [
            { id: "soc-holt-3a", label: "I'll vote what I saw.", reply: "That's the only vote I need.", trust: 3, culture: 1, flag: "holtBoard" },
            { id: "soc-holt-3b", label: "What if I disagree with you?", reply: "Then say it in the room. That's what last is for.", trust: 3, flag: "holtBoard" },
          ],
        },
      ],
    },
  ],
  elena: [
    {
      tier: 1,
      title: "Two sets of eyes",
      known: "A peer check is both of you checking the plant, not her checking you.",
      lines: [
        { speaker: "Elena", text: "A peer check isn't me checking you. It's two people checking the plant.", mood: "even" },
        {
          speaker: "Elena",
          text: "Some people hear it as an insult.",
          mood: "even",
          choices: [
            { id: "soc-elena-1a", label: "Then check me.", reply: "Good. Valve lineup at ten.", trust: 3 },
            { id: "soc-elena-1b", label: "I don't need it.", reply: "Nobody needs it until the one day they do.", trust: 0 },
          ],
        },
      ],
    },
    {
      tier: 2,
      title: "The van",
      known: "She reads the night log in her van before relieving. Handover is where things slip.",
      lines: [
        { speaker: "Elena", text: "You asked about the van. I'm in early because handover is where things slip.", mood: "soft" },
        { speaker: "Elena", text: "I read the night log in there with a flashlight before I relieve anyone. Then I walk it.", mood: "even" },
        {
          speaker: "Elena",
          text: "Nobody else has asked.",
          mood: "soft",
          choices: [
            { id: "soc-elena-2a", label: "Can I read it with you?", reply: "Bring your own coffee. Mine's for me.", trust: 4, flag: "elenaVan" },
            { id: "soc-elena-2b", label: "That's a lot of hours.", reply: "It's fewer than the hours after a bad handover.", trust: 2 },
          ],
        },
      ],
    },
    {
      tier: 3,
      title: "Second eyes",
      known: "She asked you to check her lineup. You caught a transposed valve number before she did.",
      lines: [
        { speaker: "Elena", text: "I want you on my lineup this morning.", mood: "even" },
        { speaker: "Elena", text: "I transposed two valve numbers on the card. You saw it before I did.", mood: "soft" },
        {
          speaker: "Elena",
          text: "Say it back so I hear it.",
          mood: "even",
          choices: [
            { id: "soc-elena-3a", label: "Fourteen and forty-one were swapped.", reply: "Fourteen and forty-one. Fixed. That's why there are two of us.", trust: 3, culture: 1 },
            { id: "soc-elena-3b", label: "You'd have caught it.", reply: "Maybe. You did. That's the point.", trust: 3 },
          ],
        },
      ],
    },
  ],
  tommy: [
    {
      tier: 1,
      title: "His lock",
      known: "His lock, his key, his body. Nobody else removes it.",
      lines: [
        { speaker: "Tommy", text: "See this lock? Only my key fits it. Nobody cuts it, nobody borrows it.", mood: "even" },
        {
          speaker: "Tommy",
          text: "My lock, my key, my body. That's the whole sentence.",
          mood: "even",
          choices: [
            { id: "soc-tommy-1a", label: "Isolate. Lock. Tag. Try.", reply: "You were listening. Most people stop at tag.", trust: 3 },
            { id: "soc-tommy-1b", label: "Seems slow.", reply: "Slow is the speed of people going home.", trust: 1 },
          ],
        },
      ],
    },
    {
      tier: 2,
      title: "The try",
      known: "The try step once found a pump fed from a second breaker. The tag was right. The drawing wasn't.",
      lines: [
        { speaker: "Tommy", text: "Everybody skips the try. Lock's on, tag's on, why push the button?", mood: "wry" },
        { speaker: "Tommy", text: "Because once I pushed it and the pump turned over. Second breaker. Not on the drawing.", mood: "sharp" },
        {
          speaker: "Tommy",
          text: "The tag was right. The drawing wasn't.",
          mood: "even",
          choices: [
            { id: "soc-tommy-2a", label: "Show me on the pump.", reply: "Gloves. We do it right or we don't do it.", trust: 4, flag: "tommyTry" },
            { id: "soc-tommy-2b", label: "Did you report the drawing?", reply: "Same day. It's fixed now. That's the other half of the catch.", trust: 3 },
          ],
        },
      ],
    },
    {
      tier: 3,
      title: "Your own lock",
      known: "He gave you a lock of your own, tag blank. Your name, your key.",
      lines: [
        { speaker: "Tommy", text: "Here. New lock. The tag's blank.", mood: "warm" },
        {
          speaker: "Tommy",
          text: "Write your name. Nobody else's key fits.",
          mood: "even",
          choices: [
            { id: "soc-tommy-3a", label: "I'll write it now.", reply: "Good. Now it means something when it's on a breaker.", trust: 3, flag: "tommyLock" },
            { id: "soc-tommy-3b", label: "What if I lose the key?", reply: "Then we cut it with a witness and a form. It's supposed to hurt.", trust: 3, flag: "tommyLock" },
          ],
        },
      ],
    },
  ],
  marcus: [
    {
      tier: 1,
      title: "The ugly number",
      known: "He wants the ugly number first. Pretty ones keep.",
      lines: [
        { speaker: "Marcus", text: "Bring me the ugly number first. The pretty ones keep.", mood: "sharp" },
        {
          speaker: "Marcus",
          text: "Most people lead with the pretty one.",
          mood: "sharp",
          choices: [
            { id: "soc-marcus-1a", label: "Even if the ugly one is yours?", reply: "Especially. Mine are the ones I miss.", trust: 3 },
            { id: "soc-marcus-1b", label: "Noted.", reply: "Don't note it. Do it.", trust: 1 },
          ],
        },
      ],
    },
    {
      tier: 2,
      title: "Wrong, privately",
      known: "He told you, privately, that he had a calculation wrong this week.",
      lines: [
        { speaker: "Marcus", text: "Monday's heat balance. I had the flow wrong. Not by much.", mood: "soft" },
        { speaker: "Marcus", text: "I've told you. I haven't told the floor.", mood: "even" },
        {
          speaker: "Marcus",
          text: "Go on. Say what you're thinking.",
          mood: "sharp",
          choices: [
            { id: "soc-marcus-2a", label: "Tell the floor.", reply: "...Tomorrow. At the board. Before I talk myself out of it.", trust: 3, flag: "marcusSay" },
            { id: "soc-marcus-2b", label: "It can stay between us.", reply: "That's the problem with between us. It stays.", trust: 1 },
          ],
        },
      ],
    },
    {
      tier: 3,
      title: "Wrong, in public",
      known: "He told the board. It cost him nothing he needed.",
      needs: ["marcusSay"],
      needsHint: "Marcus has something he hasn't told the floor. Ask him to.",
      lines: [
        { speaker: "Marcus", text: "I told the board. The flow, the whole number.", mood: "even" },
        { speaker: "Marcus", text: "Holt wrote it down and moved on. It cost me nothing I needed.", mood: "wry" },
        {
          speaker: "Marcus",
          text: "I'd been paying for nothing for years.",
          mood: "soft",
          choices: [
            { id: "soc-marcus-3a", label: "That's a catch. It goes on the wall.", reply: "Then chalk it under my name. Big.", trust: 3, culture: 1 },
            { id: "soc-marcus-3b", label: "Next time, lead with it.", reply: "Next time I will. Hold me to it.", trust: 3 },
          ],
        },
      ],
    },
  ],
  priya: [
    {
      tier: 1,
      title: "Feet first",
      known: "Numbers from her desk are a rumor until you both stand next to the hardware.",
      lines: [
        { speaker: "Priya", text: "Everything on my screen is a rumor until we stand next to the hardware.", mood: "even" },
        {
          speaker: "Priya",
          text: "So we walk.",
          mood: "even",
          choices: [
            { id: "soc-priya-1a", label: "Then walk me through it.", reply: "Hall at two. Wear the boots, not the shoes.", trust: 3 },
            { id: "soc-priya-1b", label: "Can't the screen be right?", reply: "Often. You find out which times by walking.", trust: 2 },
          ],
        },
      ],
    },
    {
      tier: 2,
      title: "The reload",
      known: "She handed you the reload: load Cycle 2 in the simulator, then tell her what it can't see.",
      lines: [
        { speaker: "Priya", text: "The outage is coming. Sixty-four fresh assemblies, a hundred and twenty-nine burned ones to move.", mood: "even" },
        { speaker: "Priya", text: "The plant's real pattern is in the drawer. Load your own on the desk. Beat it if you can.", mood: "wry" },
        {
          speaker: "Priya",
          text: "Then tell me what the simulator can't see.",
          mood: "even",
          choices: [
            { id: "soc-priya-2a", label: "What can't it see?", reply: "Pins. Height. Heat feedback. It's one group and flat. It still teaches the shape.", trust: 3, flag: "outageOpen" },
            { id: "soc-priya-2b", label: "I'll start tonight.", reply: "Start tomorrow. Tired people load the peak in the middle.", trust: 3, flag: "outageOpen" },
          ],
        },
      ],
    },
    {
      tier: 3,
      title: "Two decimals",
      known: "She ran your loading on her own desk. Same answer, two decimals apart.",
      needs: ["outage:c2:done"],
      needsHint: "Priya is waiting on your Cycle 2 loading. Run it on the desk.",
      lines: [
        { speaker: "Priya", text: "I ran your Cycle 2 loading on my desk.", mood: "even" },
        { speaker: "Priya", text: "Same answer, two decimals apart. I'll take two decimals.", mood: "warm" },
        {
          speaker: "Priya",
          text: "What did it teach you?",
          mood: "even",
          choices: [
            { id: "soc-priya-3a", label: "Burned fuel on the rim keeps neutrons home.", reply: "Low leakage. Now say why the peak moves inward.", trust: 3, culture: 1 },
            { id: "soc-priya-3b", label: "Fresh fuel goes where it can't peak.", reply: "Close. Fresh fuel goes where it can't peak alone.", trust: 3 },
          ],
        },
      ],
    },
  ],
  jordan: [
    {
      tier: 1,
      title: "Where the door can hear",
      known: "Say a catch where the door can hear it, and it's everybody's.",
      lines: [
        { speaker: "Jordan", text: "Say a catch where the door can hear it. Then it's everybody's.", mood: "even" },
        {
          speaker: "Jordan",
          text: "Said in a corner, it's just yours.",
          mood: "wry",
          choices: [
            { id: "soc-jordan-1a", label: "Whose catch was it, then?", reply: "Yours. Now ours. That's the trade.", trust: 3 },
            { id: "soc-jordan-1b", label: "Credit doesn't matter.", reply: "It matters to whoever's counting hides.", trust: 1 },
          ],
        },
      ],
    },
    {
      tier: 2,
      title: "Distance",
      known: "At another site, a reading was hidden and Jordan's name was on the log. That's why the distance.",
      lines: [
        { speaker: "Jordan", text: "Other site. Somebody hid a reading. My name was on the log for that hour.", mood: "sharp" },
        { speaker: "Jordan", text: "I didn't know. Nobody believed I didn't know. That's the distance.", mood: "soft" },
        {
          speaker: "Jordan",
          text: "So I watch who says things out loud.",
          mood: "even",
          choices: [
            { id: "soc-jordan-2a", label: "Your name stays clean here.", reply: "Then put yours next to it.", trust: 4, flag: "jordanTrust" },
            { id: "soc-jordan-2b", label: "That wasn't fair.", reply: "No. It was normal. That's worse.", trust: 2 },
          ],
        },
      ],
    },
    {
      tier: 3,
      title: "Lane two",
      known: "Jordan oiled lane two for you. After-shift, hard lane.",
      lines: [
        { speaker: "Jordan", text: "I oiled lane two. It drifts. Read it or lose.", mood: "wry" },
        {
          speaker: "Jordan",
          text: "After shift.",
          mood: "warm",
          choices: [
            { id: "soc-jordan-3a", label: "I'll be there.", reply: "Bring your own shoes. And your own catches.", trust: 3 },
            { id: "soc-jordan-3b", label: "Easy lane first?", reply: "You've had easy. You're past easy.", trust: 2 },
          ],
        },
      ],
    },
  ],
};
