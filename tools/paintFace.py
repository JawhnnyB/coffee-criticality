#!/usr/bin/env python3
"""Native chibi bodies + talk-bust heads. No full-sprite palette snap.

The ghost bug: snap_image treated copper hoodies and cream aprons as skin,
so Mabel and the player collapsed into pale blobs. Skin snap is head-only
and copper/cream/gold are not flesh. Bodies are painted on the locked
plant list so outfits stay distinct.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from flood import flood_from_border
from palette import (
    ASH,
    BAD,
    CAST_HAIR,
    CAST_SKIN,
    COPPER,
    COPPER_D,
    COPPER_L,
    CREAM,
    CREAM_D,
    GOLD,
    GOLD_D,
    INK,
    LEAF,
    MUTED,
    STEEL,
    STEEL_D,
    SURFACE,
    WINE,
    WINE_D,
    WOOD,
    WOOD_D,
    WOOD_MID,
    rgba,
    write_swatch,
)

ROOT = Path(__file__).resolve().parents[1]
SPR = ROOT / "public/art/gen/sprites"
POR = ROOT / "public/art/gen/portraits"
QC = Path("/tmp/face_qc")

CAST = ("mabel", "holt", "elena", "tommy", "marcus", "priya", "jordan", "player")

HEAD_CROP = {
    "mabel": (16, 4, 64, 64, 4),
    "holt": (16, 4, 64, 64, 4),
    "elena": (24, 4, 48, 36, 3),
    "tommy": (16, 4, 64, 64, 4),
    "marcus": (16, 4, 64, 64, 4),
    "priya": (16, 4, 64, 64, 4),
    "jordan": (16, 4, 64, 64, 4),
    "player": (16, 4, 64, 64, 4),
}

# shirt, shade, pants, shoes, optional apron / hood / coat
CLOTH = {
    "player": dict(shirt=COPPER, shade=COPPER_D, light=COPPER_L, pants=WOOD_D, shoes=INK, hood=True),
    "mabel": dict(shirt=COPPER, shade=COPPER_D, light=COPPER_L, pants=WOOD, shoes=WOOD_D, apron=CREAM),
    "holt": dict(shirt=MUTED, shade=ASH, light=CREAM_D, pants=SURFACE, shoes=INK),
    "elena": dict(shirt=STEEL, shade=STEEL_D, light=LEAF, pants=STEEL_D, shoes=INK, coat=True),
    "tommy": dict(shirt=COPPER_D, shade=WOOD_D, light=COPPER, pants=STEEL_D, shoes=INK),
    "marcus": dict(shirt=BAD, shade=WOOD_D, light=COPPER, pants=WOOD_D, shoes=INK),
    "priya": dict(shirt=WINE, shade=WINE_D, light=COPPER, pants=WOOD_D, shoes=INK),
    "jordan": dict(shirt=GOLD, shade=GOLD_D, light=COPPER_L, pants=SURFACE, shoes=INK),
}

SIT_DY = 10


def knock_paper(im: Image.Image) -> Image.Image:
    a = np.array(im.convert("RGBA"))
    r = a[:, :, 0].astype(np.int16)
    g = a[:, :, 1].astype(np.int16)
    b = a[:, :, 2].astype(np.int16)
    al = a[:, :, 3]
    dark = (r < 16) & (g < 16) & (b < 16)
    cream = (r > 228) & (g > 218) & (b > 190) & (np.abs(r - g) < 22)
    mag = (r > 150) & (b > 150) & (g < 210) & (r > g + 20)
    paper = (al < 12) | cream | dark | mag
    a[flood_from_border(paper, eight=True), 3] = 0
    a[:, :, 3] = np.where(a[:, :, 3] >= 80, 255, 0)
    return Image.fromarray(a)


def talk_head(who: str) -> Image.Image:
    talk = knock_paper(Image.open(POR / f"{who}_talk.png"))
    x, y, w, h, div = HEAD_CROP[who]
    crop = talk.crop((x, y, x + w, y + h))
    dw, dh = w // div, h // div
    return crop.resize((dw, dh), Image.Resampling.NEAREST)


def ink_outline(a: np.ndarray) -> None:
    al = a[:, :, 3] > 80
    h, w = al.shape
    ink = np.array(rgba(INK), dtype=np.uint8)
    edge = np.zeros_like(al)
    edge[:, 1:] |= al[:, 1:] & ~al[:, :-1]
    edge[:, :-1] |= al[:, :-1] & ~al[:, 1:]
    edge[1:, :] |= al[1:, :] & ~al[:-1, :]
    edge[:-1, :] |= al[:-1, :] & ~al[1:, :]
    edge |= (np.arange(w)[None, :] == 0) & al
    edge |= (np.arange(w)[None, :] == w - 1) & al
    edge |= (np.arange(h)[:, None] == 0) & al
    edge |= (np.arange(h)[:, None] == h - 1) & al
    a[edge] = ink


def blit(a: np.ndarray, x: int, y: int, w: int, h: int, rgb: tuple[int, int, int]) -> None:
    y0, y1 = max(0, y), min(64, y + h)
    x0, x1 = max(0, x), min(32, x + w)
    if y1 <= y0 or x1 <= x0:
        return
    a[y0:y1, x0:x1] = rgba(rgb)


def paint_body(who: str, sit: bool = False, step: int = 0) -> np.ndarray:
    a = np.zeros((64, 32, 4), np.uint8)
    c = CLOTH[who]
    skin = CAST_SKIN[who]
    dy = SIT_DY if sit else 0
    # neck
    blit(a, 14, 18 + dy, 4, 6, skin)
    # torso
    blit(a, 10, 23 + dy, 12, 16 if sit else 18, c["shirt"])
    blit(a, 10, 23 + dy, 12, 3, c["light"])
    blit(a, 10, 23 + dy + 3, 2, 10, c["shade"])
    if c.get("hood"):
        blit(a, 9, 21 + dy, 14, 5, c["shade"])
        blit(a, 11, 22 + dy, 10, 3, c["shirt"])
    if c.get("coat"):
        blit(a, 8, 22 + dy, 16, 20, c["shirt"])
        blit(a, 8, 22 + dy, 16, 4, c["shade"])
        blit(a, 12, 26 + dy, 8, 12, c["light"])
    if c.get("apron"):
        blit(a, 12, 28 + dy, 8, 16, c["apron"])
        blit(a, 15, 24 + dy, 2, 6, c["apron"])
        blit(a, 12, 28 + dy, 8, 1, CREAM_D)
    # arms
    bob = 1 if step == 1 else -1 if step == 3 else 0
    ay = 26 + dy + (0 if sit else bob)
    blit(a, 7, ay, 3, 12 if sit else 14, c["shirt"])
    blit(a, 22, ay, 3, 12 if sit else 14, c["shirt"])
    blit(a, 7, ay + (11 if sit else 13), 3, 3, skin)
    blit(a, 22, ay + (11 if sit else 13), 3, 3, skin)
    if sit:
        blit(a, 9, 40 + dy, 14, 8, c["pants"])
        blit(a, 8, 46 + dy, 7, 5, c["pants"])
        blit(a, 17, 46 + dy, 7, 5, c["pants"])
        blit(a, 8, 50 + dy, 7, 4, c["shoes"])
        blit(a, 17, 50 + dy, 7, 4, c["shoes"])
    else:
        ly = 1 if step in (1, 2) else 0
        ry = 1 if step in (0, 3) else 0
        blit(a, 10, 41, 5, 13 + ly, c["pants"])
        blit(a, 17, 41, 5, 13 + ry, c["pants"])
        blit(a, 10, 54 + ly, 5, 6, c["shoes"])
        blit(a, 17, 54 + ry, 5, 6, c["shoes"])
    ink_outline(a)
    return a


def hair_back(head: Image.Image, who: str) -> Image.Image:
    a = np.array(head.convert("RGBA"))
    h, w = a.shape[:2]
    al = a[:, :, 3] > 80
    hair = np.array(rgba(CAST_HAIR[who]), dtype=np.uint8)
    ink = np.array(rgba(INK), dtype=np.uint8)
    out = np.zeros_like(a)
    out[al] = hair
    edge = np.zeros_like(al)
    edge[:, 1:] |= al[:, 1:] & ~al[:, :-1]
    edge[:, :-1] |= al[:, :-1] & ~al[:, 1:]
    edge[1:, :] |= al[1:, :] & ~al[:-1, :]
    edge[:-1, :] |= al[:-1, :] & ~al[1:, :]
    out[edge] = ink
    if who == "mabel":
        out[al & (np.arange(h)[:, None] < 4)] = rgba(CAST_HAIR["mabel"])
    if who == "tommy":
        out[al & (np.arange(h)[:, None] < 5)] = rgba(STEEL)
    return Image.fromarray(out)


def assemble(who: str, head: Image.Image, sit: bool = False, step: int = 0, back: Image.Image | None = None) -> Image.Image:
    body = paint_body(who, sit=sit, step=step)
    src = back if back is not None else head
    y = SIT_DY if sit else 2
    x = (32 - src.width) // 2
    cell = Image.fromarray(body)
    cell.paste(src, (x, y), src)
    return cell


def save_sheet_walk4(who: str, head: Image.Image, back: Image.Image) -> None:
    sheet = Image.new("RGBA", (128, 192), (0, 0, 0, 0))
    for row in range(3):
        face = back if row == 2 else None
        for col in range(4):
            cell = assemble(who, head, step=col, back=face)
            sheet.paste(cell, (col * 32, row * 64))
    sheet.save(SPR / f"{who}_walk4.png")


def save_loco(who: str, head: Image.Image) -> None:
    path = SPR / f"{who}_loco.png"
    if not path.exists():
        return
    im = Image.open(path).convert("RGBA")
    sheet = Image.new("RGBA", im.size, (0, 0, 0, 0))
    cols = im.width // 32
    for i in range(cols):
        sheet.paste(assemble(who, head, step=i % 4), (i * 32, 0))
    sheet.save(path)


def main() -> None:
    QC.mkdir(exist_ok=True)
    write_swatch()
    contact = Image.new("RGBA", (128 * 8, 256), (*INK, 255))
    for i, who in enumerate(CAST):
        head = talk_head(who)
        back = hair_back(head, who)
        idle = assemble(who, head)
        idle.save(SPR / f"{who}_idle_32.png")
        assemble(who, head, sit=True).save(SPR / f"{who}_sit.png")
        assemble(who, head).save(SPR / f"{who}_side.png")
        assemble(who, head, back=back).save(SPR / f"{who}_up.png")
        save_sheet_walk4(who, head, back)
        save_loco(who, head)
        four = idle.resize((128, 256), Image.NEAREST)
        four.save(QC / f"{who}_idle_4x.png")
        head.resize((head.width * 8, head.height * 8), Image.NEAREST).save(QC / f"{who}_head_8x.png")
        contact.paste(four, (i * 128, 0))
        print(f"cast {who:8} head={head.size} shirt={CLOTH[who]['shirt']}")
    contact.save(QC / "cast_idle_4x.png")
    print("qc", QC / "cast_idle_4x.png")


if __name__ == "__main__":
    main()
