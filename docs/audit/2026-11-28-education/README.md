# The educational side: a full review, 28 November 2026

The owner asked for a full review of the game's educational side and whether to revamp it. This review covers:

- every place the game teaches;
- every physics claim, checked as a nuke would check it;
- how well it teaches;
- a revamp plan.

None of the frozen files needs changing for the fixes proposed here.

## Bottom line

- **The deep layers are good.** These are university-grade:
  - the delay cabinet's physics;
  - the ΔT bench's kinetics;
  - the BEAVRS refuelling outage;
  - the term lessons on Priya's design desk.
- **The front door is the weak part.**
  - The Academy's 22 pages are mostly slogans.
  - Its quizzes test attitude, not understanding.
  - Three of its cabinets teach rules that contradict the physics they're named after.
- **Eight things are physically wrong** and should be fixed whatever else happens (see below). The worst three:
  - the rods page says pulling a rod makes the fuel absorb *fewer* neutrons;
  - the rod cabinet scores a fully inserted bank as worth nothing;
  - the physics cabinet's cladding eats 42% of the neutrons that touch it.
- **Revamp:** yes. Make the Academy one ordered path. Each topic gets a plain card, then the desk lesson, then a cabinet that lets you feel it. Fix the cabinets, add the missing topics (decay heat above all), and replace the placeholder plates with diagrams that teach.

## Where the game teaches

| Surface | What it teaches | Verdict |
|---|---|---|
| **Academy**: 22 pages, 10 quizzes (`content.ts` `ACADEMY`, `GameApp.tsx` `AcademyStage`) | Culture, heat, safety, physics, fuel | Front door. Thin: aphorisms, few mechanisms. Several errors. |
| **Term lessons** on the design desk: 20+ terms (`nuclearLab.ts` `TERM_LESSONS`) | D, ∇²φ, Σ_a, νΣ_f, k, B², PNL, k∞, F_q, parts, delayed, Doppler, xenon, period, β, MTC | The best writing in the game: plain words, steps, equations. Hidden behind the designer. |
| **DELAY.CAB** (`DelayGame.tsx`, frozen) | Delayed neutrons, six groups | Correct. Keepin's U-235 thermal six-group λ and β_i exactly, sped up 8× and labelled. |
| **ΔT bench** (`ReactorTrainer.tsx`, `benchStep.ts`, `plant.ts`) | Q = ṁ·cp·ΔT, power, flow, feedback | Real one-group point kinetics with prompt jump, power defect and coolant coefficients. Sensible values (PWR −25 pcm/°C). |
| **Refuelling outage** (`outage/*`) | Core map, boron letdown, peaking, discharge | Excellent. The real BEAVRS map, measured boron letdown and detector maps, a fitted model with its RMS errors stated. |
| **Per-type Fridays** (`refuel/*`) | BWR bundle, pebble passes, salt review | Approved design, carefully caveated. Not re-derived here. |
| **ROD.BANK** (`MoreGames.tsx` `RodsGame`) | Rod banks, overlap, worth | Bank order is right. The worth model, step count and drawing are wrong (below). |
| **PHYS.CAB** (`PhysicsGame.tsx`) | Pin cell, diffusion, analog Monte Carlo | Good idea. Cladding absorption is far too high, and the pin board asks you to hold k∞ near 1. |
| **LOAD.CAB** (`LoadGame.tsx`, `loadRules.ts`) | "Xenon follows power" | An abstract board game. It mixes a coolant leak with neutron leakage and doesn't show the iodine pit the Academy promises. |
| **Codex** (`codex.ts`) and `docs/facts.md` | "How real is this?" | Honest and well sourced. It already flags the number mismatches, which are still unfixed. |
| **Night board** (`nightwatch/model.ts`) | Plant parameters by type | Physically sensible:<br>• suppression pool 30 °C with the alarm at 35;<br>• BWR feedwater 216 °C;<br>• the freeze plug at 380 °C, below FLiBe's ~459 °C freezing point.<br>One gauge is mislabelled (below). |
| **Site text** (`siteText.ts`) | The four plant types in words | Correct. The BWR recirc-void mechanism and MSR salt expansion as the fast feedback are both right. |

## What's physically wrong (fix first)

