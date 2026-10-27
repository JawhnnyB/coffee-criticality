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
    # Cell is the engine's 32x64. The 24x40 drawing sits so grid row 26 (the
    # sole) lands on the bottom row of the cell.
    ox, oy = 4, 63 - (bake_a5.GY + 26)
    order = (("down", 0), ("right", 1), ("up", 2))
    for who, cyc in who_build.items():
        sheet = Image.new("RGBA", (128, 192), (0, 0, 0, 0))
        for view, row in order:
            for frame in range(4):
                fr = Image.fromarray(cyc[view][frame])
                sheet.alpha_composite(fr, (frame * 32 + ox, row * 64 + oy))
        sheet.save(SPRITE_DIR / f"{who}_walk4.png")
        idle = Image.new("RGBA", (32, 64), (0, 0, 0, 0))
        idle.alpha_composite(Image.fromarray(cyc["down"][1]), (ox, oy))
        idle.save(SPRITE_DIR / f"{who}_idle_32.png")
        print("sprite", who)


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
    lines.append("  gate: [],")
    lines.append("};")
    # Enabled set grows as rooms are wired. Cafe and parlor first.
    lines.append('export const A6_ROOMS = new Set(["cafe", "parlor"]);')
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
