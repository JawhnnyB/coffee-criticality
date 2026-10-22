"""Bake public/art/gen/ui/site_plan.png from the gate room in src/game/content.ts.

160×90, no letters. The pause labels are HTML, positioned from the same rects.
Run from the repo root: python3 scripts/bake-site-plan.py
"""
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
src = (ROOT / "src/game/content.ts").read_text()
gate = src.split('id: "gate"', 1)[1].split('id: "corridor"', 1)[0]

COLS, ROWS = 96, 40
PW, PH = 160, 90

INK = (22, 17, 13, 255)
GRASS = (53, 80, 60, 255)
GRASS_B = (61, 92, 68, 255)
WATER = (44, 74, 86, 255)
WATER_B = (130, 168, 176, 255)
ASPHALT = (42, 41, 38, 255)
CURB = (106, 100, 92, 255)
STRIPE = (201, 162, 39, 255)
ROOF = {
    "Cafe": (196, 120, 58, 255),
    "Arcade": (138, 74, 40, 255),
    "Hall": (61, 92, 102, 255),
    "Control": (201, 162, 39, 255),
    "Eng": (106, 74, 50, 255),
    "Break": (196, 168, 130, 255),
    "Core": (107, 143, 113, 255),
    "Maint": (42, 68, 80, 255),
}
STACK = (74, 90, 72, 255)
VAN = (61, 92, 102, 255)
VAN_TRIM = (196, 120, 58, 255)


def tiles(blob: str):
    out = []
    for m in re.finditer(r"t\(([^)]+)\)\s*,\s*kind:\s*\"(\w+)\"(?:\s*,\s*label:\s*\"([^\"]+)\")?", blob):
        nums = [float(n) for n in m.group(1).split(",")]
        out.append((nums, m.group(2), m.group(3)))
    return out


def px(c, r):
    return int(c * PW / COLS), int(r * PH / ROWS)


def fill(im, c, r, w, h, color, outline=False):
    x0, y0 = px(c, r)
    x1, y1 = px(c + w, r + h)
    x1 = max(x1, x0 + 1)
    y1 = max(y1, y0 + 1)
    for y in range(y0, min(PH, y1)):
        for x in range(x0, min(PW, x1)):
            edge = outline and (x == x0 or y == y0 or x == x1 - 1 or y == y1 - 1)
            im.putpixel((x, y), INK if edge else color)


im = Image.new("RGBA", (PW, PH), GRASS)
pix = im.load()
for y in range(PH):
    for x in range(PW):
        if (x + y) % 7 == 0:
            pix[x, y] = GRASS_B

# The gate literal stores floor patches before props. Split on the props key.
floor, props = gate.split("props:", 1)
for nums, kind, _label in tiles(floor):
    color = {"water": WATER, "asphalt": ASPHALT, "curb": CURB, "stripe": STRIPE}.get(kind)
    if color:
        fill(im, *nums, color)
# One lighter ripple across the lake so it is not a flat bar.
for nums, kind, _label in tiles(floor):
    if kind == "water":
        c, r, w, h = nums
        fill(im, c, r + h - 0.4, w, 0.35, WATER_B)

for nums, kind, label in tiles(props):
    if kind == "roof" and label in ROOF:
        fill(im, *nums, ROOF[label], outline=True)
    elif kind == "stack":
        fill(im, *nums, STACK, outline=True)
    elif kind == "van":
        fill(im, *nums, VAN, outline=True)
        c, r, w, h = nums
        fill(im, c, r + h * 0.7, w, h * 0.25, VAN_TRIM)

out = ROOT / "public/art/gen/ui/site_plan.png"
im.save(out)
print(f"wrote {out} {im.size}")
