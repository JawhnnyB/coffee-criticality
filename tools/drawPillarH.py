#!/usr/bin/env python3
"""Pillar H teaching plates. No letters. Copy lives in content.ts / nuclearLab.ts."""
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
    "paper": (236, 220, 196, 255),
    "dark": (42, 34, 28, 255),
    "shine": (180, 210, 220, 255),
}


def canvas(w=160, h=90):
    im = Image.new("RGBA", (w, h), C["paper"])
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w - 1, h - 1], outline=C["ink"])
    return im, d


def save(im, name):
    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / f"{name}.png"
    im.save(p)
    big = im.resize((im.width * 2, im.height * 2), Image.NEAREST)
    big.save(OUT / f"{name}@2x.png")
    print("plate", p.name, im.size)


def plate_barriers():
    """Four nested fission-product barriers. No letters."""
    im, d = canvas()
    # containment
    d.rounded_rectangle([8, 8, 152, 82], radius=8, outline=C["ink"], width=2, fill=(220, 208, 188, 255))
    # RCS / vessel
    d.rounded_rectangle([28, 16, 132, 74], radius=6, outline=C["steel"], width=3, fill=(180, 196, 200, 255))
    # clad
    d.rectangle([64, 22, 96, 68], outline=C["steel"], width=2, fill=C["steel"])
    # pellet stack
    d.rectangle([70, 26, 90, 64], fill=C["copper"], outline=C["ink"])
    for y in range(28, 62, 8):
        d.rectangle([72, y, 88, y + 6], fill=C["gold"], outline=C["ink"])
    save(im, "plate_barriers")


def plate_star():
    """Two people looking at a board. Catch, not heroics."""
    im, d = canvas()
    d.rectangle([18, 14, 78, 50], fill=C["dark"], outline=C["ink"])
    d.rectangle([22, 18, 48, 36], fill=C["leaf"])
    d.rectangle([50, 18, 74, 28], fill=C["gold"])
    d.rectangle([50, 30, 74, 46], fill=C["copper"])
    # two figures, 3/4, peach/tan faces, looking at board
    def person(x, hoodie, skin):
        d.ellipse([x, 48, x + 12, 60], fill=skin, outline=C["ink"])
        d.rectangle([x + 1, 60, x + 11, 78], fill=hoodie, outline=C["ink"])
        d.point((x + 4, 54), fill=C["ink"])
        d.point((x + 8, 54), fill=C["ink"])
    person(88, C["copper"], (232, 196, 160, 255))
    person(112, C["leaf"], (196, 150, 110, 255))
    save(im, "plate_star")


def plate_comms():
    """Send / repeat-back as two loops. No letters."""
    im, d = canvas()
    d.ellipse([18, 28, 48, 58], outline=C["ink"], fill=C["copper"])
    d.ellipse([112, 28, 142, 58], outline=C["ink"], fill=C["leaf"])
    d.point((30, 40), fill=C["ink"])
    d.point((36, 40), fill=C["ink"])
    d.point((124, 40), fill=C["ink"])
    d.point((130, 40), fill=C["ink"])
    # arrows both ways
    d.arc([40, 14, 120, 44], 200, 340, fill=C["gold"], width=2)
    d.polygon([(118, 18), (112, 14), (112, 24)], fill=C["gold"])
    d.arc([40, 46, 120, 76], 20, 160, fill=C["steel"], width=2)
    d.polygon([(42, 70), (48, 66), (48, 76)], fill=C["steel"])
    save(im, "plate_comms")


def plate_delayed():
    """Prompt burst now / delayed trickle later."""
    im, d = canvas()
    # split
    d.line([(80, 8), (80, 82)], fill=C["wood"], width=1)
    # now: pellet splits
    d.ellipse([28, 30, 52, 54], fill=C["copper"], outline=C["ink"])
    for dx, dy in ((-16, -12), (18, -10), (-10, 18), (16, 16), (0, -20), (22, 4)):
        d.ellipse([38 + dx, 40 + dy, 44 + dx, 46 + dy], fill=C["gold"])
    # later: one extra neutron after a wait arc
    d.ellipse([108, 34, 128, 54], fill=C["steel"], outline=C["ink"])
    d.arc([100, 26, 136, 62], 220, 80, fill=C["leaf"], width=2)
    d.ellipse([130, 22, 138, 30], fill=C["leaf"], outline=C["ink"])
    save(im, "plate_delayed")


def plate_period():
    """Gentle delayed period vs steep prompt cliff. No numbers."""
    im, d = canvas()
    d.line([(16, 74), (144, 74)], fill=C["steel"], width=2)
    # delayed: slow rise
    pts = []
    for x in range(16, 100):
        y = 70 - int((x - 16) * 0.22)
        pts.append((x, y))
    d.line(pts, fill=C["leaf"], width=2)
    # prompt cliff (do not live here)
    d.line([(100, 52), (140, 16)], fill=C["copper"], width=2)
    d.polygon([(140, 16), (132, 16), (136, 24)], fill=C["copper"])
    save(im, "plate_period")


