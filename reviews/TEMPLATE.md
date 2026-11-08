---
pr: <PR number>
author: <G or C>
reviewer: <G or C, the other one>
verdict: <approve or request-changes>
reviewed_sha: <full or short SHA of the head commit you reviewed>
---

## What I checked

- [ ] Scope matches the PR description.
- [ ] Frozen numbers unchanged (GROK_HANDOFF section 4), or owner approval linked.
- [ ] `npm test` failures match main, except tests this PR adds or fixes.
- [ ] Typecheck: no new TS2304, TS2552, TS2305, TS2724.
- [ ] Screenshots at 1100×720 and 390×844 checked against STYLE-STANDARD section 5.
- [ ] Decisions recorded with reasons.

## Findings

<!-- Numbered. Each finding names a file and line, and whether it blocks. -->

## Verdict reason

<!-- One or two sentences. -->