| # | Where | It says | What's right | Fix |
|---|---|---|---|---|
| 1 | `content.ts:1247`, rods page | "Pull it out and the **pellet** eats fewer neutrons, so k rises." | Pulling the rod means the **rod** eats fewer. More reach the fuel, thermal utilisation *f* rises, and k rises. | "Pull it out and the rod eats fewer neutrons; more reach the fuel; k rises." |
| 2 | `MoreGames.tsx:438`, ROD.BANK | Worth is the *sum of a bell curve* over position, so a bank at 0 steps and a bank fully in both count as zero. The HUD says "Worth is an S-curve." | The bell is the **differential** worth (per step). The **integral** worth is the S-curve, and it's largest when the bank is fully in. | Track integral worth (the S-curve) as the reactivity you hold against demand. Use the bell only for how hard each step bites. |
| 3 | ROD.BANK steps and drawing | Counts steps **inserted** (228 = all in). The bars grow from the bottom although the label says "PWR banks from above". | Westinghouse counts steps **withdrawn**: 228 is fully out, and at full power Bank D is near 228. The overlap order in the game is right (withdraw A→D, insert D→A). | Show steps withdrawn. Draw rods coming down from the top. |
| 4 | `PhysicsGame.tsx:363` and the brief at :945 | Cladding absorbs 42% of the neutrons that hit it ("capture in clad and rod"). | Zircaloy is used *because* it barely absorbs: Zr is about 0.18 b thermal, versus 2.4 b for iron. | Cladding about 2–3% absorption, and say why zirconium is chosen. |
| 5 | `GameApp.tsx:3218`, `nuclearLab.ts:414` | Prompt period "T ≈ ℓ / ρ". | That's the formula with no delayed neutrons at all. Past prompt critical, T ≈ ℓ / (ρ − β). | Change both. |
| 6 | `content.ts:1246`, `nuclearLab.ts:405, 422` | At $1 "the period collapses to the prompt lifetime". | The period shortens smoothly through $1. DOE: prompt critical "does not signal a dramatic change"; it marks the switch to prompt timescales, and getting near it is the danger. | "Above $1 the prompt lifetime sets the pace: milliseconds, not seconds." Keep "cliff" as the feel, not the maths. |
| 7 | `GameApp.tsx:3277–3279`, xenon quiz | Right answer: "Wait, or **already have the boron**." Wrong answer's feedback: "The pit is hours away." | Overriding xenon means **removing** boron (dilution) or pulling rods, so you need margin. "Hours away" is actually the case *for* a quick restart before the peak. | Right: "Xenon will climb for hours. Restart only with margin to override it, or wait it out." Wrong: "You'd be chasing a poison that is still growing." |
| 8 | `nuclearLab.ts:226` and the codex "peaking" note | "F_q … not the same as … F_Q (power peaking)." Codex: "Fq is the hottest assembly divided by the average." | F_Q(Z) **is** the heat-flux hot channel factor (Standard Tech Spec 3.2.1), local and 3-D. The enthalpy-rise hot channel factor is F_ΔH (3.2.2). Hottest assembly over average is a radial or assembly peaking factor. | Call the shuffle number "assembly peaking". Keep F_Q for the local pin. The outage's F_ΔH is already correct. |

## Misleading or inconsistent (should fix)

9. **β quiz** (`GameApp.tsx:3229`). "Higher β is safer, always" is marked wrong, with the feedback "β is a mix, not a trophy". More β *is* more margin to prompt critical, so a learner can't tell why it's wrong. Teach the real point instead: burned fuel (Pu-239) has less β, so the same ρ is more dollars.
10. **Monte Carlo wording** (`content.ts:1249`, `PhysicsGame.tsx:939`).
    - "Implicit capture is a transient." It's a variance-reduction method: the neutron carries on with less weight, and Russian roulette ends the light ones.
    - "σ is the stderr of generation k." It's the standard error of the *mean* k, and that's what falls as 1/√G.
