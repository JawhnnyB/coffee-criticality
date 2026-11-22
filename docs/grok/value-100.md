# Coffee & Criticality: 100 steps to raise the game's value (all doable by AI)

Written by Claude, 22 November 2026, for Grok Build and Claude.

**Rules for every step:**
- One step is one commit.
- Real-input proof in `docs/audit/`.
- Frozen files stay frozen unless the owner unfreezes them.
- Nothing merges to `main` without review.
- Steps that need the owner (money, accounts, signatures, legal calls, personal photos) are left out on purpose. They are listed at the end.

---

## Phase 1: make it shippable (steps 1–20)

1. Finish `docs/grok/rotation-fixes.md` R1–R14 (saves, turnover sheet, relieved nights, bot table).
2. Write one save/load test per mode (play, desktop, rotation, outage) that does a real tab reload and Continue.
3. Add a save version note in the menu ("Saved 06:14, Night 2") so players trust that saving works.
4. Make the 9 baseline test failures pass or delete the dead tests, with a note on each.
5. Get `npm run build`, typecheck and the production preview all working from one command, `npm run ship-check`.
6. Fix `vite preview` (or replace it with the Nitro server in `package.json`), so "built game" means one thing.
7. Add a crash catcher: any uncaught error shows a calm in-game "the plant phone rang" card with a Copy report button, not a blank screen.
8. Run a full 5-day week plus 4 nights at 1280×720 and 390×844, with real input and a fast clock. Log every bug found.
9. Fix every bug from step 8. Re-run step 8 until it is clean.
10. Profile a full day shift. Keep main-thread busy time under 40% on a 4× slower CPU.
11. Hold memory flat across a full week: no growth over 50 MB.
12. Clean the console: zero warnings and errors in production.
13. Cut first load: lazy-load Night Watch plates, the outage data and minigames. Target under 3 MB before the menu shows.
14. Settings menu: volume sliders (master, music, sound, ambience), text size, reduced motion, screen shake off.
15. Full keyboard, mouse and gamepad support on every screen. Show the controls on a help card.
16. Rebindable keys, saved in settings.
17. Pause works everywhere, including the night shift and minigames.
18. Accessibility pass:
    - colour-blind-safe alarms (shape plus colour);
    - screen-reader labels on menus;
    - focus outlines.
19. Text pass: every player-visible line in one file, spell-checked, with no line over 2 phone lines.
20. A "known issues" file kept up to date, and a version number on the menu.

## Phase 2: Steam-ready build (steps 21–35)

21. Wrap the game as a desktop app with Tauri (small install). Windows build first.
22. Linux build, then confirm it runs on Steam Deck resolution (1280×800) with gamepad only.
23. macOS build (unsigned test build; signing needs the owner).
24. Window options: fullscreen, windowed, borderless, and a remembered size.
25. Store saves in the OS save folder, not browser storage, with an automatic backup of the last 3 saves.
26. Add the Steamworks SDK through a Tauri plugin, behind a flag, so the web build still runs without Steam.
27. Steam Cloud saves wired to the same save files.
28. Design 25 achievements (week endings, grades, first early catch, all four nights at A, outage peak under 1.45, and so on).
29. Hook up the achievement triggers and test each one with a labelled hook.
30. Steam Rich Presence: "Day 3, turbine deck" or "Night 2, 03:14".
31. Steam Deck pass: text readable at 7 inches, no hover-only UI, the on-screen keyboard never needed.
32. Controller glyphs that switch between keyboard, Xbox and PlayStation icons.
33. A first-launch screen: language, text size, photosensitivity notice for the camera flashes.
34. Credits screen listing the people, tools and data sources (BEAVRS, OpenMC, fonts).
35. A license and third-party notices file built from `package.json`.

## Phase 3: make it better to play (steps 36–60)

36. Tutorial pass for day 1: every new control taught by doing, never by a wall of text.
37. Tutorial pass for night 1, built on Jordan's nudge: one silent event, one oddity, one flashing camera.
38. A difficulty setting for nights: Relaxed (slower escalation, more coffee), Standard, Nuke (faster, fewer brews).
39. Tune the four nights from the bot table so a careful first-time player gets a B on night 1 and a C on night 4.
40. Add 6 new night events per site, using existing kinds, so replays differ.
41. Add 8 new oddities that are faint and eerie, inside the 0.12–2% visibility band.
42. Seeded nights: show the seed on the turnover so streamers can share a night.
43. A "Night Shift Endless" mode after the rotation: nights get harder until you are relieved. Add a high score.
44. Daily seed: one night everyone plays the same day. Score on a local leaderboard now; Steam leaderboard later.
45. Make day choices hit harder on nights: one more consequence for each residue key.
46. Make night results feed the next week: an A rotation unlocks a new crew scene on days.
47. Expand the outage: a player-chosen discharge, scored against the plant's real pattern.
48. Outage tutorial with the BEAVRS cycle 1 pattern as a worked example.
49. An outage challenge list: 10 loading puzzles with target peaks, graded.
50. Crew scenes: 10 more short scenes. Claude drafts, the owner approves.
51. An end-of-rotation newspaper: the plant's week in headlines, built from your choices.
52. A photo mode for the camera feeds, with the camera pass optional. Streamers will use it.
53. A replay of your night's camera log at 10× speed on the turnover sheet.
54. A Plant Monitor that also runs in a small corner window during day shifts.
55. Ambient sound pass for days: an office hum, the coffee machine, distant PA announcements.
56. A music pass: 3 calm tracks made in code (WebAudio sequencer), no generated audio files.
57. Juice: small screen effects on catches, brews and grades, all respecting reduced motion.
58. Make every minigame cabinet reach level 3 on screen, with proof shots.
59. A settings option to turn the realistic camera feeds into the pixel style, for players who prefer one look.
60. Balance pass on coffee, trust and culture numbers from a 20-run bot sweep, with a short report.

