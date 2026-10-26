#!/usr/bin/env python3
"""Soft 32×64 cast. Idle, sit, and a 4-frame walk (down / side / up).

Row order: down, side (faces right; the game mirrors left), up.
Frame order: contact left, passing, contact right, passing.
Contact feet share a ground line. Passing rises 2px with the knees bent.
Soles sit on the cell bottom so the sprite does not float above its shadow.
"""
from pathlib import Path
from PIL import Image

OUT = Path("/workspace/public/art/gen/sprites")
INK = (26, 20, 16, 255)
BLUSH = (180, 96, 88, 255)
EYE = (22, 17, 13, 255)
WHITE = (248, 244, 236, 255)
SOLE = (22, 17, 13, 255)
W, H = 32, 64
GROUND = 62

def C(rgb):
    return (rgb[0], rgb[1], rgb[2], 255)

def dark(rgb, k=0.72):
    return C(tuple(max(0, min(255, int(c * k))) for c in rgb[:3]))

def light(rgb, k=1.16):
    return C(tuple(max(0, min(255, int(c * k))) for c in rgb[:3]))

def empty():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))

def p(im, x, y, c):
    if 0 <= x < W and 0 <= y < H and c[3]:
        im.putpixel((x, y), c)

def rect(im, x, y, w, h, c):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            p(im, xx, yy, c)

def disc(im, cx, cy, rx, ry, c):
    for y in range(cy - ry - 1, cy + ry + 2):
        for x in range(cx - rx - 1, cx + rx + 2):
            dx = (x - cx) / max(0.5, rx)
            dy = (y - cy) / max(0.5, ry)
            if dx * dx + dy * dy <= 1.05:
                p(im, x, y, c)

def outline_pass(im):
    src = im.copy()
    sp = src.load()
    for y in range(H):
        for x in range(W):
            if sp[x, y][3] > 0:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and sp[nx, ny][3] > 0:
                    im.putpixel((x, y), INK)
                    break

CAST = {
    "player": dict(skin=(224, 186, 148), hair=(74, 52, 36), shirt=(196, 120, 58), pants=(58, 40, 24), style="short", glasses=True),
    "mabel": dict(skin=(232, 196, 160), hair=(200, 192, 180), shirt=(196, 120, 58), pants=(74, 52, 36), style="bun", apron=True),
    "holt": dict(skin=(224, 186, 148), hair=(154, 148, 136), shirt=(138, 114, 90), pants=(42, 34, 27), style="short"),
    "elena": dict(skin=(196, 148, 104), hair=(26, 20, 16), shirt=(107, 143, 113), pants=(36, 56, 64), style="long"),
    "tommy": dict(skin=(196, 148, 104), hair=(90, 80, 72), shirt=(61, 92, 102), pants=(36, 56, 64), style="cap"),
    "marcus": dict(skin=(224, 186, 148), hair=(122, 58, 40), shirt=(184, 92, 74), pants=(58, 40, 24), style="short", glasses=True),
    "priya": dict(skin=(168, 108, 68), hair=(26, 20, 16), shirt=(112, 64, 96), pants=(58, 40, 24), style="braid"),
    "jordan": dict(skin=(196, 148, 104), hair=(106, 74, 40), shirt=(201, 162, 39), pants=(42, 34, 27), style="short"),
}

def leg(im, x, y, length, pants, shade):
    if length < 4:
        length = 4
    rect(im, x, y, 4, length, pants)
    for i in range(length):
        p(im, x + 3, y + i, shade)
        if i < 3:
            p(im, x, y + i, light(pants, 1.08))
    rect(im, x, y + length - 2, 4, 2, SOLE)

def arm(im, x, y, length, shirt, shade, hand):
    rect(im, x, y, 3, length, shirt)
    for i in range(length):
        p(im, x + 2, y + i, shade)
    rect(im, x, y + length - 1, 3, 3, hand)
    p(im, x, y + length, light(hand, 1.08))

def hair(im, spec, facing, top):
    h = C(spec["hair"])
    hd = dark(h, 0.62)
    hl = light(h, 1.18)
    style = spec["style"]
    if style == "cap":
        disc(im, 16, top + 6, 8, 5, C((36, 72, 118)))
        rect(im, 8, top + 7, 16, 3, C((22, 48, 86)))
        rect(im, 11, top + 5, 6, 1, C((120, 168, 196)))
        if facing != "up":
            rect(im, 8, top + 9, 16, 2, C((20, 40, 72)))
        return
    disc(im, 16, top + 7, 9, 7, h)
    rect(im, 9, top + 3, 14, 3, hd)
    rect(im, 11, top + 4, 5, 2, hl)
    if style == "bun" and facing != "side":
        disc(im, 23, top + 2, 4, 3, h)
        disc(im, 23, top + 2, 2, 1, hd)
    if style == "bun" and facing == "side":
        disc(im, 14, top + 2, 3, 3, h)
    if style == "long":
        rect(im, 6, top + 10, 3, 24, h)
        rect(im, 23, top + 10, 3, 24, h)
        rect(im, 6, top + 10, 1, 24, hd)
        rect(im, 25, top + 10, 1, 24, hd)
    if style == "braid":
        rect(im, 23, top + 11, 3, 18, h)
        for i in range(5):
            p(im, 24, top + 13 + i * 3, hd)
    if facing == "up":
        disc(im, 16, top + 9, 8, 6, hd)
        rect(im, 12, top + 6, 8, 2, hl)

