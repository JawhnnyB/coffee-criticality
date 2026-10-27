import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from px import *
from kit import HUES
OUT = os.environ.get('UI_OUT', './out/ui')
os.makedirs(OUT, exist_ok=True)
SW, SH = 320, 180            # every cabinet game renders to this native canvas
INK = hx('#1c1410'); PANEL = hx('#2a1c14'); PANEL2 = hx('#3a2a1e'); CREAM = hx('#f6e2c4'); GOLD = hx('#e8b840'); DIM = hx('#a8937a')

def screen_base(hue, title, right, foot):
    cv = Cv(SW, SH); cv.r(0, 0, SW, SH, INK)
    # playfield well
    cv.r(0, 14, SW, SH-26, PANEL)
    for y in range(14, SH-12, 16):   # faint tile grid (no dither)
        cv.r(0, y, SW, 1, drk(PANEL, .25))
    # HUD bar
    cv.r(0, 0, SW, 14, hx(hue)); cv.r(0, 0, SW, 1, lit(hx(hue), .4)); cv.r(0, 13, SW, 1, drk(hx(hue), .4))
    text(cv, 5, 4, title, INK)
    text(cv, SW-5-text_w(right), 4, right, INK)
    # footer bar
    cv.r(0, SH-12, SW, 12, INK); cv.r(0, SH-12, SW, 1, hx(hue))
    text(cv, 5, SH-8, foot, CREAM)
    return cv

def bezel(inner, hue, title='CATCH.CAB'):
    W, H = 384, 216
    cv = Cv(W, H)
    # parlor floor backdrop
    from kit import floor, ROOM
    floor(cv, ROOM['parlor'], 0, 0, W, H)
    cv.blend(0, 0, W, H, (20, 10, 20), .55)
    h = hx(hue)
    cv.r(10, 4, W-20, H-8, OL); cv.r(11, 5, W-22, H-10, h)
    cv.r(11, 5, W-22, 2, lit(h, .4)); cv.r(11, 5, 2, H-10, lit(h, .2)); cv.r(W-13, 5, 2, H-10, drk(h, .25)); cv.r(11, H-7, W-22, 2, drk(h, .3))
    cv.r(30, 11, SW+4, SH+4, OL); cv.r(31, 12, SW+2, SH+2, hx('#0e0a08'))
    cv.im.alpha_composite(inner.im, (32, 13))
    text(cv, 16, 7, title, INK) if False else None
    # leave button + leds
    cv.r(150, 200, 84, 10, OL); cv.r(151, 201, 82, 8, hx('#f3e6d0')); text(cv, 156, 203, 'ESC  LEAVE CABINET', OL)
    for i, c in enumerate(('#c04a38', '#e0c860', '#5aa070')): cv.r(20+i*8, 204, 5, 5, OL); cv.r(21+i*8, 205, 3, 3, hx(c))
    text(cv, 288, 204, 'TEACHING ONLY', INK)
    return cv

# ------------------------------------------------------------ CATCH
def catch():
    hue = HUES[0]
    cv = screen_base(hue, 'CATCH.CAB', 'ROUND 1/5   47.8S   CAUGHT 0   MISS 0', 'NINE DOWN. ONE UP. CATCH THE LIVE SWITCH.')
    cols, rows = 5, 2
    for r in range(rows):
        for c in range(cols):
            x = 20+c*58; y = 36+r*60
            live = (r == 0 and c == 3)
            cv.r(x, y, 46, 48, OL); cv.r(x+1, y+1, 44, 46, hx('#4a3a2c')); cv.r(x+1, y+1, 44, 1, lit(hx('#4a3a2c'), .3))
            cv.r(x+8, y+6, 30, 34, OL); cv.r(x+9, y+7, 28, 32, hx('#1c2a38') if not live else hx('#3a2a08'))
            if live:
                cv.blend(x-4, y-4, 54, 56, GOLD, .16)
                cv.r(x+14, y+9, 18, 10, OL); cv.r(x+15, y+10, 16, 8, GOLD); cv.r(x+15, y+10, 16, 2, lit(GOLD, .5))     # lever up
                cv.r(x+20, y+19, 6, 12, hx('#8a6a18'))
                text(cv, x+17, y+41, 'UP', GOLD)
            else:
                cv.r(x+14, y+25, 18, 10, OL); cv.r(x+15, y+26, 16, 8, hx('#b8a890')); cv.r(x+15, y+26, 16, 2, lit(hx('#b8a890'), .4))
                cv.r(x+20, y+14, 6, 11, hx('#5a4a3a'))
                text(cv, x+14, y+41, 'DOWN', DIM)
    # clock bar
    cv.r(20, 164-4, SW-40, 6, OL); cv.r(21, 164-3, int((SW-42)*.62), 4, GOLD); cv.r(21, 164-3, int((SW-42)*.62), 1, lit(GOLD, .5))
    return bezel(cv, hue)

