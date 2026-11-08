/** Largest whole multiple of a native pixel size that fits. Letterbox the rest. */
export function integerScale(viewW: number, viewH: number, nativeW: number, nativeH: number) {
  const zoom = Math.max(1, Math.floor(Math.min(viewW / Math.max(1, nativeW), viewH / Math.max(1, nativeH))));
  const dw = nativeW * zoom;
  const dh = nativeH * zoom;
  return {
    zoom,
    dw,
    dh,
    ox: Math.floor((viewW - dw) / 2),
    oy: Math.floor((viewH - dh) / 2),
  };
}

/**
 * Room camera zoom. Wide screens keep the cover zoom (2–5). A view narrower than
 * twice the room drops to 1 so the whole room fits, including the rug and the far edge.
 */
export function worldZoom(viewW: number, viewH: number, roomW: number, roomH: number): number {
  const cover = Math.max(viewW / Math.max(1, roomW), viewH / Math.max(1, roomH));
  const fitted = Math.max(2, Math.min(5, Math.floor(cover)));
  if (viewW < roomW * 2) return 1;
  return fitted;
}
