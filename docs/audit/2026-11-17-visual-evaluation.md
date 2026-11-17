# Visual evaluation of the whole game, 17 November (author: C)

Branch `c/polish-1117`. Not a review. Not merged. Grok reviews this.

## How it was looked at

Seventy screens were captured at 1280x720 and again at 390x844: the splash, menu, badge, Reactor Design, six intro scenes, the brief, nine rooms, three lot positions, three times of day, three conversations, the incident paper, pause, Academy, end of day, the ending walk, twelve cabinets on their start and play screens, the desktop, the start menu, and eleven apps. Both runs logged no page error. The logs are `docs/audit/2026-11-17-evidence/final-1280.log` and `final-390.log`.

The screens were reached with `window.__controlsTest`. This was not a playthrough.

## What made it look unfinished, and what was done

| Problem | State | Change |
|---|---|---|
| Two art styles. Rooms and people are pixel art. Eleven plates and the backdrop behind the title, brief and end of day were soft painted pictures and a painted video. | Fixed | `tools/artkit/pixelize.py` redraws the eleven plates on the pixel grid and palette. The backdrop is the code-painted lake scene. Originals are in `reference/painted/`. |
| HUD text and the E prompt were cream on cream. | Fixed | Earlier commit on this branch. |
| Rooms had black bars, and people changed size between rooms. | Fixed | Earlier commit. |
| The lot was shown whole at 1x. A person was about a dozen pixels tall. | Fixed | The lot is walked at a zoom from the view height. |
| Cabinet canvases were 320-wide bitmaps stretched to any shape, with 6 to 8 pixel system text. | Fixed | `cabCanvas.ts`. Sharp, own aspect ratio, the game's face. |
| PLOT.CAB printed the words "dirt", "seed", "ripe" on flat squares. | Fixed | Sixteen-pixel drawings for each state. |
| Desktop wallpaper was a flat colour. Games in a window had three frames. | Fixed | Earlier commits. |
| Core Map was a 28 pixel grid in the corner of its window. Results was a column of numbers. | Fixed | 44 pixel cells on a tray. Bars beside the numbers. Ruled tables. |
| The title chip covered the first line of Reactor Design, and covered the picture on the end-of-day paper on a phone. | Fixed | Hidden in those two modes. |
| The corridor was an empty floor. | Partly | A carpet runner joins the four doors. It still has few props. |
| Bench power followed the rod slider. | Fixed | Earlier commit: point kinetics with feedback. |

## Still wrong, and what each needs

| Problem | Needs |
|---|---|
| Reactor Control schematic is boxes labelled CORE and SG. | A new drawing under `STYLE-STANDARD.md` section 4. `schematicMath.ts` is on the frozen-file check, so the owner decides. |
| Rooms are sparse. Corridor, break room and parlor have large bare floors. | More props in the room atlases, and collision for them in `content.ts`. That file is checked in review, so it is a separate change. |
| Radiation shows "Pending verification" fifteen times. NRC shows "verify before publish" eleven times. News is empty. | Cited values and text. Owner decisions D2 and D15. No layout can fix an empty page. |
| Cabinet start screens are a paragraph of small text in a large dark field. | A title card for each cabinet. That is new art for twelve cabinets. |
| Phones show bars above and below a room at 2x. | A decision on phone zoom. 3x fills the height but shows eight tiles across. |
| The splash is six lines of small text on black. | A design for the boot screen. |
| The plate for Just Culture has letters in the picture. The pixel rules say no letters on art. | A redrawn plate, or the owner accepts it. |
| Settings lists every app as a row of pin buttons. | A layout for pinned apps. |
| The menu scene, the wallpaper and the redrawn plates are three different skies. | One reference picture of the plant that all three follow. |
| 12 MB of painted JPEGs under `public/art/gen/stills/` are not loaded by any source file. | Delete them, or move them to `reference/`. They ship in the build today. |

## Not verified

- Typecheck and the production build. No packages are installed in this environment. A partial typecheck of the four non-React files changed here passed.
- A playthrough.
- How the redrawn plates look to the owner. They are a mechanical redraw, not new art. The painted originals are kept so the change can be undone.

## Checks

- Unit suite: 220 tests, 211 pass, 9 fail. The nine names match `docs/audit/2026-11-14-evidence/fail-baseline.txt`.
- `python3 tools/artkit/pixelize.py --check`: zero off-palette pixels in all eleven plates.
- Frozen files `sim.ts`, `shuffleModel.ts`, `schematicMath.ts`, `save.ts`, `content.ts`: unchanged against `c0b12df`. `DelayGame.tsx` changed only in its canvas context line and its font strings.
- No sentence of game text was added.

## Stills

`docs/audit/2026-11-17-visual/`. Files named `before2-*` and `after2-*` are pairs.
