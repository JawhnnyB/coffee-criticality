# Crew moments: draft for the owner's approval

Written by Claude, 23 November 2026 (roadmap step 50). Code: `src/game/crewMoments.ts`. Nothing here is approved yet.

A tier scene is about who someone is. A moment is about what **you** did this week: it plays only when the week's own record says it happened, once, at most one per conversation, and never in the same conversation as a tier scene.

To approve: edit any line in place (in this file or the code), strike what you don't want, and tell Claude or Grok. Then this header changes to approved, the same way the 21 tier scenes were.

## Tommy Reyes: "The repack"

**When:** Day 2 on, if you reported the Valve 14 leak on day 1.

**Crew page after:** Tommy repacked Valve 14 because you said it out loud.

> **Tommy:** Repacked Fourteen this morning. Packing was cooked. Another week and it would've sprayed.
>
> **Tommy:** Work order had your name on the first line. I don't see that much.
> - *You:* "It was dripping. I wrote it down." → **Tommy:** "That's all it ever is. Most people skip the writing." (trust +2)
> - *You:* "You did the hard part." → **Tommy:** "I did the second part. Second part's easy when the first part's there." (trust +2)

## Tommy Reyes: "The drip tray"

**When:** Day 2 on, if you hid the Valve 14 leak on day 1.

**Crew page after:** Tommy found the drip tray under Valve 14 full. He asked. He didn't accuse.

> **Tommy:** Somebody put a drip tray under Fourteen. Tray's full. No work order.
>
> **Tommy:** I'm not asking who. I'm asking if it gets written today.
>
> **Tommy:** Because I'm the one who opens it.
> - *You:* "It was me. I'll write it now." → **Tommy:** "Then it's a leak, not a secret. I can fix a leak." (trust +3, culture +1, flag momentOwned)
> - *You:* "Probably condensate." → **Tommy:** "Condensate doesn't leave white crust on the bonnet." (trust -2)

## Elena Voss: "The tag on 2B"

**When:** Day 3 on, if you hid the clearance tag problem on day 2.

**Crew page after:** Elena knows the clearance tag on 2B moved. She waited for you to say it.

> **Elena:** Clearance tag on 2B is on the wrong breaker. It was right yesterday.
>
> **Elena:** A tag that moves is worse than no tag. Somebody trusts it.
>
> **Elena:** I'm going to ask once.
> - *You:* "I moved it. I'll walk it back with you." → **Elena:** "Good. We hang it together and we both sign." (trust +3, culture +1, flag momentOwned)
> - *You:* "Night shift had the board." → **Elena:** "Night shift wrote theirs down. That's how I know it wasn't them." (trust -2)

## Dr. Priya Sharma: "Next to the tank"

**When:** Day 4 on, if you reported the dose reading on day 3.

**Crew page after:** Priya walked the aux stairs with the survey you called in.

> **Priya:** I walked the aux stairs with your survey. The reading was where you said.
>
> **Priya:** A number on a sheet is a rumor. You went and stood next to it.
>
> **Priya:** What made you go back?
> - *You:* "The dosimeter didn't match the map." → **Priya:** "Then you believed the instrument over the drawing. Keep doing that." (trust +3)
> - *You:* "Habit." → **Priya:** "Good habits look like luck from the outside." (trust +2)

## Mr. Reginald Holt: "Read twice"

**When:** Day 5, if you kept the day-4 log honest.

**Crew page after:** Holt read your log twice. He said that is rare.

> **Holt:** I read your log twice. Yesterday's entry has a correction in it, initialled.
>
> **Holt:** Most logs are clean because somebody cleaned them. Yours is clean because it's right.
>
> **Holt:** Keep the corrections in. I fund the corrections.
> - *You:* "The correction was the point." → **Holt:** "Then you understand the budget better than my predecessor." (trust +3)
> - *You:* "I almost rewrote it." → **Holt:** "Almost is the honest word. I'll take almost." (trust +2)

## Marcus Hale: "Check my math"

**When:** Day 3 on, once you have made 4 catches this week.

**Crew page after:** Marcus asked you to check his numbers before he showed the floor.

> **Marcus:** I'm presenting the heat balance at two. Would you check the inputs first?
>
> **Marcus:** You've caught four things this week. I'd rather be wrong in front of you than in front of the room.
>
> **Marcus:** If it's wrong, tell me plainly.
> - *You:* "Feedwater flow is an hour old. Pull the new one." → **Marcus:** "It is. Thank you. Quietly, thank you." (trust +3, flag marcusChecked)
> - *You:* "Looks fine to me." → **Marcus:** "Looks fine is what I said yesterday." (trust +1)

## Jordan Peck: "Not on that hour"

**When:** Day 3 on, once you have hidden 2 things this week.

**Crew page after:** Jordan asked to be taken off the log for an hour you hid something in.

> **Jordan:** Can you take my name off the log for the hour that didn't get written?
>
> **Jordan:** I wasn't part of it. I'd like the log to say so.
>
> **Jordan:** I've done this before. I'm not doing it again.
> - *You:* "You were there. Let's write it right instead." → **Jordan:** "Then I'll sign it. Next to yours." (trust +3, culture +1, flag momentOwned)
> - *You:* "I'll take your name off." → **Jordan:** "Thanks. That's the distance." (trust -1)

## Dr. Mabel Quinn: "Tommy smiling"

**When:** Day 3 on, once the maintenance job is finished.

**Crew page after:** Mabel saw Tommy come in smiling after the maintenance you finished.

> **Mabel:** Tommy came in for his coffee smiling. Tommy does not smile before ten.
>
> **Mabel:** He said the work order closed with the try done and signed. Somebody finished the sentence.
>
> **Mabel:** That's a good morning's work.
> - *You:* "He did the work. I signed the try." → **Mabel:** "Both halves. That's why he smiled." (trust +2)
> - *You:* "It was just paperwork." → **Mabel:** "Paperwork is the part that remembers. Pour yourself one." (trust +1)

## Elena Voss: "Next rotation"

**When:** Day 4 on, with 3+ catches and no hides.

**Crew page after:** Elena told you nights are next. She will take your turnover at six.

> **Elena:** You're on nights next rotation. Watch desk, eight cameras, one coffee pot that works.
>
> **Elena:** Nights are quiet. Quiet is when things sit on a camera for an hour and nobody looks.
>
> **Elena:** I take your turnover at six. Bring me a clean log.
> - *You:* "Clean and honest. In that order?" → **Elena:** "Honest first. Clean is what honest looks like at six." (trust +2)
> - *You:* "What do I watch first?" → **Elena:** "Whatever you looked at least." (trust +2)

## Jordan Peck: "Wave at the camera"

**When:** Day 5, always. Sets up Jordan as the night rover.

**Crew page after:** Jordan walks the night rounds. He said to watch for his torch.

> **Jordan:** When you're on nights, I'm the one walking rounds. Turbine deck, aux, the pool, the yard.
>
> **Jordan:** You'll see a torch on the cameras. That's me. Don't report me.
>
> **Jordan:** If something's wrong where I've just walked, call me. I'd rather turn around.
> - *You:* "I'll call. Keep your radio on." → **Jordan:** "Always on. Battery's the one thing I check twice." (trust +2)
> - *You:* "I'll wave back." → **Jordan:** "Camera can't see you. Wave anyway." (trust +1)

