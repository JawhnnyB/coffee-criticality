# GROK_ART_101 — faces, map, teaching plates

Catch > heroics. Stardew 3/4 top-down. NOT iso rooms. NOT horror. NOT military.
Palette: cream #f3e6d0, copper #c4783a, leaf #6b8f71, ink #16110d, steel #3d5c66, gold #c9a227, wood #6a4a32.
Magenta #FF00FF only on isolated sprites. No letters on art. k-numbers stay CODE.
RULER 32×48 people / 16×16 tiles. Integer zoom. imageSmoothingEnabled = false.
PACKER tools/packWalk.py — cream flood must NOT eat skin (r>228 paper only).
Keep startup.sh WASD. tsc clean.

The disappear-face bug: lock 1408 LANCZOS to 23px turns the face into a brown mound.
Paint a native 32px skin oval + eyes (tools/paintFace.py). Do not re-Imagine Mabel as a 1408 sheet.

────────────────────────────────────────
1–15 Face + body (do first)
────────────────────────────────────────
1. Player idle: peach face, glasses, two ink eyes. Already stamped. QC 4× nearest.
2. Priya / Elena / Jordan: same stamp. Dark skin stays dark, not navy.
3. Mabel bun + apron cream interior. Do not flood apron.
4. Holt / Tommy / Marcus: stamp + tommy cap.
5. Loco sheets: copy head 0–20 onto walk frames so the face does not blink off.
6. Side / up sprites still old. Either stamp the same head or drop to idle+flip until redrawn.
7. Talk 96×96: crop lock bust, not a second full-body. Dialogue uses portraits/*_talk.png.
8. Maintenance wallpaper: the tiled window grid in the screenshot is a steel tile, not a face. Redraw wallpaper_control as 16×16 steel panel + one small pane, not a 4×4 window mosaic that reads as a mask.
9. Floor in maint: metal 16×16, grout only, no nails.
10. HUD pip stays 8×8 copper.
11. Cache ?v=face on idle/loco.
12. Do not convert rooms to iso.
13. QC: player in Maintenance, zoom 4, face reads as skin not navy.
14. QC: Mabel in cafe, apron cream, face peach.
15. tsc. No new 1408 locks.

────────────────────────────────────────
16–35 In-game map + pause
────────────────────────────────────────
16. Pause map: clickable room labels (done). Blurb + links (done).
17. Redraw site_plan.png 320×180: lake, cafe, lot, hall, control, core, eng, maint, parlor as 3-plane boxes. No letters on the PNG.
18. Align MAP_HUD % to the new plan (pip on the room you are in).
19. HUD inset map 120×68 (done). Keep pip.
20. Pause: who’s in this room (done). k proxy if plant exists (done).
21. Pause: day goals + culture stage stay.
22. Do not warp from the map. Walk is the week.
23. Glimpse plates 48×32 behind doors — still no 16:9 rooms/.
24. Campus outdoor: grass + asphalt tiles, van 96×48 three-plane.
25. Van: steel body, copper stripe, cream glass, copper hubs. Not a cream slab.
26. Door 16×32 wood + copper knob. North/south via flip.
27. Roof / stack props only on outdoor.
28. Mini-map legend in pause: Cafe-Lot-Hall / Control-Core / Eng-Maint-Break-Arcade.
29. Period tint stays a wash, not a multiply on faces.
30. Steam 16×16, not a cream rectangle.
31. Rug under feet (FLOOR_PROP). Counter occludes legs.
32. Nameplates stay off.
33. Play HUD: time, room, map, culture. Objective center.
34. Pause three-column on lg (done).
35. Screenshot pause map + cafe + maint face.

────────────────────────────────────────
36–55 Teaching plates + diffusion photos
────────────────────────────────────────
36. Term plates 160×90 (done). Wire TERM_ART (done).
37. Core-part buttons: pellet, clad, moderator, coolant, vessel, reflector, delayed (done).
38. TermWindow: plate on top, Palatino body, disclaimer (done).
39. Replace term_*.png with Imagine i2i from plate_pwr language if PIL reads as clipart.
40. plate_pwr / bwr / pebble / msr stay the live HUD identity.
41. Fuel rod plate: metallic rod, Cherenkov, no white paper halo.
42. Assembly plate: side view, water + bubbles, not top-down postage.
43. Core plate: top-down lattice, blue glow, not an egg.
44. Alpha on teaching HUD overlays — no cream box around the vessel.
45. OpenMC pane stays full width under the builder.
46. k-ladder still CODE. Never paint numbers on plates.
47. Shuffle chips 16×16 F/1/2.
48. LOTOTO 16×16 ok/lie.
49. Builder type thumbs 160×90 from the big plates.
50. Academy pages use 320×180 plates, not rooms/*.png (still zero).
51. Menu lake plate + optional video. Video is extra, not identity.
52. Disclaimer on builder, academy, shuffle, export, pause map, endings.
53. Diffusion copy stays long. Do not shrink to tooltips.
54. Playwright: open builder → click Σ_a → see plate + body. Click vessel → see tank plate.
55. tsc.

────────────────────────────────────────
56–75 World cohesion (coffee-machine ruler)
────────────────────────────────────────
56. kettle.png 16×16 is the light ruler. Top-left light, three planes, 1px ink.
57. Chair, stool, table, plant, arcade cabinet, door: redraw at dest size in PIL to match kettle, not a squash of 1408.
58. Counter 56×40 already. Do not tower furniture.
59. Cafe wallpaper cream paper. Control steel. Do not draw wood planks on walls.
60. Wood floor 4-plank variants, grout only.
61. Metal floor / grate 16×16 for maint + reactor.
62. Grass / asphalt / warning stripe for gate.
63. Window 48×32 glimpses, object-contain, no object-cover.
64. Board A on the control wall, not covering torsos.
65. Core 48×48 vessel + 16×16 glow.
66. Valve / cabinet / crate three-plane.
67. Poster / rug are paper — cream OK, transparent outside.
68. Arcade bezel native, pixelated.
69. No /art/gen/rooms/.
70. Integer blit 1:1. Never PIL NEAREST at 20×. Never hqx.
71. Feet on box bottom. Y-sort by footprint.
72. Touch stick on phone stays.
73. Mute on menu / pause / play (Wave G).
74. Walk is idle+bob until side/up sheets are stamped with the same head.
75. QC composites: cafe, control, reactor, gate, maint.

────────────────────────────────────────
76–90 Characters as people
────────────────────────────────────────
76. Dialogue uses 96×96 talk busts, never a walk-sprite crop.
77. If a talk PNG is full-body (Priya), recrop to head+shoulders.
78. More talk lines already exist — keep branches, not 1–2 dry sentences.
79. Trust hearts 8×8.
80. Pause relationship list stays portraits not cubes.
81. Player glasses stay. Do not flood them as navy face.
82. Elena hair long, Priya braid, Tommy cap, Mabel bun — native pixels, not lock mush.
83. No name labels over heads.
84. Wander NPCs use the same idle+bob.
85. Clamp y WALL+18 so heads are not in the wallpaper.
86. Do not start a new character sheet from text. Edit-chain from lock + native stamp.
87. HORDE / fish / plot stay parlor.
88. Zombie maps stay arcade-only.
89. Just Culture copy: one sentence, then a person.
90. Ending stills: plate_lake + talk busts, not object-cover photos.

────────────────────────────────────────
91–100 Stop conditions
────────────────────────────────────────
91. grep /art/gen/rooms/ = 0.
92. tsc clean.
93. Playwright week-smoke + builder-smoke green.
94. Screenshot A: Maintenance player, peach face, not navy.
95. Screenshot B: Pause map, clickable Core blurb, pip on current room.
96. Screenshot C: TermWindow vessel plate + body copy.
97. Cache-bust only what changed (?v=face, ?v=term).
98. Do not invent Wave H as a new 100 unless this list is done.
99. Teaching model — not a license. Catch > heroics.
100. STOP. Walk the week. Do not start another art bible until the face and the map have been seen in the preview.

Already shipped in this pass: 1–6 (idle stamp), 11, 16, 19–21, 33–38, 52, 81.
