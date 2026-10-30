# First-meeting dialogue: how the people on Unit 1 should talk

Scope: the first-meeting scenes in `src/game/content.ts` (`INTRO`), one per character: Mabel, Elena, Tommy, Marcus, Jordan, Holt, Priya. The `NPCS.*.meet` one-liners follow the same rules.

## What was wrong

- Lines were fragments with stage directions baked in ("The cup meets the tile. “…”", "Priya, not looking up. “…”"). Speech and camera direction shared one string, so every line read like a note about a person, not a person talking.
- Each character announced their rule in one clipped sentence ("Pump two. Say LOTOTO."), so nobody sounded like they were talking to someone. Mabel, Marcus, and Jordan each opened with a sentence about who they are instead of a reason to be talking.
- Lines were short enough to feel rigid but still too long to fit the box at the old size, so the text clustered.

## What the research said

- **Plain, concrete speech over labels.** Elmore Leonard's rules: use said, avoid adverbs on said, and leave out the parts readers skip. Dialogue that carries the scene's facts in ordinary words reads as spoken.
- **Lean lines, one word that carries weight.** Firewatch's radio dialogue works because it reads as two people who are only partly saying what they mean. The lines are short, but each one is a full thought.
- **Ordinary small talk shows the person.** Stardew Valley modding guidance: NPCs sound right when they talk about small, ordinary things, show their traits through what they do and what others say, and vary their lines by event. Do one NPC at a time and check each one alone.
- **Subtext: talk around the subject.** Final Draft's subtext guidance: people answer a question they weren't asked, contradict themselves a little, and change the subject when something hurts. The fact still lands; it just isn't stated flatly.

## Rules the lint enforces (`scripts/first-meeting-lines.test.mjs`)

1. Every spoken line is quoted speech (`“…”`). Stage direction lives in camera fields (`focus`, `zoom`, `lean`) and `prop`, not in the text.
2. Each spoken line is a full sentence of at least four words, ending in `.`, `?`, or `!`.
3. No line is longer than 120 characters, so it fits the intro box at the new size.
4. No stage-direction tells inside speech (looks at, nods, taps the, and similar).
5. No duplicated lines across characters.

Player narration (`you: true` beats) is exempt: it is inner narration, not speech.

## How each character now talks

- **Mabel** talks about the work she did, not herself: someone has to pour before anyone asks for anything.
- **Elena** answers the question she was asked and leaves the child seat unexplained until it matters.
- **Tommy** explains why his rule is boring, which is the whole point of him.
- **Marcus** tells you the mistake and the cost, in that order, and tells you not to take the compliment.
- **Jordan** sets a boundary as a place to sit, not as a rule.
- **Holt** is short because he is busy, and he says what he will read, not what he feels.
- **Priya** speaks as a teacher about the thing in front of her: the stack, and the heat that still has to leave.

## Next checks

- Read each character's first meeting aloud, one at a time, in order.
- Confirm the box holds two lines at the new text size on 1100×720 and 390×844 screens.
