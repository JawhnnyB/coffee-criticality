/**
 * OpenMC Python export — teaching models patterned on
 * docs.openmc.org examples (pwr_pin_cell / pwr_assembly, BEAVRS radii).
 * Runnable if OpenMC + ENDF/B cross_sections.xml are installed.
 * NOT a license. NOT a design basis. Game k-numbers stay proxies.
 */
import type { PlantDesign, ShuffleCell } from "./plant";

const FUEL_R = 0.39218;
const CLAD_R = 0.45720;
const PITCH_PWR = 1.26;
const PITCH_BWR = 1.62;

const GUIDES_17: string = `[
    (2,5),(2,8),(2,11),
    (5,2),(5,5),(5,8),(5,11),(5,14),
    (8,2),(8,5),(8,8),(8,11),(8,14),
    (11,2),(11,5),(11,8),(11,11),(11,14),
    (14,5),(14,8),(14,11),
]`;

function num(n: number, d = 5): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(d);
}

function header(p: PlantDesign): string {
  const scale =
    p.scale === "rod" ? "infinite pin (reflective XY)" : p.scale === "assembly" ? "17x17 reflected assembly" : "classroom core lattice";
  return `#!/usr/bin/env python3
"""
Coffee & Criticality — OpenMC teaching model
Patterned on OpenMC examples.pwr_pin_cell / pwr_assembly (BEAVRS pin radii).
https://docs.openmc.org/en/stable/pythonapi/generated/openmc.examples.html

TEACHING MODEL ONLY — not a license, not a design basis, not a criticality
safety evaluation. Geometry is classroom-sized. k from this script is OpenMC's;
k in the game HUD is a separate proxy.

Requires:
  pip install openmc openmc-data-downloader
  First run downloads a MINIMAL nuclide set (U, O, Zr, H, …) from
  OpenMC-data-storage (ENDF/B-VII.1 then TENDL-2019). Cached next to this file.
  Official full libraries (multi-GB): https://openmc.org/data/
    ENDF/B-VIII.0  https://anl.box.com/shared/static/uhbxlrx7hvxqw27psymfbhi7bx7s6u6a.xz
    ENDF/B-VII.1   https://anl.box.com/shared/static/9igk353zpy8fn9ttvtrqgzvw1vtejoz6.xz

Plant: type=${p.type}  scale=${p.scale} (${scale})
       power_MWe=${p.powerMW}  dT_C=${p.dT}  flow_pct=${p.flow}
       enrich_w/o=${p.enrich}  T_fuel_K=${p.fuelTempK}  T_cool_K=${p.coolantTempK}
       depletion=${p.depletion}  full_core=${p.fullCore}  reflector=${p.reflector}
       burnup_MWd_kgU=${p.burnupMWd_kg}
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import openmc

# Official OpenMC HDF5 libraries (full, multi-GB) — https://openmc.org/data/
OFFICIAL_XS = {
    "ENDF/B-VIII.0": "https://anl.box.com/shared/static/uhbxlrx7hvxqw27psymfbhi7bx7s6u6a.xz",
    "ENDF/B-VII.1": "https://anl.box.com/shared/static/9igk353zpy8fn9ttvtrqgzvw1vtejoz6.xz",
}

# Minimal nuclides: OpenMC-data-storage via openmc-data-downloader (not the full tarball)
XS_LIBS = ["ENDFB-7.1-NNDC", "TENDL-2019"]


def ensure_cross_sections(mats: openmc.Materials) -> str:
    """Use an existing library, or download only the nuclides this model needs."""
    existing = os.environ.get("OPENMC_CROSS_SECTIONS", "")
    if existing and Path(existing).is_file():
        print("Using OPENMC_CROSS_SECTIONS =", existing)
        return existing

    cache = Path(__file__).resolve().parent / "openmc_xs"
    cache.mkdir(exist_ok=True)
    xml = cache / "cross_sections.xml"
    if xml.is_file():
        os.environ["OPENMC_CROSS_SECTIONS"] = str(xml)
        print("Using cached library", xml)
        return str(xml)

    try:
        import openmc_data_downloader as odd
    except ImportError:
        print("Installing openmc-data-downloader (minimal nuclide fetch)…")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "openmc-data-downloader"])
        import openmc_data_downloader as odd  # type: ignore

    print("Fetching classroom nuclides from OpenMC-data-storage:", XS_LIBS)
    print("Source: https://github.com/openmc-data-storage  |  full libs: https://openmc.org/data/")
    here = Path.cwd()
    os.chdir(cache)
    try:
        odd.download_cross_section_data(
            mats,
            libraries=XS_LIBS,
            set_OPENMC_CROSS_SECTIONS=True,
            particles=["neutron"],
        )
    finally:
        os.chdir(here)

    found = cache / "cross_sections.xml"
    if not found.is_file():
        for p in cache.rglob("cross_sections.xml"):
            found = p
            break
    if not found.is_file():
        raise SystemExit(
            "Could not fetch a minimal library. Set OPENMC_CROSS_SECTIONS yourself\\n"
            "or download a full HDF5 pack from https://openmc.org/data/"
        )
    os.environ["OPENMC_CROSS_SECTIONS"] = str(found)
    try:
        openmc.config["cross_sections"] = str(found)
    except Exception:
        pass
    print("OPENMC_CROSS_SECTIONS =", found)
    return str(found)


# ---------------------------------------------------------------------------
# Materials — enrichment, density, and temperature come from the designer.
# add_element(..., enrichment=) is the OpenMC API for U-235/U-238 split.
# ---------------------------------------------------------------------------
`;
}

