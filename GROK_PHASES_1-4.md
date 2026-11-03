# Build prompt: Parlor OS, CORE CAM, and the reactor-facing apps (Phases 1–4)

For Grok Build, working in the `coffee-criticality` repo. Paste this whole file as one message, or commit it as `GROK_PHASES_1-4.md` and tell Grok to read it first. It applies alongside `GROK_FEEL.md`, `GROK_WORLD_100.md`, and `GROK_ART_101.md`. Where this prompt and those docs disagree on game content, the game docs win and you note the conflict in the PR.

---

## 0. How to run this

1. Read, in order: `GROK_FEEL.md`, `GROK_WORLD_100.md`, `GROK_ART_101.md`, then this file. Then read every file named in section 3 before you change anything.
2. Build in five milestones (section 15): M1 Shell and setup, M2 Results, Core Map, CORE CAM, M3 Academy, radiation basics, NRC, M4 News and background map, M5 Impact audit. Each milestone is one branch and one pull request. Do not start a milestone until the previous one meets its Definition of Done.
3. Never push to `main`. Never force-push. Never rewrite history.
4. The stop-lines in section 2.3 are not blockers. When you reach one, write it as an "Open question" in the PR, use the default stated in the prompt, and keep going.
5. Do not add new failing tests. The 8 og/platform test failures already on `main` predate this work. Leave them alone.

## 1. The goal in one paragraph

Coffee & Criticality opens into a warm, Windows-style desktop called Parlor OS. Its apps are the reactor control room, the reactor designer, the results and core map, the Academy, radiation basics and a background-radiation map, the NRC regulations index, the news (real nuclear headlines plus fictional local news), a music player, and every mini game as its own app. Choices made at the start (region, season, stance, and the reactor the player designs) change what the player sees in every app and in the world. CORE CAM is a window onto the fuel of the reactor the player designed and runs, and it glows and flows from the same live numbers the control room uses.

The game stays what it is: a five-day week, Report, Peer, and Hide, culture and trust, and the dusk walk. Parlor OS is a new way to reach the reactor, the Academy, and the world around it. It is not a new plot.

## 2. Non-negotiables

### 2.1 Frozen

- The ending formula. Held stays `hides < 3 && reports + catches > hides && culture >= 28`.
- Culture, trust, and the values in `bumpTrust` and `bumpCulture`.
- `DELAY.CAB` `LAMBDA` and `N_MAX`.
- Any number already tuned in LOAD, ROD.BANK, PHYS.CAB, CATCH, or LOTOTO.
- `flags.hid`. It stays as "hid at least once." Do not reuse it for anything else.
- `residue` semantics from `GROK_FEEL.md`. A hide leaves the lie up, and `beginDay` does not clear residue.

Setup choices, news, the desktop, and the apps change content, display, and dialogue. They must not change any frozen number. If a feature seems to need a frozen number changed, stop and write it as an open question.

### 2.2 Tone and look

- Warm industrial, Stardew-like. Not horror, not military. Stardew-like means warm light, care in small details, and people who matter. It does not mean cute for its own sake.
- Palette tokens only: cream `#f3e6d0`, copper `#c4783a`, leaf `#6b8f71`, ink `#16110d`, steel `#3d5c66`, gold `#c9a227`, wood `#6a4a32`. Add shades only as tints of these. Check text contrast at WCAG AA (4.5:1) on every background you use.
- Pixel rules: `imageSmoothingEnabled = false`, integer scaling, person 32×48, TILE 16. No letters on sprites. No emoji in chrome. Teaching k numbers stay in code, not in art.
- The fuel glow and the particles are a teaching metaphor. Label them as such in the app. Never imply the picture is a measurement.

### 2.3 Stop-lines (write an open question, use the default, continue)

- Any change to a frozen number in 2.1.
- Any real-world value (radiation dose, date, regulation, feed) you cannot cite. Default: show "Pending verification," never a guessed number.
- Any real company, utility, newspaper, person, city, or brand in fiction. Default: a fictional name, and the name is listed in the PR for the owner to check against real places.
- Any network call at runtime. Default: none. The only network access is a build-time script for news (section 10).
- Any copyrighted audio, image, or font. Default: original, procedural, or public domain only, listed in a manifest with a license for each file.
- Any AI-generated text shipped in the game. Default: none in phases 1–4. All text is authored or comes from a real feed.
- Anything that looks like Microsoft. Default: no Windows names, logo, Segoe font, sounds, or exact icon set. "Windows-esque" means the layout pattern only: a desktop, a start menu, a taskbar, draggable windows. Use the placeholder name "Parlor OS" from one constant, so the owner can rename it in one place.

## 3. What exists today (read these; do not guess from memory)

