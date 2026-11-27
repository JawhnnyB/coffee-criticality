# Look pass: Mabel's café and the cast, 26 November 2026

The owner asked for the café to be "beautiful and stunning, pixel art candy almost", and for the characters to have "more charm, personality, and love in each design".

| What | Made by | Evidence |
|---|---|---|
| Chibi cast: hand-drawn heads and hair, a face and a shape for each person, a four-frame walk in three directions, and a seated pose | `tools/artkit/chibi.py` | `05-cast-before-after.png` |
| The café, repainted on the same collision, with painted light and shade | `tools/roomkit/cafe_candy.py`, `src/game/roomAtlas.ts` (cafe), `src/game/render.ts` | `06-cafe-before-after.png`, `0*-cafe-*.png` |
| The café moving: string lights, the clock showing shift time, the cat on the sill, steam, dust in the window light, the record | `src/game/cafeLife.ts` | in game |
| Light by the hour (27 Nov): no window shaft. The window gives a gentle glow, and the pendants and reading lamp give warm pools. A day of daylight drives the window's sky with a sun rising on the left and setting on the right, then moon and stars. It also drives the room's ambient, the colour and strength of the window light, and how far up the lamps are | `src/game/daylight.ts`, `cafeLife.ts drawWindow`, `render.ts` light map, `cafe_candy.py` (`candy-window.png`, `candy-lamps.png`) | `07-cafe-times-of-day.png`, `07b-window-through-the-day.png`, `08-cafe-*.png` |
| Intro tableaux, badge and plates re-baked with the new cast; the intro café is the painted room | `tools/artkit/scenes.py`, `intro_mock.py`, `plates.py` | `reference/intro`, `reference/plates` |

## Checks

- `cafe.mjs`, played with real keys from the day-1 spawn at 1280×720 and 390×844, 9/9 per size (`cafe.txt`):
  - sit in the teal armchair and stand up again;
  - walk up past the counter to the window;
  - talk to Mabel;
  - sunrise, midday, sunset and night through the labelled `setSky` preview, each different, with the shift's clock untouched;
  - no page errors.
- `scripts/cafe-life.test.mjs` (new), 5 tests:
  - the clock reads the shift's time;
  - the bulbs hang on the painted wire;
  - steam rises from the cups and dust stays in the window light;
  - every live pixel lands on whole pixels inside the room, and holds one frame with motion reduced;
  - with the new solid furniture, every interact and both doors are still reachable from the spawn.
- `cafe-life.test.mjs` also checks the daylight:
  - gentle by day;
  - warm and stronger at sunrise and sunset;
  - a cool moon and lamps up at night;
  - five-minute steps that wrap round the day;
  - the sun inside the shift at both ends;
  - the preview seam.
- Full unit suite: 428/428.
- `art:check`: 90 PNGs, including the nine walk sheets, the café atlas, light and shade, the re-baked intro and the plates.
- Earlier audits still pass: floor 16/16, toys 11/11.
