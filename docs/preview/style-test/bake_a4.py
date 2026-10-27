#!/usr/bin/env python3
"""A4 walk-cycle preview. Does not touch the game.

Each frame is drawn from scratch. Nothing is copied off frame 0 except the
documented mirrors: down/up frame 2 is frame 0 flipped, frame 3 is frame 1
flipped, and left is side flipped.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bake_a2 as b
import bake_a3 as a3

OUT = Path(__file__).resolve().parent
W, H = 26, 36
O = b.O
HL, HB, HD = b.HAIR["player"]
SL, SB, SD = b.SKIN["player"]
CL, CB, CD = b.SHIRT["player"]
PL, PB, PD = b.PANTS["player"]
FL, FB, FD = b.BOOT
EYE, WHITE, MOUTH, BLUSH = b.EYE, b.WHITE, b.MOUTH, b.BLUSH

# Side-view stride. Body advances STEP px per frame, so a foot that goes
# from +3 to 0 to -3 stays on one ground point.
CX = 12
STEP = 3
SOLE = 33  # side-view boots that are on the ground

b.FONT["w"] = ["101", "101", "111", "111", "101"]
b.FONT["f"] = ["111", "100", "110", "100", "100"]


def blank() -> np.ndarray:
    return np.zeros((H, W, 4), np.uint8)


def pix(im, x, y, col):
    b.px(im, x, y, col)


def rect(im, x, y, w, h, col):
    b.fill(im, x, y, w, h, col)


def blit(im, rows, x0, y0):
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            col = b.color_of("player", ch, x, y)
            if col is not None:
                pix(im, x0 + x, y0 + y, col)


def head_rows():
    g = b.base_grid()
    b.edit_grid(g, "player")
    return ["".join(r) for r in g[:12]]


HEAD = head_rows()
UP_HEAD = []
for i, row in enumerate(HEAD):
    chars = []
    for ch in row:
        if ch in "SEWMB":
            chars.append("h" if i <= 2 else "H")
        else:
            chars.append(ch)
    UP_HEAD.append("".join(chars))


def finish(im) -> np.ndarray:
    b.add_outline(im)
    return im


def restore_highlights(im) -> None:
    """Keep the catch-light on the top-right of each eye after a horizontal flip."""
    h, w = im.shape[:2]
    seen = set()
    for y in range(h):
        for x in range(w - 1):
            if (x, y) in seen:
                continue
            here = tuple(int(v) for v in im[y, x, :3])
            nxt = tuple(int(v) for v in im[y, x + 1, :3])
            if im[y, x, 3] and im[y, x + 1, 3] and here == WHITE and nxt == EYE:
                im[y, x, :3] = EYE
                im[y, x + 1, :3] = WHITE
                seen.add((x + 1, y))


def mirror(im) -> np.ndarray:
    return np.fliplr(im).copy()


# --- down / up ----------------------------------------------------------------

# Even canvas, flip is x -> 25-x. Legs, arms and the head sit on that axis
# so a mirrored pose stays in the same two columns instead of stepping sideways.
OX = 5
LEFT_LEG = 8          # pants 8..10, boot flares out to 7
RIGHT_LEG = 15        # pants 15..17, boot flares out to 18
LEFT_ARM = 5
RIGHT_ARM = 19


def draw_front_body(im, hy, left_up, back):
    rows = UP_HEAD if back else HEAD
    blit(im, rows, OX, hy)
    # The glasses bridge was one pixel right of center. Make it two so the
    # head silhouette mirrors.
    pix(im, OX + 7, hy + 7, O)
    pix(im, OX + 8, hy + 7, O)
    top = hy + 13
    if left_up:
        rect(im, 8, top, 2, 5, CL)
        rect(im, 10, top, 6, 6, CB)
        rect(im, 16, top, 2, 7, CD)
    else:
        rect(im, 8, top, 2, 7, CL)
        rect(im, 10, top, 6, 6, CB)
        rect(im, 16, top, 2, 5, CD)

    def arm(x, up, light):
        y0 = top if up else top + 1
        rect(im, x, y0, 2, 4, CL if light else CD)
        rect(im, x, y0 + 4, 2, 2, SL if light else SD)

    arm(LEFT_ARM, left_up, True)
    arm(RIGHT_ARM, not left_up, False)


def draw_front_leg(im, x, hip, sole, light, outward):
    """Vertical leg. `x` is the pants column and does not change between frames."""
    boot_top = sole - 2
    tone = PL if light else PB
    dark = PB if light else PD
    rect(im, x, hip, 3, max(0, boot_top - hip), tone)
    rect(im, x + 2, hip, 1, max(0, boot_top - hip), dark)
    boot_x = x - 1 if outward < 0 else x
    rect(im, boot_x, boot_top, 4, 2, FL if light else FB)
    rect(im, boot_x, sole, 4, 1, FD)


def paint_front(passing, left_planted, back) -> np.ndarray:
    im = blank()
    hy = 1 if passing else 2
    left_up = left_planted
    draw_front_body(im, hy, left_up, back)
    hip = hy + 19
    if not passing:
        planted, trail = SOLE + 1, SOLE - 1
    else:
        planted, trail = SOLE, SOLE - 1
    if left_planted:
        draw_front_leg(im, LEFT_LEG, hip, planted, True, -1)
        draw_front_leg(im, RIGHT_LEG, hip, trail, False, +1)
    else:
        draw_front_leg(im, RIGHT_LEG, hip, planted, False, +1)
        draw_front_leg(im, LEFT_LEG, hip, trail, True, -1)
    return finish(im)


def front_cycle(back=False):
    return [
        paint_front(False, True, back),
        paint_front(True, True, back),
        paint_front(False, False, back),
        paint_front(True, False, back),
    ]


# --- side (facing right) ------------------------------------------------------

def draw_side_head(im, hy):
    """Oval, 9px of fill. Outline brings it to about 11. Not a cone."""
    widths = (5, 7, 9, 9, 9, 9, 9, 9, 9, 9, 7, 5)
    center = CX
    for i, w in enumerate(widths):
        x0 = center - w // 2
        for dx in range(w):
            x = x0 + dx
            if dx < w // 2:
                if i <= 1 and dx <= 1:
                    col = HL
                elif dx >= w // 2 - 2 or i >= 8:
                    col = HD
                else:
                    col = HB
            else:
                col = SL if i <= 2 else SD if i >= 9 else SB
            pix(im, x, hy + i, col)
    # Face on the front half. 2x2 eye, highlight on the top-right. No nose bar.
    ex, ey = center + 2, hy + 5
    pix(im, ex, ey, EYE)
    pix(im, ex + 1, ey, WHITE)
    pix(im, ex, ey + 1, EYE)
    pix(im, ex + 1, ey + 1, EYE)
    pix(im, ex, ey + 2, BLUSH)
    pix(im, ex + 1, ey + 2, BLUSH)
    pix(im, ex, ey + 3, MOUTH)
    pix(im, ex + 1, ey + 3, MOUTH)
    # Glasses: a rim on the front of the eye, not a bar.
    pix(im, ex + 2, ey, O)
    pix(im, ex + 2, ey + 1, O)
    # 1px ear on the back edge.
    ear_x = center - widths[6] // 2 - 1
    pix(im, ear_x, hy + 6, SB)


def draw_side_torso(im, hy):
    top = hy + 12
    rect(im, CX - 3, top, 3, 7, CL)
    rect(im, CX, top, 2, 7, CB)
    rect(im, CX + 2, top, 2, 7, CD)


def draw_side_arm(im, hy, forward):
    """2px swing in front of the torso. Never overlaps the head or the shirt."""
    x = 19 if forward else 17
    top = hy + 13
    rect(im, x, top, 2, 4, CL if not forward else CB)
    rect(im, x, top + 4, 2, 2, SL)


def draw_side_leg(im, left, hip, sole, dark, extra):
    """Vertical shin and boot. `extra` is +1 toe or -1 heel, away from the other foot."""
    tone = PD if dark else PB
    boot = FD if dark else FB
    edge = FB if dark else FL
    top = sole - 2
    if top > hip:
        rect(im, left, hip, 3, top - hip, tone)
        pix(im, left, hip, edge if not dark else tone)
    rect(im, left, top, 3, 2, boot)
    rect(im, left, sole, 3, 1, boot)
    pix(im, left, top, edge)
    if extra > 0:
        pix(im, left + 3, sole, boot)
    elif extra < 0:
        pix(im, left - 1, sole, boot)


def paint_side(phase: int) -> np.ndarray:
    im = blank()
    passing = phase in (1, 3)
    hy = 1 if passing else 2
    draw_side_head(im, hy)
    draw_side_torso(im, hy)
    draw_side_arm(im, hy, forward=passing)
    hip = hy + 19
    # Near foot (light) core left edge: 14, 11, 8 while it is planted, then it lifts in front.
    # Far foot (dark) is the other one. Stride between the two cores is 6px.
    # Passing frame 1 lifts the far foot behind. Frame 3 lifts the near foot in front.
    if phase == 0:
        draw_side_leg(im, 14, hip, SOLE, False, +1)
        draw_side_leg(im, 8, hip, SOLE, True, 0)
    elif phase == 1:
        draw_side_leg(im, 11, hip, SOLE, False, +1)
        draw_side_leg(im, 5, hip, SOLE - 2, True, 0)
    elif phase == 2:
        draw_side_leg(im, 8, hip, SOLE, False, -1)
        draw_side_leg(im, 14, hip, SOLE, True, 0)
    else:
        draw_side_leg(im, 16, hip, SOLE - 2, False, +1)
        draw_side_leg(im, 11, hip, SOLE, True, 0)
    rect(im, CX - 3, hip, 7, 1, PB)
    return finish(im)


def side_cycle():
    frames = [paint_side(i) for i in range(4)]
    return frames


# --- measures -----------------------------------------------------------------

def top_row(im) -> int:
    ys = np.where(im[:, :, 3] > 0)[0]
    return int(ys.min())


def light_core(im, sole_row):
    """Left edge of the near (light) boot on its upper row. Ignores the toe and the heel."""
    y = sole_row - 1
    xs = [
        x
        for x in range(W)
        if im[y, x, 3] and tuple(int(v) for v in im[y, x, :3]) in (FL, FB)
    ]
    if not xs:
        return None
    return min(xs)


def assert_cycle(down, up, side, left):
    # Bob: head+torso rise 1px on passing frames. Shape of the head does not change.
    for name, frames in ("down", down), ("up", up), ("side", side):
        tops = [top_row(fr) for fr in frames]
        rel = [t - tops[0] for t in tops]
        if rel != [0, -1, 0, -1]:
            raise SystemExit(f"{name} head offsets {rel}, want [0, -1, 0, -1]")
        t0 = tops[0]
        if not np.array_equal(frames[0][t0:t0 + 12], frames[1][t0 - 1:t0 + 11]):
            raise SystemExit(f"{name} head shape changed between contact and passing")
    # Mirror test. Highlights are put back on the top-right, so compare alpha.
    for name, frames in ("down", down), ("up", up):
        for i, j in ((0, 2), (1, 3)):
            if not np.array_equal(frames[j][:, :, 3], np.fliplr(frames[i][:, :, 3])):
                raise SystemExit(f"{name} frame {j} is not the mirror of frame {i}")
    for i, fr in enumerate(left):
        if not np.array_equal(fr[:, :, 3], np.fliplr(side[i][:, :, 3])):
            raise SystemExit(f"left frame {i} was not a flip of side")
    # Down/up feet stay in their columns.
    allowed = set(range(LEFT_LEG - 1, LEFT_LEG + 4)) | set(range(RIGHT_LEG - 1, RIGHT_LEG + 4))
    for name, frames in ("down", down), ("up", up):
        for i, fr in enumerate(frames):
            ys, xs = np.where(fr[:, :, 3] > 0)
            for y, x in zip(ys, xs):
                col = tuple(int(v) for v in fr[y, x, :3])
                if col in (FL, FB, FD, PL, PB, PD) and int(x) not in allowed:
                    raise SystemExit(f"{name} frame {i} kicked a foot out to x={x}")
    # Side stride. The near boot's core (not its toe) steps 14, 11, 8.
    # Body motion of +3px per frame keeps that boot on one ground point.
    cores = [light_core(side[i], SOLE if i != 3 else SOLE - 2) for i in range(4)]
    if cores[0] != 14 or cores[1] != 11 or cores[2] != 8:
        raise SystemExit(f"near-boot cores {cores}, want 14, 11, 8 while planted")
    world0 = cores[0]
    world1 = cores[1] + STEP
    world2 = cores[2] + 2 * STEP
    if not (world0 == world1 == world2):
        raise SystemExit(f"planted foot slid: {world0}, {world1}, {world2}")
    if np.array_equal(side[0][:, :, 3], side[2][:, :, 3]):
        raise SystemExit("side contact frames have the same silhouette")
    if np.array_equal(side[1][:, :, 3], side[3][:, :, 3]):
        raise SystemExit("side passing frames have the same silhouette")
    return [world0, world1, world2]


def walk_sheet(cycles) -> np.ndarray:
    order = ("down", "up", "side", "left")
    gap = 4
    label_w = b.text_width("down") + 6
    cell_w, cell_h = W, H
    width = label_w + 4 * (cell_w + gap) + gap
    height = 4 * (cell_h + gap) + gap
    im = np.zeros((height, width, 4), np.uint8)
    for i, y0 in enumerate(range(0, height, 8)):
        b.fill(im, 0, y0, width, min(8, height - y0), b.HONEY if i % 2 == 0 else b.HONEY_L)
    for r, name in enumerate(order):
        y = gap + r * (cell_h + gap)
        b.text(im, name, 2, y + 8, O, 1)
        for c, fr in enumerate(cycles[name]):
            b.stamp(im, fr, label_w + gap + c * (cell_w + gap), y)
    return im


def paint_grid(im, foot_y):
    line = (0x5C, 0x32, 0x18)
    mark = (0xFB, 0xE0, 0xC8)
    h, w = im.shape[:2]
    for y in range(116, h, 6):
        for x in range(w):
            b.px(im, x, y, line)
    for x in range(0, w, 6):
        for y in range(116, h):
            b.px(im, x, y, line)
    for x in range(w):
        b.px(im, x, foot_y, mark)


def walk_gif(room, frames):
    n_step = STEP
    # Keep at least a sliver of the sprite on screen so no two frames match.
    xs = list(range(-W + 6, b.SW - 6, n_step))
    foot = SOLE  # boot pixel, same on every side frame
    base_y = 156 - foot
    images = []
    for i, x in enumerate(xs):
        fr = room.copy()
        paint_grid(fr, base_y + foot)
        spr = frames[i % 4]
        a3.oval_shadow(fr, x + CX, base_y + foot + 1, 8, 2)
        b.stamp(fr, spr, x, base_y)
        big = Image.fromarray(fr).resize((b.SW * 3, b.SH * 3), Image.NEAREST).convert("RGB")
        images.append(big)
    images[0].save(
        OUT / "walk-player-A4.gif",
        save_all=True,
        append_images=images[1:],
        duration=120,
        loop=0,
        disposal=2,
        optimize=False,
    )
    return len(images)


def gif_delays(path):
    data = Path(path).read_bytes()
    delays = []
    i = 0
    while True:
        j = data.find(b"\x21\xF9\x04", i)
        if j < 0:
            break
        delays.append(data[j + 4] | (data[j + 5] << 8))
        i = j + 6
    return delays


def main():
    down = front_cycle(False)
    up = front_cycle(True)
    side = side_cycle()
    left = [mirror(fr) for fr in side]
    worlds = assert_cycle(down, up, side, left)
    cycles = {"down": down, "up": up, "side": side, "left": left}
    b.save_pair("walk-player-A4", walk_sheet(cycles))
    room = a3.scene({"mabel": a3.paint_char("mabel")}, with_player=False)
    n = walk_gif(room, side)
    delays = gif_delays(OUT / "walk-player-A4.gif")
    if delays != [12] * n:
        raise SystemExit(f"gif delays {set(delays)} n={len(delays)} want {n} x 12cs")
    tops = [top_row(fr) - top_row(side[0]) for fr in side]
    print(
        f"head offsets {tops}; "
        f"mirror down 0/2 and 1/3 alpha, left=flip(side); "
        f"foot-slide planted world x {worlds[0]} across frames 0,1,2 (no slide)"
    )
    print("gif", n, "frames", n * 120, "ms")


if __name__ == "__main__":
    main()
