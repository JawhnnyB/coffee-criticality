# Grok Build: photoreal Night Watch camera plates with Imagine

Owner: JawhnnyB. Written by Claude, 20 November 2026. Base branch: `c/crew-outage-1118` (the commit that adds this file).
Work on a new branch, `g/nw-plates`, cut from that commit. Do not merge to `main`. Do not post GitHub reviews or comments.

Read this whole file before you start. Finish the whole list without stopping to ask. Where a step cannot be done, say so plainly in your final report. Do not fake it.

---

## 0. What this is and why

Night Watch (`src/game/NightWatch.tsx`, `src/game/nightwatch/`) is the overnight-shift minigame in *Coffee & Criticality*. You sit at a desk with a camera tablet, 8 security cameras and an annunciator wall. Something on site goes wrong before the board knows it. You find it on a camera and report it.

The rest of the game is pixel art in a locked palette. **The owner made one exception on purpose:** the camera feeds are the one realistic part of the game, "more eerie but also immersive". Claude has already built the feeds as code-drawn realistic scenes (`src/game/nightwatch/cameras.ts`). Each frame runs through a full security-camera pass: grade, infrared black and white, grain, scanlines, vignette, a rolling bar, auto-gain breathing, switching static, and emergency red after a trip.

**Your job:** use the Imagine image tools to replace each scene's code-drawn *base* with a photoreal plate. Every plate must keep the exact layout the code draws on top of. Also replace the code-drawn rover with a real-looking sprite. The camera pass, every event, the radio log, the sound and the game rules stay exactly as they are.

**Owner approval (20 November 2026, 23:32 ET):** "create an extremely detailed Grok prompt for Grok to utilize its imagine feature to really build these pictures into reality." This lifts the project's no-generated-art rule **for the Night Watch camera plates and the rover sprite only**. Nothing else in the game may use generated art. Record this in `docs/decisions-pending.md` under the existing "Night Watch cameras: realistic footage" heading.

### 0.1 Stop condition

Only call `imagine_*` tools if they are actually in your available tools list. If they are not:

- Do not invent the calls.
- Do not substitute stock photos, web images, or hand-painted "photoreal" SVG.
- Do sections 3 (loader and fallback) and 7 (tests) anyway, so the plates drop in later.
- Report exactly which tools were missing.

---

## 1. Files you are given

| Path | What it is |
| --- | --- |
| `docs/grok/night-watch-plates/ref/<scene>-base.jpg` | 1920×1080 render of the scene's code base only: no events, no camera pass. **This is your composition guide and image-to-image init.** |
| `docs/grok/night-watch-plates/ref/<scene>-layers.jpg` | The same scene with its event, oddity and visitor layers drawn. **This is your alignment check:** whatever you generate must leave these overlays sitting in the right place. |
| `docs/audit/2026-11-20-nightwatch/realistic/gal0..3.png` | The current feeds *with* the camera pass. This is the mood target after grading. |
| `docs/audit/2026-11-20-nightwatch/realistic/gallery.html` + `gal.mjs` | A page and a script that draw every scene with the real `paintCamera`. Reuse them for before-and-after shots. |
| `src/game/nightwatch/cameras.ts` | The renderer: `paintCamera`, `paintReference`, `SCENE_NAMES`, `lookOf`, the `S` scene table, and `WALK` (rover floor lines). |
| `src/game/nightwatch/model.ts` | Rules: cameras per site, events, oddities, rounds, radio, van. **Do not change any rule.** |

The 17 scenes are: `containment pressurizer msiv drywell torus tunnel cavity blower discharge cell freeze offgas turbine corridor pool yard intake`.

**Coordinates.** Every coordinate in this file is in the renderer's **logical 480×270 space**. Multiply by 4 for the 1920×1080 references and by 2 for the 960×540 plates you ship.

---

## 2. Art direction (applies to every plate)

### 2.1 The camera

- **Lens and mount:** a fixed, wall-mounted industrial CCTV camera. It sits high in a corner or over a doorway, about 3 m up, tilted slightly down. Wide lens, roughly a 2.8–4 mm equivalent on a 1/3" sensor, with **mild** barrel distortion. Not a fisheye.
- **Perspective:** match the reference's vanishing point and horizon exactly. Most interiors are one-point perspective with the vanishing point near the centre (see each scene).
- **Focus and aperture:** everything in focus, deep depth of field, the small-sensor look. No bokeh and no cinematic shallow focus.

### 2.2 The place

