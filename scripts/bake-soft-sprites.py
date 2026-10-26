#!/usr/bin/env python3
"""Chibi 32×64 cast. Idle, sit, and a 4-frame walk (down / side / up).

The idle pose is the base: oversized round head, arms that leave the torso,
two shade tones per cloth area, warm rims instead of a hard black contour.
Player copper and brown stay on the clusters tintPlayer matches.
"""
from pathlib import Path
from PIL import Image

OUT = Path("/workspace/public/art/gen/sprites")
# Warm dark, not pure black. Glasses and pupils only.
INK = (36, 24, 28, 255)
BLUSH = (186, 102, 96, 255)
EYE = (32, 22, 26, 255)
WHITE = (248, 242, 230, 255)
SOLE = (48, 30, 22, 255)
W, H = 32, 64
GROUND = 62

# Locked so tintPlayer's near() checks still find hoodie and hair.
COPPER = (196, 120, 58)
COPPER_D = (121, 74, 36)
COPPER_L = (223, 136, 66)
HAIR_P = (74, 52, 36)
HAIR_PD = (46, 32, 22)
HAIR_PL = (118, 90, 64)

def C(rgb):
    return (rgb[0], rgb[1], rgb[2], 255)

def dark(rgb, k=0.7):
    return C(tuple(max(0, min(255, int(c * k))) for c in rgb[:3]))

def light(rgb, k=1.14):
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
            if dx * dx + dy * dy <= 1.02:
                p(im, x, y, c)

def is_skin(c):
    r, g, b, a = c
    return a > 200 and r > 155 and g > 115 and b > 85 and r > b + 12 and r - g < 90

def shirt_tones(spec):
    base = spec["shirt"]
    if base == COPPER:
        return C(COPPER), C(COPPER_D), C(COPPER_L)
    return C(base), dark(base, 0.62), light(base, 1.16)

def hair_tones(spec):
    base = spec["hair"]
    if base == HAIR_P:
        return C(HAIR_P), C(HAIR_PD), C(HAIR_PL)
    return C(base), dark(base, 0.62), light(base, 1.2)

def soft_rim(im):
    """Warm rim taken from the real neighbor. Skip skin. Do not fill a 1px corridor."""
    src = im.copy()
    sp = src.load()
    for y in range(H):
        for x in range(W):
            if sp[x, y][3] > 0:
                continue
            nbs = []
            if x > 0 and sp[x - 1, y][3] > 200:
                nbs.append(sp[x - 1, y])
            if x < W - 1 and sp[x + 1, y][3] > 200:
                nbs.append(sp[x + 1, y])
            if y > 0 and sp[x, y - 1][3] > 200:
                nbs.append(sp[x, y - 1])
            if y < H - 1 and sp[x, y + 1][3] > 200:
                nbs.append(sp[x, y + 1])
            if len(nbs) == 0:
                continue
            # A pixel with opaque on both sides is a gap. Leave it open so arms stay apart.
            horiz = (x > 0 and sp[x - 1, y][3] > 200) and (x < W - 1 and sp[x + 1, y][3] > 200)
            vert = (y > 0 and sp[x, y - 1][3] > 200) and (y < H - 1 and sp[x, y + 1][3] > 200)
            if horiz or vert:
                continue
            nb = next((c for c in nbs if not is_skin(c)), None)
            if nb is None:
                continue
            r, g, b, _ = nb
            im.putpixel((x, y), (
                max(0, int(r * 0.72)),
                max(0, int(g * 0.66)),
                max(0, int(b * 0.60)),
                255,
            ))

def cloth(im, x, y, w, h, base, shadow, hi, round_top=True):
    if w < 3 or h < 3:
        rect(im, x, y, w, h, base)
        return
    for i in range(h):
        inset = 1 if round_top and i < 2 else 0
        if i == h - 1:
            inset = max(inset, 1)
        rect(im, x + inset, y + i, w - inset * 2, 1, base)
        p(im, x + inset, y + i, hi)
        p(im, x + inset + 1, y + i, hi)
        p(im, x + w - 1 - inset, y + i, shadow)
        if i > h - 4:
            p(im, x + inset + 2, y + i, shadow)

def leg(im, x, y, length, pants, shade, hi):
    length = max(6, length)
    cloth(im, x, y, 4, length - 2, pants, shade, hi, round_top=False)
    rect(im, x, y + length - 2, 4, 2, SOLE)
    p(im, x, y + length - 2, hi)

