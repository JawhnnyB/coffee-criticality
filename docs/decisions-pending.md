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
