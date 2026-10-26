#!/usr/bin/env python3
"""Cafe style bake-off. Writes PNGs only. Does not touch the game."""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parent
CAST = ("player", "mabel", "holt", "elena", "tommy", "marcus", "priya", "jordan")
GLASSES = {"player", "marcus"}
FH, FW = 40, 22  # head is y=0..17 → 18/40 = 45%

# Coffee Talk: one brown family, low saturation, one copper accent. 28 swatches.
B = {
    "eye": (42, 32, 26),
    "hi": (220, 208, 190),
    "hair_d": (48, 36, 28),
    "hair": (86, 64, 48),
    "hair_l": (156, 144, 128),
    "skin_l": (196, 168, 140),
    "skin": (174, 144, 116),
    "skin_d": (146, 114, 88),
    "skin_p": (124, 90, 66),
    "cloth_l": (214, 200, 180),
    "cloth": (132, 106, 84),
    "cloth_d": (96, 74, 56),
    "pants": (74, 58, 46),
    "shoe": (58, 44, 34),
    "floor_a": (112, 92, 74),
    "floor_b": (120, 100, 82),
    "seam": (102, 84, 68),
    "wall": (84, 68, 56),
    "wall_l": (104, 86, 72),
    "trim": (70, 54, 44),
    "counter": (78, 56, 42),
    "top": (108, 82, 62),
    "shadow": (52, 40, 32),
    "accent": (186, 112, 56),
    "accent_l": (214, 156, 92),
    "accent_d": (140, 82, 42),
    "pane": (176, 168, 152),
    "day": (154, 152, 142),
}
assert len(B) <= 32

A = {
    "eye": (54, 40, 34),
    "hi": (248, 242, 230),
    "hair_d": (36, 26, 22),
    "hair": (92, 54, 36),
    "hair_l": (186, 178, 166),
    "skin_l": (236, 204, 170),
    "skin": (210, 164, 124),
    "skin_d": (176, 128, 92),
    "skin_p": (158, 104, 70),
    "cloth_l": (236, 224, 206),
    "cloth": (86, 118, 138),
    "cloth_d": (70, 86, 68),
    "pants": (64, 52, 46),
    "shoe": (48, 38, 32),
    "floor_a": (122, 100, 78),
    "floor_b": (130, 108, 86),
    "seam": (112, 92, 72),
    "wall": (96, 82, 74),
    "wall_l": (128, 112, 100),
    "trim": (78, 64, 56),
    "counter": (112, 74, 48),
    "top": (148, 108, 72),
    "shadow": (62, 48, 40),
    "accent": (196, 120, 58),
    "accent_l": (228, 168, 96),
    "accent_d": (150, 86, 42),
    "pane": (176, 198, 188),
    "day": (164, 184, 176),
    "plant": (78, 110, 72),
    "cap": (74, 104, 118),
    "gold": (204, 164, 72),
    "shirt_j": (108, 118, 78),
    "shirt_h": (132, 112, 90),
    "shirt_e": (64, 78, 70),
    "shirt_m": (120, 72, 68),
    "shirt_t": (168, 132, 92),
    "shirt_r": (122, 84, 64),
    "shirt_y": (96, 70, 78),
}


def skin_of(pal, who):
    return {
        "player": pal["skin_l"],
        "mabel": pal["skin_l"],
        "holt": pal["skin"],
        "elena": pal["skin"],
        "tommy": pal["skin"],
        "marcus": pal["skin"],
        "priya": pal["skin_p"],
        "jordan": pal["skin_d"] if pal is A else pal["skin"],
    }[who]


def hair_of(pal, who):
    if pal is A:
        return {
            "player": A["hair"],
            "mabel": A["hair_l"],
            "holt": A["hair_l"],
            "elena": A["hair_d"],
            "tommy": A["cap"],
            "marcus": (140, 72, 48),
            "priya": A["hair_d"],
            "jordan": (52, 36, 28),
        }[who]
    return {
        "player": B["hair"],
        "mabel": B["hair_l"],
        "holt": B["hair_l"],
        "elena": B["hair_d"],
        "tommy": B["cloth_d"],
        "marcus": B["hair"],
        "priya": B["hair_d"],
        "jordan": B["hair_d"],
    }[who]


