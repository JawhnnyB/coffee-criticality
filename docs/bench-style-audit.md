# Reactor bench: style audit against STYLE-STANDARD

Audited 2026-11-07 on `origin/main` at `4ae6277`, screenshots `review-bench-wide.png` and `review-bench-phone.png`. Each finding names the rule it breaks in `tools/artkit/STYLE-STANDARD.md`. Nothing here is fixed yet. These are the items for the next style PR.

## Breaks the standard

1. **Sliders use the browser's default blue** (rods, flow). Breaks §2.3 (palette only) and §3 (UI kit). Fix: palette track and thumb, with the cream and copper tokens.
2. **Text is not the pixel font.** Labels and readouts are smoothed, anti-aliased small text. Breaks §1 (one 5×7 pixel font) and §2.7. Fix: use the bundled pixel font at integer sizes, with `image-rendering: pixelated` for any drawn text.
3. **The reactor drawing is smooth vector shapes** (an ellipse core, rounded tanks, anti-aliased pipes). Breaks §2.1 (outline on every object), §2.4 (native size, integer scale), and §5.1 (hard pixel edges). Fix: redraw as a native pixel schematic, the way the builder mock is drawn.
4. **The schematic lacks the required parts of the drawing convention.** Breaks §4 and §5.5:
   - no temperature colour bar with the seven fixed bands and a printed scale;
   - no flow arrows on every pipe;
   - no pressure label, and no hot and cold temperature labels;
   - no "Simplified teaching drawing — not a license." footer.
5. **Phone labels are about 9 px.** Too small to read at 1×, which §5.2 tests. Fix: a larger minimum at narrow widths.
6. **The Compare card runs past the bottom of the 1100×720 frame.** The bottom row is cut off. Breaks §5.2 (no overlap or clipping). Fix: its own scroll area, or a shorter layout.

## Not a style issue, but found in the same review

7. **The bench starts at 100% power**, already inside the ΔT band. The old drill started at 62%. This is a gameplay question, not a style one. The owner decides (see the review notes).
