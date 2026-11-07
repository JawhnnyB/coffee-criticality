## What changed

<!-- One paragraph. Name the files and the spec section you implemented. -->

## Decisions

<!-- Each choice you made, with its reason. Use the options in docs/GROK_HANDOFF.md section 5 where they apply. -->

## Frozen numbers

- [ ] Ending formula, culture and trust values, DELAY `LAMBDA`/`N_MAX`, tuned mini-game numbers, `flags.hid`, residue rules: unchanged (or the owner approved the change, linked here).

## Tests

- [ ] `npm run typecheck`: no new unresolved names (TS2304, TS2552, TS2305, TS2724). Missing React types in a sandbox are expected.
- [ ] `npm test`: the failure list matches `main`. Paste the list if it differs.

## Visual review (required for any screen change)

- [ ] Screenshots at 1100×720 and 390×844, attached below. Zero page errors.
- [ ] `npm run art:check` passes when `tools/artkit` or `reference/` is touched.
- [ ] Checked against `tools/artkit/STYLE-STANDARD.md` section 5: hard pixel edges, no text overlap, palette colours only, one pixel font, no CRT or blur.
- [ ] Reactor drawings: temperature colour bar, flow arrows on every pipe, pressure and hot/cold labels, and the "Simplified teaching drawing — not a license." footer.

## Base

- [ ] Base branch named above. If stacked, the PR says which one must merge first.

## Do not

- [ ] No push to `main`. No force-push. No history rewrite on a shared branch.
