#!/usr/bin/env python3
"""Pillar A packer.

Idle and talk busts come from the frozen lock chibi — never a second face stamp.
Walk frames come from the 4x4 Imagine sheet, resized by the IDLE ruler so
every cell is the same height. A cell that shrinks below 85% is replaced by a
band-shift of idle (feet still plant).

Alpha is 0 or 255. Paper is border-flood only. Peach is never paper.
"""
from __future__ import annotations

import json
import shutil
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

from flood import flood_from_border

ROOT = Path(__file__).resolve().parents[1]
LOCK = ROOT / "public/art/gen/lock"
SPR = ROOT / "public/art/gen/sprites"
POR = ROOT / "public/art/gen/portraits"
UI = ROOT / "public/art/gen/ui"
RAW_DIR = ROOT / "artifacts/pillarA"
META = ROOT / "artifacts/art_walk/WALK_RULER.json"

CAST = ("mabel", "holt", "elena", "tommy", "marcus", "priya", "jordan", "player")

# Imagine 4x4 locomotion, identity-chained from lock.
RAW_4X4 = {
    "player": ROOT / "artifacts/imagine_images/c333744a-a93c-4646-bdf8-b7649ead0154.jpg",
    "mabel": ROOT / "artifacts/imagine_images/db0c9501-c7a6-4c17-b5df-173627d8caee.jpg",
    "holt": ROOT / "artifacts/imagine_images/fcd6137d-6d2e-435a-b6d5-fd92532e098b.jpg",
    "elena": ROOT / "artifacts/imagine_images/2ce9b9be-2c7f-4798-81a3-9e3a08c4ce0f.jpg",
    "tommy": ROOT / "artifacts/imagine_images/afe6d8fa-7b05-4793-ab17-ff8133f49e89.jpg",
    "marcus": ROOT / "artifacts/imagine_images/1425c343-de1d-4621-87dd-6e29e562e739.jpg",
    "priya": ROOT / "artifacts/imagine_images/30d0f327-b260-4277-85b6-ace61a9d8bde.jpg",
    "jordan": ROOT / "artifacts/imagine_images/a257e3dc-e014-47e7-9ef5-7e5b1cdcaee0.jpg",
}

CELL_W = 32
CELL_H = 64
BUST = 96
MAX_W = 30
TARGET_H = 62
MIN_HEIGHT_RATIO = 0.85


@dataclass
class Ruler:
    who: str
    scale: float
    fig_w: int
    fig_h: int
    paste_x: int
    paste_y: int

    def ok(self, cell: Image.Image) -> bool:
        bb = cell.getbbox()
        if not bb:
            return False
        return (bb[3] - bb[1]) >= int(self.fig_h * MIN_HEIGHT_RATIO)


def knock_paper(im: Image.Image) -> Image.Image:
    a = np.array(im.convert("RGBA"))
    r = a[:, :, 0].astype(np.int16)
    g = a[:, :, 1].astype(np.int16)
    b = a[:, :, 2].astype(np.int16)
    al = a[:, :, 3]
    skin = (r > 120) & (g > 70) & (b > 50) & (r > b + 12) & (g > b - 25) & ((r - g) < 95)
    mag = (r > 150) & (b > 150) & (g < 210) & (r > g + 20)
    cream = (r > 228) & (g > 218) & (b > 190) & (np.abs(r - g) < 22)
    white = np.minimum(np.minimum(r, g), b) > 236
    paper = (mag | cream | white | (al < 12)) & ~skin
    a[flood_from_border(paper, eight=False), 3] = 0
    return Image.fromarray(a)


def harden_alpha(im: Image.Image) -> Image.Image:
    a = np.array(im.convert("RGBA"))
    a[:, :, 3] = np.where(a[:, :, 3] >= 96, 255, 0)
    empty = a[:, :, 3] < 40
    outside = flood_from_border(empty, eight=False)
    a[empty & ~outside, 3] = 255
    return Image.fromarray(a)


