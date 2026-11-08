"""Security lobby ("Site Access") for Coffee & Criticality - A-series room art, native pixels, TILE=16.
Registers new prop kinds into roomkit's PROP dict and a 'security' palette, then renders the room.
Room = 22 x 16 tiles (352x256). West door -> lot ("Gate"), east door -> corridor."""
import os, sys, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
os.environ.setdefault('CONTENT_TS', os.path.join(os.environ.get('CC_REPO', '/home/claude/jawhnnyb/coffee-criticality'), 'src/game/content.ts'))
os.environ.setdefault('ROOMS_OUT', os.path.join(HERE, 'out'))
REPO = os.environ.get('CC_REPO', '/home/claude/jawhnnyb/coffee-criticality')
if os.path.isdir(os.path.join(REPO, 'tools', 'roomkit')): sys.path.insert(0, os.path.join(REPO, 'tools', 'roomkit'))   # roomkit (kit, render_rooms, ref) comes from the repo
import kit
from kit import *
import render_rooms as rr
from px import text, text_w
import scenes

from security_kit import *   # palette, prop drawers, dress_sec, under() live in tools/roomkit/security_kit.py

# ------------------------------------------------------------------ room definition (tiles) -- same numbers as the content.ts block in GROK-PROMPT-security.md
SEC = dict(w=22, h=16,
    doors=[('gate', [0, 6, 1, 4]), ('corridor', [21, 6, 1, 4])],
    props=[
     dict(rect=[2, 4, 5, 2], kind='guarddesk', label='Security desk'),
     dict(rect=[8, 3, 2, 2], kind='kiosk', label='Badge kiosk'),
     dict(rect=[11, 3, 2, 2], kind='dosirack', label='Dosimeter rack'),
     dict(rect=[5, 10, 5, 3], kind='xray', label='Bag scanner'),
     dict(rect=[14, 3, 2, 4], kind='barrier'), dict(rect=[14, 9, 2, 7], kind='barrier'),
     dict(rect=[14.5, 5, 1, 2], kind='irispost', label='Iris scanner'), dict(rect=[14.5, 9, 1, 2], kind='irispost', label='Iris scanner'),
     dict(rect=[15, 7, 1, 2], kind='laneflap', label='Portal'),
     dict(rect=[1, 11, 3, 2], kind='bench_s'),
     dict(rect=[1, 14, 2, 2], kind='plant', block=False),
     dict(rect=[20, 3, 2, 2], kind='plant'),
     dict(rect=[17, 3, 2, 2], kind='cabinet', label='Visitor lockers'),
     dict(rect=[17, 11, 3, 2], kind='bench_s'),
     dict(rect=[11, 13, 1, 1], kind='trash'),
    ], win=[])
rr.ROOMS['security'] = SEC
GUIDE = '#3aa0c0'

