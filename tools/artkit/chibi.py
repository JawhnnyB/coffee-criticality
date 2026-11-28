"""The cast as chibi walkers: big heads, real faces, a shape you can name from across the room.

Writes, for each person, the walk sheet the game draws (public/art/gen/sprites/<who>_walk4.png: 128x192, four
frames by three rows: front, side facing right, back; each cell 32x64, feet on the bottom rows) plus the idle
frame and a seated pose the intro and plates bake from (<who>_idle_32.png, <who>_sit.png).

House style (tools/artkit/STYLE-STANDARD.md): native pixels, one ink outline #3b2318 round every figure, light from
the top-left, warm highlights and cool shadows, no dither. Heads and hair are drawn by hand as pixel grids, because
that's where the personality is; bodies are built from parts so the walk cycle stays even across the cast.

The player's sheet keeps the exact key colours src/game/pixel.ts tintA6 swaps for the hoodie and hair picker, and
the glasses are ink pixels on the eye rows beside the eyes, which is what tintA6 clears when glasses are off.

    python3 tools/artkit/chibi.py            # writes into public/art/gen/sprites (CAST_OUT to change)
"""
import os, sys
from PIL import Image

REPO = os.environ.get('CC_REPO', os.getcwd())
OUT = os.environ.get('CAST_OUT', f'{REPO}/public/art/gen/sprites')
UI_OUT = os.environ.get('UI_OUT')            # when set (art check), a contact sheet goes here too

W, H = 32, 64
X0 = 7                                        # hand grids are 18 wide: cols 7..24
OL = '#3b2318'

def hx(s):
    s = s.lstrip('#'); return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))
def to_hex(c): return '#%02x%02x%02x' % c
def mix(a, b, t):
    a, b = hx(a), hx(b); return to_hex(tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(3)))
def lit(c, t=.32): return mix(c, '#fff0c8', t)          # warm light
def shd(c, t=.3): return mix(c, '#3a2850', t)           # cool shadow

# --- grid symbols -------------------------------------------------------------------------------------------------
SYM = {
    's': 'skin', 'S': 'skinS', 'h': 'hair', 'H': 'hairS', 'L': 'hairL', 'D': 'hairD',
    'e': 'eye', 'w': 'eyeW', 'b': 'blush', 'm': 'mouth', 'r': 'brow', 't': 'teeth',
    'c': 'top', 'C': 'topS', 'k': 'topL', 'p': 'pants', 'P': 'pantsS', 'f': 'shoe', 'F': 'shoeL',
    '1': 'a1', '!': 'a1S', 'i': 'a1L', '2': 'a2', '@': 'a2S', 'j': 'a2L', '3': 'a3', 'o': 'ink', 'g': 'glass',
}

class Fig:
    def __init__(s): s.px = {}
    def put(s, x, y, role):
        if 0 <= x < W and 0 <= y < H:
            if role is None: s.px.pop((x, y), None)
            else: s.px[(x, y)] = role
    def rect(s, x, y, w, h, role):
        for yy in range(y, y + h):
            for xx in range(x, x + w): s.put(xx, yy, role)
    def grid(s, y0, rows, x0=X0, only_on=None):
        for dy, row in enumerate(rows):
            for dx, ch in enumerate(row):
                if ch == '.': continue
                x, y = x0 + dx, y0 + dy
                if ch == '_': s.put(x, y, None); continue
                if only_on and (x, y) not in s.px: continue
                s.put(x, y, SYM[ch])
    def shift(s, dx, dy, pred):
        moved = {}
        for (x, y), r in list(s.px.items()):
            if pred(x, y, r):
                del s.px[(x, y)]
                moved[(x + dx, y + dy)] = r
        s.px.update(moved)

def render(fig, pal, outline=True):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    p = im.load()
    for (x, y), r in fig.px.items():
        c = pal.get(r) or pal['ink']
        p[x, y] = hx(c) + (255,)
    if outline:
        src = im.copy(); q = src.load()
        for y in range(H):
            for x in range(W):
                if q[x, y][3]: continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < W and 0 <= yy < H and q[xx, yy][3]:
                        p[x, y] = hx(OL) + (255,); break
    return im

# --- head shapes ---------------------------------------------------------------------------------------------------
FRONT_SPANS = {31: (10, 21), 32: (9, 22), 43: (10, 21), 42: (9, 22)}
SIDE_SPANS = {31: (11, 20), 32: (10, 21), 42: (10, 22), 43: (12, 21)}

def head_front(f):
    for y in range(31, 44):
        a, b = FRONT_SPANS.get(y, (8, 23))
        for x in range(a, b + 1): f.put(x, y, 'skinS' if x >= b - 1 and y > 33 else 'skin')
    f.rect(7, 37, 1, 2, 'skin'); f.rect(24, 37, 1, 2, 'skinS')            # ears
    f.rect(10, 43, 12, 1, 'skinS')                                        # under the chin

def head_side(f):
    for y in range(31, 44):
        a, b = SIDE_SPANS.get(y, (9, 22))
        for x in range(a, b + 1): f.put(x, y, 'skin')
    f.put(23, 38, 'skin'); f.put(23, 39, 'skinS')                         # nose
    f.rect(13, 37, 2, 2, 'skinS'); f.put(13, 37, 'skin')                  # ear
    f.rect(12, 43, 9, 1, 'skinS')

def head_back(f):
    for y in range(31, 44):
        a, b = FRONT_SPANS.get(y, (8, 23))
        for x in range(a, b + 1): f.put(x, y, 'skin')
    f.rect(7, 37, 1, 2, 'skin'); f.rect(24, 37, 1, 2, 'skinS')