- **The site:** a real, working, well-maintained commercial nuclear plant at about 02:00 with nobody in frame. Clean, painted, labelled, lit. **The eeriness comes from emptiness and stillness, not decay:** symmetric corridors, humming fluorescent tubes, a hard hat left on a hook, a chair facing the wrong way.
- **Think:** Backrooms liminality and *Observation Duty*, not horror. No monsters, no blood, no rust-ruin, no flooded wreckage, no glowing green goo, no sci-fi panels, no holograms.
- **Materials (be specific):**
  - Painted concrete walls in two-tone industrial paint: lower band darker, upper band lighter.
  - Epoxy-coated floors with yellow walkway lines, or steel floor grating where the reference shows a grid.
  - Aluminium-jacketed pipe insulation with visible seam bands.
  - Painted carbon-steel pipe and valves. Valve handwheels painted red.
  - Pump motors in plant green.
  - Unistrut cable trays and conduit along the walls and ceiling.
  - Fluorescent or LED high-bay fixtures. Stencilled equipment IDs only as blank rectangles (see 2.4).
  - Yellow-and-magenta radiation postings only as blank plates (see 2.4).

### 2.3 Light

- **Sources:** lighting comes only from fixtures that exist in the reference. Light falls off realistically, with soft pools on the floor under each fixture.
- **Grade:**
  - Generate with **neutral colour and no grade**. The code grades every frame.
  - Expose a little dark: mid-tones around 35–45% and highlights not clipped, except the light tubes themselves.
- **Infrared scenes** (`drywell torus tunnel cavity intake`): still generate them in full colour. The code turns them black and white. Light them as the plant would be lit: dimmer, a few fixtures.

### 2.4 Text and signs

**Never generate text.** Imagine garbles letters, and the code already draws every sign.

- Wherever the reference has a sign, generate a **blank** plate of the same size, colour and position: a yellow plate, a white plate, an EXIT box, or a red door.
- The code will paint the words on top (section 3.3).
- No logos, no plant names, no real company marks, no watermarks.

### 2.5 Never in a plate

- People, bodies, silhouettes or shadows of people. The rover is a separate sprite.
- Text, numbers, timestamps, UI, REC dots.
- Film grain, scanlines, vignette, chromatic aberration, lens flares. The code adds its own camera artefacts; doubled grain looks wrong.
- Motion blur, daylight, windows to the outside (except the yard and intake, which are outside at night).
- Snow or rain.
- Anything that contradicts the event layer that sits in that spot (section 4 lists every spot).

### 2.6 Base prompt fragments

Use these word for word as the opening and closing of every positive prompt, then the scene's own lines from section 4 go between them.

```
Photorealistic still frame from a fixed wall-mounted industrial security camera inside a modern commercial nuclear power plant at night, nobody present, empty and still, clean and well maintained, wide 3mm lens with mild barrel distortion, deep focus, realistic light falloff from ceiling fixtures, neutral colour, slightly underexposed, 16:9.
```

```
No people, no text, no letters, no numbers, no logos, no signage wording, no timestamp, no film grain, no vignette, no lens flare, no motion blur.
```

Negative prompt, where the tool accepts one:

```
people, person, worker, silhouette, text, letters, words, numbers, logo, watermark, timestamp, UI, overlay, film grain, noise, scanlines, vignette, lens flare, bokeh, motion blur, fisheye, horror, monster, blood, gore, rust, ruin, abandoned, decay, flooding, green glow, sci-fi, hologram, cartoon, illustration, painting, 3d render look, plastic, oversaturated, daylight, sunlight, windows
```

---

## 3. Code changes (make these first, so plates drop straight in)

### 3.1 Resolution

- Keep `CAM_W = 480` and `CAM_H = 270` as **logical** units, so every layer coordinate stays valid.
- Add `export const CAM_PX = 2`.
- In `NightWatch.tsx`:
  - Size the canvas backing store to `CAM_W * CAM_PX` × `CAM_H * CAM_PX` (960×540).
  - Keep the CSS width at 100%.
  - Call `ctx.setTransform(CAM_PX, 0, 0, CAM_PX, 0, 0)` before each `paintCamera`.
- **Fix the infrared self-draw** in `paintCamera`: `g.drawImage(g.canvas, 0, 0)` runs under the transform, so it must draw at logical size: `g.drawImage(g.canvas, 0, 0, W, H)`. Check the infrared frame is not doubled or offset.
- **Noise frames:** keep them at 480×270 and draw them stretched to `W, H`. Grain at half resolution reads as real sensor noise.

### 3.2 Plates

- **Files:** `public/nightwatch/plates/<scene>.webp`, 960×540, WebP quality about 80, **≤ 180 KB each**, and ≤ 3.5 MB for the whole set including state variants and the rover sheet.
- **Manifest:** `src/game/nightwatch/plates.ts`:
  ```ts
  export const PLATES: Record<string, { file: string; states?: Record<string, { file: string; box: [number, number, number, number] }> }>
  ```
  - `states` maps a model visual (for example `doorAjar`) to a variant plate and the logical box it covers. The code crossfades just that box in while the visual is present (see 3.4).
  - `loadPlates(): Promise<void>` preloads with `new Image()` and `decode()`. It is called when the shift opens, and again on the night menu so the first frame is ready.
  - `plateFor(scene)` and `stateFor(scene, visual)` return a loaded `HTMLImageElement` or `null`.