function materialsLWR(p: PlantDesign): string {
  const waterName = p.type === "bwr" ? "voided_water" : "light_water";
  const rho = p.type === "bwr" ? p.coolantDensity * 0.55 : p.coolantDensity;
  return `
fuel = openmc.Material(name="UO2")
fuel.temperature = ${num(p.fuelTempK, 1)}
fuel.set_density("g/cm3", ${num(p.fuelDensity, 4)})
fuel.add_element("U", 1.0, enrichment=${num(p.enrich, 2)})
fuel.add_element("O", 2.0)

clad = openmc.Material(name="zircaloy")
clad.temperature = ${num(p.coolantTempK, 1)}
clad.set_density("g/cm3", 6.55)
clad.add_element("Zr", 1.0)

water = openmc.Material(name="${waterName}")
water.temperature = ${num(p.coolantTempK, 1)}
water.set_density("g/cm3", ${num(rho, 5)})
water.add_element("H", 2.0)
water.add_element("O", 1.0)
water.add_s_alpha_beta("c_H_in_H2O")

materials = openmc.Materials([fuel, clad, water])
`;
}

function materialsPebble(p: PlantDesign): string {
  return `
# TRISO kernel is UO2. Buffer / PyC / SiC are named so the onion is honest.
# Helium is the courier. Graphite is the matrix and the reflector.
fuel = openmc.Material(name="TRISO_UO2_kernel")
fuel.temperature = ${num(p.fuelTempK, 1)}
fuel.set_density("g/cm3", ${num(p.fuelDensity, 4)})
fuel.add_element("U", 1.0, enrichment=${num(p.enrich, 2)})
fuel.add_element("O", 2.0)

buffer = openmc.Material(name="porous_carbon_buffer")
buffer.set_density("g/cm3", 1.0)
buffer.add_element("C", 1.0)

sic = openmc.Material(name="SiC")
sic.set_density("g/cm3", 3.20)
sic.add_element("Si", 1.0)
sic.add_element("C", 1.0)

graphite = openmc.Material(name="graphite")
graphite.temperature = ${num(p.coolantTempK, 1)}
graphite.set_density("g/cm3", 1.70)
graphite.add_element("C", 1.0)
graphite.add_s_alpha_beta("c_Graphite")

helium = openmc.Material(name="helium")
helium.temperature = ${num(p.coolantTempK, 1)}
helium.set_density("g/cm3", ${num(Math.max(0.00016, p.coolantDensity), 6)})
helium.add_nuclide("He4", 1.0)

materials = openmc.Materials([fuel, buffer, sic, graphite, helium])
`;
}

