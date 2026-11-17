# Playthrough ledger, 2026-11-14

Mouse and keyboard only, against the production build. No `window.__controlsTest`. Script: `scripts/playthrough.mjs`. Shots: `screenshots/playthrough-2026-11-14/`.

Page errors: 0 on every scene, both widths. Console errors: 0 on every scene, both widths. Nothing was filtered.

The 390×844 rows are from the full two-width run. The 1280×720 rows are from the rerun after the Mabel search was widened. Same build.

| Scene | Width | What the screen showed | Shot | Result |
|---|---|---|---|---|
| Title | 1280 | Begin fully on screen, y=288 h=42 | `01-title-1280x720.png` | pass |
| Title | 390 | Begin fully on screen, y=398 h=14 | `01-title-390x844.png` | pass |
| New shift | 1280 | Continue on screen, y=483. Desktop opened. | `02-setup-1280x720.png` | pass |
| New shift | 390 | Continue on screen, y=529. Desktop opened. | `02-setup-390x844.png` | pass |
| Reactor Design | 1280 | Window bottom 571, taskbar 686. Icons do not overlap. | `03-design-1280x720.png` | pass |
| Reactor Design | 390 | Full-screen builder. No floating window. | `03-design-390x844.png` | pass |
| Reactor Control | 1280 | Slider clicked at 70%. Window bottom 664, taskbar 686. | `04-control-1280x720.png` | pass |
| Reactor Control | 390 | Slider clicked. Phone layout, no taskbar. | `04-control-390x844.png` | pass |
| CORE CAM | both | "Teaching view. Not a measurement." Canvas on screen. | `05-cam-*.png` | pass |
| Results | both | Body ink 12px (CSS 24px on CCPixel3x5, which draws at half the em). | `06-results-*.png` | pass |
| Core Map | both | No horizontal scroll. | `07-coremap-*.png` | pass |
| News | both | "The wire is quiet…" and "The plant paper is blank today." No dev note. | `08-news-*.png` | pass |
| Cafe | both | Day 1, Criticality Cafe, 06:52, on foot after the intro. | `09-cafe-*.png` | pass |
| Mabel | both | Dialogue open. "Cup's poured. Sit." | `10-mabel-*.png` | pass |
| Lot | both | Lot / Campus on foot. Clock is morning, not dusk. | `11-lot-*.png` | pass, dusk unverified |
| Control room | both | Walked cafe → lot → hall → control. Not a warp. | `12-control-room-*.png` | pass |
| Holt | 1280 | Dialogue open. "Skip the hello." | `13-holt-1280x720.png` | pass |
| Holt | 390 | In the control room. Holt's prompt did not come up. | `13-holt-390x844.png` | fail |
| Paper log | 390 | Near-prompt for the board. | `14-paper-390x844.png` | pass |
| Paper log | 1280 | Still in the control room. Board prompt did not come up after Holt. | `14-paper-1280x720.png` | fail |
| Catch | 390 | Report clicked. Back in the control room. | `15-catch-390x844.png` | pass |
| Catch | 1280 | Incident paper did not open. | `15-catch-1280x720.png` | fail |
| LOAD.CAB | both | Walk back left the plant on the lot. Cabinet never opened. | `16-load-*.png` | fail |
| Hide | 1280 | Second run reached the lot again and never opened the incident. | `17-hide-1280x720.png` | fail |

Dusk is unverified because the shift starts at 06:52 and the week-end dusk walk was not played. LOAD.CAB and the hide run are fails, not passes.

Starting a shift from the desktop throws away the desktop design and opens the builder again. That is existing behavior. Noted, not changed.