# --- faces ---------------------------------------------------------------------------------------------------------
def eyes_front(f, style):
    if style == 'happy':                                                   # Mabel: smiling, eyes closed
        for x0 in (10, 18):
            f.put(x0, 38, 'eye'); f.put(x0 + 1, 37, 'eye'); f.put(x0 + 2, 37, 'eye'); f.put(x0 + 3, 38, 'eye')
        return
    if style == 'stern':                                                   # Holt: level, narrowed
        for x0 in (11, 19):
            f.rect(x0, 37, 2, 2, 'eye'); f.put(x0, 37, 'eyeW')
        f.rect(10, 35, 4, 1, 'brow'); f.rect(18, 35, 4, 1, 'brow'); f.put(13, 36, 'brow'); f.put(18, 36, 'brow')
        return
    for x0 in (11, 19):
        f.rect(x0, 36, 2, 3, 'eye'); f.put(x0, 36, 'eyeW')
    if style == 'bright':                                                  # lifted brows, wide awake
        f.rect(10, 34, 3, 1, 'brow'); f.rect(19, 34, 3, 1, 'brow')
    if style == 'kind':                                                    # Colt: soft brows, smile lines
        f.rect(10, 35, 3, 1, 'brow'); f.rect(19, 35, 3, 1, 'brow'); f.put(9, 38, 'skinS'); f.put(22, 38, 'skinS')
    if style == 'sly':                                                     # Jordan: one brow up
        f.rect(10, 35, 3, 1, 'brow'); f.rect(19, 34, 3, 1, 'brow')
    if style == 'firm':                                                    # Elena: straight, set brows
        f.rect(10, 35, 4, 1, 'brow'); f.rect(18, 35, 4, 1, 'brow')

def glasses_front(f):
    """Big square frames, like the portrait: a box round each eye with a pale lens between eye and frame, and a
    bridge. Frame and lens are their own key colours (GLASS_FRAME, GLASS_LENS in src/game/pixel.ts), so tintA6 can
    lift them off cleanly when the glasses toggle is off."""
    for x0 in (9, 17):
        f.rect(x0, 35, 6, 1, 'glass'); f.rect(x0, 39, 6, 1, 'glass')
        f.rect(x0, 36, 1, 3, 'glass'); f.rect(x0 + 5, 36, 1, 3, 'glass')
        f.rect(x0 + 1, 36, 4, 3, 'lens')
    f.rect(15, 36, 2, 1, 'glass')

def glasses_side(f):
    f.rect(17, 35, 6, 1, 'glass'); f.rect(17, 39, 6, 1, 'glass'); f.rect(17, 36, 1, 3, 'glass'); f.rect(22, 36, 1, 3, 'glass')
    f.rect(18, 36, 4, 3, 'lens')
    f.rect(15, 36, 2, 1, 'glass')                                          # the arm, back to the ear

def mouth_front(f, style):
    if style == 'smile':  f.put(14, 40, 'mouth'); f.rect(15, 41, 2, 1, 'mouth'); f.put(17, 40, 'mouth')
    elif style == 'grin': f.rect(14, 40, 4, 1, 'mouth'); f.rect(15, 40, 2, 1, 'teeth'); f.rect(15, 41, 2, 1, 'mouth')
    elif style == 'flat': f.rect(14, 41, 4, 1, 'mouth')
    elif style == 'smirk': f.rect(15, 41, 2, 1, 'mouth'); f.put(17, 40, 'mouth')
    else:                 f.rect(15, 41, 2, 1, 'mouth')
    f.put(9, 39, 'blush'); f.put(10, 39, 'blush'); f.put(21, 39, 'blush'); f.put(22, 39, 'blush')

def face_side(f, style, mouth):
    if style == 'happy':
        f.put(18, 38, 'eye'); f.put(19, 37, 'eye'); f.put(20, 38, 'eye')
    elif style == 'stern':
        f.rect(19, 37, 2, 2, 'eye'); f.put(19, 37, 'eyeW'); f.rect(18, 35, 4, 1, 'brow')
    else:
        f.rect(19, 36, 2, 3, 'eye'); f.put(19, 36, 'eyeW')
        if style in ('kind', 'firm', 'bright', 'sly'): f.rect(18, 35 if style != 'bright' else 34, 3, 1, 'brow')
    f.put(19, 40, 'blush'); f.put(20, 40, 'blush')
    if mouth == 'flat': f.rect(20, 41, 3, 1, 'mouth')
    elif mouth in ('grin', 'smile'): f.rect(21, 41, 2, 1, 'mouth'); f.put(20, 40, 'mouth') if mouth == 'grin' else None
    else: f.rect(21, 41, 2, 1, 'mouth')

# --- bodies --------------------------------------------------------------------------------------------------------
ARM = [0, 1, 0, -1]

def body_front(f, frame, wide=False, back=False):
    a = 1 if wide else 0
    f.rect(13, 44, 6, 1, 'skinS')                                          # neck
    f.rect(11 - a, 45, 10 + 2 * a, 1, 'top')                               # shoulders
    f.rect(10 - a, 46, 12 + 2 * a, 9, 'top')
    f.rect(10 - a, 46, 1, 8, 'topL'); f.rect(20 + a, 46, 2, 9, 'topS'); f.rect(10 - a, 54, 12 + 2 * a, 1, 'topS')
    sw = ARM[frame]
    l, r = (sw, -sw) if not back else (-sw, sw)
    f.rect(8 - a, 46 + l, 2, 7, 'top'); f.put(8 - a, 46 + l, 'topL'); f.rect(8 - a, 47 + l, 1, 5, 'topL')
    f.rect(8 - a, 53 + l, 2, 2, 'skin')                                    # hands
    f.rect(22 + a, 46 + r, 2, 7, 'topS'); f.rect(22 + a, 53 + r, 2, 2, 'skinS')
    lift_l, lift_r = (1, 0) if frame == 1 else (0, 1) if frame == 3 else (0, 0)
    f.rect(11, 55, 4, 6 - lift_l, 'pants'); f.rect(14, 55, 1, 6 - lift_l, 'pantsS')
    f.rect(17, 55, 4, 6 - lift_r, 'pants'); f.rect(20, 55, 1, 6 - lift_r, 'pantsS')
    f.rect(15, 55, 2, 1, 'pantsS')
    f.rect(10, 61 - lift_l, 5, 2, 'shoe'); f.put(11, 61 - lift_l, 'shoeL')
    f.rect(17, 61 - lift_r, 5, 2, 'shoe'); f.put(18, 61 - lift_r, 'shoeL')