function materialsMsr(p: PlantDesign): string {
  const u235 = Math.max(0.005, Math.min(0.2, p.enrich / 100));
  return `
# Classroom thermal MSR: FLiBe + UF4. Lithium MUST be 7Li —
# natural Li is a poison (6Li). Teaching mix, not MSRE/MSBR recipe.
# Family note (not this geometry):
#   thermal circulating fuel (this file) — graphite channels, freeze plug
#   FHR — solid TRISO, salt is coolant only (different materials)
#   fast chloride — no graphite, NaCl + actinide chlorides, compact pool
# Circulating fuel: delayed-neutron precursors leave the core; β_eff < β.
salt = openmc.Material(name="fuel_salt_flibe_uf4")
salt.temperature = ${num(p.fuelTempK, 1)}
salt.set_density("g/cm3", ${num(p.fuelDensity, 4)})
salt.add_nuclide("Li7", 0.14, percent_type="wo")
salt.add_element("Be", 0.06, percent_type="wo")
salt.add_element("F", 0.68, percent_type="wo")
salt.add_nuclide("U235", ${num(u235, 4)}, percent_type="wo")
salt.add_nuclide("U238", ${num(Math.max(0.02, 0.12 - u235), 4)}, percent_type="wo")

graphite = openmc.Material(name="graphite_moderator")
graphite.temperature = ${num(p.coolantTempK, 1)}
graphite.set_density("g/cm3", 1.70)
graphite.add_element("C", 1.0)
graphite.add_s_alpha_beta("c_Graphite")

materials = openmc.Materials([salt, graphite])
`;
}

function geomPin(p: PlantDesign): string {
  const pitch = p.type === "bwr" ? PITCH_BWR : PITCH_PWR;
  const zbc = p.scale === "rod" ? "reflective" : "vacuum";
  return `
# Infinite pin — OpenMC examples.pwr_pin_cell (BEAVRS radii, pitch ${pitch} cm)
pitch = ${pitch}
fuel_or = openmc.ZCylinder(r=${FUEL_R}, name="fuel OR")
clad_or = openmc.ZCylinder(r=${CLAD_R}, name="clad OR")
left = openmc.XPlane(-pitch / 2, boundary_type="reflective")
right = openmc.XPlane(pitch / 2, boundary_type="reflective")
back = openmc.YPlane(-pitch / 2, boundary_type="reflective")
front = openmc.YPlane(pitch / 2, boundary_type="reflective")
bottom = openmc.ZPlane(-200.0, boundary_type="${zbc}")
top = openmc.ZPlane(200.0, boundary_type="${zbc}")
box = +left & -right & +back & -front & +bottom & -top

fuel_cell = openmc.Cell(name="fuel", fill=fuel, region=-fuel_or & +bottom & -top)
clad_cell = openmc.Cell(name="clad", fill=clad, region=+fuel_or & -clad_or & +bottom & -top)
mod_cell = openmc.Cell(name="moderator", fill=water, region=+clad_or & box)
root = openmc.Universe(cells=[fuel_cell, clad_cell, mod_cell])
geometry = openmc.Geometry(root)
`;
}

