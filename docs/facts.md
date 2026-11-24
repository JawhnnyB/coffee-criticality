# Reactor lines, checked against public NRC and DOE pages

Draft for the owner. Nothing here is an approved line, and nothing here is a procedure. The game is a teaching model. Where a number could not be tied to a public page in this pass, the row says so.

## Sources opened for this pass

- NRC glossary, pressurized-water reactor: water is kept under high pressure so it does not boil, and a steam generator makes the steam. No operating pressure is printed on that page. <https://www.nrc.gov/education-regulatory-research/glossary/pressurized-water-reactor-pwr>
- NRC design handout ML11220A221: an example pressurizer operating pressure of 2250 psia (15.4 MPa), and a typical 4-loop plant at 2250 psia primary and 1000 psia steam. <https://www.nrc.gov/docs/ML1122/ML11220A221.pdf>
- DOE Office of Nuclear Energy, "Cherenkov Radiation, Explained" (July 28, 2023): charged particles faster than light in water give a blue or violet glow. <https://www.energy.gov/ne/articles/cherenkov-radiation-explained>
- DOE Office of Nuclear Energy, "Nuclear Fuel Cycle 101: Wet Storage": a typical spent-fuel pool is at least 40 feet deep, and the fuel sits under a deep cover of water. <https://www.energy.gov/ne/articles/nuclear-fuel-cycle-101-wet-storage>
- MIT CRPG, BEAVRS: a public 4-loop Westinghouse benchmark with two cycles of measured core data. <https://crpg.mit.edu/research/beavrs/> and <https://github.com/mit-crpg/BEAVRS>
- The outage code names NUREG/IA-0529 (specific power 41.7 MW/tHM) and ORNL/NRC ML25106A184 (cycle lengths 327.2 and 272.7 EFPD, FdH 1.435). Those PDFs were not re-opened in this pass. The code's citation is `src/game/outage/beavrs.ts`.
- HTR-PM public design tables (OSTI 2248076 and the open equilibrium-core papers): helium pressure 7.0 MPa, inlet/outlet about 250 °C / 750 °C. This is a Chinese demonstration plant, not an NRC-licensed U.S. design. <https://www.osti.gov/servlets/purl/2248076>
- MSRE freeze valves: ORNL descriptions (ORNL-TM-732 and the freeze-valve development notes) say a plug of frozen salt is held by cooling air and opens when that air stops and the pipe is heated. A development note uses 5 psig of helium to move salt during a drain test. The game's 380 °C plug temperature was not found on those pages.

## What the game says

| Line in the game | Where | Check |
| --- | --- | --- |
| PWR primary about 15.5 MPa, liquid, not boiling | Night board, builder, site text (~16 MPa classroom) | Matches the public 2250 psia band (15.4–15.5 MPa). The NRC glossary states the idea and not the number. |
| Steam generator pressure 6.9 MPa | Night board | 6.9 MPa is about 1000 psi, the typical 4-loop steam pressure in ML11220A221. A band, not one plant's setpoint. |
| BWR pressure 7.0 MPa on the night board, 7.2 MPa in the builder | `nightwatch/model.ts`, `plant.ts` | Both are teaching roundings near 1000 psi. They do not match each other. No NRC BWR pressure table was opened in this pass. |
| Pebble helium 7.0 MPa at night, 6.0 MPa in the builder, outlet near 750 °C | Night board, site text, `plant.ts` | 7.0 MPa and 250/750 °C match published HTR-PM tables. The builder's 6.0 MPa does not. Not an NRC plant. |
| MSR cover gas 5 psig, freeze plug 380 °C | Night board | 5 psig appears in an ORNL drain note. 380 °C was not found. MSRE salt ran much hotter than the plug. |
| Freeze valve: cooling air holds a salt plug; losing the air lets it thaw | Night event, site text | Direction matches ORNL-TM-732. The game's fan, timer, and trip are fiction. |
| Cherenkov light in the pool | Pool camera | Matches the DOE explanation. The picture is a teaching drawing, not a photograph of a pool. |
| Fuel pool level, normal 7.0 m | Night board | Does not match the DOE description of pools at least 40 feet deep. It is a gauge in the game, not a pool depth. |
| BEAVRS cycle 1, 193 assemblies, enrichments 1.6 / 2.4 / 3.1, 327.2 EFPD | Outage | The shape and the enrichments are the public benchmark. The EFPD and FdH figures are the ones the code attributes to ML25106A184. The simulator in the outage is the game's own one-group model, not a license method. |
| Pressurizer level 55%, power band 90–104%, sump, gamma "× normal" | Night board | Board conventions for the game. Not copied from a technical specification. |
| Fq under 1.5 and rim share under 50% | Fuel shuffle | Teaching limits inside this model. Not a plant limit. |
| Rounds, turnover, grades, coffee | Night watch | A real shift has a turnover and people walk the plant. The tablet, the pot, the letter grade, and the false-report count are the game. They are not an NRC procedure. |
| Days off on the night rotation | Night rotation | The card used to state a 16-hour and 34-hour work rule. Step 65 took that sentence off. The card now says the days off are a story beat, not a work-hour rule. |

## Not checked digit by digit

Hot-leg and cold-leg temperatures move with the game's thermal model. They are labeled classroom values in the site text. Dose numbers are not shown, on purpose. Academy lines that say "teaching model — not a license" were left as classroom analogies, not as measured plant data.
