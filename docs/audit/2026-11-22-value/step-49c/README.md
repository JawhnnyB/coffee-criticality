# Step 49c

The ten puzzles use the shuffle's 36-cell flux model (`fluxOf`, enrichment 4.5%). The goal is Fq under a number and rim share under 50%. The board is that core. It does not show a swap line.

Search of every map one or two swaps away, for all ten starts: none of them meet the goal. A three-swap line does, and that line's Fq is under the start's Fq. So the best answer is three swaps, inside the 3-to-5 band, and the peak is lower.

A four-swap or five-swap goal was not claimed. The three-swap ball is 6.2 million maps and took about a minute to walk once. Certifying "nothing in three swaps meets this" for ten starts would be a guess if it were cut short. Three is the depth that can be proved.

Proof: `node --test scripts/loading-puzzles.test.mjs` — 1 pass. The search in the test is its own, not a copy of a stored flag.
