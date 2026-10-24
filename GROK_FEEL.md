# GROK_FEEL — the week has to be visible

Input for finishing the story so a player feels it on the floor. Not a new plot. Not more speeches.

Coffee & Criticality already has the week: five days, Report / Peer / Hide, culture, trust, a dusk walk. The writing is already specific. The floor forgets it. This file is the build. A slice is not done if the only diff is a string.

## Done means

Cover the toast and the dialogue box. Two screenshots of the same room, one after a catch and one after a hide, must be different pictures. A return visit the next day must still show yesterday. The dusk lot must contain different people for a held week than for a lost one.

If you cannot see the difference with the text hidden, it is not felt.

## Do not

- Do not add rooms, portraits, emotes, or a second ending cinematic.
- Do not retune culture, trust, or the ending formula. Held stays `hides < 3` and `reports + catches > hides` and `culture >= 28`. Three hides is unfinished even if the number looks fine.
- Do not repeat the painted introduction inside `talkLines`. The painting is the meeting. The floor talk is what happened after.
- Do not write a mood the body does not back up. "Her shoulders drop" is banned as a substitute for Elena turning.
- The three emotes stay `bang`, `dots`, `mug`. Facing, room, and the board are the acting.
- A held facing only sticks when `NpcSlot.radius <= 12`. Above that they wander, and within 20px they stop owning their face. Posts that must look at a wall or a van use `radius: 12` and `face`.

## The bug that makes failure look like success

`resolveIncident` sets `incidentResolved = true` for Report, Peer, and Hide. `drawBoardA` and `drawPaperLog` in [src/game/render.ts](src/game/render.ts) treat that boolean as a catch. A hide paints the board leaf-green and the paper log says `CAUGHT`. The hiss in Maintenance stops, because steam is `day === 1 && !incidentResolved`.

A hide must leave the lie up.

## Memory

`beginDay` in [src/game/sim.ts](src/game/sim.ts) clears `incidentResolved` and does not clear `flags.hid`. One hide currently makes `hid` true for the rest of the week, so Jordan and Mabel cannot tell a single bad hour from a bad week. Do not overload `hid`.

Add a residue that `beginDay` does not wipe, and that [src/game/save.ts](src/game/save.ts) writes and reads:

```
residue: {
  valve: "open" | "caught" | "hid";
  tag: "open" | "caught" | "hid";
  dose: "open" | "caught" | "hid";
  log: "open" | "caught" | "hid";
}
```

Start every field at `"open"`. `resolveIncident` sets today's field. Report and Peer write `"caught"`. Hide writes `"hid"`. `incidentResolved` can stay the "this day is over" flag. The picture reads `residue`, not the boolean.

`flags.hid` may stay as "hid at least once." Do not use it as the only reason a person moves.

## Slice 1 — the board tells the truth

In `drawBoardA` and `drawPaperLog`, take the day's residue, not a boolean.

| Day | Open | Caught | Hid |
|---|---|---|---|
| 1 | Board `14-B OPEN`. Paper `14-R CLOSED` / `!= 14-B`. Steam on in Maintenance. | Board and paper agree, leaf. Steam off. | Board stays `14-B OPEN`. Paper stays the contradiction. Foot says `HID`, not `CAUGHT`. Steam stays. |
| 2 | `2A IN SVC` | `2A LOCKED`, leaf | stays `2A IN SVC`, foot `HID` |
| 3 | `40 mSv/h` | `0.04 mSv/h`, leaf | stays `40`, foot `HID` |
| 4 | `NO INITIALS` / `BLANK` | `LOG SIGNED`, leaf | `YOUR NAME` on the blank. Not leaf. |
| 5 | `SHUFFLE DAY` | unchanged | unchanged |

Gold or the warning red for a lie. Leaf only for a catch. Pass `now` only if something still pulses. A hid board may keep the pulse. A caught board does not.

Prove it. Warp to control on day 1, resolve hide, screenshot the paper log. Resolve catch on a fresh state, screenshot again. The words `CAUGHT` and a green card must be absent from the hide shot.

## Slice 2 — people stand on the consequence

`occupancyOverlay` in [src/game/week.ts](src/game/week.ts) takes the residue. It does not care about `period` for these posts. Radius 12. Face is the feeling.

- Day 1, valve still open: Elena on the lot, facing the van (`face: "up"` or whatever faces the van sprite, not the player spawn). Mabel at the kettle.
- Valve caught: Elena's post faces the gate door, toward where a person walks in. Same coordinates, opposite face, radius 12 so she holds it.
- Valve hid: Elena still faces the van. Mabel's emote is `dots` (already wired for `flags.hid`; also set it when `residue.valve === "hid"`).
- Day 2, tag open or hid: Tommy at the lockout board, `face: "up"`, radius 12. The current post is `{ room: "maintenance", x: 208, y: 160 }`. Keep the spot. Hold the face.
- Tag caught: Tommy faces away from the board, toward the room.
- Day 3, dose open or hid: Marcus at the sticker, face into the sticker, radius 12. He does not turn until it is caught.
- Dose caught: he faces the door.
- Day 4, log open or hid: Holt at the paper log, facing the card, radius 12. Caught: he faces the board.
- Day 5: Priya at the reactor rail only if `residue` has no `"hid"` and the shuffle is done. If any residue is `"hid"`, she stays on her engineering schedule and will not take the rail post.

