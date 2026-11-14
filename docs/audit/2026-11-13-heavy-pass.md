# Heavy pass 1113

Work tree `/root/work/coffee`. Branch `g/heavy-pass-1113`. Base `origin/c/walk-unblock` at `0d8e73530320c2a8853d4c9f88f9f6470dc4ca89`. Built game served at `http://127.0.0.1:8093/`. Title screen was not clicked. Desktop was driven with `window.__controlsTest`.

## 1. Baseline SHAs and versions

| Item | Value |
|---|---|
| Base SHA | `0d8e73530320c2a8853d4c9f88f9f6470dc4ca89` |
| Tip after this pass | `0cab308bb119da1decd2ee4b6e6767079ea874e6` plus the audit commit that adds this file |
| Node | v22.23.3 |
| npm | 10.9.9 |
| Install | `npm ci` was already present; not re-run this session |
| Test runner | `ESBUILD=/tmp/esb/node_modules/.bin/esbuild npm test` (`node --test scripts/**/*.test.mjs`) |

Commits on the branch, oldest first:

| SHA | Subject |
|---|---|
| `834b12144bdffd29f13d146e3b234bc04731455f` | A1 BOWL live generation-k |
| `33393ce64ea9ec9ca8820728839b15fdc4734de2` | A2 LOTOTO orange slot from the seed |
| `4f113b8b7bdbffaee9f48ed01b0a1c95d8a19a97` | A3 bench uses the designed plant ΔT |
| `729fdd369f4d167235404ce6d51d83b41dd0e8e5` | A4 CATCH boards seeded from the day |
| `bce0f9bdf07b21a5cd1a56353290d6c734532182` | B2 window body inset 16 px (padding; measurement still failed) |
| `f16fcdc755ade2f065f23aed73c3a26a16d9063e` | A3 correction: bench ΔT only |
| `0cab308bb119da1decd2ee4b6e6767079ea874e6` | B2 window inset: direct child left is 18px |

`4f113b8` pointed `thermalState` at the design ΔT. That broke `thermal-state` ("a PlantDesign and its type give the same answer") and the BWR cam-draw hash. `f16fcdc` put `thermalState` back on `DT_AT_UNIT` and added `benchThermal` for the bench only. The diff of `thermalState` against `0d8e735` is empty. `benchThermal` is the new function.

## 2. Task table

Result is PASS only when a test failed before the behaviour, passed after, and failed again when the behaviour was broken on purpose. Screen tasks also need the screenshot text and the DOM text from the same run. Anything else is UNVERIFIED.

