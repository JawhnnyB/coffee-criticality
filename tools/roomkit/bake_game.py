#!/usr/bin/env python3
"""Bake the room-kit art into files the engine can blit. Does not touch content.ts."""
import os, sys, json, re
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
os.chdir(ROOT)
sys.path.insert(0, str(ROOT / "tools" / "roomkit"))
sys.path.insert(0, str(ROOT / "docs" / "preview" / "style-test"))
import render_rooms as rr
from kit import *
import bake_a5
import bake_a6

ART = ROOT / "public" / "art"
ROOMS_DIR = ART / "rooms"
PROP_DIR = ART / "gen" / "props"
TILE_DIR = ART / "gen" / "tiles"
SPRITE_DIR = ART / "gen" / "sprites"
IDS = ["cafe", "parlor", "corridor", "control", "engineering", "breakroom", "reactor", "maintenance"]


def diff(a, b):
    if a.size != b.size:
        return -1
    ba, bb = a.convert("RGBA").load(), b.convert("RGBA").load()
    n = 0
    for y in range(a.size[1]):
        for x in range(a.size[0]):
            if ba[x, y] != bb[x, y]:
                n += 1
    return n


def bbox(im):
    a = im.split()[-1]
    return a.getbbox()


def bake_rooms():
    stamps = {}
    for rid in IDS:
        target = rr.render_room(rid, chars=False).im
        ref = Image.open(ROOT / "reference" / f"{rid}.png").convert("RGBA")
        full = rr.render_room(rid, chars=True).im
        n = diff(full, ref)
        if n != 0:
            raise SystemExit(f"{rid} reference drifted by {n}px")
        shell = rr.render_room(rid, chars=False, which=-1, border_on=False).im
        props = sorted(rr.ROOMS[rid]["props"], key=lambda pr: (pr["kind"] == "rug" and -1 or 0, pr["rect"][1] + pr["rect"][3]))
        comp = shell.copy()
        room_dir = ROOMS_DIR / rid
        room_dir.mkdir(parents=True, exist_ok=True)
        entries = []
        for i, pr in enumerate(props):
            alone = Cv(target.size[0], target.size[1])
            # draw just this prop, with the cabinet hue counter intact
            state = {"cab": 0}
            for j, q in enumerate(props):
                if j == i:
                    rr.draw_prop(alone, rid, ROOM[rid], q, j, state)
                elif q["kind"].startswith("cab_") and q["kind"] != "cab_lototo":
                    state["cab"] += 1
            box = bbox(alone.im)
            if not box:
                continue
            crop = alone.im.crop(box)
            name = f"p{i}.png"
            crop.save(room_dir / name)
            x, y = pr["rect"][0] * T, pr["rect"][1] * T
            foot = int((pr["rect"][1] + pr["rect"][3]) * T)
            entries.append({
                "src": f"/art/rooms/{rid}/{name}?v=a6",
                "x": box[0], "y": box[1], "foot": foot, "kind": pr["kind"],
            })
            comp.alpha_composite(alone.im)
        edge = Cv(comp.size[0], comp.size[1])
        border(edge, comp.size[0], comp.size[1])
        edged = comp.copy()
        edged.alpha_composite(edge.im)
        n = diff(edged, target)
        if n != 0:
            raise SystemExit(f"{rid} shell+props differ from the kit by {n}px")
        shell.save(room_dir / "shell.png")
        stamps[rid] = entries
        print(rid, "props", len(entries), "shell", shell.size)
    return stamps


def bake_kind_pngs():
    """One transparent PNG per kind, at PROP_NATIVE, so the flat fallback is unused."""
    text = (ROOT / "src/game/artSpec.ts").read_text()
    native = {}
    for m in re.finditer(r"(\w+): \{ w: (\d+), h: (\d+) \}", text):
        native[m.group(1)] = (int(m.group(2)), int(m.group(3)))
    PROP_DIR.mkdir(parents=True, exist_ok=True)
    cabs = ["cab_catch", "cab_delay", "cab_rods", "cab_load", "cab_phys", "cab_pebble",
            "cab_fish", "cab_golf", "cab_bowl", "cab_horde", "cab_plot", "cab_floor"]
    for i, kind in enumerate(cabs):
        w, h = native.get(kind, (32, 48))
        cv = Cv(w + 8, h + 8)
        d_cab(cv, 4, 4, w, h, HUES[i % len(HUES)], kind)
        box = bbox(cv.im)
        cv.im.crop(box).save(PROP_DIR / f"{kind}.png")
    for kind, (w, h) in native.items():
        if kind.startswith("cab_") or kind in ("arcade",):
            continue
        fn = PROP.get(kind)
        if not fn:
            continue
        cv = Cv(w + 16, h + 24)
        try:
            fn(cv, 8, 12, w, h)
        except TypeError:
            fn(cv, 8, 12, w, h, "")
        box = bbox(cv.im)
        if box:
            cv.im.crop(box).save(PROP_DIR / f"{kind}.png")


