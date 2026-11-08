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
    ("scene-core.png", "reference/intro/scene-core.png"),
    ("scene-cafe.png", "reference/intro/scene-cafe.png"),
    ("scene-lot.png", "reference/intro/scene-lot.png"),
    ("scene-wing.png", "reference/intro/scene-wing.png"),
    ("scene-bench.png", "reference/intro/scene-bench.png"),
    ("scene-break.png", "reference/intro/scene-break.png"),
    ("scene-control.png", "reference/intro/scene-control.png"),
    ("scene-threshold.png", "reference/intro/scene-threshold.png"),
    ("portrait-priya-smile.png", "reference/portraits/portrait-priya-smile.png"),
    ("portrait-priya-talk.png", "reference/portraits/portrait-priya-talk.png"),
    ("portrait-mabel-smile.png", "reference/portraits/portrait-mabel-smile.png"),
    ("portrait-mabel-talk.png", "reference/portraits/portrait-mabel-talk.png"),
    ("portrait-elena-smile.png", "reference/portraits/portrait-elena-smile.png"),
    ("portrait-elena-talk.png", "reference/portraits/portrait-elena-talk.png"),
    ("portrait-tommy-smile.png", "reference/portraits/portrait-tommy-smile.png"),
    ("portrait-tommy-talk.png", "reference/portraits/portrait-tommy-talk.png"),
    ("portrait-marcus-smile.png", "reference/portraits/portrait-marcus-smile.png"),
    ("portrait-marcus-talk.png", "reference/portraits/portrait-marcus-talk.png"),
    ("portrait-jordan-smile.png", "reference/portraits/portrait-jordan-smile.png"),
    ("portrait-jordan-talk.png", "reference/portraits/portrait-jordan-talk.png"),
    ("portrait-holt-smile.png", "reference/portraits/portrait-holt-smile.png"),
    ("portrait-holt-talk.png", "reference/portraits/portrait-holt-talk.png"),
    ("portrait-player-smile.png", "reference/portraits/portrait-player-smile.png"),
    ("portrait-player-talk.png", "reference/portraits/portrait-player-talk.png"),
    ("portrait-player-smile-noglasses.png", "reference/portraits/portrait-player-smile-noglasses.png"),
    ("portrait-player-talk-noglasses.png", "reference/portraits/portrait-player-talk-noglasses.png"),
    ("cast-sheet.png", "reference/intro/cast-sheet.png"),
    ("intro-core.png", "reference/intro/intro-core.png"),
    ("intro-cafe.png", "reference/intro/intro-cafe.png"),
    ("intro-lot.png", "reference/intro/intro-lot.png"),
    ("intro-you.png", "reference/intro/intro-you.png"),
    ("intro-door.png", "reference/intro/intro-door.png"),
    ("badge.png", "reference/intro/badge.png"),
    ("brief.png", "reference/intro/brief.png"),
    # Stage 2c, Site Access
    ("badge-card-4x.png", "reference/security/badge-card-4x.png"),
    ("badge-card.png", "reference/security/badge-card.png"),
    ("badge-lanyard.png", "reference/security/badge-lanyard.png"),
    ("corridor-signs.png", "reference/security/corridor-signs.png"),
    ("dee_idle_32.png", "reference/security/dee_idle_32.png"),
    ("door-plates.png", "reference/security/door-plates.png"),
    ("engineering-mydesk-3x.png", "reference/security/engineering-mydesk-3x.png"),
    ("engineering-mydesk.png", "reference/security/engineering-mydesk.png"),
    ("intro-badge-2x.png", "reference/security/intro-badge-2x.png"),
    ("intro-badge.png", "reference/security/intro-badge.png"),
    ("intro-desk-2x.png", "reference/security/intro-desk-2x.png"),
    ("intro-desk.png", "reference/security/intro-desk.png"),
    ("intro-iris-2x.png", "reference/security/intro-iris-2x.png"),
    ("intro-iris.png", "reference/security/intro-iris.png"),
    ("intro-security-2x.png", "reference/security/intro-security-2x.png"),
    ("intro-security.png", "reference/security/intro-security.png"),
    ("iris-align-2x.png", "reference/security/iris-align-2x.png"),
    ("iris-align.png", "reference/security/iris-align.png"),
    ("iris-match-2x.png", "reference/security/iris-match-2x.png"),
    ("iris-match.png", "reference/security/iris-match.png"),
    ("iris-scan-2x.png", "reference/security/iris-scan-2x.png"),
    ("iris-scan.png", "reference/security/iris-scan.png"),
    ("portal-sprites.png", "reference/security/portal-sprites.png"),
    ("portal-states-3x.png", "reference/security/portal-states-3x.png"),
    ("portal-states.png", "reference/security/portal-states.png"),
    ("portrait-dee-smile.png", "reference/security/portrait-dee-smile.png"),
    ("portrait-dee-talk.png", "reference/security/portrait-dee-talk.png"),
    ("scene-desk.png", "reference/security/scene-desk.png"),
    ("scene-iris-align.png", "reference/security/scene-iris-align.png"),
    ("scene-iris-match.png", "reference/security/scene-iris-match.png"),
    ("scene-iris-scan.png", "reference/security/scene-iris-scan.png"),
    ("scene-kiosk.png", "reference/security/scene-kiosk.png"),
    ("scene-security.png", "reference/security/scene-security.png"),
    ("sec-icons-4x.png", "reference/security/sec-icons-4x.png"),
    ("sec-icons.png", "reference/security/sec-icons.png"),
    ("security-3x.png", "reference/security/security-3x.png"),
    ("security-annotated.png", "reference/security/security-annotated.png"),
    ("security-shell.png", "reference/security/security-shell.png"),
    ("security.png", "reference/security/security.png"),
    ("wayfinding-3x.png", "reference/security/wayfinding-3x.png"),
    ("wayfinding.png", "reference/security/wayfinding.png"),
]

