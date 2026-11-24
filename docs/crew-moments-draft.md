# Crew moments: draft for the owner's approval

Written by Claude, 23 November 2026 (roadmap step 50). Code: `src/game/crewMoments.ts`. Nothing here is approved yet.

A tier scene is about who someone is. A moment is about what **you** did this week: it plays only when the week's own record says it happened, once, at most one per conversation, and never in the same conversation as a tier scene.

To approve: edit any line in place (in this file or the code), strike what you don't want, and tell Claude or Grok. Then this header changes to approved, the same way the 21 tier scenes were.

## Tommy Reyes: "The repack"

**When:** Day 2 on, if you reported the Valve 14 leak on day 1.

**Crew page after:** Tommy repacked Valve 14. The packing came apart in his hand. He thanked you, properly.

> **Tommy:** Got a minute? I repacked Valve 14 this morning.
>
> **Tommy:** Pulled the old packing and it came apart in my hand. Like wet paper.
>
> **Tommy:** That's a hot line. Another week and it wouldn't have been a drip. It'd have been spray, with somebody beside it.
>
> **Tommy:** Probably me. I'm the one who walks past it every morning.
>
> **Tommy:** So I want to say this properly, because people don't. Thank you.
>
> **Tommy:** You saw a drip, you wrote it down, and you put your name on it. That's not small.
> - *You:* "I almost didn't. It looked like nothing." → **Tommy:** "Most things do on the first day. You wrote it anyway. That's the part I'm thanking you for." (trust +3)
> - *You:* "I'm glad nobody was standing there." → **Tommy:** "Me too. Next time you see something on my side of the house, come find me first. I mean that." (trust +3)

## Tommy Reyes: "The drip tray"

**When:** Day 2 on, if you hid the Valve 14 leak on day 1.

**Crew page after:** Tommy found the drip tray under Valve 14 and told you about the flange he once hid.

> **Tommy:** Somebody put a drip tray under Valve 14. No work order. No tag.
>
> **Tommy:** Tray was full when I found it. White crust all down the bonnet.
>
> **Tommy:** I'm not here to find out who. I want to tell you something instead.
>
> **Tommy:** My second year, I hid a weeping flange. Wrapped a rag on it. Told myself I'd write it after the outage.
>
> **Tommy:** It let go on nights. A guy I trained with took the spray. He was all right. I wasn't, for a long time.
>
> **Tommy:** So if it was you, I get it. I just need it written today. I'm the one who has to open it.
> - *You:* "It was me. I'm sorry. I'll write it now, and walk it down with you." → **Tommy:** "Thank you. That's harder to say than it is to hide. Come on, we'll write it together. Nobody's getting yelled at today." (trust +3, culture +1, flag momentOwned)
> - *You:* "I don't know anything about it." → **Tommy:** "Okay. If that changes, my door's open. It always is." (trust -2)

## Elena Voss: "The tag on 2B"

**When:** Day 3 on, if you hid the clearance tag problem on day 2.

**Crew page after:** Elena asked about the tag on 2B, and told you about the one she moved years ago.

> **Elena:** Do you have a minute? Somewhere quieter.
>
> **Elena:** The clearance tag on 2B is on the wrong breaker. Yesterday it was right.
>
> **Elena:** A tag is a promise to the person downstream. This one is dead. You can put your hands in.
>
> **Elena:** Years ago I moved a tag to save twenty minutes on a turnover. Nobody got hurt.
>
> **Elena:** I've thought about who could have, most weeks since.
>
> **Elena:** I'm not asking to catch you. If it was you, I want to fix it with you, not around you.
> - *You:* "It was me. I moved it to finish faster. I should have stopped and asked." → **Elena:** "Thank you for telling me. Really. We'll rehang it together and both sign. And now you'll think about who's downstream, too." (trust +3, culture +1, flag momentOwned)
> - *You:* "It must have been night shift." → **Elena:** "Night shift wrote theirs down. I checked before I asked you. I'll fix it. I hope you'll come to me next time." (trust -2)

## Dr. Priya Sharma: "Next to the wall"

**When:** Day 4 on, if you reported the dose reading on day 3.

**Crew page after:** Priya moved the contractors' scaffold because of the survey you called in.

> **Priya:** I walked the aux stairs this morning with the survey you called in.
>
> **Priya:** The reading was right where you said. Higher than the map. Higher than last month.
>
> **Priya:** There's a resin line behind that wall that's been loading up. Nobody knew.
>
> **Priya:** Contractors were going to stage scaffolding there tomorrow. Six of them, most of a shift.
>
> **Priya:** I've waved off a reading like that before, because the map said it couldn't be. You didn't.
>
> **Priya:** They'll never know your name. So I wanted you to hear it from someone. Thank you.
> - *You:* "My dosimeter didn't match the map. I nearly decided it was broken." → **Priya:** "Almost everyone does. The instrument was right and the drawing was wrong. Trust the thing in your pocket." (trust +3)
> - *You:* "I'm glad they won't be standing there." → **Priya:** "So am I. I'm moving the scaffold today. Come see the new survey if you like. You earned the look." (trust +3)

## Mr. Reginald Holt: "Read twice"

**When:** Day 5, if you kept the day-4 log honest.

**Crew page after:** Holt read your log twice, and told you about the log he once rewrote.

