#!/usr/bin/env python3
"""Kettle-lit campus tiles and missing props.

Light from TOP-LEFT. Three planes + 1px ink. Native dest size. No letters.
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
TILES = ROOT / "public/art/gen/tiles"
PROPS = ROOT / "public/art/gen/props"
FX = ROOT / "public/art/gen/fx"

CREAM = (243, 230, 208, 255)
COPPER = (196, 120, 58, 255)
LEAF = (107, 143, 113, 255)
INK = (22, 17, 13, 255)
STEEL = (61, 92, 102, 255)
GOLD = (201, 162, 39, 255)
WOOD = (106, 74, 50, 255)
WOOD_L = (138, 98, 64, 255)
WOOD_D = (58, 40, 24, 255)
STEEL_L = (90, 122, 130, 255)
STEEL_D = (36, 56, 62, 255)
GRASS_L = (90, 122, 96, 255)
GRASS = (61, 92, 68, 255)
GRASS_D = (42, 70, 50, 255)
ASH = (48, 46, 42, 255)
ASH_L = (70, 66, 60, 255)
ASH_D = (28, 26, 24, 255)
SKY_M = (120, 168, 186, 255)
SKY_N = (154, 196, 206, 255)
SKY_D = (90, 74, 88, 255)


def box(d: ImageDraw.ImageDraw, x, y, w, h, top, left, right, ink=INK):
    d.rectangle([x, y, x + w - 1, y + h - 1], fill=left, outline=ink)
    d.rectangle([x + 1, y + 1, x + w - 2, y + 1], fill=top)
    d.rectangle([x + w - 2, y + 2, x + w - 2, y + h - 2], fill=right)
    d.rectangle([x + 1, y + h - 2, x + w - 2, y + h - 2], fill=right)


def tile_wood() -> Image.Image:
    im = Image.new("RGBA", (16, 16), WOOD)
    d = ImageDraw.Draw(im)
    for i, y in enumerate((0, 5, 10)):
        c = WOOD_L if i % 2 == 0 else WOOD
        d.rectangle([0, y, 15, y + 4], fill=c)
        d.rectangle([0, y, 15, y], fill=WOOD_L)
        d.rectangle([0, y + 4, 15, y + 4], fill=WOOD_D)
        d.rectangle([8 if i % 2 else 3, y, 8 if i % 2 else 3, y + 4], fill=WOOD_D)
    d.rectangle([0, 0, 15, 15], outline=INK)
    return im


def tile_metal() -> Image.Image:
    im = Image.new("RGBA", (16, 16), STEEL)
    d = ImageDraw.Draw(im)
    box(d, 0, 0, 16, 16, STEEL_L, STEEL, STEEL_D)
    d.rectangle([2, 2, 6, 6], outline=STEEL_D)
    d.rectangle([9, 9, 13, 13], outline=STEEL_D)
    return im


def tile_stone() -> Image.Image:
    im = Image.new("RGBA", (16, 16), (44, 48, 54, 255))
    d = ImageDraw.Draw(im)
    box(d, 0, 0, 16, 16, (70, 74, 80, 255), (44, 48, 54, 255), (28, 32, 36, 255))
    d.line([(0, 8), (15, 8)], fill=(28, 32, 36, 255))
    d.line([(8, 0), (8, 15)], fill=(28, 32, 36, 255))
    return im


def tile_grass() -> Image.Image:
    im = Image.new("RGBA", (16, 16), GRASS)
    px = im.load()
    for y in range(16):
        for x in range(16):
            v = (x * 3 + y * 7) % 5
            px[x, y] = GRASS_L if v == 0 else GRASS_D if v == 1 else GRASS
    d = ImageDraw.Draw(im)
    d.point((2, 4), fill=LEAF)
    d.point((11, 9), fill=GRASS_L)
    d.rectangle([0, 0, 15, 15], outline=GRASS_D)
    return im


def tile_asphalt() -> Image.Image:
    im = Image.new("RGBA", (16, 16), ASH)
    px = im.load()
    for y in range(16):
        for x in range(16):
            if (x + y * 3) % 7 == 0:
                px[x, y] = ASH_L if (x + y) % 2 == 0 else ASH_D
    return im


def tile_stripe() -> Image.Image:
    im = tile_asphalt()
    d = ImageDraw.Draw(im)
    d.rectangle([6, 1, 9, 14], fill=GOLD)
    d.rectangle([6, 1, 9, 1], fill=CREAM)
    return im


def tile_grate() -> Image.Image:
    im = Image.new("RGBA", (16, 16), STEEL_D)
    d = ImageDraw.Draw(im)
    for i in range(0, 16, 4):
        d.rectangle([i, 0, i + 1, 15], fill=STEEL)
        d.rectangle([0, i, 15, i + 1], fill=STEEL)
    d.rectangle([0, 0, 15, 15], outline=INK)
    return im


def tile_curb() -> Image.Image:
    im = Image.new("RGBA", (16, 16), (90, 86, 78, 255))
    d = ImageDraw.Draw(im)
    box(d, 0, 0, 16, 16, (160, 150, 130, 255), (110, 104, 94, 255), (60, 56, 50, 255))
    d.rectangle([0, 0, 15, 3], fill=CREAM)
    return im


def sky(morning=True, midday=False) -> Image.Image:
    if midday:
        top, bot = (186, 214, 222, 255), SKY_N
    elif morning:
        top, bot = SKY_N, SKY_M
    else:
        top, bot = (74, 58, 72, 255), SKY_D
    im = Image.new("RGBA", (16, 16), bot)
    d = ImageDraw.Draw(im)
    for y in range(16):
        t = y / 15
        c = tuple(int(top[i] * (1 - t) + bot[i] * t) for i in range(3)) + (255,)
        d.line([(0, y), (15, y)], fill=c)
    return im


def prop_lamp() -> Image.Image:
    im = Image.new("RGBA", (16, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([7, 10, 8, 31], fill=STEEL_D, outline=INK)
    box(d, 3, 0, 10, 10, CREAM, GOLD, COPPER)
    return im


def prop_microwave() -> Image.Image:
    im = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    box(d, 0, 2, 16, 14, STEEL_L, STEEL, STEEL_D)
    d.rectangle([2, 5, 10, 12], fill=(20, 24, 28, 255), outline=INK)
    d.rectangle([12, 6, 13, 8], fill=LEAF)
    return im


def prop_couch() -> Image.Image:
    im = Image.new("RGBA", (48, 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    box(d, 2, 8, 44, 16, WOOD_L, WOOD, WOOD_D)
    box(d, 4, 2, 16, 12, (90, 70, 58, 255), (74, 54, 42, 255), WOOD_D)
    box(d, 28, 2, 16, 12, (90, 70, 58, 255), (74, 54, 42, 255), WOOD_D)
    d.rectangle([2, 20, 45, 23], fill=WOOD_D)
    return im


def prop_vending() -> Image.Image:
    im = Image.new("RGBA", (16, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    box(d, 1, 0, 14, 32, STEEL_L, STEEL, STEEL_D)
    d.rectangle([3, 3, 12, 18], fill=(16, 28, 32, 255), outline=INK)
    for y, c in ((5, COPPER), (9, LEAF), (13, GOLD)):
        d.rectangle([5, y, 10, y + 2], fill=c)
    d.rectangle([5, 22, 10, 26], fill=INK)
    return im


def prop_board() -> Image.Image:
    im = Image.new("RGBA", (80, 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    box(d, 0, 0, 80, 24, STEEL_L, (28, 36, 40, 255), STEEL_D)
    d.rectangle([4, 4, 24, 19], fill=(20, 28, 24, 255), outline=LEAF)
    d.rectangle([28, 4, 52, 19], fill=(28, 24, 16, 255), outline=GOLD)
    d.rectangle([56, 4, 75, 19], fill=(24, 20, 18, 255), outline=COPPER)
    return im


def prop_dose() -> Image.Image:
    im = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    box(d, 1, 1, 14, 14, CREAM, (220, 180, 70, 255), COPPER)
    d.ellipse([5, 5, 10, 10], outline=INK)
    return im


def prop_prints() -> Image.Image:
    im = Image.new("RGBA", (16, 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    box(d, 1, 2, 14, 20, CREAM, (220, 200, 170, 255), WOOD)
    d.line([(4, 8), (12, 8)], fill=STEEL)
    d.line([(4, 12), (12, 12)], fill=STEEL)
    d.rectangle([6, 14, 10, 18], outline=COPPER)
    return im


def fx_mote() -> Image.Image:
    im = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.point((7, 8), fill=LEAF)
    d.point((8, 7), fill=LEAF)
    d.point((6, 9), fill=GRASS_D)
    return im


def main() -> None:
    TILES.mkdir(parents=True, exist_ok=True)
    PROPS.mkdir(parents=True, exist_ok=True)
    FX.mkdir(parents=True, exist_ok=True)
    mapping = {
        TILES / "wood_floor.png": tile_wood(),
        TILES / "metal_floor.png": tile_metal(),
        TILES / "stone_floor.png": tile_stone(),
        TILES / "grass.png": tile_grass(),
        TILES / "asphalt.png": tile_asphalt(),
        TILES / "warning_stripe.png": tile_stripe(),
        TILES / "grate.png": tile_grate(),
        TILES / "curb.png": tile_curb(),
        TILES / "sky_morning.png": sky(True, False),
        TILES / "sky_midday.png": sky(True, True),
        TILES / "sky_dusk.png": sky(False, False),
        PROPS / "lamp.png": prop_lamp(),
        PROPS / "microwave.png": prop_microwave(),
        PROPS / "couch.png": prop_couch(),
        PROPS / "vending.png": prop_vending(),
        PROPS / "board.png": prop_board(),
        PROPS / "dose.png": prop_dose(),
        PROPS / "prints.png": prop_prints(),
        FX / "mote.png": fx_mote(),
    }
    for p, im in mapping.items():
        im.save(p)
        print("wrote", p.name, im.size)


if __name__ == "__main__":
    main()
