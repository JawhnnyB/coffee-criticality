#!/usr/bin/env python3
"""Regenerate every artkit reference PNG and fail if any pixel differs.

Room references (cafe.png and the rest of the lot) are owned by tools/roomkit,
not these generators, so they are not in this check.
"""
import os
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "tools" / "artkit"

PAIRS = [
    ("menu.png", "reference/menu/menu.png"),
    ("menu-3x.png", "reference/menu/menu-3x.png"),
    ("menu-scene.png", "reference/menu/menu-scene.png"),
    ("menu-parts.png", "reference/menu/menu-parts.png"),
    ("menu-chips.png", "reference/menu/menu-chips.png"),
    ("cab-catch.png", "reference/cabinets/cab-catch.png"),
    ("cab-catch-3x.png", "reference/cabinets/cab-catch-3x.png"),
    ("cab-rods.png", "reference/cabinets/cab-rods.png"),
    ("cab-rods-3x.png", "reference/cabinets/cab-rods-3x.png"),
    ("cab-phys.png", "reference/cabinets/cab-phys.png"),
    ("cab-phys-3x.png", "reference/cabinets/cab-phys-3x.png"),
    ("cab-delay.png", "reference/cabinets/cab-delay.png"),
    ("cab-delay-3x.png", "reference/cabinets/cab-delay-3x.png"),
    ("priya-48.png", "reference/portrait/priya-48.png"),
    ("priya-48-6x.png", "reference/portrait/priya-48-6x.png"),
    ("priya-talk.png", "reference/portrait/priya-talk.png"),
    ("priya-talk-6x.png", "reference/portrait/priya-talk-6x.png"),
    ("priya-sheet.png", "reference/portrait/priya-sheet.png"),
    ("builder-type.png", "reference/builder/builder-type.png"),
    ("builder-type-2x.png", "reference/builder/builder-type-2x.png"),
    ("pwr.png", "reference/reactors/pwr.png"),
    ("pwr-3x.png", "reference/reactors/pwr-3x.png"),
    ("bwr.png", "reference/reactors/bwr.png"),
    ("bwr-3x.png", "reference/reactors/bwr-3x.png"),
    ("msr.png", "reference/reactors/msr.png"),
    ("msr-3x.png", "reference/reactors/msr-3x.png"),
    ("pebble.png", "reference/reactors/pebble.png"),
    ("pebble-3x.png", "reference/reactors/pebble-3x.png"),
]


def diff(a: Image.Image, b: Image.Image) -> int:
    if a.size != b.size:
        return -1
    pa, pb = a.load(), b.load()
    n = 0
    for y in range(a.height):
        for x in range(a.width):
            if pa[x, y] != pb[x, y]:
                n += 1
    return n


def main() -> int:
    tmp = Path(tempfile.mkdtemp(prefix="artcheck-"))
    ui = tmp / "ui"
    reactors = tmp / "reactors"
    ui.mkdir()
    reactors.mkdir()
    env = os.environ.copy()
    env["UI_OUT"] = str(ui)
    env["REACTOR_OUT"] = str(reactors)
    steps = [
        [sys.executable, str(ART / "menu.py")],
        [sys.executable, str(ART / "cab.py")],
        [sys.executable, str(ART / "portrait.py")],
        [sys.executable, str(ART / "builder_mock.py")],
        [sys.executable, str(ART / "reactors.py"), "pwr", "bwr", "msr", "pebble"],
    ]
    for cmd in steps:
        subprocess.check_call(cmd, cwd=ROOT, env=env)
    bad = 0
    for name, rel in PAIRS:
        got = ui / name if (ui / name).exists() else reactors / name
        ref = ROOT / rel
        if not got.exists() or not ref.exists():
            print(f"MISSING {name}")
            bad += 1
            continue
        n = diff(Image.open(got).convert("RGBA"), Image.open(ref).convert("RGBA"))
        if n != 0:
            print(f"DIFF {rel} {n if n >= 0 else 'size'}")
            bad += 1
        else:
            print(f"ok {rel}")
    if bad:
        print(f"art:check failed ({bad})")
        return 1
    print(f"art:check passed ({len(PAIRS)} pngs)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
