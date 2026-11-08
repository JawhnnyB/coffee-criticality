# Reactor bench: style audit against STYLE-STANDARD

Audited on `origin/main` at `4ae6277`, 1100×720 and 390×844. Screenshots are committed in `docs/audit/`. Measurements were taken in the browser (computed styles and bounding boxes), not estimated from the screenshots.

Corrected after review by G (`reviews/PR-6.md`, request-changes). The first version had three wrong items: the label font, the label size, and a clipped Compare card. Those are now under "Checked and not a finding."

## Breaks the standard

1. **Slider colours are the browser default.** Both range inputs report `accent-color: auto`. Breaks §2.3 (palette only) and §3 (UI kit). Fix: palette track and thumb, using the cream and copper tokens. Source: `src/game/ReactorTrainer.tsx`, the two range inputs.

2. **The schematic's text is too small to read.** The labels inside the reactor drawing are SVG text at 9 user units for `core` and `SG`, and 8 for `pump`. On the rendered page that is 9 px tall at 1100 wide and about 5 px tall at 390 wide. The drawing is also scaled fractionally, which §2.4 and §5.1 forbid. Fix: draw the schematic at native pixel size and integer scale, with its labels in the pixel font at a readable native size. Breaks §2.4 and §5.1. Evidence: `docs/audit/bench-phone-390x844.png`.

3. **The reactor drawing is smooth vector shapes.** An ellipse core, rounded tanks, anti-aliased pipes. Breaks §2.1 (outline on every object), §2.4 (native size, integer scale), and §5.1 (hard pixel edges). Fix: redraw as a native pixel schematic, the way the builder mock is drawn. Source: the `<svg>` in `ReactorTrainer.tsx`.

4. **The schematic lacks the required parts of the drawing convention.** Breaks §4 and §5.5:
   - no seven-band temperature colour bar with a printed scale;
   - no flow arrows on every pipe;
   - no pressure label on the drawing;
   - no "Simplified teaching drawing — not a license." footer.
   The hot and cold temperatures are in the stat row under the drawing, not on the pipes.

## Not a style finding, owner decision

5. **The bench starts at 100% power**, already inside the ΔT band. The old drill started at 62%. This is a gameplay question. The owner decides.

## Checked and not a finding

- **Label font.** The labels are the pixel font, not a smoothed system font. Computed `font-family` is `CCPixel3x5, monospace`, `font-size` 12px, `-webkit-font-smoothing: none`, on both viewports. The earlier claim that the text was smoothed was wrong.
- **Label size.** The HTML labels are 12px at 390×844. The problem is only the SVG text in finding 2.
- **Compare card.** At 1100×720 the overlay scrolls: its content is 987px tall in a 720px viewport. All four plants and both sliders are reachable, and nothing is clipped. Scrolling is a layout choice, not a §5.2 violation (§5.2 is about overlap).
- **Test failures.** The 9-versus-10 difference from G's run is `scripts/teaching-lab.test.mjs`. It calls `npx esbuild`, which cannot reach the network from my sandbox. It is an environment failure, not a regression. It passes where `npx` can reach the registry.

## Evidence

- `docs/audit/bench-wide-1100x720.png`
- `docs/audit/bench-phone-390x844.png`
- `docs/audit/compare-wide-1100x720.png`
- `docs/audit/play-wide-1100x720.png`
