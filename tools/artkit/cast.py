"""48x48 pixel portraits for the whole cast, same construction as portrait.priya (A-series)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from px import *
import portrait
OUT = os.environ.get('UI_OUT', './out/ui')

def C(s): return hx(s)
SPEC = {
 'player': dict(skin='#f5c9a0', skinS='#dba37a', hair='#7a4a2a', hairL='#9a6238', hairD='#573320', top='#5a9438', topL='#7ab458', topD='#3a6824', style='short', glasses=True),
 'mabel':  dict(skin='#f5c9a0', skinS='#dba37a', hair='#cfc8bc', hairL='#efe9dd', hairD='#a8a094', top='#c8643c', topL='#e0845a', topD='#9e4a2a', style='bun', glasses=False, age=True),
 'elena':  dict(skin='#e0a878', skinS='#c08850', hair='#6a4030', hairL='#8a5a40', hairD='#4a2a20', top='#d8a63a', topL='#ecc460', topD='#b08428', style='pony', glasses=False),
 'tommy':  dict(skin='#e0a878', skinS='#c08850', hair='#3a2a22', hairL='#5a4030', hairD='#2a1810', top='#efe2c4', topL='#fff6e6', topD='#c8b890', style='hat', glasses=False),
 'marcus': dict(skin='#f0c498', skinS='#d49c70', hair='#9e4a2a', hairL='#c0643a', hairD='#6a3018', top='#c4603a', topL='#dc8058', topD='#9a4428', style='short', glasses=False, beard=True),
 'jordan': dict(skin='#d8a070', skinS='#b88050', hair='#4a3028', hairL='#6a4a3a', hairD='#2a1810', top='#d08c30', topL='#e8a850', topD='#a86c20', style='messy', glasses=False),
 'holt':   dict(skin='#f5c9a0', skinS='#dba37a', hair='#c8a878', hairL='#e0c498', hairD='#a08050', top='#a8764a', topL='#c4905a', topD='#805634', style='part', glasses=False, age=True, tie=True),
}
def face(who, mouth='smile', bg='#f3c9a0', over=None):
    s = dict(SPEC[who]); s.update(over or {}); cv = Cv(48, 48); d = cv.d
    cv.r(0, 0, 48, 48, hx(bg)); cv.r(0, 40, 48, 8, drk(hx(bg), .12))
    SK, SKS = C(s['skin']), C(s['skinS']); SKL = lit(SK, .08) if False else mix(SK, '#ffffff', .18)
    HR, HRL, HRD = C(s['hair']), C(s['hairL']), C(s['hairD'])
    TP, TPL, TPD = C(s['top']), C(s['topL']), C(s['topD'])
    # shoulders
    d.ellipse([2, 36, 46, 60], fill=OL); d.ellipse([3, 37, 45, 59], fill=TP)
    cv.r(6, 40, 3, 8, TPL); cv.r(37, 44, 5, 4, TPD)
    # neck
    cv.r(20, 33, 8, 7, OL); cv.r(21, 33, 6, 7, SKS); cv.r(21, 33, 6, 2, drk(SKS, .25))
    # collar
    if s.get('tie'):
        d.polygon([(18, 38), (24, 42), (30, 38), (30, 40), (24, 45), (18, 40)], fill=OL)
        d.polygon([(19, 39), (24, 43), (29, 39), (29, 40), (24, 44), (19, 40)], fill=C('#f4ecd8'))
        cv.r(23, 42, 2, 6, OL); cv.r(23, 43, 1, 5, C('#a82a3a'))
    else:
        d.polygon([(19, 38), (24, 43), (29, 38), (29, 40), (24, 46), (19, 40)], fill=OL)
        d.polygon([(20, 39), (24, 44), (28, 39), (28, 40), (24, 45), (20, 40)], fill=TPL)
    st = s['style']
    # hair behind head
    if st in ('bun', 'pony', 'short', 'messy', 'part', 'hat'):
        d.ellipse([9, 9, 39, 38], fill=OL); d.ellipse([10, 10, 38, 37], fill=HR)
    if st == 'bun':
        d.ellipse([16, 0, 32, 13], fill=OL); d.ellipse([17, 1, 31, 12], fill=HR); cv.r(19, 3, 5, 2, HRL)
    if st == 'pony':
        d.ellipse([33, 16, 46, 38], fill=OL); d.ellipse([34, 17, 45, 37], fill=HR); cv.r(36, 20, 2, 8, HRL)
        cv.r(32, 18, 3, 4, C('#a82a3a'))
    # head
    d.ellipse([11, 11, 37, 38], fill=OL); d.ellipse([12, 12, 36, 37], fill=SK)
    cv.r(14, 16, 5, 12, SKL); cv.r(31, 20, 4, 14, SKS)
    # hair front
    if st == 'short':
        d.polygon([(11, 22), (11, 15), (16, 10), (26, 8), (34, 11), (37, 16), (37, 23), (34, 17), (24, 15), (16, 17), (14, 22)], fill=OL)
        d.polygon([(12, 21), (12, 16), (17, 11), (26, 9), (33, 12), (36, 16), (36, 21), (33, 17), (24, 16), (17, 18), (14, 21)], fill=HR)
        cv.r(18, 11, 8, 2, HRL); cv.r(14, 16, 3, 1, HRL)
    elif st == 'bun':
        d.polygon([(11, 22), (11, 15), (16, 10), (26, 8), (34, 11), (37, 17), (37, 23), (34, 18), (26, 15), (18, 16), (14, 22)], fill=OL)
        d.polygon([(12, 21), (12, 16), (17, 11), (26, 9), (33, 12), (36, 17), (36, 22), (33, 18), (26, 16), (18, 17), (14, 21)], fill=HR)
        cv.r(18, 11, 7, 2, HRL)
    elif st == 'pony':
        d.polygon([(11, 20), (12, 14), (18, 9), (26, 8), (33, 10), (37, 15), (37, 21), (33, 15), (26, 13), (19, 14), (14, 20)], fill=OL)
        d.polygon([(12, 19), (13, 14), (18, 10), (26, 9), (32, 11), (36, 15), (36, 20), (33, 15), (26, 14), (19, 15), (14, 19)], fill=HR)
        cv.r(19, 10, 7, 2, HRL)
    elif st == 'messy':
        d.polygon([(11, 23), (10, 14), (14, 8), (20, 6), (26, 8), (32, 6), (37, 10), (38, 18), (37, 24), (34, 17), (28, 14), (20, 15), (15, 18), (14, 23)], fill=OL)
        d.polygon([(12, 22), (11, 14), (15, 9), (20, 7), (26, 9), (32, 7), (36, 11), (37, 18), (36, 22), (33, 17), (28, 15), (20, 16), (15, 19), (14, 22)], fill=HR)
        cv.r(17, 9, 4, 2, HRL); cv.r(28, 9, 4, 2, HRL); cv.px(24, 5, OL); cv.px(24, 6, HR)
    elif st == 'part':
        d.polygon([(11, 22), (11, 15), (16, 10), (26, 8), (34, 11), (37, 16), (37, 22), (34, 17), (26, 14), (21, 14), (15, 17), (14, 22)], fill=OL)
        d.polygon([(12, 21), (12, 16), (17, 11), (26, 9), (33, 12), (36, 16), (36, 21), (33, 17), (26, 15), (21, 15), (16, 18), (14, 21)], fill=HR)
        cv.r(17, 11, 9, 2, HRL); cv.r(21, 13, 1, 3, drk(HR, .25))
    elif st == 'hat':
        d.ellipse([9, 3, 39, 24], fill=OL); d.ellipse([10, 4, 38, 23], fill=C('#e0b030'))
        cv.r(10, 14, 28, 9, C('#e0b030')); cv.r(8, 18, 32, 4, OL); cv.r(9, 18, 30, 3, C('#c89820'))
        cv.r(14, 6, 8, 2, C('#f4d060')); cv.r(22, 3, 4, 17, OL) if False else None
        cv.r(22, 4, 4, 14, C('#c89820')); cv.r(23, 5, 2, 12, C('#e8c040'))
        cv.r(11, 22, 3, 8, OL); cv.r(12, 22, 2, 7, HR); cv.r(34, 22, 3, 8, OL); cv.r(34, 22, 2, 7, HRD)
    # eyes
    for ex in (17, 28):
        cv.r(ex, 23, 4, 5, OL); cv.r(ex+1, 24, 2, 3, C('#2a1810')); cv.px(ex+1, 24, C('#fff6e6')); cv.px(ex+2, 26, C('#6a4a3a'))
        brow = HRD if st != 'part' else HR
        if st != 'hat' or True:
            cv.r(ex-1, 21, 6, 1, brow)
    cv.r(15, 29, 3, 1, C('#e08a78')); cv.r(30, 29, 3, 1, C('#e08a78'))
    if s.get('glasses'):
        for ex in (15, 26):
            cv.r(ex, 21, 8, 1, OL); cv.r(ex, 29, 8, 1, OL); cv.r(ex, 21, 1, 9, OL); cv.r(ex+7, 21, 1, 9, OL)
        cv.r(23, 24, 3, 1, OL)
    if s.get('age'):
        cv.px(14, 31, SKS); cv.px(34, 31, SKS); cv.r(18, 19, 3, 1, SKS) if False else None
        cv.px(13, 27, SKS); cv.px(35, 27, SKS)
    if s.get('beard'):
        d.polygon([(14, 30), (34, 30), (33, 37), (24, 40), (15, 37)], fill=OL)
        d.polygon([(15, 31), (33, 31), (32, 36), (24, 39), (16, 36)], fill=HR)
        cv.r(17, 32, 3, 2, HRL)
        # keep mouth area visible
        cv.r(21, 31, 7, 3, SK)
    # mouth
    mc = C('#8a4a3a')
    if mouth == 'smile':
        cv.r(22, 31, 5, 1, mc); cv.px(21, 30, mc); cv.px(27, 30, mc)
    elif mouth == 'talk':
        cv.r(22, 31, 4, 2, OL); cv.r(23, 31, 2, 1, C('#b8685a'))
    elif mouth == 'flat':
        cv.r(22, 31, 5, 1, mc)
    return cv

ORDER = ['priya', 'mabel', 'elena', 'tommy', 'marcus', 'jordan', 'holt', 'player']
BG = {'priya': '#f0d8b8', 'mabel': '#f0d0b0', 'elena': '#f0d890', 'tommy': '#c8d8e8', 'marcus': '#e8c8b0', 'jordan': '#e8d0a0', 'holt': '#d8c8b0', 'player': '#c8e0b0'}
def get(who, mouth='smile', bg=None, over=None):
    return portrait.priya(mouth, bg or BG[who]) if who == 'priya' else face(who, mouth, bg or BG[who], over)
def _main():
    os.makedirs(OUT, exist_ok=True)
    sheet = Cv(8*60+10, 2*60*2+30, (236, 214, 176, 255))
    for i, w in enumerate(ORDER):
        for j, m in enumerate(('smile', 'talk')):
            sheet.im.alpha_composite(get(w, m).im, (10+i*60, 10+j*60+ (0)))
    sheet.save(f'{OUT}/cast-sheet.png', 3)
    for w in ORDER:
        for m in ('smile', 'talk'):
            get(w, m).save(f'{OUT}/portrait-{w}-{m}.png')
    for m in ('smile', 'talk'):
        player('copper', 'brown', False, m).save(f'{OUT}/portrait-player-{m}-noglasses.png')
    print('ok')

HOODIES = {'copper': ('#c4783a', '#e8a860', '#8a4820'), 'leaf': ('#6b8f71', '#8cb492', '#48684e'), 'steel': ('#5a7a98', '#7a9cb8', '#3e5a74'), 'gold': ('#d8a63a', '#ecc460', '#b08428')}
HAIRS = {'brown': ('#7a4a2a', '#9a6238', '#573320'), 'ink': ('#2a1810', '#4a3328', '#1b110e'), 'silver': ('#c8c0b4', '#e4ded2', '#a8a094'), 'copper': ('#8a4820', '#b0642c', '#642a18')}
def player(hoodie='copper', hair='brown', glasses=True, mouth='smile', bg='#c8e0b0'):
    t, tl, td = HOODIES[hoodie]; h, hl, hd = HAIRS[hair]
    return face('player', mouth, bg, dict(top=t, topL=tl, topD=td, hair=h, hairL=hl, hairD=hd, glasses=glasses))

if __name__ == '__main__':
    _main()
