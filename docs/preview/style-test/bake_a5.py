#!/usr/bin/env python3
"""A5 walk. The frames are the hand-drawn grids, recolored. Not a generated cycle."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bake_a2 as b
import bake_a3 as a3

OUT = Path(__file__).resolve().parent
O = b.O
EYE = b.EYE
WHITE = (0xFF, 0xF6, 0xE6)
MOUTH = b.MOUTH
BLUSH = b.BLUSH
HAT_L, HAT, HAT_D = (0xF0, 0xD0, 0x48), (0xE0, 0xB0, 0x28), (0xA8, 0x78, 0x18)
CREAM, CREAM_D = (0xF6, 0xF0, 0xE2), (0xC8, 0x6A, 0x48)
TAN = (0xE8, 0xC4, 0x8A)
PAL = set(".OHhdSsBEWMCckPpF")

# Room to spare above the 16x27 grid for a bun or a hat brim.
GX, GY = 4, 8
CW, CH = 24, 40

b.FONT["w"] = ["101", "101", "111", "111", "101"]
b.FONT["f"] = ["111", "100", "110", "100", "100"]
b.FONT["g"] = ["011", "101", "101", "011", "001"]


def load_grids():
    text = (OUT / "walk-grids.txt").read_text().splitlines()
    frames = {k: [None] * 4 for k in ("down", "up", "right")}
    name = None
    rows = []

    def flush():
        if not name:
            return
        view, _, idx = name.split()
        frames[view][int(idx)] = rows[:]

    for line in text:
        if line.startswith("---"):
            flush()
            name = line.strip("- ").lower()
            rows = []
        elif name and line and set(line) <= PAL:
            rows.append(line)
    flush()
    for view, group in frames.items():
        for i, rows in enumerate(group):
            if rows is None or len(rows) != 27 or any(len(r) != 16 for r in rows):
                raise SystemExit(f"grid {view} {i} is not the 16x27 drawing")
    return frames


def palette(who):
    hl, hb, hd = b.HAIR[who]
    _sl, sb, sd = b.SKIN[who]
    cl, cb, cd = b.SHIRT[who]
    _pl, pb, pd = b.PANTS[who]
    _fl, fb, _fd = b.BOOT
    return {
        "O": O, "H": hb, "h": hl, "d": hd,
        "S": sb, "s": sd, "B": BLUSH,
        "E": EYE, "W": WHITE, "M": MOUTH,
        "C": cb, "c": cl, "k": cd,
        "P": pb, "p": pd, "F": fb,
    }


def paint(rows, who):
    im = np.zeros((CH, CW, 4), np.uint8)
    col = palette(who)
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch != ".":
                b.px(im, GX + x, GY + y, col[ch])
    return im


def is_col(im, x, y, cols):
    if not (0 <= x < im.shape[1] and 0 <= y < im.shape[0]):
        return False
    if im[y, x, 3] == 0:
        return False
    return tuple(int(v) for v in im[y, x, :3]) in cols


def hair_cols(who):
    return set(b.HAIR[who])


def skin_cols(who):
    return set(b.SKIN[who])


def add_glasses(im, who):
    skin = skin_cols(who)
    eyes = [
        (x, y)
        for y in range(im.shape[0])
        for x in range(im.shape[1])
        if is_col(im, x, y, {EYE})
    ]
    if not eyes:
        return
    xs = sorted({x for x, _ in eyes})
    if max(xs) - min(xs) < 3:
        # Profile. A rim on the front of the eye, not a bar.
        x = max(xs)
        y = min(y for ex, y in eyes if ex == x)
        for yy in (y, y + 1):
            if im[yy, x + 1, 3] == 0 or is_col(im, x + 1, yy, skin):
                b.px(im, x + 1, yy, O)
        return
    left, right = min(xs), max(xs)
    y = min(y for x, y in eyes if x == left)
    for yy in (y, y + 1):
        if is_col(im, left - 1, yy, skin):
            b.px(im, left - 1, yy, O)
        if is_col(im, right + 1, yy, skin):
            b.px(im, right + 1, yy, O)
    for bx in range(left + 2, right):
        if is_col(im, bx, y, skin):
            b.px(im, bx, y, O)
            break


def add_bun(im, who):
    cols = hair_cols(who)
    ys = [y for y in range(im.shape[0]) if any(is_col(im, x, y, cols) for x in range(im.shape[1]))]
    if not ys:
        return
    top = min(ys)
    xs = [x for x in range(im.shape[1]) if is_col(im, x, top, cols) or is_col(im, x, top, {O})]
    cx = (min(xs) + max(xs)) // 2
    hl, hb, hd = b.HAIR[who]
    cy = top - 1
    for y in range(cy - 3, cy + 2):
        for x in range(cx - 3, cx + 4):
            if (x - cx) ** 2 + (y - cy) ** 2 > 10:
                continue
            if im[y, x, 3] and not is_col(im, x, y, cols | {O}):
                continue
            if x <= cx and y <= cy:
                b.px(im, x, y, hl)
            elif x >= cx + 1:
                b.px(im, x, y, hd)
            else:
                b.px(im, x, y, hb)


def add_hat(im, who):
    cols = hair_cols(who)
    ys = [y for y in range(im.shape[0]) if any(is_col(im, x, y, cols) for x in range(im.shape[1]))]
    if not ys:
        return
    top = min(ys)
    for y in range(top, top + 5):
        for x in range(im.shape[1]):
            if not is_col(im, x, y, cols):
                continue
            if y <= top + 1 and x < im.shape[1] // 2:
                b.px(im, x, y, HAT_L)
            elif x > im.shape[1] // 2 + 2:
                b.px(im, x, y, HAT_D)
            else:
                b.px(im, x, y, HAT)
    brim = top + 4
    xs = [x for x in range(im.shape[1]) if im[brim, x, 3]]
    if not xs:
        return
    for x in range(min(xs) - 2, max(xs) + 3):
        if im[brim, x, 3] == 0:
            b.px(im, x, brim, HAT_D if x > im.shape[1] // 2 else HAT)


def add_long_hair(im, who, view):
    hl, hb, hd = b.HAIR[who]
    cols = hair_cols(who)
    if view == "down":
        # A lock on each side, starting from the existing hair so it stays attached.
        for side in (-1, 1):
            seeds = [
                (x, y)
                for y in range(im.shape[0])
                for x in range(im.shape[1])
                if is_col(im, x, y, cols) and im[y, x + side, 3] == 0
            ]
            if not seeds:
                continue
            x, y = max(seeds, key=lambda p: p[1])
            for i in range(5):
                b.px(im, x + side, y + i, hd if side > 0 else hb)
    elif view == "right":
        seeds = [
            (x, y)
            for y in range(im.shape[0])
            for x in range(im.shape[1])
            if is_col(im, x, y, cols) and (x == 0 or im[y, x - 1, 3] == 0)
        ]
        if not seeds:
            return
        x, y = max(seeds, key=lambda p: p[1])
        for i in range(8):
            b.px(im, x - 1, y + i, hd)
            b.px(im, x, y + i, hb)


def add_clipboard(im, view):
    # Empty pixels beside the shirt, so the legs stay the drawn shape.
    shirt = set()
    # filled after we know the shirt colors; search opaque mid-body instead
    ys, xs = np.where(im[:, :, 3] > 0)
    if len(ys) == 0:
        return
    mid = int(np.median(ys))
    if view == "right":
        x = int(xs.max()) + 1
        y = mid - 2
    else:
        x = int(xs.max()) - 2
        y = mid
        # step left until we are just outside the body
        while x > 0 and im[y, x, 3]:
            x += 1
        if x > CW - 6:
            x = CW - 6
    b.fill(im, x, y, 5, 7, CREAM)
    b.fill(im, x, y, 5, 2, CREAM_D)


def decorate(im, who, view):
    if who == "player" and view != "up":
        add_glasses(im, who)
    elif who == "mabel":
        add_bun(im, who)
    elif who == "elena":
        add_long_hair(im, who, view)
        if view != "up":
            add_clipboard(im, view)
    elif who == "tommy":
        add_hat(im, who)
    b.add_outline(im)
    return im


def build(who, grids):
    out = {}
    for view in ("down", "up", "right"):
        out[view] = [decorate(paint(rows, who), who, view) for rows in grids[view]]
    out["left"] = [np.fliplr(fr).copy() for fr in out["right"]]
    return out


def sheet(cycles):
    order = ("down", "up", "right", "left")
    gap = 6
    label_w = b.text_width("right") + 8
    width = label_w + 4 * (CW + gap) + gap
    height = 4 * (CH + gap) + gap
    im = np.zeros((height, width, 4), np.uint8)
    b.fill(im, 0, 0, width, height, TAN)
    for r, name in enumerate(order):
        y = gap + r * (CH + gap)
        b.text(im, name, 4, y + 12, O, 1)
        for c, fr in enumerate(cycles[name]):
            b.stamp(im, fr, label_w + gap + c * (CW + gap), y)
    return im


def gif_delays(path):
    data = Path(path).read_bytes()
    delays = []
    i = 0
    while True:
        j = data.find(b"\x21\xF9\x04", i)
        if j < 0:
            break
        delays.append(data[j + 4] | (data[j + 5] << 8))
        i = j + 6
    return delays


def walk_gif(room, frames, name):
    # The drawn stride is about 8px between the two boots. Two frames cover
    # contact to contact, so the body advances 4px a frame.
    step = 4
    xs = list(range(-CW + 8, b.SW - 8, step))
    foot = GY + 26
    base_y = 156 - foot
    images = []
    for i, x in enumerate(xs):
        fr = room.copy()
        spr = frames[i % 4]
        a3.oval_shadow(fr, x + CW // 2, base_y + foot + 2, 7, 2)
        b.stamp(fr, spr, x, base_y)
        big = Image.fromarray(fr).resize((b.SW * 3, b.SH * 3), Image.NEAREST).convert("RGB")
        images.append(big)
    path = OUT / name
    images[0].save(
        path, save_all=True, append_images=images[1:],
        duration=120, loop=0, disposal=2, optimize=False,
    )
    delays = gif_delays(path)
    if delays != [12] * len(images):
        raise SystemExit(f"{name} delays {set(delays)} n={len(delays)}")
    return len(images)


def main():
    grids = load_grids()
    room = a3.scene({"mabel": a3.paint_char("mabel")}, with_player=False)
    for who in ("player", "mabel", "elena", "tommy"):
        cycles = build(who, grids)
        stem = "walk-A5" if who == "player" else f"walk-A5-{who}"
        b.save_pair(stem, sheet(cycles))
        n = walk_gif(room, cycles["right"], f"{stem}.gif")
        print(who, n, "frames")


if __name__ == "__main__":
    main()
