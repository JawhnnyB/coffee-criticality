# The player's look, 28 November 2026

The owner said something felt off about the main character's new design, and asked for help working out what — "it could be lacking glasses, or other extra accessories to make him feel unique".

## What was off

`variants.png` shows the walker as it was (top row, the sheet at `77f680b`), the fixes A–E, and his portrait, all in the game's real tint (copper hoodie, brown hair).

| Problem | Why |
|---|---|
| **Glasses didn't read.** | They were 1-pixel posts in the outline colour, so they looked like a squint. His portrait has bold square frames. |
| **Hair was nearly the ink line.** | The picker's "brown" was `#4a3424`, a step off the outline `#3b2318`, so his head looked like a dark helmet. The portrait's brown is a warm `#7a4a2a`. |
| **Pouting mouth.** | He read as sulky, not friendly. |
| **No signature item.** | Every NPC has one (Mabel's apron, Holt's red tie, Tommy's tool belt, Priya's lanyard); he had nothing. |

## What changed

| What | Where | Evidence |
|---|---|---|
| **Real glasses:**<br>• bold square frames with skin-tone lenses, front and side;<br>• drawn in two key colours nothing else uses, so the picker's "no glasses" turns exactly those to skin and leaves the eyes and outline alone | `tools/artkit/chibi.py` (`glasses_front`, `glasses_side`, player palette), `src/game/pixel.ts` (`recolorA6`) | `01-badge-glasses-*.png`, `02-badge-noglasses-*.png`, `05-cafe-side-*.png`, `08-cafe-noglasses-*.png` |
| **Hair:**<br>• a tousled cut with a tuft and a side-swept fringe, ears showing;<br>• every hair choice now uses the same base/light/dark ramp as his portrait (`HAIR_RAMP` in `artSpec.ts`, shared by `introPaint.ts` and `pixel.ts`) | `chibi.py` (`HAIR['player']`), `artSpec.ts`, `introPaint.ts`, `pixel.ts` | `03-badge-hair-*.png` |
| **A smile**, with the blush moved below the glasses | `chibi.py` (`LOOK`) | all |
| **The satchel (variant C) as his signature item.** It's the only item that reads from the back and side, which is where the camera sees him most:<br>• the strap is drawn over the hoodie, so it runs unbroken;<br>• `CHIBI_PLAYER_KIT=badge,bag,mug` previews the other kits (B, D, E) | `chibi.py` (`player_kit`) | `06-cafe-back-*.png`, `07-cafe-left-*.png` |
| **Re-baked art.** The intro scenes, badge, brief and ending plates now use the new walker, tinted exactly as the game tints it:<br>• `scenes.tint_player` now mirrors `recolorA6` key for key;<br>• each change is confined to the player's ~20×40 px box | `tools/artkit/scenes.py`; `public/art/intro/*`, `public/art/plates/*`, `reference/{intro,plates,cast}/*` | `python3 tools/artkit/check.py` passes, 91 PNGs |

None of the frozen files was touched.

## Checks

- `player.mjs` was played with real input at 1280×720 and 390×844 (`player.txt`, 14 checks pass). It covers:
  - a fresh start through the menu, setup, desk and intro to the badge screen, all by clicking;
  - toggling the glasses off and on, and trying each hair colour, with real clicks;
  - in the café, walking right, up, left and down with real keys.

  Labelled hooks were used only to boot straight into day 1 and to show the no-glasses walker in the room.
- `scripts/player-look.test.mjs` (new, 5 tests) checks:
  - the walker sheet's size;
  - that the frames and lenses show front and side but not from behind;
  - that removing the glasses leaves the eyes and silhouette pixel-for-pixel;
  - that every hair ramp lands on the head and the brown stays clear of the ink line;
  - that the satchel shows from every side and survives all 16 hoodie × hair tints.
- Full unit suite: 437/437.
- The café audit (`2026-11-26-look/cafe.mjs`) and the night-walk audit (`2026-11-27-night/walk.mjs`) were re-run from a scratch folder and still pass.
