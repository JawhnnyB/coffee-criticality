# Coffee & Criticality — Art & UI Quality Standard (A-series)

One rule: **everything on screen is native-resolution pixel art, scaled by whole numbers, with no smoothing.** The rooms, characters, menu, cabinets, portraits and reactor drawings must look like they came from the same hand.

## 1. Audit — what was inconsistent
| Area | Problem | Fix |
|---|---|---|
| Menu / splash | Painted, soft image; text over it not pixel | Native 384×216 pixel scene + pixel title + 9-slice buttons |
| Portraits (`TeachPriya`) | Painted JPG, different style from the sprites | 48×48 pixel portrait with expression frames |
| Cabinets | CRT blur / scanline filter, scaled with smoothing, system fonts | Native 320×180, `image-rendering: pixelated`, shared bezel, pixel font, no filter |
| Reactor Builder | Crude SVG loop (`LoopSchematic`), different style per step, type thumbnails not readable | Four labelled pixel schematics, one convention, shown at integer scale |
| Reactor drawings | Invented colour use; fluid colour meant nothing | Colour = temperature, fixed colours for other fluids, flow arrows on every pipe |
| Typography | Mixed fonts | One 5×7 pixel font for all UI and labels |

## 2. Global rules (all art)
1. Outline `#3b2318`, 1 px, on every object. No pure black, no pure white (use `#fff8e4`).
2. Flat 3-tone shading, light from top-left. No dithering, gradients, glows, blur, alpha-feathering.
3. Warm mid-saturation daytime palette. Ground shadows are flat translucent shapes.
4. Native sizes: screens/schematics 384×216 (shown ×3 = 1152×648); cabinet canvases 320×180; Builder mock 640×360 (×2); portraits 48×48 (×6 in dialogue); tile 16.
5. Display with `image-rendering: pixelated` and **integer scale only**. If the window is not an integer multiple, letterbox; never fractional-scale.
6. No CRT filter, scanlines, vignette, bloom or chromatic effects anywhere. Atmosphere comes from palette only.
7. Text: bundled pixel font (5×7 caps, 1 px outline or shadow only on titles). UI text is HTML/canvas text in that font, not baked into photos.

## 3. UI kit
- Panel: 1 px outline, 2 px inner bevel light top-left, fill `#f4e8d0` (light) or `#2a1a14` (dark HUD).
- Button: 9-slice, 3 states (idle / hover = lighter fill + selection arrows `> <` / pressed = 1 px down). Selected card = cream fill + gold border.
- Progress pips: 6×4 squares, filled = `#7ac0b8`, empty = `#3a2a22`.
- HUD tile: dark panel, label small caps in amber, value in large 5×7 ×2, unit small amber.
- Cabinet bezel: each cabinet has one accent colour (Catch orange, Rods green, Phys gold, Delay blue); screen area black-brown `#1c1410`; title line `NAME.CAB` left, stats right; footer: hint line, `ESC LEAVE CABINET`, `TEACHING ONLY`.

## 4. Reactor drawing convention (accuracy rules)
- **Primary fluid colour = temperature**, seven flat bands, auto-scaled per drawing with a printed scale bar:
  `#3a78c0 #4aa0c8 #7ac0b8 #e8d070 #e8963a #d4552e #a82a3a` (cold → hot).
- Scales: PWR 285–350 °C · BWR 200–330 °C · MSR 625–670 °C · Pebble 250–750 °C.
- Fixed colours: secondary / condensate water `#4a86c8`; cooling lake `#3aa0a0`; steam cream `#f4ecd8` with bubble dots; coolant salt `#d8b050`; helium `#d4cce6` (stipple for gas); graphite `#4e5560`; frozen plug `#b8e0f0`; heat = orange arrow.
- Every pipe has direction arrows. Every drawing labels pressure, hot and cold temperatures, and where heat leaves.
- Phase shown by texture, not colour (steam = dots).
- Footer on each schematic: "Simplified teaching drawing — not a license."

### Per-reactor facts depicted
- **PWR** — 15.5 MPa liquid primary that never boils (hot leg ≈ 325 °C, cold ≈ 292 °C). Flow: downcomer → lower plenum → up through core → upper plenum → hot leg → steam generator U-tubes → pump → cold leg. Pressurizer on the hot leg through a surge line. Rods enter from the top. Secondary ≈ 6 MPa / 275 °C saturated steam → turbine → condenser (lake) → feed pump.
- **BWR** — ≈ 7.2 MPa, 288 °C saturation, feedwater ≈ 216 °C. Boiling in core, rising void fraction; steam passes separators and dryers straight to the turbine (no steam generator). Jet pumps in the downcomer plus recirculation pump. Rods enter **from below**.
- **Molten salt (MSRE-style)** — fuel dissolved in the salt, ≈ 0.2 MPa. Graphite stringers with fuel slots. Salt down the annulus, up the core; outlet ≈ 663 °C → pump bowl (helium cover gas, off-gas line) → heat exchanger → ≈ 635 °C back. Separate coolant-salt loop → steam generator. Freeze plug (solid salt) above a subcritical drain tank.
- **Pebble bed (HTR-PM-style)** — helium 7 MPa, 250 °C in → 750 °C out. Helium rises in side-reflector risers, reverses, flows **down** through the bed (cold top, hot bottom). Pebbles drift down, pass burnup measurement, are reused or discarded, lifted to the top. Decay heat leaves through the vessel wall. Inset: pebble and TRISO layers (kernel, buffer, PyC, SiC, PyC).
- Caveat: HTR-PM steam-generator internals, steam conditions (13 MPa / 567 °C) and the MSRE temperatures are from memory and simplified. Verify against IAEA / ORNL sources before claiming exact numbers; the "simplified" footer stays.

## 5. Acceptance checks (a screen passes only if all are true)
1. Screenshot zoomed in: every edge is a hard pixel edge. No blur, no half-pixel scaling.
2. No text overlaps art or other text at 1×, 2× and 3×.
3. Only palette colours; outline on every object.
4. Same font everywhere. No CRT filter.
5. Reactor drawings: colour bar present, arrows on all pipes, pressure + temperatures labelled, phase by texture.
6. Cabinet: 320×180 canvas, bezel, footer text present, restart / leave reachable by keyboard.