# ------------------------------------------------------------ RODS
def rods():
    hue = HUES[2]
    cv = screen_base(hue, 'ROD.BANK', 'DEMAND 0.91   WORTH 0.00   HOLD 0.0/12', '1-4 INSERT   SHIFT/RIGHT-CLICK WITHDRAW   CHASE THE GOLD BAR')
    banks = ['D', 'C', 'B', 'A']; ins = [.55, .30, .10, .0]
    for i, b in enumerate(banks):
        x = 18+i*54; y = 22; w = 40; h = 126
        cv.r(x, y, w, h, OL); cv.r(x+1, y+1, w-2, h-2, hx('#10181c'))
        # fuel assembly lattice behind rods (pins)
        for px_ in range(x+6, x+w-4, 6):
            cv.r(px_, y+2, 2, h-4, hx('#2a3a40'))
        # rod
        ry = int(ins[i]*(h-20))
        cv.r(x+13, y+1, 14, 8+ry, OL); cv.r(x+14, y+1, 12, 7+ry, hx('#6a8a70')); cv.r(x+14, y+1, 3, 7+ry, hx('#98b898'))
        cv.r(x+13, y+9+ry, 14, 3, OL); cv.r(x+14, y+9+ry, 12, 1, hx('#c8d4c8'))
        text(cv, x+4, y+h-10, 'BANK '+b, CREAM)
        text(cv, x+w-9, y+3, str(i+1), hx(hue))
    # demand + power
    cv.r(238, 22, 64, 126, OL); cv.r(239, 23, 62, 124, hx('#10181c'))
    text(cv, 244, 27, 'POWER', CREAM)
    cv.r(250, 38, 12, 100, OL); cv.r(251, 39, 10, 98, hx('#1c2a30')); cv.r(251, 80, 10, 57, hx('#e8963a')); cv.r(251, 80, 10, 2, lit(hx('#e8963a'), .5))
    cv.r(246, 50, 20, 2, GOLD); text(cv, 270, 48, 'DEMAND', GOLD)
    text(cv, 270, 90, '58%', CREAM)
    return bezel(cv, hue, 'ROD.BANK')

# ------------------------------------------------------------ PHYS (pellet)
def phys():
    hue = HUES[4]
    cv = screen_base(hue, 'PHYS.CAB', 'K 0.79   ROD 22%   HOLD 0.4/12   N 24', 'CREAM FAST   LEAF THERMAL   GOLD FISSION   W IN   S OUT')
    cx, cy = 150, 90
    # water
    cv.d.ellipse([cx-70, cy-70, cx+70, cy+70], fill=OL); cv.d.ellipse([cx-69, cy-69, cx+69, cy+69], fill=hx('#2a5c88'))
    cv.d.ellipse([cx-60, cy-60, cx+60, cy+60], fill=hx('#3a74a4'))
    # clad
    cv.d.ellipse([cx-38, cy-38, cx+38, cy+38], fill=OL); cv.d.ellipse([cx-37, cy-37, cx+37, cy+37], fill=hx('#9aa4aa'))
    # fuel pellet
    cv.d.ellipse([cx-31, cy-31, cx+31, cy+31], fill=OL); cv.d.ellipse([cx-30, cy-30, cx+30, cy+30], fill=hx('#6a3a30'))
    cv.d.ellipse([cx-18, cy-18, cx+18, cy+18], fill=hx('#8a4a38'))
    text(cv, cx-12, cy-2, 'FUEL', hx('#f6e2c4')); text(cv, cx-10, cy+34, 'CLAD', hx('#3b2318')); text(cv, cx-32, cy-64, 'WATER', CREAM)
    rr = random.Random(3)
    # neutrons: cream = fast, leaf = thermal, gold = fission flash
    for _ in range(26):
        a = rr.random()*math.tau; d = 20+rr.random()*70
        x, y = int(cx+math.cos(a)*d), int(cy+math.sin(a)*d)
        kind = rr.choice(['f', 't', 't'])
        c = CREAM if kind == 'f' else hx('#7ac47a')
        cv.r(x-1, y-1, 4, 4, OL); cv.r(x, y, 2, 2, c)
    for (x, y) in ((cx-6, cy+8), (cx+9, cy-12), (cx+16, cy+14)):
        cv.blend(x-6, y-6, 14, 14, GOLD, .35); cv.r(x-1, y-1, 4, 4, OL); cv.r(x, y, 2, 2, GOLD)
    # control rod entering from top-right
    cv.r(250, 22, 14, 56, OL); cv.r(251, 22, 12, 55, hx('#4a4a52')); cv.r(251, 22, 3, 55, hx('#7a7a84')); cv.r(250, 20, 14, 3, GOLD)
    text(cv, 238, 82, 'ROD 22%', CREAM)
    # hold meter
    cv.r(238, 100, 70, 8, OL); cv.r(239, 101, 68, 6, hx('#10181c')); cv.r(239, 101, 5, 6, GOLD)
    text(cv, 238, 112, 'HOLD K ABOVE 1', DIM)
    return bezel(cv, hue, 'PHYS.CAB')

