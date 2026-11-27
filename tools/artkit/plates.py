"""Campaign plates, 320x180 native, for the ending card (GameApp's VerdictBlock, campaign.ts verdictCard).

Same recipe as the intro tableaux (scenes.py): the real room art with no characters, the in-game cast, a few props.
    standdown    Holt in the break room with Mabel's urn, the stand-down notice on the wall, the whole crew facing him
    regroup      Colt's version: no notice, and he's bought the coffee
    transfer     Friday evening in the car park: Mabel walks you to your car
    finale       the reactor hall, one last time this rotation: Holt, you and Priya at the rail
    finale-colt  the same at Colt's plant

    python3 tools/artkit/plates.py      # writes UI_OUT/plate-*.png and PLATES_GAME/plate-*.png (public/art/plates)
"""
import os, sys
REPO = os.environ.get('CC_REPO', os.getcwd())
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scenes
from scenes import put, crop, cup, sheet, rr, OUT
from kit import hx, OL, Cv

GAME = os.environ.get('PLATES_GAME', f'{REPO}/public/art/plates')

def notice(cv, x, y):
    """The stand-down notice: a sheet with a red header, pinned."""
    cv.r(x, y, 16, 20, OL); cv.r(x+1, y+1, 14, 18, hx('#f4ecd8')); cv.r(x+1, y+1, 14, 5, hx('#c04a38'))
    cv.r(x+3, y+3, 10, 1, hx('#f4ecd8'))
    for i in range(4): cv.r(x+3, y+8+i*3, 10 - (i % 2) * 3, 1, hx('#8a7a6a'))
    cv.px(x+7, y, hx('#e0b030')); cv.px(x+8, y, hx('#e0b030'))

def crew_room(boss):
    cv = rr.render_room('breakroom', chars=False, border_on=False)
    if boss == 'holt':
        notice(cv, 58, 10)
    else:
        for x in (98, 131, 139): cup(cv, x, 97)                  # Colt bought the coffee
    put(cv, boss, 'down', 120, 142)                              # in front of the counter and the urn, no slides
    # The crew in an arc, backs to us, facing the chair. Clear of the vending machine and the armchair.
    for who, x, feet in (('mabel', 86, 166), ('jordan', 214, 164), ('tommy', 104, 174), ('elena', 194, 172),
                         ('marcus', 140, 179), ('priya', 176, 177), ('player', 122, 179)):
        put(cv, who, 'up', x, feet)
    return crop(cv, -16, 0)

def car(cv, x, y, body='#c4783a'):
    """A small hatchback, side on, the same angle as Elena's van."""
    b = hx(body)
    cv.r(x, y+4, 34, 11, OL); cv.r(x+6, y, 20, 5, OL)
    cv.r(x+1, y+5, 32, 9, b); cv.r(x+7, y+1, 18, 4, b); cv.r(x+1, y+5, 32, 1, tuple(min(255, c + 40) for c in b))
    cv.r(x+8, y+2, 7, 3, hx('#8ac8d8')); cv.r(x+16, y+2, 8, 3, hx('#8ac8d8'))
    cv.r(x+1, y+10, 32, 1, tuple(max(0, c - 50) for c in b))
    for wx in (x+5, x+24):
        cv.r(wx, y+12, 6, 5, OL); cv.r(wx+1, y+13, 4, 3, hx('#7a828e')); cv.px(wx+2, y+14, hx('#c8ccd0'))
    cv.r(x+31, y+7, 2, 2, hx('#f4d060'))                         # headlamp

def transfer():
    import lot
    os.environ['LOT_CHARS'] = '0'
    cv = lot.draw_all(objects=True, border_on=False)
    car(cv, 470, 262)
    put(cv, 'mabel', 'right', 420, 292)
    put(cv, 'player', 'right', 440, 298)
    out = crop(cv, 236, 172)
    # Friday evening: one flat dusk wash, then the lamps lit on top of it.
    out.blend(0, 0, out.w, out.h, hx('#5a4a58'), .42)
    for lx, ly in ((91, 21), ((583 - 236), 21)):
        if 0 <= lx < out.w:
            ov = Cv(out.w, out.h)
            ov.d.ellipse([lx - 22, ly + 44, lx + 24, ly + 60], fill=hx('#f4d060') + (46,))
            out.im.alpha_composite(ov.im)
            out.r(lx - 2, ly, 6, 3, hx('#fff4c0'))
    return out

def finale(boss):
    cv = rr.render_room('reactor', chars=False, border_on=False)
    for who, x in ((boss, 166), ('player', 190), ('priya', 214)):
        put(cv, who, 'up', x, 182)
    sheet(cv, 222, 160)
    return crop(cv, 24, 30)

PLATES = [('standdown', lambda: crew_room('holt')), ('regroup', lambda: crew_room('colt')), ('transfer', transfer),
          ('finale', lambda: finale('holt')), ('finale-colt', lambda: finale('colt'))]

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True); os.makedirs(GAME, exist_ok=True)
    want = sys.argv[1:] or [n for n, _ in PLATES]
    for n, f in PLATES:
        if n not in want: continue
        cv = f()
        cv.save(f'{OUT}/plate-{n}.png'); cv.save(f'{OUT}/plate-{n}-3x.png', 3); cv.save(f'{GAME}/plate-{n}.png')
        print('ok', n, cv.w, cv.h)
