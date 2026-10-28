/**
 * Prototype: HD-2D-style lighting pass over the already-rendered room.
 * Runs on the 2D canvas only (no WebGL), so it cannot fight the pixel pipeline.
 * Enabled with ?postfx in the URL; default look is unchanged.
 * Steps: bloom (screen-blended blurred downscale), lamp light pools,
 * tilt-shift (blurred top/bottom bands), vignette.
 */
export type Light = { x: number; y: number; r: number; color: string; strength: number };

export function postFxOn(): boolean {
  try {
    return typeof location !== "undefined" && new URLSearchParams(location.search).has("postfx");
  } catch {
    return false;
  }
}

const pool: Record<string, HTMLCanvasElement> = {};
function tmp(key: string, w: number, h: number): HTMLCanvasElement {
  let c = pool[key];
  if (!c) {
    c = document.createElement("canvas");
    pool[key] = c;
  }
  if (c.width !== w) c.width = w;
  if (c.height !== h) c.height = h;
  return c;
}

const hasFilter = (ctx: CanvasRenderingContext2D) => "filter" in ctx;

export function applyWorldPostFx(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; w: number; h: number },
  lights: Light[],
) {
  const { x, y, w, h } = rect;
  if (w < 4 || h < 4) return;
  const canFilter = hasFilter(ctx);

  // Snapshot of the world region (already day-tinted).
  const src = tmp("src", w, h);
  const sctx = src.getContext("2d")!;
  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(ctx.canvas, x, y, w, h, 0, 0, w, h);

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // 1) Bloom: 1/4 downscale, blurred, screen-blended back at low alpha.
  if (canFilter) {
    const sw = Math.max(1, Math.round(w / 4));
    const sh = Math.max(1, Math.round(h / 4));
    const small = tmp("small", sw, sh);
    const smctx = small.getContext("2d")!;
    smctx.imageSmoothingEnabled = true;
    smctx.clearRect(0, 0, sw, sh);
    smctx.drawImage(src, 0, 0, w, h, 0, 0, sw, sh);
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.2;
    ctx.filter = "blur(3px)";
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(small, 0, 0, sw, sh, x, y, w, h);
    ctx.filter = "none";
    ctx.imageSmoothingEnabled = false;
  }

  // 2) Lamp / window light pools, additive over the floor.
  ctx.globalCompositeOperation = "screen";
  for (const L of lights) {
    const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r);
    g.addColorStop(0, L.color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = L.strength;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(L.x, L.y, L.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 3) Tilt-shift: blurred copy kept only at the top and bottom bands.
  if (canFilter) {
    const blur = tmp("blur", w, h);
    const bctx = blur.getContext("2d")!;
    bctx.clearRect(0, 0, w, h);
    bctx.filter = "blur(1.5px)";
    bctx.drawImage(src, 0, 0);
    bctx.filter = "none";
    const mask = tmp("mask", w, h);
    const mctx = mask.getContext("2d")!;
    mctx.globalCompositeOperation = "source-over";
    mctx.clearRect(0, 0, w, h);
    const mg = mctx.createLinearGradient(0, 0, 0, h);
    mg.addColorStop(0, "rgba(0,0,0,1)");
    mg.addColorStop(0.3, "rgba(0,0,0,0)");
    mg.addColorStop(0.7, "rgba(0,0,0,0)");
    mg.addColorStop(1, "rgba(0,0,0,1)");
    mctx.fillStyle = mg;
    mctx.fillRect(0, 0, w, h);
    bctx.globalCompositeOperation = "destination-in";
    bctx.drawImage(mask, 0, 0);
    bctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.85;
    ctx.drawImage(blur, x, y);
    ctx.globalAlpha = 1;
  }

  // 4) Vignette: warm, darkens corners only.
  ctx.globalCompositeOperation = "multiply";
  const cx = x + w / 2;
  const cy = y + h / 2;
  const vg = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.35, cx, cy, Math.max(w, h) * 0.7);
  vg.addColorStop(0, "rgba(255,255,255,1)");
  vg.addColorStop(1, "rgba(120,84,60,1)");
  ctx.fillStyle = vg;
  ctx.fillRect(x, y, w, h);

  ctx.restore();
}
