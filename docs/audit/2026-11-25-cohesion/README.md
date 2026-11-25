# Tying the game together: browser checks, 25 November 2026

Built with `scripts/harness/` and driven with real clicks and keys. Hooks only for labelled setup (boot into the plant, week-one relationships, the ending, marking nights done instead of playing them, skipping the core builder, day 5 at the fuel desk, skipping the outage's Cycle 1 example and discharge pick) and for reading state.

- `flow.mjs` → `flow.txt`: the ending card, Elena's van, the days off, all four night openers, dawn after a reload, the new-week dialog, week two skipping the introductions, the crew carried over, Tommy and Jordan saying welcome back. 1280×720 and 390×844: 38 of 38 pass.
- `plan.mjs` → `plan.txt`: the plant shrinking into its tab and growing back; Friday's shuffle signed with real clicks (the swaps come from `solve.ts`); the outage handed over; Friday's plan laid onto the real core; the cycle run and its verdict. Both sizes: 20 of 20 pass.
- `cohesion-doc.ts` generates `docs/cohesion-draft.md` from the code.

Finding worth a decision: a signed Friday plan, carried faithfully onto the real core, peaks at about 2.2 to 2.4 against the 1.37 limit. The screen says so and why. See the draft, section 3.
