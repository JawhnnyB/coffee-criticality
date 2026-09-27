# GROK_WORLD_100 — Unit 1 is a place, not a level list

Coffee & Criticality. Catch > heroics. Stardew warm industrial. NOT horror, NOT military.
Palette: cream #f3e6d0, copper #c4783a, leaf #6b8f71, ink #16110d, steel #3d5c66, gold #c9a227, wood #6a4a32.
Ruler: person 32×48. TILE 16. Integer zoom. imageSmoothingEnabled = false.
Teaching k-numbers stay CODE. No letters on sprites. No emoji in chrome.

## Do not do this

Do **not** drop interior rooms as live walkable boxes onto one aerial PNG.
3/4 camera + mixed room sizes + a 160–320px photo = mush, wrong scale, people taller than buildings.

The plant is two layers:

1. **Campus** (one outdoor map, tile-authored): lake, lot, van, building **shells**.
2. **Interiors** (rooms): cafe, hall, control, reactor, eng, break, maint.

You never see the next room as a live sim. You see a **glimpse plate** in the door hole.
You always know where you are from a **site plan** (HUD) whose footprints match `SITE` in `src/game/site.ts`.

## Door law (already started)

Leave east → spawn west of destination, just inside the matching door.
`spawnInside(to, from)` — do not hardcode spawn pixels.

Spine (west → east, north = lake):

```
                [control]——[reactor]
                     |          |
[cafe]—[gate]—[corridor]——[break]
                     |          |
              [engineering]—[maintenance]
```

Cafe **east** wall ↔ Gate **west**. Gate **east** ↔ Corridor **west**.
Corridor **north** ↔ Control **south**. Corridor **south** ↔ Eng **north**.
Control **east** ↔ Reactor **west**. Reactor **east** ↔ Maint **west**.

---

## 100 steps

### A. Law (1–12)
1. Keep `src/game/site.ts` as the only map truth (`SITE` footprints + `spawnInside`).
2. Every `RoomDoor` has a wall: N/S/E/W from rect vs room size. No diagonal doors.
3. Pair test: for every door A→B there is B→A on the opposite wall.
4. `beginTransition` always uses `spawnInside`. Delete leftover `spawn:` pixels after QC.
5. Fade stays. Player facing = the way they walked through.
6. Door cooldown so you do not bounce.
7. Mabel still gates the nuclear island. Geography does not skip culture.
8. Print a door graph in `screenshots/DOORS.txt` (from, side, to, side).
9. Playwright: cafe walk east → gate west; gate east → hall west.
10. Playwright: hall north → control south; control east → reactor west.
11. If a pair fails, move the **rect**, never the spawn constant.
12. STOP. Walk the spine once. Write which pair still feels like a teleport.

### B. Glimpses (13–22)
13. Door hole blits destination **plate** (cover, clipped). Not the live next room.
14. East/west holes are 16×48. North/south 48×16. Plate is 80×48 or 48×32 — never 16:9 photo.
15. Door sprite sits **in front** of the glimpse (z). You peek, you do not enter.
16. Cafe glimpse of gate = parking plate. Gate glimpse of cafe = cafe plate.
17. Control glimpse of reactor = this unit’s core plate (teaching).
18. No people in glimpse plates.
19. Windows stay 48×32 stills of **outside** (lake, lot), not of the next interior.
20. Cache-bust glimpse plates `?v=world`.
21. Screenshot: standing in cafe looking at east door — parking color in the hole.
22. STOP. If glimpse reads as a stretched painting, redraw 48×32, do not scale 320×180.

### C. Site plan HUD (23–32)
23. `public/art/gen/ui/site_plan.png` is 160×90, no letters.
24. Footprints match `SITE` colors: cafe copper, gate asphalt, hall steel, control gold, reactor leaf, eng wood, break cream, maint steel, lake north.
25. HUD 80×45 integer blit. Pip on **current** room only.
26. Pause screen: 160×90 full plan + Palatino names in **code** (not on the PNG).
27. Day/night tint the plan (morning copper, dusk steel).
28. Do not put k-numbers on the plan.
29. Pip is 2×2 gold.
30. If the player is on campus (gate), pip on the lot, not the cafe.
31. Screenshot HUD + cafe east door in one frame.
32. STOP. Plan must be readable at 80×45.

