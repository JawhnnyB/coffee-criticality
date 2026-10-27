/** Bitmap blit of CCPixel3x5 / CCPixel5x7. Same glyphs as tools/artkit/px.py. */
export const G3: Record<string, string> = {
  'A': '010101111101101',
  'B': '110101110101110',
  'C': '011100100100011',
  'D': '110101101101110',
  'E': '111100110100111',
  'F': '111100110100100',
  'G': '011100101101011',
  'H': '101101111101101',
  'I': '111010010010111',
  'J': '001001001101010',
  'K': '101101110101101',
  'L': '100100100100111',
  'M': '101111111101101',
  'N': '110101101101101',
  'O': '010101101101010',
  'P': '110101110100100',
  'Q': '010101101110011',
  'R': '110101110101101',
  'S': '011100010001110',
  'T': '111010010010010',
  'U': '101101101101111',
  'V': '101101101101010',
  'W': '101101111111101',
  'X': '101101010101101',
  'Y': '101101010010010',
  'Z': '111001010100111',
  '0': '111101101101111',
  '1': '010110010010111',
  '2': '110001010100111',
  '3': '110001010001110',
  '4': '101101111001001',
  '5': '111100110001110',
  '6': '011100111101111',
  '7': '111001010010010',
  '8': '111101111101111',
  '9': '111101111001110',
  '.': '000000000000010',
  ',': '000000000010100',
  '-': '000000111000000',
  '/': '001001010100100',
  '%': '101001010100101',
  '~': '000011110000000',
  '+': '000010111010000',
  ':': '000010000010000',
  '=': '000111000111000',
  '>': '100010001010100',
  '<': '001010100010001',
  '(': '010100100100010',
  ')': '010001001001010',
  '\'': '010010000000000',
  '*': '000101010101000',
  '^': '010101000000000',
  '?': '110001010000010',
  '!': '010010010000010',
  '#': '101111101111101',
  '_': '000000000000111',
  '&': '010101010101011',
  ' ': '000000000000000',
  '°': '111101111000000',
  '$': '011110010011110',
};
export const G5: Record<string, string> = {
  'A': '01110100011000111111100011000110001',
  'B': '11110100011000111110100011000111110',
  'C': '01111100001000010000100001000001111',
  'D': '11110100011000110001100011000111110',
  'E': '11111100001000011110100001000011111',
  'F': '11111100001000011110100001000010000',
  'G': '01111100001000010011100011000101111',
  'H': '10001100011000111111100011000110001',
  'I': '11111001000010000100001000010011111',
  'J': '00111000100001000010000101001001100',
  'K': '10001100101010011000101001001010001',
  'L': '10000100001000010000100001000011111',
  'M': '10001110111010110101100011000110001',
  'N': '10001110011010110011100011000110001',
  'O': '01110100011000110001100011000101110',
  'P': '11110100011000111110100001000010000',
  'Q': '01110100011000110001101011001001101',
  'R': '11110100011000111110101001001010001',
  'S': '01111100001000001110000010000111110',
  'T': '11111001000010000100001000010000100',
  'U': '10001100011000110001100011000101110',
  'V': '10001100011000110001100010101000100',
  'W': '10001100011000110101101011101110001',
  'X': '10001100010101000100010101000110001',
  'Y': '10001100010101000100001000010000100',
  'Z': '11111000010001000100010001000011111',
  '&': '01100100101010001000101011001001101',
  '.': '0000001',
  '-': '00000000000000011111000000000000000',
  ' ': '000000000000000000000',
  '0': '01110100011001110101110011000101110',
  '1': '00100011000010000100001000010001110',
  '2': '01110100010000100010001000100011111',
  '3': '11110000010000101110000010000111110',
  '4': '00010001100101010010111110001000010',
  '5': '11111100001111000001000011000101110',
  '6': '00110010001000011110100011000101110',
  '7': '11111000010001000100010000100001000',
  '8': '01110100011000101110100011000101110',
  '9': '01110100011000101111000010001001100',
  ':': '0010010',
  '%': '11001110100001000100010000101110011',
  '/': '00001000010001000100010001000010000',
};
export const G5W: Record<string, number> = {
  'A': 5,
  'B': 5,
  'C': 5,
  'D': 5,
  'E': 5,
  'F': 5,
  'G': 5,
  'H': 5,
  'I': 5,
  'J': 5,
  'K': 5,
  'L': 5,
  'M': 5,
  'N': 5,
  'O': 5,
  'P': 5,
  'Q': 5,
  'R': 5,
  'S': 5,
  'T': 5,
  'U': 5,
  'V': 5,
  'W': 5,
  'X': 5,
  'Y': 5,
  'Z': 5,
  '&': 5,
  '.': 1,
  '-': 5,
  ' ': 3,
  '0': 5,
  '1': 5,
  '2': 5,
  '3': 5,
  '4': 5,
  '5': 5,
  '6': 5,
  '7': 5,
  '8': 5,
  '9': 5,
  ':': 1,
  '%': 5,
  '/': 5,
};
type RGB = [number, number, number];