STEP = [0, 2, 0, -2]

def body_side(f, frame, wide=False):
    a = 1 if wide else 0
    f.rect(15, 44, 4, 1, 'skinS')
    f.rect(12 - a, 45, 8 + a, 1, 'top'); f.rect(11 - a, 46, 10 + a, 9, 'top')
    f.rect(11 - a, 46, 1, 9, 'topS'); f.rect(19, 46, 2, 8, 'topL'); f.rect(11 - a, 54, 10 + a, 1, 'topS')
    s = STEP[frame]
    near, far = s, -s
    # far leg behind, darker; near leg in front
    f.rect(14 + far, 55, 4, 6, 'pantsS'); f.rect(14 + far, 61, 5, 2, 'shoe')
    f.rect(14 + near, 55, 4, 6, 'pants'); f.rect(17 + near, 55, 1, 6, 'pantsS')
    f.rect(14 + near, 61, 6, 2, 'shoe'); f.put(18 + near, 61, 'shoeL')
    # the near arm swings opposite the near leg
    sw = -s // 2
    f.rect(15, 46, 3, 5, 'topS'); f.rect(15 + sw, 51, 3, 2, 'topS'); f.put(15, 46, 'top')
    f.rect(15 + sw, 53, 3, 2, 'skin'); f.put(17 + sw, 54, 'skinS')

def body_back(f, frame, wide=False):
    body_front(f, frame, wide, back=True)
    f.rect(13, 44, 6, 1, 'skinS')

def body_sit(f, wide=False):
    body_front(f, 0, wide)
    f.rect(8, 55, 16, 8, None)
    f.rect(10, 55, 12, 1, 'pants'); f.rect(9, 56, 14, 2, 'pants'); f.rect(15, 56, 2, 2, 'pantsS')
    f.rect(10, 56, 3, 1, 'pantsS') if False else None
    f.rect(10, 58, 4, 2, 'pantsS'); f.rect(18, 58, 4, 2, 'pantsS')
    f.rect(9, 60, 5, 1, 'shoe'); f.rect(18, 60, 5, 1, 'shoe')

# --- hair, by hand -------------------------------------------------------------------------------------------------
# Each entry: view -> (top row, rows of 18 chars over cols 7..24). '.' leaves what's under it.
HAIR = {}

HAIR['player'] = {                      # warm brown, short, a side-swept fringe and the one tuft that won't lie down
 'front': (25, [
  ".........Hh.......",
  "........hh........",
  ".....LLhhhhhH.....",
  "...LLhhhhhhhhhH...",
  "..LhhhhhhhhhhhhH..",
  ".LhhhhhhhhhhhhhhH.",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhh....hH",
  "hhhH.hhhh.......hH",
  "hh..............hH",
  "h................H",
 ]),
 'side': (25, [
  "..........Hh......",
  ".........hh.......",
  "......LLhhhhH.....",
  "....LLhhhhhhhhH...",
  "...LhhhhhhhhhhhH..",
  "..LhhhhhhhhhhhhhH.",
  ".hhhhhhhhhhhhhhH..",
  "hhhhhhhhhhhhhhhH..",
  "hhhhhhhhhhhhhhhh..",
  "hhhhhhhh.....hh...",
  "hhhhhhH...........",
  "hhhhhH............",
  "hhhhH.............",
  "hhhH..............",
  ".hH...............",
 ]),
 'back': (25, [
  ".........Hh.......",
  "........hh........",
  ".....LLhhhhhH.....",
  "...LLhhhhhhhhhH...",
  "..LhhhhhhhhhhhhH..",
  ".LhhhhhhhhhhhhhhH.",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhHhhhhhhhhH",
  "hhhhhhhhhhhhHhhhhH",
  "hhhhhHhhhhhhhhhhhH",
 ]),
}

HAIR['mabel'] = {                       # silver, a big round bun, soft waves either side
 'front': (22, [
  ".......LLLL.......",
  "......LhhhhH......",
  ".....LhhhhhhH.....",
  ".....hhhhhhhH.....",
  "......HhhhhH......",
  "....LLhhhhhhhH....",
  "...LhhhhhhhhhhH...",
  "..LhhhhhhhhhhhhH..",
  ".LhhhhhhhhhhhhhhH.",
  ".hhhhhhhhhhhhhhhH.",
  "hhhhhhhhH..hhhhhhH",
  "hhhhhH........hhhH",
  "hhhH...........hhh",
  "hhh.............hh",
  "hh..............hH",
  "Hh..............hH",
  ".H..............H.",
 ]),
 'side': (22, [
  "......LLLL........",
  ".....LhhhhH.......",
  "....LhhhhhhH......",
  "....hhhhhhhH......",
  ".....HhhhhH.......",
  "....LLhhhhhhhH....",
  "...LhhhhhhhhhhH...",
  "..LhhhhhhhhhhhhH..",
  ".LhhhhhhhhhhhhhhH.",
  ".hhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhh",
  "hhhhhhhhh....hhhh.",
  "hhhhhhhH..........",
  "hhhhhhH...........",
  "hhhhhH............",
  "HhhhH.............",
  ".HHH..............",
 ]),
 'back': (22, [
  ".......LLLL.......",
  "......LhhhhH......",
  ".....LhhhhhhH.....",
  ".....hhhhhhhH.....",
  "......HhhhhH......",
  "....LLhhhhhhhH....",
  "...LhhhhhhhhhhH...",
  "..LhhhhhhhhhhhhH..",
  ".LhhhhhhhhhhhhhhH.",
  ".hhhhhhhhhhhhhhhH.",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhHH",
  "HhhhhhhhhhhhhhhhHH",
  ".HHhhhhhhhhhhhHHH.",
  "...HHHHHHHHHHHH...",
 ]),
}