| Task | Result | Failing output before | Passing output after | Mutation output | Artifact |
|---|---|---|---|---|---|
| A1 BOWL k | PASS | New test, module absent: `Could not resolve ".../bowlModel.ts"`. `# tests 1 / # pass 0 / # fail 1` (`/tmp/evidence/a1-before.txt`). The canvas formula `prevFalls > 0 ? falls / prevFalls : null` was already in `MoreGames.tsx` at `0d8e735` (lines 892–894). | This session: `node --test scripts/bowl-k.test.mjs` with the other three: `# tests 5 / # pass 5 / # fail 0`. | This session, `generationK` returned `1` when `prevFalls > 0`: `actual 1`, `expected 0.16666666666666666`. `# pass 0 / # fail 1`. Restored: `# pass 1 / # fail 0`. | `/tmp/cc-scratch/bowl-physics.mjs`. Screenshot `docs/audit/2026-11-13-bowl-1100.png`. |
| A2 LOTOTO slot | PASS | Base code was `Math.floor(Math.random() * 9)`, not `const lie = 8`. New test, module absent: `Could not resolve ".../lototoSlot.ts"`. `# pass 0 / # fail 1`. | Same 5-test run: pass. `lieSlot(42) === 5`. 200 seeds cover slots 0–8. | `return 8`: `1 !== 9` (`seen.size` 1, expected 9). `# pass 0 / # fail 1`. Restored: `# pass 1 / # fail 0`. | `docs/audit/2026-11-13-lototo-1100.png`. Clock constant in `MaintGame.tsx` is still `CLOCK = 32`. Miss −2 s, wrong tag −4 s. Not edited. |
| A3 bench reads the design | PASS | No `bench-plant` test existed on `0d8e735`. The behavioural fail is the mutation. | `scripts/bench-plant.test.mjs`: `# tests 2 / # pass 2 / # fail 0`. Default PWR `dT === (62/100)*32`. | `benchThermal` forced `DT_AT_UNIT[type]`: non-default design `actual 19.84`, `expected 29.759999999999998`. `# pass 1 / # fail 1`. Restored: `# pass 2 / # fail 0`. | `/tmp/cc-scratch/bench-dt.mjs`. DOM diff below. |
| A4 CATCH seed | PASS | Before `deckSignature` existed: `M.deckSignature is not a function`. `# pass 0 / # fail 1`. | `scripts/catch-deck.test.mjs`: `# pass 1 / # fail 0`. Day 1 first kind `valve`, length 5, seed 7 repeats, seed 8 differs. | `const first = makeGauge`: `'gauge' !== 'valve'`. `# pass 0 / # fail 1`. Restored: `# pass 1 / # fail 0`. | `git diff 0d8e735 HEAD -- src/game/sim.ts` is empty, so `finishArcade` is unchanged. |
| A5 shuffle check | UNVERIFIED | No code change, so there is no fail-before. | `node --test scripts/shuffle-model.test.mjs`: `# tests 5 / # pass 5 / # fail 0`. | Not run. Changing the rule would be a retune. | `/tmp/cc-scratch/shuffle-rate.mjs` and `/tmp/game-shuffle-rate.mjs`. |
| B1 title clip | UNVERIFIED | Measured, did not fail. Reactor Control title delta 10 px. Academy title delta 10 px. Fail line is < 8 px. No code change. | n/a | n/a | Screenshot title text: `REACTOR CONTROL`, `ACADEMY`. |
| B2 body flush | PASS | On the build before `0cab308`, and on `bce0f9b`'s padding (the child is `position:absolute; inset:0`, so padding does not move it): direct-child delta **2**. Fail line is within 16 px. | After `0cab308`, direct child `[data-testid=window-inset]` delta **18**. `bottom` 664. `titleDelta` 10. `padding` removed. | Live DOM `left: 0px` measured delta **2**. Restored `left: 16px` measured delta **18**. | `docs/audit/2026-11-13-control-1100.png`. |
| B3 window bottom | UNVERIFIED | Reactor window bottom **664** at 1100×720. Fail line is > 720. No code change. | n/a | n/a | Same control screenshot. The window sits above the taskbar. |
| B4 taskbar vs Start | UNVERIFIED | 1100×720: 7 taskbar buttons, Start rect left 8 right 52 top 691 bottom 717, intersecting buttons `[]`. 390×844: `startCount 0`, `nav false`, `home true`, hits `[]` (phone home has no Start button). No code change. | n/a | n/a | `docs/audit/2026-11-13-taskbar-1100.png`. Visible taskbar text: `START`, `SETTINGS`, `MUSIC`, `NEWS`, `RADIATION`, `FALL`, `SOUND ON`, `6:52 AM`. |
| B5 Academy clip | UNVERIFIED | Quiz buttons at ALARA index 3: `scrollWidth === clientWidth` (83, 512, 512), `cut: []`, font 12 px. `Then leave.Time` run-on is false. The clause is in the copy twice (lesson body and still caption) plus an `sr-only` span inside `Chatter`. Copy was not edited. | n/a | n/a | `docs/audit/2026-11-13-alara-1100.png`. The portrait line was still revealing when the shot was taken (`Then lea`). `.teach-body` at that moment: `scrollWidth 322`, `clientWidth 322`, font 16 px. |
| B6 schematic labels | UNVERIFIED | 11 labels, intersecting pairs `[]`, at 62% PWR after the inset. No code change. | n/a | n/a | Visible: `CORE`, `SG`, `HOT 312C`, `COLD 292C`, `15.5 MPA`, `HEAT`, `RODS`, `350`, `285`, `SIMPLIFIED TEACHING DRAWING.`, `NOT A LICENSE.` |
| B7 text floor | UNVERIFIED | Computed font minimum inside the window body: Reactor Control 12, Academy 12, Settings 12, Radiation 12, News 12. Count under the floor: 0. No code change. | n/a | n/a | Measured with `getComputedStyle` on elements that have a direct text node. |
| B8 colour-only | UNVERIFIED | No DOM test failed. Not changed. `drawTag` writes `SVC` or `LOTO`. `drawDose` writes `40` or `0.04`. `drawGauge` uses a different needle angle for the red gauge. The schematic colour bar is hue-only unless `colorSafe` is on (`BAND_TICK`). Ticks were not turned on. | n/a | n/a | `src/game/Arcade.tsx` `drawTag`, `drawGauge`, `drawDose`. `src/game/schematicMath.ts` `BAND_TICK`. |

