/**
 * Hand-authored walk sheets. 128×192 = 4 frames × 32 by 3 rows × 64.
 * Rows: down, side (right; the game mirrors left), up.
 * Feet sit on the bottom of the cell, same footprint as the sheets they replace
 * (about y 32–63). NPC pixels are palette.ts colours. The player uses the
 * tintA6 key colours so the hoodie picker still works.
 * No Cherenkov blue. No letters. No snout: the nose is one pixel inside the face.
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const PAL = {
  cream: "#f3e6d0",
  creamD: "#dcc8aa",
  muted: "#b5a48c",
  ash: "#8a7864",
  copper: "#c4783a",
  copperL: "#e8a860",
  copperD: "#8a4820",
  leaf: "#6b8f71",
  leafD: "#3d5c44",
  ink: "#16110d",
  outline: "#1a1410",
  steel: "#3d5c66",
  steelL: "#5a7a84",
  gold: "#c9a227",
  wood: "#6a4a32",
  woodMid: "#4a3424",
  woodDark: "#3a2818",
  woodL: "#8a6242",
  bad: "#b85c4a",
  wine: "#704060",
  white: "#f8f4ec",
  skin: "#e8c4a0",
  skin2: "#e0ba94",
  skinTan: "#c49468",
  skinBrown: "#a86c44",
  skinBlush: "#b46058",
};

const TINT = {
  shirt: "#5a9438",
  shirtL: "#98c860",
  shirtD: "#3a6824",
  hair: "#7a4028",
  hairL: "#c47840",
  skin: "#f5c9a0",
  eye: "#2a1810",
  outline: "#3b2318",
};

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
function canvas() {
  const w = 128;
  const h = 192;
  const px = Buffer.alloc(w * h * 4);
  const set = (x, y, hex) => {
    if (!hex || x < 0 || y < 0 || x >= w || y >= h) return;
    const n = Number.parseInt(hex.slice(1), 16);
    const i = (y * w + x) * 4;
    px[i] = (n >> 16) & 255;
    px[i + 1] = (n >> 8) & 255;
    px[i + 2] = n & 255;
    px[i + 3] = 255;
  };
  const rect = (x, y, rw, rh, hex) => {
    for (let yy = 0; yy < rh; yy++) for (let xx = 0; xx < rw; xx++) set(x + xx, y + yy, hex);
  };
  const clear = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    px.fill(0, (y * w + x) * 4, (y * w + x) * 4 + 4);
  };
  return { set, rect, clear, px };
}

/** Copy one 32×64 cell out of a sheet. */
function cell(img, cx, cy) {
  const out = Buffer.alloc(32 * 64 * 4);
  for (let y = 0; y < 64; y++) img.px.copy(out, y * 32 * 4, ((cy + y) * 128 + cx) * 4, ((cy + y) * 128 + cx + 32) * 4);
  return out;
}

/**
 * 26 November 2026: the walkers now match the dialogue portraits (tools/artkit/cast.py, portrait.py), which are
 * the faces players remember: Holt's sandy hair and red tie, Elena's ponytail and gold top, Tommy's hard hat, Marcus's
 * beard, Priya's green top, Jordan's orange. Colours are taken from the portrait specs. Colt (the second plant's
 * director) gets his own: silver hair, a short grey beard, a sage zip-up, no tie.
 */
