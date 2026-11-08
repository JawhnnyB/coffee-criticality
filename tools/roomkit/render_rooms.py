import os
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *
import ref
import security_kit as sk   # Site Access: registers its props and palette on import

ROOMS = parse_rooms(os.environ.get('CONTENT_TS','src/game/content.ts'))
OUT = os.environ.get('ROOMS_OUT','docs/preview/rooms')
os.makedirs(OUT, exist_ok=True)

# ---- characters for scale (hand grid from ref.py)
CAST = ref.casts
def sprite(i):
    return ref.render(ref.build(None), CAST[i])
def put_char(cv, i, cx, feet_y):
    sp = sprite(i)
    cv.ellipse_shadow(cx, feet_y-1, 6, 2, .32)
    cv.im.alpha_composite(sp, (cx-8, feet_y-26))

# ---- wall dressing per room
def dress(cv, rid, p, W, occ):
    def ok(x, w, pad=6):
        return all(x+w+pad <= a or x-pad >= b for a, b in occ)
    def neon(x, y, w, col):
        cv.r(x, y, w, 3, OL); cv.r(x+1, y+1, w-2, 1, hx(col)); cv.blend(x-3, y-3, w+6, 9, hx(col), .18)
    def board(x):
        if not ok(x, 36): return
        cv.ob(x, 6, 36, 22, hx('#a8703a')); cv.r(x+3, 9, 30, 16, hx('#d8b078'))
        for j in range(3): cv.r(x+5+j*9, 11+(j % 2)*4, 7, 8, hx(['#f6e2c4', '#f0c878', '#a8d0c8'][j])); cv.px(x+8+j*9, 11+(j % 2)*4, hx('#c04a38'))
    def gauge(cx):
        if not ok(cx-10, 20): return
        cv.circle(cx, 16, 9, hx('#f6e2c4')); cv.circle(cx, 16, 7, hx('#fff8e4'))
        a = (-1.0+(cx % 3)*.9); cv.d.line([cx, 17, cx+int(math.cos(a)*6), 17+int(math.sin(a)*6)], fill=OL); cv.r(cx-1, 22, 3, 1, hx('#c04a38'))
    def sconce(x):
        if not ok(x, 8): return
        cv.ob(x, 10, 8, 10, hx('#f6e2c4')); cv.blend(x-8, 6, 24, 24, (255, 232, 176), .14)
    def window(x, w, h=24):
        if ok(x-8, w+16): d_window(cv, x, 6, w, h)
    if rid == 'cafe':
        window(96, 80, 26)
        d_shelf(cv, 192, 14, 56); d_shelf(cv, 192, 30, 56)
        cv.ob(272, 4, 36, 28, hx('#7a4a2a')); cv.r(275, 7, 30, 22, hx('#4a5c30'))
        for i, ln in enumerate((18, 26, 14, 22)): cv.r(278, 10+i*5, ln, 1, hx('#f6e2c4'))
        cv.r(262, 3, 1, 1, OL)
    elif rid == 'parlor':
        neon(60, 8, 84, '#ff6aa8'); neon(70, 16, 64, '#6ac8ff')
        for i in range(3):
            if ok(176+i*40+6, 20): d_poster(cv, 176+i*40+6, 6, 20, 24, None, i)
        for i in range(3):
            if ok(290+i*30, 20): d_poster(cv, 290+i*30, 6, 20, 24, None, i+1)
    elif rid == 'corridor':
        for x in (28, 124, 220, 300): board(x)
        for x in (100, 196, 268, 364): sconce(x)
        if ok(4, 14): cv.ob(4, 8, 10, 18, hx('#c04a38')); cv.r(6, 10, 6, 5, hx('#2a1610'))
        sk.corridor_plate(cv)   # wayfinding plate, 80x42 at (24,3); replaces the board at x=28
    elif rid == 'security':
        sk.dress_sec(cv, W)
    elif rid == 'control':
        for cx in (80, 106, 132): gauge(cx)
        if ok(280, 40): cv.circle(300, 16, 10, hx('#f6e2c4')); cv.circle(300, 16, 8, hx('#fff8e4')); cv.r(300, 10, 1, 7, OL); cv.r(300, 16, 5, 1, OL)
        if ok(190, 44): cv.ob(190, 6, 44, 22, hx('#3c4a40')); cv.r(193, 9, 38, 16, hx('#243028'))
        if ok(190, 44):
            for i in range(5): cv.r(196+i*7, 13+(i % 2)*6, 4, 4, hx(['#9ec85a', '#e0c860', '#c46040'][i % 3]))
    elif rid == 'engineering':
        cv.ob(60, 6, 76, 24, hx('#a8703a')); cv.r(63, 9, 70, 18, hx('#d8b078'))
        for i in range(8): cv.r(67+i*8, 12, 2, 10, OL); cv.r(66+i*8, 12, 4, 2, hx(['#c8c8c0', '#e0c860'][i % 2]))
        if ok(310, 30): cv.circle(325, 16, 10, hx('#f6e2c4')); cv.circle(325, 16, 8, hx('#fff8e4')); cv.r(325, 10, 1, 7, OL); cv.r(325, 16, 5, 1, OL)
    elif rid == 'breakroom':
        window(100, 56)
        cv.ob(24, 6, 22, 24, hx('#f6e2c4')); cv.r(26, 8, 18, 5, hx('#c04a38'))
        for r_ in range(3):
            for c_ in range(4): cv.r(27+c_*4, 15+r_*4, 3, 3, hx('#3a6a8a') if (r_+c_) % 3 else hx('#c46040'))
        if ok(176, 36): cv.ob(176, 8, 36, 20, hx('#7a4a2a')); cv.r(179, 11, 30, 14, hx('#f3c9a0')); cv.r(179, 20, 30, 5, hx('#9ec85a'))
        if ok(216, 36): d_shelf(cv, 220, 22, 36)
    elif rid == 'reactor':
        for x in range(0, W, 64):
            for k in range(0, 64, 8):
                cv.r(x+k, 40, 4, 5, hx('#e0c860')); cv.r(x+k+4, 40, 4, 5, hx('#3b2318'))
        for x in (40, 136, 232, 296):
            if ok(x, 18): 
                cv.ob(x, 8, 18, 18, hx('#e0c860')); cv.circle(x+9, 17, 5, OL); cv.px(x+9, 17, hx('#e0c860'))
                for ax, ay in ((0, -4), (-3, 2), (3, 2)): cv.r(x+9+ax-1, 17+ay-1, 2, 2, OL)
        cv.r(0, 14, W, 5, OL); cv.r(0, 15, W, 3, hx('#8a8a8a')); cv.r(0, 15, W, 1, hx('#c8d4d4'))
    elif rid == 'maintenance':
        for y in (10, 22):
            cv.r(0, y, W, 5, OL); cv.r(0, y+1, W, 3, hx('#c4783a')); cv.r(0, y+1, W, 1, hx('#e8a060'))
            for x in range(8, W, 56): cv.r(x, y-2, 4, 9, OL); cv.r(x+1, y-1, 2, 7, hx('#8a8a8a'))

