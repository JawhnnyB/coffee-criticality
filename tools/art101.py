#!/usr/bin/env python3
"""GROK_ART_101 remaining art: tiles, site plan, props, glimpses, talk busts."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

from flood import flood_from_border
from packTalk import CAST, knock_border
# Color tuples match tools/palette.py. Do not run talk_busts (LANCZOS).

ROOT = Path("/workspace")
PUB = ROOT / "public/art/gen"
LOCK = PUB / "lock"
TIL = PUB / "tiles"
PROP = PUB / "props"
UI = PUB / "ui"
STILL = PUB / "stills"
POR = PUB / "portraits"
SPR = PUB / "sprites"

INK = (22, 17, 13, 255)
CREAM = (243, 230, 208, 255)
COPPER = (196, 120, 58, 255)
LEAF = (107, 143, 113, 255)
STEEL = (61, 92, 102, 255)
STEEL_L = (86, 118, 126, 255)
STEEL_D = (36, 56, 64, 255)
GOLD = (201, 162, 39, 255)
WOOD = (106, 74, 50, 255)
WOOD_L = (138, 98, 66, 255)
WOOD_D = (58, 40, 24, 255)
BLUE = (70, 150, 180, 255)
GRASS = (61, 92, 68, 255)
ASPH = (42, 40, 38, 255)


def new(w, h, c=(0, 0, 0, 0)):
    return Image.new("RGBA", (w, h), c)


def box(d: ImageDraw.ImageDraw, x, y, w, h, top, left, right):
    d.rectangle([x, y, x + w - 1, y + max(2, h // 3) - 1], fill=top)
    mid = y + max(2, h // 3)
    d.rectangle([x, mid, x + w // 2 - 1, y + h - 1], fill=left)
    d.rectangle([x + w // 2, mid, x + w - 1, y + h - 1], fill=right)
    d.rectangle([x, y, x + w - 1, y + h - 1], outline=INK)


def save(im: Image.Image, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path)
    print("art", path.relative_to(PUB))


def wallpaper_control():
    im = new(16, 16, STEEL_D)
    d = ImageDraw.Draw(im)
    d.rectangle([1, 1, 14, 6], fill=STEEL_L)
    d.rectangle([1, 7, 7, 14], fill=STEEL)
    d.rectangle([8, 7, 14, 14], fill=STEEL_D)
    d.point((3, 3), fill=INK)
    d.point((12, 3), fill=INK)
    d.point((3, 12), fill=INK)
    d.point((12, 12), fill=INK)
    d.rectangle([0, 0, 15, 15], outline=INK)
    save(im, TIL / "wallpaper_control.png")


def wallpaper_cafe():
    im = new(16, 16, CREAM)
    d = ImageDraw.Draw(im)
    d.point((3, 5), fill=COPPER)
    d.point((11, 9), fill=WOOD)
    d.point((7, 13), fill=COPPER)
    d.rectangle([0, 0, 15, 15], outline=(220, 200, 170, 255))
    save(im, TIL / "wallpaper_cafe.png")


def metal_floor():
    im = new(16, 16, STEEL_D)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 15, 15], fill=STEEL_D)
    d.rectangle([1, 1, 14, 7], fill=STEEL)
    d.line([(0, 15), (15, 15)], fill=INK)
    d.line([(15, 0), (15, 15)], fill=INK)
    save(im, TIL / "metal_floor.png")
    g = new(16, 16, STEEL_D)
    dg = ImageDraw.Draw(g)
    for i in range(0, 16, 4):
        dg.rectangle([i, 0, i + 2, 15], fill=STEEL)
    dg.rectangle([0, 0, 15, 15], outline=INK)
    save(g, TIL / "grate.png")


def wood_floor():
    atlas = new(32, 32)
    tones = [(106, 74, 50), (90, 64, 44), (122, 86, 58), (98, 70, 48)]
    d = ImageDraw.Draw(atlas)
    for i, t in enumerate(tones):
        x, y = (i % 2) * 16, (i // 2) * 16
        d.rectangle([x, y, x + 15, y + 15], fill=(*t, 255))
        d.line([(x, y + 15), (x + 15, y + 15)], fill=WOOD_D)
        d.line([(x + 15, y), (x + 15, y + 15)], fill=WOOD_D)
    save(atlas, TIL / "wood_floor.png")


def grass_asphalt():
    g = new(16, 16, (*GRASS[:3], 255))
    d = ImageDraw.Draw(g)
    d.point((4, 6), fill=LEAF)
    d.point((11, 10), fill=(50, 80, 56, 255))
    d.line([(0, 15), (15, 15)], fill=(40, 60, 44, 255))
    save(g, TIL / "grass.png")
    a = new(16, 16, (*ASPH[:3], 255))
    da = ImageDraw.Draw(a)
    da.point((3, 8), fill=(60, 58, 54, 255))
    da.point((12, 4), fill=(32, 30, 28, 255))
    save(a, TIL / "asphalt.png")
    w = new(16, 16, GOLD)
    dw = ImageDraw.Draw(w)
    dw.rectangle([0, 0, 15, 15], fill=ASPH)
    dw.rectangle([0, 5, 15, 10], fill=GOLD)
    save(w, TIL / "warning_stripe.png")


def pip():
    im = new(8, 8)
    d = ImageDraw.Draw(im)
    d.ellipse([1, 1, 6, 6], fill=COPPER, outline=INK)
    d.point((3, 2), fill=CREAM)
    save(im, UI / "pip.png")


def door():
    im = new(16, 32)
    d = ImageDraw.Draw(im)
    box(d, 1, 0, 14, 32, WOOD_L, WOOD, WOOD_D)
    d.rectangle([10, 16, 12, 19], fill=COPPER, outline=INK)
    save(im, PROP / "door.png")


def van():
    im = new(96, 48)
    d = ImageDraw.Draw(im)
    box(d, 8, 10, 80, 30, STEEL_L, STEEL, STEEL_D)
    d.rectangle([8, 22, 87, 26], fill=COPPER)
    d.rectangle([18, 14, 38, 24], fill=CREAM, outline=INK)
    d.rectangle([44, 14, 64, 24], fill=CREAM, outline=INK)
    d.ellipse([18, 34, 32, 46], fill=INK)
    d.ellipse([62, 34, 76, 46], fill=INK)
    d.ellipse([21, 37, 29, 43], fill=COPPER)
    d.ellipse([65, 37, 73, 43], fill=COPPER)
    save(im, PROP / "van.png")


def chair():
    im = new(16, 24)
    d = ImageDraw.Draw(im)
    box(d, 2, 8, 12, 10, WOOD_L, WOOD, WOOD_D)
    d.rectangle([3, 2, 12, 9], fill=WOOD_L, outline=INK)
    d.rectangle([3, 18, 5, 23], fill=WOOD_D)
    d.rectangle([10, 18, 12, 23], fill=WOOD_D)
    save(im, PROP / "chair.png")


def plant():
    im = new(16, 24)
    d = ImageDraw.Draw(im)
    d.ellipse([3, 2, 12, 14], fill=LEAF, outline=INK)
    d.ellipse([5, 4, 10, 10], fill=(80, 120, 86, 255))
    box(d, 5, 14, 6, 10, COPPER, WOOD, WOOD_D)
    save(im, PROP / "plant.png")


def core():
    im = new(48, 48)
    d = ImageDraw.Draw(im)
    d.ellipse([6, 4, 41, 44], fill=STEEL, outline=INK)
    d.ellipse([12, 10, 35, 38], fill=BLUE)
    for x in (18, 22, 26):
        d.rectangle([x, 14, x + 2, 34], fill=GOLD)
    d.ellipse([20, 18, 27, 25], fill=(140, 210, 230, 180))
    save(im, PROP / "core.png")


def valve():
    im = new(16, 16)
    d = ImageDraw.Draw(im)
    d.ellipse([2, 2, 13, 13], fill=STEEL, outline=INK)
    d.rectangle([7, 0, 9, 15], fill=COPPER)
    d.rectangle([0, 7, 15, 9], fill=COPPER)
    save(im, PROP / "valve.png")


def cabinet():
    im = new(24, 32)
    d = ImageDraw.Draw(im)
    box(d, 1, 0, 22, 32, STEEL_L, STEEL, STEEL_D)
    d.rectangle([16, 14, 18, 18], fill=GOLD)
    save(im, PROP / "cabinet.png")


def arcade():
    im = new(32, 48)
    d = ImageDraw.Draw(im)
    box(d, 4, 4, 24, 44, STEEL_L, STEEL, STEEL_D)
    d.rectangle([7, 8, 24, 22], fill=(20, 24, 28, 255), outline=INK)
    d.rectangle([7, 24, 24, 30], fill=COPPER)
    save(im, PROP / "arcade.png")
    for name in ("cab_catch", "cab_fish", "cab_plot", "cab_floor", "cab_horde"):
        save(im.copy(), PROP / f"{name}.png")


def bench_desk():
    b = new(48, 24)
    d = ImageDraw.Draw(b)
    box(d, 2, 8, 44, 10, WOOD_L, WOOD, WOOD_D)
    d.rectangle([4, 18, 8, 23], fill=WOOD_D)
    d.rectangle([40, 18, 44, 23], fill=WOOD_D)
    save(b, PROP / "bench.png")
    desk = new(48, 24)
    dd = ImageDraw.Draw(desk)
    box(dd, 0, 6, 48, 12, STEEL_L, STEEL, STEEL_D)
    dd.rectangle([6, 18, 10, 23], fill=STEEL_D)
    dd.rectangle([38, 18, 42, 23], fill=STEEL_D)
    save(desk, PROP / "desk.png")
    save(desk.copy(), PROP / "console.png")


def site_plan():
    im = new(320, 180, (18, 28, 26, 255))
    d = ImageDraw.Draw(im)
    d.ellipse([6, 14, 78, 78], fill=(50, 110, 130, 255), outline=INK)
    d.ellipse([16, 24, 50, 50], fill=(70, 140, 160, 255))
    d.rectangle([0, 70, 319, 179], fill=GRASS)
    buildings = {
        "cafe": (20, 74, 62, 40, WOOD_L, WOOD, WOOD_D),
        "parlor": (20, 124, 62, 40, COPPER, WOOD, WOOD_D),
        "gate": (90, 74, 56, 48, ASPH, (50, 48, 46, 255), (32, 30, 28, 255)),
        "corridor": (152, 74, 46, 40, STEEL_L, STEEL, STEEL_D),
        "control": (152, 10, 58, 54, STEEL_L, STEEL, GOLD),
        "engineering": (152, 124, 58, 44, STEEL_L, LEAF, STEEL_D),
        "breakroom": (204, 74, 40, 40, CREAM, WOOD, WOOD_D),
        "reactor": (250, 10, 62, 56, STEEL_L, BLUE, STEEL_D),
        "maintenance": (250, 124, 62, 44, STEEL_L, COPPER, STEEL_D),
    }
    hud = {}
    for name, (x, y, w, h, t, l, r) in buildings.items():
        box(d, x, y, w, h, t, l, r)
        hud[name] = (round((x + w / 2) / 320 * 100, 1), round((y + h / 2) / 180 * 100, 1))
    # van on lot
    d.rectangle([102, 90, 134, 108], fill=STEEL, outline=INK)
    d.rectangle([102, 96, 134, 100], fill=COPPER)
    save(im, UI / "site_plan.png")
    print("MAP_HUD", hud)
    return hud


def glimpses():
    src = {
        "cafe": "plate_cafe.png",
        "parlor": "plate_cafe.png",
        "gate": "gate_plate.png",
        "corridor": "corridor_plate.png",
        "control": "control_plate.png",
        "engineering": "engineering_plate.png",
        "breakroom": "breakroom_plate.png",
        "reactor": "plate_pwr.png",
        "maintenance": "maintenance_plate.png",
    }
    for room, fn in src.items():
        p = STILL / fn
        if not p.exists():
            p = STILL / "plate_lake.png"
        im = Image.open(p).convert("RGBA")
        g = im.resize((48, 32), Image.Resampling.LANCZOS)
        save(g, STILL / f"glimpse_{room}.png")


def builder_thumbs():
    for name in ("pwr", "bwr", "pebble", "msr"):
        src = STILL / f"plate_{name}.png"
        if not src.exists():
            continue
        im = Image.open(src).convert("RGBA").resize((160, 90), Image.Resampling.LANCZOS)
        save(im, UI / f"builder_{name}.png")


def talk_busts():
    for who in CAST:
        im = knock_border(Image.open(LOCK / f"{who}_chibi.png"))
        bb = im.getbbox()
        if not bb:
            print("empty lock", who)
            continue
        fig = im.crop(bb)
        # Head+shoulders = a square from the top of the figure, not a % of a 1408 canvas.
        side = min(fig.width, fig.height)
        bust = fig.crop((0, 0, fig.width, min(fig.height, int(side * 1.05))))
        sc = min(96 / bust.width, 96 / bust.height)
        nw, nh = max(1, int(bust.width * sc)), max(1, int(bust.height * sc))
        small = bust.resize((nw, nh), Image.Resampling.LANCZOS)
        out = new(96, 96)
        out.paste(small, ((96 - nw) // 2, (96 - nh) // 2), small)
        save(out, POR / f"{who}_talk.png")


def fuel_chips():
    for name, col in (("F", COPPER), ("1", LEAF), ("2", STEEL)):
        im = new(16, 16)
        d = ImageDraw.Draw(im)
        d.rectangle([1, 1, 14, 14], fill=col, outline=INK)
        d.rectangle([4, 4, 11, 11], fill=CREAM)
        save(im, UI / f"fuel_{name}.png")
    ok = new(16, 16)
    d = ImageDraw.Draw(ok)
    d.rectangle([1, 1, 14, 14], fill=LEAF, outline=INK)
    d.line([(4, 8), (7, 12), (12, 4)], fill=CREAM, width=2)
    save(ok, UI / "lototo_ok.png")
    lie = new(16, 16)
    d = ImageDraw.Draw(lie)
    d.rectangle([1, 1, 14, 14], fill=COPPER, outline=INK)
    d.line([(5, 5), (11, 11)], fill=INK, width=2)
    d.line([(11, 5), (5, 11)], fill=INK, width=2)
    save(lie, UI / "lototo_lie.png")


def main():
    wallpaper_control()
    wallpaper_cafe()
    metal_floor()
    wood_floor()
    grass_asphalt()
    pip()
    door()
    van()
    chair()
    plant()
    core()
    valve()
    cabinet()
    arcade()
    bench_desk()
    hud = site_plan()
    glimpses()
    builder_thumbs()
    talk_busts()
    fuel_chips()
    print("done", hud)


if __name__ == "__main__":
    main()
