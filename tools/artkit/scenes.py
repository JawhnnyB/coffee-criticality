"""Eight intro tableaux, 320x180 native. Real room art (no characters) + the in-game A6 sprites + a few story props."""
import os, sys
REPO = os.environ.get('CC_REPO', os.getcwd())
os.environ.setdefault('CONTENT_TS', f'{REPO}/src/game/content.ts')
os.environ.setdefault('ROOMS_OUT', './out/rooms')
sys.path.insert(0, f'{REPO}/tools/roomkit')
from kit import *
import render_rooms as rr
from PIL import Image
SPR = os.environ.get('CC_SPRITES', f'{REPO}/public/art/gen/sprites')
OUT = os.environ.get('UI_OUT', './out/ui')
os.makedirs(OUT, exist_ok=True)

_cache = {}
def spr(who, facing='down'):
    k = (who, facing)
    if k in _cache: return _cache[k]
    if facing == 'down': im = Image.open(f'{SPR}/{who}_idle_32.png').convert('RGBA')
    elif facing == 'sit': im = Image.open(f'{SPR}/{who}_sit.png').convert('RGBA')
    else:
        sh = Image.open(f'{SPR}/{who}_walk4.png').convert('RGBA')
        row = 2 if facing == 'up' else 1
        im = sh.crop((0, row*64, 32, row*64+64))
        if facing == 'left': im = im.transpose(Image.FLIP_LEFT_RIGHT)
    if who == 'player':   # default look = copper hoodie (artSpec DEFAULT_PLAYER_LOOK)
        px_ = im.load()
        for yy in range(im.height):
            for xx in range(im.width):
                r, g, b, a = px_[xx, yy]
                if a and g > r + 20 and g > b + 20:           # green hoodie -> copper ramp by brightness
                    lum = g
                    px_[xx, yy] = ((0xe8, 0xa8, 0x60) if lum > 0x90 else (0xc4, 0x78, 0x3a) if lum > 0x60 else (0x8a, 0x48, 0x20)) + (a,)
    bb = im.getbbox(); im = im.crop(bb); _cache[k] = im; return im
