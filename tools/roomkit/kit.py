import os
"""Room kit for Coffee & Criticality, A-series (Stardew-lite) style.
Native pixels, TILE=16, 1px outline #3b2318, flat shading lit top-left, no dither."""
from PIL import Image, ImageDraw
import random, math, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

T = 16
def hx(s):
    s = s.lstrip('#'); return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))
OL = hx('#3b2318')
def mix(a, b, t):
    a = hx(a) if isinstance(a, str) else a; b = hx(b) if isinstance(b, str) else b
    return tuple(int(a[i]*(1-t)+b[i]*t) for i in range(3))
def lit(c, t=.25):  return mix(c, '#fff4e0', t)
def drk(c, t=.28):  return mix(c, '#2a1610', t)

class Cv:
    def __init__(s, w, h, bg=(0, 0, 0, 0)):
        s.w, s.h = w, h
        s.im = Image.new('RGBA', (w, h), bg); s.d = ImageDraw.Draw(s.im)
    def r(s, x, y, w, h, c):
        if w <= 0 or h <= 0: return
        s.d.rectangle([int(x), int(y), int(x+w-1), int(y+h-1)], fill=tuple(c)+((255,) if len(c) == 3 else ()))
    def px(s, x, y, c):
        if 0 <= x < s.w and 0 <= y < s.h: s.im.putpixel((int(x), int(y)), tuple(c)+((255,) if len(c) == 3 else ()))
    def blend(s, x, y, w, h, c, a):
        x, y, w, h = int(x), int(y), int(w), int(h)
        x0, y0 = max(x, 0), max(y, 0); x1, y1 = min(x+w, s.w), min(y+h, s.h)
        if x1 <= x0 or y1 <= y0: return
        ov = Image.new('RGBA', (x1-x0, y1-y0), tuple(c)+(int(255*a),))
        reg = s.im.crop((x0, y0, x1, y1)); reg = Image.alpha_composite(reg, ov); s.im.paste(reg, (x0, y0))
    def ellipse_shadow(s, cx, cy, rw, rh, a=.28):
        # flat 1-tone ellipse, no dither
        ov = Image.new('RGBA', (s.w, s.h), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
        od.ellipse([cx-rw, cy-rh, cx+rw, cy+rh], fill=(42, 22, 16, int(255*a)))
        s.im.alpha_composite(ov)
    def shadow_rect(s, x, y, w, h, a=.26):
        s.blend(x, y, w, h, (42, 22, 16), a)
    def ob(s, x, y, w, h, fill, hi=True, sh=True):
        """outlined box: 1px outline, top highlight, bottom shade"""
        s.r(x, y, w, h, OL)
        s.r(x+1, y+1, w-2, h-2, fill)
        if hi and h > 4: s.r(x+1, y+1, w-2, 1, lit(fill, .32)); s.r(x+1, y+1, 1, h-2, lit(fill, .16))
        if sh and h > 4: s.r(x+1, y+h-2, w-2, 1, drk(fill, .25)); s.r(x+w-2, y+1, 1, h-2, drk(fill, .18))
    def circle(s, cx, cy, r, fill, outline=True):
        if outline: s.d.ellipse([cx-r-1, cy-r-1, cx+r, cy+r], fill=OL)
        s.d.ellipse([cx-r, cy-r, cx+r-1, cy+r-1], fill=tuple(fill))
    def save(s, path, scale=1):
        im = s.im if scale == 1 else s.im.resize((s.w*scale, s.h*scale), Image.NEAREST)
        im.save(path)

# ---------------------------------------------------------------- palette per room
ROOM = {
 'cafe':        dict(wall='#5e908a', wain='#3f6e6a', trim='#f6e2c4', floor='#e0a850', kind='wood',   accent='#c4783a', rug=('#8e2230', '#f6e2c4')),
 'parlor':      dict(wall='#6a5a9a', wain='#483c78', trim='#e8c8f0', floor='#8a5a3a', kind='carpet', accent='#d0507a', rug=('#2a4a6a', '#e0a850')),
 'corridor':    dict(wall='#9cbfa8', wain='#d9c18c', trim='#f6e2c4', floor='#e6d4a8', kind='check',  accent='#c4783a', rug=('#6b8f71', '#f6e2c4')),
 'control':     dict(wall='#8a9060', wain='#5e6a46', trim='#e0c860', floor='#9a8a6a', kind='slab',   accent='#c9a227', rug=('#3a6a8a', '#e0c860')),
 'engineering': dict(wall='#7aa882', wain='#4f7a5a', trim='#f6e2c4', floor='#c8905a', kind='wood',   accent='#6b8f71', rug=('#c4783a', '#f6e2c4')),
 'breakroom':   dict(wall='#e0a478', wain='#f6e2c4', trim='#fff4e0', floor='#d8a050', kind='wood',   accent='#c4783a', rug=('#4a7a98', '#f6e2c4')),
 'reactor':     dict(wall='#4a7a88', wain='#2e5260', trim='#e0c860', floor='#6a8a8e', kind='grate',  accent='#6b8f71', rug=('#3a6a72', '#e0c860')),
 'maintenance': dict(wall='#5a82a0', wain='#3c5a74', trim='#e8d8b0', floor='#8a9aa0', kind='grate2', accent='#3d6a80', rug=('#c4783a', '#e8d8b0')),
}

# ---------------------------------------------------------------- floors
def hashf(x, y, n=7):
    return ((x*73856093) ^ (y*19349663) ^ (n*83492791)) & 0xffff
def floor(cv, p, x0, y0, w, h):
    k = p['kind']; base = hx(p['floor'])
    if k == 'wood':
        for y in range(y0, y0+h, 8):
            row = (y-y0)//8
            tone = [lit(base, .06), base, drk(base, .05)][hashf(row, 0) % 3]
            cv.r(x0, y, w, 8, tone)
            cv.r(x0, y, w, 1, drk(base, .20))                      # plank seam
            cv.r(x0, y+1, w, 1, lit(base, .14))                    # top-left light
            off = (hashf(row, 1) % 4)*8
            for x in range(x0 + off, x0+w, 40):
                cv.r(x, y, 1, 8, drk(base, .22))
            # grain flecks
            for gx in range(x0+3+hashf(row, 2) % 7, x0+w, 17):
                cv.r(gx, y+4, 3, 1, drk(base, .09))
    elif k == 'carpet':
        cv.r(x0, y0, w, h, base)
        for y in range(y0, y0+h, 16):
            for x in range(x0, x0+w, 16):
                if ((x-x0)//16 + (y-y0)//16) % 2 == 0: cv.r(x, y, 16, 16, drk(base, .09))
                cv.r(x+7, y+7, 2, 2, lit(base, .12))
    elif k == 'check':
        a, b = base, drk(base, .09)
        for y in range(y0, y0+h, 16):
            for x in range(x0, x0+w, 16):
                c = a if ((x-x0)//16 + (y-y0)//16) % 2 == 0 else b
                cv.r(x, y, 16, 16, c); cv.r(x, y, 16, 1, lit(c, .15)); cv.r(x, y, 1, 16, lit(c, .08))
                cv.r(x, y+15, 16, 1, drk(c, .14)); cv.r(x+15, y, 1, 16, drk(c, .14))
    elif k == 'slab':
        for y in range(y0, y0+h, 16):
            for x in range(x0, x0+w, 16):
                v = [0, .05, -.04, .08][hashf((x-x0)//16, (y-y0)//16) % 4]
                c = lit(base, v) if v > 0 else drk(base, -v)
                cv.r(x, y, 16, 16, c); cv.r(x, y, 16, 1, lit(c, .14)); cv.r(x, y, 1, 16, lit(c, .08))
                cv.r(x, y+15, 16, 1, drk(c, .2)); cv.r(x+15, y, 1, 16, drk(c, .2))
    else:   # grate / grate2 : metal deck plate
        cv.r(x0, y0, w, h, base)
        dark = drk(base, .16)
        for y in range(y0, y0+h, 16):
            for x in range(x0, x0+w, 16):
                cv.r(x, y, 16, 1, dark); cv.r(x, y, 1, 16, dark)
                cv.r(x+1, y+1, 14, 1, lit(base, .14)); cv.r(x+1, y+1, 1, 14, lit(base, .08))
                for (rx, ry) in ((x+2, y+2), (x+12, y+2), (x+2, y+12), (x+12, y+12)):
                    cv.r(rx, ry, 2, 2, drk(base, .24)); cv.px(rx, ry, lit(base, .3))
                if k == 'grate' and (hashf((x-x0)//16, (y-y0)//16) % 5 == 0):
                    for gy in range(y+5, y+11, 2): cv.r(x+4, gy, 8, 1, drk(base, .24))
        # slip-stripe lanes handled per room

# ---------------------------------------------------------------- wall band (top 48px)
def wall(cv, p, w, h=48):
    wl, wn, tr = hx(p['wall']), hx(p['wain']), hx(p['trim'])
    cv.r(0, 0, w, 32, wl)
    # soft panel verticals every 32 px (not dither)
    for x in range(0, w, 32):
        cv.r(x, 0, 1, 32, drk(wl, .10)); cv.r(x+1, 0, 1, 32, lit(wl, .10))
    cv.r(0, 0, w, 2, drk(wl, .22))                  # ceiling shadow
    cv.r(0, 2, w, 1, lit(wl, .12))
    cv.r(0, 30, w, 2, tr)                            # chair rail
    cv.r(0, 31, w, 1, drk(tr, .15))
    cv.r(0, 32, w, 13, wn)
    for x in range(0, w, 16):
        cv.r(x, 33, 1, 12, drk(wn, .18)); cv.r(x+1, 33, 1, 12, lit(wn, .08))
    cv.r(0, 32, w, 1, drk(wn, .25))
    cv.r(0, 45, w, 3, drk(wn, .38))                 # baseboard
    cv.r(0, 45, w, 1, lit(drk(wn, .38), .15))
    cv.r(0, 47, w, 1, OL)                           # floor/wall line
    # ceiling edge outline
    cv.r(0, 0, w, 1, OL)

def border(cv, w, h):
    cv.r(0, 0, 1, h, OL); cv.r(w-1, 0, 1, h, OL); cv.r(0, h-1, w, 1, OL)

# ---------------------------------------------------------------- props
def P(rect): return [int(v*T) for v in rect]
HUES = ['#c46040', '#3a8ac4', '#5a9438', '#8a58b8', '#e0a850', '#d0507a', '#3aa0a0', '#e07a40', '#6a78d0', '#9ac040', '#c04a68', '#4aa070']

def pshadow(cv, x, y, w, h, inset=2):
    cv.shadow_rect(x+inset, y+h-3, w, 5, .28)

def d_counter(cv, x, y, w, h, c=None):
    wood = hx('#5a3622')
    pshadow(cv, x, y, w, h)
    cv.ob(x, y, w, h//3+4, hx('#a8703a'))                 # top
    cv.r(x+1, y+h//3+3, w-2, 1, drk(hx('#a8703a'), .3))
    cv.ob(x, y+h//3+3, w, h-(h//3+3), wood)               # front
    pw = (w-8)//3
    for i in range(3):
        cv.r(x+4+i*(pw+0)+0, y+h//3+8, pw-3, h-(h//3+3)-12, drk(wood, .45))
        cv.r(x+4+i*pw, y+h//3+8, pw-3, 1, drk(wood, .6))
def d_chair(cv, x, y, w, h, c=None):
    col = hx(c or '#8e2230')
    cv.ellipse_shadow(x+w//2, y+h-3, w//2-2, 3, .3)
    cv.ob(x+5, y+3, w-10, 11, hx('#7a4a2a'))               # back
    cv.ob(x+4, y+13, w-8, 9, col)                          # seat
    cv.r(x+6, y+22, 3, 6, OL); cv.r(x+w-9, y+22, 3, 6, OL)
    cv.r(x+7, y+22, 1, 5, hx('#7a4a2a')); cv.r(x+w-8, y+22, 1, 5, hx('#7a4a2a'))
def d_rug(cv, x, y, w, h, c=('#8e2230', '#f6e2c4')):
    field, edge = hx(c[0]), hx(c[1])
    cv.r(x, y, w, h, edge); cv.r(x+3, y+3, w-6, h-6, field)
    cv.r(x+3, y+3, w-6, 1, drk(field, .3)); cv.r(x+3, y+3, 1, h-6, drk(field, .2))
    cv.r(x+6, y+6, w-12, h-12, drk(field, .12)); cv.r(x+7, y+7, w-14, h-14, field)
    cx, cy = x+w//2, y+h//2
    for dx, dy in ((0, -4), (-4, 0), (4, 0), (0, 4), (0, 0)): cv.r(cx+dx-2, cy+dy-2, 4, 4, lit(edge, 0))
    cv.r(cx-2, cy-2, 4, 4, field)
    for fx in range(x+2, x+w-2, 4): cv.r(fx, y-1, 2, 1, drk(edge, .15)); cv.r(fx, y+h, 2, 1, drk(edge, .15))
def d_poster(cv, x, y, w, h, c=None, idx=0):
    cv.ob(x, y, w, h, hx('#7a4a2a'))
    hues = [('#a8d0c8', '#5a9438', '#e0a850'), ('#f3c9a0', '#c46040', '#3a6460'), ('#d8c8f0', '#8a58b8', '#f6e2c4')][idx % 3]
    cv.r(x+3, y+3, w-6, h-6, hx(hues[0]))
    cv.r(x+3, y+h//2, w-6, h//2-3, hx(hues[1]))
    cv.r(x+w//2-2, y+6, 5, 5, hx(hues[2]))
    cv.r(x+3, y+h-6, w-6, 1, lit(hx(hues[1]), .3))
def d_plant(cv, x, y, w, h, c=None):
    cv.ellipse_shadow(x+w//2, y+h-2, w//2-1, 3, .3)
    pw = max(w*5//8, 10); px_ = x+(w-pw)//2
    cv.ob(px_, y+h-pw*3//5-2, pw, pw*3//5, hx('#c46040'))
    cv.r(px_+1, y+h-pw*3//5-2, pw-2, 2, hx('#e08060'))
    g1, g2, g3 = hx('#3a6824'), hx('#5a9438'), hx('#9ec85a')
    cx = x+w//2; base = y+h-pw*3//5-2
    for ox, oy, r in ((-w//4, 0, w//4), (w//4, -2, w//4), (0, -h//4, w//3), (0, -h//10, w//3)):
        cv.circle(cx+ox, base-4+oy-r//2, r, g2)
        cv.circle(cx+ox-1, base-5+oy-r//2, max(r-2, 1), g2)
    cv.r(cx-2, base-h//3-1, 3, 2, g3); cv.r(cx+3, base-h//4, 2, 2, g3)
def d_lamp(cv, x, y, w, h, c=None):
    cx = x+w//2
    cv.ellipse_shadow(cx, y+h-2, 6, 2, .3)
    cv.r(cx-1, y+h//3, 3, h*2//3-3, OL); cv.r(cx, y+h//3, 1, h*2//3-3, hx('#a8703a'))
    cv.ob(cx-5, y+h-6, 11, 4, hx('#7a4a2a'))
    cv.ob(cx-6, y+2, 13, h//3+2, hx('#f6e2c4'))
    cv.r(cx-5, y+4, 4, h//3-2, hx('#fff8e4'))
    # warm halo (flat translucent ring, no dither)
    cv.blend(cx-12, y-4, 25, 4, (255, 232, 176), .16); cv.blend(cx-9, y+6, 19, 8, (255, 232, 176), .12)
def d_window(cv, x, y, w, h):
    cv.r(x-4, y-4, w+8, h+8, drk(hx('#f6e2c4'), .1)); cv.r(x-4, y-4, w+8, 1, OL)
    cv.ob(x, y, w, h, hx('#a8d0c8'))
    cv.r(x+1, y+1, w-2, h//2, hx('#d8ecdf'))                     # sky
    cv.r(x+1, y+h//2, w-2, h//2-1, hx('#5a9bb8'))                # lake
    cv.r(x+1, y+h//2, w-2, 1, hx('#a8d0c8'))
    for i in range(3): cv.r(x+4+i*(w//3), y+h//2+3+(i % 2)*3, 6, 1, hx('#a8d0c8'))
    cv.r(x+w//2, y, 2, h, OL); cv.r(x, y+h//2-1, w, 2, OL)       # mullions
    cv.r(x-4, y+h+4, w+8, 3, hx('#a87040')); cv.r(x-4, y+h+4, w+8, 1, lit(hx('#a87040'), .3))
    # curtains
    for cxx, sgn in ((x-8, 1), (x+w+1, -1)):
        cv.r(cxx, y-6, 7, h+12, hx('#5a9438')); cv.r(cxx, y-6, 1, h+12, lit(hx('#5a9438'), .25))
        cv.r(cxx+3, y-6, 1, h+12, drk(hx('#5a9438'), .2)); cv.r(cxx, y+h//2-2, 7, 2, hx('#c46040'))
def d_shelf(cv, x, y, w):
    cv.ob(x, y, w, 4, hx('#7a4a2a'))
    cols = ['#f6e2c4', '#c46040', '#3a8ac4', '#e0a850', '#5a9438']
    cx = x+3
    i = hashf(x, y) % 5
    while cx < x+w-8:
        bw = 5+hashf(cx, y) % 4; bh = 7+hashf(cx, y, 3) % 4
        cv.ob(cx, y-bh, bw, bh, hx(cols[i % 5])); i += 1; cx += bw+2
def d_bench(cv, x, y, w, h, c=None):
    wood = hx('#8a5a3a')
    pshadow(cv, x, y, w, h)
    cv.r(x+3, y+h-10, 4, 9, OL); cv.r(x+w-7, y+h-10, 4, 9, OL)        # legs
    cv.ob(x, y+4, w, h-12, hx('#b88a5a'))
    cv.ob(x+1, y+h-14, w-2, 10, wood)                                  # front apron
    cv.ob(x+6, y-2, 10, 8, hx('#9aa8a4'))                              # vice
    cv.r(x+8, y+0, 6, 2, hx('#cdd8d4'))
    cv.r(x+w-22, y+2, 14, 3, hx('#cdd8d4')); cv.r(x+w-10, y+1, 4, 5, OL)   # wrench
    cv.ob(x+w//2-3, y+3, 7, 6, hx('#f6e2c4'));  cv.r(x+w//2-2, y+4, 5, 2, hx('#6a3a28'))  # mug
def d_desk(cv, x, y, w, h, c=None):
    pshadow(cv, x, y, w, h)
    cv.ob(x, y+8, w, h-8, hx('#b88a5a'))
    cv.r(x+1, y+h-8, w-2, 6, hx('#8a5a3a')); cv.r(x+4, y+h-7, 14, 4, drk(hx('#8a5a3a'), .4))
    # CRT
    cv.ob(x+w-26, y-4, 20, 18, hx('#e8dcc0'))
    cv.r(x+w-23, y-1, 14, 11, hx('#2a4a3a')); cv.r(x+w-22, y, 5, 3, hx('#9ec85a')); cv.r(x+w-21, y+5, 8, 1, hx('#5aa070'))
    cv.ob(x+w-22, y+14, 12, 3, hx('#d8ccb0'))
    cv.ob(x+6, y+12, 18, 5, hx('#e8dcc0'))                            # keyboard
    cv.ob(x+w//2-6, y+5, 12, 8, hx('#f6e2c4')); cv.r(x+w//2-4, y+7, 8, 1, hx('#7a8a9a')); cv.r(x+w//2-4, y+9, 6, 1, hx('#7a8a9a'))
def d_board(cv, x, y, w, h, label=''):
    if 'Whiteboard' in label:
        cv.ob(x, y, w, h, hx('#f6e2c4'))
        cv.r(x+3, y+3, w-6, h-6, hx('#fff8e4'))
        for i, ln in enumerate((18, 28, 12, 22)): cv.r(x+6, y+6+i*4, min(ln, w-14), 1, hx('#3a6a8a' if i % 2 == 0 else '#c46040'))
        cv.r(x+w-16, y+7, 9, 9, hx('#e0a850')); cv.r(x+w-14, y+9, 5, 5, hx('#fff8e4'))
        cv.r(x+3, y+h-3, w-6, 3, hx('#a87040'))
    else:   # Board A — status panel
        cv.ob(x, y, w, h, hx('#3c4a40'))
        cv.r(x+3, y+3, w-6, h-6, hx('#243028'))
        cols = ['#9ec85a', '#e0c860', '#c46040', '#4aa0c0']
        for r_ in range(3):
            for c_ in range((w-12)//10):
                col = cols[(hashf(r_, c_) % 4)]
                cv.r(x+6+c_*10, y+6+r_*10, 6, 6, OL); cv.r(x+7+c_*10, y+7+r_*10, 4, 4, hx(col)); cv.px(x+7+c_*10, y+7+r_*10, lit(hx(col), .5))
        cv.r(x+w-20, y+h-14, 14, 8, hx('#f6e2c4')); cv.r(x+w-18, y+h-12, 10, 1, hx('#3a6a8a')); cv.r(x+w-18, y+h-9, 6, 1, hx('#3a6a8a'))
def d_console(cv, x, y, w, h, c=None):
    pshadow(cv, x, y, w, h)
    cv.ob(x, y+6, w, h-6, hx('#4a5a68'))
    cv.ob(x+2, y, w-4, h//2, hx('#6a7a88'))                              # slanted panel
    cv.r(x+5, y+4, 14, 9, hx('#1c3a30')); cv.r(x+7, y+6, 10, 1, hx('#9ec85a')); cv.r(x+7, y+9, 6, 1, hx('#5aa070'))
    for i in range(max((w-28)//5, 0)):
        col = ['#c46040', '#e0c860', '#9ec85a', '#4aa0c0', '#c46040'][i % 5]
        cv.r(x+24+i*5, y+6, 3, 3, OL); cv.px(x+25+i*5, y+7, hx(col))
    for i in range(max((w-24)//7, 2)): cv.r(x+4+i*7, y+h//2+6, 5, 4, OL); cv.r(x+5+i*7, y+h//2+7, 3, 2, hx('#e8dcc0'))
    cv.r(x+w-8, y+h//2+4, 2, 7, OL); cv.circle(x+w-7, y+h//2+3, 2, hx('#c46040'))   # joystick
def d_cabinet(cv, x, y, w, h, c=None):
    pshadow(cv, x, y, w, h)
    col = hx('#7a9a8a')
    cv.ob(x, y, w, h, col)
    n = max(h//16, 2)
    for i in range(n):
        yy = y+3+i*((h-6)//n)
        cv.ob(x+3, yy, w-6, (h-6)//n-2, drk(col, .12))
        cv.r(x+w//2-3, yy+(h-6)//n//2-2, 6, 2, hx('#e8dcc0'))
    cv.r(x+4, y+2, 8, 1, hx('#f6e2c4'))
def d_prints(cv, x, y, w, h, c=None):
    cv.ob(x, y, w, h, hx('#7a4a2a'))
    cv.r(x+3, y+3, w-6, h-6, hx('#3a6a98'))
    for i in range(3): cv.r(x+5, y+6+i*(h//5), w-10, 1, hx('#a8d0f0'))
    cv.r(x+w//2-4, y+h//2-3, 8, 6, hx('#3a6a98')); cv.r(x+w//2-4, y+h//2-3, 8, 1, hx('#d8ecff')); cv.r(x+w//2-4, y+h//2+2, 8, 1, hx('#d8ecff'))
def d_valve(cv, x, y, w, h, c=None):
    cx = x+w//2
    cv.ellipse_shadow(cx, y+h-2, 6, 2, .3)
    cv.r(cx-2, y+h//3, 5, h*2//3-2, OL); cv.r(cx-1, y+h//3+1, 3, h*2//3-4, hx('#c46040')); cv.r(cx-1, y+h//3+1, 1, h*2//3-4, hx('#e08060'))
    cv.circle(cx, y+h//3-1, 6, hx('#c04040')); cv.circle(cx, y+h//3-1, 3, hx('#d86060'))
    cv.r(cx-5, y+h//3-2, 11, 2, hx('#c04040')); cv.r(cx-1, y+h//3-6, 2, 11, hx('#c04040'))
    cv.r(cx-1, y+h//3-2, 3, 3, hx('#7a2a2a'))
PIPE = hx('#c4783a')
def d_pipe_h(cv, x, y, w, h, c=None):
    yy = y+(h-8)//2
    cv.r(x, yy, w, 8, OL); cv.r(x, yy+1, w, 6, PIPE); cv.r(x, yy+1, w, 2, lit(PIPE, .3)); cv.r(x, yy+5, w, 2, drk(PIPE, .22))
    for fx in range(x+4, x+w-4, 24): cv.r(fx, yy-2, 4, 12, OL); cv.r(fx+1, yy-1, 2, 10, hx('#8a8a8a')); cv.r(fx+1, yy-1, 1, 10, hx('#c8c8c0'))
    cv.shadow_rect(x, yy+8, w, 2, .25)
def d_pipe_v(cv, x, y, w, h, c=None):
    xx = x+(w-8)//2
    cv.r(xx, y, 8, h, OL); cv.r(xx+1, y, 6, h, PIPE); cv.r(xx+1, y, 2, h, lit(PIPE, .3)); cv.r(xx+5, y, 2, h, drk(PIPE, .22))
    for fy in range(y+4, y+h-4, 24): cv.r(xx-2, fy, 12, 4, OL); cv.r(xx-1, fy+1, 10, 2, hx('#8a8a8a'))
def d_pipe_corner(cv, x, y, w, h, c=None):
    cv.r(x+4, y+4, 8, 12, OL); cv.r(x+5, y+5, 6, 11, PIPE); cv.r(x+5, y+5, 2, 11, lit(PIPE, .3))
    cv.r(x-4, y+4, 16, 8, OL); cv.r(x-4, y+5, 15, 6, PIPE); cv.r(x-4, y+5, 15, 2, lit(PIPE, .3)); cv.r(x+5, y+5, 6, 6, PIPE)
    cv.r(x+4, y+2, 8, 3, OL); cv.r(x+5, y+3, 6, 1, hx('#8a8a8a'))
def d_railing(cv, x, y, w, h, c=None):
    cv.shadow_rect(x, y+h-3, w, 3, .25)
    cv.r(x, y+4, w, 3, OL); cv.r(x, y+5, w, 1, hx('#e0c860')); cv.r(x, y+8, w, 2, OL); cv.r(x, y+8, w, 1, hx('#e0c860'))
    for px_ in range(x, x+w, 12): cv.r(px_, y+2, 3, h-3, OL); cv.r(px_+1, y+3, 1, h-5, hx('#e0c860'))
    cv.r(x+w-3, y+2, 3, h-3, OL); cv.r(x+w-2, y+3, 1, h-5, hx('#e0c860'))
def d_dose(cv, x, y, w, h, c=None):
    cv.ob(x+1, y+1, w-2, h-2, hx('#e0c860'))
    cv.circle(x+w//2, y+h//2, 3, OL); cv.px(x+w//2, y+h//2, hx('#e0c860'))
    for ax, ay in ((0, -4), (-3, 2), (3, 2)): cv.r(x+w//2+ax-1, y+h//2+ay-1, 2, 2, OL)
def d_couch(cv, x, y, w, h, c='#c4783a'):
    col = hx(c)
    cv.shadow_rect(x+1, y+h-2, w, 4, .28)
    cv.ob(x, y, w, h//2+2, drk(col, .12))                          # back
    cv.ob(x-2, y+h//2-2, 8, h//2+2, col); cv.ob(x+w-6, y+h//2-2, 8, h//2+2, col)   # arms
    cv.ob(x+5, y+h//2, w-10, h//2-1, lit(col, .08))                # seat
    cv.r(x+w//2, y+h//2+1, 1, h//2-3, drk(col, .3))
    cv.r(x+3, y+h-4, 3, 4, OL); cv.r(x+w-6, y+h-4, 3, 4, OL)
def d_vending(cv, x, y, w, h, c=None):
    pshadow(cv, x, y, w, h)
    cv.ob(x, y, w, h, hx('#c04a38'))
    cv.ob(x+3, y+4, w-12, h-14, hx('#3a4a58'))
    cols = ['#f6e2c4', '#e0a850', '#9ec85a', '#4aa0c0']
    for r_ in range(3):
        for c_ in range(3): cv.r(x+5+c_*(w-18)//3, y+7+r_*(h-22)//3, 4, 5, hx(cols[(r_+c_) % 4]))
    cv.r(x+4, y+5, 2, h-16, hx('#6a7a88'))
    cv.ob(x+w-8, y+6, 5, 12, hx('#e8dcc0')); cv.r(x+w-7, y+8, 3, 2, hx('#c04a38'))
    cv.ob(x+3, y+h-8, w-6, 5, hx('#2a1610'))
    cv.r(x+4, y+1, w-8, 2, hx('#f6e2c4'))                         # sign
def d_kettle(cv, x, y, w, h, c=None):
    pshadow(cv, x, y, w, h)
    cv.ob(x, y+h//3, w, h*2//3, hx('#a8703a'))                    # kitchenette cabinet
    cv.ob(x, y+h//3-4, w, 6, hx('#e8dcc0'))                       # counter top
    kx = x+w//2-6
    cv.ob(kx, y-6, 13, 12, hx('#d08040')); cv.r(kx+1, y-5, 4, 8, hx('#f0a860'))     # kettle
    cv.r(kx+4, y-9, 5, 3, OL); cv.r(kx-3, y-3, 3, 2, OL); cv.r(kx+13, y-4, 3, 5, OL)
    cv.ob(x+4, y-2, 7, 7, hx('#f6e2c4')); cv.ob(x+w-14, y-2, 7, 7, hx('#3a8ac4'))     # mugs
    cv.r(x+6, y+h//3+4, w-12, 1, drk(hx('#a8703a'), .4)); cv.r(x+w//2-1, y+h//3+6, 3, 3, hx('#f6e2c4'))
def d_microwave(cv, x, y, w, h, c=None):
    cv.ob(x, y, w, h, hx('#c8c8c0')); cv.r(x+2, y+3, w-8, h-6, hx('#2a3a40')); cv.r(x+w-5, y+3, 3, 3, hx('#9ec85a'))
def d_crane(cv, x, y, w, h, c=None):
    cv.shadow_rect(x, y+h+2, w, 6, .22)
    cv.ob(x, y, w, h, hx('#e0c860'))
    for sx in range(x+4, x+w-4, 8): cv.r(sx, y+1, 4, h-2, hx('#c4a030')); cv.r(sx, y+1, 4, 1, OL)
    cv.ob(x+w//2-9, y-4, 18, h+8, hx('#c46040'))
    cv.r(x+w//2-1, y+h+4, 2, 14, OL); cv.r(x+w//2, y+h+4, 1, 14, hx('#8a8a8a'))
    cv.ob(x+w//2-4, y+h+16, 9, 6, hx('#8a8a8a'))
def d_core(cv, x, y, w, h, c=None):
    cx, cy = x+w//2, y+h//2; R = min(w, h)//2
    cv.ellipse_shadow(cx, cy+R-6, R, 8, .3)
    cv.circle(cx, cy, R-1, hx('#7a8a8e'))
    cv.d.ellipse([cx-R+4, cy-R+4, cx+R-5, cy+R-5], fill=drk(hx('#7a8a8e'), .25))
    cv.circle(cx, cy, R-8, hx('#2a5a62'))
    cv.d.ellipse([cx-R+11, cy-R+11, cx+R-12, cy+R-12], fill=hx('#4ac0c0'))
    cv.d.ellipse([cx-R+16, cy-R+16, cx+R-17, cy+R-17], fill=hx('#9ee8e0'))
    for i in range(7):      # fuel-hex grid
        a = i/7*math.tau; cv.r(cx+int(math.cos(a)*(R-14))-1, cy+int(math.sin(a)*(R-14))-1, 3, 3, hx('#2a5a62'))
    for i in range(12):
        a = i/12*math.tau; bx, by = cx+int(math.cos(a)*(R-4)), cy+int(math.sin(a)*(R-4))
        cv.r(bx-1, by-1, 3, 3, OL); cv.px(bx, by, hx('#c8d4d4'))
    cv.px(cx-6, cy-8, hx('#fff8e4')); cv.px(cx-5, cy-8, hx('#fff8e4'))
def d_cab(cv, x, y, w, h, hue='#c46040', label=''):
    col = hx(hue)
    cv.ellipse_shadow(x+w//2, y+h-1, w//2+1, 3, .32)
    cv.ob(x, y+6, w, h-6, col)                                   # body
    cv.ob(x+1, y, w-2, 9, lit(col, .15))                         # marquee
    cv.r(x+4, y+3, w-8, 3, hx('#fff4e0'))
    for i in range(4): cv.px(x+6+i*5, y+4, hx('#2a1610'))
    cv.ob(x+3, y+11, w-6, 12, hx('#1c2a30'))                     # bezel
    sc = mix(col, '#f6e2c4', .55)
    cv.r(x+5, y+13, w-10, 8, drk(sc, .5)); cv.r(x+5, y+13, w-10, 1, sc)
    cv.r(x+7, y+15, 4, 3, sc); cv.r(x+w-12, y+17, 4, 3, hx('#ffe8b0'))
    cv.blend(x-3, y+10, w+6, 16, lit(col, .4), .10)              # screen glow
    cv.ob(x+2, y+24, w-4, 5, drk(col, .25))                      # control deck
    cv.circle(x+8, y+26, 1, hx('#2a1610')); cv.px(x+8, y+24, hx('#c04040'))
    cv.r(x+w-12, y+26, 2, 2, hx('#e0c860')); cv.r(x+w-8, y+26, 2, 2, hx('#9ec85a'))
    cv.r(x+4, y+h-10, w-8, 8, drk(col, .15)); cv.r(x+w//2-3, y+h-9, 6, 4, hx('#2a1610'))
def d_lototo(cv, x, y, w, h, c=None):
    pshadow(cv, x, y, w, h)
    cv.ob(x, y, w, h, hx('#c04a38'))
    cv.ob(x+3, y+4, w-6, h-8, hx('#f6e2c4'))
    for r_ in range(3):
        for c_ in range(3):
            cx = x+8+c_*((w-14)//2); cy = y+10+r_*((h-20)//2)
            cv.r(cx-1, cy-2, 3, 3, OL); cv.r(cx-2, cy, 5, 4, hx(['#e0c860', '#4aa0c0', '#c04a38'][(r_+c_) % 3])); cv.r(cx-2, cy, 5, 1, OL)
    cv.r(x+4, y+1, w-8, 3, hx('#e0c860'))
def d_van(cv, x, y, w, h, c=None):
    cv.ellipse_shadow(x+w//2, y+h-4, w//2, 5, .3)
    cv.ob(x, y+4, w, h-12, hx('#f6e2c4'))
    cv.ob(x+w-26, y+8, 22, 12, hx('#a8d0c8'))
    cv.r(x+w-14, y+8, 2, 12, OL)
    cv.r(x+1, y+h-18, w-2, 4, hx('#3a6460'))
    cv.ob(x+6, y+h-14, 14, 14, hx('#3b2318')); cv.circle(x+13, y+h-8, 4, hx('#8a8a8a'))
    cv.ob(x+w-24, y+h-14, 14, 14, hx('#3b2318')); cv.circle(x+w-17, y+h-8, 4, hx('#8a8a8a'))
    cv.r(x+8, y+10, 20, 3, hx('#c46040'))
    cv.r(x+8, y+16, 14, 2, hx('#c46040'))
    cv.r(x+w-2, y+h-16, 3, 3, hx('#e0c860'))
def d_boom(cv, x, y, w, h, c=None):
    cv.shadow_rect(x, y+h-3, w, 4, .25)
    cv.ob(x+4, y+h-14, 8, 14, hx('#7a8a8e'))
    for i in range(0, 10, 2): cv.r(x+2, y+4+i*1, 12, 1, hx('#c04a38'))
    cv.ob(x+1, y+2, 14, 8, hx('#f6e2c4')); cv.r(x+3, y+3, 4, 6, hx('#c04a38')); cv.r(x+9, y+3, 4, 6, hx('#c04a38'))
def d_fence(cv, x, y, w, h, c=None):
    cv.r(x+6, y+4, 4, h-4, OL); cv.r(x+7, y+5, 2, h-6, hx('#f6e2c4'))
    cv.r(x+4, y+4, 8, 2, hx('#f6e2c4')); cv.r(x+4, y+3, 8, 1, OL)
    cv.r(x, y+8, w, 2, OL); cv.r(x, y+9, w, 1, hx('#d4be98'))
def d_stack(cv, x, y, w, h, c=None):
    cv.shadow_rect(x+2, y+h-4, w, 6, .26)
    cv.ob(x+4, y-10, w-8, h+4, hx('#e8dcc0'))
    for i in range(3): cv.r(x+5, y-6+i*10, w-10, 4, hx('#c04a38'))
    cv.ob(x+2, y-14, w-4, 5, hx('#8a8a8a'))
    cv.blend(x+8, y-26, 14, 12, (255, 255, 255), .5); cv.blend(x+12, y-34, 10, 8, (255, 255, 255), .3)   # steam

PROP = dict(counter=d_counter, chair=d_chair, poster=d_poster, plant=d_plant, lamp=d_lamp, bench=d_bench, desk=d_desk,
            board=d_board, console=d_console, cabinet=d_cabinet, prints=d_prints, valve=d_valve, pipe_h=d_pipe_h,
            pipe_v=d_pipe_v, pipe_corner=d_pipe_corner, pipe_run=d_pipe_h, railing=d_railing, dose=d_dose, couch=d_couch,
            vending=d_vending, kettle=d_kettle, microwave=d_microwave, crane=d_crane, core=d_core, van=d_van, boom=d_boom,
            fence=d_fence, stack=d_stack, cab_lototo=d_lototo)

# ---------------------------------------------------------------- parse ROOMS from content.ts
def parse_rooms(path):
    s = open(path).read()
    i0 = s.find('export const ROOMS')
    out = {}
    seg = s[i0:]
    starts = [(m.start(), m.group(1)) for m in re.finditer(r'\n  (\w+): \{\n    id: "\w+",', seg)]
    for n, (st, rid) in enumerate(starts):
        body = seg[st:(starts[n+1][0] if n+1 < len(starts) else len(seg))]
        def num(k):
            mm = re.search(r'\b'+k+r': (\d+) \* TILE', body); return int(mm.group(1)) if mm else None
        w, h = num('w'), num('h')
        doors = [(d[0], [float(v) for v in d[1].split(',')]) for d in re.findall(r'to: "(\w+)", rect: t\(([^)]*)\)', body) for d in [(d[0], d[1]) for d in [d]]] if False else \
                [(a, [float(v) for v in b.split(',')]) for a, b in re.findall(r'to: "(\w+)", rect: t\(([^)]*)\)', body)]
        props = []
        for kind_blk in re.finditer(r'\{ rect: t\(([^)]*)\), kind: "(\w+)"(?:, label: "([^"]*)")?([^}]*)\}', body):
            props.append(dict(rect=[float(v) for v in kind_blk.group(1).split(',')], kind=kind_blk.group(2), label=kind_blk.group(3) or ''))
        win = [[float(v) for v in a.split(',')] for a in re.findall(r'windows: \[\{ rect: t\(([^)]*)\)', body)]
        out[rid] = dict(w=w, h=h, doors=doors, props=props, win=win)
    return out
