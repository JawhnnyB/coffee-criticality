# Step 2: reload, then Continue

Script: `scripts/save-reload.mjs` against the dev server. Each mode is a fresh tab. The setup uses the test hooks. The reload and the Continue click are real. Page errors were 0.

| Mode | What came back |
| --- | --- |
| Play | Control room, day 1, about 13:17, still in play. |
| Desktop | The 24-hour clock stayed on. Continue returns to the world, because a desktop is stored as play. Opening the desktop again showed 16:30. |
| Rotation | Night 2 opener. Night 1 was already done. |
| Outage | Day 4. The two moved assemblies (12.4 and 17.5) were still swapped. |

Shots: `play-before.png`, `play-after.png`, `desktop-before.png`, `desktop-after.png`, `rotation-before.png`, `rotation-after.png`, `outage-before.png`, `outage-after.png`. The machine log is `result.json`.
