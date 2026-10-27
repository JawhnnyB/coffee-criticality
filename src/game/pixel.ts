import { TILE } from "./const";
import {
  HAIR_HEX,
  HEART,
  HOODIE_HEX,
  RAIL_H,
  WALK_H,
  WALK_W,
  WINDOW_H,
  WINDOW_W,
  isTileSource,
  isWindowSource,
  type PlayerLook,
} from "./artSpec";
import type { NpcId } from "./content";
import { CAST_HAIR, CAST_SKIN, PAL } from "./palette";

export { PAL };

export type Look = {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  accent: string;
  bun?: boolean;
  braid?: boolean;
  cap?: boolean;
  glasses?: boolean;
  apron?: boolean;
  long?: boolean;
};

export function pix(ctx: CanvasRenderingContext2D) {
  ctx.imageSmoothingEnabled = false;
}

function fill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function outlineRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string = PAL.outline) {
  ctx.strokeStyle = c;
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, Math.round(w) - 1, Math.round(h) - 1);
}

const sheetCache = new Map<string, HTMLImageElement>();

function loadArt(src: string) {
  let im = sheetCache.get(src);
  if (!im) {
    im = new Image();
    im.crossOrigin = "anonymous";
    im.src = src;
    sheetCache.set(src, im);
  }
  return im.complete && im.naturalWidth > 0 ? im : null;
}

