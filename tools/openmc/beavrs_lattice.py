#!/usr/bin/env python3
"""
Make a lattice set for the Refuelling Outage in Coffee & Criticality, with OpenMC.

For each assembly type (enrichment, burnable absorber rods) this builds one BEAVRS 17x17 fuel assembly in 2D
with reflective sides, depletes it at the BEAVRS specific power, and records k-infinity against burnup. It then
writes one JSON file the game reads (paste it into the outage's "Use your own" box).

Everything geometric and every composition comes from the BEAVRS specification rev. 3.0.2 (MIT CRPG), through
beavrs_data.py: pin radii, pin and assembly pitch, absorber rod layers, and the atom densities of fuel,
borosilicate glass, SS304, Zircaloy-4, helium, air and borated water. Absorber rod layouts per rod count are the
ones the BEAVRS CASMO inputs use.

You need: OpenMC 0.15 or later with its Python API, a cross-section library (OPENMC_CROSS_SECTIONS pointing at
cross_sections.xml, e.g. ENDF/B-VIII.0 from openmc.org), and a depletion chain (e.g. chain_endfb80_pwr.xml).

Examples:
  python beavrs_lattice.py --chain chain_endfb80_pwr.xml --types 3.1/0 3.1/16 --out mine.json
  python beavrs_lattice.py --chain chain_endfb80_pwr.xml --state hfp0 --particles 20000 --out hfp.json

States:
  hzp975 (default): hot zero power, 975 ppm, water and fuel at 566 K. Same frame as the game's preset, so the
          game keeps the preset's hfpShift and boronWorth for this set unless you pass your own.
  hfp0:   hot full power, 0 ppm, fuel 900 K, water 580 K at 0.7119 g/cc (NUREG/IA-0529 Table 2-4). The script
          also runs one branch at 500 ppm to measure the boron worth, and sets hfpShift 0.

Run time: about an hour per type on a laptop at the default settings. Not run in the game's own test suite.
"""
import argparse
import json
import math
import sys

from beavrs_data import MATERIALS, PIN_MAPS

# BEAVRS spec rev. 3.0.2, Section 2 (sources 8-31).
PELLET_OR = 0.39218
CLAD_IR = 0.40005
CLAD_OR = 0.45720
GT_IR = 0.56134
GT_OR = 0.60198
BP_RADII = [0.21400, 0.23051, 0.24130, 0.42672, 0.43688, 0.48387]  # air, SS304, He, glass, He, SS304; then water, Zr
PIN_PITCH = 1.25984
ASSEMBLY_PITCH = 21.50364
SPECIFIC_POWER = 41.7  # W/gHM = MW/tHM, NUREG/IA-0529 Table 2-1
FUEL_KEYS = {1.6: "fuel16", 2.4: "fuel24", 3.1: "fuel31", 3.2: "fuel32", 3.4: "fuel34"}
DEFAULT_TYPES = ["1.6/0", "2.4/0", "2.4/12", "2.4/16", "3.1/0", "3.1/6", "3.1/15", "3.1/16", "3.1/20", "3.2/0", "3.2/4", "3.2/8", "3.2/12", "3.4/0"]
# Burnup points, MWd/kgHM. Fine at the start for xenon and absorber burnout.
BURNUP = [0.1, 0.4, 0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 2.0, 2.0, 2.0, 2.0, 2.0, 3.0, 3.0, 3.0, 4.0, 4.0, 5.0, 5.0, 5.0, 5.0]


