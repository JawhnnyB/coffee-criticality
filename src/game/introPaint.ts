/** 384×216 intro chrome. Glyphs match tools/artkit/intro_mock.py. Spoken lines are not drawn here. */
import type { HairId, HoodieId, PlayerLook } from "./artSpec";
import { fillRect, nameChip, panel, pixelButton, text3, text5 } from "./pxFont";

export const NW = 384;
export const NH = 216;

type RGB = [number, number, number];

const GREEN: RGB[] = [
  [0x5a, 0x94, 0x38],
  [0x7a, 0xb4, 0x58],
  [0x3a, 0x68, 0x24],
];
const BROWN: RGB[] = [
  [0x7a, 0x4a, 0x2a],
  [0x9a, 0x62, 0x38],
  [0x57, 0x33, 0x20],
];
/** Destination ramps from tools/artkit/cast.py — the triples baked into badge.png. */
const HOOD: Record<HoodieId, RGB[]> = {
  copper: [
    [0xc4, 0x78, 0x3a],
    [0xe8, 0xa8, 0x60],
    [0x8a, 0x48, 0x20],
  ],
  leaf: [
    [0x6b, 0x8f, 0x71],
    [0x8c, 0xb4, 0x92],
    [0x48, 0x68, 0x4e],
  ],
  steel: [
    [0x5a, 0x7a, 0x98],
    [0x7a, 0x9c, 0xb8],
    [0x3e, 0x5a, 0x74],
  ],
  gold: [
    [0xd8, 0xa6, 0x3a],
    [0xec, 0xc4, 0x60],
    [0xb0, 0x84, 0x28],
  ],
};
const HAIR: Record<HairId, RGB[]> = {
  brown: [
    [0x7a, 0x4a, 0x2a],
    [0x9a, 0x62, 0x38],
    [0x57, 0x33, 0x20],
  ],
  ink: [
    [0x2a, 0x18, 0x10],
    [0x4a, 0x33, 0x28],
    [0x1b, 0x11, 0x0e],
  ],
  silver: [
    [0xc8, 0xc0, 0xb4],
    [0xe4, 0xde, 0xd2],
    [0xa8, 0xa0, 0x94],
  ],
  copper: [
    [0x8a, 0x48, 0x20],
    [0xb0, 0x64, 0x2c],
    [0x64, 0x2a, 0x18],
  ],
};

const COPPER = HOOD.copper;

export const BEAT_SCENE = ["core", "cafe", "lot", "wing", "bench", "break", "control", "threshold"] as const;
export const BEAT_WHO = ["priya", "mabel", "elena", "tommy", "marcus", "jordan", "holt", "player"] as const;

const images = new Map<string, HTMLImageElement>();
const swaps = new Map<string, HTMLCanvasElement>();

export function needImage(src: string): HTMLImageElement | null {
  let im = images.get(src);
  if (!im) {
    im = new Image();
    im.src = src;
    images.set(src, im);
  }
  return im.complete && im.naturalWidth > 0 ? im : null;
}

export function watchImages(srcs: string[], onLoad: () => void) {
  const pending: HTMLImageElement[] = [];
  for (const src of srcs) {
    let im = images.get(src);
    if (!im) {
      im = new Image();
      im.src = src;
      images.set(src, im);
    }
    if (!im.complete) pending.push(im);
  }
  if (!pending.length) return () => {};
  const done = () => onLoad();
  for (const im of pending) im.addEventListener("load", done);
  return () => {
    for (const im of pending) im.removeEventListener("load", done);
  };
}

/** oy = round(clamp(focusY/100, 0, 1) * 52). Y only. */
export function focusOy(focus: string) {
  const parts = focus.match(/(\d+(?:\.\d+)?)%/g);
  const raw = parts && parts.length > 1 ? parts[1] : parts?.[0];
  const y = raw ? Number.parseFloat(raw) : 0;
  const t = Math.max(0, Math.min(1, y / 100));
  return Math.round(t * 52);
}

export function dashKicker(kicker: string) {
  return kicker
    .split("·")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .join(" - ");
}

