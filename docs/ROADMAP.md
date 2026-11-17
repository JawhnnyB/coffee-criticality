# Coffee & Criticality: from a good build to a full experience

Written 18 November 2026, after PR #28 and the fixes on `c/site-fix-1118`. Read this before you plan new work. Every item gives:

- **Why:** what it adds to the experience.
- **What:** the work, and what proves it is done.
- **Source:** the real-world basis, where physics is involved.
- **Owner:** decisions that are the owner's to make.
- **Size:** S (under a day), M (a few days) or L (a week or more).

## Where the game stands

It is a week at a plant: five days and four incidents (Valve 14, Pump 2A, the 40 mSv/h sticker, the log with no initials). Each incident offers three choices: report, peer check, or hide. The theme is "catch > heroics."

The player designs Unit 1 in Reactor Design (PWR, BWR, pebble bed or salt), and that type is now the site. It shows in:

- the hall, the control-room mimic, the lot roof and the skyline
- the live cutaway and Reactor Control
- each type's own controls, its plant calls, its hall sound and its lesson text

**The gap.** The reactor type changes what you see, and the week's story doesn't know about it. The incidents, the clock, the end-of-day paper and the people are the same at every site. Plant calls only happen when you press a button on the bench. Walking the plant is scenery, not work. The rest of this roadmap closes that gap, in order.

---

## Milestone 1: Ship what exists (about a week)

Nothing new until this is done. A full experience built on unverified screens will crack.