### D. Campus outdoor (33–50) — the real “full PNG”
33. Author **one** outdoor tilemap at TILE 16. Size ~ 96×40 tiles (lake band + lot + building roofs).
34. This is the only place a “full plant PNG” is allowed — as a **baked tilemap**, not under interiors.
35. Lake north. Shore grass. Lot asphalt. Van 96×48 on the lot.
36. Building roofs: cafe, hall, control, reactor as **unwalkable** shells from outside.
37. Gate house is walkable outdoor (current `gate` room **becomes** a camera window on this map).
38. Enter cafe from the lot through the **east/west door pair**. Fade to interior cafe.
39. Do not simulate interiors on the campus map.
40. Camera on campus: same zoom 3–5, follow player, clamp to map.
41. Time of day: sky band already exists — use it here.
42. Elena’s van is a prop on the lot, not a room.
43. Distant stack / cooling towers as 48×64 props on the north shore. Teaching, not design basis.
44. Fence + warning stripe 16×16, not a photoreal gate.
45. Ambient: birds/lake optional later; not this wave.
46. Collision: roofs solid, door lanes punch like interiors.
47. Pack campus tiles (grass, asphalt, roof, water) — no 16:9.
48. Screenshot: lot, van, cafe roof, lake. Person 32×48 not taller than van.
49. Walk lot → cafe door → interior. Facing preserved.
50. STOP. Outdoor must feel like the same plant as the HUD plan.

### E. Interior flow (51–70)
51. Cafe: only **east** door to lot. South wall is kitchen / mural, not a portal.
52. Corridor is the **spine**. Long E–W. Doors N control, S eng, W lot, E break.
53. Control: south to hall, east to reactor. Windows north to **core plate**, not lake.
54. Reactor hall: west control, east maint. Core 64×64 center. ALARA.
55. Engineering: north hall, south maint, east break optional.
56. Break: west hall. Kettle 16×16. This is the human room.
57. Maint: west reactor, north eng. Valve 14. LOTOTO.
58. Each interior keeps its own floor (wood / stone / metal). Do not share one PNG floor for all.
59. WALL 48 mural. Door lanes already punch. Keep that.
60. Room sizes stay as now; do not grow a room to match the aerial photo.
61. NPCs: schedule by room, not by map xy, until campus merge (gate Elena stays on lot).
62. Nameplates above 32×48 heads. Do not cover door glimpses.
63. When two doors share a wall in data, they must share a wall in the plan.
64. Break’s second door to eng: both west today — **fix** to one west (hall) and one south or west-offset. No two west portals stacked.
65. Poster / culture stills stay on corridor, not floating in campus.
66. Steam only cafe + leaking valve.
67. Lighting: interior wallpaper, outdoor sky. Never mix in one room.
68. Screenshot walk: cafe → lot → hall → control → reactor. Five rooms, four legal pairs.
69. If any hop feels like a loading screen, shorten fade, keep facing, keep glimpse.
70. STOP. Write `screenshots/SPINE.txt` with the five-room path.

### F. Camera (71–80)
71. Zoom stays 3–5. Do not go back to 5–8 peephole.
72. Interior camera clamps to that room. You do **not** see adjacent interiors live.
73. Outdoor camera clamps to campus map.
74. Through a door you see glimpse only.
75. Screen shake stays incident-only.
76. Letterbox never. Integer blit to the view.
77. If a room is smaller than the view, center it; fill extra with **wallpaper or sky**, not the next room.
78. Debug: `DEBUG_ART` draws door cardinals.
79. Mobile: same zoom law, touch stick already exists.
80. STOP. Cafe should show most of the room plus the east glimpse.

### G. Art to generate (81–92)
81. `glimpse/{id}_48x32.png` for each destination. From existing plates, pack 48×32, no flood.
82. Campus roof tiles 16×16: cafe copper, hall steel, reactor leaf glow 1px.
83. Lake water 16×16 animated later; still tile is enough now.
84. Fence, boom, warning stripe already exist — place on campus.
85. Stack / tower 32×64, teaching silhouette.
86. Door 16×32 keep. East/west use the same, no squash.
87. Site plan 160×90 — already a stub; redraw once footprints lock.
88. Do not Imagine 16:9 rooms.
89. Do not re-Imagine Mabel.
90. Van stays 96×48 on the lot.
91. Pack all new tiles with chroma, no cream flood on grass.
92. STOP. QC: lot + cafe roof + van + 32×48 player.

### H. Social / week (93–100)
93. Geography serves the week: Mabel cafe → Holt control → Priya eng → Tommy reactor → Valve maint.
94. You can see the core plate from control **window** before you have clearance. You cannot walk it until Mabel.
95. Commute still starts at the van on the lot.
96. Friday shuffle is in reactor, not a separate dimension.
97. Ending walk: lot at dusk, lake north, stack breathing — campus map, not a slideshow.
98. Never claim the floorplan is a licensed plant.
99. `tsc` clean. `startup.sh` and WASD unchanged. A = left.
100. STOP. Deliver: door graph, spine walk, site plan HUD, glimpse QC, this file.

---

## First ship (done or doing now)

- `spawnInside` + cafe **east** door
- Door glimpse of destination plate
- 160×90 site plan in the HUD
- Zoom 3–5, person 32×48, van 96×48

Next concrete slice after this file: **§D campus outdoor tilemap** (steps 33–50), then fix break’s double-west door (step 64).