# ---- doors
def draw_doors(cv, rid, p, W, H, doors):
    for to, (x, y, w, h) in doors:
        X, Y, Wd, Hd = int(x*T), int(y*T), int(w*T), int(h*T)
        warm = hx('#f0c878'); frame = hx('#7a4a2a')
        if Y == 0:     # top wall door
            cv.r(X-3, 2, Wd+6, 46, OL); cv.r(X-2, 3, Wd+4, 44, frame)
            cv.r(X, 6, Wd, 41, hx('#2a1610')); cv.r(X, 6, Wd, 41, drk(warm, .55))
            cv.blend(X, 6, Wd, 41, warm, .35)
            cv.r(X, 6, Wd, 3, drk(frame, .4))
            cv.r(X-2, 3, Wd+4, 2, lit(frame, .3))
            lw = Wd//2
            for lx in (X, X+lw):
                cv.r(lx+1, 9, lw-2, 37, OL); cv.r(lx+2, 10, lw-4, 35, hx('#a8703a'))
                cv.r(lx+2, 10, lw-4, 1, lit(hx('#a8703a'), .3))
                cv.r(lx+5, 14, lw-10, 14, OL); cv.r(lx+6, 15, lw-12, 12, hx('#d8ecdf')); cv.r(lx+6, 15, 3, 12, hx('#fff8e4'))
                cv.r(lx+5, 33, lw-10, 10, drk(hx('#a8703a'), .15))
            cv.r(X+lw-3, 28, 2, 6, hx('#e0c860')); cv.r(X+lw+1, 28, 2, 6, hx('#e0c860'))
            cv.r(X-6, 46, Wd+12, 2, hx('#e0c860'))
        elif X == 0:   # left door
            cv.r(0, Y-2, 6, Hd+4, OL); cv.r(1, Y-1, 4, Hd+2, frame)
            cv.r(0, Y, 3, Hd, drk(warm, .5)); cv.r(3, Y, 4, Hd, hx('#e0c860')); cv.r(3, Y, 4, 1, lit(hx('#e0c860'), .4))
        elif X+Wd == W:  # right door
            cv.r(W-6, Y-2, 6, Hd+4, OL); cv.r(W-5, Y-1, 4, Hd+2, frame)
            cv.r(W-3, Y, 3, Hd, drk(warm, .5)); cv.r(W-7, Y, 4, Hd, hx('#e0c860')); cv.r(W-7, Y, 4, 1, lit(hx('#e0c860'), .4))
        else:           # bottom door
            cv.r(X-3, H-6, Wd+6, 6, OL); cv.r(X-2, H-5, Wd+4, 4, frame)
            cv.r(X, H-4, Wd, 4, drk(warm, .5))
            cv.r(X, H-12, Wd, 6, hx('#e0c860')); cv.r(X, H-12, Wd, 1, lit(hx('#e0c860'), .4))
            # mat
            cv.r(X+4, H-24, Wd-8, 10, drk(hx(p['accent']), .1)); cv.r(X+4, H-24, Wd-8, 1, lit(hx(p['accent']), .2)); cv.r(X+6, H-22, Wd-12, 6, drk(hx(p['accent']), .22))