- **In `paintCamera`:** if `plateFor(scene)` is loaded, draw it at `(0, 0, W, H)` **instead of** `baseFor(scene, sc)`. Otherwise use the existing code base. This fallback is mandatory: node tests, slow networks and missing plates all use it.

### 3.3 What moves out of code and what stays

Split each scene's code into three parts: `base` (code fallback, unchanged), `signs` (text only, drawn **on top of the plate** at the same rectangles), and `live`.

**Stays in code on top of the plate** (these animate or carry gameplay):

- The words on every sign (`sign()` text only, on the blank plate the image provides). Drop the code-drawn plate rectangles when a plate is loaded.
- Beacons (`beacon()`), plumes (`plume()`), puddles and drips, the torus and intake water shimmer, and the pool caustics and Cherenkov glow pulse.
- The pump-shaft glint, the freeze-valve fan blades, the blower shake (see 4.8), and the heater dots in the salt cell.
- The status displays (the green/red bars on the MSIV monitor and the discharge panel).
- Arcs, fog, headlights, the gull, ripples, and the "flicker" oddity.
- Everything after the base: emergency tint, grade, the infrared filter, grain, scanlines, rolling bar, vignette, switching static.

**Moves into the plate** (static equipment the code currently draws in `live` only for convenience):

- The pump sets in `containment`, `drywell` and `turbine` (both pumps).
- The blower casing in `blower`.

Remove those `pumpSet` and `vCyl` calls from `live` when a plate is loaded, but **keep the shaft-glint rectangle** at the coupling.

### 3.4 State plates

Some visuals change something solid. A flat code overlay on a photo looks fake. For each item in this table:

1. Generate a variant of the chosen plate with Imagine image-to-image or inpaint, changing only inside the box.
2. While the visual is present, draw the variant cropped to the box, with a 6 px feathered edge, over the plate.
3. Skip the code overlay for that visual.
4. Keep the code overlay as the fallback when the variant is missing.

| Scene | Visual | Logical box `[x, y, w, h]` | What changes |
| --- | --- | --- | --- |
| corridor | `doorAjar` | `[340, 66, 120, 204]` | The red locked-high-radiation door stands open about 15°. Dark room beyond, no light inside, a black gap at its left edge (x 360–376), and the shadow wedge on the floor toward bottom-left. |
| corridor | `chair` | `[226, 170, 80, 64]` | A black office chair standing alone in the corridor, facing away from the camera. |
| corridor | `hardhat` | `[190, 222, 50, 26]` | A yellow hard hat sitting upright on the floor. |
| pool | `poolLow` | `[10, 96, 460, 40]` | Water level about 4 m lower: a wet, darker band of stainless liner exposed above the waterline (y 106–122), with a tide mark. |
| pool | `toolBag` | `[372, 66, 60, 36]` | A red canvas tool bag on the pool edge beside the railing, its handle up, half over the edge. |
| freeze | `frostGone` | `[196, 110, 80, 64]` | The frost and ice on the freeze-valve body melted. Bare metal, with drips. (The base plate shows it frosted white.) |
| cell | `heaterDark` | `[214, 150, 92, 20]` | The section of trace-heated salt line between x 220 and 300 goes dull and dark (the code dots stay too). |
| intake | `debris` | `[70, 110, 340, 115]` | The three travelling screens clogged with dark kelp, branches and plastic mats. |
| containment, drywell, corridor | `puddle` | **No plate.** | The code puddle stays. Make sure the floor under it is clean, matte and dry in the base plate. |

### 3.5 The rover sprite

Replace the code `rover()` figure with a sprite sheet when it is loaded.

- **File:** `public/nightwatch/rover.webp`. 8 walk frames in one row, each 96×192 px, figure facing **right** (walking left to right across the frame), transparent background.
- **Generation:** follow `.grok/skills/generate2dsprite/SKILL.md` exactly: a solid `#FF00FF` background, then the chroma-key script. Pair it with `game-character-consistency`.
- **The figure:**
  - A plant equipment operator: white hard hat, navy coveralls with two horizontal reflective silver stripes at chest and waist, a radio on the left shoulder, gloves.
  - A torch in the right hand pointed ahead and down.
  - Photoreal, lit from above by fluorescent light.
  - Feet on the bottom row of pixels, the same scale every frame, no motion blur.
- **Drawing it:**
  - Frame index `Math.floor(t * 8) % 8`.
  - Height `78 * s` logical; anchor the feet at `WALK[scene].y`.
  - x position exactly as the current `rover()`.
- **Keep in code:** the torch floor pool and the floor shadow ellipse, drawn under the sprite.
- **Infrared:** the camera pass will grey the sprite in infrared scenes. That is correct.
- **Not visible:** `WALK.cell.s = 0` (nobody behind the shielding window). Leave it.

### 3.6 Optional, only after everything above passes: two looping video underlays

