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

Also done, on the owner's instruction: the 29 painted JPEGs that no source file loads moved from `public/art/gen/stills/` to `reference/painted/stills/` (12 MB). They no longer ship. `cutaway_pwr_loop.jpg` is still loaded and stays. The owner approved the redrawn plates.

## Plant cutaways (owner request, 17 November)

The four plant plates and two salt stills were redrawn from the seven painted cutaways in `reference/painted/stills/`, as code.

- `src/game/plantLoops.ts` holds each plant's parts, loops, flow direction and media, with the sources for each flow path. `src/game/cutawayPaint.ts` paints from it. `scripts/plant-loops.test.mjs` checks the physics: every loop closes, every pipe runs with its loop, the PWR primary is closed and holds a pressurizer on a hot leg, only the BWR sends core water to the turbine, salt plants keep radioactive salt away from the steam generator, the pebble bed's helium goes down, and Cherenkov blue appears only in a hot core cooled by a clear liquid. Four mutations of the data each fail the tests.
- The cutaways animate in Reactor Design, the still viewer and the Academy salt page. With reduced motion they paint one frame. Every pipe carries an arrow, so a still frame shows the flow.
- Palette exception: `cherenkovD`, `cherenkov` and `cherenkovL` are added to `palette.ts`, for Cherenkov light only. No tint of the base colours is this blue. The owner asked for it. `pixelize.py` never maps to these three.
- The old plates and thumbnails are in `reference/old-plates/`.
- Shown blue: PWR and BWR (water) and FHR (FLiBe is clear; Cherenkov light has been proposed for FHR monitoring). Not blue: the pebble bed (helium's refractive index is too close to 1) and the two fuel-salt reactors, drawn hot instead. A cool PWR is drawn without the glow, as the game's copy says. Strictly, a core just shut down still glows faintly from decay betas.
- The fast-salt card says chloride. The drawing follows the CNRS MSFR, which is fluoride with a thorium blanket.

## The chosen reactor is the site (owner request, 17 November)

The type picked in Reactor Design is now the plant. It is locked after the first clock-in ("Unit 1 is built. The type stays.").

- **Reactor Control** draws the site's cutaway above the schematic, driven by the run. Pipe colour follows temperature, so the hot leg and the cold leg separate as power rises and match at zero. Dash and pump speed follow flow. The glow follows power. The rods follow the rod setting. BWR voids follow power over flow. Pressurizer level follows average temperature. A scram drives the rods in, trips the turbine and leaves only a dim decay-heat glow. Helium and fuel salt never glow.
- **Reactor hall** centrepiece by type. PWR: dome head with closure studs and a CRDM grid. BWR: head with lifting lugs, no drives on top, because its rods come from below. Pebble bed: a small head, a ring of rod drives and a pebble loading tube. Salt: concrete roof plugs, one off over the pump bowl, and a freeze-valve hatch. Each has a viewing port: blue water, salt or pebbles. Lagged pipes carry the type's names (hot leg and cold leg, main steam and feedwater, hot gas duct and cold helium, fuel salt out and return). Each has a temperature band and flow arrows. Salt lines have heater tape.
- **Control room** wall mimic: the site's loops, scaled.
- **Lot**: the reactor building roof. PWR keeps its dome. BWR gets a flat refuelling-floor roof with crane rails and a roof hatch. Pebble bed gets two module roofs. Salt gets air coolers whose fans turn while the plant makes heat.
- **Skyline** (desktop wallpaper, menu, end of day): PWR has a dome, a cooling tower and a plume that scales with power. BWR has a tall box reactor building and an off-gas stack. Pebble bed has two module buildings and no tower. Salt has a low building and air coolers.
- **Stills**: the vessel window, the criticality mural and the Full core card show the site's plate.

Text: only short labels changed ("— this site"). Lesson text still describes a PWR. The lines that no longer fit a non-PWR site are listed for the owner in the report, not rewritten here.

Stills: `site-w-halls.png`, `site-w-halls-close.png`, `site-ctl-sheet.png`, `site-lot-sheet.png`, `site-eod-sheet.png`, `site-still-sheet.png`, `site-wall-seasons.png`, `site-lock-control.png`.

Not verified: Reactor Control in the 390×844 run. The harness does not open it there on this branch or on `c0b12df`.

## Still wrong, and what each needs

| Problem | Needs |
|---|---|
| Reactor Control's live schematic is still boxes labelled CORE and SG. | It reads `schematicMath.ts`, a frozen file. The new cutaways are a separate drawing; moving Reactor Control onto them is the owner's call. |
| Rooms are sparse. Corridor, break room and parlor have large bare floors. | More props in the room atlases, and collision for them in `content.ts`. That file is checked in review, so it is a separate change. |
| Radiation shows "Pending verification" fifteen times. NRC shows "verify before publish" eleven times. News is empty. | Cited values and text. Owner decisions D2 and D15. No layout can fix an empty page. |
| Cabinet start screens are a paragraph of small text in a large dark field. | A title card for each cabinet. That is new art for twelve cabinets. |
| Phones show bars above and below a room at 2x. | A decision on phone zoom. 3x fills the height but shows eight tiles across. |
| The splash is six lines of small text on black. | A design for the boot screen. |
| The plate for Just Culture has letters in the picture. The pixel rules say no letters on art. | A redrawn plate, or the owner accepts it. |
| Settings lists every app as a row of pin buttons. | A layout for pinned apps. |
| The menu scene, the wallpaper and the redrawn plates are three different skies. | One reference picture of the plant that all three follow. |

## Not verified

- Typecheck and the production build. No packages are installed in this environment. A partial typecheck of the four non-React files changed here passed.
- A playthrough.
- How the redrawn plates look to the owner. They are a mechanical redraw, not new art. The painted originals are kept so the change can be undone.

## Checks

- Unit suite: 240 tests, 231 pass, 9 fail (after the site-reactor work). Earlier: 220 tests, 211 pass, 9 fail. The nine names match `docs/audit/2026-11-14-evidence/fail-baseline.txt`.
- `python3 tools/artkit/pixelize.py --check`: zero off-palette pixels in all eleven plates.
- Frozen files `sim.ts`, `shuffleModel.ts`, `schematicMath.ts`, `save.ts`: unchanged against `c0b12df`. `content.ts` changed only in plate paths and cache keys (`?v=loops`, and the FHR and fast-salt cards now point at their own plates). No text in it changed. `DelayGame.tsx` changed only in its canvas context line and its font strings.
- No sentence of game text was added.

## Stills

`docs/audit/2026-11-17-visual/`. Files named `before2-*` and `after2-*` are pairs.
