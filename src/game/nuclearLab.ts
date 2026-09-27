/**
 * Teaching-model nuclear lab: k-ladder, two-group diffusion copy, OpenMC export.
 * Not a license. Not a design basis. Not OpenMC results.
 */
import type { DesignScale, PlantDesign } from "./plant";

export const TERM_ART: Record<string, string> = {
  D: "/art/gen/stills/term_D.png?v=term",
  "∇²φ": "/art/gen/stills/term_lap.png?v=term",
  "Σ_a": "/art/gen/stills/term_sa.png?v=term",
  "Σ_s1→2": "/art/gen/stills/term_scatter.png?v=term",
  "νΣ_f": "/art/gen/stills/term_fiss.png?v=term",
  k: "/art/gen/stills/term_k.png?v=term",
  "B²": "/art/gen/stills/term_b2.png?v=term",
  PNL: "/art/gen/stills/term_pnl.png?v=term",
  "k∞": "/art/gen/stills/term_kinf.png?v=term",
  Fq: "/art/gen/stills/term_fq.png?v=term",
  pellet: "/art/gen/stills/term_pellet.png?v=diagram",
  clad: "/art/gen/stills/term_clad.png?v=hw",
  moderator: "/art/gen/stills/term_mod.png?v=hw",
  coolant: "/art/gen/stills/term_cool.png?v=hw",
  vessel: "/art/gen/stills/term_vessel.png?v=hw",
  reflector: "/art/gen/stills/term_refl.png?v=hw",
  delayed: "/art/gen/stills/plate_period.png?v=pixel",
  six: "/art/gen/stills/plate_six.png?v=pixel",
  Doppler: "/art/gen/stills/plate_doppler.png?v=pixel",
  xenon: "/art/gen/stills/plate_xenon.png?v=pixel",
  period: "/art/gen/stills/plate_period.png?v=pixel",
  beta: "/art/gen/stills/plate_period.png?v=pixel",
  MTC: "/art/gen/stills/plate_doppler.png?v=pixel",
};

export const PART_TERMS = ["pellet", "clad", "moderator", "coolant", "vessel", "reflector", "delayed"] as const;
export const PHYSICS_TERMS = ["delayed", "six", "Doppler", "xenon", "period", "beta", "MTC"] as const;

export const TERM_DEFS: Record<string, string> = {
  D: "Diffusion coefficient. How far neutrons travel before interaction.",
  "∇²φ": "Laplacian of flux. Net leakage out of a control volume.",
  "Σ_a": "Macroscopic absorption. Removal by capture or fission.",
  "Σ_s1→2": "Fast→thermal down-scatter. Couples the two groups.",
  "νΣ_f": "Neutrons produced per fission × fission XS. Source term.",
  k: "Effective multiplication. Critical when k = 1.",
  "B²": "Geometric buckling. Larger cores leak less.",
  PNL: "Non-leakage probability. Neutrons that stay in-system.",
  "k∞": "Infinite-medium multiplication. Material property.",
  Fq: "Peaking factor. Max local power / average. Shuffle moves Fq.",
};

export type TermLesson = {
  id: string;
  title: string;
  plain: string;
  steps: string[];
  what: string;
  equation: string;
  where: string;
  why: string;
};