- **Scenes:** `pool` (the water surface and Cherenkov shimmer) and `torus` (the slow-moving water).
- **Generation:** `imagine_image_to_video` from the chosen plate, 4 s, with camera motion explicitly **none**.
- **Encoding:** ffmpeg to a seamless 4 s loop (crossfade the tail into the head), WebM VP9, 960×540, ≤ 600 KB each.
- **Drawing:** paint the current video frame instead of the plate when it is ready.
- **Fallback:** if the result has camera drift, warping, or any person or text appearing, discard it and say so.

---

## 4. Scene briefs

Each brief gives:

- **Init:** the reference to start from.
- **Look:** the code grade it will get.
- **Keep:** must-keep anchors in logical coordinates. The overlays land there, and your plate must agree with them.
- **Prompt:** the scene lines, to go between the two fragments in 2.6.
- **Variants:** state plates (section 3.4), where the scene has any.

**Image-to-image strength:**

- Start around **0.55–0.65**: enough freedom for photoreal materials, little enough to keep geometry.
- If anchors drift, lower it. If it still looks like a flat render, raise it in steps of 0.05, re-checking anchors each time.
- **Three candidates per scene minimum.** Pick by the checklist in section 5.

### 4.1 `containment`: PWR containment, reactor coolant pump 1A (colour)

- **Init:** `containment-base.jpg`. **Look:** `fluor`.
- **Keep:**
  - The polar crane girder runs full width at the top (y 14–24, painted yellow).
  - Floor grating on the lower third.
  - Vanishing point at (240, 121).
  - The pump set centred at x 240, feet at y 242:
    - Motor x 207–273, y 80–166, with horizontal cooling fins.
    - Motor top flange at y 72–82.
    - Coupling guard x 229–251, y 166–188. **Shaft glint drawn here.**
    - Pump casing x 200–280, y 188–242.
    - Suction and discharge pipes at y 194–224, running left to x 88 and right to x 392, with bolted flanges at x 196 and 276.
  - A blank yellow posting at (32, 70, 54, 30) and a blank circle below it at (51–67, 104–120).
  - **Clear floor** under the puddle at (240, 254), radius 90.
  - The plume rises from about (250, 200).
  - The rover walks the floor line y 250.
- **Prompt:** "inside a pressurized water reactor containment building at the operating floor below the steam generators, a large vertical reactor coolant pump with a tall green electric motor with horizontal cooling fins centred in frame, heavy stainless pump casing at floor level with thick insulated suction and discharge pipes running left and right with bolted flanges, yellow polar crane girder spanning the top of the frame, steel floor grating, curved steel containment liner walls painted pale grey, cable trays, a blank yellow radiation posting plate on the left wall"

### 4.2 `pressurizer`: pressurizer cubicle (colour)

- **Init:** `pressurizer-base.jpg`. **Look:** `fluor`.
- **Keep:**
  - The vessel fills x 180–300, top of frame to y 250. A tall cylinder with aluminium lagging and seam bands every ~22 px. Shadow on its right edge, x 300–310.
  - Spray line running right at y 40–54 from x 300 to x 400.
  - A vertical relief line at x 392–406 from the top to y 60.
  - The relief valve body at (380, 56, 38, 30), dark painted steel.
  - **A red handwheel** centred at (399, 52), radius 16, seen at a steep angle.
  - **The steam wisp rises from (400, 62):** keep the area above and right of the valve dark and uncluttered so the steam reads.
  - A blank white sign plate at (40, 90, 58, 26).
  - Concrete cubicle walls.
- **Prompt:** "a cramped concrete cubicle containing the pressurizer, a tall vertical cylindrical vessel wrapped in aluminium-jacketed insulation with seam bands, filling the centre of the frame from floor to ceiling, an insulated spray line leaving it toward the upper right to a pressurizer relief valve with a red handwheel near the ceiling, bare concrete walls and floor, one ceiling light, a blank white danger sign plate on the left wall"

### 4.3 `msiv`: main steam valve room (colour)

- **Init:** `msiv-base.jpg`. **Look:** `fluor`.
- **Keep:**
  - The main steam line runs full width at y 128–174: thick, aluminium lagged, seam bands every 26 px.
  - The isolation valve body at (200, 96, 80, 110). Its actuator above at (214, 54, 52, 44), painted green.
  - A wall-mounted radiation monitor box at (360, 54, 70, 46) with a blank white face. The **code draws its status bar at (372, 102, 46, 8)**, so leave that strip as a dark recessed display window.
  - A small blank circle above the box at (395, 40).
  - **The beacon is drawn at (440, 40):** leave a small dark beacon housing there, or plain wall.
- **Prompt:** "main steam isolation valve room, one huge insulated main steam pipe crossing the whole frame horizontally at mid height, a large gate valve body in the middle of the pipe with a green hydraulic actuator on top, a wall-mounted radiation monitor cabinet with a blank white front panel and a dark recessed display strip on the right wall, concrete walls, high ceiling lights"

