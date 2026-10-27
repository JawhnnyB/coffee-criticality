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
