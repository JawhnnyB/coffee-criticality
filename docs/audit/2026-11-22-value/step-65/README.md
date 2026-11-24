# Step 65

Player-facing lines that read as a real procedure were reworded. Event ids, weights, and which answer holds did not change. `scripts/site-events.test.mjs`, `scripts/desk-verdict.test.mjs`, and `scripts/codex.test.mjs` passed (14 tests).

## What changed

- The days-off card no longer states a 16-hour or 34-hour work rule. It says the three days off are a story beat, and that the game does not say how long a real watch may be.
- The twelve plant-call buttons in `siteEvents.ts` are now "In this model…" sentences. The call card adds "Teaching model only. Not a step for a real plant." The right answer still holds. The wrong answer is still worse. Flow, scram, and tube marks are the same.
- The Academy period step no longer says to stop and not pull rods. It names a short period in the classroom.
- The design-desk verdict no longer says "pull rods" or "do not sign" as an order. The same k bands still say runs away, holds, creeping down, and dies out.

## Left on purpose

- `sim.ts` is frozen. Priya's "Do not sign a shuffle yet" was not edited.
- `content.ts` is near-frozen. "Do not sign a shuffle you cannot walk" is story text and was not edited.
- Night logs still narrate what the shift already did ("block valve shut", "gland tightened"). They are the log, not a button that tells the player to do it. They were not rewritten.
- Developer comments that say "Do not edit by hand" are not shown to the player.

A search of `src/` for the old fatigue sentence, "Shut the spray", "Do not reopen", "Drop recirc", "shutdown cooling path", and "Do not pull more rods" finds none of those phrases. The two "Do not sign a shuffle" lines above are the only hits left.