### 4.4 `drywell`: BWR drywell, recirculation pump A (infrared)

- **Init:** `drywell-base.jpg`. **Look:** `ir`, so generate in colour; the code converts it.
- **Keep:**
  - The same pump layout as containment, at 0.9 scale: centred x 240, feet at y 246.
  - An insulated pipe at the top left (0, 40, 160, 20).
  - Floor grating.
  - Clear floor under the puddle at (240, 258), radius 100.
  - The plume rises from (220, 186).
- **Light:** warmer and dimmer than containment. Fewer fixtures, one sodium-tinted.
- **Prompt:** "inside a boiling water reactor drywell, a tight circular steel and concrete space crowded with pipes, a vertical recirculation pump with a green motor centred, insulated pipes overhead, steel grating floor, dim warm work lights"

### 4.5 `torus`: suppression pool (infrared)

- **Init:** `torus-base.jpg`. **Look:** `ir`.
- **Keep:**
  - A still water surface filling the frame from y 150 down.
  - A horizontal header pipe on supports at y 140–152 across the full width.
  - Curved torus shell walls above.
  - The code draws shimmer lines on the water, and the plumes rise from (150, 160) and (330, 166). Keep the water **dark and calm**.
- **Prompt:** "inside the torus-shaped suppression chamber of a boiling water reactor, a curved steel shell, a dark still pool of water filling the lower half of the frame, a long ring header pipe on supports running across just above the waterline, a catwalk railing, dim lights"

### 4.6 `tunnel`: main steam tunnel (infrared)

- **Init:** `tunnel-base.jpg`. **Look:** `ir`.
- **Keep:**
  - A long concrete tunnel in strict one-point perspective. The vanishing point is at (240, 113), with the far wall a small dark rectangle at x 202–278, y 86–140.
  - Two huge lagged steam pipes run along the left and right walls, from the near edge at y 70–116 converging to the far end at y 104–114.
  - **Four** ceiling lights down the centre.
  - A blank circular posting on the far wall at (240, 86).
  - **The beacon is drawn at (240, 70):** a small dark beacon housing on the ceiling there.
  - Condensate drips fall at x 120–330.
- **Prompt:** "a long narrow concrete steam tunnel receding to a vanishing point in the centre, two enormous insulated main steam pipes running along the left and right walls into the distance, a row of ceiling lights down the middle, wet-looking concrete floor, a dark far end"

### 4.7 `cavity`: HTR-PM reactor cavity (infrared)

- **Init:** `cavity-base.jpg`. **Look:** `ir`.
- **Keep:**
  - A large circular steel closure head, seen as an ellipse centred at (240, 180), rx 150, ry 36.
  - Ten vertical control-rod drive housings rising from it, x 150–321, y 96–176, evenly spaced.
  - The code paints a warm glow over the ellipse when `warmGlow` is on, so keep it a matte grey metal.
- **Prompt:** "the top of a high temperature gas-cooled pebble bed reactor vessel inside its concrete cavity, a wide circular steel vessel head seen from above at an angle, ten tall slim control rod drive mechanism housings rising from it in a row, concrete cavity walls, a polar crane hook above"

### 4.8 `blower`: helium blower and steam generator (colour)

- **Init:** `blower-base.jpg`. **Look:** `fluor`.
- **Keep:**
  - The steam generator vessel stands at the right, x 290–400, top of frame to y 240.
  - The **helium circulator casing at (70, 110, 130, 120)** is now in the plate, painted green, with an inspection port at (120, 150, 30, 30).
  - A pipe joins them at (200, 150, 90, 24).
  - Epoxy floor with a yellow walkway.
  - **The code shake:** while `shake` is on, redraw a crop of the casing box `[66, 106, 138, 128]` from the plate itself, offset by `Math.sin(t*80)*2` px. Do not draw the old green cylinder.
  - The beacon is at (135, 96). The plume rises from (340, 150).
- **Prompt:** "inside a helium circulator room of a gas-cooled reactor, a large green helium blower casing with a round inspection port on the left, a tall cylindrical steam generator vessel on the right, a short thick duct joining them, epoxy floor with yellow walkway lines, clean industrial lighting"

### 4.9 `discharge`: pebble discharge line (colour)

- **Init:** `discharge-base.jpg`. **Look:** `fluor`.
- **Keep:**
  - A lagged pipe comes down at x 230–252 from the top to y 190, then turns and runs right at y 180–202 to the frame edge.
  - A local control panel at (90, 120, 70, 50), pale grey, with a dark display window at (96, 128, 58, 14). **The code bar sits at (100, 150, 50, 8)**, so leave a dark slot there.
  - **The beacon is drawn at (125, 104)**, on top of the panel.
- **Prompt:** "a pebble fuel discharge line room, a vertical insulated pipe coming down from the ceiling and bending into a horizontal run along the floor to the right, a small grey local control panel on the left wall with a dark display window and a dark status slot, a beacon housing on top of the panel, concrete walls"

