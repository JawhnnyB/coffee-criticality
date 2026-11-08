"""Security-sequence art: Dee (guard) portrait + sprite, iris-scan close-up (3 states), ID badge card + icons, wayfinding, desk, intro tableaux + beats."""
import os, sys, math
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import security as S
from security import *
import cast
from px import text, text_w, big, big_w
import intro_mock as im_
from builder_mock import panel, wrap
OUT = os.environ.get('SEC_OUT', os.path.join(HERE, 'out')); os.makedirs(OUT, exist_ok=True)
CREAM, INK, BRN, AMB = hx('#f6e2c4'), hx('#3b2318'), hx('#8a4a2a'), hx('#e0a850')

# ------------------------------------------------------------------ Dee portrait
cast.SPEC['dee'] = dict(skin='#c89870', skinS='#a87850', hair='#8a7a6a', hairL='#aca090', hairD='#645a50', top='#8aa8c4', topL='#a8c4dc', topD='#5e7e9c', style='part', glasses=False, age=True)
cast.BG['dee'] = '#c8d4dc'
def dee_portrait(mouth='smile', bg=None):
    cv = cast.face('dee', mouth, bg or cast.BG['dee'])
    d = cv.d
    # cap: crown over hair, brim across brow line, gold star
    d.ellipse([9, 2, 39, 24], fill=OL); d.ellipse([10, 3, 38, 23], fill=NAVY)
    cv.r(10, 12, 28, 8, NAVY); cv.r(14, 5, 10, 2, NAVYL)
    cv.r(8, 17, 32, 4, OL); cv.r(9, 17, 30, 3, NAVYD); cv.r(9, 17, 30, 1, NAVYL)
    cv.r(21, 8, 6, 6, OL); cv.r(22, 9, 4, 4, GOLD); cv.px(23, 9, hx('#fff0a0'))
    # collar tabs + chest badge
    cv.r(14, 41, 3, 3, GOLD); cv.r(33, 41, 3, 3, GOLD)
    cv.r(30, 43, 8, 5, OL); cv.r(31, 44, 6, 3, hx('#f6f0e0')); cv.r(31, 44, 6, 1, TEAL)
    # re-assert eyes under the brim (face() eyes sit at y=23, below the brim)
    return cv
def dee_sheet():
    sh = Cv(10+2*58, 58, (200, 212, 220, 255))
    for i, m in enumerate(('smile', 'talk')): sh.im.alpha_composite(dee_portrait(m).im, (6+i*58, 5))
    return sh

# ------------------------------------------------------------------ sprite 32x64 (idle, front) -- bottom-aligned like the A6 canvases
def dee_canvas():
    base = Image.open(f'{scenes.SPR}/holt_idle_32.png').convert('RGBA'); px_ = base.load()
    remap = {(168, 112, 68): (138, 168, 196), (116, 76, 44): (96, 124, 150), (74, 44, 28): (62, 86, 110), (36, 58, 92): (30, 44, 76), (22, 40, 66): (20, 30, 54),
             (196, 160, 112): (150, 136, 124), (232, 208, 168): (196, 184, 170), (138, 108, 72): (112, 100, 92)}
    for yy in range(base.height):
        for xx in range(base.width):
            r, g, b, a = px_[xx, yy]
            if a and (r, g, b) in remap: px_[xx, yy] = remap[(r, g, b)] + (a,)
    bb = base.getbbox(); x0, y0 = bb[0], bb[1]
    cv = Cv(32, 64); cv.im.alpha_composite(base, (0, 0))
    cv.r(x0+1, y0-1, 12, 5, OL); cv.r(x0+2, y0, 10, 4, NAVY); cv.r(x0+2, y0, 10, 1, NAVYL)
    cv.r(x0+0, y0+4, 14, 2, OL); cv.r(x0+1, y0+4, 12, 1, NAVYD); cv.px(x0+6, y0+1, GOLD); cv.px(x0+7, y0+1, GOLD)
    cv.px(x0+9, y0+13, GOLD); cv.px(x0+4, y0+13, GOLD)
    return cv