def plate_six():
    """k∞ cell inside two leakage rings."""
    im, d = canvas()
    d.ellipse([14, 8, 146, 82], outline=C["steel"], width=3)
    d.ellipse([32, 16, 128, 74], outline=C["leaf"], width=2)
    # 2x2 lattice = four factors of k∞
    cols = [C["gold"], C["copper"], C["leaf"], C["blue"]]
    for i, col in enumerate(cols):
        x = 58 + (i % 2) * 22
        y = 30 + (i // 2) * 22
        d.rectangle([x, y, x + 18, y + 18], fill=col, outline=C["ink"])
        d.ellipse([x + 5, y + 5, x + 13, y + 13], fill=C["cream"])
    save(im, "plate_six")


def plate_doppler():
    """Hot pellet, fat resonances. Cool pellet, thin."""
    im, d = canvas()
    # cool rod
    d.rectangle([22, 14, 48, 76], fill=C["steel"], outline=C["ink"])
    d.rectangle([28, 20, 42, 70], fill=C["copper"])
    for y in (28, 40, 52, 64):
        d.rectangle([18, y, 52, y + 2], fill=C["gold"])
    # hot rod
    d.rectangle([104, 14, 140, 76], fill=(90, 50, 36, 255), outline=C["ink"])
    d.rectangle([112, 20, 132, 70], fill=(210, 90, 40, 255))
    for y, h in ((24, 8), (38, 10), (52, 8), (66, 6)):
        d.rectangle([98, y, 146, y + h], fill=(201, 162, 39, 180))
    save(im, "plate_doppler")


def plate_xenon():
    """Lattice with a poison cloud over the middle after a trip."""
    im, d = canvas()
    for r in range(3):
        for c in range(6):
            x, y = 14 + c * 22, 14 + r * 22
            d.rectangle([x, y, x + 18, y + 18], outline=C["steel"], fill=C["cream"])
            d.ellipse([x + 5, y + 5, x + 13, y + 13], fill=C["copper"])
    d.ellipse([48, 18, 112, 64], fill=(42, 34, 28, 140))
    save(im, "plate_xenon")


def plate_reactivity():
    """Rods in, rods out — two banks. Teaching silhouette."""
    im, d = canvas()
    d.rectangle([20, 48, 140, 78], fill=C["steel"], outline=C["ink"])
    for i in range(5):
        x = 30 + i * 22
        # inserted vs withdrawn
        top = 16 if i in (1, 3) else 36
        d.rectangle([x, top, x + 10, 48], fill=C["leaf"] if i in (1, 3) else C["gold"], outline=C["ink"])
    save(im, "plate_reactivity")


def plate_lototo():
    """Lock and tag on a valve. No letters."""
    im, d = canvas()
    d.rectangle([12, 40, 148, 56], fill=C["steel"], outline=C["ink"])
    d.ellipse([64, 18, 96, 50], outline=C["copper"], width=3, fill=C["dark"])
    d.line([(80, 18), (80, 50)], fill=C["copper"], width=2)
    d.line([(64, 34), (96, 34)], fill=C["copper"], width=2)
    d.rectangle([108, 50, 124, 70], fill=C["gold"], outline=C["ink"])
    d.arc([110, 40, 122, 56], 0, 180, fill=C["ink"], width=2)
    d.polygon([(128, 52), (148, 52), (148, 78), (138, 82), (128, 78)], fill=C["cream"], outline=C["ink"])
    d.line([(124, 58), (128, 58)], fill=C["ink"], width=1)
    save(im, "plate_lototo")


def plate_verify():
    """Two meters, same needle. Independent eyes. No letters."""
    im, d = canvas()

    def meter(x, col):
        d.rounded_rectangle([x, 16, x + 56, 74], radius=4, outline=C["ink"], fill=C["dark"])
        d.ellipse([x + 8, 22, x + 48, 62], outline=col, width=2)
        d.line([(x + 28, 42), (x + 40, 28)], fill=C["gold"], width=2)
        d.ellipse([x + 26, 40, x + 30, 44], fill=C["cream"])

    meter(20, C["leaf"])
    meter(84, C["copper"])
    save(im, "plate_verify")


def plate_stop():
    """Person stepping back from a switch. Stop when unsure. No letters."""
    im, d = canvas()
    d.rectangle([18, 14, 70, 56], fill=C["dark"], outline=C["ink"])
    d.rectangle([28, 24, 44, 36], fill=C["copper"])
    d.rectangle([48, 24, 60, 46], fill=C["gold"])
    d.ellipse([104, 36, 120, 52], fill=(232, 196, 160, 255), outline=C["ink"])
    d.point((108, 42), fill=C["ink"])
    d.point((114, 42), fill=C["ink"])
    d.rectangle([106, 52, 118, 78], fill=C["leaf"], outline=C["ink"])
    d.line([(76, 40), (98, 48)], fill=C["wood"], width=1)
    save(im, "plate_stop")


if __name__ == "__main__":
    plate_barriers()
    plate_star()
    plate_comms()
    plate_delayed()
    plate_period()
    plate_six()
    plate_doppler()
    plate_xenon()
    plate_reactivity()
    plate_lototo()
    plate_verify()
    plate_stop()