# ------------------------------------------------------------ DELAY
def delay():
    hue = HUES[1]
    cv = screen_base(hue, 'DELAY.CAB', 'RHO +0.42$   PERIOD 38S   HOLD 4.1/12', 'A/D MOVE ROD   KEEP BELOW $1.00 - PROMPT CRITICAL KILLS', )
    # plot area
    px0, py0, pw, ph = 18, 24, 190, 120
    cv.r(px0, py0, pw, ph, OL); cv.r(px0+1, py0+1, pw-2, ph-2, hx('#10181c'))
    for gx in range(px0+20, px0+pw, 20): cv.r(gx, py0+1, 1, ph-2, hx('#24323a'))
    for gy in range(py0+20, py0+ph, 20): cv.r(px0+1, gy, pw-2, 1, hx('#24323a'))
    pts = []
    for i in range(pw-4):
        t = i/(pw-4)
        y = 0.62-0.30*t+0.10*math.sin(t*9)*(1-t)
        pts.append((px0+2+i, py0+ph-4-int(y*(ph-10))))
    for (x, y), (x2, y2) in zip(pts, pts[1:]): cv.r(x, min(y, y2), 1, abs(y2-y)+2, CREAM)
    cv.r(px0+pw-6, pts[-1][1]-2, 4, 4, GOLD)
    text(cv, px0+4, py0+4, 'POWER N(T)', CREAM)
    # 6 delayed groups (sparks)
    gcols = ['#c9a227', '#c4783a', '#6b8f71', '#5a9bb8', '#8a7864', '#b85c4a']
    for i, c in enumerate(gcols):
        y = 30+i*17
        text(cv, 218, y+4, f'G{i+1}', CREAM)
        cv.r(234, y, 70, 12, OL); cv.r(235, y+1, 68, 10, hx('#10181c'))
        cv.r(236, y+2, int(64*(0.9-i*0.12)), 8, hx(c)); cv.r(236, y+2, int(64*(0.9-i*0.12)), 1, lit(hx(c), .4))
    text(cv, 222, 24, 'PRECURSORS', DIM) if False else None
    # reactivity meter in dollars with prompt-critical line
    cv.r(222, 136, 82, 10, OL); cv.r(223, 137, 80, 8, hx('#10181c')); cv.r(223, 137, 34, 8, hx('#5aa070'))
    cv.r(296, 134, 2, 14, hx('#c04a38'))
    text(cv, 222, 150, '$0.42', CREAM); text(cv, 276, 150, '$1.00', hx('#e07060'))
    # rod slider
    cv.r(18, 152, 190, 6, OL); cv.r(19, 153, 188, 4, hx('#3a2a1e')); cv.r(88, 149, 12, 12, OL); cv.r(89, 150, 10, 10, hx('#6a8a70'))
    return bezel(cv, hue, 'DELAY.CAB')

if __name__ == '__main__':
    for n in ('catch', 'rods', 'phys', 'delay'):
        c = globals()[n](); c.save(f'{OUT}/cab-{n}.png'); c.save(f'{OUT}/cab-{n}-3x.png', 3); print(n)