HAIR['holt'] = {                        # sandy, neat side parting, every hair where he left it
 'front': (27, [
  ".....hhhhhhhH.....",
  "...LLLLhhhhhhhH...",
  "..LLhhhhhhhhhhhH..",
  ".LhhhhhhhhhhhhhhH.",
  ".hhhhhhhhhhhhhhhH.",
  "hhhhhLLhhhhhhhhhhH",
  "hhhH.LhhhhhhhhhhhH",
  "hhH.....HhhhhhhhhH",
  "hH...........Hhhhh",
  "h...............hh",
 ]),
 'side': (27, [
  ".....hhhhhhhH.....",
  "...LLLLhhhhhhhH...",
  "..LhhhhhhhhhhhhH..",
  ".LhhhhhhhhhhhhhhH.",
  ".hhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhH.....",
  "hhhhhhH...........",
  "hhhhH.............",
  "hhhH..............",
  ".HH...............",
 ]),
 'back': (27, [
  ".....hhhhhhhH.....",
  "...LLLLhhhhhhhH...",
  "..LLhhhhhhhhhhhH..",
  ".LhhhhhhhhhhhhhhH.",
  ".hhhhhhhhhhhhhhhH.",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "HhhhhhhhhhhhhhhhHH",
  ".HHhhhhhhhhhhhHHH.",
  "...HHHHHHHHHHHH...",
 ]),
}

HAIR['colt'] = {                        # silver, swept back, a short beard
 'front': (27, [
  "......hhhhhH......",
  "....LLLhhhhhhH....",
  "..LLLhhhhhhhhhhH..",
  ".LhhhhhhhhhhhhhhH.",
  ".hhhhhhhhhhhhhhhH.",
  "hhhhhhhhhhhhhhhhhH",
  "hhh.hhhhhhhhhh.hhH",
  "hh..............hh",
  "h................H",
 ]),
 'side': (27, [
  "......hhhhhH......",
  "....LLLhhhhhhH....",
  "..LLhhhhhhhhhhhH..",
  ".LhhhhhhhhhhhhhhH.",
  ".hhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhh..",
  "hhhhhhhhhH........",
  "hhhhhhH...........",
  "hhhhH.............",
  "hhhH..............",
  ".HH...............",
 ]),
 'back': HAIR['holt']['back'],
}

HAIR['elena'] = {                       # brown, high ponytail with a red scrunchie, a loose strand
 'front': (27, [
  "......hhhhhhH.1...",
  "....LhhhhhhhhH!hH.",
  "...LhhhhhhhhhhHhhH",
  "..LhhhhhhhhhhhhH.H",
  ".LhhhhhhhhhhhhhhH.",
  ".hhhhhhhhhhhhhhhH.",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhh.hhhhhhhH",
  "hhhh.h.......hhhhH",
  "hh..h...........hh",
  "h................H",
 ]),
 'side': (26, [
  "..i1..............",
  ".h!1hhhhhH........",
  "hhhhhLhhhhhhhH....",
  "hhH.LhhhhhhhhhhH..",
  "hH.LhhhhhhhhhhhhH.",
  "hH.LhhhhhhhhhhhhH.",
  "hhhhhhhhhhhhhhhhhH",
  "Hhhhhhhhhhhhhhhhhh",
  ".hhhhhhhhhhhh.hhh.",
  ".HhhhhhH..........",
  ".Hhhhh............",
  "..HhH.............",
  "..HH..............",
 ]),
 'back': (26, [
  "........1.........",
  "......L1!1H.......",
  "....LhhhhhhhhH....",
  "...LhhhhhhhhhhH...",
  "..LhhhhhhhhhhhhH..",
  ".LhhhhhhhhhhhhhhH.",
  ".hhhhhhhhhhhhhhhH.",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhHH",
  "HhhhhhhhhhhhhhhhHH",
  ".HHhhhhhhhhhhhHHH.",
  "...HHHHhhhhHHHH...",
  "......Hhhhh.......",
  ".......HhH........",
  ".......HH.........",
 ]),
}

HAIR['tommy'] = {                       # hard hat, always; dark hair out the sides
 'front': (25, [
  "......iii111......",
  "....ii111111!1....",
  "...i11111!11111...",
  "..i111111!111111..",
  "..i111111!11111!..",
  "!111111111111111!!",
  "!!!!!!!!!!!!!!!!!!",
  "hhhhhhhhhhhhhhhhhh",
  "hh.hh.hhhhh.hh.hhh",
  "h...............hh",
  "h................h",
 ]),
 'side': (25, [
  ".....iii111.......",
  "...ii111111!1.....",
  "..i1111111!1111...",
  ".i11111111!11111..",
  ".i11111111!11111!.",
  "!1111111111111111!",
  "!!!!!!!!!!!!!!!!!!!"[:18],
  "hhhhhhhhhhhh......",
  "hhhhhhhH..........",
  "hhhhH.............",
  "hhH...............",
 ]),
 'back': (25, [
  "......iii111......",
  "....ii111111!1....",
  "...i11111!11111...",
  "..i111111!111111..",
  "..i111111!11111!..",
  "!111111111111111!!",
  "!!!!!!!!!!!!!!!!!!",
  "hhhhhhhhhhhhhhhhhh",
  "hhhhhhhhhhhhhhhhhh",
  "hhhhhhhhhhhhhhhhhh",
  "Hhhhhhhhhhhhhhhhhh",
  ".HHhhhhhhhhhhhhHH.",
  "...HHHHHHHHHHHH...",
 ]),
}

