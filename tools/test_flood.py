#!/usr/bin/env python3
"""Synthetic cases for flood_border connectivity."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from packSprite import CREAM, INK, flood_border  # noqa: E402

LEAF = (107, 143, 113)
T = (255, 0, 255, 0)  # will be transparent after convert; we use alpha 0


def blank(w=16, h=16):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def put(im, x, y, rgb, a=255):
    im.putpixel((x, y), (*rgb, a) if len(rgb) == 3 else rgb)


def case_diagonal_smear():
    """Cream only 8-connected from border (diagonal). 4-connect would miss."""
    im = blank(8, 8)
    # diagonal cream from (0,0) to (3,3), solid leaf at (4,4)
    for i in range(4):
        put(im, i, i, CREAM)
    put(im, 4, 4, LEAF)
    put(im, 3, 4, LEAF)
    put(im, 4, 3, LEAF)
    return im


def case_ink_box():
    """Cream fill inside a 1px ink ring. Classic boxed halo."""
    im = blank(12, 12)
    d = ImageDraw.Draw(im)
    d.rectangle([2, 2, 9, 9], outline=(*INK, 255), fill=(*CREAM, 255))
    return im


def case_apron():
    """Leaf body, cream apron in the middle, ink outline. Apron must survive."""
    im = blank(12, 16)
    d = ImageDraw.Draw(im)
    d.rectangle([3, 2, 8, 14], outline=(*INK, 255), fill=(*LEAF, 255))
    d.rectangle([4, 7, 7, 12], fill=(*CREAM, 255))
    return im


def opaque(im):
    a = np.array(im)
    return int((a[:, :, 3] > 10).sum())


def cream_n(im):
    a = np.array(im)
    r, g, b, al = a[:, :, 0].astype(int), a[:, :, 1].astype(int), a[:, :, 2].astype(int), a[:, :, 3]
    op = al > 10
    m = ((np.abs(r - 243) + np.abs(g - 230) + np.abs(b - 208) < 72) & op) | ((r > 210) & (g > 195) & (b > 170) & op)
    return int(m.sum())


def run(name, im, expect):
    out = flood_border(im)
    got = {"opaque": opaque(out), "cream": cream_n(out)}
    ok = all(got[k] == expect[k] for k in expect)
    print(f"{'PASS' if ok else 'FAIL'} {name:20} got={got} expect={expect}")
    return ok, im, out


def main():
    results = []
    results.append(run("diagonal_smear", case_diagonal_smear(), {"opaque": 3, "cream": 0}))
    results.append(run("ink_box", case_ink_box(), {"opaque": 0, "cream": 0}))
    results.append(run("apron", case_apron(), {"cream": 24}))  # 4×6 apron
    failed = [n for (ok, _, _), n in zip(results, ["diagonal", "ink_box", "apron"]) if not ok]
    # strip
    strip = Image.new("RGBA", (12 * 6 + 8, 20), (40, 40, 40, 255))
    x = 4
    for ok, src, out in results:
        strip.paste(src.resize((src.width * 2, src.height * 2), Image.Resampling.NEAREST), (x, 2))
        strip.paste(out.resize((out.width * 2, out.height * 2), Image.Resampling.NEAREST), (x + 26, 2))
        x += 12 * 2 + 8
    Path("/tmp/flood_cases.png").parent.mkdir(parents=True, exist_ok=True)
    strip.resize((strip.width * 4, strip.height * 4), Image.Resampling.NEAREST).save(
        "/tmp/flood_cases.png"
    )
    print("strip /tmp/flood_cases.png")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