export const TERM_LESSONS: Record<string, TermLesson> = {
  D: {
    id: "D",
    title: "D — how far a neutron wanders",
    plain:
      "Pretend a neutron is a marble in a crowded room. D (the diffusion coefficient) is how easily that marble drifts from a packed corner into an empty one. A large D means long, free flights — the marble sails before it hits anyone. A small D means it rattles in place, bouncing off water or graphite every millimetre. In a PWR the thermal group has a small D (water is in the way). The fast group has a larger D (those neutrons are still sprinting). We never ‘want more D.’ We want D that matches the courier we actually have, so the leak we budget is the leak we get.",
    steps: [
      "A fission is born. The new neutrons are fast — high energy, large D, they stream.",
      "Each scatter off hydrogen (water) or carbon (graphite) kills a bit of that speed. Mean free path shrinks. D falls.",
      "Fick’s law: they do not drift at random forever. They drift DOWN the crowd. J = −D ∇φ. High flux to low flux.",
      "If D is large and the core is small, many of them walk out the side before they fission. That is leakage. Heat that never gets made still had to be planned for as if it were.",
      "OpenMC does not use D. It flies each neutron. D is the classroom average of those flights.",
    ],
    what: "D is the constant in Fick’s law that turns a flux slope into a neutron current. In P1 / diffusion theory, D ≈ 1/(3 Σ_tr). Σ_tr is the transport (almost-scatter) cross section. More scatter → smaller D → neutrons stay local.",
    equation: "J = −D ∇φ\n−D ∇²φ   leakage term in the balance\nD ≈ 1 / (3 Σ_tr)\nLeakage sink in a buckled core: D B² φ",
    where: "In front of ∇²φ in every energy group. Rod card: we set ∇²φ = 0 so D drops out of k∞ — an infinite pin has nowhere to wander to. Assembly and core: D × B² is the leak budget. Reflector lowers the effective current at the edge; we teach that as a PNL bonus, not as a new D.",
    why: "Watching only k hides why a small core is needy. Same fuel, larger D or smaller R, more DB², lower k_eff. The neutrons that leave do not heat the courier. Catch the geometry, not the marble.",
  },
  "∇²φ": {
    id: "∇²φ",
    title: "∇²φ — the flux’s curvature (leak, in a picture)",
    plain:
      "Draw the neutron crowd as a hill. High in the middle of the core, low at the steel wall. ∇²φ is how bowed that hill is. A flat table (infinite pin, mirrors on every side) has ∇²φ = 0: as many marbles enter a box as leave it. A bowed hill means the crowd is draining toward the edge. That drain is leakage. Same fuel, three k’s on the ladder, because we allow the hill to exist at assembly and core and we forbid it at the rod.",
    steps: [
      "Rod: mirrors. The hill is forbidden. ∇²φ = 0. k collapses to a material ratio k∞ = νΣ_f / Σ_a.",
      "Assembly: still mirrored on the four sides, but the assembly has a top and a bottom. A little bow along z. A little leak.",
      "Core: the hill must fit inside the vessel. Bare edge → flux goes to zero at the boundary → tight bow → large leak.",
      "A cosine hill φ = φ₀ cos(B x) has ∇²φ = −B² φ. The leak term −D∇²φ becomes + D B² φ, a sink that looks like extra absorption.",
      "Physically: a neutron at the edge is more likely to take one more flight and never come back. The Laplacian is that sentence in calculus.",
    ],
    what: "The Laplacian of flux is the net streaming out of a tiny volume. Combined with D it is leakage. On a bare reactor the lowest mode is a cosine (or Bessel in a cylinder), and ∇²φ = −B² φ with B² the geometric buckling.",
    equation: "−D ∇²φ + Σ_a φ = (1/k) νΣ_f φ\nIf φ ≈ φ₀ cos(B x):  ∇²φ = −B² φ\nso  (D B² + Σ_a) φ = (1/k) νΣ_f φ",
    where: "Rod: forced to zero. Assembly: axial only. Core: radial + axial, B² = B²_r + B²_z. Size class in the designer changes B². Full-core shuffle does not change ∇²φ of the fundamental mode much; it changes local φ, which is Fq.",
    why: "This is the term that makes a pin not a plant. If you skip it you will export a lattice that sings on the rod card and goes subcritical in the hall. Teaching model — not a license.",
  },
  "Σ_a": {
    id: "Σ_a",
    title: "Σ_a — the chance a neutron is eaten",
    plain:
      "Every centimetre a neutron travels, there is a chance it is absorbed instead of scattered. That chance per centimetre is Σ_a. Absorption is two families: capture (the nucleus keeps the neutron — boron, xenon, U-238) and fission (the nucleus splits — U-235, Pu-239). Capture is a loss. Fission is a loss of THAT neutron and a birth of new ones, which we count on the other side of the equation as νΣ_f. Enrichment raises fission more than capture, so k∞ climbs. Burnup, xenon, and boron raise capture, so k∞ falls. You hold a core by moving Σ_a, not by wishing on k.",
    steps: [
      "A thermal neutron sees a U-235 nucleus. σ_f is large. That is the useful part of Σ_a.",
      "It might instead see U-238, boron, xenon-135, or a structure bit. Capture. The neutron is gone. No new family.",
      "Σ_a = N σ_a. More atoms (N) or stickier atoms (σ) both raise it. Poison is a knob on N and σ.",
      "In two-group, the thermal group carries most of Σ_a for a PWR. Fast absorption exists but is smaller. That is why voiding water (BWR) or swapping in salt (MSR) changes the story: the neutron never reaches the sticky thermal energy.",
      "Depletion in this classroom raises Σ_a (and drops νΣ_f) with the burnup slider. OpenMC will tally the real isotopes. Our slider is a proxy so you can feel the direction.",
    ],
    what: "Macroscopic absorption cross section. Probability per centimetre of travel that the neutron is absorbed (capture + fission). Σ_a = Σ_c + Σ_f.",
    equation: "Σ_a = N σ_a = Σ_c + Σ_f\nTwo-group thermal: −D₂∇²φ₂ + Σ_a2 φ₂ = Σ_s1→2 φ₁\nk∞ (one-group) = νΣ_f / Σ_a",
    where: "The sink on the left-hand side at every scale. Denominator of k∞ on the rod. Burnup and depletion toggles move it. Control rods and boron in a real PWR are Σ_a you can walk to. We do not simulate rods here; we name them.",
    why: "Enrichment without a poison plan is heroics. A core you cannot hold with boron or burnable poison is a core you cannot catch. Heat still has to leave with the courier you actually have.",
  },
  "Σ_s1→2": {
    id: "Σ_s1→2",
    title: "Σ_s1→2 — slowing down (fast becomes thermal)",
    plain:
      "Fission neutrons are born fast, like thrown stones. A thermal reactor needs them slow, like rolling marbles, because U-235 fissions much more readily when they are slow. Slowing down is scattering: a neutron hits a light nucleus (hydrogen in water is the polite one), gives away energy, and after enough hits it has joined the thermal crowd. Σ_s1→2 is the classroom lump of that whole staircase — the rate at which the fast group feeds the thermal group. Without it, group 2 has no source, and a PWR has no business being thermal.",
    steps: [
      "Birth: ~2 MeV, fast group. High D, low fission chance in U-235.",
      "Hit hydrogen. The proton is about the same mass, so the neutron can lose a lot of energy in one hit. Water is a good moderator. Graphite takes more hits. Helium takes more still.",
      "After enough hits the neutron is in equilibrium with the water’s temperature — thermal. That is group 2.",
      "Σ_s1→2 is the coupling: it is a sink in the fast equation (removal) and the source in the thermal equation.",
      "If you void the water (BWR steam, accident, or a thought experiment) Σ_s1→2 falls. Fewer neutrons reach thermal. In a PWR that usually drops k (under-moderation). Spectrum, courier, and heat are the same people.",
    ],
    what: "The group-transfer (downscatter) cross section from fast to thermal. In two-group theory it is the only conversation between the groups. Removal in group 1 includes Σ_s1→2; the thermal source is exactly that term times φ₁.",
    equation: "−D₁∇²φ₁ + Σ_r1 φ₁ = (1/k) νΣ_f2 φ₂\n−D₂∇²φ₂ + Σ_a2 φ₂ = Σ_s1→2 φ₁\nΣ_r1 = Σ_a1 + Σ_s1→2   (fast removal)",
    where: "Written in full on the rod card. Assembly and core inherit it inside k∞. PWR/BWR: hydrogen in water. Pebble: graphite + helium. MSR: graphite + salt. Change the courier, change this term.",
    why: "It is why this site is a PWR and not a fast reactor, and why steam in a BWR is not just a heat story. The thing that carries heat is also the thing that slows neutrons. One law.",
  },
  "νΣ_f": {
    id: "νΣ_f",
    title: "νΣ_f — new neutrons from a split",
    plain:
      "When a nucleus fissions it does two jobs: it dumps heat into the fuel (that is the power you sell) and it throws out new neutrons, about 2.4 on average for thermal U-235 (that number is ν). Σ_f is how often fission happens per centimetre of travel. Multiply them: νΣ_f is the birth rate of the next generation. On the equation it is the only term that can make k reach 1. Everything else is a loss — absorption that is not fission, and leak. Enrichment raises νΣ_f. Burnup lowers it as U-235 is eaten and poisons grow. You do not ‘max’ this. You hold it against the losses while heat still leaves.",
    steps: [
      "Thermal neutron + U-235 → compound nucleus → split.",
      "Fragments dump kinetic energy as heat in the pellet. That heat has to reach the clad, then the water, then the steam generator. Q = ṁ cp ΔT still applies.",
      "Prompt neutrons fly out immediately (fast). A few delayed neutrons come later from the fragments — those are how you control a real core in time. This classroom eigenvalue ignores time.",
      "ν (~2.4) new neutrons per fission, times how often fission happens (Σ_f), is the source (1/k) νΣ_f φ.",
      "The 1/k is the trick: we scale the source until the balance is steady. The k that does that is k_eff.",
    ],
    what: "Fission source. ν = neutrons emitted per fission (prompt + delayed, in the eigenvalue). Σ_f = macroscopic fission cross section. In two-group PWR teaching, most fissions are thermal (νΣ_f2 φ₂) and the births are placed into the fast group.",
    equation: "Source = (1/k) νΣ_f φ\nTwo-group: (1/k) νΣ_f2 φ₂  on the fast right-hand side\nk∞ ≈ νΣ_f / Σ_a   when ∇²φ = 0",
    where: "Right-hand side at every scale. Enrichment slider. Burnup slider. OpenMC samples ν from the nuclear data. Our k-ladder only pretends, so you can see the direction before you download the .py.",
    why: "The only term that can pay for Σ_a and leakage. Design is keeping this honest, not brave. A pin that fissions and cannot dump heat is a pin you catch before Friday.",
  },
  k: {
    id: "k",
    title: "k — does the next generation replace this one?",
    plain:
      "k is a headcount. Take every neutron that is born this generation. How many will be born in the next, after scatter, absorb, fission, and leak? If k = 1, the crowd stays the same: critical, steady power. If k > 1 the crowd grows (power would rise). If k < 1 the crowd shrinks. Operators live at k ≈ 1 with rods and boron as spare Σ_a. You do not hunt a high k. You hunt a k you can hold, with heat that still leaves. The numbers on these cards are teaching proxies. The downloaded OpenMC script is what will actually eigenvalue on your machine.",
    steps: [
      "Start with a generation of neutrons (the source).",
      "Some leak (D, ∇²φ, B², PNL).",
      "Some are captured (the non-fission part of Σ_a).",
      "Some fission and pay ν new neutrons (νΣ_f).",
      "k is births next / births now. The eigenvalue form puts 1/k on the source so we can solve a steady equation even when the real k is not 1.",
    ],
    what: "Effective multiplication factor k_eff. The number you divide the fission source by to hold a steady balance. Critical at 1. The k-ladder here is k∞ × PNL at three scales. Not OpenMC. Not a license.",
    equation: "−D∇²φ + Σ_a φ = (1/k) νΣ_f φ\nk_eff = k∞ · PNL\nCritical when k_eff = 1",
    where: "Every card. Rod ≈ k∞. Assembly ≈ k∞ × PNL_asm. Core ≈ k∞ × PNL_core(size, reflector, lattice). Toggles (depletion, full-core, reflector) move this number on purpose so you can watch the story, not so you can quote it.",
    why: "A plant is not a high score. Catch is k you understand. Heroics is k you brag about. The courier still has to leave with the heat.",
  },
  "B²": {
    id: "B²",
    title: "B² — how hard the core is squeezed",
    plain:
      "Buckling is a size-and-shape number. A small core must bow its flux tightly to hit zero (or a small value) at the edge. That tight bow is a large B², which means a large leak (D B²). A large core is almost flat in the middle — small B², most neutrons never see the wall. For a bare cylinder the textbook is B² = (2.405/R)² + (π/H)². Bigger R or H, smaller B², higher k_eff for the same lattice. That is why a pin critical is not a plant critical, and why ‘this site’ versus ‘small’ on the designer is a leakage decision, not a fashion.",
    steps: [
      "The flux must fit the vessel. Boundary condition: φ small at the edge (bare) or φ slope set by a reflector.",
      "The simplest hill that fits is a cosine (slab) or a J0 Bessel (cylinder).",
      "That hill has a curvature B². ∇²φ = −B² φ.",
      "Leakage sink = D B² φ. Same units as Σ_a φ. Extra ‘absorption’ that is really walking out the door.",
      "Reflector: the hill does not have to hit zero as soon. Effective size grows. We teach it as a PNL bonus.",
    ],
    what: "Geometric buckling. The eigenvalue of the Laplacian for the flux mode that fits the geometry. Larger B² = smaller, leakier machine.",
    equation: "∇²φ = −B² φ\nBare cylinder: B² = (2.405/R)² + (π/H)²\nk_eff ≈ k∞ / (1 + L² B²)    (one-group, L² = D/Σ_a)",
    where: "Core scale. Size class (small / this site / large) in the designer. Reflector toggle. Not on the rod card (B² = 0 by fiat). OpenMC never writes B²; the geometry is the geometry.",
    why: "So you do not ship a lattice from the pin and call it a plant. Same fuel, smaller stack, larger B², lower k. The hall is a leakage argument.",
  },
  PNL: {
    id: "PNL",
    title: "PNL — the neutrons that stayed",
    plain:
      "Non-leakage probability is the honest name for ‘we did not lose them out the side.’ PNL = 1 is an infinite medium: every neutron is absorbed somewhere in the fuel-moderator mix. Every real machine has PNL < 1. We split it for teaching: a pin with mirrors is almost 1 (0.998), an assembly leaks a little out the top and bottom (0.985), a core leaks out the vessel (0.90–0.97 depending on size and reflector). k_eff = k∞ × PNL. If k∞ is 1.04 and PNL is 0.94, the plant is 0.98 — subcritical until you change fuel, size, or reflector. That is not a bug. That is the ladder doing its job.",
    steps: [
      "Born. Fast. May leak while still fast (fast non-leakage).",
      "Slows down. May leak while slowing (we lump this).",
      "Thermal. May leak before absorption (thermal non-leakage).",
      "PNL is the product of those survivals. One-group classroom: PNL ≈ 1/(1 + L² B²).",
      "Reflector sends some of the walkers back. PNL goes up. Full-core lattice does not change PNL much; it changes where the ones that stayed deposit heat (Fq).",
    ],
    what: "Probability a neutron is absorbed in the system rather than leaking. k_eff = k∞ · PNL. OpenMC measures this with tallies, not with a factor.",
    equation: "k_eff = k∞ · PNL\nPNL ≈ 1 / (1 + L² B²)\nThis ladder: k_rod ≈ k∞×0.998, k_asm ≈ k∞×0.985, k_core ≈ k∞×PNL_core",
    where: "The difference between the three cards. Size, reflector, full-core toggles move PNL_core. The rod is the k∞ classroom. The core is the PNL classroom.",
    why: "A catch is often a leak you did not write down. Name it PNL and you will not confuse a pin with a plant.",
  },
  "k∞": {
    id: "k∞",
    title: "k∞ — the lattice, if it went on forever",
    plain:
      "k-infinity is the multiplication of the fuel-moderator pattern with no edge. No vessel. No leak. ∇²φ = 0. It answers: is this mix even capable of a chain, before we ask whether the tank is big enough? Enrichment, water-to-fuel ratio, poison, temperature, and burnup all live here. It is a material / cell property, not a plant property. A lattice can have k∞ = 1.04 and a core k = 0.98 because PNL = 0.94. Both numbers are true. Confusing them is how a pin becomes a slogan.",
    steps: [
      "Build one pin (or one pebble, or one salt channel) and mirror it forever.",
      "No Laplacian. Balance is births versus absorptions: k∞ = νΣ_f / Σ_a (one-group).",
      "Two-group: fast and thermal talk through Σ_s1→2. The 2×2 matrix still has an eigenvalue k∞.",
      "Enrichment, type (PWR/BWR/pebble/MSR), and burnup move k∞ on these cards.",
      "Then we multiply by PNL to get the plant. That is the ladder.",
    ],
    what: "Infinite-medium multiplication. The eigenvalue of the lattice with leakage forbidden. Teaching proxy on the rod card. OpenMC can compute a real k∞ with reflective boundaries; the download does that when you pick rod scale.",
    equation: "k∞ = νΣ_f / Σ_a     (one-group)\nTwo-group: k∞ from the removal/fission matrix at ∇² = 0\nk_eff = k∞ · PNL",
    where: "Rod card. Enrichment and burnup sliders. Plant type applies a small spectrum factor so pebble/MSR/BWR do not lie with a PWR’s k∞. Core card then applies PNL.",
    why: "So you can change the mix with one hand and the tank with the other. Catch is knowing which hand you are using.",
  },
  Fq: {
    id: "Fq",
    title: "F_q — the hottest pin versus the average",
    plain:
      "k = 1 means the core as a WHOLE is steady. It does not mean every assembly is polite. F_q is the loudest local heat flux divided by the average. Fresh fuel in the middle shouts. Burned fuel on the rim is quieter. A shuffle map is how you keep F_q from becoming a personality: once- and twice-burned toward the centre, fresh toward the edge, so the hill of power is flatter. The courier still has to carry the peak, not the average. Q = ṁ cp ΔT for the loop; q' for the pin. If F_q is high, one pin asks the water for more than the loop’s average promised.",
    steps: [
      "Power is not flat. Cosine hill plus enrichment differences plus burnup.",
      "q''_max / q''_avg = F_q. Design limits live on the max, not the mean.",
      "Friday shuffle stamps which assembly is fresh, once-burned, twice-burned.",
      "The k-ladder does not see F_q. The shuffle mini-game does. The OpenMC export, with full-core on, can too — as a teaching lattice, not a license.",
      "A catch here is moving an assembly, not turning a pump. Heat still has to leave through the same water.",
    ],
    what: "Nuclear heat-flux peaking factor. Max local heat flux over core-average heat flux. Related to, but not the same as, F_ΔH (enthalpy rise) and F_Q (power peaking). We teach one name so the map has a handle.",
    equation: "F_q = q''_max / q''_avg\nq' (kW/m) still leaves through the clad to the courier\nShuffle map → local enrich / burnup → local q'",
    where: "Full-core scale, Friday shuffle, OpenMC export when full-core lattice is on. Not on the rod card. A uniform core assumption hides F_q — that is why the toggle exists.",
    why: "k = 1 can still scald a pin. Catch the map. Do not hero the eigenvalue.",
  },
  pellet: {
    id: "pellet",
    title: "Fuel pellet — where the split happens",
    plain:
      "The pellet is a ceramic cylinder of UO₂, stacked inside the clad. Fission heat is born here, not in the water. Fragments dump their kinetic energy within micrometres. The pellet must conduct that heat to the gap, then the clad, then the courier. Enrichment is a property of this ceramic, not of the plant. A cracked pellet is a chemistry problem the water should never have to meet.",
    steps: [
      "U-235 in the ceramic absorbs a thermal neutron and splits.",
      "Fragments stop in the pellet. That stop is heat.",
      "Heat walks: pellet → gap gas → clad → water.",
      "Fission gas builds with burnup. The pellet swells. The gap is a budget.",
      "OpenMC models the pellet as a cylinder of UO₂. The download does that.",
    ],
    what: "Sintered uranium dioxide ceramic. Source of both neutrons (νΣ_f lives here) and heat (q').",
    equation: "q' (kW/m) born in the pellet\nQ = ṁ cp ΔT still has to carry it in the loop",
    where: "Rod card. Enrichment slider. OpenMC fuel material. Not a slogan on the vessel.",
    why: "If the pellet cannot dump heat, k is a vanity. Catch the gap before Friday.",
  },
  clad: {
    id: "clad",
    title: "Clad — the first wall the water is allowed to see",
    plain:
      "Zirconium alloy tube. It holds the pellets, keeps fission products off the courier, and is thin enough that heat can leave. It is not armor. It is a promise: the water stays water, the fuel stays fuel. A scratch, a hydride, a departure from nucleate boiling — those are clad stories. LOTOTO and dose stickers live downstream of this wall. You do not ‘toughen’ clad. You keep the courier honest so clad never has to be brave.",
    steps: [
      "Pellet heat crosses the gap.",
      "Clad conducts. Outside surface sees the water.",
      "If the water leaves (dryout, DNB), clad temperature runs.",
      "Integrity is chemistry plus heat plus time. Not a poster.",
      "We do not simulate failure here. We name the wall so you know what Tommy is tagging.",
    ],
    what: "Fuel-rod sheath. First fission-product barrier. Thermal path from pellet to coolant.",
    equation: "q'' at the outer surface = the water’s job\nALARA starts after this wall holds",
    where: "Rod and assembly cards. Maintenance hang-tag is about staying out of what this wall protects you from.",
    why: "Heroics is running closer to the limit. Catch is leaving margin on the wall you cannot see.",
  },
  moderator: {
    id: "moderator",
    title: "Moderator — the thing that slows the stone into a marble",
    plain:
      "Fission neutrons are born fast. U-235 fissions when they are slow. A moderator is a light nucleus the neutron can hit and lose energy to. Water (hydrogen) is the polite one: similar mass, big energy loss per hit. Graphite takes more hits. Helium in a pebble bed is a courier more than a moderator — the graphite pebble does that job. The same water that slows neutrons also carries heat in a PWR. That is one law, not two systems.",
    steps: [
      "Fast neutron hits hydrogen.",
      "Energy drops. After enough hits it is thermal.",
      "Σ_s1→2 is this staircase lumped.",
      "Void the water: less slow-down, spectrum hardens, k usually falls in a PWR.",
      "Pebble: graphite in the pebble, helium around. Different staircase, same sentence.",
    ],
    what: "Material that reduces neutron energy by scatter. In a PWR/BWR: the water. Pebble: graphite. MSR: graphite plus salt.",
    equation: "Σ_s1→2 is the classroom lump of slowing-down\nRemoval in group 1 includes this term",
    where: "Plant type picker. Σ_s1→2 lesson. Courier and moderator are the same people in a PWR.",
    why: "You cannot sell heat with a spectrum you did not slow. Catch the mix.",
  },
  coolant: {
    id: "coolant",
    title: "Coolant — the courier that has to leave",
    plain:
      "Whatever carries the heat is the courier. PWR: liquid water, high pressure, no bulk boil in the core. BWR: the same water is allowed to boil; steam is the product. Pebble: helium. MSR: salt. Q = ṁ cp ΔT (or h_fg if it boils). Inlet and outlet are the only pipes this classroom owes you. A k that cannot dump heat is not a plant. It is a story.",
    steps: [
      "Heat leaves the clad into the courier.",
      "Mass flow ṁ and temperature rise ΔT set how much Q you can carry.",
      "PWR: keep it liquid. Pressure is a promise.",
      "BWR: let it boil. Steam quality is the product.",
      "The designer sliders for flow and ΔT are this sentence, not decoration.",
    ],
    what: "Heat-transport fluid. In light-water plants it is also the moderator. Two jobs, one fluid.",
    equation: "Q = ṁ cp ΔT     (single-phase)\nQ = ṁ h_fg × quality     (boiling, BWR)",
    where: "Builder flow and ΔT. Live HUD inlet/outlet. Priya's bench.",
    why: "Catch is a courier that still leaves. Heroics is a k with nowhere for the heat to go.",
  },
  vessel: {
    id: "vessel",
    title: "Vessel — the tank the hill has to fit",
    plain:
      "The reactor pressure vessel is steel thick enough to hold the courier at temperature and pressure. Low-alloy carbon steel, stainless-clad on the wet face (a few millimetres — corrosion, not strength). Coolant hits the core barrel, down the downcomer, up the fuel, out the hot-leg nozzle. That path is the loop. Fast neutrons embrittle the beltline; plants treat the tank as irreplaceable. We draw a teaching cutaway. Not a license drawing. You do not walk into it.",
    steps: [
      "Steel wall. Pressure inside.",
      "Core barrel, fuel, water, all sit in this volume.",
      "B² comes from R and H of what fits in here.",
      "Inlet cold, outlet hot. Two pipes. That is the loop we teach.",
      "OpenMC’s geometry is a classroom cousin of this tank, not a copy.",
    ],
    what: "The pressure boundary around the core. Geometry for leakage. Not a character.",
    equation: "Bare cylinder: B² = (2.405/R)² + (π/H)²\nR and H are this vessel’s inside",
    where: "Core card. Size class. Live HUD cutaway. Glimpse through the reactor door.",
    why: "A pin is not a tank. Name the tank and you will not export a slogan.",
  },
  reflector: {
    id: "reflector",
    title: "Reflector — sending walkers back",
    plain:
      "A reflector is material at the edge that scatters neutrons back into the fuel instead of letting them vanish into steel or air. In a PWR the radial job is a steel baffle or a heavy reflector — stainless slabs around the lattice, cooling holes drilled through. Axial, the water above and below the core does the bouncing. Classroom effect: PNL goes up, the flux hill flattens, peripheral assemblies earn their keep, and the vessel sees less fast fluence. k∞ does not change. The toggle is that sentence. Not a number we claim.",
    steps: [
      "Neutron reaches the edge.",
      "Without a reflector: high chance of leak.",
      "With a reflector: scatter back. Second chance at fission.",
      "PNL bonus on the core card.",
      "Shuffle still decides where the ones that stayed deposit heat.",
    ],
    what: "Outer region that returns neutrons. Raises non-leakage. Does not change k∞.",
    equation: "k_eff = k∞ · PNL\nReflector → PNL ↑  (k∞ unchanged)",
    where: "Reflector toggle. Core k. Not on the rod card (no edge).",
    why: "So you do not enrich your way out of a leak you could have reflected.",
  },
  delayed: {
    id: "delayed",
    title: "Delayed neutrons — why you can hold a core in time",
    plain:
      "Most neutrons from fission fly out immediately — prompt. A few come later from a fragment that has to beta-decay first. Classic precursor: Br-87 sits ~56 s, then Kr-87 is born excited and sometimes emits a neutron. That wait is the whole trick. About 0.65% of U-235 neutrons are delayed. The picture is two beats: NOW the pellet splits, LATER one extra neutron leaves a leftover fragment. Not a control rod. This classroom k has no clock. We name the delay so you do not think k is a switch.",
    steps: [
      "Prompt neutrons: now.",
      "Fragments decay. Delayed neutrons: later.",
      "β ≈ 0.0065 for thermal U-235. Small. Decisive.",
      "Reactivity in dollars is measured against β.",
      "Our k-ladder has no time. The download’s eigenvalue neither. The floor does.",
    ],
    what: "Neutrons emitted by fission-product decay, not at the instant of fission. They set the controllable timescale.",
    equation: "ν = ν_p + ν_d\nβ = ν_d / ν\nThis k is steady-state. No β. Named, not simulated.",
    where: "νΣ_f lesson. DELAY.CAB plays the six groups. Named here so Academy is honest about what the cards skip.",
    why: "Catch is knowing the clock. Heroics is treating k as instant.",
  },
  six: {
    id: "six",
    title: "Six-factor — why a pin is not a plant",
    plain:
      "The six-factor formula is a story with six doors a neutron has to walk through before it pays for the next generation. Four of them live in the mix (that is k∞): fast fission ε, resonance escape p, thermal utilization f, reproduction η. Two of them live at the edge (that is PNL): fast non-leakage and thermal non-leakage. Multiply all six and you have k_eff. Our ladder is the same sentence in three rooms. Rod: mirrors, so the last two doors are almost 1. Assembly: a little leak out the top and bottom. Core: the tank. Confusing k∞ with k_eff is how a pin becomes a slogan.",
    steps: [
      "ε — a fast neutron fissions U-238 before it slows. A small bonus.",
      "p — it survives the resonance region without being captured. Water-to-fuel and Doppler live here.",
      "f — once thermal, it is absorbed in fuel rather than in water, clad, or xenon.",
      "η — when fuel absorbs it, fission pays ν new neutrons (reproduction).",
      "Then P_FNL and P_TNL: it did not walk out the side while fast, and did not walk out while thermal. k_eff = ε p f η × PNL.",
    ],
    what: "k∞ = ε · p · f · η. k_eff = k∞ · P_FNL · P_TNL. Classroom form of the same balance the two-group cards write as matrices.",
    equation: "k∞ = ε p f η\nk_eff = k∞ · PNL\nPNL = P_FNL · P_TNL\nThis ladder: k_rod ≈ k∞, k_core ≈ k∞ × PNL_core",
    where: "Rod card is εpfη. Core card multiplies PNL. Enrichment moves η and p. Size and reflector move the last two doors. Shuffle moves local f and Fq, not the six-factor itself.",
    why: "So you can change the mix with one hand and the tank with the other. Catch is knowing which door you are standing in.",
  },
  Doppler: {
    id: "Doppler",
    title: "Doppler — hot fuel catches more",
    plain:
      "Nuclei in a hot pellet jiggle. Their resonances smear in energy — Doppler broadening. A neutron flying through the U-238 resonance region sees a fatter trap and is more likely to be captured before it thermalizes. That drops p (resonance escape) and therefore k. It happens in the pellet, on the timescale of fuel temperature, which is faster than the water. Prompt, negative, automatic. A PWR is built to live on that slope. You do not ‘turn Doppler on.’ You keep the courier honest so the pellet does not have to be the only adult in the room.",
    steps: [
      "Fuel temperature rises. Resonances fatten.",
      "More capture in U-238. p falls. k falls.",
      "This is prompt — fuel heat, not moderator heat.",
      "Moderator temperature is a slower, separate story (density, slowing-down, MTC).",
      "Our k-ladder does not time this. We name it so you do not think k is only enrichment.",
    ],
    what: "Fuel-temperature coefficient of reactivity, dominated by U-238 resonance broadening. Negative in oxide fuel. Prompt.",
    equation: "T_fuel ↑  →  resonances broaden  →  p ↓  →  k∞ ↓\nα_D = ∂ρ / ∂T_fuel   < 0\nThis k is steady-state. Named, not simulated.",
    where: "Pellet lesson. Six-factor p. Not a slider. OpenMC can compute it with Doppler-broadened ACE data; the download is a teaching geometry, not that run.",
    why: "Catch is a core that argues with you when you heat it. Heroics is a coefficient you hoped was negative.",
  },
  xenon: {
    id: "xenon",
    title: "Xe-135 — the poison that grows after you stop",
    plain:
      "Xenon-135 has a gigantic thermal absorption cross section. It is born mostly from iodine-135 decay (~6.6 hours), not from the fission itself. In power, flux burns xenon out about as fast as iodine makes it. After a trip the flux dies. Iodine keeps decaying. Xenon climbs. Hours later you have a pit — a core that will not come back until the poison decays or you have boron and rods to pay for it. A restart through that cloud is heroics. This classroom has no clock. We name the pit so Friday is not a surprise.",
    steps: [
      "Fission makes I-135 (and some Xe-135).",
      "I-135 → Xe-135 on a ~6.6 h half-life.",
      "In flux, xenon burns out (n,γ). After a trip, burnout stops. Production from iodine does not.",
      "Peak poison hours later. k down. Restart margin is a plan, not a mood.",
      "Then xenon decays (~9.2 h). The pit empties. You wait, or you already accounted for it.",
    ],
    what: "Xe-135 is a fission-product poison. Transient after power changes. Not the same as samarium (which plateaus).",
    equation: "I-135 --β, ~6.6 h→ Xe-135\nXe-135 + n → Xe-136  (burnout in flux)\nAfter trip: burnout dies, iodine still feeds Xe  →  pit",
    where: "Named on the fuel-as-map page and here. Burnup slider is a steady poison lump, not a xenon transient. Do not quote it as a license calculation.",
    why: "Catch is knowing the core is still changing after the rods are in. Heroics is a restart because the board looks green.",
  },
  period: {
    id: "period",
    title: "Reactor period — the slope, not the switch",
    plain:
      "Period is the time for power to multiply by e if you left the reactivity alone. Think of it as the weather of the core: a gentle slope you can walk, or a cliff you do not live on. When delayed neutrons still matter (ρ < β), the period is long — seconds to minutes — because you are waiting on fragments to decay. When ρ reaches β, those delayed neutrons are no longer required and the period collapses to the prompt neutron lifetime, a fraction of a millisecond in a thermal lattice. The inhour equation is that sentence with more clothes on. This classroom k has no clock. We name the period so a jumping count rate is a Stop, not a vibe.",
    steps: [
      "A small positive ρ. Delayed neutrons still required. Power rises on a slope.",
      "T ≈ (β − ρ) / (λ̄ ρ). λ̄ is a lumped precursor decay (~0.1 /s classroom). Bigger ρ, shorter T.",
      "Count rate jumping means T is shrinking. Stop. Think. Do not pull more rods to 'catch' it.",
      "If ρ ≥ β the delayed fraction is spent. Prompt period T ≈ ℓ / ρ. ℓ ~ 10⁻⁴ s thermal. A cliff.",
      "Our k-ladder is steady-state. The floor is not. Priya names this so you do not treat k as a switch.",
    ],
    what: "Reactor period T is the e-folding time of neutron population (and, at constant delayed fraction, of power). Delayed-critical: seconds. Prompt-critical: milliseconds. Named, not simulated.",
    equation: "Delayed:  T ≈ (β − ρ) / (λ̄ ρ)\nPrompt:   T ≈ ℓ / ρ\nℓ ~ 10⁻⁴ s (thermal) ·  ρ = (k−1)/k\nThis k is steady-state. No clock.",
    where: "Academy period page. Reactivity quiz. Named next to delayed and β. Not a slider. OpenMC eigenvalue has no period either.",
    why: "Catch is a slope you can walk. Heroics is living on the cliff because the board went interesting.",
  },
  beta: {
    id: "beta",
    title: "β and dollars — how far you are from the cliff",
    plain:
      "β is the delayed-neutron fraction: of all neutrons born in a generation, how many come late from a decaying fragment instead of now from the split. Thermal U-235: about 0.65%. Plutonium-239: less, so a burned core has a smaller β_eff and a shorter leash. Reactivity in dollars is ρ / β. One dollar means ρ = β: prompt-critical, the delayed neutrons are no longer required to hold k, and the period becomes the prompt lifetime. You do not 'want more β.' You want to know where the cliff is so you never name it as a plan. This classroom does not sell dollars. We name them so k is not a trophy.",
    steps: [
      "Most fission neutrons are prompt (ν_p). A few are delayed (ν_d). β = ν_d / ν.",
      "U-235 thermal β ≈ 0.0065. Pu-239 is smaller. β_eff weights the mix and the leakage of delayed vs prompt (delayed are born a little slower).",
      "ρ ($) = ρ / β. Fifty cents is delayed-supercritical and still a slope. One dollar is the cliff.",
      "Control: rods and boron move ρ. Delayed neutrons give you time to move it. Prompt neutrons do not.",
      "Our k-ladder has no β. The download’s eigenvalue neither. The floor does. Name the cliff.",
    ],
    what: "β = delayed fraction. β_eff is the core’s effective delayed fraction. Dollar reactivity ρ($) = ρ/β. Prompt-critical at $1.",
    equation: "β = ν_d / ν        (~0.0065 U-235 thermal)\nρ = (k−1)/k\nρ($) = ρ / β\nPrompt-critical: ρ ≥ β  ($1)\nCirculating MSR: β_eff < β  (precursors born in the loop)",
    where: "Academy β page. Delayed lesson. Reactivity management. Salt page: circulating fuel lowers β_eff. Not a slider. Teaching proxy — not a license.",
    why: "Catch is knowing the clock. Heroics is treating k as instant, or quoting a dollar you did not earn.",
  },
  MTC: {
    id: "MTC",
    title: "MTC — the water argues slower than the pellet",
    plain:
      "Moderator temperature coefficient: what k does when the water gets hotter. In a PWR the lattice is built under-moderated, so hotter (thinner) water means less slowing-down, a harder spectrum, fewer thermal fissions, k down. Negative MTC is a catch you designed in. It is slower than Doppler because the pellet heats first and the water follows. Void coefficient is the cousin: steam in a BWR is designed the same way — more void, less moderation, k down. Positive MTC (over-moderated, or a boron-heavy beginning-of-cycle) is a slope you do not want to live on. This classroom does not time MTC. We name it so Doppler is not the only temperature story.",
    steps: [
      "Fuel heats. Doppler first (prompt, pellet, U-238 resonances).",
      "Heat reaches the water. Density drops. Less hydrogen per centimetre.",
      "Σ_s1→2 falls. Spectrum hardens. In an under-moderated PWR, k falls. That is MTC < 0.",
      "Boron in the water complicates it: hotter water also means less boron per centimetre, which can push MTC toward positive at high ppm. Beginning-of-cycle is the careful week.",
      "BWR void is the same sentence in steam. This site is a PWR. Void is not a knob here.",
    ],
    what: "Moderator temperature coefficient of reactivity α_M = ∂ρ / ∂T_mod. Negative in a well-designed PWR. Slower than Doppler. Distinct from void coefficient.",
    equation: "T_mod ↑  →  density ↓  →  slowing-down ↓  →  k∞ ↓   (under-moderated)\nα_M = ∂ρ / ∂T_mod   < 0  (design intent)\nDoppler is the pellet. MTC is the water.",
    where: "Academy Doppler/feedback page names both. Six-factor p and f. Plant type (PWR vs BWR). Not a slider.",
    why: "Catch is two temperatures, two timescales. Heroics is calling every drop in k 'Doppler' because that was the poster.",
  },
};