HAIR['marcus'] = {                      # copper red, thick and a little wild, full beard
 'front': (26, [
  "....h..hhh..h.....",
  "...hhLhhhhhhhh....",
  "..LhhLhhhhhhhhH...",
  ".LhhhhhhhhhhhhhH..",
  ".LhhhhhhhhhhhhhhH.",
  "LhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhh.hhhhh.hhhhH",
  "hhhh.........hhhhH",
  "hhh...........hhhh",
  "hh..............hh",
  "hh..............hh",
 ]),
 'side': (26, [
  "....h..hhh..h.....",
  "...hhLhhhhhhhh....",
  "..LhhLhhhhhhhhH...",
  ".LhhhhhhhhhhhhhH..",
  ".LhhhhhhhhhhhhhhH.",
  "LhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhh",
  "hhhhhhhhhhhh.hhh..",
  "hhhhhhhH..........",
  "hhhhhH............",
  "hhhhH.............",
  "hhhH..............",
  ".HH...............",
 ]),
 'back': (26, [
  "....h..hhh..h.....",
  "...hhLhhhhhhhh....",
  "..LhhLhhhhhhhhH...",
  ".LhhhhhhhhhhhhhH..",
  ".LhhhhhhhhhhhhhhH.",
  "LhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhHH",
  "HhhhhhhhhhhhhhhhHH",
  ".HHhhhhhhhhhhhHHH.",
  "...HHHHHHHHHHHH...",
 ]),
}

HAIR['priya'] = {                       # near-black, a high top bun, centre parting
 'front': (21, [
  "......LhhhhH......",
  ".....LhhhhhhH.....",
  ".....hhhhhhhH.....",
  "......HhhhhH......",
  "......2j22@2......",
  ".....LhhhhhhH.....",
  "...LLhhhhhhhhhH...",
  "..LhhhhhhhhhhhhH..",
  ".LhhhhhhhhhhhhhhH.",
  ".hhhhhhh..hhhhhhH.",
  "hhhhhhh....hhhhhhH",
  "hhhhhh......hhhhhH",
  "hhhh..........hhhh",
  "hhh............hhh",
  "hh..............hh",
  "hh..............hh",
  "hh..............hh",
  "Hh..............hH",
  ".H..............H.",
 ]),
 'side': (21, [
  ".....LhhhhH.......",
  "....LhhhhhhH......",
  "....hhhhhhhH......",
  ".....HhhhhH.......",
  ".....2j22@........",
  ".....LhhhhhH......",
  "...LLhhhhhhhhH....",
  "..LhhhhhhhhhhhH...",
  ".LhhhhhhhhhhhhhhH.",
  ".hhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhh.",
  "hhhhhhhhhhhh......",
  "hhhhhhhH..........",
  "hhhhhhH...........",
  "hhhhhH............",
  "hhhhhH............",
  "hhhhH.............",
  "HhhH..............",
  ".HH...............",
 ]),
 'back': (21, [
  "......LhhhhH......",
  ".....LhhhhhhH.....",
  ".....hhhhhhhH.....",
  "......HhhhhH......",
  "......2j22@2......",
  ".....LhhhhhhH.....",
  "...LLhhhhhhhhhH...",
  "..LhhhhhhhhhhhhH..",
  ".LhhhhhhhhhhhhhhH.",
  ".hhhhhhhhhhhhhhhH.",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhHH",
  "HhhhhhhhhhhhhhhhHH",
  ".HHhhhhhhhhhhhHHH.",
  "...HHHHHHHHHHHH...",
 ]),
}

HAIR['jordan'] = {                      # dark, spiky, never once combed
 'front': (24, [
  "...h....h...h.....",
  "...hh..hh..hh..h..",
  "..LhhhhhhhhhhhhH..",
  "..LhhhhhhhhhhhhhH.",
  ".hLhhhhhhhhhhhhhH.",
  ".LhhhhhhhhhhhhhhHh",
  ".hhhhhhhhhhhhhhhH.",
  "hhhhhhhhhhhhhhhhhH",
  "hhhh.hhh.hhhh.hhhH",
  "hhh..h.h..hh...hhH",
  "hh..............hh",
  "h................h",
 ]),
 'side': (24, [
  "....h...h...h.....",
  "...hh..hh..hh.h...",
  "..LhhhhhhhhhhhhH..",
  ".LhhhhhhhhhhhhhhHh",
  "hhLhhhhhhhhhhhhhH.",
  ".LhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhh",
  "hhhhhhhhhhhhhhhhh.",
  "hhhhhhh.hhhh.h.h..",
  "hhhhhH............",
  "hhhhH.............",
  "hhhH..............",
  ".HH...............",
 ]),
 'back': (24, [
  "...h....h...h.....",
  "...hh..hh..hh..h..",
  "..LhhhhhhhhhhhhH..",
  "..LhhhhhhhhhhhhhH.",
  ".hLhhhhhhhhhhhhhH.",
  ".LhhhhhhhhhhhhhhHh",
  ".hhhhhhhhhhhhhhhH.",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "hhhhhhhhhhhhhhhhhH",
  "HhhhhhhhhhhhhhhhHH",
  ".HHhhhhhhhhhhhHHH.",
  "...HHHHHHHHHHHH...",
 ]),
}

