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

/** Whole-number cover. The image fills the frame and the extra is cropped. Not a stretch. */
export function integerCover(viewW: number, viewH: number, nativeW: number, nativeH: number) {
  const zoom = Math.max(1, Math.ceil(Math.max(viewW / Math.max(1, nativeW), viewH / Math.max(1, nativeH))));
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

/** Views narrower than this are phones (the notes panel also starts closed here). */
export const PHONE_VIEW_W = 720;

/**
 * Room camera zoom. Phones use a fixed 2×: the camera follows the player and clamps at the room
 * edges, so a walker reaches every edge and the player is never off screen. Wider views use the
 * smallest whole zoom that covers the view (2–5), so there are no bars beside a room and people are
 * the same size in every room. The camera pans over what is cropped.
 * The lot is far wider than any view. It uses a zoom from the view height (2–4) and the camera
 * follows, so a person there is not a few pixels tall. The pause map shows the whole site.
 */
export function worldZoom(viewW: number, viewH: number, roomW: number, roomH: number): number {
  if (viewW < PHONE_VIEW_W) return 2;
  const cover = Math.max(viewW / Math.max(1, roomW), viewH / Math.max(1, roomH));
  const fitted = Math.max(2, Math.min(5, Math.ceil(cover)));
  // A room much wider than the view (the lot) is walked, not shown whole. People stay readable.
  if (viewW < roomW * 2) return Math.max(2, Math.min(4, Math.round(viewH / 240)));
  return fitted;
}
