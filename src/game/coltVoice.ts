/**
 * Colt's plant: the same site, the same crew, one different man in the director's chair.
 *
 * The owner, 25 November 2026: the second plant has the same people and the same reactor, and a reimagined Holt
 * called Colt, "the main difference a good boss can make". Holt isn't a villain. He's careful, cold and hard to bring
 * bad news to, and the floor goes quiet when he walks in. Colt meets the same pressures (corporate at nine, budgets,
 * a blank log, an outage) and makes different choices in the same moments: he asks what happened, not who; he thanks
 * people first; he owns his mistakes out loud; he's on the floor, not behind a door.
 *
 * Nothing in the content files changes. Every line Holt speaks, and every line that names him, has a Colt version
 * here, written by hand. plantText() swaps them in for display when the shift is at Colt's plant.
 * scripts/colt-voice.test.mjs runs the content code over every state it branches on and fails if any Holt line has
 * no Colt line, so a Holt line added later can't leak into Colt's plant.
 *
 * AI-drafted: owner approval pending, and it counts toward the Steam AI disclosure.
 */
export type PlantId = "holt" | "colt";

export const PLANT_FLAG = "plant:colt";

export const COLT_FULL = "Mr. Russell Colt";

export function plantOf(flags: Record<string, boolean> | undefined): PlantId {
  return flags?.[PLANT_FLAG] ? "colt" : "holt";
}