1. **Merge the stack in order.** Grok reviews `c/site-fix-1118`, the stack merges into `g/site-1118` (PR #28), and Claude reviews #28. Then #28 goes to `main`. Close PR #26 R3 first. Size S. Owner: the merge.
2. **Real typecheck and build in CI.** This environment had no React types, so only the non-React modules were typechecked here. Add a GitHub Action: `npm ci`, `tsc`, `vite build`, and the unit suite compared against the baseline. Every PR then carries a real result, not a claim. Size S.
3. **Intro art matches the cast.** `public/art/intro/scene-*.png` and `badge.png` still paint the old chibi cast, so the player changes body between the intro and the game. Redraw the figures in those scenes from `draw-cast.mjs` frames, keeping the backgrounds. Size M. Owner: approve before and after.
4. **Portraits match the walkers.** Check every `portrait-*.png` against the new sheets: hair colour, bun, glasses, skin. Size S.
5. **A full week, on foot, at both sizes.** Five days, every incident, each choice at least once. Real keys only. Stills of each end-of-day paper for all four types. The clock is slow by design: 0.36 game minutes per walking second, so a day takes about 30 real minutes. Size M.
6. **Fix the build's phone story.** Reactor Control and the Academy were never opened by real taps at 390×844 before #28. Check the bench sliders, the plant call and the freeze-valve button with a thumb, at 44 px targets. Size S.
7. **The end-of-day paper repeats Holt.** On day 1 it prints "Holt: Skill without a safe floor is unfinished power." and then the same sentence again, starting the next line. Find where the two lines are assembled and drop the duplicate. Size S.
8. **The scram on non-PWR types, by eye.** The water types keep only the dim decay glow. Helium and salt have none. Pebble outlet numbers follow power and flow. Size S.

## Milestone 2: The type matters to the week (2–3 weeks)

This is the step that turns four skins into four plants.

1. **Incidents in each type's own hardware.** Same incident, same choices, same frozen numbers. Only the nouns and the hall picture change, all in `siteText.ts`:
   - Valve 14: PWR charging line, BWR feedwater, pebble helium purification, salt off-gas.
   - Pump 2A: RCP, recirc pump, helium blower, salt pump.
   - The sticker: the dose story moves (see M3, radiation).
   - The log: unchanged.

   Size M. Owner: text approval.
2. **Plant calls on the game clock, not a button.** Watch `s.period` from `GameApp` (no sim edit). At a period change while the plant is running, queue one call. The phone buzzes, Priya or Holt names it, and the player must walk to the control room to answer. A call left unanswered for an hour of game time resolves as the wrong answer. Size M. Owner: whether calls may cost culture points (that touches sim scoring, which is frozen).
3. **What happens stays.** A tripped pump is tagged out in the hall until the next morning: a red tag, and arrows stopped on that line. A tube leak keeps its mark, and the steam line shows a rope barrier. A drained salt core shows the drain tank warm and the vessel cold the next day, with restart as a morning task. Size M.
4. **The end-of-day paper reports the plant.** Peak power, any scram, calls answered right and wrong, and the type's own line (BWR recirc trips, pebble passes, salt drains). The paper already draws the site skyline. Give it the numbers. Size S.
5. **Priya and Holt know the plant.** About six lines each per type, at the moments they already speak: first walk in the hall, the first scram, the end of the week. Size S. Owner: all of it is new text, so the owner writes or approves it.

## Milestone 3: Walking the plant is work (3–4 weeks)

Real operators spend most of a shift on rounds: walk a route, read gauges, write them in the log, and notice what is off. This game is about noticing, so rounds are its core loop.

1. **Rounds.** Each type gets a route through the hall and the lot with 6–8 gauges. Each gauge reads the live run: hot leg and cold leg, pressurizer level, recirc flow, helium outlet, salt level, off-gas pressure. Pressing E writes the reading in the log. The incident "the log has no initials" becomes the moment the player's own log is checked. Most days the readings are right. On an incident day one is wrong, and catching it is the catch.
   - **Source:** NRC operator rounds and log-keeping practice. INPO's human-performance tools (peer check, self-check) are already the game's report/peer/hide.
   - Size L. Owner: whether a missed reading costs culture.
2. **Radiation that differs by type, true to life.**
   - **PWR:** the containment is closed at power, because nitrogen-16 in the primary makes it a high-radiation area. The hall view is from the equipment hatch window.
   - **BWR:** the steam carries N-16 (7.1 s half-life) to the turbine, so the turbine hall is a radiation area at power, and that is where the dose sticker lives.
   - **Pebble bed:** helium activity is low. The dose is at fuel handling and the discharge line.
   - **Salt:** the reactor cell is sealed and maintained remotely, and the off-gas holds xenon and krypton.

   Show it with the existing ALARA mural and a pocket dosimeter that ticks faster where it should.
   - **Sources:** NRC BWR and PWR systems manuals (N-16), MSRE remote-maintenance reports (ORNL), HTR-PM safety reports.
   - Size M. Owner: dose numbers must come from sources or stay "Pending verification", per the frozen-values rule.
3. **The hall changes with power and with time of day.** Light level, steam plume, fan noise and pump pitch all follow power. Night shift gets dimmer corridors and fewer people. Most of the inputs already exist (`sitePower`, the season wallpaper, `siteAudio`). Size M.
4. **Startup and shutdown as days, not sliders.**
   - **Day 1 morning:** a startup checklist, with rods withdrawn in steps and the period watched (the period lesson already exists).
   - **Day 5 evening:** a controlled shutdown.

   Each type gets its own checklist: a PWR heats up on pump heat, a BWR raises pressure, a pebble bed starts the blowers, and a salt plant fills from the drain tank. Size L. Owner: frozen bench numbers stay; this uses the bench as it is.

## Milestone 4: Reasons to come back (3+ weeks)

1. **Unit 2.** Unit 1's type is locked, which is right. Unit 2 is the replay: a second week at the same site with a new unit of a different type, so the player compares two plants side by side. The hall shows both. The Compare card already exists. Size L. Owner: whether week 2 exists at all, and how save data carries over (`save.ts` is frozen, so it needs an owner decision).
2. **A week-end debrief.** One page: the catches, the hides, the readings, the calls. It ends with a line about what this culture looked like from the outside. Size M. Owner: text.
3. **The arcade earns its place.** Each cabinet already teaches one idea (DELAY, ROD.BANK, PEBBLE, LOTOTO…). Unlock one per catch, and let a cabinet's lesson show up on the floor the next day: LOTOTO before the Pump 2A tagout, PEBBLE before a pebble jam. Size M.
4. **Academy that answers what you saw.** After each call, the matching lesson is one tap away, with that day's numbers in it: "Your outlet was 735 °C because…". Size M.

## Milestone 5: Finish (ongoing)

- **Sound pass:** one mix across rooms, ducking under dialogue, and volume by room.
- **Accessibility:** the colour-safe mode covers the cutaway ramp, the mimic and the gauges. Add a reduced-motion check on every animated canvas, captions for hall sound, and full keyboard play.
- **Performance:** hold 60 fps on a mid-range phone in the hall, with the cutaway and sound running together. Measure first.
- **Save versioning:** before any new saved field ships, decide how old saves load (owner, since `save.ts` is frozen).
- **Credits and sources page:** every physics claim in the game links to its public source, in one place.

---

## Owner decisions this roadmap needs, in the order they block work

1. Approve or rewrite the new text in `src/game/siteText.ts`, `siteEvents.ts` and the drained message (see `docs/decisions-pending.md`).
2. Intro art: redraw the cast in the scenes (recommended), or keep the old scenes.
3. Plant calls: may they cost or earn culture points? If yes, `sim.ts` scoring needs a reviewed exception to the freeze.
4. Rounds: does a wrong or missed reading count against the player?
5. Dose numbers: which sources are approved for player-visible values?
6. Week 2 and Unit 2: yes or no, and the save plan.
7. The open items in `docs/OPEN-QUESTIONS.md` (Imagine art, DELAY LAMBDA, D1).

## How to work through it

- **Branches:** one milestone item per branch. Grok authors on `g/`, Claude on `c/`. Each reviews the other, per `docs/CROSS-REVIEW.md`.
- **Tests:** every physics rule gets a test that runs the real bench or the real thermal model, not a constant. A behaviour you can see gets a real-input browser check, with its still saved in `docs/audit/`.
- **Text:** new text goes in `siteText.ts` or `siteEvents.ts` and is listed in `decisions-pending.md` until the owner approves it.
