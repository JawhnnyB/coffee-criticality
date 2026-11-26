# Two plants: draft for owner approval

AI-drafted. Needs the owner's approval, and counts toward the Steam AI disclosure.

## What changed

- **Ten weeks.** Each three-week block is one fuel cycle: start, middle, end. Fuel shuffles happen on the Friday of weeks 3, 6 and 9. Every other Friday is a **flux map**: no fuel moves, you find the peak of the core you signed last time by reading detectors one assembly at a time. Week 10 is the **equilibrium core**: three reloads have taken out every starting assembly. A tap on the strip above each morning brief shows the cycle in numbers (teaching numbers, typical of a large PWR).
- **Stand-down.** At Holt's plant, a week that ends in Fear makes the next week a stand-down: Holt calls everyone in, and the brief and his lines change. If the stand-down week ends in Fear too, you **request a transfer**: an honest ending, and the way into Colt's plant.
- **Colt's plant.** Pick it on the title screen, or arrive by transfer. Same crew, same reactor, same incidents. The director is **Mr. Russell Colt** ("Russ" to Mabel). The floor starts 3 points ahead on trust and on calling things out, and it takes three hides, not two, to put heads down. Your choices still move it. No stand-downs: if heads go down, Colt buys the coffee and asks what he did. Every morning he leaves something on your desk.
- Each plant keeps its own week and its own crew memory. A week abandoned before its ending replays.
- Saves from before this change play as the original single week, unchanged.

## Decisions for the owner

- Colt's first name. I used Russell ("Russ").
- Colt uses Holt's portrait and sprite for now. He needs his own art.
- Week 1 now ends in a flux map, not the shuffle. The first shuffle is week 3.
- The three-point head start and three-hide limit at Colt's plant.

## Every Holt line and its Colt line

2 lines are built from numbers: see `COLT_PATTERNS` in `src/game/coltVoice.ts`.

