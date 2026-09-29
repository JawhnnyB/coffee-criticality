#!/usr/bin/env python3
"""Paint a native 32px face onto the existing bodies.

Downscaling a talk portrait onto a 32px cell turns the face into a brown
mound (GROK_ART_101). This stamps a skin oval, two ink eyes, and a hair
shape in the top 18 rows and leaves the body (y >= 18) alone.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SPR = ROOT / "public/art/gen/sprites"

INK = (22, 17, 13, 255)
WHITE = (248, 244, 236, 255)
GOLD = (201, 162, 39, 255)
STEEL = (61, 92, 102, 255)
STEEL_D = (36, 56, 64, 255)

SKIN = {
    "player": (224, 186, 148, 255),
    "mabel": (232, 196, 160, 255),
    "holt": (224, 186, 148, 255),
    "elena": (196, 148, 104, 255),
    "tommy": (196, 148, 104, 255),
    "marcus": (224, 186, 148, 255),
    "priya": (168, 108, 68, 255),
    "jordan": (196, 148, 104, 255),
}
SKIN_D = {
    "player": (201, 160, 122, 255),
    "mabel": (201, 160, 122, 255),
    "holt": (201, 160, 122, 255),
    "elena": (168, 118, 78, 255),
    "tommy": (168, 118, 78, 255),
    "marcus": (201, 160, 122, 255),
    "priya": (128, 80, 48, 255),
    "jordan": (168, 118, 78, 255),
}
HAIR = {
    "player": (90, 49, 29, 255),
    "mabel": (200, 192, 180, 255),
    "holt": (154, 148, 136, 255),
    "elena": (26, 20, 16, 255),
    "tommy": (90, 80, 72, 255),
    "marcus": (122, 58, 40, 255),
    "priya": (26, 20, 16, 255),
    "jordan": (26, 20, 16, 255),
}
HAIR_D = {
    "player": (64, 35, 20, 255),
    "mabel": (154, 148, 136, 255),
    "holt": (90, 84, 76, 255),
    "elena": (22, 17, 13, 255),
    "tommy": (61, 92, 102, 255),
    "marcus": (80, 36, 24, 255),
    "priya": (22, 17, 13, 255),
    "jordan": (22, 17, 13, 255),
}

CAST = ("player", "mabel", "holt", "elena", "tommy", "marcus", "priya", "jordan")
GLASSES = {"player", "marcus"}


def disc(a: np.ndarray, cx: int, cy: int, rx: int, ry: int, col: tuple[int, int, int, int], y_max: int = 18) -> None:
    for y in range(max(0, cy - ry), min(a.shape[0], cy + ry + 1, y_max)):
        for x in range(max(0, cx - rx), min(a.shape[1], cx + rx + 1)):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.05:
                a[y, x] = col


def px(a: np.ndarray, x: int, y: int, col: tuple[int, int, int, int]) -> None:
    if 0 <= x < a.shape[1] and 0 <= y < a.shape[0]:
        a[y, x] = col


def brows(a: np.ndarray, y: int, x0: int = 12, x1: int = 15, x2: int = 17, x3: int = 20) -> None:
    for x in range(x0, x1 + 1):
        px(a, x, y, INK)
    for x in range(x2, x3 + 1):
        px(a, x, y, INK)


def eyes(a: np.ndarray, y: int = 12) -> None:
    px(a, 13, y, INK)
    px(a, 14, y, INK)
    px(a, 18, y, INK)
    px(a, 19, y, INK)


def mouth(a: np.ndarray, y: int, kind: str) -> None:
    if kind == "smile":
        px(a, 14, y, INK)
        px(a, 15, y - 1, INK)
        px(a, 16, y - 1, INK)
        px(a, 17, y, INK)
    elif kind == "grin":
        for x in range(13, 19):
            px(a, x, y, INK)
        px(a, 13, y - 1, INK)
        px(a, 18, y - 1, INK)
    elif kind == "flat":
        for x in range(14, 18):
            px(a, x, y, INK)
    elif kind == "down":
        px(a, 14, y - 1, INK)
        px(a, 15, y, INK)
        px(a, 16, y, INK)
        px(a, 17, y - 1, INK)
    else:
        px(a, 15, y, INK)
        px(a, 16, y, INK)


def glasses(a: np.ndarray, y: int, skin: tuple[int, int, int, int], wide: bool = False) -> None:
    """Hollow rims. Lenses stay skin so this does not read as a visor."""
    left = (11, 15) if wide else (12, 15)
    right = (17, 21) if wide else (17, 20)
    for x0, x1 in (left, right):
        for x in range(x0, x1 + 1):
            px(a, x, y, INK)
            px(a, x, y + 3, INK)
        px(a, x0, y + 1, INK)
        px(a, x0, y + 2, INK)
        px(a, x1, y + 1, INK)
        px(a, x1, y + 2, INK)
        px(a, x0 + 2, y + 1, INK)
    bridge = left[1] + 1
    for yy in range(y, y + 3):
        px(a, bridge, yy, skin)


def neck(a: np.ndarray, skin: tuple[int, int, int, int]) -> None:
    for y in (16, 17):
        for x in range(14, 18):
            px(a, x, y, skin)


def front(who: str) -> np.ndarray:
    a = np.zeros((64, 32, 4), np.uint8)
    hair, hair_d = HAIR[who], HAIR_D[who]
    skin, skin_d = SKIN[who], SKIN_D[who]
    if who == "tommy":
        for y in range(1, 6):
            for x in range(11, 22):
                px(a, x, y, STEEL if y > 1 else STEEL_D)
        for x in range(8, 25):
            px(a, x, 6, STEEL_D)
        for y in range(7, 15):
            for x in range(12, 21):
                px(a, x, y, skin)
        for x in range(13, 20):
            px(a, x, 14, skin_d)
        brows(a, 9, 13, 15, 17, 19)
        eyes(a, 11)
        mouth(a, 13, "grin")
        neck(a, skin)
        return a
    # Holt is balding: hair is a horseshoe, forehead is the whole upper face.
    if who == "holt":
        for y in range(2, 8):
            px(a, 10, y, hair)
            px(a, 11, y, hair_d)
            px(a, 21, y, hair_d)
            px(a, 22, y, hair)
        for x in range(11, 22):
            px(a, x, 2, hair)
            px(a, x, 3, hair_d)
        for y in range(4, 15):
            for x in range(12, 21):
                px(a, x, y, skin)
        for x in range(13, 20):
            px(a, x, 14, skin_d)
        brows(a, 9, 13, 15, 17, 19)
        eyes(a, 11)
        px(a, 16, 12, skin_d)
        mouth(a, 14, "down")
        neck(a, skin)
        return a
    half = 5 if who in ("player", "mabel", "marcus", "jordan") else 4
    for y in range(2, 8):
        for x in range(16 - half - 2, 16 + half + 3):
            px(a, x, y, hair if y > 3 else hair_d)
    for y in range(7, 16):
        for x in range(16 - half, 16 + half + 1):
            px(a, x, y, skin)
    for x in range(14, 19):
        px(a, x, 15, skin_d)
    if who == "player":
        for x in range(12, 18):
            px(a, x, 6, hair)
            px(a, x, 7, hair_d)
        glasses(a, 9, skin, wide=False)
        mouth(a, 14, "flat")
    elif who == "marcus":
        glasses(a, 9, skin, wide=True)
        for x in range(14, 19):
            px(a, x, 13, hair)
        mouth(a, 15, "flat")
    elif who == "mabel":
        for y in range(1, 9):
            for x in range(18, 26):
                if (x - 22) ** 2 + (y - 4) ** 2 <= 16:
                    px(a, x, y, hair)
        px(a, 23, 3, GOLD)
        px(a, 24, 3, GOLD)
        brows(a, 9)
        eyes(a, 11)
        mouth(a, 14, "smile")
    elif who == "elena":
        for y in range(6, 28):
            px(a, 9, y, hair)
            px(a, 10, y, hair_d)
            px(a, 22, y, hair_d)
            px(a, 23, y, hair)
        px(a, 9, 12, GOLD)
        brows(a, 9, 13, 15, 17, 19)
        eyes(a, 11)
        mouth(a, 14, "smile")
    elif who == "priya":
        for y in range(6, 30):
            px(a, 22, y, hair)
            px(a, 23, y, hair)
            px(a, 24, y, hair_d)
            if y % 4 == 0:
                px(a, 25, y, hair)
        px(a, 16, 8, GOLD)
        brows(a, 9, 13, 15, 17, 19)
        eyes(a, 11)
        mouth(a, 14, "smile")
    else:
        # Jordan — short crop, a cheek mark, no accessory.
        brows(a, 9, 12, 15, 17, 20)
        eyes(a, 11)
        px(a, 13, 13, (184, 92, 74, 255))
        mouth(a, 14, "flat")
    neck(a, skin)
    return a


def back(who: str) -> np.ndarray:
    a = np.zeros((64, 32, 4), np.uint8)
    hair, hair_d = HAIR[who], HAIR_D[who]
    skin = SKIN[who]
    if who == "tommy":
        for y in range(2, 8):
            for x in range(10, 23):
                px(a, x, y, STEEL)
        for x in range(8, 25):
            px(a, x, 8, STEEL_D)
        neck(a, skin)
        return a
    if who == "holt":
        for y in range(3, 10):
            px(a, 10, y, hair)
            px(a, 11, y, hair)
            px(a, 21, y, hair)
            px(a, 22, y, hair)
        for x in range(12, 21):
            px(a, x, 3, hair_d)
            px(a, x, 9, skin)
        neck(a, skin)
        return a
    for y in range(2, 12):
        for x in range(10, 23):
            px(a, x, y, hair if (x + y) % 5 else hair_d)
    if who == "mabel":
        for y in range(2, 10):
            for x in range(18, 26):
                if (x - 22) ** 2 + (y - 5) ** 2 <= 18:
                    px(a, x, y, hair)
    if who == "elena":
        for y in range(8, 28):
            px(a, 9, y, hair)
            px(a, 10, y, hair_d)
            px(a, 22, y, hair_d)
            px(a, 23, y, hair)
    if who == "priya":
        for y in range(8, 30):
            px(a, 23, y, hair)
            px(a, 24, y, hair_d)
    neck(a, skin)
    return a


def stamp_cell(cell: np.ndarray, head: np.ndarray, clear_to: int = 18) -> None:
    cell[:clear_to, :, 3] = 0
    # Elena / Priya hair hangs past the collar. Only write those pixels.
    sel = head[:, :, 3] > 0
    cell[sel] = head[sel]


def apply(path: Path, who: str, kind: str) -> None:
    im = Image.open(path).convert("RGBA")
    a = np.array(im)
    h, w = a.shape[:2]
    face = front(who)
    rear = back(who)
    for y in range(0, h, 64):
        row = y // 64
        use = rear if kind == "up" or (kind == "walk" and row == 2) else face
        for x in range(0, w, 32):
            stamp_cell(a[y : y + 64, x : x + 32], use)
    Image.fromarray(a).save(path)


def main() -> None:
    for who in CAST:
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
        idle = Image.open(files["idle"]).convert("RGBA")
        big = idle.resize((128, 256), Image.Resampling.NEAREST)
        bg = Image.new("RGBA", big.size, (22, 17, 13, 255))
        bg.alpha_composite(big)
        bg.convert("RGB").save(Path("/tmp") / f"face_{who}_4x.png")
        print("stamped", who)


if __name__ == "__main__":
    main()
