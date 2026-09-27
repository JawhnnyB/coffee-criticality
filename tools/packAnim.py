#!/usr/bin/env python3
"""Pillar E packer.

Do not re-Imagine. Do not paint a second face. Idle is the identity ruler.

- Copy idle rows 0–20 onto walk4 down + side so the face never blinks off.
- Up row keeps a hair crown, never a front face on the back of the head.
- Sit cell: drop the idle figure 10px (feet still plant), tuck legs.
- Alpha 0 or 255. No cream flood.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SPR = ROOT / "public/art/gen/sprites"
CAST = ("mabel", "holt", "elena", "tommy", "marcus", "priya", "jordan", "player")

CELL_W = 32
CELL_H = 64
HEAD = 21  # rows 0..20 inclusive
HAIR = 9
SIT_DROP = 10


def harden(im: Image.Image) -> Image.Image:
    a = np.array(im.convert("RGBA"))
    a[:, :, 3] = np.where(a[:, :, 3] >= 96, 255, 0)
    return Image.fromarray(a)


def stamp_head(idle: np.ndarray, cell: np.ndarray, back: bool) -> np.ndarray:
    out = cell.copy()
    if back:
        out[:HAIR] = idle[:HAIR]
        # Cover leftover face oval with crown hair so up never shows eyes.
        crown = idle[3:9, 10:22]
        op = crown[:, :, 3] > 200
        if op.any():
            hair = tuple(int(x) for x in crown[op].mean(0)[:3]) + (255,)
            tmp = Image.fromarray(out)
            ImageDraw.Draw(tmp).ellipse([9, 8, 22, 20], fill=hair)
            out = np.array(tmp)
        return out
    out[:HEAD] = idle[:HEAD]
    return out


def pack_walk4(who: str, idle_im: Image.Image) -> Image.Image:
    path = SPR / f"{who}_walk4.png"
    walk = Image.open(path).convert("RGBA")
    if walk.size != (CELL_W * 4, CELL_H * 3):
        raise SystemExit(f"{path} is {walk.size}, want 128x192")
    idle = np.array(idle_im.convert("RGBA"))
    sheet = np.array(walk)
    for row in range(3):
        back = row == 2
        for col in range(4):
            x0, y0 = col * CELL_W, row * CELL_H
            cell = sheet[y0 : y0 + CELL_H, x0 : x0 + CELL_W]
            sheet[y0 : y0 + CELL_H, x0 : x0 + CELL_W] = stamp_head(idle, cell, back)
    return harden(Image.fromarray(sheet))


def pack_sit(idle_im: Image.Image) -> Image.Image:
    """Drop the idle figure into the chair. Keep the lock face. No painted lap."""
    a = np.array(idle_im.convert("RGBA"))
    out = np.zeros_like(a)
    out[SIT_DROP:] = a[:-SIT_DROP]
    return harden(Image.fromarray(out))


def preview(cast_sheets: list[tuple[str, Image.Image, Image.Image]]) -> Image.Image:
    cols = 4
    rows = len(cast_sheets)
    canvas = Image.new("RGBA", (CELL_W * cols + 8, CELL_H * rows + 8), (255, 0, 255, 255))
    for i, (_who, walk, sit) in enumerate(cast_sheets):
        y = 4 + i * CELL_H
        down = walk.crop((0, 0, CELL_W, CELL_H))
        side = walk.crop((CELL_W, CELL_H, CELL_W * 2, CELL_H * 2))
        up = walk.crop((0, CELL_H * 2, CELL_W, CELL_H * 3))
        canvas.paste(down, (4, y), down)
        canvas.paste(side, (4 + CELL_W, y), side)
        canvas.paste(up, (4 + CELL_W * 2, y), up)
        canvas.paste(sit, (4 + CELL_W * 3, y), sit)
    return canvas


def main() -> None:
    SPR.mkdir(parents=True, exist_ok=True)
    sheets: list[tuple[str, Image.Image, Image.Image]] = []
    for who in CAST:
        idle_p = SPR / f"{who}_idle_32.png"
        if not idle_p.exists():
            raise SystemExit(f"missing idle {idle_p}")
        idle = harden(Image.open(idle_p))
        walk = pack_walk4(who, idle)
        sit = pack_sit(idle)
        walk.save(SPR / f"{who}_walk4.png")
        sit.save(SPR / f"{who}_sit.png")
        sheets.append((who, walk, sit))
        print(f"anim {who:8} walk4={walk.size} sit={sit.size}")
    prev = preview(sheets)
    out = ROOT / "screenshots" / "pillarE-atlas.png"
    try:
        prev.save(out)
        print(f"preview {out}")
    except OSError:
        prev.save("/tmp/pillarE-atlas.png")


if __name__ == "__main__":
    main()