def figure(src: Image.Image | Path) -> Image.Image:
    im = src if isinstance(src, Image.Image) else Image.open(src)
    im = knock_paper(im)
    bb = im.getbbox()
    if not bb:
        raise SystemExit(f"empty figure: {src}")
    return im.crop(bb)


def ruler_from_crop(who: str, crop: Image.Image) -> Ruler:
    sc = min(MAX_W / crop.width, TARGET_H / crop.height)
    nw = max(1, int(crop.width * sc))
    nh = max(1, int(crop.height * sc))
    return Ruler(who, float(sc), nw, nh, (CELL_W - nw) // 2, CELL_H - nh)


def apply_ruler(crop: Image.Image, ruler: Ruler) -> Image.Image:
    nw = max(1, int(round(crop.width * ruler.scale)))
    nh = max(1, int(round(crop.height * ruler.scale)))
    small = crop.resize((nw, nh), Image.Resampling.LANCZOS)
    if nh > CELL_H:
        small = small.crop((0, nh - CELL_H, nw, nh))
        nw, nh = small.size
    if nw > CELL_W:
        x0 = (nw - CELL_W) // 2
        small = small.crop((x0, 0, x0 + CELL_W, nh))
        nw, nh = small.size
    out = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    out.paste(small, ((CELL_W - nw) // 2, CELL_H - nh), small)
    return harden_alpha(out)


def shift_band(cell: Image.Image, y0: int, y1: int, dx: int) -> Image.Image:
    a = np.array(cell.convert("RGBA"))
    band = a[y0:y1].copy()
    a[y0:y1] = 0
    if dx > 0:
        a[y0:y1, dx:] = band[:, :-dx]
    elif dx < 0:
        a[y0:y1, :dx] = band[:, -dx:]
    else:
        a[y0:y1] = band
    return Image.fromarray(a)


def band_walk(idle: Image.Image) -> list[Image.Image]:
    """4-frame down/side fallback. Face never restamped."""
    f0 = idle
    f1 = shift_band(shift_band(idle, 42, 64, 3), 18, 42, -1)
    f2 = idle
    f3 = shift_band(shift_band(idle, 42, 64, -3), 18, 42, 1)
    return [f0, f1, f2, f3]


def face_to_back(cell: Image.Image) -> Image.Image:
    """Up-facing: cover the face oval with hair sampled from the crown. Body stays."""
    a = np.array(cell.convert("RGBA"))
    crown = a[3:9, 10:22]
    op = crown[:, :, 3] > 200
    if not op.any():
        return cell
    hair = tuple(int(x) for x in crown[op].mean(0)[:3])
    out = cell.copy()
    d = ImageDraw.Draw(out)
    d.ellipse([9, 6, 22, 18], fill=hair + (255,))
    return out


def split_4x4(path: Path) -> list[Image.Image]:
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    cw, ch = w // 4, h // 4
    cells: list[Image.Image] = []
    for row in range(4):
        for col in range(4):
            cells.append(im.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch)))
    return cells


def pack_frame(src: Image.Image, ruler: Ruler, fallback: Image.Image) -> Image.Image:
    try:
        crop = figure(src)
    except SystemExit:
        return fallback
    cell = apply_ruler(crop, ruler)
    return cell if ruler.ok(cell) else fallback


def pack_walk4(who: str, idle: Image.Image, ruler: Ruler) -> tuple[Image.Image, int]:
    fallback = band_walk(idle)
    down, side, up = list(fallback), list(fallback), [face_to_back(f) for f in fallback]
    used = 0
    raw = RAW_4X4.get(who)
    if raw and raw.exists():
        cells = split_4x4(raw)
        for i in range(4):
            down[i] = pack_frame(cells[i], ruler, fallback[i])
            side[i] = pack_frame(cells[4 + i], ruler, fallback[i])
            up[i] = pack_frame(cells[8 + i], ruler, face_to_back(fallback[i]))
            used += 1
    sheet = Image.new("RGBA", (CELL_W * 4, CELL_H * 3), (0, 0, 0, 0))
    for i, fr in enumerate(down):
        sheet.paste(fr, (i * CELL_W, 0), fr)
    for i, fr in enumerate(side):
        sheet.paste(fr, (i * CELL_W, CELL_H), fr)
    for i, fr in enumerate(up):
        sheet.paste(fr, (i * CELL_W, CELL_H * 2), fr)
    return sheet, used


def pack_bust(crop: Image.Image) -> Image.Image:
    h = crop.height
    w = crop.width
    top = crop.crop((0, 0, w, max(8, int(h * 0.42))))
    sc = min(BUST / top.width, BUST / top.height) * 0.92
    nw = max(1, int(top.width * sc))
    nh = max(1, int(top.height * sc))
    small = top.resize((nw, nh), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (BUST, BUST), (0, 0, 0, 0))
    out.paste(small, ((BUST - nw) // 2, BUST - nh - 4), small)
    return harden_alpha(out)


def draw_emotes() -> None:
    UI.mkdir(parents=True, exist_ok=True)
    copper = (196, 120, 58, 255)
    ink = (22, 17, 13, 255)
    cream = (243, 230, 208, 255)

    bang = Image.new("RGBA", (8, 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(bang)
    d.rectangle([3, 0, 4, 5], fill=copper)
    d.rectangle([3, 7, 4, 7], fill=copper)
    bang.save(UI / "emote_bang.png")

    dots = Image.new("RGBA", (8, 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(dots)
    for x in (1, 4, 7):
        d.rectangle([x, 3, x, 4], fill=copper)
    dots.save(UI / "emote_dots.png")

    mug = Image.new("RGBA", (8, 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(mug)
    d.rectangle([1, 2, 5, 7], outline=ink, fill=cream)
    d.rectangle([2, 3, 4, 6], fill=copper)
    d.point((6, 4), fill=ink)
    d.point((7, 5), fill=ink)
    mug.save(UI / "emote_mug.png")


def main() -> None:
    SPR.mkdir(parents=True, exist_ok=True)
    POR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    rulers: list[dict] = []
    for who in CAST:
        crop = figure(LOCK / f"{who}_chibi.png")
        ruler = ruler_from_crop(who, crop)
        idle = apply_ruler(crop, ruler)
        idle.save(SPR / f"{who}_idle_32.png")

        bust = pack_bust(crop)
        bust.save(POR / f"{who}_talk.png")

        walk4, used = pack_walk4(who, idle, ruler)
        walk4.save(SPR / f"{who}_walk4.png")

        # keep loco as a 3-frame strip for any leftover blit
        loco = Image.new("RGBA", (CELL_W * 3, CELL_H), (0, 0, 0, 0))
        frames = band_walk(idle)
        for i, fr in enumerate(frames[:3]):
            loco.paste(fr, (i * CELL_W, 0), fr)
        loco.save(SPR / f"{who}_loco.png")

        raw = RAW_4X4[who]
        if raw.exists():
            shutil.copy(raw, RAW_DIR / f"{who}_4x4.jpg")

        ib = idle.getbbox()
        ih = (ib[3] - ib[1]) if ib else 0
        print(f"body {who:8} idle={ruler.fig_w}x{ruler.fig_h} h={ih} walk4 imagine_rows={used} bust={bust.size}")
        rulers.append(asdict(ruler))

    draw_emotes()
    try:
        META.write_text(json.dumps(rulers, indent=2), encoding="utf-8")
    except OSError:
        Path("/tmp/WALK_RULER.json").write_text(json.dumps(rulers, indent=2), encoding="utf-8")
    print("pillar A packed")


if __name__ == "__main__":
    main()