function geomAssembly(p: PlantDesign): string {
  if (p.type === "bwr") {
    return `
# BWR teaching assembly: 10x10, wider pitch, central water channel.
# Not a licensed 8x8/9x9/10x10 product. Plant rods enter from below — not this lattice.
pitch = ${PITCH_BWR}
n = 10
half = n * pitch / 2.0
fuel_or = openmc.ZCylinder(r=${FUEL_R})
clad_or = openmc.ZCylinder(r=${CLAD_R})
pin = openmc.Universe(name="fuel_pin", cells=[
    openmc.Cell(fill=fuel, region=-fuel_or),
    openmc.Cell(fill=clad, region=+fuel_or & -clad_or),
    openmc.Cell(fill=water, region=+clad_or),
])
water_chan = openmc.Universe(name="water_channel", cells=[openmc.Cell(fill=water)])
mod_uni = openmc.Universe(name="mod", cells=[openmc.Cell(fill=water)])
lattice = openmc.RectLattice(name="bwr_assembly")
lattice.lower_left = [-half, -half]
lattice.pitch = [pitch, pitch]
universe_map = []
for j in range(n):
    row = []
    for i in range(n):
        row.append(water_chan if (3 <= i <= 6 and 3 <= j <= 6) else pin)
    universe_map.append(row)
lattice.universes = universe_map
lattice.outer = mod_uni
left = openmc.XPlane(-half, boundary_type="reflective")
right = openmc.XPlane(half, boundary_type="reflective")
back = openmc.YPlane(-half, boundary_type="reflective")
front = openmc.YPlane(half, boundary_type="reflective")
bottom = openmc.ZPlane(-183.0, boundary_type="vacuum")
top = openmc.ZPlane(183.0, boundary_type="vacuum")
assy = openmc.Cell(name="assembly", fill=lattice,
                   region=+left & -right & +back & -front & +bottom & -top)
geometry = openmc.Geometry([assy])
`;
  }
  const pitch = PITCH_PWR;
  const n = 17;
  const half = (n * pitch) / 2;
  return `
# 17x17 reflected assembly — OpenMC examples.pwr_assembly pattern
pitch = ${pitch}
n = ${n}
half = ${num(half, 5)}
fuel_or = openmc.ZCylinder(r=${FUEL_R})
clad_or = openmc.ZCylinder(r=${CLAD_R})
gt_ir = openmc.ZCylinder(r=0.561)
gt_or = openmc.ZCylinder(r=0.602)

pin = openmc.Universe(name="fuel_pin", cells=[
    openmc.Cell(fill=fuel, region=-fuel_or),
    openmc.Cell(fill=clad, region=+fuel_or & -clad_or),
    openmc.Cell(fill=water, region=+clad_or),
])
guide = openmc.Universe(name="guide", cells=[
    openmc.Cell(fill=water, region=-gt_ir),
    openmc.Cell(fill=clad, region=+gt_ir & -gt_or),
    openmc.Cell(fill=water, region=+gt_or),
])
mod_uni = openmc.Universe(name="mod", cells=[openmc.Cell(fill=water)])

guides = set(${GUIDES_17})
lattice = openmc.RectLattice(name="assembly")
lattice.lower_left = [-half, -half]
lattice.pitch = [pitch, pitch]
universe_map = []
for j in range(n):
    row = []
    for i in range(n):
        row.append(guide if (i, j) in guides else pin)
    universe_map.append(row)
lattice.universes = universe_map
lattice.outer = mod_uni

left = openmc.XPlane(-half, boundary_type="reflective")
right = openmc.XPlane(half, boundary_type="reflective")
back = openmc.YPlane(-half, boundary_type="reflective")
front = openmc.YPlane(half, boundary_type="reflective")
bottom = openmc.ZPlane(-183.0, boundary_type="vacuum")
top = openmc.ZPlane(183.0, boundary_type="vacuum")
assy = openmc.Cell(name="assembly", fill=lattice,
                   region=+left & -right & +back & -front & +bottom & -top)
geometry = openmc.Geometry([assy])
`;
}

