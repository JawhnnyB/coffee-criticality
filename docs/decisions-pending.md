# Decisions pending owner review

Conservative choices made so the work could continue. Nothing here is a tuned sim number.

## Text for owner review

Every line that changes with the reactor this site is lives in `src/game/siteText.ts`, keyed by `pwr`, `bwr`, `pebble`, `msr`. PWR values are the sentences that were already on the floor. The other three columns are new and are yours to rewrite.

`nuclearLab.ts` does not contain about 24 separate sentences that name CRDMs, the pressurizer, a steam generator, or the hot and cold legs. A search of that file found two: the νΣ_f step that ends at the steam generator (`steamPath`), and the vessel paragraph that names the downcomer and the hot-leg nozzle (`vesselPlain`). The coolant lesson also has the step `PWR: keep it liquid. Pressure is a promise.` (`coolantStepPwr`). `speak()` swaps a lesson string only when it is exactly the PWR sentence. Other nuclear-lab lines stay as written.

Keys in `src/game/siteText.ts` (each key exists for pwr, bwr, pebble, and msr):

| Key | Where it is read |
|---|---|
| heatLeaves | Academy page "Heat has to leave" (`GameApp.tsx`) |
| windowReactor | Still `window_reactor` (`GameApp.tsx` StillStage) |
| loopHeader | `LoopSchematic.tsx` |
| loopCaption | `LoopSchematic.tsx` |
| anatomy | Academy extra "anatomy" (`GameApp.tsx`) |
| fluids | Academy extra "fluids" (`GameApp.tsx`) |
| vesselPlain | Nuclear desk, via `speak()`, when the lesson text is the PWR vessel paragraph |
| coolantStepPwr | Nuclear desk, via `speak()`, when the step is the PWR coolant sentence |
| steamPath | Nuclear desk, via `speak()`, when the step is the PWR steam-generator sentence |
| fastSalt | Still `msr_fast` (`GameApp.tsx`) |
| hallFloor | Still `reactor` and the pause-map hall line is `hallBlurb()` |
| vesselNames | Academy page "The vessel has names" (`GameApp.tsx`) |
| whyThermal | Nuclear desk, Σ_s1→2 lesson, "why": the PWR sentence says "this site is a PWR". Added 18 Nov by Claude. |
| voidStep | Nuclear desk, MTC lesson step: the PWR sentence says "This site is a PWR. Void is not a knob here", which is wrong on a BWR. Added 18 Nov by Claude. |

`scripts/site-text.test.mjs` now checks every lesson field on every non-PWR site and fails if any still says the site is a PWR.

`hallBlurb()` in the same file replaces only the reactor-hall pause line. Other rooms keep `ROOM_BLURB`.

### Card that said chloride

Chosen: the fast-salt card matches the drawing, which is the fluoride CNRS MSFR.

- `src/game/content.ts` still `msr_fast` title and body.
- Academy page "Salt, three ways": "Fast chloride (no graphite)" became "Fast fluoride, the MSFR (no graphite)".
- `siteText.msr.fastSalt` says fluoride, thorium blanket, not a chloride pool.

Other options: leave the card saying chloride and change the drawing, or show both chemistries. Not chosen, because the drawing was already tested as the MSFR and the brief said to change the card.

### What was left in place

- Reactor Design buttons in `ReactorBuilder.tsx` still name CRDMs, the steam generator, and the pressurizer on the PWR choice. Those lines label the choice. They are not a claim about a plant already signed.
- `PlantHud.tsx` already had a line list per type. It was not copied into `siteText.ts`.
- The Academy page "The vessel has names" still has the PWR sentence in `content.ts`. The screen reads `siteText` instead, so a non-PWR site does not show the PWR sentence. The content.ts sentence was not rewritten, so the PWR words stay the source.

## Controls

Chosen: `siteControls.ts` maps operator input onto the power, flow, and rods the bench already writes. The sim files were not edited.