## 3. Baseline vs after

Walk14, both widths. Command: `node scripts/walk14.mjs /tmp/walk14-final`. Result rows compared to `/tmp/walk14-base/walk14-table.md`: all 14 result cells identical.

| | pass | pending-owner | fail | page errors per width |
|---|---|---|---|---|
| Baseline `/tmp/walk14-base` | 11 | 3 (steps 2, 6, 13) | 0 | 1 |
| After inset `/tmp/walk14-final` | 11 | 3 (steps 2, 6, 13) | 0 | 1 |

Step 9 after the inset, both widths: `Power 62.0% → 60.5%`, `flow 100% → 100%`, `Rods 62% → 52%`, `ΔT 19.8 → 19.3 °C`. Hold bar present. That arrow is the walk driver moving the rods. The untouched 62% readout is the DOM diff below.

A boot of the after build recorded one page error: `Minified React error #419`. The walk driver prints the count, not the message. Both walks print count 1 per width.

npm test. Baseline file `/tmp/baseline-npm-test.txt`: `# tests 197 / # pass 188 / # fail 9`. This session `/tmp/npm-test-head.txt`: `# tests 202 / # pass 193 / # fail 9`. Exit code 1 both times. The five extra tests are the new A1–A4 files (5 subtests). Failing names, same set both times:

1. `scripts/cabinet-rewards.test.mjs` (`Cannot find package 'esbuild'`)
2. `scripts/desk-verdict.test.mjs` (`Cannot find package 'esbuild'`)
3. `injects project id on the script and meta when provided`
4. `does not duplicate grok:app_id`
5. `injects x:creator tags when both creator values are set`
6. `does not duplicate x:creator tags`
7. `platform chrome injects twitter:card when the document has none`
8. `leaves an existing twitter:card alone`
9. `uses the app name in the injected title tag`

`teaching-lab` (`full-core and depletion change k and the OpenMC letter`) is `ok` in both logs (baseline subtest 174, after subtest 179). The sandbox has `npx esbuild` cached. It is not one of the 9 failures here. It was not made to fail.

tsc. `npx tsc --noEmit --pretty false` before the inset and after `0cab308`: exit 0, stdout 0 bytes, zero `error TS` codes.

62% bench DOM. `diff -q /tmp/bench-62-before.txt /tmp/bench-62-after2.txt` printed nothing and exited 0 (byte-identical `document.body.innerText`). Readout lines in both files:

```
HOT 312C
COLD 292C
15.5 MPA
Power
62 %
T-hot
311.8 °C
T-cold
292.0 °C
ΔT
19.8 °C
Q = ṁ × cp × ΔT · 28–36 °C · hold 0.0 / 8 s
Rods withdrawn 62%
Primary flow 100%
```

The same strings are visible on `docs/audit/2026-11-13-control-1100.png`: `POWER 62 %`, `T-HOT 311.8 °C`, `T-COLD 292.0 °C`, `ΔT 19.8 °C`, `RODS WITHDRAWN 62%`, `PRIMARY FLOW 100%`, `HOT 312C`, `COLD 292C`, `15.5 MPA`.

## 4. Independent recomputations

These scripts do not import the game. `node` was run on the files under `/tmp/cc-scratch` and `/tmp/game-shuffle-rate.mjs`.

Bowl. `/tmp/cc-scratch/bowl-physics.mjs`. Inputs: aim −0.24 rad, power 1, dt 1/60 s, two rolls. Damping `exp(-0.4*dt)`, pin contact `d2 < 80`, chain `d2 < 70`. Output:

```
{"falls":[6,1],"kFromCounts":[null,0.16666666666666666],"kCheck":0.16666666666666666}
```

`k = 1/6` from the raw counts. The game test asserts the same falls and the same `k`. This roll is not a 10-pin strike.

Bench. `/tmp/cc-scratch/bench-dt.mjs`. `dT = (powerPct / max(40, flowPct)) * unit`. Seed power 62, flow 100, PWR unit 32, cold leg 292.