> **Holt:** I read your log last night. Twice.
>
> **Holt:** There's a correction on yesterday's entry. A line through it, your initials, the right number beside it.
>
> **Holt:** Most logs I read are perfect. They're perfect because somebody fixed them afterwards.
>
> **Holt:** Early on, I tidied a log so a shift would look cleaner to my supervisor.
>
> **Holt:** It cost us three days in an investigation, because the record didn't match what happened.
>
> **Holt:** So, thank you for leaving it honest. It makes my job possible.
> - *You:* "I nearly rewrote it. The correction looked bad." → **Holt:** "It looks like the truth. That's all a log has to look like. Leave the corrections in. I'll back you every time." (trust +3)
> - *You:* "I thought you'd be annoyed about the mistake." → **Holt:** "The mistake was a number. The correction is the part I trust. If anyone gives you grief for one, send them to me." (trust +3)

## Marcus Hale: "Check my sheet"

**When:** Day 3 on, once you have made 4 catches this week.

**Crew page after:** Marcus asked you to check his boron sheet before startup. You caught it.

> **Marcus:** Can I ask you something slightly embarrassing?
>
> **Marcus:** I'm signing the boron sheet for tonight's power ascension. I've checked it three times.
>
> **Marcus:** When I've checked something three times, that's usually when I've stopped seeing it.
>
> **Marcus:** You've caught four things this week other people walked past. Would you look before I sign?
> - *You:* "The worth on line three is last week's. Pull the new one." → **Marcus:** "...It is. That would have had us diluting on an old number. Thank you. Genuinely. I owe you a coffee, and the next check you ask for." (trust +3, flag marcusChecked)
> - *You:* "It looks fine to me. You know it better than I do." → **Marcus:** "Maybe. I'll go through it once more on my own. Thanks for listening, anyway. It helps to say it out loud." (trust +1)

## Jordan Peck: "To your face"

**When:** Day 3 on, once you have hidden 2 things this week.

**Crew page after:** Jordan told you to your face that he won't sign a short log again.

> **Jordan:** Hey. This is awkward, so I'm just going to say it.
>
> **Jordan:** Some things this week didn't get written down. I don't know all of it, and I'm not asking.
>
> **Jordan:** But my name's on the log for those hours. I've been the name on a log like that before. Never again.
>
> **Jordan:** So either we write it right, together, or I need my name off it.
>
> **Jordan:** I'm sorry. I like working with you. That's why I'm saying it to your face.
> - *You:* "You're right. I left things out. Let's write it properly. I'll sign next to you." → **Jordan:** "Thank you. I know that wasn't easy. Honestly, it makes me trust you more, not less." (trust +3, culture +1, flag momentOwned)
> - *You:* "Fine. I'll take your name off." → **Jordan:** "Okay. Thanks for not making it harder. If you ever want to fix it, I'll still sign." (trust -1)

## Dr. Mabel Quinn: "Tommy smiling"

**When:** Day 3 on, once the maintenance job is finished.

**Crew page after:** Mabel thanked you for Tommy, because Tommy won't say it.

> **Mabel:** Sit a second. Tommy came in for his coffee smiling. Tommy does not smile before ten.
>
> **Mabel:** He said the pump job closed out with the try done and signed. First one in months he didn't have to chase.
>
> **Mabel:** Forty years on that floor taught me the plant isn't kept safe by the big decisions.
>
> **Mabel:** It's kept safe by somebody finishing the dull last line, so the next person doesn't have to wonder.
>
> **Mabel:** So, thank you. From me and from him. He won't say it, so I'm saying it for him.
> - *You:* "He did the real work. I just made sure it was closed." → **Mabel:** "Both halves. That's why he smiled. This one's on the house." (trust +2)
> - *You:* "It was only paperwork." → **Mabel:** "Paperwork is the plant remembering. Don't let anyone tell you it's only. Now drink your coffee." (trust +1)

## Elena Voss: "I asked for you"

**When:** Day 4 on, with 3+ catches and no hides.

**Crew page after:** Elena asked for you on nights, and told you about her twenty minutes.

> **Elena:** Walk with me. They've put you on nights next rotation.
>
> **Elena:** Watch desk. Eight cameras. A coffee pot that mostly works.
>
> **Elena:** I asked for you. Nights are quiet, and quiet is when something sits on a camera for an hour.
>
> **Elena:** My first nights, a pump stopped at three in the morning. The board told me twenty minutes after the camera did.
>
> **Elena:** I've never forgotten those twenty minutes. I need someone who looks.
>
> **Elena:** I take your turnover at six. Bring me an honest log, even if it's an ugly one.
> - *You:* "Thank you for asking for me. I won't make you regret it." → **Elena:** "You'll make mistakes. Everyone does. Tell me about them at six and we'll be fine." (trust +2)
> - *You:* "What should I watch first?" → **Elena:** "Whatever you've looked at least. And the things that don't make a sound. Those are the ones that matter." (trust +2)

## Jordan Peck: "Wave at the camera"

**When:** Day 5, always. Sets up Jordan as the night rover.

**Crew page after:** Jordan walks the night rounds. Watch for his torch, and call him if he walks past something.

> **Jordan:** Heard you're coming to nights. I'm the one who walks the rounds.
>
> **Jordan:** Turbine deck, aux building, the pool, out to the yard and back.
>
> **Jordan:** You'll see a torch moving on the cameras. That's me. Please don't report me. The paperwork is a nightmare.
>
> **Jordan:** Seriously, though. If something's wrong where I've just walked, call me. I'd much rather turn around.
>
> **Jordan:** It's lonely out there at four in the morning. It helps knowing somebody's watching.
> - *You:* "I'll be watching. Keep your radio on." → **Jordan:** "Always. Battery's the one thing I check twice. See you on the cameras." (trust +2)
> - *You:* "I'll wave, even if you can't see me." → **Jordan:** "Then I'll wave at the camera dome every time I pass it. Deal." (trust +2)

