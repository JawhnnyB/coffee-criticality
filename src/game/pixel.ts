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
  const idle = loadArt(`/art/gen/sprites/${who}_idle_32.png?v=face5`);
  if (!idle || idle.naturalWidth !== WALK_W || idle.naturalHeight !== WALK_H) return false;
  pix(ctx);
  const frame = moving && !sitting ? Math.floor(phase) % 4 : 0;
  const bob = moving && !sitting && (frame === 1 || frame === 3) ? 1 : 0;
  const sway = !moving && Math.floor(phase / 8) % 2 === 1 ? 1 : 0;
  const dx = Math.round(x - WALK_W / 2 + sway);
  const dy = Math.round(y - WALK_H + bob);

  ctx.save();
  ctx.fillStyle = "rgba(12,10,8,0.38)";
  ctx.beginPath();
  ctx.ellipse(Math.round(x), Math.round(y) - 1, sitting ? 7 : 8, sitting ? 2 : 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const walk = loadArt(`/art/gen/sprites/${who}_walk4.png?v=face5`);
  const sit = loadArt(`/art/gen/sprites/${who}_sit.png?v=face5`);
  const hasWalk = !!(walk && walk.naturalWidth === 128 && walk.naturalHeight === 192);
  const hasSit = !!(sit && sit.naturalWidth === WALK_W && sit.naturalHeight === WALK_H);
  let src: CanvasImageSource = idle;
  let sx = 0;
  let sy = 0;
  if (sitting && hasSit) {
    src = sit!;
  } else if (moving && hasWalk) {
    src = walk!;
    sx = frame * WALK_W;
    sy = facing === "up" ? WALK_H * 2 : facing === "down" ? 0 : WALK_H;
  }
  if (who === "player" && playerLook) {
    const sheet = sitting && hasSit ? sit! : moving && hasWalk ? walk! : idle;
    src = tintPlayer(sheet, playerLook);
  }

  ctx.save();
  if (facing === "left") {
    ctx.translate(dx + WALK_W, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(src, sx, sy, WALK_W, WALK_H, 0, 0, WALK_W, WALK_H);
  } else {
    ctx.drawImage(src, sx, sy, WALK_W, WALK_H, dx, dy, WALK_W, WALK_H);
  }
  ctx.restore();

  const blink = !moving && facing !== "up" && phase % 8 < 0.28;
  if (blink) {
    fill(ctx, dx + 12, dy + (sitting ? 25 : 13), 8, 2, "rgba(22,17,13,0.85)");
  }
  return true;
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
  const hair = parseHex(HAIR_HEX[look.hair]);
  const hairD = shade(hair, 0.62);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 8) continue;
    const py = Math.floor(i / 4 / c.width) % WALK_H;
    const r = d[i];
    const gv = d[i + 1];
    const b = d[i + 2];
    // Shirt cluster first. Copper cloth also passes isWarmSkin, so it must win.
    if (py > 16 && py < 52 && near(r, gv, b, 196, 120, 58, 80)) {
      paint(d, i, hoodie);
      continue;
    }
    if (py > 16 && py < 52 && near(r, gv, b, 138, 72, 32, 60)) {
      paint(d, i, hoodieD);
      continue;
    }
    if (isFace(r, gv, b) || isEyePixel(r, gv, b)) continue;
    if (py < 18 && max3(r, gv, b) > 42) {
      const dark = r + gv + b < 280;
      paint(d, i, dark ? hairD : hair);
    }
  }
  g.putImageData(img, 0, 0);
  recolorCache.set(key, c);
  return c;
}

function isFace(r: number, g: number, b: number) {
  return r > 170 && g > 140 && b > 110;
}

function isEyePixel(r: number, g: number, b: number) {
  if (Math.min(r, g, b) > 168) return true;
  return r > 180 && g > 80 && b < 140 && r > g;
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
  const px = Math.round(x - 8);
  const py = Math.round(y - WALK_H - 14 + Math.sin(now * 4) * 1);
  if (im) ctx.drawImage(im, 0, 0, 8, 8, px, py, 16, 16);
}

