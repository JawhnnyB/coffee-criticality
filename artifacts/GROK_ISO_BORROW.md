You are Grok Build for Coffee & Criticality (TanStack Start, /workspace).
Catch > heroics. Stardew warm industrial. NOT horror, NOT military, NOT photoreal.
Palette: cream #f3e6d0, copper #c4783a, leaf #6b8f71, ink #16110d, steel #3d5c66, gold #c9a227, wood #6a4a32.
Magenta #FF00FF only on isolated sprites.

CAMERA LAW (do not break):
- This game is 3/4 TOP-DOWN like Stardew, NOT isometric rooms.
- Tiles stay 16×16 squares. People stay 32×48. Integer zoom. imageSmoothingEnabled = false.
- Do NOT convert rooms, floors, walkers, or doors to diamond iso.
- Iso is borrowed ONLY for: (A) teaching plates of a single machine, (B) the pause-map diamond, (C) box lighting, (D) foot Y-sort.

RULER: espresso kettle.png 16×16. Light from TOP-LEFT. Three values on every box: top light, left mid, right/south dark. Ink outline 1px. No letters on art. Teaching k-numbers stay CODE.
PACKER: tools/packSprite.py. Never PIL NEAREST at 20×. Never hqx. Never flood-fill cream interiors (aprons, shirts).
Keep startup.sh and WASD. tsc clean. No new character sheets. No Mabel re-Imagine. No 16:9 rooms. No /art/gen/rooms/.

────────────────────────────────────────
1) Box lighting — steal iso without rotating the world
────────────────────────────────────────
Redraw in PIL at native dest size (do not Imagine 1408 then squash). Top-left light. Three planes + ink.

Native sizes (artSpec.ts PROP_NATIVE, 1:1 blit, feet on box bottom):
- van 96×48 — minivan, steel body, copper stripe, cream windows, copper hubs. Left face lighter than right. Wheels on the ground line. No cream slab.
- chair 16×24 — wood stool, seat top light, legs dark south.
- bench 48×24 — table top light, apron mid, legs dark.
- desk 48×32 — same, paper cream is interior not halo.
- cabinet 24×40 — steel locker, left highlight, right shadow, copper handle.
- door 16×32 — wood panels, copper knob, top rail light.
- plant 16×24 — pot copper, leaves leaf/ink, no blob.
- kettle already the ruler — do not touch.
- counter 80×48 — keep if it already has three-plane wood. Only retouch if lighting is flat.

QC: composite wood floor + kettle + chair + van + player idle at 1:1 then 4× nearest → artifacts/iso_borrow/light_qc.png
Every box must read as a cube, not a flat sticker.

────────────────────────────────────────
2) Teaching plates — dimetric 2:1 OBJECTS, not rooms
────────────────────────────────────────
Plates stay 320×180 cards (cream paper OK — these are cards). The MACHINE on the card is drawn in 2:1 dimetric (2px over, 1px down ≈ 26.6°). One object. Transparent or cream around. No floor diamond, no room, no letters.

Redraw or i2i-from-lock then packPlate.py:
- plate_pwr.png — PWR vessel, cold inlet / hot outlet only, Cherenkov blue in core. 2:1 vessel, not a photo.
- plate_bwr.png — same vessel language + steam dome / layer gaps. Not a PWR paste.
- plate_pebble.png — bag of TRISO marbles in a vessel. NO internal piping.
- plate_msr.png — salt loop, graphite ring. Inlet/outlet only.
- plate_rod.png — one metallic pin, dimetric, blue glow.
- plate_assembly.png — SIDE view of a fuel assembly in water, bubble loop. Not top-down lattice.
- plate_core.png — top-down core as a 2:1 disc/hex, Cherenkov, not a 16:9 photo.
Keep plate_lake, plate_culture, plate_cafe, plate_alara, plate_scales, plate_shuffle, plate_export, plate_dt as 3/4 or paper cards — do not iso those.

Wire stays in NuclearDesk.tsx / PlantHud.tsx / content.ts STILLS. Integer contain. No object-cover.

────────────────────────────────────────
3) Pause map — tiny 2:1 site diamond
────────────────────────────────────────
Replace the SVG rect MiniMap in GameApp.tsx with a dimetric site plan.

Source of truth: FOOTPRINT in src/game/site.ts (tile coords). Do not invent a new layout.

Draw in PIL to public/art/gen/ui/site_iso.png at 160×90 (or 320×180 then blit integer):
- Each room is a 2:1 diamond (or extruded box: top + left + right, three values).
- Cafe copper roof, Hall steel, Control gold-dark, Reactor leaf, Eng wood, Maint ash, Gate asphalt, Parlor copper.
- Lake Master a 2:1 water diamond west of cafe — pixel, not photo.
- Current room: gold pip (pip.png 8×8) on that diamond.
- Labels are CODE (MiniMap text overlay), not painted letters.

Wire MiniMap: draw the PNG pixelated, overlay the pip at FOOTPRINT[room] projected with:
  sx = (mapX - mapY) * (TW/2)
  sy = (mapX + mapY) * (TH/2)
using the same origin you baked into the PNG. Keep the teaching caption in CODE:
  "Cafe east to the lot. Teaching layout — not a license."

Walkable world stays square tiles. This diamond is HUD only.

────────────────────────────────────────
4) Sort by feet — finish the law
────────────────────────────────────────
In render.ts drawWorld:
- Sort key is FOOT Y (rect.y + rect.h for props, n.y / s.y for people). Already mostly true — audit every drawable.
- FLOOR_PROP must include: rug, and any future floor decal. Draw those BEFORE the sorted pass (under feet).
- WALL_PROP: poster, window stills, Board A if it sits on the north wall — draw with wallpaper, NOT in the people sort, so a poster cannot cover a torso.
- Nameplates draw with the person (same y), not as a separate earlier layer.
- Doors: north doors sort with WALL (behind people). South/east/west doors sort by foot Y so you walk behind or in front correctly.
- Steam sorts at the kettle/valve foot Y, not a magic number.
- Roofs/stacks on campus: sort by footprint bottom. Player walking "south of cafe roof" draws in front.

QC walk: player crosses the cafe rug (stays under), walks in front of the counter (counter occludes legs, not head if y is less), walks south of a plant (plant in front). Screenshot → artifacts/iso_borrow/sort_qc.png

────────────────────────────────────────
5) HUD pip + cache
────────────────────────────────────────
- pip.png 8×8 copper pip if missing.
- Cache-bust props ?v=iso, plates ?v=iso, site_iso ?v=iso, walk ?v=direct (do not re-pack walkers).
- grep public + src for /art/gen/rooms/ — must stay zero.

────────────────────────────────────────
6) STOP. Screenshots
────────────────────────────────────────
A. Cafe: kettle + chair + counter + Mabel + player. Three-plane boxes. Rug under feet.
B. Builder type row: PWR plate is a 2:1 vessel, not a photo room.
C. Pause map: 2:1 site diamonds + pip on current room. No SVG rectangles.
D. Control: Elena/Holt full 32×48, Board A on the wall not covering torsos.

tsc clean. Playwright: open builder → see PWR plate; pause → see diamond map; walk cafe rug → rug stays under.

Do not start a new character sheet. Do not re-Imagine Mabel. Do not rotate the overworld to iso.

Read: src/game/render.ts (FLOOR_PROP, drawables.sort), src/game/site.ts FOOTPRINT, src/game/GameApp.tsx MiniMap, src/game/artSpec.ts, src/game/NuclearDesk.tsx, public/art/gen/props/kettle.png (the light ruler).
Start at step 1. Show light_qc.png before doing plates 2–3 if lighting slips.