11. **PHYS.CAB pin board says "hold k∞ near 1"** (`PhysicsGame.tsx:945`). A fresh LWR lattice has k∞ well above 1. You hold **k_eff** at 1. The game's own ladder says the core is k∞ × PNL, so a pin held at 1 makes a subcritical plant.
12. **LOAD.CAB's two "leaks"** (`LoadGame.tsx:342`, `loadRules.ts` header). "Red L = leak" is a coolant leak you catch, but "a leak at the edge is PNL" is neutron leakage. Pick one. The cabinet also never shows xenon peaking hours after a trip, which is what its Academy page sends you to see.
13. **A mirrored pin's PNL is exactly 1**, not 0.998 (`nuclearLab.ts:184`). The lesson's own words: mirrors, no leak.
14. **Linear heat rate scales with enrichment** (`plant.ts:206`). At fixed power and core size, q′ doesn't depend on enrichment. Enrichment sets cycle length and local peaking. Drop the term.
15. **The mismatches the codex already admits** (`plant.ts:197–198`): BWR 7.2 vs 7.0 MPa, and pebble 6.0 vs 7.0 MPa. Use 7.0 for both, then retire the two codex apologies.
16. **Fuel pool gauge** (`nightwatch/model.ts:225`): "Fuel pool level 7.0 m".
    - Relabel it **"Water over the fuel"**. The Standard Tech Spec minimum is 23 ft (≈ 7.0 m) over the top of irradiated fuel in the racks.
    - Normal should then sit above it (for example 7.6 m), with the low alarm at 7.0.
    - A known wrong number becomes a real lesson.
17. **Outage header** (`outage/core.ts:19`) says it leaves out "thermal feedback", but the model includes a fitted power feedback. Reword: "no explicit fuel or moderator temperature model; one fitted feedback term."
18. **"Core HOT — Cherenkov blue / Core COOL — stainless"** (`PlantHud.tsx:86`). Cherenkov light comes from radiation, not temperature, and spent fuel glows cold. Keep the blue (your call) and word it "At power: Cherenkov blue."

## How well it teaches

- **Six surfaces, six voices, no path.** The good explanations exist, but they're split up:
  - the term lessons are on the design desk;
  - the honesty notes are in the codex;
  - the feel is in the cabinets;
  - the rigour is in the outage.

  The Academy, the front door, links to none of the desk lessons. A player can read all 22 pages and never meet ∇²φ explained as a hill.
- **The Academy pages are slogans.**
  - Examples: "Fq is a personality, not a score." "k∞ is four doors." "The pellet argues first."
  - They're nice in Priya's voice once you know the physics, but they assume the knowledge they should give.
  - Most pages are 1–3 sentences, with no mechanism and no number.
- **The quizzes test attitude, not understanding.**
  - There are 10 quizzes, all three-choice, and the right answer is nearly always the one that sounds responsible.
  - None asks you to predict anything ("Bank D goes out 20 steps. What does power do?").
  - Answers aren't saved, and nothing comes back later.
- **Three of six cabinets teach the wrong rules** (ROD.BANK, LOAD.CAB, PHYS.CAB, above). The other three (DELAY.CAB, the ΔT bench, the outage) are the best teaching in the game.
- **Disclaimers drown the content.**
  - "Teaching only / not a license / teaching model / not a design basis" appears **252 times** in the source, and 3–4 times on a single Academy page.
  - The codex already handles honesty well. One line on the Academy cover plus the codex is enough.
- **The plates don't teach** (`01-academy-first-page.png`). There are three styles:
  - 5 painted ones (culture, ALARA, shuffle, export, ΔT): the old look you decided to keep only as reference.
  - 2 clean loop schematics (PWR, MSR). These are good.
  - 10 tiny 160×90 placeholders. The xenon plate is a black blob over a grid; the reactivity plate is four bars.

  The biggest visual win is to replace them with **diagrams that explain**:
  - the delayed-neutron timeline;
  - the xenon curve after a trip;
  - the rod S-curve beside its bell;
  - Doppler broadening;
  - the neutron life cycle.
- **Dead UI.** Every Academy page shows a dashed box saying "Not in this build."
- **Tiers don't track difficulty.** "Heat has to leave" (Q = ṁ·cp·ΔT) is tier 3; Monte Carlo is tier 2.
- **Learning isn't tied to the story.**
  - The only record is a "read" count.
  - Priya never asks what you learned.
  - The floor events (the hiss, the tag, the xenon night) don't point back to the lesson they act out.
- **Missing topics a nuke would expect:**
  - **decay heat** (why cooling must continue after a trip; it underpins the freeze plug, the drain tank and half the night board);
  - boron as chemical shim;
  - subcritical multiplication and startup (1/M);
  - samarium;
  - thermal limits (DNB, linear heat rate).

