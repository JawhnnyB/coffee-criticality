# Grok Build: fix pass on the Night Watch photo plates

- **Owner:** JawhnnyB.
- **Review by:** Claude, 21 November 2026.
- **Branch:** keep working on `g/nw-plates`. First merge in `c/crew-outage-1118`, which carries this file and the review evidence.
- **Rules:**
  - Do not merge to `main`.
  - Do not post GitHub reviews or comments.
  - Finish the whole list without stopping. Where something cannot be done, say so plainly. Do not fake it.

**Evidence for everything below** is in `docs/audit/2026-11-21-plates-review/`:
- `in-game-0..3.jpg`: every plate through the real camera pass, plain and with its layers.
- `states-1/2.jpg`: each base plate beside its state plate.
- `plates-raw-1/2.jpg`, `rover-sheet.jpg`.
- `perf.html` + `perf.mjs`: the frame timer.

## What is good (keep it)

- **Strong plates:** containment, drywell, turbine, corridor, msiv, torus, yard and cell. They read as real CCTV once the grade runs.
- **Plates are not the slow part.** Grok's set times the same as the code drawing (numbers in P2).
- **The size budget is right.**
- **The honest report.** It said what was not checked. Keep doing that.

---

## P0: the state pictures do not show in the game (gameplay bug, must fix before anything else)

Eight visuals use state plates: `doorAjar`, `chair`, `hardhat`, `poolLow`, `toolBag`, `frostGone`, `heaterDark` and `debris`. Several are **events the player must find**. Today the player sees **nothing** for any of them. The plate is "ready", so the code fallback is skipped too. A night can end in a missed event the player had no way to see.

### P0.1: the feather blit erases itself

In `blitFeather` (`cameras.ts`), every `fillRect` runs under `globalCompositeOperation = "destination-in"`. In canvas, `destination-in` clears **everything outside the shape being drawn**, so each edge strip wipes out the previous one. Only the last strip survives.

**Fix:**
1. Build the mask on a second offscreen canvas with `source-over`: the solid centre plus the four gradient edges.
2. Apply it **once** with `destination-in` using `drawImage(mask)`.
3. Make both canvases the backing size (`W*CAM_PX × H*CAM_PX`), not 480×270, so the state is not drawn at half resolution.

### P0.2: the boxes do not cover what changed, and two states change nothing

I measured where each state image actually differs from its base. Method: blurred absolute difference, threshold 45, then erode. Logical 480×270 coordinates.

| State | Box in `plates.ts` | Where the picture really changed | Verdict |
| --- | --- | --- | --- |
| `corridor-doorAjar` | 340, 66, 120, 204 | 390, 82, 8, 132 | Inside the box, but the door opens only a hairline. **Regenerate:** open about 15°, dark room beyond, gap at x 360–376 as the brief says. |
| `corridor-chair` | 226, 170, 80, 64 | 191, 170, 47, 60 | Chair mostly outside the box. Move the box or the chair. |
| `corridor-hardhat` | 190, 222, 50, 26 | 244, 227, 13, 15 | Outside the box. |
| `pool-poolLow` | 10, 96, 460, 40 | 25, 145, 401, 99 | Outside the box. The level change is in the wrong place. |
| `pool-toolBag` | 372, 66, 60, 36 | 382, 135, 98, 91 | No overlap. The bag sits at the bottom right, and the image also adds a new railing. **Regenerate:** bag on the pool edge at the box, nothing else changed. |
| `freeze-frostGone` | 196, 110, 80, 64 | 236, 132, 13, 8 (a few drips) | **The frost is still there.** The event shows nothing. **Regenerate:** bare wet metal on the valve body and pipe, frost gone. |
| `cell-heaterDark` | 214, 150, 92, 20 | **no change** | Identical image. Regenerate: the line between x 220 and 300 goes dull and dark. The code dots are the fallback. |
| `intake-debris` | 70, 110, 340, 115 | 80, 44, 318, 168 | Good image. Grow the box to cover it. |

**Rule from now on:**
- Every state box is the measured change region plus 8 px, clipped to the frame. Store the measured numbers in `plates.ts`.
- Write the measurement as a script, `scripts/measure-states.mjs`, run in Playwright, so anyone can re-run it.

### P0.3: prove every visual shows, in the game frame

Add `scripts/nw-visible.mjs` (Playwright, production build). For every site, every camera, and every event and oddity visual on that camera, plus `rover:0.5` and `van:0.5`:

1. Draw the frame through `paintCamera` without the visual and with it, at three times.
2. Count the pixels that changed by ≥ 24 levels.
3. **Fail** if fewer than 0.4% of the frame changes.
4. Write a table to `docs/audit/2026-11-2x-plates-fix/visible.md`: visual, pixels changed with the code drawing, pixels changed with the plate.
5. Flag any visual where the plate number is under half the code number. That event got harder to see, and the plate must be fixed, not the event.

---

## P1: the photo must not look pasted on

### P1.1: sign boards

Today the signs are flat paint rectangles laid on the photo, with code text on them. They read as stickers.

**Fix order:**
1. **Inpaint each sign region** with Imagine image-to-image: "a plain blank [yellow / white / green] metal sign plate screwed to the wall, slight sheen, lit by the room, no text, no symbols." Keep the board inside the code rectangle ±2 px. If the board comes back bigger or smaller, change the rectangle in `marks()` to match the board, never the reverse.
   - The pressurizer board today is about twice the code rectangle, so its words are tiny.
   - The corridor board sits off the door's centre.
