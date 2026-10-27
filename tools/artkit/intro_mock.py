"""Intro-sequence screens at 384x216: story beat, badge (role) screen, morning brief."""
import os, sys, textwrap
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from px import *
import cast
from menu import button
from builder_mock import panel, wrap
OUT = os.environ.get('UI_OUT', './out/ui')
SC = os.environ.get('SCENE_DIR', OUT)
W, H = 384, 216
AMB, CREAM, INK, BRN = hx('#e0a850'), hx('#f6e2c4'), hx('#3b2318'), hx('#8a4a2a')
def ground():
    cv = Cv(W, H); cv.r(0, 0, W, H, hx('#1c1410'))
    for yy in range(0, H, 16): cv.r(0, yy, W, 1, hx('#221812'))
    return cv
def topbar(cv, left, n=None, total=8):
    cv.r(0, 0, W, 11, hx('#2a1c14')); cv.r(0, 10, W, 1, hx('#c4783a'))
    text(cv, 6, 3, left, AMB)
    if n is not None:
        for i in range(total):
            x = W-6-(total-i)*10; cv.r(x, 3, 8, 5, OL); cv.r(x+1, 4, 6, 3, hx('#6b8f71') if i < n else hx('#3a2a1e'))
def sound(cv): pass
def scene_window(cv, name, oy, x=32, y=15, w=320, h=128):
    sc = Image.open(f'{SC}/scene-{name}.png').convert('RGBA')
    cv.r(x-1, y-1, w+2, h+2, OL); cv.r(x-2, y-2, w+4, 1, hx('#c4783a')) if False else None
    cv.im.alpha_composite(sc.crop((0, oy, w, oy+h)), (x, y))
def chip(cv, x, y, s, col=CREAM):
    w = text_w(s)+8; cv.r(x, y, w, 11, OL); cv.r(x+1, y+1, w-2, 9, hx('#2a1c14')); text(cv, x+4, y+3, s, col)

def beat(name, oy, who, speaker, kicker, title, line, n, you=False, mouth='talk', look=None):
    cv = ground(); topbar(cv, 'UNIT 1 - ' + kicker, n)
    scene_window(cv, name, oy)
    chip(cv, 38, 21, kicker.split(' - ')[0])
    panel(cv, 16, 150, 352, 58)
    cv.r(21, 155, 50, 50, OL)
    p = cast.player(**(look or {}), mouth=mouth, bg='#c8e0b0') if you else cast.get(who, mouth)
    cv.im.alpha_composite(p.im, (22, 156))
    big(cv, 78, 155, title, BRN, 1)
    text(cv, 78, 166, 'YOU' if you else speaker, hx('#c4783a'))
    wrap(cv, 78, 174, line, 66, INK, 7)
    # continue cue
    for i in range(4): cv.r(354+i, 194+i, 1, 7-2*i, hx('#c4783a'))
    text(cv, 316, 197, 'SPACE', hx('#a8937a'))
    return cv