const P = (skin, skinD, hair, hairL, shirt, shirtL, shirtD, rest = {}) => ({
  outline: PAL.outline,
  skin,
  skinD,
  hair,
  hairL,
  blush: PAL.skinBlush,
  eye: PAL.ink,
  white: PAL.white,
  mouth: PAL.bad,
  glasses: PAL.outline,
  shirt,
  shirtL,
  shirtD,
  pants: PAL.woodDark,
  shoe: PAL.ink,
  ...rest,
});
const CASTS = {
  player: {
    outline: TINT.outline,
    hair: TINT.hair,
    hairL: TINT.hairL,
    skin: TINT.skin,
    skinD: PAL.skin2,
    blush: PAL.skinBlush,
    eye: TINT.eye,
    white: PAL.white,
    mouth: PAL.bad,
    glasses: TINT.outline,
    shirt: TINT.shirt,
    shirtL: TINT.shirtL,
    shirtD: TINT.shirtD,
    pants: PAL.woodDark,
    shoe: PAL.ink,
    extra: "glasses",
  },
  mabel: P("#f5c9a0", "#dba37a", "#cfc8bc", "#efe9dd", "#c8643c", "#e0845a", "#9e4a2a", { pants: PAL.woodMid, apron: PAL.cream, bun: true }),
  holt: P("#f5c9a0", "#dba37a", "#c8a878", "#e0c498", "#a8764a", "#c4905a", "#805634", { mouth: PAL.wood, tie: "#a82a3a", collar: "#f4ecd8" }),
  colt: P("#f5c9a0", "#dba37a", "#c8c0b4", "#e4ded2", "#6b8f71", "#8cb492", "#48684e", { mouth: PAL.wood, beard: "#b4aca0", collar: "#f4ecd8" }),
  elena: P("#e0a878", "#c08850", "#6a4030", "#8a5a40", "#d8a63a", "#ecc460", "#b08428", { pants: PAL.wood, pony: "#a82a3a" }),
  tommy: P("#e0a878", "#c08850", "#3a2a22", "#5a4030", "#efe2c4", "#fff6e6", "#c8b890", { mouth: PAL.wood, pants: PAL.steel, hardhat: ["#e0b030", "#f4d060", "#c89820"] }),
  marcus: P("#f0c498", "#d49c70", "#9e4a2a", "#c0643a", "#c4603a", "#dc8058", "#9a4428", { pants: PAL.woodMid, beard: "#9e4a2a" }),
  priya: P("#c98e62", "#a8704a", "#2b1d18", "#4a3328", "#488038", "#68a058", "#305824", { blush: PAL.wine, mouth: PAL.wine, bun: true, bindi: "#c04a38" }),
  jordan: P("#d8a070", "#b88050", "#4a3028", "#6a4a3a", "#d08c30", "#e8a850", "#a86c20", { pants: PAL.woodMid, mouth: PAL.copperD, messy: true }),
};

function paintDown(img, ox, oy, c, phase) {
  const x = ox + 9;
  const y = oy + 32;
  const arm = [0, 1, 0, -1][phase];
  const step = [0, 1, 0, -1][phase];
  img.rect(x + 3, y, 8, 2, c.hair);
  img.rect(x + 2, y + 1, 10, 4, c.hair);
  img.rect(x + 5, y + 1, 3, 1, c.hairL);
  img.rect(x + 3, y + 5, 8, 7, c.skin);
  img.rect(x + 2, y + 6, 1, 5, c.outline);
  img.rect(x + 11, y + 6, 1, 5, c.outline);
  img.set(x + 4, y + 7, c.white);
  img.set(x + 5, y + 7, c.eye);
  img.set(x + 8, y + 7, c.eye);
  img.set(x + 9, y + 7, c.white);
  img.set(x + 6, y + 9, c.skinD);
  img.set(x + 4, y + 10, c.blush);
  img.set(x + 9, y + 10, c.blush);
  img.rect(x + 5, y + 11, 4, 1, c.mouth);
  img.rect(x + 5, y + 12, 4, 2, c.skin);
  img.rect(x + 3, y + 14, 8, 8, c.shirt);
  img.rect(x + 3, y + 14, 2, 8, c.shirtD);
  img.rect(x + 9, y + 14, 2, 8, c.shirtL);
  img.rect(x + 1, y + 14 + arm, 2, 6, c.shirt);
  img.rect(x + 11, y + 14 - arm, 2, 6, c.shirtD);
  img.set(x + 1, y + 19 + arm, c.skin);
  img.set(x + 12, y + 19 - arm, c.skin);
  img.rect(x + 3, y + 22, 3, 7, c.pants);
  img.rect(x + 8, y + 22, 3, 7, c.pants);
  img.rect(x + 3 - Math.max(step, 0), y + 29, 3, 2, c.shoe);
  img.rect(x + 8 + Math.max(-step, 0), y + 29, 3, 2, c.shoe);
  if (c.apron) img.rect(x + 5, y + 16, 4, 6, c.apron);
  if (c.collar) {
    img.set(x + 5, y + 14, c.collar);
    img.set(x + 8, y + 14, c.collar);
  }
  if (c.tie) img.rect(x + 6, y + 14, 2, 6, c.tie);
  if (c.bun) {
    img.rect(x + 5, y - 4, 4, 1, c.hair);
    img.rect(x + 4, y - 3, 6, 3, c.hair);
    img.set(x + 5, y - 3, c.hairL);
  }
  if (c.messy) {
    img.set(x + 4, y - 1, c.hair);
    img.set(x + 7, y - 1, c.hair);
    img.set(x + 10, y - 1, c.hair);
  }
  if (c.pony) {
    img.rect(x + 12, y + 3, 2, 7, c.hair);
    img.set(x + 13, y + 8, c.hairL);
    img.rect(x + 12, y + 3, 2, 1, c.pony);
  }
  if (c.hardhat) {
    const [h, hl, hd] = c.hardhat;
    img.rect(x + 3, y - 3, 8, 1, h);
    img.rect(x + 2, y - 2, 10, 3, h);
    img.rect(x + 4, y - 2, 3, 1, hl);
    img.rect(x + 6, y - 3, 2, 4, hd);
    img.rect(x + 1, y + 1, 12, 1, hd);
  }
  if (c.beard) {
    img.rect(x + 3, y + 9, 1, 3, c.beard);
    img.rect(x + 10, y + 9, 1, 3, c.beard);
    img.set(x + 4, y + 11, c.beard);
    img.set(x + 9, y + 11, c.beard);
    img.rect(x + 4, y + 12, 6, 2, c.beard);
    img.rect(x + 5, y + 11, 4, 1, c.mouth);
  }
  if (c.bindi) img.set(x + 6, y + 6, c.bindi);
  if (c.extra === "glasses") {
    img.set(x + 4, y + 6, c.glasses);
    img.set(x + 5, y + 6, c.glasses);
    img.set(x + 8, y + 6, c.glasses);
    img.set(x + 9, y + 6, c.glasses);
  }
}

