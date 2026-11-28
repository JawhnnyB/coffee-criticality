# The walk in to a night watch, and the mission board, 27 November 2026

The owner asked whether night could show up on a walk to the security room during the night shift, and to clean up or replace the corner mini map with "a mission board of what to do next".

| What | Where | Evidence |
|---|---|---|
| **Corner mission board** in place of the site plan:<br>• the day's goals in order;<br>• the thing to do now marked in amber, done ones ticked green and struck through, optional ones last and quiet;<br>• a count, and the live direction under it as NEXT STEP.<br>Folded on a phone, it shows just what to do now. | `src/game/missionBoard.ts`, `GameApp.tsx` (`MissionBoard`, `MissionBox`, `Hud`) | `01-day-board-*.png` |
| **Walk in through the café**, a new choice on each night's opener ("Straight to the desk" still goes directly):<br>• 18:00, in the dark, from the café across the lot and through the hall to the watch desk in Control, where the watch starts;<br>• the day crew has gone home: Mabel is closing up behind her counter, and Jordan is on the lot starting his rounds;<br>• no interacts on the way in, nothing saved mid-walk; a reload goes back to the opener. | `GameApp.tsx` (`startNightWalk`, `endNightWalk`), `week.ts` (`setNightWalk`, `nightPost`, `nightWalkDirection`), `NightWatch.tsx` (`onWalk`, `rot:atDesk`) | `02-cafe-night-*.png`, `03-lot-night-*.png`, `04-hall-night-*.png`, `05-watch-*.png` |
| **Night in rooms without painted light:** the hour's ambient over everything, and warm pools round their lamps | `render.ts` | `03-lot-night`, `04-hall-night` |

## Checks

- `walk.mjs` was played with real keys at 1280×720 and 390×844 (`walk.txt`; 33 checks pass in total). It covers:
  - the day board;
  - the night opener's two buttons;
  - the café at night with only Mabel;
  - the lot with Jordan;
  - the hall;
  - into Control, where the watch starts;
  - the clock restored afterwards;
  - no page errors.
- `scripts/mission-board.test.mjs` (new, 4 tests) checks:
  - the board's order and states;
  - tonight's two items;
  - the night posts (and that the day's posts come back);
  - the route's doors;
  - that 18:00 is lamps-up and stars-out.
- Full unit suite: 432/432. The café audit still passes, 18/18.
- `scripts/play-pillarD.mjs` (an older playthrough script) now looks for the mission board instead of the site plan.