| Holt's plant | Colt's plant |
|---|---|
| Ah. The core designer. I've been meaning to find you. I'm bad at hellos, so I'll skip it. | There you are. The core designer. I came down to find you instead of sending for you. Coffee's on me. |
| Reginald Holt. I run the site. People tell me what they think I want to hear. It makes me expensive to talk to. | Russ Colt. I run the site, which mostly means I walk it. If I ever make you nervous to tell me something, tell me that too. |
| So, a favour on day one. If you see something wrong, bring me the time, the place, and what you saw. | One favour on day one. If you see something wrong, come and find me. The time and the place help, but come either way. |
| Not how you feel about it. Can you do that? | And how you feel about it is welcome too. Half our catches start as a funny feeling. Deal? |
| Thank you. You'd be surprised how rare that is. | Good. And if you ever bring me something and I get short with you, call me on it. I mean that. |
| Then tell me you're not sure. That's information too, and I'd rather have it early. | Then come and be unsure in my office. We'll be unsure together and find out. That's most of the job. |
| Fair. But the plant won't wait for you to settle in. Neither will the first thing you find. | Take a day. Elena will show you round. My door's open the minute something looks off, settled or not. |
| Mabel will tell you I'm a cold man. She's known me since I was twenty-four. She's half right. | Mabel will tell you I talk too much. She's known me since I was twenty-four. She's completely right. |
| How is the floor treating you? Specifics, please. 'Fine' doesn't tell me anything. | How's the floor treating you? Honestly. If it's 'fine', tell me the one thing that isn't. |
| I mean that kindly, by the way. I'm told it doesn't always sound kind. | And if the answer's me, say so. I'd rather hear it from you than from a survey. |
| Tommy has a lockout on 2A today. He'll teach you more about this site in ten minutes than I can in a week. | Tommy's got a lockout on 2A today. Go and watch him. He's the best teacher on this site, and I tell him so. |
| Listen to him. I do, though he'd never believe it. | Ask him why he does it in that order. He loves that question. |
| Corporate wants a slide about our 'safety culture'. I'd rather have one honest page than twenty slides. | Corporate wants a slide about our 'safety culture'. I told them to come and have a coffee with Mabel instead. |
| If you see something today, that page is where it goes. | If you see something today, it goes on the page, and your name goes on the thank-you. |
| There's a log in Control with a blank where a name should be. I'd like to know whose hours those were. | There's a log in Control with a blank where a name should be. I'm not hunting anyone. I want to know what happened on those hours. |
| Not to punish anyone. A blank is the one thing I can't investigate. | Whoever it was is probably tired, not crooked. Let's find out which and fix the hours. |
| Outage week. Everyone's tired, and tired people round numbers. Please don't round numbers. | Outage week. Everyone's tired. If you're tired enough to round a number, come and tell me, and I'll find you a relief. |
| When the week's done, come and tell me what I got wrong. I mean that. | When the week's done, I'll buy the coffee and you tell me what I got wrong. I keep a list. It's long. |
| You wouldn't sign that blank log. It held up a turnover by twenty minutes. Thank you for those twenty minutes. | You wouldn't sign that blank log. It held a turnover twenty minutes. Best twenty minutes of the week. I told the whole morning meeting. |
| People are starting to say things out loud on this floor. I can see it in the reports. That isn't nothing. | People are saying things out loud on this floor. I can hear it in the break room. That's the whole job, and you're part of it. |
| Your initials are on a log line for hours you didn't stand. I'd like to hear why from you first. | Your initials are on a log line for hours you didn't stand. I'm not angry. I'd just like to understand what made that feel like the right call. |
| I'm not going to shout. I've sat on your side of this desk. Come and see me before the day's out. | I did the same thing my first year, for the same reason, I'd bet. Come and see me today. We'll fix the line together. |
| Welcome back. Same favour as last week: times and places. | Welcome back. Good to see you. Same deal as last week: come and find me. |
| I read every line you wrote last week. Twice. Thank you. | I read every line you wrote last week. I read the good ones out at the Monday meeting. Hope you don't mind. |
| Your seat on the review board is still yours. Last vote, as before. | Your seat on the review board's still yours. Last vote, as before. Bring the awkward questions. |
| Three hides. I can't build a review on blanks. I'd like to try again next week. With you. | Three things hidden. That tells me the floor didn't feel safe enough to say them, and that's on me before it's on you. Next week, we fix that together. |
| This week didn't hold. Come and see me Monday. I'd rather understand it than grade it. | This week didn't hold. Come and see me Monday, and I'll bring my part of it too. There's always a part that's mine. |
| Your initials are on a blank from this week. We held, but that's the line I'll be asked about. | Your initials are on a blank from this week. We held. Let's sit down and put a real line there, and I'll take the questions about it. |
| I can fund what you caught. The hides I have to explain. I'd rather we had none to explain. | What you caught, I'll fund. What got hidden, I want to understand. Was there a moment you didn't feel you could say it? |
| You wouldn't sign a blank. That's the line I'll read out at the review, with your name on it. | You wouldn't sign a blank. I'm reading that out at the review, with your name on it, and I'm buying the coffee after. |
| A quiet week, and no blanks. I'll take it. Next week, bring me more times and places. | A quiet week, and no blanks. Thank you. Next week, come and tell me the small stuff too. The small stuff is where it starts. |
| People bring me adjectives. 'Concerning.' 'Robust.' 'A bit off.' I can't do anything with an adjective. | People bring me adjectives. 'Concerning.' 'A bit off.' I used to send them away for a better word. Now I go and look with them. |
| Give me a time, a place, and what you saw. That I can act on. That I can fund. | A time and a place help me act. But 'a bit off' gets me out of my chair too. |
| I know I'm hard to bring bad news to. I've been told. I'm trying to be easier. | I want to be the easiest person on this site to bring bad news to. Tell me when I'm not. |
| Will you help me with that? | Will you keep me honest on that? |
| Unedited is the only kind I read twice. Thank you. | Unedited is the only kind worth having. And I'll say thank you every time, even when it hurts. |
| Enough that nobody remembers the first one. That's when it's just how we work. | There's no enough. When nobody remembers the first one, it's just how we work. That's the goal. |
| Every year, the review budget is the first line I defend. Do you know why? | Every year, the review budget is the first line I defend. Want to know why? |
| The director before me cut it. Saved a little money. Six months later, a pump ran with a tag still on it. | The director before me wanted to cut it. Six months earlier, a pump had run with a tag still on it. |
| Nobody was hurt. The mechanic had stepped away for a radio. Thirty seconds, either way. | Nobody was hurt. The mechanic had stepped away for a radio. He came and told me himself, shaking. I've never forgotten that he came. |
| I was his deputy. I signed the cut with him. I've been paying it back ever since. | I was the deputy. I said no, out loud, in the meeting. It nearly cost me the job. It's the best thing I've done here. |
| I'm telling you because one day you'll sit in a chair like this one. | I'm telling you because one day somebody will ask you to sign something quiet. You can say no out loud too. |
| Keep it used. Funded is easy. Used is the hard part. | Keep it used. Funded is easy. Used means people trust it enough to come. |
| Because you've brought me times and places all week. And because somebody should have told me. | Because you've been honest with me all week, and I'd like to be honest back. |
| I've put you on Thursday's review board. You can say no. | Would you sit on Thursday's review board? I'd like you there. You can say no. |
| You'll vote last. The most junior vote always goes last here, so it can't be an echo of mine. | You'll vote last, and I'll vote after you. The most junior vote goes first-but-one here, so nobody's echoing me. |
| My first board, I voted with my boss because I wanted his job. I got the job. I still think about that vote. | My first board, I voted with my boss because I wanted his job. I told him so a year later. He laughed. Then he changed how the votes go. |
| Questions? | What do you think? |
| That's the only vote I need from you. Thank you for taking it on. | That's the only vote I ever want from anyone. Welcome to the board. |
| Then say it in the room, out loud. That's exactly what going last is for. I'll thank you for it. | Then disagree with me in the room. I'll thank you for it in front of everyone, so they all see it's safe. |
| I read your log last night. Twice. | I read your log last night. Can I show you my favourite line? |
| There's a correction on yesterday's entry. A line through it, your initials, the right number beside it. | This one. A line through the wrong number, your initials, the right one beside it. That's a beautiful log. |
| Most logs I read are perfect. They're perfect because somebody fixed them afterwards. | Perfect logs worry me. They usually mean somebody tidied them afterwards. |
| Early on, I tidied a log so a shift would look cleaner to my supervisor. | Early on, I tidied a log so a shift would look cleaner. My supervisor found it and sat me down. He wasn't angry. He was sad. |
| It cost us three days in an investigation, because the record didn't match what happened. | He showed me what a messy, honest log had saved us the year before. I've never tidied one since. |
| So, thank you for leaving it honest. It makes my job possible. | So, thank you. Leave every correction in. I'll frame them if I have to. |
| It looks like the truth. That's all a log has to look like. Leave the corrections in. I'll back you every time. | It looks like the truth. That's what a log is for. Anyone who says otherwise can come and see me. |
| The mistake was a number. The correction is the part I trust. If anyone gives you grief for one, send them to me. | Annoyed? I'm delighted. The mistake was a number. The correction is the part I trust. |
| Just the coffee, Mabel. I have corporate at nine. | Two coffees, Mabel. One's for whoever looks like they need it most. |
| Standing is faster. And please don't call me that in front of the new engineer. | Go on then, two minutes. And call me what you like, the new engineer should know I was a terrible junior. |
| I did. You're right. I'll tell him so this morning. | I did. I went and found him straight after and said sorry. He finished his point. It was a good one. |
| Have I? The review went well, I suppose. Nobody raised anything. | Nobody raised anything at the review. That worries me more than a long list would. |
| Someone filed an anonymous note about the night log. Was it you? | Someone filed an anonymous note about the night log. I'm glad they wrote it. I wish they'd felt they could sign it. |
| Then who? Everyone's writing things down about everyone this week. | I believe you. If people are writing notes instead of talking, that's my problem to fix, not theirs. |
| Morning. Is the floor quiet? | Morning. The floor's quiet. Too quiet. What am I missing? |
| Quiet is fine. Quiet is good. | Then I'm going to go and sit in the break room until somebody tells me. |
| Elena. Your read on the floor, before anyone else's. | Elena. Walk with me? I want your read, and then I want to go and get everyone else's. |
| Nobody, or nothing? Those are different. | Nobody, or nothing? Let's go and ask. I'll buy the break room doughnuts. |
| Agreed. And your second look caught my mistake on the night schedule. Thank you. | Agreed. And you caught my mistake on the night schedule. Thank you. I'll say that in the meeting too. |
| How's the floor? | How's the floor? Not the nice version. |
| Good. Then I won't ask any further. | Good. Is anybody laughing so they don't have to say something? I'll ask around. |
| Names? | I don't want names. I want to know what's making it hard to talk to each other. |
| Anything I should know? | Anything I should know? Even the half-formed stuff. |
| And off paper? | Off paper is where I want to start. What's making people tired? |
| You've walked the floor. Is Elena's read the whole read? | You've walked the floor too. Is Elena's read the whole read? I'd like yours. |
| So would I. I'll keep asking her first. | So would I. I'll keep asking her, and I'll keep walking it myself. |
| Fair. If I only ask Elena, I only hear what Elena can carry. I'll walk it Thursday. | You're right. If I only ask Elena, she carries the whole floor. I'll walk it this afternoon. |
| You always write down why. It's always good. The budget is still the budget. | You always write down why, and it's always good. Let's find the hours together. What can I move? |
| I read your request twice. You're right about the bottom nozzles. Approved. | I walked the bottom nozzles with your request in my hand. You're right. Approved, and thank you. |
| That's why I approve yours. You never ask for padding. | That's why I'll always find hours for yours. You never ask for padding. |
| Approved, as always. | I've read it. Approved. One question on page two, though. |
| I trust you. Isn't that enough? | I trust you, which is exactly why I read it. Trust and reading aren't the same thing. |
| Corporate asked why reactor engineering overspends on walkdowns. Did you go over my head? | Corporate asked why reactor engineering spends so much on walkdowns. I told them it's the best money we spend. Thought you should hear that from me. |
| I might have to. That's where we are this week. | I don't need to read anything. If people are scared to ask, that's my fault. Let's fix it. |
| Why? | Why? You were right to ask. |
| Priya always walks it. Is she right to push me this hard? | Priya always walks it. Is she right to push this hard? Honestly. |
| No, she hasn't. Approved. Tell her it was your idea. She'll enjoy that. | No, she hasn't. Approved. And I'll tell her you spoke up for her. |
| Yes. If I say no without the reason, she has to guess. I'll show her the whole sheet. | Yes. If I ever say no, she gets the whole sheet and a seat at the table. I'll start today. |
| Jordan. Tuesday's night log. Who signed the 03:00 line? | Jordan, got a minute? Tuesday's night log, the 03:00 line. That was you, right? |
| I wasn't asking that. But thank you. | I know you did. I wanted to say it was a good line. Sorry, I made that sound like trouble. |
| Jordan. Your margin note on Tuesday's log caught a drip before it was a leak. Thank you. | Jordan. Your margin note on Tuesday's log caught a drip before it was a leak. You're on the board at Monday's meeting. As a thank-you. |
| Write the next one too. Notes like that are why I read the margins. | Write the next one too. I read the margins first. |
| Everything good, Jordan? | How are you actually doing, Jordan? Not the shift. You. |
| Good. Good. | Great week's good. Is there a not-great part? There usually is. |
| Jordan. Your round times don't match the camera times on Tuesday. | Jordan, the camera clock and your round times disagree on Tuesday. I'd bet on you. Help me prove it? |
| Then I'll check the reports. And the clock. | Then the clock's wrong and the reports didn't get answered. That's ours to fix, not yours. |
| Jordan, a word about Tuesday's log... | Jordan! Good news about Tuesday's log. |
| ...You didn't do anything. I only wanted to say it was clean. | Nothing wrong. I should have opened with that. It was clean. Thank you. |
| Holt: You signed the core on paper. Today, go and meet it. If something's wrong, bring me the time and place. | Colt: You signed the core on paper. Today, go and meet it. Anything looks off, come and find me. |
| Holt: Tommy has a lockout on pump 2A today. Watch how he does it. And please, one Academy module. | Colt: Tommy has a lockout on pump 2A. Watch him, and ask him why. One Academy module if you can. |
| Holt: A dose sticker in Maintenance reads high. Marcus will hope it's a typo. Be kind. Say the number anyway. | Colt: A dose sticker in Maintenance reads high. Say the number with Marcus, not at him. |
| Holt: A log in Control has no initials. I need to know who stood those hours. Close the day with me. | Colt: A log in Control has no initials. Nobody's in trouble. Let's find out what happened. |
| Holt: Outage week. You program the fuel shuffle today. Teaching model, not a license. Take your time. | Colt: Outage week. You program the fuel shuffle today. Teaching model. Take all the time it needs. |
| Holt: Flux map today. Find where the power actually peaks, and tell Priya before she tells you. | Colt: Flux map today. Find where the power peaks. Priya's saved you a seat, and so have I. |
| Holt: Times and places, all week. That's a review I can actually fund. Thank you. | Colt: You came and found me every time this week. Thank you. That's what makes this place work. |
| Holt: You're skilled. That was never the question. The question is whether the floor is safe enough to use it. | Colt: You're skilled. My job is making the floor safe enough for you to use it. Tell me where I fell short. |
| Holt. Last night of the rotation. I won't keep you. | Colt here. Last night of the rotation. Just ringing to say thanks. How are you holding up? |
| Whatever the board says at six, I want the log honest more than I want it clean. Thank you for standing these. | Whatever the board says at six, write it the way it happened. And get some sleep after. That's an order, kindly meant. |
| Holt. We're standing it again. That's the system working, not failing. Thank you for standing it. | Colt here. We're standing it again. That's the system working. Thank you, and I've sent a coffee down. |
| Reggie came in and asked how you were getting on. Don't tell him I call him Reggie. | Russ came by and asked how you were getting on. He asks about everyone. He means it every time. |
| How's the first day? Survived Holt yet? He's not as scary as he looks. He's exactly as scary as he looks. | How's the first day? Met Colt yet? He'll ask how you're doing and then actually wait for the answer. Takes some getting used to. |
| My first year as senior, I led a meeting with all the good news. The bad number was on slide nine. Holt found it. | My first year as senior, I led a meeting with all the good news. The bad number was on slide nine. Colt asked me to start with it next time. Kindly. |
| His first year as senior, he put the bad number on slide nine. Holt found it. Now he wants the ugly number first. | His first year as senior, he put the bad number on slide nine. Colt asked him to lead with it. Now he wants the ugly number first. |
| Holt wrote it down, said thank you, and went on to the next item. That was it. That was the whole thing. | Colt wrote it down, thanked me in front of the room, and asked what I needed. That was it. That was the whole thing. |
| He told the board about the flow. Holt said thank you and moved on. It cost him nothing he needed. | He told the board about the flow. Colt thanked him in front of the room. It cost him nothing he needed. |
| Holt read your log twice, and told you about the log he once rewrote. | Colt showed you his favourite line in your log, and told you about the log he once tidied. |
| Holt is at the café counter, waiting for a cup. Mabel takes her time with it. | Colt is at the café counter, buying a round. Mabel takes her time with it, on purpose. |
| You've had corporate at nine for fifteen years, Reggie. Sit for two minutes. | Sit for two minutes, Russ. You always say yes to two minutes. |
| You heard that. What would you tell Reggie, if he'd listen? | You heard that. He always listens. What would you tell him? |
| You cut Marcus off in the review yesterday, Reggie. Before he'd finished. | You cut Marcus off in the review yesterday, Russ. Before he'd finished. |
| If I had something to say to you, Reggie, I'd say it to your face. Like I always have. | Wasn't me, Russ. If I had something to say, I'd say it to your face. Like I always have. |
| Reggie | Russ |
| Mabel says Holt was the best junior she ever trained, and the worst at saying sorry. | Mabel says Colt was the worst junior she ever trained, and the quickest to say sorry. |
| Somebody told Holt I left the turbine round early. I didn't. I want to know who. | Somebody wrote a note saying I left the turbine round early. Colt asked me about it straight. I didn't, and he believed me. I still want to know who wrote it. |
| Elena is in Holt's doorway with the morning sheet. He waves her in ahead of you. | Colt is in Elena's doorway with two coffees and the morning sheet. He waves you in too. |
| Holt asks Elena's read on the floor before anyone's. She won't hand him names. | Colt asks Elena's read on the floor, then walks it himself. He's never once asked her for names. |
| Priya's walkdown request is on Holt's desk. It's her third this month. She's standing beside it. | Priya's walkdown request is on Colt's desk. It's her third this month. He's pulled up a chair for her. |
| Holt says Priya has never once padded a request, and approves hers because of it. | Colt says Priya has never once padded a request, and tells corporate so whenever they ask. |
| That was me. Holt asked. I'm sorry I didn't tell you first. | That was me. Colt asked how the week was going. I'm sorry I didn't tell you first. |
| Did you tell Holt about my flow error before I did? | Did you tell Colt about my flow error before I could? |
| Both, honestly. Holt wants a walkdown report on every lockout this week. | Both, honestly. Colt wants us to walk every lockout this week. He's walking them too. |
| Did you ask Holt for my people before you asked me? | Did you ask Colt for my people before you asked me? |
| I asked Holt for hours. He gave me your people. I'm as annoyed as you are. | I asked Colt for hours. He said ask you first. I didn't. That's on me. |
| Holt stops at the break room door. Jordan straightens up before he can help it. | Colt stops at the break room door with a box of doughnuts. Jordan straightens up out of habit, then laughs at himself. |
| Holt makes my stomach drop. Every time. Even when he's being nice. | My old boss made my stomach drop. Colt doesn't. I'm still waiting for the catch. |
| Tell Holt how his questions land. | Tell Colt about your old boss. He'd want to know. |
| Jordan says Holt makes his stomach drop every time, even when he's being kind. | Jordan says Colt is the first boss who never made his stomach drop, and he's still waiting for the catch. |
| You refuse to initial someone else's blank. Holt gets a sentence with a time on it. | You refuse to initial someone else's blank. Colt gets a sentence with a time on it, and says thank you. |
| He's waiting to see whether you bring him times and places. | He's already asked how your week is going. He waited for the answer. |
| He's started telling you things before he has to. | He tells you things before you ask, and asks before he tells. |
| Holt calls the desk | Colt calls the desk |
| Reggie doesn't take presents. Never has. He'd only file it under "gifts, declared". | Russ won't take a toy. He's the one leaving things on desks round here. Check yours. |
| Mr. Reginald Holt | Mr. Russell Colt |
| Runs the site. Wants times and places, not adjectives. Knows people are scared to tell him things, and hates it. | Runs the site, mostly on foot. Buys the coffee. Asks how you are and waits for the answer. People tell him things early. |
| You signed the core. Now go and meet it, and bring me what you see. | You signed the core. Go and meet it. I'll come and find you at lunch to hear what you saw. |
| He stands up when you come in. Someone once told him he didn't. | He's already standing when you come in, holding two coffees. One's yours. |
| Times and places, please. | Come and find me. Any time. |
| Elena's uneasy about Valve 14. Holt can tell, and can't help until someone says it. | Elena's uneasy about Valve 14. Colt noticed and asked her straight. She's thinking about it. |
| Holt asked Elena how you did on Valve 14. She told him. It was good. | Colt asked Elena how you did on Valve 14. She told him. He came and said thanks himself. |
| Holt asks Elena's opinion before anyone else's. Neither of them mentions it. | Colt asks Elena's opinion, then everyone else's. She likes that he does both. |
| Priya won't sign a week with a gap in it. Holt won't ask her to. | Priya won't sign a week with a gap in it. Colt told her he'd never ask her to. |
| Holt read your signed log out to Priya. She's walking it anyway. He expected that. | Colt read your signed log out to Priya. She's walking it anyway. He went with her. |
| Priya keeps asking Holt for walkdown hours. He keeps saying yes, slowly. | Priya asks Colt for walkdown hours. He finds them, and asks what else she needs. |
| Holt · Elena | Colt · Elena |
| Priya · Holt | Priya · Colt |
| Control Room — Holt wants volume, not a speech. | Control Room — Colt's door is open. Go and say hello. |
| Find Holt. Afternoon check-in. | Find Colt. Afternoon check-in. |
| Afternoon. The stack's shadow is long. Holt will want a real answer. | Afternoon. The stack's shadow is long. Colt will want to know how the day went. |
| It is already in your file. In your words. That is why I put you forward. | It's in your file already, in your own words. That's exactly why I put you forward. |
| Marcus thinks his worst week will sink him. Does it? | Marcus thinks his worst week will sink him on Friday. What do you think? |
| I will. Plainly, and before Friday. He should not walk in thinking it is a secret. | Then I'll tell him today, over coffee. Nobody should walk into a board thinking their best answer is a secret. |
| Yes. A mistake told by the man who made it is a different thing to read. I will tell the board to ask him. | Agreed. I'll ask the board to let him tell it himself, first thing. A mistake in his own words reads completely differently. |
| The board will ask about the feedwater error. What will you say? | They'll ask about the feedwater error. Want to practise it on me? |
| Good. Say it in that order. The number first. | That's the one. Number first, then what you changed. You'll be great. |
| You will be fine on Friday. Everyone likes you. | You'll be fine on Friday. But let's do the hard questions anyway. Liking you isn't what the board's for. |
| No. You are right. Let us go through the hard questions instead. | Good. Hard questions first, then lunch. My treat. |
| I know. It came with no name on it. | I know. I've told the board an unsigned note gets read last. And I've asked whoever sent it to come and talk to me. |
| Is there something to find? | If there is, we'll find it together before Friday. Want to go through your file now? |
| You stood the restart night. How did it go? | You stood the restart night. Thank you. How did it go, honestly? |
| Which couple? I would like to hear them from you. | Which couple? Tell me about them. I want to know what nights are like. |
| I came in early so the night crew would see me. Did it help, or did it just make Jordan nervous? | I came in early so the night crew would see me. Did it help, or did it just make Jordan nervous? |
| Then I will do it every restart. And I will bring coffee, so it looks less like an inspection. | Then I'll do it every restart, and I'll bring breakfast so it feels less like an inspection. |
| Yes. What happened first, then who. I have it the wrong way round with people. I will practise it on Jordan. | Yes. What happened first, then who. I'll practise it, and you can tell me when I slip. |
| I read it. You logged the camera time and the alarm time. That gap is why we have rovers. Thank you. | I read it. You logged the camera time and the alarm time. That gap is why we have rovers. I read it out this morning. |
| Restart went well, I hear. | Restart went well, I hear. Tell me the bits that didn't. |
| Good. ...What heater drain thing? | Good. ...Hang on, what heater drain thing? Tell me. I'm not cross, I'm curious. |
| The heater drain trip. Was anyone near it before it tripped? | The heater drain trip. What did it look like from the deck? |
| I was not accusing you. I can see why it sounded like that. | Sorry, that came out wrong. I meant the pump, not you. Can I try that again? |
| Anything from the restart night I should know? | Anything from the restart night I should know? Even small stuff. |
| The heater drain pump is in the computer log. It is not in yours. | The heater drain pump's in the computer log but not in yours. That's fine. Just tell me what you saw, and we'll add it. |
| The restart schedule needed them. | The restart needed them, and they gave it everything. Now they need a day. You're right. |
| I signed every one of those extensions. I should have looked at the names, not the hours. | I signed every one of those extensions. I should have looked at the names, not the hours. That's on me. |
| Bring me the list. I will sign it in front of them. | Bring me the list. I'll sign it in front of them, and thank them while I'm at it. |
| Good. Then we keep the pace through the restart. | Brilliant. ...You said tired quietly. Say it louder. I'd rather hear it now. |
| Somebody went to the union about the overtime. Did you know? | Somebody went to the union about the overtime. Good. They should have been able to come to me first. |
| Then it was my silence they went over, not my head. Fair. | Then it was my silence they went over. That's fair. I'll answer faster. |
| Then they do not need one. | Then I need to ask why nobody feels they can. Let's go and find out. |
| Page four. Three near-misses during the reload. Why is that on page four? | Page four. Three near-misses during the reload. Thank you for writing them down. Why are they on page four? |
| I read page four. | I always read page four first. |
| Move page four to page one. Corporate should read the near-misses first. | Move page four to page one. Corporate should read the near-misses first, and see who reported them. |
| Good. And we will say: because people told us. That is the point. | Good. And we'll say: because people told us. That's the bit I'm proudest of. |
| A clean reload. Well done. | A clean reload. Thank you. Was it as clean as it looks? |
| I am sure it is fine. You are always thorough. | You're always thorough, which is why I'm going to read page four anyway. |
| Who reported the misloaded assembly? There's no name. | Someone reported the misloaded assembly with no name. Whoever it was, I'd like to thank them. |
| Then I need to know why someone thought they needed protecting from me. | Then I need to know what made someone feel they needed protecting. That's on me to fix. |
| What was on page four? | What was on page four? Whatever it was, I want it back in. |
| I have been asked to make a speech. I have prepared three sentences. | Mabel. I've been asked to make a speech. I've prepared three sentences and a cake. |
| I will stand. Some habits are earned. | I'll stand. You stood for every one of us, thirty years. |
| The first mark on that wall was yours, for a relief valve you didn't report. I only learned that this year. | The first mark on that wall was yours, for a relief valve you didn't report. You told me that my first week. |
| You told everyone. That is why the wall works. Thank you for the first mark, Mabel. | You told everyone. That's why the wall works. Thank you for the first mark, Mabel. |
| Thirty years of lovely coffee. Thank you, Mabel. | Thirty years of coffee, and thirty years of the wall. Thank you, Mabel. |
| I had a longer one. It mentioned the wall. It felt too serious for cake. | I had a longer one about the wall. I'll say it anyway. Cake can wait. |
| Some people have asked whether the wall should be retired with you. | Some people have asked whether the wall should be retired with you. I said no. |
| Yes. I know who. I will not let it come down. | I know who asked. I'll go and talk to them. The wall stays. |
| People are keeping their heads down this month. | People are keeping their heads down this month. I'd like to know why. |
| Why the same? | Why the same? Walk me through it. |
| Priya says the core repeats now. What's the risk in that? | Priya says the core repeats now. What's the risk in that, do you think? |
| She will. She walks the bottom nozzles every cycle. I will make sure she has the hours. | She will. She walks the bottom nozzles every cycle. She'll have the hours. |
| Yes. A familiar pattern is the easiest one to sign without reading. New eyes every cycle. I will put it in the procedure. | Yes. A familiar pattern is the easiest one to sign without reading. New eyes every cycle. I'll write it in. |
| So the hard work is done, and now the danger is getting bored. | So the hard work's done, and now the danger is getting bored. How do we stop that? |
| Then we change who checks it, every cycle. New eyes on an old map. | Then we change who checks it every cycle. New eyes on an old map. Pick who's first. |
| Excellent. Then we can cut the review hours. | Brilliant. ...That doesn't mean we cut the review hours. I want them doubled, if anything. |
| Corporate says if the pattern repeats, we don't need a reactor engineer on every reload. | Corporate says if the pattern repeats we don't need a reactor engineer on every reload. I told them no. |
| I asked them to put it in writing. They haven't. | I asked them to put it in writing, with their reasons. They haven't. |
| Will it be right? | Will it be right? Let's check it together. |
| You said two minutes. I am sitting for two minutes. | Two minutes, as promised. I always sit, Mabel. You know that. |
| Someone told me people go quiet when I walk in. I wanted to see what it was like to stay. | Someone told me people go quiet when I walk in. I wanted to find out why. |
| Mabel has asked me to sit for fifteen years. Will I keep doing it? | I sit with Mabel every morning. Is it doing any good, or is it just nice? |
| Then nine o'clock, before corporate. I will tell her. She will pretend not to be pleased. | Then nine o'clock, before corporate, every day. Mabel's already saved the chair. |
| Yes. Sitting is the easy part. Listening without taking notes is the hard part. I will leave the notebook in my office. | Yes. Sitting is easy. Listening without taking notes is the hard part. I'll leave the notebook in my office. |
| It took thirty seconds. I have been saving it up for ten years. | It took thirty seconds. I should have done it the same day. |
| Everyone seems very happy lately. | Everyone seems very happy lately. What am I missing? |
| They are telling me they are happy. | They're telling me they're happy. I'd like them to tell me what's wrong, too. |
| I am getting reports about reports. People are writing each other up. | I'm getting reports about reports. People are writing each other up instead of talking. That's on me. |
| And they don't talk to each other because they think I am reading. | And they don't talk because they think I'm keeping score. I need to fix that. |
| Nobody looked up when I came in. | Nobody looked up when I came in. That tells me something's wrong. |
| I used to think quiet meant safe. | Quiet isn't safe. Quiet is people not telling me things. |
| Jordan. I am told this is where people talk. I am here to listen. | Jordan! Mind if I join you? I'm told this is where people talk. |
| Please. And talk about anything except the plant. | Please. And talk about anything except the plant. Bowling, maybe. |
| I know. Mabel told me. I am sorry. What should I do differently? | I know. I'm sorry for whatever I did. What should I do differently? |
| Everyone seems happy in here. | Everyone seems happy in here. What's the one thing that isn't? |
| Good. ...Nobody is going to tell me anything, are they. | Good. ...Nobody's going to tell me anything, are they? That's my fault, not yours. |
| Yes. That is exactly why. I would rather hear it here than in a report. | Yes. Exactly why. I'd rather hear it here than in a report. |
| I noticed. | I noticed. I'd like to know why. |
| Marcus is in Holt's office with a folder he keeps opening and closing. The promotion board is Friday. | Marcus is in Colt's office with a folder he keeps opening and closing. Colt has made him a tea. |
| Holt says Marcus's worst week is the reason he put him forward for senior. | Colt says Marcus's worst week is the reason he put him forward for senior. |
| Jordan's at the turbine deck rail at the end of his night. Holt has come in early for the restart. | Jordan's at the turbine deck rail at the end of his night. Colt has come in early with breakfast for the restart crew. |
| Holt says Jordan's restart log had the camera time and the alarm time, and the gap is why rovers exist. | Colt says Jordan's restart log had the camera time and the alarm time, and read it out at the morning meeting. |
| Elena's in Holt's doorway with the outage overtime sheet. Some names have five weeks without a day off. | Elena's in Colt's doorway with the outage overtime sheet. He pulls up a chair for her before she speaks. |
| Holt listens to me, eventually. Should I keep carrying my crew's tiredness up to him? | Colt always listens. Should I bring my crew up with me, so he hears it from them? |
| Elena says Holt signs rest days once he sees the names, not the hours. | Elena says Colt signs rest days the minute he sees the names. |
| Priya's reload report is on Holt's desk. Page one says the core is fine. Page four says three things nearly weren't. | Priya's reload report is on Colt's desk. He's already turned to page four. |
| Holt reads page four. Should I stop hiding things on page four? | Colt reads page four first. Should I stop hiding things on page four? |
| Priya says Holt always reads page four, where she puts the things corporate shouldn't skip. | Priya says Colt reads page four first, where she puts the things corporate shouldn't skip. |
| You wrote the camera time in the restart log. Holt read it out at the morning meeting. | You wrote the camera time in the restart log. Colt read it out at the morning meeting. |
| There's a cake on the café counter for Mabel's thirty years on the wall. Holt's been asked to say something. | There's a cake on the café counter for Mabel's thirty years on the wall. Colt baked it. It's lopsided. |
| Three's plenty, Reggie. Say them sitting down. | Three's plenty, Russ. Say them sitting down. |
| Holt should keep a mark too. His own. | Colt should keep a mark too. His own. |
| Some people want fewer marks on it. That's a different thing, Reggie. | Some people want fewer marks on it. That's a different thing, Russ. |
| Then who's going to keep the wall, Reggie? Not you. You only read it. | Then who's going to keep the wall, Russ? You can't do everything. |
| Mabel says Holt was the best junior she trained, and the only one who still stands up for the cake. | Mabel says Colt was the worst junior she trained, and the only one who bakes her a cake. |
| Priya's showing Holt a loading pattern that looks almost the same as last cycle's. | Priya's showing Colt a loading pattern that looks almost the same as last cycle's. |
| Holt says Priya's core has found its rhythm, and the danger now is getting bored. | Colt says Priya's core has found its rhythm, and asks the floor how to keep from getting bored. |
| Holt's at the café counter. For once, he's sitting down. | Colt's at the café counter, sitting down, as he does every morning. |
| There's my best junior. Have a biscuit, Reggie. | There's my worst junior. Have a biscuit, Russ. |
| Holt says Mabel asked him to sit for two minutes for fifteen years, and he finally did. | Colt says he sits with Mabel every morning, and it's the best two minutes of his day. |
| Holt's sitting in the break room. Jordan's just walked in and stopped dead in the doorway. | Colt's sitting in the break room. Jordan walks in, sees him, and grabs a chair. |
| Holt's sitting in our break room. What do I do with that? | Colt's sitting in our break room again. Should I ask him to bowling? |
| Jordan says Holt sat in the break room to listen, and asked what to do differently. | Jordan says Colt sits in the break room to listen, and asks what to do differently. |

## Colt's desk notes, one per day

1. On your desk: a coffee, still hot, and a sticky note. "Welcome. Ask me anything. — R.C."
2. On your desk: a spare pair of safety glasses, your size. "Saw yours were scratched. — R.C."
3. On your desk: a printout of Marcus's best catch from last year, with "ask him about this" in the margin.
4. On your desk: your chair doesn't squeak any more. Someone oiled it.
5. On your desk: a note. "Whatever happens at the shuffle, I'm proud of this week. — R.C."