# --- outfits: details over the plain body --------------------------------------------------------------------------
def outfit(f, who, view, frame):
    if who == 'mabel':                       # terracotta cardigan, cream apron, long skirt
        if view in ('front', 'sit'):
            f.rect(12, 47, 8, 9, 'a1'); f.rect(12, 47, 1, 9, 'a1L'); f.rect(19, 47, 1, 9, 'a1S')
            f.rect(13, 45, 1, 2, 'a1'); f.rect(18, 45, 1, 2, 'a1')                       # straps
            f.put(15, 50, 'a2'); f.put(16, 50, 'a2'); f.put(15, 51, 'a2S') if False else None
            f.rect(14, 51, 4, 2, 'a1S')                                                  # pocket
            f.put(15, 45, 'a2'); f.put(16, 45, 'a2')                                     # a little brooch
        if view == 'side':
            f.rect(18, 47, 3, 9, 'a1'); f.put(18, 47, 'a1L')
        if view in ('front', 'back', 'side') and True:
            # skirt over the legs: flared, ending above the shoes
            lift = 0
            if view == 'side':
                f.rect(11, 54, 10, 4, 'pants'); f.rect(10, 57, 12, 2, 'pants'); f.rect(10, 58, 12, 1, 'pantsS')
            else:
                f.rect(10, 54, 12, 3, 'pants'); f.rect(9, 57, 14, 2, 'pants'); f.rect(9, 58, 14, 1, 'pantsS')
                f.rect(20, 54, 2, 4, 'pantsS')
                if view == 'front': f.rect(12, 54, 8, 2, 'a1'); f.rect(12, 56, 8, 1, 'a1S')
    elif who == 'holt':                      # brown suit, white shirt, red tie
        if view == 'front':
            f.rect(14, 45, 4, 4, 'a1'); f.rect(15, 45, 2, 7, 'a2'); f.put(15, 45, 'a2S'); f.put(16, 52, 'a2S')
            f.put(13, 46, 'topS'); f.put(18, 46, 'topS'); f.put(13, 47, 'topS'); f.put(18, 47, 'topS')
            f.rect(12, 50, 1, 1, 'a3')                                                    # a pen
        if view == 'side':
            f.rect(19, 45, 2, 3, 'a1'); f.rect(20, 46, 1, 5, 'a2')
    elif who == 'colt':                      # sage zip-up, open collar
        if view == 'front':
            f.rect(13, 44, 6, 2, 'a1'); f.put(13, 46, 'a1'); f.put(18, 46, 'a1')
            f.rect(15, 46, 2, 9, 'topL'); f.rect(15, 47, 1, 7, 'a3')
            f.rect(11, 50, 3, 2, 'topS'); f.rect(18, 50, 3, 2, 'topS')                  # pockets
        if view == 'side':
            f.rect(18, 44, 3, 2, 'a1'); f.rect(19, 46, 1, 8, 'a3')
        if view == 'back':
            f.rect(12, 44, 8, 2, 'a1')
    elif who == 'elena':                     # ochre work shirt, sleeves rolled, pencil in the pocket
        if view == 'front':
            f.rect(14, 45, 4, 2, 'topL'); f.put(15, 46, 'topS'); f.put(16, 46, 'topS')
            f.rect(18, 48, 3, 2, 'topS'); f.put(19, 47, 'a1'); f.put(19, 46, 'a2')            # pocket, pencil
            for xx in (8, 22):
                f.rect(xx, 50 + (ARM[frame] if xx == 8 else -ARM[frame]), 2, 3, 'skin' if xx == 8 else 'skinS')
        if view == 'side':
            f.rect(15, 50 - STEP[frame] // 4, 3, 1, 'skin')
    elif who == 'tommy':                     # cream shirt, tool belt, keys on a ring
        if view in ('front', 'back'):
            f.rect(10, 53, 12, 2, 'a3'); f.put(15, 53, 'a2'); f.put(16, 53, 'a2')
            if view == 'front':
                f.rect(19, 55, 2, 2, 'a2'); f.put(19, 57, 'a2')                              # keys
                f.rect(14, 45, 4, 1, 'topS'); f.rect(11, 48, 3, 2, 'topS')                    # collar, pocket
        if view == 'side':
            f.rect(11, 53, 10, 2, 'a3'); f.rect(19, 55, 2, 2, 'a2')
    elif who == 'marcus':                    # flannel: a check you can see at a glance
        for y in range(46, 55):
            for x in range(9, 23):
                if (x, y) in f.px and f.px[(x, y)] in ('top', 'topL', 'topS'):
                    if (x - 9) % 4 == 0 or (y - 46) % 4 == 0:
                        f.put(x, y, 'a1' if f.px[(x, y)] != 'topS' else 'a1S')
        if view == 'front':
            f.rect(14, 45, 4, 1, 'a1S')
    elif who == 'priya':                     # green cardigan, cream top, red lanyard and badge
        if view == 'front':
            f.rect(14, 45, 4, 6, 'a1'); f.rect(14, 45, 1, 6, 'a1S') if False else None
            f.put(13, 45, 'a2'); f.put(18, 45, 'a2'); f.put(13, 46, 'a2'); f.put(18, 46, 'a2')
            f.put(14, 47, 'a2'); f.put(17, 47, 'a2'); f.put(15, 48, 'a2'); f.put(16, 48, 'a2')
            f.rect(14, 49, 4, 3, 'a3'); f.rect(15, 50, 2, 1, 'a2S')                          # badge
        if view == 'side':
            f.rect(19, 45, 2, 4, 'a1'); f.put(20, 49, 'a2'); f.rect(20, 50, 2, 2, 'a3')
    elif who == 'jordan':                    # orange hoodie: hood at the back, strings, pocket
        if view == 'front':
            f.rect(11, 44, 10, 1, 'topS'); f.put(14, 46, 'a1'); f.put(14, 47, 'a1'); f.put(17, 46, 'a1'); f.put(17, 48, 'a1')
            f.rect(12, 51, 8, 3, 'topS'); f.rect(13, 51, 6, 1, 'top')
        if view == 'back':
            f.rect(11, 44, 10, 4, 'topS'); f.rect(12, 45, 8, 2, 'top')
        if view == 'side':
            f.rect(11, 44, 4, 4, 'topS'); f.put(19, 47, 'a1')
    elif who == 'player':                    # hoodie in the picker's key colours, plus whatever kit he carries
        if view == 'front':
            f.rect(11, 44, 10, 1, 'topS'); f.put(14, 46, 'a1'); f.put(14, 47, 'a1'); f.put(17, 46, 'a1'); f.put(17, 47, 'a1')
            f.rect(12, 51, 8, 3, 'topS'); f.rect(13, 51, 6, 1, 'top')
        if view == 'back':
            f.rect(11, 44, 10, 4, 'topS'); f.rect(12, 45, 8, 2, 'top')
        if view == 'side':
            f.rect(11, 44, 4, 4, 'topS')
        player_kit(f, view, frame)           # over the hoodie, so the strap runs unbroken across it

# The satchel is his signature: it is the one item that reads from the back and side, where the camera sees him most.
# CHIBI_PLAYER_KIT=badge,bag,mug overrides it for previews ('' for none).
PLAYER_KIT = set(filter(None, os.environ.get('CHIBI_PLAYER_KIT', 'bag').split(',')))

def player_kit(f, view, frame):
    sw = ARM[frame]
    if 'badge' in PLAYER_KIT and view == 'front':                         # TLD dosimeter clipped on the chest
        f.rect(18, 47, 3, 4, 'kb'); f.rect(18, 47, 3, 1, 'kbS'); f.put(19, 49, 'kmS')
    if 'badge' in PLAYER_KIT and view == 'side':
        f.rect(19, 47, 2, 3, 'kb'); f.put(19, 47, 'kbS')
    if 'bag' in PLAYER_KIT:                                               # satchel: strap across, bag at the hip
        if view == 'front':
            for i in range(9): f.put(11 + i, 45 + i, 'kst'); f.put(12 + i, 45 + i, 'kst')
            f.rect(19, 52, 5, 5, 'kbg'); f.rect(19, 52, 5, 2, 'kbgS'); f.put(21, 54, 'a1'); f.rect(19, 52, 1, 5, 'kbgL')
        if view == 'back':
            for i in range(9): f.put(20 - i, 45 + i, 'kst'); f.put(19 - i, 45 + i, 'kst')
            f.rect(8, 52, 5, 5, 'kbg'); f.rect(8, 52, 5, 1, 'kbgS'); f.rect(12, 52, 1, 5, 'kbgS')
        if view == 'side':
            for i in range(8): f.put(17 - i, 45 + i, 'kst')
            f.rect(8, 51, 5, 6, 'kbg'); f.rect(8, 51, 5, 2, 'kbgS'); f.rect(8, 51, 1, 6, 'kbgL')
    if 'mug' in PLAYER_KIT:                                               # a travel mug of Mabel's coffee
        if view == 'front':
            y = 50 + sw
            f.rect(7, y, 3, 5, 'km'); f.rect(7, y, 3, 1, 'kml'); f.rect(7, y + 2, 3, 1, 'kmb'); f.put(7, y + 1, 'kmL')
        if view == 'side':
            x = 16 - STEP[frame] // 2
            f.rect(x, 50, 3, 5, 'km'); f.rect(x, 50, 3, 1, 'kml'); f.rect(x, 52, 3, 1, 'kmb'); f.put(x, 51, 'kmL')
        if view == 'back':
            y = 50 - sw
            f.rect(22, y, 3, 5, 'km'); f.rect(22, y, 3, 1, 'kml'); f.rect(22, y + 2, 3, 1, 'kmb')

def beard(f, view, full):
    if view == 'front':
        f.rect(9, 40, 1, 3, 'hair'); f.rect(22, 40, 1, 3, 'hairS')
        f.rect(10, 41, 12, 3, 'hair'); f.rect(11, 44, 10, 1, 'hairS')
        f.rect(19, 41, 3, 3, 'hairS')
        if full: f.rect(9, 38, 1, 2, 'hair'); f.rect(22, 38, 1, 2, 'hairS'); f.rect(12, 44, 8, 1, 'hair')
        f.rect(14, 41, 4, 1, 'mouth'); f.rect(13, 40, 6, 1, 'hair') if full else f.rect(14, 40, 4, 1, 'hair')
        f.put(10, 39, 'blush'); f.put(21, 39, 'blush')
    elif view == 'side':
        f.rect(14, 39, 1, 3, 'hair'); f.rect(14, 42, 8, 2, 'hair'); f.rect(15, 41, 7, 1, 'hair'); f.rect(16, 44, 5, 1, 'hairS')
        f.rect(20, 40, 3, 1, 'hair'); f.rect(21, 41, 1, 1, 'mouth')

# --- people --------------------------------------------------------------------------------------------------------
def pal_for(who):
    P = dict(ink=OL, eye='#2a1810', eyeW='#fff8e4', blush='#e88a78', mouth='#9a3a30', teeth='#fff8e4', glass=OL,
             shoe='#3a2820', shoeL='#6a5040')
    def person(skin, skinS, hair, hairL, top, topL, topS, pants, **kw):
        d = dict(P, skin=skin, skinS=skinS, hair=hair, hairL=hairL, hairS=shd(hair, .28), hairD=shd(hair, .5),
                 brow=shd(hair, .35), top=top, topL=topL, topS=topS, pants=pants, pantsS=shd(pants, .3))
        d.update(kw); return d
    return {
        'player': dict(P, skin='#f5c9a0', skinS='#e0ac84', hair='#7a4028', hairL='#c47840', hairS='#6a4028',
                       hairD='#4e2818', brow='#4e2818', top='#5a9438', topL='#98c860', topS='#3a6824',
                       pants='#3a2818', pantsS='#2a1c14', eye='#2a1810', mouth='#a04a3a', a1='#f4ecd8',
                       glass='#3a2a2c', lens='#fbe6d2',
                       # kit, none of them a key colour: dosimeter badge, satchel, travel mug
                       kb='#f4ecd8', kbS='#c04a38', kbg='#8a5a38', kbgS='#70462c', kbgL='#b07a4c', kst='#4a3020',
                       km='#9aa4ac', kmL='#dfe4e8', kmS='#6a7480', kml='#f4ecd8', kmb='#c04a38'),
        'mabel': person('#f5c9a0', '#dba37a', '#d6d0c6', '#f6f2ea', '#c8643c', '#e0845a', '#9e4a2a', '#6a4060',
                        hairS='#aaa2b0', a1='#f6ecd8', a1L='#fffaf0', a1S='#d8c8b0', a2='#e0b030', a2S='#a87a20',
                        brow='#a8a0a8', blush='#f08878'),
        'holt': person('#f5c9a0', '#dba37a', '#c8a878', '#e8cc98', '#a8764a', '#c4905a', '#805634', '#4a3424',
                       a1='#f4ecd8', a2='#b02a3a', a2S='#801a28', a3='#2a3a5a', mouth='#8a4a3a'),
        'colt': person('#f5c9a0', '#dba37a', '#c8c0b8', '#eeeae2', '#6b8f71', '#8cb492', '#48684e', '#4a3424',
                       hairS='#9a92a0', a1='#f4ecd8', a3='#c8ccd0'),
        'elena': person('#e0a878', '#c08850', '#6a4030', '#9a6a48', '#d8a63a', '#ecc460', '#b08428', '#3d5c66',
                        a1='#c84040', a1S='#902830', a1L='#f07070', a2='#e0b030'),
        'tommy': person('#e0a878', '#c08850', '#3a2a22', '#5a4030', '#efe2c4', '#fff6e6', '#c8b890', '#3d5c66',
                        a1='#e8b830', a1L='#fff070', a1S='#b88818', a2='#c8ccd0', a3='#5a3a24'),
        'marcus': person('#f0c498', '#d49c70', '#b0502a', '#d8743e', '#c4603a', '#dc8058', '#9a4428', '#4a3424',
                         a1='#8a3020', a1S='#6a2418'),
        'priya': person('#c98e62', '#a8704a', '#2b1d18', '#5a4034', '#488038', '#68a058', '#305824', '#3a2818',
                        a1='#f4ecd8', a2='#c04a38', a2S='#902a20', a3='#fff8e4', brow='#1a1010'),
        'jordan': person('#d8a070', '#b88050', '#4a3028', '#7a5a48', '#e08a30', '#f4aa50', '#a86020', '#3d5c66',
                         a1='#f4ecd8'),
    }[who]

LOOK = {                                  # eyes, mouth, build, extras
    'player': ('round', 'smile', False, {'glasses'}),
    'mabel': ('happy', 'smile', True, set()),
    'holt': ('stern', 'flat', False, set()),
    'colt': ('kind', 'smile', False, {'beard'}),
    'elena': ('firm', 'smirk', False, set()),
    'tommy': ('bright', 'grin', False, set()),
    'marcus': ('round', 'small', True, {'fullbeard'}),
    'priya': ('bright', 'smile', False, {'bindi'}),
    'jordan': ('sly', 'grin', False, set()),
}

def build(who, view, frame):
    eyes, mouth, wide, extra = LOOK[who]
    f = Fig()
    if view in ('front', 'sit'):
        head_front(f)
        if view == 'sit': body_sit(f, wide)
        else: body_front(f, frame, wide)
        outfit(f, who, view, frame)
        eyes_front(f, eyes)
        mouth_front(f, mouth)
        if 'glasses' in extra:
            glasses_front(f)
            eyes_front(f, eyes)                                            # eyes over the lenses
            f.put(9, 40, 'blush'); f.put(10, 40, 'blush'); f.put(21, 40, 'blush'); f.put(22, 40, 'blush')
        if 'bindi' in extra: f.put(15, 34, 'a2'); f.put(16, 34, 'a2')
        if 'beard' in extra: beard(f, 'front', False)
        if 'fullbeard' in extra: beard(f, 'front', True)
        y0, rows = HAIR[who]['front']
        f.grid(y0, rows)
    elif view == 'side':
        head_side(f)
        body_side(f, frame, wide)
        outfit(f, who, 'side', frame)
        face_side(f, eyes, mouth)
        if 'glasses' in extra:
            glasses_side(f)
            face_side(f, eyes, mouth)
        if 'bindi' in extra: f.put(21, 34, 'a2')
        if 'beard' in extra: beard(f, 'side', False)
        if 'fullbeard' in extra: beard(f, 'side', True)
        y0, rows = HAIR[who]['side']
        f.grid(y0, rows)
    else:
        head_back(f)
        body_back(f, frame, wide)
        outfit(f, who, 'back', frame)
        y0, rows = HAIR[who]['back']
        f.grid(y0, rows)
        # From behind, the head is hair down to the nape; the ears still show.
        for (x, y), r in list(f.px.items()):
            if 31 <= y <= 41 and 8 <= x <= 23 and r in ('skin', 'skinS'):
                f.put(x, y, 'hairS' if y >= 40 or x >= 22 else 'hair')
    if frame == 2:                       # passing pose: up a pixel, feet stay down
        f.shift(0, -1, lambda x, y, r: y < 55)
    return f

def sheet_for(who):
    pal = pal_for(who)
    sh = Image.new('RGBA', (128, 192), (0, 0, 0, 0))
    for row, view in enumerate(('front', 'side', 'back')):
        for frame in range(4):
            sh.alpha_composite(render(build(who, view, frame), pal), (frame * 32, row * 64))
    return sh

CAST = ['player', 'mabel', 'holt', 'colt', 'elena', 'tommy', 'marcus', 'priya', 'jordan']

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for who in CAST:
        sh = sheet_for(who)
        sh.save(f'{OUT}/{who}_walk4.png')
        sh.crop((0, 0, 32, 64)).save(f'{OUT}/{who}_idle_32.png')
        render(build(who, 'sit', 0), pal_for(who)).save(f'{OUT}/{who}_sit.png')
    if UI_OUT:
        cs = Image.new('RGBA', (len(CAST) * 132, 260), (0, 0, 0, 0))
        for i, who in enumerate(CAST):
            cs.alpha_composite(Image.open(f'{OUT}/{who}_walk4.png'), (i * 132, 0))
            cs.alpha_composite(Image.open(f'{OUT}/{who}_sit.png'), (i * 132, 194))
        cs.save(f'{UI_OUT}/chibi-sheet.png')
    print('wrote', len(CAST), 'chibi sheets to', OUT)