def face(im, spec, facing, top):
    skin = C(spec["skin"])
    skl = light(skin, 1.1)
    skd = dark(skin, 0.76)
    if facing == "up":
        return
    if facing == "down":
        disc(im, 16, top + 11, 7, 7, skin)
        rect(im, 13, top + 6, 6, 2, skl)
        rect(im, 10, top + 12, 2, 2, BLUSH)
        rect(im, 20, top + 12, 2, 2, BLUSH)
        rect(im, 11, top + 9, 3, 2, EYE)
        rect(im, 18, top + 9, 3, 2, EYE)
        p(im, 11, top + 9, WHITE)
        p(im, 18, top + 9, WHITE)
        rect(im, 14, top + 14, 4, 1, skd)
        if spec.get("glasses"):
            rect(im, 10, top + 8, 5, 4, INK)
            rect(im, 17, top + 8, 5, 4, INK)
            rect(im, 11, top + 9, 3, 2, WHITE)
            rect(im, 18, top + 9, 3, 2, WHITE)
            p(im, 12, top + 9, EYE)
            p(im, 19, top + 9, EYE)
            p(im, 15, top + 10, INK)
            p(im, 16, top + 10, INK)
    else:
        disc(im, 19, top + 11, 6, 7, skin)
        rect(im, 21, top + 8, 3, 2, skl)
        rect(im, 21, top + 12, 2, 2, BLUSH)
        rect(im, 21, top + 9, 3, 2, EYE)
        p(im, 22, top + 9, WHITE)
        p(im, 23, top + 14, skd)
        if spec.get("glasses"):
            rect(im, 20, top + 8, 5, 4, INK)
            rect(im, 21, top + 9, 3, 2, WHITE)
            p(im, 22, top + 9, EYE)

def torso(im, spec, facing, top):
    shirt = C(spec["shirt"])
    shd = dark(shirt, 0.62)
    shl = light(shirt, 1.14)
    # Shoulder-wider, waist-narrower. Not a hard rectangle.
    y0 = top + 18
    h = 16
    for i in range(h):
        if facing == "side":
            half = 5 if i < 3 else 4 if i < 12 else 3
            x = 15 - 1
            w = half + 4
        else:
            flare = 1 if i < 3 else 0 if i < 11 else -1
            w = 14 + flare * 2
            x = 16 - w // 2
        rect(im, x, y0 + i, w, 1, shirt)
        p(im, x, y0 + i, shl)
        p(im, x + 1, y0 + i, shl)
        p(im, x + w - 1, y0 + i, shd)
        if facing == "up" and 3 < i < 13:
            p(im, 16, y0 + i, shd)
    if spec.get("apron") and facing != "up":
        ax = 14 if facing == "side" else 12
        aw = 6 if facing == "side" else 8
        rect(im, ax, y0 + 5, aw, 12, WHITE)
        rect(im, ax, y0 + 5, aw, 2, C((220, 200, 176)))
        p(im, ax + aw - 1, y0 + 8, C((180, 96, 88)))

def limbs_down(im, spec, pose, top, ground):
    skin = C(spec["skin"])
    hand = light(skin, 1.06)
    shirt = C(spec["shirt"])
    shd = dark(shirt, 0.58)
    pants = C(spec["pants"])
    pd = dark(pants, 0.72)
    hip = top + 32
    shoulder = top + 18
    span = ground - hip
    if pose == "idle":
        arms = [(5, shoulder + 1, 12), (24, shoulder + 1, 12)]
        legs = [(10, hip, span), (18, hip, span)]
    elif pose == "L":
        arms = [(4, shoulder - 3, 9), (24, shoulder + 5, 14)]
        legs = [(6, hip, span), (19, hip, span - 8)]
    elif pose == "R":
        arms = [(4, shoulder + 5, 14), (24, shoulder - 3, 9)]
        legs = [(8, hip, span - 8), (20, hip, span)]
    elif pose == "pass":
        arms = [(5, shoulder - 1, 11), (23, shoulder + 3, 13)]
        legs = [(12, hip, span - 2), (17, hip, span - 2)]
    else:
        arms = [(5, shoulder + 3, 13), (23, shoulder - 1, 11)]
        legs = [(11, hip, span - 2), (17, hip, span - 2)]
    for x, y, ln in legs:
        leg(im, x, y, ln, pants, pd)
    for x, y, ln in arms:
        arm(im, x, y, ln, shirt, shd, hand)

