"""Mabel's Criticality Cafe, painted as the showpiece room.

Same room, same collision (src/game/content.ts ROOMS.cafe): the counter, the easel, the two plants, the lamp and
the three chairs stay where they were, so walking, sitting and the interacts don't change. What changes is how it
looks: a striped wallpaper and honey wainscot, the lake through the big window with the cat asleep on the sill,
shelves of jars and mugs, string lights, Mabel's chalk menu, a herringbone-warm plank floor, a rose rug, a counter
with a pastry case, velvet armchairs that you sit in rather than stand in front of, a reading lamp, and two pendant
lamps over the counter.

Writes into public/art/rooms/cafe/:
    candy.png        the atlas: the shell (floor, walls, rug) at 0,0 (320x256), the stamps packed to its right
    candy-light.png  warm light, screen-blended over everything (window shaft, pendant pools, lamp pool)
    candy-shade.png  ambient shade, multiplied over everything (the room's edges and corners, under the counter)
    candy.json       the stamp list for src/game/roomAtlas.ts

Native pixels, 1px #3b2318 outline round objects, light from the top-left (the window), flat colour in steps.
    python3 tools/roomkit/cafe_candy.py      # CAFE_OUT to write somewhere else
"""
import os, sys, json, math, random
from PIL import Image, ImageDraw

REPO = os.environ.get('CC_REPO', os.getcwd())
OUT = os.environ.get('CAFE_OUT', f'{REPO}/public/art/rooms/cafe')
RW, RH = 320, 256
WALL = 48

def hx(s):
    s = s.lstrip('#'); return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))
def mix(a, b, t):
    a = hx(a) if isinstance(a, str) else a; b = hx(b) if isinstance(b, str) else b
    return tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(3))
def lit(c, t=.3): return mix(c, '#fff0c8', t)
def shd(c, t=.3): return mix(c, '#3a2850', t)
OL = hx('#3b2318')

class C:
    def __init__(s, w, h):
        s.w, s.h = w, h
        s.im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); s.p = s.im.load()
    def px(s, x, y, c, a=255):
        x, y = int(x), int(y)
        if 0 <= x < s.w and 0 <= y < s.h:
            c = hx(c) if isinstance(c, str) else c
            if a >= 255: s.p[x, y] = tuple(c[:3]) + (255,)
            else:
                o = s.p[x, y]
                if o[3] == 0: s.p[x, y] = tuple(c[:3]) + (a,)
                else:
                    t = a / 255; s.p[x, y] = tuple(round(o[i] * (1 - t) + c[i] * t) for i in range(3)) + (max(o[3], a),)
    def r(s, x, y, w, h, c, a=255):
        for yy in range(int(y), int(y + h)):
            for xx in range(int(x), int(x + w)): s.px(xx, yy, c, a)
    def get(s, x, y):
        if 0 <= x < s.w and 0 <= y < s.h: return s.p[x, y]
        return (0, 0, 0, 0)
    def ellipse(s, cx, cy, rx, ry, c, a=255):
        for y in range(int(cy - ry), int(cy + ry) + 1):
            for x in range(int(cx - rx), int(cx + rx) + 1):
                if ((x - cx + .5) / (rx + .01)) ** 2 + ((y - cy + .5) / (ry + .01)) ** 2 <= 1: s.px(x, y, c, a)
    def line(s, pts, c):
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            n = max(abs(x1 - x0), abs(y1 - y0), 1)
            for i in range(n + 1):
                s.px(round(x0 + (x1 - x0) * i / n), round(y0 + (y1 - y0) * i / n), c)
    def outline(s, color=OL):
        """1px outline on every transparent pixel touching the drawing (4-neighbour)."""
        src = s.im.copy(); q = src.load()
        for y in range(s.h):
            for x in range(s.w):
                if q[x, y][3]: continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < s.w and 0 <= yy < s.h and q[xx, yy][3] > 200:
                        s.p[x, y] = color + (255,); break
        return s
    def paste(s, other, x, y):
        s.im.alpha_composite(other.im, (int(x), int(y))); s.p = s.im.load()

def text3(c, x, y, txt, col):
    """3x5 caps, the same glyph set the game uses for chalk."""
    G = {
        'A': ["010", "101", "111", "101", "101"], 'B': ["110", "101", "110", "101", "110"], 'C': ["011", "100", "100", "100", "011"],
        'D': ["110", "101", "101", "101", "110"], 'E': ["111", "100", "110", "100", "111"], 'F': ["111", "100", "110", "100", "100"],
        'H': ["101", "101", "111", "101", "101"], 'I': ["111", "010", "010", "010", "111"], 'K': ["101", "110", "100", "110", "101"],
        'L': ["100", "100", "100", "100", "111"], 'M': ["101", "111", "111", "101", "101"], 'N': ["101", "111", "111", "111", "101"],
        'O': ["010", "101", "101", "101", "010"], 'P': ["110", "101", "110", "100", "100"], 'R': ["110", "101", "110", "101", "101"],
        'S': ["011", "100", "010", "001", "110"], 'T': ["111", "010", "010", "010", "010"], 'U': ["101", "101", "101", "101", "111"],
        'Y': ["101", "101", "010", "010", "010"], 'W': ["101", "101", "111", "111", "101"], 'G': ["011", "100", "101", "101", "011"],
        '1': ["010", "110", "010", "010", "111"], '2': ["110", "001", "010", "100", "111"], '3': ["110", "001", "010", "001", "110"],
        '4': ["101", "101", "111", "001", "001"], '5': ["111", "100", "110", "001", "110"], '0': ["010", "101", "101", "101", "010"],
        '.': ["000", "000", "000", "000", "010"], '-': ["000", "000", "111", "000", "000"], '$': ["011", "110", "010", "011", "110"],
        ' ': ["000"] * 5, '&': ["010", "101", "010", "101", "011"],
    }
    for ch in txt:
        g = G.get(ch, G[' '])
        for yy, row in enumerate(g):
            for xx, b in enumerate(row):
                if b == '1': c.px(x + xx, y + yy, col)
        x += 4

