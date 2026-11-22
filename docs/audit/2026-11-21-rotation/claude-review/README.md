# Claude's playthrough of the rotation (21 November 2026, a18a305)

The built game was served locally. Labelled setup: `bootPlay`, `beginEnding`, then real walking on the lot and the `close-shift` button, to reach the week's ending. Everything after that was real clicks and keys: Rotate to nights, Report for nights, Take the watch, night 1, the turnover, Sleep, then a tab reload and the menu's Continue.

- `night1-flash-only.log`: reacts only to flashing cameras and red tiles. Grade C (76). Caught 2 late, and the tool bag became a finding: "It was on CAM06 from 01:10. You looked at CAM06 0 times after that."
- `night1-sweeper.log`: Claude's crude sweeper. It caught the tool bag early, then re-reported changed cameras (the crew removing the bag, oddities on aux) and was relieved at 02:19 after 3 false reports. The sheet still said Grade C, and the night counted as done (R3, R8).
- `turnover-1280-*.jpg` and `turnover-sheet-element-20px.jpg`: at 1280×720 the turnover sheet is about 20 px tall (R2). The header reads NIGHT 2 during night 1's turnover (R4).
- **Save:** both runs had `hasSave() === false` after the night, and after a reload Continue was disabled (R1).
- `rot.mjs`: the script. It expects the build served at `http://127.0.0.1:8092/`; change the port to yours.
