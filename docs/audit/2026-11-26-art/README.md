# Art pass, 26 November 2026

The owner asked for all the art to be done before the next merge, shown one piece at a time. Six pieces, each sent
to the owner as it was finished. Everything is native pixel art under `tools/artkit/STYLE-STANDARD.md`: shown at
whole-number scale only, 1px `#3b2318` outline, flat colour.

| # | What | Made by | Shown in the game | Evidence |
|---|---|---|---|---|
| 1 | The walkers match the portraits, and Colt is drawn (walker and portrait) | `scripts/draw-cast.mjs`, `tools/artkit/cast.py` | Everywhere people walk; Colt's plant | `01-cast-before-after.png` |
| 2 | The intro scenes re-baked with the in-game cast. Mabel sits in her chair, side views are mid-stride, Colt's plant gets its own control room, and the badge screen's "ON THE FLOOR" label moves beside the taller cast | `tools/artkit/scenes.py`, `intro_mock.py`, `src/game/introPaint.ts`, `bossArt.ts sceneArt()` | Intro, badge, brief | `02-intro-before-after.png` |
| 3 | The six toys as 24×24 pixel items. Until you clear the cabinet, a toy is a shadow on Mabel's shelf; it's held up during the gift scene | `tools/artkit/toys.py`, `PrizeShelf.tsx`, `social.ts`, `Line.item` | Arcade prize shelf, the gift talk | `03-toys.png`, `03-shelf-*.png`, `03-gift-jordan-*.png`, `toys.mjs` |
| 4 | Moving cutaways on the BWR bundle bench, the pebble desk and the salt desk, each driven by its desk's own numbers | `src/game/refuel/deskArt.ts`, `RefuelDesks.tsx DeskArt` | Friday desks at BWR, pebble and salt sites | `04-desks.gif`, `04-*-desk-*.png`, `desks.mjs` |
| 5–6 | Plates on the ending card: stand-down, transfer, Colt's regroup, and the week-10 finale at each plant | `tools/artkit/plates.py`, `campaign.ts verdictCard().plate`, `GameApp VerdictBlock` | Ending card | `05-plates.png`, `05-*-1280.png`, `05-*-390.png`, `plates.mjs` |

## Checks

- `python3 tools/artkit/check.py`: every artkit PNG regenerates byte for byte against `reference/` (77 PNGs). The
  15 intro references that had gone stale before this pass are refreshed. The check no longer writes into
  `public/` (`TOYS_GAME`, `PLATES_GAME` point it at a temp folder).
- Unit tests: `scripts/desk-art.test.mjs` is new. It checks that the cutaways follow void, passes, spray and
  temperature, and that every rectangle lands on whole pixels inside the picture. `floor-talk.test.mjs` adds
  toy art and the held-up gift, and `campaign.test.mjs` adds each verdict's plate.
- Browser, real clicks from the title screen, 1280×720 and 390×844: `toys.mjs` 11/11 per size, `desks.mjs`
  19/19 per size, `plates.mjs` 16/16 per size. Results in `art.txt`. Hooks only for labelled setup.
- Reduced motion: the desk cutaways hold one still frame, which redraws when a slider moves.

## Owner decisions still open

- Whether the intro tableaux should keep the in-game cast (chosen here, so intro and play match) or go back to the
  older chibi look.
- The toys and plates are first drafts in the house style. Say which to redraw.