# Shipped copies of the Site Access art must be the reference, byte for byte.
SHIPPED = [
    ("reference/security/portal-sprites.png", "public/art/ui/security/portal-sprites.png"),
    ("reference/security/sec-icons.png", "public/art/ui/security/sec-icons.png"),
    ("reference/security/badge-lanyard.png", "public/art/ui/security/badge-lanyard.png"),
    ("reference/security/badge-card.png", "public/art/ui/security/badge-card.png"),
    ("reference/security/dee_idle_32.png", "public/art/gen/sprites/dee_idle_32.png"),
    ("reference/security/portrait-dee-smile.png", "public/art/ui/portraits/portrait-dee-smile.png"),
    ("reference/security/portrait-dee-talk.png", "public/art/ui/portraits/portrait-dee-talk.png"),
    ("reference/security/scene-security.png", "public/art/intro/scene-security.png"),
    ("reference/security/scene-kiosk.png", "public/art/intro/scene-kiosk.png"),
    ("reference/security/scene-desk.png", "public/art/intro/scene-desk.png"),
    ("reference/security/scene-iris-scan.png", "public/art/intro/scene-iris.png"),
    ("reference/security/scene-iris-align.png", "public/art/intro/scene-iris-align.png"),
    ("reference/security/scene-iris-scan.png", "public/art/intro/scene-iris-scan.png"),
    ("reference/security/scene-iris-match.png", "public/art/intro/scene-iris-match.png"),
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
    sec = tmp / "security"
    ui.mkdir()
    reactors.mkdir()
    sec.mkdir()
    env = os.environ.copy()
    env["UI_OUT"] = str(ui)
    env["REACTOR_OUT"] = str(reactors)
    env["SEC_OUT"] = str(sec)
    env["CC_REPO"] = str(ROOT)
    steps = [
        [sys.executable, str(ART / "menu.py")],
        [sys.executable, str(ART / "cab.py")],
        [sys.executable, str(ART / "portrait.py")],
        [sys.executable, str(ART / "builder_mock.py")],
        [sys.executable, str(ART / "reactors.py"), "pwr", "bwr", "msr", "pebble"],
        [sys.executable, str(ART / "scenes.py")],
        [sys.executable, str(ART / "cast.py")],
        [sys.executable, str(ART / "intro_mock.py")],
        [sys.executable, str(ART / "security.py")],
        [sys.executable, str(ART / "security_ui.py")],
    ]
    for cmd in steps:
        subprocess.check_call(cmd, cwd=ROOT, env=env)
    bad = 0
    for name, rel in PAIRS:
        got = next((d / name for d in (ui, reactors, sec) if (d / name).exists()), ui / name)
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
    for a, b in SHIPPED:
        n = diff(Image.open(ROOT / a).convert("RGBA"), Image.open(ROOT / b).convert("RGBA"))
        if n != 0:
            print(f"DIFF shipped {b} vs {a} {n if n >= 0 else 'size'}")
            bad += 1
        else:
            print(f"ok shipped {b}")
    if bad:
        print(f"art:check failed ({bad})")
        return 1
    print(f"art:check passed ({len(PAIRS)} pngs, {len(SHIPPED)} shipped copies)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
