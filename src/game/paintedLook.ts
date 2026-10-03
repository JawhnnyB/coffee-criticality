import { HAIR_HEX, HOODIE_HEX, type PlayerLook } from "./artSpec";

/** Fractions of the painted bust. Tuned on the 2:3 copper-hoodie source. */
const HAIR_Y0 = 0.07;
const HAIR_Y1 = 0.58;
const FACE_Y = 0.28;
const HOOD_Y = 0.58;
const HOOD_REF_V = 0.5;
const HAIR_REF_V = 0.25;

const cache = new Map<string, HTMLCanvasElement>();

function hsv(r: number, g: number, b: number): [number, number, number] {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === rf) h = ((gf - bf) / d) % 6;
    else if (max === gf) h = (bf - rf) / d + 2;
    else h = (rf - gf) / d + 4;
    h /= 6;
    if (h < 0) h += 1;
  }
  return [h, s, v];
}

function fromHsv(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const table: [number, number, number][] = [
    [v, t, p],
    [q, v, p],
    [p, v, t],
    [p, q, v],
    [t, p, v],
    [v, p, q],
  ];
  const [rr, gg, bb] = table[i % 6];
  return [clamp255(rr), clamp255(gg), clamp255(bb)];
}

function clamp255(n: number) {
  return Math.max(0, Math.min(255, Math.round(n * 255)));
}

function hex(s: string): [number, number, number] {
  return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
}

function lightSkin(r: number, g: number, b: number) {
  return r > 155 && g > 85 && b > 45 && r > b + 35 && Math.max(r, g, b) / 255 > 0.58;
}

/** Recolor the painted bust to the creator's hoodie, hair, and glasses. */
export function paintPlayerPortrait(im: HTMLImageElement, look: PlayerLook): HTMLCanvasElement {
  const key = `${im.src}|${look.hoodie}|${look.hair}|${look.glasses ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = im.naturalWidth || im.width;
  c.height = im.naturalHeight || im.height;
  const g = c.getContext("2d");
  if (!g || !c.width) return c;
  g.drawImage(im, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const w = c.width;
  const h = c.height;
  const face = new Map<number, [number, number]>();
  for (let y = 0; y < h; y++) {
    let min = -1;
    let max = -1;
    let n = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (lightSkin(d[i], d[i + 1], d[i + 2])) {
        if (min < 0) min = x;
        max = x;
        n++;
      }
    }
    if (n > 30 && min >= 0) face.set(y, [min, max]);
  }
  const [hr, hg, hb] = hex(HOODIE_HEX[look.hoodie]);
  const [ar, ag, ab] = hex(HAIR_HEX[look.hair]);
  const [th, ts, tv] = hsv(hr, hg, hb);
  const [ah, asat, av] = hsv(ar, ag, ab);
  const hoodY = HOOD_Y * h;
  const hairY0 = HAIR_Y0 * h;
  const hairY1 = HAIR_Y1 * h;
  const faceY = FACE_Y * h;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = d[i];
      const gv = d[i + 1];
      const b = d[i + 2];
      const [, sat, val] = hsv(r, gv, b);
      if (y > hoodY && sat > 0.7 && val > 0.18) {
        const nv = Math.max(0, Math.min(1, val * (tv / HOOD_REF_V)));
        const ns = Math.min(1, sat * 0.35 + ts * 0.65);
        const [rr, gg, bb] = fromHsv(th, ns, nv);
        d[i] = rr;
        d[i + 1] = gg;
        d[i + 2] = bb;
        continue;
      }
      const span = face.get(y);
      const inFace = !!span && x >= span[0] - 8 && x <= span[1] + 8 && y > faceY;
      if (y > hairY0 && y < hairY1 && val < 0.42 && sat > 0.15 && !inFace && !lightSkin(r, gv, b)) {
        const nv = Math.max(0, Math.min(1, val * (av / HAIR_REF_V)));
        const ns = Math.min(1, Math.max(sat * 0.4, asat * 0.7));
        const [rr, gg, bb] = fromHsv(ah, ns, nv);
        d[i] = rr;
        d[i + 1] = gg;
        d[i + 2] = bb;
      }
    }
  }
  g.putImageData(img, 0, 0);
  cache.set(key, c);
  return c;
}
