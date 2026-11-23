# Step 25

The browser still stores the week in localStorage. `save.ts` was not edited. The desktop shell copies the same names into the OS app-data folder before the game looks for a week, then mirrors later writes.

Live file: `cc.save.v2`. The three older copies, newest first: `cc.save.v2.1`, `cc.save.v2.2`, `cc.save.v2.3`. A write that matches the live text does not rotate. Version 1 and a corrupt version 2 are copied too, and are not rotated.

The proof is two processes and a folder, not a launched window. The first process writes week-a, week-b, week-c, week-d, then week-d again. The second process reads live week-d, then week-c, week-b, week-a. `node --test scripts/desk-save.test.mjs` passed.

The desktop bundle that includes the bridge built here (308 modules). The Tauri process was not started. This sandbox has no WebKit, and `cargo check` still cannot see glib. A restart of the real window is the GitHub Actions artifact, once that run is green.
