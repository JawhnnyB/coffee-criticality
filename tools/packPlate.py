#!/usr/bin/env python3
"""Pack a source painting into a 320×180 teaching plate (16:9 cards)."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from packSprite import pack_file

PLATE_W = 320
PLATE_H = 180
THUMB_W = 160
THUMB_H = 90


def pack_plate(src: str | Path, dest: str | Path, *, thumb: str | Path | None = None) -> None:
    pack_file(src, dest, PLATE_W, PLATE_H, feet=False, magenta=True, cream_bg=True, fit="cover")
    if thumb:
        pack_file(src, thumb, THUMB_W, THUMB_H, feet=False, magenta=True, cream_bg=True, fit="cover")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--in", dest="src", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--thumb")
    args = p.parse_args()
    pack_plate(args.src, args.out, thumb=args.thumb)


if __name__ == "__main__":
    main()
