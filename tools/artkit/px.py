"""Pixel toolkit for schematics / UI: bitmap font, pipes with flow arrows, temperature ramp, steel/vessel shapes.
Same outline colour and flat-shading rules as kit.py. No anti-aliasing, no dither."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import Cv, hx, OL, lit, drk, mix, Image, ImageDraw

# ---------------------------------------------------------------- 3x5 bitmap font (caps, digits, punctuation)
_G = {
'A':'010101111101101','B':'110101110101110','C':'011100100100011','D':'110101101101110','E':'111100110100111','F':'111100110100100',
'G':'011100101101011','H':'101101111101101','I':'111010010010111','J':'001001001101010','K':'101101110101101','L':'100100100100111',
'M':'101111111101101','N':'110101101101101','O':'010101101101010','P':'110101110100100','Q':'010101101110011','R':'110101110101101',
'S':'011100010001110','T':'111010010010010','U':'101101101101111','V':'101101101101010','W':'101101111111101','X':'101101010101101',
'Y':'101101010010010','Z':'111001010100111',
'0':'111101101101111','1':'010110010010111','2':'110001010100111','3':'110001010001110','4':'101101111001001','5':'111100110001110',
'6':'011100111101111','7':'111001010010010','8':'111101111101111','9':'111101111001110',
'.':'000000000000010',',':'000000000010100','-':'000000111000000','/':'001001010100100','%':'101001010100101','~':'000011110000000',
'+':'000010111010000',':':'000010000010000','=':'000111000111000','>':'100010001010100','<':'001010100010001','(':'010100100100010',
')':'010001001001010',"'":'010010000000000','*':'000101010101000','^':'010101000000000','?':'110001010000010','!':'010010010000010',
'#':'101111101111101','_':'000000000000111','&':'010101010101011',' ':'000000000000000',
'°':'111101111000000','$':'011110010011110',
}
def text_w(s, scale=1): return (len(s)*4-1)*scale
def text(cv, x, y, s, col, scale=1, shadow=None):
    s = s.upper(); cx = x
    for ch in s:
        g = _G.get(ch, _G['?'])
        for i, b in enumerate(g):
            if b == '1':
                gx, gy = i % 3, i//3
                if shadow: cv.r(cx+gx*scale+scale, y+gy*scale+scale, scale, scale, shadow)
        cx += 4*scale
    cx = x
    for ch in s:
        g = _G.get(ch, _G['?'])
        for i, b in enumerate(g):
            if b == '1': cv.r(cx+(i % 3)*scale, y+(i//3)*scale, scale, scale, col)
        cx += 4*scale
def label(cv, x, y, s, col='#3b2318', scale=1, bg=None, pad=1):
    if bg:
        w = text_w(s, scale)
        cv.r(x-pad, y-pad, w+2*pad, 5*scale+2*pad, hx(bg) if isinstance(bg, str) else bg)
    text(cv, x, y, s, hx(col) if isinstance(col, str) else col, scale)

# ---------------------------------------------------------------- 5x7 display font for titles (caps + digits + & . ' -)
_B = {
'A':['01110','10001','10001','11111','10001','10001','10001'],'B':['11110','10001','10001','11110','10001','10001','11110'],
'C':['01111','10000','10000','10000','10000','10000','01111'],'D':['11110','10001','10001','10001','10001','10001','11110'],
'E':['11111','10000','10000','11110','10000','10000','11111'],'F':['11111','10000','10000','11110','10000','10000','10000'],
'G':['01111','10000','10000','10011','10001','10001','01111'],'H':['10001','10001','10001','11111','10001','10001','10001'],
'I':['11111','00100','00100','00100','00100','00100','11111'],'J':['00111','00010','00010','00010','00010','10010','01100'],
'K':['10001','10010','10100','11000','10100','10010','10001'],'L':['10000','10000','10000','10000','10000','10000','11111'],
'M':['10001','11011','10101','10101','10001','10001','10001'],'N':['10001','11001','10101','10011','10001','10001','10001'],
'O':['01110','10001','10001','10001','10001','10001','01110'],'P':['11110','10001','10001','11110','10000','10000','10000'],
'Q':['01110','10001','10001','10001','10101','10010','01101'],'R':['11110','10001','10001','11110','10100','10010','10001'],
'S':['01111','10000','10000','01110','00001','00001','11110'],'T':['11111','00100','00100','00100','00100','00100','00100'],
'U':['10001','10001','10001','10001','10001','10001','01110'],'V':['10001','10001','10001','10001','10001','01010','00100'],
'W':['10001','10001','10001','10101','10101','11011','10001'],'X':['10001','10001','01010','00100','01010','10001','10001'],
'Y':['10001','10001','01010','00100','00100','00100','00100'],'Z':['11111','00001','00010','00100','01000','10000','11111'],
'&':['01100','10010','10100','01000','10101','10010','01101'],'.':['0','0','0','0','0','0','1'],'-':['00000','00000','00000','11111','00000','00000','00000'],
' ':['000','000','000','000','000','000','000'],
}

_B.update({
'0':['01110','10001','10011','10101','11001','10001','01110'],'1':['00100','01100','00100','00100','00100','00100','01110'],
'2':['01110','10001','00001','00010','00100','01000','11111'],'3':['11110','00001','00001','01110','00001','00001','11110'],
'4':['00010','00110','01010','10010','11111','00010','00010'],'5':['11111','10000','11110','00001','00001','10001','01110'],
'6':['00110','01000','10000','11110','10001','10001','01110'],'7':['11111','00001','00010','00100','01000','01000','01000'],
'8':['01110','10001','10001','01110','10001','10001','01110'],'9':['01110','10001','10001','01111','00001','00010','01100'],
':':['0','0','1','0','0','1','0'],'%':['11001','11010','00010','00100','01000','01011','10011'],'/':['00001','00001','00010','00100','01000','10000','10000'],
})

def big_w(s, scale=1): return sum((len(_B.get(c, _B[' '])[0])+1) for c in s.upper())*scale-scale
def big(cv, x, y, s, col, scale=2, shadow=None, outline=None):
    s = s.upper()
    def draw(ox, oy, c):
        cx = x+ox
        for ch in s:
            g = _B.get(ch, _B[' '])
            for r, row in enumerate(g):
                for k, b in enumerate(row):
                    if b == '1': cv.r(cx+k*scale, y+oy+r*scale, scale, scale, c)
            cx += (len(g[0])+1)*scale
    if outline:
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (-1, 1), (1, -1)): draw(dx*scale, dy*scale, outline)
    if shadow: draw(scale, scale, shadow)
    draw(0, 0, col)

# ---------------------------------------------------------------- temperature ramp (flat bands; scale printed on the diagram)
RAMP = ['#3a78c0', '#4aa0c8', '#7ac0b8', '#e8d070', '#e8963a', '#d4552e', '#a82a3a']
def tcol(t, lo, hi):
    """t in [lo,hi] -> flat band colour. 7 bands."""
    f = 0 if hi == lo else max(0, min(.9999, (t-lo)/(hi-lo)))
    return hx(RAMP[int(f*len(RAMP))])
STEAM = hx('#f4ecd8'); STEAMD = hx('#d8ccb0')
WATER = hx('#4a86c8'); LAKE = hx('#3aa0a0'); STEEL = hx('#8a949a'); STEELD = hx('#5c666c'); STEELL = hx('#b8c0c4')
PAPER = hx('#f1e4c8'); INK = OL

# ---------------------------------------------------------------- shapes
def steel_box(cv, x, y, w, h, fill=STEEL):
    cv.r(x, y, w, h, OL); cv.r(x+1, y+1, w-2, h-2, fill)
    cv.r(x+1, y+1, w-2, 1, lit(fill, .3)); cv.r(x+1, y+1, 1, h-2, lit(fill, .15))
    cv.r(x+w-2, y+1, 1, h-2, drk(fill, .22)); cv.r(x+1, y+h-2, w-2, 1, drk(fill, .22))
def fill_box(cv, x, y, w, h, col, outline=False):
    if outline: cv.r(x, y, w, h, OL); cv.r(x+1, y+1, w-2, h-2, col)
    else: cv.r(x, y, w, h, col)
def bubbles(cv, x, y, w, h, n, seed=1, col=None, r=1):
    import random
    rnd = random.Random(seed); col = col or hx('#f8f4e8')
    for _ in range(n):
        bx, by = x+rnd.randrange(max(w-2, 1)), y+rnd.randrange(max(h-2, 1))
        cv.r(bx, by, 2, 2, OL) if r == 2 else None
        cv.r(bx, by, 2, 2, col); cv.px(bx, by, hx('#ffffff'))
def stipple(cv, x, y, w, h, col, step=4, off=0):
    for yy in range(y, y+h, step):
        for xx in range(x+((yy-y)//step % 2)*(step//2)+off, x+w, step): cv.px(xx, yy, col)

def arrow(cv, x, y, d, col='#fff8e4', size=3):
    """chevron arrow centred at x,y pointing d in 'rludn' (r=right,l=left,u=up,d=down), with outline."""
    pts = {'r': [(0, -size), (size, 0), (0, size)], 'l': [(0, -size), (-size, 0), (0, size)],
           'u': [(-size, 0), (0, -size), (size, 0)], 'd': [(-size, 0), (0, size), (size, 0)]}[d]
    poly = [(x+px_, y+py_) for px_, py_ in pts]
    # filled triangle with 1px outline
    cv.d.polygon(poly, fill=OL)
    inner = [(x+px_*0.55, y+py_*0.55) for px_, py_ in pts]
    cv.d.polygon([(int(round(a)), int(round(b))) for a, b in inner], fill=hx(col) if isinstance(col, str) else col)

def pipe(cv, pts, w, col, arrows=True, every=28, outline=True, hot=None):
    """axis-aligned polyline pipe. col: colour or fn(progress 0..1)->colour. Draws outline, fill, highlight, flow arrows."""
    segs = []
    L = 0
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        ln = abs(x1-x0)+abs(y1-y0); segs.append((x0, y0, x1, y1, L, ln)); L += ln
    h = w//2
    def colat(p): return col(p) if callable(col) else col
    # outline pass
    for x0, y0, x1, y1, s0, ln in segs:
        xa, xb = sorted((x0, x1)); ya, yb = sorted((y0, y1))
        cv.r(xa-h-1, ya-h-1, xb-xa+w+2, yb-ya+w+2, OL)
    # fill pass per pixel step along path
    for x0, y0, x1, y1, s0, ln in segs:
        dx = (x1 > x0)-(x1 < x0); dy = (y1 > y0)-(y1 < y0)
        for i in range(ln+1):
            c = colat((s0+i)/max(L, 1)); x, y = x0+dx*i, y0+dy*i
            cv.r(x-h, y-h, w, w, c)
            if dx:   # highlight top, shade bottom
                cv.px(x, y-h, lit(c, .35)); cv.px(x, y+h-1, drk(c, .25))
            else:
                cv.px(x-h, y, lit(c, .35)); cv.px(x+h-1, y, drk(c, .25))
    if arrows:
        for x0, y0, x1, y1, s0, ln in segs:
            if ln < 14: continue
            dx = (x1 > x0)-(x1 < x0); dy = (y1 > y0)-(y1 < y0)
            n = max(1, ln//every);
            for k in range(n):
                t = (k+.5)/n*ln; x, y = x0+dx*t, y0+dy*t
                d = 'r' if dx > 0 else 'l' if dx < 0 else 'd' if dy > 0 else 'u'
                arrow(cv, int(x), int(y), d, '#fff8e4', 2 if w < 7 else 3)

def qarrow(cv, x, y, d, col='#e8963a', n=1, wiggle=True):
    """heat-flow arrow (Q): thick orange arrow with outline"""
    L = 10
    for k in range(n):
        ox, oy = (k*6, 0) if d in 'ud' else (0, k*6)
        if d == 'r': xs = [(x+ox, y+oy-1, L, 3)]; tip = [(x+ox+L, y+oy-3), (x+ox+L+4, y+oy), (x+ox+L, y+oy+3)]
        if d == 'l': xs = [(x+ox, y+oy-1, L, 3)]; tip = [(x+ox, y+oy-3), (x+ox-4, y+oy), (x+ox, y+oy+3)]
        if d == 'd': xs = [(x+ox-1, y+oy, 3, L)]; tip = [(x+ox-3, y+oy+L), (x+ox, y+oy+L+4), (x+ox+3, y+oy+L)]
        if d == 'u': xs = [(x+ox-1, y+oy, 3, L)]; tip = [(x+ox-3, y+oy), (x+ox, y+oy-4), (x+ox+3, y+oy)]
        for (a, b, c, e) in xs: cv.r(a-1, b-1, c+2, e+2, OL);
        cv.d.polygon(tip, fill=OL)
        for (a, b, c, e) in xs: cv.r(a, b, c, e, hx(col))
        cv.d.polygon([(px_, py_) for px_, py_ in tip], fill=hx(col))

def node(cv, x, y, tag, t=None, p=None, col='#fff8e4'):
    """small readout tag: circle with letter + optional T/P text next to it"""
    cv.circle(x, y, 3, hx(col));
    text(cv, x-1, y-2, tag, OL)

def legend_swatch(cv, x, y, col, s, w=8):
    cv.r(x, y, w, 5, OL); cv.r(x+1, y+1, w-2, 3, col); text(cv, x+w+2, y, s, OL)

def scale_bar(cv, x, y, lo, hi, w=70):
    n = len(RAMP); bw = w//n
    cv.r(x-1, y-1, bw*n+2, 7, OL)
    for i, c in enumerate(RAMP): cv.r(x+i*bw, y, bw, 5, hx(c))
    text(cv, x, y+8, f'{lo}', OL); s = f'{hi} °C'; text(cv, x+bw*n-text_w(s), y+8, s, OL)

def paper(cv, w, h):
    cv.r(0, 0, w, h, PAPER)
    for y in range(8, h, 16):
        for x in range(8, w, 16): cv.px(x, y, drk(PAPER, .10))
    cv.r(0, 0, w, 1, OL); cv.r(0, h-1, w, 1, OL); cv.r(0, 0, 1, h, OL); cv.r(w-1, 0, 1, h, OL)
