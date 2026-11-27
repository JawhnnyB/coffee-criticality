"""Six gift toys from Mabel's prize shelf (src/game/parlorPrizes.ts), 24x24 native each.

Same hand as the rooms: 1px #3b2318 outline round every object, flat 3-tone shading lit from top-left, flat ground
shadow, no dither. Writes public/art/ui/toys/toy-<npc>.png (what the shelf and the gift scene show) and, for the art
check, toy-<npc>.png and toys-sheet.png into UI_OUT.

    python3 tools/artkit/toys.py            # UI_OUT=./out/ui by default
"""
import os, sys
REPO = os.environ.get('CC_REPO', os.getcwd())
sys.path.insert(0, f'{REPO}/tools/roomkit')
from kit import Cv, hx, OL, lit, drk
from PIL import Image

OUT = os.environ.get('UI_OUT', './out/ui')
GAME = os.environ.get('TOYS_GAME', f'{REPO}/public/art/ui/toys')
N = 24

INK = hx('#2b1d18'); CREAM = hx('#f4ecd8'); RED = hx('#c04a38')
TIN = hx('#a8b4bc'); BRASS = hx('#e0b030'); BRASS_L = hx('#f4d060'); BRASS_D = hx('#b88a20')

def ramp(c, a=.34, b=.3):
    c = hx(c) if isinstance(c, str) else c
    return lit(c, a), c, drk(c, b)

def outline(im):
    """1px outline on every transparent pixel that touches the object (4-neighbour)."""
    src = im.copy(); s = src.load(); d = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if s[x, y][3]: continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                xx, yy = x+dx, y+dy
                if 0 <= xx < im.width and 0 <= yy < im.height and s[xx, yy][3] and s[xx, yy][:3] != OL:
                    d[x, y] = OL + (255,); break
    return im

def finish(obj, shadow, after=None):
    """Outline the object, then set it on a flat ground shadow (cx, cy, rw, rh). Wire, string and rod go on after
    the outline (`after`), as single dark lines, the way the rooms draw them."""
    outline(obj.im)
    if after: after(obj)
    cv = Cv(N, N)
    cx, cy, rw, rh = shadow
    cv.ellipse_shadow(cx, cy, rw, rh, .3)
    cv.im.alpha_composite(obj.im)
    return cv

def kettle():
    """Mabel: wind-up tin kettle that whistles; a little dent in the lid."""
    o = Cv(N, N); L, M, D = ramp(TIN)
    o.r(6, 10, 12, 10, M); o.r(5, 12, 14, 7, M); o.r(7, 20, 10, 1, M)          # body
    o.r(6, 10, 3, 9, L); o.r(5, 12, 1, 6, L); o.r(15, 12, 4, 7, D); o.r(8, 19, 9, 2, D)
    o.r(8, 8, 8, 2, M); o.r(8, 8, 3, 1, L); o.r(13, 9, 3, 1, D)                  # lid
    o.px(12, 8, D); o.px(12, 9, OL)                                              # the dent
    o.r(11, 6, 2, 2, RED); o.px(11, 6, lit(RED, .3))                             # knob
    for i, (x, y) in enumerate(((19, 14), (20, 13), (21, 12), (21, 11), (22, 10))):
        o.r(x, y, 1, 2, D if i < 2 else M)                                        # spout
    o.r(21, 9, 2, 1, BRASS)                                                      # whistle cap
    o.r(2, 14, 3, 1, BRASS); o.r(1, 13, 1, 3, BRASS_L); o.r(3, 12, 1, 5, BRASS_D)  # wind-up key
    o.r(4, 15, 1, 1, BRASS_D)
    o.r(8, 15, 7, 1, RED); o.r(8, 15, 2, 1, lit(RED, .3))                        # painted band
    def wire(o):                                                                 # wire handle over the lid
        for x, y in ((7, 8), (7, 7), (7, 6), (7, 5), (8, 4), (9, 3), (10, 3), (11, 3), (12, 3), (13, 3), (14, 3), (15, 4), (16, 5), (16, 6), (16, 7), (16, 8)):
            o.px(x, y, INK)
        o.px(9, 3, drk(TIN, .1)); o.px(10, 3, lit(TIN, .2))
    return finish(o, (12, 21, 8, 2), wire)