def material(openmc, key, temperature, name=None, density_override=None, boron_ppm=None):
    spec = MATERIALS[key]
    m = openmc.Material(name=name or key, temperature=temperature)
    atoms = dict(spec["atoms"])
    if key == "water975" and (density_override is not None or boron_ppm is not None):
        # Rescale the spec's 975 ppm borated water to another density and boron level.
        rho = density_override if density_override is not None else spec["density"]
        scale = rho / spec["density"]
        b = 0.0 if boron_ppm is None else boron_ppm / 975.0
        atoms = {iso: (n * scale * (b if iso.startswith("B") else 1.0)) for iso, n in atoms.items()}
        atoms = {iso: n for iso, n in atoms.items() if n > 0}
    for iso, n in atoms.items():
        m.add_nuclide(iso, n)
    m.set_density("sum")
    if key == "water975" or key.startswith("water"):
        m.add_s_alpha_beta("c_H_in_H2O")
    return m


def build(openmc, e, ba, state, boron_ppm):
    hfp = state == "hfp0"
    t_fuel = 900.0 if hfp else 566.0
    t_mod = 580.0 if hfp else 566.0
    water = material(openmc, "water975", t_mod, "water", 0.7119 if hfp else None, boron_ppm)
    fuel = material(openmc, FUEL_KEYS[e], t_fuel, f"fuel {e}%")
    he = material(openmc, "helium", t_mod)
    zr = material(openmc, "zirc4", t_mod)
    ss = material(openmc, "ss304", t_mod)
    air = material(openmc, "air", t_mod)
    glass = material(openmc, "pyrex", t_mod, "borosilicate")
    pin_map = PIN_MAPS[str(ba)]
    n_fuel = sum(row.count("F") for row in pin_map)
    n_bp = sum(row.count("B") for row in pin_map)
    # 2D, 1 cm tall: volumes are cross-section areas.
    fuel.depletable = True
    fuel.volume = math.pi * PELLET_OR**2 * n_fuel
    if n_bp:
        glass.depletable = True
        glass.volume = math.pi * (BP_RADII[3] ** 2 - BP_RADII[2] ** 2) * n_bp

    def rings(radii, fills):
        cells = []
        prev = None
        for r, f in zip(radii, fills[:-1]):
            c = openmc.ZCylinder(r=r)
            cells.append(openmc.Cell(fill=f, region=(-c if prev is None else (+prev & -c))))
            prev = c
        cells.append(openmc.Cell(fill=fills[-1], region=+prev))
        return openmc.Universe(cells=cells)

    fuel_u = rings([PELLET_OR, CLAD_IR, CLAD_OR], [fuel, he, zr, water])
    tube_u = rings([GT_IR, GT_OR], [water, zr, water])
    bp_u = rings(BP_RADII + [GT_IR, GT_OR], [air, ss, he, glass, he, ss, water, zr, water])
    by = {"F": fuel_u, "G": tube_u, "I": tube_u, "B": bp_u}
    lat = openmc.RectLattice()
    lat.pitch = (PIN_PITCH, PIN_PITCH)
    lat.lower_left = (-17 * PIN_PITCH / 2, -17 * PIN_PITCH / 2)
    lat.universes = [[by[ch] for ch in row] for row in pin_map]
    water_u = openmc.Universe(cells=[openmc.Cell(fill=water)])
    lat.outer = water_u
    half = ASSEMBLY_PITCH / 2
    box = openmc.model.RectangularPrism(ASSEMBLY_PITCH, ASSEMBLY_PITCH, boundary_type="reflective")
    zlo = openmc.ZPlane(-0.5, boundary_type="reflective")
    zhi = openmc.ZPlane(0.5, boundary_type="reflective")
    root = openmc.Universe(cells=[openmc.Cell(fill=lat, region=-box & +zlo & -zhi)])
    model = openmc.Model()
    model.geometry = openmc.Geometry(root)
    model.materials = openmc.Materials([water, fuel, he, zr, ss, air, glass])
    s = openmc.Settings()
    # Libraries are tabulated at a few temperatures (e.g. 294, 600, 900 K); interpolate between them.
    s.temperature = {"method": "interpolation"}
    s.source = openmc.IndependentSource(space=openmc.stats.Box((-half, -half, -0.5), (half, half, 0.5)), constraints={"fissionable": True})
    model.settings = s
    return model