function blitBody(
  ctx: CanvasRenderingContext2D,
  who: NpcId | "player",
  _look: Look,
  x: number,
  y: number,
  facing: "left" | "right" | "up" | "down",
  phase: number,
  moving: boolean,
  playerLook?: PlayerLook,
  sitting = false,
) {
  const walk = loadArt(`/art/gen/sprites/${who}_walk4.png`);
  const a6 = !!(walk && walk.naturalWidth === 128 && walk.naturalHeight === 192);
  if (!a6) return false;
  pix(ctx);
  const frame = moving && !sitting ? Math.floor(phase) % 4 : 0;
  const dx = Math.round(x - WALK_W / 2);
  const dy = Math.round(y - WALK_H);

  ctx.save();
  ctx.fillStyle = "rgba(42,22,16,0.32)";
  ctx.beginPath();
  ctx.ellipse(Math.round(x), Math.round(y) - 1, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  let src: CanvasImageSource = walk;
  const sx = frame * WALK_W;
  const sy = facing === "up" ? WALK_H * 2 : facing === "down" ? 0 : WALK_H;
  if (who === "player" && playerLook) src = tintA6(walk, playerLook);

  ctx.save();
  if (facing === "left") {
    ctx.translate(dx + WALK_W, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(src, sx, sy, WALK_W, WALK_H, 0, 0, WALK_W, WALK_H);
  } else {
    ctx.drawImage(src, sx, sy, WALK_W, WALK_H, dx, dy, WALK_W, WALK_H);
  }
  ctx.restore();
  return true;
}

const A6_SHIRT: Array<[number, number, number]> = [
  [0x98, 0xc8, 0x60],
  [0x5a, 0x94, 0x38],
  [0x3a, 0x68, 0x24],
];
const A6_HAIR: Array<[number, number, number]> = [
  [0xc4, 0x78, 0x40],
  [0x7a, 0x40, 0x28],
  [0x4e, 0x28, 0x18],
];
const A6_OUTLINE: [number, number, number] = [0x3b, 0x23, 0x18];
const A6_EYE: [number, number, number] = [0x2a, 0x18, 0x10];
const A6_SKIN: [number, number, number] = [0xf5, 0xc9, 0xa0];

function same(r: number, g: number, b: number, c: [number, number, number]) {
  return r === c[0] && g === c[1] && b === c[2];
}

function tones(hex: string): Array<[number, number, number]> {
  const base = parseHex(hex);
  return [shade(base, 1.28), base, shade(base, 0.62)];
}

/** Exact shirt and hair colours from the A6 grids. Glasses posts are the outline pixels in the eye box. */
export function tintA6(im: HTMLImageElement, look: PlayerLook): CanvasImageSource {
  const key = `a6|${im.src}|${look.hoodie}|${look.hair}|${look.glasses ? 1 : 0}`;
  const hit = recolorCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = im.naturalWidth;
  c.height = im.naturalHeight;
  const g = c.getContext("2d");
  if (!g) return im;
  g.imageSmoothingEnabled = false;
  g.drawImage(im, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const w = c.width;
  const h = c.height;
  if (!look.glasses) {
    const eye = new Uint8Array(w * h);
    for (let p = 0; p < w * h; p++) {
      const i = p * 4;
      if (d[i + 3] > 8 && same(d[i], d[i + 1], d[i + 2], A6_EYE)) eye[p] = 1;
    }
    for (let cy = 0; cy < h; cy += WALK_H) {
      for (let cx = 0; cx < w; cx += WALK_W) {
        let minX = 99;
        let maxX = -1;
        let minY = 99;
        let maxY = -1;
        for (let y = cy; y < cy + WALK_H && y < h; y++) {
          for (let x = cx; x < cx + WALK_W && x < w; x++) {
            if (!eye[y * w + x]) continue;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
        if (maxX < 0) continue;
        for (let y = minY; y <= maxY; y++) {
          for (let x = minX - 1; x <= maxX + 1; x++) {
            if (x < 0 || x >= w) continue;
            const i = (y * w + x) * 4;
            if (d[i + 3] > 8 && same(d[i], d[i + 1], d[i + 2], A6_OUTLINE)) paint(d, i, A6_SKIN);
          }
        }
      }
    }
  }
  const shirt = tones(HOODIE_HEX[look.hoodie]);
  const hair = tones(HAIR_HEX[look.hair]);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 8) continue;
    const r = d[i];
    const gv = d[i + 1];
    const b = d[i + 2];
    for (let t = 0; t < 3; t++) {
      if (same(r, gv, b, A6_SHIRT[t])) {
        paint(d, i, shirt[t]);
        break;
      }
      if (same(r, gv, b, A6_HAIR[t])) {
        paint(d, i, hair[t]);
        break;
      }
    }
  }
  g.putImageData(img, 0, 0);
  recolorCache.set(key, c);
  return c;
}

function parseHex(h: string): [number, number, number] {
  const n = Number.parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const recolorCache = new Map<string, HTMLCanvasElement>();

function near(r: number, g: number, b: number, cr: number, cg: number, cb: number, tol: number) {
  return Math.abs(r - cr) + Math.abs(g - cg) + Math.abs(b - cb) < tol;
}

function shade(rgb: [number, number, number], k: number): [number, number, number] {
  return [Math.max(0, Math.min(255, Math.round(rgb[0] * k))), Math.max(0, Math.min(255, Math.round(rgb[1] * k))), Math.max(0, Math.min(255, Math.round(rgb[2] * k)))];
}

/** Hoodie and hair only. Skin, eyes, pants, and outline stay on their own pixels. */
export function tintPlayer(im: HTMLImageElement, look: PlayerLook): CanvasImageSource {
  const key = `${im.src}|${look.hoodie}|${look.hair}|${look.glasses ? 1 : 0}`;
  const hit = recolorCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = im.naturalWidth;
  c.height = im.naturalHeight;
  const g = c.getContext("2d");
  if (!g) return im;
  g.imageSmoothingEnabled = false;
  g.drawImage(im, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const hoodie = parseHex(HOODIE_HEX[look.hoodie]);
  const hoodieD = shade(hoodie, 0.62);
  const hoodieL = shade(hoodie, 1.22);
  const hair = parseHex(HAIR_HEX[look.hair]);
  const hairD = shade(hair, 0.62);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 8) continue;
    const py = Math.floor(i / 4 / c.width) % WALK_H;
    const r = d[i];
    const gv = d[i + 1];
    const b = d[i + 2];
    if (isBlush(r, gv, b)) continue;
    // Shirt before the eye test. Copper cloth is red enough to look like an iris.
    if (py > 22 && py < 58 && near(r, gv, b, 223, 136, 66, 46)) {
      paint(d, i, hoodieL);
      continue;
    }
    if (py > 22 && py < 58 && near(r, gv, b, 196, 120, 58, 80)) {
      paint(d, i, hoodie);
      continue;
    }
    if (py > 22 && py < 58 && near(r, gv, b, 121, 74, 36, 70)) {
      paint(d, i, hoodieD);
      continue;
    }
    if (isFace(r, gv, b) || isEyePixel(r, gv, b)) continue;
    // Hair stays above the collar. Luminance keeps highlight and shade after recolor.
    if (py < 22 && max3(r, gv, b) > 42) {
      const lum = r + gv + b;
      if (lum < 125) paint(d, i, hairD);
      else if (lum > 210) paint(d, i, shade(hair, 1.18));
      else paint(d, i, hair);
    }
  }
  g.putImageData(img, 0, 0);
  recolorCache.set(key, c);
  return c;
}

function isBlush(r: number, g: number, b: number) {
  return r > 150 && r < 210 && g > 70 && g < 140 && b > 60 && b < 130 && r > g + 30;
}

function isFace(r: number, g: number, b: number) {
  return r > 170 && g > 140 && b > 110;
}

function isEyePixel(r: number, g: number, b: number) {
  const hi = Math.max(r, g, b);
  const lo = Math.min(r, g, b);
  if (lo > 200 && hi - lo < 36) return true;
  return hi < 48 && hi - lo < 22;
}

function paint(d: Uint8ClampedArray, i: number, rgb: [number, number, number]) {
  d[i] = rgb[0];
  d[i + 1] = rgb[1];
  d[i + 2] = rgb[2];
}

function max3(r: number, g: number, b: number) {
  return Math.max(r, g, b);
}

export function drawEmote(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: "bang" | "dots" | "mug",
  now = 0,
) {
  const im = loadArt(`/art/gen/ui/emote_${kind}.png?v=eval1`);
  pix(ctx);
  const size = 10;
  const px = Math.round(x + 8);
  const py = Math.round(y - WALK_H - size - 6 + Math.sin(now * 4));
  if (im) ctx.drawImage(im, 0, 0, 8, 8, px, py, size, size);
}

function blitTile(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, seed = 0) {
  const im = loadArt(`/art/gen/tiles/${name}.png?v=warm7`);
  if (!im || !isTileSource(im.naturalWidth, im.naturalHeight, TILE)) return false;
  pix(ctx);
  const nw = im.naturalWidth;
  const nh = im.naturalHeight;
  const cols = Math.max(1, Math.floor(nw / TILE));
  const rows = Math.max(1, Math.floor(nh / TILE));
  const col = Math.abs(seed) % cols;
  const row = Math.floor(Math.abs(seed) / cols) % rows;
  ctx.drawImage(im, col * TILE, row * TILE, TILE, TILE, Math.floor(x), Math.floor(y), TILE, TILE);
  return true;
}

export function woodFloor(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  cafePlanks(ctx, x, y, seed);
}

/** Warm planks. Seams are one pixel and a little darker than the board, never ink. */
export function cafePlanks(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  const boards = ["#c4a078", "#b8926a", "#d2b48c", "#c9a27a"];
  const board = boards[Math.abs(seed) % boards.length];
  fill(ctx, x, y, TILE, TILE, board);
  const seam = Math.abs(seed) % 2 === 0 ? "#a88862" : "#b08c68";
  const seamY = 4 + (Math.abs(seed) % 3);
  fill(ctx, x, y + seamY, TILE, 1, seam);
  fill(ctx, x, y + seamY + 7, TILE, 1, seam);
  if (Math.abs(seed) % 3 === 0) fill(ctx, x + 3 + (Math.abs(seed) % 8), y + 2, 2, 1, "#e0c4a0");
  if (Math.abs(seed) % 5 === 0) fill(ctx, x + 6, y + 12, 4, 2, "#9a7454");
}

/** Muted slate-green linoleum. The seam is soft, not a grout line. */
export function controlLino(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  const tiles = ["#7a8a80", "#708078", "#84948a"];
  fill(ctx, x, y, TILE, TILE, tiles[Math.abs(seed) % tiles.length]);
  fill(ctx, x, y + TILE - 1, TILE, 1, "#66786e");
  fill(ctx, x + TILE - 1, y, 1, TILE, "#66786e");
  if (Math.abs(seed) % 4 === 0) fill(ctx, x + 5, y + 6, 3, 2, "#8e9e94");
  if (Math.abs(seed) % 6 === 0) fill(ctx, x + 9, y + 3, 2, 1, "#5e7068");
}

/** Warm concrete. Expansion joints are sparse, not a grid. */
export function engConcrete(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number, tx: number, ty: number) {
  const pours = ["#d2c2ae", "#cbbba6", "#ddd0bc"];
  fill(ctx, x, y, TILE, TILE, pours[Math.abs(seed) % pours.length]);
  if (tx % 4 === 0) fill(ctx, x, y, 1, TILE, "#b9a890");
  if (ty % 4 === 0) fill(ctx, x, y, TILE, 1, "#b9a890");
  if (Math.abs(seed) % 5 === 0) fill(ctx, x + 4 + (Math.abs(seed) % 6), y + 8, 2, 2, "#c4b09a");
  if (Math.abs(seed) % 7 === 0) fill(ctx, x + 11, y + 3, 3, 1, "#e4d6c4");
}

export function stoneFloor(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  if (blitTile(ctx, "stone_floor", x, y, seed)) return;
  fill(ctx, x, y, TILE, TILE, seed % 3 === 0 ? "#2c3036" : "#262a30");
}

export function waterFloor(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  if (blitTile(ctx, "water", x, y, seed)) return;
  fill(ctx, x, y, TILE, TILE, seed % 2 === 0 ? "#2a4a56" : "#345868");
  fill(ctx, x, y + 6, TILE, 2, "#82a8b0");
}

export function grassFloor(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  if (blitTile(ctx, "grass", x, y, seed)) return;
  fill(ctx, x, y, TILE, TILE, seed % 2 === 0 ? "#8fbf5a" : "#74a84a");
  fill(ctx, x + (seed % 5), y + (seed % 7), 2, 2, seed % 2 === 0 ? "#d4e68a" : "#5e9238");
}

export function asphaltFloor(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  if (blitTile(ctx, "asphalt", x, y, seed)) return;
  fill(ctx, x, y, TILE, TILE, seed % 3 === 0 ? "#c4a078" : "#d2b48c");
  if (seed % 4 === 0) fill(ctx, x + 4, y + 9, 3, 2, "#a88460");
}

export function stripeFloor(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  if (blitTile(ctx, "warning_stripe", x, y, seed)) return;
  fill(ctx, x, y, TILE, TILE, "#c4a078");
  fill(ctx, x, y + 6, TILE, 4, PAL.gold);
}

export function curbFloor(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  if (blitTile(ctx, "curb", x, y, seed)) return;
  fill(ctx, x, y, TILE, TILE, "#6a645c");
  fill(ctx, x, y, TILE, 3, PAL.cream);
}

export function metalFloor(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  if (blitTile(ctx, seed % 4 === 0 ? "grate" : "metal_floor", x, y, seed)) return;
  fill(ctx, x, y, TILE, TILE, "#243034");
}

export function wallpaper(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, accent: string, steel = false) {
  const paper = steel ? "wallpaper_control" : "wallpaper_cafe";
  const im = loadArt(`/art/gen/tiles/${paper}.png?v=warm7`);
  const railH = RAIL_H;
  if (im && isTileSource(im.naturalWidth, im.naturalHeight)) {
    pix(ctx);
    for (let yy = y; yy < y + h - railH; yy += TILE) {
      for (let xx = x; xx < x + w; xx += TILE) {
        ctx.drawImage(im, 0, 0, TILE, TILE, xx, yy, TILE, TILE);
      }
    }
  } else {
    fill(ctx, x, y, w, h - railH, "#2a221b");
  }
  const rail = loadArt("/art/gen/tiles/wainscot.png?v=warm7");
  if (rail && rail.naturalWidth >= TILE && rail.naturalHeight >= railH) {
    pix(ctx);
    const sy = Math.max(0, rail.naturalHeight - railH);
    for (let xx = x; xx < x + w; xx += TILE) {
      ctx.drawImage(rail, 0, sy, TILE, railH, xx, y + h - railH, TILE, railH);
    }
  } else {
    fill(ctx, x, y + h - railH, w, railH, PAL.wood);
  }
  fill(ctx, x, y + h - 1, w, 1, PAL.outline);
  void accent;
}

export function skyBand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  period: "morning" | "midday" | "afternoon",
) {
  const name = period === "afternoon" ? "sky_dusk" : period === "midday" ? "sky_midday" : "sky_morning";
  const im = loadArt(`/art/gen/tiles/${name}.png?v=warm7`);
  const band = h - 8;
  if (period === "afternoon") {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, "#6a3a48");
    g.addColorStop(0.45, "#c4784a");
    g.addColorStop(0.78, "#e8a060");
    g.addColorStop(1, "#f3c9a0");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  } else if (im && isTileSource(im.naturalWidth, im.naturalHeight)) {
    pix(ctx);
    for (let yy = y; yy < y + band; yy += TILE) {
      for (let xx = x; xx < x + w; xx += TILE) {
        ctx.drawImage(im, 0, 0, TILE, TILE, xx, yy, TILE, TILE);
      }
    }
  } else {
    fill(ctx, x, y, w, h, PAL.sky);
  }
  fill(ctx, x, y + h - 8, w, 8, period === "afternoon" ? "#f0c090" : "#7aaa58");
}

/** Distant shells in the outdoor sky band. Unwalkable. Not 16:9 rooms. */
export function lotSkyline(ctx: CanvasRenderingContext2D, w: number, wall: number) {
  pix(ctx);
  const ground = wall - 6;
  const shell = (sx: number, sh: number, bw: number, top: string) => {
    const y = ground - sh;
    fill(ctx, sx, y, bw, sh, "#2a221b");
    fill(ctx, sx + 2, y + 2, bw - 4, Math.max(6, sh - 8), top);
    fill(ctx, sx, y + sh - 4, bw, 4, "#1a1410");
    outlineRect(ctx, sx, y, bw, sh, PAL.ink);
  };
  shell(16, 24, 52, PAL.copper);
  shell(w - 176, 28, 64, PAL.steel);
  shell(w - 104, 32, 40, PAL.gold);
  shell(w - 60, 36, 32, PAL.leaf);
  fill(ctx, w - 24, ground - 44, 8, 44, PAL.steel);
  fill(ctx, w - 26, ground - 48, 12, 8, "#4a5a48");
  outlineRect(ctx, w - 24, ground - 44, 8, 44, PAL.ink);
}

export const LOOKS: Record<NpcId | "player", Look> = {
  player: { skin: CAST_SKIN.player, hair: CAST_HAIR.player, shirt: PAL.copper, pants: PAL.woodDark, accent: PAL.cream },
  mabel: { skin: CAST_SKIN.mabel, hair: CAST_HAIR.mabel, shirt: PAL.copper, pants: PAL.woodMid, accent: PAL.cream, bun: true, apron: true },
  holt: { skin: CAST_SKIN.holt, hair: CAST_HAIR.holt, shirt: PAL.ash, pants: PAL.surface, accent: PAL.ash },
  elena: { skin: CAST_SKIN.elena, hair: CAST_HAIR.elena, shirt: PAL.leaf, pants: PAL.steelD, accent: PAL.copper, long: true },
  tommy: { skin: CAST_SKIN.tommy, hair: CAST_HAIR.tommy, shirt: PAL.steel, pants: PAL.steelD, accent: PAL.gold, cap: true },
  marcus: { skin: CAST_SKIN.marcus, hair: CAST_HAIR.marcus, shirt: PAL.bad, pants: PAL.woodDark, accent: PAL.cream, glasses: true },
  priya: { skin: CAST_SKIN.priya, hair: CAST_HAIR.priya, shirt: PAL.wine, pants: PAL.woodDark, accent: PAL.copper, braid: true },
  jordan: { skin: CAST_SKIN.jordan, hair: CAST_HAIR.jordan, shirt: PAL.gold, pants: PAL.surface, accent: PAL.outline },
};

export function drawChibi(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  look: Look,
  facing: "left" | "right" | "up" | "down",
  phase: number,
  moving: boolean,
  isPlayer = false,
  _who: NpcId | "player" = isPlayer ? "player" : "player",
  playerLook?: PlayerLook,
  sitting = false,
) {
  if (blitBody(ctx, _who, look, x, y, facing, phase, moving, playerLook, sitting)) return;
  pix(ctx);
  const fx = Math.round(x);
  const fy = Math.round(y);
  fill(ctx, fx - 7, fy - 2, 14, 3, "rgba(12,10,8,0.4)");
  fill(ctx, fx - 6, fy - 40, 12, 14, look.shirt);
  fill(ctx, fx - 5, fy - 52, 10, 10, look.skin);
  fill(ctx, fx - 6, fy - 54, 12, 5, look.hair);
}

export function drawPortrait(ctx: CanvasRenderingContext2D, look: Look, size: number, who?: NpcId | "player") {
  pix(ctx);
  const im = who ? loadArt(`/art/gen/portraits/${who}_talk.jpg?v=paint3`) : null;
  if (im && im.naturalWidth > 0) {
    ctx.drawImage(im, 0, 0, im.naturalWidth, im.naturalHeight, 0, 0, size, size);
    return;
  }
  fill(ctx, 0, 0, size, size, "#2a221b");
  fill(ctx, size * 0.28, size * 0.22, size * 0.44, size * 0.44, look.skin);
  fill(ctx, size * 0.24, size * 0.16, size * 0.52, size * 0.22, look.hair);
  fill(ctx, size * 0.18, size * 0.62, size * 0.64, size * 0.38, look.shirt);
}

export function heartCount(trust: number) {
  if (trust >= 70) return 5;
  if (trust >= 45) return 4;
  if (trust >= 20) return 3;
  if (trust >= 0) return 2;
  if (trust >= -20) return 1;
  return 0;
}

export function drawNameplate(ctx: CanvasRenderingContext2D, x: number, y: number, name: string, hearts: number) {
  pix(ctx);
  ctx.font = "5px monospace";
  ctx.textAlign = "center";
  const tw = ctx.measureText(name).width;
  fill(ctx, x - tw / 2 - 3, y - 58, tw + 6, 8, "rgba(22,17,13,0.8)");
  ctx.fillStyle = PAL.cream;
  ctx.fillText(name, x, y - 52);
  const hx = x - hearts * 4;
  for (let i = 0; i < hearts; i++) {
    const on = loadArt("/art/gen/ui/heart_on.png?v=leftover");
    if (on) ctx.drawImage(on, 0, 0, HEART, HEART, hx + i * 8 - 4, y - 62, HEART, HEART);
  }
}

/** Campus shell. One peaked roof is not a building. Each label gets its own wall, windows, and door side. */
function drawCampusBuilding(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  w: number,
  h: number,
  label: string | undefined,
  now: number,
) {
  type Face = "south" | "north" | "east" | "west";
  type Spec = {
    roof: string;
    roofD: string;
    wall: string;
    wallD: string;
    trim: string;
    face: Face;
    door: number;
    win: "pane" | "slit" | "bay" | "pair";
    cols: number;
    rows: number;
    chimney?: boolean;
    brick?: boolean;
    rib?: boolean;
  };
  const specs: Record<string, Spec> = {
    Cafe: { roof: PAL.copper, roofD: PAL.copperD, wall: "#e7d3b4", wallD: "#c9b08a", trim: PAL.copperL, face: "east", door: 0.86, win: "pane", cols: 3, rows: 2, chimney: true },
    Arcade: { roof: "#a85a30", roofD: "#6a3018", wall: "#d7c4a4", wallD: "#b89a74", trim: PAL.gold, face: "south", door: 0.5, win: "bay", cols: 2, rows: 1 },
    Hall: { roof: "#6a7a82", roofD: "#3a4a52", wall: "#c4b29a", wallD: "#9a8068", trim: PAL.steelL, face: "west", door: 0.42, win: "pane", cols: 5, rows: 1, brick: true },
    Control: { roof: "#8a7040", roofD: "#5a4020", wall: "#d2c2a4", wallD: "#a89070", trim: PAL.gold, face: "south", door: 0.5, win: "pane", cols: 4, rows: 1 },
    Eng: { roof: "#5a727c", roofD: "#2e444c", wall: "#d8d0c4", wallD: "#aea498", trim: PAL.steelL, face: "north", door: 0.5, win: "pair", cols: 3, rows: 2 },
    Break: { roof: PAL.wood, roofD: PAL.woodDark, wall: "#ead8bc", wallD: "#c8b090", trim: PAL.copperL, face: "west", door: 0.55, win: "bay", cols: 2, rows: 1, chimney: true },
    Core: { roof: "#4a6a52", roofD: "#243828", wall: "#c8c2b4", wallD: "#8a8478", trim: PAL.leaf, face: "west", door: 0.28, win: "pane", cols: 3, rows: 1, rib: true },
    Maint: { roof: "#4a6a72", roofD: "#24383c", wall: "#c2beb4", wallD: "#8a8680", trim: "#7a9aa0", face: "north", door: 0.5, win: "pane", cols: 6, rows: 1, rib: true },
  };
  const spec = specs[label ?? ""] ?? specs.Cafe;
  // Control's collider is a 4-tile strip between the lake and Hall. Paint a
  // second storey upward so the shell is a building. The solid rect stays put.
  if (label === "Control") {
    oy -= 48;
    h += 48;
  }
  const eave = Math.max(8, Math.min(h - 20, Math.floor(h * (h < 80 ? 0.22 : 0.36))));
  fill(ctx, ox + 2, oy + h - 3, w - 2, 3, "#5a4330");
  fill(ctx, ox + 3, oy + eave - 1, w - 6, h - eave, spec.wall);
  fill(ctx, ox + w - 8, oy + eave, 5, Math.max(4, h - eave - 3), spec.wallD);
  for (let yy = eave; yy < h - 2; yy += 4) {
    for (let xx = 4; xx < w - 8; xx += 5) {
      const n = ((ox + xx) * 13 + (oy + yy) * 7) & 7;
      if (n === 0) fill(ctx, ox + xx, oy + yy, spec.brick ? 3 : 1, 1, spec.wallD);
      if (spec.brick && n === 3) fill(ctx, ox + xx, oy + yy + 2, 2, 1, "#b89a78");
    }
  }
  for (let i = 0; i < eave; i++) {
    const t = i / Math.max(1, eave - 1);
    const inset = Math.round((1 - t) * Math.min(18, Math.floor(w * 0.18)));
    const shade = spec.rib ? (i % 3 === 0 ? spec.roofD : spec.roof) : i % 4 === 0 ? spec.roofD : spec.roof;
    fill(ctx, ox + inset, oy + i, Math.max(4, w - inset * 2), 1, shade);
    if (i < eave * 0.45 && inset + 2 < w / 2) fill(ctx, ox + inset, oy + i, 2, 1, spec.trim);
  }
  fill(ctx, ox + 1, oy + eave - 2, w - 2, 2, spec.trim);
  fill(ctx, ox + 3, oy + h - 8, w - 6, 5, spec.wallD);
  fill(ctx, ox + 3, oy + eave, 3, Math.max(4, h - eave - 3), spec.wallD);
  fill(ctx, ox + w - 6, oy + eave, 3, Math.max(4, h - eave - 3), spec.wallD);
  if (spec.chimney && h > 48) {
    const cx = ox + w - 16;
    fill(ctx, cx, oy + 4, 5, Math.max(4, eave - 6), "#5a6a70");
    fill(ctx, cx - 1, oy + 2, 7, 3, "#3a4a50");
    const puff = 1 + Math.round((Math.sin(now * 1.6 + ox) + 1) * 1.5);
    fill(ctx, cx + 1, oy - puff, 3, puff + 2, "rgba(243,230,208,0.75)");
  }
  const glow = 0.42 + Math.sin(now * 2.2 + ox * 0.01) * 0.1;
  const avail = h - eave - 14;
  const winH = Math.min(32, Math.max(16, avail));
  const cols = Math.max(1, Math.min(spec.cols, Math.floor((w - 24) / 18)));
  const rows = label === "Control" ? 2 : winH >= 28 ? 1 : Math.max(1, Math.min(spec.rows, 2));
  const paneH = label === "Control" ? 20 : winH;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = ox + 12 + c * Math.floor((w - 24) / cols);
      const wy = oy + eave + 4 + r * (paneH + 4);
      if (wy + paneH > oy + h - 8) continue;
      fill(ctx, wx - 1, wy - 1, 12, paneH + 2, `rgba(232,168,96,${glow})`);
      fill(ctx, wx, wy, 10, paneH, PAL.ink);
      fill(ctx, wx + 1, wy + 1, 8, paneH - 2, "#ffe0a0");
      fill(ctx, wx + 5, wy + 1, 1, paneH - 2, PAL.ink);
      fill(ctx, wx + 1, wy + Math.floor(paneH / 2), 8, 1, PAL.ink);
      fill(ctx, wx - 1, wy + paneH, 12, 2, PAL.wood);
    }
  }
  if (h > 26 && w > 22) {
    const dw = Math.max(6, Math.min(10, Math.floor(w / 8)));
    const dh = Math.max(10, Math.min(20, Math.floor((h - eave) * 0.45)));
    const along = Math.max(0, Math.min(1, spec.door));
    let dx = ox + 6;
    let dy = oy + h - dh - 4;
    if (spec.face === "east") dx = ox + w - dw - 6;
    else if (spec.face === "west") dx = ox + 6;
    else dx = ox + Math.round((w - dw - 12) * along) + 6;
    if (spec.face === "north") dy = oy + eave + 2;
    if (spec.face === "north") {
      fill(ctx, dx - 2, dy + dh + 1, dw + 8, 4, PAL.leafD);
      fill(ctx, dx + dw + 2, dy + dh + 2, 3, 3, PAL.leaf);
    } else {
      fill(ctx, dx - 1, dy - 3, dw + 2, 3, spec.trim);
    }
    fill(ctx, dx, dy, dw, dh, PAL.woodDark);
    fill(ctx, dx + 1, dy + 1, dw - 2, Math.max(2, Math.floor(dh * 0.35)), PAL.woodL);
    fill(ctx, dx + dw - 3, dy + Math.floor(dh * 0.45), 2, 2, PAL.gold);
  }
  outlineRect(ctx, ox + 3, oy + eave - 1, w - 6, h - eave, PAL.ink);
}

