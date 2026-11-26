/**
 * Floor talk, cycle 2 (weeks 4–6): after the first outage.
 *
 * The owner, 25 November 2026: across ten weeks the same fourteen situations got repetitive. Each fuel cycle now has
 * its own. Cycle 2 is the stretch after the first reload: everyone is tired from the outage, the core is restarting,
 * and the things that got skipped while people were exhausted start coming due.
 *
 * Same rules as floorTalks.ts: each person has two exchanges, each with someone else; every person is talked about
 * twice; every exchange is written once per culture. Lines ≤125, labels ≤90, replies ≤150.
 * DRAFT by Claude, waiting for the owner's approval (docs/floor-talk-draft.md).
 */
import type { FloorTalk } from "./floorTalks";

export const FLOOR_TALKS_CYCLE2: FloorTalk[] = [
  {
    id: "c2-mabel-tommy",
    npc: "mabel",
    with: "tommy",
    n: 2,
    title: "Before ten",
    scene: "Tommy's at the café counter at half nine. His coffee's gone cold. He hasn't touched it.",
    lines: {
      guarded: [
        ["mabel", "You're early, and you're not drinking that. Knees or the outage?"],
        ["tommy", "Both. Twelve-hour shifts for three weeks. My knees have opinions."],
        ["mabel", "Then sit. The pump will still be broken at ten."],
      ],
      respect: [
        ["tommy", "I signed a lockout during the outage I don't remember hanging. I went back and checked it. It was right."],
        ["mabel", "You checked. That's the bit that matters, love. Tell Elena too, so she knows how tired people got."],
        ["tommy", "Already did. She's putting the outage hours on the review. Said I could be the example."],
      ],
      comfort: [
        ["mabel", "There he is. Survived the outage, I see. Cake?"],
        ["tommy", "Cake. Absolutely. Best three weeks of my life, Mabel. Never better."],
        ["mabel", "You're limping, Tommy."],
      ],
      distrust: [
        ["tommy", "Somebody's counting how long my lockouts take. There's a stopwatch on a clipboard."],
        ["mabel", "Who's holding the clipboard?"],
        ["tommy", "Doesn't matter. Now I'm hanging them fast and checking them twice when nobody's looking."],
      ],
      fear: [
        ["tommy", "If anyone asks, I was here by seven."],
        ["mabel", "You were here by six. I poured your cup."],
        ["tommy", "Then say six. Please. Nobody's checking the truth this week, just the times."],
      ],
    },
    ask: "He'll work on those knees till they fold. How do I get him to say he's done in?",
    trust: { label: "Make him sit. He'll take it from you.", reply: "He will. He always has. I'll keep a chair by the urn with his name on it." },
    callout: { label: "Ask him straight if he's fit for the shift.", reply: "You're right. Straight, and in private. Tired men hang locks wrong. I'll ask him before ten." },
    says: { about: "tommy", text: "Mabel says Tommy will work till his knees fold, and never says when they're folding." },
  },
  {
    id: "c2-mabel-priya",
    npc: "mabel",
    with: "priya",
    n: 3,
    title: "The new chalk",
    scene: "Priya's at the north wall, reading Mabel's chalk marks with her head tilted. Mabel watches her.",
    lines: {
      guarded: [
        ["priya", "Is there a mark for the outage?"],
        ["mabel", "One. Someone caught a misloaded assembly on the camera. Didn't give me a name."],
        ["priya", "It was the night crew. They were worried it'd look like they'd made the mistake."],
      ],
      respect: [
        ["priya", "Fourteen marks since the reload. That's more than the whole first cycle."],
        ["mabel", "People are tired, so they're catching more of their own slips. Tired and honest beats rested and quiet."],
        ["priya", "I'm putting that on a slide. With your name on it."],
      ],
      comfort: [
        ["mabel", "No new marks this week. Nice and quiet."],
        ["priya", "The fuel results say we had three near-misses during the outage."],
        ["mabel", "Did they? Nobody told me. Nobody wanted to spoil the mood, I suppose."],
      ],
      distrust: [
        ["priya", "Three of these marks are people reporting each other. Not themselves."],
        ["mabel", "I chalk what's said, love. I can't chalk why."],
        ["priya", "Then maybe you need a second colour."],
      ],
      fear: [
        ["mabel", "No marks since the outage. Not one."],
        ["priya", "We moved a hundred and ninety-three assemblies. Not one thing went wrong?"],
        ["mabel", "Something always goes wrong. This time nobody said."],
      ],
    },
    ask: "Priya reads that wall like a core map. Is she reading it right?",
    trust: { label: "She is. Let her help you keep it.", reply: "Then I'll give her the second piece of chalk. I've been holding it twenty years." },
    callout: { label: "The wall only counts what people feel safe to say.", reply: "Yes. A clean wall isn't a clean floor. I'll put that on the board above it." },
    says: { about: "priya", text: "Mabel says Priya reads the chalk wall like a core map, and finds the holes in it." },
  },
  {
    id: "c2-holt-marcus",
    npc: "holt",
    with: "marcus",
    n: 2,
    title: "The promotion board",
    scene: "Marcus is in Holt's office with a folder he keeps opening and closing. The promotion board is Friday.",
    lines: {
      guarded: [
        ["marcus", "I'd like the board to see the feedwater error. Before someone else shows it to them."],
        ["holt", "It is already in your file. In your words. That is why I put you forward."],
        ["marcus", "Oh. I thought it would count against me."],
      ],
      respect: [
        ["holt", "The board will ask about the feedwater error. What will you say?"],
        ["marcus", "That I was wrong by a percent and a bit, and I said so before the floor did. And what I changed."],
        ["holt", "Good. Say it in that order. The number first."],
      ],
      comfort: [
        ["holt", "You will be fine on Friday. Everyone likes you."],
        ["marcus", "That's... not really what the board's for, is it?"],
        ["holt", "No. You are right. Let us go through the hard questions instead."],
      ],
      distrust: [
        ["marcus", "Someone's sent the board my old dose survey. The one with the sticker."],
        ["holt", "I know. It came with no name on it."],
        ["marcus", "So I'm defending myself against a ghost."],
      ],
      fear: [
        ["marcus", "Maybe I should withdraw. Better that than the board finding something."],
        ["holt", "Is there something to find?"],
        ["marcus", "I don't know. That's what scares me."],
      ],
    },
    ask: "Marcus thinks his worst week will sink him. Does it?",
    trust: { label: "No. It's why he's ready. Tell him that.", reply: "I will. Plainly, and before Friday. He should not walk in thinking it is a secret." },
    callout: { label: "Make sure the board hears it from him, not a file.", reply: "Yes. A mistake told by the man who made it is a different thing to read. I will tell the board to ask him." },
    says: { about: "marcus", text: "Holt says Marcus's worst week is the reason he put him forward for senior." },
  },
  {
    id: "c2-holt-jordan",
    npc: "holt",
    with: "jordan",
    n: 3,
    title: "Restart night",
    scene: "Jordan's at the turbine deck rail at the end of his night. Holt has come in early for the restart.",
    lines: {
      guarded: [
        ["holt", "You stood the restart night. How did it go?"],
        ["jordan", "Fine, sir. Steady. A couple of alarms, all expected."],
        ["holt", "Which couple? I would like to hear them from you."],
      ],
      respect: [
        ["jordan", "Heater drain pump tripped at 02:10. I caught it on the camera before the alarm. Logged it."],
        ["holt", "I read it. You logged the camera time and the alarm time. That gap is why we have rovers. Thank you."],
        ["jordan", "Honestly, I nearly didn't put the camera time in. It looked like I was showing off."],
      ],
      comfort: [
        ["holt", "Restart went well, I hear."],
        ["jordan", "Really well, sir. Smooth. Bit of a heater drain thing, nothing much."],
        ["holt", "Good. ...What heater drain thing?"],
      ],
      distrust: [
        ["holt", "The heater drain trip. Was anyone near it before it tripped?"],
        ["jordan", "Me. On rounds. Like the log says, sir. To the minute."],
        ["holt", "I was not accusing you. I can see why it sounded like that."],
      ],
      fear: [
        ["holt", "Anything from the restart night I should know?"],
        ["jordan", "No, sir. Nothing."],
        ["holt", "The heater drain pump is in the computer log. It is not in yours."],
      ],
    },
    ask: "I came in early so the night crew would see me. Did it help, or did it just make Jordan nervous?",
    trust: { label: "It helped. He saw you'd come to listen.", reply: "Then I will do it every restart. And I will bring coffee, so it looks less like an inspection." },
    callout: { label: "Ask him about the pump before you ask if he was there.", reply: "Yes. What happened first, then who. I have it the wrong way round with people. I will practise it on Jordan." },
    says: { about: "jordan", text: "Holt says Jordan's restart log had the camera time and the alarm time, and the gap is why rovers exist." },
  },
  {
    id: "c2-elena-priya",
    npc: "elena",
    with: "priya",
    n: 2,
    title: "The first flux map",
    scene: "Priya's spread the first flux map of the new cycle across Elena's turnover desk.",
    lines: {
      guarded: [
        ["priya", "The new core is a little hotter on the east side than I predicted."],
        ["elena", "Is that a problem for my operators?"],
        ["priya", "Not yet. I wanted you to hear it from me before the computer says it."],
      ],
      respect: [
        ["elena", "My crew noticed the east side reading high on day two. They wrote it down."],
        ["priya", "Then your crew saw it before my map did. Can I thank them myself?"],
        ["elena", "Come to turnover at six. They'll pretend they're not pleased."],
      ],
      comfort: [
        ["priya", "Slightly warm on the east side. Nothing to worry about."],
        ["elena", "Lovely. My lot will be relieved. They've had a long few weeks."],
        ["priya", "...I should probably tell them how slightly."],
      ],
      distrust: [
        ["elena", "Is the east side hot because of how my crew loaded it?"],
        ["priya", "It's hot because of how I designed it. The loading was perfect."],
        ["elena", "Say that at turnover, then. Somebody's already said otherwise."],
      ],
      fear: [
        ["priya", "The east side's reading high. I haven't told anyone yet."],
        ["elena", "Why not?"],
        ["priya", "Because the last person who brought a high reading this month got a meeting."],
      ],
    },
    ask: "Priya brings me the bad news first. Should she be telling the crew herself?",
    trust: { label: "She brings it to you because she trusts you.", reply: "She does. I'll keep being the door she comes through. And I'll hold it open to the crew." },
    callout: { label: "Yes. Get her in front of the crew at turnover.", reply: "Agreed. If I'm the only one who hears it, my crew only ever hears my version. Six tomorrow, both of us." },
    says: { about: "priya", text: "Elena says Priya always brings the bad news to her before the computer does." },
  },
  {
    id: "c2-elena-holt",
    npc: "elena",
    with: "holt",
    n: 3,
    title: "Overtime",
    scene: "Elena's in Holt's doorway with the outage overtime sheet. Some names have five weeks without a day off.",
    lines: {
      guarded: [
        ["elena", "Four of my people haven't had a day off since the reload started."],
        ["holt", "The restart schedule needed them."],
        ["elena", "It did. Now they need a day. I'm asking for it in writing."],
      ],
      respect: [
        ["holt", "I signed every one of those extensions. I should have looked at the names, not the hours."],
        ["elena", "Then sign the rest days the same way. With the names."],
        ["holt", "Bring me the list. I will sign it in front of them."],
      ],
      comfort: [
        ["elena", "Everyone's been brilliant. A bit tired, but brilliant."],
        ["holt", "Good. Then we keep the pace through the restart."],
        ["elena", "...A bit tired. I said that part quietly, didn't I."],
      ],
      distrust: [
        ["holt", "Somebody went to the union about the overtime. Did you know?"],
        ["elena", "I sent you this sheet three times. Somebody went because nobody answered."],
        ["holt", "Then it was my silence they went over, not my head. Fair."],
      ],
      fear: [
        ["elena", "Nobody's asked for a day off. Not one."],
        ["holt", "Then they do not need one."],
        ["elena", "Or they think asking is the same as quitting."],
      ],
    },
    ask: "Holt listens to me, eventually. Should I keep carrying my crew's tiredness up to him?",
    trust: { label: "Keep going. He signs when you bring him names.", reply: "He does. Slowly. I'll take the list up again tomorrow, and I'll put the names at the top." },
    callout: { label: "Bring two of them with you. Let him hear it from them.", reply: "You're right. If it's always me, it's always my word. I'll ask Tommy to come. He won't want to." },
    says: { about: "holt", text: "Elena says Holt signs rest days once he sees the names, not the hours." },
  },
  {
    id: "c2-tommy-jordan",
    npc: "tommy",
    with: "jordan",
    n: 2,
    title: "The extra lock",
    scene: "Jordan's watching Tommy hang a second lock on a breaker that already has one.",
    lines: {
      guarded: [
        ["jordan", "Two locks? Is that a new rule?"],
        ["tommy", "No. It's a me rule. Outage brain. I don't trust my own hands this week."],
        ["jordan", "Huh. Can I steal that?"],
      ],
      respect: [
        ["tommy", "I hung a lock on the wrong breaker during the outage. Caught it on the try. That's why the second one."],
        ["jordan", "You're telling me that? Out loud? Here?"],
        ["tommy", "Telling everyone. Kid, the try button saved me, and I want you to see it does."],
      ],
      comfort: [
        ["jordan", "Bowling Thursday, Tommy. You're coming. No excuses."],
        ["tommy", "Course I'm coming. Hold on, let me just... there. Two locks."],
        ["jordan", "Why two?"],
      ],
      distrust: [
        ["jordan", "Is the second lock because someone touched yours during the outage?"],
        ["tommy", "Second lock's because I don't know who did. That's worse."],
        ["jordan", "We could just ask the crew."],
      ],
      fear: [
        ["tommy", "Don't look at the second lock. Just... don't write it down."],
        ["jordan", "Why not? It's safer, isn't it?"],
        ["tommy", "Because then somebody asks why, and I have to say I made a mistake."],
      ],
    },
    ask: "The kid copies everything I do. Is that good, or should I be worried?",
    trust: { label: "It's good. He's copying the right things.", reply: "Then I'd better keep doing them right. No pressure. Bad knees, double locks, and an audience." },
    callout: { label: "Tell him why you hung it, not just how.", reply: "You're right. If he copies the lock and not the reason, he'll stop when it's a nuisance. I'll tell him about the wrong breaker." },
    says: { about: "jordan", text: "Tommy says Jordan copies everything he does, so he'd better do it right." },
  },
  {
    id: "c2-tommy-elena",
    npc: "tommy",
    with: "elena",
    n: 3,
    title: "The skipped try",
    scene: "Elena's at the maintenance board with a work package. Tommy can tell from her face it isn't good.",
    lines: {
      guarded: [
        ["elena", "The try step on pump 1B wasn't initialled during the outage."],
        ["tommy", "Who hung it?"],
        ["elena", "One of yours. I wanted you to hear it before I asked him."],
      ],
      respect: [
        ["tommy", "That was my apprentice. I watched him do the try. I forgot to make him initial it."],
        ["elena", "So the plant was safe, and the paper wasn't."],
        ["tommy", "Right. I'll do the paper with him today, and I'll tell him it was my miss."],
      ],
      comfort: [
        ["elena", "Small thing. One initial missing on 1B. Probably nothing."],
        ["tommy", "Probably nothing. We were all knackered."],
        ["elena", "Probably. Shall I just... initial it?"],
      ],
      distrust: [
        ["elena", "Did your apprentice skip the try on 1B, or just the initials?"],
        ["tommy", "Ask him. You'll believe him over me anyway, the way this week's going."],
        ["elena", "I'm asking you because I'd rather believe you."],
      ],
      fear: [
        ["elena", "The try step on 1B isn't signed."],
        ["tommy", "I'll sign it."],
        ["elena", "Did you do it?"],
      ],
    },
    ask: "Elena came to me first about my apprentice. Was that fair to him?",
    trust: { label: "Yes. She gave you the chance to fix it with him.", reply: "She did. Five minutes, and nobody's hauled in front of anyone. I owe her a coffee. Proper one, from Mabel." },
    callout: { label: "He should hear it straight, from her too.", reply: "Yeah. If it only comes through me, he thinks it's a me thing. It's a site thing. We'll both talk to him." },
    says: { about: "elena", text: "Tommy says Elena brings him his crew's mistakes first, so they get fixed instead of filed." },
  },
  {
    id: "c2-marcus-mabel",
    npc: "marcus",
    with: "mabel",
    n: 2,
    title: "The interview tie",
    scene: "Marcus is at the café in a tie, practising answers under his breath. Mabel's pretending not to listen.",
    lines: {
      guarded: [
        ["marcus", "Mabel. Honestly. Do I sound like I'm reading a script?"],
        ["mabel", "You sound like a man reading a script about himself."],
        ["marcus", "That's... annoyingly accurate."],
      ],
      respect: [
        ["mabel", "Tell me your feedwater story. The way you'd tell the board."],
        ["marcus", "I was off by a percent and a bit. I told the new engineer before I told the floor. Then I told the board."],
        ["mabel", "Good. Now tell it without apologising four times. Once is plenty, love."],
      ],
      comfort: [
        ["mabel", "You'll walk it, Marcus. You're the cleverest lad on the site."],
        ["marcus", "Thanks. Do you think they'll ask about the dose sticker?"],
        ["mabel", "Oh, I shouldn't think so. Have a biscuit."],
      ],
      distrust: [
        ["marcus", "Someone sent the board my old survey. Was it someone who drinks your coffee?"],
        ["mabel", "Everybody drinks my coffee, Marcus."],
        ["marcus", "Then everybody's a suspect."],
      ],
      fear: [
        ["marcus", "If I don't get it, I'll know it was the sticker."],
        ["mabel", "Or you'll know they picked someone else. Those aren't the same."],
        ["marcus", "On this site, this month? They are."],
      ],
    },
    ask: "Mabel says I sound like I'm reading a script. Do I?",
    trust: { label: "You know your story. Just tell it.", reply: "...Okay. Just tell it. No slides in my head. I'll try it on Mabel first. She'll tell me." },
    callout: { label: "Lead with the mistake. It's your best answer.", reply: "The mistake first. Plainly. Once, not four times. Mabel said that too. You two are ganging up on me." },
    says: { about: "mabel", text: "Marcus says Mabel can hear a script from across the café, and tells you to drop it." },
  },
  {
    id: "c2-marcus-elena",
    npc: "marcus",
    with: "elena",
    n: 3,
    title: "Ascension",
    scene: "Marcus and Elena are at the board during the power ascension. Marcus has a calculation in his hand.",
    lines: {
      guarded: [
        ["marcus", "Hold at seventy-five percent. I want to recheck the boron before we go up."],
        ["elena", "How long?"],
        ["marcus", "Twenty minutes. I know it holds up the schedule."],
      ],
      respect: [
        ["elena", "Holding at seventy-five. Take the time. Want a second set of eyes on the sheet?"],
        ["marcus", "Yes. Honestly, yes. I'm tired, and tired men do arithmetic badly."],
        ["elena", "Then we'll be tired together. Read me the numbers."],
      ],
      comfort: [
        ["elena", "We're on a roll, Marcus. Straight to a hundred?"],
        ["marcus", "Straight to a hundred. Sure. I mean, probably."],
        ["elena", "Probably?"],
      ],
      distrust: [
        ["elena", "Is this hold for the boron, or so nobody can say you rushed it?"],
        ["marcus", "Both. Is that so wrong?"],
        ["elena", "No. But say the first one louder."],
      ],
      fear: [
        ["marcus", "I'll just... check it quietly. No need to hold."],
        ["elena", "If you want a hold, call a hold. That's what the button is for."],
        ["marcus", "Last time I held, it was in the morning meeting. By name."],
      ],
    },
    ask: "Elena gave me the twenty minutes without asking why. Should she have?",
    trust: { label: "Yes. You asked for time; she trusted the reason.", reply: "She did. I'll pay that back. I'll be quick, and I'll be right, and I'll say thank you in front of her crew." },
    callout: { label: "She should hear the why. So should the crew.", reply: "You're right. A hold with no reason looks like nerves. I'll tell them what I'm checking and what would make me stop." },
    says: { about: "elena", text: "Marcus says Elena gives you the hold first and asks why afterwards." },
  },
  {
    id: "c2-priya-holt",
    npc: "priya",
    with: "holt",
    n: 2,
    title: "The reload report",
    scene: "Priya's reload report is on Holt's desk. Page one says the core is fine. Page four says three things nearly weren't.",
    lines: {
      guarded: [
        ["holt", "Page four. Three near-misses during the reload. Why is that on page four?"],
        ["priya", "Because corporate reads page one."],
        ["holt", "I read page four."],
      ],
      respect: [
        ["holt", "Move page four to page one. Corporate should read the near-misses first."],
        ["priya", "They'll ask why we had three."],
        ["holt", "Good. And we will say: because people told us. That is the point."],
      ],
      comfort: [
        ["holt", "A clean reload. Well done."],
        ["priya", "Mostly clean. There's a page four."],
        ["holt", "I am sure it is fine. You are always thorough."],
      ],
      distrust: [
        ["holt", "Who reported the misloaded assembly? There's no name."],
        ["priya", "There's no name because they asked me not to put one."],
        ["holt", "Then I need to know why someone thought they needed protecting from me."],
      ],
      fear: [
        ["priya", "I've taken page four out."],
        ["holt", "What was on page four?"],
        ["priya", "The truth. It didn't seem like a good month for it."],
      ],
    },
    ask: "Holt reads page four. Should I stop hiding things on page four?",
    trust: { label: "He reads it. Keep writing it for him.", reply: "He does, every time. All right. Page four stays, and I'll stop pretending it's a secret." },
    callout: { label: "Put the near-misses on page one.", reply: "You're right. If the bad news is always on page four, people learn it's page-four news. Page one it is." },
    says: { about: "holt", text: "Priya says Holt always reads page four, where she puts the things corporate shouldn't skip." },
  },
  {
    id: "c2-priya-marcus",
    npc: "priya",
    with: "marcus",
    n: 3,
    title: "Practice board",
    scene: "Priya's quizzing Marcus in the engineering office before Friday's promotion board. He's pacing.",
    lines: {
      guarded: [
        ["priya", "Question three. What's the worst mistake you've made on this site?"],
        ["marcus", "I'll say the feedwater flow. It's a safe one."],
        ["priya", "Is it the worst one, or the safe one?"],
      ],
      respect: [
        ["marcus", "The sticker. I wanted it to be a typo because it was my survey. That's the worst."],
        ["priya", "That's the answer. Now say what you do differently."],
        ["marcus", "I check my own work like it's somebody else's. I'm still bad at it."],
      ],
      comfort: [
        ["priya", "You'll be brilliant. Let's skip the hard questions, you know them."],
        ["marcus", "Do I? I really don't think I know them."],
        ["priya", "...All right. Question three, then."],
      ],
      distrust: [
        ["marcus", "Did you tell anyone about the sticker? Before the board?"],
        ["priya", "No. Marcus. I've known you since we started. No."],
        ["marcus", "Sorry. Sorry. Someone did. I'm checking everyone."],
      ],
      fear: [
        ["marcus", "If they ask about the sticker, I'll say it was a printing error."],
        ["priya", "It wasn't."],
        ["marcus", "I know. But that's the answer that gets me through Friday."],
      ],
    },
    ask: "Marcus would rather be clever than honest when he's scared. How do I help him?",
    trust: { label: "Remind him the board picked him because of the honesty.", reply: "Yes. They read his file. They know. I'll tell him the honest answer is the one they're waiting for." },
    callout: { label: "Tell him the printing-error answer is a hide.", reply: "It is. I'll say it to him straight, the way he'd want someone to say it to me. Then we'll practise the true one." },
    says: { about: "marcus", text: "Priya says Marcus checks his own work like it's somebody else's, and is still bad at it." },
  },
  {
    id: "c2-jordan-mabel",
    npc: "jordan",
    with: "mabel",
    n: 2,
    title: "Last pastry, again",
    scene: "Jordan's come off nights. Mabel slides the last pastry over before he's sat down.",
    lines: {
      guarded: [
        ["jordan", "You're going to have to stop doing that. People will notice."],
        ["mabel", "People noticed years ago, love. Eat it."],
        ["jordan", "...Thanks. Long restart."],
      ],
      respect: [
        ["mabel", "You wrote the camera time in the restart log. Holt read it out at the morning meeting."],
        ["jordan", "He did? I thought he'd think I was showing off."],
        ["mabel", "He thinks you're a rover who looks. That's the whole compliment, from him."],
      ],
      comfort: [
        ["jordan", "Mabel, honestly, you're the best thing about this site."],
        ["mabel", "Flattery. How was the restart?"],
        ["jordan", "Great! Easy. Totally easy."],
      ],
      distrust: [
        ["jordan", "Did someone ask you what time I came off shift?"],
        ["mabel", "Someone did. I told them the truth, and I told them I didn't like being asked."],
        ["jordan", "Thanks. I'm keeping my own copy of everything now."],
      ],
      fear: [
        ["jordan", "If my name comes up at the meeting, will you tell me before it happens?"],
        ["mabel", "Why would your name come up?"],
        ["jordan", "No reason. That's the problem. It never needs one."],
      ],
    },
    ask: "Mabel looks after everyone. Who looks after Mabel?",
    trust: { label: "You do. Bring her the first coffee tomorrow.", reply: "Ha. Me, making Mabel coffee. She'll tell me it's wrong. I'll do it anyway." },
    callout: { label: "Ask her how she's doing. She never says.", reply: "Yeah. She asks everyone and nobody asks back. Honestly, that's on all of us. I'll ask her straight." },
    says: { about: "mabel", text: "Jordan says Mabel looks after everyone, and nobody ever asks how she is." },
  },
  {
    id: "c2-jordan-tommy",
    npc: "jordan",
    with: "tommy",
    n: 3,
    title: "Bowling night",
    scene: "Jordan's at Tommy's workbench with the bowling sign-up sheet. Tommy's name isn't on it.",
    lines: {
      guarded: [
        ["jordan", "You're not on the sheet. You're always on the sheet."],
        ["tommy", "Knees, Jordan. Five weeks of outage on concrete."],
        ["jordan", "You could keep score. Nobody keeps score like you."],
      ],
      respect: [
        ["tommy", "Honest truth? I'm wrecked. I don't want to come and be grumpy."],
        ["jordan", "Then come and be grumpy. Grumpy Tommy's still Tommy."],
        ["tommy", "Fine. One game. And I'm keeping score, because you lot cheat."],
      ],
      comfort: [
        ["jordan", "Bowling! Thursday! Everyone's coming. It's going to be the best one yet."],
        ["tommy", "Yeah, sure. Put me down. I'll... probably be there."],
        ["jordan", "Probably?"],
      ],
      distrust: [
        ["tommy", "Is the bowling sheet so somebody can see who's not a team player?"],
        ["jordan", "What? No. It's bowling, Tommy."],
        ["tommy", "Everything's a list this month."],
      ],
      fear: [
        ["jordan", "Nobody's signed. Not even me, yet."],
        ["tommy", "Cancel it. Nobody wants to be seen having fun right now."],
        ["jordan", "That's the saddest thing anyone's said on this floor."],
      ],
    },
    ask: "He says it's his knees. Is it his knees?",
    trust: { label: "Probably. Make it easy for him to come anyway.", reply: "Right. I'll save him the chair by the score screen. Can't say no to a chair." },
    callout: { label: "Ask him. It might be the outage, not the knees.", reply: "Yeah. Five weeks of twelve-hour shifts and he still asks how I am. I'll ask him back, properly." },
    says: { about: "tommy", text: "Jordan says Tommy keeps score at bowling because nobody else can be trusted to." },
  },
];
