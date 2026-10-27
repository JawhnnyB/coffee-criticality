import os
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *
import ref
OUT = os.environ.get('ROOMS_OUT','docs/preview/rooms')
W, H = 96*T, 40*T
from PIL import ImageDraw
PIECES = []
RECORD = False

def note(kind, foot, fn):
    """Draw fn on the lot. When RECORD is set, also keep a transparent stamp."""
    global cv
    if not RECORD:
        fn()
        return
    host = cv
    alone = Cv(W, H)
    cv = alone
    fn()
    cv = host
    host.d = ImageDraw.Draw(host.im)
    box = alone.im.getbbox()
    if not box:
        return
    crop = alone.im.crop(box)
    host.im.alpha_composite(crop, (box[0], box[1]))
    PIECES.append({"kind": kind, "foot": int(foot), "x": box[0], "y": box[1], "im": crop})

def t(x, y, w, h): return [int(x*T), int(y*T), int(w*T), int(h*T)]

def draw_all(objects=True, border_on=True):
    global cv, rnd
    cv = Cv(W, H)
    rnd = random.Random(7)

    # ---------------- ground: grass
    G1, G2, G3 = hx('#8cb85c'), hx('#84b258'), hx('#a4cc6c')
    cv.r(0, 0, W, H, G1)
    for y in range(0, H, 16):
        for x in range(0, W, 16):
            if hashf(x//16, y//16) % 3 == 0: cv.r(x+2, y+3, 12, 9, G2); cv.r(x+5, y+1, 8, 14, G2)
    for _ in range(900):                      # grass tufts
        x, y = rnd.randrange(W-4), rnd.randrange(H-4)
        cv.r(x, y, 1, 3, G3); cv.r(x+2, y+1, 1, 2, G3)
    for _ in range(110):                      # flowers
        x, y = rnd.randrange(W-3), rnd.randrange(H-3)
        c = rnd.choice(['#fff4e0', '#f0c878', '#e89070', '#d8c8f0'])
        cv.r(x, y, 2, 2, hx(c)); cv.px(x, y, lit(hx(c), .4))

    # ---------------- far shore + lake (rows 0..5)
    cv.r(0, 0, W, 48, hx('#6a9a50'))
    for x in range(0, W, 24):                 # treeline
        h = 18+hashf(x//24, 3) % 14
        cv.circle(x+12, 26, 13, hx('#3a6a34'))
        cv.circle(x+10, 22, 9, hx('#4a8040')); cv.px(x+6, 18, hx('#9ec85a')); cv.px(x+7, 18, hx('#9ec85a'))
        cv.r(x+10, 36, 3, 10, OL); cv.r(x+11, 36, 1, 10, hx('#7a4a2a'))
    cv.r(0, 44, W, 4, hx('#c8b080')); cv.r(0, 44, W, 1, lit(hx('#c8b080'), .3))     # sand bank
    WAT = (0, 48, W, 48)
    cv.r(0, 48, W, 48, hx('#4a8ab0'))
    for yy, c in ((48, '#6aa8c8'), (56, '#5a9bb8'), (72, '#4a8ab0'), (88, '#3f7aa0')):
        cv.r(0, yy, W, 8 if yy < 88 else 8, hx(c))
    for _ in range(120):
        x, y = rnd.randrange(W-12), 50+rnd.randrange(42)
        cv.r(x, y, rnd.choice([6, 8, 10]), 1, hx('#a8d0e0'))
    cv.r(0, 96, W, 4, hx('#c8b080')); cv.r(0, 96, W, 1, lit(hx('#c8b080'), .3)); cv.r(0, 99, W, 1, drk(hx('#c8b080'), .3))
    cv.r(0, 47, W, 1, OL); cv.r(0, 100, W, 1, drk(hx('#c8b080'), .45))
    for x in range(6, W, 40):                  # reeds on the near bank
        cv.r(x, 92, 1, 6, hx('#3a6824')); cv.r(x+2, 90, 1, 8, hx('#5a9438')); cv.r(x+4, 93, 1, 5, hx('#3a6824')); cv.r(x+2, 88, 2, 3, hx('#a87040'))

    # ---------------- asphalt, curb, stripes
    ASP, ASPD, ASPL = hx('#78747c'), drk(hx('#78747c'), .07), lit(hx('#78747c'), .07)
    def asphalt(x, y, w, h):
        cv.r(x, y, w, h, ASP)
        for yy in range(y, y+h, 16):
            for xx in range(x, x+w, 16):
                if hashf(xx//16, yy//16, 2) % 4 == 0: cv.r(xx, yy, 16, 16, ASPD)
                if hashf(xx//16, yy//16, 9) % 7 == 0: cv.r(xx+5, yy+6, 4, 1, ASPL)
        cv.r(x, y, w, 1, OL); cv.r(x, y+h-1, w, 1, OL)
    asphalt(*t(12, 9, 41, 4)); asphalt(*t(14, 13, 22, 8))
    # dashed centre line on road
    for x in range(14*T, 52*T, 24): cv.r(x, 11*T-1, 12, 2, hx('#f0c878'))
    # parking bay lines
    for i in range(14, 36, 4):
        cv.r(i*T, 14*T, 2, 5*T, hx('#f6e2c4'));
    cv.r(36*T-2, 14*T, 2, 5*T, hx('#f6e2c4'))
    cv.r(14*T, 19*T, 22*T, 2, hx('#f6e2c4'))
    cx0, cy0, cw, ch = t(14, 21, 22, 1)
    cv.r(cx0, cy0, cw, ch, hx('#e8dcc0')); cv.r(cx0, cy0, cw, 2, lit(hx('#e8dcc0'), .3)); cv.r(cx0, cy0+ch-3, cw, 3, drk(hx('#e8dcc0'), .3)); cv.r(cx0, cy0, cw, 1, OL); cv.r(cx0, cy0+ch-1, cw, 1, OL)
    sx, sy, sw, sh = t(22, 20, 4, 1)
    for k in range(0, sw, 8): cv.r(sx+k, sy, 4, sh, hx('#e0c860')); cv.r(sx+k+4, sy, 4, sh, OL)      # stripe / gate lane

    # ---------------- buildings
    def building(x, y, w, h, roof, wall, trim, kind, door_side=None, label=None):
        x, y, w, h = [int(v*T) for v in (x, y, w, h)]
        fh = 28                                  # facade height
        rh = h-fh
        cv.shadow_rect(x+8, y+h, w, 10, .22); cv.shadow_rect(x+w, y+10, 8, h, .18)
        # roof
        cv.r(x, y, w, rh, OL); cv.r(x+1, y+1, w-2, rh-1, roof)
        cv.r(x+1, y+1, w-2, 2, lit(roof, .28)); cv.r(x+1, y+1, 2, rh-1, lit(roof, .14))
        cv.r(x+w-3, y+3, 2, rh-4, drk(roof, .2))
        cv.r(x+1, y+rh-3, w-2, 2, drk(roof, .25))
        # roof tiles / ribs
        if kind in ('tile', 'cafe', 'break'):
            for yy in range(y+5, y+rh-4, 6): cv.r(x+2, yy, w-4, 1, drk(roof, .18))
        elif kind in ('rib', 'maint', 'eng'):
            for xx in range(x+6, x+w-4, 8): cv.r(xx, y+4, 1, rh-8, drk(roof, .2)); cv.r(xx+1, y+4, 1, rh-8, lit(roof, .12))
        elif kind in ('slate', 'hall'):
            for yy in range(y+5, y+rh-4, 5):
                for xx in range(x+3+((yy//5) % 2)*4, x+w-5, 8): cv.r(xx, yy, 7, 1, drk(roof, .2))
        # facade
        fy = y+rh
        cv.r(x, fy, w, fh, OL); cv.r(x+1, fy, w-2, fh-1, wall)
        cv.r(x+1, fy, w-2, 4, drk(wall, .28)); cv.r(x+1, fy+4, w-2, 1, lit(wall, .2))      # eave shadow
        cv.r(x+1, fy+fh-3, w-2, 2, drk(wall, .2))
        cv.r(x, fy+fh-1, w, 1, OL)
        # windows + door
        nwin = max((w-32)//28, 1)
        for i in range(nwin):
            wx = x+10+i*((w-20-(nwin-1)*0)//nwin)
            if abs(wx-(x+w//2)) < 10: continue
            cv.r(wx, fy+9, 16, 12, OL); cv.r(wx+1, fy+10, 14, 10, hx('#a8d0c8')); cv.r(wx+1, fy+10, 14, 3, hx('#d8ecdf'))
            cv.r(wx+7, fy+10, 1, 10, OL); cv.r(wx, fy+20, 16, 2, trim)
        dx = x+w//2-8
        cv.r(dx-1, fy+7, 18, fh-9, OL); cv.r(dx, fy+8, 16, fh-10, hx('#7a4a2a')); cv.r(dx+2, fy+10, 5, 8, hx('#a8d0c8')); cv.r(dx+9, fy+10, 5, 8, hx('#a8d0c8')); cv.r(dx+7, fy+10, 2, fh-12, OL)
        cv.r(dx-3, fy+fh-3, 22, 3, hx('#e0c860'))
        # per-building flavour
        if kind == 'cafe':
            for i in range(0, w-12, 8):      # striped awning
                c = hx('#c04a38') if (i//8) % 2 == 0 else hx('#f6e2c4')
                cv.r(x+6+i, fy+4, 8, 6, c); cv.r(x+6+i, fy+9, 8, 2, drk(c, .2))
            cv.r(x+6, fy+3, w-12, 1, OL)
            cv.ob(x+w-26, y+8, 14, 10, hx('#a8703a')); cv.circle(x+w-19, y+13, 3, hx('#f6e2c4'))          # vent / sign
            cv.blend(x+w-24, y-4, 10, 10, (255, 255, 255), .5)
        if kind == 'arcade':
            cv.r(x+8, fy+4, w-16, 5, OL); cv.r(x+10, fy+5, w-20, 3, hx('#ff6aa8')); cv.blend(x+6, fy+2, w-12, 10, hx('#ff6aa8'), .20)
            for i in range(4): cv.ob(x+10+i*14, y+10, 10, 10, hx(['#c46040', '#3a8ac4', '#e0a850', '#5a9438'][i]))
        if kind == 'hall':
            cv.ob(x+w//2-18, y+14, 36, 22, hx('#a8d0c8')); cv.r(x+w//2-16, y+16, 32, 18, hx('#d8ecdf'))
            cv.r(x+w//2, y+14, 2, 22, OL); cv.r(x+w//2-18, y+24, 36, 2, OL)
            cv.ob(x+16, y+rh-22, 14, 14, drk(roof, .15)); cv.ob(x+w-30, y+rh-22, 14, 14, drk(roof, .15))
        if kind == 'control':
            cv.r(x+w-20, y-26, 2, 28, OL); cv.r(x+w-20, y-26, 1, 28, hx('#8a8a8a'))                         # mast
            cv.r(x+w-26, y-20, 14, 2, OL); cv.r(x+w-24, y-12, 10, 2, OL); cv.r(x+w-20, y-30, 2, 4, hx('#c04a38'))
            for i in range(6): cv.r(x+8+i*10, y+8, 6, 4, hx(['#9ec85a', '#e0c860', '#c46040'][i % 3])); cv.r(x+8+i*10, y+8, 6, 1, OL)
        if kind == 'eng':
            for i in range(3): cv.ob(x+12+i*30, y+10, 16, 14, hx('#8a9aa0')); cv.r(x+16+i*30, y+14, 8, 6, drk(hx('#8a9aa0'), .4))
            cv.r(x+w-26, fy+8, 20, fh-10, OL); cv.r(x+w-25, fy+9, 18, fh-12, hx('#c8c8c0'))                       # roll-up door
            for yy in range(fy+11, fy+fh-4, 3): cv.r(x+w-25, yy, 18, 1, drk(hx('#c8c8c0'), .18))
        if kind == 'break':
            cv.ob(x+w-22, y+6, 10, 14, hx('#c4783a')); cv.blend(x+w-20, y-8, 8, 12, (255, 255, 255), .55); cv.blend(x+w-18, y-16, 6, 8, (255, 255, 255), .35)
            cv.ob(x+10, fy+6, 12, 10, hx('#f6e2c4'))
        if kind == 'maint':
            for i in range(2):
                cv.r(x+16+i*60, y+6, 6, rh-12, OL); cv.r(x+17+i*60, y+7, 4, rh-14, hx('#c4783a'))
            cv.circle(x+w-24, y+16, 8, hx('#8a9aa0'))
        if kind == 'core':
            # containment dome seen from above-front
            cx, cy = x+w//2, y+rh//2+2
            cv.circle(cx, cy, 24, hx('#d8dcd4')); cv.circle(cx, cy, 20, hx('#e8ece4'))
            cv.d.ellipse([cx-12, cy-14, cx+4, cy-4], fill=hx('#fff8e4'))
            for a in range(0, 360, 30):
                r_ = math.radians(a); cv.r(cx+int(math.cos(r_)*16), cy+int(math.sin(r_)*16), 1, 1, hx('#8a9aa0'))
            for rr in (8, 14, 19): cv.d.arc([cx-rr, cy-rr, cx+rr, cy+rr], 20, 160, fill=hx('#b8c0b8'))
            cv.circle(cx, cy-2, 4, hx('#c04a38'))
            cv.r(x+10, y+rh-18, w-20, 4, hx('#e0c860'))
        return (x, y, w, h)

    if objects:
        note("roof", 15*T, lambda: building(2, 7, 10, 8, hx('#c46040'), hx('#e8c898'), hx('#f6e2c4'), 'cafe'))
        note("roof", 24*T, lambda: building(2, 16, 10, 8, hx('#8a58b8'), hx('#c8b0d8'), hx('#f6e2c4'), 'arcade'))
        note("roof", 18*T, lambda: building(53, 8, 12, 10, hx('#6b8f71'), hx('#d8d4b8'), hx('#f6e2c4'), 'hall'))
        note("roof", 8*T, lambda: building(56, 4, 12, 4, hx('#c9a227'), hx('#e8dcb0'), hx('#f6e2c4'), 'control'))
        note("roof", 28*T, lambda: building(52, 20, 14, 8, hx('#7aa882'), hx('#d0d8c0'), hx('#f6e2c4'), 'eng'))
        note("roof", 20*T, lambda: building(68, 12, 10, 8, hx('#e0a478'), hx('#f6e2c4'), hx('#fff4e0'), 'break'))
        note("roof", 12*T, lambda: building(78, 6, 12, 6, hx('#a8b0a8'), hx('#d8dcd4'), hx('#f6e2c4'), 'core'))
        note("roof", 30*T, lambda: building(70, 22, 16, 8, hx('#5a82a0'), hx('#c8d4d8'), hx('#f6e2c4'), 'maint'))

        for sxx in (70, 74):
            def stack(sxx=sxx):
                x, y, w, h = t(sxx, 6, 3, 4)
                cv.shadow_rect(x+4, y+h-2, w+4, 8, .24)
                cv.r(x+2, y-16, w-4, h+14, OL)
                pts = [(x+4, y-14), (x+w-4, y-14), (x+w, y+h), (x, y+h)]
                cv.d.polygon(pts, fill=hx('#e8dcc0'), outline=OL)
                cv.r(x+6, y-2, w-12, 5, hx('#c04a38')); cv.r(x+5, y+16, w-10, 5, hx('#c04a38'))
                cv.r(x+3, y-16, w-6, 3, OL); cv.r(x+4, y-15, w-8, 1, hx('#8a8a8a'))
                cv.blend(x+8, y-30, 16, 14, (255, 255, 255), .55); cv.blend(x+12, y-42, 14, 12, (255, 255, 255), .35); cv.blend(x+16, y-52, 10, 10, (255, 255, 255), .2)
            note("stack", 10*T, stack)

        def van():
            x, y, w, h = t(16, 14, 6, 3); d_van(cv, x, y, w, h)
        note("van", 17*T, van)
        def boom():
            x, y, w, h = t(23, 19, 1, 2); d_boom(cv, x, y, w, h)
        note("boom", 21*T, boom)
        for tx in (20, 36):
            def lamp(tx=tx):
                x, y, w, h = t(tx, 12, 1, 2)
                cv.ellipse_shadow(x+8, y+h-2, 6, 2, .3)
                cv.r(x+7, y+6, 3, h-8, OL); cv.r(x+8, y+6, 1, h-8, hx('#8a8a8a'))
                cv.ob(x+2, y, 12, 8, hx('#f6e2c4')); cv.blend(x-6, y-2, 28, 20, (255, 232, 176), .16)
            note("lamp", 12*T + 4, lamp)
        def plant():
            x, y, w, h = t(8, 6, 2, 2); d_plant(cv, x, y, w, h)
        note("plant", 8*T, plant)
        for c in range(14, 41, 2):
            if 22 <= c <= 26: continue
            def fence(c=c):
                x, y, w, h = t(c, 21, 1, 1); d_fence(cv, x, y, w, h)
            note("fence", 22*T, fence)

        def tree(cx, fy, r=14):
            cv.ellipse_shadow(cx+3, fy, r, 4, .28)
            cv.r(cx-2, fy-12, 5, 13, OL); cv.r(cx-1, fy-12, 3, 12, hx('#7a4a2a')); cv.r(cx-1, fy-12, 1, 12, hx('#a87040'))
            cv.circle(cx, fy-r-8, r, hx('#4a8040')); cv.circle(cx-3, fy-r-11, r-5, hx('#5a9438')); cv.circle(cx-6, fy-r-14, 3, hx('#9ec85a'))
        for (tx, ty) in ((60, 360), (150, 420), (300, 410), (420, 380), (520, 470), (700, 420), (800, 560), (640, 560), (120, 560), (250, 590), (1380, 140), (1450, 330), (1480, 520), (1000, 600), (1230, 400)):
            note("plant", ty, lambda tx=tx, ty=ty, r=(13 if hashf(tx, ty) % 2 else 15): tree(tx, ty, r))
        for bx in (16*T, 30*T, 47*T):
            def bench(bx=bx):
                cv.shadow_rect(bx+2, 104, 36, 4, .25)
                cv.ob(bx, 100-2, 36, 5, hx('#a8703a')); cv.r(bx+3, 100+3, 3, 6, OL); cv.r(bx+30, 100+3, 3, 6, OL)
            note("bench", 109, bench)

    # ---------------- characters
    def sp(i): return ref.render(ref.build(None), ref.casts[i])
    def char(i, cx, fy):
        cv.ellipse_shadow(cx, fy-1, 6, 2, .32); cv.im.alpha_composite(sp(i), (cx-8, fy-26))
    if os.environ.get("LOT_CHARS", "1") != "0":
        char(0, 24*T+8, 18*T+4); char(1, 22*T+8, 17*T+10); char(2, 50*T, 11*T+8)

    if border_on:
        cv.r(0, 0, W, 1, OL); cv.r(0, H-1, W, 1, OL); cv.r(0, 0, 1, H, OL); cv.r(W-1, 0, 1, H, OL)
    return cv

if __name__ == "__main__":
    draw_all()
    cv.save(f'{OUT}/gate.png'); cv.save(f'{OUT}/gate-2x.png', 2)
    cv.im.crop((0, 96, 640, 400)).resize((1920, 912), Image.NEAREST).save(f'{OUT}/gate-west-3x.png')
    cv.im.crop((800, 40, 1536, 520)).resize((2208, 1440), Image.NEAREST).save(f'{OUT}/gate-east-3x.png')
    print('ok', W, H)