def limbs_side(im, spec, pose, top, ground):
    skin = C(spec["skin"])
    hand = light(skin, 1.06)
    shirt = C(spec["shirt"])
    shd = dark(shirt, 0.55)
    pants = C(spec["pants"])
    pd = dark(pants, 0.7)
    hip = top + 32
    shoulder = top + 19
    span = ground - hip
    # Back limb first. Pose L steps forward (to the right).
    if pose == "idle":
        back = (12, hip, span - 1)
        front = (17, hip, span)
        a = (20, shoulder, 12)
    elif pose == "L":
        back = (11, hip, span - 8)
        front = (19, hip, span)
        a = (22, shoulder + 4, 14)
    elif pose == "R":
        back = (18, hip, span)
        front = (12, hip, span - 7)
        a = (18, shoulder - 4, 9)
    else:
        back = (14, hip, span - 3)
        front = (16, hip, span - 1)
        a = (20, shoulder + (1 if pose == "pass" else -1), 12)
    leg(im, back[0], back[1], back[2], pd, dark(pants, 0.55))
    arm(im, 12, shoulder + 2, 8, shd, dark(shirt, 0.48), dark(skin, 0.9))
    leg(im, front[0], front[1], front[2], pants, pd)
    arm(im, a[0], a[1], a[2], shirt, shd, hand)

def body(im, spec, facing, pose, sit=False):
    rise = 2 if pose in ("pass", "pass2") and not sit else 0
    top = (16 if sit else 8) - rise
    ground = GROUND - rise
    skin = C(spec["skin"])
    if sit:
        # Folded legs in front, feet still on the ground line.
        pants = C(spec["pants"])
        pd = dark(pants, 0.72)
        rect(im, 8, top + 34, 16, 5, pants)
        rect(im, 20, top + 36, 8, 4, pd)
        rect(im, 24, top + 38, 4, max(4, ground - (top + 38)), pants)
        rect(im, 24, ground - 2, 4, 2, SOLE)
        torso(im, spec, "down", top)
        rect(im, 14, top + 16, 4, 3, skin)
        hair(im, spec, "down", top)
        face(im, spec, "down", top)
        return
    if facing == "side":
        limbs_side(im, spec, pose, top, ground)
    else:
        limbs_down(im, spec, pose, top, ground)
    torso(im, spec, facing, top)
    rect(im, 14 if facing != "side" else 16, top + 16, 4, 3, skin)
    hair(im, spec, facing, top)
    face(im, spec, facing, top)

def stand(spec, facing, pose):
    im = empty()
    body(im, spec, facing, pose)
    outline_pass(im)
    return im

def sit_of(spec):
    im = empty()
    body(im, spec, "down", "idle", sit=True)
    outline_pass(im)
    return im

POSES = ("L", "pass", "R", "pass2")

def sheet(spec):
    im = Image.new("RGBA", (128, 192), (0, 0, 0, 0))
    for r, facing in enumerate(("down", "side", "up")):
        for f, pose in enumerate(POSES):
            im.paste(stand(spec, facing, pose), (f * 32, r * 64))
    return im

def _opaque_rows(cell):
    px = cell.load()
    rows = []
    for y in range(H):
        if any(px[x, y][3] > 0 for x in range(W)):
            rows.append(y)
    return rows

def _check(name, idle, walk):
    rows = _opaque_rows(idle)
    if not rows or rows[-1] < GROUND - 2:
        raise SystemExit(f"{name} idle floats, sole row {rows[-1] if rows else None}")
    if rows[0] > 12:
        raise SystemExit(f"{name} idle head too low")
    for r, facing in enumerate(("down", "side", "up")):
        counts = []
        soles = []
        for f in range(4):
            cell = walk.crop((f * 32, r * 64, (f + 1) * 32, (r + 1) * 64))
            bb = cell.getbbox()
            if not bb:
                raise SystemExit(f"{name} {facing} f{f} empty")
            n = sum(1 for px in cell.getdata() if px[3] > 0)
            counts.append(n)
            soles.append(_opaque_rows(cell)[-1])
            if n < 500:
                raise SystemExit(f"{name} {facing} f{f} too small ({n})")
        if max(counts) - min(counts) < 8 and facing != "up":
            raise SystemExit(f"{name} {facing} frames barely differ {counts}")
        # Contact frames (0 and 2) plant. Passing (1 and 3) may rise.
        if soles[0] < GROUND - 2 or soles[2] < GROUND - 2:
            raise SystemExit(f"{name} {facing} contact feet float {soles}")

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, spec in CAST.items():
        idle = stand(spec, "down", "idle")
        walk = sheet(spec)
        _check(name, idle, walk)
        idle.save(OUT / f"{name}_idle_32.png")
        sit_of(spec).save(OUT / f"{name}_sit.png")
        walk.save(OUT / f"{name}_walk4.png")
        print(name, "ok")

if __name__ == "__main__":
    main()