function shufflePy(map: ShuffleCell[] | undefined): string {
  if (!map || map.length === 0) {
    return `shuffle = {}  # run Friday shuffle to stamp cycle F/1/2`;
  }
  const entries = map.map((c) => `    (${c.i}, ${c.j}): "${c.cycle}"`).join(",\n");
  return `shuffle = {\n${entries}\n}`;
}

function geomCore(p: PlantDesign): string {
  const pitch = p.type === "bwr" ? PITCH_BWR : PITCH_PWR;
  const nPin = p.type === "bwr" ? 10 : 17;
  const assyPitch = nPin * pitch;
  const nAssy = p.fullCore ? (p.sizeClass === 0 ? 5 : p.sizeClass === 2 ? 9 : 7) : 3;
  const half = (nAssy * assyPitch) / 2;
  const refl = p.reflector ? 20 : 0;
  const outer = half + refl;
  return `
# Classroom core: ${nAssy}x${nAssy} assemblies (not a licensed core)
pitch = ${pitch}
n_pin = ${nPin}
assy_pitch = n_pin * pitch
n_assy = ${nAssy}
half = n_assy * assy_pitch / 2.0
outer = ${num(outer, 4)}

fuel_or = openmc.ZCylinder(r=${FUEL_R})
clad_or = openmc.ZCylinder(r=${CLAD_R})
pin = openmc.Universe(name="fuel_pin", cells=[
    openmc.Cell(fill=fuel, region=-fuel_or),
    openmc.Cell(fill=clad, region=+fuel_or & -clad_or),
    openmc.Cell(fill=water, region=+clad_or),
])
mod_uni = openmc.Universe(cells=[openmc.Cell(fill=water)])
assy_lat = openmc.RectLattice(name="one_assembly")
assy_lat.lower_left = [-assy_pitch / 2, -assy_pitch / 2]
assy_lat.pitch = [pitch, pitch]
assy_lat.universes = [[pin] * n_pin for _ in range(n_pin)]
assy_lat.outer = mod_uni
assy_uni = openmc.Universe(cells=[openmc.Cell(fill=assy_lat)])

${shufflePy(p.shuffleMap)}
# Cycle stamps (F/1/2) are commentary for the lattice; a full burnup-dependent
# material set needs depletion. Here every assembly is the designer enrichment.

core_lat = openmc.RectLattice(name="core")
core_lat.lower_left = [-half, -half]
core_lat.pitch = [assy_pitch, assy_pitch]
core_lat.universes = [[assy_uni] * n_assy for _ in range(n_assy)]
core_lat.outer = mod_uni

cyl = openmc.ZCylinder(r=outer, boundary_type="vacuum")
bottom = openmc.ZPlane(-200.0, boundary_type="vacuum")
top = openmc.ZPlane(200.0, boundary_type="vacuum")
core_cell = openmc.Cell(name="core", fill=core_lat, region=-cyl & +bottom & -top)
geometry = openmc.Geometry([core_cell])
# reflector=${p.reflector}: extra ${refl} cm of water is lattice.outer inside a larger cylinder
`;
}