export function hungSignSpot(label: string, ox: number, oy: number, w: number, h: number) {
  const face = label === "Cafe" ? "e" : label === "Hall" || label === "Break" || label === "Core" ? "w" : label === "Eng" || label === "Maint" ? "n" : "s";
  const along = label === "Cafe" ? 0.86 : label === "Hall" ? 0.42 : label === "Core" ? 0.28 : label === "Break" ? 0.55 : 0.5;
  let x = ox + 10 + Math.round((w - 28) * along);
  if (face === "e") x = ox + w - 22;
  if (face === "w") x = ox + 14;
  const y = oy + Math.max(8, Math.floor(h * 0.34));
  return { x, y };
}

export function drawPropPixel(
  ctx: CanvasRenderingContext2D,
  kind: string,
  x: number,
  y: number,
  w: number,
  h: number,
  accent: string,
  now: number,
  label?: string,
) {
  const ox = Math.floor(x);
  const oy = Math.floor(y);
  const im = loadArt(`/art/gen/props/${kind}.png`);
  if (im) {
    pix(ctx);
    const nw = im.naturalWidth;
    const nh = im.naturalHeight;
    const spanH = kind === "pipe_h" || kind === "pipe_run" || kind === "railing" || kind === "crane";
    const spanV = kind === "pipe_v";
    if (spanH && w > nw) {
      const dy = Math.round(oy + Math.max(1, h) - nh);
      for (let xx = 0; xx < w; xx += nw) {
        const slice = Math.min(nw, ox + w - (ox + xx));
        if (slice <= 0) break;
        ctx.drawImage(im, 0, 0, slice, nh, ox + xx, dy, slice, nh);
      }
    } else if (spanV && h > nh) {
      const dx = Math.round(ox + (Math.max(1, w) - nw) / 2);
      for (let yy = 0; yy < h; yy += nh) {
        const slice = Math.min(nh, oy + h - (oy + yy));
        if (slice <= 0) break;
        ctx.drawImage(im, 0, 0, nw, slice, dx, oy + yy, nw, slice);
      }
    } else {
      const dx = Math.round(ox + (Math.max(1, w) - nw) / 2);
      const dy = Math.round(oy + Math.max(1, h) - nh);
      ctx.drawImage(im, 0, 0, nw, nh, dx, dy, nw, nh);
    }
    if (label === "Hot leg") {
      fill(ctx, ox + 2, oy + Math.max(1, h) - 11, Math.max(4, w - 4), 2, "#c4783a");
    } else if (label === "Cold leg") {
      fill(ctx, ox + 2, oy + Math.max(1, h) - 11, Math.max(4, w - 4), 2, "#3d5c66");
    }
    if (kind === "arcade" || kind.startsWith("cab_")) {
      const dx = Math.round(ox + (Math.max(1, w) - nw) / 2);
      const dy = Math.round(oy + Math.max(1, h) - nh);
      fill(
        ctx,
        dx + Math.floor(nw * 0.28),
        dy + Math.floor(nh * 0.22),
        Math.max(4, Math.floor(nw * 0.44)),
        3,
        `rgba(107,143,113,${0.28 + Math.sin(now * 5) * 0.22})`,
      );
    }
    return;
  }
  if (kind === "roof") {
    drawCampusBuilding(ctx, ox, oy, w, h, label, now);
    return;
  }
  if (kind === "stack") {
    const puff = 2 + Math.round((Math.sin(now * 1.4 + ox * 0.02) + 1) * 2);
    fill(ctx, ox + 6, oy + 16, w - 12, h - 16, PAL.steel);
    fill(ctx, ox + 2, oy + 4, w - 4, 14, "#4a5a48");
    fill(ctx, ox + 8, oy + h - 10, w - 16, 10, "#2a3238");
    const px = ox + Math.floor(w / 2) - 2;
    fill(ctx, px, oy + 2 - puff, 4, puff, "#9aa898");
    fill(ctx, px + 1, oy - puff - 2, 2, 2, "#d5ddd0");
    outlineRect(ctx, ox + 6, oy + 16, w - 12, h - 16, PAL.ink);
    outlineRect(ctx, ox + 2, oy + 4, w - 4, 14, PAL.ink);
    return;
  }
  fill(ctx, ox, oy, w, h, PAL.woodMid);
  outlineRect(ctx, ox, oy, w, h);
  void accent;
}