# ---- per-prop dispatch
def draw_prop(cv, rid, p, pr, idx, state):
    k, (x, y, w, h), label = pr['kind'], pr['rect'], pr['label']
    X, Y, Wd, Hd = int(x*T), int(y*T), int(w*T), int(h*T)
    if k == 'rug':
        d_rug(cv, X, Y, Wd, Hd, p['rug']); return
    if k == 'poster':
        if Y >= 48:   # floor-standing easel sign
            cv.ellipse_shadow(X+Wd//2, Y+Hd-1, Wd//2, 3, .3)
            cv.r(X+4, Y+Hd-12, 3, 11, OL); cv.r(X+Wd-7, Y+Hd-12, 3, 11, OL)
            cv.r(X+5, Y+Hd-12, 1, 10, hx('#a8703a')); cv.r(X+Wd-6, Y+Hd-12, 1, 10, hx('#a8703a'))
            d_poster(cv, X, Y, Wd, Hd-8, None, idx)
        else:
            d_poster(cv, X+2, Y+2, Wd-4, Hd-4, None, idx)
        # on walls (y<3) fine; on floor-standing signs they stay as easels
        return
    if k == 'counter':
        d_counter(cv, X, Y, Wd, Hd)
        cv.ob(X+Wd-34, Y-12, 14, 14, hx('#d08040')); cv.r(X+Wd-33, Y-11, 4, 10, hx('#f0a860')); cv.r(X+Wd-30, Y-15, 6, 3, OL)   # copper kettle
        cv.ob(X+10, Y-4, 7, 7, hx('#f6e2c4')); cv.ob(X+20, Y-4, 7, 7, hx('#3a8ac4'))
        cv.ob(X+Wd-14, Y-6, 8, 8, hx('#c46040')); cv.r(X+Wd-12, Y-12, 4, 6, hx('#5a9438')); return
    if k == 'chair':
        d_chair(cv, X, Y, Wd, Hd, {'cafe': '#8e2230', 'engineering': '#3a6a8a', 'control': '#c4783a'}.get(rid, '#8e2230')); return
    if k == 'couch':
        d_couch(cv, X, Y, Wd, Hd, '#c46040'); return
    if k == 'board':
        d_board(cv, X, Y, Wd, Hd, label); return
    if k == 'plant':
        d_plant(cv, X, Y, Wd, Hd); return
    if k.startswith('cab_') and k != 'cab_lototo':
        d_cab(cv, X, Y, Wd, Hd, HUES[state['cab'] % len(HUES)], label); state['cab'] += 1; return
    f = PROP.get(k)
    if f: f(cv, X, Y, Wd, Hd)

LAYOUT_CHARS = {
 'cafe':        [(0, 270, 150), (2, 150, 120)],
 'parlor':      [(0, 190, 120), (3, 150, 230)],
 'corridor':    [(0, 180, 160), (1, 80, 190)],
 'control':     [(0, 190, 200), (2, 120, 190)],
 'engineering': [(0, 190, 150), (1, 100, 210)],
 'breakroom':   [(0, 140, 150), (3, 70, 190)],
 'reactor':     [(0, 60, 130), (1, 260, 195)],
 'maintenance': [(0, 190, 190), (2, 280, 170)],
 'security':    [(1, 120, 196), (3, 205, 146)],
}

def render_room(rid, chars=True, which=None, border_on=True):
    R = ROOMS[rid]; W, H = R['w']*T, R['h']*T
    p = ROOM[rid]
    cv = Cv(W, H)
    floor(cv, p, 0, 48, W, H-48)
    wall(cv, p, W)
    occ = [(int(pr['rect'][0]*T), int((pr['rect'][0]+pr['rect'][2])*T)) for pr in R['props'] if pr['rect'][1]*T < 40 and pr['kind'] in ('poster', 'prints', 'board', 'lamp', 'plant', 'cabinet')]
    occ += [(int(d[1][0]*T)-6, int((d[1][0]+d[1][2])*T)+6) for d in R['doors'] if d[1][1] == 0]
    dress(cv, rid, p, W, occ)
    if rid in ('cafe', 'breakroom', 'engineering'):
        wx = {'cafe': 96, 'breakroom': 100, 'engineering': 200}[rid]; ww = {'cafe': 80, 'breakroom': 56, 'engineering': 60}[rid]
        for i in range(34):
            cv.blend(wx+i//2+4, 48+i*2, ww-8, 2, (255, 240, 190), .10)
    if rid == 'reactor':
        cx, cy = int(11.5*T), int(6.5*T)
        for r_, a in ((86, .06), (64, .08), (42, .10)):
            ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(ov).ellipse([cx-r_, cy-int(r_*.75), cx+r_, cy+int(r_*.75)], fill=(120, 232, 224, int(255*a)))
            cv.im.alpha_composite(ov)
        cv.r(7*16, 3*16+0, 0, 0, hx('#000000'))
    if rid == 'security':
        sk.under(cv, W, H)
    draw_doors(cv, rid, p, W, H, R['doors'])
    state = dict(cab=0)
    props = sorted(R['props'], key=lambda pr: (pr['kind'] == 'rug' and -1 or 0, pr['rect'][1]+pr['rect'][3]))
    for i, pr in enumerate(props):
        if which is not None and i != which:
            if pr['kind'].startswith('cab_') and pr['kind'] != 'cab_lototo':
                state['cab'] += 1
            continue
        draw_prop(cv, rid, p, pr, i, state)
    if chars:
        for ci, cx, fy in LAYOUT_CHARS[rid]:
            put_char(cv, ci, cx, fy)
    if border_on:
        border(cv, W, H)
    return cv

if __name__ == '__main__':
    ids = sys.argv[1:] or list(ROOM)
    for rid in ids:
        cv = render_room(rid)
        cv.save(f'{OUT}/{rid}.png'); cv.save(f'{OUT}/{rid}-3x.png', 3)
        print(rid, cv.w, cv.h)