/** Holt's line → Colt's line in the same moment. */
export const COLT_LINES: Record<string, string> = {
  // First meeting.
  "Ah. The core designer. I've been meaning to find you. I'm bad at hellos, so I'll skip it.":
    "There you are. The core designer. I came down to find you instead of sending for you. Coffee's on me.",
  "Reginald Holt. I run the site. People tell me what they think I want to hear. It makes me expensive to talk to.":
    "Russ Colt. I run the site, which mostly means I walk it. If I ever make you nervous to tell me something, tell me that too.",
  "So, a favour on day one. If you see something wrong, bring me the time, the place, and what you saw.":
    "One favour on day one. If you see something wrong, come and find me. The time and the place help, but come either way.",
  "Not how you feel about it. Can you do that?":
    "And how you feel about it is welcome too. Half our catches start as a funny feeling. Deal?",
  "Thank you. You'd be surprised how rare that is.":
    "Good. And if you ever bring me something and I get short with you, call me on it. I mean that.",
  "Then tell me you're not sure. That's information too, and I'd rather have it early.":
    "Then come and be unsure in my office. We'll be unsure together and find out. That's most of the job.",
  "Fair. But the plant won't wait for you to settle in. Neither will the first thing you find.":
    "Take a day. Elena will show you round. My door's open the minute something looks off, settled or not.",
  "Mabel will tell you I'm a cold man. She's known me since I was twenty-four. She's half right.":
    "Mabel will tell you I talk too much. She's known me since I was twenty-four. She's completely right.",

  // Everyday talk, by day.
  "How is the floor treating you? Specifics, please. 'Fine' doesn't tell me anything.":
    "How's the floor treating you? Honestly. If it's 'fine', tell me the one thing that isn't.",
  "I mean that kindly, by the way. I'm told it doesn't always sound kind.":
    "And if the answer's me, say so. I'd rather hear it from you than from a survey.",
  "Tommy has a lockout on 2A today. He'll teach you more about this site in ten minutes than I can in a week.":
    "Tommy's got a lockout on 2A today. Go and watch him. He's the best teacher on this site, and I tell him so.",
  "Listen to him. I do, though he'd never believe it.":
    "Ask him why he does it in that order. He loves that question.",
  "Corporate wants a slide about our 'safety culture'. I'd rather have one honest page than twenty slides.":
    "Corporate wants a slide about our 'safety culture'. I told them to come and have a coffee with Mabel instead.",
  "If you see something today, that page is where it goes.":
    "If you see something today, it goes on the page, and your name goes on the thank-you.",
  "There's a log in Control with a blank where a name should be. I'd like to know whose hours those were.":
    "There's a log in Control with a blank where a name should be. I'm not hunting anyone. I want to know what happened on those hours.",
  "Not to punish anyone. A blank is the one thing I can't investigate.":
    "Whoever it was is probably tired, not crooked. Let's find out which and fix the hours.",
  "Outage week. Everyone's tired, and tired people round numbers. Please don't round numbers.":
    "Outage week. Everyone's tired. If you're tired enough to round a number, come and tell me, and I'll find you a relief.",
  "When the week's done, come and tell me what I got wrong. I mean that.":
    "When the week's done, I'll buy the coffee and you tell me what I got wrong. I keep a list. It's long.",

  // The log, caught or hidden.
  "You wouldn't sign that blank log. It held up a turnover by twenty minutes. Thank you for those twenty minutes.":
    "You wouldn't sign that blank log. It held a turnover twenty minutes. Best twenty minutes of the week. I told the whole morning meeting.",
  "People are starting to say things out loud on this floor. I can see it in the reports. That isn't nothing.":
    "People are saying things out loud on this floor. I can hear it in the break room. That's the whole job, and you're part of it.",
  "Your initials are on a log line for hours you didn't stand. I'd like to hear why from you first.":
    "Your initials are on a log line for hours you didn't stand. I'm not angry. I'd just like to understand what made that feel like the right call.",
  "I'm not going to shout. I've sat on your side of this desk. Come and see me before the day's out.":
    "I did the same thing my first year, for the same reason, I'd bet. Come and see me today. We'll fix the line together.",

  // Welcome back.
  "Welcome back. Same favour as last week: times and places.": "Welcome back. Good to see you. Same deal as last week: come and find me.",
  "I read every line you wrote last week. Twice. Thank you.": "I read every line you wrote last week. I read the good ones out at the Monday meeting. Hope you don't mind.",
  "Your seat on the review board is still yours. Last vote, as before.": "Your seat on the review board's still yours. Last vote, as before. Bring the awkward questions.",

  // End of the week.
  "Three hides. I can't build a review on blanks. I'd like to try again next week. With you.":
    "Three things hidden. That tells me the floor didn't feel safe enough to say them, and that's on me before it's on you. Next week, we fix that together.",
  "This week didn't hold. Come and see me Monday. I'd rather understand it than grade it.":
    "This week didn't hold. Come and see me Monday, and I'll bring my part of it too. There's always a part that's mine.",
  "Your initials are on a blank from this week. We held, but that's the line I'll be asked about.":
    "Your initials are on a blank from this week. We held. Let's sit down and put a real line there, and I'll take the questions about it.",
  "I can fund what you caught. The hides I have to explain. I'd rather we had none to explain.":
    "What you caught, I'll fund. What got hidden, I want to understand. Was there a moment you didn't feel you could say it?",
  "You wouldn't sign a blank. That's the line I'll read out at the review, with your name on it.":
    "You wouldn't sign a blank. I'm reading that out at the review, with your name on it, and I'm buying the coffee after.",
  "A quiet week, and no blanks. I'll take it. Next week, bring me more times and places.":
    "A quiet week, and no blanks. Thank you. Next week, come and tell me the small stuff too. The small stuff is where it starts.",

  // Trust scenes.
  "People bring me adjectives. 'Concerning.' 'Robust.' 'A bit off.' I can't do anything with an adjective.":
    "People bring me adjectives. 'Concerning.' 'A bit off.' I used to send them away for a better word. Now I go and look with them.",
  "Give me a time, a place, and what you saw. That I can act on. That I can fund.":
    "A time and a place help me act. But 'a bit off' gets me out of my chair too.",
  "I know I'm hard to bring bad news to. I've been told. I'm trying to be easier.":
    "I want to be the easiest person on this site to bring bad news to. Tell me when I'm not.",
  "Will you help me with that?": "Will you keep me honest on that?",
  "Unedited is the only kind I read twice. Thank you.": "Unedited is the only kind worth having. And I'll say thank you every time, even when it hurts.",
  "Enough that nobody remembers the first one. That's when it's just how we work.":
    "There's no enough. When nobody remembers the first one, it's just how we work. That's the goal.",
  "Every year, the review budget is the first line I defend. Do you know why?":
    "Every year, the review budget is the first line I defend. Want to know why?",
  "The director before me cut it. Saved a little money. Six months later, a pump ran with a tag still on it.":
    "The director before me wanted to cut it. Six months earlier, a pump had run with a tag still on it.",
  "Nobody was hurt. The mechanic had stepped away for a radio. Thirty seconds, either way.":
    "Nobody was hurt. The mechanic had stepped away for a radio. He came and told me himself, shaking. I've never forgotten that he came.",
  "I was his deputy. I signed the cut with him. I've been paying it back ever since.":
    "I was the deputy. I said no, out loud, in the meeting. It nearly cost me the job. It's the best thing I've done here.",
  "I'm telling you because one day you'll sit in a chair like this one.":
    "I'm telling you because one day somebody will ask you to sign something quiet. You can say no out loud too.",
  "Keep it used. Funded is easy. Used is the hard part.": "Keep it used. Funded is easy. Used means people trust it enough to come.",
  "Because you've brought me times and places all week. And because somebody should have told me.":
    "Because you've been honest with me all week, and I'd like to be honest back.",
  "I've put you on Thursday's review board. You can say no.": "Would you sit on Thursday's review board? I'd like you there. You can say no.",
  "You'll vote last. The most junior vote always goes last here, so it can't be an echo of mine.":
    "You'll vote last, and I'll vote after you. The most junior vote goes first-but-one here, so nobody's echoing me.",
  "My first board, I voted with my boss because I wanted his job. I got the job. I still think about that vote.":
    "My first board, I voted with my boss because I wanted his job. I told him so a year later. He laughed. Then he changed how the votes go.",
  "Questions?": "What do you think?",
  "That's the only vote I need from you. Thank you for taking it on.": "That's the only vote I ever want from anyone. Welcome to the board.",
  "Then say it in the room, out loud. That's exactly what going last is for. I'll thank you for it.":
    "Then disagree with me in the room. I'll thank you for it in front of everyone, so they all see it's safe.",

  // Crew moment: the log, read twice.
  "I read your log last night. Twice.": "I read your log last night. Can I show you my favourite line?",
  "There's a correction on yesterday's entry. A line through it, your initials, the right number beside it.":
    "This one. A line through the wrong number, your initials, the right one beside it. That's a beautiful log.",
  "Most logs I read are perfect. They're perfect because somebody fixed them afterwards.":
    "Perfect logs worry me. They usually mean somebody tidied them afterwards.",
  "Early on, I tidied a log so a shift would look cleaner to my supervisor.":
    "Early on, I tidied a log so a shift would look cleaner. My supervisor found it and sat me down. He wasn't angry. He was sad.",
  "It cost us three days in an investigation, because the record didn't match what happened.":
    "He showed me what a messy, honest log had saved us the year before. I've never tidied one since.",
  "So, thank you for leaving it honest. It makes my job possible.": "So, thank you. Leave every correction in. I'll frame them if I have to.",
  "It looks like the truth. That's all a log has to look like. Leave the corrections in. I'll back you every time.":
    "It looks like the truth. That's what a log is for. Anyone who says otherwise can come and see me.",
  "The mistake was a number. The correction is the part I trust. If anyone gives you grief for one, send them to me.":
    "Annoyed? I'm delighted. The mistake was a number. The correction is the part I trust.",

  // Overheard: Mabel and Colt at the counter.
  "Just the coffee, Mabel. I have corporate at nine.": "Two coffees, Mabel. One's for whoever looks like they need it most.",
  "Standing is faster. And please don't call me that in front of the new engineer.":
    "Go on then, two minutes. And call me what you like, the new engineer should know I was a terrible junior.",
  "I did. You're right. I'll tell him so this morning.": "I did. I went and found him straight after and said sorry. He finished his point. It was a good one.",
  "Have I? The review went well, I suppose. Nobody raised anything.":
    "Nobody raised anything at the review. That worries me more than a long list would.",
  "Someone filed an anonymous note about the night log. Was it you?":
    "Someone filed an anonymous note about the night log. I'm glad they wrote it. I wish they'd felt they could sign it.",
  "Then who? Everyone's writing things down about everyone this week.":
    "I believe you. If people are writing notes instead of talking, that's my problem to fix, not theirs.",
  "Morning. Is the floor quiet?": "Morning. The floor's quiet. Too quiet. What am I missing?",
  "Quiet is fine. Quiet is good.": "Then I'm going to go and sit in the break room until somebody tells me.",

  // Overheard: Colt and Elena.
  "Elena. Your read on the floor, before anyone else's.": "Elena. Walk with me? I want your read, and then I want to go and get everyone else's.",
  "Nobody, or nothing? Those are different.": "Nobody, or nothing? Let's go and ask. I'll buy the break room doughnuts.",
  "Agreed. And your second look caught my mistake on the night schedule. Thank you.":
    "Agreed. And you caught my mistake on the night schedule. Thank you. I'll say that in the meeting too.",
  "How's the floor?": "How's the floor? Not the nice version.",
  "Good. Then I won't ask any further.": "Good. Is anybody laughing so they don't have to say something? I'll ask around.",
  "Names?": "I don't want names. I want to know what's making it hard to talk to each other.",
  "Anything I should know?": "Anything I should know? Even the half-formed stuff.",
  "And off paper?": "Off paper is where I want to start. What's making people tired?",
  "You've walked the floor. Is Elena's read the whole read?": "You've walked the floor too. Is Elena's read the whole read? I'd like yours.",
  "So would I. I'll keep asking her first.": "So would I. I'll keep asking her, and I'll keep walking it myself.",
  "Fair. If I only ask Elena, I only hear what Elena can carry. I'll walk it Thursday.":
    "You're right. If I only ask Elena, she carries the whole floor. I'll walk it this afternoon.",

  // Overheard: Colt and Priya.
  "You always write down why. It's always good. The budget is still the budget.":
    "You always write down why, and it's always good. Let's find the hours together. What can I move?",
  "I read your request twice. You're right about the bottom nozzles. Approved.":
    "I walked the bottom nozzles with your request in my hand. You're right. Approved, and thank you.",
  "That's why I approve yours. You never ask for padding.": "That's why I'll always find hours for yours. You never ask for padding.",
  "Approved, as always.": "I've read it. Approved. One question on page two, though.",
  "I trust you. Isn't that enough?": "I trust you, which is exactly why I read it. Trust and reading aren't the same thing.",
  "Corporate asked why reactor engineering overspends on walkdowns. Did you go over my head?":
    "Corporate asked why reactor engineering spends so much on walkdowns. I told them it's the best money we spend. Thought you should hear that from me.",
  "I might have to. That's where we are this week.": "I don't need to read anything. If people are scared to ask, that's my fault. Let's fix it.",
  "Why?": "Why? You were right to ask.",
  "Priya always walks it. Is she right to push me this hard?": "Priya always walks it. Is she right to push this hard? Honestly.",
  "No, she hasn't. Approved. Tell her it was your idea. She'll enjoy that.":
    "No, she hasn't. Approved. And I'll tell her you spoke up for her.",
  "Yes. If I say no without the reason, she has to guess. I'll show her the whole sheet.":
    "Yes. If I ever say no, she gets the whole sheet and a seat at the table. I'll start today.",

  // Overheard: Colt and Jordan.
  "Jordan. Tuesday's night log. Who signed the 03:00 line?": "Jordan, got a minute? Tuesday's night log, the 03:00 line. That was you, right?",
  "I wasn't asking that. But thank you.": "I know you did. I wanted to say it was a good line. Sorry, I made that sound like trouble.",
  "Jordan. Your margin note on Tuesday's log caught a drip before it was a leak. Thank you.":
    "Jordan. Your margin note on Tuesday's log caught a drip before it was a leak. You're on the board at Monday's meeting. As a thank-you.",
  "Write the next one too. Notes like that are why I read the margins.": "Write the next one too. I read the margins first.",
  "Everything good, Jordan?": "How are you actually doing, Jordan? Not the shift. You.",
  "Good. Good.": "Great week's good. Is there a not-great part? There usually is.",
  "Jordan. Your round times don't match the camera times on Tuesday.":
    "Jordan, the camera clock and your round times disagree on Tuesday. I'd bet on you. Help me prove it?",
  "Then I'll check the reports. And the clock.": "Then the clock's wrong and the reports didn't get answered. That's ours to fix, not yours.",
  "Jordan, a word about Tuesday's log...": "Jordan! Good news about Tuesday's log.",
  "...You didn't do anything. I only wanted to say it was clean.":
    "Nothing wrong. I should have opened with that. It was clean. Thank you.",

  // Morning briefs.
  "Holt: You signed the core on paper. Today, go and meet it. If something's wrong, bring me the time and place.":
    "Colt: You signed the core on paper. Today, go and meet it. Anything looks off, come and find me.",
  "Holt: Tommy has a lockout on pump 2A today. Watch how he does it. And please, one Academy module.":
    "Colt: Tommy has a lockout on pump 2A. Watch him, and ask him why. One Academy module if you can.",
  "Holt: A dose sticker in Maintenance reads high. Marcus will hope it's a typo. Be kind. Say the number anyway.":
    "Colt: A dose sticker in Maintenance reads high. Say the number with Marcus, not at him.",
  "Holt: A log in Control has no initials. I need to know who stood those hours. Close the day with me.":
    "Colt: A log in Control has no initials. Nobody's in trouble. Let's find out what happened.",
  "Holt: Outage week. You program the fuel shuffle today. Teaching model, not a license. Take your time.":
    "Colt: Outage week. You program the fuel shuffle today. Teaching model. Take all the time it needs.",

  "Holt: Flux map today. Find where the power actually peaks, and tell Priya before she tells you.":
    "Colt: Flux map today. Find where the power peaks. Priya's saved you a seat, and so have I.",

  // End of day.
  "Holt: Times and places, all week. That's a review I can actually fund. Thank you.":
    "Colt: You came and found me every time this week. Thank you. That's what makes this place work.",
  "Holt: You're skilled. That was never the question. The question is whether the floor is safe enough to use it.":
    "Colt: You're skilled. My job is making the floor safe enough for you to use it. Tell me where I fell short.",

  // Night 4.
  "Holt. Last night of the rotation. I won't keep you.": "Colt here. Last night of the rotation. Just ringing to say thanks. How are you holding up?",
  "Whatever the board says at six, I want the log honest more than I want it clean. Thank you for standing these.":
    "Whatever the board says at six, write it the way it happened. And get some sleep after. That's an order, kindly meant.",
  "Holt. We're standing it again. That's the system working, not failing. Thank you for standing it.":
    "Colt here. We're standing it again. That's the system working. Thank you, and I've sent a coffee down.",

  // People talking about him.
  "Reggie came in and asked how you were getting on. Don't tell him I call him Reggie.":
    "Russ came by and asked how you were getting on. He asks about everyone. He means it every time.",
  "How's the first day? Survived Holt yet? He's not as scary as he looks. He's exactly as scary as he looks.":
    "How's the first day? Met Colt yet? He'll ask how you're doing and then actually wait for the answer. Takes some getting used to.",
  "My first year as senior, I led a meeting with all the good news. The bad number was on slide nine. Holt found it.":
    "My first year as senior, I led a meeting with all the good news. The bad number was on slide nine. Colt asked me to start with it next time. Kindly.",
  "His first year as senior, he put the bad number on slide nine. Holt found it. Now he wants the ugly number first.":
    "His first year as senior, he put the bad number on slide nine. Colt asked him to lead with it. Now he wants the ugly number first.",
  "Holt wrote it down, said thank you, and went on to the next item. That was it. That was the whole thing.":
    "Colt wrote it down, thanked me in front of the room, and asked what I needed. That was it. That was the whole thing.",
  "He told the board about the flow. Holt said thank you and moved on. It cost him nothing he needed.":
    "He told the board about the flow. Colt thanked him in front of the room. It cost him nothing he needed.",
  "Holt read your log twice, and told you about the log he once rewrote.": "Colt showed you his favourite line in your log, and told you about the log he once tidied.",
  "Holt is at the café counter, waiting for a cup. Mabel takes her time with it.":
    "Colt is at the café counter, buying a round. Mabel takes her time with it, on purpose.",
  "You've had corporate at nine for fifteen years, Reggie. Sit for two minutes.": "Sit for two minutes, Russ. You always say yes to two minutes.",
  "You heard that. What would you tell Reggie, if he'd listen?": "You heard that. He always listens. What would you tell him?",
  "You cut Marcus off in the review yesterday, Reggie. Before he'd finished.": "You cut Marcus off in the review yesterday, Russ. Before he'd finished.",
  "If I had something to say to you, Reggie, I'd say it to your face. Like I always have.":
    "Wasn't me, Russ. If I had something to say, I'd say it to your face. Like I always have.",
  Reggie: "Russ",
  "Mabel says Holt was the best junior she ever trained, and the worst at saying sorry.":
    "Mabel says Colt was the worst junior she ever trained, and the quickest to say sorry.",
  "Somebody told Holt I left the turbine round early. I didn't. I want to know who.":
    "Somebody wrote a note saying I left the turbine round early. Colt asked me about it straight. I didn't, and he believed me. I still want to know who wrote it.",
  "Elena is in Holt's doorway with the morning sheet. He waves her in ahead of you.":
    "Colt is in Elena's doorway with two coffees and the morning sheet. He waves you in too.",
  "Holt asks Elena's read on the floor before anyone's. She won't hand him names.":
    "Colt asks Elena's read on the floor, then walks it himself. He's never once asked her for names.",
  "Priya's walkdown request is on Holt's desk. It's her third this month. She's standing beside it.":
    "Priya's walkdown request is on Colt's desk. It's her third this month. He's pulled up a chair for her.",
  "Holt says Priya has never once padded a request, and approves hers because of it.":
    "Colt says Priya has never once padded a request, and tells corporate so whenever they ask.",
  "That was me. Holt asked. I'm sorry I didn't tell you first.": "That was me. Colt asked how the week was going. I'm sorry I didn't tell you first.",
  "Did you tell Holt about my flow error before I did?": "Did you tell Colt about my flow error before I could?",
  "Both, honestly. Holt wants a walkdown report on every lockout this week.":
    "Both, honestly. Colt wants us to walk every lockout this week. He's walking them too.",
  "Did you ask Holt for my people before you asked me?": "Did you ask Colt for my people before you asked me?",
  "I asked Holt for hours. He gave me your people. I'm as annoyed as you are.":
    "I asked Colt for hours. He said ask you first. I didn't. That's on me.",
  "Holt stops at the break room door. Jordan straightens up before he can help it.":
    "Colt stops at the break room door with a box of doughnuts. Jordan straightens up out of habit, then laughs at himself.",
  "Holt makes my stomach drop. Every time. Even when he's being nice.":
    "My old boss made my stomach drop. Colt doesn't. I'm still waiting for the catch.",
  "Tell Holt how his questions land.": "Tell Colt about your old boss. He'd want to know.",
  "Jordan says Holt makes his stomach drop every time, even when he's being kind.":
    "Jordan says Colt is the first boss who never made his stomach drop, and he's still waiting for the catch.",
  "You refuse to initial someone else's blank. Holt gets a sentence with a time on it.":
    "You refuse to initial someone else's blank. Colt gets a sentence with a time on it, and says thank you.",
  "He's waiting to see whether you bring him times and places.": "He's already asked how your week is going. He waited for the answer.",
  "He's started telling you things before he has to.": "He tells you things before you ask, and asks before he tells.",
  "Holt calls the desk": "Colt calls the desk",
  'Reggie doesn\'t take presents. Never has. He\'d only file it under "gifts, declared".':
    "Russ won't take a toy. He's the one leaving things on desks round here. Check yours.",
  "Mr. Reginald Holt": COLT_FULL,
  "Runs the site. Wants times and places, not adjectives. Knows people are scared to tell him things, and hates it.":
    "Runs the site, mostly on foot. Buys the coffee. Asks how you are and waits for the answer. People tell him things early.",
  "You signed the core. Now go and meet it, and bring me what you see.": "You signed the core. Go and meet it. I'll come and find you at lunch to hear what you saw.",
  "He stands up when you come in. Someone once told him he didn't.": "He's already standing when you come in, holding two coffees. One's yours.",
  "Times and places, please.": "Come and find me. Any time.",

  // How people stand with him.
  "Elena's uneasy about Valve 14. Holt can tell, and can't help until someone says it.":
    "Elena's uneasy about Valve 14. Colt noticed and asked her straight. She's thinking about it.",
  "Holt asked Elena how you did on Valve 14. She told him. It was good.": "Colt asked Elena how you did on Valve 14. She told him. He came and said thanks himself.",
  "Holt asks Elena's opinion before anyone else's. Neither of them mentions it.": "Colt asks Elena's opinion, then everyone else's. She likes that he does both.",
  "Priya won't sign a week with a gap in it. Holt won't ask her to.": "Priya won't sign a week with a gap in it. Colt told her he'd never ask her to.",
  "Holt read your signed log out to Priya. She's walking it anyway. He expected that.":
    "Colt read your signed log out to Priya. She's walking it anyway. He went with her.",
  "Priya keeps asking Holt for walkdown hours. He keeps saying yes, slowly.": "Priya asks Colt for walkdown hours. He finds them, and asks what else she needs.",
  "Holt · Elena": "Colt · Elena",
  "Priya · Holt": "Priya · Colt",

  // Sim strings, shown through plantText.
  "Control Room — Holt wants volume, not a speech.": "Control Room — Colt's door is open. Go and say hello.",
  "Find Holt. Afternoon check-in.": "Find Colt. Afternoon check-in.",
  "Afternoon. The stack's shadow is long. Holt will want a real answer.": "Afternoon. The stack's shadow is long. Colt will want to know how the day went.",
};