def put(cv, who, facing, cx, feet):
    im = spr(who, facing)
    cv.ellipse_shadow(cx, feet-1, 6, 2, .32)
    cv.im.alpha_composite(im, (cx - im.width//2, feet - im.height))
def crop(cv, x, y, w=320, h=180, fill='#3b2318'):
    out = Cv(w, h, hx(fill)+(255,))
    out.im.alpha_composite(cv.im.crop((x, y, x+w, y+h)) if x >= 0 and y >= 0 else cv.im.crop((x, y, x+w, y+h)), (0, 0))
    return out

def padlock(cv, x, y):
    cv.r(x+1, y, 4, 1, OL); cv.r(x, y+1, 1, 3, OL); cv.r(x+5, y+1, 1, 3, OL)           # shackle
    cv.r(x-1, y+3, 8, 6, OL); cv.r(x, y+4, 6, 4, hx('#e0b030')); cv.r(x, y+4, 6, 1, hx('#f4d060')); cv.px(x+3, y+6, OL)
def tag(cv, x, y):
    cv.r(x+2, y-6, 1, 6, OL)                                                              # string
    cv.r(x-1, y, 9, 12, OL); cv.r(x, y+1, 7, 10, hx('#f4ecd8')); cv.r(x, y+1, 7, 3, hx('#c04a38'))
    cv.r(x+1, y+6, 5, 1, hx('#8a7a6a')); cv.r(x+1, y+8, 4, 1, hx('#8a7a6a'))
def gauge(cv, x, y, ang):
    import math
    cv.d.ellipse([x-6, y-6, x+6, y+6], fill=OL); cv.d.ellipse([x-5, y-5, x+5, y+5], fill=hx('#f4ecd8'))
    cv.r(x-3, y+2, 7, 1, hx('#8a7a6a'))
    cv.d.line([(x, y), (x+int(math.cos(ang)*4), y+int(math.sin(ang)*4))], fill=hx('#a82a3a'))
    cv.r(x-2, y+6, 5, 3, OL); cv.r(x-1, y+6, 3, 2, hx('#7a828e'))
def seat(cv, x, y):    # child seat on the asphalt
    cv.shadow_rect(x-2, y+10, 18, 3, .3) if hasattr(cv, 'shadow_rect') else None
    cv.r(x, y+2, 14, 10, OL); cv.r(x+1, y+3, 12, 8, hx('#4a86c8')); cv.r(x+1, y+3, 12, 2, hx('#7aa8dc'))
    cv.r(x+2, y-3, 10, 6, OL); cv.r(x+3, y-2, 8, 5, hx('#4a86c8')); cv.r(x+3, y-2, 8, 1, hx('#7aa8dc'))
    cv.r(x+4, y+4, 1, 5, hx('#e8d070')); cv.r(x+9, y+4, 1, 5, hx('#e8d070')); cv.r(x+6, y+8, 3, 2, hx('#f4ecd8'))
def cup(cv, x, y):
    cv.r(x, y, 7, 6, OL); cv.r(x+1, y+1, 5, 4, hx('#f4ecd8')); cv.r(x+7, y+1, 2, 3, OL); cv.px(x+8, y+2, hx('#f4ecd8'))
    cv.r(x+1, y+1, 5, 1, hx('#7a4a2a'))
    cv.px(x+2, y-3, hx('#f4ecd8')); cv.px(x+3, y-4, hx('#f4ecd8')); cv.px(x+4, y-6, hx('#f4ecd8'))
def sheet(cv, x, y):   # clipboard / sheet in hand
    cv.r(x, y, 7, 9, OL); cv.r(x+1, y+1, 5, 7, hx('#f4ecd8')); cv.r(x+2, y+3, 3, 1, hx('#8a7a6a')); cv.r(x+2, y+5, 3, 1, hx('#8a7a6a')); cv.r(x+2, y-1, 3, 2, OL)
def hooks(cv, x, y):
    cv.r(x, y, 56, 16, OL); cv.r(x+1, y+1, 54, 14, hx('#8a5a38')); cv.r(x+1, y+1, 54, 2, hx('#a8703a'))
    for i, c in enumerate(('#7a828e', '#a8764a', None)):
        hx_ = x+8+i*18
        cv.r(hx_, y+3, 2, 3, OL); cv.px(hx_, y+3, hx('#d8c8a0'))
        if c:
            cv.r(hx_-4, y+6, 10, 14, OL); cv.r(hx_-3, y+7, 8, 12, hx(c)); cv.r(hx_-3, y+7, 8, 2, lit(hx(c), .18) if False else mix(c, '#ffffff', .25))
        else:
            cv.r(hx_-4, y+17, 10, 5, OL); cv.r(hx_-3, y+18, 8, 3, hx('#f4ecd8'))     # name tag under the empty hook

def scene_core():
    cv = rr.render_room('reactor', chars=False, border_on=False)
    put(cv, 'priya', 'right', 148, 178); sheet(cv, 158, 150)
    put(cv, 'player', 'left', 230, 180)
    return crop(cv, 16, 44)
def scene_cafe():
    cv = rr.render_room('cafe', chars=False, border_on=False)
    put(cv, 'mabel', 'sit', 154, 184); cup(cv, 172, 99)
    put(cv, 'player', 'right', 122, 176)
    return crop(cv, 0, 36)
def scene_lot():
    import lot
    os.environ['LOT_CHARS'] = '0'
    cv = lot.draw_all(objects=True, border_on=False)
    seat(cv, 356, 262)
    put(cv, 'elena', 'left', 392, 286)
    put(cv, 'player', 'right', 330, 296)
    return crop(cv, 214, 196)
def scene_wing():
    cv = rr.render_room('maintenance', chars=False, border_on=False)
    padlock(cv, 128, 140); tag(cv, 120, 150)
    put(cv, 'tommy', 'left', 168, 174)
    put(cv, 'player', 'right', 88, 156)
    return crop(cv, 16, 64)
def scene_bench():
    cv = rr.render_room('engineering', chars=False, border_on=False)
    gauge(cv, 216, 92, -1.2); gauge(cv, 246, 92, -0.4)
    put(cv, 'marcus', 'down', 232, 166)
    put(cv, 'player', 'right', 180, 170)
    return crop(cv, 30, 56)
def scene_break():
    cv = rr.render_room('breakroom', chars=False, border_on=False)
    put(cv, 'jordan', 'left', 98, 170)
    put(cv, 'player', 'left', 140, 178)
    return crop(cv, -16, 52)
def scene_control():
    cv = rr.render_room('control', chars=False, border_on=False)
    import random
    rg = random.Random(4)
    for r in range(3):
        for c in range(8):
            col = '#7ac870' if rg.random() > .08 else '#e8d070'
            cv.r(74+c*8, 90+r*8, 4, 4, hx(col)); 
    put(cv, 'holt', 'down', 182, 176)
    put(cv, 'player', 'up', 150, 196)
    return crop(cv, 16, 56)
def scene_threshold():
    cv = rr.render_room('corridor', chars=False, border_on=False)
    hooks(cv, 98, 22)
    put(cv, 'player', 'up', 186, 78)
    return crop(cv, 32, 0)
SCENES = [('core', scene_core), ('cafe', scene_cafe), ('lot', scene_lot), ('wing', scene_wing), ('bench', scene_bench), ('break', scene_break), ('control', scene_control), ('threshold', scene_threshold)]
if __name__ == '__main__':
    want = sys.argv[1:] or [n for n, _ in SCENES]
    for n, f in SCENES:
        if n not in want: continue
        cv = f()
        if cv is None: print('skip', n); continue
        cv.save(f'{OUT}/scene-{n}.png'); cv.save(f'{OUT}/scene-{n}-3x.png', 3); print('ok', n, cv.w, cv.h)
