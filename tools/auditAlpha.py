#!/usr/bin/env python3
"""Rank sprite/prop/fx PNGs by cream halo and leftover magenta."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOTS = [
    Path("/workspace/public/art/gen/props"),
    Path("/workspace/public/art/gen/sprites"),
    Path("/workspace/public/art/gen/fx"),
]


def row(p: Path) -> dict:
    im = Image.open(p).convert("RGBA")
    a = np.array(im)
    r, g, b, al = a[:, :, 0].astype(int), a[:, :, 1].astype(int), a[:, :, 2].astype(int), a[:, :, 3]
    op = al > 10
    n = int(op.sum()) or 1
    cream = ((r > 210) & (g > 195) & (b > 170) & op) | (
        (np.abs(r - 243) + np.abs(g - 230) + np.abs(b - 208) < 80) & op
    )
    mag = (r > 150) & (b > 150) & (g < 200) & (np.abs(r - b) < 110) & op
    # border cream
    h, w = al.shape
    border = np.zeros_like(op)
    border[0, :] = border[-1, :] = border[:, 0] = border[:, -1] = True
    return {
        "path": str(p.relative_to("/workspace")),
        "w": im.width,
        "h": im.height,
        "opaque": op.mean(),
        "cream": cream.sum() / n,
        "mag": mag.sum() / n,
        "border_cream": int((cream & border).sum()),
    }


def main() -> None:
    rows = []
    for root in ROOTS:
        if not root.exists():
            continue
        for p in sorted(root.glob("*.png")):
            rows.append(row(p))
    rows.sort(key=lambda d: -(d["cream"] + d["mag"]))
    out = Path("/workspace/artifacts/art_walk/ALPHA_AUDIT.txt")
    out.parent.mkdir(parents=True, exist_ok=True)
    lines = ["rank  cream%  mag%  opaque%  borderC  WxH   file"]
    for i, d in enumerate(rows, 1):
        lines.append(
            f"{i:3}  {d['cream']*100:5.1f}  {d['mag']*100:5.1f}  {d['opaque']*100:6.1f}  "
            f"{d['border_cream']:6}  {d['w']:3}x{d['h']:<3}  {d['path']}"
        )
    out.write_text("\n".join(lines) + "\n")
    print(out.read_text())


if __name__ == "__main__":
    main()
