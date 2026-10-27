import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from px import *
OUT = os.environ.get('REACTOR_OUT', './out/reactors')
os.makedirs(OUT, exist_ok=True)
W, H = 384, 216

def save(cv, name):
    cv.save(f'{OUT}/{name}.png'); cv.save(f'{OUT}/{name}-3x.png', 3)

def turbine_gen(cv, x, y, w=54):
    """steam turbine (expanding casing) + generator. x,y = top-left."""
    # casing: stepped trapezoid expanding to the right (steam expands)
    for i in range(6):
        hh = 14+i*3; cv.r(x+i*(w//6), y+(26-hh)//2, w//6+1, hh, OL)
    for i in range(6):
        hh = 12+i*3; cv.r(x+1+i*(w//6), y+(26-hh)//2+1, w//6-1, hh-2, STEEL)
        cv.r(x+1+i*(w//6), y+(26-hh)//2+1, w//6-1, 1, STEELL)
        for k in range(2): cv.r(x+3+i*(w//6)+k*3, y+(26-hh)//2+4, 1, hh-8, STEELD)   # blade rows
    cv.r(x+w, y+10, 8, 6, OL); cv.r(x+w, y+11, 8, 4, STEELD)                      # shaft
    steel_box(cv, x+w+8, y+3, 24, 20, hx('#6a7f9a'))                              # generator
    text(cv, x+w+17, y+10, 'G', hx('#fff8e4'))
    cv.r(x+w+10, y+23, 20, 3, OL)

def pump(cv, x, y, r=8, col=None):
    cv.circle(x, y, r, STEEL); cv.circle(x, y, r-4, STEELD)
    cv.r(x-1, y-1, 3, 3, hx('#e0c860'))
    cv.r(x+r-1, y-r-2, r+2, 3, OL)  # discharge stub (cosmetic)

def pwr():
    cv = Cv(W, H); paper(cv, W, H)
    LO, HI = 285, 350
    cold, hot, pz = tcol(292, LO, HI), tcol(325, LO, HI), tcol(345, LO, HI)
    SX = 12                                   # steam generator x offset
    # ---------------- primary loop pipes (drawn first so vessel overlaps their ends)
    pipe(cv, [(84, 66), (106, 66), (106, 148), (128+SX, 148)], 8, hot, every=22)                      # hot leg
    pipe(cv, [(164+SX, 156), (164+SX, 170), (189+SX, 170)], 8, cold, every=14)                        # SG outlet
    pipe(cv, [(207+SX, 170), (230+SX, 170), (230+SX, 198), (10, 198), (10, 70), (28, 70)], 8, cold, every=44)  # cold leg back
    # ---------------- reactor pressure vessel
    steel_box(cv, 26, 46, 60, 126, STEEL)
    cv.r(31, 51, 50, 116, cold)
    steel_box(cv, 30, 38, 52, 10, STEEL)
    for i in range(5):
        steel_box(cv, 34+i*9, 20, 6, 20, hx('#6a7f9a')); cv.r(35+i*9, 18, 4, 3, OL)
    cv.r(31, 51, 6, 100, cold); cv.r(75, 51, 6, 100, cold)        # downcomer
    cv.r(31, 143, 50, 24, cold)                                    # lower plenum
    cv.r(37, 56, 2, 92, STEELD); cv.r(73, 56, 2, 92, STEELD); cv.r(37, 146, 38, 2, STEELD)   # core barrel
    cv.r(39, 56, 34, 36, hot)                                      # upper plenum
    bands = 7; ch = (138-92)//bands + 1
    for b in range(bands):
        yy = 138-(b+1)*ch+1
        cv.r(39, max(yy, 92), 34, ch, tcol(292+(325-292)*(b+.5)/bands, LO, HI))
    for a in range(5):
        ax = 40+a*7
        cv.r(ax, 92, 1, 46, mix(OL, '#8a949a', .25))
        for yy in range(94, 138, 4): cv.px(ax+3, yy, drk(STEELD, .2))
    cv.r(72, 92, 1, 46, mix(OL, '#8a949a', .25))
    for yy in (104, 118, 130): cv.r(39, yy, 34, 1, STEELD)        # grid spacers
    cv.r(39, 138, 34, 2, STEELD)
    for x in range(41, 73, 4): cv.px(x, 138, OL)
    for a in (1, 3):                                               # control rods inserted from above
        gx = 40+a*7+3
        cv.r(gx-1, 56, 3, 36, STEELD); cv.r(gx, 56, 1, 36, STEELL)
        cv.r(gx-2, 92, 5, 14, OL); cv.r(gx-1, 92, 3, 14, hx('#2a2a30')); cv.r(gx-1, 92, 1, 14, hx('#5a5a62'))
    for yy in (70, 100): arrow(cv, 34, yy, 'd', '#fff8e4', 2); arrow(cv, 78, yy, 'd', '#fff8e4', 2)
    for xx in (47, 56, 65): arrow(cv, xx, 125, 'u', '#fff8e4', 2); arrow(cv, xx, 104, 'u', '#fff8e4', 2)
    arrow(cv, 56, 156, 'u', '#fff8e4', 2)
    cv.r(82, 62, 6, 8, hot); cv.r(24, 66, 6, 8, cold)
    # ---------------- pressurizer
    steel_box(cv, 96, 8, 20, 44, STEEL)
    cv.r(98, 10, 16, 40, pz)
    cv.r(98, 10, 16, 14, STEAM); bubbles(cv, 98, 11, 16, 12, 4, 3, STEAMD)
    cv.r(98, 24, 16, 1, hx('#fff8e4'))
    for x in (100, 104, 108): cv.r(x, 44, 2, 5, hx('#e8963a')); cv.px(x, 44, hx('#ffd080'))
    pipe(cv, [(106, 66), (106, 52)], 4, pz, arrows=False)
    # ---------------- steam generator
    steel_box(cv, 128+SX, 28, 50, 128, STEEL)
    cv.r(133+SX, 33, 40, 118, hx('#4a86c8'))
    cv.r(133+SX, 33, 40, 22, STEAM); bubbles(cv, 133+SX, 34, 40, 20, 9, 5, STEAMD)
    cv.r(133+SX, 55, 40, 1, hx('#fff8e4'))
    for x in (138, 146, 154, 162): cv.r(x+SX, 38, 6, 2, STEELD)
    for k in range(5):
        xl = 138+SX+k*3; xr = 168+SX-k*3; top = 66+k*2
        cv.r(xl, top, 1, 74, hot); cv.r(xr, top, 1, 74, cold)
        cv.r(xl, top-1, xr-xl+1, 1, mix(hot, cold, k/5))
    cv.r(133+SX, 138, 40, 3, STEELD); cv.r(133+SX, 138, 40, 1, STEELL)
    cv.r(133+SX, 141, 40, 15, hot); cv.r(153+SX, 141, 20, 15, cold); cv.r(152+SX, 141, 2, 15, STEELD)
    qarrow(cv, 142+SX, 96, 'r'); qarrow(cv, 142+SX, 112, 'r')
    pipe(cv, [(153+SX, 32), (153+SX, 12), (236, 12)], 6, STEAM, every=30)
    pipe(cv, [(264, 112), (264, 132), (190+SX, 132), (190+SX, 60), (172+SX, 60)], 6, WATER, every=30)
    # ---------------- RCP
    pump(cv, 198+SX, 170, 8)
    # ---------------- turbine, condenser, lake water
    turbine_gen(cv, 236, 2)
    pipe(cv, [(282, 30), (282, 58)], 6, STEAM, every=40)
    steel_box(cv, 232, 58, 74, 54, STEEL)
    cv.r(237, 63, 64, 44, STEAM)
    for k in range(6): cv.r(240, 70+k*5, 58, 2, LAKE); cv.r(240, 70+k*5, 58, 1, lit(LAKE, .3))
    bubbles(cv, 240, 64, 58, 6, 6, 9, STEAMD)
    cv.r(237, 100, 64, 7, hx('#4a86c8'))
    pipe(cv, [(340, 98), (306, 98)], 5, LAKE, every=20); pipe(cv, [(306, 72), (340, 72)], 5, lit(LAKE, .25), every=20)
    qarrow(cv, 262, 66, 'd')
    pump(cv, 264, 126, 5)
    # ---------------- labels (placed in clear paper space)
    label(cv, 4, 9, 'RODS ENTER FROM TOP', '#3b2318')
    label(cv, 90, 1, 'PRESSURIZER 345°C', '#8a3828')
    label(cv, 30, 176, 'REACTOR VESSEL', '#3b2318'); label(cv, 30, 183, '15.5 MPA LIQUID', '#8a3828')
    label(cv, 112, 100, 'HOT', '#8a3828'); label(cv, 112, 107, 'LEG', '#8a3828'); label(cv, 112, 114, '325°C', '#8a3828')
    label(cv, 96, 186, 'COLD LEG 292°C', '#2a5a98')
    label(cv, 41, 52, 'HOT 325°C', '#fff8e4', bg='#8a3828') if False else None
    label(cv, 132+SX, 160, 'SG', '#3b2318'); label(cv, 146+SX, 159, 'PRIMARY IN TUBES', '#8a3828') if False else None
    label(cv, 138+SX, 41, 'DRYER', '#3b2318') if False else None
    label(cv, 162+SX, 3, 'STEAM ~6 MPA 275°C', '#5c666c')
    label(cv, 186+SX, 45, 'FEED', '#2a5a98')
    label(cv, 186+SX, 183, 'RCP', '#3b2318')
    label(cv, 236, 33, 'TURBINE', '#3b2318')
    label(cv, 236, 49, 'CONDENSER', '#3b2318')
    label(cv, 310, 64, 'LAKE OUT', '#1f6f6f'); label(cv, 310, 104, 'LAKE IN', '#1f6f6f')
    label(cv, 274, 123, 'FEED PUMP', '#3b2318')
    # ---------------- legend panel
    px_, py_ = 252, 142
    cv.r(px_, py_, 128, 70, OL); cv.r(px_+1, py_+1, 126, 68, hx('#fbf1da'))
    text(cv, px_+5, py_+5, 'PRIMARY COLOUR = TEMP', OL)
    scale_bar(cv, px_+5, py_+13, LO, HI, 112)
    legend_swatch(cv, px_+5, py_+31, hx('#4a86c8'), 'SECONDARY WATER')
    legend_swatch(cv, px_+5, py_+39, STEAM, 'STEAM (DOTS = BUBBLES)')
    legend_swatch(cv, px_+5, py_+47, LAKE, 'COOLING WATER')
    qarrow(cv, px_+84, py_+49, 'r'); text(cv, px_+101, py_+47, 'HEAT', OL)
    text(cv, px_+5, py_+58, 'PRIMARY NEVER BOILS', OL)
    return cv

def legend_box(cv, x, y, w, h):
    cv.r(x, y, w, h, OL); cv.r(x+1, y+1, w-2, h-2, hx('#fbf1da'))

def condenser_block(cv, lake=True):
    steel_box(cv, 232, 58, 74, 54, STEEL)
    cv.r(237, 63, 64, 44, STEAM)
    for k in range(6): cv.r(240, 70+k*5, 58, 2, LAKE); cv.r(240, 70+k*5, 58, 1, lit(LAKE, .3))
    bubbles(cv, 240, 64, 58, 6, 6, 9, STEAMD)
    cv.r(237, 100, 64, 7, hx('#4a86c8'))
    pipe(cv, [(340, 98), (306, 98)], 5, LAKE, every=20); pipe(cv, [(306, 72), (340, 72)], 5, lit(LAKE, .25), every=20)
    qarrow(cv, 262, 66, 'd')
    label(cv, 236, 49, 'CONDENSER', '#3b2318'); label(cv, 310, 64, 'LAKE OUT', '#1f6f6f'); label(cv, 310, 104, 'LAKE IN', '#1f6f6f')

def bwr():
    cv = Cv(W, H); paper(cv, W, H)
    LO, HI = 200, 330
    feed, sub, sat = tcol(216, LO, HI), tcol(278, LO, HI), tcol(288, LO, HI)
    VX = 20
    # ---------------- external piping first (vessel is pasted over the pipe ends)
    pipe(cv, [(264, 112), (264, 204), (8, 204), (8, 66), (VX+28, 66)], 6, WATER, every=46)       # condensate / feedwater
    pipe(cv, [(VX+96, 128), (138, 128), (138, 176), (VX+90, 176)], 6, sub, every=16)             # recirculation loop
    pipe(cv, [(VX+88, 33), (236, 33)], 6, STEAM, every=36)                                       # main steam line
    # ---------------- vessel drawn on its own layer, then pasted at +VX
    v = Cv(W, H)
    steel_box(v, 24, 22, 72, 156, STEEL)
    v.r(29, 27, 62, 146, sub)
    v.r(29, 27, 62, 34, STEAM)
    v.r(29, 61, 62, 1, hx('#fff8e4'))                                                              # water level
    for x in range(34, 86, 6):                                                                      # dryer vanes
        v.r(x, 36, 1, 8, STEELD)
    v.r(32, 34, 56, 2, STEELD); v.r(32, 45, 56, 2, STEELD)
    for sx_ in (40, 54, 68):                                                                        # swirl separators
        steel_box(v, sx_, 50, 10, 14, hx('#6a7f9a'))
        for yy in (53, 57, 61): v.r(sx_+2, yy, 6, 1, STEELL)
        arrow(v, sx_+5, 47, 'u', '#fff8e4', 2)
    for sx_ in (41, 55, 69):                                                                        # standpipes: two-phase
        v.r(sx_, 64, 8, 22, OL); v.r(sx_+1, 64, 6, 22, mix(sat, STEAM, .5))
        bubbles(v, sx_+1, 65, 6, 20, 5, sx_, STEAM)
    v.r(38, 86, 44, 2, STEELD); v.r(38, 88, 2, 56, STEELD); v.r(80, 88, 2, 56, STEELD)            # shroud
    v.r(40, 88, 40, 10, mix(sat, STEAM, .6)); bubbles(v, 40, 89, 40, 8, 12, 21, STEAM)
    core_top, core_bot = 98, 146
    for i, vf in enumerate((0, 0, .12, .25, .4, .55)):                                              # void fraction rises up the core
        yy = core_bot-(i+1)*8
        v.r(40, yy, 40, 8, mix(sat if i >= 2 else sub, STEAM, vf) if vf else sub)
        if vf: bubbles(v, 40, yy, 40, 8, int(2+vf*14), 30+i, STEAM)
    for a_ in range(4):
        ax = 41+a_*10
        v.r(ax+9, core_top, 1, 48, STEELD)
        for yy in range(core_top+2, core_bot, 4):
            for dx in (2, 4, 6): v.px(ax+dx, yy, drk(STEELD, .2))
    for gx in (50, 70):                                                                             # control blades from below
        v.r(gx-1, 128, 3, 40, OL); v.r(gx, 128, 1, 40, hx('#5a5a62'))
        v.r(gx-3, 144, 7, 3, OL); v.r(gx-2, 145, 5, 1, hx('#5a5a62'))
    v.r(38, 146, 44, 3, STEELD); v.r(40, 149, 40, 22, sub)
    for gx in (46, 56, 66, 76): v.r(gx, 149, 3, 22, STEELD)
    for gx in (44, 54, 64, 74):
        steel_box(v, gx, 178, 6, 16, hx('#6a7f9a')); v.r(gx+2, 194, 2, 4, OL)
    v.r(29, 62, 9, 108, sub); v.r(82, 62, 9, 108, sub)                                             # downcomer
    for jx in (31, 84):                                                                             # jet pumps
        v.r(jx, 76, 5, 66, STEELD); v.r(jx+1, 76, 3, 66, STEEL); v.r(jx-1, 138, 7, 6, STEELD)
        arrow(v, jx+2, 110, 'd', '#fff8e4', 2)
    v.r(29, 62, 9, 12, mix(feed, sub, .45)); v.r(82, 62, 9, 12, mix(feed, sub, .45))             # feedwater mixes in
    for xx in (50, 60, 70): arrow(v, xx, 132, 'u', '#fff8e4', 2); arrow(v, xx, 112, 'u', '#fff8e4', 2)
    arrow(v, 60, 160, 'u', '#fff8e4', 2); arrow(v, 33, 66, 'r', '#fff8e4', 2)
    v.r(92, 30, 6, 7, STEAM); v.r(22, 63, 6, 7, feed)
    cv.im.alpha_composite(v.im, (VX, 0))
    pump(cv, 138, 152, 8)
    # ---------------- balance of plant
    turbine_gen(cv, 236, 20)
    pipe(cv, [(282, 48), (282, 58)], 6, STEAM, arrows=False)
    condenser_block(cv)
    pump(cv, 264, 126, 5)
    steel_box(cv, 160, 198, 34, 12, hx('#6a7f9a')); text(cv, 165, 202, 'HEATER', hx('#fff8e4'))
    # ---------------- labels
    label(cv, VX+28, 11, 'REACTOR VESSEL 7.2 MPA', '#3b2318')
    label(cv, VX+96, 22, 'STEAM 288°C TO TURBINE', '#5c666c')
    label(cv, VX+101, 40, 'DRYER + SEPARATORS', '#3b2318')
    label(cv, VX+101, 60, 'WATER LEVEL', '#3b2318')
    label(cv, VX+101, 82, 'JET PUMPS', '#3b2318')
    label(cv, VX+101, 100, 'BOILING CORE', '#8a3828')
    label(cv, 150, 148, 'RECIRC', '#3b2318'); label(cv, 150, 155, 'PUMP', '#3b2318')
    label(cv, 13, 46, '216°C', '#2a5a98') if False else None
    label(cv, VX+27, 183, 'RODS ENTER FROM BELOW', '#3b2318') if False else None
    label(cv, VX+84, 186, 'RODS ENTER FROM BELOW', '#3b2318')
    label(cv, 274, 123, 'FEED PUMP', '#3b2318')
    label(cv, 242, 14, 'TURBINE', '#3b2318')
    label(cv, 12, 40, 'FEED', '#2a5a98'); label(cv, 12, 46, '216°C', '#2a5a98')
    # ---------------- legend
    legend_box(cv, 276, 136, 104, 68)
    text(cv, 281, 141, 'LIQUID COLOUR = TEMP', OL)
    scale_bar(cv, 281, 149, LO, HI, 91)
    legend_swatch(cv, 281, 167, STEAM, 'STEAM / BUBBLES')
    legend_swatch(cv, 281, 175, WATER, 'CONDENSATE')
    legend_swatch(cv, 281, 183, LAKE, 'COOLING WATER')
    text(cv, 281, 192, 'BOILS IN CORE. NO SG.', OL)
    return cv

GRAPH = hx('#4e5560'); GRAPHL = hx('#6a7280'); HE = hx('#d4cce6'); COOLSALT = hx('#d8b050'); ICE = hx('#b8e0f0')

def msr():
    cv = Cv(W, H); paper(cv, W, H)
    LO, HI = 625, 670
    cold, hot = tcol(635, LO, HI), tcol(663, LO, HI)
    # ---------------- fuel salt loop pipes
    pipe(cv, [(84, 60), (133, 60)], 7, hot, every=26)                                                   # vessel outlet -> pump bowl
    pipe(cv, [(133, 86), (133, 96), (166, 96), (166, 108)], 7, hot, every=18)                           # pump -> exchanger shell (hot)
    pipe(cv, [(226, 108), (226, 8), (8, 8), (8, 52), (28, 52)], 7, cold, every=48)                      # cooled fuel salt back to vessel
    # ---------------- reactor vessel
    steel_box(cv, 26, 40, 60, 112, STEEL)
    cv.r(31, 45, 50, 102, cold)
    # downcomer annulus (salt flows DOWN the outside), lower plenum
    cv.r(31, 45, 6, 94, cold); cv.r(75, 45, 6, 94, cold); cv.r(31, 132, 50, 15, cold)
    cv.r(37, 50, 2, 84, STEELD); cv.r(73, 50, 2, 84, STEELD); cv.r(37, 132, 38, 2, STEELD)           # core can
    cv.r(39, 50, 34, 18, hot)                                                                          # upper plenum (hot)
    # graphite stringers with fuel-salt slots; slot colour = salt temperature (bottom cold -> top hot)
    cv.r(39, 68, 34, 64, GRAPH)
    for i in range(6):
        sx_ = 41+i*6
        cv.r(sx_-1, 68, 1, 64, drk(GRAPH, .2)); cv.r(sx_, 68, 1, 64, GRAPHL)
        for bnd in range(7):
            yy = 132-(bnd+1)*9
            cv.r(sx_+3, max(yy, 68), 2, 9, tcol(635+(663-635)*(bnd+.5)/7, LO, HI))
    # control rod thimble from above
    cv.r(53, 30, 6, 40, STEELD); cv.r(54, 30, 4, 40, STEEL); cv.r(55, 38, 2, 40, OL)
    steel_box(cv, 50, 24, 12, 8, hx('#6a7f9a'))
    for yy in (82, 100, 118): arrow(cv, 57, yy, 'u', '#fff8e4', 2) if False else None
    for xx in (44, 56, 68):
        arrow(cv, xx, 124, 'u', '#fff8e4', 2); arrow(cv, xx, 90, 'u', '#fff8e4', 2)
    for yy in (62, 96): arrow(cv, 34, yy, 'd', '#fff8e4', 2); arrow(cv, 78, yy, 'd', '#fff8e4', 2)
    cv.r(82, 56, 6, 8, hot); cv.r(24, 48, 6, 8, cold)
    # drain line, freeze plug, drain tank
    pipe(cv, [(56, 152), (56, 172)], 5, cold, arrows=False)
    cv.r(50, 158, 12, 8, OL); cv.r(51, 159, 10, 6, ICE)
    for k in range(4): cv.r(52+k*2, 160, 1, 4, hx('#fff8e4'))
    for k in range(3): arrow(cv, 38+k*0, 162, 'r', '#fff8e4', 2) if False else None
    steel_box(cv, 28, 172, 56, 34, STEEL)
    cv.r(33, 177, 46, 24, hx('#2a1610')); cv.r(33, 189, 46, 12, hot)              # salt level in the drain tank
    for k in range(4): cv.r(38+k*10, 180, 1, 21, hx('#3a78c0'))                    # tank cooling tubes
    # ---------------- pump bowl
    steel_box(cv, 120, 40, 26, 46, STEEL)
    cv.r(125, 45, 16, 36, hot); cv.r(125, 45, 16, 12, HE); stipple(cv, 125, 46, 16, 10, hx('#fff8e4'), 4)
    cv.r(125, 57, 16, 1, hx('#fff8e4'))
    cv.r(132, 40, 2, 34, STEELD); cv.r(128, 74, 10, 3, STEELD)                      # shaft + impeller
    steel_box(cv, 127, 26, 12, 14, hx('#6a7f9a'))
    pipe(cv, [(146, 48), (162, 48), (162, 30), (184, 30)], 3, HE, every=20)         # off-gas line
    steel_box(cv, 184, 22, 36, 16, hx('#7a8a8a')); text(cv, 188, 27, 'OFF-GAS', hx('#fff8e4'))
    # ---------------- heat exchanger (shell: fuel salt, tubes: coolant salt)
    steel_box(cv, 156, 108, 80, 36, STEEL)
    cv.r(161, 113, 70, 26, hot)
    for k in range(7):          # fuel cools left -> right (band by x)
        cv.r(161+k*10, 113, 10, 26, tcol(663-(663-635)*(k+.5)/7, LO, HI))
    for yy in (120, 128, 136): cv.r(161, yy-0, 70, 1, drk(hot, .0)) if False else None
    for yy, c in ((118, COOLSALT), (123, COOLSALT), (131, COOLSALT), (136, COOLSALT)):
        cv.r(163, yy, 66, 3, OL); cv.r(163, yy+1, 66, 1, c)
    cv.r(163, 118, 2, 21, OL)
    for xx in (190, 214): cv.r(xx, 113, 2, 14, STEELD); cv.r(xx+8, 125, 2, 14, STEELD)          # baffles
    pipe(cv, [(236, 134), (250, 134), (250, 140), (292, 140)], 5, COOLSALT, every=30)
    pipe(cv, [(236, 114), (270, 114), (270, 76), (292, 76)], 5, COOLSALT, every=30)
    # ---------------- steam generator
    steel_box(cv, 292, 58, 44, 94, STEEL)
    cv.r(297, 63, 34, 84, hx('#4a86c8'))
    cv.r(297, 63, 34, 26, STEAM); bubbles(cv, 297, 64, 34, 24, 8, 13, STEAMD); cv.r(297, 89, 34, 1, hx('#fff8e4'))
    for k in range(4):
        xl, xr = 302+k*3, 326-k*3
        cv.r(xl, 74+k*2, 1, 66, COOLSALT); cv.r(xr, 74+k*2, 1, 66, lit(COOLSALT, .0)); cv.r(xl, 73+k*2, xr-xl+1, 1, COOLSALT)
    pipe(cv, [(314, 58), (314, 40), (376, 40)], 6, STEAM, every=22)
    pipe(cv, [(376, 130), (336, 130)], 6, WATER, every=20)
    qarrow(cv, 300, 100, 'r') if False else None
    pump(cv, 271, 140, 6)
    # ---------------- Q arrow
    qarrow(cv, 190, 100, 'd')
    # ---------------- labels
    label(cv, 30, 31, 'REACTOR VESSEL', '#3b2318') if False else None
    label(cv, 14, 15, 'FUEL SALT 635°C BACK TO VESSEL', '#2a5a98')
    label(cv, 90, 52, '663°C', '#8a3828') if False else None
    label(cv, 66, 24, 'ROD', '#3b2318') if False else None
    label(cv, 26, 154, 'GRAPHITE CORE', '#3b2318') if False else None
    label(cv, 90, 100, 'GRAPHITE', '#3b2318'); label(cv, 90, 107, 'MODERATOR', '#3b2318')
    label(cv, 90, 114, '+ FUEL SLOTS', '#3b2318')
    label(cv, 89, 43, 'OUT', '#8a3828'); label(cv, 89, 50, '663°C', '#8a3828')
    label(cv, 66, 159, 'FREEZE PLUG', '#3b2318'); label(cv, 66, 166, '(SOLID SALT)', '#3b2318'); label(cv, 90, 190, 'DRAIN TANK', '#3b2318')
    label(cv, 90, 197, 'SUBCRITICAL', '#3b2318')
    label(cv, 12, 40, 'IN', '#2a5a98') if False else None
    label(cv, 150, 66, 'PUMP BOWL', '#3b2318'); label(cv, 150, 73, 'FUEL SALT +', '#3b2318'); label(cv, 150, 80, 'HELIUM GAS', '#3b2318'); label(cv, 118, 97, 'HE COVER GAS', '#3b2318') if False else None
    label(cv, 160, 146, 'FUEL SALT / COOLANT SALT EXCHANGER', '#3b2318') if False else None
    label(cv, 158, 148, 'HEAT EXCHANGER', '#3b2318')
    label(cv, 240, 124, 'COOLANT', '#8a6a18') if False else None
    label(cv, 238, 94, 'COOLANT', '#8a6a18'); label(cv, 238, 101, 'SALT', '#8a6a18')
    label(cv, 294, 154, 'STEAM GENERATOR', '#3b2318')
    label(cv, 314, 30, 'STEAM TO TURBINE', '#5c666c')
    label(cv, 344, 120, 'FEED', '#2a5a98')
    # ---------------- legend
    legend_box(cv, 180, 164, 200, 48)
    text(cv, 185, 169, 'FUEL SALT COLOUR = TEMP', OL)
    scale_bar(cv, 185, 177, LO, HI, 91)
    legend_swatch(cv, 285, 167, COOLSALT, 'COOLANT SALT')
    legend_swatch(cv, 285, 175, GRAPH, 'GRAPHITE')
    legend_swatch(cv, 285, 183, HE, 'HELIUM GAS')
    legend_swatch(cv, 285, 191, ICE, 'FROZEN PLUG')
    text(cv, 185, 195, 'FUEL IS THE COOLANT.', OL); text(cv, 185, 202, '~0.2 MPA, NOT 15.', OL)
    return cv

def pebble():
    cv = Cv(W, H); paper(cv, W, H)
    LO, HI = 250, 750
    cold, hot = tcol(250, LO, HI), tcol(750, LO, HI)
    PEB = hx('#5a5e66')
    # ---------------- pipes first
    pipe(cv, [(100, 154), (178, 154), (178, 74)], 6, hot, every=26)                                        # hot duct -> SG riser
    pipe(cv, [(166, 46), (134, 46), (134, 134), (100, 134)], 6, cold, every=28)                         # cold return: blower -> vessel
    # pebble handling loop (graphite pebbles ride in a tube; lifted back to the top)
    pipe(cv, [(63, 172), (63, 184)], 5, hx('#8a8e96'), arrows=False)
    pipe(cv, [(46, 192), (12, 192), (12, 12), (63, 12), (63, 52)], 5, hx('#8a8e96'), every=60)
    # ---------------- reactor vessel
    steel_box(cv, 30, 24, 66, 146, STEEL)
    cv.r(35, 29, 56, 136, GRAPH)                                                                           # graphite reflector
    for yy in range(33, 160, 12): cv.r(35, yy, 56, 1, drk(GRAPH, .2))                                      # block joints
    # side-reflector risers (cold helium goes UP) + top plenum
    for rx in (39, 83): cv.r(rx, 40, 4, 100, cold); arrow(cv, rx+2, 120, 'u', '#fff8e4', 2); arrow(cv, rx+2, 80, 'u', '#fff8e4', 2)
    cv.r(39, 38, 48, 8, cold); arrow(cv, 52, 42, 'r', '#fff8e4', 2); arrow(cv, 74, 42, 'r', '#fff8e4', 2) if False else None
    cv.r(35, 134, 56, 4, cold)                                                                             # inlet header feeding the risers
    # control rods in side reflector (from above)
    for rx in (46, 76):
        cv.r(rx, 14, 4, 18, hx('#6a7f9a')); cv.r(rx, 14, 4, 1, OL); cv.r(rx+1, 31, 2, 54, OL); cv.r(rx+1, 31, 1, 54, hx('#5a5a62'))
        cv.r(rx, 32, 4, 30, drk(GRAPH, .35)) if False else None
    # pebble bed cavity: helium gradient (cold top -> hot bottom) behind the pebbles
    bx0, bx1, by0, by1 = 50, 76, 50, 126
    bands = 7; bh = (by1-by0)//bands+1
    for b in range(bands): cv.r(bx0, by0+b*bh, bx1-bx0, bh, tcol(LO+(HI-LO)*(b+.5)/bands, LO, HI))
    # conical discharge (stair steps) in graphite
    for i in range(10):
        wdt = (bx1-bx0)-2*i*2-(0)
        if wdt < 6: break
        cv.r(bx0+i*2, by1+i*2, wdt, 2, tcol(HI-10, LO, HI))
    for i in range(10):
        cv.r(bx0, by1+i*2, i*2, 2, GRAPH); cv.r(bx1-i*2, by1+i*2, i*2, 2, GRAPH)
    cv.r(60, 146, 6, 26, STEELD); cv.r(61, 146, 4, 26, PEB)
    # pebbles: staggered rows
    for ry, yy in enumerate(range(by0+3, by1+2, 5)):
        for xx in range(bx0+3+(ry % 2)*3, bx1-2, 6):
            cv.circle(xx, yy, 2, PEB, True); cv.px(xx-1, yy-1, hx('#9aa0aa'))
    cv.circle(63, 150, 2, PEB) if False else None
    for yy in (60, 80, 100): arrow(cv, 63, yy, 'd', '#fff8e4', 2) if False else None
    # helium flow arrows down through the bed (white, between pebbles) and pebble flow arrows
    for xx in (53, 73): arrow(cv, xx, 70, 'd', '#fff8e4', 2); arrow(cv, xx, 104, 'd', '#fff8e4', 2)
    # hot plenum + exit
    cv.r(46, 140, 34, 16, hot); cv.r(46, 140, 34, 1, hx('#fff8e4')) if False else None
    cv.r(60, 146, 6, 10, PEB) if False else None
    arrow(cv, 52, 148, 'r', '#fff8e4', 2) if False else None
    cv.r(92, 150, 6, 8, hot)
    # ---------------- burnup station and spent tank
    steel_box(cv, 46, 184, 34, 16, hx('#6a7f9a')); text(cv, 51, 189, 'BURNUP', hx('#fff8e4'))
    pipe(cv, [(80, 192), (92, 192)], 5, hx('#8a8e96'), arrows=False)
    steel_box(cv, 92, 184, 30, 16, hx('#7a8a8a')); text(cv, 96, 189, 'SPENT', hx('#fff8e4'))
    # ---------------- steam generator (helium shell side, water/steam in helical tubes)
    steel_box(cv, 150, 60, 56, 118, STEEL)
    cv.r(155, 65, 46, 108, hx('#2a1610'))
    # cold annulus (left and right) going UP to the blower
    cv.r(155, 65, 4, 108, cold); cv.r(197, 65, 4, 108, cold)
    for yy in (90, 130): arrow(cv, 157, yy, 'u', '#fff8e4', 2); arrow(cv, 199, yy, 'u', '#fff8e4', 2)
    # shell side: helium cools downward (750 at top -> 250 at bottom)
    sh_top, sh_bot = 70, 168
    for b in range(7):
        y0 = sh_top+b*14
        cv.r(159, y0, 38, 14, tcol(HI-(HI-LO)*(b+.5)/7, LO, HI))
    # helical tubes: water (blue) low, steam (pale) high; drawn as stair-step coils
    for yy in range(74, 166, 6):
        steam_part = yy < 108
        c = STEAM if steam_part else hx('#4a86c8')
        for k, xx in enumerate(range(161, 195, 8)):
            cv.r(xx, yy+(k % 2)*2, 8, 2, OL); cv.r(xx, yy+(k % 2)*2, 8, 1, c)
    # central hot riser
    cv.r(175, 70, 6, 90, hot); cv.r(175, 70, 6, 1, hx('#fff8e4')); cv.r(176, 71, 1, 88, lit(hot, .3))
    arrow(cv, 178, 110, 'u', '#fff8e4', 2); arrow(cv, 178, 138, 'u', '#fff8e4', 2)
    for xx in (165, 191): arrow(cv, xx, 120, 'd', '#fff8e4', 2); arrow(cv, xx, 90, 'd', '#fff8e4', 2)
    # blower
    steel_box(cv, 164, 34, 30, 28, hx('#6a7f9a')); cv.circle(179, 48, 8, STEELD); cv.r(177, 46, 5, 5, hx('#e0c860'))
    # steam + feedwater
    pipe(cv, [(206, 76), (376, 76)], 6, STEAM, every=40)
    pipe(cv, [(376, 160), (206, 160)], 6, WATER, every=40)
    qarrow(cv, 183, 96, 'r') if False else None
    # ---------------- decay heat path
    for yy in (62, 74): qarrow(cv, 100, yy, 'r')
    # ---------------- pebble + TRISO inset
    ix, iy = 226, 92
    cv.r(ix, iy, 152, 62, OL); cv.r(ix+1, iy+1, 150, 60, hx('#fbf1da'))
    # pebble cross-section
    pcx, pcy, pr = ix+30, iy+37, 21
    cv.d.ellipse([pcx-pr-1, pcy-pr-1, pcx+pr, pcy+pr], fill=OL)
    cv.d.ellipse([pcx-pr, pcy-pr, pcx+pr-1, pcy+pr-1], fill=hx('#7a828e'))                  # graphite shell (fuel-free)
    cv.d.ellipse([pcx-pr+5, pcy-pr+5, pcx+pr-6, pcy+pr-6], fill=hx('#5e6672'))             # fuel zone
    import random as _r
    rr = _r.Random(11)
    for _ in range(46):
        a = rr.random()*math.tau; d = rr.random()*(pr-9)
        cv.r(int(pcx+math.cos(a)*d), int(pcy+math.sin(a)*d), 2, 2, hx('#e8a030'))
    text(cv, ix+4, iy+4, 'PEBBLE 60 MM', OL)
    cv.r(pcx+pr, pcy-4, 14, 1, OL)
    # TRISO onion
    tcx, tcy = ix+84, iy+38
    rings = [(17, '#3b2318'), (16, '#7a828e'), (14, '#e0d8c0'), (12, '#5a4a4a'), (9, '#c0b8a8'), (5, '#a82a3a')]
    for r_, c in rings: cv.d.ellipse([tcx-r_, tcy-r_, tcx+r_-1, tcy+r_-1], fill=hx(c))
    for k in range(10):
        a = k/10*math.tau; cv.px(int(tcx+math.cos(a)*7), int(tcy+math.sin(a)*7), hx('#8a8070'))   # buffer porosity
    text(cv, ix+68, iy+4, 'TRISO 0.9 MM', OL)
    for i, (lab, rad, ang) in enumerate((('UO2 KERNEL', 3, -.9), ('BUFFER', 7, -.45), ('PYC', 10, 0), ('SIC', 12.5, .45), ('PYC', 15, .9))):
        px_, py_ = int(tcx+math.cos(ang)*rad), int(tcy+math.sin(ang)*rad)
        ly = iy+14+i*9
        cv.r(px_, ly+2, 118+ix-px_+8, 1, OL) if False else None
    labels = ['UO2 KERNEL', 'BUFFER', 'PYC', 'SIC', 'PYC']
    for i, lab in enumerate(labels):
        text(cv, ix+104, iy+14+i*8, lab, OL)
        rad = (3, 7, 10, 12.5, 15)[i]; ang = (-.7, -.4, -.15, .1, .35)[i]
        px_, py_ = int(tcx+math.cos(ang)*rad), int(tcy+math.sin(ang)*rad)
        cv.r(px_, iy+16+i*8, ix+102-px_, 1, OL)
        cv.px(px_, iy+16+i*8, OL)
    # ---------------- labels
    label(cv, 16, 4, 'PEBBLES LIFTED BACK TO THE TOP', '#3b2318') if False else None
    label(cv, 16, 2, 'PEBBLES LIFTED BACK TO TOP', '#3b2318')
    label(cv, 100, 170, 'VESSEL 7 MPA', '#3b2318')
    label(cv, 100, 96, 'DECAY', '#8a3828') if False else None
    label(cv, 100, 84, 'DECAY HEAT', '#8a3828') if False else None
    label(cv, 106, 86, 'DECAY', '#8a3828'); label(cv, 106, 92, 'HEAT', '#8a3828'); label(cv, 106, 98, 'OUT', '#8a3828')
    label(cv, 36, 8, 'RODS IN SIDE', '#3b2318') if False else None
    label(cv, 100, 52, '', '#3b2318')
    label(cv, 104, 36, 'COLD', '#2a5a98'); label(cv, 104, 42, 'HELIUM', '#2a5a98'); label(cv, 104, 48, '250°C', '#2a5a98')
    label(cv, 108, 161, 'HOT 750°C', '#8a3828')
    label(cv, 66, 126, '', '#3b2318')
    label(cv, 150, 182, 'STEAM GENERATOR', '#3b2318')
    label(cv, 212, 64, 'STEAM ~13 MPA 567°C', '#5c666c')
    label(cv, 212, 165, 'FEED WATER', '#2a5a98')
    label(cv, 164, 26, 'BLOWER', '#3b2318')
    label(cv, 84, 184, '', '#3b2318')
    label(cv, 80, 200, 'BURNUP CHECK: REUSE OR DISCARD', '#3b2318') if False else None
    label(cv, 130, 187, 'FUEL BALLS', '#3b2318') if False else None
    label(cv, 130, 192, 'REUSE OR DISCARD', '#3b2318')
    # ---------------- legend
    legend_box(cv, 226, 173, 154, 39)
    text(cv, 231, 176, 'HELIUM COLOUR = TEMP', OL)
    scale_bar(cv, 231, 183, LO, HI, 91)
    legend_swatch(cv, 331, 178, PEB, 'PEBBLE', 8) if False else None
    cv.circle(335, 184, 3, PEB); text(cv, 341, 182, 'PEBBLE', OL)
    legend_swatch(cv, 331, 187, STEAM, 'STEAM', 8) if False else None
    text(cv, 231, 199, 'GAS COOLED. GRAPHITE MODERATES.', OL)
    return cv

if __name__ == '__main__':
    names = sys.argv[1:] or ['pwr']
    for n in names:
        cv = globals()[n](); save(cv, n); print(n, cv.w, cv.h)