def pin():
    """Jordan: wooden bowling pin, hand-painted LANE 2. It leans slightly left."""
    o = Cv(N, N); L, M, D = ramp('#ecd2a0', .4, .26)
    # (row, x0, width): head, neck, belly, foot; each row shifts right as it goes down = a lean to the left.
    rows = [(2, 11, 3), (3, 10, 5), (4, 10, 5), (5, 10, 5), (6, 11, 3), (7, 11, 3), (8, 11, 4), (9, 11, 5),
            (10, 11, 6), (11, 11, 7), (12, 11, 7), (13, 11, 8), (14, 11, 8), (15, 12, 7), (16, 12, 7), (17, 12, 7),
            (18, 13, 6), (19, 13, 5), (20, 14, 4)]
    for y, x0, w in rows:
        o.r(x0, y, w, 1, M); o.px(x0, y, L)
        if w > 3: o.px(x0+1, y, L)
        o.px(x0+w-1, y, D)
        if w > 5: o.px(x0+w-2, y, D)
    o.px(11, 3, lit(M, .5))                                                       # shine on the head
    o.r(11, 6, 3, 1, RED); o.r(11, 8, 4, 1, RED)                                  # neck stripes
    o.px(11, 6, lit(RED, .3)); o.px(11, 8, lit(RED, .3))
    for x, y in ((13, 12), (14, 12), (15, 12), (15, 13), (14, 14), (13, 15), (13, 16), (14, 16), (15, 16)):
        o.px(x, y, INK)                                                          # a hand-painted "2"
    return finish(o, (14, 21, 6, 2))

def camper():
    """Elena: die-cast camper van, fishing rod on the roof, a child seat the size of a thumbnail."""
    o = Cv(N, N); L, M, D = ramp('#f3e6d0', .3, .2); S = hx('#d8a63a')
    o.r(2, 9, 20, 9, M); o.r(3, 8, 15, 1, M)                                      # body, raised roof
    o.r(2, 9, 20, 1, L); o.r(3, 8, 15, 1, L); o.r(2, 17, 20, 1, D); o.r(21, 10, 1, 7, D)
    o.r(18, 9, 4, 3, M); o.r(21, 9, 1, 1, (0, 0, 0, 0)); o.px(21, 9, (0, 0, 0, 0))  # sloped nose
    o.r(2, 14, 20, 2, S); o.r(2, 14, 20, 1, lit(S, .3))                           # Elena's ochre stripe
    G = hx('#8ac8d8')
    o.r(4, 10, 4, 3, G); o.r(9, 10, 4, 3, G); o.r(17, 10, 3, 3, G)               # windows
    o.px(4, 10, lit(G, .5)); o.px(9, 10, lit(G, .5)); o.px(17, 10, lit(G, .5))
    o.r(5, 11, 2, 2, hx('#4a86c8')); o.px(5, 11, hx('#7aa8dc'))                   # the child seat, rear window
    o.r(14, 10, 2, 6, D); o.px(15, 13, INK)                                       # door and handle
    for x in (5, 17):                                                             # wheels
        o.r(x-2, 17, 5, 3, INK); o.r(x-1, 18, 3, 1, hx('#7a828e')); o.px(x, 18, hx('#c8ccd0'))
    def rod(o):                                                                  # rod on the roof rack, float off the front
        Rod = hx('#6a4030')
        o.px(5, 6, hx('#7a828e')); o.px(14, 6, hx('#7a828e'))
        o.r(3, 5, 16, 1, Rod); o.px(19, 4, Rod); o.px(20, 3, Rod)
        o.px(21, 4, INK); o.px(21, 5, INK); o.px(21, 6, RED); o.px(22, 6, CREAM)
    return finish(o, (12, 20, 10, 2), rod)

def padlock():
    """Tommy: brass toy padlock with a key that really works, and a tag that says MINE."""
    o = Cv(N, N); St = hx('#c8ccd0')
    for x, y in ((8, 9), (8, 8), (8, 7), (8, 6), (9, 5), (10, 4), (11, 4), (12, 4), (13, 4), (14, 5), (15, 6), (15, 7), (15, 8), (15, 9)):
        o.r(x, y, 1, 1, St)                                                      # shackle
    o.px(9, 6, lit(St, .4)); o.px(10, 5, lit(St, .4)); o.px(14, 6, drk(St, .25)); o.px(14, 7, drk(St, .25))
    o.r(9, 6, 1, 4, St); o.r(14, 6, 1, 4, drk(St, .2))
    o.r(6, 10, 12, 10, BRASS); o.r(6, 10, 12, 1, BRASS_L); o.r(6, 10, 1, 10, BRASS_L)  # body
    o.r(7, 19, 11, 1, BRASS_D); o.r(17, 11, 1, 9, BRASS_D)
    o.r(8, 12, 2, 1, BRASS_L)                                                     # glint
    o.r(11, 13, 2, 2, INK); o.px(11, 15, INK)                                     # keyhole
    o.r(11, 16, 1, 4, BRASS_D); o.r(10, 20, 3, 2, BRASS); o.px(10, 20, BRASS_L)   # key hanging out
    o.r(19, 16, 4, 5, CREAM); o.r(19, 16, 4, 2, RED); o.px(19, 16, lit(RED, .3))  # MINE tag
    o.r(20, 18, 2, 1, hx('#8a7a6a')); o.r(20, 19, 1, 1, hx('#8a7a6a'))
    def string(o): o.px(18, 13, INK); o.px(19, 14, INK)
    return finish(o, (12, 21, 7, 2), string)

