# Crew scenes, cabinet levels and the Refuelling Outage (18 November, Claude)

Branch `c/crew-outage-1118`, on top of `c/site-fix-1118`. The scripts here drove the game built from this branch. Setup used test hooks (boot, warp, set day, open desk, launch a cabinet), labelled in each script; every check after setup used real keys and clicks.

## Checks

| What | How | Result |
|---|---|---|
| A scene unlocks through trust | `social.mjs`: talk to Mabel with the E key five times, answer with clicks | Trust passed +6 after the fourth talk. "Mabel · Colleague." toast. Fifth talk played "The kettle". Relationships panel: "Colleague · Not before day 2", plus the line learned. 0 errors. `social-*.png` |
| The outage runs the plant's own Cycle 2 | `outage.mjs`, 1280×720 and 390×844 | 290 EFPD, peak 1.45, start boron 931 ppm, in about 4 s. Letdown chart with the plant's measured points. `outage-plant-pattern-1280.png` |
| A worse loading is called worse | Same script: fresh 3.2% at E10 swapped with burned fuel on the rim at B08 | Peak 1.69 at H02, next to the reflector. "Yours peaks higher than the plant's." `outage-swap-*.png` |
| A bad paste is refused in words | Same script: `{"version": 2}` | "Expected "version": 1." |
| Levelled cabinets still open | `cabs.mjs`: CATCH, FISH, PLOT, HORDE, GOLF, ROD.BANK, PEBBLE, BOWL | All open, 0 page errors (level 1) |
| Unit suite | `unit.txt` | 274 tests, 265 pass. The 9 failures match the baseline. New: `outage-core` (7), `social` (6) |

## Calibration (`calibration.log`)

Fitted to measured BEAVRS data: the zero-power detector map (9.9% RMS at assemblies without absorber rods), the 975 ppm critical boron (exact), two at-power maps for the feedback coefficient, and the boron letdown (10 ppm RMS over Cycle 1's 29 points, 13 ppm over Cycle 2's 12). Not fitted, as checks: five more detector maps at 8.3% to 18% RMS (best late in each cycle), and the cycle lengths to 0 ppm, 315 against 327.2 EFPD and 290 against 272.7.

## Not verified

- Levels 2 and 3 on screen. Their tuning and unlock rules are unit-tested (`social.test.mjs`), but no browser run reached a level 2 unlock.
- `tools/openmc/beavrs_lattice.py` was not run. There is no OpenMC or nuclear data here. It compiles, and its geometry and compositions come from the BEAVRS spec through `beavrs_data.py`.
- A full typecheck and production build (no React types here). The new non-React modules pass strict `tsc`.
