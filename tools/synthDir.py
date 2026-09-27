#!/usr/bin/env python3
"""Synthesize SIDE and UP from lock idle. Same S, same feet. No new faces."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

SPR = Path(__file__).resolve().parents[1] / "public/art/gen/sprites"
CAST = ("mabel", "holt", "elena", "tommy", "marcus", "priya", "jordan", "player")
W, H = 32, 64


def opaque_h(im: Image.Image) -> int:
    bb = im.getbbox()
    return (bb[3] - bb[1]) if bb else 0


def synth_side(idle: Image.Image) -> Image.Image:
    a = np.array(idle.convert("RGBA"))
    out = np.zeros_like(a)
    h, w = a.shape[:2]
    cx = (w - 1) / 2.0
    for y in range(h):
        k = 1.08 if 12 <= y < 52 else 1.0
        for x in range(w):
            sx = int(round(cx + (x - cx) * k))
            if 0 <= sx < w:
                out[y, x] = a[y, sx]
    out[52:] = a[52:]
    return Image.fromarray(out)


def synth_up(idle: Image.Image) -> Image.Image:
    a = np.array(idle.convert("RGBA")).copy()
    h, w = a.shape[:2]
    top = a[:10, :, :3].astype(np.float32)
    a[:10, :, :3] = np.clip(top * 0.55, 0, 255).astype(np.uint8)
    for y in range(8, 20):
        for x in range(w):
            if a[y, x, 3] < 12:
                continue
            lum = int(a[y, x, :3].mean())
            if lum < 90:
                hy = max(0, y - 8)
                if a[hy, x, 3] > 12:
                    a[y, x] = a[hy, x]
    return Image.fromarray(a)


def main() -> None:
    rows = []
    for who in CAST:
        idle_p = SPR / f"{who}_idle_32.png"
        idle = Image.open(idle_p).convert("RGBA")
        ih = opaque_h(idle)
        side = synth_side(idle)
        up = synth_up(idle)
        sh, uh = opaque_h(side), opaque_h(up)
        ok_s = sh >= int(ih * 0.85)
        ok_u = uh >= int(ih * 0.85)
        if not ok_s:
            side = idle.copy()
        if not ok_u:
            up = idle.copy()
        side.save(SPR / f"{who}_side.png")
        up.save(SPR / f"{who}_up.png")
        rows.append(f"{who:8} idle_h={ih} side_h={sh} {'OK' if ok_s else 'IDLE'} up_h={uh} {'OK' if ok_u else 'IDLE'}")
    print("\n".join(rows))


if __name__ == "__main__":
    main()