function blitTile(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, seed = 0) {
  const im = loadArt(`/art/gen/tiles/${name}.png?v=campus`);
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
  if (blitTile(ctx, "wood_floor", x, y, seed)) return;
  const tones = ["#4a3424", "#45301f", "#4e3828", "#40301f"];
  fill(ctx, x, y, TILE, TILE, tones[seed % tones.length]);
  fill(ctx, x, y + TILE - 1, TILE, 1, PAL.woodDark);
}

export function stoneFloor(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  if (blitTile(ctx, "stone_floor", x, y, seed)) return;
  fill(ctx, x, y, TILE, TILE, seed % 3 === 0 ? "#2c3036" : "#262a30");
}

export function grassFloor(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  if (blitTile(ctx, "grass", x, y, seed)) return;
  fill(ctx, x, y, TILE, TILE, seed % 2 === 0 ? "#3d5c44" : "#35553c");
}

export function asphaltFloor(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  if (blitTile(ctx, "asphalt", x, y, seed)) return;
  fill(ctx, x, y, TILE, TILE, "#2a2926");
}

export function stripeFloor(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  if (blitTile(ctx, "warning_stripe", x, y, seed)) return;
  fill(ctx, x, y, TILE, TILE, "#2a2926");
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
  const im = loadArt(`/art/gen/tiles/${paper}.png?v=campus`);
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
  const rail = loadArt("/art/gen/tiles/wainscot.png?v=campus");
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
  const im = loadArt(`/art/gen/tiles/${name}.png?v=campus`);
  const band = h - 6;
  if (im && isTileSource(im.naturalWidth, im.naturalHeight)) {
    pix(ctx);
    for (let yy = y; yy < y + band; yy += TILE) {
      for (let xx = x; xx < x + w; xx += TILE) {
        ctx.drawImage(im, 0, 0, TILE, TILE, xx, yy, TILE, TILE);
      }
    }
  } else {
    fill(ctx, x, y, w, h, period === "afternoon" ? PAL.skyDusk : PAL.sky);
  }
  fill(ctx, x, y + h - 6, w, 6, period === "afternoon" ? "#4a5a48" : "#6b8f71");
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
  const im = who ? loadArt(`/art/gen/portraits/${who}_talk.png?v=eval1`) : null;
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
  const im = kind === "roof" || kind === "stack" ? null : loadArt(`/art/gen/props/${kind}.png?v=eval1`);
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
    const top =
      label === "Cafe" ? PAL.copper : label === "Hall" ? PAL.steel : label === "Control" ? "#6a5a30" : label === "Reactor" ? PAL.leaf : PAL.wood;
    fill(ctx, ox, oy, w, h, "#2a221b");
    fill(ctx, ox + 2, oy + 2, w - 4, Math.max(8, h - 10), top);
    fill(ctx, ox, oy + h - 6, w, 6, "#1a1410");
    outlineRect(ctx, ox, oy, w, h, PAL.ink);
    return;
  }
  if (kind === "stack") {
    fill(ctx, ox + w / 2 - 6, oy + 8, 12, h - 8, PAL.steel);
    fill(ctx, ox + w / 2 - 8, oy, 16, 12, "#4a5a48");
    outlineRect(ctx, ox + w / 2 - 6, oy + 8, 12, h - 8, PAL.ink);
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
  const a = (dusk ? 0.34 : period === "morning" ? 0.18 : 0.1) + Math.sin(now * 2.1) * 0.04;
  ctx.save();
  ctx.fillStyle = `rgba(201,162,39,${Math.max(0.06, a)})`;
  ctx.beginPath();
  ctx.ellipse(Math.round(x), Math.round(y) - 4, dusk ? 16 : 12, dusk ? 11 : 8, 0, 0, Math.PI * 2);
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

