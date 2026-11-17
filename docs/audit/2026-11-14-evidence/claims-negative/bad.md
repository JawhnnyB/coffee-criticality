# Negative fixture. The checker must reject every row.

| Claim | Command | Artifact | Result | Status |
|---|---|---|---|---|
| Wrong number | `node scripts/claims-check.mjs` | `docs/audit/2026-11-14-evidence/claims-negative/sample.txt` | 999 | PASS |
| Short number inside a longer one | `node scripts/claims-check.mjs` | `docs/audit/2026-11-14-evidence/claims-negative/sample.txt` | 9 | PASS |
| Title still | `node scripts/claims-check.mjs` | `docs/audit/2026-11-14-evidence/claims-negative/sample.txt` | the plate is on screen | PASS |
| Steam has no caller | `node scripts/claims-check.mjs` | `docs/audit/2026-11-14-evidence/claims-negative/sample.txt` | steam has no caller | PASS |
| Blank reason | `none` | `none` | short | UNVERIFIED |
| Nonzero exit unexplained | `node --test` | `docs/audit/2026-11-14-evidence/claims-negative/sample.txt` | TEST_EXIT:1 | PASS |