function geomPebble(p: PlantDesign): string {
  if (p.scale === "rod") {
    return `
# One TRISO onion inside one 6 cm pebble. Radii are classroom (kernel ~0.5 mm dia).
kernel = openmc.Sphere(r=0.0250)
buffer_or = openmc.Sphere(r=0.0340)
sic_or = openmc.Sphere(r=0.0420)
opyc_or = openmc.Sphere(r=0.0455)
pebble = openmc.Sphere(r=3.0, boundary_type="reflective")
geometry = openmc.Geometry([
    openmc.Cell(fill=fuel, region=-kernel),
    openmc.Cell(fill=buffer, region=+kernel & -buffer_or),
    openmc.Cell(fill=sic, region=+buffer_or & -sic_or),
    openmc.Cell(fill=buffer, region=+sic_or & -opyc_or),
    openmc.Cell(fill=graphite, region=+opyc_or & -pebble),
])
`;
  }
  const n = p.scale === "core" ? 7 : 3;
  const pitch = 6.2;
  const half = (n * pitch) / 2;
  const outer = p.scale === "core" ? half + 20 : half + 4;
  const bc = p.scale === "core" ? "vacuum" : "reflective";
  return `
# Packed pebble bed (square lattice proxy). 6 cm pebbles, helium between, graphite rim.
pebble_or = openmc.Sphere(r=3.0)
kernel = openmc.Sphere(r=0.025)
peb = openmc.Universe(name="pebble", cells=[
    openmc.Cell(fill=fuel, region=-kernel),
    openmc.Cell(fill=graphite, region=+kernel & -pebble_or),
    openmc.Cell(fill=helium, region=+pebble_or),
])
he_uni = openmc.Universe(cells=[openmc.Cell(fill=helium)])
lat = openmc.RectLattice(name="pebble_bed")
lat.lower_left = [-${num(half, 2)}, -${num(half, 2)}]
lat.pitch = [${pitch}, ${pitch}]
lat.universes = [[peb] * ${n} for _ in range(${n})]
lat.outer = he_uni
cyl = openmc.ZCylinder(r=${num(outer, 1)}, boundary_type="${bc}")
bot = openmc.ZPlane(-${num(outer, 1)}, boundary_type="${bc}")
top = openmc.ZPlane(${num(outer, 1)}, boundary_type="${bc}")
bed = openmc.Cell(fill=lat, region=-cyl & +bot & -top)
# Optional graphite reflector as lattice.outer already helium; a ring:
ring = openmc.ZCylinder(r=${num(outer + (p.reflector ? 15 : 0.1), 1)}, boundary_type="${bc}")
refl = openmc.Cell(fill=graphite, region=+cyl & -ring & +bot & -top)
geometry = openmc.Geometry([bed, refl] if ${p.reflector ? "True" : "False"} else [bed])
`;
}

function geomMsr(p: PlantDesign): string {
  const pitch = p.scale === "rod" ? 5.0 : 8.0;
  const n = p.scale === "core" ? 9 : p.scale === "assembly" ? 5 : 1;
  const rChan = 1.2;
  const half = (n * pitch) / 2;
  const outer = half + (p.scale === "core" ? 25 : 4);
  const bc = p.scale === "core" ? "vacuum" : "reflective";
  const h = p.scale === "core" ? 180 : 40;
  return `
# Graphite-moderated salt channels (MSRE-like teaching lattice).
# Freeze plug / drain tank are plant hardware, not this eigenvalue geometry.
pitch = ${pitch}
n = ${n}
chan = openmc.ZCylinder(r=${rChan})
salt_uni = openmc.Universe(name="channel", cells=[
    openmc.Cell(fill=salt, region=-chan),
    openmc.Cell(fill=graphite, region=+chan),
])
graph_uni = openmc.Universe(cells=[openmc.Cell(fill=graphite)])
lat = openmc.RectLattice(name="msr_channels")
lat.lower_left = [-${num(half, 2)}, -${num(half, 2)}]
lat.pitch = [pitch, pitch]
lat.universes = [[salt_uni] * n for _ in range(n)]
lat.outer = graph_uni
cyl = openmc.ZCylinder(r=${num(outer, 1)}, boundary_type="${bc}")
bot = openmc.ZPlane(-${h}.0, boundary_type="${bc}")
top = openmc.ZPlane(${h}.0, boundary_type="${bc}")
core = openmc.Cell(name="msr_core", fill=lat, region=-cyl & +bot & -top)
geometry = openmc.Geometry([core])
`;
}