```
{"base_dT_C":19.84,"base_dT_1dp":"19.8","tCold_C":292,"tHot_C":311.84,"tHot_1dp":"311.8","custom_dT_C":29.759999999999998}
```

DOM shows `19.8` and `311.8`. A design unit of 48 gives 29.76, which is the number the A3 mutation failed to produce.

Shuffle. Rule in `src/game/shuffleModel.ts`: `FQ_MAX = 1.5`, `RIM_MAX = 0.5`, `MIN_SWAPS = 3`. `GROK_PHASES_1-4.md` says Fq under 1.50, rim share at most 50%, at least 3 swaps, and "about 73%".

Independent `/tmp/cc-scratch/shuffle-rate.mjs`, 1000 LCG scatters, enrichment 4.5:

```
{"pass":754,"rate":0.754,"bestFq":1.3186581984347094}
```

Game module `/tmp/game-shuffle-rate.mjs`, same starts:

```
{"pass":754,"rate":0.754,"bestFq":1.3186581984347094,"startFq":1.4690307462479049,"startRim":0.4138582996034509,"startSwaps":7,"fqMax":1.5,"rimMax":0.5,"minSwaps":3}
```

The two scripts match. 0.754 is not the doc's "about 73%". The pass rule constants match the doc. The rate was not retuned.

Sign of ΔT: hot leg minus cold leg, °C. General knowledge of how a coolant temperature rise is defined. Not a book citation. The 32 °C PWR unit and the 292 °C cold leg are the code's constants, not a quoted measurement from a book.

## 5. Known failures

Nine names, listed in section 3. No additional failure in `npm test` or `tsc`. `teaching-lab` passed here. The brief asked for that name as a tenth sandbox failure (`npx esbuild` ENOTFOUND). It did not fail, and it also did not fail at baseline.

## 6. UNVERIFIED

- A5. Checked. No code change, so the fail-then-pass rule cannot be met. Numbers are in section 4. Not counted as a pass.
- B1, B3, B4, B5, B6, B7, B8. The stated measurement did not fail, or the repeated clause is existing copy (`content.ts` lesson body and still caption) plus `Chatter`'s `sr-only` span. No fix commit. Not counted as passes.
- A1 visual string. The screenshot shows `k — first generation (teaching proxy)`. `document.body.innerText` in that run does not contain it. The line is `fillText` on a canvas. The number check is the unit test, not the DOM.
- A1 is not a 10-pin strike. The checked roll is 6 then 1.
- `bce0f9b` (paddingLeft 16) did not move the measured child. It is not the B2 pass. `0cab308` is.

## 7. Owner decisions

Not done. Design-doc numbers from the brief:

- Items 2, 3, 5. Culture and trust changes. CATCH credit cap. Report/Peer trade-off.
- Item 4. DELAY's Λ. Code on this branch: `DelayGame.tsx` `const LAMBDA = 0.005`. The comment mentions an older Λ of 0.055. Not changed. `N_MAX` is 40. Not changed.
- Item 7, day-2 consequence. Not added. It would change residue.
- Item 8, pebble ΔT default. `DT_AT_UNIT.pebble` is 475. Not changed.
- Item 10. LOAD procedural pulses and the xenon forecast.
- Item 11. Desk verdict wording.
- Item 12. Pebble multi-pass.
- Item 13. Academy page merge and the control-rod page.
- STYLE-STANDARD display scales. File not edited.
- Walk steps 2, 6, and 13. Left pending-owner. Regions stay "Pending verification". `fuelMassKg` stays null.
- Schematic colour-bar ticks stay behind the `colorSafe` switch.

## 8. Copy proposed for the owner

None added to the game. The bowl canvas already said, at `0d8e735`: `first generation`, `the falls multiply`, `the falls die out`, `holding steady`, `(teaching proxy)`. Those strings were not edited.

The ALARA lesson body and the still caption both start with `Time, distance, shielding — and still seeing.` That repetition was left in place.

## 9. Blockers

No new test failure. Walk14 result cells did not change. The 62% bench `innerText` is byte-identical. `thermalState` still uses `DT_AT_UNIT`.

Not a merge blocker: the shuffle pass rate is 754/1000 (0.754) in both the independent script and the game module. The doc says "about 73%". The rule constants match. The rate was not retuned.

`4f113b8` is an intermediate commit. Review the branch tip, not that commit alone.

## 10. Closing line

No new teaching prose, no region number, no NRC title, no headline.