- PWR: the bench numbers pass through.
- BWR (changed 18 Nov by Claude): power is the bench's own power. `benchStep.ts` already gives the BWR the largest coolant coefficient, standing in for voids, so more recirc flow cools the core, adds reactivity, and power climbs to a new rest point with the delayed-neutron lag. The earlier `bwrPower(flow, rods)` formula replaced that power after each frame, so the panel, the run and the band hold disagreed. It was removed. Checked on screen: rods 80, recirc 70% gave 60% power, recirc 120% gave 84%.
- Pebble: a "Pass a pebble" button raises burnup by 8 MWd/kg and discharges at 90. The panel outlet (changed 18 Nov by Claude) is the thermal model's hot temperature, inlet plus Q / (ṁ cp): 735 °C at full power and full blower, hotter at lower blower, cooler at lower power. HTR-PM is about 250 °C in and 750 °C out (Zhang et al., Engineering 2016).
- Salt (fixed 18 Nov by Claude): "Open the freeze valve" is a shutdown. From the moment it is ordered the band hold stops counting and the run cannot pass. Fission heat falls with the salt level, and when the salt is gone the run ends as a scram with the line "Fuel salt drained. Fission stopped. Decay heat goes to the drain tank. Teaching only." That line is new text for owner review. Before the fix, the hold kept counting and the run ended "BAND.HELD" at 93% power. βeff is shown as 0.55 × β. Display only.

The per-frame decision is `siteStep()` in `siteControls.ts`, a pure function with tests that run the real bench.

The day-incident machine in `sim.ts` was not used for these controls. It is part of the frozen shift story.

## Shift events

Chosen: the twelve events live on Reactor Control as "A call from the plant". They do not join the week incident list in `sim.ts`. That list has its own rates, and those files are frozen.

A right response ends the call. A wrong response sets `ended`, which the panel prints as "Worse." A scram writes scram. The tube mark stays on the hall face after you leave the bench.

Changed 18 Nov by Claude, with an explicit outcome row per event (`OUTCOMES` in `siteEvents.ts`):

- One pump tripping halves the flow (bench flow 50%, the slider floor). It used to write flow 0, which overheated the core and scrammed it even after the right answer. A PWR has other loops still pumping. A BWR keeps one recirc pump and natural circulation.
- Wrong answers that a real plant trips on now scram: holding full power after an RCP trip, a stuck-open spray valve, a frozen salt line, and thawing the freeze valve with the rods pulled.
- "Freeze-valve heater fault" was backwards. The MSRE freeze valve is held frozen by cooling air, and heat opens it. The event is now "Freeze-valve cooling air lost": the plug warms, and if it opens, the drain is the designed shutdown. Its title, panel, hall, right and wrong lines are new text for owner review.

Other option: roll the events on the game clock inside `sim.ts`. Not chosen.

## Hall sound

Chosen: Web Audio oscillators in `audio.ts`, driven by `hallTone()` in `siteAudio.ts`. No samples. PWR and BWR are a pump hum plus a hiss. Pebble is a blower whine. Salt is a cooler drone plus a heater tick. A scram leaves a low decay-heat fan. Gain is 0 when sound is off, and 0 in the cafe (distance 1). The mute flag is the existing `cc.mute` setting.

Other option: one shared hum for every type. Not chosen, because the brief asked for a different loop per type.

## Character sheets

Chosen: redraw the eight walk sheets by hand in `scripts/draw-cast.mjs`. Same frame, 128×192, four frames, three rows. Feet stay in the bottom of the cell, the same footprint the rooms already use. Faces are eyes, a one-pixel nose, and a mouth. No snout.

The player sheet keeps the tintA6 key colours (`#5a9438`, `#98c860`, `#3a6824`, `#7a4028`, `#c47840`, `#f5c9a0`, `#2a1810`, `#3b2318`) so the hoodie picker still recolours the shirt and the hair. Those keys are not all in `palette.ts`. NPC sheets use palette colours only. Cherenkov blue is not on any person.