/** Lines built from numbers. */
export const COLT_PATTERNS: [RegExp, string][] = [
  [/^(\d+) written up, (.+)\. That's a review I can defend\. Thank you\.$/, "$1 written up, $2. Every one of those has your name on it at the review. Thank you."],
  [/^Parlor board\. (.*) Volume I can use\.$/, "Parlor board. $1 Good to see you having fun."],
];

/** Lines where only the name changes, because the line is the same at either plant. */
export const NAME_SWAP_OK: string[] = [
  "06:52  ·  Morning brief  ·  Holt",
  "06:50  ·  Morning brief  ·  Holt",
  "06:48  ·  Morning brief  ·  Holt",
  "06:51  ·  Morning brief  ·  Holt",
  "06:40  ·  Morning brief  ·  Holt",
  "Afternoon check-in with Holt.",
  "Afternoon check-in with Holt",
  "Close the week with Holt",
];

/** Keys for lines the content scan can't reach (sim.ts strings, variant asks). */
export const EXTRA_KEYS: string[] = [
  "Control Room — Holt wants volume, not a speech.",
  "Find Holt. Afternoon check-in.",
  "Afternoon. The stack's shadow is long. Holt will want a real answer.",
  "Your seat on the review board is still yours. Last vote, as before.",
];

export function coltWritten(t: string): boolean {
  return Object.prototype.hasOwnProperty.call(COLT_LINES, t) || COLT_PATTERNS.some(([r]) => r.test(t));
}

function swapName(t: string): string {
  return t
    .replace(/Mr\. Reginald Holt/g, COLT_FULL)
    .replace(/Reginald Holt/g, "Russell Colt")
    .replace(/Reggie/g, "Russ")
    .replace(/Holt/g, "Colt");
}

/** What a line says at this plant. Holt's plant is untouched. */
export function plantText(t: string, plant: PlantId | string): string {
  if (plant !== "colt" || !t) return t;
  if (Object.prototype.hasOwnProperty.call(COLT_LINES, t)) return COLT_LINES[t];
  for (const [r, rep] of COLT_PATTERNS) if (r.test(t)) return t.replace(r, rep);
  return swapName(t);
}

/** Speaker names on dialogue lines. */
export function plantSpeaker(name: string, plant: PlantId | string): string {
  return plant === "colt" ? swapName(name) : name;
}

/**
 * Colt leaves small things on desks. One a day, in the morning brief at his plant. The player finds them; nobody
 * mentions them.
 */
export const COLT_DESK: string[] = [
  "On your desk: a coffee, still hot, and a sticky note. \"Welcome. Ask me anything. — R.C.\"",
  "On your desk: a spare pair of safety glasses, your size. \"Saw yours were scratched. — R.C.\"",
  "On your desk: a printout of Marcus's best catch from last year, with \"ask him about this\" in the margin.",
  "On your desk: your chair doesn't squeak any more. Someone oiled it.",
  "On your desk: a note. \"Whatever happens at the shuffle, I'm proud of this week. — R.C.\"",
];

export function coltDeskNote(day: number): string {
  return COLT_DESK[Math.max(0, Math.min(COLT_DESK.length - 1, day - 1))];
}

interface VoicedLine {
  speaker: string;
  text: string;
  choices?: { label: string; reply: string }[];
}

/** A conversation as it plays at Colt's plant. Returns copies: the content arrays are shared. */
export function coltDialogue<L extends VoicedLine>(lines: L[]): L[] {
  return lines.map((l) => ({
    ...l,
    speaker: plantSpeaker(l.speaker, "colt"),
    text: plantText(l.text, "colt"),
    ...(l.choices ? { choices: l.choices.map((c) => ({ ...c, label: plantText(c.label, "colt"), reply: plantText(c.reply, "colt") })) } : {}),
  }));
}

/** A night scene card (rotationScenes.ts) at this plant. */
export function plantScene<S extends { title: string; lines: { text: string }[] }>(scene: S, plant: PlantId): S {
  if (plant !== "colt") return scene;
  return { ...scene, title: plantText(scene.title, "colt"), lines: scene.lines.map((l) => ({ ...l, text: plantText(l.text, "colt") })) };
}
