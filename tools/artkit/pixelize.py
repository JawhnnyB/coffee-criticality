#!/usr/bin/env python3
"""Redraw a painted plate on the game's pixel grid and locked palette.

The game has two looks: code-drawn pixel art, and painted plates. This puts the painted
plates the game still loads onto the same grid and the same colours as everything else.

Each source is box-sampled to 160 x 90, every pixel is snapped to the nearest colour in
src/game/palette.ts, and the result is written at 320 x 180 with hard pixel edges.
No dither. The painted originals are kept under reference/painted/ and are not shipped.

Usage: python3 tools/artkit/pixelize.py            (all plates in PLATES)
       python3 tools/artkit/pixelize.py --check    (exit 1 if a shipped plate is off-palette)
"""
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
STILLS = ROOT / "public/art/gen/stills"
KEEP = ROOT / "reference/painted"
NATIVE = (160, 90)
OUT = (320, 180)

PLATES = [
    "plate_lake.png",
    "plate_culture.png",
    "plate_alara.png",
    "plate_dt.png",
    "plate_export.png",
    "plate_shuffle.png",
    "term_clad.png",
    "term_mod.png",
    "term_cool.png",
    "term_vessel.png",
    "term_refl.png",
]


def palette():
    text = (ROOT / "src/game/palette.ts").read_text()
    block = text[text.index("export const PAL") : text.index("} as const")]
    return sorted(set(re.findall(r'"#([0-9a-fA-F]{6})"', block)))


def palette_image(cols):
    flat = []
    for c in cols:
        flat += [int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)]
    img = Image.new("P", (1, 1))
    img.putpalette(flat + flat[:3] * (256 - len(cols)))
    return img


def convert(src: Path, pal) -> Image.Image:
    im = Image.open(src).convert("RGB")
    small = im.resize(NATIVE, Image.Resampling.BOX)
    snapped = small.quantize(palette=pal, dither=Image.Dither.NONE).convert("RGB")
    return snapped.resize(OUT, Image.Resampling.NEAREST)


def off_palette(path: Path, cols) -> int:
    allowed = {(int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)) for c in cols}
    im = Image.open(path).convert("RGB")
    return sum(n for n, rgb in im.getcolors(maxcolors=1 << 24) if rgb not in allowed)


def main():
    cols = palette()
    pal = palette_image(cols)
    if "--check" in sys.argv:
        bad = 0
        for name in PLATES:
            n = off_palette(STILLS / name, cols)
            print(f"{name} off-palette pixels {n}")
            bad += 1 if n else 0
        sys.exit(1 if bad else 0)
    KEEP.mkdir(parents=True, exist_ok=True)
    for name in PLATES:
        kept = KEEP / name
        if not kept.exists():
            kept.write_bytes((STILLS / name).read_bytes())
        out = convert(kept, pal)
        out.save(STILLS / name, optimize=True)
        print(f"{name} {out.size[0]}x{out.size[1]} colours {len(out.getcolors(maxcolors=4096))}")


if __name__ == "__main__":
    main()