export function drawDoorGlimpse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  plate: HTMLImageElement | null,
) {
  if (!plate) return;
  pix(ctx);
  ctx.save();
  ctx.beginPath();
  ctx.rect(Math.floor(x) + 2, Math.floor(y) + 2, Math.max(4, w - 4), Math.max(4, h - 4));
  ctx.clip();
  const nw = plate.naturalWidth;
  const nh = plate.naturalHeight;
  if (nw > 0 && nh > 0) {
    const fit = Math.max(1, Math.floor(Math.min((w - 4) / nw, (h - 4) / nh)) || 1);
    ctx.drawImage(plate, 0, 0, nw, nh, Math.floor(x) + 2, Math.floor(y) + 2, nw * fit, nh * fit);
  }
  ctx.restore();
}

export function drawDoor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  north: boolean,
  slide = 0,
) {
  const ox = Math.floor(x);
  const oy = Math.floor(y);
  const im = loadArt("/art/gen/props/door.png?v=campus");
  pix(ctx);
  const shift = Math.max(0, Math.min(6, Math.round(slide)));
  if (im && im.naturalWidth === 16 && im.naturalHeight === 32) {
    const dw = 16;
    const dh = Math.min(32, Math.max(16, h));
    const tiles = Math.max(1, Math.floor(w / dw));
    for (let i = 0; i < tiles; i++) {
      const dx = ox + i * dw + Math.floor((w - tiles * dw) / 2) - shift;
      const dy = north ? oy : oy + h - dh;
      if (north) {
        ctx.save();
        ctx.translate(dx + dw / 2, dy + dh / 2);
        ctx.scale(1, -1);
        ctx.drawImage(im, 0, 0, 16, 32, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      } else {
        ctx.drawImage(im, 0, 0, 16, 32, dx, dy, dw, dh);
      }
    }
  } else {
    fill(ctx, ox - shift, oy, w, h, PAL.woodDark);
    fill(ctx, ox + 2 - shift, oy + 2, w - 4, h - 4, PAL.copper);
  }
  void label;
}

export function drawWindow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  still: HTMLImageElement | null,
) {
  pix(ctx);
  fill(ctx, x, y, w, h, PAL.ink);
  outlineRect(ctx, x, y, w, h, PAL.copper);
  if (still && isWindowSource(still.naturalWidth, still.naturalHeight)) {
    ctx.drawImage(still, 0, 0, WINDOW_W, WINDOW_H, x + 2, y + 2, w - 4, h - 4);
  } else if (still && still.naturalWidth > 0) {
    ctx.drawImage(still, x + 2, y + 2, w - 4, h - 4);
  }
}