Other options: leave the old sheets, or paint the player in palette colours and lose the hoodie picker. Not chosen. The old walk sheets are in `reference/old-sprites/`. The other sprite files (idle, loco) were not the sheets the walker draws, so they were left where they were.

Changed 18 Nov by Claude: every front and back head had a light pixel at each top corner. On Mabel's grey hair the cream highlight read as two horns. The corners are now plain hair with one shine across the crown, buns are rounded, and Mabel's highlight is `muted` grey. Run `node scripts/draw-cast.mjs` to rebuild the sheets.

Still open: the intro scenes (`public/art/intro/scene-*.png`) and the badge have the old chibi cast painted in. In-game walkers and intro art no longer match.





## Crew scenes, cabinet levels and the Refuelling Outage (18 November, Claude)

The owner asked for a progressing social environment, progressing mini games, and fuel shuffling, and chose: a new outage mode beside the 6×6 puzzle; preset published data plus the player's own OpenMC results; progress saved as flags; Claude drafts the text and the owner approves it.

### Text for owner review

**Approved by the owner on 20 November 2026** ("You have my approval to push anything that needs my approval"). This covers every item in this section and in "Choices made without the owner" below, and the earlier text lists in this file.

- `src/game/socialScenes.ts`: 21 scenes (three per person), every line and choice. Marked DRAFT in the file.
- `src/game/OutageApp.tsx`: the outage's explanatory lines, including the result verdicts ("Yours is as long or longer, and no more peaked." and the two others).
- `src/game/GameApp.tsx` `noteCab`: "CATCH.CAB level 2: 40 s clock." style unlock lines, and "level 3 is cleared. Mabel sets it up once they trust you."
- `src/game/cabLevels.ts` `LADDERS[*].what`: the few words for each level ("quicker fish", "the lane drifts").
- Tier names in `src/game/social.ts`: New, Colleague, Trusted, Close.

### Choices made without the owner (most conservative option)

- **Tiers** come from trust gained since the first morning (6, 14 and 24 points), with day gates: Trusted from day 2, Close from day 4. Nobody is close by Tuesday. The first conversation with each person never carries a scene, because it belongs to the introduction.
- **Scenes** are added after what the person would have said anyway, never in place of it, so incident and goal lines are untouched. sim.ts's own pickChoice applies their trust, culture and flags.
- **Cabinet levels:** seven cabinets have three levels each; DELAY (frozen file), LOAD and PHYS (tested teaching models) stay at one. Level 3 at GOLF (Mabel) and BOWL (Jordan) also needs the host at Trusted. The clear scores are a first guess and need a playtest: catch 4/5 boards, rods a full hold, pebble 5 then 6, fish 4 then 5 of 6, golf 8 of 10, bowl 5 then 6, horde 20 then 30 kills, plot 6 then 8 harvests.
- **The outage opens** when Priya's Trusted scene hands it over (flag `outageOpen`), or from day 4 if that never happens.
- **The outage saves** in its own browser key (`cc.outage.v1`), not in the game save. Flags record what matters to the story: `outage:c2:done`, `outage:c2:beat`.
- **The pass line** compares your loading with the plant's own pattern in the same simulator, not with the 1.435 FΔH limit, because the simulator does not model pins. Both numbers are shown.
- **OpenMC:** `tools/openmc/beavrs_lattice.py` was written and syntax-checked here, but not run. This environment has no OpenMC and no nuclear data. Someone with OpenMC should run one type and paste it in before this is called done.

## Night Watch and the Plant Monitor (20 November, Claude, under the owner's standing approval)