export interface KeffLadder {
  kInf: number;
  kRod: number;
  kAsm: number;
  kCore: number;
  pnlRod: number;
  pnlAsm: number;
  pnlCore: number;
  note: string;
}

export function computeKeff(p: PlantDesign): KeffLadder {
  const m = Math.max(0.5, Math.min(1.3, p.flow / 100));
  let kInf = 0.95 + (p.enrich - 3.0) * 0.06;
  kInf *= 0.92 + 0.08 * m;
  kInf -= p.burnupMWd_kg * (p.type === "msr" ? 0.002 : 0.0045);
  if (p.type === "bwr") kInf *= 0.97;
  if (p.type === "pebble") kInf *= 1.02;
  if (p.type === "msr") kInf *= 1.01;
  kInf = Math.max(0.7, Math.min(1.45, kInf));

  const pnlRod = 0.998;
  const pnlAsm = 0.985;
  let pnlCore = p.sizeClass === 0 ? 0.9 : p.sizeClass === 2 ? 0.97 : 0.94;
  if (p.reflector) pnlCore = Math.min(0.99, pnlCore + 0.025);
  if (p.fullCore) pnlCore = Math.min(0.99, pnlCore + 0.02);

  let note = "Teaching proxy — not OpenMC. ";
  if (p.depletion && p.burnupMWd_kg > 0) note += `Depletion ON: burnup ${p.burnupMWd_kg} MWd/kgU poisons k∞. `;
  else if (p.burnupMWd_kg > 0) note += "Burnup slider active. ";
  else note += "Fresh fuel assumed. ";
  if (p.type === "msr") note += "MSR: xenon leaves in the off-gas — burnup poison on this card is lighter. ";
  if (p.type === "pebble") note += "Pebble: TRISO / graphite spectrum. ";
  if (p.type === "bwr") note += "BWR: voided moderator, smaller ΔT. ";
  note += p.fullCore ? "Full-core lattice; shuffle can raise local Fq." : "Uniform core assumption.";

  return {
    kInf,
    kRod: kInf * pnlRod,
    kAsm: kInf * pnlAsm,
    kCore: kInf * pnlCore,
    pnlRod,
    pnlAsm,
    pnlCore,
    note,
  };
}