2. **Make the code text sit in the photo:**
   - Draw it with `globalCompositeOperation = "multiply"` (dark ink on a light board).
   - Apply about 0.4 px blur. Use `filter` once at bake time, not per frame.
   - Match the board's perspective with a `setTransform` skew where the board is on a side wall: corridor door, pressurizer and freeze.
3. **Or bake it.** Bake the words into the plate at build time (`scripts/bake-signs.mjs`) and drop `marks()` on photo plates entirely. That is the more realistic option, and it is free per frame. **I'd choose this one.**

### P1.2: things drawn twice

- **`freeze`:** the code frost speckle draws on top of the photo's own frost. Skip the speckle when a plate is loaded. Frost now comes from the plate and `frostGone`.
- **`pool`:**
  - The code still paints a band of rack rectangles at y 196–256, while the photo's racks sit elsewhere as floating frames. Skip the code racks on a photo.
  - **Regenerate the pool plate:** looking down at an angle into deep clear water, a dense grid of square stainless storage cells covering the floor (hundreds of cells, not eight frames), dark cell openings.
  - Put the Cherenkov glow centres in `plates.ts` as a list of points measured from the photo, so the code glow lands in the real cells.
- **`cavity`:** gravel around the vessel head is wrong. Pebbles are inside the core, not on the cavity floor. Regenerate with a plain concrete or steel-plate floor.
- **`intake`:** travelling screens are flat framed panels in guides, not round columns, and the water should be calm. Regenerate if time allows. The current plate works for play.

### P1.3: the rover

- **Code bug:** the sprite check sits *after* the old code legs, body and torch are drawn, so the cartoon figure shows under the sprite. Move the `roverSheet()` branch up, right after the torch floor pool and the shadow, and `return` before any rectangle body is drawn.
- **The eight frames are almost the same pose:** the stride does not change, so he glides. **Regenerate a real walk cycle:** contact, down, passing and up for each leg, 8 frames, the same scale and lighting. Check it by stepping frame to frame: the legs must visibly swap.
- **He carries a cable, not a torch.** Either regenerate with a torch held forward, or keep the code torch glow and set its hand position from the sprite.

---

## P2: frame time

I measured `paintCamera` alone, 960×540, in Chromium, with plates loaded on `g/nw-plates` against the code drawing before plates:

| Scene | 1× CPU, plates | 1× CPU, code | 4× slower CPU, plates | 4× slower CPU, code |
| --- | --- | --- | --- | --- |
| turbine | 5.5 ms | 7.9 ms | 29 ms | 29 ms |
| corridor (door ajar) | 8.4 ms | 7.1 ms | 39 ms | 29 ms |
| tunnel (infrared) | 12.5 ms | 13.6 ms | 60 ms | 61 ms |
| pool | 8.5 ms | 9.9 ms | 28 ms | 33 ms |

So the **camera pass** is the cost, and infrared is the worst: `ctx.filter = "grayscale(…)"` plus redrawing the canvas onto itself. Your 105 ms page number also includes React. Fix in this order and re-time after each step:

1. **Run the feed at 15 frames a second**, not every animation frame. Real CCTV is 12–15 fps, so this is more realistic, and it removes 75% of the work. Keep the clock and the UI at full rate.
2. **Replace the infrared `filter` with a blend:** after the layers, fill the frame with grey under `globalCompositeOperation = "saturation"`, which removes colour on the fast path. Then apply contrast with one `"overlay"` fill.
3. **Cache the graded static plate per scene:** tint, lift and the infrared desaturation applied once to the photo. Per frame, draw that cached plate, the live layers, then grain, the rolling bar and the vignette only.
4. **Scanlines and vignette as one cached overlay canvas,** drawn with one `drawImage`, not 135 `fillRect` calls and a fresh radial gradient every frame.
5. **React:** record a Performance trace with the tablet up for 5 s. If the shift component renders every frame, move per-frame values (switching, clock seconds) into refs and the canvas loop.
6. **Target:** canvas work ≤ 8 ms per feed frame at 4× slower CPU, and whole-page main-thread busy time under 50% at 4×. Report both numbers, before and after.

---

## P3: the production build preview, and the full night

- **The preview server:** you said it cannot start from this build layout. Find out why and fix it, or serve the built client folder with a static server the way `docs/audit/2026-11-20-nightwatch/realistic/` did. The point is proving the **built** game, not dev.
- **The full night:** run `nw.mjs 1280x720 full` on the production build. Survive night 1 to 06:00 using only flashing cameras and red tiles. Then play **night 3 on the corridor-heavy PWR site**, so `doorAjar`, `chair` and `hardhat` actually come up. Record which ones appeared, and the screenshot of each.

---

## Tests and evidence

- **Keep everything passing:** the 13 Night Watch tests and the 9 baseline failures, unchanged and with no new ones.
- **Add:** P0.2's box rule as a test against the stored measurements, and P0.3's visibility run.
- **Evidence** goes in `docs/audit/2026-11-2x-plates-fix/`:
  - before-and-after in-game sheets for every changed plate;
  - every state on and off;
  - rover frames stepped side by side;
  - `visible.md`;
  - the timing table;
  - run logs;
  - a README of what was and was not checked.
- **Commit** with your own attribution. Push `g/nw-plates`. **Not merged.**

---

## Report back

In plain words, cover:
- Which states now show and how strongly (from `visible.md`).
- Which plates were regenerated.
- The timing before and after.
- Whether the full nights ran on the production build.
- Anything you could not fix.
