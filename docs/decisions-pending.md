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
- BWR: displayed power is `bwrPower(flow, rods)`, written onto the run after the bench step so the bench cannot overwrite it. Rods are labeled "from below". The drawing of rods from below was already in the hall and the cutaway.
- Pebble: a "Pass a pebble" button raises burnup by 8 MWd/kg and discharges at 90. The panel outlet is 750 °C (Zhang et al., HTR-PM, Engineering 2016). The bench ΔT is still the sim's own number.
- Salt: "Open the freeze valve" melts the plug, then the level falls, then fission heat is 0 and the run is scrammed. βeff is shown as 0.55 × β. Display only.

Other option: teach BWR flow only as a caption and leave power on the bench kinetics. Not chosen, because the brief asked for power to rise with recirc flow.

The day-incident machine in `sim.ts` was not used for these controls. It is part of the frozen shift story.

## Shift events

Chosen: the twelve events live on Reactor Control as "A call from the plant". They do not join the week incident list in `sim.ts`. That list has its own rates, and those files are frozen.

A right response ends the call. A wrong response sets `ended`, which the panel prints as "Worse." A tripped pump writes flow to 0. A scram writes scram. The tube mark stays on the hall face after you leave the bench.

Other option: roll the events on the game clock inside `sim.ts`. Not chosen.

## Hall sound

Chosen: Web Audio oscillators in `audio.ts`, driven by `hallTone()` in `siteAudio.ts`. No samples. PWR and BWR are a pump hum plus a hiss. Pebble is a blower whine. Salt is a cooler drone plus a heater tick. A scram leaves a low decay-heat fan. Gain is 0 when sound is off, and 0 in the cafe (distance 1). The mute flag is the existing `cc.mute` setting.

Other option: one shared hum for every type. Not chosen, because the brief asked for a different loop per type.