## Phase 4: content quality and honesty (steps 61–72)

61. A fact-check pass on every reactor line, comparing it with public NRC and DOE sources. List the sources in `docs/facts.md`.
62. A "How real is this?" in-game codex: 30 short entries (Cherenkov light, freeze valves, BEAVRS, rounds, turnover).
63. Unlock codex entries by playing (catch the steam leak → the relief-valve entry).
64. An optional "Watchstander notes" commentary track: short developer notes on real practice. Claude drafts, the owner approves.
65. Remove or rework anything that reads as real-world procedure advice. The game says "teaching model only".
66. A full AI-content inventory, `docs/ai-content.md`: every generated image and sprite, and every AI-drafted line, with the tool and date. This feeds the Steam disclosure.
67. Optional: replace the generated camera plates with the code-drawn feeds or the owner's own photos, behind a flag, so the AI label can go away later (see the note at the end).
68. Draft the Steam AI disclosure text from step 66 for the owner to approve.
69. A content rating questionnaire draft (IARC answers) for the owner to approve.
70. A privacy note: the game collects nothing. Say so in the credits and store page.
71. Localization groundwork: move every string into one table. No hard-coded text.
72. Translations into Spanish, German, Japanese and Simplified Chinese, marked "machine-assisted, review welcome". These count as AI content for the disclosure.

## Phase 5: store page and marketing assets (steps 73–90)

73. Steam store capsule images in every required size, made from in-game art (not generated).
74. 10 screenshots: 4 of Night Watch, 3 of day shifts, 2 of the outage, 1 of the turnover sheet.
75. A 60-second trailer cut from real gameplay captures: the camera hook in the first 5 seconds.
76. A 15-second vertical clip for short-video sites.
77. Six animated GIFs for social posts.
78. Store page text: a one-line hook, short description, long description and feature bullets. Several versions for the owner to pick from.
79. A press kit page (`presskit/`): facts, screenshots, trailer, logo, the developer angle (the owner approves the bio).
80. A one-page site for the game with an email sign-up form for the owner to connect.
81. A free demo build: day 1 plus night 1, with an end card asking for a wishlist.
82. Demo analytics without tracking: an optional local "what did you think" form that copies text to the clipboard for the player to send.
83. A streamer kit: no copyrighted music, a "streamer mode" that hides any personal text, seeded nights to share.
84. Make the demo stream-friendly: the first scare-free "something is wrong" moment within 3 minutes.
85. A devlog series draft: 6 posts (the camera realism, BEAVRS data, the rotation, Night Watch design, the outage, the crew).
86. A list of 50 YouTubers and streamers who play spot-the-difference camera and horror-lite games, with contact pages, for the owner to send to.
87. Email drafts for those creators. The owner sends them.
88. Reddit and forum post drafts for game-dev and nuclear communities, each following that community's rules.
89. A Next Fest plan with dates, demo version, a livestream script and a checklist.
90. A wishlist tracker template (Sheets) for the owner to fill in weekly.

## Phase 6: quality gates before launch (steps 91–100)

91. A 30-run automated soak test: full week plus rotation at 8×, no crashes, no save loss.
92. A hardware matrix: run the Windows build on low-end settings (integrated GPU, 8 GB RAM) and report frame times.
93. A playtest build with an in-game "report a problem" note that saves to a local text file.
94. A summary template for playtest results, so the owner can paste in notes and get a ranked fix list.
95. Fix the top 20 issues from playtests.
96. Review-proofing: read the first hour as a stranger and list every confusing moment, then fix them.
97. Refund-proofing: make the first 2 hours strong, since Steam refunds come before 2 hours played. Check pacing with a timed run.
98. A launch-day build checklist: version, changelog, depots, and a rollback build.
99. A day-one patch plan: a hotfix branch, crash-report intake and a 48-hour fix list.
100. A post-launch roadmap: 3 free updates (new site, endless nights leaderboard, outage puzzles) to keep the page active.

---

## Owner-only (AI cannot do these)

- Paying the Steam fee and setting up the Steamworks account.
- Tax and bank forms; signing the macOS build.
- Choosing the price, approving every line of dialogue and the bio.
- Sending messages to creators.
- Taking personal photos.
- Deciding on the AI disclosure.

## About the Steam AI label

Valve asks about generative AI in **content players consume**: art, sound, story and dialogue text, translations. It does not ask about tools used behind the scenes, such as code assistants.

So the label is needed if **any** of these ship:
- the generated camera plates;
- the rover sprite;
- AI-drafted dialogue or crew scenes;
- machine translations.

Removing only the pictures is not enough if AI-drafted text stays in. To drop the label, every player-facing piece must be human-made or rewritten by the owner in his own words.
