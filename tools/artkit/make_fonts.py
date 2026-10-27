"""Build the two pixel fonts used in the art (exactly the glyphs in px.py) as TTF + WOFF2-less TTF.
   CCPixel3x5: labels, HUD, cabinet text.  CCPixel5x7: titles and big numbers.
   1 font pixel = 100 units (UPM 1000). Use font-size 10px for 1x, 20px for 2x, 30px for 3x (whole multiples only)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
import px
P = 100
def build(name, glyphs, rows, adv_extra, out):
    order = ['.notdef', 'space']
    gl = {}
    def sq(pen, x, y):   # y measured from baseline, counter-clockwise outer contour
        pen.moveTo((x*P, y*P)); pen.lineTo((x*P, (y+1)*P)); pen.lineTo(((x+1)*P, (y+1)*P)); pen.lineTo(((x+1)*P, y*P)); pen.closePath()
    adv = {}
    cmap = {}
    for ch, g in glyphs.items():
        gname = 'space' if ch == ' ' else ('g%04x' % ord(ch))
        if gname not in order: order.append(gname)
        pen = TTGlyphPen(None)
        w = len(g[0]) if isinstance(g, list) else 3
        for r in range(rows):
            line = g[r] if isinstance(g, list) else g[r*3:(r+1)*3]
            for c, b in enumerate(line):
                if b == '1': sq(pen, c, rows-1-r)
        gl[gname] = pen.glyph(); adv[gname] = (w+adv_extra)*P
        cmap[ord(ch)] = gname
        if ch.isalpha():
            cmap[ord(ch.lower())] = gname
    pen = TTGlyphPen(None); gl['.notdef'] = pen.glyph(); adv['.notdef'] = 4*P
    if 'space' not in gl:
        gl['space'] = TTGlyphPen(None).glyph(); adv['space'] = 3*P; cmap[32] = 'space'
    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(order); fb.setupCharacterMap(cmap)
    fb.setupGlyf(gl)
    fb.setupHorizontalMetrics({n: (adv[n], 0) for n in order})
    fb.setupHorizontalHeader(ascent=(rows+1)*P, descent=-2*P)
    fb.setupNameTable({'familyName': name, 'styleName': 'Regular'})
    fb.setupOS2(sTypoAscender=(rows+1)*P, sTypoDescender=-2*P, usWinAscent=(rows+1)*P, usWinDescent=2*P)
    fb.setupPost(); fb.save(out)
out = sys.argv[1] if len(sys.argv) > 1 else './out/fonts'
os.makedirs(out, exist_ok=True)
build('CCPixel3x5', px._G, 5, 1, f'{out}/CCPixel3x5.ttf')
b = {k: v for k, v in px._B.items()}
build('CCPixel5x7', b, 7, 1, f'{out}/CCPixel5x7.ttf')
print('fonts ok')