function paintSide(img, ox, oy, c, phase) {
  const x = ox + 10;
  const y = oy + 32;
  const step = [0, 2, 0, -1][phase];
  img.rect(x + 2, y, 7, 2, c.hair);
  img.rect(x + 1, y + 1, 8, 4, c.hair);
  img.set(x + 6, y + 1, c.hairL);
  img.rect(x + 3, y + 5, 6, 7, c.skin);
  img.rect(x + 2, y + 6, 1, 5, c.outline);
  img.rect(x + 9, y + 6, 1, 4, c.outline);
  img.set(x + 7, y + 7, c.white);
  img.set(x + 8, y + 7, c.eye);
  img.set(x + 8, y + 9, c.skinD);
  img.set(x + 6, y + 10, c.blush);
  img.rect(x + 7, y + 11, 2, 1, c.mouth);
  img.rect(x + 4, y + 12, 3, 2, c.skin);
  img.rect(x + 3, y + 14, 6, 8, c.shirt);
  img.rect(x + 3, y + 14, 1, 8, c.shirtD);
  img.rect(x + 8, y + 14, 1, 8, c.shirtL);
  img.rect(x + 8, y + 16, 2, 5, c.shirtL);
  img.set(x + 9, y + 20, c.skin);
  img.rect(x + 4, y + 22, 3, 7 + (phase % 2), c.pants);
  img.rect(x + 6, y + 24 - step, 3, 5, c.pants);
  img.rect(x + 4, y + 29, 3, 2, c.shoe);
  img.rect(x + 6, y + 29 - Math.min(step, 0), 3, 2, c.shoe);
  if (c.apron) img.rect(x + 5, y + 16, 3, 6, c.apron);
  if (c.collar) img.set(x + 7, y + 14, c.collar);
  if (c.tie) img.rect(x + 6, y + 14, 1, 6, c.tie);
  if (c.bun) {
    img.rect(x, y, 3, 3, c.hair);
    img.rect(x + 1, y - 1, 2, 1, c.hair);
  }
  if (c.messy) {
    img.set(x + 3, y - 1, c.hair);
    img.set(x + 6, y - 1, c.hair);
  }
  if (c.pony) {
    img.rect(x, y + 2, 2, 7, c.hair);
    img.rect(x, y + 2, 2, 1, c.pony);
  }
  if (c.hardhat) {
    const [h, hl, hd] = c.hardhat;
    img.rect(x + 2, y - 3, 7, 1, h);
    img.rect(x + 1, y - 2, 9, 3, h);
    img.rect(x + 3, y - 2, 2, 1, hl);
    img.rect(x + 1, y + 1, 10, 1, hd);
  }
  if (c.beard) {
    img.rect(x + 3, y + 9, 1, 3, c.beard);
    img.rect(x + 4, y + 11, 5, 3, c.beard);
    img.rect(x + 7, y + 11, 2, 1, c.mouth);
  }
  if (c.extra === "glasses") img.set(x + 8, y + 6, c.glasses);
}

