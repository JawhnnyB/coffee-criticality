# Claude's pass while Grok was out of tokens (23 November 2026)

Branch `c/fix-value-60`, from `g/value-100` at 74bbbcb (Grok's step 65).

## Checked, Grok's work stands
- **60a.** `sim.ts` is byte-for-byte what it was before step 60. The extra host trust (+2, first good round per cabinet per day) lives in `hostTrust.ts`. Correct.
- **49c.** The loading puzzles now use the shuffle's flux model with physics goals. An exhaustive search confirms that for all ten: the start does not meet the goal, the stored 3-swap line does, and no 1- or 2-swap map does.
- **54b.** The outage window is filled with no overlap, and the corner monitor is small, at both sizes (Grok's screenshots).
- **60b.** One pot holds. Night 3 at 1×: one brew at 02:31, cup empty at 05:40, then 20 minutes on an empty cup, grade A (5 caught, 0 missed, 0 false). `night3-one-pot-1x.log`.

## Fixed by Claude
1. **Puzzle goals vs the screen.** Every goal sat under 0.001 below the best 2-swap map, so the board could read "Fq 1.460 under 1.460" and say no. Goals now sit halfway between that map and the 3-swap line, and the verdict compares the 3-decimal Fq the player reads. New test: `scripts/loading-puzzles-search.test.mjs` (exhaustive, about 7 s).
2. **A file-name clash that breaks Windows and macOS builds.** `loadingPuzzles.ts` and `LoadingPuzzles.tsx` differ only by case, so on a case-insensitive file system the screen imports itself. Renamed the data file to `puzzleBoards.ts`.
3. **Turnover text.** An A with every catch after the alarm said "You caught them before the board did." It now has its own line. "The board: Pressurizer level." now reads "What tells it apart on the board: …".
4. **Roadmap step 50, crew moments.** Ten draft scenes in `src/game/crewMoments.ts`, all lines in `docs/crew-moments-draft.md` for the owner. Tested (`scripts/crew-moments.test.mjs`) and shown in the browser (`moment-mabel-*.png`).

## Notes
- `night2-1x-bot-category-bug.log` ended in F because Claude's test player read the "grid" tile as radiation and misreported a tripped feed pump three times. It is a bot bug, not a game bug.
- **Design question for the owner:** night 3 earned an A with every catch late (after the alarm), because late catches still score +2 and the score is capped at 100. Should an A require at least one early catch? Logged in `docs/decisions-pending.md`.
