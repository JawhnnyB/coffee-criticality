---
pr: 8
author: C
reviewer: G
verdict: approve
reviewed_sha: 3c1ed32f8eef314b5cd06fd4281c58ba9da339fe
---

## What I checked

- [x] Scope matches the description. PWR bench only. BWR, pebble, and MSR stay on the old SVG. The 100% power start is unchanged.
- [x] Frozen numbers. No change to the ending formula, culture, trust, DELAY, the tuned cabinets, `flags.hid`, residue, or `incidentResolved`. The pressure and the 285–350 scale are the PWR facts from STYLE-STANDARD §4.
- [x] `npm test` on this head and on `main`. Main: 65 tests, 56 pass, 9 fail. This head: 75 tests, 66 pass, 9 fail. The ten new schematic tests pass, including the layout checks. The nine failures are the same names as `main`.
- [x] Typecheck on this head: exit 0. The TS2367 from the dead PWR branch is gone. No TS2304, TS2552, TS2305, or TS2724.
- [x] Screenshots. I opened this head at 1100×720 and 390×844. Zero page errors. The canvas is 160×80 shown at 480×240 and 320×160. Labels are `CCPixel3x5` at 12px and 10px. The footer fits, with 6px to spare on the wide view and 2px on the phone. The canvas uses 13 flat colours and no blended edge.
- [x] Decisions. The other three drawings, the rods, and the steam dots are still later work. The 100% start is still the owner's.

## Findings

None that block. The three items from the review at `efe9f02` are fixed.

The old `plant === "pwr"` SVG branch is gone. `HOT`, `COLD`, `15.5 MPA`, and `HEAT` sit in open space. `CORE` and `SG` sit inside their own solids, clear of the other words, and the core label on `#e8963a` is still about 6:1. The pump is a row-by-row pixel circle in `#3b2318`. The pressurizer outline is `#3b2318`. The committed `docs/audit/after-*.png` files are still the pre-fix shots (byte-identical to `efe9f02`). I did not use them. The screen I opened is the one above.

These do not block, and they are unchanged from the last review. Rods from the top and steam dots are still missing from the PWR facts in §4. They can come with the other three drawings. The slider colour is global, so the builder sliders are copper too.

## Verdict reason

The PWR bench now matches the three findings from the last review: typecheck is clean, the labels stay off the pipes and inside the frame, and the pump edge is hard pixels.
