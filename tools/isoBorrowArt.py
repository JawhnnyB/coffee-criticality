#!/usr/bin/env python3
"""Three-plane 3/4 props + dimetric teaching plates + 2:1 site map. No Imagine."""
from PIL import Image, ImageDraw
from pathlib import Path

P = Path("/workspace/public/art/gen/props")
S = Path("/workspace/public/art/gen/stills")
U = Path("/workspace/public/art/gen/ui")
T = Path("/workspace/public/art/gen/tiles")
Q = Path("/workspace/artifacts/iso_borrow")
Q.mkdir(parents=True, exist_ok=True)

INK = (22, 17, 13, 255)
CREAM = (243, 230, 208, 255)
COPPER = (196, 120, 58, 255)
LEAF = (107, 143, 113, 255)
STEEL = (61, 92, 102, 255)
GOLD = (201, 162, 39, 255)
WOOD = (106, 74, 50, 255)
WOODL = (150, 108, 74, 255)
WOODD = (58, 40, 24, 255)
WOODM = (88, 62, 42, 255)
SKIN = (232, 196, 160, 255)
CHER = (70, 150, 190, 255)
CHER2 = (40, 90, 140, 255)
STEELL = (92, 128, 138, 255)
STEELD = (36, 56, 64, 255)


def px(im, x, y, c):
    if 0 <= x < im.width and 0 <= y < im.height:
        im.putpixel((x, y), c)


def rect(d, box, fill, outline=None):
    d.rectangle(box, fill=fill, outline=outline)