`tickNpcs` already turns someone toward you while the talk box is open. That is allowed. When the box closes, radius 12 puts the face back.

Jordan: if `residue` contains any `"hid"`, his post is the far side of the break room, `face` away from the chair. If the last resolution was a peer and nothing is `"hid"`, he keeps the normal break-room chair. Do not add a line that says the chair is empty unless the chair is empty. Check the chair prop in the break room and stand him off it.

Prove it. Same room, catch versus hide, toast covered. Elena's face or Jordan's spot must differ. If both shots show the same back, the slice is not done.

## Slice 3 — the second talk can only be said after

Edit `talkLines` in [src/game/content.ts](src/game/content.ts). The first meeting stays. The return visit is at most two lines. One of those two lines must be impossible on the first day, because it names the residue.

- Elena, caught: she saw your hands. She does not re-explain the child seat.
- Elena, hid: she is still looking at the van. One sentence. No lecture.
- Tommy, day 2 caught: the tag is down. He does not make you recite LOTOTO again.
- Tommy, hid: `IN SERVICE` is still on the flange.
- Marcus, dose caught: you said 40 out loud. He does not repeat "youngest senior."
- Marcus, hid: the sticker still says 40, and he is not turning around.
- Holt, log caught: he will read the line. His hand stays off it.
- Holt, hid: your initials are on a blank. He will not fund that.
- Priya, day 5, no hides in the residue: she will walk the peak to the rail.
- Priya, any hide: she will not sign, and she is not at the rail. The line is short because the empty rail is the rest of it.
- Mabel, any hide: she watched you not sit with it. Keep it to one line. The dots are the rest.
- Jordan, any hide: distance. He is already across the room. Do not also explain the deal from scratch.
- Jordan, peer and a clean residue: the catch was said, so the chair is available. One line.

Delete the return-visit copies of the first-meeting thesis. Trust numbers do not get a new speech. Holt's culture line can stay as the second sentence only when `culture >= 28` and the log was caught.

Pass `s.role` into `talkLines`. Once, on day 2, Mabel's return talk adds the existing `ROLES` line for that id, in her mouth, then never again. Set `flags.roleHeard`. Do not write four new backstories. The lines already live on `ROLES` in content.ts.

## Slice 4 — the choice is clear before it is pressed

On the incident card in [src/game/GameApp.tsx](src/game/GameApp.tsx), above the three buttons, one line that does not change per incident:

`A catch changes the board. A hide leaves it wrong. Three hides end the week unfinished.`

The buttons already say Report, Peer-check, Hide. Add the room consequence on each, in a few words:

- Report: your name goes on it. The board changes.
- Peer: someone looks with you. The board changes.
- Hide: the board stays wrong.

Do not replace the incident body. That body is the situation. These lines are the rule.

The morning brief already prints `yesterdayLine`. When yesterday was a hide, that function must name the object that is still wrong (`the tag is still up`, `the sticker still says 40`, `the log has your name on a blank`). When yesterday was a catch, name the object that changed. One sentence. It is already rendered under the brief. Do not add a second widget.

On the third hide, `resolveIncident` already pushes Mabel's line. Also set her emote to `dots` and move Jordan that same moment, not at the card. The player walks back into a different room.

The objective string for a day with an open incident ends with the standing rule only the first time, then the day's job. Do not stack paragraphs onto the HUD.

## Slice 5 — the dusk lot is the week

`beginEndingWalk` clears `npcLive`. Place people after that clear. Do not give everyone a sad speech.

Held week (`ended === "a"`):

- Elena on the east shore if `residue.valve === "caught"` or she has `elenaSecondEyes`.
- Tommy if `residue.tag === "caught"`.
- Marcus if `residue.dose === "caught"`.
- Holt if `residue.log === "caught"`.
- Priya if the shuffle was done and no residue is `"hid"`.
- Jordan if no residue is `"hid"`.
- Mabel a little south of the player, always, on a held week.

Each person who is present has one near-talk line that names the thing they saw you catch. No line if they are absent. Absence is the point.

Unfinished week (`ended === "c"`, including three hides):

- Mabel, far enough west that she is not in the player's face, emote `dots`.
- Jordan, east, facing away, radius 12.
- Nobody else. The stacks still breathe. The lake is still north. The card stays the card you have, but its first sentence must match who is missing. Do not invent a third ending.

The clock stays 17:10, the button stays `17:10 · Close the week`, the walk still has to happen before the card. Do not reopen that.

## Order

Do the slices in order. Slice 1 is the only one that may land alone. Do not start slice 5 while a hide still paints `CAUGHT`.

After each slice: `npm run typecheck`, then the screenshot pair for that slice. Warp hooks already exist on `window.__controlsTest` (`warp`, `setDay`, `setFlag`, `beginEnding`). Add a `resolve(how)` test hook if that is the only way to fire Report and Hide without a scavenger hunt. Do not add a hook you do not use.

Commit when a slice's two pictures differ. Do not commit a slice that only changed dialogue.

## Not this

The academy, the parlor, and the fuel desk can stay as they are. Priya already has one line for the physics cab. Leave the minigames alone unless a residue flag is the only missing wire. The player's coat, the van's size, and the cafe's south door are not part of this file.
