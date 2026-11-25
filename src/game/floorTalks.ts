/**
 * Floor talk: what you walk in on.
 *
 * The owner, 25 November 2026: the second and third time you talk to someone, show them with someone else, so each
 * person is built by how others talk about them, and the floor's culture shows in how they talk to each other.
 *
 * Each person has two exchanges (your 2nd and 3rd talk with them that week), each with another crew member. Every
 * exchange is written five ways, one per culture (floorCulture.ts): same people, same situation, different floor.
 * It ends with the person turning to you: back someone up ("-t", more trust) or name the problem ("-c", more
 * calling each other out). That choice moves the culture, and the next exchange sounds different.
 *
 * Voices: docs/characters.md. Narration has an empty speaker. Lines ≤125, labels ≤90, replies ≤150.
 * DRAFT by Claude, waiting for the owner's approval (docs/floor-talk-draft.md).
 */
import type { Choice, Line, NpcId } from "./content";
import type { Culture } from "./floorCulture";

type Beat = [NpcId | null, string];

export interface FloorTalk {
  id: string;
  /** Whose conversation this opens. */
  npc: NpcId;
  /** Who they're talking with when you walk in. */
  with: NpcId;
  /** The talk it opens: the 2nd or 3rd of the week with npc. */
  n: 2 | 3;
  title: string;
  /** What you walk in on, in narration. */
  scene: string;
  lines: Record<Culture, Beat[]>;
  /** npc turns to you. */
  ask: string;
  trust: { label: string; reply: string };
  callout: { label: string; reply: string };
  /** What this tells you about someone, from someone else: the crew page's "What others say". */
  says: { about: NpcId; text: string };
}

export const SPEAKER: Record<NpcId, string> = {
  mabel: "Mabel",
  holt: "Holt",
  elena: "Elena",
  tommy: "Tommy",
  marcus: "Marcus",
  priya: "Priya",
  jordan: "Jordan",
};

