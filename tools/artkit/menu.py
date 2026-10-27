import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from px import *
OUT = os.environ.get('UI_OUT', './out/ui')
os.makedirs(OUT, exist_ok=True)
W, H = 384, 216
rnd = random.Random(5)

SKY = ['#6f93c4', '#86a5cc', '#a9b6cc', '#cdbac4', '#eec3a8', '#f7d49c', '#fce2b0']

def band_sky(cv, y0, y1):
    n = len(SKY); h = (y1-y0)//n+1
    for i, c in enumerate(SKY): cv.r(0, y0+i*h, W, h, hx(c))

def cloud(cv, x, y, w, col='#fff0dc', under='#f0b8a0'):
    cv.r(x+4, y+4, w-8, 4, hx(under))
    cv.r(x, y+2, w, 4, hx(col)); cv.r(x+6, y, w-14, 4, hx(col)); cv.r(x+w//3, y-2, w//3, 3, hx(col))
    cv.r(x+3, y+6, w-6, 2, hx(under))

def hills(cv):
    # far ridge (blue-violet), near ridge (green)
    for x in range(W):
        h1 = 118-int(10*math.sin(x/38.0)+6*math.sin(x/17.0+1)+4*math.sin(x/9.0))
        cv.r(x, h1, 1, 124-h1, hx('#8a9cc0'))
        h2 = 124-int(7*math.sin(x/29.0+2)+4*math.sin(x/13.0))
        cv.r(x, h2, 1, 132-h2, hx('#6a9a78'))
    for x in range(0, W, 3):
        if rnd.random() < .4: cv.px(x, 126+rnd.randrange(5), hx('#82b290'))

def sun(cv, cx, cy):
    for r, a in ((46, .07), (34, .09), (24, .12)):
        ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(ov).ellipse([cx-r, cy-r, cx+r, cy+r], fill=(255, 236, 190, int(255*a)))
        cv.im.alpha_composite(ov)
    cv.d.ellipse([cx-13, cy-13, cx+13, cy+13], fill=hx('#fff4d0'))
    cv.d.ellipse([cx-11, cy-11, cx+11, cy+11], fill=hx('#ffe9a8'))

def lake(cv, y0, y1):
    bands = ['#7fb0c8', '#6fa4bf', '#5f98b4', '#528ca8', '#487f9c']
    bh = (y1-y0)//len(bands)+1
    for i, c in enumerate(bands): cv.r(0, y0+i*bh, W, bh, hx(c))
    for _ in range(90):
        x, y = rnd.randrange(W-12), y0+2+rnd.randrange(y1-y0-4)
        cv.r(x, y, rnd.choice([5, 7, 9]), 1, hx('#a8d0dc'))

def sun_reflection(cv, cx, y0, y1):
    for i, y in enumerate(range(y0+2, y1, 4)):
        w = max(26-i*2, 6)
        jit = (i*7) % 5-2
        cv.r(cx-w//2+jit, y, w, 2, hx('#fbe8b0'));

def cooling_tower(cv, x, base, h, w, col='#d8d0c0'):
    """hyperbolic cooling tower: wide base, waist at ~70% down, flared lip. Flat 3-tone, lit from the left."""
    cx = x+w//2
    for yy in range(h):
        t = yy/h
        f = 0.62+0.20*((0.7-t)/0.7)**2 if t < 0.7 else 0.62+0.38*((t-0.7)/0.3)**2
        hw = max(int(w/2*f), 2)
        y = base-h+yy
        cv.r(cx-hw, y, hw*2, 1, hx(col))
        cv.r(cx-hw, y, 1, 1, OL); cv.r(cx+hw-1, y, 1, 1, OL)
        cv.r(cx-hw+1, y, max(hw//2, 1), 1, lit(hx(col), .35))
        cv.r(cx+hw-max(hw//2, 1)-1, y, max(hw//2, 1), 1, drk(hx(col), .22))
    top = int(w/2*0.82)
    cv.r(cx-top, base-h, top*2, 1, OL)
def plume(cv, x, y, n=7, drift=1, base_w=10, col=(255, 250, 240)):
    for i in range(n):
        r = base_w//2+i*3
        ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(ov).ellipse([x+i*6*drift-r, y-i*7-r//2, x+i*6*drift+r, y-i*7+r//2], fill=col+(max(200-i*22, 40),))
        cv.im.alpha_composite(ov)

def stack(cv, x, base, h, w=8):
    for yy in range(h):
        ww = w-int(yy/h*2)
        cv.r(x+(w-ww)//2, base-yy, ww, 1, hx('#e8dcc0') if (yy//9) % 2 == 0 else hx('#c85a3a'))
    cv.r(x, base-h, w, 1, OL); cv.r(x, base-h, 1, h, OL); cv.r(x+w-1, base-h, 1, h, OL)
    cv.r(x+1, base-h+1, 2, h-1, lit(hx('#e8dcc0'), .3)) if False else None

def plant_buildings(cv, x, base):
    steel_box(cv, x, base-26, 38, 26, hx('#c8bca0'))
    for i in range(4): cv.r(x+5+i*8, base-20, 5, 8, hx('#f0c870')); cv.r(x+5+i*8, base-20, 5, 1, OL)
    cv.r(x, base-26, 38, 3, hx('#c85a3a'))
    cv.d.ellipse([x+40, base-34, x+76, base+2], fill=OL); cv.d.ellipse([x+41, base-33, x+75, base+1], fill=hx('#dcd8cc'))
    cv.r(x+40, base-14, 36, 14, hx('#dcd8cc')); cv.r(x+40, base-14, 1, 14, OL); cv.r(x+75, base-14, 1, 14, OL)
    cv.r(x+45, base-30, 8, 20, lit(hx('#dcd8cc'), .4)); cv.r(x+68, base-20, 6, 20, drk(hx('#dcd8cc'), .15))
    cv.r(x+39, base, 38, 1, OL)

def tree(cv, cx, fy, r=9):
    cv.ellipse_shadow(cx+2, fy, r, 2, .25)
    cv.r(cx-1, fy-8, 3, 9, OL); cv.r(cx, fy-8, 1, 8, hx('#7a4a2a'))
    cv.circle(cx, fy-r-5, r, hx('#3f7a48')); cv.circle(cx-2, fy-r-7, r-4, hx('#58a05a')); cv.px(cx-5, fy-r-10, hx('#9ec85a'))

def railing(cv, y=172):
    cv.r(0, y+10, W, 40, hx('#5a3622'))                                               # deck planks
    for x in range(0, W, 24): cv.r(x, y+10, 1, 40, hx('#3a2014'))
    for yy in range(y+10, H, 8): cv.r(0, yy, W, 1, hx('#4a2c1c'))
    cv.r(0, y-4, W, 8, OL); cv.r(0, y-3, W, 6, hx('#8a5a3a')); cv.r(0, y-3, W, 1, hx('#b88050')); cv.r(0, y+2, W, 1, hx('#5a3622'))   # top rail
    for x in range(10, W, 40):
        cv.r(x, y+4, 6, 18, OL); cv.r(x+1, y+4, 4, 17, hx('#7a4a2a')); cv.r(x+1, y+4, 1, 17, hx('#a87040'))
    cv.shadow_rect(0, y+6, W, 3, .3)

def mug(cv, x, y):
    """copper mug on the rail"""
    cv.ellipse_shadow(x+14, y+26, 15, 3, .3)
    cv.r(x+2, y+2, 26, 24, OL); cv.r(x+3, y+3, 24, 22, hx('#b8683a'))
    cv.r(x+3, y+3, 6, 22, hx('#e0905a')); cv.r(x+22, y+3, 5, 22, hx('#8a4a2a'))
    cv.r(x+3, y+3, 24, 3, hx('#7a3a22')); cv.r(x+5, y+4, 20, 1, hx('#3a1a10'))        # coffee
    cv.r(x+4, y+11, 22, 1, hx('#8a4a2a')); cv.r(x+4, y+19, 22, 1, hx('#8a4a2a'))
    cv.r(x+27, y+7, 6, 2, OL); cv.r(x+31, y+7, 2, 12, OL); cv.r(x+27, y+17, 6, 2, OL)
    cv.r(x+28, y+8, 4, 1, hx('#b8683a')); cv.r(x+32, y+8, 1, 10, hx('#b8683a'))
    for i in range(5):                                                                # steam
        cv.blend(x+9+int(3*math.sin(i)), y-4-i*6, 7, 5, (255, 255, 255), .55-i*.08)
def foliage(cv):
    for (x, y, r) in ((8, 28, 15), (26, 14, 13), (6, 58, 12), (30, 46, 10), (-4, 6, 14)):
        cv.circle(x, y, r, hx('#3f7a48')); cv.circle(x-2, y-2, r-4, hx('#58a05a'))
    for (x, y) in ((12, 40), (24, 28), (4, 70), (34, 56)): cv.r(x, y, 3, 3, hx('#c04a38')); cv.px(x, y, hx('#f08060'))

def scene():
    cv = Cv(W, H)
    band_sky(cv, 0, 112)
    sun(cv, 132, 112)
    cloud(cv, 214, 20, 56); cloud(cv, 70, 30, 40); cloud(cv, 300, 54, 46); cloud(cv, 160, 52, 30)
    hills(cv)
    lake(cv, 126, 176)
    sun_reflection(cv, 132, 128, 172)
    # far shore + plant on the right
    cv.r(236, 124, 148, 6, hx('#4a7a52'))
    cooling_tower(cv, 270, 126, 58, 40); plume(cv, 291, 68, 8, 1, 14)
    stack(cv, 246, 126, 50); plume(cv, 250, 76, 6, 1, 8)
    plant_buildings(cv, 306, 128)
    for tx in (240, 300, 380): tree(cv, tx, 130, 8)
    # shore reflection of plant
    for yy in range(0, 20, 2): cv.blend(260, 130+yy, 120, 1, (30, 20, 20), .12-yy*.004)
    foliage(cv)
    railing(cv)
    mug(cv, 26, 150)
    return cv

def button(cv, x, y, w, h, s, sel=False):
    fill = hx('#f3e6d0') if sel else hx('#5a3622')
    ink = OL if sel else hx('#f3e6d0')
    cv.r(x, y+2, w, h, OL)                                              # drop
    cv.r(x, y, w, h, OL); cv.r(x+1, y+1, w-2, h-2, fill)
    cv.r(x+1, y+1, w-2, 1, lit(fill, .35)); cv.r(x+1, y+h-2, w-2, 1, drk(fill, .3))
    cv.r(x+2, y+2, 1, 1, OL) if False else None
    tw = text_w(s, 1); text(cv, x+(w-tw)//2, y+(h-5)//2, s, ink)
    if sel:
        for dx in (-8, w+4): arrow(cv, x+dx+2, y+h//2, 'r' if dx < 0 else 'l', '#f3e6d0', 3)

def title_art(cv):
    # title plate
    label_s = 'COFFEE & CRITICALITY'
    sc = 2
    tw = big_w(label_s, sc)
    x = (W-tw)//2; y = 22
    cv.r(x-14, y-8, tw+28, 44, OL); cv.r(x-13, y-7, tw+26, 42, hx('#2a1610'))
    cv.r(x-13, y-7, tw+26, 1, hx('#6a4630')); cv.r(x-12, y-6, tw+24, 1, hx('#c4783a'))
    big(cv, x, y, label_s, hx('#f6e2c4'), sc, shadow=hx('#6a3a22'))
    sub = 'A WEEK ON UNIT 1'
    text(cv, (W-text_w(sub))//2, y+23, sub, hx('#e0a850'))

def menu():
    cv = scene()
    title_art(cv)
    # menu buttons
    bw, bh = 84, 14
    bx = (W-bw)//2
    for i, (s, sel) in enumerate((('BEGIN', True), ('CONTINUE', False), ('SETTINGS', False))):
        button(cv, bx, 98+i*20 if False else 84+i*19, bw, bh, s, sel)
    foot = 'TEACHING MODEL - NOT A LICENSE'
    text(cv, (W-text_w(foot))//2, 204, foot, hx('#f3e6d0'), 1, shadow=OL)
    text(cv, 4, 4, 'SOUND ON', hx('#f3e6d0'), 1, shadow=OL) if False else None
    cv.r(W-52, 5, 46, 11, OL); cv.r(W-51, 6, 44, 9, hx('#2a1610')); text(cv, W-47, 9, 'SOUND ON', hx('#f3e6d0'))
    return cv

def button_sprite(label, sel):
    """Idle and selected buttons, including the 2px drop and the selection arrows.
    The button body sits at x=6 so the left arrow (centre at body-6) stays inside."""
    bw, bh = 84, 14
    cv = Cv(100, 16)
    button(cv, 6, 0, bw, bh, label, sel)
    return cv

def chip_sprite(label):
    cv = Cv(46, 11)
    cv.r(0, 0, 46, 11, OL)
    cv.r(1, 1, 44, 9, hx('#2a1610'))
    text(cv, 5, 4, label, hx('#f3e6d0'))
    return cv

def _diffs(a, b):
    if a.size != b.size: return -1
    pa, pb = a.load(), b.load()
    n = 0
    for y in range(a.height):
        for x in range(a.width):
            if pa[x, y] != pb[x, y]: n += 1
    return n

def save_parts(menu_cv):
    labels = ('BEGIN', 'CONTINUE', 'SETTINGS')
    sheet = Cv(100, 16 * 6)
    for i, label in enumerate(labels):
        for k, sel in enumerate((True, False)):
            spr = button_sprite(label, sel)
            sheet.im.alpha_composite(spr.im, (0, (i * 2 + k) * 16))
    sheet.save(f'{OUT}/menu-parts.png')
    chips = Cv(46, 22)
    on, off = chip_sprite('SOUND ON'), chip_sprite('SOUND OFF')
    chips.im.alpha_composite(on.im, (0, 0))
    chips.im.alpha_composite(off.im, (0, 11))
    chips.save(f'{OUT}/menu-chips.png')
    # Idle CONTINUE in the reference is this sprite's body. Selected SOUND ON chip too.
    body = button_sprite('CONTINUE', False).im.crop((6, 0, 90, 16))
    crop = menu_cv.im.crop((150, 103, 234, 119))
    chip = menu_cv.im.crop((332, 5, 378, 16))
    db, dc = _diffs(body, crop), _diffs(on.im, chip)
    if db or dc:
        raise SystemExit(f'menu parts drifted from menu.png (button {db}, chip {dc})')

if __name__ == '__main__':
    m = menu(); m.save(f'{OUT}/menu.png'); m.save(f'{OUT}/menu-3x.png', 3); print('menu')
    s = scene(); s.save(f'{OUT}/menu-scene.png')
    save_parts(m)

