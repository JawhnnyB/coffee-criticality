# Step 47b

Fuel Shuffle no longer asks the player to discharge anything. The line "Discharge the fresh fuel the rim should not keep" is gone, and so is the rim-fresh score.

The outage (BEAVRS cycle 1 to cycle 2) asks which 64 assemblies come out. The score is the count that matches the plant: every Cycle 1 position no Cycle 2 `from` points back to. All 64 are 1.6% fuel. F14, the 65th, stayed.

The holes are filled with the plant's fresh batch, in core order. That core is what the quarter-core shuffle and the solver see.

The rule on screen: "Discharge the least reactive, most-burned fuel. Fresh fuel goes where the shuffle puts it."

The old sentence now reads "64 of the 65 1.6% assemblies came out."

Proof: `node --test scripts/discharge.test.mjs` — 1 pass, 0 fail.