def cube(d, x, y, w, h, top, left, right, ink=INK):
    """Orthographic 3/4 box: top strip, left plane, right/south plane."""
    th = max(2, h // 5)
    d.rectangle([x, y, x + w - 1, y + th], fill=top)
    d.rectangle([x, y + th, x + max(2, w // 3), y + h - 1], fill=left)
    d.rectangle([x + max(2, w // 3), y + th, x + w - 1, y + h - 1], fill=right)
    d.rectangle([x, y, x + w - 1, y + h - 1], outline=ink)


def chair():
    im = Image.new("RGBA", (16, 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([3, 1, 12, 11], fill=WOODL, outline=INK)  # back top light
    d.rectangle([4, 2, 8, 10], fill=WOOD)
    d.rectangle([9, 2, 11, 10], fill=WOODD)
    d.rectangle([1, 10, 14, 15], fill=WOODL, outline=INK)  # seat top
    d.rectangle([2, 12, 13, 14], fill=WOOD)
    d.rectangle([3, 15, 5, 23], fill=WOOD)  # left legs mid
    d.rectangle([10, 15, 12, 23], fill=WOODD)  # right dark
    d.rectangle([3, 22, 5, 23], fill=INK)
    d.rectangle([10, 22, 12, 23], fill=INK)
    return im


def bench():
    im = Image.new("RGBA", (48, 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([1, 7, 46, 12], fill=WOODL, outline=INK)  # top
    d.rectangle([2, 12, 18, 16], fill=WOOD)
    d.rectangle([19, 12, 45, 16], fill=WOODD)
    d.rectangle([4, 16, 8, 23], fill=WOOD)
    d.rectangle([39, 16, 43, 23], fill=WOODD)
    d.rectangle([4, 22, 8, 23], fill=INK)
    d.rectangle([39, 22, 43, 23], fill=INK)
    return im


def desk():
    im = Image.new("RGBA", (48, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([1, 10, 46, 16], fill=WOODL, outline=INK)
    d.rectangle([2, 16, 18, 20], fill=WOOD)
    d.rectangle([19, 16, 45, 20], fill=WOODD)
    d.rectangle([4, 20, 10, 31], fill=WOOD)
    d.rectangle([37, 20, 43, 31], fill=WOODD)
    d.rectangle([28, 6, 42, 12], fill=CREAM, outline=INK)
    d.rectangle([8, 7, 16, 12], fill=STEELL, outline=INK)
    return im


def cabinet():
    im = Image.new("RGBA", (24, 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([2, 2, 21, 5], fill=STEELL)  # top
    d.rectangle([2, 5, 10, 38], fill=STEEL)  # left
    d.rectangle([11, 5, 21, 38], fill=STEELD)  # right
    d.rectangle([2, 2, 21, 38], outline=INK)
    d.line([11, 5, 11, 38], fill=INK)
    d.rectangle([16, 18, 19, 22], fill=COPPER)  # handle
    d.rectangle([4, 8, 9, 10], fill=STEELD)
    d.rectangle([4, 14, 9, 16], fill=STEELD)
    return im


def door():
    im = Image.new("RGBA", (16, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([1, 0, 14, 3], fill=WOODL)  # top rail
    d.rectangle([1, 3, 7, 31], fill=WOOD)
    d.rectangle([8, 3, 14, 31], fill=WOODD)
    d.rectangle([1, 0, 14, 31], outline=INK)
    d.rectangle([3, 5, 6, 13], fill=WOODM, outline=INK)
    d.rectangle([9, 5, 12, 13], fill=WOODD, outline=INK)
    d.rectangle([3, 17, 6, 26], fill=WOODM, outline=INK)
    d.rectangle([9, 17, 12, 26], fill=WOODD, outline=INK)
    d.rectangle([11, 15, 13, 18], fill=COPPER)
    px(im, 12, 16, GOLD)
    return im


def plant():
    im = Image.new("RGBA", (16, 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([4, 16, 11, 18], fill=COPPER)  # pot rim light
    d.rectangle([4, 18, 7, 23], fill=(160, 96, 48, 255))
    d.rectangle([8, 18, 11, 23], fill=(90, 50, 24, 255))
    d.rectangle([4, 16, 11, 23], outline=INK)
    d.ellipse([2, 4, 10, 16], fill=LEAF)
    d.ellipse([7, 2, 14, 14], fill=(90, 130, 96, 255))
    d.ellipse([5, 8, 12, 18], fill=(58, 92, 64, 255))
    px(im, 6, 8, CREAM)
    return im


def van():
    im = Image.new("RGBA", (96, 48), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([10, 42, 86, 46], fill=(22, 17, 13, 70))
    # roof (top plane)
    d.rectangle([14, 10, 82, 16], fill=STEELL)
    # left/front body
    d.rectangle([8, 16, 40, 38], fill=STEEL)
    # right/rear body darker
    d.rectangle([40, 16, 88, 38], fill=STEELD)
    d.rectangle([8, 16, 88, 38], outline=INK)
    d.rectangle([14, 10, 82, 16], outline=INK)
    d.line([14, 16, 8, 16], fill=INK)
    d.line([82, 16, 88, 16], fill=INK)
    # windows
    d.rectangle([14, 18, 28, 28], fill=(28, 40, 48, 255), outline=INK)
    d.rectangle([32, 18, 50, 28], fill=(28, 40, 48, 255), outline=INK)
    d.rectangle([54, 18, 70, 28], fill=(24, 34, 42, 255), outline=INK)
    d.rectangle([74, 18, 84, 28], fill=(24, 34, 42, 255), outline=INK)
    d.rectangle([14, 18, 28, 20], fill=CREAM)
    d.rectangle([8, 30, 88, 33], fill=COPPER)
    d.line([52, 16, 52, 38], fill=INK)
    d.rectangle([84, 34, 88, 38], fill=GOLD)
    d.rectangle([8, 34, 12, 38], fill=(180, 70, 50, 255))
    for wx in (16, 68):
        d.ellipse([wx, 34, wx + 14, 47], fill=INK)
        d.ellipse([wx + 3, 37, wx + 11, 45], fill=COPPER)
        d.ellipse([wx + 5, 39, wx + 9, 43], fill=WOODD)
    return im


def pip():
    im = Image.new("RGBA", (8, 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([0, 0, 7, 7], fill=GOLD, outline=INK)
    d.ellipse([2, 2, 5, 5], fill=COPPER)
    return im


# --- dimetric 2:1 helpers for plates ---
def iso(mx, my, mz=0, ox=0, oy=0):
    return int((mx - my) + ox), int((mx + my) * 0.5 - mz + oy)


def iso_box(d, mx, my, mz, w, dep, h, top, left, right, ox, oy, ink=INK):
    # 8 corners of a box in map space
    def p(dx, dy, dz):
        return iso(mx + dx, my + dy, mz + dz, ox, oy)

    # top face diamond
    t0 = p(0, 0, h)
    t1 = p(w, 0, h)
    t2 = p(w, dep, h)
    t3 = p(0, dep, h)
    d.polygon([t0, t1, t2, t3], fill=top, outline=ink)
    # left (south-west) face
    b0 = p(0, 0, 0)
    b3 = p(0, dep, 0)
    d.polygon([t0, t3, b3, b0], fill=left, outline=ink)
    # right (south-east) face
    b1 = p(w, 0, 0)
    b2 = p(w, dep, 0)
    d.polygon([t1, t2, b2, b1], fill=right, outline=ink)


def plate_card():
    im = Image.new("RGBA", (320, 180), CREAM)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 319, 179], outline=INK)
    d.rectangle([2, 2, 317, 177], outline=WOOD)
    return im, d


def plate_pwr():
    im, d = plate_card()
    ox, oy = 160, 150
    iso_box(d, 0, 0, 0, 36, 28, 90, STEELL, STEEL, STEELD, ox, oy)
    # core window
    a = iso(10, 8, 40, ox, oy)
    b = iso(26, 8, 40, ox, oy)
    c = iso(26, 20, 16, ox, oy)
    e = iso(10, 20, 16, ox, oy)
    d.polygon([a, b, c, e], fill=CHER2)
    d.polygon([a, b, c, e], outline=CHER)
    # inlet left (cold)
    iso_box(d, -18, 8, 50, 18, 8, 8, (180, 210, 220, 255), (120, 160, 180, 255), STEEL, ox, oy)
    # outlet right (hot)
    iso_box(d, 36, 8, 70, 18, 8, 8, COPPER, (180, 90, 40, 255), WOODD, ox, oy)
    return im


def plate_bwr():
    im, d = plate_card()
    ox, oy = 160, 150
    iso_box(d, 0, 0, 0, 36, 28, 70, STEELL, STEEL, STEELD, ox, oy)
    iso_box(d, -4, -4, 70, 44, 36, 28, STEELL, STEEL, STEELD, ox, oy)  # steam dome
    a = iso(10, 8, 36, ox, oy)
    b = iso(26, 8, 36, ox, oy)
    c = iso(26, 20, 12, ox, oy)
    e = iso(10, 20, 12, ox, oy)
    d.polygon([a, b, c, e], fill=CHER2, outline=CHER)
    # steam wisps
    for i, (sx, sy) in enumerate([(148, 28), (160, 18), (172, 26)]):
        d.ellipse([sx, sy, sx + 6, sy + 8], outline=STEELL)
    iso_box(d, -16, 8, 40, 16, 8, 8, (180, 210, 220, 255), (120, 160, 180, 255), STEEL, ox, oy)
    iso_box(d, 36, 8, 88, 16, 8, 6, CREAM, STEELL, STEEL, ox, oy)
    return im


def plate_pebble():
    im, d = plate_card()
    ox, oy = 160, 150
    iso_box(d, 0, 0, 0, 40, 32, 80, STEELL, STEEL, STEELD, ox, oy)
    # marbles on the top face only — no pipes
    for i in range(6):
        for j in range(5):
            p = iso(6 + i * 5, 5 + j * 5, 80, ox, oy)
            col = GOLD if (i + j) % 2 == 0 else COPPER
            d.ellipse([p[0] - 3, p[1] - 2, p[0] + 3, p[1] + 2], fill=col, outline=INK)
    return im


def plate_msr():
    im, d = plate_card()
    ox, oy = 160, 145
    iso_box(d, 4, 4, 0, 40, 32, 20, STEELL, STEEL, STEELD, ox, oy)
    # graphite ring as 2:1 torus-ish
    c = iso(24, 20, 36, ox, oy)
    d.ellipse([c[0] - 40, c[1] - 20, c[0] + 40, c[1] + 20], outline=INK, fill=WOODM)
    d.ellipse([c[0] - 22, c[1] - 11, c[0] + 22, c[1] + 11], fill=CHER2, outline=CHER)
    iso_box(d, -16, 16, 24, 16, 8, 8, GOLD, COPPER, WOODD, ox, oy)
    iso_box(d, 44, 16, 24, 16, 8, 8, GOLD, COPPER, WOODD, ox, oy)
    return im


def plate_rod():
    im, d = plate_card()
    ox, oy = 160, 155
    iso_box(d, 0, 0, 0, 8, 8, 110, STEELL, STEEL, STEELD, ox, oy)
    a = iso(2, 2, 80, ox, oy)
    b = iso(6, 2, 80, ox, oy)
    c = iso(6, 6, 20, ox, oy)
    e = iso(2, 6, 20, ox, oy)
    d.polygon([a, b, c, e], fill=CHER, outline=CHER2)
    return im


def plate_assembly():
    im, d = plate_card()
    ox, oy = 120, 150
    # water tank
    iso_box(d, 0, 0, 0, 70, 24, 90, (160, 190, 200, 255), CHER2, STEELD, ox, oy)
    for i in range(5):
        iso_box(d, 8 + i * 11, 6, 8, 6, 6, 70, STEELL, STEEL, STEELD, ox, oy)
        glow = iso(11 + i * 11, 9, 40, ox, oy)
        d.point(glow, fill=CHER)
    # bubbles
    for bx, by in ((200, 80), (210, 60), (188, 50), (220, 90), (196, 70)):
        d.ellipse([bx, by, bx + 4, by + 4], outline=CREAM)
    return im


def plate_core():
    im, d = plate_card()
    cx, cy = 160, 96
    # 2:1 disc (ellipse)
    d.ellipse([cx - 90, cy - 45, cx + 90, cy + 45], fill=STEELD, outline=INK)
    d.ellipse([cx - 78, cy - 39, cx + 78, cy + 39], fill=CHER2, outline=CHER)
    d.ellipse([cx - 40, cy - 20, cx + 40, cy + 20], fill=CHER)
    d.ellipse([cx - 16, cy - 8, cx + 16, cy + 8], fill=GOLD)
    # hex suggestion
    for i in range(6):
        ang = i * 60
        # skip trig; mark rings
        pass
    return im


# site iso 160x90
# sx = (mx - my) + 40
# sy = (mx + my) * 0.5 + 10
FOOT = {
    "cafe": (2, 10, COPPER, "Cafe"),
    "parlor": (2, 24, COPPER, "Parlor"),
    "gate": (23, 10, (42, 40, 38, 255), "Lot"),
    "corridor": (42, 12, STEEL, "Hall"),
    "control": (46, 0, (106, 90, 48, 255), "Ctrl"),
    "engineering": (46, 25, WOOD, "Eng"),
    "breakroom": (67, 12, WOODL, "Break"),
    "reactor": (69, 0, LEAF, "Rx"),
    "maintenance": (70, 25, (90, 86, 80, 255), "Maint"),
}


def site_iso():
    im = Image.new("RGBA", (160, 90), (18, 16, 14, 255))
    d = ImageDraw.Draw(im)
    ox, oy = 40, 12

    def ip(mx, my, mz=0):
        return iso(mx, my, mz, ox, oy)

    # lake west of cafe
    lake = ip(-10, 8, 0)
    d.ellipse([lake[0] - 16, lake[1] - 6, lake[0] + 18, lake[1] + 8], fill=(45, 80, 90, 255), outline=INK)
    # asphalt lot under gate
    iso_box(d, 18, 8, 0, 16, 10, 2, (50, 48, 44, 255), (36, 34, 32, 255), (28, 26, 24, 255), ox, oy)
    for key, (mx, my, col, _lab) in FOOT.items():
        top = col if len(col) == 4 else (*col, 255)
        left = tuple(max(0, c - 30) if i < 3 else c for i, c in enumerate(top))
        right = tuple(max(0, c - 55) if i < 3 else c for i, c in enumerate(top))
        w, dep, h = (12, 8, 10) if key != "gate" else (14, 10, 4)
        iso_box(d, mx, my, 0, w, dep, h, top, left, right, ox, oy)
    d.rectangle([0, 0, 159, 89], outline=INK)
    return im


def light_qc():
    floor = Image.open(T / "wood_floor.png").convert("RGBA")
    canvas = Image.new("RGBA", (160, 80), (0, 0, 0, 0))
    for y in range(0, 80, 16):
        for x in range(0, 160, 16):
            canvas.paste(floor.crop((0, 0, 16, 16)), (x, y))
    kettle = Image.open(P / "kettle.png").convert("RGBA")
    ch = Image.open(P / "chair.png")
    vn = Image.open(P / "van.png")
    player = Image.open("/workspace/public/art/gen/sprites/player_idle_32.png").convert("RGBA")
    canvas.paste(vn, (8, 80 - 48), vn)
    canvas.paste(ch, (110, 80 - 24), ch)
    canvas.paste(kettle, (128, 80 - 16), kettle)
    canvas.paste(player, (64, 80 - 48), player)
    big = canvas.resize((640, 320), Image.Resampling.NEAREST)
    big.save(Q / "light_qc.png")
    canvas.save(Q / "light_qc_1x.png")


def main():
    chair().save(P / "chair.png")
    bench().save(P / "bench.png")
    desk().save(P / "desk.png")
    cabinet().save(P / "cabinet.png")
    door().save(P / "door.png")
    plant().save(P / "plant.png")
    van().save(P / "van.png")
    pip().save(U / "pip.png")
    plate_pwr().save(S / "plate_pwr.png")
    plate_bwr().save(S / "plate_bwr.png")
    plate_pebble().save(S / "plate_pebble.png")
    plate_msr().save(S / "plate_msr.png")
    plate_rod().save(S / "plate_rod.png")
    plate_assembly().save(S / "plate_assembly.png")
    plate_core().save(S / "plate_core.png")
    site_iso().save(U / "site_iso.png")
    light_qc()
    print("iso borrow art ok")
    for p in [P / "van.png", P / "chair.png", U / "site_iso.png", S / "plate_pwr.png", U / "pip.png"]:
        im = Image.open(p)
        print(p.name, im.size, im.mode)


if __name__ == "__main__":
    main()