| File | What it is now | What this build does with it |
|---|---|---|
| `src/game/sim.ts` | `GameState`, the `Mode` union, `openCab(s, id, from)`, `finishBuilder` (sets `s.plant`, `flags.built`, sends to intro), `finishArcade`, `finishLeisure`, `finishMaint`, `finishTrainer`, `beginDay`, `bumpTrust`, `bumpCulture` | Add state for setup, run, desktop, results, news, and settings. Route mini game apps through the same `finish*` functions. Do not reimplement them. |
| `src/game/GameApp.tsx` | The mode router. It mounts every overlay, owns `stateRef`, `applyMode`, `refresh`, and `window.__controlsTest`. `ReactorTrainer` is mounted with `site={s.plant?.type ?? "pwr"}`, so only the plant type reaches it. | Add the desktop as a mode. Extend `__controlsTest`, and do not replace it. |
| `src/game/ReactorTrainer.tsx` | Keeps rods, flow, power, hold, and scram in local `useState`. Has its own plant-type selector (PWR, BWR, pebble, MSR). It does **not** run the player's designed plant. | This is the central fix (section 5). |
| `src/game/plant.ts` | `PlantDesign` (type, powerMW, dT, flow, enrich, fuelTempK, coolantTempK, fuelDensity, coolantDensity, scale, depletion, fullCore, reflector, burnupMWd_kg, sizeClass, shuffleMap). `DT_AT_UNIT`, `DT_BAND`, `T_COLD_AT_FLOW100`, `DEFAULT_PLANT`, `withTypeDefaults`, `pressureMPa`, `linearHeat`, `courierName`, `plantTitle`. | The shared thermal and design source. Lift the trainer's `scaleDt` and `tColdOf` into here. |
| `src/game/ReactorBuilder.tsx` | The design room that produces `s.plant`. | Stays. The design app wraps it. |
| `src/game/NuclearDesk.tsx`, `nuclearLab.ts` | `computeKeff`, `kAt`, `diffusionCopy`, `verdictWords`, `TERM_LESSONS`, `PART_TERMS`, `PHYSICS_TERMS`, the k ladder, and the OpenMC teaching export | Reused by the design app, the results tab, CORE CAM, and the Academy math pages. |
| `src/game/shuffleModel.ts`, `FuelShuffle.tsx` | `fluxOf`, `passes` (Fq < 1.50 and rim share ≤ 50% after at least 3 swaps). A greedy search from random starts passes about 73% of the time. | Reuse the rule. Do not retune it. |
| `src/game/content.ts` | `ACADEMY` (an array of pages with `title`, `still`, `extra`, `track`, `body`), tracks `culture`, `heat`, `safety`, `physics`, `fuel`. `RoleId` is `transferred`, `promoted`, `military`, `veteran`. | Re-tag pages into tiers. Add the new pages. Do not duplicate existing pages. |
| `src/game/week.ts` | `WEEK` (five `DayDef`s), `WeekLogEntry`, `dayDef`, `eodNpcLine`, `yesterdayLine`, `MAP_ROOMS`, `MAP_LINKS`. `SITE` lives in `site.ts`. | The five-day week stays. The results tab reads `weekLog`. |
| `src/game/save.ts` | `SAVE_KEY = "cc.save.v1"`, `SAVE_VERSION = 1`, `SaveV1`, `snapshot`, `hydrateSave`, `writeSave`, `peekSave`, `wipeSave`. | Version 2 with a migration from version 1 (section 13). |
| `src/game/audio.ts` | One `AudioContext`, a music gain bus, procedural beds chosen by period (`plant`, `lot`, `menu`). No audio files. | The music player plays real files. It must duck or mute the procedural bed while it plays. |
| `src/game/IntroScreens.tsx`, `TeachFrame.tsx`, `PixelMenu.tsx` | Intro, teaching frames, and menus | The new start-up and setup screens sit in front of the existing flow. |
| Mini games: `LoadGame.tsx` (LOAD.CAB), `MoreGames.tsx` (bowl, pebble), `MaintGame.tsx` (LOTOTO), `Arcade.tsx` (CATCH), `DelayGame.tsx`, `PhysicsGame.tsx`, `Horde.tsx`, `Leisure.tsx`, `FuelShuffle.tsx` | Self-contained components that call `onDone` or `onAbort`, or go through `openCab`. | Each becomes an app. Their unlock rules and scores do not change. |
| `GROK_WORLD_100.md` section F, "Camera" | This means the in-world viewport: zoom, clamping, glimpses. | **Name collision.** The new app is called **CORE CAM** everywhere, so it cannot be confused with the viewport. |

Facts that shape the design:
- There is no city and no season concept yet. Both are new.
- There are no music files. The only audio is the procedural bed.
- `flags.built` is set in `finishBuilder`. The designed plant is `s.plant`. Nothing else holds the design.
- The week and residue are already in place and the residue survives across days.

## 4. The product: Parlor OS

### 4.1 Start-up sequence (replaces the current splash and menu for new players; returning players see it too)

1. **Boot.** A short, skippable boot log in the pixel font, about 2.5 seconds. Lines are authored. Respect reduced motion (no scroll, just the final frame). Any key or click skips.
2. **Sign-in card.** "Continue" (if a save exists) or "New shift." Show the Parlor OS mark (text plus a small cup icon). No music until the first click.
3. **Setup (new shift only).** Four choices, section 4.2. Each one shows what it will change, in a sentence.
4. **Desktop.** The desktop opens. Before the reactor is designed, only the apps that do not need a design are visible: Settings, Music, News, Radiation Basics, NRC Regulations, and Academy (tier 1). Everything else appears after the Builder runs.
5. **Start shift.** A "Start shift" button sends the player into the existing flow: role, build, intro, brief, play. After that, the desktop is the hub. Open it from a laptop prop in the cafe and from the existing pause key. Opening the desktop pauses in-world time. The clock widget keeps showing the in-game time.

