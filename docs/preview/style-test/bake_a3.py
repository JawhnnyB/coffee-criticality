#!/usr/bin/env python3
"""Style A3 preview only. Does not touch the game or the A2 files."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bake_a2 as b

OUT = Path(__file__).resolve().parent
TX, TY = b.TX, b.TY
O = b.O
EYE, WHITE, MOUTH, BLUSH = b.EYE, b.WHITE, b.MOUTH, b.BLUSH

# Holt's suit is navy so it cannot be mistaken for his skin.
NAVY_L = (0x4A, 0x68, 0x90)
NAVY = (0x24, 0x3A, 0x5C)
NAVY_D = (0x16, 0x28, 0x42)
CREAM_S = ((0xFF, 0xF8, 0xEE), (0xF4, 0xE6, 0xD0), (0xD8, 0xC4, 0xA8))
TIE = (0xA3, 0x30, 0x38)
TIE_D = (0x72, 0x20, 0x28)
CARD_L, CARD, CARD_D = (0xC4, 0x84, 0x68), (0x8E, 0x54, 0x40), (0x5C, 0x34, 0x28)
VEST_L, VEST, VEST_D = (0xF4, 0xF0, 0x6A), (0xE0, 0xC8, 0x22), (0xB4, 0x98, 0x14)
HAT_L, HAT, HAT_D = (0xF0, 0xD0, 0x48), (0xE0, 0xB0, 0x28), (0xA8, 0x78, 0x18)
TAG = (0xF8, 0xF4, 0xEC)
BLUE_L, BLUE, BLUE_D = (0x7E, 0xB4, 0xE4), (0x2C, 0x68, 0xB4), (0x1A, 0x40, 0x74)
BRASS_L, BRASS, BRASS_D = (0xF0, 0xD8, 0x88), (0xC4, 0xA0, 0x48), (0x8A, 0x6C, 0x28)
WAL_L, WAL, WAL_D = (0x8A, 0x5A, 0x3A), (0x5A, 0x36, 0x22), (0x3A, 0x20, 0x14)
TEAL_L, TEAL, TEAL_D = (0xA8, 0xD0, 0xC8), (0x5E, 0x90, 0x8A), (0x3A, 0x64, 0x60)
RED_L, RED, RED_D = (0xC8, 0x4C, 0x4C), (0x8E, 0x22, 0x30), (0x5C, 0x14, 0x20)
HONEY_LL = (0xF8, 0xDC, 0x9A)

b.FONT["w"] = ["101", "101", "111", "111", "101"]
b.FONT["f"] = ["111", "100", "110", "100", "100"]
b.FONT["k"] = ["100", "100", "101", "110", "101"]
b.PANTS["holt"] = (NAVY_L, NAVY, NAVY_D)
b.GLASSES = {"player", "marcus", "mabel"}

HEIGHT = {"jordan": -2, "marcus": 2}


def edit_grid(g: list[list[str]], who: str) -> None:
    if who == "holt":
        for y in range(3):
            for x in range(16):
                g[y][x] = "."
        g[3] = list("...OHhhHHhhHO...")
        # Squarer jaw: as wide as the cheeks, no point.
        g[10] = list(".OSSSSSM") + list("MSSSSSO.")
        g[11] = list("..OOOOOO") + list("OOOOOO..")
    elif who == "tommy":
        for y in range(5):
            for x in range(16):
                g[y][x] = "."
    elif who == "player":
        # Side-swept part: more hair on the left, the right crown steps down.
        g[2][1] = "h"
        g[3][1] = "H"
        for y in (1, 2):
            for x in (12, 13, 14):
                g[y][x] = "."
        g[3][13] = "H"
        g[3][14] = "O"
    elif who == "marcus":
        # Bald crown, hair only at the temples. Taller body is added later.
        for y in range(0, 4):
            for x in range(5, 11):
                g[y][x] = "." if y < 2 else "S"
        for x in range(4, 12):
            if g[4][x] in "Hh":
                g[4][x] = "S"
    elif who == "jordan":
        # Bob: hair rounds down to the jaw, clear of the eyes and the blush.
        g[5][4] = "h"
        g[6][3] = "H"
        g[6][12] = "H"
        for y in (9, 10):
            g[y][3] = "H"
            g[y][12] = "H"
        g[9][7] = "J"
    if who in b.GLASSES:
        g[6][4] = "O"
        g[6][11] = "O"
        g[7][4] = "O"
        g[8][4] = "O"
        g[7][11] = "O"
        g[8][11] = "O"
        g[7][8] = "O"
    if who == "priya":
        g[5][7] = "I"
    if who == "jordan" and g[8][11] == "S":
        g[8][11] = "J"
    n = HEIGHT.get(who, 0)
    if n == -2:
        del g[22]
        del g[16]
    elif n == 2:
        g.insert(17, [c for c in g[16]])
        g.insert(23, [c for c in g[22]])
    if who == "mabel":
        # Three body rows. The round bun sits one pixel proud of the old hair,
        # so the finished figure is 2px shorter than the player.
        del g[22]
        del g[18]
        del g[16]


def _is_cloth(col) -> bool:
    if col is None:
        return False
    return col not in (O, EYE, WHITE, MOUTH, BLUSH, b.BINDI) and col != b.SKIN["mabel"][0]


def paint_round_bun(im: np.ndarray) -> None:
    """A circle sitting on the crown. The old disc read as a cone."""
    hl, base, dark = b.HAIR["mabel"]
    for y in range(TY, TY + 3):
        for x in range(TX + 3, TX + 13):
            if im[y, x, 3]:
                im[y, x] = (0, 0, 0, 0)
    cx, cy, r = TX + 8, TY + 3, 3
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 > r * r:
                continue
            if x <= cx and y <= cy:
                b.put(im, x, y, hl)
            elif x > cx and y > cy:
                b.put(im, x, y, dark)
            else:
                b.put(im, x, y, base)


def paint_char(who: str) -> np.ndarray:
    g = b.base_grid()
    edit_grid(g, who)
    im = np.zeros((b.CH, b.CW, 4), np.uint8)
    for y, row in enumerate(g):
        for x, letter in enumerate(row):
            col = b.color_of(who, letter, x, y)
            if col is not None:
                b.put(im, TX + x, TY + y, col)
    hl, base, dark = b.HAIR[who]
    if who == "mabel":
        paint_round_bun(im)
        # Cardigan over the sleeves and the outer torso. Apron stays in the middle.
        for y in range(im.shape[0]):
            for x in range(im.shape[1]):
                if im[y, x, 3] == 0:
                    continue
                lx, ly = x - TX, y - TY
                if not (12 <= ly <= 20 and (lx <= 5 or lx >= 11)):
                    continue
                col = tuple(int(v) for v in im[y, x, :3])
                if col == O or col in b.SKIN["mabel"] or col == BLUSH:
                    continue
                if lx <= 4 or ly <= 13:
                    b.put(im, x, y, CARD_L)
                elif lx >= 12:
                    b.put(im, x, y, CARD_D)
                else:
                    b.put(im, x, y, CARD)
    if who == "holt":
        # Cream shirt in the opening, red tie on top.
        for ly in range(13, 20):
            for lx in range(6, 10):
                col = tuple(int(v) for v in im[TY + ly, TX + lx, :3])
                if im[TY + ly, TX + lx, 3] and col != O:
                    tone = CREAM_S[0] if lx <= 7 and ly <= 14 else CREAM_S[2] if lx >= 9 else CREAM_S[1]
                    b.put(im, TX + lx, TY + ly, tone)
        for ly in range(13, 20):
            b.put(im, TX + 7, TY + ly, TIE)
            b.put(im, TX + 8, TY + ly, TIE_D)
        b.put(im, TX + 6, TY + 13, TIE)
        b.put(im, TX + 9, TY + 13, TIE_D)
    if who == "priya":
        # Braid starts in the hair and rides the shoulder. No gap, so it is not a stick.
        for i, ly in enumerate(range(8, 24)):
            cols = (hl, base) if i % 2 == 0 else (base, dark)
            for lx, col in zip((12, 13, 14), (cols[0], cols[1], dark)):
                b.put(im, TX + lx, TY + ly, col)
        for ly in range(13, 19):
            for lx in range(5, 11):
                if im[TY + ly, TX + lx, 3] == 0:
                    continue
                if tuple(int(v) for v in im[TY + ly, TX + lx, :3]) == O:
                    continue
                if lx <= 6 and ly <= 14:
                    b.put(im, TX + lx, TY + ly, VEST_L)
                elif lx >= 9:
                    b.put(im, TX + lx, TY + ly, VEST_D)
                else:
                    b.put(im, TX + lx, TY + ly, VEST)
    if who == "elena":
        for y in range(8, 24):
            for x, col in ((-1, hl), (0, base), (15, base), (16, dark)):
                gx, gy = TX + x, TY + y
                if 0 <= gy < im.shape[0] and im[gy, gx, 3] == 0:
                    b.put(im, gx, gy, col)
    if who == "tommy":
        paint_hard_hat(im)
    b.add_outline(im)
    if who == "elena":
        b.put(im, TX - 2, TY + 10, b.GOLD_L)
        b.put(im, TX - 2, TY + 11, b.GOLD)
        b.put(im, TX + 17, TY + 10, b.GOLD_L)
        b.put(im, TX + 17, TY + 11, b.GOLD)
        paint_clipboard(im)
        b.add_outline(im)
    if who == "tommy":
        paint_tag(im)
        b.add_outline(im)
    if who == "marcus":
        paint_gauge(im)
        b.add_outline(im)
    if who == "jordan":
        paint_lanyard(im)
        b.add_outline(im)
    return im


def paint_hard_hat(im: np.ndarray) -> None:
    cx, cy, r = TX + 8, TY + 3, 4
    for y in range(cy - r, cy + 2):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 > r * r:
                continue
            if y > cy:
                continue
            if x < cx and y < cy:
                b.put(im, x, y, HAT_L)
            elif x > cx:
                b.put(im, x, y, HAT_D)
            else:
                b.put(im, x, y, HAT)
    # Brim, wider than the skull.
    for x in range(TX + 1, TX + 15):
        b.put(im, x, TY + 4, HAT_D if x > TX + 9 else HAT)
        b.put(im, x, TY + 5, HAT_D)


def paint_tag(im: np.ndarray) -> None:
    b.put(im, TX + 8, TY + 12, HAT_D)
    b.fill(im, TX + 6, TY + 13, 4, 5, TAG)
    b.fill(im, TX + 7, TY + 14, 2, 1, BLUE)
    b.px(im, TX + 6, TY + 13, O)
    b.px(im, TX + 9, TY + 17, O)


def paint_clipboard(im: np.ndarray) -> None:
    x, y = TX + 12, TY + 14
    b.fill(im, x, y, 7, 9, (0xF6, 0xF0, 0xE2))
    b.fill(im, x, y, 7, 2, (0xC8, 0x6A, 0x48))
    b.fill(im, x + 1, y + 4, 4, 1, (0x8A, 0x78, 0x64))
    b.fill(im, x + 1, y + 6, 3, 1, (0x8A, 0x78, 0x64))


def paint_gauge(im: np.ndarray) -> None:
    cx, cy, r = TX + 2, TY + 18, 3
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 > r * r:
                continue
            b.put(im, x, y, BRASS if (x - cx) ** 2 + (y - cy) ** 2 > (r - 1) ** 2 else (0xF4, 0xF0, 0xE4))
    b.put(im, cx, cy, O)
    b.put(im, cx + 1, cy - 1, O)
    b.put(im, cx - 1, cy, BRASS_L)


def paint_lanyard(im: np.ndarray) -> None:
    cord = (0xC4, 0x8A, 0x3A)
    for ly, lx in ((12, 5), (13, 6), (14, 7), (15, 7), (12, 10), (13, 9), (14, 8)):
        b.put(im, TX + lx, TY + ly, cord)
    b.fill(im, TX + 6, TY + 16, 4, 4, TAG)
    b.fill(im, TX + 7, TY + 17, 2, 1, RED)


def opaque_height(im: np.ndarray) -> int:
    ys = np.where(im[:, :, 3] > 0)[0]
    return int(ys.max() - ys.min() + 1)


# --- walk -----------------------------------------------------------------
# Legs are drawn, never shifted. The head, torso and outline above the cut
# are copied from frame 0 so they cannot wobble.

PL, PB, PD = b.PANTS["player"]
BL, BB, BD = b.BOOT
SL, SS, SD = b.SKIN["player"]


def lock_top(frames: list[np.ndarray], cut: int) -> None:
    master = frames[0][:cut].copy()
    for fr in frames:
        fr[:cut] = master


def _boot(im: np.ndarray, x: int, y: int, wide: bool) -> None:
    """Chunky boot. Bottom row is always the sole. `y` is the top of the boot."""
    w = 4 if wide else 3
    b.fill(im, x, y, w, 1, BL)
    b.fill(im, x, y + 1, w, 1, BB)
    b.put(im, x + w - 1, y + 1, BD)
    b.fill(im, x, y + 2, w + 1, 1, BD)
    b.put(im, x, y + 2, BB)


def _leg(im: np.ndarray, x: int, y0: int, y1: int, shade: tuple) -> None:
    if y1 < y0:
        return
    b.fill(im, x, y0, 3, y1 - y0 + 1, shade)
    b.put(im, x, y0, PL)


def front_walk(player: np.ndarray) -> list[np.ndarray]:
    """Four down-frames. Pants and boots are redrawn. The head slice is frame 0."""
    cut = TY + 20
    frames = []
    # (left planted, left raised by N, left x nudge)
    # Raised foot sits 3px higher and 1px outward. Planted sole is always y = TY+25.
    poses = (
        (False, True),   # left up
        (True, True),    # both down, apart
        (True, False),   # right up
        (True, True),    # both down, together
    )
    for phase, (left_down, right_down) in enumerate(poses):
        fr = player.copy()
        fr[TY + 20 :, :, :] = 0
        apart = phase == 1
        together = phase == 3
        if left_down:
            lx = TX + (3 if together else 2 if apart else 3)
            _leg(fr, lx, TY + 20, TY + 22, PB if phase != 1 else PL)
            _boot(fr, lx, TY + 23, True)
        else:
            lx = TX + 1  # 1px outward, sole 3px higher
            _leg(fr, lx + 1, TY + 20, TY + 20, PB)
            _boot(fr, lx, TY + 20, True)
        if right_down:
            rx = TX + (9 if together else 10 if apart else 9)
            _leg(fr, rx, TY + 20, TY + 22, PD)
            _boot(fr, rx, TY + 23, True)
        else:
            rx = TX + 11
            _leg(fr, rx, TY + 20, TY + 20, PD)
            _boot(fr, rx, TY + 20, True)
        # Hands sit above the cut. Restore a 2px cuff so the pants still meet them.
        b.fill(fr, TX + 4, TY + 20, 2, 1, PL)
        b.fill(fr, TX + 10, TY + 20, 2, 1, PD)
        b.add_outline(fr)
        frames.append(fr)
    lock_top(frames, cut)
    return frames


def _side_body(im: np.ndarray) -> None:
    """Profile head and torso. Identical on every side frame."""
    hair_l, hair, hair_d = b.HAIR["player"]
    shirt_l, shirt, shirt_d = b.SHIRT["player"]
    # Hair mass, facing right.
    for y, row in enumerate(
        (
            "....HHH.",
            "...HHHHH",
            "..HHHHHH",
            ".HHHHHHH",
            ".HHSSSHH",
            "HHSSSSHH",
            "HHSSSSHH",
            ".HSSSSHH",
            "..SSSSHH",
        )
    ):
        for x, ch in enumerate(row):
            if ch == "H":
                col = hair_l if x <= 2 else hair_d if x >= 6 else hair
                b.put(im, TX + 4 + x, TY + 1 + y, col)
            elif ch == "S":
                b.put(im, TX + 4 + x, TY + 1 + y, SL if y <= 5 else SS if x < 5 else SD)
    # 2x2 eye, white highlight on the top-right pixel. No nose bar.
    b.put(im, TX + 9, TY + 6, EYE)
    b.put(im, TX + 10, TY + 6, WHITE)
    b.put(im, TX + 9, TY + 7, EYE)
    b.put(im, TX + 10, TY + 7, EYE)
    # Soft 2px mouth.
    b.put(im, TX + 9, TY + 9, MOUTH)
    b.put(im, TX + 10, TY + 9, MOUTH)
    # Neck, then torso with a 2px sleeve and a skin hand.
    b.fill(im, TX + 7, TY + 10, 3, 2, SS)
    b.fill(im, TX + 5, TY + 12, 8, 2, shirt_l)
    b.fill(im, TX + 5, TY + 14, 8, 4, shirt)
    b.fill(im, TX + 11, TY + 14, 2, 4, shirt_d)
    # Near arm, ending above the hip so it never joins a leg.
    b.fill(im, TX + 12, TY + 13, 2, 3, shirt_l)
    b.fill(im, TX + 13, TY + 15, 2, 2, SL)


def _back_body(im: np.ndarray) -> None:
    """Back of the head and the torso. Identical on every up frame."""
    hair_l, hair, hair_d = b.HAIR["player"]
    shirt_l, shirt, shirt_d = b.SHIRT["player"]
    for y, span in enumerate((4, 6, 8, 8, 8, 6)):
        x0 = TX + 8 - span // 2
        for x in range(span):
            col = hair_l if x <= 1 else hair_d if x >= span - 2 else hair
            b.put(im, x0 + x, TY + 1 + y, col)
    # Neck hidden under the collar.
    b.fill(im, TX + 6, TY + 8, 4, 2, shirt_l)
    b.fill(im, TX + 4, TY + 10, 8, 3, shirt_l)
    b.fill(im, TX + 4, TY + 13, 8, 5, shirt)
    b.fill(im, TX + 10, TY + 13, 2, 5, shirt_d)
    # Arms at the sides, 2px sleeve, 2px skin hands.
    b.fill(im, TX + 2, TY + 12, 2, 5, shirt_l)
    b.fill(im, TX + 12, TY + 12, 2, 5, shirt_d)
    b.fill(im, TX + 2, TY + 17, 2, 2, SL)
    b.fill(im, TX + 12, TY + 17, 2, 2, SD)


def side_walk() -> list[np.ndarray]:
    frames = []
    # Two columns with a real gap. A 3px leg plus a 4px sole must not touch.
    # (back_x, front_x, back_down, front_down)
    poses = (
        (5, 11, True, False),
        (4, 11, True, True),
        (4, 10, False, True),
        (5, 10, True, True),
    )
    for back_x, front_x, back_down, front_down in poses:
        im = np.zeros((b.CH, b.CW, 4), np.uint8)
        _side_body(im)
        for x, down, shade in (
            (TX + back_x, back_down, PB),
            (TX + front_x, front_down, PD),
        ):
            if down:
                _leg(im, x, TY + 18, TY + 22, shade)
                _boot(im, x, TY + 23, False)
            else:
                _leg(im, x, TY + 18, TY + 19, shade)
                _boot(im, x + 1, TY + 20, False)
        b.add_outline(im)
        frames.append(im)
    lock_top(frames, TY + 18)
    return frames


def back_walk() -> list[np.ndarray]:
    frames = []
    for phase in range(4):
        im = np.zeros((b.CH, b.CW, 4), np.uint8)
        _back_body(im)
        left_down = phase != 0
        right_down = phase != 2
        apart = phase == 1
        if left_down:
            lx = TX + (3 if not apart else 2)
            _leg(im, lx, TY + 18, TY + 22, PB)
            _boot(im, lx, TY + 23, True)
        else:
            _leg(im, TX + 1, TY + 18, TY + 19, PB)
            _boot(im, TX + 1, TY + 20, True)
        if right_down:
            rx = TX + (10 if not apart else 11)
            _leg(im, rx, TY + 18, TY + 22, PD)
            _boot(im, rx, TY + 23, True)
        else:
            _leg(im, TX + 12, TY + 18, TY + 19, PD)
            _boot(im, TX + 12, TY + 20, True)
        b.add_outline(im)
        frames.append(im)
    lock_top(frames, TY + 18)
    return frames


def walk_sets(player: np.ndarray) -> dict[str, list[np.ndarray]]:
    down = front_walk(player)
    right = side_walk()
    up = back_walk()
    left = [np.ascontiguousarray(np.flip(fr, axis=1)) for fr in right]
    sets = {"down": down, "side": right, "up": up, "left": left}
    cuts = {"down": TY + 20, "side": TY + 18, "up": TY + 18, "left": TY + 18}
    for name, frames in sets.items():
        cut = cuts[name]
        for i, fr in enumerate(frames):
            if not np.array_equal(fr[:cut], frames[0][:cut]):
                raise SystemExit(f"head moved on {name} frame {i}")
    return sets


def walk_sheet(sets: dict[str, list[np.ndarray]]) -> np.ndarray:
    order = ("down", "side", "up", "left")
    cell_w, cell_h = b.CW, b.CH
    gap = 4
    label_w = b.text_width("down") + 6
    w = label_w + 4 * (cell_w + gap) + gap
    h = 4 * (cell_h + gap) + gap
    im = np.zeros((h, w, 4), np.uint8)
    for i, y0 in enumerate(range(0, h, 8)):
        b.fill(im, 0, y0, w, min(8, h - y0), b.HONEY if i % 2 else b.HONEY_L)
    for r, name in enumerate(order):
        b.text(im, name, 2, gap + r * (cell_h + gap) + 8, O, 1)
        for c, fr in enumerate(sets[name]):
            b.stamp(im, fr, label_w + gap + c * (cell_w + gap), gap + r * (cell_h + gap))
    return im


# --- cafe -----------------------------------------------------------------

SW, SH = 240, 168


def darken(im: np.ndarray, x: int, y: int, amt: float = 0.80) -> None:
    if not (0 <= x < im.shape[1] and 0 <= y < im.shape[0]):
        return
    if im[y, x, 3] == 0:
        return
    im[y, x, :3] = [max(0, int(c * amt)) for c in im[y, x, :3]]


def oval_shadow(im: np.ndarray, cx: int, cy: int, rx: int = 8, ry: int = 2) -> None:
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1:
                continue
            darken(im, x, y)


def hue_report(im: np.ndarray) -> dict[str, float]:
    pix = im[im[:, :, 3] > 0][:, :3].astype(np.float32) / 255.0
    bins: dict[str, int] = {}
    for r, g, bch in pix:
        mx, mn = max(r, g, bch), min(r, g, bch)
        d = mx - mn
        if d < 0.08:
            key = "neutral"
        else:
            if mx == r:
                h = ((g - bch) / d) % 6
            elif mx == g:
                h = (bch - r) / d + 2
            else:
                h = (r - g) / d + 4
            key = str(int(h * 60) // 30 * 30)
        bins[key] = bins.get(key, 0) + 1
    total = sum(bins.values())
    pct = {k: v / total for k, v in bins.items()}
    return dict(sorted(pct.items(), key=lambda kv: -kv[1]))


def scene(sprites: dict[str, np.ndarray]) -> np.ndarray:
    im = np.zeros((SH, SW, 4), np.uint8)
    # Cream only on the upper wall. Teal wainscot under it.
    for y in range(0, 46):
        b.fill(im, 0, y, SW, 1, b.WALL_L if y < 16 else b.WALL)
    for y in range(46, 108):
        col = TEAL_L if y < 52 else TEAL if y < 96 else TEAL_D
        b.fill(im, 0, y, SW, 1, col)
    # Honey floor.
    for i, y0 in enumerate(range(104, SH, 8)):
        h = min(8, SH - y0)
        b.fill(im, 0, y0, SW, h, b.HONEY if i % 2 == 0 else b.HONEY_D)
        b.fill(im, 0, y0, SW, 1, b.HONEY_L)
        if h > 2:
            b.fill(im, 0, y0 + h - 1, SW, 1, b.HONEY_S)
        x = (i * 18) % 40
        while x < SW:
            for yy in range(y0 + 1, min(SH, y0 + h - 1)):
                b.px(im, x, yy, b.HONEY_S)
            x += 40
    # Walnut baseboard.
    b.fill(im, 0, 100, SW, 6, WAL)
    b.fill(im, 0, 100, SW, 1, WAL_L)
    b.fill(im, 0, 105, SW, 1, WAL_D)

    # Window. Glass stays warm daylight. Frame is walnut.
    b.fill(im, 8, 14, 56, 40, O)
    b.fill(im, 11, 17, 50, 34, b.DAY)
    b.fill(im, 37, 17, 22, 14, b.DAY_L)
    b.fill(im, 35, 17, 2, 34, WAL)
    b.fill(im, 11, 32, 50, 2, WAL)
    b.shade_box(im, 6, 52, 60, 4, WAL_L, WAL, WAL_D)
    b.shade_box(im, 4, 10, 64, 3, WAL_L, WAL, WAL_D)
    b.curtain(im, 8, 14, 10, 38)
    b.curtain(im, 54, 14, 10, 38)
    b.fill(im, 8, 36, 10, 2, b.TER)
    b.fill(im, 54, 36, 10, 2, b.TER_D)

    # Walnut shelves.
    b.shade_box(im, 78, 16, 70, 5, WAL_L, WAL, WAL_D)
    b.shade_box(im, 78, 36, 70, 5, WAL_L, WAL, WAL_D)
    b.shade_box(im, 84, 8, 6, 8, b.CREAM_L, b.CREAM, b.CREAM_D)
    b.shade_box(im, 92, 9, 5, 7, b.CREAM_L, b.CREAM, b.CREAM_D)
    b.shade_box(im, 100, 6, 8, 10, b.TER_L, b.TER, b.TER_D)
    # The one blue accent: a cobalt pitcher.
    b.shade_box(im, 112, 6, 8, 10, BLUE_L, BLUE, BLUE_D)
    b.fill(im, 114, 5, 4, 2, BLUE_L)
    b.shade_box(im, 124, 8, 6, 8, b.CREAM_L, b.CREAM, b.CREAM_D)
    b.shade_box(im, 86, 28, 10, 8, WAL_L, WAL, WAL_D)
    b.shade_box(im, 100, 30, 12, 6, b.TER_L, b.TER, b.TER_D)
    b.shade_box(im, 116, 29, 8, 7, b.CREAM_L, b.CREAM, b.CREAM_D)
    b.shade_box(im, 128, 28, 8, 8, b.LEAF_L, b.LEAF, b.LEAF_D)

    # Wall art and chalkboard sit on the teal, frames walnut.
    b.fill(im, 158, 48, 26, 22, O)
    b.shade_box(im, 160, 50, 22, 18, b.HONEY_L, b.CREAM, WAL_D, edge=False)
    b.fill(im, 162, 58, 18, 8, b.LEAF)
    b.fill(im, 170, 54, 6, 6, b.LEAF_L)
    b.fill(im, 166, 52, 4, 4, b.COP_L)
    b.fill(im, 192, 46, 42, 36, O)
    b.fill(im, 195, 49, 36, 28, b.BOARD)
    for i, (x, w) in enumerate(((198, 14), (198, 22), (198, 10), (210, 12), (198, 18))):
        b.fill(im, x, 52 + i * 4, w, 1, b.CHALK)
    b.shade_box(im, 192, 80, 42, 4, WAL_L, WAL, WAL_D)

    # Deep red rug, cream border, covering most of the honey.
    b.fill(im, 48, 118, 176, 44, RED)
    b.fill(im, 48, 118, 176, 3, b.CREAM)
    b.fill(im, 48, 159, 176, 3, b.CREAM_D)
    b.fill(im, 48, 118, 3, 44, b.CREAM)
    b.fill(im, 221, 118, 3, 44, b.CREAM_D)
    for i, w in enumerate((4, 8, 10, 8, 4)):
        b.fill(im, 78 - w // 2, 132 + i * 2, w, 2, b.CREAM_L if i == 2 else b.CREAM)

    # Window light: three nested quads, lighter toward the middle. No dither.
    def quad(y0, y1, xa0, xb0, xa1, xb1, col):
        for y in range(y0, y1):
            t = (y - y0) / max(1, y1 - y0 - 1)
            xa = int(xa0 + (xa1 - xa0) * t)
            xb = int(xb0 + (xb1 - xb0) * t)
            for x in range(xa, xb):
                if 0 <= x < SW and im[y, x, 3]:
                    cur = tuple(int(v) for v in im[y, x, :3])
                    if cur[0] > cur[2] and cur[1] > 60:  # only the honey floor
                        b.px(im, x, y, col)

    quad(112, 158, 10, 78, 4, 96, b.HONEY_L)
    quad(118, 150, 18, 66, 16, 80, HONEY_LL)
    quad(126, 142, 28, 54, 30, 62, (0xFF, 0xE8, 0xB0))

    mabel = sprites["mabel"]
    counter_top = 90
    bot = int(np.where(mabel[:, :, 3] > 0)[0].max())
    mx, my = 64, counter_top + 8 - bot
    oval_shadow(im, 78, counter_top + 26, 10, 2)
    b.stamp(im, mabel, mx, my)
    paint_counter(im, counter_top)

    # Props, each with a contact oval.
    places = []
    b.shade_box(im, 124, 76, 16, 14, b.COP_L, b.COP, b.COP_D)
    b.fill(im, 126, 74, 12, 3, b.COP_L)
    b.fill(im, 128, 72, 8, 2, b.COP)
    b.px(im, 140, 80, b.COP_L)
    b.px(im, 142, 78, O)
    b.fill(im, 120, 80, 4, 2, b.COP_D)
    places.append((132, 90, 8, 2))
    b.shade_box(im, 36, 82, 7, 8, b.CREAM_L, b.CREAM, b.CREAM_D)
    b.shade_box(im, 46, 83, 6, 7, b.CREAM_L, b.TER, b.TER_D)
    b.fill(im, 36, 82, 7, 2, b.COP)
    b.fill(im, 46, 83, 6, 2, b.LEAF_D)
    places.append((39, 90, 5, 1))
    places.append((49, 90, 5, 1))
    b.shade_box(im, 148, 78, 10, 6, b.CREAM_L, b.CREAM, b.CREAM_D)
    b.fill(im, 150, 76, 6, 2, b.CREAM_L)
    b.fill(im, 152, 84, 2, 6, WAL_D)
    b.shade_box(im, 148, 90, 10, 3, WAL_L, WAL, WAL_D)
    places.append((153, 93, 6, 1))
    b.plant(im, 64, 84, 1)
    places.append((68, 89, 6, 1))
    for cx, cy, rx, ry in places:
        oval_shadow(im, cx, cy, rx, ry)

    b.plant(im, 8, 128, 2)
    oval_shadow(im, 18, 138, 10, 2)
    b.plant(im, 214, 136, 1)
    oval_shadow(im, 218, 146, 6, 2)

    player = sprites["player"]
    foot = int(np.where(player[:, :, 3] > 0)[0].max())
    px_x, py = 124, 158 - foot
    oval_shadow(im, px_x + 14, 159, 9, 2)
    b.stamp(im, player, px_x, py)
    return im


def paint_counter(im: np.ndarray, top: int) -> None:
    h = 26
    b.fill(im, 16, top, 156, h, WAL)
    b.fill(im, 16, top, 156, 3, WAL_L)
    b.fill(im, 16, top + 3, 4, h - 3, WAL_L)
    b.fill(im, 164, top + 3, 8, h - 3, WAL_D)
    b.fill(im, 16, top + h - 2, 156, 2, WAL_D)
    b.fill(im, 16, top, 156, 1, O)
    b.fill(im, 16, top + h - 1, 156, 1, O)
    for x0 in (28, 72, 116):
        b.fill(im, x0, top + 7, 34, 13, WAL_D)
        b.fill(im, x0, top + 7, 34, 1, WAL_L)
        b.fill(im, x0, top + 7, 1, 13, WAL_L)
        b.fill(im, x0 + 33, top + 7, 1, 13, (0x2A, 0x16, 0x10))
        b.fill(im, x0, top + 19, 34, 1, (0x2A, 0x16, 0x10))
    # Contact shadow on the floor under the counter.
    for x in range(20, 168):
        darken(im, x, top + h, 0.78)
        darken(im, x, top + h + 1, 0.88)


def cast_sheet(sprites: dict[str, np.ndarray]) -> np.ndarray:
    crops = []
    heights = []
    for who in b.CAST:
        spr = sprites[who]
        ys, xs = np.where(spr[:, :, 3] > 0)
        y0, y1 = max(0, int(ys.min()) - 1), min(spr.shape[0] - 1, int(ys.max()) + 1)
        x0, x1 = max(0, int(xs.min()) - 1), min(spr.shape[1] - 1, int(xs.max()) + 1)
        crops.append(spr[y0 : y1 + 1, x0 : x1 + 1])
        heights.append(int(ys.max() - ys.min() + 1))
    gap = 10
    slots = []
    for who, crop in zip(b.CAST, crops):
        nw = b.text_width(who)
        slots.append((who, crop, max(crop.shape[1], nw), nw))
    max_h = max(c.shape[0] for c in crops)
    width = gap + sum(sw + gap for _, _, sw, _ in slots)
    height = max_h + 16
    im = np.zeros((height, width, 4), np.uint8)
    for i, y0 in enumerate(range(0, height, 8)):
        b.fill(im, 0, y0, width, min(8, height - y0), b.HONEY if i % 2 == 0 else b.HONEY_L)
    x = gap
    for who, crop, sw, nw in slots:
        top = max_h - crop.shape[0]
        oval_shadow(im, x + sw // 2, max_h - 1, max(6, crop.shape[1] // 2), 2)
        b.stamp(im, crop, x + (sw - crop.shape[1]) // 2, top)
        b.text(im, who, x + (sw - nw) // 2, max_h + 4, O, 1)
        x += sw + gap
    print("heights", dict(zip(b.CAST, heights)))
    return im


def walk_gif(room: np.ndarray, frames: list[np.ndarray]) -> None:
    n = 75
    dur = 80  # 75 * 80ms = 6000ms
    # Stay at least a few pixels on the canvas. Pillow merges identical
    # frames and piles their duration onto the previous one.
    spr_w = int(frames[0].shape[1])
    x0 = -spr_w + 6
    x1 = SW - 6
    images = []
    foot = int(np.where(frames[0][:, :, 3] > 0)[0].max())
    base_y = 156 - foot
    for i in range(n):
        fr = room.copy()
        spr = frames[i % 4]
        x = int(round(x0 + i * (x1 - x0) / (n - 1)))
        oval_shadow(fr, x + spr_w // 2, base_y + foot + 1, 8, 2)
        b.stamp(fr, spr, x, base_y)
        big = Image.fromarray(fr).resize((SW * 3, SH * 3), Image.NEAREST)
        images.append(big.convert("RGB"))
    images[0].save(
        OUT / "walk-player.gif",
        save_all=True,
        append_images=images[1:],
        duration=dur,
        loop=0,
        disposal=2,
        optimize=False,
    )


def main() -> None:
    sprites = {}
    for who in b.CAST:
        im = paint_char(who)
        # Face geometry still holds for everyone whose jaw we did not rebuild.
        if who != "holt":
            b.assert_face(who, im)
        else:
            # Holt keeps the eyes, the highlight, the gap and the mouth.
            def at(x, y, img=im):
                return tuple(int(v) for v in img[TY + y, TX + x, :3])

            assert at(5, 7) == EYE and at(6, 7) == WHITE
            assert at(9, 7) == EYE and at(10, 7) == WHITE
            assert at(7, 10) == MOUTH and at(8, 10) == MOUTH
        sprites[who] = im
    room = scene(sprites)
    sheet = cast_sheet(sprites)
    b.save_pair("style-A3", room)
    b.save_pair("cast-A3", sheet)
    sets = walk_sets(sprites["player"])
    sheet_w = walk_sheet(sets)
    b.save_pair("walk-player", sheet_w)
    walk_gif(room, sets["side"])
    pct = hue_report(room)
    print("hue fractions")
    for k, v in pct.items():
        print(f"  {k:8} {v:.1%}")
    worst = max(pct.values())
    print("max hue", f"{worst:.1%}")
    if worst > 0.40:
        raise SystemExit("a single hue fills more than 40% of the cafe")
    gif = Image.open(OUT / "walk-player.gif")
    total = 0
    bad = []
    for i in range(gif.n_frames):
        gif.seek(i)
        d = gif.info.get("duration", 0)
        total += d
        if d != 80:
            bad.append((i, d))
    print("gif frames", gif.n_frames, "ms", total, "off", bad[:4])
    if gif.n_frames != 75 or total != 6000 or bad:
        raise SystemExit(f"gif is {gif.n_frames} frames / {total}ms, want 75 x 80")
    print("wrote", OUT)


if __name__ == "__main__":
    main()