### 4.10 `cell`: molten salt reactor cell window (amber)

- **Init:** `cell-base.jpg`. **Look:** `amber`.
- **Keep:**
  - **The camera looks through a thick shielding window.** The deep frame fills x 50–430, y 30–240. The amber glass area is x 74–406, y 50–220, with a faint reflection band at the top (y 50–80).
  - Behind the glass:
    - The salt line runs horizontally at (90, 140, 300, 18), with trace-heater cabling along its underside at y 160. **The code dots glow there.**
    - A vessel stands at (180, 70, 70, 70).
  - The code draws a thin vertical shadow at x 300–304, y 50–110 for `shadow`. Keep that area plain.
  - **Nothing alive behind the glass.**
- **Prompt:** "looking through a very thick amber-tinted lead glass shielding window set deep in a concrete wall into a hot cell, inside a horizontal pipe wrapped in trace heater cable and a squat steel tank, everything tinted deep amber by the glass, faint reflections on the glass surface, the dark concrete window frame filling the edges"

### 4.11 `freeze`: freeze valve FV-103 (colour)

- **Init:** `freeze-base.jpg`. **Look:** `fluor`.
- **Keep:**
  - A lagged vertical pipe at x 220–250 from the top to y 170.
  - The freeze-valve body at (205, 120, 60, 44), **covered in white frost and ice** in the base plate. `frostGone` is a state plate.
  - A short pipe running right at (265, 136, 90, 12) to a cooling-air fan housing at (350, 112, 70, 70).
  - **The code draws the spinning fan blades centred at (385, 147), radius 28**, so the housing must show an open round grille there with a dark interior.
  - A blank white sign at (60, 80, 80, 34).
  - The beacon is at (235, 96).
- **Prompt:** "a freeze valve station in a molten salt reactor drain line, a vertical insulated pipe ending in a short valve section completely coated in white frost and ice, a cooling air duct leading to a round fan housing with an open grille and dark interior on the right, a blank white equipment sign on the left wall, concrete room"

### 4.12 `offgas`: off-gas charcoal beds (colour)

- **Init:** `offgas-base.jpg`. **Look:** `fluor`.
- **Keep:**
  - Three tall cylindrical charcoal delay beds at x 80–160, 200–280 and 320–400, from y 70 to y 220.
  - A lagged header across their tops at (60, 56, 360, 12).
  - A blank radiation posting circle at (440, 90).
  - **The beacon is at (440, 110).**
- **Prompt:** "an off-gas system vault with three tall vertical steel charcoal adsorber tanks standing in a row, an insulated header pipe running across their tops, painted concrete walls and floor, a blank radiation posting on the right wall, fluorescent lighting"

### 4.13 `turbine`: turbine deck (colour, the hero shot)

- **Init:** `turbine-base.jpg`. **Look:** `fluor`.
- **Keep:**
  - A very long turbine hall in one-point perspective. The vanishing point is at (240, 97), with the far wall at x 168–312, y 56–138.
  - The low-pressure turbine casing in the middle distance, a long green-grey hood whose front edge runs from (110, 120) to (370, 120) and back to (170–310, 96).
  - **Five** high-bay lights down the centre.
  - Epoxy floor with two yellow walkway lines converging to the vanishing point.
  - Two-tone walls (darker lower 25%).
  - A blank green EXIT box at (20, 40, 40, 18). **The code writes "EXIT".**
  - **Two feedwater pump sets in the foreground,** now in the plate:
    - Pump A centred at x 70, feet at y 264, scale 0.55.
    - Pump B centred at x 410, same.
    - Each has a green motor at about x 51–89 and x 391–429, y 170–220, a coupling at y 220–232, a casing at y 232–264, and pipes running off-frame at y 237–253.
  - **The shaft glints stay code**, at each coupling.
  - **The beacon for `pumpStopped` is at (410, 120)**, on the wall above pump B.
  - The rover walks the floor line y 200 at 0.55 scale.
- **Prompt:** "a vast empty turbine hall at night, a long green low-pressure turbine casing in the middle distance, the hall receding in perfect one-point perspective to a far wall, a row of high bay lights down the centre, polished epoxy floor with two yellow walkway lines converging into the distance, two feedwater pumps with green motors in the left and right foreground, a blank green exit sign box high on the left wall, two-tone painted walls"

### 4.14 `corridor`: aux building, 2nd floor (sodium; the Backrooms one)