export const FLOOR_TALKS: FloorTalk[] = [
  {
    id: "mabel-holt",
    npc: "mabel",
    with: "holt",
    n: 2,
    title: "Reggie",
    scene: "Holt is at the café counter, waiting for a cup. Mabel takes her time with it.",
    lines: {
      guarded: [
        ["holt", "Just the coffee, Mabel. I have corporate at nine."],
        ["mabel", "You've had corporate at nine for fifteen years, Reggie. Sit for two minutes."],
        ["holt", "Standing is faster. And please don't call me that in front of the new engineer."],
      ],
      respect: [
        ["mabel", "You cut Marcus off in the review yesterday, Reggie. Before he'd finished."],
        ["holt", "I did. You're right. I'll tell him so this morning."],
        ["mabel", "Good. Best junior I ever trained. Worst at apologising. You're getting better."],
      ],
      comfort: [
        ["mabel", "There's my favourite director. Extra sugar today, you've earned it."],
        ["holt", "Have I? The review went well, I suppose. Nobody raised anything."],
        ["mabel", "Nobody raised anything. Lovely. Drink up."],
      ],
      distrust: [
        ["holt", "Someone filed an anonymous note about the night log. Was it you?"],
        ["mabel", "If I had something to say to you, Reggie, I'd say it to your face. Like I always have."],
        ["holt", "Then who? Everyone's writing things down about everyone this week."],
      ],
      fear: [
        ["holt", "Morning. Is the floor quiet?"],
        ["mabel", "Very quiet. Nobody's been in for coffee since seven. That isn't like them."],
        ["holt", "Quiet is fine. Quiet is good."],
      ],
    },
    ask: "You heard that. What would you tell Reggie, if he'd listen?",
    trust: { label: "He's trying. Give him the two minutes.", reply: "He is trying. I'll tell him you said so. He'll pretend not to care, and he'll care." },
    callout: { label: "People are scared to bring him bad news.", reply: "They are. Someone should tell him to his face. I've done it for thirty years. Your turn, love." },
    says: { about: "holt", text: "Mabel says Holt was the best junior she ever trained, and the worst at saying sorry." },
  },
  {
    id: "mabel-jordan",
    npc: "mabel",
    with: "jordan",
    n: 3,
    title: "The last pastry",
    scene: "Jordan's at the end of the counter. Mabel slides the last pastry toward him without asking.",
    lines: {
      guarded: [
        ["jordan", "You don't have to keep saving me these."],
        ["mabel", "I know I don't. Eat it anyway. You skipped breakfast."],
        ["jordan", "How do you always know that?"],
      ],
      respect: [
        ["mabel", "You signed the logbook without reading the last page yesterday. I saw you."],
        ["jordan", "...I did. Old habit. I'll go back and read it now. Thanks for saying it."],
        ["mabel", "That's all I wanted. The pastry's still yours."],
      ],
      comfort: [
        ["jordan", "Best pastry on the site, as always."],
        ["mabel", "Flatterer. How are you, really? You looked tired at the board."],
        ["jordan", "Fine! Totally fine. Bowling Thursday, you coming?"],
      ],
      distrust: [
        ["jordan", "Somebody told Holt I left the turbine round early. I didn't. I want to know who."],
        ["mabel", "Sit down before you go looking for a fight, love."],
        ["jordan", "Not a fight. I just keep my own log now. Every minute of it."],
      ],
      fear: [
        ["jordan", "Did anyone ask about me this morning?"],
        ["mabel", "No. Why would they?"],
        ["jordan", "No reason. If they do, I was on rounds. The whole time."],
      ],
    },
    ask: "He's still carrying something from his last plant. You know that, don't you?",
    trust: { label: "He's got people here now. He'll be all right.", reply: "He has. Make sure he knows it. Bowling counts, by the way." },
    callout: { label: "Someone should ask him straight how he's doing.", reply: "Then ask him. Straight, and kindly. That's the only way he hears it." },
    says: { about: "mabel", text: "Jordan says Mabel always knows when he's skipped breakfast, and he's never worked out how." },
  },
  {
    id: "holt-elena",
    npc: "holt",
    with: "elena",
    n: 2,
    title: "Elena's read",
    scene: "Elena is in Holt's doorway with the morning sheet. He waves her in ahead of you.",
    lines: {
      guarded: [
        ["holt", "Elena. Your read on the floor, before anyone else's."],
        ["elena", "Quiet. Lineups done. Nobody's said anything worth writing down."],
        ["holt", "Nobody, or nothing? Those are different."],
      ],
      respect: [
        ["elena", "My read: the new engineer called me over twice before they were sure. That's a good sign."],
        ["holt", "Agreed. And your second look caught my mistake on the night schedule. Thank you."],
        ["elena", "You had nights covered by one person. I'm not letting that through, even from you."],
      ],
      comfort: [
        ["holt", "How's the floor?"],
        ["elena", "Good. Everyone's getting on. Lot of laughing in the break room."],
        ["holt", "Good. Then I won't ask any further."],
      ],
      distrust: [
        ["elena", "Three people came to me about each other this morning. Separately. Nobody went to the person."],
        ["holt", "Names?"],
        ["elena", "No. If I hand you names, the next three won't come to me at all."],
      ],
      fear: [
        ["holt", "Anything I should know?"],
        ["elena", "Nothing on paper."],
        ["holt", "And off paper?"],
        ["elena", "Off paper, people are tired and keeping their heads down. That's all I'll say."],
      ],
    },
    ask: "You've walked the floor. Is Elena's read the whole read?",
    trust: { label: "Elena's read is the one I'd trust.", reply: "So would I. I'll keep asking her first." },
    callout: { label: "Ask the floor yourself, not only through Elena.", reply: "Fair. If I only ask Elena, I only hear what Elena can carry. I'll walk it Thursday." },
    says: { about: "elena", text: "Holt asks Elena's read on the floor before anyone's. She won't hand him names." },
  },
  {
    id: "holt-priya",
    npc: "holt",
    with: "priya",
    n: 3,
    title: "Walkdown hours",
    scene: "Priya's walkdown request is on Holt's desk. It's her third this month. She's standing beside it.",
    lines: {
      guarded: [
        ["priya", "Eight more walkdown hours for the outage. I've written down why."],
        ["holt", "You always write down why. It's always good. The budget is still the budget."],
        ["priya", "Then tell me which part of the core you'd like me not to look at."],
      ],
      respect: [
        ["holt", "I read your request twice. You're right about the bottom nozzles. Approved."],
        ["priya", "Thank you. I cut two hours from my own list to pay for it. I didn't need them."],
        ["holt", "That's why I approve yours. You never ask for padding."],
      ],
      comfort: [
        ["holt", "Approved, as always."],
        ["priya", "You didn't read it, did you?"],
        ["holt", "I trust you. Isn't that enough?"],
        ["priya", "It's kind. It isn't the same as reading it."],
      ],
      distrust: [
        ["holt", "Corporate asked why reactor engineering overspends on walkdowns. Did you go over my head?"],
        ["priya", "No. I went to the procedure, which says I walk what I sign. You can read my emails."],
        ["holt", "I might have to. That's where we are this week."],
      ],
      fear: [
        ["priya", "I've withdrawn the walkdown request."],
        ["holt", "Why?"],
        ["priya", "Nobody wants to be the one asking for more this week. I'll walk it on my own time."],
      ],
    },
    ask: "Priya always walks it. Is she right to push me this hard?",
    trust: { label: "Give her the hours. She's never padded a request.", reply: "No, she hasn't. Approved. Tell her it was your idea. She'll enjoy that." },
    callout: { label: "She's right, but show her what the hours cost elsewhere.", reply: "Yes. If I say no without the reason, she has to guess. I'll show her the whole sheet." },
    says: { about: "priya", text: "Holt says Priya has never once padded a request, and approves hers because of it." },
  },
  {
    id: "elena-jordan",
    npc: "elena",
    with: "jordan",
    n: 2,
    title: "The margin of the log",
    scene: "Jordan is pulling his boots on in the locker room. Elena stops beside him.",
    lines: {
      guarded: [
        ["elena", "You had the turbine round at four. Anything?"],
        ["jordan", "Nothing. Logged it. Signed it. Read it before I signed it."],
        ["elena", "Good. You don't have to tell me that last part every time."],
      ],
      respect: [
        ["elena", "Your log has a gap at 02:10. Tell me about it."],
        ["jordan", "I stopped for a drip that turned out to be condensation. I should've written that. I'll add it."],
        ["elena", "Thank you. A gap with a reason is fine. A gap without one is how people get hurt."],
      ],
      comfort: [
        ["jordan", "Morning, boss. Coffee?"],
        ["elena", "Please. How were nights?"],
        ["jordan", "Easy. Same as always. Nothing to report."],
      ],
      distrust: [
        ["jordan", "Somebody's been checking my round times against the cameras."],
        ["elena", "That was me. Holt asked. I'm sorry I didn't tell you first."],
        ["jordan", "You should have. After my last plant, you of all people should have."],
      ],
      fear: [
        ["elena", "Jordan. You've stopped writing anything in the margin of the log."],
        ["jordan", "The margin's where people find things to blame you for."],
        ["elena", "The margin's where I find things before they hurt you."],
      ],
    },
    ask: "I gave him this job. Am I watching out for him, or watching him?",
    trust: { label: "Watching out for him. He knows the difference.", reply: "I hope so. Next time I'll tell him why I'm asking before I ask." },
    callout: { label: "Tell him when he's slipping, not just when he's doing well.", reply: "You're right. If I only ever praise him, he won't believe the praise either." },
    says: { about: "jordan", text: "Elena gave Jordan this job when nobody else would. She reads his log closer than anyone's." },
  },
  {
    id: "elena-tommy",
    npc: "elena",
    with: "tommy",
    n: 3,
    title: "The second check",
    scene: "Tommy's crew is waiting on a turnover. Elena has the clearance sheet in her hand.",
    lines: {
      guarded: [
        ["tommy", "Clearance is hung. My guys are ready to go in."],
        ["elena", "I'll walk the tags with you first. Ten minutes."],
        ["tommy", "Ten minutes. Fine. Ten."],
      ],
      respect: [
        ["elena", "The tag on breaker six is hung on the wrong side of the panel."],
        ["tommy", "...It is. Good catch. My apprentice hung it, and I signed without looking. That's on me."],
        ["elena", "We fix it, he learns, nobody gets hurt. That's the whole point."],
      ],
      comfort: [
        ["tommy", "You trust me, right? We've done this a hundred times."],
        ["elena", "I do trust you. Go ahead."],
        ["tommy", "Knew you would."],
      ],
      distrust: [
        ["tommy", "Second check again? You think my crew can't hang a tag?"],
        ["elena", "I think everyone needs a second check. Me included."],
        ["tommy", "Tell that to the engineer who wrote my guy up last week for a smudged signature."],
      ],
      fear: [
        ["elena", "Is the clearance good?"],
        ["tommy", "It's good."],
        ["elena", "Tommy. Is it good, or do you just want this to be over?"],
      ],
    },
    ask: "Tommy's crew is good. Do I still walk every tag?",
    trust: { label: "His crew knows what they're doing. Trust them.", reply: "They do. I'll walk it anyway, and I'll tell Tommy it isn't about him." },
    callout: { label: "Walk every tag, and tell Tommy the check isn't an insult.", reply: "I will. Out loud, in front of his crew, so they hear it isn't about them." },
    says: { about: "tommy", text: "Elena says Tommy's crew hangs the cleanest clearances on site, and she still walks every tag." },
  },
  {
    id: "tommy-marcus",
    npc: "tommy",
    with: "marcus",
    n: 2,
    title: "The package",
    scene: "Marcus is in the shop doorway with a work package. Tommy doesn't look up from the bench.",
    lines: {
      guarded: [
        ["marcus", "I revised the 2A package. I thought you'd want to see it before it goes out."],
        ["tommy", "Leave it on the bench."],
        ["marcus", "I'd rather walk it with you. If you have ten minutes."],
      ],
      respect: [
        ["tommy", "Your new package. Step six is backwards. Isolate before you vent, not after."],
        ["marcus", "...You're right. I wrote it from the drawing, not the pump. Thank you. I'll fix it now."],
        ["tommy", "Come down and look at the pump before you write the next one. Coffee's on me."],
      ],
      comfort: [
        ["marcus", "Package for 2A. Same as always."],
        ["tommy", "Same as always. I'll sign it."],
        ["marcus", "Great. Easy morning."],
      ],
      distrust: [
        ["tommy", "Last package you sent me had the breaker wrong. I'm reading every line this time."],
        ["marcus", "That was a drawing error, not mine. And I fixed it."],
        ["tommy", "You fixed it after my guy found it with his hands."],
      ],
      fear: [
        ["marcus", "Package for 2A."],
        ["tommy", "Fine."],
        ["marcus", "If there's something wrong in it, you'd tell me. Right?"],
      ],
    },
    ask: "He came down here himself this time. That count for something, boss?",
    trust: { label: "It counts. He's trying to do it right.", reply: "Yeah. Yeah, it does. I'll show him the pump. Don't tell him I said that." },
    callout: { label: "Marcus, the last package was wrong. Own it, then move on.", reply: "Heard that, Marcus? Say it, and we're square. I mean it." },
    says: { about: "marcus", text: "Tommy says Marcus writes packages from drawings, not pumps, but he's started coming down to look." },
  },
  {
    id: "tommy-mabel",
    npc: "tommy",
    with: "mabel",
    n: 3,
    title: "Before ten",
    scene: "Mabel walks into the shop with a cup before ten. Tommy doesn't smile. Not yet.",
    lines: {
      guarded: [
        ["mabel", "Before ten. As ordered."],
        ["tommy", "You're a saint, Mabel."],
        ["mabel", "I'm a retired floor manager with a thermos. Drink."],
      ],
      respect: [
        ["mabel", "You snapped at your apprentice this morning. The whole café heard."],
        ["tommy", "...I did. He was rushing the try. Scared me. I'll go and tell him why I yelled."],
        ["mabel", "Tell him about the pump that turned over. He needs the story more than the yelling."],
      ],
      comfort: [
        ["mabel", "How's my favourite grump?"],
        ["tommy", "Grumpy. Knees hurt. Everything's fine."],
        ["mabel", "That's the spirit."],
      ],
      distrust: [
        ["tommy", "Engineering sent another audit of my lockouts. Third this month."],
        ["mabel", "They're scared, Tommy. Scared people count things."],
        ["tommy", "Then they can count my ten fingers. Still all there."],
      ],
      fear: [
        ["tommy", "Apprentice cut his hand on a flange yesterday. Small. I didn't write it up."],
        ["mabel", "Tommy."],
        ["tommy", "I know. I know. Who wants to be the shop with an injury on the board this week?"],
      ],
    },
    ask: "Mabel thinks I'm softer than I look. Don't you start.",
    trust: { label: "You're good to your crew. They know it.", reply: "...Thanks, boss. Don't spread it around." },
    callout: { label: "You yell when you're scared. Tell them what scared you.", reply: "Huh. Yeah. That's fair. That's annoyingly fair." },
    says: { about: "mabel", text: "Tommy says Mabel has brought his coffee before ten for years, and never once let him off the hook." },
  },
  {
    id: "marcus-priya",
    npc: "marcus",
    with: "priya",
    n: 2,
    title: "Over his shoulder",
    scene: "Priya is leaning on Marcus's bench, reading his screen over his shoulder.",
    lines: {
      guarded: [
        ["priya", "You've checked that heat balance three times."],
        ["marcus", "Four. And I'd appreciate not being read over my shoulder."],
        ["priya", "Sorry. Old habit from when we started. You used to like it."],
      ],
      respect: [
        ["priya", "Feedwater flow's still off by a hair. You know that, right?"],
        ["marcus", "I do. It's going in the morning note with my name on it. You can check my wording."],
        ["priya", "Look at you. Years ago you'd have put it on slide nine."],
      ],
      comfort: [
        ["priya", "Looks perfect, as always."],
        ["marcus", "Thank you. It does look good."],
        ["priya", "Coffee? You've earned one."],
      ],
      distrust: [
        ["marcus", "Did you tell Holt about my flow error before I did?"],
        ["priya", "No. I never would. But somebody did, and now you think it was me."],
        ["marcus", "I don't know what to think. Everyone's writing everyone up."],
      ],
      fear: [
        ["priya", "Is the sticker in Maintenance still wrong?"],
        ["marcus", "Don't. Not here."],
        ["priya", "Marcus. If we don't say it, who does?"],
      ],
    },
    ask: "Priya and I started the same year. She's the only one who reads my screen. Should I let her?",
    trust: { label: "Let her. She's on your side.", reply: "She is. She always was. I'll stop hiding the screen." },
    callout: { label: "She's right. Say the number before someone else does.", reply: "Yes. Fine. I'll say it at the board. You two are exhausting." },
    says: { about: "marcus", text: "Priya says Marcus checks everything four times, and used to hide the bad number on slide nine." },
  },
  {
    id: "marcus-jordan",
    npc: "marcus",
    with: "jordan",
    n: 3,
    title: "About the sticker",
    scene: "Jordan's at the coffee machine. Marcus hovers for a second before he says anything.",
    lines: {
      guarded: [
        ["marcus", "About yesterday. The sticker. I was short with you."],
        ["jordan", "You were. It's fine."],
        ["marcus", "It isn't, really. But thank you."],
      ],
      respect: [
        ["marcus", "I snapped at you over the sticker because the number was mine. That wasn't fair. I'm sorry."],
        ["jordan", "Thanks, man. Honestly? First time anyone's said sorry to me on a floor."],
        ["marcus", "Then I'll make a habit of it. Bowling Thursday?"],
      ],
      comfort: [
        ["marcus", "Hey. Yesterday was weird. Let's forget it."],
        ["jordan", "Already forgotten! Water under the bridge."],
        ["marcus", "Great. Great."],
      ],
      distrust: [
        ["jordan", "You told Elena I misread the sticker."],
        ["marcus", "I told her the sticker was misread. I didn't say by whom."],
        ["jordan", "You didn't have to. Everyone heard you."],
      ],
      fear: [
        ["marcus", "If anyone asks, the sticker was a print error."],
        ["jordan", "Was it?"],
        ["marcus", "...Just, if anyone asks."],
      ],
    },
    ask: "I owe Jordan more than that, don't I?",
    trust: { label: "He's forgiven you. Let him.", reply: "I'll try. Forgiveness is harder to take than it looks." },
    callout: { label: "Tell him exactly what you're sorry for.", reply: "...For making my mistake his problem. I'll tell him in those words. Today." },
    says: { about: "jordan", text: "Marcus says Jordan forgives faster than anyone he's met, and that it worries him." },
  },
  {
    id: "priya-tommy",
    npc: "priya",
    with: "tommy",
    n: 2,
    title: "The instrument",
    scene: "Priya is in the maintenance shop with a clipboard, watching Tommy hang a lockout.",
    lines: {
      guarded: [
        ["tommy", "Engineering's here. Should I be worried?"],
        ["priya", "No. I just like watching you do this. It's like watching someone play an instrument."],
        ["tommy", "Huh. Most engineers stand at the door and wait for the paperwork."],
      ],
      respect: [
        ["priya", "Can I time your try step? I want to teach it to the new engineers."],
        ["tommy", "Sure. And your drawing for 2A still shows one breaker. There's two. Fix that and we're even."],
        ["priya", "It's on my list. Thank you for saying it twice. I needed the second time."],
      ],
      comfort: [
        ["priya", "Lovely work as always, Tommy."],
        ["tommy", "Thanks, doc. You want to sign the walkdown?"],
        ["priya", "I'll sign it now. I've seen enough."],
      ],
      distrust: [
        ["tommy", "You here to check my work, or to watch it?"],
        ["priya", "Both, honestly. Holt wants a walkdown report on every lockout this week."],
        ["tommy", "Then put in your report that the drawing was wrong before my guy was."],
      ],
      fear: [
        ["priya", "The drawing for 2A. Is it still wrong?"],
        ["tommy", "Don't ask me that with a clipboard in your hand."],
        ["priya", "I'll put the clipboard down. Is it?"],
      ],
    },
    ask: "Tommy and I want the same thing. Why does it always sound like an argument?",
    trust: { label: "Because you both care. He trusts you more than he shows.", reply: "I think he does. I'll bring him the corrected drawing myself." },
    callout: { label: "Fix the drawing first. Then he'll believe the rest.", reply: "Yes. Drawing first, compliments second. That's the right order." },
    says: { about: "priya", text: "Tommy says Priya is the only engineer who watches the work instead of waiting for the paperwork." },
  },
  {
    id: "priya-elena",
    npc: "priya",
    with: "elena",
    n: 3,
    title: "Two people on Friday",
    scene: "Priya and Elena are at the shift board, both holding the outage schedule.",
    lines: {
      guarded: [
        ["priya", "I need two people for a walkdown on Friday morning."],
        ["elena", "I've got two people for the whole shift on Friday morning."],
        ["priya", "Then I'll take one, and I'll be the other."],
      ],
      respect: [
        ["elena", "You can have two if you walk at six instead of nine. I'll cover the gap myself."],
        ["priya", "Six it is. And thank you for telling me the real number instead of just saying no."],
        ["elena", "You never ask for padding. I never give you a fake no."],
      ],
      comfort: [
        ["priya", "Could I possibly borrow two people on Friday?"],
        ["elena", "Of course. Take whoever you need."],
        ["priya", "You're a star."],
      ],
      distrust: [
        ["elena", "Did you ask Holt for my people before you asked me?"],
        ["priya", "I asked Holt for hours. He gave me your people. I'm as annoyed as you are."],
        ["elena", "Then next time, come to me first. Please."],
      ],
      fear: [
        ["priya", "Friday's walkdown. Is it still on?"],
        ["elena", "It's on the board. Whether anyone turns up is another question."],
        ["priya", "Why wouldn't they?"],
        ["elena", "Because nobody wants their name next to anything this week."],
      ],
    },
    ask: "Elena's always short of people. Am I asking too much?",
    trust: { label: "Elena will find a way. She always does.", reply: "She will. I'll bring her a coffee and the six o'clock plan." },
    callout: { label: "Ask what it costs her shift, not just whether she can.", reply: "Yes. Can and should aren't the same question. I'll ask the second one." },
    says: { about: "elena", text: "Priya says Elena never gives her a fake no. She tells her the real number." },
  },
  {
    id: "jordan-tommy",
    npc: "jordan",
    with: "tommy",
    n: 2,
    title: "The sign-up sheet",
    scene: "Jordan is pinning the bowling sign-up sheet to the shop door. Tommy is watching him do it.",
    lines: {
      guarded: [
        ["jordan", "Thursday. Lane two. You in?"],
        ["tommy", "I'm not coming."],
        ["jordan", "You say that every week, Tommy."],
      ],
      respect: [
        ["tommy", "Put me down. Put my apprentice down too. He needs a night out after yesterday."],
        ["jordan", "Done. Hey, I heard you told him the pump story. That was a good thing to do."],
        ["tommy", "Somebody told me I yell when I'm scared. They were right. Don't tell Mabel."],
      ],
      comfort: [
        ["tommy", "Hey, about the tag thing yesterday..."],
        ["jordan", "Forget it! Bowling Thursday, everyone's coming."],
        ["tommy", "Yeah. Yeah, bowling."],
      ],
      distrust: [
        ["tommy", "A sign-up sheet on my door. So engineering can see who isn't working Thursday?"],
        ["jordan", "It's a bowling sheet, Tommy."],
        ["tommy", "Everything's a sheet this week. Somebody's always reading it."],
      ],
      fear: [
        ["jordan", "Bowling's off this week."],
        ["tommy", "Off? Since when?"],
        ["jordan", "Since nobody signed. People don't want to be seen together right now, I guess."],
      ],
    },
    ask: "Tommy says he's not coming. He always comes. Help me out?",
    trust: { label: "He'll come. He always does.", reply: "He always does. I'll save him the end lane. He likes the end lane." },
    callout: { label: "Tommy, just say yes this time.", reply: "Ha! Heard that, Tommy? Out loud, in front of witnesses. Lane two." },
    says: { about: "tommy", text: "Jordan says Tommy swears he isn't coming to bowling every single week, and then always does." },
  },
  {
    id: "jordan-holt",
    npc: "jordan",
    with: "holt",
    n: 3,
    title: "The 03:00 line",
    scene: "Holt stops at the break room door. Jordan straightens up before he can help it.",
    lines: {
      guarded: [
        ["holt", "Jordan. Tuesday's night log. Who signed the 03:00 line?"],
        ["jordan", "I did, sir. I read every line before I signed. Every one."],
        ["holt", "I wasn't asking that. But thank you."],
      ],
      respect: [
        ["holt", "Jordan. Your margin note on Tuesday's log caught a drip before it was a leak. Thank you."],
        ["jordan", "Oh. I, uh. Thanks. I almost didn't write it."],
        ["holt", "Write the next one too. Notes like that are why I read the margins."],
      ],
      comfort: [
        ["holt", "Everything good, Jordan?"],
        ["jordan", "All good, sir! Great week."],
        ["holt", "Good. Good."],
      ],
      distrust: [
        ["holt", "Jordan. Your round times don't match the camera times on Tuesday."],
        ["jordan", "The camera clock's four minutes fast. I've reported it twice."],
        ["holt", "Then I'll check the reports. And the clock."],
      ],
      fear: [
        ["holt", "Jordan, a word about Tuesday's log..."],
        ["jordan", "I'll take whatever it is. Just tell me what I did."],
        ["holt", "...You didn't do anything. I only wanted to say it was clean."],
      ],
    },
    ask: "Holt makes my stomach drop. Every time. Even when he's being nice.",
    trust: { label: "He's trying to thank you. Let him.", reply: "Yeah. Okay. I'll try to hear the thank-you first next time." },
    callout: { label: "Tell Holt how his questions land.", reply: "...You think? Okay. If you're standing there with me. I'll tell him." },
    says: { about: "holt", text: "Jordan says Holt makes his stomach drop every time, even when he's being kind." },
  },
];