function settingsBlock(p: PlantDesign): string {
  const batches = p.scale === "core" ? 80 : 40;
  const inactive = p.scale === "core" ? 20 : 10;
  const particles = p.scale === "core" ? 2000 : 1000;
  return `
settings = openmc.Settings()
settings.batches = ${batches}
settings.inactive = ${inactive}
settings.particles = ${particles}
try:
    settings.source = openmc.IndependentSource(
        space=openmc.stats.Box([-2.0, -2.0, -2.0], [2.0, 2.0, 2.0]),
        constraints={"fissionable": True},
    )
except (AttributeError, TypeError):
    settings.source = openmc.Source(space=openmc.stats.Point((0.0, 0.0, 0.0)))

tallies = openmc.Tallies()
mesh = openmc.RegularMesh()
mesh.dimension = [8, 8, 1]
mesh.lower_left = [-50.0, -50.0, -1.0]
mesh.upper_right = [50.0, 50.0, 1.0]
t = openmc.Tally(name="flux_mesh")
t.filters = [openmc.MeshFilter(mesh)]
t.scores = ["flux", "kappa-fission"]
tallies.append(t)
`;
}

function depleteBlock(p: PlantDesign): string {
  if (!p.depletion) {
    return `
# Depletion OFF. Toggle "Full depletion" in the designer to stamp a CoupledOperator stub.
`;
  }
  const power = p.powerMW * 1e6 * 3; // rough MWth classroom
  return `
# Depletion ON — needs a depletion chain XML next to this script
# (e.g. chain_endfb71_pwr.xml from OpenMC data). Classroom power, not licensed.
DEPLETE = True
BURNUP_MWD_KG = ${num(p.burnupMWd_kg, 1)}
POWER_W = ${num(power, 0)}  # classroom MWth proxy from MWe * 3
`;
}

function footer(p: PlantDesign): string {
  const depleteRun = p.depletion
    ? `
    if os.environ.get("OPENMC_CHAIN"):
        import openmc.deplete
        operator = openmc.deplete.CoupledOperator(model, os.environ["OPENMC_CHAIN"])
        timesteps = [30.0, 30.0, 30.0, 30.0]
        openmc.deplete.PredictorIntegrator(
            operator, timesteps, POWER_W, timestep_units="d"
        ).integrate()
    else:
        print("Set OPENMC_CHAIN to a chain XML to run depletion. Running eigenvalue only.")
        sp = model.run()
        print("keff from statepoint:", sp)
`
    : `
    sp = model.run()
    print("keff from statepoint:", sp)
`;
  return `
model = openmc.Model(geometry=geometry, materials=materials, settings=settings, tallies=tallies)
plot = openmc.Plot()
plot.basis = "xy"
plot.pixels = (400, 400)
plot.color_by = "material"
model.plots = openmc.Plots([plot])

if __name__ == "__main__":
    print("Teaching model only — not a license.")
    ensure_cross_sections(materials)
    model.export_to_xml()
    print("Wrote OpenMC XML next to this script.")
${depleteRun}
`;
}

export function generateOpenMCPython(p: PlantDesign): string {
  const mats =
    p.type === "pebble" ? materialsPebble(p) : p.type === "msr" ? materialsMsr(p) : materialsLWR(p);
  let geom: string;
  if (p.type === "pebble") geom = geomPebble(p);
  else if (p.type === "msr") geom = geomMsr(p);
  else if (p.scale === "assembly") geom = geomAssembly(p);
  else if (p.scale === "core") geom = geomCore(p);
  else geom = geomPin(p);

  return (
    header(p) +
    mats +
    "\n# --- geometry ---------------------------------------------------------------\n" +
    geom +
    "\n# --- settings / tallies -----------------------------------------------------\n" +
    settingsBlock(p) +
    depleteBlock(p) +
    footer(p)
  );
}

export function downloadOpenMC(p: PlantDesign) {
  const py = generateOpenMCPython(p);
  const blob = new Blob([py], { type: "text/x-python" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `openmc_${p.type}_${p.scale}${p.fullCore ? "_full" : ""}${p.depletion ? "_dep" : ""}.py`;
  a.click();
  URL.revokeObjectURL(a.href);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cc-plant-download"));
  }
}