# ------------------------------------------------------------------ the eye
def eye(cv, cx, cy, state='scan', w=72, h=40):
    d = cv.d
    lid = hx('#dba37a'); lidD = hx('#b88058')
    d.ellipse([cx-w//2-2, cy-h//2-4, cx+w//2+1, cy+h//2+3], fill=OL); d.ellipse([cx-w//2-1, cy-h//2-3, cx+w//2, cy+h//2+2], fill=lid)
    d.ellipse([cx-w//2+3, cy-h//2+2, cx+w//2-4, cy+h//2-3], fill=OL); d.ellipse([cx-w//2+4, cy-h//2+3, cx+w//2-5, cy+h//2-4], fill=hx('#f6ecdc'))
    r = 15
    d.ellipse([cx-r-1, cy-r-1, cx+r, cy+r], fill=OL)
    col = {'align': '#4a86c8', 'scan': '#4a86c8', 'match': '#4a86c8'}[state]
    d.ellipse([cx-r, cy-r, cx+r-1, cy+r-1], fill=hx('#2a5a98'))
    d.ellipse([cx-r+3, cy-r+3, cx+r-4, cy+r-4], fill=hx(col))
    for a in range(0, 360, 12):                                                    # radial fibres
        x0_, y0_ = cx+math.cos(math.radians(a))*6, cy+math.sin(math.radians(a))*6
        x1_, y1_ = cx+math.cos(math.radians(a))*(r-4), cy+math.sin(math.radians(a))*(r-4)
        d.line([(round(x0_), round(y0_)), (round(x1_), round(y1_))], fill=hx('#7ab0e0') if (a//12) % 2 == 0 else hx('#3a70b0'))
    d.ellipse([cx-r+7, cy-r+7, cx+r-8, cy+r-8], outline=hx('#2a5a98'))
    d.ellipse([cx-7, cy-7, cx+6, cy+6], fill=OL)                                   # pupil
    cv.r(cx-4, cy-5, 3, 3, hx('#fff8e4'))                                          # highlight
def brackets(cv, x0, y0, x1, y1, col, l=10):
    c = hx(col)
    for (x, y, dx, dy) in ((x0, y0, 1, 1), (x1-1, y0, -1, 1), (x0, y1-1, 1, -1), (x1-1, y1-1, -1, -1)):
        cv.r(min(x, x+dx*l), y, l, 2, OL if False else c) if False else None
        cv.r(x if dx > 0 else x-l+1, y if dy > 0 else y-1, l, 2, c)
        cv.r(x if dx > 0 else x-1, y if dy > 0 else y-l+1, 2, l, c)

def iris_scene(state='scan', progress=0.6):
    cv = Cv(320, 180, hx('#26323f')+(255,))
    wl, wn = hx('#4e6478'), hx('#3e5266')
    cv.r(0, 0, 320, 112, wl)
    for x in range(0, 320, 32): cv.r(x, 0, 1, 112, drk(wl, .12))
    cv.r(0, 100, 320, 12, wn); cv.r(0, 100, 320, 2, hx('#e8d8b0')); cv.r(0, 111, 320, 1, OL)
    for y in range(112, 180, 16):
        for x in range(0, 320, 16): cv.r(x, y, 16, 16, hx('#c2c4be') if ((x+y)//16) % 2 == 0 else hx('#b0b2ac')); cv.r(x, y, 16, 1, hx('#d8dad4'))
    for yy in range(160, 180, 4):                                                    # hazard sill
        for k in range(0, 320, 8): cv.r(k+((yy//4) % 2)*4, yy, 4, 4, GOLD) if False else None
    # pedestal
    cv.ellipse_shadow(160, 176, 44, 5, .3)
    cv.ob(140, 104, 40, 70, hx('#d8dcdc')); cv.r(142, 106, 36, 2, hx('#fff8e4')); cv.r(146, 120, 28, 1, hx('#aab0b4')); cv.r(146, 130, 28, 1, hx('#aab0b4'))
    cv.ob(80, 14, 160, 98, hx('#e8ecec')); cv.r(82, 16, 156, 3, hx('#fff8e4'))
    cv.ob(96, 24, 128, 78, hx('#1a2330'))
    col = {'align': '#d4552e', 'scan': '#e8b838', 'match': '#6cc060'}[state]
    # eye position
    ex, ey = {'align': (146, 64), 'scan': (160, 64), 'match': (160, 64)}[state]
    cv.r(98, 26, 124, 74, hx('#0e1620'))
    eye(cv, ex, ey, state)
    brackets(cv, 104, 32, 216, 96, col, 12)
    if state == 'align':
        cv.r(159, 36, 2, 56, hx('#d4552e')); cv.r(112, 63, 96, 2, hx('#d4552e'))        # crosshair
        cv.r(159, 63, 2, 2, hx('#0e1620'))
    if state == 'scan':
        by = 44+int(progress*38)
        cv.r(100, by, 120, 2, hx('#f8e078')); cv.blend(100, by-3, 120, 8, hx('#e8b838'), .25)
        # segmented ring
        n = 36
        for i in range(n):
            a = math.radians(i*360/n-90); lit_ = i < int(n*progress)
            x_, y_ = ex+math.cos(a)*24, ey+math.sin(a)*24
            cv.r(round(x_)-1, round(y_)-1, 3, 3, hx('#f8e078') if lit_ else hx('#3a4a5a'))
    if state == 'match':
        n = 36
        for i in range(n):
            a = math.radians(i*360/n-90); x_, y_ = ex+math.cos(a)*24, ey+math.sin(a)*24
            cv.r(round(x_)-1, round(y_)-1, 3, 3, hx('#6cc060'))
        for k, (dx, dy) in enumerate(((-4, 0), (-3, 1), (-2, 2), (-1, 1), (0, 0), (1, -1), (2, -2), (3, -3), (4, -4))):
            pass
        cv.r(204, 78, 16, 16, OL); cv.r(205, 79, 14, 14, hx('#6cc060'))
        for (dx, dy) in ((0, 6), (1, 7), (2, 8), (3, 7), (4, 6), (5, 5), (6, 4), (7, 3), (8, 2)): cv.r(207+dx, 79+dy-1, 2, 2, hx('#fff8e4'))
    # lamp + label plate on the head
    lamp(cv, 156, 18, {'align': 'red', 'scan': 'amber', 'match': 'green'}[state], 8)
    cv.ob(120, 106, 80, 11, hx('#2e4a78')); text(cv, 160-text_w('IRIS SCANNER')//2, 109, 'IRIS SCANNER', CREAM)
    S.eye_icon(cv, 108, 111)
    return cv

def scan_screen(state, progress=0.6):
    cv = im_.ground(); im_.topbar(cv, 'UNIT 1 - SITE ACCESS - IRIS')
    sc = iris_scene(state, progress); sc.save(f'{OUT}/scene-iris-{state}.png')
    cv.r(31, 14, 322, 130, OL); cv.im.alpha_composite(sc.im.crop((0, 8, 320, 136-8)), (32, 15))
    panel(cv, 16, 150, 352, 58)
    cv.r(21, 155, 50, 50, OL); cv.im.alpha_composite(cast.player(mouth='smile', bg='#c8e0b0').im, (22, 156))
    head, sub = {'align': ('ALIGN YOUR EYE', 'MOVE UNTIL THE CROSS SITS ON THE PUPIL.'),
                 'scan': ('HOLD STILL', 'IT MAPS THE PATTERN IN YOUR IRIS, NOT THE COLOUR.'),
                 'match': ('MATCH', 'PORTAL OPEN. WALK THROUGH.')}[state]
    big(cv, 78, 157, head, BRN, 1); text(cv, 78, 168, 'IRIS ENROLLMENT - FIRST DAY ONLY' if state != 'match' else 'ENROLLED. NEXT TIME IT TAKES ONE SECOND.', hx('#c4783a'))
    wrap(cv, 78, 177, sub, 66, INK, 7)
    # progress bar
    x0 = 78; y0 = 193
    cv.r(x0, y0, 192, 7, OL)
    for i in range(23): cv.r(x0+1+i*8, y0+1, 7, 5, hx('#6cc060' if state == 'match' else '#e8b838') if i < int(23*{'align': 0, 'scan': progress, 'match': 1}[state]) else hx('#3a2a1e'))
    im_.button(cv, 292, 190, 64, 14, 'HOLD E' if state != 'match' else 'WALK ON', state == 'match')
    return cv

# ------------------------------------------------------------------ ID badge card (96x128) + icons
def badge_card(look=None, role='TRANSFERRED ENGINEER', name='NEW HIRE', idn='0417', tld='07'):
    look = look or dict(hoodie='copper', hair='brown', glasses=True)
    cv = Cv(96, 128)
    cv.r(44, 0, 8, 6, OL); cv.r(45, 1, 6, 4, hx('#8a98a4'))                          # clip
    cv.r(46, 5, 4, 5, OL); cv.r(47, 5, 2, 5, STEEL)
    cv.ob(6, 9, 84, 117, hx('#f6f0e0'))
    cv.r(7, 10, 82, 14, TEAL); cv.r(7, 10, 82, 1, lit(TEAL, .3)); cv.r(7, 23, 82, 1, drk(TEAL, .3))
    text(cv, 12, 14, 'UNIT 1', hx('#fff8e4')); S.trefoil(cv, 78, 17, 5)
    cv.r(22, 29, 52, 52, OL); cv.im.alpha_composite(cast.player(**look, mouth='smile', bg='#c8e0b0').im, (24, 31))
    cv.r(22, 29, 52, 1, OL)
    big(cv, 48-big_w(name)//2, 84, name, INK, 1)
    for i, ln in enumerate(role.split(' ', 1) if ' ' in role else [role]): text(cv, 48-text_w(ln)//2, 94+i*7, ln, hx('#5a4030'))
    cv.r(12, 110, 30, 10, OL)                                                         # barcode
    for i in range(14): cv.r(13+i*2, 111, 1 if i % 3 else 2, 8, hx('#f6f0e0') if i % 4 == 3 else INK)
    text(cv, 47, 109, f'ID {idn}', hx('#5a4030')); text(cv, 47, 116, f'TLD {tld}', hx('#5a4030'))
    S.eye_icon(cv, 82, 113); text(cv, 78, 117, 'OK', hx('#3a7a38')) if False else None
    cv.r(7, 120, 82, 5, TEAL) if False else None
    return cv
def lanyard_badge(look=None, **kw):
    """badge with cord, 112x160 for the 'item received' popup"""
    cv = Cv(112, 160); b = badge_card(look, **kw)
    # cord: two straps meeting at the clip
    for t_ in range(0, 28):
        cv.r(36+t_//2+0, t_, 2, 1, OL) if False else None
    d = cv.d
    d.line([(24, 0), (48+8, 24)], fill=OL, width=3); d.line([(88, 0), (56, 24)], fill=OL, width=3)
    d.line([(24, 0), (56, 24)], fill=TEAL, width=1); d.line([(88, 0), (56, 24)], fill=TEAL, width=1)
    cv.im.alpha_composite(b.im, (8, 28))
    return cv
def icons():
    sh = Cv(16*5+4*6, 20, (0, 0, 0, 0))
    def slot(i): return 4+i*22, 2
    # badge
    x, y = slot(0); sh.ob(x+2, y+3, 11, 13, hx('#f6f0e0')); sh.r(x+3, y+4, 9, 3, TEAL); sh.r(x+4, y+8, 4, 4, hx('#f5c9a0')); sh.r(x+9, y+9, 3, 1, INK); sh.r(x+9, y+11, 3, 1, INK); sh.r(x+6, y, 3, 3, OL); sh.r(x+7, y, 1, 3, STEEL)
    # TLD
    x, y = slot(1); sh.ob(x+3, y+2, 10, 13, hx('#e8d8b0')); sh.r(x+4, y+3, 8, 3, hx('#4aa8e0')); sh.r(x+5, y+8, 6, 4, hx('#3a2a1e')); sh.r(x+6, y+9, 4, 2, hx('#e8c030')); sh.r(x+6, y, 4, 3, OL); sh.r(x+7, y+1, 2, 2, STEEL)
    # iris
    x, y = slot(2); S.eye_icon(sh, x+8, y+8); sh.r(x+6, y+6, 5, 5, OL); sh.r(x+7, y+7, 3, 3, hx('#4a86c8')); sh.r(x+8, y+8, 1, 1, OL)
    # portal closed / open
    for i, st in ((3, 'red'), (4, 'green')):
        x, y = slot(i); sh.r(x+1, y+2, 3, 13, OL); sh.r(x+2, y+3, 1, 11, STEEL); sh.r(x+12, y+2, 3, 13, OL); sh.r(x+13, y+3, 1, 11, STEEL)
        if st == 'red': sh.r(x+4, y+7, 8, 3, OL); sh.r(x+5, y+8, 6, 1, GLASS)
        S.lamp(sh, x+6, y+1, st, 4)
    return sh

# ------------------------------------------------------------------ wayfinding / desk
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
def door_plates():
    names = ['CONTROL ROOM', 'ENGINEERING', 'BREAK ROOM', 'SECURITY', 'MAINTENANCE', 'REACTOR HALL']
    sh = Cv(110, len(names)*14+4, (0, 0, 0, 0))
    for i, n in enumerate(names):
        w = text_w(n)+10; sh.ob(4, 2+i*14, w, 11, hx('#2e4a78')); text(sh, 9, 5+i*14, n, CREAM)
    return sh

def eng_with_desk():
    """Engineering with YOUR DESK. The desk and chair are in content.ts now, so this is just the room."""
    return rr.render_room('engineering', chars=False, border_on=False)
def corridor_signs():
    """Corridor with the wayfinding plate (roomkit dress() composites it)."""
    return rr.render_room('corridor', chars=False, border_on=False)

# ------------------------------------------------------------------ tableaux (320x180) for the intro
def sc_security():
    cv = lobby(route=False, chars=False, border=False)
    scenes.put(cv, 'dee', 'down', 80, 76)
    cv.r(48, 78, 66, 22, (0, 0, 0, 0)) if False else None
    cv = lobby_redraw_desk(cv)
    scenes.put(cv, 'player', 'right', 52, 150)
    scenes.put(cv, 'marcus', 'up', 118, 198)
    return scenes.crop(cv, 16, 28)
def lobby_redraw_desk(cv):
    d_guarddesk(cv, 32, 64, 80, 32); return cv
def sc_badge():
    cv = lobby(route=False, chars=False, border=False)
    scenes.put(cv, 'player', 'up', 144, 110)
    # card sliding out + sparkle
    cv.ob(140, 78, 8, 11, hx('#fff8e4')); cv.r(141, 79, 6, 3, TEAL); cv.r(142, 83, 3, 3, hx('#f5c9a0'))
    for (x, y) in ((136, 76), (152, 80), (146, 72)): cv.px(x, y, hx('#fff8e4')); cv.px(x+1, y, hx('#fff8e4')); cv.px(x, y+1, hx('#fff8e4'))
    scenes.put(cv, 'dee', 'down', 80, 76); cv = lobby_redraw_desk(cv)
    return scenes.crop(cv, 40, 30)
def sc_desk():
    cv = eng_with_desk()
    scenes.put(cv, 'priya', 'left', 280, 178)
    scenes.put(cv, 'player', 'right', 146, 206)
    return scenes.crop(cv, 32, 76)

_cg = cast.get
def _get(who, mouth='smile', bg=None, over=None):
    return dee_portrait(mouth, bg) if who == 'dee' else _cg(who, mouth, bg, over)
cast.get = _get
im_.SC = OUT

def beats():
    b = {
     'intro-security': im_.beat('security', 0, 'dee', 'OFFICER DEE OKAFOR', 'SITE ACCESS - DEE', 'NOBODY WALKS PAST ME WITHOUT A BADGE.', "'MORNING. NOT YOU, NOT THE PLANT MANAGER. THREE STOPS: BADGE, DOSIMETER, PORTAL. FOLLOW THE BLUE LINE.'", 5, mouth='talk'),
     'intro-badge': im_.beat('kiosk', 0, 'dee', 'OFFICER DEE OKAFOR', 'BADGES - DEE', 'LOOK AT THE LENS. DO NOT SMILE.', "'IT IS A BADGE, NOT A YEARBOOK. YOUR PICTURE, YOUR NUMBER, YOUR DOSIMETER SLOT. LOSE IT AND YOU WRITE A REPORT.'", 5, mouth='smile'),
     'intro-iris': im_.beat('iris-scan', 8, 'dee', 'OFFICER DEE OKAFOR', 'THE PORTAL - DEE', 'LOOK AT THE LIGHT. HOLD STILL.', "'IT READS THE PATTERN IN YOUR IRIS, NOT THE COLOUR. ENROLL ONCE. AFTER THAT IT TAKES A SECOND.'", 6, mouth='talk'),
     'intro-desk': im_.beat('desk', 12, 'priya', 'DR. PRIYA SHARMA', 'ENGINEERING - PRIYA', 'THAT ONE IS YOURS.', "'THE NAMEPLATE IS BRAND NEW. THE CRT IS NOT. SIT. THE DRAWINGS ARE HONEST IF THE PEOPLE ARE.'", 7, mouth='smile'),
    }
    return b
def states():
    cv = Cv(3*96+16, 2*72+12, (40, 30, 22, 255))
    return cv

if __name__ == '__main__':
    dee_portrait('smile').save(f'{OUT}/portrait-dee-smile.png'); dee_portrait('talk').save(f'{OUT}/portrait-dee-talk.png')
    dee_canvas().save(f'{OUT}/dee_idle_32.png')
    for st, pr in (('align', 0), ('scan', .6), ('match', 1)):
        iris_scene(st, pr).save(f'{OUT}/scene-iris-{st}.png'); scan_screen(st, pr).save(f'{OUT}/iris-{st}.png'); scan_screen(st, pr).save(f'{OUT}/iris-{st}-2x.png', 2)
    badge_card().save(f'{OUT}/badge-card.png'); badge_card().save(f'{OUT}/badge-card-4x.png', 4)
    lanyard_badge().save(f'{OUT}/badge-lanyard.png')
    icons().save(f'{OUT}/sec-icons.png'); icons().save(f'{OUT}/sec-icons-4x.png', 4)
    wayfinding_plate().save(f'{OUT}/wayfinding.png'); wayfinding_plate().save(f'{OUT}/wayfinding-3x.png', 3)
    door_plates().save(f'{OUT}/door-plates.png', 3)
    eng_with_desk().save(f'{OUT}/engineering-mydesk.png'); eng_with_desk().save(f'{OUT}/engineering-mydesk-3x.png', 3)
    corridor_signs().save(f'{OUT}/corridor-signs.png')
    for n, f in (('security', sc_security), ('kiosk', sc_badge), ('desk', sc_desk)):
        f().save(f'{OUT}/scene-{n}.png')
    for k, cv in beats().items(): cv.save(f'{OUT}/{k}.png'); cv.save(f'{OUT}/{k}-2x.png', 2)
    print('ok')


# ------------------------------------------------------------------ annotated map for the spec (3x)
def annotated():
    K = 3
    base = lobby(route=True, chars=False, border=True).im.resize((352*K, 256*K), Image.NEAREST)
    cv = Cv(352*K, 256*K); cv.im = base; cv.d = ImageDraw.Draw(base)
    def rect(r, col, a=.30, lab=None, lc='#fff8e4'):
        x, y, w, h = [v*16*K for v in r]
        cv.blend(x, y, w, h, hx(col), a); cv.r(x, y, w, 2, hx(col)); cv.r(x, y+h-2, w, 2, hx(col)); cv.r(x, y, 2, h, hx(col)); cv.r(x+w-2, y, 2, h, hx(col))
        if lab:
            tw_ = text_w(lab, 2)+8; cv.r(x+4, y+4, tw_, 14, OL); text(cv, x+8, y+7, lab, hx(lc), 2)
    for pr in SEC['props']:
        if pr['kind'] in ('plant',) and pr.get('block') is False: continue
        rect(pr['rect'], '#e0503a', .22)
    for to, r in SEC['doors']: rect(r, '#6cc060', .35, 'DOOR>'+to.upper())
    rect([2, 4, 5, 3], '#4a9ae0', .22, 'A GUARD')
    rect([8, 3, 2, 3], '#4a9ae0', .25, 'B KIOSK'); rect([11, 3, 2, 3], '#4a9ae0', .25, 'C TLD')
    rect([5, 9, 5, 1], '#4a9ae0', .22, 'X-RAY'); rect([13, 7, 3, 2], '#e8c030', .30, 'D PORTAL')
    rect([20, 6, 1, 4], '#e8c030', .25)
    for i, (n, pt) in enumerate((('1', (40, 128)), ('2', (42, 106)), ('3', (144, 106)), ('4', (192, 106)), ('5', (240, 128)), ('6', (334, 128)))):
        cx, cy = pt[0]*K, pt[1]*K; cv.circle(cx, cy-2*K-10, 9, hx('#fff8e4')); text(cv, cx-3, cy-2*K-15, n, OL, 2)
    return cv
def states_sheet():
    cv = Cv(3*112, 70, (200, 204, 200, 255))
    for i, st in enumerate(('red', 'amber', 'green')):
        x = 8+i*112
        cv.r(x, 0, 104, 70, hx('#b8bcb6'))
        d_irispost(cv, x+30, 20, 16, 32, st); d_laneflap(cv, x+60, 20, 6, 32, 'green' if st == 'green' else 'red')
        text(cv, x+4, 60, {'red': 'LOCKED', 'amber': 'READING', 'green': 'OPEN'}[st], OL)
    return cv
if __name__ == '__main__':
    annotated().save(f'{OUT}/security-annotated.png'); states_sheet().save(f'{OUT}/portal-states.png'); states_sheet().save(f'{OUT}/portal-states-3x.png', 3)

def portal_sprites():
    sh = Cv(16*3+6*2+8, 34, (0, 0, 0, 0))
    for i, st in enumerate(('red', 'amber', 'green')): d_irispost(sh, i*16, 1, 16, 32, st)
    d_laneflap(sh, 52, 1, 6, 32, 'red'); d_laneflap(sh, 62, 1, 6, 32, 'green', True)
    return sh
if __name__ == '__main__':
    portal_sprites().save(f'{OUT}/portal-sprites.png')
if __name__ == '__main__':
    lobby(route=False, chars=False, dyn=False).save(f'{OUT}/security-shell.png')
    lobby().save(f'{OUT}/security.png'); lobby().save(f'{OUT}/security-3x.png', 3)