def _line(cv, pts, w=4, col=GUIDE, chev=True):
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if y0 == y1:
            xa, xb = min(x0, x1), max(x0, x1)
            cv.r(xa, y0-w//2, xb-xa, w, hx(col)); cv.r(xa, y0-w//2, xb-xa, 1, lit(hx(col), .35)); cv.r(xa, y0+w//2-1, xb-xa, 1, drk(hx(col), .25))
            if chev:
                d = 1 if x1 > x0 else -1
                for xx in range(xa+14, xb-8, 28):
                    for k in range(3): cv.px(xx-d*k, y0-1-k+ (0), hx('#f6f0d8')); cv.px(xx-d*k, y0+k, hx('#f6f0d8'))
        else:
            ya, yb = min(y0, y1), max(y0, y1)
            cv.r(x0-w//2, ya, w, yb-ya, hx(col)); cv.r(x0-w//2, ya, 1, yb-ya, lit(hx(col), .35)); cv.r(x0+w//2-1, ya, 1, yb-ya, drk(hx(col), .25))
            if chev:
                d = 1 if y1 > y0 else -1
                for yy in range(ya+10, yb-6, 28):
                    for k in range(3): cv.px(x0-1-k, yy-d*k, hx('#f6f0d8')); cv.px(x0+k, yy-d*k, hx('#f6f0d8'))
GUIDE_PTS = [(10, 128), (42, 128), (42, 106), (144, 106), (144, 106)]
ROUTE = [(8, 128), (40, 128), (40, 108), (192, 108), (192, 128), (344, 128)]

_orig_dress = rr.dress
def _dress(cv, rid, p, W, occ):
    if rid == 'security': dress_sec(cv, W)
    else: _orig_dress(cv, rid, p, W, occ)
rr.dress = _dress

def render_security(chars=False, route=True, border_on=True):
    # route overlay is drawn onto the floor right after the floor, so patch render via a custom wrapper
    R = SEC; W, H = R['w']*T, R['h']*T
    cv = rr.render_room('security', chars=False, border_on=False)
    return cv

def lobby(route=True, chars=True, border=True, state='closed', dyn=True):
    """full reference: floor+walls via roomkit, guide line + threshold hazard + mat painted *under* props, then props and doors."""
    p = kit.ROOM['security']; W, H = SEC['w']*T, SEC['h']*T
    cv = Cv(W, H)
    floor(cv, p, 0, 48, W, H-48); wall(cv, p, W)
    dress_sec(cv, W)
    # hazard stripe at the portal threshold (2 tiles wide, x 14..16 tiles = 224..256)
    for yy in range(112, 144, 4):
        for k in range(8):
            cv.r(224+k*4, yy, 4, 4, GOLD if (k+yy//4) % 2 == 0 else hx('#3a3a40'))
    cv.r(224, 112, 32, 1, OL); cv.r(224, 143, 32, 1, OL)
    # queue line in front of guard desk
    cv.r(24, 100, 80, 1, hx('#c04a38')); cv.r(24, 101, 80, 1, drk(hx('#c04a38'), .2))
    d_mat(cv, 8, 112, 32, 32)
    if route: _line(cv, ROUTE)
    rr.draw_doors(cv, 'security', p, W, H, SEC['doors'])
    # props sorted by bottom edge
    state_ = dict(cab=0)
    props = sorted(SEC['props'], key=lambda pr: pr['rect'][1]+pr['rect'][3])
    items = []
    for i, pr in enumerate(props):
        k = pr['rect'][1]+pr['rect'][3]
        if pr['kind'] == 'barrier': k = pr['rect'][1]
        if pr['kind'] in ('irispost', 'laneflap'):
            if not dyn: continue
            k = 99
        items.append((k, 'prop', pr))
    if chars:
        items += [(4.9, 'char', ('dee', 'down', 80, 78)), (13, 'char', ('marcus', 'up', 120, 196)), (8.9, 'char', ('player', 'right', 205, 146))]
    items.sort(key=lambda t: t[0])
    for _, kind, obj in items:
        if kind == 'prop':
            pr = obj; x, y, w, h = [int(v*T) for v in pr['rect']]
            if pr['kind'] == 'irispost': d_irispost(cv, x, y, w, h, 'amber')
            elif pr['kind'] == 'laneflap': d_laneflap(cv, x+(w-6)//2, y, 6, h, 'red' if state == 'closed' else 'green')
            elif pr['kind'] == 'plant': d_plant(cv, x, y, w, h)
            else: kit.PROP[pr['kind']](cv, x, y, w, h)
        else:
            who, face_, cx, fy = obj
            if who == 'dee': put_dee(cv, cx, fy)
            else: scenes.put(cv, who, face_, cx, fy)
    if border: border_(cv, W, H)
    return cv
def border_(cv, w, h): kit.border(cv, w, h)

# ------------------------------------------------------------------ Dee (guard): recolour of the Holt sprite + cap
from PIL import Image
def dee_sprite(facing='down'):
    base = Image.open(f'{scenes.SPR}/holt_idle_32.png').convert('RGBA'); px_ = base.load()
    remap = {(168, 112, 68): (138, 168, 196), (116, 76, 44): (96, 124, 150), (74, 44, 28): (62, 86, 110),     # shirt ramp -> light blue
             (36, 58, 92): (30, 44, 76), (22, 40, 66): (20, 30, 54),                                          # trousers -> navy
             (196, 160, 112): (150, 136, 124), (232, 208, 168): (196, 184, 170), (138, 108, 72): (112, 100, 92)}  # hair -> grey-brown
    for yy in range(base.height):
        for xx in range(base.width):
            r, g, b, a = px_[xx, yy]
            if a and (r, g, b) in remap: px_[xx, yy] = remap[(r, g, b)] + (a,)
    bb = base.getbbox(); x0, y0 = bb[0], bb[1]
    cv = Cv(32, 64); cv.im.alpha_composite(base, (0, 0))
    # cap: crown over hair rows + brim, in sprite space (head top at y0)
    cv.r(x0+1, y0-1, 12, 5, OL); cv.r(x0+2, y0, 10, 4, NAVY); cv.r(x0+2, y0, 10, 1, NAVYL)
    cv.r(x0+0, y0+4, 14, 2, OL); cv.r(x0+1, y0+4, 12, 1, NAVYD); cv.px(x0+6, y0+1, GOLD); cv.px(x0+7, y0+1, GOLD)
    # star badge + shoulder patch
    cv.px(x0+9, y0+13, GOLD); cv.px(x0+4, y0+13, GOLD)
    return cv.im.crop(cv.im.getbbox())
_dee = None
def put_dee(cv, cx, feet):
    global _dee
    if _dee is None: _dee = dee_sprite()
    cv.ellipse_shadow(cx, feet-1, 6, 2, .32); cv.im.alpha_composite(_dee, (cx-_dee.width//2, feet-_dee.height))
# register Dee in scenes.spr cache so intro scenes can use put(cv,'dee',...)
_orig_spr = scenes.spr
def _spr(who, facing='down'):
    if who == 'dee':
        global _dee
        if _dee is None: _dee = dee_sprite()
        return _dee
    return _orig_spr(who, facing)
scenes.spr = _spr

if __name__ == '__main__':
    out = os.environ.get('SEC_OUT', os.path.join(HERE, 'out')); os.makedirs(out, exist_ok=True)
    cv = lobby(); cv.save(f'{out}/security.png'); cv.save(f'{out}/security-3x.png', 3)
    cv = lobby(route=False, chars=False, dyn=False); cv.save(f'{out}/security-shell.png')
    print(cv.w, cv.h)
