#!/usr/bin/env python3
"""Teaching cutaways for PWR / BWR / pebble / MSR. No license. Palette only."""
from pathlib import Path
from PIL import Image, ImageDraw

STILL = Path("/workspace/public/art/gen/stills")
UI = Path("/workspace/public/art/gen/ui")

C = {
    "paper": (236, 220, 196, 255),
    "cream": (243, 230, 208, 255),
    "ink": (22, 17, 13, 255),
    "copper": (196, 120, 58, 255),
    "leaf": (107, 143, 113, 255),
    "steel": (61, 92, 102, 255),
    "gold": (201, 162, 39, 255),
    "wood": (106, 74, 50, 255),
    "cold": (90, 140, 160, 255),
    "hot": (196, 110, 58, 255),
    "steam": (214, 224, 230, 255),
    "graph": (52, 50, 48, 255),
    "he": (168, 196, 204, 255),
    "salt": (201, 162, 39, 255),
    "dark": (28, 24, 20, 255),
    "vessel": (74, 90, 96, 255),
    "fuel": (168, 92, 40, 255),
}


def canvas(w=320, h=180):
    im = Image.new("RGBA", (w, h), C["paper"])
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w - 1, h - 1], outline=C["ink"])
    return im, d


def save_plate(im: Image.Image, name: str):
    STILL.mkdir(parents=True, exist_ok=True)
    UI.mkdir(parents=True, exist_ok=True)
    im.save(STILL / f"{name}.png")
    im.resize((im.width * 2, im.height * 2), Image.NEAREST).save(STILL / f"{name}@2x.png")
    thumb = im.resize((160, 90), Image.NEAREST)
    kind = name.replace("plate_", "")
    thumb.save(UI / f"builder_{kind}.png")
    thumb.save(STILL / f"thumb_{kind}.png")
    print("plate", name, im.size)


def pwr():
    """PWR: CRDM on top, downcomer, core, SG U-tubes, pump, pressurizer."""
    im, d = canvas()
    # vessel
    d.rounded_rectangle([28, 18, 118, 168], radius=18, fill=C["vessel"], outline=C["ink"], width=2)
    # CRDMs
    for x in range(46, 104, 12):
        d.rectangle([x, 8, x + 6, 22], fill=C["steel"], outline=C["ink"])
    # downcomer (cold annulus)
    d.rounded_rectangle([34, 28, 112, 158], radius=14, fill=C["cold"], outline=C["ink"])
    # core barrel
    d.rounded_rectangle([48, 48, 98, 138], radius=4, fill=C["dark"], outline=C["ink"])
    # assemblies
    for i in range(5):
        for j in range(6):
            d.rectangle([54 + i * 8, 56 + j * 12, 60 + i * 8, 66 + j * 12], fill=C["fuel"], outline=C["ink"])
    # upper internals / rods in core
    for x in range(56, 94, 10):
        d.rectangle([x, 36, x + 3, 56], fill=C["leaf"])
    # cold in (left low), hot out (right high)
    d.rectangle([8, 118, 34, 130], fill=C["cold"], outline=C["ink"])
    d.rectangle([112, 42, 148, 54], fill=C["hot"], outline=C["ink"])
    # steam generator
    d.rounded_rectangle([154, 22, 214, 150], radius=10, fill=C["vessel"], outline=C["ink"], width=2)
    # U-tubes
    for x in range(164, 206, 10):
        d.arc([x - 6, 32, x + 6, 88], 0, 180, fill=C["copper"], width=2)
        d.line([x - 5, 88, x - 5, 132], fill=C["copper"], width=2)
        d.line([x + 5, 88, x + 5, 132], fill=C["copper"], width=2)
    d.rectangle([154, 132, 214, 150], fill=C["steam"], outline=C["ink"])
    d.rectangle([176, 8, 192, 22], fill=C["steam"], outline=C["ink"])  # steam out
    # pump
    d.ellipse([232, 118, 272, 158], fill=C["steel"], outline=C["ink"], width=2)
    d.ellipse([244, 130, 260, 146], fill=C["dark"])
    d.rectangle([214, 124, 232, 136], fill=C["cold"], outline=C["ink"])
    d.rectangle([248, 158, 258, 170], fill=C["cold"], outline=C["ink"])
    d.rectangle([8, 158, 248, 170], fill=C["cold"], outline=C["ink"])  # cold return
    # pressurizer
    d.rounded_rectangle([284, 28, 310, 88], radius=6, fill=C["vessel"], outline=C["ink"])
    d.rectangle([288, 34, 306, 54], fill=C["steam"])
    d.rectangle([288, 54, 306, 82], fill=C["hot"])
    d.rectangle([214, 48, 284, 56], fill=C["hot"], outline=C["ink"])
    save_plate(im, "plate_pwr")