function parse(hex: string): RGB {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function css(c: RGB) {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function mix(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.trunc(a[0] * (1 - t) + b[0] * t),
    Math.trunc(a[1] * (1 - t) + b[1] * t),
    Math.trunc(a[2] * (1 - t) + b[2] * t),
  ];
}
export function lit(c: RGB, t = 0.25) {
  return mix(c, [0xff, 0xf4, 0xe0], t);
}
export function drk(c: RGB, t = 0.28) {
  return mix(c, [0x2a, 0x16, 0x10], t);
}

export function fillRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  if (w <= 0 || h <= 0) return;
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
}

export function textW3(s: string) {
  return s.length * 4 - 1;
}

/** 3×5 caps. Unknown glyphs become '?'. */
export function text3(ctx: CanvasRenderingContext2D, x: number, y: number, s: string, color: string, shadow?: string) {
  const col = color;
  const up = s.toUpperCase();
  const draw = (ox: number, oy: number, c: string) => {
    ctx.fillStyle = c;
    let cx = x + ox;
    for (const ch of up) {
      const g = G3[ch] ?? G3["?"];
      for (let i = 0; i < g.length; i++) {
        if (g[i] === "1") ctx.fillRect(cx + (i % 3), y + oy + ((i / 3) | 0), 1, 1);
      }
      cx += 4;
    }
  };
  if (shadow) draw(1, 1, shadow);
  draw(0, 0, col);
}

export function textW5(s: string, scale = 1) {
  let w = 0;
  const up = s.toUpperCase();
  for (const ch of up) w += (G5W[ch] ?? G5W[" "] ?? 3) + 1;
  return w * scale - scale;
}

/** 5×7 title glyphs. scale 1 = 10px font, scale 2 = 20px. */
export function text5(ctx: CanvasRenderingContext2D, x: number, y: number, s: string, color: string, scale = 1, shadow?: string) {
  const up = s.toUpperCase();
  const draw = (ox: number, oy: number, c: string) => {
    ctx.fillStyle = c;
    let cx = x + ox;
    for (const ch of up) {
      const g = G5[ch] ?? G5[" "];
      const gw = G5W[ch] ?? 3;
      for (let r = 0; r < 7; r++) {
        const row = g.slice(r * gw, r * gw + gw);
        for (let k = 0; k < row.length; k++) {
          if (row[k] === "1") ctx.fillRect(cx + k * scale, y + oy + r * scale, scale, scale);
        }
      }
      cx += (gw + 1) * scale;
    }
  };
  if (shadow) draw(scale, scale, shadow);
  draw(0, 0, color);
}

export function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = "#f3e6d0", edge = "#3b2318") {
  const f = parse(fill);
  fillRect(ctx, x, y, w, h, edge);
  fillRect(ctx, x + 1, y + 1, w - 2, h - 2, fill);
  fillRect(ctx, x + 1, y + 1, w - 2, 1, css(lit(f, 0.4)));
  fillRect(ctx, x + 1, y + h - 2, w - 2, 1, css(drk(f, 0.15)));
}

export function nameChip(ctx: CanvasRenderingContext2D, x: number, y: number, s: string) {
  const w = textW3(s) + 8;
  fillRect(ctx, x, y, w, 11, "#3b2318");
  fillRect(ctx, x + 1, y + 1, w - 2, 9, "#2a1c14");
  text3(ctx, x + 4, y + 3, s, "#f6e2c4");
}

export function pixelButton(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, sel: boolean) {
  const fill = sel ? "#f3e6d0" : "#5a3622";
  const ink = sel ? "#3b2318" : "#f3e6d0";
  const f = parse(fill);
  fillRect(ctx, x, y + 2, w, h, "#3b2318");
  fillRect(ctx, x, y, w, h, "#3b2318");
  fillRect(ctx, x + 1, y + 1, w - 2, h - 2, fill);
  fillRect(ctx, x + 1, y + 1, w - 2, 1, css(lit(f, 0.35)));
  fillRect(ctx, x + 1, y + h - 2, w - 2, 1, css(drk(f, 0.3)));
  const tw = textW3(label);
  text3(ctx, x + ((w - tw) / 2) | 0, y + ((h - 5) / 2) | 0, label, ink);
  if (sel) {
    chevron(ctx, x - 6, y + ((h / 2) | 0), 1, "#f3e6d0");
    chevron(ctx, x + w + 6, y + ((h / 2) | 0), -1, "#f3e6d0");
  }
}

function chevron(ctx: CanvasRenderingContext2D, x: number, y: number, dir: 1 | -1, color: string) {
  ctx.fillStyle = "#3b2318";
  for (let i = 0; i < 4; i++) ctx.fillRect(x + dir * i, y - 3 + i, 1, 7 - i * 2);
  ctx.fillStyle = color;
  for (let i = 0; i < 3; i++) ctx.fillRect(x + dir * i, y - 2 + i, 1, 5 - i * 2);
}
