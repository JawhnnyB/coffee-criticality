/**
 * Structure approved by the owner on 20 November 2026 (docs/decisions-pending.md, "Crew scenes").
 * Text rewritten by Claude on 24 November 2026 as real conversations, waiting for the owner's approval:
 * each person in their own voice (docs/characters.md), with what was at stake, what they got wrong, and a
 * specific thank-you. One scene per person per tier. Each ends with a choice; sim's pickChoice applies its
 * trust, culture and flag, which are unchanged. No real names, places or dose numbers.
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
      known: "The kettle came out of the old control room. She carried it out herself, and she's glad you sit.",
      lines: [
        { speaker: "Mabel", text: "This kettle sat behind the old control board for eleven years. I carried it out myself the day they gutted the room.", mood: "warm" },
        { speaker: "Mabel", text: "Night shift kept it hot so nobody left the desk to boil water. Funny, the things you notice standing still.", mood: "soft" },
        { speaker: "Mabel", text: "I'm glad you're here, you know. The new ones don't usually sit.", mood: "warm" },
        {
          speaker: "Mabel",
          text: "How do you take it?",
          mood: "soft",
          choices: [
            { id: "soc-mabel-1a", label: "Black.", reply: "Like your logs, I hope. Sit.", trust: 3 },
            { id: "soc-mabel-1b", label: "However you make yours.", reply: "Then you're getting it strong. I still make it like I'm on nights.", trust: 2 },
            { id: "soc-mabel-1c", label: "I can't stay long today.", reply: "That's all right. But make time to be wrong slowly now and then. Fast mistakes cost more.", trust: 0 },
          ],
        },
      ],
    },
    {
      tier: 2,
      title: "The one she didn't chalk",
      known: "Her first year, a level read high and she blamed the gauge. A relief valve had stuck. She started the wall because of it.",
      lines: [
        { speaker: "Mabel", text: "Every mark on that wall is a catch somebody said out loud. I've counted them more than once.", mood: "even" },
        { speaker: "Mabel", text: "There's one that isn't up there. Mine. My first year, a tank level read high, and I decided the gauge was wrong.", mood: "soft" },
        { speaker: "Mabel", text: "It wasn't. A relief valve had stuck. Another hour and it would have lifted into the room. Nobody was hurt.", mood: "soft" },
        { speaker: "Mabel", text: "I never told anyone. I was twenty-three and terrified of looking stupid. That's why I started the wall.", mood: "even" },
        {
          speaker: "Mabel",
          text: "Nobody got hurt. That's the trouble with it, isn't it?",
          mood: "soft",
          choices: [
            { id: "soc-mabel-2a", label: "Have you ever said it out loud before?", reply: "Just now. To you. Forty-odd years late. Thank you for asking. I didn't know I needed someone to.", trust: 4, flag: "mabelHeard" },
            { id: "soc-mabel-2b", label: "But nobody got hurt.", reply: "That's what I told myself for years. It doesn't make the wall honest. Saying it does.", trust: 1 },
          ],
        },
      ],
    },
    {
      tier: 3,
      title: "The chalk",
      known: "She handed you the chalk. The wall is yours to keep honest, ugly marks included.",
      lines: [
        { speaker: "Mabel", text: "My hands shake on the high marks now. I nearly fell off the step stool last week. Tommy gave me a look.", mood: "wry" },
        { speaker: "Mabel", text: "And that putting green out in the lot? I made it slow on purpose. You can have the fast greens now.", mood: "wry" },
        { speaker: "Mabel", text: "I've been waiting for someone to give the chalk to. Someone who'll put up the ugly marks, not just the pretty ones.", mood: "even" },
        {
          speaker: "Mabel",
          text: "I think it's you. That isn't a compliment, love. It's a job.",
          mood: "warm",
          choices: [
            { id: "soc-mabel-3a", label: "I'll chalk what's said, not what's pretty.", reply: "Then the wall stays worth reading. Thank you. Truly. I can stop worrying about it now.", trust: 3, culture: 1, flag: "mabelChalk" },
            { id: "soc-mabel-3b", label: "It's your wall. Keep it.", reply: "It was never mine. That was the whole point of it. Go on, take it.", trust: 2, flag: "mabelChalk" },
          ],
        },
      ],
    },
  ],
  holt: [
    {
      tier: 1,
      title: "Volume",
      known: "Bring him a time, a place and what you saw. He knows he's hard to bring bad news to.",
      lines: [
        { speaker: "Holt", text: "People bring me adjectives. 'Concerning.' 'Robust.' 'A bit off.' I can't do anything with an adjective.", mood: "even" },
        { speaker: "Holt", text: "Give me a time, a place, and what you saw. That I can act on. That I can fund.", mood: "even" },
        { speaker: "Holt", text: "I know I'm hard to bring bad news to. I've been told. I'm trying to be easier.", mood: "soft" },
        {
          speaker: "Holt",
          text: "Will you help me with that?",
          mood: "even",
          choices: [
            { id: "soc-holt-1a", label: "I'll bring you the log, unedited.", reply: "Unedited is the only kind I read twice. Thank you.", trust: 3 },
            { id: "soc-holt-1b", label: "How many catches is enough?", reply: "Enough that nobody remembers the first one. That's when it's just how we work.", trust: 2 },
          ],
        },
      ],
    },
    {
      tier: 2,
      title: "The review line",
      known: "He signed the review-budget cut as deputy. Six months later a pump ran with a tag on it. He defends that line first now.",
      lines: [
        { speaker: "Holt", text: "Every year, the review budget is the first line I defend. Do you know why?", mood: "even" },
        { speaker: "Holt", text: "The director before me cut it. Saved a little money. Six months later, a pump ran with a tag still on it.", mood: "sharp" },
        { speaker: "Holt", text: "Nobody was hurt. The mechanic had stepped away for a radio. Thirty seconds, either way.", mood: "even" },
        { speaker: "Holt", text: "I was his deputy. I signed the cut with him. I've been paying it back ever since.", mood: "soft" },
        {
          speaker: "Holt",
          text: "I'm telling you because one day you'll sit in a chair like this one.",
          mood: "even",
          choices: [
            { id: "soc-holt-2a", label: "Then I'll keep the line funded.", reply: "Keep it used. Funded is easy. Used is the hard part.", trust: 3 },
            { id: "soc-holt-2b", label: "Why are you telling me?", reply: "Because you've brought me times and places all week. And because somebody should have told me.", trust: 3 },
          ],
        },
      ],
    },
    {
      tier: 3,
      title: "Last vote",
      known: "He put you on the review board. The junior vote goes last, so it can't echo his.",
      lines: [
        { speaker: "Holt", text: "I've put you on Thursday's review board. You can say no.", mood: "even" },
        { speaker: "Holt", text: "You'll vote last. The most junior vote always goes last here, so it can't be an echo of mine.", mood: "even" },
        { speaker: "Holt", text: "My first board, I voted with my boss because I wanted his job. I got the job. I still think about that vote.", mood: "soft" },
        {
          speaker: "Holt",
          text: "Questions?",
          mood: "even",
          choices: [
            { id: "soc-holt-3a", label: "I'll vote what I saw.", reply: "That's the only vote I need from you. Thank you for taking it on.", trust: 3, culture: 1, flag: "holtBoard" },
            { id: "soc-holt-3b", label: "What if I disagree with you?", reply: "Then say it in the room, out loud. That's exactly what going last is for. I'll thank you for it.", trust: 3, flag: "holtBoard" },
          ],
        },
      ],
    },
  ],
  elena: [
    {
      tier: 1,
      title: "Two sets of eyes",
      known: "A peer check is two people checking the plant, not her checking you. She wants hers checked too.",
      lines: [
        { speaker: "Elena", text: "Can I tell you something about peer checks? People hear 'check' and think I don't trust them.", mood: "even" },
        { speaker: "Elena", text: "It isn't me checking you. It's two people checking the plant. I want someone checking mine, too.", mood: "even" },
        { speaker: "Elena", text: "Nine years a supervisor, and I still get things wrong. That's the point of a second pair.", mood: "soft" },
        {
          speaker: "Elena",
          text: "Some people take it as an insult.",
          mood: "even",
          choices: [
            { id: "soc-elena-1a", label: "Then check me. I'd rather know.", reply: "Thank you. Valve lineup at ten, then. You can check mine after.", trust: 3 },
            { id: "soc-elena-1b", label: "I don't really need it.", reply: "Nobody needs it until the one day they do. I hope you never find out which day that is.", trust: 0 },
          ],
        },
      ],
    },
    {
      tier: 2,
      title: "The van",
      known: "She reads the night log in her van with a flashlight before relieving anyone. Handover is where things slip.",
      lines: [
        { speaker: "Elena", text: "You asked about the van. I'm in early because handover is where things slip. Tired people, quick words.", mood: "soft" },
        { speaker: "Elena", text: "I read the night log in there with a flashlight before I relieve anyone. Then I walk what it says.", mood: "even" },
        { speaker: "Elena", text: "My daughter thinks I'm napping. Some mornings, honestly, I nearly am.", mood: "wry" },
        {
          speaker: "Elena",
          text: "Nobody's ever asked me about it before.",
          mood: "soft",
          choices: [
            { id: "soc-elena-2a", label: "Can I read it with you sometime?", reply: "I'd like that. Bring your own coffee, mine's spoken for. And thank you. For asking.", trust: 4, flag: "elenaVan" },
            { id: "soc-elena-2b", label: "That's a lot of extra hours.", reply: "It's fewer than the hours after a bad handover. I've done those too.", trust: 2 },
          ],
        },
      ],
    },
    {
      tier: 3,
      title: "Second eyes",
      known: "You checked her lineup and caught two valve numbers she'd transposed. A drain to the sump, on her shift.",
      lines: [
        { speaker: "Elena", text: "You stopped. On my lineup card. What did you see?", mood: "even" },
        { speaker: "Elena", text: "...I transposed two valve numbers. If we'd lined up off this card, we'd have opened the wrong one.", mood: "soft" },
        { speaker: "Elena", text: "That's a drain to the sump. A lot of water, very fast, on my shift. Thank you. I mean it.", mood: "warm" },
        {
          speaker: "Elena",
          text: "Say it back to me, so I hear it right.",
          mood: "even",
          choices: [
            { id: "soc-elena-3a", label: "Fourteen and forty-one were swapped.", reply: "Fourteen and forty-one. Fixed, and initialed. This is why there are two of us.", trust: 3, culture: 1 },
            { id: "soc-elena-3b", label: "You'd have caught it yourself.", reply: "Maybe. But you did. Don't give that away. Take the thanks.", trust: 3 },
          ],
        },
      ],
    },
  ],
  tommy: [
    {
      tier: 1,
      title: "His lock",
      known: "His lock, his key, his body. His kid's plastic wrench hangs on the keychain.",
      lines: [
        { speaker: "Tommy", text: "See this lock? Only my key fits it. Nobody cuts it, nobody borrows it, nobody 'just moves it a second'.", mood: "even" },
        { speaker: "Tommy", text: "My lock, my key, my body. If it's on, my hands could be inside that machine. That's what it means.", mood: "even" },
        { speaker: "Tommy", text: "My kid gave me this keychain. Little plastic wrench. I look at it every time I hang a lock.", mood: "soft" },
        {
          speaker: "Tommy",
          text: "Go on, then. The four words.",
          mood: "even",
          choices: [
            { id: "soc-tommy-1a", label: "Isolate. Lock. Tag. Try.", reply: "You were listening. Most people stop at tag. Thanks for not being most people.", trust: 3 },
            { id: "soc-tommy-1b", label: "Seems slow.", reply: "Slow is the speed of people going home. I'll take slow every day of my life.", trust: 1 },
          ],
        },
      ],
    },
    {
      tier: 2,
      title: "The try",
      known: "He pushed the try and the pump turned over: a second breaker, not on the drawing. His apprentice's hand was on the coupling.",
      lines: [
        { speaker: "Tommy", text: "Everybody skips the try. Lock's on, tag's on, why push the button? Feels stupid, right?", mood: "wry" },
        { speaker: "Tommy", text: "Ten years back, I pushed it, and the pump turned over. Second breaker, another bus. Not on the drawing.", mood: "sharp" },
        { speaker: "Tommy", text: "My apprentice had his hand on the coupling. He's got a daughter now. I think about that button a lot.", mood: "soft" },
        {
          speaker: "Tommy",
          text: "The tag was right. The drawing wasn't.",
          mood: "even",
          choices: [
            { id: "soc-tommy-2a", label: "Show me on the pump.", reply: "Gloves on. We do it right or we don't do it. And thanks for wanting to see it.", trust: 4, flag: "tommyTry" },
            { id: "soc-tommy-2b", label: "Did you report the drawing?", reply: "Same day. It's fixed now. That's the other half of a catch, the half nobody claps for.", trust: 3 },
          ],
        },
      ],
    },
    {
      tier: 3,
      title: "Your own lock",
      known: "He gave you a lock of your own, tag blank. You're the second engineer he's given one to.",
      lines: [
        { speaker: "Tommy", text: "Here. New lock. Blank tag. I paid for it, so don't lose it.", mood: "warm" },
        { speaker: "Tommy", text: "Write your name on it. Nobody else's key fits. When it's on a breaker, it means you're inside that machine.", mood: "even" },
        { speaker: "Tommy", text: "I don't give these to engineers. You're the second. The first one, I still have coffee with.", mood: "soft" },
        {
          speaker: "Tommy",
          text: "Go on. Write it.",
          mood: "warm",
          choices: [
            { id: "soc-tommy-3a", label: "I'll write it now.", reply: "Good. Now it means something. Welcome to the shop, for real.", trust: 3, flag: "tommyLock" },
            { id: "soc-tommy-3b", label: "What if I lose the key?", reply: "Then we cut it with a witness and a form, and it's a whole thing. It's supposed to hurt. That's how you don't lose it.", trust: 3, flag: "tommyLock" },
          ],
        },
      ],
    },
  ],
  marcus: [
    {
      tier: 1,
      title: "The ugly number",
      known: "His first year as senior, he put the bad number on slide nine. Holt found it. Now he wants the ugly number first.",
      lines: [
        { speaker: "Marcus", text: "Can I give you advice nobody gave me? Bring me the ugly number first. The pretty ones will keep.", mood: "even" },
        { speaker: "Marcus", text: "My first year as senior, I led a meeting with all the good news. The bad number was on slide nine. Holt found it.", mood: "soft" },
        { speaker: "Marcus", text: "He didn't shout. He just asked why it was on slide nine. I still don't have a good answer.", mood: "tired" },
        {
          speaker: "Marcus",
          text: "Most people lead with the pretty one.",
          mood: "even",
          choices: [
            { id: "soc-marcus-1a", label: "Even if the ugly one is yours?", reply: "Especially then. Mine are the ones I'm best at not seeing.", trust: 3 },
            { id: "soc-marcus-1b", label: "Noted.", reply: "Don't note it. Do it. Sorry, that was sharp. I mean it kindly, I promise.", trust: 1 },
          ],
        },
      ],
    },
    {
      tier: 2,
      title: "Wrong, privately",
      known: "He told you, privately, that Monday's heat balance had the feedwater flow wrong.",
      lines: [
        { speaker: "Marcus", text: "Can I tell you something before I lose my nerve? Monday's heat balance. I had the feedwater flow wrong.", mood: "soft" },
        { speaker: "Marcus", text: "Not by much. A percent and a bit. But all week we've been a hair hotter on paper than in the plant.", mood: "even" },
        { speaker: "Marcus", text: "Nothing broke. But if someone had built the outage plan on my number, it would have been built crooked.", mood: "even" },
        { speaker: "Marcus", text: "I've told you. I haven't told the floor. I keep almost telling them.", mood: "tired" },
        {
          speaker: "Marcus",
          text: "Go on. Say what you're thinking.",
          mood: "sharp",
          choices: [
            { id: "soc-marcus-2a", label: "Tell the floor.", reply: "...Tomorrow. At the board, first thing, before I talk myself out of it. Thank you for not letting me off.", trust: 3, flag: "marcusSay" },
            { id: "soc-marcus-2b", label: "It can stay between us.", reply: "That's kind. But that's the problem with 'between us'. It stays. And then it grows.", trust: 1 },
          ],
        },
      ],
    },
    {
      tier: 3,
      title: "Wrong, in public",
      known: "He told the board about the flow. Holt said thank you and moved on. It cost him nothing he needed.",
      needs: ["marcusSay"],
      needsHint: "Marcus has something he hasn't told the floor. Ask him to.",
      lines: [
        { speaker: "Marcus", text: "I told the board. The flow, the whole number, how long it had been wrong.", mood: "even" },
        { speaker: "Marcus", text: "Holt wrote it down, said thank you, and went on to the next item. That was it. That was the whole thing.", mood: "wry" },
        { speaker: "Marcus", text: "I've been bracing for that moment for six years. It cost me nothing I needed.", mood: "soft" },
        { speaker: "Marcus", text: "So. Thank you. You pushed, and you were right to.", mood: "warm" },
        {
          speaker: "Marcus",
          text: "Say something. I'm getting embarrassed.",
          mood: "wry",
          choices: [
            { id: "soc-marcus-3a", label: "That's a catch. It goes on the wall.", reply: "Then tell Mabel to chalk it under my name. Big letters. I want to see it.", trust: 3, culture: 1 },
            { id: "soc-marcus-3b", label: "Next time, lead with it.", reply: "Next time, I will. Hold me to it. Please, actually do.", trust: 3 },
          ],
        },
      ],
    },
  ],
  priya: [
    {
      tier: 1,
      title: "Feet first",
      known: "Her screen is a rumor until you both stand next to the hardware. Her first walkdown found a valve on the wrong side of a pipe.",
      lines: [
        { speaker: "Priya", text: "Everything on my screen is a rumor until we stand next to the hardware. I really do believe that.", mood: "even" },
        { speaker: "Priya", text: "My first walkdown, the drawing put a valve on the left. It was on the right, behind a pipe, painted over.", mood: "wry" },
        { speaker: "Priya", text: "Little things like that are why I walk. The plant is always a bit different from what we think it is.", mood: "even" },
        {
          speaker: "Priya",
          text: "So. Shall we walk?",
          mood: "warm",
          choices: [
            { id: "soc-priya-1a", label: "Walk me through it.", reply: "Hall at two. Boots, not shoes. I'm so glad you asked.", trust: 3 },
            { id: "soc-priya-1b", label: "Can't the screen be right?", reply: "Often. You find out which times by walking. That's the fun part, honestly.", trust: 2 },
          ],
        },
      ],
    },
    {
      tier: 2,
      title: "The reload",
      known: "She handed you the reload: load Cycle 2 in the simulator, then tell her what it can't see.",
      lines: [
        { speaker: "Priya", text: "The outage is coming. Sixty-four fresh assemblies in, a hundred and twenty-nine burned ones to move.", mood: "even" },
        { speaker: "Priya", text: "The plant's real pattern is in the drawer. Load your own on the desk and try to beat it. I'd love you to beat it.", mood: "wry" },
        { speaker: "Priya", text: "My first reload, I put the fresh fuel together in the middle because it looked tidy. The peak was awful.", mood: "soft" },
        {
          speaker: "Priya",
          text: "Then tell me what the simulator can't see.",
          mood: "even",
          choices: [
            { id: "soc-priya-2a", label: "What can't it see?", reply: "Pins, height, heat feedback. It's one energy group and flat. It still teaches the shape, and the shape is what matters.", trust: 3, flag: "outageOpen" },
            { id: "soc-priya-2b", label: "I'll start tonight.", reply: "Start tomorrow. Tired people load the peak in the middle. Ask me how I know.", trust: 3, flag: "outageOpen" },
          ],
        },
      ],
    },
    {
      tier: 3,
      title: "Two decimals",
      known: "She ran your loading on her own desk. Same answer, two decimals apart. She'd been ready to be kind about it.",
      needs: ["outage:c2:done"],
      needsHint: "Priya is waiting on your Cycle 2 loading. Run it on the desk.",
      lines: [
        { speaker: "Priya", text: "I ran your Cycle 2 loading on my own desk last night. I couldn't help myself.", mood: "warm" },
        { speaker: "Priya", text: "Same answer as yours, two decimals apart. I'll take two decimals any day.", mood: "warm" },
        { speaker: "Priya", text: "Honestly, I expected a problem. I was ready to be kind about it. I didn't need to be.", mood: "wry" },
        {
          speaker: "Priya",
          text: "So, what did it teach you?",
          mood: "even",
          choices: [
            { id: "soc-priya-3a", label: "Burned fuel on the rim keeps neutrons home.", reply: "Low leakage, exactly. Now tell me why the peak moves inward.", trust: 3, culture: 1 },
            { id: "soc-priya-3b", label: "Fresh fuel goes where it can't peak.", reply: "Close. Fresh fuel goes where it can't peak alone. The burned fuel around it does the calming.", trust: 3 },
          ],
        },
      ],
    },
  ],
  jordan: [
    {
      tier: 1,
      title: "Where the door can hear",
      known: "Say a catch where the door can hear it, and it's everybody's. He learned that the hard way.",
      lines: [
        { speaker: "Jordan", text: "Can I tell you my one rule? Say a catch where the door can hear it. Break room, board, wherever people are.", mood: "even" },
        { speaker: "Jordan", text: "Then it's everybody's. Said in a corner, it's just yours, and it goes home with you.", mood: "even" },
        { speaker: "Jordan", text: "I'm not trying to be preachy. I learned it the hard way. Different story, different day.", mood: "wry" },
        {
          speaker: "Jordan",
          text: "Make sense?",
          mood: "even",
          choices: [
            { id: "soc-jordan-1a", label: "So whose catch is it, then?", reply: "Yours first. Then ours. That's the trade, and it's a good one.", trust: 3 },
            { id: "soc-jordan-1b", label: "Credit doesn't really matter.", reply: "It matters to whoever's name is on the log. Trust me on that one.", trust: 1 },
          ],
        },
      ],
    },
    {
      tier: 2,
      title: "Distance",
      known: "At his last plant, a reading was hidden on a log he'd signed without reading. Nobody believed him. That's the distance.",
      lines: [
        { speaker: "Jordan", text: "My last plant. A guy hid a bad reading on nights. My name was on the log for that hour.", mood: "sharp" },
        { speaker: "Jordan", text: "Here's the part I don't usually say. I signed that log at shift end without reading it. I always did. Everybody did.", mood: "soft" },
        { speaker: "Jordan", text: "When it came out, nobody believed I didn't know. I wouldn't have believed me either. So I left.", mood: "soft" },
        { speaker: "Jordan", text: "That's the distance. It's not me judging anyone. It's me never signing blind again.", mood: "even" },
        {
          speaker: "Jordan",
          text: "So, yeah. I watch who says things out loud.",
          mood: "even",
          choices: [
            { id: "soc-jordan-2a", label: "Your name stays clean here. Mine goes next to it.", reply: "Thank you. Seriously. You don't know how much I needed someone to say that.", trust: 4, flag: "jordanTrust" },
            { id: "soc-jordan-2b", label: "That wasn't fair to you.", reply: "No. But it was normal. That's what scared me. Thanks for hearing it.", trust: 2 },
          ],
        },
      ],
    },
    {
      tier: 3,
      title: "Lane two",
      known: "Jordan oiled lane two for you, and told you he wasn't sure he'd make friends here.",
      lines: [
        { speaker: "Jordan", text: "Okay, so I oiled lane two for you. It drifts left. You'll hate it. Everyone hates it.", mood: "wry" },
        { speaker: "Jordan", text: "Thursday, after shift. Mabel's coming. Tommy says he's not, and then he always does.", mood: "warm" },
        { speaker: "Jordan", text: "Honestly, I wasn't sure I'd make friends here. After the last place. So. Thanks for being one.", mood: "soft" },
        {
          speaker: "Jordan",
          text: "You in?",
          mood: "warm",
          choices: [
            { id: "soc-jordan-3a", label: "I'll be there.", reply: "Bring your own shoes. And your catches. We tell them between frames. It's a whole tradition.", trust: 3 },
            { id: "soc-jordan-3b", label: "Easy lane first?", reply: "You've had easy. You're past easy. Lane two, friend.", trust: 2 },
          ],
        },
      ],
    },
  ],
};
