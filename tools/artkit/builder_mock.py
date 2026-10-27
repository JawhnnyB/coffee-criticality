import os, sys, textwrap
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from px import *
import reactors, portrait
from menu import button
OUT = os.environ.get('UI_OUT', './out/ui')
W, H = 640, 360
INKB = hx('#2a1610')

def panel(cv, x, y, w, h, fill='#f3e6d0', edge=OL):
    cv.r(x, y, w, h, edge); cv.r(x+1, y+1, w-2, h-2, hx(fill))
    cv.r(x+1, y+1, w-2, 1, lit(hx(fill), .4)); cv.r(x+1, y+h-2, w-2, 1, drk(hx(fill), .15))

def wrap(cv, x, y, s, w_chars, col, line=8):
    for i, ln in enumerate(textwrap.wrap(s, w_chars)): text(cv, x, y+i*line, ln, col)

def builder_type_step():
    cv = Cv(W, H); cv.r(0, 0, W, H, hx('#1c1410'))
    for yy in range(0, H, 16): cv.r(0, yy, W, 1, hx('#221812'))
    # top bar
    cv.r(0, 0, W, 16, hx('#2a1c14')); cv.r(0, 15, W, 1, hx('#c4783a'))
    text(cv, 8, 5, 'UNIT 1 - PRIYA - 2/7 - TEACHING ONLY', hx('#e0a850'))
    for n in range(7): cv.r(W-8-(7-n)*14, 5, 11, 6, OL); cv.r(W-7-(7-n)*14, 6, 9, 4, hx('#6b8f71') if n <= 1 else hx('#3a2a1e'))
    # title
    big(cv, 10, 26, 'PLANT TYPE', hx('#f6e2c4'), 2, shadow=hx('#6a3a22'))
    # priya dialogue box
    panel(cv, 8, 50, 236, 70)
    cv.r(8, 50, 236, 70, OL); cv.r(9, 51, 234, 68, hx('#f3e6d0'))
    p = portrait.priya('talk', '#a8d0c8'); cv.r(13, 56, 50, 50, OL); cv.im.alpha_composite(p.im, (14, 57))
    wrap(cv, 70, 58, 'THIS SITE IS A PWR. BWR, PEBBLE, AND SALT ARE COMPARISON MODELS FROM THE TEACHING ARCHIVE. SAME LAW: HEAT LEAVES WITH THE COURIER.', 41, hx('#3b2318'))
    text(cv, 70, 104, 'DR. PRIYA SHARMA', hx('#8a4a2a'))
    # type cards 2x2 with thumbnails from the real schematics
    names = [('pwr', 'PWR - THIS SITE', 'LIQUID WATER 15.5 MPA'), ('bwr', 'BWR - COMPARE', 'BOILS IN VESSEL 7.2 MPA'),
             ('pebble', 'PEBBLE / TRISO', 'HELIUM 7 MPA 250-750C'), ('msr', 'MSR / SALT', 'FUEL SALT ~0.2 MPA')]
    for i, (k, t, sub) in enumerate(names):
        x = 8+(i % 2)*120; y = 128+(i//2)*62
        sel = (i == 0)
        panel(cv, x, y, 116, 58, '#f3e6d0' if sel else '#3a2a1e', hx('#e0a850') if sel else OL)
        if sel: cv.r(x-1, y-1, 118, 60, hx('#e0a850')); panel(cv, x, y, 116, 58, '#f3e6d0', OL)
        th = getattr(reactors, k)()
        th = th.im.resize((64, 36), Image.NEAREST)
        cv.r(x+4, y+4, 66, 38, OL); cv.im.alpha_composite(th, (x+5, y+5))
        text(cv, x+74, y+6, 'CLICK', hx('#8a4a2a') if sel else hx('#a8937a')) if False else None
        text(cv, x+4, y+46, t, INKB if sel else hx('#f3e6d0'))
        wrap(cv, x+74, y+8, sub, 9, hx('#3b2318') if sel else hx('#a8937a'))
    # nav
    button(cv, 8, 258, 54, 14, 'BACK', False)
    button(cv, 72, 258, 72, 14, 'CONTINUE', True)
    # right: schematic + readouts
    cv.r(251, 23, 386, 218, OL); cv.r(252, 24, 384, 216, hx('#f1e4c8'))
    sch = reactors.pwr(); cv.im.alpha_composite(sch.im, (252, 24))
    text(cv, 252, 245, 'THE ONLY LABELLED DRAWING FOR THIS SITE. TEACHING ONLY - NOT A LICENSE.', hx('#a8937a'))
    tiles = [('DELTA T', '32', 'C'), ('FLOW', '100', '%'), ('PRESSURE', '15.5', 'MPA'), ("LINEAR HEAT", '19.8', 'KW/M')]
    for i, (k, v, u) in enumerate(tiles):
        x = 252+i*97; y = 262
        panel(cv, x, y, 91, 40, '#2a1c14', OL)
        text(cv, x+5, y+5, k, hx('#a8937a'))
        big(cv, x+5, y+17, v, hx('#f6e2c4'), 2)
        text(cv, x+5+big_w(v, 2)+4, y+28, u, hx('#e0a850'))
    text(cv, 8, 338, 'Q = M x CP x DELTA T.  HIGH FLOW IS POLITE. HIGH DELTA T IS LOUD.', hx('#a8937a'))
    return cv

if __name__ == '__main__':
    c = builder_type_step(); c.save(f'{OUT}/builder-type.png'); c.save(f'{OUT}/builder-type-2x.png', 2); print('ok')