def cloth_of(pal, who):
    if pal is A:
        return {
            "player": A["cloth"],
            "mabel": A["cloth_l"],
            "holt": A["shirt_h"],
            "elena": A["shirt_e"],
            "tommy": A["shirt_t"],
            "marcus": A["shirt_r"],
            "priya": A["shirt_y"],
            "jordan": A["shirt_j"],
        }[who]
    return {
        "player": B["cloth"],
        "mabel": B["cloth_l"],
        "holt": B["cloth"],
        "elena": B["cloth_d"],
        "tommy": B["cloth"],
        "marcus": B["cloth_d"],
        "priya": B["cloth_d"],
        "jordan": B["cloth"],
    }[who]


def accent_of(pal):
    return pal["gold"] if pal is A else pal["accent"]


def px(a, x, y, col):
    if 0 <= x < a.shape[1] and 0 <= y < a.shape[0] and col is not None:
        a[y, x] = (*col, 255)


def fill_rect(a, x, y, w, h, col):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            px(a, xx, yy, col)


def chibi(who: str, pal: dict) -> np.ndarray:
    """40px figure. Skull is the top 18 rows — 45% — not the hanging hair."""
    a = np.zeros((FH, FW, 4), np.uint8)
    skin = skin_of(pal, who)
    hair = hair_of(pal, who)
    hair_d = pal["hair_d"] if who != "mabel" else pal["hair"]
    cloth = cloth_of(pal, who)
    pants = pal["pants"]
    shoe = pal["shoe"]
    eye = pal["eye"]
    hi = pal["hi"]
    acc = accent_of(pal)

    # Round skull. Holt is a square jaw. Chin stays wide — no point.
    for y in range(0, 18):
        if who == "holt":
            inset = 2 if y < 3 else 0
        elif y == 0:
            inset = 4
        elif y < 3:
            inset = 2
        elif y >= 16:
            inset = 2
        elif y >= 14:
            inset = 1
        else:
            inset = 0
        for x in range(4 + inset, 18 - inset):
            px(a, x, y, skin)

    # Neck, a narrow torso, arms held off the ribs so the figure is not a box.
    fill_rect(a, 9, 17, 4, 3, skin)
    dress = cloth
    if who == "mabel":
        dress = pal["shirt_m"] if pal is A else pal["cloth_d"]
    fill_rect(a, 7, 20, 8, 11, dress)
    if who == "mabel":
        fill_rect(a, 8, 21, 6, 8, pal["cloth_l"])
    arm = pal["cloth_d"] if who != "mabel" else dress
    fill_rect(a, 4, 21, 2, 8, arm)
    fill_rect(a, 16, 21, 2, 8, arm)
    px(a, 4, 28, skin)
    px(a, 5, 28, skin)
    px(a, 16, 28, skin)
    px(a, 17, 28, skin)
    fill_rect(a, 7, 31, 3, 6, pants)
    fill_rect(a, 12, 31, 3, 6, pants)
    fill_rect(a, 6, 36, 4, 3, shoe)
    fill_rect(a, 12, 36, 4, 3, shoe)

    # 2×2 eyes, highlight in the top-right pixel. No nose. No mouth.
    for x0 in (7, 12):
        for dy in (0, 1):
            for dx in (0, 1):
                px(a, x0 + dx, 8 + dy, hi if dx == 1 and dy == 0 else eye)

    if who in GLASSES:
        for x in (7, 8, 12, 13):
            px(a, x, 7, eye)
        px(a, 10, 7, eye)
        px(a, 6, 8, eye)
        px(a, 15, 8, eye)

    if who == "jordan":
        px(a, 15, 12, pal["skin_p"] if pal is A else pal["skin_d"])
    if who == "priya":
        px(a, 10, 5, acc)

    # Hair. Fringe stops above the eyes.
    if who == "tommy":
        cap = pal["cap"] if pal is A else pal["cloth_d"]
        cap_d = pal["hair_d"]
        fill_rect(a, 3, 0, 16, 6, cap)
        fill_rect(a, 2, 6, 18, 2, cap_d)
        px(a, 4, 1, pal["cloth_l"])
        return a
    if who == "holt":
        for y in range(5, 16):
            px(a, 3, y, hair)
            px(a, 4, y, hair_d)
            px(a, 17, y, hair_d)
            px(a, 18, y, hair)
        fill_rect(a, 5, 0, 12, 2, hair)
        return a

    for y in range(0, 6):
        inset = 3 if y == 0 else 1 if y == 1 else 0
        for x in range(3 + inset, 19 - inset):
            if who == "holt":
                continue
            px(a, x, y, hair if (x + y) % 5 else hair_d)
    for y in range(6, 13):
        px(a, 3, y, hair)
        px(a, 4, y, hair_d)
        px(a, 17, y, hair_d)
        px(a, 18, y, hair)
    if who == "player":
        for x in range(7, 15):
            px(a, x, 6, hair_d)
    elif who == "mabel":
        for y in range(1, 10):
            for x in range(14, 22):
                if (x - 18) ** 2 + (y - 5) ** 2 <= 12:
                    px(a, x, y, hair if y > 2 else hair_d)
        px(a, 19, 3, acc)
        px(a, 20, 3, acc)
    elif who == "elena":
        for y in range(6, 32):
            px(a, 2, y, hair)
            px(a, 3, y, hair_d)
            px(a, 18, y, hair_d)
            px(a, 19, y, hair)
        px(a, 19, 11, acc)
    elif who == "priya":
        for y in range(8, 28):
            px(a, 18, y, hair)
            px(a, 19, y, hair_d)
    elif who == "marcus":
        for x in range(8, 15):
            px(a, x, 6, hair_d)
    elif who == "jordan":
        for x in range(6, 16):
            if x % 2 == 0:
                px(a, x, 6, hair)
    return a