export function steam(ctx: CanvasRenderingContext2D, x: number, y: number, now: number, big = false) {
  pix(ctx);
  const im = loadArt("/art/gen/fx/steam.png?v=feel");
  const n = big ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const t = (now * (big ? 1.1 : 0.7) + i * 0.45) % 1.8;
    const px = Math.round(x + Math.sin(now * 2 + i) * (big ? 4 : 2) - 8);
    const py = Math.round(y - t * 18);
    if (im) ctx.drawImage(im, 0, 0, im.naturalWidth, im.naturalHeight, px, py, 16, 16);
    else fill(ctx, px, py, 3, 3, "rgba(243,230,208,0.4)");
  }
}

export function windMotes(ctx: CanvasRenderingContext2D, w: number, h: number, now: number, wall: number) {
  const mote = loadArt("/art/gen/fx/mote.png?v=campus");
  pix(ctx);
  for (let i = 0; i < 10; i++) {
    const x = Math.round(((now * 18 + i * 47) % (w + 16)) - 8);
    const y = Math.round(wall + 8 + ((now * 7 + i * 31) % Math.max(8, h - wall - 16)));
    if (mote) ctx.drawImage(mote, 0, 0, 16, 16, x, y, 8, 8);
    else fill(ctx, x, y, 2, 2, PAL.leaf);
  }
}

