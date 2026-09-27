#!/usr/bin/env python3
"""160×90 teaching plates. No letters. Copy lives in nuclearLab.ts."""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path("/workspace/public/art/gen/stills")
C = {
    "cream": (243, 230, 208, 255),
    "ink": (22, 17, 13, 255),
    "copper": (196, 120, 58, 255),
    "leaf": (107, 143, 113, 255),
    "steel": (61, 92, 102, 255),
    "gold": (201, 162, 39, 255),
    "wood": (106, 74, 50, 255),
    "blue": (80, 160, 190, 255),
    "skin": (232, 196, 160, 255),
    "paper": (236, 220, 196, 255),
}


def canvas():
    im = Image.new("RGBA", (160, 90), C["paper"])
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 159, 89], outline=C["ink"])
    return im, d


def save(im, name):
    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / f"term_{name}.png"
    im.save(p)
    print("plate", p.name)


def plate_D():
    im, d = canvas()
    # crowded room: dots, arrows out from a packed corner
    for i in range(8):
        d.ellipse([12 + i * 6, 50 - i, 16 + i * 6, 54 - i], fill=C["gold"])
    d.ellipse([28, 28, 36, 36], fill=C["blue"])
    d.line([(36, 32), (120, 22)], fill=C["ink"], width=2)
    d.line([(36, 32), (110, 48)], fill=C["ink"], width=2)
    d.line([(36, 32), (90, 70)], fill=C["steel"], width=2)
    d.polygon([(120, 22), (112, 18), (112, 26)], fill=C["ink"])
    save(im, "D")


def plate_lap():
    im, d = canvas()
    # flux hill cosine
    pts = []
    for x in range(16, 144):
        y = 70 - int(38 * (1 + __import__("math").cos((x - 80) / 28)))
        pts.append((x, y))
    d.line(pts, fill=C["gold"], width=2)
    d.line([(16, 78), (144, 78)], fill=C["steel"], width=2)
    d.rectangle([14, 76, 18, 82], fill=C["copper"])
    d.rectangle([142, 76, 146, 82], fill=C["copper"])
    save(im, "lap")


def plate_sa():
    im, d = canvas()
    # neutron into a nucleus
    d.ellipse([88, 28, 128, 68], outline=C["copper"], fill=C["steel"])
    d.ellipse([100, 40, 116, 56], fill=C["gold"])
    d.ellipse([30, 40, 42, 52], fill=C["blue"])
    d.line([(42, 46), (88, 48)], fill=C["ink"], width=2)
    d.polygon([(88, 48), (80, 44), (80, 52)], fill=C["ink"])
    save(im, "sa")


def plate_scatter():
    im, d = canvas()
    d.ellipse([20, 18, 36, 34], fill=C["gold"])  # fast
    d.ellipse([70, 38, 82, 50], fill=C["leaf"])  # H
    d.ellipse([118, 58, 128, 68], fill=C["blue"])  # thermal
    d.line([(36, 26), (70, 44)], fill=C["ink"], width=2)
    d.line([(82, 44), (118, 62)], fill=C["ink"], width=2)
    d.arc([60, 20, 100, 60], 200, 340, fill=C["copper"], width=2)
    save(im, "scatter")


def plate_fiss():
    im, d = canvas()
    d.ellipse([68, 30, 92, 54], fill=C["copper"])
    d.ellipse([40, 18, 52, 30], fill=C["gold"])
    d.ellipse([108, 18, 120, 30], fill=C["gold"])
    d.ellipse([44, 62, 56, 74], fill=C["gold"])
    d.ellipse([104, 62, 116, 74], fill=C["gold"])
    d.line([(80, 42), (46, 24)], fill=C["ink"], width=1)
    d.line([(80, 42), (114, 24)], fill=C["ink"], width=1)
    d.line([(80, 42), (50, 68)], fill=C["ink"], width=1)
    d.line([(80, 42), (110, 68)], fill=C["ink"], width=1)
    save(im, "fiss")


def plate_k():
    im, d = canvas()
    for i, col in enumerate((C["gold"], C["leaf"], C["gold"])):
        x = 22 + i * 46
        d.rectangle([x, 24, x + 28, 66], outline=C["ink"], fill=col)
        d.ellipse([x + 8, 36, x + 20, 48], fill=C["blue"])
    d.polygon([(50, 44), (66, 40), (66, 48)], fill=C["ink"])
    d.polygon([(96, 44), (112, 40), (112, 48)], fill=C["ink"])
    save(im, "k")