# =====================================================================================================================
# The shell: walls, window, wall decor, floor, rug, thresholds.
# =====================================================================================================================
def shell():
    c = C(RW, RH)
    rnd = random.Random(7)
    # --- wallpaper: dusty teal stripes, a tiny cream sprig on every other stripe
    for x in range(RW):
        stripe = (x // 5) % 2
        for y in range(0, 31):
            c.px(x, y, '#558f8a' if stripe else '#4c8480')
    for x0 in range(2, RW, 10):
        for y0 in range(8 + (x0 // 10) % 2 * 6, 30, 12):
            c.px(x0 + 1, y0, '#e8dcc0'); c.px(x0, y0 + 1, '#c8d8b8'); c.px(x0 + 2, y0 + 1, '#c8d8b8'); c.px(x0 + 1, y0 + 2, '#7aa890')
    # crown moulding and the shadow it throws
    c.r(0, 0, RW, 2, '#6a3c24'); c.r(0, 2, RW, 1, '#c88a5a'); c.r(0, 3, RW, 1, '#3e6f6b')
    # chair rail, wainscot panels, skirting
    c.r(0, 30, RW, 1, '#fff2dc'); c.r(0, 31, RW, 2, '#f0dcb8'); c.r(0, 33, RW, 1, '#c8a878')
    c.r(0, 34, RW, 12, '#b06a3c')
    for x0 in range(4, RW, 26):
        c.r(x0, 36, 22, 8, '#9a5832'); c.r(x0, 36, 22, 1, '#7e4628'); c.r(x0, 36, 1, 8, '#7e4628')
        c.r(x0 + 1, 43, 21, 1, '#c88050'); c.r(x0 + 21, 37, 1, 7, '#c88050')
        c.r(x0 + 3, 38, 16, 4, '#a4603a')
    c.r(0, 46, RW, 1, '#5a321e'); c.r(0, 47, RW, 1, '#3b2318')

    # --- the big window: lake, far shore, a sail, curtains tied back, the sill
    wx, wy, ww, wh = 96, 4, 80, 30
    c.r(wx - 3, wy - 2, ww + 6, wh + 5, '#3b2318')
    c.r(wx - 2, wy - 1, ww + 4, wh + 3, '#f6e8d0')
    sky = ['#a8d8ea', '#b4def0', '#c2e4f2', '#d0eaf2', '#dceee8', '#e6f0dc']
    for y in range(wy, wy + 16):
        for x in range(wx, wx + ww):
            c.px(x, y, sky[min(5, (y - wy) // 3)])
    for cx_, cy_ in ((112, 9), (150, 7)):                                  # clouds
        c.r(cx_, cy_, 10, 2, '#fbfdfc'); c.r(cx_ + 2, cy_ - 1, 5, 1, '#fbfdfc'); c.r(cx_ + 1, cy_ + 2, 9, 1, '#e4f0f4')
    for x in range(wx, wx + ww):                                           # far hills, near trees
        h1 = 3 + int(2 * math.sin(x * .09) + 1.5 * math.sin(x * .23))
        c.r(x, wy + 16 - h1, 1, h1, '#86b09a')
        h2 = 2 + int(1.5 * math.sin(x * .31 + 1) + (x * 7 % 5 == 0))
        c.r(x, wy + 18 - h2, 1, h2, '#5e8c6c')
    for y in range(wy + 18, wy + wh):                                      # the lake
        for x in range(wx, wx + ww):
            c.px(x, y, '#5aa4bc' if (y - wy) < 23 else '#4c94ae')
    for i in range(14):
        sx = wx + rnd.randrange(2, ww - 4); sy = wy + rnd.randrange(19, wh - 1)
        c.r(sx, sy, rnd.choice((2, 3)), 1, '#a8dcea')
    c.r(130, wy + 18, 1, 1, '#fffaf0'); c.r(144, wy + 21, 2, 1, '#fffaf0')
    # a little sail on the lake
    c.r(160, wy + 13, 1, 6, '#6a4a32'); c.r(156, wy + 14, 4, 4, '#fff8ec'); c.r(157, wy + 13, 3, 1, '#fff8ec')
    c.r(155, wy + 19, 8, 1, '#c4643a')
    # mullions and the cross bar
    c.r(wx + ww // 2 - 1, wy, 2, wh, '#f6e8d0'); c.r(wx, wy + 13, ww, 2, '#f6e8d0')
    c.r(wx + ww // 2 + 1, wy, 1, wh, '#d8c4a0'); c.r(wx, wy + 15, ww, 1, '#d8c4a0')
    for gx, gy in ((wx + 3, wy + 2), (wx + ww // 2 + 4, wy + 2)):       # glass glints
        c.px(gx, gy + 2, '#ffffff'); c.px(gx + 1, gy + 1, '#ffffff'); c.px(gx + 2, gy, '#ffffff')
    # sill
    c.r(wx - 6, wy + wh + 1, ww + 12, 3, '#f6e8d0'); c.r(wx - 6, wy + wh + 4, ww + 12, 1, '#c8a878')
    c.r(wx - 7, wy + wh + 1, 1, 4, '#3b2318'); c.r(wx + ww + 6, wy + wh + 1, 1, 4, '#3b2318')
    c.r(wx - 6, wy + wh + 5, ww + 12, 1, '#7e4628')
    # a succulent in a tiny pot on the sill, right side
    c.r(166, 30, 6, 4, '#c4643a'); c.r(166, 30, 6, 1, '#e08050'); c.r(165, 30, 1, 4, '#3b2318'); c.r(172, 30, 1, 4, '#3b2318')
    c.r(166, 34, 6, 1, '#3b2318')
    for px_, py_ in ((167, 28), (168, 27), (169, 28), (170, 27), (171, 29), (166, 29)):
        c.px(px_, py_, '#6aa868'); c.px(px_, py_ + 1, '#4a8050')
    # curtains, gathered and tied
    for side in (-1, 1):
        x0 = wx - 9 if side < 0 else wx + ww + 1
        for y in range(1, 36):
            pinch = 0 if y < 14 else min(4, (y - 14) // 2) if y < 22 else max(0, 4 - (y - 22) // 2)
            w_ = 8 - pinch
            xs = x0 + (pinch if side < 0 else 0)
            for i in range(w_):
                fold = (i + (y // 3)) % 4
                col = '#d47a6e' if fold in (0, 1) else '#e8988a' if fold == 2 else '#b05c56'
                c.px(xs + i, y, col)
            c.px(xs - 1, y, '#3b2318'); c.px(xs + w_, y, '#3b2318')
        ty = 21
        c.r(x0 + (2 if side < 0 else 0), ty, 6, 2, '#e0b030'); c.r(x0 + (2 if side < 0 else 0), ty, 6, 1, '#f4d060')
    c.r(wx - 12, 0, ww + 24, 2, '#8a5a38'); c.r(wx - 13, 0, 1, 2, '#3b2318'); c.r(wx + ww + 12, 0, 1, 2, '#3b2318')  # curtain rod

    # --- left wall: a framed vintage poster (cup whose steam is an atom) and a clock
    def frame(x, y, w, h, wood='#7e4628', mat='#f6ead2'):
        c.r(x - 1, y - 1, w + 2, h + 2, '#3b2318'); c.r(x, y, w, h, wood); c.r(x, y, w, 1, lit(wood, .3))
        c.r(x + 2, y + 2, w - 4, h - 4, mat)
    frame(17, 8, 28, 22)
    c.r(19, 10, 24, 18, '#e8a860'); c.r(19, 10, 24, 6, '#f0c080')
    c.r(26, 19, 10, 6, '#fff4e0'); c.r(26, 25, 10, 1, '#c8a878'); c.r(36, 20, 2, 3, '#fff4e0'); c.r(25, 19, 1, 7, '#3b2318')
    c.r(36, 19, 1, 1, '#3b2318'); c.r(27, 20, 8, 1, '#7a4a2a')
    for a in range(0, 360, 30):                                            # the atom made of steam
        for k, (rx, ry, rot) in enumerate(((7, 3, 0), (7, 3, 60), (7, 3, 120))):
            t = math.radians(a); r_ = math.radians(rot)
            ex, ey = rx * math.cos(t), ry * math.sin(t)
            c.px(round(31 + ex * math.cos(r_) - ey * math.sin(r_)), round(14 + ex * math.sin(r_) + ey * math.cos(r_)), '#fff8ec')
    c.r(30, 13, 2, 2, '#c4643a')
    # clock
    c.ellipse(63, 16, 9, 9, '#3b2318'); c.ellipse(63, 16, 8, 8, '#c88a50'); c.ellipse(63, 16, 6, 6, '#fff8ec')
    for a in range(0, 360, 90):
        c.px(round(63 + 5 * math.cos(math.radians(a))), round(16 + 5 * math.sin(math.radians(a))), '#6a4a32')
    c.px(63, 16, '#3b2318')                                                # hands are drawn live (cafeLife.ts)
    # --- right of the window: shelves of jars and mugs, with ivy trailing down
    for sy in (12, 24):
        c.r(184, sy, 58, 2, '#8a5030'); c.r(184, sy, 58, 1, '#c88a50'); c.r(184, sy + 2, 58, 1, '#3a6460')
        c.r(186, sy + 2, 2, 3, '#6a3c24'); c.r(238, sy + 2, 2, 3, '#6a3c24')
    jars = [('#e8c060', 5, 7), ('#c8645a', 4, 6), ('#f4ecd8', 5, 8), ('#7ab88a', 4, 7), ('#e8a060', 6, 6), ('#a8c8e8', 4, 7), ('#f0b0b8', 5, 6), ('#c8a070', 5, 8), ('#f4ecd8', 4, 5)]
    x = 187
    for col, w_, h_ in jars:
        c.r(x, 12 - h_, w_, h_, '#3b2318'); c.r(x + 1, 12 - h_ + 1, w_ - 2, h_ - 1, col)
        c.r(x + 1, 12 - h_ + 1, 1, h_ - 2, lit(col, .4)); c.r(x, 12 - h_ - 1, w_, 1, '#8a6242')
        x += w_ + 1
    x = 187
    for i, col in enumerate(['#f4ecd8', '#c4643a', '#5a9a90', '#f4ecd8', '#e0b030', '#d47a6e', '#f4ecd8', '#6b8f71']):
        c.r(x, 19, 5, 5, '#3b2318'); c.r(x + 1, 20, 3, 4, col); c.r(x + 1, 20, 1, 3, lit(col, .35)); c.px(x + 5, 21, '#3b2318'); c.px(x + 5, 22, '#3b2318')
        x += 7
    for k, (ix, iy, n) in enumerate(((236, 14, 13), (240, 26, 9), (190, 26, 6))):     # ivy
        for j in range(n):
            xx = ix + round(math.sin(j * .7 + k) * 1.5); yy = iy + j
            c.px(xx, yy, '#3d7a4a')
            if j % 2 == 0: c.px(xx + (1 if j % 4 else -1), yy, '#6aa868'); c.px(xx + (2 if j % 4 else -2), yy, '#8cc870') if j % 6 == 0 else None
    # --- chalk menu board, right
    c.r(254, 4, 34, 26, '#3b2318'); c.r(255, 5, 32, 24, '#8a5a38'); c.r(256, 6, 30, 22, '#2e3a34')
    c.r(256, 6, 30, 1, '#3e4a44')
    text3(c, 259, 8, 'MENU', '#f4ecd8'); c.r(259, 14, 15, 1, '#e8a0a8')
    text3(c, 259, 16, 'COFFEE', '#e8e0d0'); text3(c, 259, 22, 'CAKE', '#a8e0c8'); c.r(277, 22, 6, 5, '#f4a0b0'); c.r(277, 22, 6, 1, '#fff0f4'); c.px(279, 21, '#c84040')
    c.r(256, 28, 30, 1, '#6a4a32')
    # --- a macrame planter hanging in the right corner, trailing leaves
    c.line([(300, 0), (296, 18)], '#e8d8b8'); c.line([(312, 0), (316, 18)], '#e8d8b8'); c.line([(306, 0), (306, 18)], '#e8d8b8')
    for k in range(4): c.px(298 + k * 4, 8 + (k % 2) * 2, '#c8b898')
    c.ellipse(306, 22, 8, 5, '#3b2318'); c.ellipse(306, 22, 7, 4, '#e8dcc0'); c.r(299, 19, 15, 2, '#fff8ec')
    for (lx, ly, n) in ((300, 20, 12), (305, 21, 16), (311, 20, 10), (314, 19, 7)):
        for j in range(n):
            xx = lx + round(math.sin(j * .8 + lx) * 1.2); yy = ly + j
            c.px(xx, yy, '#3d7a4a' if j % 3 else '#6aa868')
            if j % 4 == 1: c.px(xx + 1, yy, '#8cc870')
    for (lx, ly) in ((301, 15), (304, 14), (308, 15), (311, 14)):
        c.r(lx, ly, 3, 2, '#58a05a'); c.px(lx, ly, '#8cc870')
    # --- string lights across the top (bulbs twinkle live; this is the wire)
    for x in range(2, RW - 2):
        sag = round(3 + 2.5 * math.sin(math.pi * ((x - 2) % 64) / 64))
        c.px(x, sag, '#2a1c14')

    # --- floor: honey planks in four tones, staggered ends, grain, nails
    tones = ['#c88a4e', '#d2965c', '#bf8048', '#cb9056']
    for row in range((RH - WALL) // 8 + 1):
        y0 = WALL + row * 8
        x = -rnd.randrange(0, 40)
        while x < RW:
            ln = rnd.choice((28, 36, 44, 52))
            tone = hx(rnd.choice(tones))
            for yy in range(y0, min(RH, y0 + 8)):
                for xx in range(max(0, x), min(RW, x + ln)):
                    col = tone
                    if yy == y0: col = lit(tone, .22)
                    elif yy == y0 + 7: col = mix(tone, '#7a4428', .55)
                    c.px(xx, yy, col)
            for g in range(rnd.randrange(1, 3)):                           # grain
                gx = x + rnd.randrange(3, max(4, ln - 10)); gy = y0 + rnd.randrange(2, 6)
                for k in range(rnd.randrange(4, 9)):
                    c.px(gx + k, gy, mix(tone, '#8a5030', .3))
            if 0 <= x < RW:
                c.r(x, y0, 1, 7, mix(tone, '#6a3a22', .6))
                c.px(x + 2, y0 + 2, '#8a5838'); c.px(x + 2, y0 + 5, '#8a5838')
            x += ln
    # contact shadow along the wall, in steps
    for y, a in ((WALL, 120), (WALL + 1, 90), (WALL + 2, 60), (WALL + 3, 36), (WALL + 4, 18)):
        c.r(0, y, RW, 1, '#5a2e1a', a)

    # --- the rug: rose field, cream border, a teal and gold medallion, tassels
    rx, ry, rw, rh = 136, 150, 136, 64
    c.r(rx - 1, ry - 1, rw + 2, rh + 2, '#3b2318')
    c.r(rx, ry, rw, rh, '#f2dfbe')
    c.r(rx + 3, ry + 3, rw - 6, rh - 6, '#5a2a34')
    c.r(rx + 4, ry + 4, rw - 8, rh - 8, '#b2404e')
    for i in range(rx + 6, rx + rw - 6, 4):                                # border diamonds
        c.px(i, ry + 1, '#3e8a86'); c.px(i + 1, ry + 2, '#e0a850'); c.px(i, ry + rh - 2, '#3e8a86'); c.px(i + 1, ry + rh - 3, '#e0a850')
    for j in range(ry + 6, ry + rh - 6, 4):
        c.px(rx + 1, j, '#3e8a86'); c.px(rx + rw - 2, j, '#3e8a86')
    for yy in range(ry + 8, ry + rh - 8, 10):                               # a field of little diamonds
        for xx in range(rx + 10 + ((yy - ry) // 10) % 2 * 6, rx + rw - 10, 12):
            for d in range(3):
                for k in range(-d, d + 1):
                    c.px(xx + k, yy - 2 + d, '#e0a850' if d < 2 else '#3e8a86'); c.px(xx + k, yy + 2 - d, '#e0a850' if d < 2 else '#3e8a86')
            c.px(xx, yy, '#f2dfbe')
    for j in range(ry + 1, ry + rh - 1, 2):                                 # tassels
        c.px(rx - 2, j, '#f2dfbe'); c.px(rx - 3, j, '#d8c4a0'); c.px(rx + rw + 1, j, '#f2dfbe'); c.px(rx + rw + 2, j, '#d8c4a0')

    # --- doorways: the lot (right wall) and the parlor (bottom)
    c.r(304, 92, 16, 70, '#3b2318'); c.r(306, 94, 14, 66, '#5a321e'); c.r(306, 94, 14, 2, '#8a5030')
    c.r(307, 97, 13, 62, '#2a1c14'); c.r(307, 97, 3, 62, '#e8c890', 110)
    c.r(292, 110, 12, 34, '#3b2318'); c.r(293, 111, 10, 32, '#7a9a6a'); c.r(293, 111, 10, 1, '#9aba88')  # door mat, green
    for j in range(113, 141, 3): c.r(295, j, 6, 1, '#5e7e52')
    c.r(126, 242, 68, 14, '#3b2318'); c.r(128, 243, 64, 13, '#2a1c14')
    c.r(140, 230, 40, 12, '#3b2318'); c.r(141, 231, 38, 10, '#c4643a'); c.r(141, 231, 38, 1, '#e08050')
    text3(c, 146, 233, 'HELLO', '#f6e2c4')
    return c

# =====================================================================================================================
# Stamps: things people walk in front of and behind.
# =====================================================================================================================
def counter():
    """96 x 48 footprint at 48,96. Butcher-block top, a pastry case, the espresso machine, Mabel's copper kettle,
    a cake under glass. The laptop (drawn live) sits on the right of the top."""
    c = C(100, 74)
    ox, oy = 2, 22                                                         # counter top-left inside the stamp
    # top surface (seen from above)
    c.r(ox, oy, 96, 14, '#e2b47c'); c.r(ox, oy, 96, 2, '#f0c890')
    for x in range(ox, ox + 96, 6): c.r(x, oy + 2, 1, 12, '#d0a06a')     # block seams
    c.r(ox, oy + 13, 96, 2, '#a86a3a')                                     # front edge
    # front face: left half the pastry case, right half wood panels, brass foot rail
    fy = oy + 15
    c.r(ox, fy, 96, 33, '#8a4e2e')
    c.r(ox + 2, fy + 2, 44, 24, '#3b2318'); c.r(ox + 3, fy + 3, 42, 22, '#d8eef0')
    c.r(ox + 3, fy + 13, 42, 1, '#f6e8d0'); c.r(ox + 3, fy + 14, 42, 1, '#b8a888')
    pastries = [('#f4a0b0', 'mac'), ('#a8e0c0', 'mac'), ('#f8e08a', 'mac'), ('#c8a8e8', 'mac'), ('#f4a0b0', 'mac'), ('#a8e0c0', 'mac')]
    for i, (col, kind) in enumerate(pastries):                             # top shelf: macarons
        x = ox + 5 + i * 7
        c.r(x, fy + 8, 5, 2, col); c.r(x, fy + 10, 5, 1, '#fff4e8'); c.r(x, fy + 11, 5, 2, col); c.r(x, fy + 8, 2, 1, lit(col, .4))
        c.r(x - 1, fy + 9, 1, 3, '#3b2318'); c.r(x + 5, fy + 9, 1, 3, '#3b2318'); c.r(x, fy + 7, 5, 1, '#3b2318'); c.r(x, fy + 13, 5, 0, '#3b2318')
    for i in range(3):                                                     # lower shelf: croissants and a cake slice
        x = ox + 6 + i * 11
        c.r(x, fy + 18, 8, 4, '#3b2318'); c.r(x + 1, fy + 18, 6, 3, '#e0a050'); c.r(x + 1, fy + 18, 6, 1, '#f4c070')
        c.px(x + 3, fy + 19, '#b8742a'); c.px(x + 5, fy + 19, '#b8742a')
    c.r(ox + 36, fy + 17, 7, 6, '#3b2318'); c.r(ox + 37, fy + 18, 5, 2, '#f4f0e8'); c.r(ox + 37, fy + 20, 5, 1, '#f4a0b0'); c.r(ox + 37, fy + 21, 5, 1, '#c88a50')
    c.px(ox + 39, fy + 17, '#c84040')
    for gx in (ox + 5, ox + 24):                                           # glass glint
        c.px(gx, fy + 4, '#ffffff'); c.px(gx + 1, fy + 3, '#ffffff'); c.px(gx + 2, fy + 3, '#ffffff')
    for x0 in (ox + 50, ox + 73):                                          # wood panels
        c.r(x0, fy + 3, 20, 22, '#6e3c22'); c.r(x0 + 1, fy + 4, 18, 20, '#9a5a34'); c.r(x0 + 1, fy + 4, 18, 1, '#b8744a'); c.r(x0 + 1, fy + 4, 1, 20, '#b8744a')
        c.r(x0 + 4, fy + 8, 12, 12, '#8a4e2e'); c.r(x0 + 4, fy + 8, 12, 1, '#6e3c22')
        c.ellipse(x0 + 10, fy + 14, 2, 2, '#e0b030')
    c.r(ox, fy + 27, 96, 6, '#6e3c22'); c.r(ox, fy + 27, 96, 1, '#a86a3a')
    c.r(ox + 2, fy + 29, 92, 2, '#e0b030'); c.r(ox + 2, fy + 29, 92, 1, '#f4d060')       # brass foot rail
    for x in (ox + 8, ox + 48, ox + 88): c.r(x, fy + 27, 1, 4, '#a87a20')
    # --- on top: espresso machine (left), kettle, cake dome; laptop space on the right
    ex, ey = ox + 2, oy - 16
    c.r(ex, ey + 6, 24, 16, '#c8ccd0'); c.r(ex, ey + 6, 24, 2, '#eef0f0'); c.r(ex, ey + 6, 2, 16, '#eef0f0')
    c.r(ex + 20, ey + 8, 4, 14, '#9aa4ac')
    c.ellipse(ex + 12, ey + 5, 9, 5, '#c4783a'); c.ellipse(ex + 10, ey + 3, 5, 2, '#e8a860'); c.px(ex + 8, ey + 2, '#fff0c8')   # copper boiler
    c.r(ex + 11, ey - 2, 2, 2, '#e0b030'); c.px(ex + 11, ey - 3, '#f4d060')                                    # the eagle, for short
    c.r(ex + 3, ey + 10, 18, 3, '#9aa4ac'); c.r(ex + 3, ey + 10, 18, 1, '#eef0f0')                             # group head bar
    for gx in (ex + 4, ex + 14):
        c.r(gx, ey + 13, 6, 2, '#3a3a3a'); c.r(gx + 6, ey + 13, 4, 1, '#2a1c14')                                # portafilters
        c.r(gx + 1, ey + 17, 4, 4, '#f4ecd8'); c.r(gx + 1, ey + 17, 4, 1, '#fff8ec'); c.r(gx + 2, ey + 18, 2, 1, '#6a3a20')  # cups
    c.r(ex + 2, ey + 21, 20, 1, '#5a6068')                                                                    # drip tray
    c.px(ex + 22, ey + 12, '#7ac870')
    kx, ky = ox + 30, oy - 9                                               # the copper kettle
    c.ellipse(kx + 7, ky + 9, 8, 7, '#c4783a'); c.ellipse(kx + 6, ky + 7, 5, 4, '#e8a860'); c.ellipse(kx + 5, ky + 6, 2, 1, '#fff0c8')
    c.r(kx, ky + 14, 15, 2, '#8a4820')
    c.r(kx + 5, ky - 1, 5, 2, '#8a4820'); c.r(kx + 6, ky - 2, 3, 1, '#2a1c14')
    for i, (dx, dy) in enumerate(((15, 8), (16, 7), (17, 6), (18, 5), (19, 4))): c.px(kx + dx, ky + dy, '#c4783a'); c.px(kx + dx, ky + dy + 1, '#8a4820')
    c.line([(kx + 1, ky + 3), (kx + 2, ky - 3), (kx + 7, ky - 5), (kx + 12, ky - 3), (kx + 13, ky + 3)], '#2a1c14')
    dx_, dy_ = ox + 54, oy - 12                                            # glass cake dome
    c.r(dx_ + 5, dy_ + 14, 2, 3, '#c8ccd0'); c.r(dx_ + 1, dy_ + 16, 10, 1, '#c8ccd0'); c.r(dx_ - 1, dy_ + 13, 14, 1, '#eef0f0')
    c.r(dx_ + 1, dy_ + 7, 10, 6, '#f4f0e8'); c.r(dx_ + 1, dy_ + 7, 10, 2, '#f4a0b0'); c.r(dx_ + 1, dy_ + 10, 10, 1, '#f4a0b0')
    for i in range(3): c.px(dx_ + 2 + i * 4, dy_ + 6, '#c84040')
    c.ellipse(dx_ + 6, dy_ + 7, 8, 8, '#c8e8f0', 90)
    for (gx, gy) in ((dx_ + 1, dy_ + 3), (dx_ + 2, dy_ + 1), (dx_ + 3, dy_)): c.px(gx, gy, '#ffffff')
    c.px(dx_ + 6, dy_ - 2, '#c8ccd0'); c.px(dx_ + 6, dy_ - 1, '#eef0f0')
    c.r(ox + 4, oy + 5, 6, 3, '#f4ecd8'); c.r(ox + 4, oy + 5, 6, 1, '#fff8ec')                              # a saucer of biscuits
    c.px(ox + 5, oy + 6, '#e8a060'); c.px(ox + 7, oy + 6, '#c87a40'); c.px(ox + 8, oy + 5, '#e8a060')
    c.outline()
    return c

def chair(colour='#3e8a86', back_only=None):
    """A little velvet armchair facing you, in two pieces: the back and arms (behind whoever sits) and the seat front
    (in front of them), so sitting reads as sitting."""
    base, L, D = hx(colour), lit(colour, .3), shd(colour, .35)
    back = C(30, 26)
    back.r(3, 0, 24, 14, base); back.r(3, 0, 24, 2, L)                    # backrest
    for x in range(6, 26, 6): back.px(x, 6, D); back.px(x + 3, 10, D)     # tufting
    back.r(5, 13, 20, 13, mix(base, '#fff0c8', .08)); back.r(5, 13, 20, 2, D)   # the cushion, seen from above
    back.r(7, 16, 16, 1, lit(colour, .18))
    back.r(0, 8, 5, 18, base); back.r(25, 8, 5, 18, D); back.r(0, 8, 5, 2, L); back.r(25, 8, 5, 2, base)   # arms
    back.outline()
    seat = C(30, 12)
    seat.r(0, 0, 30, 5, base); seat.r(0, 0, 30, 1, L); seat.r(4, 1, 22, 3, mix(base, '#fff0c8', .12))
    seat.r(0, 5, 30, 3, D)
    seat.r(1, 8, 3, 3, '#6a3c24'); seat.r(26, 8, 3, 3, '#6a3c24'); seat.px(1, 8, '#a86a3a'); seat.px(26, 8, '#a86a3a')
    seat.outline()
    return back, seat

def bistro_table():
    c = C(18, 22)
    c.ellipse(9, 4, 8, 4, '#f4ecd8'); c.ellipse(9, 4, 7, 3, '#fff8ec'); c.r(2, 4, 15, 2, '#d8c4a0')
    c.r(8, 7, 2, 11, '#3b2318'); c.r(4, 18, 10, 2, '#3b2318')
    for (x, y, col) in ((5, 2, '#f4ecd8'), (11, 2, '#d47a6e')):           # two cups
        c.r(x, y, 3, 2, col); c.px(x + 3, y, '#8a6a50'); c.px(x + 1, y, '#6a3a20')
    c.r(8, 4, 2, 1, '#e8a060')                                              # a biscuit
    c.outline()
    return c

def easel():
    """The chalk sign by the window (the 'Look' prop): today's cake."""
    c = C(32, 48)
    c.r(3, 0, 26, 32, '#8a5a38'); c.r(5, 2, 22, 28, '#2e3a34'); c.r(3, 0, 26, 1, '#b07a4c')
    text3(c, 7, 4, 'TODAY', '#f4ecd8'); c.r(7, 10, 19, 1, '#a8e0c8')
    text3(c, 7, 13, 'LEMON', '#f8e08a'); text3(c, 9, 19, 'CAKE', '#f8e08a')
    c.r(10, 25, 12, 3, '#f8e08a'); c.r(10, 25, 12, 1, '#fff8d0'); c.r(10, 27, 12, 1, '#e0b030')    # chalk cake
    c.line([(5, 30), (2, 47)], '#6a3c24'); c.line([(26, 30), (29, 47)], '#6a3c24'); c.line([(6, 30), (3, 47)], '#8a5a38')
    c.line([(27, 30), (30, 47)], '#8a5a38'); c.r(4, 40, 24, 1, '#6a3c24')
    c.outline()
    return c

def monstera():
    c = C(38, 52)
    rnd = random.Random(3)
    pot = (9, 34, 20, 16)
    for (lx, ly, r_, ang) in ((18, 10, 9, -0.4), (9, 18, 8, -1.2), (28, 17, 8, 0.9), (18, 24, 7, 0.1), (12, 6, 6, -0.8), (26, 6, 6, 0.6)):
        for y in range(-r_, r_ + 1):
            for x in range(-r_, r_ + 1):
                if x * x / (r_ * r_) + y * y / (r_ * r_ * .55) <= 1:
                    xr = x * math.cos(ang) - y * math.sin(ang); yr = x * math.sin(ang) + y * math.cos(ang)
                    px_, py_ = round(lx + xr), round(ly + yr)
                    slit = (abs(x) > r_ * .45 and (y % 3 == 0))
                    if slit: continue
                    col = '#58a05a' if y < 0 else '#3d7a4a'
                    if x < -r_ * .2 and y < -1: col = '#8cc870'
                    c.px(px_, py_, col)
        for k in range(-r_ + 1, r_):                                       # midrib
            xr = k * math.cos(ang); yr = k * math.sin(ang)
            c.px(round(lx + xr), round(ly + yr), '#2a5634')
    c.line([(19, 33), (18, 24)], '#2a5634'); c.line([(17, 33), (10, 19)], '#2a5634'); c.line([(21, 33), (27, 18)], '#2a5634')
    c.r(9, 34, 20, 16, '#c4643a'); c.r(9, 34, 20, 3, '#e08050'); c.r(9, 37, 20, 1, '#9a4428'); c.r(25, 37, 4, 13, '#9a4428')
    c.r(10, 34, 18, 1, '#5a3420')
    c.r(12, 42, 14, 2, '#e8a070')
    c.outline()
    return c

def fern():
    c = C(36, 46)
    c.r(8, 26, 20, 4, '#8a5a38'); c.r(8, 26, 20, 1, '#b07a4c')            # stand top
    c.r(10, 30, 2, 15, '#6a3c24'); c.r(24, 30, 2, 15, '#6a3c24'); c.r(10, 38, 16, 1, '#6a3c24')
    c.r(11, 18, 14, 9, '#e8dcc0'); c.r(11, 18, 14, 2, '#fff8ec'); c.r(22, 20, 3, 7, '#c8b898')
    c.r(13, 22, 10, 1, '#5a9a90')                                          # blue band on the pot
    for k in range(9):
        a = math.radians(-160 + k * 17.5)
        ln = 11 + (k % 3) * 2
        for j in range(ln):
            x = 18 + math.cos(a) * j; y = 19 + math.sin(a) * j * .8 + (j * j) * .035
            col = '#58a05a' if j < ln * .6 else '#8cc870'
            c.px(round(x), round(y), col)
            if j % 2 == 0 and j > 2:
                c.px(round(x), round(y) - 1, '#3d7a4a'); c.px(round(x) + 1, round(y) + 1, '#3d7a4a')
    c.outline()
    return c

def record_player():
    """Bottom-left corner: a low cabinet, a record turning (the label is drawn live), a stack of sleeves."""
    c = C(34, 36)
    c.r(2, 14, 28, 20, '#8a5030'); c.r(2, 14, 28, 2, '#c88a50'); c.r(4, 18, 11, 13, '#6e3c22'); c.r(17, 18, 11, 13, '#6e3c22')
    c.r(5, 19, 9, 11, '#9a5a34'); c.r(18, 19, 9, 11, '#9a5a34'); c.px(13, 24, '#e0b030'); c.px(18, 24, '#e0b030')
    c.r(3, 34, 3, 2, '#6a3c24'); c.r(26, 34, 3, 2, '#6a3c24')
    c.r(4, 6, 22, 9, '#c8a070'); c.r(4, 6, 22, 1, '#e8c898')                                          # the player
    c.ellipse(13, 10, 7, 4, '#1e1a1e'); c.ellipse(13, 10, 6, 3, '#2e2a30'); c.px(10, 9, '#5a5660'); c.px(16, 11, '#5a5660')
    c.r(22, 7, 1, 6, '#c8ccd0'); c.r(19, 12, 4, 1, '#c8ccd0')                                       # tonearm
    for i, col in enumerate(('#d47a6e', '#5a9a90', '#e0b030')):                                       # sleeves
        c.r(27 + i * 2 - 2, 2 + i, 6, 12, col); c.r(27 + i * 2 - 2, 2 + i, 6, 1, lit(col, .35))
    c.outline()
    return c

def floor_lamp():
    c = C(26, 50)
    c.r(9, 0, 10, 2, '#f8e8c8'); c.r(7, 2, 14, 2, '#f8e8c8'); c.r(5, 4, 18, 7, '#f4dcb0')
    for x in range(6, 22, 3): c.r(x, 4, 1, 7, '#e8c890')                  # pleats
    c.r(5, 10, 18, 1, '#e0b030'); c.r(5, 11, 18, 2, '#fff2c0')            # the glow under the shade
    c.r(13, 13, 2, 33, '#e0b030'); c.r(13, 13, 1, 33, '#f4d060')
    c.r(8, 46, 12, 3, '#a87a20'); c.r(8, 46, 12, 1, '#e0b030')
    c.r(13, 24, 2, 2, '#a87a20')
    c.outline()
    return c

def pendant():
    """Hangs from the ceiling over the counter: a cord, a copper dome, a warm bulb."""
    c = C(16, 80)
    c.r(7, 0, 1, 66, '#2a1c14')
    b = 64
    c.r(5, b, 6, 2, '#8a4820')
    c.r(3, b + 2, 10, 3, '#c4783a'); c.r(1, b + 5, 14, 4, '#c4783a'); c.r(2, b + 2, 4, 2, '#e8a860'); c.r(1, b + 5, 4, 1, '#e8a860')
    c.r(1, b + 8, 14, 1, '#8a4820')
    c.r(5, b + 9, 6, 2, '#fff2c0'); c.r(6, b + 11, 4, 1, '#ffe080')
    sub = C(16, 18); sub.im = c.im.crop((0, b - 2, 16, b + 16)); sub.p = sub.im.load()
    sub.outline()
    c.im.paste(sub.im, (0, b - 2)); c.p = c.im.load()
    return c

# =====================================================================================================================
# Light and shade maps
# =====================================================================================================================
def light_map():
    L = C(RW, RH)
    warm = '#ffe4a8'
    # the window shaft: from the glass down and to the right across the floor, in two steps
    for y in range(36, 150):
        t = (y - 36) / 114
        x0 = 96 + round(t * 54); x1 = 176 + round(t * 70)
        a = 46 if t < .55 else 30 if t < .85 else 16
        for x in range(x0, x1):
            edge = min(x - x0, x1 - 1 - x)
            L.px(x, y, warm, a if edge > 5 else a * 2 // 3)
    for (cx, cy, rx, ry) in ((78, 104, 22, 9), (118, 104, 22, 9)):        # pendant pools on the counter top
        for rr, a in ((1.0, 34), (.66, 58), (.36, 80)):
            L.ellipse(cx, cy, round(rx * rr), round(ry * rr), '#ffdc98', a)
    for rr, a in ((1.0, 36), (.62, 64), (.32, 92)):                         # reading lamp
        L.ellipse(288, 190, round(40 * rr), round(16 * rr), '#ffd088', a)
    return L

def shade_map():
    S = Image.new('RGBA', (RW, RH), (255, 255, 255, 255)); p = S.load()
    def mul(x, y, v):
        o = p[x, y]; p[x, y] = (min(o[0], v[0]), min(o[1], v[1]), min(o[2], v[2]), 255)
    steps = [(0, (214, 190, 196)), (6, (230, 214, 216)), (14, (242, 234, 234))]
    for y in range(RH):
        for x in range(RW):
            d = min(x, RW - 1 - x, RH - 1 - y)
            for lim, v in steps:
                if d <= lim: mul(x, y, v); break
    for y in range(144, 150):                                              # under the counter
        for x in range(46, 148): mul(x, y, (206, 182, 186) if y < 147 else (226, 210, 212))
    return S

# =====================================================================================================================
def build():
    os.makedirs(OUT, exist_ok=True)
    sh = shell()
    back, seat = chair('#3e8a86')
    back2, seat2 = chair('#c8645a')
    back3, seat3 = chair('#d8a63a')
    stamps = [
        # kind, image, x, y, foot
        ('counter', counter(), 46, 74, 144),
        ('poster', easel(), 16, 64, 112),
        ('plant', monstera(), 268, 62, 112),
        ('plant', fern(), 14, 148, 192),
        ('lamp', floor_lamp(), 275, 142, 192),
        ('chair-back', back, 145, 158, 170),
        ('chair', seat, 145, 182, 192),
        ('chair-back', back2, 193, 158, 170),
        ('chair', seat2, 193, 182, 192),
        ('table', bistro_table(), 176, 166, 184),
        ('chair-back', back3, 241, 174, 186),
        ('chair', seat3, 241, 198, 208),
        ('shelf', record_player(), 14, 204, 240),
        ('pendant', pendant(), 70, 0, 999),
        ('pendant', pendant(), 110, 0, 999),
    ]
    # pack: shell at 0,0, stamps in columns to the right
    cols_x, x, y, colw, placed = RW, RW, 0, 0, []
    for kind, im, sx, sy, foot in stamps:
        w, h = im.w, im.h
        if y + h > RH:
            x += colw; y = 0; colw = 0
        placed.append(dict(kind=kind, x=sx, y=sy, foot=foot, sx=x, sy=y, sw=w, sh=h, im=im))
        y += h; colw = max(colw, w)
    atlas = Image.new('RGBA', (x + colw, RH), (0, 0, 0, 0))
    atlas.alpha_composite(sh.im, (0, 0))
    for s in placed: atlas.alpha_composite(s['im'].im, (s['sx'], s['sy']))
    atlas.save(f'{OUT}/candy.png')
    light_map().im.save(f'{OUT}/candy-light.png')
    shade_map().save(f'{OUT}/candy-shade.png')
    meta = [{k: v for k, v in s.items() if k != 'im'} for s in placed]
    with open(f'{OUT}/candy.json', 'w') as fh: json.dump(meta, fh, indent=1)
    return atlas, meta

def preview(atlas, meta, path, scale=2, people=()):
    """The room as the game would draw it: shell, stamps by foot (with any people), light, shade."""
    cv = atlas.crop((0, 0, RW, RH)).copy()
    items = [(s['foot'], 'stamp', s) for s in meta] + [(p[2], 'person', p) for p in people]
    for foot, k, s in sorted(items, key=lambda t: t[0]):
        if k == 'stamp':
            cv.alpha_composite(atlas.crop((s['sx'], s['sy'], s['sx'] + s['sw'], s['sy'] + s['sh'])), (s['x'], s['y']))
        else:
            im, x, yfoot = s
            cv.alpha_composite(im, (x - 16, yfoot - 64))
    from PIL import ImageChops
    shade = Image.open(f'{OUT}/candy-shade.png').convert('RGB')
    rgb = ImageChops.multiply(cv.convert('RGB'), shade)
    light = Image.open(f'{OUT}/candy-light.png').convert('RGBA')
    lrgb = Image.new('RGB', (RW, RH), (0, 0, 0)); lrgb.paste(light.convert('RGB'), (0, 0), light.split()[3])
    rgb = ImageChops.screen(rgb, lrgb)
    rgb.resize((RW * scale, RH * scale), Image.NEAREST).save(path)

if __name__ == '__main__':
    atlas, meta = build()
    if os.environ.get('CAFE_PREVIEW'):
        preview(atlas, meta, os.environ['CAFE_PREVIEW'])
    print('wrote cafe candy atlas', atlas.size, len(meta), 'stamps to', OUT)