/** Warm pool under a lamp. Stronger at dusk. Drawn under people. */
export function lampGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  now: number,
  period: "morning" | "midday" | "afternoon",
) {
  pix(ctx);
  const dusk = period === "afternoon";
  const a = (dusk ? 0.62 : period === "morning" ? 0.22 : 0.12) + Math.sin(now * 2.1) * 0.05;
  ctx.save();
  ctx.fillStyle = `rgba(232,168,96,${Math.max(0.08, a)})`;
  ctx.beginPath();
  ctx.ellipse(Math.round(x), Math.round(y) - 4, dusk ? 40 : 14, dusk ? 22 : 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255,214,140,${Math.max(0.05, a * 0.45)})`;
  ctx.beginPath();
  ctx.ellipse(Math.round(x), Math.round(y) - 6, dusk ? 16 : 6, dusk ? 8 : 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Morning cream / dusk copper falling from a window onto the floor. */
export function windowWash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  period: "morning" | "midday" | "afternoon",
) {
  if (period === "midday") return;
  pix(ctx);
  const morning = period === "morning";
  ctx.fillStyle = morning ? "rgba(243,230,208,0.1)" : "rgba(196,120,58,0.07)";
  ctx.fillRect(Math.round(x) + 2, Math.round(y + h), Math.max(4, w - 4), 36);
}

/** Tiny kettle pool. Same ruler as the 16×16 kettle. */
export function kettleGlow(ctx: CanvasRenderingContext2D, x: number, y: number, now: number) {
  pix(ctx);
  const a = 0.16 + Math.sin(now * 3) * 0.05;
  ctx.save();
  ctx.fillStyle = `rgba(196,120,58,${a})`;
  ctx.beginPath();
  ctx.ellipse(Math.round(x), Math.round(y) + 2, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