def bwr():
    """BWR: rods from below, jet pumps, separators, dryer, steam to turbine. No SG."""
    im, d = canvas()
    d.rounded_rectangle([70, 10, 190, 170], radius=22, fill=C["vessel"], outline=C["ink"], width=2)
    # steam dryer
    d.rectangle([88, 18, 172, 36], fill=C["steam"], outline=C["ink"])
    for x in range(94, 168, 10):
        d.rectangle([x, 20, x + 5, 34], fill=C["steel"])
    # separators
    for x in range(92, 170, 14):
        d.rectangle([x, 36, x + 8, 70], fill=C["steam"], outline=C["ink"])
        d.rectangle([x + 2, 40, x + 6, 68], fill=C["cold"])
    # two-phase / core
    d.rectangle([92, 70, 168, 128], fill=C["hot"], outline=C["ink"])
    for i in range(6):
        for j in range(4):
            d.rectangle([98 + i * 11, 76 + j * 12, 106 + i * 11, 86 + j * 12], fill=C["fuel"], outline=C["ink"])
    # jet pumps (sides)
    d.rectangle([78, 80, 90, 140], fill=C["cold"], outline=C["ink"])
    d.rectangle([170, 80, 182, 140], fill=C["cold"], outline=C["ink"])
    # liquid below
    d.rectangle([92, 128, 168, 150], fill=C["cold"], outline=C["ink"])
    # CRDMs from BELOW
    for x in range(100, 164, 12):
        d.rectangle([x, 150, x + 6, 174], fill=C["leaf"], outline=C["ink"])
        d.rectangle([x + 1, 128, x + 5, 150], fill=C["leaf"])
    # steam line to turbine
    d.rectangle([190, 16, 248, 28], fill=C["steam"], outline=C["ink"])
    d.rounded_rectangle([248, 12, 304, 70], radius=8, fill=C["dark"], outline=C["ink"])
    d.polygon([(256, 24), (296, 24), (288, 48), (264, 48)], fill=C["steel"], outline=C["ink"])
    d.rectangle([268, 48, 284, 78], fill=C["steel"], outline=C["ink"])
    # condensate hint back
    d.rectangle([268, 78, 284, 150], fill=C["cold"], outline=C["ink"])
    d.rectangle([190, 138, 268, 150], fill=C["cold"], outline=C["ink"])
    save_plate(im, "plate_bwr")