function paintUp(img, ox, oy, c, phase) {
  const x = ox + 9;
  const y = oy + 32;
  const arm = [0, 1, 0, -1][phase];
  const step = [0, 1, 0, -1][phase];
  img.rect(x + 2, y, 10, 8, c.hair);
  img.rect(x + 5, y + 1, 4, 1, c.hairL);
  img.rect(x + 4, y + 8, 6, 3, c.skin);
  img.rect(x + 3, y + 11, 8, 8, c.shirt);
  img.rect(x + 3, y + 11, 2, 8, c.shirtD);
  img.rect(x + 9, y + 11, 2, 8, c.shirtL);
  img.rect(x + 6, y + 13, 2, 4, c.shirtD);
  img.rect(x + 1, y + 12 + arm, 2, 6, c.shirtD);
  img.rect(x + 11, y + 12 - arm, 2, 6, c.shirt);
  img.set(x + 1, y + 17 + arm, c.skin);
  img.set(x + 12, y + 17 - arm, c.skin);
  img.rect(x + 3, y + 19, 3, 8, c.pants);
  img.rect(x + 8, y + 19, 3, 8, c.pants);
  img.rect(x + 3, y + 27, 3, 2, c.shoe);
  img.rect(x + 8, y + 27 + (step > 0 ? 0 : 0), 3, 2, c.shoe);
  img.rect(x + 3 - Math.max(step, 0), y + 29, 3, 2, c.shoe);
  img.rect(x + 8, y + 29, 3, 2, c.shoe);
  if (c.bun) {
    img.rect(x + 5, y - 4, 4, 1, c.hair);
    img.rect(x + 4, y - 3, 6, 3, c.hair);
  }
  if (c.messy) {
    img.set(x + 4, y - 1, c.hair);
    img.set(x + 8, y - 1, c.hair);
  }
  if (c.pony) {
    img.rect(x + 6, y + 6, 2, 8, c.hair);
    img.rect(x + 6, y + 6, 2, 1, c.pony);
  }
  if (c.hardhat) {
    const [h, hl, hd] = c.hardhat;
    img.rect(x + 3, y - 3, 8, 1, h);
    img.rect(x + 2, y - 2, 10, 3, h);
    img.rect(x + 6, y - 3, 2, 4, hd);
    img.rect(x + 1, y + 1, 12, 1, hd);
  }
}

/** Seated, facing you: the intro's café scene sits Mabel at a table. Same head and torso as the down frame. */
function shade(hex, f) {
  const n = Number.parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => ch(v).toString(16).padStart(2, "0")).join("")}`;
}

function paintSit(img, ox, oy, c) {
  paintDown(img, ox, oy, c, 0);
  const x = ox + 9;
  const y = oy + 32;
  // Seated, facing the viewer: clear the standing legs, then knees come forward wider than the hips,
  // short shins hang in front of the seat, and the chair shows between them.
  for (let yy = y + 22; yy < y + 32; yy++) for (let xx = x - 1; xx < x + 15; xx++) img.clear(xx, yy);
  const lit = shade(c.pants, 1.3);
  const dark = shade(c.pants, 0.72);
  img.rect(x + 2, y + 22, 10, 1, c.pants);
  img.rect(x + 1, y + 23, 12, 2, c.pants);
  img.rect(x + 2, y + 23, 3, 1, lit);
  img.rect(x + 9, y + 23, 3, 1, lit);
  img.rect(x + 6, y + 23, 2, 2, dark);
  img.rect(x + 2, y + 25, 3, 2, dark);
  img.rect(x + 9, y + 25, 3, 2, dark);
  img.rect(x + 1, y + 27, 4, 1, c.shoe);
  img.rect(x + 9, y + 27, 4, 1, c.shoe);
  if (c.apron) img.rect(x + 4, y + 21, 6, 3, c.apron);
}

const out = process.argv[2] || "public/art/gen/sprites";
mkdirSync(out, { recursive: true });
for (const [name, spec] of Object.entries(CASTS)) {
  const img = canvas();
  const paint = [paintDown, paintSide, paintUp];
  for (let row = 0; row < 3; row++) {
    for (let frame = 0; frame < 4; frame++) paint[row](img, frame * 32, row * 64, spec, frame);
  }
  writeFileSync(`${out}/${name}_walk4.png`, png(128, 192, img.px));
  // The intro tableaux (tools/artkit/scenes.py) stand people in their idle frame, or sit them.
  writeFileSync(`${out}/${name}_idle_32.png`, png(32, 64, cell(img, 0, 0)));
  const sit = canvas();
  paintSit(sit, 0, 0, spec);
  writeFileSync(`${out}/${name}_sit.png`, png(32, 64, cell(sit, 0, 0)));
}
console.log("wrote", Object.keys(CASTS).length, "sheets to", out);
