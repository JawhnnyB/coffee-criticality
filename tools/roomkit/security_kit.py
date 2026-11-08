"""Site Access (security lobby) kit: prop drawers, palette, wall dressing, wayfinding plate.
Registers itself into roomkit's PROP and ROOM tables on import. Shared by render_rooms.py (the bake) and tools/artkit/security*.py (the references)."""
import os, sys, math
_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(_HERE, '..', 'artkit'))
sys.path.insert(0, _HERE)   # roomkit's kit wins over artkit's kit
import kit
from kit import *
from px import text, text_w

NAVY, NAVYL, NAVYD = hx('#2e4a78'), hx('#4a6ea0'), hx('#1e3358')
STEEL, STEELL, STEELD = hx('#8a98a4'), hx('#b4c0c8'), hx('#5e6c78')
GLASS, GLASSL = hx('#9ccad8'), hx('#d8f0f4')
CREAM, GOLD, TEAL = hx('#f6e2c4'), hx('#e0c860'), hx('#3aa0c0')
LAMP = {'red': '#d4552e', 'amber': '#e8b838', 'green': '#6cc060', 'blue': '#4aa8e0', 'off': '#4a5560'}

kit.ROOM['security'] = dict(wall='#8aa0b4', wain='#4e6478', trim='#e8d8b0', floor='#c2c4be', kind='check', accent='#3aa0c0', rug=('#2e4a78', '#e8d8b0'))

# ------------------------------------------------------------------ small icons
def trefoil(cv, cx, cy, r=5, fg='#e8c030', bg=None):
    """radiation trefoil, flat 2-colour, outline"""
    cv.d.ellipse([cx-r-1, cy-r-1, cx+r, cy+r], fill=OL)
    cv.d.ellipse([cx-r, cy-r, cx+r-1, cy+r-1], fill=hx(fg))
    for yy in range(-r, r):
        for xx in range(-r, r):
            d = math.hypot(xx+.5, yy+.5)
            if d < 1.6 or d > r-.4: continue
            a = math.degrees(math.atan2(yy+.5, xx+.5)) % 360
            if d > 1.6 and any(abs(((a-c+180) % 360)-180) < 30 for c in (90, 210, 330)) and d > 1.8:
                cv.px(cx+xx, cy+yy, OL)
    cv.r(cx-1, cy-1, 2, 2, OL)
def eye_icon(cv, cx, cy, col='#fff8e4', iris='#3a8ac4'):
    """9x5 eye glyph"""
    for xx, yy in [(-4, 0), (4, 0)]: cv.px(cx+xx, cy+yy, OL)
    cv.r(cx-3, cy-2, 7, 1, OL); cv.r(cx-3, cy+2, 7, 1, OL); cv.px(cx-4, cy-1, OL); cv.px(cx+4, cy-1, OL); cv.px(cx-4, cy+1, OL); cv.px(cx+4, cy+1, OL)
    cv.r(cx-3, cy-1, 7, 3, hx(col)); cv.r(cx-1, cy-1, 3, 3, hx(iris)); cv.px(cx, cy, OL)
def lamp(cv, x, y, state='amber', w=3):
    cv.r(x-1, y-1, w+2, 4, OL); cv.r(x, y, w, 2, hx(LAMP[state])); cv.px(x, y, lit(hx(LAMP[state]), .5))
    if state != 'off': cv.blend(x-2, y-2, w+4, 6, hx(LAMP[state]), .18)
def sign(cv, x, y, s, bg='#2e4a78', fg='#f6e2c4', w=None, icon=None):
    ww = w or text_w(s)+10+(8 if icon else 0)
    cv.ob(x, y, ww, 11, hx(bg))
    tx = x+5
    if icon == 'trefoil': trefoil(cv, x+8, y+5, 3); tx = x+14
    text(cv, tx, y+3, s, hx(fg))
    return ww

