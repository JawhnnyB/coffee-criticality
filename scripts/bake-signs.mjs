/**
 * Paint the camera-feed words into the photo plates, once.
 * Dark ink is multiplied onto a beveled board. White EXIT is drawn on top.
 * The board is a separate layer, so the photograph around it is not warped.
 * After this, photo frames do not draw marks().
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const py = spawnSync("python3", ["-"], {
  cwd: root,
  input: String.raw`
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
import os
root = ${JSON.stringify(root)}
plates = os.path.join(root, "public/nightwatch/plates")
font_path = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
S = 2

def board_layer(canvas, x, y, w, h, bg, fg, lines, light, shear):
    board = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    pix = board.load()
    for yy in range(h):
        t = yy / max(1, h - 1)
        col = tuple(max(0, min(255, int(bg[c] * (0.76 + 0.30 * (1 - t))))) for c in range(3)) + (255,)
        for xx in range(w):
            pix[xx, yy] = col
    dr = ImageDraw.Draw(board)
    dr.rectangle([0, 0, w - 1, h - 1], outline=(24, 24, 24, 220))
    for sx, sy in ((3, 3), (w - 5, h - 5)):
        dr.ellipse([sx, sy, sx + 2, sy + 2], fill=(40, 40, 40, 255))
    size = max(8, int(h / (len(lines) + 0.7)))
    tmp = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    while size > 7:
        font = ImageFont.truetype(font_path, size)
        if max(tmp.textlength(line, font=font) for line in lines) <= w - 6:
            break
        size -= 1
    font = ImageFont.truetype(font_path, size)
    text = Image.new("L", (w, h), 0)
    td = ImageDraw.Draw(text)
    for i, line in enumerate(lines):
        tw = td.textlength(line, font=font)
        tx = (w - tw) / 2
        ty = (h * (i + 1)) / (len(lines) + 1) - size * 0.7
        td.text((tx, ty), line, font=font, fill=255)
    text = text.filter(ImageFilter.GaussianBlur(0.4))
    if light:
        white = Image.new("RGBA", (w, h), (255, 255, 255, 0))
        wp = white.load()
        tp = text.load()
        for yy in range(h):
            for xx in range(w):
                a = tp[xx, yy]
                if a:
                    wp[xx, yy] = (255, 255, 255, min(255, int(a * 0.95)))
        board.alpha_composite(white)
    else:
        rgb = board.convert("RGB")
        ink = Image.new("RGB", (w, h), tuple(fg))
        white = Image.new("RGB", (w, h), (255, 255, 255))
        mixed = Image.composite(ink, white, text)
        rgb = ImageChops.multiply(rgb, mixed)
        board = rgb.convert("RGBA")
        # restore full opacity on the board
        a = Image.new("L", (w, h), 255)
        board.putalpha(a)
    if shear:
        extra = int(abs(shear) * h) + 2
        aff = (1, shear, -shear * h / 2, 0, 1, 0)
        warped = board.transform((w + extra, h), Image.Transform.AFFINE, aff, Image.Resampling.BICUBIC, fillcolor=(0, 0, 0, 0))
        canvas.alpha_composite(warped, (x - extra // 2, y))
    else:
        canvas.alpha_composite(board, (x, y))

def trefoil(canvas, cx, cy, r):
    cx, cy, r = int(cx * S), int(cy * S), r * S
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    dr = ImageDraw.Draw(layer)
    R = r * 1.35
    dr.ellipse([cx - R, cy - R, cx + R, cy + R], fill=(232, 194, 26, 255))
    for k in range(3):
        a0 = -90 + k * 120 - 28
        dr.pieslice([cx - r, cy - r, cx + r, cy + r], a0, a0 + 56, fill=(107, 31, 107, 255))
    dr.ellipse([cx - r * 0.22, cy - r * 0.22, cx + r * 0.22, cy + r * 0.22], fill=(232, 194, 26, 255))
    dr.ellipse([cx - r * 0.12, cy - r * 0.12, cx + r * 0.12, cy + r * 0.12], fill=(107, 31, 107, 255))
    canvas.alpha_composite(layer)

jobs = [
    ("containment.webp", dict(x=32,y=70,w=54,h=30,bg=(232,194,26),fg=(107,31,107),lines=["CAUTION","HIGH RAD","AREA"],trefoil=(59,112,8))),
    ("pressurizer.webp", dict(x=22,y=70,w=124,h=64,bg=(255,255,255),fg=(192,57,43),lines=["DANGER","HOT SURFACES"],shear=0.08)),
    ("msiv.webp", dict(x=360,y=54,w=70,h=46,bg=(236,236,236),fg=(17,17,17),lines=["MAIN STEAM","LINE RAD","MONITOR"],trefoil=(395,40,7))),
    ("tunnel.webp", dict(trefoil=(240,86,6))),
    ("freeze.webp", dict(x=60,y=80,w=80,h=34,bg=(255,255,255),fg=(17,17,17),lines=["FREEZE VALVE","FV-103"],shear=0.16)),
    ("freeze-frostGone.webp", dict(x=60,y=80,w=80,h=34,bg=(255,255,255),fg=(17,17,17),lines=["FREEZE VALVE","FV-103"],shear=0.16)),
    ("offgas.webp", dict(trefoil=(440,90,8))),
    ("turbine.webp", dict(x=20,y=40,w=40,h=18,bg=(15,107,47),fg=(255,255,255),lines=["EXIT"],light=True)),
    ("corridor.webp", dict(x=386,y=94,w=58,h=46,bg=(232,194,26),fg=(107,31,107),lines=["LOCKED HIGH","RADIATION","AREA"],trefoil=(415,158,9),shear=-0.14)),
    ("corridor-doorAjar.webp", dict(x=386,y=94,w=58,h=46,bg=(232,194,26),fg=(107,31,107),lines=["LOCKED HIGH","RADIATION","AREA"],trefoil=(415,158,9),shear=-0.14)),
    ("corridor-chair.webp", dict(x=386,y=94,w=58,h=46,bg=(232,194,26),fg=(107,31,107),lines=["LOCKED HIGH","RADIATION","AREA"],trefoil=(415,158,9),shear=-0.14)),
    ("corridor-hardhat.webp", dict(x=386,y=94,w=58,h=46,bg=(232,194,26),fg=(107,31,107),lines=["LOCKED HIGH","RADIATION","AREA"],trefoil=(415,158,9),shear=-0.14)),
]

for name, spec in jobs:
    path = os.path.join(plates, name)
    im = Image.open(path).convert("RGBA")
    if "lines" in spec:
        board_layer(im, spec["x"]*S, spec["y"]*S, spec["w"]*S, spec["h"]*S, spec["bg"], spec["fg"], spec["lines"], spec.get("light", False), spec.get("shear", 0))
    if "trefoil" in spec:
        trefoil(im, *spec["trefoil"])
    rgb = im.convert("RGB")
    for q in (78, 70, 62, 54, 46):
        rgb.save(path, "WEBP", quality=q, method=6)
        if os.path.getsize(path) <= 180 * 1024:
            print(name, os.path.getsize(path), "q", q)
            break
`,
  encoding: "utf8",
});
if (py.status !== 0) {
  console.error(py.stderr || py.stdout);
  process.exit(py.status ?? 1);
}
console.log(py.stdout);
