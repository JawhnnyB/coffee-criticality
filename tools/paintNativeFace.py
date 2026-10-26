#!/usr/bin/env python3
"""Paint a native 32px face onto the existing bodies.

The muzzle was two bugs stacked. The template was a tall oval: eyes high,
a nose bar, a mouth bar, a pointed chin. And the stamp treated that chin
as the shoulder, so the new face sat on top of the old snout.

This template is wide and short. The jaw stays round. Eyes sit low, with
no nose bar. The stamp clears only the head, at the real neck, and leaves
the body and the walk frames alone.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SPR = ROOT / "public/art/gen/sprites"
PREVIEW = ROOT / "docs/preview"

INK = (22, 17, 13, 255)
WHITE = (248, 244, 236, 255)
GOLD = (201, 162, 39, 255)
STEEL = (61, 92, 102, 255)
STEEL_D = (36, 56, 64, 255)
WARM = (186, 92, 78, 255)

SKIN = {
    "player": (224, 186, 148, 255),
    "mabel": (232, 196, 160, 255),
    "holt": (210, 170, 136, 255),
    "elena": (196, 148, 104, 255),
    "tommy": (196, 148, 104, 255),
    "marcus": (214, 156, 114, 255),
    "priya": (168, 108, 68, 255),
    "jordan": (206, 154, 112, 255),
}
SKIN_D = {
    "player": (196, 150, 112, 255),
    "mabel": (201, 160, 122, 255),
    "holt": (176, 136, 104, 255),
    "elena": (168, 118, 78, 255),
    "tommy": (168, 118, 78, 255),
    "marcus": (176, 120, 82, 255),
    "priya": (132, 78, 48, 255),
    "jordan": (168, 118, 78, 255),
}
HAIR = {
    "player": (90, 49, 29, 255),
    "mabel": (206, 198, 186, 255),
    "holt": (168, 162, 150, 255),
    "elena": (36, 26, 22, 255),
    "tommy": (90, 80, 72, 255),
    "marcus": (122, 58, 40, 255),
    "priya": (28, 20, 18, 255),
    "jordan": (42, 28, 22, 255),
}
HAIR_D = {
    "player": (64, 35, 20, 255),
    "mabel": (154, 148, 136, 255),
    "holt": (120, 112, 100, 255),
    "elena": (20, 14, 12, 255),
    "tommy": (61, 92, 102, 255),
    "marcus": (80, 36, 24, 255),
    "priya": (16, 12, 10, 255),
    "jordan": (26, 16, 14, 255),
}

CAST = ("player", "mabel", "holt", "elena", "tommy", "marcus", "priya", "jordan")
SMILE = {"player", "mabel", "elena", "tommy", "priya", "jordan"}
GLASSES = {"player", "marcus"}

# Authored head. One neck row. The stamp slides this so NECK lands on the
# body's real neck, not on the old chin.
NECK = 22
FACE_TOP, CHIN = 8, 21
CHEEK_L, CHEEK_R = 8, 23


def px(a: np.ndarray, x: int, y: int, col: tuple[int, int, int, int]) -> None:
    if 0 <= x < a.shape[1] and 0 <= y < a.shape[0] and col[3]:
        a[y, x] = col


def blush(skin: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    return tuple(int(skin[i] * 0.75 + WARM[i] * 0.25) for i in range(3)) + (255,)


def clear_px(a: np.ndarray, x: int, y: int) -> None:
    if 0 <= x < a.shape[1] and 0 <= y < a.shape[0]:
        a[y, x] = (0, 0, 0, 0)


def face_skin(a: np.ndarray, who: str, skin: tuple[int, int, int, int]) -> None:
    """Width 16, height 14. Jaw at least 75% of the cheek. No pointed chin."""
    for y in range(FACE_TOP, CHIN + 1):
        if who == "holt":
            inset = 1 if y == FACE_TOP else 0
        elif who == "mabel" and y == FACE_TOP:
            inset = 3
        elif who == "mabel" and y == FACE_TOP + 1:
            inset = 2
        elif y == FACE_TOP:
            inset = 2
        elif y in (FACE_TOP + 1, CHIN):
            inset = 1
        else:
            inset = 0
        for x in range(CHEEK_L + inset, CHEEK_R - inset + 1):
            px(a, x, y, skin)
    # One-pixel ear nub, tucked at the hairline. Not a tab beside the eye.
    px(a, CHEEK_L - 1, 14, skin)
    px(a, CHEEK_R + 1, 14, skin)


def eyes(a: np.ndarray) -> None:
    """2×3 ovals, 4px apart, highlight top-right, pupils centred."""
    for x0 in (12, 18):
        for dy in range(3):
            px(a, x0, 15 + dy, INK)
            px(a, x0 + 1, 15 + dy, INK)
        px(a, x0 + 1, 15, WHITE)


def brows(a: np.ndarray, who: str) -> None:
    """One pixel, short, curved. Not a scowl."""
    pairs = {
        "mabel": [(11, 12), (12, 13), (13, 13), (18, 13), (19, 13), (20, 12)],
        "player": [(12, 12), (13, 13), (14, 13), (17, 13), (18, 13), (19, 12)],
        "elena": [(12, 12), (13, 13), (14, 13), (17, 13), (18, 13), (19, 12)],
        "priya": [(12, 12), (13, 12), (14, 13), (17, 13), (18, 12), (19, 12)],
        "tommy": [(12, 13), (13, 12), (14, 13), (17, 13), (18, 12), (19, 13)],
        "jordan": [(12, 12), (13, 12), (14, 12), (17, 13), (18, 13), (19, 13)],
        "holt": [(12, 13), (13, 13), (14, 13), (17, 13), (18, 13), (19, 13)],
        "marcus": [(12, 13), (13, 13), (14, 13), (17, 13), (18, 13), (19, 13)],
    }
    ink = HAIR_D[who] if who in ("mabel", "holt") else INK
    for x, y in pairs[who]:
        px(a, x, y, ink)


def mouth(a: np.ndarray, who: str) -> None:
    """At most 4px, one curve. Holt and Marcus stay level, never down."""
    if who in SMILE:
        px(a, 13, 19, INK)
        px(a, 14, 20, INK)
        px(a, 15, 20, INK)
        px(a, 16, 19, INK)
    else:
        for x in (14, 15, 16):
            px(a, x, 20, INK)


def glasses(a: np.ndarray) -> None:
    """Two short rims and a one-pixel bridge. The eyes stay 2px wide."""
    for x in (12, 13, 18, 19):
        px(a, x, 14, INK)
    px(a, 16, 14, INK)


def features(a: np.ndarray, who: str) -> None:
    skin, skin_d = SKIN[who], SKIN_D[who]
    eyes(a)
    brows(a, who)
    px(a, 16, 18, skin_d)  # one pixel, not a bar
    b = blush(skin)
    px(a, 10, 18, b)
    px(a, 11, 18, b)
    px(a, 20, 18, b)
    px(a, 21, 18, b)
    if who == "mabel":
        px(a, 10, 19, skin_d)
        px(a, 21, 19, skin_d)
    if who == "jordan":
        px(a, 20, 19, (176, 96, 72, 255))
    if who == "priya":
        px(a, 16, 14, GOLD)
    mouth(a, who)
    if who in GLASSES:
        glasses(a)
    for x in range(14, 18):
        px(a, x, NECK, skin)


def hair_front(a: np.ndarray, who: str) -> None:
    hair, hair_d = HAIR[who], HAIR_D[who]
    skin = SKIN[who]
    if who == "tommy":
        for y in range(2, 8):
            for x in range(10, 23):
                px(a, x, y, STEEL if y > 2 else STEEL_D)
        for x in range(7, 26):
            px(a, x, 8, STEEL_D)
            px(a, x, 9, STEEL)
        px(a, 8, 15, STEEL)
        px(a, 23, 15, STEEL)
        px(a, 8, 16, skin)
        px(a, 23, 16, skin)
        return
    if who == "holt":
        for y in range(3, 12):
            px(a, 8, y, hair)
            px(a, 9, y, hair_d)
            px(a, 22, y, hair_d)
            px(a, 23, y, hair)
        for x in range(10, 22):
            px(a, x, 3, hair)
            px(a, x, 4, hair_d)
        px(a, 7, 15, hair)
        px(a, 24, 15, hair)
        return
    # Crown sits on the head. The face oval underneath stays skin,
    # so a short fringe does not turn the forehead into a muzzle.
    for y in range(2, 8):
        for x in range(8, 24):
            px(a, x, y, hair if (x + y) % 5 else hair_d)
    for y in range(8, 11):
        for x in range(8, 24):
            if y == 10 and 12 <= x <= 19:
                continue
            px(a, x, y, hair if y < 9 else hair_d)
    px(a, 7, 12, hair)
    px(a, 7, 13, hair_d)
    px(a, 7, 15, hair)
    px(a, 24, 12, hair)
    px(a, 24, 13, hair_d)
    px(a, 24, 15, hair)
    if who == "player":
        for x in range(11, 21):
            px(a, x, 10, hair_d)
            px(a, x, 11, hair)
    elif who == "mabel":
        for y in range(1, 11):
            for x in range(18, 27):
                if (x - 22) ** 2 + (y - 5) ** 2 <= 18:
                    px(a, x, y, hair if y > 2 else hair_d)
        px(a, 24, 3, GOLD)
        px(a, 25, 3, GOLD)
        px(a, 24, 4, GOLD)
    elif who == "elena":
        for y in range(8, 36):
            px(a, 7, y, hair)
            px(a, 8, y, hair_d)
            px(a, 23, y, hair_d)
            px(a, 24, y, hair)
        px(a, 8, 17, GOLD)
    elif who == "priya":
        for y in range(10, 38):
            px(a, 23, y, hair)
            px(a, 24, y, hair_d)
            if y % 5 == 0:
                px(a, 25, y, hair)
        for y in range(4, 10):
            for x in range(18, 24):
                if (x - 21) ** 2 + (y - 6) ** 2 <= 10:
                    px(a, x, y, hair)
    elif who == "marcus":
        for x in range(12, 21):
            px(a, x, 11, hair_d)
    elif who == "jordan":
        for x in range(10, 22):
            px(a, x, 11, hair)


def bare(who: str) -> np.ndarray:
    a = np.zeros((64, 32, 4), np.uint8)
    face_skin(a, who, SKIN[who])
    features(a, who)
    return a


def front(who: str) -> np.ndarray:
    a = bare(who)
    hair_front(a, who)
    return a


def profile(who: str) -> np.ndarray:
    """Right-facing. A short rounded cheek. The mouth does not stick out past it."""
    a = np.zeros((64, 32, 4), np.uint8)
    skin, skin_d = SKIN[who], SKIN_D[who]
    hair, hair_d = HAIR[who], HAIR_D[who]
    # Cheek is 7px deep and 11px tall. Front edge stays at x=20. No snout.
    for y in range(11, 22):
        if who == "holt" and y >= 12:
            x0, x1 = 14, 20
        elif y in (11, 21):
            x0, x1 = 16, 19
        elif y in (12, 20):
            x0, x1 = 15, 20
        else:
            x0, x1 = 14, 20
        for x in range(x0, x1 + 1):
            px(a, x, y, skin)
    px(a, 13, 15, skin)  # ear nub, hair covers the rest
    for dy in range(3):
        px(a, 17, 15 + dy, INK)
        px(a, 18, 15 + dy, INK)
    px(a, 18, 15, WHITE)
    if who == "mabel":
        for x, y in ((16, 13), (17, 14), (18, 13)):
            px(a, x, y, hair_d)
    elif who == "holt":
        for x in (16, 17, 18):
            px(a, x, 14, hair_d)
    else:
        for x, y in ((16, 13), (17, 14), (18, 14)):
            px(a, x, y, INK)
    px(a, 19, 18, skin_d)
    b = blush(skin)
    px(a, 15, 18, b)
    px(a, 16, 18, b)
    if who in SMILE:
        px(a, 17, 19, INK)
        px(a, 18, 20, INK)
        px(a, 19, 20, INK)
        px(a, 20, 19, INK)
    else:
        for x in (18, 19, 20):
            px(a, x, 20, INK)
    if who in GLASSES:
        for x in (17, 18):
            px(a, x, 14, INK)
    if who == "priya":
        px(a, 18, 13, GOLD)
    if who == "jordan":
        px(a, 16, 19, (176, 96, 72, 255))
    if who == "elena":
        px(a, 14, 16, GOLD)
    for x in range(16, 19):
        px(a, x, NECK, skin)
    if who == "tommy":
        for y in range(4, 10):
            for x in range(12, 22):
                px(a, x, y, STEEL if y > 4 else STEEL_D)
        for x in range(11, 23):
            px(a, x, 10, STEEL_D)
        px(a, 13, 14, STEEL)
        px(a, 13, 16, STEEL)
        return a
    # Round skull behind the cheek. Hair stops before the eye.
    for y in range(4, 16):
        for x in range(9, 16):
            if y >= 14 and x >= 15:
                continue
            px(a, x, y, hair if (x + y) % 4 else hair_d)
    for x in range(11, 17):
        px(a, x, 3, hair_d)
    px(a, 13, 14, hair)
    px(a, 13, 16, hair_d)
    if who == "holt":
        for y in range(6, 11):
            for x in range(12, 18):
                clear_px(a, x, y)
        for y in range(8, 18):
            px(a, 10, y, hair)
            px(a, 11, y, hair_d)
    if who == "mabel":
        for y in range(2, 10):
            for x in range(6, 14):
                if (x - 9) ** 2 + (y - 5) ** 2 <= 14:
                    px(a, x, y, hair if y > 3 else hair_d)
        px(a, 8, 4, GOLD)
    if who == "elena":
        for y in range(12, 36):
            px(a, 8, y, hair)
            px(a, 9, y, hair_d)
    if who == "priya":
        for y in range(12, 36):
            px(a, 10, y, hair_d)
            px(a, 11, y, hair)
    return a


def back(who: str) -> np.ndarray:
    a = np.zeros((64, 32, 4), np.uint8)
    hair, hair_d = HAIR[who], HAIR_D[who]
    skin = SKIN[who]
    if who == "tommy":
        for y in range(2, NECK):
            for x in range(9, 24):
                px(a, x, y, STEEL if y > 3 else STEEL_D)
        for x in range(7, 26):
            px(a, x, 10, STEEL_D)
    elif who == "holt":
        for y in range(4, NECK):
            for x in range(11, 21):
                px(a, x, y, skin)
            px(a, 9, y, hair)
            px(a, 10, y, hair_d)
            px(a, 21, y, hair_d)
            px(a, 22, y, hair)
        for x in range(11, 21):
            px(a, x, 4, hair_d)
    else:
        for y in range(2, NECK):
            for x in range(9, 23):
                px(a, x, y, hair if (x + y) % 5 else hair_d)
        if who == "mabel":
            for y in range(2, 11):
                for x in range(17, 27):
                    if (x - 22) ** 2 + (y - 5) ** 2 <= 18:
                        px(a, x, y, hair)
            px(a, 24, 3, GOLD)
        if who == "elena":
            for y in range(12, 36):
                px(a, 7, y, hair)
                px(a, 8, y, hair_d)
                px(a, 23, y, hair_d)
                px(a, 24, y, hair)
        if who == "priya":
            for y in range(12, 38):
                px(a, 22, y, hair)
                px(a, 23, y, hair_d)
    px(a, 8, 16, skin)
    px(a, 23, 16, skin)
    px(a, 8, 14, hair if who != "tommy" else STEEL)
    px(a, 8, 15, hair_d if who != "tommy" else STEEL_D)
    px(a, 23, 14, hair if who != "tommy" else STEEL)
    px(a, 23, 15, hair_d if who != "tommy" else STEEL_D)
    for x in range(14, 18):
        px(a, x, NECK, skin)
    return a


def is_skin_px(p: np.ndarray) -> bool:
    if int(p[3]) < 20:
        return False
    r, g, b = int(p[0]), int(p[1]), int(p[2])
    if r < 115 or g < 70 or b < 50:
        return False
    if not (r > g > b - 5):
        return False
    if r - g >= 95:
        return False
    return (b / r) > 0.36


def is_dark_px(p: np.ndarray) -> bool:
    if int(p[3]) < 20:
        return False
    r, g, b = int(p[0]), int(p[1]), int(p[2])
    return r < 90 and g < 90 and b < 110


def is_hair_px(p: np.ndarray, who: str) -> bool:
    if int(p[3]) < 20 or is_skin_px(p):
        return False
    r, g, b = int(p[0]), int(p[1]), int(p[2])
    for col in (HAIR[who], HAIR_D[who], STEEL, STEEL_D, INK, GOLD):
        if abs(r - col[0]) + abs(g - col[1]) + abs(b - col[2]) < 48:
            return True
    return is_dark_px(p)


def skin_run(row: np.ndarray) -> tuple[int, int, int]:
    if row.shape[0] < 17 or not is_skin_px(row[16]):
        return 0, 16, 15
    left = 16
    while left > 0 and is_skin_px(row[left - 1]):
        left -= 1
    right = 16
    while right < row.shape[0] - 1 and is_skin_px(row[right + 1]):
        right += 1
    return int(right - left + 1), left, right


def opaque_span(row: np.ndarray) -> int:
    if row.shape[0] < 17 or int(row[16, 3]) < 20:
        return 0
    left = 16
    while left > 0 and int(row[left - 1, 3]) > 20:
        left -= 1
    right = 16
    while right < row.shape[0] - 1 and int(row[right + 1, 3]) > 20:
        right += 1
    return int(right - left + 1)


def find_cut(cell: np.ndarray, who: str) -> int:
    """Neck row: the last narrow span under the head, just before the body."""
    del who
    spans = [opaque_span(cell[y]) for y in range(cell.shape[0])]
    peak = max(spans[:20] or [0])
    if peak < 10:
        return NECK
    peak_y = spans.index(peak)
    hard = None
    soft = None
    for y in range(peak_y + 1, len(spans)):
        w = spans[y]
        if w <= 0:
            continue
        if w <= 6:
            hard = y
        elif w <= 10 and hard is None and soft is None:
            soft = y
        elif w >= 16:
            if hard is not None and y - hard <= 8:
                return hard
            if hard is None and soft is not None and y - soft <= 6:
                return soft
    return NECK


def clear_head(cell: np.ndarray, cut: int, who: str) -> None:
    """Erase the head connected to the centre column. Arms that do not touch it stay."""
    h, w = cell.shape[:2]
    seen = np.zeros((h, w), dtype=bool)
    stack: list[tuple[int, int]] = []
    for y in range(0, cut + 1):
        for x in (15, 16, 17):
            if cell[y, x, 3] > 20:
                stack.append((x, y))
    while stack:
        x, y = stack.pop()
        if y < 0 or y > cut or x < 0 or x >= w or seen[y, x]:
            continue
        if cell[y, x, 3] < 20:
            continue
        seen[y, x] = True
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    cell[seen, 3] = 0
    # Strands of the old hair can hang past the neck. Drop a pixel only when
    # it is this person's hair and it does not touch the shirt.
    hair_cols = {HAIR[who][:3], HAIR_D[who][:3]}
    def strict_hair(p) -> bool:
        if int(p[3]) < 20:
            return False
        r, g, b = int(p[0]), int(p[1]), int(p[2])
        return any(abs(r - c[0]) + abs(g - c[1]) + abs(b - c[2]) <= 18 for c in hair_cols)
    kill: list[tuple[int, int]] = []
    for y in range(cut + 1, min(h, cut + 12)):
        for x in range(w):
            if not strict_hair(cell[y, x]):
                continue
            body = False
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if ny <= cut or not (0 <= nx < w and 0 <= ny < h):
                    continue
                if int(cell[ny, nx, 3]) > 20 and not strict_hair(cell[ny, nx]):
                    body = True
                    break
            if not body:
                kill.append((x, y))
    for x, y in kill:
        cell[y, x, 3] = 0


def stamp_cell(cell: np.ndarray, head: np.ndarray, who: str) -> None:
    cut = find_cut(cell, who)
    clear_head(cell, cut, who)
    shift = cut - NECK
    h = cell.shape[0]
    ys, xs = np.where(head[:, :, 3] > 0)
    for y, x in zip(ys.tolist(), xs.tolist()):
        ny = y + shift
        if 0 <= ny < h:
            cell[ny, x] = head[y, x]


def apply(path: Path, who: str, kind: str) -> None:
    im = Image.open(path).convert("RGBA")
    a = np.array(im)
    h, w = a.shape[:2]
    front_h, side_h, rear_h = front(who), profile(who), back(who)
    for y in range(0, h, 64):
        row = y // 64
        if kind == "up" or (kind == "walk" and row == 2):
            use = rear_h
        elif kind == "side" or (kind == "walk" and row == 1):
            use = side_h
        else:
            use = front_h
        for x in range(0, w, 32):
            stamp_cell(a[y : y + 64, x : x + 32], use, who)
    Image.fromarray(a).save(path)


def skin_mask(who: str, head: np.ndarray) -> np.ndarray:
    skin = np.zeros(head.shape[:2], bool)
    for col in (SKIN[who], SKIN_D[who], blush(SKIN[who])):
        skin |= (
            (np.abs(head[:, :, 0].astype(int) - col[0]) < 18)
            & (np.abs(head[:, :, 1].astype(int) - col[1]) < 18)
            & (np.abs(head[:, :, 2].astype(int) - col[2]) < 18)
            & (head[:, :, 3] > 0)
        )
    skin[:, CHEEK_L - 1] = False
    skin[:, CHEEK_R + 1] = False
    if NECK < skin.shape[0]:
        skin[NECK] = False
    return skin


def squint(who: str, head: np.ndarray) -> None:
    """Hair hidden. A muzzle is tall, narrow, or pointed."""
    skin = skin_mask(who, head)
    ys, xs = np.where(skin)
    if len(xs) == 0:
        raise SystemExit(f"{who}: no face")
    width = int(xs.max() - xs.min() + 1)
    height = int(ys.max() - ys.min() + 1)
    jaw = 0
    cheek = 0
    for y in range(int(ys.min()), int(ys.max()) + 1):
        row = np.where(skin[y])[0]
        if len(row) == 0:
            continue
        w = int(row.max() - row.min() + 1)
        cheek = max(cheek, w)
        if y >= int(ys.max()) - 1:
            jaw = max(jaw, w)
    ratio = height / max(1, width)
    jaw_r = jaw / max(1, cheek)
    # Eyes: the 3-tall ink block, not the brow or the mouth.
    ink = (head[:, :, 0] < 40) & (head[:, :, 1] < 40) & (head[:, :, 2] < 40) & (head[:, :, 3] > 0)
    white = (head[:, :, 0] > 230) & (head[:, :, 1] > 230) & (head[:, :, 3] > 0)
    eye_rows = [y for y in range(head.shape[0]) if white[y].any() and ink[y].sum() >= 2]
    if len(eye_rows) < 1:
        raise SystemExit(f"{who}: eyes missing")
    eye_mid = eye_rows[0] + 1  # highlight is the top of the 3px oval
    down = (eye_mid - int(ys.min())) / max(1, height)
    if ratio > 1.0 or jaw_r < 0.70 or not (0.52 <= down <= 0.68):
        raise SystemExit(
            f"{who}: still a muzzle width={width} height={height} jaw={jaw_r:.2f} eyes={down:.2f}"
        )
    print(f"  {who:8} face {width}x{height}  h/w={ratio:.2f}  jaw={jaw_r:.2f}  eyes={down:.2f}")


def hide_hair(who: str, head: np.ndarray) -> np.ndarray:
    out = head.copy()
    for y in range(out.shape[0]):
        for x in range(out.shape[1]):
            if is_hair_px(out[y, x], who) or tuple(int(v) for v in out[y, x]) in (GOLD, STEEL, STEEL_D):
                out[y, x, 3] = 0
    return out


def sheet() -> None:
    """8 people, 4 directions, at 1× and at 6×, standing on the cafe floor."""
    cafe = Image.open(ROOT / "public/art/cafe.png").convert("RGBA")
    tile = cafe.crop((120, 320, 168, 368))
    dirs = ("down", "right", "up", "left")
    names = list(CAST)

    def cell(who: str, facing: str) -> Image.Image:
        if facing == "down":
            im = Image.open(SPR / f"{who}_idle_32.png").convert("RGBA").crop((0, 0, 32, 64))
        elif facing == "up":
            im = Image.open(SPR / f"{who}_up.png").convert("RGBA").crop((0, 0, 32, 64))
        else:
            im = Image.open(SPR / f"{who}_side.png").convert("RGBA").crop((0, 0, 32, 64))
            if facing == "left":
                im = im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        return im

    def floor_canvas(w: int, h: int) -> Image.Image:
        canvas = Image.new("RGBA", (w, h))
        for y in range(0, h, tile.height):
            for x in range(0, w, tile.width):
                canvas.paste(tile, (x, y))
        return canvas

    def band(scale: int, label: bool) -> Image.Image:
        gap = 6 * scale
        cw, ch = 32 * scale, 64 * scale
        w = len(names) * (cw + gap) + gap
        h = 18 + len(dirs) * (ch + gap) + gap
        canvas = floor_canvas(w, h)
        draw = ImageDraw.Draw(canvas)
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12 if scale > 1 else 8)
        except OSError:
            font = ImageFont.load_default()
        for i, who in enumerate(names):
            if label:
                draw.text((gap + i * (cw + gap), 2), who, fill=(48, 32, 18, 255), font=font)
            for j, facing in enumerate(dirs):
                sprite = cell(who, facing).resize((cw, ch), Image.NEAREST)
                canvas.paste(sprite, (gap + i * (cw + gap), 16 + j * (ch + gap)), sprite)
        return canvas

    one = band(1, False)
    six = band(6, True)
    # 1× sits on the same floor, full width, so it is not a stamp in a dark corner.
    top_h = one.height + 8
    out = floor_canvas(six.width, top_h + six.height)
    out.paste(one, ((six.width - one.width) // 2, 4))
    out.paste(six, (0, top_h))
    PREVIEW.mkdir(parents=True, exist_ok=True)
    out.save(PREVIEW / "faces-sheet.png")
    squ = Image.new("RGBA", (32 * 8 * 8, 32 * 8 + 40), (186, 196, 176, 255))
    for i, who in enumerate(names):
        bare_im = Image.fromarray(bare(who))
        bare_im_np = np.array(bare_im)
        bare_im_np[NECK:, :, 3] = 0
        bare_im = Image.fromarray(bare_im_np).crop((0, 0, 32, 32))
        squ.paste(bare_im, (i * 32, 0), bare_im)
        big = bare_im.resize((256, 256), Image.NEAREST)
        squ.paste(big, (i * 256, 40), big)
    squ.save(PREVIEW / "faces-squint.png")
    print("wrote", PREVIEW / "faces-sheet.png")


def main() -> None:
    for who in CAST:
        squint(who, bare(who))
        files = {
            "idle": SPR / f"{who}_idle_32.png",
            "sit": SPR / f"{who}_sit.png",
            "side": SPR / f"{who}_side.png",
            "up": SPR / f"{who}_up.png",
            "walk": SPR / f"{who}_walk4.png",
            "loco": SPR / f"{who}_loco.png",
        }
        for kind, path in files.items():
            if path.exists():
                apply(path, who, kind)
        print("stamped", who)
    sheet()


if __name__ == "__main__":
    main()
