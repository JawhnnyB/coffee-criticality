#!/usr/bin/env python3
"""Lock chibi → talk bust 96×96, walk idle 32×64, loco strip 96×64.

Talk = head+shoulders crop. Walk idle = full body from lock.
Loco = stepL | stepR | up from Imagine 2x2 (idle cell discarded).
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

from flood import flood_from_border
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
LOCK = ROOT / "public/art/gen/lock"
POR = ROOT / "public/art/gen/portraits"
SPR = ROOT / "public/art/gen/sprites"
RAW = ROOT / "artifacts/imagine_images"

CAST = ("mabel", "holt", "elena", "tommy", "marcus", "priya", "jordan", "player")

CROP = {
    "mabel": {"frac": 0.48, "pad_top": 36, "nearest88": False},
    "holt": {"frac": 0.62, "pad_top": 8, "nearest88": False},
    "elena": {"frac": 0.50, "pad_top": 28, "nearest88": False},
    "tommy": {"frac": 0.56, "pad_top": 18, "nearest88": False},
    "marcus": {"frac": 0.58, "pad_top": 10, "nearest88": False},
    "priya": {"frac": 0.50, "pad_top": 28, "nearest88": False},
    "jordan": {"frac": 0.50, "pad_top": 16, "nearest88": False},
    "player": {"frac": 0.54, "pad_top": 10, "nearest88": False},
}

SHEETS = {
    "mabel": "2744bbc7-5220-48e3-ad0f-8fc921110e0e.jpg",
    "player": "bf3c6e98-ae5e-44dd-9135-3d84e1b9ba2d.jpg",
    "jordan": "38b85731-7791-4b0e-b876-100cec620176.jpg",
    "priya": "814b3089-b6a0-4b9c-a2e6-86a9407e26a1.jpg",
    "holt": "d93724df-f108-4bac-9d78-251e492b80c0.jpg",
    "elena": "87008c05-7f07-45a0-8cca-98f213563f72.jpg",
    "tommy": "88917b84-6823-474b-8e06-c46748a8cbaf.jpg",
    "marcus": "d8954711-d4f9-4c27-b0b0-9d6a570df50f.jpg",
}


def knock_border(im: Image.Image) -> Image.Image:
    a = np.array(im.convert("RGBA"))
    r = a[:, :, 0].astype(np.int16)
    g = a[:, :, 1].astype(np.int16)
    b = a[:, :, 2].astype(np.int16)
    al = a[:, :, 3]
    mag = (r > 150) & (b > 150) & (g < 210) & (r > g + 20)
    cream = (r > 228) & (g > 218) & (b > 190) & (np.abs(r - g) < 22)
    white = np.minimum(np.minimum(r, g), b) > 230
    a[mag | (al < 12), 3] = 0
    paper = (a[:, :, 3] < 12) | cream | white
    a[flood_from_border(paper, eight=False), 3] = 0
    return Image.fromarray(a)


def pack_talk(who: str) -> Path:
    src = LOCK / f"{who}_chibi.png"
    spec = CROP[who]
    im = knock_border(Image.open(src))
    bb = im.getbbox()
    if not bb:
        raise SystemExit(f"{who}: empty after paper knock")
    x0, y0, x1, y1 = bb
    fh = y1 - y0
    fw = x1 - x0
    hy1 = y0 + int(fh * spec["frac"])
    pad = int(fw * 0.06)
    top = max(0, y0 - spec["pad_top"])
    crop = im.crop((max(0, x0 - pad), top, min(im.width, x1 + pad), min(im.height, hy1 + pad)))
    if spec["nearest88"]:
        sc = min(88 / crop.width, 88 / crop.height)
        nw, nh = max(1, int(crop.width * sc)), max(1, int(crop.height * sc))
        small = crop.resize((nw, nh), Image.Resampling.NEAREST)
        out = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        out.paste(small, ((96 - nw) // 2, 96 - nh), small)
    else:
        sc = min(96 / crop.width, 96 / crop.height)
        nw, nh = max(1, int(crop.width * sc)), max(1, int(crop.height * sc))
        small = crop.resize((nw, nh), Image.Resampling.LANCZOS)
        out = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        out.paste(small, ((96 - nw) // 2, 96 - nh), small)
    dest = POR / f"{who}_talk.png"
    out.save(dest)
    op = sum(1 for p in out.getdata() if p[3] > 20)
    print(f"talk {who:8} opaque={op:4} {dest.name}")
    return dest


def pack_walk(who: str) -> Path:
    """Full-body 32×64, feet flush. Lock aspect → ~24px wide, head in frame."""
    src = LOCK / f"{who}_chibi.png"
    im = knock_border(Image.open(src))
    bb = im.getbbox()
    if not bb:
        raise SystemExit(f"{who}: empty walk")
    crop = im.crop(bb)
    sc = min(30 / crop.width, 62 / crop.height)
    nw, nh = max(1, int(crop.width * sc)), max(1, int(crop.height * sc))
    small = crop.resize((nw, nh), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (32, 64), (0, 0, 0, 0))
    out.paste(small, ((32 - nw) // 2, 64 - nh), small)
    dest = SPR / f"{who}_idle_32.png"
    out.save(dest)
    op = sum(1 for p in out.getdata() if p[3] > 20)
    print(f"walk {who:8} opaque={op:4} {dest.name} {nw}x{nh}")
    return dest


def shift_band(im: Image.Image, y0: int, y1: int, dx: int) -> Image.Image:
    """Slide a horizontal band by dx. Face/torso stay; legs walk. Same canvas size."""
    out = im.copy()
    band = im.crop((0, y0, 32, y1))
    clear = Image.new("RGBA", (32, y1 - y0), (0, 0, 0, 0))
    out.paste(clear, (0, y0))
    out.paste(band, (dx, y0), band)
    return out


def pack_loco(who: str) -> Path:
    """Stride from the lock idle so walk never shrinks and the face never changes."""
    idle = Image.open(SPR / f"{who}_idle_32.png").convert("RGBA")
    step_l = shift_band(idle, 42, 64, 2)
    step_l = shift_band(step_l, 18, 42, -1)
    step_r = shift_band(idle, 42, 64, -2)
    step_r = shift_band(step_r, 18, 42, 1)
    up = idle.copy()
    sheet = Image.new("RGBA", (96, 64), (0, 0, 0, 0))
    sheet.paste(step_l, (0, 0), step_l)
    sheet.paste(step_r, (32, 0), step_r)
    sheet.paste(up, (64, 0), up)
    dest = SPR / f"{who}_loco.png"
    sheet.save(dest)
    op = sum(1 for p in sheet.getdata() if p[3] > 20)
    print(f"loco {who:8} opaque={op:4} {dest.name}")
    return dest


def main() -> None:
    POR.mkdir(parents=True, exist_ok=True)
    for who in CAST:
        pack_talk(who)
    (POR / "priya_builder.png").write_bytes((POR / "priya_talk.png").read_bytes())
    print("talk ok — walk is tools/packWalk.py")


if __name__ == "__main__":
    main()