### 4.2 The setup choices, and what each one changes

These are the "real impact" choices. Every choice must change at least three visible surfaces. The M5 impact audit checks this (section 14.3).

| Choice | Options | What it changes (each is a required consumer) |
|---|---|---|
| **Region** (picked on a map) | Nine US Census divisions to start. A division appears only when it has a verified background value (section 12). | (a) The fictional local news town and its paper (section 11). (b) The "your region" line and baseline in Radiation Basics and the background map. (c) At least one dialogue line from Mabel or Jordan that names the region's river, weather, or town. Add the line as a variant. Do not rewrite existing lines. |
| **Season** | Spring, Summer, Fall, Winter. Fixed for this build. | (a) The desktop theme, wallpaper, and particles (section 4.6). (b) The music playlist. (c) The in-world lot tint for `lot` scenes, through the existing day-tint in `render.ts`, as a per-season variant. (d) Seasonal local news (heat advisory, leaf-fall, ice, spring rain). |
| **Starting stance** | Cautious, Steady, Bold. This is a display choice, not a score. | (a) News weighting. Cautious favors safety and regulatory items. Bold favors output and efficiency items. (b) The Academy's "Recommended for you" page. (c) One variant line each for Jordan and Mabel, on the first day only. (d) The Results tab's "What to look at" note. **Stance does not change trust or culture.** Starting trust changes would touch frozen numbers and need approval. |
| **The reactor** | Already chosen in the Builder. | Every reactor-facing app reads `s.plant` and the shared run (section 5): CORE CAM, Reactor Control, Results, Core Map, Design. |

Settings are separate from choices. They are customization, not story, so they never change dialogue or news: section 4.5.

### 4.3 Desktop, windows, and the taskbar

- A start menu (a grid of app icons with labels), a taskbar (open apps, the clock, the season icon, and the sound toggle), and desktop icons for pinned apps.
- Windows have a title bar, drag, close, minimize to the taskbar, and focus. Z-order follows focus. Each window has a minimum size. Windows cannot be dragged off screen.
- **On phones (under 720px wide),** an app opens full-screen, with a back control. The home grid replaces the desktop. The same app registry drives both layouts.
- Each app is a React component mounted in a window or a full-screen frame. Apps do not know which frame they are in.
- **Keyboard routing (a known trap):** the existing game listens on `window` for keys. Game keys must go only to the focused app. Shell shortcuts (Escape closes a window, Alt+Tab-style cycling) must not fire while a game is focused, except where the game has no use for that key. Test every mini game with keyboard focus inside the desktop.
- Accessibility: every app has an `aria-label`, focus is visible (2px copper ring), and the taskbar and start menu are fully operable with the keyboard. Escape closes menus.

### 4.4 App registry

| App | Phase | What it is | Built from |
|---|---|---|---|
| Settings | 1 | Customization (section 4.5) | new |
| Music | 1 | Plays real audio files, season playlist, volume, skip, now-playing line | new; `audio.ts` ducking |
| Reactor Control | 1 | The control room. Runs the **designed** plant, with rods, flow, power, hold band, scram. | `ReactorTrainer.tsx`, lifted to the shared run (section 5) |
| Reactor Design | 1 | The design room. Edit the plant. | `ReactorBuilder.tsx`, `NuclearDesk.tsx` |
| Academy | 1 (wrap), 3 (tiers) | Tiered lessons and quizzes | `content.ts` `ACADEMY`, `AcademyQuiz`, `TeachFrame` |
| News | 4 | Two tabs: **World** (real feeds) and **Harrow Bend** (fictional local). | new; section 10 and 11 |
| Radiation | 3 (basics), 4 (map) | Two tabs: **Basics** (units, half-life, shielding, dose versus contamination) and **Your region** (the background map). | new; section 12 |
| NRC Regulations | 3 | Official link, plain-language index, search over the index (section 9). No AI. | new |
| Results | 2 | Core health, average burnup, weekly trend, "What to look at" | new; section 7 |
| Core Map | 2 | The core lattice and the shuffle mode | `FuelShuffle.tsx`, `shuffleModel.ts` |
| CORE CAM | 2 | A window onto the fuel of the designed reactor (section 6) | new |
| LOAD.CAB, ROD.BANK, DELAY.CAB, PHYS.CAB, CATCH, LOTOTO, Bowl, Pebble, Golf, Horde | 1 | The mini games, each as an app | existing components through `openCab` and `finish*` |

Mini game unlock: a mini game app appears when its in-world cabinet has been found, using the same flags as today. Settings has "Show all apps" for testers. It is off by default.

### 4.5 Customization (Settings)