def lum(c) -> float:
    return 0.25 * c[0] + 0.55 * c[1] + 0.20 * c[2]


def darken(col, pal):
    r = max(40, int(col[0] * 0.72))
    g = max(32, int(col[1] * 0.70))
    b = max(26, int(col[2] * 0.68))
    if pal is A:
        return (r, g, b)
    return nearest((r, g, b), list(B.values()))


def nearest(col, swatches):
    best = swatches[0]
    bd = 1e9
    for s in swatches:
        d = (col[0] - s[0]) ** 2 + (col[1] - s[1]) ** 2 + (col[2] - s[2]) ** 2
        if d < bd:
            bd = d
            best = s
    return best


def stamp(dest, spr, ox, oy, pal):
    h, w = spr.shape[:2]
    H, W = dest.shape[:2]
    for y in range(h):
        for x in range(w):
            if spr[y, x, 3] < 20:
                continue
            dx, dy = ox + x, oy + y
            if not (0 <= dx < W and 0 <= dy < H):
                continue
            col = tuple(int(v) for v in spr[y, x, :3])
            edge = False
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if nx < 0 or ny < 0 or nx >= w or ny >= h or spr[ny, nx, 3] < 20:
                    edge = True
                    break
            if edge:
                bg = tuple(int(v) for v in dest[dy, dx, :3])
                # Selective: only where a light form would vanish. Dark hair needs no ink.
                if lum(col) > 90 and abs(lum(col) - lum(bg)) < 36:
                    col = darken(col, pal)
            dest[dy, dx, :3] = col
            dest[dy, dx, 3] = 255