- **Init:** `corridor-base.jpg`. **Look:** `sodium`. It is graded yellow; generate in neutral colour with warm-white light.
- **Keep:**
  - A long, narrow, **too-symmetrical** corridor. The vanishing point is at (240, 113), with the far wall at x 206–274, y 81–145.
  - **Six** ceiling lights down the centre.
  - Beige two-tone walls (lower 30% darker), square floor tiles, and two conduits along the upper left wall.
  - Three wooden-brown doors down the left wall at depths 0.25, 0.5 and 0.7, with brass knobs.
  - **The locked high-radiation door on the right:**
    - Grey steel frame (372, 70, 86, 176).
    - Red door leaf (376, 74, 78, 172).
    - A blank yellow plate on it at (386, 94, 58, 46).
    - A blank yellow circle below at (406–424, 149–167).
  - It is **closed** in the base. `doorAjar` is a state plate.
  - Clear floor under the puddle at (200, 244), radius 80.
  - Chair and hard hat are state plates (3.4).
  - The rover walks the floor line y 200.
- **Prompt:** "a long narrow empty institutional corridor on an upper floor of a nuclear plant auxiliary building, perfectly symmetrical one-point perspective to a distant dead end, a row of fluorescent ceiling lights, beige two-tone painted walls, square floor tiles, brown doors along the left wall, a red steel door with a grey frame on the right wall in the foreground with a blank yellow sign plate and a blank yellow circle, liminal, uncanny stillness"

### 4.15 `pool`: spent fuel pool (colour; Cherenkov stays code)

- **Init:** `pool-base.jpg`. **Look:** `pool`.
- **Keep:**
  - A wide view across the spent fuel pool from a high corner. The far wall is at x 72–408, y 38–135, and the ceiling has two lights.
  - A yellow-and-black safety railing along the near pool edge at y 96–99.
  - A yellow foreign-material-exclusion line (a thin yellow pipe or chain) at y 80–84.
  - **The water surface starts at y 106** (`poolLow` makes it y 122).
  - The pool spans x 14–466.
  - Fuel storage racks are visible on the bottom: dark square cells from y 196 to 256, x 40–440, about 22 px pitch. **The code adds the blue Cherenkov glow at each rack.** Keep the water deep blue-green and clear, the racks dark, and **no blue glow baked in.**
  - Ripples are drawn around (200, 114). The tool bag is a state plate.
- **Prompt:** "a spent nuclear fuel storage pool seen from a high corner, very deep perfectly clear blue-green water, rows of square stainless steel fuel storage racks visible on the bottom, a yellow safety railing along the near edge, a yellow foreign material exclusion barrier, smooth stainless steel pool liner walls, a quiet bridge crane above, dim overhead lights reflected on the still surface"

### 4.16 `yard`: switchyard (sodium; outdoors at night)

- **Init:** `yard-base.jpg`. **Look:** `sodium`.
- **Keep:**
  - Night sky down to the horizon at y 170, with a few faint stars.
  - Gravel yard from y 170 down.
  - **Three lattice transmission towers** with their apexes at x 90, 240 and 390 (y 40) and bases at y 178. Crossarms at y 52–55 with insulator strings hanging to y 67.
  - Conductors sag between the towers at y 62–82.
  - **A sodium lamp on a pole** at x 452, from y 60 to y 180, casting an orange pool.
  - **The arc flash is drawn at (278, 62)** near the middle tower's right insulator.
  - The van headlights come along a road at y 214, from x 40 to x 240. Show a faint gravel access road there.
  - A chain-link fence is optional along y 160–175.
- **Prompt:** "an electrical switchyard at a nuclear plant at night, three steel lattice transmission towers in a row with insulator strings and sagging high voltage conductors, gravel ground, a gravel access road crossing the lower left, a chain link security fence, a single sodium vapour lamp on a tall pole at the right casting an orange pool of light, dark sky with a few faint stars"

### 4.17 `intake`: intake structure (infrared; outdoors at night)

- **Init:** `intake-base.jpg`. **Look:** `ir`.
- **Keep:**
  - A concrete deck wall band across the frame at y 80–110.
  - **Three travelling water screens** at x 80–144, 210–274 and 340–404, from y 30 to y 220, with horizontal mesh slats every 7 px.
  - Dark water from y 150 down, where the code draws shimmer lines.
  - **The beacon is at (450, 30).**
  - A seagull crosses at y 50–56 (code), so keep the sky dark and plain at the top.
- **Prompt:** "the intake structure of a coastal power plant at night, three tall vertical travelling water screens with fine horizontal mesh panels standing in dark sea water, a concrete deck crossing behind them, wet concrete, dim deck lights, black night sky above"

---

## 5. Checking each plate (do this for every candidate)

1. **Anchor overlay:** composite `<scene>-layers.jpg` at 50% over your candidate, both at 1920×1080. Every anchor in the scene's Keep list must line up within **±8 logical px** (±32 px at 1920): pumps, valves, sign plates, beacon spots, waterlines, rack rows, tower apexes, door edges. Anything outside that tolerance is a reject.
2. **Rule check:** no people, no text, no logos, no grain or vignette baked in, no blue glow outside `pool`, nothing broken or ruined.
3. **In-game check:**
   - Draw the plate through the real `paintCamera` (use `docs/audit/2026-11-20-nightwatch/realistic/gallery.html`, updated to load plates).
   - Look at the plain frame and the frame with every layer. Every event must still be **clearly visible** after the grade, especially beacons in the infrared scenes.
   - If an event got harder to see than in the current code version, fix the plate (darker, less clutter at that spot), not the event.