def bake_tiles():
    TILE_DIR.mkdir(parents=True, exist_ok=True)
    # 16px samples. Wood seams in the rooms are 40px, so the shell is what the
    # room actually shows. These tiles are the fallback cell.
    samples = {
        "wood": "cafe", "carpet": "parlor", "check": "corridor",
        "slab": "control", "grate": "reactor", "grate2": "maintenance",
    }
    for name, rid in samples.items():
        cv = Cv(64, 80)
        floor(cv, ROOM[rid], 0, 16, 64, 64)
        cv.im.crop((0, 48, 16, 64)).save(TILE_DIR / f"a6_{name}.png")
    for rid, p in ROOM.items():
        cv = Cv(48, 48)
        wall(cv, p, 48)
        cv.im.save(TILE_DIR / f"a6_wall_{rid}.png")


def bake_sprites():
    grids = bake_a5.load_grids()
    who_build = {}
    for who in ("player", "holt", "marcus", "priya", "jordan"):
        who_build[who] = bake_a5.build(who, grids)
    for who in ("mabel", "elena", "tommy"):
        who_build[who] = bake_a6.build(who, grids)
    SPRITE_DIR.mkdir(parents=True, exist_ok=True)
    ox, oy = 4, 28  # canvas row 35 (outline under the sole) lands on the cell bottom
    order = (("down", 0), ("right", 1), ("up", 2))

    def into_cell(fr):
        cell = Image.new("RGBA", (32, 64), (0, 0, 0, 0))
        sx0, sy0 = max(0, -ox), max(0, -oy)
        sx1, sy1 = min(fr.width, 32 - ox), min(fr.height, 64 - oy)
        if sx1 > sx0 and sy1 > sy0:
            cell.alpha_composite(fr.crop((sx0, sy0, sx1, sy1)), (ox + sx0, oy + sy0))
        return cell

    for who, cyc in who_build.items():
        sheet = Image.new("RGBA", (128, 192), (0, 0, 0, 0))
        for view, row in order:
            for frame in range(4):
                cell = into_cell(Image.fromarray(cyc[view][frame]))
                sheet.alpha_composite(cell, (frame * 32, row * 64))
        sheet.save(SPRITE_DIR / f"{who}_walk4.png")
        into_cell(Image.fromarray(cyc["down"][1])).save(SPRITE_DIR / f"{who}_idle_32.png")
        print("sprite", who)


