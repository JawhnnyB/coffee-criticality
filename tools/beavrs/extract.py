#!/usr/bin/env python3
"""
Rebuild src/game/outage/beavrs.ts and tools/openmc/beavrs_data.py from a clone of the public BEAVRS benchmark.

    git clone https://github.com/mit-crpg/BEAVRS.git
    pdftotext -layout BEAVRS/beavrs_specifications.pdf spec.txt
    python tools/beavrs/extract.py BEAVRS spec.txt

Sources inside the clone:
- models/casmo-simulate/simulate_full_hzp.inp: 'FUE.TYP' map of Cycle 1 (zones -> assembly types via FUE.ZON/SEG.DAT)
- models/casmo-simulate/simulate_hzp_noIT_cyc2_ft.inp: 'FUE.LAB' map of Cycle 2 (labels = Cycle 1 positions, TYPEnn = fresh)
- models/casmo-simulate/c5.*.inp: LPI pin maps (absorber rod layouts)
- measurements/detector_signals/cycle_N/<days>/: radial maps and summary (core burnup)
- measurements/boron_letdown.csv: boron letdown (the same values as spec Table 24)
- the spec text: material tables 4-19 (tools/openmc/beavrs_data.py)
Cycle lengths (327.2 and 272.7 EFPD), specific power (41.7 MW/tHM) and the FdH limit (1.435) are from
ORNL/NRC ML25106A184 and NUREG/IA-0529, cited in beavrs.ts.
"""
import csv
import json
import os
import re
import sys

ZONE = {2: (1.6, 0), 3: (2.4, 0), 4: (2.4, 12), 5: (2.4, 16), 6: (3.1, 0), 7: (3.1, 16), 8: (3.1, 20),
        13: (3.1, 6), 14: (3.1, 6), 16: (3.1, 6), 17: (3.1, 6), 15: (3.1, 15), 18: (3.1, 15), 19: (3.1, 15), 20: (3.1, 15)}
FRESH = {"TYPE01": (3.2, 0), "TYPE02": (3.2, 4), "TYPE03": (3.2, 8), "TYPE04": (3.2, 12), "TYPE05": (3.4, 0)}
COLS = "RPNMLKJHGFEDCBA"
MAP_PICK = {(1, 0), (1, 92), (1, 251), (1, 434), (1, 551), (2, 5), (2, 156), (2, 266)}


def expand(line):
    vals = []
    for tok in line.split():
        m = re.match(r"(\d+)\*(\d+)$", tok)
        vals += [int(m.group(2))] * int(m.group(1)) if m else [int(tok)]
    return vals


def main(clone, spec_txt):
    cs = os.path.join(clone, "models", "casmo-simulate")
    s = open(os.path.join(cs, "simulate_full_hzp.inp")).read()
    i = s.index("'FUE.TYP' 1") + len("'FUE.TYP' 1")
    rows = [expand(l) for l in s[i:s.index("/", i)].strip().splitlines()]
    assert len(rows) == 17 and all(len(r) == 17 for r in rows)
    c1 = [[({"e": ZONE[rows[r + 1][c + 1]][0], "ba": ZONE[rows[r + 1][c + 1]][1]} if rows[r + 1][c + 1] in ZONE else None) for c in range(15)] for r in range(15)]
    t = open(os.path.join(cs, "simulate_hzp_noIT_cyc2_ft.inp")).read()
    lab = t[t.index("'FUE.LAB' 6") + 12:t.index(" 0  0")]
    c2 = [[None] * 15 for _ in range(15)]
    for line in lab.strip().splitlines():
        toks = line.split()
        r, ents = int(toks[0]) - 1, toks[2:]
        start = (15 - len(ents)) // 2
        for k, e in enumerate(ents):
            if e in FRESH:
                c2[r][start + k] = {"e": FRESH[e][0], "ba": FRESH[e][1]}
            else:
                col, row = e.split("-")
                c2[r][start + k] = {"from": [int(row) - 1, COLS.index(col)]}
    # measurements/boron_letdown.csv: the same values as spec Table 24. Columns: , MWD, EFPD, PPMB, , , MWD, EFPD, PPMB
    l1, l2 = [], []
    for r in csv.reader(open(os.path.join(clone, "measurements", "boron_letdown.csv"))):
        if len(r) >= 4 and r[2].strip().isdigit():
            l1.append([int(r[2]), int(r[3])])
        if len(r) >= 9 and r[7].strip().isdigit():
            l2.append([int(r[7]), int(r[8])])
    maps = []
    for cyc in (1, 2):
        base = os.path.join(clone, "measurements", "detector_signals", f"cycle_{cyc}")
        for d in sorted(os.listdir(base), key=int):
            if (cyc, int(d)) not in MAP_PICK:
                continue
            summ = open(os.path.join(base, d, "summary.csv")).read().splitlines()
            bu = float(summ[1].split(",")[1]) / 1000
            vals = [[r[0], round(float(r[1]), 4)] for r in csv.reader(open(os.path.join(base, d, "radial_measurements_full.csv"))) if r and re.match(r"^[A-R]\d+$", r[0])]
            maps.append({"cycle": cyc, "days": int(d), "burnup": round(bu, 4), "map": vals})
    data = {"columns": COLS, "cycle1": c1, "cycle2": c2, "letdown": {"cycle1": l1, "cycle2": l2},
            "hzpAroBoron": {"cycle1": 975, "cycle2": 1405}, "eocEfpd": {"cycle1": 327.2, "cycle2": 272.7},
            "specificPowerMWperT": 41.7, "assemblyPitchCm": 21.50, "fdhLimit": 1.435, "maps": maps}
    print(json.dumps(data, separators=(",", ":"))[:200], "...")
    print(f"cycle 1 fuel {sum(v is not None for r in c1 for v in r)}, letdown {len(l1)}+{len(l2)}, maps {len(maps)}")
    return data


def write_ts(data, path):
    """Regenerate beavrs.ts, keeping its header comment and type."""
    old = open(path).read()
    head = old[: old.index("} = ") + 4]
    open(path, "w").write(head + json.dumps(data, separators=(",", ":")) + " as never;\n")


if __name__ == "__main__":
    d = main(sys.argv[1], sys.argv[2])
    if len(sys.argv) > 3:
        write_ts(d, sys.argv[3])
        print("wrote", sys.argv[3])