def hang_arm(im, side, y, length, base, shadow, hi, hand, swing=0):
    """side -1 left, +1 right. Shoulder touches the torso; the forearm hangs clear."""
    y += swing
    length = max(7, length)
    if side < 0:
        ax, bridge = 3, 7
        outer = ax
    else:
        ax, bridge = 26, 22
        outer = ax + 2
    # 3px shoulder bridge so the arm is attached, then a gap along the forearm.
    rect(im, min(ax, bridge), y, abs(bridge - ax) + 3, 3, base)
    rect(im, ax, y + 2, 3, length, base)
    for i in range(length):
        p(im, outer, y + 2 + i, shadow)
        p(im, ax + 1, y + 3 + i, hi if i < length // 2 else base)
    rect(im, ax, y + 1 + length, 3, 3, hand)
    p(im, ax + 1, y + 2 + length, light(hand, 1.06))
    p(im, outer, y + 1 + length, dark(hand, 0.82))

def hair(im, spec, facing, y0):
    h, hd, hl = hair_tones(spec)
    style = spec["style"]
    if style == "cap":
        disc(im, 16, y0 + 8, 10, 7, C((32, 64, 110)))
        disc(im, 16, y0 + 6, 8, 4, C((48, 92, 148)))
        rect(im, 8, y0 + 10, 16, 3, C((22, 44, 82)))
        rect(im, 11, y0 + 5, 5, 2, C((140, 186, 214)))
        if facing == "up":
            disc(im, 16, y0 + 10, 8, 6, C((20, 40, 72)))
        return
    disc(im, 16, y0 + 10, 11, 10, h)
    # Volume sits on the rim of the hair, not a flat dark cap.
    px = im.load()
    for y in range(y0 + 2, y0 + 20):
        for x in range(4, 28):
            if px[x, y][:3] != h[:3]:
                continue
            if x >= 20 and y >= y0 + 8:
                px[x, y] = hd
            elif x <= 13 and y <= y0 + 9:
                px[x, y] = hl
    if facing == "up":
        for y in range(y0 + 6, y0 + 16):
            for x in range(10, 22):
                if px[x, y][3] > 200:
                    px[x, y] = hd
        rect(im, 12, y0 + 8, 5, 2, hl)
        return
    if style == "bun":
        disc(im, 24, y0 + 4, 4, 4, h)
        disc(im, 24, y0 + 3, 2, 2, hd)
        p(im, 23, y0 + 3, hl)
    if style == "long":
        rect(im, 6, y0 + 14, 3, 22, h)
        rect(im, 23, y0 + 14, 3, 22, h)
        rect(im, 6, y0 + 14, 1, 22, hd)
        rect(im, 25, y0 + 14, 1, 22, hd)
        rect(im, 7, y0 + 14, 1, 8, hl)
    if style == "braid":
        rect(im, 23, y0 + 16, 2, 18, h)
        for i in range(5):
            p(im, 23, y0 + 18 + i * 3, hd)
            p(im, 24, y0 + 19 + i * 3, hl)

def face(im, spec, facing, y0):
    skin = C(spec["skin"])
    skl = light(skin, 1.12)
    skd = dark(skin, 0.78)
    if facing == "up":
        return
    if facing == "down":
        disc(im, 16, y0 + 14, 8, 8, skin)
        disc(im, 14, y0 + 12, 4, 3, skl)
        rect(im, 10, y0 + 15, 2, 2, BLUSH)
        rect(im, 20, y0 + 15, 2, 2, BLUSH)
        rect(im, 11, y0 + 13, 3, 2, EYE)
        rect(im, 18, y0 + 13, 3, 2, EYE)
        p(im, 11, y0 + 13, WHITE)
        p(im, 18, y0 + 13, WHITE)
        rect(im, 14, y0 + 18, 4, 1, skd)
        p(im, 16, y0 + 19, skd)
        rect(im, 13, y0 + 20, 6, 1, skd)
        if spec.get("glasses"):
            for x0 in (10, 17):
                rect(im, x0, y0 + 12, 5, 1, INK)
                rect(im, x0, y0 + 15, 5, 1, INK)
                p(im, x0, y0 + 13, INK)
                p(im, x0, y0 + 14, INK)
                p(im, x0 + 4, y0 + 13, INK)
                p(im, x0 + 4, y0 + 14, INK)
            p(im, 15, y0 + 13, INK)
            p(im, 16, y0 + 13, INK)
            rect(im, 11, y0 + 13, 3, 2, WHITE)
            rect(im, 18, y0 + 13, 3, 2, WHITE)
            p(im, 12, y0 + 13, EYE)
            p(im, 19, y0 + 13, EYE)
    else:
        disc(im, 18, y0 + 14, 7, 8, skin)
        rect(im, 18, y0 + 11, 4, 2, skl)
        rect(im, 21, y0 + 15, 2, 2, BLUSH)
        rect(im, 20, y0 + 13, 3, 2, EYE)
        p(im, 21, y0 + 13, WHITE)
        p(im, 22, y0 + 18, skd)
        rect(im, 19, y0 + 20, 4, 1, skd)
        if spec.get("glasses"):
            rect(im, 19, y0 + 12, 5, 1, INK)
            rect(im, 19, y0 + 15, 5, 1, INK)
            p(im, 19, y0 + 13, INK)
            p(im, 19, y0 + 14, INK)
            p(im, 23, y0 + 13, INK)
            p(im, 23, y0 + 14, INK)
            rect(im, 20, y0 + 13, 3, 2, WHITE)
            p(im, 21, y0 + 13, EYE)

def torso(im, spec, facing, y0):
    base, shadow, hi = shirt_tones(spec)
    if facing == "side":
        cloth(im, 13, y0 + 24, 10, 14, base, shadow, hi)
    else:
        cloth(im, 10, y0 + 24, 12, 14, base, shadow, hi)
        # soft center fold, second shade, still in the dark copper cluster for the player
        for i in range(4, 11):
            p(im, 16, y0 + 24 + i, shadow)
    if spec.get("apron") and facing != "up":
        ax = 15 if facing == "side" else 12
        aw = 6 if facing == "side" else 8
        rect(im, ax, y0 + 29, aw, 10, WHITE)
        rect(im, ax, y0 + 29, aw, 2, C((214, 196, 170)))
        p(im, ax + aw - 2, y0 + 34, BLUSH)

def limbs(im, spec, facing, pose, y0, ground):
    skin = C(spec["skin"])
    hand = light(skin, 1.05)
    base, shadow, hi = shirt_tones(spec)
    pants = C(spec["pants"])
    pd = dark(pants, 0.68)
    pl = light(pants, 1.12)
    hip = y0 + 36
    span = max(8, ground - hip)
    shoulder = y0 + 24
    if facing == "side":
        if pose == "idle":
            back, front, swing = (12, hip, span - 1), (17, hip, span), 0
        elif pose == "L":
            back, front, swing = (11, hip, span - 8), (19, hip, span), 4
        elif pose == "R":
            back, front, swing = (18, hip, span), (12, hip, span - 7), -3
        else:
            back, front, swing = (14, hip, span - 3), (16, hip, span - 1), 1 if pose == "pass" else -1
        leg(im, back[0], back[1], back[2], pd, dark(pants, 0.55), pd)
        hang_arm(im, +1, shoulder, 8, shadow, dark(spec["shirt"], 0.5), shadow, dark(skin, 0.9), swing=1)
        leg(im, front[0], front[1], front[2], pants, pd, pl)
        hang_arm(im, +1, shoulder, 11, base, shadow, hi, hand, swing=swing)
        return
    if pose == "idle":
        legs = [(11, hip, span), (17, hip, span)]
        swings = (0, 0)
    elif pose == "L":
        legs = [(8, hip, span), (18, hip, max(8, span - 8))]
        swings = (-3, 4)
    elif pose == "R":
        legs = [(10, hip, max(8, span - 8)), (19, hip, span)]
        swings = (4, -3)
    elif pose == "pass":
        legs = [(12, hip, span - 2), (16, hip, span - 2)]
        swings = (-1, 2)
    else:
        legs = [(12, hip, span - 2), (16, hip, span - 2)]
        swings = (2, -1)
    for x, y, ln in legs:
        leg(im, x, y, ln, pants, pd, pl)
    hang_arm(im, -1, shoulder, 11, base, shadow, hi, hand, swing=swings[0])
    hang_arm(im, +1, shoulder, 11, base, shadow, hi, hand, swing=swings[1])

def body(im, spec, facing, pose, sit=False):
    rise = 2 if pose in ("pass", "pass2") and not sit else 0
    drop = 6 if sit else 0
    y0 = drop - rise
    ground = GROUND - rise
    skin = C(spec["skin"])
    skd = dark(skin, 0.8)
    if sit:
        pants = C(spec["pants"])
        pd = dark(pants, 0.7)
        pl = light(pants, 1.1)
        rect(im, 9, y0 + 40, 14, 5, pants)
        rect(im, 9, y0 + 40, 2, 5, pl)
        rect(im, 19, y0 + 42, 8, 4, pd)
        rect(im, 23, y0 + 44, 4, max(4, ground - (y0 + 44)), pants)
        rect(im, 23, ground - 2, 4, 2, SOLE)
        limbs(im, spec, "down", "idle", y0, y0 + 40)
        torso(im, spec, "down", y0)
        rect(im, 14, y0 + 22, 4, 4, skin)
        rect(im, 14, y0 + 25, 4, 1, skd)
        hair(im, spec, "down", y0)
        face(im, spec, "down", y0)
        return
    limbs(im, spec, facing, pose, y0, ground)
    torso(im, spec, facing, y0)
    if facing == "side":
        rect(im, 16, y0 + 22, 4, 4, skin)
        p(im, 18, y0 + 25, skd)
    else:
        rect(im, 14, y0 + 22, 4, 4, skin)
        rect(im, 14, y0 + 25, 4, 1, skd)
        # ears, just outside the hair mass
        if facing == "down":
            disc(im, 6, y0 + 15, 2, 2, skin)
            disc(im, 26, y0 + 15, 2, 2, skin)
            p(im, 5, y0 + 16, skd)
            p(im, 27, y0 + 16, skd)
    hair(im, spec, facing, y0)
    face(im, spec, facing, y0)

CAST = {
    "player": dict(skin=(224, 186, 148), hair=HAIR_P, shirt=COPPER, pants=(58, 40, 24), style="short", glasses=True),
    "mabel": dict(skin=(232, 196, 160), hair=(200, 192, 180), shirt=COPPER, pants=(74, 52, 36), style="bun", apron=True),
    "holt": dict(skin=(224, 186, 148), hair=(154, 148, 136), shirt=(138, 114, 90), pants=(42, 34, 27), style="short"),
    "elena": dict(skin=(196, 148, 104), hair=(42, 32, 28), shirt=(107, 143, 113), pants=(36, 56, 64), style="long"),
    "tommy": dict(skin=(196, 148, 104), hair=(90, 80, 72), shirt=(61, 92, 102), pants=(36, 56, 64), style="cap"),
    "marcus": dict(skin=(224, 186, 148), hair=(122, 58, 40), shirt=(184, 92, 74), pants=(58, 40, 24), style="short", glasses=True),
    "priya": dict(skin=(168, 108, 68), hair=(42, 32, 28), shirt=(112, 64, 96), pants=(58, 40, 24), style="braid"),
    "jordan": dict(skin=(196, 148, 104), hair=(106, 74, 40), shirt=(201, 162, 39), pants=(42, 34, 27), style="short"),
}

def stand(spec, facing, pose):
    im = empty()
    body(im, spec, facing, pose)
    soft_rim(im)
    return im

def sit_of(spec):
    im = empty()
    body(im, spec, "down", "idle", sit=True)
    soft_rim(im)
    return im

POSES = ("L", "pass", "R", "pass2")

def sheet(spec):
    im = Image.new("RGBA", (128, 192), (0, 0, 0, 0))
    for r, facing in enumerate(("down", "side", "up")):
        for f, pose in enumerate(POSES):
            im.paste(stand(spec, facing, pose), (f * 32, r * 64))
    return im

def _rows(cell):
    px = cell.load()
    return [y for y in range(H) if any(px[x, y][3] > 0 for x in range(W))]

def _width_at(cell, y):
    px = cell.load()
    xs = [x for x in range(W) if 0 <= y < H and px[x, y][3] > 0]
    return (xs[-1] - xs[0] + 1) if xs else 0

def _gap_empty(cell):
    px = cell.load()
    total = empty_n = 0
    for y in range(34, 43):
        for x in (7, 8, 23, 24):
            total += 1
            if px[x, y][3] == 0:
                empty_n += 1
    return empty_n, total

def _check(name, idle, walk):
    rows = _rows(idle)
    if not rows or rows[-1] < GROUND - 2:
        raise SystemExit(f"{name} idle floats, sole {rows[-1] if rows else None}")
    head_w = _width_at(idle, 14)
    torso_xs = [x for x in range(9, 23) if idle.load()[x, 32][3] > 0]
    body_w = (torso_xs[-1] - torso_xs[0] + 1) if torso_xs else 0
    if head_w < body_w + 4:
        raise SystemExit(f"{name} head {head_w}px not wider than torso {body_w}px")
    empty_n, total = _gap_empty(idle)
    if empty_n < int(total * 0.55):
        raise SystemExit(f"{name} arms merged, gap {empty_n}/{total}")
    for r, facing in enumerate(("down", "side", "up")):
        counts = []
        soles = []
        for f in range(4):
            cell = walk.crop((f * 32, r * 64, (f + 1) * 32, (r + 1) * 64))
            if cell.getbbox() is None:
                raise SystemExit(f"{name} {facing} f{f} empty")
            n = sum(1 for px in cell.getdata() if px[3] > 0)
            counts.append(n)
            soles.append(_rows(cell)[-1])
            if n < 500:
                raise SystemExit(f"{name} {facing} f{f} too small ({n})")
        if max(counts) - min(counts) < 8 and facing == "down":
            raise SystemExit(f"{name} down frames barely differ {counts}")
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
        hw, bw = _width_at(idle, 14), _width_at(idle, 32)
        print(f"{name} ok head {hw} body {bw} gap {_gap_empty(idle)}")

if __name__ == "__main__":
    main()