## What to keep as it is

- DELAY.CAB's physics (and it's frozen anyway).
- The ΔT bench model.
- The outage's BEAVRS pipeline and its plain statement of what it leaves out.
- The term lessons' content: fix the four lines above and leave the rest.
- The codex, `facts.md`, and the night board's numbers (apart from the pool gauge).

## Revamp plan

**Aim:** one Academy that a player with no physics can follow start to finish, and that a nuke reads without wincing.

**Shape: one path, three depths per topic.**

| Depth | What | Where it comes from |
|---|---|---|
| **Floor card** | Plain words, one diagram, one "predict this" question, one Priya line for flavour | New writing. The current Academy text becomes the Priya line. |
| **Desk** | Mechanism and equation | The existing term lessons, linked rather than rewritten |
| **Bench** | Feel it | The cabinets, each opened from its topic, and each fixed to match its physics |

**Path (about 12 topics, in the order a reactor works):** fission → the neutron life cycle (six factors) → leakage and size → k and criticality → delayed neutrons and period → control (rods, boron, startup) → feedback (Doppler, MTC, void) → poisons (xenon, samarium) → heat leaving (ΔT, loops) → **decay heat** → fuel and peaking (shuffle, F_Q, F_ΔH) → barriers.

Culture topics (STAR, three-way communication, independent verification, LOTOTO, ALARA, stop when unsure) are woven in where the physics makes them matter, not kept as a separate track.

**Phases:**

| Phase | What | Size |
|---|---|---|
| 0 | Fix #1–#18. Remove the dead box. One disclaimer instead of 252. | Small. Text and a few model lines, with tests. |
| 1 | Academy restructure: the path, three depths, "predict this" quizzes with explanations, mastery saved in flags (no `save.ts` edit) | Medium |
| 2 | Cabinet fixes:<br>• ROD.BANK: integral worth, steps withdrawn, rods from the top;<br>• LOAD.CAB: a real xenon-after-trip timeline;<br>• PHYS.CAB: transparent cladding, a k_eff target | Medium |
| 3 | New topics (decay heat, boron and 1/M startup, samarium, DNB), and the teaching diagrams in the pixel style | Medium–large |
| 4 | Story hooks: Priya assigns the day's topic, floor events point to their lesson, the shuffle asks for the peaking topic | Small–medium |

## Checks behind this review

- `edu.mjs`, with real clicks: opened the Academy from the taskbar, paged all 22 pages, and opened ROD.BANK from its page (`edu.txt`, screenshots 01–06). No page errors.
- Every line number above was read in the source on `c/look-cafe` at the commit this README lands in.
- The physics checks against outside sources:
  - Keepin six-group constants: compared with `DelayGame.tsx`;
  - Zircaloy absorption;
  - the Westinghouse step convention and overlap order;
  - the 23 ft pool level;
  - F_Q and F_ΔH tech spec names;
  - DOE on prompt critical.

## Sources

- [DOE-HDBK-1019/2-93, Reactor Theory: stable period and prompt critical](https://nuclearpowertraining.tpub.com/h1019v2/css/Stable-Period-Equation-108.htm)
- [IAEA TRIGA training: period with prompt neutrons only, T = l/δk](https://ansn.iaea.org/Common/documents/Training/TRIGA%20Reactors%20(Safety%20and%20Technology)/chapter2/physics22.htm)
- [NRC ML15187A218: control bank overlap sequence A→D, insertion the reverse](https://www.nrc.gov/docs/ML1518/ML15187A218.pdf)
- [Salem exam question: Control Bank D at 228 steps at 100% power](https://nostem.github.io/salem-study-system/exams/2018/q41-rod-position-after-downpower)
- [Zirconium alloys: 0.18 b thermal absorption, versus iron 2.4 b](https://en.wikipedia.org/wiki/Zircaloy)
- [NRC BWR spent fuel pool STS 3.7.1: ≥ 23 ft over irradiated fuel](https://www.nrc.gov/docs/ML2021/ML20217G281.pdf)
- [Turkey Point ITS 3.2: 3.2.1 F_Q(Z) heat flux, 3.2.2 F_ΔH enthalpy rise](https://www.nrc.gov/docs/ML2208/ML22089A205.pdf)