export function diffusionCopy(p: PlantDesign): { eq: string; note: string; terms: string[] } {
  const k = computeKeff(p);
  const size = ["small", "medium", "large"][p.sizeClass];
  if (p.scale === "rod") {
    return {
      eq: `INFINITE PIN (reflective)\n−D∇²φ → 0\nk∞ = νΣ_f / Σ_a\n\nTwo-group:\n−D₁∇²φ₁ + Σ_r1 φ₁ = (1/k) νΣ_f φ₂\n−D₂∇²φ₂ + Σ_a2 φ₂ = Σ_s1→2 φ₁\n∇²φ = 0 on the unit cell → algebraic k∞`,
      note: "Rod: leakage vanishes. Enrichment and moderator dominate.",
      terms: ["D", "∇²φ", "Σ_a", "Σ_s1→2", "νΣ_f", "k∞"],
    };
  }
  if (p.scale === "assembly") {
    return {
      eq: `ASSEMBLY LATTICE\n−D∇²φ + Σ_a φ = (1/k) νΣ_f φ\nRadial reflective · axial D B²_z leakage\n\nk_asm ≈ k∞ · PNL_asm ≈ ${k.kAsm.toFixed(3)}`,
      note: "Assembly: pins and guides. Small radial leak if reflected.",
      terms: ["D", "∇²φ", "Σ_a", "νΣ_f", "k", "PNL", "k∞"],
    };
  }
  return {
    eq: `FULL CORE\n−D∇²φ + Σ_a φ = (1/k) νΣ_f φ\nB² = B²_r + B²_z  (${size})\n${p.reflector ? "Reflector → albedo > 0" : "Bare boundary → higher leakage"}\n${p.fullCore ? "Shuffle map → local Fq" : "Uniform core"}\n\nk_core ≈ ${k.kCore.toFixed(3)}  (teaching proxy)`,
    note: "Core: buckling plus optional reflector. Shuffle sits at the end of the week.",
    terms: ["D", "∇²φ", "Σ_a", "νΣ_f", "k", "B²", "PNL", "k∞", "Fq"],
  };
}

export function kAt(p: PlantDesign, scale: DesignScale) {
  const k = computeKeff(p);
  return scale === "rod" ? k.kRod : scale === "assembly" ? k.kAsm : k.kCore;
}

export { generateOpenMCPython, downloadOpenMC } from "./openmcExport";