- **Wallpaper:** the season's set by default, plus any other season's set.
- **Theme:** "Follow season" (default), or pick any season. The in-world season stays the setup season.
- **Accent:** three palette colors only (copper, leaf, gold).
- **Icon layout and pinned apps:** reorder, pin, and unpin.
- **Text size:** three steps, through a root scale variable.
- **Reduced motion:** turns off particles, the boot animation, and window animations. Glow becomes static.
- **Colorblind-safe reactor colors:** swaps the k color ramp for one that uses lightness and a symbol, not hue alone.
- **Sound:** music volume, effects volume, music on or off.
- **Clock:** 12 or 24 hour. The clock shows the in-game time.
- Settings live in the save (section 13), not in `localStorage`. The one exception is the news cache, which is a build artifact.

### 4.6 Seasons and themes

| Season | Desktop theme | Particles | Accent | Music playlist | Lot tint |
|---|---|---|---|---|---|
| Spring | Rain (soft streaks on the window edges) | Rain | Leaf | Spring set | Cool, green-leaning |
| Summer | Summer (warm sun glare, heat shimmer off the taskbar) | Heat shimmer | Gold | Summer set | Warm, saturated |
| Fall | Fall (leaves drift across the wallpaper) | Leaves | Copper | Fall set | Amber, long shadows |
| Winter | Snow (slow flakes, window frost at the corners) | Snow | Steel | Winter set | Cool, blue-leaning, with cream lamps |

Each theme is CSS tokens plus one canvas particle layer. The particle layer uses a pool of at most 160 particles, respects reduced motion, and pauses when the desktop is hidden.

## 5. The shared run (the central architecture change)

This section is the fix that makes CORE CAM and Reactor Control "the reactor being designed and ran." Do it first in M1, because M2 depends on it.

1. **Run state.** Add `s.run` to `GameState`:
   ```
   run: {
     powerPct: number;        // 0–100, share of design powerMW
     flowPct: number;         // 0–160, share of design flow
     rodsWithdrawnPct: number;
     scram: boolean;
     history: { t: number; dT: number; inBand: boolean; k: number }[];  // capped, e.g. last 600 samples
   }
   ```
   Seed it from `s.plant` the first time a control app opens. The seed is the plant's own operating point (power and flow from the design), not the trainer's defaults.