export function chipOf(kicker: string) {
  return (kicker.split("·")[0] ?? kicker).trim().toUpperCase();
}

export function bitmapPhrase(s: string) {
  return s.replace(/ΔT/g, "DELTA T").replace(/Δ/g, "DELTA");
}

function ground(ctx: CanvasRenderingContext2D) {
  fillRect(ctx, 0, 0, NW, NH, "#1c1410");
  ctx.fillStyle = "#221812";
  for (let y = 0; y < NH; y += 16) ctx.fillRect(0, y, NW, 1);
}

function topbar(ctx: CanvasRenderingContext2D, left: string, n?: number, total = 8) {
  fillRect(ctx, 0, 0, NW, 11, "#2a1c14");
  fillRect(ctx, 0, 10, NW, 1, "#c4783a");
  text3(ctx, 6, 3, left, "#e0a850");
  if (n == null) return;
  for (let i = 0; i < total; i++) {
    const x = NW - 6 - (total - i) * 10;
    fillRect(ctx, x, 3, 8, 5, "#3b2318");
    fillRect(ctx, x + 1, 4, 6, 3, i < n ? "#6b8f71" : "#3a2a1e");
  }
}

function sceneWindow(ctx: CanvasRenderingContext2D, name: string, oy: number, x: number, y: number, w: number, h: number) {
  fillRect(ctx, x - 1, y - 1, w + 2, h + 2, "#3b2318");
  const im = needImage(`/art/intro/scene-${name}.png`);
  if (!im) {
    fillRect(ctx, x, y, w, h, "#2a1c14");
    return;
  }
  const maxOy = Math.max(0, im.naturalHeight - h);
  const sy = Math.max(0, Math.min(maxOy, oy | 0));
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(im, 0, sy, w, h, x, y, w, h);
}

function brackets(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#f6e2c4";
  for (const [dx, dy] of [
    [-2, -2],
    [13, -2],
    [-2, 13],
    [13, 13],
  ] as const) {
    ctx.fillRect(x + dx, y + dy, 3, 3);
  }
}

function wrap3(ctx: CanvasRenderingContext2D, x: number, y: number, s: string, width: number, color: string, step: number) {
  const words = s.toUpperCase().split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= width) cur = next;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  lines.forEach((ln, i) => text3(ctx, x, y + i * step, ln, color));
  return lines.length;
}

function arrow(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#c4783a";
  for (let i = 0; i < 4; i++) ctx.fillRect(354 + i, 194 + i, 1, 7 - 2 * i);
}

function same(d: Uint8ClampedArray, i: number, c: RGB) {
  return d[i] === c[0] && d[i + 1] === c[1] && d[i + 2] === c[2];
}

function paintPx(d: Uint8ClampedArray, i: number, c: RGB) {
  d[i] = c[0];
  d[i + 1] = c[1];
  d[i + 2] = c[2];
}

