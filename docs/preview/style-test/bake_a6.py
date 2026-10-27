#!/usr/bin/env python3
"""A6 variants on the A5 grids. Body shapes are not redrawn."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bake_a2 as b
import bake_a3 as a3
import bake_a5 as a5

O = b.O
SILVER_L = (0xE4, 0xDE, 0xD4)
SILVER = (0xC8, 0xC0, 0xB4)
SILVER_D = (0x9E, 0x96, 0x8C)
HAT_L, HAT, HAT_D = (0xF0, 0xD0, 0x48), (0xE0, 0xB0, 0x28), (0xA8, 0x78, 0x18)
CREAM = (0xF4, 0xEF, 0xE4)
CLIP = (0x8A, 0x5A, 0x3A)

_palette = a5.palette


def palette(who):
    col = dict(_palette(who))
    if who == "mabel":
        col["h"], col["H"], col["d"] = SILVER_L, SILVER, SILVER_D
    return col


a5.palette = palette


def opaque_xs(im, y):
    if not (0 <= y < im.shape[0]):
        return []
    return [x for x in range(im.shape[1]) if im[y, x, 3]]


def head_top(im):
    for y in range(im.shape[0]):
        xs = opaque_xs(im, y)
        if xs:
            return y, xs
    return 0, []


def is_skin(im, x, y, who):
    return a5.is_col(im, x, y, set(b.SKIN[who]))


def put(im, x, y, col, who):
    if not (0 <= x < im.shape[1] and 0 <= y < im.shape[0]):
        return
    if im[y, x, 3]:
        c = tuple(int(v) for v in im[y, x, :3])
        if c in (b.EYE, a5.WHITE, b.MOUTH, b.BLUSH) or is_skin(im, x, y, who):
            return
    b.px(im, x, y, col)


def add_bun(im, view):
    """4x3 bun on the top-back. The cap underneath stays the player's cap."""
    top, xs = head_top(im)
    if not xs:
        return
    if view == "right":
        x0 = min(xs) - 1
    else:
        x0 = (min(xs) + max(xs)) // 2 - 1
    # 4x3, on the rows above the cap. The cap outline stays.
    rows = (
        (top - 3, (1, 2), SILVER_L),
        (top - 2, (0, 1, 2, 3), SILVER),
        (top - 1, (0, 1, 2, 3), SILVER),
    )
    for y, offs, col in rows:
        for i in offs:
            put(im, x0 + i, y, SILVER_D if i == 3 else col, "mabel")


def add_hat(im, view):
    """Hard-hat dome, 10px wide, 1px side brim, short front brim."""
    top, xs = head_top(im)
    if not xs:
        return
    cx = (min(xs) + max(xs)) // 2
    # Inclusive. Widest dome row is cx-4..cx+5 = 10px.
    dome = {
        top - 2: (cx - 1, cx + 2),
        top - 1: (cx - 3, cx + 4),
        top: (cx - 4, cx + 5),
        top + 1: (cx - 4, cx + 5),
    }
    brim_y = top + 2
    if view == "right":
        brim = (cx - 5, cx + 7)  # 1px back, 2px front of the dome
        visor = None
    else:
        brim = (cx - 5, cx + 6)  # 1px past the dome on each side
        visor = (cx - 2, cx + 3) if view == "down" else None
    spans = dict(dome)
    spans[brim_y] = brim
    for y, (x0, x1) in spans.items():
        if not (0 <= y < im.shape[0]):
            continue
        if any(is_skin(im, x, y, "tommy") for x in range(im.shape[1])):
            continue
        for x in opaque_xs(im, y):
            if x < x0 or x > x1:
                im[y, x] = (0, 0, 0, 0)
    for y, (x0, x1) in dome.items():
        for x in range(x0, x1 + 1):
            if x <= x0 + 1 and y <= top - 1:
                col = HAT_L
            elif x >= x1 - 1:
                col = HAT_D
            else:
                col = HAT
            put(im, x, y, col, "tommy")
    x0, x1 = brim
    for x in range(x0, x1 + 1):
        put(im, x, brim_y, HAT_D, "tommy")
    if visor is not None:
        x0, x1 = visor
        for x in range(x0, x1 + 1):
            put(im, x, brim_y + 1, HAT_D, "tommy")


def add_clipboard(im, view):
    """4x4 board on the hip, overlapping the shirt. No gap. Hidden from behind."""
    if view == "up":
        return
    shirt = set(b.SHIRT["elena"])
    skin, skin_d = b.SKIN["elena"][1], b.SKIN["elena"][2]
    ys = [
        y for y in range(im.shape[0])
        if any(a5.is_col(im, x, y, shirt) for x in range(im.shape[1]))
    ]
    if len(ys) < 4:
        return
    hip = ys[-4:]
    rights = []
    for y in hip:
        xs = [x for x in range(im.shape[1]) if a5.is_col(im, x, y, shirt)]
        if xs:
            rights.append(max(xs))
    if not rights:
        return
    x0 = max(rights) - 1
    y0 = hip[0]
    for y in range(y0, y0 + 4):
        for x in range(x0, x0 + 4):
            b.px(im, x, y, O)
    for y in range(y0 + 1, y0 + 3):
        b.px(im, x0 + 1, y, CREAM)
        b.px(im, x0 + 2, y, CREAM)
    b.px(im, x0 + 1, y0 + 1, CLIP)
    b.px(im, x0 + 2, y0 + 1, CLIP)
    b.px(im, x0, y0 + 2, skin)
    b.px(im, x0, y0 + 3, skin_d)


def decorate(im, who, view):
    if who == "mabel":
        add_bun(im, view)
    elif who == "elena":
        a5.add_long_hair(im, who, view)
        add_clipboard(im, view)
    elif who == "tommy":
        add_hat(im, view)
    b.add_outline(im)
    return im


def build(who, grids):
    out = {}
    for view in ("down", "up", "right"):
        out[view] = [decorate(a5.paint(rows, who), who, view) for rows in grids[view]]
    out["left"] = [np.fliplr(fr).copy() for fr in out["right"]]
    return out


def main():
    grids = a5.load_grids()
    room = a3.scene({"mabel": a3.paint_char("mabel")}, with_player=False)
    for who in ("mabel", "elena", "tommy"):
        cycles = build(who, grids)
        stem = f"walk-A6-{who}"
        b.save_pair(stem, a5.sheet(cycles))
        n = a5.walk_gif(room, cycles["right"], f"{stem}.gif")
        print(who, n)


if __name__ == "__main__":
    main()
