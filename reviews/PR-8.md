---
pr: 8
author: C
reviewer: G
verdict: request-changes
reviewed_sha: efe9f020227b86c12934c7e3b4d2e70af3d5de95
---

## What I checked

- [x] Scope matches the description. PWR bench only. BWR, pebble, and MSR stay on the old SVG. The 100% power start is unchanged.
- [x] Frozen numbers. No change to the ending formula, culture, trust, DELAY, the tuned cabinets, `flags.hid`, residue, or `incidentResolved`. `15.5 MPA` and the 285–350 scale are the PWR facts already required by STYLE-STANDARD §4.
- [x] `npm test` on this head and on `main`. Main: 65 tests, 56 pass, 9 fail. This head: 70 tests, 61 pass, 9 fail. The five new schematic tests pass. The nine failures are the same names as `main`.
- [x] Typecheck. A clean tree of `main` exits 0. This head adds one error, TS2367, in a file this PR edits (finding 1). It is not TS2304, TS2552, TS2305, or TS2724.
- [x] Screenshots `docs/audit/after-bench-wide-1100x720.png` (1100×720) and `docs/audit/after-bench-phone-390x844.png` (390×844), checked against STYLE-STANDARD §5. Copper sliders and the integer-scaled canvas are real. The labels and the pump are not (findings 2 and 3).
- [x] Decisions. The other three drawings and the 100% start are left for a later PR and for the owner. That is recorded.

## Findings

1. **Blocks.** [src/game/ReactorTrainer.tsx](src/game/ReactorTrainer.tsx) line 288. After the new `if (plant === "pwr") return`, the old SVG still has `plant === "pwr"`. Typecheck on this head fails there: TS2367, those types do not overlap. A clean `main` typecheck exits 0, so this is a new error. Delete the dead PWR branch of the SVG.

2. **Blocks.** [src/game/schematicMath.ts](src/game/schematicMath.ts) lines 26–38 and [src/game/PixelSchematic.tsx](src/game/PixelSchematic.tsx) lines 123–136. The labels overlap the drawing, and on the phone they overlap each other. STYLE-STANDARD §5 item 2. The test only checks that each anchor sits inside 160×80, not the drawn text. Under `art-on`, `text-[10px]` is forced to 12px with extra letter-spacing, so the words are wider than the grid the test measures. In the wide shot, `HOT 324C` crosses the core and the hot leg, `COLD 292C` sits on the pump, `15.5 MPA` sits on the heat arrow, and `HEAT` sits on the steam generator. In the phone shot, `COLD 292C` collides with the footer, and the footer is cut off (`SIMPLIFIED TEACHING` does not fit; a stray `drawing.` is left beside `NOT A LICENSE.`). Put the words in empty pixels, at a size `art-on` will not restyle, and keep both footer lines inside the frame at 390×844. Contrast of the core label is fine (brown on `#e8963a` is about 6.2:1). The failure is overlap, not contrast.

3. **Blocks.** [src/game/PixelSchematic.tsx](src/game/PixelSchematic.tsx) lines 76–81. The pump is `arc()` filled twice. That edge is anti-aliased, which §5 item 1 forbids. Draw it with 1px rectangles, and outline it in `#3b2318`. The pressurizer outline is gold (`line 85`); the standard's outline is `#3b2318` on every object (§5 item 3).

These do not block. The canvas is 160×80 shown at ×2 and ×3, with `image-rendering: pixelated`. The seven band colours match §4, both legs have a flow arrow, the scale ends are 285 and 350, and the wide shot shows the whole footer. The sliders are `#c4783a`. That rule is global, so the builder sliders change too; that is the same palette rule, not a second feature. Rods from the top and steam dots are still missing from the PWR facts in §4. They were not in findings 1–4, so they can come with the other three drawings. No real place name.

## Verdict reason

The bands, the copper sliders, and the integer canvas scale are right, but the labels collide, the pump edge is soft, and typecheck fails on a line this PR left behind.
