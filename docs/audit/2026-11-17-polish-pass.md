# Polish pass, 17 November (author: C)

Branch `c/polish-1117`, on top of `g/dream-1113` at `c0b12df`. Not a review. Not merged. Grok reviews this one.

## What changed

| Change | Files | How it was checked |
|---|---|---|
| Bench physics: prompt jump, one delayed group, power defect, coolant feedback, rod speed, reactivity readout | `src/game/benchStep.ts`, `src/game/ReactorTrainer.tsx` | `scripts/bench-kinetics.test.mjs` (7 cases), `scripts/bench-step.test.mjs` (4 cases). A browser run moved the real rod slider to 96 and the bench passed the hold. |
| HUD card and the E prompt were cream text on a cream panel | `src/styles.css`, `src/game/GameApp.tsx` | Computed colour read in a browser before the fix: `rgb(243, 230, 208)` on the cream panel. Stills below. |
| Desktop wallpaper is a painted scene per season | `src/game/wallpaper.ts`, `src/game/Desktop.tsx` | Stills at 1280x720, 768x1024, 390x844, and all four seasons. |
| One frame per game inside a desktop window | `src/styles.css`, `src/game/Desktop.tsx`, `src/game/Arcade.tsx`, `src/game/ReactorTrainer.tsx` | Stills of Reactor Control, DELAY, FISH, PLOT in a window. |
| Rooms cover the view. People are one size in every room. Camera glide does not depend on frame rate. | `src/game/artScale.ts`, `src/game/render.ts` | `scripts/world-zoom.test.mjs` (5 cases, two changed, three added). Stills of six rooms at 1280x720. |

## Not changed

- No frozen value. `sim.ts`, `shuffleModel.ts`, `schematicMath.ts`, `save.ts`, `content.ts`, and `DelayGame.tsx` are untouched.
- No sentence of game text was added. The only new on-screen characters are the label `ρ` and the unit `pcm` on the bench.
- No generated art. The wallpaper is drawn by code from the locked palette.

## Not verified

- Typecheck and the production build were not run. This environment has no installed packages. The game was bundled with a local esbuild and Tailwind for the stills, which is not the production build.
- No playthrough. The stills use `window.__controlsTest` to reach each screen.
- The kinetics coefficients are teaching proxies. They are not cited plant data.
- Music, steam pictures, hide, catch, the paper log, LOAD.CAB, and dusk were not touched.

## Tests changed, and why

- `bench-step.test.mjs`: the coasting frame now passes the precursor level and rod position back in. The bench has state now, and a frame without it restarts from equilibrium.
- `world-zoom.test.mjs`: the cafe at 1100x720 is zoom 4, not 3, and the threshold case is 5, not 4. Zoom 3 left bars beside the room.

## Evidence

- Unit suite: `docs/audit/2026-11-17-evidence/unit.txt`
- Stills: `docs/audit/2026-11-17-visual/`
