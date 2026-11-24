# Step 49b

The ten loading puzzles are rebuilt. Each target is a permutation that search measures at 3, 4, or 5 swaps. A search capped at 2 swaps does not reach any of them. Par is that minimum. The move limit is two past par.

The old target, the best one-swap peak, is gone.

Proof: `node --test scripts/loading-puzzles.test.mjs` — 1 pass, 0 fail.