function swapExact(im: HTMLImageElement, pairs: [RGB, RGB][]) {
  const c = document.createElement("canvas");
  c.width = im.naturalWidth;
  c.height = im.naturalHeight;
  const g = c.getContext("2d");
  if (!g) return c;
  g.imageSmoothingEnabled = false;
  g.drawImage(im, 0, 0);
  const live = pairs.filter(([a, b]) => a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]);
  if (!live.length) return c;
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 8) continue;
    for (const [a, b] of live) {
      if (same(d, i, a)) {
        paintPx(d, i, b);
        break;
      }
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** Player portrait. Glasses file is the green-hoodie source; noglasses is already copper. */
export function playerPortrait(look: PlayerLook, mouth: "smile" | "talk"): CanvasImageSource | null {
  const key = `${look.hoodie}|${look.hair}|${look.glasses ? 1 : 0}|${mouth}`;
  const hit = swaps.get(key);
  if (hit) return hit;
  const src = look.glasses
    ? `/art/ui/portraits/portrait-player-${mouth}.png`
    : `/art/ui/portraits/portrait-player-${mouth}-noglasses.png`;
  const im = needImage(src);
  if (!im) return null;
  const fromHood = look.glasses ? GREEN : COPPER;
  const fromHair = BROWN;
  const pairs: [RGB, RGB][] = [];
  HOOD[look.hoodie].forEach((b, i) => pairs.push([fromHood[i], b]));
  HAIR[look.hair].forEach((b, i) => pairs.push([fromHair[i], b]));
  const c = swapExact(im, pairs);
  swaps.set(key, c);
  return c;
}

export function castPortrait(who: string, mouth: "smile" | "talk"): CanvasImageSource | null {
  return needImage(`/art/ui/portraits/portrait-${who}-${mouth}.png`);
}

function blitPortrait(ctx: CanvasRenderingContext2D, im: CanvasImageSource | null, x: number, y: number) {
  fillRect(ctx, x - 1, y - 1, 50, 50, "#3b2318");
  if (!im) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(im, x, y);
}

export function paintBeat(
  ctx: CanvasRenderingContext2D,
  o: {
    scene: string;
    oy: number;
    who: string;
    you: boolean;
    look: PlayerLook;
    mouth: "smile" | "talk";
    kicker: string;
    title: string;
    speaker: string;
    pip: number;
  },
) {
  ctx.imageSmoothingEnabled = false;
  ground(ctx);
  topbar(ctx, "UNIT 1 - " + dashKicker(o.kicker), o.pip);
  sceneWindow(ctx, o.scene, o.oy, 32, 15, 320, 128);
  nameChip(ctx, 38, 21, chipOf(o.kicker));
  panel(ctx, 16, 150, 352, 58);
  const face = o.you ? playerPortrait(o.look, o.mouth) : castPortrait(o.who, o.mouth);
  blitPortrait(ctx, face, 22, 156);
  text5(ctx, 78, 155, o.title, "#8a4a2a", 1);
  text3(ctx, 78, 166, o.you ? "YOU" : o.speaker, "#c4783a");
  arrow(ctx);
  text3(ctx, 316, 197, "SPACE", "#a8937a");
}

export function paintBrief(
  ctx: CanvasRenderingContext2D,
  o: {
    day: number;
    kicker: string;
    title: string;
    items: string[];
    yesterday: string | null;
    mouth: "smile" | "talk";
  },
) {
  ctx.imageSmoothingEnabled = false;
  ground(ctx);
  topbar(ctx, `UNIT 1 - DAY ${o.day} - TEACHING ONLY`);
  sceneWindow(ctx, "control", 80, 32, 15, 320, 84);
  panel(ctx, 16, 104, 352, 104);
  blitPortrait(ctx, castPortrait("holt", o.mouth), 22, 110);
  text3(ctx, 78, 110, dashKicker(o.kicker), "#c4783a");
  text5(ctx, 78, 120, o.title, "#8a4a2a", 1);
  const y0 = o.yesterday ? 162 : 154;
  const gap = o.yesterday ? 6 : 8;
  if (o.yesterday) text3(ctx, 78, 152, bitmapPhrase(o.yesterday), "#5a4030");
  o.items.forEach((item, i) => {
    const y = y0 + i * gap;
    fillRect(ctx, 78, y, 5, 5, "#3b2318");
    fillRect(ctx, 79, y + 1, 3, 3, "#f6e2c4");
    text3(ctx, 88, y, bitmapPhrase(item), "#5a4030");
  });
  pixelButton(ctx, 282, 190, 64, 14, "WALK IN", true);
}

const ROLES: { title: string; line: string }[] = [
  ["TRANSFERRED ENGINEER", "NEW SITE, SAME PHYSICS. WATCH THE FLOOR; GROW WHERE TRUTH CAN BE SPOKEN."],
  ["RECENTLY PROMOTED", "THE TITLE IS NEW. THE HISS IS NOT. CATCH IT CHEAP."],
  ["FORMER MILITARY", "ORDERS WERE A LANGUAGE. HERE THE CATCH IS THE ORDER."],
  ["CAUTIOUS VETERAN", "YOU HAVE SEEN A HIDE PATH. YOU DID NOT LIKE WHERE IT WENT."],
].map(([title, line]) => ({ title, line }));

export function paintBadge(
  ctx: CanvasRenderingContext2D,
  o: {
    look: PlayerLook;
    cursor: number;
    sprites: CanvasImageSource | null;
  },
) {
  ctx.imageSmoothingEnabled = false;
  ground(ctx);
  topbar(ctx, "UNIT 1 - BADGE - TEACHING ONLY");
  text5(ctx, 16, 20, "WHO WALKS IN", "#f6e2c4", 2, "#6a3a22");
  text3(ctx, 16, 40, "FLAVOR ONLY. FIRST YOU DESIGN THE UNIT WITH PRIYA. THEN YOU WALK IT.", "#a8937a");
  panel(ctx, 16, 54, 150, 118, "#2a1c14");
  blitPortrait(ctx, playerPortrait(o.look, "smile"), 24, 62);
  text3(ctx, 84, 62, "HOODIE", "#e0a850");
  (Object.keys(HOOD) as HoodieId[]).forEach((id, i) => {
    const x = 84 + i * 16;
    fillRect(ctx, x, 71, 13, 13, "#3b2318");
    fillRect(ctx, x + 1, 72, 11, 11, rgb(HOOD[id][0]));
    fillRect(ctx, x + 1, 72, 11, 2, rgb(HOOD[id][1]));
    if (o.look.hoodie === id) brackets(ctx, x, 71);
  });
  text3(ctx, 84, 92, "HAIR", "#e0a850");
  (Object.keys(HAIR) as HairId[]).forEach((id, i) => {
    const x = 84 + i * 16;
    fillRect(ctx, x, 101, 13, 13, "#3b2318");
    fillRect(ctx, x + 1, 102, 11, 11, rgb(HAIR[id][0]));
    fillRect(ctx, x + 1, 102, 11, 2, rgb(HAIR[id][1]));
    if (o.look.hair === id) brackets(ctx, x, 101);
  });
  fillRect(ctx, 84, 122, 9, 9, "#3b2318");
  fillRect(ctx, 85, 123, 7, 7, "#f6e2c4");
  if (o.look.glasses) fillRect(ctx, 87, 125, 3, 3, "#6b8f71");
  text3(ctx, 98, 125, "GLASSES", "#f6e2c4");
  text3(ctx, 24, 116, "BADGE PHOTO", "#a8937a");
  text3(ctx, 24, 124, "STILL WARM.", "#a8937a");
  fillRect(ctx, 23, 138, 136, 1, "#3a2a1e");
  text3(ctx, 24, 143, "ON THE FLOOR", "#e0a850");
  const faces = [0, 64, 128];
  faces.forEach((sy, i) => {
    const cx = 46 + i * 30;
    ctx.fillStyle = "rgba(42,22,16,0.32)";
    ctx.beginPath();
    ctx.ellipse(cx, 175, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!o.sprites) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(o.sprites, 0, sy, 32, 64, cx - 16, 176 - 64, 32, 64);
  });
  ROLES.forEach((r, i) => {
    const x = 176 + (i % 2) * 100;
    const y = 54 + ((i / 2) | 0) * 60;
    const sel = i === o.cursor;
    if (sel) fillRect(ctx, x - 1, y - 1, 98, 58, "#e0a850");
    panel(ctx, x, y, 96, 56, sel ? "#f3e6d0" : "#3a2a1e");
    const n = wrap3(ctx, x + 5, y + 5, r.title, 22, sel ? "#8a4a2a" : "#e0a850", 7);
    wrap3(ctx, x + 5, y + 5 + n * 7 + 3, r.line, 22, sel ? "#3b2318" : "#d8c8a8", 6);
  });
  pixelButton(ctx, 16, 184, 54, 14, "BACK", false);
  text3(ctx, 80, 188, "PICK A BADGE TO CONTINUE", "#a8937a");
}

function rgb(c: RGB) {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** Scanline wipe. Step 4 covers the frame. No opacity. */
export function paintWipe(ctx: CanvasRenderingContext2D, step: number) {
  if (step <= 0) return;
  ctx.fillStyle = "#1c1410";
  for (let y = 0; y < NH; y++) {
    if (y % 4 < step) ctx.fillRect(0, y, NW, 1);
  }
}