def run_type(openmc, deplete, e, ba, args):
    model = build(openmc, e, ba, args.state, 0.0 if args.state == "hfp0" else None)
    model.settings.particles = args.particles
    model.settings.batches = args.batches
    model.settings.inactive = args.inactive
    op = deplete.CoupledOperator(model, args.chain)
    deplete.CECMIntegrator(op, BURNUP, power_density=SPECIFIC_POWER, timestep_units="MWd/kg").integrate()
    res = deplete.Results("depletion_results.h5")
    days, k = res.get_keff(time_units="d")
    return [[round(d * SPECIFIC_POWER / 1000.0, 4), round(float(kk[0]), 5)] for d, kk in zip(days, k)]


def boron_worth(openmc, args):
    """k-infinity per ppm, from 0 and 500 ppm at BOL, 3.1% no absorbers. Only for the hfp0 state."""
    ks = []
    for ppm in (0.0, 500.0):
        model = build(openmc, 3.1, 0, "hfp0", ppm)
        model.settings.particles = args.particles
        model.settings.batches = args.batches
        model.settings.inactive = args.inactive
        sp = model.run()
        with openmc.StatePoint(sp) as st:
            ks.append(st.keff.nominal_value)
    return (ks[1] - ks[0]) / 500.0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--chain", required=True, help="depletion chain XML, e.g. chain_endfb80_pwr.xml")
    ap.add_argument("--types", nargs="+", default=DEFAULT_TYPES, help="enrichment/absorber rods, e.g. 3.1/16")
    ap.add_argument("--state", choices=["hzp975", "hfp0"], default="hzp975")
    ap.add_argument("--particles", type=int, default=10000)
    ap.add_argument("--batches", type=int, default=100)
    ap.add_argument("--inactive", type=int, default=20)
    ap.add_argument("--name", default="My OpenMC lattice set")
    ap.add_argument("--out", default="lattice_set.json")
    args = ap.parse_args()
    try:
        import openmc
        import openmc.deplete as deplete
    except ImportError:
        sys.exit("OpenMC's Python API is not installed. See https://docs.openmc.org/en/stable/quickinstall.html")
    curves = []
    for t in args.types:
        e_s, ba_s = t.split("/")
        e, ba = float(e_s), int(ba_s)
        if e not in FUEL_KEYS or str(ba) not in PIN_MAPS:
            sys.exit(f"No BEAVRS data for {t}. Enrichments: {sorted(FUEL_KEYS)}; absorber counts: {sorted(map(int, PIN_MAPS))}")
        print(f"--- {e}% with {ba} absorber rods")
        curves.append({"e": e, "ba": ba, "k": run_type(openmc, deplete, e, ba, args)})
    if args.state == "hfp0":
        ref, shift, worth = 0, 0.0, boron_worth(openmc, args)
        reference = "Hot full power, 0 ppm, fuel 900 K, water 580 K at 0.7119 g/cc. Xenon builds in after the first step."
    else:
        # Same frame as the preset. The game's fitted shift and worth for that frame are kept.
        ref, shift, worth = 975, None, None
        reference = "Hot zero power, 975 ppm, 566 K."
    out = {
        "version": 1,
        "name": args.name,
        "source": f"OpenMC {openmc.__version__}, BEAVRS 2D assemblies, {args.particles} particles x {args.batches} batches, CECM depletion at {SPECIFIC_POWER} W/gHM, chain {args.chain}.",
        "reference": reference,
        "refBoronPpm": ref,
        "hfpShift": shift,
        "boronWorth": worth,
        "curves": curves,
    }
    if shift is None:
        # The game fills these from its preset when they are null; see the outage's "Use your own" note.
        out["hfpShift"] = "preset"
        out["boronWorth"] = "preset"
    with open(args.out, "w") as f:
        json.dump(out, f, indent=1)
    print(f"Wrote {args.out}. Paste its contents into the Refuelling Outage, under Data, Use your own.")


if __name__ == "__main__":
    main()
