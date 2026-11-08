---
pr: 6
author: C
reviewer: G
verdict: request-changes
reviewed_sha: 1981889f229657f69d9ba50179b34d140341f0ac
---

## What I checked

- [x] Scope matches the PR description. Four files, docs and templates only. No game code.
- [x] Frozen numbers unchanged. The diff names the frozen list and does not change a value. `docs/GROK_HANDOFF.md` is not on this branch, so the check used the list in the PR template and the values already on `main`.
- [x] `npm test` failures match main. Both: 65 tests, 56 pass, 9 fail. Same nine: `cabinet-rewards.test.mjs`, `desk-verdict.test.mjs`, and the seven platform-chrome cases (project id, grok:app_id, x:creator, twitter:card, title).
- [x] Typecheck: `npm run typecheck` on this head exits 0. No new TS2304, TS2552, TS2305, or TS2724. No TypeScript files changed.
- [x] Screenshots. This PR changes no screen. The audit names `review-bench-wide.png` and `review-bench-phone.png`, and neither file is in the commit. I opened the bench on this same game (`main` at `4ae6277`) at 1100×720 and 390×844. Zero page errors. Findings 1, 3, and 4 match that screen. Findings 2, 5, and 6 do not.
- [x] Decisions recorded. Branch protection is left to the owner, with A recommended. I confirmed GitHub reports `main` unprotected (checked 2026-11-07). Finding 7 is left to the owner.

## Findings

1. **Blocks.** [docs/bench-style-audit.md](docs/bench-style-audit.md) lines 7–8. Finding 2 says the bench text is not the pixel font. It is. `ART.hud` and `ART.menu` are both true ([src/game/artFlags.ts](src/game/artFlags.ts) lines 3–4), so the tree has `art-on`. That class sets the labels, the title, the buttons, and the inherited SVG text to `CCPixel3x5` / `CCPixel5x7`, with font smoothing off ([src/styles.css](src/styles.css) lines 204–213 and 244–256). Measured on the live bench: "Rods withdrawn" and "Primary flow" are `CCPixel3x5` at 12px, on both viewports. The schematic words are the same font. What is actually wrong is smaller: SVG `fontSize` is 9–11 user units and the drawing is fractionally scaled, so those words render about 8–11px tall at 1100px and about 4–6px tall at 390px. The title also stays at 12px because `font-mono` and `text-xl` fight under `.art-on`. Rewrite finding 2 to that. Do not send the next PR off to "switch the bench onto the pixel font." It is already there.

2. **Blocks.** [docs/bench-style-audit.md](docs/bench-style-audit.md) line 15. Finding 5 says phone labels are about 9px and that §5.2 tests that. Section 5 item 2 is "No text overlaps art or other text at 1×, 2× and 3×." It does not set a minimum size. The HTML labels are 12px at 390×844. The type that is actually too small is the scaled SVG text in finding 1 above. Cite §2 item 4 and §5 item 1 for the fractional scale, not §5.2.

3. **Blocks.** [docs/bench-style-audit.md](docs/bench-style-audit.md) line 16. Finding 6 says the Compare card's bottom row is cut off at 1100×720, and cites §5.2 for clipping. At 1100×720 with Compare open, all four plants, the hold bar, and both sliders are on screen. The named screenshots are not in the commit, so the claim cannot be checked from the PR. Drop this item, or attach the shot that shows the clip and name the rule it actually breaks. §5 item 2 is overlap, not clipping.

4. **Blocks.** [docs/REVIEW.md](docs/REVIEW.md) line 14 and [.github/pull_request_template.md](.github/pull_request_template.md) line 7. Both send the reviewer to `docs/GROK_HANDOFF.md` (sections 4 and 5). That file is not on this branch and not on `main`. It is still on unmerged PR #5. The frozen-number check this PR installs cannot be done from the tree it creates. Point the check at a list that is in this branch, or say plainly that it starts only once the handoff doc is on `main`.

These do not block. Finding 1 (default blue sliders, `accent-color: auto` on both range inputs) matches [src/game/ReactorTrainer.tsx](src/game/ReactorTrainer.tsx) lines 200–221. Finding 3 (ellipse core, rounded tanks, anti-aliased pipes) matches the `<svg>` at line 284. Finding 4 matches that drawing: no seven-band scale, no flow arrows, no pressure label, no footer. The hot and cold numbers are in the stat row under the drawing, not on the pipes. Finding 7 is right: the bench seeds at 100% power and sits in the band. That stays an owner decision. `.github/CODEOWNERS` names `@JawhnnyB`, which is the owner. No real place name and no unsourced radiation number in the new text.

## Verdict reason

The review path is the right shape, and the test list is clean, but the audit that this PR asks the next PR to follow is wrong on three items, and its frozen-number check points at a file this branch does not contain.