def planks(a, pal, y0, y1):
    h, w = a.shape[:2]
    for y in range(y0, min(y1, h)):
        band = ((y - y0) // 8) % 2
        col = pal["floor_a"] if band == 0 else pal["floor_b"]
        seam = (y - y0) % 8 == 0
        for x in range(w):
            c = pal["seam"] if seam else col
            # a knot, very quiet
            if not seam and (x + y * 3) % 47 == 0:
                c = pal["seam"]
            a[y, x] = (*c, 255)


def wall(a, pal, y1):
    for y in range(y1):
        col = pal["wall"] if y % 9 else pal["wall_l"]
        for x in range(a.shape[1]):
            a[y, x] = (*col, 255)
    for x in range(a.shape[1]):
        a[y1 - 1, x] = (*pal["trim"], 255)
        a[y1 - 2, x] = (*pal["trim"], 255)


def window(a, pal, x, y, w, h):
    fill_rect(a, x, y, w, h, pal["trim"])
    fill_rect(a, x + 2, y + 2, w - 4, h - 4, pal["pane"])
    mid_x = x + w // 2
    mid_y = y + h // 2
    for yy in range(y + 2, y + h - 2):
        px(a, mid_x, yy, pal["trim"])
    for xx in range(x + 2, x + w - 2):
        px(a, xx, mid_y, pal["trim"])
    # sill
    fill_rect(a, x - 1, y + h, w + 2, 2, pal["top"])


def counter(a, pal, x, y, w, h):
    fill_rect(a, x, y, w, h, pal["counter"])
    fill_rect(a, x, y, w, 3, pal["top"])
    for xx in range(x + 4, x + w - 2, 14):
        px(a, xx, y + h - 4, pal["trim"])
        px(a, xx, y + h - 3, pal["trim"])


def kettle(a, pal, x, y):
    acc, d, l = pal["accent"], pal["accent_d"], pal["accent_l"]
    fill_rect(a, x + 2, y, 6, 3, d)
    fill_rect(a, x, y + 3, 10, 7, acc)
    fill_rect(a, x + 1, y + 4, 8, 5, l)
    fill_rect(a, x + 3, y + 5, 4, 3, acc)
    px(a, x + 10, y + 5, d)
    px(a, x + 11, y + 4, d)
    px(a, x + 11, y + 6, d)
    # steam, two pixels, not a new colour
    px(a, x + 4, y - 2, pal["hi"])
    px(a, x + 6, y - 3, pal["pane"])


def lamp(a, pal, x, y):
    d, acc, l = pal["accent_d"], pal["accent"], pal["accent_l"]
    fill_rect(a, x + 2, y, 12, 3, d)
    fill_rect(a, x + 1, y + 3, 14, 6, acc)
    fill_rect(a, x + 4, y + 4, 8, 3, l)
    px(a, x + 7, y + 5, pal["hi"])
    for i in range(18):
        px(a, x + 7, y + 9 + i, pal["trim"])
        px(a, x + 8, y + 9 + i, pal["shadow"])
    fill_rect(a, x + 3, y + 27, 10, 3, pal["trim"])


def plant(a, pal, x, y):
    leaf = pal["plant"] if pal is A else pal["cloth_d"]
    pot = pal["accent_d"]
    fill_rect(a, x + 2, y + 8, 8, 5, pot)
    fill_rect(a, x + 1, y + 2, 4, 6, leaf)
    fill_rect(a, x + 5, y, 5, 7, leaf)
    px(a, x + 3, y + 1, pal["top"] if pal is A else pal["cloth"])


def scene(pal) -> np.ndarray:
    W, H = 240, 144
    a = np.zeros((H, W, 4), np.uint8)
    planks(a, pal, 0, H)
    wall(a, pal, 50)
    window(a, pal, 22, 8, 70, 28)
    plant(a, pal, 8, 78)
    # Mabel behind the counter, then the counter covers her legs.
    stamp(a, chibi("mabel", pal), 86, 16, pal)
    counter(a, pal, 28, 54, 156, 18)
    kettle(a, pal, 150, 42)
    # two cups
    fill_rect(a, 48, 48, 5, 5, pal["cloth_l"])
    fill_rect(a, 70, 48, 5, 5, pal["accent"])
    stamp(a, chibi("elena", pal), 36, 86, pal)
    stamp(a, chibi("player", pal), 84, 90, pal)
    stamp(a, chibi("jordan", pal), 132, 86, pal)
    lamp(a, pal, 196, 36)
    return a


FONT = {
    "a": ["010", "101", "111", "101", "101"],
    "b": ["110", "101", "110", "101", "110"],
    "d": ["011", "101", "101", "101", "011"],
    "e": ["111", "100", "110", "100", "111"],
    "h": ["100", "100", "110", "101", "101"],
    "i": ["1", "0", "1", "1", "1"],
    "j": ["001", "000", "001", "101", "010"],
    "l": ["10", "10", "10", "10", "11"],
    "m": ["10101", "11111", "10101", "10101", "10101"],
    "n": ["110", "101", "101", "101", "101"],
    "o": ["010", "101", "101", "101", "010"],
    "p": ["110", "101", "110", "100", "100"],
    "r": ["110", "101", "110", "101", "101"],
    "s": ["011", "100", "010", "001", "110"],
    "t": ["111", "010", "010", "010", "010"],
    "u": ["101", "101", "101", "101", "010"],
    "y": ["101", "101", "010", "010", "010"],
    "c": ["011", "100", "100", "100", "011"],
}


def text(a, s, x, y, col):
    cx = x
    for ch in s:
        g = FONT.get(ch)
        if not g:
            cx += 4
            continue
        for yy, row in enumerate(g):
            for xx, bit in enumerate(row):
                if bit == "1":
                    px(a, cx + xx, y + yy, col)
        cx += len(g[0]) + 1


def cast_sheet(pal) -> np.ndarray:
    gap = 12
    w = len(CAST) * (FW + gap) + gap
    h = FH + 18
    a = np.zeros((h, w, 4), np.uint8)
    planks(a, pal, 0, h)
    for i, who in enumerate(CAST):
        ox = gap + i * (FW + gap)
        stamp(a, chibi(who, pal), ox, 2, pal)
        text(a, who, ox, FH + 6, pal["shadow"])
    return a


BAYER = (
    (0, 8, 2, 10),
    (12, 4, 14, 6),
    (3, 11, 1, 9),
    (15, 7, 13, 5),
)


def apply_eastward(src: np.ndarray, lamp, window_floor) -> np.ndarray:
    """Dim room, one warm pool with a dithered edge, window light on the floor."""
    sw = list(B.values())
    h, w = src.shape[:2]
    out = src.copy()
    lx, ly = lamp
    r0, r1 = 28, 74
    wx, wy, ww, wh = window_floor
    for y in range(h):
        for x in range(w):
            if src[y, x, 3] < 20:
                continue
            p = src[y, x, :3].astype(np.int16)
            dim = nearest(tuple(int(v) for v in np.clip(p * 0.62, 0, 255)), sw)
            warm = nearest(tuple(int(v) for v in np.clip(p * 0.50 + np.array(B["accent_l"]) * 0.55, 0, 255)), sw)
            cool = nearest(tuple(int(v) for v in np.clip(p * 0.62 + np.array(B["day"]) * 0.45, 0, 255)), sw)
            d = math.hypot(x - lx, y - ly)
            thresh = BAYER[y & 3][x & 3] / 16
            if d <= r0:
                col = warm
            elif d <= r1:
                t = (d - r0) / (r1 - r0)
                col = warm if thresh > t else dim
            else:
                col = dim
            if wx <= x < wx + ww and wy <= y < wy + wh:
                t = (y - wy) / max(1, wh)
                # dithered pool from the sill, cooler than the lamp
                if thresh > t * 0.9 and d > r0 * 0.6:
                    col = cool
                elif d <= r0:
                    col = warm
            out[y, x, :3] = col
    return out


def save_pair(name: str, arr: np.ndarray) -> None:
    im = Image.fromarray(arr)
    im.save(OUT / f"{name}.png")
    im.resize((im.width * 3, im.height * 3), Image.NEAREST).save(OUT / f"{name}-3x.png")


def unique_count(arr) -> int:
    pix = arr[arr[:, :, 3] > 0][:, :3]
    return len({tuple(int(v) for v in p) for p in pix})


def main() -> None:
    for who in CAST:
        spr = chibi(who, A)
        head = int(spr[:18, :, 3].max() > 0)
        assert head == 1
    scene_a = scene(A)
    scene_b = scene(B)
    # Lamp pool sits on the shade. Window light falls on the floor under the sash.
    scene_c = apply_eastward(scene_b, lamp=(210, 48), window_floor=(24, 78, 78, 52))
    save_pair("style-A", scene_a)
    save_pair("style-B", scene_b)
    save_pair("style-C", scene_c)
    cast_a = cast_sheet(A)
    cast_b = cast_sheet(B)
    cast_c = apply_eastward(cast_b, lamp=(cast_b.shape[1] // 2, 24), window_floor=(0, 28, 70, 24))
    save_pair("cast-A", cast_a)
    save_pair("cast-B", cast_b)
    save_pair("cast-C", cast_c)
    print("A colours", unique_count(scene_a))
    print("B colours", unique_count(scene_b), "swatches", len(B))
    print("C colours", unique_count(scene_c))
    # Head ratio on the skull, ignoring Elena's hanging hair.
    spr = chibi("player", A)
    ys = np.where(spr[:, :, 3] > 0)[0]
    print("figure", int(ys.max() - ys.min() + 1), "skull rows 18 ratio", 18 / FH)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
