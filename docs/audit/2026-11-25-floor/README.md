# The floor between them: browser checks, 25 November 2026

`floor.mjs` → `floor.txt`, built with `scripts/harness/`, real clicks. Hooks only for labelled setup (boot into the plant, choices standing in for a week of play, 12 tokens in the jar, BOWL.CAB level 1 cleared, meeting Marcus) and for reading state. 1280×720 and 390×844: 32 of 32 pass.

- Tommy's 2nd talk opens with Tommy and Marcus (guarded floor); the call-out choice is recorded.
- After a week of trust and calling out, Tommy's 3rd talk is Tommy and Mabel on a floor of Respect.
- The crew page shows the floor culture, both numbers, and what Tommy says about Marcus.
- On a floor of Distrust, Jordan and Tommy's bowling sheet turns into "so engineering can see who isn't working".
- The prize shelf in Mabel's arcade: 12 tokens, Jordan's pin on the shelf, the others waiting on their cabinets, Mabel on why Holt gets nothing; buying it; giving it to Jordan the next morning.

Found and fixed on the way: sim's `finishDay` marks `s.ended` at every day's end, and `addScene` read that as the end of the week, so from day 2 on no relationship scene, crew moment, exchange or gift could play in a normal week. Earlier checks set the day with a hook and never ran a day's end. Regression test in `scripts/floor-talk.test.mjs`.

`floor-doc.ts` generates `docs/floor-talk-draft.md`.