2. **One thermal function.** Move `scaleDt` and `tColdOf` from `ReactorTrainer.tsx` into `plant.ts` as `thermalState(plant, run)` returning `{ dT, tCold, tHot, tFuel, inBand }`. The trainer, Reactor Control, CORE CAM, and Results all call it. Nothing duplicates the formula.
3. **The designed plant.** Reactor Control runs `s.plant`. Its plant-type selector is removed from the main view. A "Compare" card (the trainer's existing comparison idea) can show the other three types side by side, and it reads the same function with each type's defaults. Mark this as a deliberate change in the PR, because the current trainer lets the player pick a type.
4. **Writes.** Only Reactor Control writes to `s.run` (power, flow, rods, scram). CORE CAM and Results only read it. Set `history` once per in-game minute while the control app is open, and once per in-game hour otherwise, so Results has a trend.
5. **Teaching proxies.** Put every proxy constant in one table in `plant.ts`, with a comment saying it is a teaching value, and why. Required proxies: the fuel temperature rise over the coolant `G[type]` (fuel is hotter than coolant, and the gap grows with power), and the fuel mass per type for burnup (section 7). A unit test checks the ordering `tFuel > tHot > tCold` whenever power is above zero.

## 6. CORE CAM (Phase 2)

CORE CAM is a window onto the fuel of the reactor the player designed. It is not a physics simulator. It reads the design and the shared run, and it draws the fuel and the flow.

### 6.1 Geometry, from the design

| Design | Drawn as |
|---|---|
| `scale: "rod"` | One pin in cutaway: cladding, pellets, gap, and a central line for the fuel column. |
| `scale: "assembly"` | A lattice of pins (for example 4×4 or 6×6), with spacers and guide tubes. |
| `scale: "core"` | A grid of assemblies. With `fullCore: true`, every assembly is drawn. Otherwise a 3×3 window is drawn and labeled as a window. |
| `type: "pwr"` | A pressurized channel. Downcomer, core, and flow arrows down the outside and up the middle. |
| `type: "bwr"` | Boiling channels. Vapor bubbles rise in the core. |
| `type: "pebble"` | A bed of pebbles (a packed circle grid). Helium flows between pebbles. |
| `type: "msr"` | Graphite channels in molten salt. Salt flows through them. |

`sizeClass` (0, 1, 2) changes the pin count or the assembly count, so a bigger design looks bigger.

### 6.2 The mapping (all formulas are teaching proxies, labeled as such)

Inputs: `plant`, `run` (or `thermalState`). Let P = `powerPct / 100` and F = `flowPct / 100`, clamped to [0.4, 1.6] for F.

| Visual | Driven by | Formula (clamped to [0, 1] unless noted) |
|---|---|---|
| **Fuel base brightness** | enrichment and burnup | `base = 0.6 · clamp((enrich − 2) / 3) + 0.4 · (1 − clamp(burnup / 60))` |
| **Core temperature term** | `tFuel` from `thermalState` | `tt = clamp((tFuel − tMin[type]) / (tMax[type] − tMin[type]))`. The constants live in one table. |
| **Glow intensity** | base and temperature | `glow = (0.4 · base + 0.6 · tt) · scramFactor`. `scramFactor` falls to 0.15 over about 3 seconds after scram, and comes back over about 6 seconds after reset. |
| **Glow color** | glow value | Ramp: steel `#3d5c66` at 0, gold `#c9a227` at 0.6, copper `#c4783a` at 0.85, cream `#f3e6d0` at 1. Use copper only for the top of the range, never red. |
| **Band indicator** | `dT` against `DT_BAND[type]` | A thin outline in gold when in band. In steel when below. In copper when above. No red anywhere in the art. |
| **Flow particle count** | P | `count = round(24 + 96 · P)`, pool cap 256 |
| **Flow particle speed** | F | `speed (px/s) = 20 + 120 · F` |
| **Flow direction** | type | PWR and MSR: downward on the outside, upward through the core. BWR: vapor rises. Pebble: helium drifts through the bed. |
| **BWR bubble rate** | P and F | `void = clamp(0.5 · P / F)` is a teaching proxy for boiling. Bubble spawn rate is proportional to `void`. Label it "boiling proxy." |
| **Core health readout** | Results (section 7) | Shown as a small value in the corner, from the same number Results shows. |

### 6.3 Labels and honesty

- The window title shows the design's title (`plantTitle`) and the type. Under it: "Teaching view. Glow shows fuel activity and core temperature. Not a measurement."
- Teaching k numbers stay in code. CORE CAM shows the k value from `computeKeff` in a small text corner, labeled "classroom proxy."
- The glow never shows red for a fault. A fault shows as a changed outline and a short line of text: for example "Above band. Pull back on power or add flow."

### 6.4 Behavior and edge cases

- No design yet (should not happen after the Builder, but handle it): draw `DEFAULT_PLANT` and show "Using the default design."
- Reduced motion: no particles. Glow still changes, but only when the value changes by more than 5%, to avoid flicker.
- Scram: glow drops, particles stop, the outline turns steel, the text says "Scrammed. Power falls. Reset to restart."
- The window can be resized. The view keeps integer pixel scaling and centers the scene.
- Performance: target under 3 ms per frame on a mid-range laptop. Use the pool, reuse canvases, and skip drawing when the window is minimized.

### 6.5 Tests

- `thermalState` monotonicity: higher P gives higher `dT`. Higher F gives lower `dT`. The fuel ordering holds (section 5, item 5).
- The mapping is monotone: more power means more glow and more particles. More flow means faster particles. Higher burnup means dimmer base.
- Each plant type renders without error for a fixed set of inputs (snapshot test on a small canvas).
- Reduced motion produces zero particles.
- A design with `fullCore: true` draws more assemblies than `false`.

## 7. Results and Core Map (Phase 2)

### 7.1 Core health (0–100, displayed as a breakdown)

| Component | Weight | Definition |
|---|---|---|
| Time in band | 40% | Fraction of `run.history` samples with `inBand` true, over the last in-game day. |
| No open incident | 20% | 1 if `incidentOpen` is false, else 0. |
| Residue clean | 20% | 1 minus the share of `residue` fields set to `"hid"`. `caught` counts as clean. |
| k in the classroom band | 20% | 1 if `k` is between 0.98 and 1.04, scaled down linearly outside that range. |

Core health is a readout. It never changes culture, trust, or the ending. Show the four components, the weights, and the score.

### 7.2 Average fuel burnup

- Burnup in MWd/kgU, stored in `plant.burnupMWd_kg`.
- Per in-game update: `Δburnup = powerMW · (powerPct/100) · Δdays / fuelMass[type]`, with `Δdays` from in-game minutes and `fuelMass` in kg, from the proxy table.
- **Teaching honesty (important for the owner):** real PWR fuel is discharged near 45–50 MWd/kg. At 1100 MW, reaching that takes about 11 years of full power, and a five-day week shows a tiny number. Do not hide this. Show the true value, and show the in-game clock label "1 in-game day = 1 real day" in the results. Offer a labeled "time-compressed view" toggle that multiplies the displayed burnup by a stated factor. The factor appears on screen. Without the toggle, the number is honest, and small.
- The average is per design (one number) and, when `fullCore` is on, the core's average across the drawn assemblies.

### 7.3 Weekly trend

Store one entry per in-game day in `results.daily`: `{ day, coreHealth, burnup, shuffleFq?, incidentCount }`. Draw a small line chart with labels, one series per number, using the dataviz rules: direct labels, no color-only encoding, a text table for screen readers.

### 7.4 "What to look at"

One line, chosen from a short list by stance (section 4.2) and by the lowest current component of core health. Example: "Time in band is low. Watch the hold band in Reactor Control." No line gives a grade.

### 7.5 Core Map and the shuffle mode

- The core map shows the assemblies with their enrichment and burnup, as a grid. Hover or focus shows the numbers.
- Shuffle mode lets the player swap assemblies, with the existing `passes` rule (Fq < 1.50 and rim share ≤ 50% after at least 3 swaps). It reuses `shuffleModel.ts` and does not retune it.
- The mode is always available from the Core Map once the design exists. It records a best Fq in `results.shuffleBest`. Core Map shuffles never set `shuffleDone`. The in-world Day-5 shuffle keeps its existing logic exactly.

### 7.6 Tests

- Core health with all components at their maximum gives 100. With each component at zero, it gives the expected value.
- Burnup increases monotonically with power and time, and is zero at zero power.
- The shuffle pass rule is unchanged (the existing 5 tests in `scripts/shuffle-model.test.mjs` still pass, and one new test checks the Core Map uses the same function).

## 8. Academy: tiers and new pages (Phase 3)

### 8.1 Tiers

| Tier | Name | Audience and content |
|---|---|---|
| 1 | Terms | Plain words. Fission, neutron, moderator, coolant, enrichment, fuel, rods, criticality, shutdown, decay. One idea per page. |
| 2 | Intermediate | The existing physics and heat pages, reorganized, plus the concepts they rely on: k-infinity, six-factor, reactivity, delayed neutrons, Doppler, moderator temperature, xenon. |
| 3 | Basic math | Neutron balance in one line. One-group diffusion. Geometric buckling. Reactivity as a fraction and in dollars. The period from reactivity, as a formula. All formulas come from `nuclearLab.ts`. Every equation is written in the code, and the page says what each symbol is. |
| 4 | Calculus | **Locked card only: "Not in this build."** Do not write any calculus content in phases 1–4. |

Re-tag the existing `ACADEMY` pages into tiers 1–3 by content. A page can appear once. Do not duplicate existing pages; merge where two pages teach the same thing, and keep the older title.

### 8.2 New pages

- **Tier 1:** at least 12 pages. Each is about 120 words, has one still image or a text card, and has a single quiz question.
- **Tier 3:** at least 5 pages. Each has the equation in a code block, a symbol table, a worked example with numbers you compute in code, and one quiz question.
- **Radiation basics** (Phase 3, in the Radiation app): units (becquerel, gray, sievert), half-life with a worked example, shielding by material and thickness in plain words, time, distance, and shielding (ALARA, linked to the existing page), dose versus contamination. Numbers here come from cited sources (section 12.1), or they are left out.

### 8.3 Page template

```
{ tier: 1|2|3, title, track, still?, extra?, body, equation?, symbols?, example?, quiz: {question, options[], correct, explanation}, sources?: [{title, url}] }
```

Every page keeps the existing teaching disclaimer style ("Teaching model. Not a license.") where the page is about the reactor.

### 8.4 Stance and the Academy

The Academy's "Recommended for you" is one page, chosen by stance (section 4.2): Cautious recommends the safety track, Steady the heat track, Bold the physics track. The choice is shown, not forced.

## 9. NRC Regulations app (Phase 3)

- A link to the official eCFR for Title 10 (Energy), open in a new tab, with a note that it is the official text.
- A **plain-language index** of about 12 entries. Each entry: the Part or section number, its title, a plain summary of 40–80 words, a link to the eCFR section, and a status: "verify before publish" until the owner confirms it.
- **Do not write section numbers or titles from memory.** Build the index from the list below, and the owner confirms each title and link against eCFR before the milestone merges. The starter list to verify: Part 19 (notices to workers), Part 20 (radiation protection standards), Part 21 (reporting defects), Part 26 (fitness for duty), Part 50 (licensing of production and utilization facilities), Part 50 Appendix B (quality assurance), Section 50.59 (changes, tests, and experiments), Part 52 (combined licenses and approvals), Part 55 (operator licensing), Part 100 (siting criteria). Keep physical security (Part 73) at the level of "exists, and is not described here."
- Search over the index: titles and summaries only. No AI.
- No text from the regulations is copied. Summaries are paraphrases, and each one links to the source.

## 10. Real nuclear news (Phase 4)

### 10.1 Sources (verify each URL and each site's terms before you wire it)

- World Nuclear News (RSS).
- The NRC's news releases feed.
- ANS Nuclear Newswire (RSS).

If a feed does not exist, is not public, or forbids reuse, drop it and note it in the PR. Do not scrape HTML.

### 10.2 Pipeline

- A build-time script, `scripts/fetch-news.mjs`, reads each feed, keeps the newest 30 items per source, and writes `public/data/news.json`. Run it before `npm run build`, and in a scheduled workflow once a day. It is the only network access in the game.
- Each item: `{ id, source, title, link, published, summary }`. `summary` is the feed's own description, cut to 240 characters and marked as a summary. No full article text.
- If the fetch fails, the game uses the last committed `news.json`, and the News app says "Last updated: {date}" from the file, not from the clock.
- Attribution: show the source name and the date on each item. Each item opens its original link in a new tab.
- The in-game date is the in-game day, not the real date. Real headlines are shown as "from the world feed," with their real dates.

## 11. Fictional local news (Phase 4)

### 11.1 The town

Placeholder: **Harrow Bend**, with the paper "The Harrow Bend Ledger" and a fictional utility, "Harrow Bend Light & Power." The owner chooses final names. Each name is checked against real places and companies before the PR, and changed if it matches. The town's name and paper change with the region (section 4.2), so each region has its own placeholder set. Start with one set for the first verified region.

### 11.2 The engine

- Authored pools of headlines and short bodies. Each entry has `conditions` and a `weight`.
- Conditions can reference: `season`, `region`, `stance`, `day` (a range), `flags` (true or false), `residue` values, and `trust` thresholds. Conditions read the save; they never read the real clock.
- Each in-game day, the engine picks 3–5 items with a seeded random generator. The seed is stored in the save, so a reload shows the same items. A new day gets a new draw.
- At least 40 entries in phase 4: 12 neutral, 10 season-specific, 8 stance-specific, 6 about the plant (the design, the outage, the shuffle), 4 about residue (an incident, a caught problem, a hide that someone noticed later). A hide must never be reported as a catch.

### 11.3 Examples (to be expanded, and to show the tone)

- Neutral: "County fair asks for volunteers to help the library book sale." (Harrow Bend Ledger)
- Summer: "Heat advisory issued for the valley. Utility asks for lower daytime use." (Harrow Bend Light & Power notice)
- Cautious stance, plant topic: "Local group asks for a public walk-through of the plant's safety signs." (no names)
- Residue, caught: "Plant reports a valve tag replaced after a routine check." (no blame)

No real person, company, or event appears in fiction. The engine never invents an NRC action or a quote from a real official.

## 12. Background radiation map (Phase 4)

### 12.1 Data

- A file, `public/data/background.json`, with one entry per region: `{ regionId, label, valueMsvPerYear, range?: [low, high], year, source: { title, url }, status: "verified" | "pending" }`.
- Only values with a citable source get `status: "verified"`. Candidate sources to check: UNSCEAR's published annual averages for the population of each country, and NCRP Report No. 160 for the United States (verify the report number and the figures before use).
- Until a region is verified, its entry is `"pending"`, and the app shows "Pending verification" instead of a number. Do not guess a value.
- The map shows an average for the region, not for a city. Say so on the map: "Average for the region. Your street may differ."

### 12.2 Map

- A simplified map of the nine US Census divisions, from a public-domain source (US Census cartographic boundaries). Keep the file small, and check its license in the manifest.
- The player picks a division. The pick feeds the setup region (section 4.2).
- Shapes are labeled with text, not color alone. Hover and focus show the value.

### 12.3 Radiation app integration

The "Your region" tab shows the verified value, the range if there is one, the year, the source link, and a one-line explanation of units. The Basics tab links to it.

## 13. Save format (version 2) and migration

- `SAVE_VERSION` becomes 2. Keep `SAVE_KEY = "cc.save.v1"` for reading old saves, and write to `cc.save.v2`.
- Migration from version 1 fills defaults: setup (region and season unset, which means the setup screen shows once more, with a note), `run` (seeded from `s.plant` on first open), desktop settings (defaults), results (empty), news (empty seed), and academy tiers (derived from `academyDone`).
- New fields in version 2: `setup { region, season, stance, seed }`, `run`, `desktop { pinned[], wallpaper, followSeason, accent, textScale, reducedMotion, colorSafe, music, sfx, musicOn, clock24, showAllApps }`, `results { daily[], shuffleBest }`, `news { seenIds[] }`.
- Keep `residue` exactly as `GROK_FEEL.md` defines it.
- Test: load a fixture of a real version 1 save (create one from the current `main`) and check every field, including `residue`, `flags`, `plant`, `academyDone`, and `trust`.

## 14. Verification

### 14.1 Unit tests (add under `scripts/`, following `scripts/shuffle-model.test.mjs`)

- `thermalState` (section 5), CORE CAM mapping (section 6.5), core health and burnup (section 7.6), the Academy tier data (every page has a tier, a quiz, and correct options), the news engine (same seed gives the same items, a hide is never reported as a catch, conditions are respected), the background data (no `"verified"` entry without a source), save migration (section 13).
- Use the `ESBUILD` environment variable pattern from `shuffle-model.test.mjs`. Do not rely on `npx` reaching the network.

### 14.2 Browser checks (each milestone)

- Build with `npm run build`, then serve the built output on port 8080 (or `npm run dev` on 8080 during work). Use the repo's Playwright helpers as the starting point (`scripts/browser-smoke.mjs`, `scripts/shots.mjs`). If you use Tailwind outside the normal build, rebuild the CSS before taking screenshots, or they come out blank.
- Run `npm run typecheck` on every milestone.
- Load at 1100×720 and at 390×844. Check that the desktop and every app open with zero page errors and zero console errors (the audio autoplay warning is allowed).
- Every app opens, closes, and reopens without losing its state.
- Every mini game app returns its score to the same place the in-world cabinet does (`finish*`).
- Keyboard: every mini game still works when opened from the desktop.

### 14.3 Impact audit (M5)

For each setup choice, load two saves that differ only in that choice, and capture the same surfaces in both: the desktop, the News app, CORE CAM (for season), the Radiation app (for region), and one dialogue frame (for stance and region). Required results:
- Each choice changes at least three surfaces.
- The changed surfaces differ in text (the text comparison is exact) and, where the surface is visual, in pixels (at least 2% of pixels differ).
- Frozen numbers are unchanged. A test reads the ending formula, culture and trust values, and `LAMBDA` and checks they are identical to `main`.

Record the results in the PR as a table: choice, surfaces changed, and how each changed.

### 14.4 The ten-minute walkthrough (the owner runs this to check the build)

1. Boot, skip, sign in as a new shift.
2. Setup: choose Fall, a region with a verified value, and Steady. Check that the desktop is copper-toned and shows leaves.
3. Open Settings. Switch to Winter and back. Check that the wallpaper and particles change, and the in-world season does not.
4. Open Music. Play a track, change the track, and check that the procedural bed is quiet.
5. Open Radiation, then "Your region." Check the region name and the value or "Pending verification."
6. Open NRC Regulations. Search "dose." Check the results and the link.
7. Open Academy, tier 1. Answer a quiz question.
8. Start shift. Build the reactor. Return to the desktop.
9. Open Reactor Control. Check that the power and flow match the design. Change rods. Check the band indicator.
10. Open CORE CAM. Check that the fuel glows, the particles move, and the label says "Teaching view."
11. Open Results. Check core health, burnup, and "What to look at."
12. Open Core Map. Shuffle once. Check Fq and the pass rule.
13. Open News. Check the World tab (real items, with source and date) and Harrow Bend (fictional items for the season and the stance).
14. Open a mini game app (LOAD.CAB). Finish it. Check the score and return to the desktop.

## 15. Milestones and Definition of Done

**M1, Shell and setup (Phase 1).** Start-up, setup, desktop, windows, taskbar, start menu, mobile layout, keyboard routing, Settings, Music (with a manifest of at least four original or public-domain tracks, one per season), Reactor Control on the shared run, Reactor Design, Academy (tier 1 wrap), and the mini game apps. The shared run and `thermalState` are part of M1.
- Done when: the walkthrough steps 1–9 and 14 pass, the save migration test passes, the browser checks pass at both widths, and the PR lists every changed file.

**M2, Results, Core Map, CORE CAM (Phase 2).** Section 6, section 7.
- Done when: CORE CAM shows the designed type and scale for all four types and scales, the mapping tests pass, Results shows the breakdown and trend, and the walkthrough steps 10–12 pass.
- Note: the mapping test (section 6.5) checks `thermalState` ordering from section 5, item 5.

**M3, Academy tiers, radiation basics, NRC (Phase 3).** Section 8, section 9, and the Basics tab of section 12.
- Done when: every tier 1 and tier 3 page is in the data with a quiz, the NRC index is marked "verify before publish" until the owner confirms it, and the walkthrough steps 6–7 pass.

**M4, News and background map (Phase 4).** Section 10, section 11, and section 12 (map and data).
- Done when: the build-time script runs and writes `news.json` (or the committed fallback is used), the local news engine passes its tests, the map shows only verified values and "Pending verification" otherwise, and walkthrough steps 5 and 13 pass.

**M5, Impact audit.** Section 14.3. Every setup choice changes at least three surfaces, and the frozen numbers are unchanged.
- Done when: the impact table is in the PR, and the walkthrough passes end to end.

Rough planning sizes, for scheduling only: M1 about 3–4 weeks, M2 about 3–4 weeks, M3 about 6–8 weeks (mostly writing and checking), M4 about 3–4 weeks.

## 16. Out of scope (do not start these)

- The AI bot for NRC regulations (later phase).
- The calculus tier of the Academy.
- The multi-year fuel-cycle calendar.
- City power as a game mechanic.
- Seasons that advance during play.
- Multiplayer.
- New rooms, portraits, or emotes. `GROK_FEEL.md` already bans them.

## 17. Traps found in the code (fix or avoid)

1. **The trainer does not run the designed plant.** It takes only `site={type}` and keeps rods, flow, and power in local state. Fix in section 5, and say so in the PR.
2. **Game keys leak into the desktop.** Game handlers on `window` fire while a desktop app is focused. Gate them by focus (section 4.3).
3. **Two music sources.** The procedural bed and the music player will both play unless the player ducks the bed (section 3).
4. **Name collision.** GROK_WORLD section F uses "Camera." Use CORE CAM in every label and file name.
5. **Burnup looks broken.** The honest number is tiny at game time scale (section 7.2). Show it honestly and offer a labeled compression.
6. **Residue is the truth, `incidentResolved` is "the day is over."** Do not use `incidentResolved` as a catch flag (section 2.1, and `GROK_FEEL.md`).
7. **News must not use the real clock.** Use the in-game day and the save seed, so a reload never changes the news.
8. **Feeds can break.** The build must succeed without the network, using the committed `news.json`.
9. **Region changes must not re-roll mid-week.** The region and season are chosen once, at setup. The news seed comes from the save.
10. **Real names creep in.** Fictional names are checked before each PR.
11. **Keyboard focus in the mobile home grid.** Test with a physical keyboard and with touch.
12. **Stance is not a stat.** If a stance seems to need a number, it is an open question.

## 18. What to send back with each PR

- A summary of what changed, and the file list.
- The section numbers you implemented, and any you did not, with the reason.
- Test results: the new tests, and the pre-existing failures, unchanged.
- The browser check results, with screenshots at both widths.
- The open questions, each with the default you used.
- For M5, the impact table (section 14.3).

Keep the PR description plain. Do not write marketing copy for the game in the PR.
