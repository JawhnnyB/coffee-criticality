"""Border flood on a boolean mask. Vectorized numpy, no per-pixel deque.

Reachability from the image edge (or from seed pixels) through True cells.
Coarse-to-fine so 1408² lock chibis finish in milliseconds, not a Python BFS.
"""
from __future__ import annotations

import numpy as np


def dilate4(m: np.ndarray) -> np.ndarray:
    d = m.copy()
    d[1:] |= m[:-1]
    d[:-1] |= m[1:]
    d[:, 1:] |= m[:, :-1]
    d[:, :-1] |= m[:, 1:]
    return d


def dilate8(m: np.ndarray) -> np.ndarray:
    d = dilate4(m)
    d[1:, 1:] |= m[:-1, :-1]
    d[1:, :-1] |= m[:-1, 1:]
    d[:-1, 1:] |= m[1:, :-1]
    d[:-1, :-1] |= m[1:, 1:]
    return d


def flood_through(mask: np.ndarray, seeds: np.ndarray, *, eight: bool = False) -> np.ndarray:
    """Pixels in `mask` reachable from `seeds`. Grows until the set stops."""
    dil = dilate8 if eight else dilate4
    reach = seeds & mask
    last = -1
    lim = int(max(mask.shape))
    for _ in range(lim):
        nxt = dil(reach) & mask
        n = int(nxt.sum())
        if n == last:
            return nxt
        last = n
        reach = nxt
    return reach


def flood_from_border(mask: np.ndarray, *, eight: bool = False) -> np.ndarray:
    """True cells 4- or 8-connected to the image border through `mask`."""
    h, w = mask.shape
    step = 4 if min(h, w) >= 256 else 1
    if step == 1:
        seeds = np.zeros_like(mask)
        seeds[0] = True
        seeds[-1] = True
        seeds[:, 0] = True
        seeds[:, -1] = True
        return flood_through(mask, seeds, eight=eight)

    coarse = np.ascontiguousarray(mask[::step, ::step])
    cs = np.zeros_like(coarse)
    cs[0] = True
    cs[-1] = True
    cs[:, 0] = True
    cs[:, -1] = True
    cr = flood_through(coarse, cs, eight=eight)
    full = np.repeat(np.repeat(cr, step, 0), step, 1)[:h, :w]
    reach = full & mask
    dil = dilate8 if eight else dilate4
    # eat the ≤step-px halo the downsample skipped
    for _ in range(step + 2):
        nxt = dil(reach) & mask
        if int(nxt.sum()) == int(reach.sum()):
            return nxt
        reach = nxt
    return reach