4. **Log it:** add each chosen plate to `docs/grok/night-watch-plates/log.md` with:
   - scene, tool, the full prompt, negative prompt, strength, seed if any, candidates tried;
   - why this one won;
   - a side-by-side image (`docs/grok/night-watch-plates/compare/<scene>.jpg`): code version left, plate version right, both through `paintCamera`.

---

## 6. Order of work

1. Branch `g/nw-plates` from `c/crew-outage-1118`. Read `cameras.ts`, `NightWatch.tsx`, `model.ts`, and this file.
2. Make the section 3.1–3.3 code changes with **no plates present**. Prove the fallback is pixel-identical by eye to today's feeds (gallery shot) and that tests pass.
3. Generate plates in this order (hero shots first, so the look is settled early): `turbine`, `corridor`, `pool`, `containment`, `yard`, then the rest.
   - After the first three, stop and compare them side by side for consistency (lens, exposure, era of equipment). Write the house look you landed on at the top of `log.md`, and hold every later plate to it.
4. State plates (3.4).
5. The rover sprite (3.5).
6. Optional video underlays (3.6).
7. Tests (section 7), then the browser playthroughs (section 8).
8. Evidence, `decisions-pending.md` note, commit, push `g/nw-plates`. **Do not merge.**

---

## 7. Tests

Run `ESBUILD=/path/to/esbuild node --test 'scripts/**/*.test.mjs'`.

- **Baseline:** 9 failures already exist (`does not duplicate grok:app_id`, `does not duplicate x:creator tags`, `injects project id…`, `injects x:creator tags…`, `leaves an existing twitter:card alone`, `platform chrome injects twitter:card…`, `uses the app name…`, `scripts/cabinet-rewards.test.mjs`, `scripts/desk-verdict.test.mjs`). **No new failures.**
- **Keep all 13 tests in `scripts/nightwatch.test.mjs` passing unchanged.** In node no plate loads, so they test the fallback. That is intended.
- **Add `scripts/nightwatch-plates.test.mjs`:**
  - Every name in `SCENE_NAMES` has a `PLATES` entry, and its file exists.
  - Every plate is 960×540 and ≤ 180 KB, and every state file is too. Read the WebP header; no new dependencies.
  - Every state key is a real model visual: it appears in `siteWatch(site).events[].visual` or `.oddities[].visual` for some site.
  - Every state box lies inside 480×270.
  - The rover sheet, if present, is 768×192.
  - The total size of `public/nightwatch/` is ≤ 3.5 MB, or ≤ 4.7 MB with the optional videos.
- **Production build:** `npm run build` and `npm run typecheck` must pass. The plates live under `public/`, so check that `/nightwatch/plates/turbine.webp` is served by the **built** output, not only by dev.

---

## 8. Browser proof (real input only; hooks only for labelled setup)

Use the existing harness pattern: `docs/audit/2026-11-20-nightwatch/realistic/nw.mjs` and `rover.mjs`.

- **Full night:**
  - Run `nw.mjs 1280x720 full` on the **production build**.
  - Survive night 1 to 06:00 by watching flashing cameras and red tiles only. Record the log.
  - Zero page errors and zero failed requests for plates.
- **Phone:** `nw.mjs 390x844 quick`. No horizontal overflow, and the feed is readable.
- **Rover:** `rover.mjs` waits for Jordan's radio call, clicks that camera, and the sprite is on it, walking (two shots 0.5 s apart show different frames).
- **First-frame check:** on a cold load (cache disabled), the first feed after lifting the tablet shows the code fallback or the plate, never a blank or black frame. After `loadPlates()` resolves, plates replace the fallback without a flash.
- **Performance:** with the tablet up, frame time on a throttled 4× CPU stays under 16 ms on average. Record the number. If plates make it worse, cache the graded static plate per scene the same way `baseFor` caches, rather than shrinking the art.
- **Evidence** goes in `docs/audit/2026-11-2x-nw-plates/`:
  - before-and-after gallery sheets for all 17 scenes;
  - every state plate on and off;
  - rover frames;
  - run logs;
  - the perf number;
  - a README listing what was checked and what was not.

---

## 9. Report back

Your final message to the owner, in plain words:

- Which plates were made, which needed the most tries, and any scene you could not make convincing (say so; do not ship a weak plate, since the code fallback is better than a bad photo).
- Whether every event is still at least as easy to see as before.
- The size budget used and the frame time.
- Tests: totals and that the 9 baseline failures are unchanged.
- The branch name and commit. **Not merged.**

Commit messages end with your own attribution line. Do not reuse Claude's.
