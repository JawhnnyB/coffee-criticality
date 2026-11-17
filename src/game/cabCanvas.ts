/**
 * One way to open a cabinet canvas, so every cabinet is sharp and keeps its shape.
 *
 * A cabinet draws in its own small coordinates (320 x 180 and so on). The backing store is
 * CAB_BACKING times larger and the context is scaled to match, so text and edges are drawn at
 * screen resolution and not blown up from a tiny bitmap. On screen the canvas is its drawing size
 * times a half-step scale, and it keeps its aspect ratio. The games map the pointer through
 * getBoundingClientRect, so the box and the picture have to be the same shape.
 */
export const CAB_BACKING = 4;

const observers = new WeakMap<HTMLCanvasElement, ResizeObserver>();

/**
 * The largest scale, in half steps, that fits the space the cabinet screen has left for the canvas.
 * Half steps are safe because the backing store is already CAB_BACKING times the drawing.
 */
export function cabDisplayScale(availW: number, availH: number, w: number, h: number): number {
  const fit = Math.min(availW / Math.max(1, w), availH / Math.max(1, h));
  return Math.max(1, Math.min(CAB_BACKING, Math.floor(fit * 2) / 2));
}

function fit(canvas: HTMLCanvasElement, w: number, h: number) {
  const host = (canvas.closest(".cabinet-screen") as HTMLElement | null) ?? canvas.parentElement;
  if (!host) return;
  let content = 0;
  for (const child of Array.from(host.children)) content += (child as HTMLElement).offsetHeight;
  const other = Math.max(0, content - canvas.offsetHeight);
  const availW = host.clientWidth - 36;
  const availH = host.clientHeight - other - 48;
  const k = cabDisplayScale(availW, availH, w, h);
  canvas.style.setProperty("width", `${w * k}px`, "important");
  canvas.style.setProperty("height", `${h * k}px`, "important");
  canvas.style.setProperty("max-width", "none", "important");
  canvas.style.setProperty("max-height", "none", "important");
  canvas.style.imageRendering = Number.isInteger(CAB_BACKING / k) ? "pixelated" : "auto";
  canvas.dataset.cabScale = String(k);
}

/**
 * The 2D context for a cabinet. Call it where the cabinet used to call getContext.
 * The canvas width and height attributes are the drawing size.
 */
export function cabContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const known = Number(canvas.dataset.cabW) || 0;
  const fresh = !known || canvas.width !== known * CAB_BACKING;
  const w = fresh ? canvas.width : known;
  const h = fresh ? canvas.height : Number(canvas.dataset.cabH) || canvas.height;
  if (fresh) {
    canvas.dataset.cabW = String(w);
    canvas.dataset.cabH = String(h);
    canvas.width = w * CAB_BACKING;
    canvas.height = h * CAB_BACKING;
  }
  ctx.setTransform(CAB_BACKING, 0, 0, CAB_BACKING, 0, 0);
  ctx.imageSmoothingEnabled = false;
  observers.get(canvas)?.disconnect();
  fit(canvas, w, h);
  if (typeof ResizeObserver !== "undefined") {
    const host = (canvas.closest(".cabinet-screen") as HTMLElement | null) ?? canvas.parentElement;
    if (host) {
      const ro = new ResizeObserver(() => fit(canvas, w, h));
      ro.observe(host);
      observers.set(canvas, ro);
    }
  }
  return ctx;
}

/** The cabinet text face at a drawing size. Sizes 6, 8, 10 and 12 land on the face's own pixel grid. */
export function cabFont(px: number): string {
  return `${px}px "Pixelify Sans", monospace`;
}
