#!/usr/bin/env python3
"""Locked Lake Master palette.

Plant identity: cream / copper / leaf / ink / steel / gold / wood.
Skin is a warm ramp only — a skin pixel may never become steel/navy.
Photoreal stills (plates, cutaways, floor photos) do not use this file.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
UI = ROOT / "public/art/gen/ui"

# RGB only. Alpha is applied by callers.
INK = (22, 17, 13)
OUTLINE = (26, 20, 16)
CREAM = (243, 230, 208)
CREAM_D = (220, 200, 170)
MUTED = (181, 164, 140)
ASH = (138, 120, 100)
COPPER_L = (232, 168, 96)
COPPER = (196, 120, 58)
COPPER_D = (138, 72, 32)
LEAF_L = (140, 176, 148)
LEAF = (107, 143, 113)
LEAF_D = (61, 92, 68)
STEEL_L = (90, 122, 132)
STEEL = (61, 92, 102)
STEEL_D = (36, 56, 64)
GOLD_L = (232, 196, 80)
GOLD = (201, 162, 39)
GOLD_D = (120, 80, 24)
WOOD_L = (138, 98, 66)
WOOD = (106, 74, 50)
WOOD_MID = (74, 52, 36)
WOOD_D = (58, 40, 24)
BAD = (184, 92, 74)
BAD_D = (120, 48, 40)
SKY = (106, 154, 170)
SKY_DUSK = (90, 74, 88)
WHITE = (248, 244, 236)
SURFACE = (42, 34, 27)
ELEVATED = (34, 28, 22)
JKT_L = (208, 204, 192)
JKT = (176, 172, 162)
JKT_D = (124, 120, 112)
BAND = (74, 78, 82)
BAND_L = (110, 114, 118)
CHER = (32, 110, 140)
CHER_L = (140, 210, 220)
CHER_D = (12, 36, 48)
BIO = (48, 50, 52)
BIO_L = (70, 72, 74)
BIO_D = (32, 34, 36)
ASPH = (42, 40, 38)
WINE_L = (148, 88, 120)
WINE = (112, 64, 96)
WINE_D = (80, 44, 68)
GRASS = LEAF_D

SKIN_FAIR_L = (236, 200, 164)
SKIN_FAIR = (224, 186, 148)
SKIN_FAIR_D = (201, 160, 122)
SKIN_TAN = (196, 148, 104)
SKIN_TAN_D = (168, 118, 78)
SKIN_BROWN_L = (184, 137, 88)
SKIN_BROWN = (168, 108, 68)
SKIN_BROWN_D = (128, 80, 48)
SKIN_BLUSH = (180, 96, 88)

HAIR_INK = OUTLINE
HAIR_BROWN = WOOD_MID
HAIR_AUBURN = (122, 58, 40)
HAIR_SILVER = (200, 192, 180)
HAIR_GREY = (154, 148, 136)
HAIR_TOMMY = (90, 80, 72)
HAIR_JORDAN = (106, 74, 40)

# Who → locked skin / hair. Priya is brown, never steel.
CAST_SKIN = {
    "player": SKIN_FAIR,
    "mabel": SKIN_FAIR_L,
    "holt": SKIN_FAIR,
    "elena": SKIN_TAN,
    "tommy": SKIN_TAN,
    "marcus": SKIN_FAIR,
    "priya": SKIN_BROWN,
    "jordan": SKIN_TAN,
}
CAST_HAIR = {
    "player": HAIR_BROWN,
    "mabel": HAIR_SILVER,
    "holt": HAIR_GREY,
    "elena": HAIR_INK,
    "tommy": HAIR_TOMMY,
    "marcus": HAIR_AUBURN,
    "priya": HAIR_INK,
    "jordan": HAIR_JORDAN,
}

SKIN = (
    SKIN_FAIR_L,
    SKIN_FAIR,
    SKIN_FAIR_D,
    SKIN_TAN,
    SKIN_TAN_D,
    SKIN_BROWN_L,
    SKIN_BROWN,
    SKIN_BROWN_D,
    SKIN_BLUSH,
    WHITE,
)
HAIR = (
    HAIR_INK,
    HAIR_BROWN,
    HAIR_AUBURN,
    HAIR_SILVER,
    HAIR_GREY,
    HAIR_TOMMY,
    HAIR_JORDAN,
    WOOD_D,
    INK,
    OUTLINE,
    CREAM,
    MUTED,
    ASH,
)
PLANT = (
    INK,
    OUTLINE,
    ELEVATED,
    SURFACE,
    CREAM,
    CREAM_D,
    MUTED,
    ASH,
    COPPER_L,
    COPPER,
    COPPER_D,
    LEAF_L,
    LEAF,
    LEAF_D,
    STEEL_L,
    STEEL,
    STEEL_D,
    GOLD_L,
    GOLD,
    GOLD_D,
    WOOD_L,
    WOOD,
    WOOD_MID,
    WOOD_D,
    BAD,
    BAD_D,
    SKY,
    SKY_DUSK,
    WHITE,
    JKT_L,
    JKT,
    JKT_D,
    BAND,
    BAND_L,
    CHER,
    CHER_L,
    CHER_D,
    BIO,
    BIO_L,
    BIO_D,
    ASPH,
    WINE_L,
    WINE,
    WINE_D,
    GRASS,
)

# Named chips for the swatch (no letters on the PNG).
SWATCH = [
    ("ink", INK),
    ("outline", OUTLINE),
    ("cream", CREAM),
    ("cream_d", CREAM_D),
    ("copper", COPPER),
    ("copper_l", COPPER_L),
    ("copper_d", COPPER_D),
    ("leaf", LEAF),
    ("steel", STEEL),
    ("gold", GOLD),
    ("wood", WOOD),
    ("bad", BAD),
    ("wine", WINE),
    ("skin_fair", SKIN_FAIR),
    ("skin_tan", SKIN_TAN),
    ("skin_brown", SKIN_BROWN),
]


def rgba(rgb: tuple[int, int, int], a: int = 255) -> tuple[int, int, int, int]:
    return (rgb[0], rgb[1], rgb[2], a)


def is_skin_rgb(r: int, g: int, b: int, a: int = 255) -> bool:
    """Warm flesh. Copper, cream cloth, gold, and steel never qualify."""
    if a < 80 or r < 120:
        return False
    if r <= b + 12:
        return False
    if r < g - 12:
        return False
    if g < b - 18:
        return False
    if abs(r - g) < 16 and abs(g - b) < 16:
        return False
    # cream apron / paper
    if r > 200 and g > 170 and b > 150:
        return False
    # copper hoodie / rust jacket (orange, very little blue)
    if b < 64 and (r - g) >= 70:
        return False
    # gold
    if b < 50 and g > 140:
        return False
    return True


def is_navy_skin(r: int, g: int, b: int, a: int = 255) -> bool:
    return is_skin_rgb(r, g, b, a) and (b >= r or (b > g + 8 and b > 70))


def _nearest(rgb: np.ndarray, colors: tuple[tuple[int, int, int], ...]) -> np.ndarray:
    pal = np.array(colors, dtype=np.int16)
    pix = rgb.astype(np.int16)
    d = ((pix[:, None, :] - pal[None, :, :]) ** 2).sum(axis=2)
    return pal[d.argmin(axis=1)].astype(np.uint8)


def snap_rgb(r: int, g: int, b: int, family: tuple[tuple[int, int, int], ...]) -> tuple[int, int, int]:
    pal = np.array(family, dtype=np.int32)
    d = ((pal[:, 0] - r) ** 2 + (pal[:, 1] - g) ** 2 + (pal[:, 2] - b) ** 2)
    i = int(d.argmin())
    t = family[i]
    return (int(t[0]), int(t[1]), int(t[2]))


def snap_image(im: Image.Image, who: str | None = None) -> Image.Image:
    """Snap opaque pixels onto the locked palette. Skin stays in the skin ramp."""
    a = np.array(im.convert("RGBA"))
    rgb = a[:, :, :3]
    al = a[:, :, 3]
    r = rgb[:, :, 0].astype(np.int16)
    g = rgb[:, :, 1].astype(np.int16)
    b = rgb[:, :, 2].astype(np.int16)
    opaque = al >= 80
    skin = opaque & (r >= 78) & (r > b + 12) & (r >= g - 12) & (g > b - 18) & ~((np.abs(r - g) < 16) & (np.abs(g - b) < 16))
    other = opaque & ~skin
    if skin.any():
        snapped = _nearest(rgb[skin], SKIN)
        if who and who in CAST_SKIN:
            lock = np.array(CAST_SKIN[who], dtype=np.uint8)
            navy = (snapped[:, 2] >= snapped[:, 0]) | ((snapped[:, 2] > snapped[:, 1] + 8) & (snapped[:, 2] > 70))
            if navy.any():
                snapped[navy] = lock
        rgb[skin] = snapped
    if other.any():
        rgb[other] = _nearest(rgb[other], PLANT + HAIR)
    a[:, :, :3] = rgb
    a[:, :, 3] = np.where(opaque, 255, 0)
    return Image.fromarray(a)


def navy_skin_count(im: Image.Image) -> int:
    a = np.array(im.convert("RGBA"))
    r, g, b, al = a[:, :, 0], a[:, :, 1], a[:, :, 2], a[:, :, 3]
    skin = (al >= 80) & (r >= 78) & (r > b + 12) & (r >= g - 12) & (g > b - 18)
    navy = skin & ((b >= r) | ((b > g + 8) & (b > 70)))
    return int(navy.sum())


def write_swatch(path: Path | None = None) -> Path:
    """16×16 chips, no letters. Identity row then skin ramp."""
    path = path or (UI / "palette.png")
    n = len(SWATCH)
    cols = 8
    rows = (n + cols - 1) // cols
    cell = 16
    im = Image.new("RGBA", (cols * cell, rows * cell), (*INK, 255))
    d = None
    from PIL import ImageDraw

    d = ImageDraw.Draw(im)
    for i, (_name, col) in enumerate(SWATCH):
        x = (i % cols) * cell
        y = (i // cols) * cell
        d.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(*col, 255), outline=(*INK, 255))
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path)
    four = im.resize((im.width * 4, im.height * 4), Image.Resampling.NEAREST)
    four.save(path.with_name("palette_4x.png"))
    return path


def main() -> None:
    p = write_swatch()
    print("swatch", p, "chips", len(SWATCH))
    for who, skin in CAST_SKIN.items():
        assert not is_navy_skin(*skin, 255), who
        print(f"lock {who:8} skin={skin} hair={CAST_HAIR[who]}")


if __name__ == "__main__":
    main()