GATE_STAMP_LINES = [
    '{ src: "/art/rooms/gate/p0.png?v=a6", x: 32, y: 108, foot: 240, kind: "roof" },',
    '{ src: "/art/rooms/gate/p1.png?v=a6", x: 32, y: 256, foot: 384, kind: "roof" },',
    '{ src: "/art/rooms/gate/p2.png?v=a6", x: 848, y: 128, foot: 288, kind: "roof" },',
    '{ src: "/art/rooms/gate/p3.png?v=a6", x: 896, y: 34, foot: 128, kind: "roof" },',
    '{ src: "/art/rooms/gate/p4.png?v=a6", x: 832, y: 320, foot: 448, kind: "roof" },',
    '{ src: "/art/rooms/gate/p5.png?v=a6", x: 1088, y: 176, foot: 320, kind: "roof" },',
    '{ src: "/art/rooms/gate/p6.png?v=a6", x: 1248, y: 96, foot: 192, kind: "roof" },',
    '{ src: "/art/rooms/gate/p7.png?v=a6", x: 1120, y: 352, foot: 480, kind: "roof" },',
    '{ src: "/art/rooms/gate/p8.png?v=a6", x: 1120, y: 44, foot: 160, kind: "stack" },',
    '{ src: "/art/rooms/gate/p9.png?v=a6", x: 1184, y: 44, foot: 160, kind: "stack" },',
    '{ src: "/art/rooms/gate/p10.png?v=a6", x: 256, y: 228, foot: 272, kind: "van" },',
    '{ src: "/art/rooms/gate/p11.png?v=a6", x: 368, y: 306, foot: 336, kind: "boom" },',
    '{ src: "/art/rooms/gate/p12.png?v=a6", x: 314, y: 190, foot: 196, kind: "lamp" },',
    '{ src: "/art/rooms/gate/p13.png?v=a6", x: 570, y: 190, foot: 196, kind: "lamp" },',
    '{ src: "/art/rooms/gate/p14.png?v=a6", x: 127, y: 86, foot: 128, kind: "plant" },',
    '{ src: "/art/rooms/gate/p15.png?v=a6", x: 224, y: 339, foot: 352, kind: "fence" },',
    '{ src: "/art/rooms/gate/p16.png?v=a6", x: 256, y: 339, foot: 352, kind: "fence" },',
    '{ src: "/art/rooms/gate/p17.png?v=a6", x: 288, y: 339, foot: 352, kind: "fence" },',
    '{ src: "/art/rooms/gate/p18.png?v=a6", x: 320, y: 339, foot: 352, kind: "fence" },',
    '{ src: "/art/rooms/gate/p19.png?v=a6", x: 448, y: 339, foot: 352, kind: "fence" },',
    '{ src: "/art/rooms/gate/p20.png?v=a6", x: 480, y: 339, foot: 352, kind: "fence" },',
    '{ src: "/art/rooms/gate/p21.png?v=a6", x: 512, y: 339, foot: 352, kind: "fence" },',
    '{ src: "/art/rooms/gate/p22.png?v=a6", x: 544, y: 339, foot: 352, kind: "fence" },',
    '{ src: "/art/rooms/gate/p23.png?v=a6", x: 576, y: 339, foot: 352, kind: "fence" },',
    '{ src: "/art/rooms/gate/p24.png?v=a6", x: 608, y: 339, foot: 352, kind: "fence" },',
    '{ src: "/art/rooms/gate/p25.png?v=a6", x: 640, y: 339, foot: 352, kind: "fence" },',
    '{ src: "/art/rooms/gate/p26.png?v=a6", x: 46, y: 325, foot: 360, kind: "plant" },',
    '{ src: "/art/rooms/gate/p27.png?v=a6", x: 136, y: 385, foot: 420, kind: "plant" },',
    '{ src: "/art/rooms/gate/p28.png?v=a6", x: 286, y: 375, foot: 410, kind: "plant" },',
    '{ src: "/art/rooms/gate/p29.png?v=a6", x: 406, y: 345, foot: 380, kind: "plant" },',
    '{ src: "/art/rooms/gate/p30.png?v=a6", x: 506, y: 435, foot: 470, kind: "plant" },',
    '{ src: "/art/rooms/gate/p31.png?v=a6", x: 686, y: 385, foot: 420, kind: "plant" },',
    '{ src: "/art/rooms/gate/p32.png?v=a6", x: 786, y: 525, foot: 560, kind: "plant" },',
    '{ src: "/art/rooms/gate/p33.png?v=a6", x: 626, y: 525, foot: 560, kind: "plant" },',
    '{ src: "/art/rooms/gate/p34.png?v=a6", x: 106, y: 525, foot: 560, kind: "plant" },',
    '{ src: "/art/rooms/gate/p35.png?v=a6", x: 236, y: 555, foot: 590, kind: "plant" },',
    '{ src: "/art/rooms/gate/p36.png?v=a6", x: 1366, y: 105, foot: 140, kind: "plant" },',
    '{ src: "/art/rooms/gate/p37.png?v=a6", x: 1436, y: 295, foot: 330, kind: "plant" },',
    '{ src: "/art/rooms/gate/p38.png?v=a6", x: 1466, y: 485, foot: 520, kind: "plant" },',
    '{ src: "/art/rooms/gate/p39.png?v=a6", x: 986, y: 565, foot: 600, kind: "plant" },',
    '{ src: "/art/rooms/gate/p40.png?v=a6", x: 1216, y: 365, foot: 400, kind: "plant" },',
    '{ src: "/art/rooms/gate/p41.png?v=a6", x: 256, y: 98, foot: 109, kind: "bench" },',
    '{ src: "/art/rooms/gate/p42.png?v=a6", x: 480, y: 98, foot: 109, kind: "bench" },',
    '{ src: "/art/rooms/gate/p43.png?v=a6", x: 752, y: 98, foot: 109, kind: "bench" },',
]

def write_ts(stamps):
    lines = [
        "/** Generated by tools/roomkit/bake_game.py. Room art, not collision. */",
        "export type RoomStamp = { src: string; x: number; y: number; foot: number; kind: string };",
        "export const ROOM_SHELL: Record<string, string> = {",
    ]
    for rid in list(IDS) + ["gate"]:
        lines.append(f'  {rid}: "/art/rooms/{rid}/shell.png?v=a6",')
    lines.append("};")
    lines.append("export const ROOM_STAMPS: Record<string, RoomStamp[]> = {")
    for rid, entries in stamps.items():
        lines.append(f"  {rid}: [")
        for e in entries:
            lines.append(
                f'    {{ src: "{e["src"]}", x: {e["x"]}, y: {e["y"]}, foot: {e["foot"]}, kind: "{e["kind"]}" }},'
            )
        lines.append("  ],")
    lines.append("  gate: [")
    lines.extend(GATE_STAMP_LINES)
    lines.append("  ],")
    lines.append("};")
    # Enabled set grows as rooms are wired. Cafe and parlor first.
    lines.append(
        'export const A6_ROOMS = new Set(["cafe", "parlor", "corridor", "control", "engineering", "breakroom", "reactor", "maintenance", "gate"]);'
    )
    (ROOT / "src/game/roomArt.ts").write_text("\n".join(lines) + "\n")


def main():
    stamps = bake_rooms()
    bake_kind_pngs()
    bake_tiles()
    bake_sprites()
    write_ts(stamps)
    print("baked")


if __name__ == "__main__":
    main()
