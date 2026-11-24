# Step 53c

Crew, the dawn paper, endless, and the daily board live in one key, `cc.profile`. The four old keys move in on the next read and are not written again.

The desktop save bridge copies that key with the week file. It does not rotate it.

Proof: `node --test scripts/profile.test.mjs` — a cleared store that is given the same profile text back still has all four. The mirror list includes `cc.profile`. 2 pass, 0 fail. The four older store tests still pass.
