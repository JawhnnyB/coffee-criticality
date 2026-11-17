# Dream pass baseline — 2026-11-13

Branch `g/dream-1113` was created from `origin/c/walk-unblock` at `0d8e73530320c2a8853d4c9f88f9f6470dc4ca89`. These commands ran before the splash fix and before the board-text extraction.

## npm ci

Command: `npm ci` in the repo root.

Exit code: 0. Output: `docs/audit/2026-11-13-evidence/npm-ci.txt`. It printed `added 429 packages in 15s`.

## Tests

Command: `node --test 'scripts/**/*.test.mjs'`

Exit code: 1.

```
# tests 197
# pass 188
# fail 9
# skipped 0
```

Failing names, from `docs/audit/2026-11-13-evidence/npm-test-before.txt`:

1. `scripts/cabinet-rewards.test.mjs`
2. `scripts/desk-verdict.test.mjs`
3. `injects project id on the script and meta when provided`
4. `does not duplicate grok:app_id`
5. `injects x:creator tags when both creator values are set`
6. `does not duplicate x:creator tags`
7. `platform chrome injects twitter:card when the document has none`
8. `leaves an existing twitter:card alone`
9. `uses the app name in the injected title tag`

`teaching-lab` (`full-core and depletion change k and the OpenMC letter`) is `ok` (subtest 174). The brief listed it as a tenth known failure when `npx esbuild` has no network. It did not fail here. It was not made to fail.

## Typecheck

Command: `npx tsc --noEmit --pretty false`

Exit code: 0. Stdout was empty. `docs/audit/2026-11-13-evidence/tsc-before.txt` contains only the recorded exit line.

## Walk14, before the splash fix

Command: `node scripts/walk14.mjs docs/audit/2026-11-13-evidence/walk14-before`

This run used the dev server, not the production build. Exit code: 0.

| | pass | pending-owner | fail | page errors per width |
|---|---|---|---|---|
| Dev, before the fix | 11 | 3 (steps 2, 6, 13) | 0 | 0 |

The 0 is not a clean server render. A separate probe of the same dev server recorded this page error, which the walk driver drops because the text contains `window is not defined`:

```
page: Switched to client rendering because the server rendering errored:

window is not defined
```

The production build of the same commit, before the fix, recorded:

```
Minified React error #419; visit https://react.dev/errors/419
```

Saved at `docs/audit/2026-11-13-evidence/pageerror-before.txt`. The dev server log line is `docs/audit/2026-11-13-evidence/ssr-dev-before.txt`. The stack in that log is `GameApp.tsx:1140`.

## UNVERIFIED at baseline

- A production walk14 of the unfixed build was not run. The #419 count of 1 is from one Playwright load of the production server, not from the 14-step table.
