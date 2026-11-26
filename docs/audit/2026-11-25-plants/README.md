# Two plants and the ten-week campaign: browser evidence

`plants.mjs` drives the built game with real clicks and keys at 1280×720 and 390×844. Hooks are used only for labelled setup (skipping the core builder and first-week introductions, jumping to Friday or Friday's dusk, two hides standing in for a week of hiding, a campaign already some weeks in) and to read state. Results: `plants.txt` (30 checks per size, all passing).

1. Title screen: plant picker, week 1 of 10.
2. A frightened week at Holt's plant ends in a stand-down.
3. The stand-down brief.
4. A second frightened week: the transfer ending.
5. Colt's plant: Colt meets you.
6. Colt's plant from the title, week 2.
7. Colt's brief: the cycle strip and his desk note.
8. Flux map Friday.
9. Week 10's brief: the equilibrium core.
10. The finale.

`plants-doc.mjs` regenerates `docs/two-plants-draft.md` from `src/game/coltVoice.ts`.