def pebble():
    """Pebble bed: graphite reflector, packed pebbles, He down, charge/discharge, TRISO onion."""
    im, d = canvas()
    d.rounded_rectangle([40, 16, 200, 168], radius=16, fill=C["vessel"], outline=C["ink"], width=2)
    # graphite reflector
    d.rounded_rectangle([52, 28, 188, 156], radius=12, fill=C["graph"], outline=C["ink"])
    # bed
    d.ellipse([72, 44, 168, 140], fill=C["he"], outline=C["ink"])
    pebbles = []
    for row, n in enumerate((5, 6, 7, 6, 5)):
        for i in range(n):
            cx = 120 + (i - (n - 1) / 2) * 14
            cy = 58 + row * 14
            pebbles.append((cx, cy))
    for cx, cy in pebbles:
        d.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=C["copper"], outline=C["ink"])
        d.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=C["gold"])
    # He in top, out bottom
    d.rectangle([110, 8, 130, 28], fill=C["he"], outline=C["ink"])
    d.polygon([(108, 28), (132, 28), (120, 40)], fill=C["he"], outline=C["ink"])
    d.polygon([(108, 148), (132, 148), (120, 162)], fill=C["hot"], outline=C["ink"])
    d.rectangle([110, 162, 130, 174], fill=C["hot"], outline=C["ink"])
    # charge / discharge
    d.rectangle([168, 20, 196, 32], fill=C["copper"], outline=C["ink"])
    d.rectangle([112, 156, 128, 168], fill=C["wood"], outline=C["ink"])
    # TRISO callout — kernel, buffer, IPyC, SiC, OPyC
    d.ellipse([228, 38, 308, 118], fill=C["paper"], outline=C["ink"], width=2)
    rings = [
        (232, 42, 304, 114, (196, 170, 140, 255)),  # OPyC
        (240, 50, 296, 106, C["steel"]),  # SiC
        (248, 58, 288, 98, (196, 170, 140, 255)),  # IPyC
        (256, 66, 280, 90, C["cream"]),  # buffer
        (262, 72, 274, 84, C["gold"]),  # kernel
    ]
    for x0, y0, x1, y1, col in rings:
        d.ellipse([x0, y0, x1, y1], fill=col, outline=C["ink"], width=1)
    d.line([168, 72, 228, 72], fill=C["ink"], width=1)
    save_plate(im, "plate_pebble")


def msr():
    """MSR: graphite channels of fuel salt, pump, HX, freeze plug, drain tank, off-gas."""
    im, d = canvas()
    # core vessel (thin wall — near-atm)
    d.rounded_rectangle([24, 20, 132, 128], radius=8, fill=C["vessel"], outline=C["ink"], width=2)
    # graphite block
    d.rectangle([34, 30, 122, 118], fill=C["graph"], outline=C["ink"])
    # salt channels
    for i in range(6):
        for j in range(6):
            x = 42 + i * 13
            y = 38 + j * 13
            d.ellipse([x, y, x + 8, y + 8], fill=C["salt"], outline=C["ink"])
    # off-gas
    d.rectangle([70, 6, 86, 20], fill=C["steam"], outline=C["ink"])
    d.ellipse([64, 2, 92, 12], fill=C["steam"], outline=C["ink"])
    # salt out to HX
    d.rectangle([132, 40, 168, 50], fill=C["salt"], outline=C["ink"])
    # heat exchanger (primary salt / secondary)
    d.rounded_rectangle([168, 24, 230, 100], radius=6, fill=C["vessel"], outline=C["ink"])
    for y in range(32, 92, 10):
        d.rectangle([176, y, 222, y + 5], fill=C["salt"] if y % 20 == 12 else C["cold"])
    # secondary out (heat leaves)
    d.rectangle([230, 32, 268, 42], fill=C["hot"], outline=C["ink"])
    d.rounded_rectangle([268, 18, 308, 70], radius=6, fill=C["steel"], outline=C["ink"])
    d.rectangle([278, 26, 298, 40], fill=C["steam"])
    # pump
    d.ellipse([168, 108, 204, 144], fill=C["steel"], outline=C["ink"], width=2)
    d.ellipse([178, 118, 194, 134], fill=C["salt"])
    d.rectangle([132, 114, 168, 124], fill=C["salt"], outline=C["ink"])
    d.rectangle([80, 118, 90, 128], fill=C["salt"], outline=C["ink"])
    # freeze plug (gold plug in a steel neck)
    d.rectangle([68, 128, 92, 140], fill=C["steel"], outline=C["ink"])
    d.rectangle([74, 130, 86, 138], fill=C["gold"], outline=C["ink"])
    # drain tank
    d.rounded_rectangle([48, 140, 112, 174], radius=8, fill=C["dark"], outline=C["ink"], width=2)
    d.rectangle([56, 150, 104, 168], fill=C["salt"])
    save_plate(im, "plate_msr")


if __name__ == "__main__":
    pwr()
    bwr()
    pebble()
    msr()
