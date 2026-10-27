import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from px import *
OUT = os.environ.get('UI_OUT', './out/ui')

def priya(mouth='smile', bg='#f3c9a0'):
    cv = Cv(48, 48)
    cv.r(0, 0, 48, 48, hx(bg))
    cv.r(0, 40, 48, 8, drk(hx(bg), .12))
    SK, SKS, SKL = hx('#c98e62'), hx('#a8704a'), hx('#dca878')
    HR, HRL, HRD = hx('#2b1d18'), hx('#4a3328'), hx('#1b110e')
    SW_, SWL, SWD = hx('#488038'), hx('#68a058'), hx('#305824')
    d = cv.d
    # shoulders / sweater
    d.ellipse([2, 36, 46, 60], fill=OL); d.ellipse([3, 37, 45, 59], fill=SW_)
    cv.r(6, 40, 3, 8, SWL); cv.r(37, 44, 5, 4, SWD)
    # neck
    cv.r(20, 33, 8, 7, OL); cv.r(21, 33, 6, 7, SKS); cv.r(21, 33, 6, 2, drk(SKS, .25))
    d.polygon([(19, 38), (24, 43), (29, 38), (29, 40), (24, 46), (19, 40)], fill=OL)
    d.polygon([(20, 39), (24, 44), (28, 39), (28, 40), (24, 45), (20, 40)], fill=SWL)
    # back hair mass (behind head)
    d.ellipse([8, 8, 40, 40], fill=OL); d.ellipse([9, 9, 39, 39], fill=HR)
    # bun
    d.ellipse([7, 1, 23, 15], fill=OL); d.ellipse([8, 2, 22, 14], fill=HR); cv.r(10, 4, 4, 2, HRL); cv.r(9, 6, 2, 2, HRL)
    # head
    d.ellipse([11, 11, 37, 38], fill=OL); d.ellipse([12, 12, 36, 37], fill=SK)
    cv.r(14, 16, 5, 12, SKL); cv.r(14, 16, 4, 12, SKL)
    cv.r(31, 20, 4, 14, SKS)
    # hair top / fringe: side part sweeping to the right
    d.polygon([(11, 22), (11, 15), (16, 10), (26, 8), (34, 11), (37, 17), (37, 24), (34, 18), (28, 15), (22, 15), (17, 19), (14, 25)], fill=OL)
    d.polygon([(12, 21), (12, 16), (17, 11), (26, 9), (33, 12), (36, 17), (36, 22), (33, 18), (28, 16), (22, 16), (17, 20), (14, 24)], fill=HR)
    cv.r(18, 11, 8, 2, HRL); cv.r(26, 11, 4, 1, HRL)
    # side locks falling past the cheeks
    cv.r(10, 24, 3, 12, OL); cv.r(11, 24, 2, 11, HR); cv.r(36, 24, 3, 12, OL); cv.r(36, 24, 2, 11, HRD)
    # eyes (2x? chibi: dark, white highlight)
    for ex in (17, 28):
        cv.r(ex, 23, 4, 5, OL); cv.r(ex+1, 24, 2, 3, hx('#2a1810')); cv.px(ex+1, 24, hx('#fff6e6')); cv.px(ex+2, 26, hx('#6a4a3a'))
        cv.r(ex-1, 21, 6, 1, HR); cv.r(ex-1, 20, 3, 1, HR) if ex == 17 else cv.r(ex+2, 20, 3, 1, HR)       # brows
    cv.r(15, 29, 3, 1, hx('#e08a78')); cv.r(30, 29, 3, 1, hx('#e08a78'))                                       # blush
    # mouth
    if mouth == 'smile':
        cv.r(22, 31, 5, 1, hx('#8a4a3a')); cv.px(21, 30, hx('#8a4a3a')); cv.px(27, 30, hx('#8a4a3a'))
    elif mouth == 'talk':
        cv.r(22, 31, 4, 2, OL); cv.r(23, 31, 2, 1, hx('#b8685a'))
    # bindi + earring
    cv.px(23, 19, hx('#c04a38')); cv.px(24, 19, hx('#c04a38'))
    cv.r(12, 31, 2, 3, hx('#5ab0a8')); cv.px(12, 31, OL) if False else None
    return cv

def frame(cv, x, y, scale=1):
    pass

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    sheet = Cv(48*3+16*4, 48+32, (236, 214, 176, 255))
    for i, m in enumerate(('smile', 'talk', 'smile')):
        p = priya(m, ('#f3c9a0', '#a8d0c8', '#d8c8f0')[i]); sheet.im.alpha_composite(p.im, (16+i*(48+16), 16))
    sheet.save(f'{OUT}/priya-sheet.png', 6)
    priya().save(f'{OUT}/priya-48.png'); priya().save(f'{OUT}/priya-48-6x.png', 6)
    priya('talk').save(f'{OUT}/priya-talk.png'); priya('talk').save(f'{OUT}/priya-talk-6x.png', 6)