def plate_b2():
    im, d = canvas()
    d.ellipse([40, 14, 120, 78], outline=C["steel"], width=3)
    d.ellipse([58, 26, 102, 66], outline=C["gold"], width=2)
    d.ellipse([74, 40, 86, 52], fill=C["gold"])
    save(im, "b2")


def plate_pnl():
    im, d = canvas()
    d.rectangle([24, 18, 100, 74], outline=C["steel"], width=2)
    for i in range(5):
        d.ellipse([34 + i * 10, 36, 42 + i * 10, 44], fill=C["gold"])
    d.ellipse([118, 34, 130, 46], fill=C["blue"])
    d.line([(100, 40), (118, 40)], fill=C["ink"], width=2)
    save(im, "pnl")


def plate_kinf():
    im, d = canvas()
    for r in range(3):
        for c in range(5):
            x, y = 18 + c * 28, 16 + r * 24
            d.rectangle([x, y, x + 22, y + 20], outline=C["steel"], fill=C["cream"])
            d.ellipse([x + 7, y + 5, x + 15, y + 13], fill=C["copper"])
    save(im, "kinf")


def plate_fq():
    im, d = canvas()
    heights = [18, 28, 48, 34, 22, 16]
    for i, h in enumerate(heights):
        x = 18 + i * 24
        col = C["gold"] if h == 48 else C["leaf"]
        d.rectangle([x, 78 - h, x + 18, 78], fill=col, outline=C["ink"])
    save(im, "fq")


def plate_pellet():
    im, d = canvas()
    d.rectangle([70, 12, 90, 78], fill=C["copper"], outline=C["ink"])
    for y in range(16, 74, 10):
        d.rectangle([72, y, 88, y + 8], fill=C["gold"], outline=C["ink"])
    save(im, "pellet")


def plate_clad():
    im, d = canvas()
    d.rectangle([64, 10, 96, 80], fill=C["steel"], outline=C["ink"])
    d.rectangle([70, 16, 90, 74], fill=C["copper"], outline=C["ink"])
    d.ellipse([74, 8, 86, 18], fill=C["cream"])
    save(im, "clad")


def plate_mod():
    im, d = canvas()
    d.rectangle([20, 20, 140, 72], fill=C["blue"])
    for c in range(4):
        x = 36 + c * 26
        d.rectangle([x, 28, x + 12, 64], fill=C["copper"], outline=C["ink"])
    save(im, "mod")


def plate_cool():
    im, d = canvas()
    d.ellipse([48, 16, 112, 74], outline=C["steel"], width=3)
    d.rectangle([20, 36, 48, 48], fill=C["blue"])
    d.rectangle([112, 36, 140, 48], fill=C["copper"])
    d.polygon([(48, 42), (40, 38), (40, 46)], fill=C["ink"])
    d.polygon([(140, 42), (132, 38), (132, 46)], fill=C["ink"])
    save(im, "cool")


def plate_vessel():
    im, d = canvas()
    d.ellipse([50, 8, 110, 82], outline=C["steel"], width=4)
    d.ellipse([62, 22, 98, 68], fill=C["blue"])
    for x in (70, 78, 86):
        d.rectangle([x, 30, x + 4, 60], fill=C["gold"])
    save(im, "vessel")


def plate_refl():
    im, d = canvas()
    d.rectangle([24, 16, 136, 74], fill=C["leaf"], outline=C["ink"])
    d.ellipse([52, 24, 108, 66], fill=C["steel"], outline=C["ink"])
    d.ellipse([64, 34, 96, 56], fill=C["blue"])
    save(im, "refl")


def plate_delay():
    im, d = canvas()
    d.ellipse([30, 30, 48, 48], fill=C["gold"])
    d.line([(48, 39), (70, 39)], fill=C["ink"], width=2)
    d.ellipse([70, 30, 88, 48], fill=C["copper"])
    d.line([(88, 28), (110, 16)], fill=C["gold"], width=2)
    d.line([(88, 50), (118, 66)], fill=C["leaf"], width=2)
    d.ellipse([108, 10, 118, 20], fill=C["gold"])
    d.ellipse([116, 60, 126, 70], fill=C["leaf"])
    save(im, "delay")


def main():
    plate_D()
    plate_lap()
    plate_sa()
    plate_scatter()
    plate_fiss()
    plate_k()
    plate_b2()
    plate_pnl()
    plate_kinf()
    plate_fq()
    plate_pellet()
    plate_clad()
    plate_mod()
    plate_cool()
    plate_vessel()
    plate_refl()
    plate_delay()


if __name__ == "__main__":
    main()