- **Night Watch** (`src/game/NightWatch.tsx`, `src/game/nightwatch/`): a desktop app once Unit 1 is designed. Five nights, unlocked in order. A survived night sets `night:<n>:done` and gives Elena +2 trust (she relieves you at six). Night Watch runs on its own clock. The day's clock is not touched.
- **Radiation on both boards** is shown against its own normal level (×N), not in dose units, following the rule that player-visible dose values need an approved source.
- **Pressures** are each type's published nominal values: PWR 15.5 MPa primary and 6.9 MPa steam; BWR 7.0 MPa; HTR-PM helium 7 MPa; MSRE cover gas 5 psig. Temperatures come from the game's thermal model.
- **The Plant Monitor** alarms only on a reactor trip, core ΔT above its band, or power above 104%. The ΔT band is the trainer's target, so low ΔT at low power is normal and not an alarm. Its alarm flashes its icon (desk, Start menu and phone grid), its taskbar tab and the Start button. The Start button flashes too, because the frozen default desk does not pin the monitor.
- **New text** (approved under the standing approval, listed here for reference): event titles and shift-log lines in `nightwatch/model.ts`, and the desk lines, summary lines and Elena's "Walk me through the log." in `NightWatch.tsx`.

## Night Watch cameras: realistic footage (20 November, owner's request)

- **The owner's exception:** the camera feeds are the one realistic part of the game, on purpose ("the only real esc part of the game… more eerie but also immersive"). They are not bound to the palette, and only the feeds are: the window around them, the buttons and the annunciator wall stay in the game's style.
- **How they are made:** drawn in code (`src/game/nightwatch/cameras.ts`), no photos and no generated art. 480×270 frames: one-point-perspective rooms, shaded pipes and vessels, ceiling lights with floor pools, safety signs. Then a camera pass: a grade per space, grain, scanlines, lens vignette, a slow rolling bar, the auto-gain breathing, static and torn bands while switching, and emergency lighting (dark with a red cast) after a trip.
- **Colour or infrared:** spaces that are lit around the clock (turbine hall, containment, valve rooms, aux corridor, yard) are colour. The dark spaces (BWR drywell and torus, steam tunnel, reactor cavity, intake) are infrared black and white, where a beacon reads as a bright bloom rather than red. Cherenkov blue appears only in the fuel pool.
- **People in the plant:** Jordan, the night rover, walks two rounds a night along a fixed route and calls each space in on the radio log under the feed. He is not an anomaly, so reporting him is a false report. Elena's headlights come up the access road on the yard camera at 05:45, and the gate calls her in.
- **Sound:** a 60 Hz transformer hum, an HVAC rush, and a burst of static on every feed change. The hum rises a little while alarms are lit. It goes through the game's master mute.
- **Needs the owner's eye:** whether infrared on the five dark spaces makes events too hard to see (the tests check every event still changes the picture), and the new radio lines in `nightwatch/model.ts`.
- **Plates fix (21 November, Grok, branch `g/nw-plates`, not merged):** The state crops were invisible because `blitFeather` erased itself. The mask is now built once and applied once, at 960×540. Every state box is the measured change plus 8 px (`scripts/measure-states.mjs`). Signs are baked into the photos (`scripts/bake-signs.mjs`); photo frames do not call `marks()`. Regenerated: open door, bare freeze valve, dark heater zone, pool (cell grid), cavity floor (concrete, no gravel), low pool, tool bag, hard hat composited onto the corridor, and an eight-frame rover walk. The hard-hat oddity still flashes the turbine camera, so that night shows the code hat on the turbine photo; the corridor hat plate is not what that oddity draws. Frame time at 4× CPU is 6.0–6.7 ms (was 28–60). The 8 ms target is met for `paintCamera`. `vite preview` still looks for `dist/server/server.js`, which the Vercel preset does not emit; `node scripts/preview-built.mjs` serves the Nitro build. Both production nights reached 06:00 (page errors 0, failed requests 0). Night 3 showed the open door and the turbine hard hat; the chair was not drawn. Evidence: `docs/audit/2026-11-2x-plates-fix/`.


## Crew moments (23 November 2026, Claude draft, needs the owner)

- Ten short scenes that play only when the week's record says something happened (Valve 14 reported or hidden, the tag, the dose, the log, catches, hides, maintenance done), plus Jordan introducing himself as the night rover on day 5.
- Every line is in `docs/crew-moments-draft.md`. Not approved yet. They count as AI-drafted dialogue for the Steam disclosure unless the owner rewrites them.