def badge():
    cv = ground(); topbar(cv, 'UNIT 1 - BADGE - TEACHING ONLY')
    big(cv, 16, 20, 'WHO WALKS IN', CREAM, 2, shadow=hx('#6a3a22'))
    text(cv, 16, 40, 'FLAVOR ONLY. FIRST YOU DESIGN THE UNIT WITH PRIYA. THEN YOU WALK IT.', hx('#a8937a'))
    panel(cv, 16, 54, 150, 118, '#2a1c14', OL)
    cv.r(23, 61, 50, 50, OL); cv.im.alpha_composite(cast.player('copper', 'brown', True, 'smile').im, (24, 62))
    text(cv, 84, 62, 'HOODIE', AMB)
    for i, k in enumerate(cast.HOODIES):
        x = 84+i*16; cv.r(x, 71, 13, 13, OL); cv.r(x+1, 72, 11, 11, hx(cast.HOODIES[k][0])); cv.r(x+1, 72, 11, 2, hx(cast.HOODIES[k][1]))
        if i == 0:
            for dx, dy in ((-2, -2), (13, -2), (-2, 13), (13, 13)): cv.r(x+dx, 71+dy, 3, 3, CREAM)
    text(cv, 84, 92, 'HAIR', AMB)
    for i, k in enumerate(cast.HAIRS):
        x = 84+i*16; cv.r(x, 101, 13, 13, OL); cv.r(x+1, 102, 11, 11, hx(cast.HAIRS[k][0])); cv.r(x+1, 102, 11, 2, hx(cast.HAIRS[k][1]))
        if i == 0:
            for dx, dy in ((-2, -2), (13, -2), (-2, 13), (13, 13)): cv.r(x+dx, 101+dy, 3, 3, CREAM)
    cv.r(84, 122, 9, 9, OL); cv.r(85, 123, 7, 7, hx('#f6e2c4')); cv.r(87, 125, 3, 3, hx('#6b8f71'))
    text(cv, 98, 125, 'GLASSES', CREAM)
    text(cv, 24, 116, 'BADGE PHOTO', hx('#a8937a')); text(cv, 24, 124, 'STILL WARM.', hx('#a8937a'))
    cv.r(23, 138, 136, 1, hx('#3a2a1e')); text(cv, 24, 143, 'ON THE FLOOR', AMB)
    import scenes
    for i, f in enumerate(('down', 'right', 'up')):
        im = scenes.spr('player', f); cv.ellipse_shadow(46+i*30, 175, 6, 2, .32); cv.im.alpha_composite(im, (46+i*30-im.width//2, 176-im.height))
    roles = [('TRANSFERRED ENGINEER', 'NEW SITE, SAME PHYSICS. WATCH THE FLOOR; GROW WHERE TRUTH CAN BE SPOKEN.'),
             ('RECENTLY PROMOTED', 'THE TITLE IS NEW. THE HISS IS NOT. CATCH IT CHEAP.'),
             ('FORMER MILITARY', 'ORDERS WERE A LANGUAGE. HERE THE CATCH IS THE ORDER.'),
             ('CAUTIOUS VETERAN', 'YOU HAVE SEEN A HIDE PATH. YOU DID NOT LIKE WHERE IT WENT.')]
    for i, (t, ln) in enumerate(roles):
        x = 176+(i % 2)*100; y = 54+(i//2)*60; sel = i == 0
        if sel: cv.r(x-1, y-1, 98, 58, AMB)
        panel(cv, x, y, 96, 56, '#f3e6d0' if sel else '#3a2a1e', OL)
        tl = textwrap.wrap(t, 22)
        for j, s_ in enumerate(tl): text(cv, x+5, y+5+j*7, s_, BRN if sel else AMB)
        wrap(cv, x+5, y+5+len(tl)*7+3, ln, 22, INK if sel else hx('#d8c8a8'), 6)
    button(cv, 16, 184, 54, 14, 'BACK', False)
    text(cv, 80, 188, 'PICK A BADGE TO CONTINUE', hx('#a8937a'))
    return cv

def brief():
    cv = ground(); topbar(cv, 'UNIT 1 - DAY 1 - TEACHING ONLY')
    scene_window(cv, 'control', 80, 32, 15, 320, 84)
    panel(cv, 16, 104, 352, 104)
    cv.r(21, 109, 50, 50, OL); cv.im.alpha_composite(cast.get('holt', 'talk').im, (22, 110))
    text(cv, 78, 110, '06:52 - MORNING BRIEF - HOLT', hx('#c4783a'))
    big(cv, 78, 120, 'UNIT 1 IS HOLDING. YOU ARE NOT A HERO TODAY.', BRN, 1)
    wrap(cv, 78, 133, 'HOLT: YOU DESIGNED THE CORE. NOW WALK IT. CATCH. I FUND REVIEWS, NOT MYTHOLOGY.', 66, INK, 7)
    items = ['SIT WITH MABEL. THE CUP IS ALREADY POURED.', 'YOU HAVE SEEN THEIR FACES. STAND WHERE THEY WORK.', "ACADEMY IN CONTROL. PRIYA'S DELTA T BENCH IN ENGINEERING.", 'BOARD A AND THE PAPER LOG SHOULD AGREE. THEY MIGHT NOT.']
    for i, s_ in enumerate(items):
        y = 154+i*8; cv.r(78, y, 5, 5, OL); cv.r(79, y+1, 3, 3, hx('#f6e2c4')); text(cv, 88, y, s_, hx('#5a4030'))
    text(cv, 22, 164, 'VALVE 14', hx('#a8937a')) if False else None
    button(cv, 282, 190, 64, 14, 'WALK IN', True)
    return cv

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    shots = {
      'intro-core': beat('core', 20, 'priya', 'DR. PRIYA SHARMA', 'THE CORE - PRIYA', 'YOU SIGNED A CORE. NOW IT HAS TO LIVE.', "SHE TURNS THE SHEET A QUARTER. 'THE STACK IS DARK FROM HERE. STAND NEXT TO IT. THE HEAT STILL HAS TO LEAVE.'", 1),
      'intro-cafe': beat('cafe', 40, 'mabel', 'DR. MABEL QUINN', 'THE CAFE - MABEL', 'THE KETTLE IS STILL ON FROM THE NIGHT SHIFT.', "'SIT. TWO-TO-TEN LEFT THIS CHAIR WARM. I'M MABEL. I RAN THIS FLOOR TWENTY YEARS.'", 2),
      'intro-you': beat('wing', 22, 'tommy', 'TOMMY REYES', 'THE WING - TOMMY', 'FINISH THE SENTENCE.', 'LOCK. TAG. TRY. THE IN SERVICE CARD IS STILL ON THE FLANGE.', 4, you=True, mouth='smile'),
      'intro-lot': beat('lot', 6, 'elena', 'ELENA VOSS', 'THE LOT - ELENA', 'CHILD SEAT FIRST.', "'CHILD SEAT FIRST. THEN I WAS HERE. STAND WHERE I CAN SEE YOUR HANDS.'", 3, mouth='smile'),
      'intro-door': beat('threshold', 0, 'player', 'YOU', 'THE DOOR - YOU', 'THE HOOK IS EMPTY.', 'FLAVOR. THE FLOOR DOES NOT CARE WHAT THE HOODIE IS CALLED.', 8, you=True, mouth='smile'),
      'badge': badge(), 'brief': brief(),
    }
    for k, cv in shots.items():
        cv.save(f'{OUT}/{k}.png'); cv.save(f'{OUT}/{k}-2x.png', 2)
    print('ok')