export const floorKey = (id: string) => `floor:${id}`;
export const talkKey = (npc: NpcId, n: number) => `talks:${npc}:${n}`;

/**
 * The exchange that opens this talk, if any. n is which talk of the week this is with npc. The 2nd talk opens the
 * first exchange and the 3rd the second; one held back (a gift was given that talk) plays at the next talk.
 */
export function dueFloorTalk(flags: Record<string, boolean>, npc: NpcId, n: number): FloorTalk | null {
  return FLOOR_TALKS.filter((f) => f.npc === npc && f.n <= n && !flags[floorKey(f.id)]).sort((a, b) => a.n - b.n)[0] ?? null;
}

/** The exchange as dialogue lines, in the given culture. Narration has an empty speaker. */
export function floorLines(t: FloorTalk, culture: Culture): Line[] {
  const choices: Choice[] = [
    { id: `floor-${t.id}-t`, label: t.trust.label, reply: t.trust.reply, trust: 1 },
    { id: `floor-${t.id}-c`, label: t.callout.label, reply: t.callout.reply, culture: 1 },
  ];
  return [
    { speaker: "", text: t.scene, mood: "soft" },
    ...t.lines[culture].map(([who, text]) => ({ speaker: who ? SPEAKER[who] : "", text, mood: (culture === "fear" || culture === "distrust" ? "tired" : culture === "respect" ? "warm" : "even") as Line["mood"] })),
    { speaker: SPEAKER[t.npc], text: t.ask, mood: "even", choices },
  ];
}

/** What you've heard others say about this person, this week. */
export function saysAbout(flags: Record<string, boolean>, npc: NpcId): string[] {
  return FLOOR_TALKS.filter((t) => t.says.about === npc && flags[floorKey(t.id)]).map((t) => t.says.text);
}
