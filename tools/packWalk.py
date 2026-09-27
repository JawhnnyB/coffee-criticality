#!/usr/bin/env python3
"""Walk packer — one ruler per character.

Idle is packed first. That freeze-locks scale S and feet Y.
Every other frame is resized by S and pasted feet-flush at Y=64.
Never contain-fit a walk cell on its own bbox (that shrinks the person).

QC: a cell whose opaque height is < 85% of idle is rejected; idle is used instead.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
from PIL import Image

from flood import flood_from_border

ROOT = Path(__file__).resolve().parents[1]
LOCK = ROOT / "public/art/gen/lock"
SPR = ROOT / "public/art/gen/sprites"
META = ROOT / "artifacts/art_walk/WALK_RULER.json"

CAST = ("mabel", "holt", "elena", "tommy", "marcus", "priya", "jordan", "player")

CELL_W = 32
CELL_H = 64
MAX_W = 30
MAX_H = 62
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
    """Paper is only what the BORDER can reach.

    Magenta / white / cream connected to the edge go to alpha 0.
    Peach/tan skin is never paper — even if a JPEG fringe looks pink.
    We do NOT globally chroma magenta (that punched holes in glasses and cheeks).
    """
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
    """No mid-alpha. Floor must not show through a cheek."""
    a = np.array(im.convert("RGBA"))
    a[:, :, 3] = np.where(a[:, :, 3] >= 96, 255, 0)
    empty = a[:, :, 3] < 40
    outside = flood_from_border(empty, eight=False)
    holes = empty & ~outside
    a[holes, 3] = 255
    return Image.fromarray(a)


def figure(src: Image.Image | Path) -> Image.Image:
    im = src if isinstance(src, Image.Image) else Image.open(src)
    im = knock_paper(im)
    bb = im.getbbox()
    if not bb:
        raise SystemExit(f"empty figure: {src}")
    return im.crop(bb)


def ruler_from_crop(who: str, crop: Image.Image) -> Ruler:
    sc = min(MAX_W / crop.width, MAX_H / crop.height)
    nw = max(1, int(crop.width * sc))
    nh = max(1, int(crop.height * sc))
    return Ruler(
        who=who,
        scale=float(sc),
        fig_w=nw,
        fig_h=nh,
        paste_x=(CELL_W - nw) // 2,
        paste_y=CELL_H - nh,
    )


def apply_ruler(crop: Image.Image, ruler: Ruler) -> Image.Image:
    """Resize by idle scale S. Feet on the cell bottom. Never a new contain-fit."""
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


def pack_idle(who: str) -> tuple[Image.Image, Ruler]:
    crop = figure(LOCK / f"{who}_chibi.png")
    ruler = ruler_from_crop(who, crop)
    cell = apply_ruler(crop, ruler)
    return cell, ruler


def shift_band(cell: Image.Image, y0: int, y1: int, dx: int) -> Image.Image:
    """Slide a horizontal band. Face stays. Canvas size stays."""
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


def pack_loco(idle: Image.Image, ruler: Ruler) -> Image.Image:
    step_l = shift_band(shift_band(idle, 42, 64, 2), 18, 42, -1)
    step_r = shift_band(shift_band(idle, 42, 64, -2), 18, 42, 1)
    frames = [step_l, step_r, idle]
    sheet = Image.new("RGBA", (CELL_W * 3, CELL_H), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        if not ruler.ok(fr):
            fr = idle
        sheet.paste(fr, (i * CELL_W, 0), fr)
    return sheet


def qc_sheet(who: str, idle: Image.Image, loco: Image.Image, ruler: Ruler) -> None:
    ib = idle.getbbox()
    assert ib, who
    ih = ib[3] - ib[1]
    for i, name in enumerate(("L", "R", "up")):
        cell = loco.crop((i * CELL_W, 0, (i + 1) * CELL_W, CELL_H))
        bb = cell.getbbox()
        h = (bb[3] - bb[1]) if bb else 0
        if h < int(ih * MIN_HEIGHT_RATIO):
            raise SystemExit(f"{who} {name} height {h} < 85% idle {ih}")
    print(f"qc   {who:8} idle={ruler.fig_w}x{ruler.fig_h} S={ruler.scale:.4f} loco ok")


def main() -> None:
    SPR.mkdir(parents=True, exist_ok=True)
    try:
        META.parent.mkdir(parents=True, exist_ok=True)
        meta_path = META
    except PermissionError:
        meta_path = Path("/tmp/WALK_RULER.json")
    rulers: list[dict] = []
    for who in CAST:
        idle, ruler = pack_idle(who)
        dest_i = SPR / f"{who}_idle_32.png"
        idle.save(dest_i)
        loco = pack_loco(idle, ruler)
        dest_l = SPR / f"{who}_loco.png"
        loco.save(dest_l)
        qc_sheet(who, idle, loco, ruler)
        rulers.append(asdict(ruler))
        op = int(np.array(idle)[:, :, 3].sum() // 255)
        print(f"walk {who:8} opaque~{op:4} {dest_i.name}")
    meta_path.write_text(json.dumps(rulers, indent=2), encoding="utf-8")
    print(f"wrote {meta_path}")


if __name__ == "__main__":
    main()
