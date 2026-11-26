# Refuelling for every reactor type: evaluation and proposal

Written by Claude, 25 November 2026, for the owner. **Approved by the owner on 26 November 2026.** Step 1 of "What I'd build" is now built (`src/game/refuel/`): every site has its own Friday desk, and the weeks read for its type. Steps 2–4 are still proposals.

## Where the game is now

All four site types (PWR, BWR, pebble bed, molten salt) use the same refuelling: the 6×6 Friday shuffle in the reactor hall, then the Refuelling Outage on the desk, which is a real PWR (BEAVRS, 193 assemblies, quarter-core symmetry, boron and burnable absorbers). That's right for a PWR and wrong for the other three. A BWR player is shuffling a PWR, and a pebble-bed or molten-salt player is shuffling a reactor that never shuts down to refuel.

The PWR side now holds up: Friday's plan is laid onto the real core with the two rules a full-size core adds (unpoisoned fresh fuel on the flats, the most-burned fuel in the centre), and Priya can work the layout until it holds within 10% of the plant's own pattern in the same simulator.

## What refuelling actually is, by type

| | PWR (now) | BWR | Pebble bed | Molten salt |
|---|---|---|---|---|
| When | Outage every 18–24 months | Outage every 12–24 months | Online, continuously | Online, continuously |
| What moves | Whole assemblies, radially | Bundles radially, **and** control blades all cycle | Pebbles fall through the core, several passes each | Nothing solid. Salt is fed and cleaned |
| Shape is set by | Loading pattern, soluble boron, burnable absorbers | Loading pattern, **axial bundle design**, control blade pattern, recirculation flow | How many passes, discharge burnup | Feed rate, fission-product removal |
| Limit the player fights | FΔH (radial peaking) | MCPR (boiling margin) and LHGR (linear heat rate), in 3D | Peak fuel temperature | Reactivity balance, salt chemistry |

## The BWR: the most interesting one, as you said

A BWR core is a 3D problem in a way a PWR mostly isn't, because the coolant boils on its way up:

- **The bottom is liquid water; the top is mostly steam.** Water slows neutrons and steam doesn't, so the bottom of the core is the better moderator, and power leans toward the bottom. Bottom-entry control blades sit in the lower core for the same reason: their presence there helps balance the reactivity effect of the steam voids higher up, which flattens the axial power.
- **So bundles are built in layers.** A modern 10×10 bundle isn't one design top to bottom. It has natural-uranium blankets at the ends, enrichment and gadolinia that change by height, and **part-length rods** that stop partway up, so the top layer has fewer fuel pins and more room for water and steam. That's your "multiple layers of fuel pins", and it's the core of what makes a BWR bundle design.
- **The core is built in control cells.** Four bundles sit around each cruciform blade. Modern BWRs split the blades into an "A sequence" and a "B sequence" that form a checkerboard across the core. Blades also run deep or shallow, and the pattern is swapped every few weeks during the cycle (a sequence exchange) so no fuel burns unevenly next to a blade for too long. There's no soluble boron, so blades and gadolinia do the work boron does in a PWR.
- **Flow changes power.** Raising recirculation flow sweeps steam out faster, more water moderates, and power rises. No PWR control works that way.

### Three BWR mini-games, smallest first

1. **Bundle bench (the layers).** One 10×10 bundle drawn as three stacked layers: bottom, middle, and top with the part-length rods gone. The player places enrichment and gadolinia pins in each layer, and the game shows the axial power shape against a fixed void profile (about 0% at the bottom, about 70% at the top). Goal: flatten the axial shape and keep margin at the hottest pin. This teaches the axial story on its own, with no core solver.
2. **Control cell loading (the quarter core).** The BWR's version of Friday's shuffle. Lay out a quarter core of control cells. The rules a BWR player learns: fresh bundles stay out of the cells that hold deep blades, and low-reactivity fuel sits next to the blades that move. Scored on MCPR and LHGR, not FΔH.
3. **Rod sequence (the cycle).** Run the cycle in steps. Every few weeks, pick the A or B pattern and how deep the blades go, and watch the bottom-peaked shape burn flatter. This replaces "boron letdown" for BWR players.

### How to simulate it (cheaply)

- **1.5D model.** Keep the existing 2D radial solver (one-group, assembly nodes) and add an axial dimension per channel: 12 axial nodes per bundle. In each channel, march up the core: power heats the water, quality rises, and void fraction comes from a simple slip or homogeneous relation. Each node's k∞ depends on its lattice zone, its burnup, its void now, and its void history. Iterate radial and axial power together, just as `criticalAtPower` iterates feedback now. This is the same family of method as real core simulators, only much coarser.
- **Lattice data.** The current code takes k∞ against burnup per fuel type. A BWR needs k∞ against burnup **and void** (three void levels is enough to interpolate), plus a gadolinia flag and a part-length-rod flag. OpenMC can depletion-run a 10×10 lattice at three void fractions, so the "run OpenMC yourself and load results" path works the same way it does for the PWR.
- **Limits.** Use LHGR (kW/ft at the hottest node) and a teaching MCPR (critical power from a simple correlation over the channel's power and flow), not real vendor correlations.
- **Real data to anchor it.** BEAVRS covers the PWR. On the BWR side, the OECD/NEA Peach Bottom 2 turbine-trip benchmark is a published BWR core description worth checking for a reference loading. Otherwise, the teaching numbers are labelled as typical, like the PWR cycle numbers are now.

## Pebble bed and molten salt

These two don't shuffle, and they shouldn't pretend to.

- **Pebble bed: "the pass count".** Pebbles drop through the core and get measured as they leave; a pebble that's still lively goes back in on top, and a spent one is discharged. The player's choices are how many passes a pebble gets, what burnup sends it out, and the ratio of fresh to returning pebbles. The flux and temperature map is drawn by height, because pebbles burn on the way down. The limit is peak fuel temperature. A day-5 "outage" makes no sense here, so the Friday job becomes the weekly discharge review.
- **Molten salt: "the cleanup loop".** No fuel elements at all. The player balances fresh fuel fed into the salt, the off-gas system pulling xenon and krypton out, and how much salt is sent for cleanup. The lesson is reactivity bookkeeping without moving anything. The weekly job is a salt sample and a feed adjustment.

## What I'd build, in order

1. **Give each site its own Friday.** The PWR keeps the shuffle. The BWR gets the Bundle bench first, because it's self-contained and teaches the axial layers immediately. The pebble bed gets the pass-count desk, and molten salt gets the cleanup loop. All of them are small, can be shown with a 2D drawing, and need no new core solver.
2. **BWR control cell loading** on a quarter core of control cells, using the 1.5D model.
3. **BWR rod sequence** through the cycle, replacing boron letdown for BWR sites.
4. **The BWR outage** on the desk, the equivalent of BEAVRS for a BWR, once there's a reference core to anchor it.

Steps 1 and 2 are each about the size of the Friday plan work. Step 4 depends on finding public BWR core data, which I'd check before promising anything.

Teaching model, not a license, for all of it.
