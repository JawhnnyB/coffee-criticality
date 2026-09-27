#!/usr/bin/env python3
"""Native-size plant hardware. Kettle ruler: top-left light, 3 planes, 1px ink.

Colors come from tools/palette.py — the locked Lake Master list.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

from palette import (
    BAND,
    BAND_L,
    BIO,
    BIO_D,
    BIO_L,
    CHER,
    CHER_D,
    CHER_L,
    COPPER,
    GOLD,
    GOLD_D,
    GOLD_L,
    INK,
    JKT,
    JKT_D,
    JKT_L,
    STEEL,
    STEEL_D,
    STEEL_L,
    rgba,
)

ROOT = Path(__file__).resolve().parents[1]
PROP = ROOT / "public/art/gen/props"

HOT = COPPER
COLD = STEEL


def new(w: int, h: int) -> Image.Image:
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def px(d: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, c: tuple[int, ...]) -> None:
    fill = c if len(c) == 4 else rgba(c)
    d.rectangle([x, y, x + w - 1, y + h - 1], fill=fill)


def outline(d: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int) -> None:
    d.rectangle([x, y, x + w - 1, y + h - 1], outline=rgba(INK))


def box(d: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, top: tuple, left: tuple, right: tuple) -> None:
    px(d, x, y, w, h, right)
    px(d, x, y, max(1, w - 1), max(1, h - 1), left)
    px(d, x, y, w, max(1, h // 4), top)
    outline(d, x, y, w, h)


def save(im: Image.Image, name: str) -> None:
    dest = PROP / name
    im.save(dest)
    print(f"{name:20} {im.size[0]:3}x{im.size[1]}")


def jacket_h(d: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int = 8) -> None:
    px(d, x, y, w, h, JKT)
    px(d, x, y, w, 2, JKT_L)
    px(d, x, y + h - 2, w, 2, JKT_D)
    outline(d, x, y, w, h)


def hanger(d: ImageDraw.ImageDraw, x: int, pipe_y: int) -> None:
    px(d, x, 0, 2, pipe_y, STEEL_D)
    px(d, x - 2, 0, 6, 2, BAND_L)


def pipe_h() -> None:
    im = new(32, 16)
    d = ImageDraw.Draw(im)
    jacket_h(d, 0, 5, 32, 8)
    for x in (0, 14, 29):
        px(d, x, 4, 3, 10, BAND)
        px(d, x, 4, 3, 1, BAND_L)
    hanger(d, 15, 5)
    save(im, "pipe_h.png")


def pipe_v() -> None:
    im = new(16, 32)
    d = ImageDraw.Draw(im)
    px(d, 4, 0, 8, 32, JKT)
    px(d, 4, 0, 2, 32, JKT_L)
    px(d, 10, 0, 2, 32, JKT_D)
    outline(d, 4, 0, 8, 32)
    for y in (0, 14, 29):
        px(d, 3, y, 10, 3, BAND)
        px(d, 3, y, 10, 1, BAND_L)
    px(d, 2, 8, 2, 4, STEEL_D)
    px(d, 0, 8, 3, 2, BAND_L)
    save(im, "pipe_v.png")


def pipe_corner() -> None:
    im = new(16, 16)
    d = ImageDraw.Draw(im)
    jacket_h(d, 0, 5, 11, 8)
    px(d, 4, 5, 8, 11, JKT)
    px(d, 4, 5, 2, 11, JKT_L)
    px(d, 10, 5, 2, 11, JKT_D)
    outline(d, 4, 5, 8, 11)
    px(d, 0, 4, 3, 10, BAND)
    px(d, 3, 13, 10, 3, BAND)
    save(im, "pipe_corner.png")


def pipe_run() -> None:
    im = new(48, 16)
    d = ImageDraw.Draw(im)
    jacket_h(d, 0, 5, 48, 8)
    for x in (0, 22, 45):
        px(d, x, 4, 3, 10, BAND)
        px(d, x, 4, 3, 1, BAND_L)
    hanger(d, 10, 5)
    hanger(d, 34, 5)
    save(im, "pipe_run.png")


def railing() -> None:
    im = new(48, 16)
    d = ImageDraw.Draw(im)
    px(d, 1, 2, 46, 2, STEEL_L)
    px(d, 1, 8, 46, 2, STEEL)
    for x in (2, 16, 30, 44):
        px(d, x, 2, 2, 14, STEEL_D)
        px(d, x, 2, 2, 1, STEEL_L)
    outline(d, 1, 2, 46, 2)
    save(im, "railing.png")


def valve() -> None:
    im = new(16, 24)
    d = ImageDraw.Draw(im)
    jacket_h(d, 0, 16, 16, 6)
    px(d, 0, 15, 3, 8, BAND)
    px(d, 13, 15, 3, 8, BAND)
    box(d, 4, 10, 8, 10, STEEL_L, STEEL, STEEL_D)
    px(d, 7, 4, 2, 8, STEEL_D)
    px(d, 3, 2, 10, 4, (184, 92, 74))
    px(d, 4, 3, 8, 2, (232, 168, 96))
    px(d, 7, 1, 2, 6, (120, 48, 40))
    outline(d, 3, 2, 10, 4)
    save(im, "valve.png")


def core() -> None:
    im = new(80, 80)
    d = ImageDraw.Draw(im)
    px(d, 4, 28, 72, 48, BIO)
    px(d, 4, 28, 72, 6, BIO_L)
    px(d, 4, 70, 72, 6, BIO_D)
    outline(d, 4, 28, 72, 48)
    box(d, 22, 10, 36, 56, STEEL_L, STEEL, STEEL_D)
    px(d, 30, 26, 20, 26, CHER_D)
    px(d, 32, 28, 16, 18, rgba(CHER, 200))
    px(d, 36, 30, 8, 6, rgba(CHER_L, 180))
    outline(d, 30, 26, 20, 26)
    for i in range(8):
        px(d, 24 + i * 4, 2, 2, 10, STEEL_D)
        px(d, 24 + i * 4, 2, 2, 2, STEEL_L)
    px(d, 58, 32, 18, 8, JKT)
    px(d, 58, 32, 18, 2, JKT_L)
    px(d, 58, 32, 3, 8, HOT)
    px(d, 73, 31, 3, 10, BAND)
    px(d, 4, 44, 18, 8, JKT)
    px(d, 4, 44, 18, 2, JKT_L)
    px(d, 19, 44, 3, 8, COLD)
    px(d, 4, 43, 3, 10, BAND)
    outline(d, 22, 10, 36, 56)
    save(im, "core.png")


def crane() -> None:
    im = new(96, 16)
    d = ImageDraw.Draw(im)
    px(d, 0, 2, 96, 5, INK)
    px(d, 0, 2, 96, 2, STEEL_L)
    px(d, 0, 5, 96, 1, STEEL_D)
    outline(d, 0, 2, 96, 5)
    box(d, 38, 0, 18, 9, GOLD_L, GOLD, GOLD_D)
    px(d, 46, 8, 2, 6, INK)
    px(d, 45, 13, 4, 2, GOLD)
    save(im, "crane.png")


def main() -> None:
    PROP.mkdir(parents=True, exist_ok=True)
    pipe_h()
    pipe_v()
    pipe_corner()
    pipe_run()
    railing()
    valve()
    core()
    crane()
    print("plant hardware ok")


if __name__ == "__main__":
    main()
