# Status for C

Author: G. This is not a review and not an approval.

`reviews/PR-26.md` keeps `verdict: request-changes` and `reviewed_sha: 00cbac6`. C has not reviewed this head. Only C should replace that file. Do not treat this note as the review record.

## Where to read the work

| | |
|---|---|
| Repo | [JawhnnyB/coffee-criticality](https://github.com/JawhnnyB/coffee-criticality) |
| Branch | `g/dream-1113` |
| Pull request | https://github.com/JawhnnyB/coffee-criticality/pull/26 |
| State | Draft. Open. Not ready to merge. |
| Base | `origin/c/walk-unblock` (`0d8e735`) |
| Keyboard commit | `f990beb` |
| This note | The commit that adds this file. Review the branch head, not `f990beb` alone, if they differ. |

The claims table is [2026-11-14-dream-pass-5.md](2026-11-14-dream-pass-5.md). Re-run it with:

```
node scripts/claims-check.mjs docs/audit/2026-11-14-dream-pass-5.md
```

Last run of that command on this branch: `docs/audit/2026-11-14-evidence/claims-check-m1-keys.txt` (`CHECK_EXIT:0`, 14 rows, 10 PASS, 4 UNVERIFIED).

## Commits after `300e4d0`

| SHA | What it is |
|---|---|
| `32240fb` | B1. Phone title plate stays on the 390 frame. |
| `e063e73` | B2. Builder legend stays inside the panel. |
| `fbdcf2a` | B3. Overflow audit names every screen. Scroll is not a cut. |
| `7bc1991` | B5. Claims checker matches whole tokens. |
| `49f8720` | B6. The nine failing test names match the baseline. |
| `2421709` | B4. Frozen-value claim split. Dream pass 5. |
| `f990beb` | M1 keyboard gate. Game keys follow the focused window. |

## What is claimed, and what would make it false

- **B1.** Phone title, top 45 percent, 16510 of 16510 sampled pixels are not ink. Image box 1536 by 864. `docs/audit/2026-11-14-visual/title-390x844.png`. False if that top band is the ink colour.
- **B2.** "Why this drawing" is inside the Reactor Design panel at 1280 and at 390. Stills `builder-1280x720.png` and `builder-390x844.png`. False if the sentence is cut by the panel edge.
- **B3.** The overflow audit names the design screen. At 1280 by 720 it logged clips 0, scrolls 1, violations 0. The run exits 1. False if the design line is missing. Not a claim of zero violations. Settings at 390 logged shortButtons 32.
- **B4 values.** `sim.ts`, `shuffleModel.ts`, `schematicMath.ts`, and `save.ts` are quiet against the base (`other_frozen_exit:0`). `DelayGame.tsx` differs by the key gate only (6 insertions, 4 deletions). The lines are still `const LAMBDA = 0.005` and `const N_MAX = 40` on this head and on the base. False if either line changed. `docs/REVIEW.md` names LAMBDA and states no number. That row stays UNVERIFIED (D1). Do not treat 0.055 as the frozen value.
- **B5.** The checker rejects 999, and it rejects 9 inside 194. `docs/audit/2026-11-14-evidence/claims-negative/checker-out.txt`.
- **B6.** At `300e4d0` the suite was 204 tests, 195 pass, 9 fail, same nine names. After the keyboard gate the suite is 210 tests, 201 pass, 9 fail. The nine names still match `docs/audit/2026-11-14-evidence/fail-baseline.txt`. `same-names: true` in `m1-keys-compare.txt`. The failures are `scripts/cabinet-rewards.test.mjs`, `scripts/desk-verdict.test.mjs`, and the seven platform-chrome cases. They were not weakened.
- **Typecheck.** `tsc-m1-keys.txt` is `TSC_EXIT:0` on the keyboard change. The older `tsc-b.txt` is also 0. It is from before `f990beb`.
- **Production build.** `build-b.txt` is `BUILD_EXIT:0`. That build is from before the keyboard commit. There is no new production build of `f990beb` in the evidence. Do not treat the build row as a build of this head.
- **M1 keyboard.** `scripts/key-gate.test.mjs`. With the owner set to a static desktop app, KeyD leaves x at 40 for the world and for a cabinet. With a mini game focused, the cabinet goes to x 41 and the world stays at 40. `KEY_GATE_EXIT:0`. False if a static focus lets KeyD change x, or if the world moves while a cabinet window is focused.

## What the keyboard change actually does

`src/game/keyGate.ts` holds one owner. `Desktop.tsx` sets it every render from the focused window. Each listed listener returns before it moves anything unless `hostOwnsKey` says the key is theirs. Polled cabinets use `readHeld`, so a key already in the set does not keep moving the game after focus leaves.

Listeners that ask the gate: `Arcade.tsx`, `DelayGame.tsx`, `GameApp.tsx` (the world key set), `Horde.tsx`, `IntroScreens.tsx`, `LoadGame.tsx`, `MaintGame.tsx`, `MoreGames.tsx` (golf, pebble, bowl, and the rod-bank helper), `PhysicsGame.tsx`, `PixelMenu.tsx`, `ParlorApps.tsx` (boot skip).

Two listeners do not ask the gate:

- `GameApp.tsx` menu backdrop, the `once` keydown that starts a muted title video. It does not read position.
- `src/game/audio.ts`, the capture-phase gesture that resumes the audio context. It does not read position.

The desktop capture router in `Desktop.tsx` is still there. The new checks are in the listener bodies, which is what the earlier pass had not confirmed.

A cabinet opened in the plant, with the desk closed, still hears keys. The owner stays `world` in that case. Mouse and touch on a canvas are not gated. This was not walked in a browser. The test is the node suite, not a playthrough.

## Not claimed

- Hide, the paper log, a catch, LOAD.CAB, the dusk lot, and pictures of steam. The last walk did not reach them. No new walk was run for this head. B7 stays UNVERIFIED.
- Ducking the procedural bed under the Music player. Not started.
- Season audio files. `public/music/` is still the manifest only. Not started.
- Pre-design desktop gating, settings volumes, icon reorder, accent limited to copper, leaf, and gold. Not started.
- Save v1 fixture, `finish*` tests, walkthrough steps. Not started.
- News script, local headline pool, academy page counts, radiation summaries, impact audit. Not started.
- Phone buttons under 44px. The overflow run still logs them. Not fixed.
- Ending formula, culture, trust, residue, and `incidentResolved`. Not changed. The ending in `sim.ts` was not edited. The spec's held formula and the code were not re-compared in this pass.
- This draft was not marked ready, and it was not merged.

## What a review can do

1. Check out `g/dream-1113` at the head that contains this file.
2. Read `src/game/keyGate.ts` and `scripts/key-gate.test.mjs`.
3. Run `node --test scripts/key-gate.test.mjs` and `npx tsc --noEmit --pretty false`.
4. Run `node scripts/claims-check.mjs docs/audit/2026-11-14-dream-pass-5.md`.
5. Diff `DelayGame.tsx` against `origin/c/walk-unblock` and confirm the only change is the key gate, and that `LAMBDA` and `N_MAX` are the same lines.
6. Write `reviews/PR-26.md` only if you are C, and set `reviewed_sha` to the head you actually read.

G will not set `verdict: approve`.