# ------------------------------------------------------------------ props (x,y,w,h are pixels; y is TOP of the prop's footprint)
def d_guarddesk(cv, x, y, w, h, c=None):
    pshadow(cv, x, y, w, h)
    cv.ob(x, y+6, w, 10, hx('#b88a5a'))                                  # worktop
    cv.ob(x, y+15, w, h-15, hx('#4e6478'))                              # front panel
    for i in range(0, w-8, 20): cv.r(x+5+i, y+19, 14, h-24, drk(hx('#4e6478'), .22)); cv.r(x+5+i, y+19, 14, 1, lit(hx('#4e6478'), .15))
    cv.ob(x+w//2-18, y+h-12, 36, 9, hx('#e8d8b0')); text(cv, x+w//2-15, y+h-10, 'SECURITY', OL)     # plaque
    cv.ob(x+w-28, y-6, 18, 14, hx('#e8dcc0')); cv.r(x+w-25, y-3, 12, 8, hx('#2a4a3a')); cv.r(x+w-24, y-2, 4, 2, hx('#9ec85a')); cv.r(x+w-24, y+2, 8, 1, hx('#5aa070'))   # monitor
    cv.ob(x+w-26, y+8, 14, 3, hx('#d8ccb0'))
    cv.ob(x+8, y+4, 10, 6, hx('#f6e2c4')); cv.r(x+10, y+6, 6, 1, hx('#7a8a9a')); cv.r(x+10, y+8, 4, 1, hx('#7a8a9a'))   # visitor log
    cv.ob(x+22, y+2, 5, 8, hx('#3a3a40')); cv.px(x+24, y+3, hx('#6cc060'))                                           # radio on charger
    cv.ob(x+32, y+5, 5, 4, hx('#e0c860'))                                                                         # desk bell
    # glass screen (translucent) with frame
    cv.blend(x+3, y-10, w-6, 14, GLASS, .34); cv.r(x+3, y-10, w-6, 1, GLASSL); cv.r(x+3, y-10, 1, 14, GLASSL); cv.r(x+w-4, y-10, 1, 14, STEEL)
def d_kiosk(cv, x, y, w, h, c=None):
    cx = x+w//2
    cv.ellipse_shadow(cx, y+h-2, 14, 3, .3)
    cv.ob(cx-11, y-6, 22, h+2, hx('#e8d8b0'))                              # cabinet
    cv.r(cx-9, y+h-12, 18, 10, drk(hx('#e8d8b0'), .2))
    cv.ob(cx-5, y-10, 10, 6, hx('#2a2a30'))                                # camera head
    cv.r(cx-1, y-9, 3, 3, hx('#4aa8e0')); cv.px(cx-1, y-9, hx('#d8f0f4'))
    cv.ob(cx-8, y+0, 16, 11, hx('#26384a')); cv.r(cx-7, y+1, 14, 1, hx('#4a6ea0'))   # screen
    cv.r(cx-5, y+3, 4, 4, hx('#c8a878')); cv.r(cx-4, y+4, 2, 2, hx('#f5c9a0'))       # tiny photo
    text(cv, cx+0, y+3, 'ID', hx('#e8d8b0')); cv.r(cx, y+7, 6, 1, hx('#4aa8e0'))
    cv.ob(cx-6, y+13, 12, 4, hx('#3a3a40')); lamp(cv, cx-5, y+14, 'amber', 2)        # card slot
    cv.ob(cx-4, y+17, 8, 6, hx('#fff8e4')); cv.r(cx-3, y+18, 3, 3, hx('#d8c8a8')); cv.r(cx+1, y+19, 2, 1, hx('#3aa0c0'))   # card peeking out
def d_dosirack(cv, x, y, w, h, c=None):
    cv.ob(x+2, y-4, w-4, h+2, hx('#7a4a2a'))
    cv.r(x+4, y-2, w-8, h-2, hx('#2a1c14'))
    cols = ['#e8d8b0', '#4aa8e0', '#e8d8b0', '#e8d8b0', '#4aa8e0', '#e8d8b0']
    for r_ in range(3):
        for c_ in range(4):
            px_, py_ = x+6+c_*6, y-0+r_*8
            cv.r(px_, py_, 5, 7, OL); cv.r(px_+1, py_+1, 3, 5, hx('#3a2a1e'))
            if (r_*4+c_) not in (5, 9): cv.r(px_+1, py_+1, 3, 4, hx(cols[(r_+c_) % 6])); cv.r(px_+1, py_+1, 3, 1, lit(hx(cols[(r_+c_) % 6]), .4))
    # the empty pocket highlighted = yours (#07)
    cv.r(x+6+1*6, y+8, 5, 7, GOLD); cv.r(x+6+1*6+1, y+9, 3, 5, hx('#3a2a1e'))
    cv.px(x+6+1*6+2, y+7, GOLD)
def d_xray(cv, x, y, w, h, c=None):
    pshadow(cv, x, y, w, h)
    cv.ob(x+18, y+2, w-36, h-14, hx('#5e6c78'))                                # tunnel housing
    cv.r(x+20, y+4, w-40, 3, lit(hx('#5e6c78'), .2))
    for i in range(0, w-36, 4):                                                # reinforced hazard stripe on housing front
        cv.r(x+19+i, y+h-18, 2, 3, GOLD) if (i//4) % 2 == 0 else None
    for sx in (x+10, x+w-18):                                                 # rubber curtains
        cv.r(sx, y+8, 9, h-20, OL)
        for i in range(4): cv.r(sx+1+i*2, y+9, 1, h-22, hx('#33343a') if i % 2 == 0 else hx('#44464e'))
    cv.ob(x, y+h-16, w, 12, hx('#3a3a40'))                                     # belt
    for i in range(0, w-6, 6): cv.r(x+3+i, y+h-14, 2, 8, hx('#4a4a52'))
    cv.r(x+1, y+h-15, w-2, 1, hx('#6a6a72'))
    cv.ob(x+2, y+h-24, 14, 9, hx('#c8c8c0')); cv.ob(x+4, y+h-28, 10, 6, hx('#e0803a')); cv.r(x+5, y+h-27, 8, 1, hx('#f0a060'))   # tray + backpack
    cv.ob(x+w//2-9, y-10, 18, 12, hx('#e8dcc0')); cv.r(x+w//2-7, y-8, 14, 8, hx('#10243a'))                                     # monitor (x-ray)
    cv.r(x+w//2-5, y-6, 4, 5, hx('#e8963a')); cv.r(x+w//2+1, y-7, 3, 6, hx('#d8c8a8')); cv.r(x+w//2-2, y-2, 6, 1, hx('#6cc060'))
    lamp(cv, x+w-12, y+4, 'green', 3)
def d_barrier(cv, x, y, w, h, c=None):
    """glass-topped steel partition cabinet; fits a 2-tile column"""
    pshadow(cv, x, y, w, h, 0)
    cv.ob(x+6, y, 20, h, hx('#7a8a98'))
    cv.r(x+8, y+2, 16, h-4, hx('#5e6c78'))
    cv.blend(x+8, y+2, 16, h-4, GLASS, .40); cv.r(x+8, y+2, 1, h-4, GLASSL); cv.r(x+8, y+2, 16, 1, GLASSL)
    for yy in range(y+10, y+h-6, 16): cv.r(x+6, yy, 20, 2, OL); cv.r(x+7, yy, 18, 1, STEELL)
    cv.r(x+6, y+h-3, 20, 3, drk(hx('#7a8a98'), .3))
def d_irispost(cv, x, y, w, h, c='amber'):
    """iris scanner pedestal 16x32"""
    cx = x+w//2
    cv.ellipse_shadow(cx, y+h-2, 8, 3, .3)
    cv.ob(cx-4, y+10, 8, h-10, hx('#d8dcdc'))                              # column
    cv.r(cx-3, y+14, 6, 1, hx('#aab0b4'))
    cv.ob(cx-8, y, 16, 13, hx('#e8ecec'))                                  # head
    cv.r(cx-7, y+1, 14, 2, hx('#fff8e4'))
    cv.r(cx-6, y+4, 12, 8, hx('#26384a'))                                  # eye window
    cv.d.ellipse([cx-4, y+5, cx+3, y+11], fill=OL); cv.d.ellipse([cx-3, y+6, cx+2, y+10], fill=hx('#4a86c8'))
    cv.r(cx-1, y+7, 2, 2, OL); cv.px(cx-2, y+7, hx('#d8f0f4'))
    lamp(cv, cx-1, y+2, c, 3)
def d_laneflap(cv, x, y, w, h, c='red', open_=False):
    """glass flap across the 2-tile lane. w=6,h=32. open_ = retracted: only the two end posts + green lamp"""
    if not open_:
        cv.r(x+1, y, 4, h, OL); cv.blend(x+1, y+1, 4, h-2, GLASS, .55); cv.r(x+2, y+1, 1, h-2, GLASSL)
    cv.r(x, y-1, 6, 3, STEELD); cv.r(x, y+h-2, 6, 3, STEELD)
    lamp(cv, x+1, y+h//2-1 if not open_ else y+1, c, 3)
    if open_: lamp(cv, x+1, y+h-3, c, 3)
def d_bench_s(cv, x, y, w, h, c=None):
    cv.ellipse_shadow(x+w//2, y+h-2, w//2, 3, .26)
    cv.ob(x+2, y+8, w-4, 6, hx('#4e6478')); cv.ob(x, y+2, w, 8, hx('#6a84a0'))          # back + seat in slate blue
    cv.r(x+4, y+h-8, 3, 7, OL); cv.r(x+w-7, y+h-8, 3, 7, OL)
def d_mat(cv, x, y, w, h, c=None):
    cv.r(x, y, w, h, OL); cv.r(x+1, y+1, w-2, h-2, hx('#3a4a5e'))
    for i in range(0, w-4, 4): cv.r(x+2+i, y+2, 2, h-4, hx('#46586e'))
    text(cv, x+w//2-text_w('WELCOME')//2, y+5, 'WELCOME', hx('#c8d4dc'))
def d_stanchion(cv, x, y, w, h, c=None):
    for sx in (x+3, x+w-4):
        cv.ellipse_shadow(sx, y+h-2, 3, 1, .3); cv.r(sx-1, y+4, 3, h-8, OL); cv.r(sx, y+4, 1, h-9, hx('#d8dcdc')); cv.r(sx-2, y+h-5, 5, 3, OL); cv.r(sx-1, y+h-5, 3, 2, hx('#8a98a4'))
    cv.r(x+3, y+7, w-6, 2, OL); cv.r(x+3, y+7, w-6, 1, hx('#c04a38'))
def d_trash(cv, x, y, w, h, c=None):
    cv.ellipse_shadow(x+w//2, y+h-2, w//2, 2, .3); cv.ob(x+2, y+4, w-4, h-6, hx('#5e6c78')); cv.r(x+3, y+3, w-6, 2, hx('#8a98a4'))
def d_mydesk(cv, x, y, w, h, c=None):
    """player's own desk, Engineering. 64x48. new CRT, nameplate, welcome folder, thermos, lanyard hook"""
    pshadow(cv, x, y, w, h)
    cv.ob(x, y+10, w, h-10, hx('#b88a5a'))
    cv.r(x+1, y+h-9, w-2, 7, hx('#8a5a3a')); cv.r(x+5, y+h-8, 18, 5, drk(hx('#8a5a3a'), .4)); cv.r(x+w-23, y+h-8, 18, 5, drk(hx('#8a5a3a'), .4))
    cv.ob(x+w-30, y-5, 22, 20, hx('#e8dcc0')); cv.r(x+w-27, y-2, 16, 13, hx('#2a4a3a')); cv.r(x+w-26, y-1, 6, 3, hx('#9ec85a')); cv.r(x+w-25, y+5, 10, 1, hx('#5aa070')); cv.r(x+w-25, y+7, 6, 1, hx('#5aa070'))
    cv.ob(x+w-26, y+15, 14, 3, hx('#d8ccb0'))
    cv.ob(x+6, y+14, 20, 5, hx('#e8dcc0'))                                     # keyboard
    cv.ob(x+30, y+14, 10, 4, hx('#e8dcc0'))                                    # mouse
    cv.ob(x+4, y+2, 14, 10, hx('#e0a850')); cv.r(x+6, y+4, 10, 1, hx('#c4783a')); cv.r(x+6, y+6, 7, 1, hx('#c4783a'))   # welcome folder
    cv.ob(x+22, y+2, 6, 10, hx('#3aa0c0')); cv.r(x+23, y+3, 2, 8, lit(hx('#3aa0c0'), .35)); cv.r(x+22, y, 6, 3, OL)   # thermos
    cv.ob(x+30, y+4, 12, 8, hx('#fff8a8')); cv.r(x+32, y+6, 8, 1, hx('#c4783a')); cv.r(x+32, y+8, 5, 1, hx('#c4783a'))   # sticky note
    # nameplate on the front edge
    cv.ob(x+w//2-21, y+h-20, 42, 9, hx('#e8d8b0')); text(cv, x+w//2-text_w('YOUR DESK')//2, y+h-18, 'YOUR DESK', OL)

kit.PROP.update(guarddesk=d_guarddesk, kiosk=d_kiosk, dosirack=d_dosirack, xray=d_xray, barrier=d_barrier,
                irispost=d_irispost, laneflap=d_laneflap, bench_s=d_bench_s, mat=d_mat, stanchion=d_stanchion,
                trash=d_trash, mydesk=d_mydesk)


def dress_sec(cv, W):
    # wall dressing (y<48) -- drawn before props
    sign(cv, 6, 8, 'SITE ACCESS', icon='trefoil')                         # over guard desk
    cv.circle(88, 17, 9, hx('#f6e2c4')); cv.circle(88, 17, 7, hx('#fff8e4')); cv.r(88, 11, 1, 7, OL); cv.r(88, 17, 5, 1, OL)   # clock
    sign(cv, 128, 8, 'BADGES', bg='#c4783a', fg='#fff4e0')           # over kiosk
    sign(cv, 172, 8, 'DOSIMETRY', icon='trefoil')                          # over rack
    cv.ob(226, 6, 28, 24, hx('#e8c030')); trefoil(cv, 240, 18, 7)                                     # big trefoil plate over the portal
    # "you are here" site map board (east zone)
    cv.ob(268, 5, 46, 27, hx('#3c4a40')); cv.r(271, 8, 40, 21, hx('#e8dcc0'))
    for (mx, my, mw, mh, col) in ((273, 10, 10, 7, '#8ab4a0'), (285, 10, 12, 7, '#d8b078'), (299, 10, 9, 7, '#a8c8d8'), (273, 19, 13, 8, '#e0a478'), (288, 19, 9, 8, '#8ab4a0'), (299, 19, 9, 8, '#d8b078')):
        cv.r(mx, my, mw, mh, OL); cv.r(mx+1, my+1, mw-2, mh-2, hx(col))
    cv.r(290, 22, 3, 3, OL); cv.r(291, 23, 1, 1, hx('#e05040'))
    cv.ob(326, 10, 14, 16, hx('#c04a38')); cv.r(329, 12, 8, 4, hx('#2a1610')); cv.r(331, 18, 4, 6, hx('#f6e2c4'))   # extinguisher cabinet
    cv.r(0, 26, W, 1, drk(hx('#8aa0b4'), .18))

# ------------------------------------------------------------------ painted under the props, over the floor
def under(cv, W, H):
    """hazard threshold at the portal, queue line in front of the guard desk, welcome mat"""
    for yy in range(112, 144, 4):
        for k in range(8):
            cv.r(224+k*4, yy, 4, 4, GOLD if (k+yy//4) % 2 == 0 else hx('#3a3a40'))
    cv.r(224, 112, 32, 1, OL); cv.r(224, 143, 32, 1, OL)
    cv.r(24, 100, 80, 1, hx('#c04a38')); cv.r(24, 101, 80, 1, drk(hx('#c04a38'), .2))
    d_mat(cv, 8, 112, 32, 32)

def wayfinding_plate():
    """wall plate for the corridor: 4 destinations + arrows (80x42)"""
    cv = Cv(80, 42); cv.ob(0, 0, 80, 42, hx('#2e4a78')); cv.r(2, 2, 76, 38, hx('#264060'))
    rows = [('CONTROL', 'up'), ('ENGINEERING', 'down'), ('BREAK ROOM', 'right'), ('SECURITY', 'left')]
    for i, (s_, d_) in enumerate(rows):
        y = 5+i*9
        cv.r(4, y+8, 72, 1, hx('#3a5a8a')) if i < 3 else None
        text(cv, 14, y+1, s_, CREAM)
        bm = {'up': ['00100', '01110', '10101', '00100', '00100'], 'down': ['00100', '00100', '10101', '01110', '00100'],
              'right': ['00100', '00010', '11111', '00010', '00100'], 'left': ['00100', '01000', '11111', '01000', '00100']}[d_]
        for r_, row in enumerate(bm):
            for c_, v in enumerate(row):
                if v == '1': cv.px(5+c_, y+1+r_, GOLD)
    return cv

def corridor_plate(cv):
    cv.im.alpha_composite(wayfinding_plate().im, (24, 3))
