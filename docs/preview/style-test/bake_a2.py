#!/usr/bin/env python3
"""Style A2 only. Writes preview PNGs. Does not touch the game."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parent
CAST = ("player", "mabel", "holt", "elena", "tommy", "marcus", "priya", "jordan")
GLASSES = {"player", "marcus"}

# Left half of the 16x26 template. Mirrored. Right eye swaps E/W.
# Hand row is 2px of skin (the drawn fist was 1px; the brief asks for 2).
LEFT = (
    "....OOOO",
    "...OHHhh",
    "..OHHhhH",
    ".OHHhhHH",
    ".OHHHHHH",
    ".OHHHSSS",
    ".OHHSSSS",
    ".OHHSEWS",
    ".OHHSEES",
    ".OHHBBSS",
    ".OOOSSSM",
    "....OOOO",
    "...OOCCC",
    "..OCkcCC",
    "..OCkCCC",
    "..OCkCCC",
    "..OCkCCC",
    "..OCkCCC",
    "..OSSkCC",
    "..OSSkCC",
    "...OPPPP",
    "...OPPpP",
    "...OPPpP",
    "...OPPpO",
    "...OFFpO",
    "...OFFOO",
)

O = (0x3B, 0x23, 0x18)
EYE = (0x2A, 0x18, 0x10)
WHITE = (0xFF, 0xFF, 0xFF)
MOUTH = (0xB8, 0x68, 0x5A)
BLUSH = (0xE7, 0x9A, 0x86)
GOLD = (0xE8, 0xB0, 0x40)
GOLD_L = (0xF8, 0xD8, 0x78)
BINDI = (0xD4, 0x48, 0x38)

# light, base, shadow. Warm, mid saturation. No grey, no purple.
SKIN = {
    "player": ((0xFB, 0xE0, 0xC8), (0xF5, 0xC9, 0xA0), (0xDB, 0xA3, 0x7A)),
    "mabel": ((0xFB, 0xE0, 0xC8), (0xF5, 0xC9, 0xA0), (0xDB, 0xA3, 0x7A)),
    "holt": ((0xF0, 0xC8, 0xA0), (0xE0, 0xB0, 0x88), (0xC4, 0x8C, 0x68)),
    "elena": ((0xF0, 0xC0, 0x98), (0xE0, 0xA8, 0x78), (0xC0, 0x84, 0x58)),
    "tommy": ((0xF6, 0xD0, 0xB0), (0xEE, 0xB8, 0x90), (0xCC, 0x94, 0x6C)),
    "marcus": ((0xEC, 0xC0, 0x98), (0xD8, 0xA4, 0x78), (0xB8, 0x84, 0x58)),
    "priya": ((0xC4, 0x88, 0x58), (0x8D, 0x5A, 0x32), (0x6B, 0x3E, 0x22)),
    "jordan": ((0xE8, 0xB8, 0x90), (0xD0, 0x98, 0x70), (0xB0, 0x78, 0x50)),
}
HAIR = {
    "player": ((0xC4, 0x78, 0x40), (0x7A, 0x40, 0x28), (0x4E, 0x28, 0x18)),
    "mabel": ((0xF0, 0xB0, 0x68), (0xC4, 0x70, 0x38), (0x8A, 0x48, 0x22)),
    "holt": ((0xE8, 0xD0, 0xA8), (0xC4, 0xA0, 0x70), (0x8A, 0x6C, 0x48)),
    "elena": ((0x8A, 0x58, 0x44), (0x6B, 0x40, 0x30), (0x4A, 0x2C, 0x20)),
    "tommy": ((0x6A, 0x40, 0x28), (0x4A, 0x2C, 0x1C), (0x32, 0x1C, 0x14)),
    "marcus": ((0xD0, 0x78, 0x48), (0x8A, 0x44, 0x28), (0x5C, 0x2C, 0x18)),
    "priya": ((0x6A, 0x40, 0x30), (0x4A, 0x2C, 0x20), (0x32, 0x1C, 0x14)),
    "jordan": ((0x70, 0x48, 0x38), (0x4A, 0x30, 0x28), (0x32, 0x1E, 0x16)),
}
SHIRT = {
    "player": ((0x98, 0xC8, 0x60), (0x5A, 0x94, 0x38), (0x3A, 0x68, 0x24)),
    "mabel": ((0xE8, 0x78, 0x60), (0xC4, 0x50, 0x40), (0x8A, 0x34, 0x28)),
    "holt": ((0xD0, 0x98, 0x68), (0xA8, 0x70, 0x44), (0x74, 0x4C, 0x2C)),
    "elena": ((0xF0, 0xC0, 0x60), (0xD4, 0x98, 0x38), (0xA0, 0x70, 0x28)),
    "tommy": ((0xFF, 0xF0, 0xD4), (0xF0, 0xD8, 0xB0), (0xD0, 0xB0, 0x88)),
    "marcus": ((0xE0, 0x88, 0x58), (0xC0, 0x60, 0x38), (0x8A, 0x40, 0x24)),
    "priya": ((0x78, 0xB0, 0x58), (0x48, 0x80, 0x38), (0x30, 0x58, 0x24)),
    "jordan": ((0xF0, 0xB8, 0x58), (0xD0, 0x88, 0x30), (0x98, 0x60, 0x20)),
}
APRON = ((0xFF, 0xF6, 0xE4), (0xF3, 0xE2, 0xC4), (0xD4, 0xBE, 0x98))
PANTS = {
    "player": ((0x8A, 0x5C, 0x3C), (0x6A, 0x40, 0x28), (0x4A, 0x2C, 0x18)),
    "mabel": ((0xE8, 0x78, 0x60), (0xC4, 0x50, 0x40), (0x8A, 0x34, 0x28)),
    "holt": ((0x7A, 0x50, 0x34), (0x5C, 0x38, 0x24), (0x3E, 0x24, 0x16)),
    "elena": ((0x8A, 0x58, 0x30), (0x6A, 0x40, 0x22), (0x4A, 0x2C, 0x16)),
    "tommy": ((0x6A, 0x48, 0x30), (0x4E, 0x34, 0x22), (0x34, 0x22, 0x16)),
    "marcus": ((0x6E, 0x4A, 0x34), (0x52, 0x34, 0x24), (0x38, 0x22, 0x16)),
    "priya": ((0x6A, 0x44, 0x2C), (0x4A, 0x2E, 0x1C), (0x32, 0x1C, 0x12)),
    "jordan": ((0x7A, 0x52, 0x34), (0x5A, 0x3A, 0x24), (0x3E, 0x26, 0x16)),
}
BOOT = ((0x6B, 0x40, 0x28), (0x4A, 0x2C, 0x1C), (0x2E, 0x18, 0x10))
CAP = ((0xE8, 0x78, 0x58), (0xC4, 0x48, 0x30), (0x8A, 0x30, 0x18))

TX, TY = 6, 10
CW, CH = 28, 44

FONT = {
    "a": ["010", "101", "111", "101", "101"],
    "b": ["110", "101", "110", "101", "110"],
    "c": ["011", "100", "100", "100", "011"],
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
    "2": ["111", "001", "111", "100", "111"],
}


def px(a, x, y, col):
    if col is None:
        return
    if 0 <= x < a.shape[1] and 0 <= y < a.shape[0]:
        a[y, x] = (*col, 255)


def fill(a, x, y, w, h, col):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            px(a, xx, yy, col)


def stamp(dst, spr, x, y):
    h, w = spr.shape[:2]
    for yy in range(h):
        for xx in range(w):
            if spr[yy, xx, 3] == 0:
                continue
            px(dst, x + xx, y + yy, tuple(int(v) for v in spr[yy, xx, :3]))


def swap_ew(s: str) -> str:
    return "".join({"E": "W", "W": "E"}.get(c, c) for c in s)


def base_grid() -> list[list[str]]:
    rows = []
    for left in LEFT:
        assert len(left) == 8, left
        right = left[::-1]
        if "W" in left:
            right = swap_ew(right)
        rows.append(list(left + right))
    assert all(len(r) == 16 for r in rows) and len(rows) == 26
    return rows


def edit_grid(g: list[list[str]], who: str) -> None:
    if who == "holt":
        for y in range(3):
            for x in range(16):
                g[y][x] = "."
        g[3] = list("...OHhhHHhhHO...")
    elif who == "tommy":
        for y in range(5):
            for x in range(16):
                g[y][x] = "."
        cap = (
            ".....OOOOOO.....",
            "....OUUUUUUO....",
            "...OUUUUUUUUUO..",
            "..OUUUUUUUUUUUO.",
            ".OvvvvvvvvvvvvO.",
        )
        for y, row in enumerate(cap):
            g[y] = list(row)
    elif who == "jordan":
        # side-swept fringe on the forehead, clear of the eyes
        g[5][5], g[5][6], g[5][7] = "h", "H", "H"
    if who in GLASSES:
        # Posts and a one-pixel bridge, level with the eyes.
        # A bar across the forehead read as a brow.
        g[6][4] = "O"
        g[6][11] = "O"
        g[7][4] = "O"
        g[8][4] = "O"
        g[7][11] = "O"
        g[8][11] = "O"
        g[7][8] = "O"
    if who == "priya":
        g[5][7] = "I"
    if who == "jordan":
        g[8][11] = "J"


def _tone_shirt(who: str, letter: str, x: int, y: int):
    light, base, dark = SHIRT[who]
    if who == "mabel" and letter in "Cck" and 14 <= y <= 19 and 6 <= x <= 9:
        al, ab, ad = APRON
        if y <= 15 and x <= 7:
            return al
        if x >= 9:
            return ad
        return ab
    if letter == "k" or (letter in "Cc" and x >= 11):
        return dark
    if letter == "c" or (letter == "C" and y <= 14 and x <= 5):
        return light
    return base


def _tone_pants(who: str, letter: str, x: int, y: int):
    light, base, dark = PANTS[who]
    if letter == "p":
        return dark
    if letter == "P" and x in (4, 10) and y <= 22:
        return light
    return base


def _tone_boot(letter: str, x: int, y: int):
    light, base, dark = BOOT
    if letter == "p" or (y == 25 and x in (5, 11)):
        return dark
    if x in (4, 10):
        return light
    return base


def _tone_hair(who: str, letter: str, x: int, y: int):
    light, base, dark = HAIR[who]
    if letter == "h":
        return light
    if x >= 12 or (x >= 9 and y >= 5):
        return dark
    return base


def _tone_skin(who: str, x: int, y: int):
    light, base, dark = SKIN[who]
    if y <= 6 and x <= 7:
        return light
    if x >= 10 or (y >= 10 and x >= 8):
        return dark
    return base


def _tone_cap(letter: str, x: int):
    light, base, dark = CAP
    if letter == "v" or x >= 12:
        return dark
    if letter == "u" or x <= 5:
        return light
    return base


def color_of(who: str, letter: str, x: int, y: int):
    if letter in ". ":
        return None
    if letter == "O":
        return O
    if letter in "Hh":
        return _tone_hair(who, letter, x, y)
    if letter == "S":
        return _tone_skin(who, x, y)
    if letter == "B":
        return BLUSH
    if letter == "E":
        return EYE
    if letter == "W":
        return WHITE
    if letter == "M":
        return MOUTH
    if letter in "Cck":
        return _tone_shirt(who, letter, x, y)
    if letter in "Pp":
        return _tone_pants(who, letter, x, y)
    if letter in "Fp":
        return _tone_boot(letter, x, y)
    if letter in "Uuv":
        return _tone_cap(letter, x)
    if letter == "I":
        return BINDI
    if letter == "J":
        return SKIN[who][2]
    return (255, 0, 0)


def put(im, x, y, col):
    px(im, x, y, col)


def add_outline(im):
    h, w = im.shape[:2]
    extra = []
    for y in range(h):
        for x in range(w):
            if im[y, x, 3] != 0:
                continue
            for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
                ny, nx = y + dy, x + dx
                if not (0 <= ny < h and 0 <= nx < w):
                    continue
                if im[ny, nx, 3] == 0:
                    continue
                if tuple(int(v) for v in im[ny, nx, :3]) == O:
                    continue
                extra.append((x, y))
                break
    for x, y in extra:
        im[y, x] = (*O, 255)


def paint_disc(im, cx, cy, r, who, light=False):
    hl, base, dark = HAIR[who]
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 > r * r:
                continue
            if light and x <= cx and y <= cy:
                put(im, x, y, hl)
            elif x >= cx + 1 and y >= cy:
                put(im, x, y, dark)
            else:
                put(im, x, y, base)


def paint_char(who: str) -> np.ndarray:
    g = base_grid()
    edit_grid(g, who)
    im = np.zeros((CH, CW, 4), np.uint8)
    for y, row in enumerate(g):
        for x, letter in enumerate(row):
            col = color_of(who, letter, x, y)
            if col is not None:
                put(im, TX + x, TY + y, col)
    hl, base, dark = HAIR[who]
    if who == "mabel":
        paint_disc(im, TX + 8, TY - 1, 4, who, light=True)
        # sit the bun on the crown
        for x in range(TX + 5, TX + 12):
            put(im, x, TY, base if x < TX + 9 else dark)
    if who == "elena":
        for y in range(8, 24):
            for x, col in ((-1, hl), (0, base), (15, base), (16, dark)):
                gx, gy = TX + x, TY + y
                if im[gy, gx, 3] == 0:
                    put(im, gx, gy, col)
    if who == "priya":
        for i, y in enumerate(range(13, 25)):
            cols = (hl, base) if i % 2 == 0 else (base, dark)
            for dx, col in zip((15, 16), cols):
                gx, gy = TX + dx, TY + y
                if 0 <= gy < CH and im[gy, gx, 3] == 0:
                    put(im, gx, gy, col)
    add_outline(im)
    if who == "elena":
        # gold drop, then a second outline so the earring is closed
        put(im, TX - 2, TY + 10, GOLD_L)
        put(im, TX - 2, TY + 11, GOLD)
        put(im, TX + 17, TY + 10, GOLD_L)
        put(im, TX + 17, TY + 11, GOLD)
        add_outline(im)
    return im


def assert_face(who: str, im: np.ndarray) -> None:
    def at(x, y):
        p = im[TY + y, TX + x]
        assert p[3] == 255, (who, x, y)
        return tuple(int(v) for v in p[:3])

    # 2x2 eyes, highlight on the top-right, 2px skin-or-bridge gap
    assert at(5, 7) == EYE and at(6, 7) == WHITE
    assert at(5, 8) == EYE and at(6, 8) == EYE
    assert at(9, 7) == EYE and at(10, 7) == WHITE
    assert at(9, 8) == EYE and at(10, 8) == EYE
    assert at(7, 7) != EYE and at(7, 8) != EYE
    # blush 2x1, mouth 2px, outline colour
    assert at(4, 9) == BLUSH and at(5, 9) == BLUSH
    assert at(10, 9) == BLUSH and at(11, 9) == BLUSH
    assert at(7, 10) == MOUTH and at(8, 10) == MOUTH
    assert at(1, 4) == O or who in ("holt", "tommy")
    # silhouette is outlined: no naked edge
    h, w = im.shape[:2]
    for y in range(h):
        for x in range(w):
            if im[y, x, 3] == 0:
                continue
            if tuple(int(v) for v in im[y, x, :3]) == O:
                continue
            for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
                ny, nx = y + dy, x + dx
                if not (0 <= ny < h and 0 <= nx < w) or im[ny, nx, 3] == 0:
                    raise SystemExit(f"{who} naked edge at {x},{y}")


def ascii_face(who: str) -> str:
    g = base_grid()
    edit_grid(g, who)
    return "\n".join("".join(r) for r in g)


# --- room -----------------------------------------------------------------

SW, SH = 240, 168
WALL_L, WALL, WALL_D = (0xFF, 0xF4, 0xE0), (0xF6, 0xE2, 0xC4), (0xE4, 0xC8, 0xA4)
HONEY_L, HONEY, HONEY_D = (0xF0, 0xC8, 0x78), (0xE0, 0xA8, 0x50), (0xC4, 0x84, 0x38)
HONEY_S = (0xA8, 0x68, 0x28)
LEAF_L, LEAF, LEAF_D = (0x9E, 0xC8, 0x5A), (0x5A, 0x94, 0x38), (0x3A, 0x68, 0x24)
TER_L, TER, TER_D = (0xE8, 0x90, 0x70), (0xC4, 0x60, 0x40), (0x8A, 0x38, 0x28)
CREAM_L, CREAM, CREAM_D = (0xFF, 0xF8, 0xEC), (0xF3, 0xE2, 0xC4), (0xD4, 0xBE, 0x98)
COP_L, COP, COP_D = (0xF0, 0xB8, 0x68), (0xD0, 0x80, 0x40), (0xA0, 0x58, 0x28)
DAY_L, DAY = (0xFF, 0xF8, 0xE4), (0xFF, 0xE8, 0xB0)
BOARD = (0x4A, 0x5C, 0x30)
CHALK = (0xF8, 0xF0, 0xD8)


def shade_box(im, x, y, w, h, light, base, shadow, edge=True):
    fill(im, x, y, w, h, base)
    if w < 2 or h < 2:
        return
    for i in range(w):
        px(im, x + i, y, light)
        px(im, x + i, y + h - 1, shadow)
    for i in range(h):
        px(im, x, y + i, light)
        px(im, x + w - 1, y + i, shadow)
    if edge:
        px(im, x, y, O)
        px(im, x + w - 1, y, O)
        px(im, x, y + h - 1, O)
        px(im, x + w - 1, y + h - 1, O)


def plant(im, x, y, scale=1):
    """Pot at (x, y) is the rim. Leaves sit above it, lit from the top-left."""
    s = scale
    leaves = set()
    blobs = (
        (1, -6, 4, 4, LEAF_L),
        (3, -4, 4, 3, LEAF),
        (0, -3, 3, 3, LEAF),
        (4, -2, 3, 3, LEAF_D),
    )
    for dx, dy, w, h, col in blobs:
        for yy in range(h * s):
            for xx in range(w * s):
                px(im, x + dx * s + xx, y + dy * s + yy, col)
                leaves.add((x + dx * s + xx, y + dy * s + yy))
    h, w = im.shape[:2]
    for lx, ly in list(leaves):
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            nx, ny = lx + dx, ly + dy
            if (nx, ny) in leaves or not (0 <= nx < w and 0 <= ny < h):
                continue
            cur = tuple(int(v) for v in im[ny, nx, :3])
            if cur in (LEAF, LEAF_L, LEAF_D, O):
                continue
            px(im, nx, ny, O)
    shade_box(im, x, y, 8 * s, 5 * s, TER_L, TER, TER_D)
    fill(im, x - s, y, 10 * s, s, TER_L)
    px(im, x - s, y, O)
    px(im, x + 9 * s, y, O)


def curtain(im, x, y, w, h):
    for yy in range(h):
        for xx in range(w):
            if xx <= 1:
                col = LEAF_L
            elif xx >= w - 2:
                col = LEAF_D
            else:
                col = LEAF
            # a fold
            if xx == w // 2:
                col = LEAF_D
            px(im, x + xx, y + yy, col)
    for yy in range(h):
        px(im, x, y + yy, O)
        px(im, x + w - 1, y + yy, O)


def scene(sprites: dict[str, np.ndarray]) -> np.ndarray:
    im = np.zeros((SH, SW, 4), np.uint8)
    # wall, lighter toward the top-left (daylight)
    for y in range(0, 104):
        t = y / 104
        col = WALL_L if t < 0.25 else WALL if t < 0.75 else WALL_D
        # left side a touch lighter
        fill(im, 0, y, SW, 1, col)
    for y in range(0, 40):
        for x in range(0, 30):
            if im[y, x, 3]:
                im[y, x, :3] = WALL_L

    # honey floor, planks with a light top edge and a warm seam
    for i, y0 in enumerate(range(104, SH, 8)):
        h = min(8, SH - y0)
        band = (HONEY_L, HONEY, HONEY_D)[i % 3]
        fill(im, 0, y0, SW, h, band if i % 2 == 0 else HONEY)
        fill(im, 0, y0, SW, 1, HONEY_L)
        if h > 2:
            fill(im, 0, y0 + h - 1, SW, 1, HONEY_S)
        seam = (i * 18) % 40
        x = seam
        while x < SW:
            for yy in range(y0 + 1, y0 + h - 1):
                px(im, x, yy, HONEY_S)
            x += 40

    # baseboard
    shade_box(im, 0, 98, SW, 8, HONEY_L, HONEY_D, HONEY_S, edge=False)
    fill(im, 0, 98, SW, 1, HONEY_L)
    fill(im, 0, 105, SW, 1, O)

    # window
    shade_box(im, 8, 14, 56, 40, HONEY_L, HONEY_D, O, edge=False)
    fill(im, 8, 14, 56, 40, O)
    fill(im, 11, 17, 50, 34, DAY)
    # mullion
    fill(im, 35, 17, 2, 34, HONEY_D)
    fill(im, 11, 32, 50, 2, HONEY_D)
    # right pane a step warmer, still daylight (no grey, no blue)
    fill(im, 37, 17, 24, 15, DAY_L)
    # sill
    shade_box(im, 6, 52, 60, 4, HONEY_L, HONEY, HONEY_D)

    # curtains and rod
    shade_box(im, 4, 10, 64, 3, HONEY_L, HONEY, HONEY_D)
    curtain(im, 8, 14, 10, 38)
    curtain(im, 54, 14, 10, 38)
    # tie bands
    fill(im, 8, 36, 10, 2, TER)
    fill(im, 54, 36, 10, 2, TER_D)

    # shelves
    shade_box(im, 78, 16, 70, 5, HONEY_L, HONEY, HONEY_D)
    shade_box(im, 78, 36, 70, 5, HONEY_L, HONEY, HONEY_D)
    # cups, jar on the upper shelf
    shade_box(im, 84, 8, 6, 8, CREAM_L, CREAM, CREAM_D)
    shade_box(im, 92, 9, 5, 7, CREAM_L, CREAM, CREAM_D)
    shade_box(im, 100, 6, 8, 10, TER_L, TER, TER_D)
    shade_box(im, 112, 9, 6, 7, COP_L, COP, COP_D)
    shade_box(im, 122, 8, 6, 8, CREAM_L, CREAM, CREAM_D)
    # lower shelf: tins
    shade_box(im, 86, 28, 10, 8, HONEY_L, HONEY, HONEY_D)
    shade_box(im, 100, 30, 12, 6, TER_L, TER, TER_D)
    shade_box(im, 116, 29, 8, 7, CREAM_L, CREAM, CREAM_D)
    shade_box(im, 128, 28, 8, 8, LEAF_L, LEAF, LEAF_D)

    # wall art
    fill(im, 158, 14, 26, 22, O)
    shade_box(im, 160, 16, 22, 18, HONEY_L, CREAM, HONEY_D, edge=False)
    fill(im, 162, 24, 18, 8, LEAF)
    fill(im, 162, 26, 8, 6, LEAF_D)
    fill(im, 170, 22, 8, 6, LEAF_L)
    fill(im, 166, 18, 4, 4, COP_L)  # sun

    # chalkboard
    fill(im, 192, 12, 42, 36, O)
    fill(im, 195, 15, 36, 28, BOARD)
    # chalk marks, not fake letters
    for i, (x, w) in enumerate(((198, 14), (198, 22), (198, 10), (210, 12), (198, 18))):
        fill(im, x, 18 + i * 4, w, 1, CHALK)
    shade_box(im, 192, 46, 42, 4, HONEY_L, HONEY, HONEY_D)

    # rug sits under the player's feet, not behind their head
    # counter, mabel behind it
    mabel = sprites["mabel"]
    waist = TY + 20
    counter_top = 90
    stamp(im, mabel, 70, counter_top - waist)
    paint_counter(im, counter_top)

    # kettle, on the counter, light on the upper left
    shade_box(im, 124, 76, 16, 14, COP_L, COP, COP_D)
    fill(im, 126, 74, 12, 3, COP_L)
    fill(im, 128, 72, 8, 2, COP)
    px(im, 140, 80, COP_L)
    px(im, 141, 79, COP)
    px(im, 142, 78, O)
    fill(im, 120, 80, 4, 2, COP_D)
    px(im, 119, 79, O)
    px(im, 126, 78, CREAM_L)

    # cups
    shade_box(im, 36, 82, 7, 8, CREAM_L, CREAM, CREAM_D)
    shade_box(im, 46, 83, 6, 7, CREAM_L, TER, TER_D)
    fill(im, 36, 82, 7, 2, COP)
    fill(im, 46, 83, 6, 2, LEAF_D)

    # lamp, a prop only — daylight, no pool
    shade_box(im, 148, 78, 10, 6, CREAM_L, CREAM, CREAM_D)
    fill(im, 150, 76, 6, 2, CREAM_L)
    fill(im, 152, 84, 2, 6, HONEY_D)
    shade_box(im, 148, 90, 10, 3, HONEY_L, HONEY, HONEY_D)

    plant(im, 64, 84, 1)

    # runner in front of the counter, motif kept off the player
    shade_box(im, 86, 146, 92, 16, TER_L, TER, TER_D, edge=False)
    fill(im, 89, 149, 86, 10, CREAM)
    fill(im, 89, 149, 86, 1, CREAM_L)
    fill(im, 170, 149, 5, 10, CREAM_D)
    for i, w in enumerate((3, 5, 7, 5, 3)):
        fill(im, 104 - w // 2, 151 + i * 2, w, 2, LEAF if i != 2 else LEAF_L)
    for cx, cy in ((86, 146), (177, 146), (86, 161), (177, 161)):
        px(im, cx, cy, O)

    plant(im, 8, 132, 2)
    plant(im, 210, 140, 1)

    player = sprites["player"]
    foot = int(np.where(player[:, :, 3] > 0)[0].max())
    px_x = 124
    py = 158 - foot
    stamp(im, player, px_x, py)
    fill(im, px_x + 8, 158, 12, 1, HONEY_S)
    return im


def paint_counter(im, top: int) -> None:
    """Honey counter. Inset panels so the front is not a blank slab."""
    h = 26
    fill(im, 16, top, 156, h, HONEY)
    fill(im, 16, top, 156, 3, HONEY_L)
    fill(im, 16, top + 3, 4, h - 3, HONEY_L)
    fill(im, 164, top + 3, 8, h - 3, HONEY_D)
    fill(im, 16, top + h - 2, 156, 2, HONEY_S)
    fill(im, 16, top, 156, 1, O)
    fill(im, 16, top + h - 1, 156, 1, O)
    inset = (0xD0, 0x94, 0x40)
    for x0 in (28, 72, 116):
        fill(im, x0, top + 7, 34, 13, inset)
        fill(im, x0, top + 7, 34, 1, HONEY_L)
        fill(im, x0, top + 7, 1, 13, HONEY_L)
        fill(im, x0 + 33, top + 7, 1, 13, HONEY_S)
        fill(im, x0, top + 19, 34, 1, HONEY_S)


def text(im, s, x, y, col, scale=1):
    cx = x
    for ch in s:
        g = FONT.get(ch)
        if not g:
            cx += 4 * scale
            continue
        for yy, row in enumerate(g):
            for xx, bit in enumerate(row):
                if bit == "1":
                    fill(im, cx + xx * scale, y + yy * scale, scale, scale, col)
        cx += (len(g[0]) + 1) * scale


def text_width(s: str, scale: int = 1) -> int:
    w = 0
    for ch in s:
        g = FONT.get(ch)
        w += ((len(g[0]) if g else 3) + 1) * scale
    return max(0, w - scale)


def cast_sheet(sprites: dict[str, np.ndarray]) -> np.ndarray:
    crops = []
    for who in CAST:
        spr = sprites[who]
        ys, xs = np.where(spr[:, :, 3] > 0)
        y0, y1 = max(0, ys.min() - 1), min(spr.shape[0] - 1, ys.max() + 1)
        x0, x1 = max(0, xs.min() - 1), min(spr.shape[1] - 1, xs.max() + 1)
        crops.append(spr[y0 : y1 + 1, x0 : x1 + 1])
    gap = 10
    slots = []
    for who, crop in zip(CAST, crops):
        nw = text_width(who)
        slots.append((who, crop, max(crop.shape[1], nw), nw))
    max_h = max(c.shape[0] for c in crops)
    width = gap + sum(sw + gap for _, _, sw, _ in slots)
    height = max_h + 14
    im = np.zeros((height, width, 4), np.uint8)
    for i, y0 in enumerate(range(0, height, 8)):
        fill(im, 0, y0, width, min(8, height - y0), HONEY if i % 2 == 0 else HONEY_L)
        fill(im, 0, y0, width, 1, HONEY_L)
    x = gap
    for who, crop, sw, nw in slots:
        stamp(im, crop, x + (sw - crop.shape[1]) // 2, max_h - crop.shape[0])
        text(im, who, x + (sw - nw) // 2, max_h + 4, O, 1)
        x += sw + gap
    return im


def save_pair(name: str, arr: np.ndarray) -> None:
    im = Image.fromarray(arr)
    im.save(OUT / f"{name}.png")
    im.resize((im.width * 3, im.height * 3), Image.NEAREST).save(OUT / f"{name}-3x.png")


def side_by_side() -> None:
    a = Image.open(OUT / "style-A-3x.png").convert("RGBA")
    b = Image.open(OUT / "style-A2-3x.png").convert("RGBA")
    gap = 12
    label_h = 28
    w = a.width + gap + b.width
    h = label_h + max(a.height, b.height)
    canvas = Image.new("RGBA", (w, h), (0xF6, 0xE2, 0xC4, 255))
    arr = np.array(canvas)
    text(arr, "a", 8, 6, O, 3)
    text(arr, "a2", a.width + gap + 8, 6, O, 3)
    canvas = Image.fromarray(arr)
    canvas.paste(a, (0, label_h))
    canvas.paste(b, (a.width + gap, label_h))
    canvas.save(OUT / "compare-A-A2-3x.png")


def unique_colors(arr) -> int:
    pix = arr[arr[:, :, 3] > 0][:, :3]
    return len({tuple(int(v) for v in p) for p in pix})


def grey_offenders(arr) -> list[tuple]:
    bad = []
    pix = arr[arr[:, :, 3] > 0][:, :3]
    seen = {tuple(int(v) for v in p) for p in pix}
    for r, g, b in seen:
        if (r, g, b) == WHITE:
            continue
        if max(r, g, b) - min(r, g, b) < 16:
            bad.append((r, g, b))
        elif b > r + 6 and b > g + 6:
            bad.append((r, g, b))
    return bad


def main() -> None:
    sprites = {}
    for who in CAST:
        im = paint_char(who)
        assert_face(who, im)
        sprites[who] = im
        print("---", who)
        print(ascii_face(who))
    room = scene(sprites)
    sheet = cast_sheet(sprites)
    save_pair("style-A2", room)
    save_pair("cast-A2", sheet)
    side_by_side()
    print("scene", room.shape[1], room.shape[0], "colours", unique_colors(room))
    print("grey/cool", grey_offenders(room))
    print("cast grey/cool", grey_offenders(sheet))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