def gauge():
    """Marcus: tin pressure gauge, needle set by hand. It comes set to forty."""
    o = Cv(N, N); L, M, D = ramp(TIN)
    o.d.ellipse([3, 1, 20, 18], fill=M + (255,))                                  # bezel
    o.d.ellipse([3, 1, 19, 17], fill=L + (255,))
    o.d.ellipse([4, 2, 20, 18], fill=M + (255,))
    o.d.ellipse([5, 3, 18, 16], fill=CREAM + (255,))                               # face
    for x, y in ((7, 12), (6, 9), (7, 6), (9, 4), (12, 4), (14, 4), (16, 6), (17, 9), (16, 12)):
        o.px(x, y, hx('#8a7a6a'))                                                 # ticks round the dial
    o.px(16, 12, RED); o.px(17, 9, RED)                                           # red zone
    for x, y in ((11, 10), (10, 9), (9, 8), (8, 7)):                              # needle to forty
        o.px(x, y, RED)
    o.px(11, 10, INK); o.px(12, 10, INK)                                          # pivot
    # "40", hand-lettered
    o.r(9, 13, 1, 2, INK); o.r(9, 14, 2, 1, INK); o.r(11, 13, 1, 3, INK)          # 4
    o.r(13, 13, 2, 1, INK); o.r(13, 15, 2, 1, INK); o.r(13, 14, 1, 1, INK); o.r(15, 13, 1, 3, INK); o.r(13, 13, 1, 3, INK)  # 0
    o.r(10, 19, 4, 2, D); o.r(10, 19, 4, 1, M)                                    # stem
    o.r(9, 21, 6, 1, BRASS); o.r(9, 21, 2, 1, BRASS_L)                            # fitting
    o.r(19, 8, 3, 3, BRASS); o.px(19, 8, BRASS_L); o.px(21, 10, BRASS_D)          # the set-by-hand knob
    return finish(o, (12, 22, 7, 2))

def boots():
    """Priya: rubber work boots small enough to stand on a monitor. Soles scuffed on purpose."""
    o = Cv(N, N); L, M, D = ramp('#488038', .3, .3); Sole = hx('#3a2e28'); Scuff = hx('#b8a890')
    def boot(x, y, front):
        o.r(x, y, 6, 10, M); o.r(x, y, 2, 10, L if front else M); o.r(x+5, y, 1, 10, D)   # shaft
        o.r(x, y, 6, 1, lit(M, .45))                                              # rolled top
        o.r(x, y+10, 10, 3, M); o.r(x, y+10, 2, 3, L if front else M); o.r(x+6, y+10, 4, 1, lit(M, .2))
        o.r(x+9, y+11, 1, 2, D)                                                   # toe
        o.r(x, y+13, 10, 2, Sole); o.r(x+1, y+14, 2, 1, Scuff); o.r(x+6, y+13, 2, 1, Scuff)  # scuffed sole
        o.px(x+8, y+10, Scuff)                                                    # scuff on the toe
        o.r(x+1, y+3, 4, 1, hx('#e0b030'))                                        # pull tab band
    boot(9, 3, False)                                                              # the one behind
    boot(3, 6, True)
    return finish(o, (11, 21, 9, 2))

TOYS = [('mabel', kettle), ('jordan', pin), ('elena', camper), ('tommy', padlock), ('marcus', gauge), ('priya', boots)]

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True); os.makedirs(GAME, exist_ok=True)
    sheet = Cv(len(TOYS)*(N+4)+4, N+8, hx('#f3e6d0') + (255,))
    for i, (who, f) in enumerate(TOYS):
        cv = f()
        cv.save(f'{OUT}/toy-{who}.png'); cv.save(f'{GAME}/toy-{who}.png')
        sheet.im.alpha_composite(cv.im, (4+i*(N+4), 4))
    sheet.save(f'{OUT}/toys-sheet.png'); sheet.save(f'{OUT}/toys-sheet-6x.png', 6)
    print('wrote', len(TOYS), 'toys')
