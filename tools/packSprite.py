#!/usr/bin/env python3
"""Downscale Imagine 1408s into native pixel sprites.

Majority-vote per dest pixel + ink silhouette. Not NEAREST. Not hqx.
Border-connected cream/pink is alpha (apron interior cream stays).
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image

from flood import dilate4, flood_from_border, flood_through

PAL = np.array(
    [
        [26, 20, 16],
        [243, 230, 208],
        [196, 120, 58],
        [107, 143, 113],
        [22, 17, 13],
        [61, 92, 102],
        [201, 162, 39],
        [106, 74, 50],
        [184, 92, 74],
        [232, 213, 184],
        [200, 192, 180],
        [58, 40, 24],
        [90, 80, 72],
        [168, 160, 148],
        [74, 52, 36],
        [42, 36, 30],
        [200, 168, 140],
        [45, 48, 52],
        [48, 64, 52],
    ],
    dtype=np.int16,
)
INK = (26, 20, 16)
CREAM = (243, 230, 208)
CREAM_I = 1  # index in PAL


def is_halo_rgb(r: int, g: int, b: int, a: int) -> bool:
    if a < 80:
        return True
    if r > 150 and b > 150 and g < 200 and abs(r - b) < 110:
        return True
    if r > 210 and g > 195 and b > 170:
        return True
    if abs(r - 243) + abs(g - 230) + abs(b - 208) < 72:
        return True
    return False


def chroma(im: Image.Image) -> Image.Image:
    a = np.array(im.convert("RGBA"))
    r, g, b = a[:, :, 0].astype(int), a[:, :, 1].astype(int), a[:, :, 2].astype(int)
    mag = (r > 200) & (b > 200) & (g < 90)
    smear = (r > 175) & (b > 155) & (g < 140) & (np.abs(r.astype(int) - b) < 90)
    a[:, :, 3] = np.where(mag | smear, 0, 255)
    a[:, :, 3] = np.where(a[:, :, 3] < 80, 0, 255)
    return Image.fromarray(a)


def flood_border(im: Image.Image) -> Image.Image:
    """Knock out cream/pink/magenta connected to the image border. Interior cream stays."""
    a = np.array(im.convert("RGBA"))
    r = a[:, :, 0].astype(np.int16)
    g = a[:, :, 1].astype(np.int16)
    b = a[:, :, 2].astype(np.int16)
    al = a[:, :, 3]
    halo = (
        (al < 80)
        | ((r > 150) & (b > 150) & (g < 200) & (np.abs(r - b) < 110))
        | ((r > 210) & (g > 195) & (b > 170))
        | ((np.abs(r - 243) + np.abs(g - 230) + np.abs(b - 208)) < 72)
    )
    a[flood_from_border(halo, eight=True), 3] = 0

    opaque = a[:, :, 3] > 10
    cream = opaque & (
        ((r > 150) & (b > 150) & (g < 200) & (np.abs(r - b) < 110))
        | ((r > 210) & (g > 195) & (b > 170))
        | ((np.abs(r - 243) + np.abs(g - 230) + np.abs(b - 208)) < 72)
    )
    trans = a[:, :, 3] < 80
    ink = opaque & ~cream
    wall = dilate4(trans) & ink
    seeds = cream & dilate4(wall)
    trapped = flood_through(cream, seeds, eight=False)
    opaque_n = int(opaque.sum()) or 1
    if int(trapped.sum()) / opaque_n >= 0.40:
        a[trapped, 3] = 0

    remaining = a[:, :, 3] > 10
    body = remaining & ((r.astype(np.int16) + g.astype(np.int16) + b.astype(np.int16)) > 90) & ~cream
    keep = flood_through(remaining, body, eight=False)
    a[remaining & ~keep, 3] = 0
    return Image.fromarray(a)




def crop_opaque(im: Image.Image, pad: int = 2) -> Image.Image:
    a = np.array(im)
    ys, xs = np.where(a[:, :, 3] > 0)
    if len(xs) == 0:
        return im
    x0, x1 = max(0, int(xs.min()) - pad), min(im.width, int(xs.max()) + 1 + pad)
    y0, y1 = max(0, int(ys.min()) - pad), int(ys.max()) + 1
    return im.crop((x0, y0, x1, y1))


def majority_resize(im: Image.Image, dw: int, dh: int, alpha_cut: float = 0.45) -> Image.Image:
    src = np.array(im.convert("RGBA"))
    sh, sw = src.shape[:2]
    out = np.zeros((dh, dw, 4), np.uint8)
    y_idx = np.linspace(0, sh, dh + 1).astype(int)
    x_idx = np.linspace(0, sw, dw + 1).astype(int)
    pal = PAL
    for y in range(dh):
        y0, y1 = y_idx[y], max(y_idx[y] + 1, y_idx[y + 1])
        for x in range(dw):
            x0, x1 = x_idx[x], max(x_idx[x] + 1, x_idx[x + 1])
            block = src[y0:y1, x0:x1]
            if block.size == 0:
                continue
            alpha = block[:, :, 3]
            if (alpha > 80).mean() < alpha_cut:
                continue
            pix = block[alpha > 80][:, :3].astype(np.int16)
            rr, gg, bb = pix[:, 0], pix[:, 1], pix[:, 2]
            mag = (rr > 150) & (bb > 150) & (gg < 200) & (np.abs(rr - bb) < 110)
            if mag.mean() > 0.5:
                continue
            d = ((pix[:, None, :] - pal[None, :, :]) ** 2).sum(2)
            idx = d.argmin(1)
            counts = np.bincount(idx, minlength=len(pal))
            pick = int(counts.argmax())
            if pick == CREAM_I and (alpha <= 80).mean() > 0.35:
                continue
            out[y, x, :3] = pal[pick]
            out[y, x, 3] = 255
    return Image.fromarray(out)


def ink_edge(im: Image.Image) -> Image.Image:
    a = np.array(im)
    opaque = a[:, :, 3] > 0
    up = np.roll(opaque, 1, 0)
    up[0] = False
    dn = np.roll(opaque, -1, 0)
    dn[-1] = False
    lf = np.roll(opaque, 1, 1)
    lf[:, 0] = False
    rt = np.roll(opaque, -1, 1)
    rt[:, -1] = False
    edge = opaque & ~(up & dn & lf & rt)
    a[edge, 0] = INK[0]
    a[edge, 1] = INK[1]
    a[edge, 2] = INK[2]
    a[edge, 3] = 255
    return Image.fromarray(a)


def pack(
    src: Image.Image | str | Path,
    dw: int,
    dh: int,
    *,
    feet: bool = True,
    magenta: bool = True,
    cream_bg: bool = False,
    fit: str = "contain",
) -> Image.Image:
    im = src if isinstance(src, Image.Image) else Image.open(src)
    if magenta:
        im = chroma(im)
    else:
        im = im.convert("RGBA")
    im = flood_border(im)
    im = crop_opaque(im)
    cw, ch = im.size
    if cw < 1 or ch < 1:
        return Image.new("RGBA", (dw, dh), (0, 0, 0, 0))
    if fit == "cover":
        scale = max(dw / cw, dh / ch)
    else:
        scale = min(dw / cw, dh / ch)
    nw, nh = max(1, round(cw * scale)), max(1, round(ch * scale))
    nw, nh = min(nw, dw), min(nh, dh)
    small = majority_resize(im, nw, nh)
    small = flood_border(small)
    small = ink_edge(small)
    canvas = Image.new("RGBA", (dw, dh), (*CREAM, 255) if cream_bg else (0, 0, 0, 0))
    ox = (dw - nw) // 2
    oy = (dh - nh) if feet else (dh - nh) // 2
    if cream_bg:
        oy = max(0, (dh - nh) // 2)
    canvas.paste(small, (ox, oy), small)
    return canvas


def pack_file(src: str | Path, dest: str | Path, dw: int, dh: int, **kw) -> Image.Image:
    im = pack(src, dw, dh, **kw)
    Path(dest).parent.mkdir(parents=True, exist_ok=True)
    im.save(dest)
    return im


def main() -> None:
    p = argparse.ArgumentParser(description="Majority-vote sprite packer")
    p.add_argument("--in", dest="src", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--w", type=int, required=True)
    p.add_argument("--h", type=int, required=True)
    p.add_argument("--no-feet", action="store_true")
    p.add_argument("--cream", action="store_true")
    p.add_argument("--no-magenta", action="store_true")
    args = p.parse_args()
    pack_file(
        args.src,
        args.out,
        args.w,
        args.h,
        feet=not args.no_feet,
        magenta=not args.no_magenta,
        cream_bg=args.cream,
    )


if __name__ == "__main__":
    main()
