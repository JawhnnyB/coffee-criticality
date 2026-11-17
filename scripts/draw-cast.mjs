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
  return { set, rect, px };
}

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
  mabel: {
    outline: PAL.outline,
    hair: PAL.ash,
    hairL: PAL.cream,
    skin: PAL.skin,
    skinD: PAL.skin2,
    blush: PAL.skinBlush,
    eye: PAL.ink,
    white: PAL.white,
    mouth: PAL.bad,
    glasses: PAL.outline,
    shirt: PAL.copper,
    shirtL: PAL.copperL,
    shirtD: PAL.copperD,
    pants: PAL.woodMid,
    shoe: PAL.ink,
    apron: PAL.cream,
    bun: true,
  },
  holt: {
    outline: PAL.outline,
    hair: PAL.ash,
    hairL: PAL.muted,
    skin: PAL.skin2,
    skinD: PAL.skinTan,
    blush: PAL.skinBlush,
    eye: PAL.ink,
    white: PAL.white,
    mouth: PAL.wood,
    glasses: PAL.gold,
    shirt: PAL.steel,
    shirtL: PAL.steelL,
    shirtD: PAL.ink,
    pants: PAL.woodDark,
    shoe: PAL.ink,
    tie: PAL.gold,
    extra: "glasses",
  },
  elena: {
    outline: PAL.outline,
    hair: PAL.outline,
    hairL: PAL.woodDark,
    skin: PAL.skinTan,
    skinD: PAL.skinBrown,
    blush: PAL.skinBlush,
    eye: PAL.ink,
    white: PAL.white,
    mouth: PAL.bad,
    glasses: PAL.outline,
    shirt: PAL.leaf,
    shirtL: PAL.cream,
    shirtD: PAL.leafD,
    pants: PAL.wood,
    shoe: PAL.ink,
    braid: true,
  },
  tommy: {
    outline: PAL.outline,
    hair: PAL.woodMid,
    hairL: PAL.woodL,
    skin: PAL.skinTan,
    skinD: PAL.copperD,
    blush: PAL.skinBlush,
    eye: PAL.ink,
    white: PAL.white,
    mouth: PAL.wood,
    glasses: PAL.outline,
    shirt: PAL.wood,
    shirtL: PAL.woodL,
    shirtD: PAL.woodDark,
    pants: PAL.steel,
    shoe: PAL.ink,
    cap: PAL.copper,
  },
  marcus: {
    outline: PAL.outline,
    hair: PAL.copperD,
    hairL: PAL.copper,
    skin: PAL.skin2,
    skinD: PAL.skin,
    blush: PAL.skinBlush,
    eye: PAL.ink,
    white: PAL.white,
    mouth: PAL.bad,
    glasses: PAL.steel,
    shirt: PAL.creamD,
    shirtL: PAL.cream,
    shirtD: PAL.muted,
    pants: PAL.woodMid,
    shoe: PAL.ink,
    extra: "glasses",
  },
  priya: {
    outline: PAL.outline,
    hair: PAL.outline,
    hairL: PAL.woodDark,
    skin: PAL.skinBrown,
    skinD: PAL.copperD,
    blush: PAL.wine,
    eye: PAL.ink,
    white: PAL.white,
    mouth: PAL.wine,
    glasses: PAL.outline,
    shirt: PAL.wine,
    shirtL: PAL.copperL,
    shirtD: PAL.ink,
    pants: PAL.woodDark,
    shoe: PAL.ink,
    bun: true,
  },
  jordan: {
    outline: PAL.outline,
    hair: PAL.wood,
    hairL: PAL.copperL,
    skin: PAL.skinTan,
    skinD: PAL.skinBrown,
    blush: PAL.skinBlush,
    eye: PAL.ink,
    white: PAL.white,
    mouth: PAL.copperD,
    glasses: PAL.outline,
    shirt: PAL.leaf,
    shirtL: PAL.gold,
    shirtD: PAL.leafD,
    pants: PAL.woodMid,
    shoe: PAL.ink,
  },
};

function paintDown(img, ox, oy, c, phase) {
  const x = ox + 9;
  const y = oy + 32;
  const arm = [0, 1, 0, -1][phase];
  const step = [0, 1, 0, -1][phase];
  img.rect(x + 3, y, 8, 2, c.hair);
  img.rect(x + 2, y + 1, 10, 4, c.hair);
  img.set(x + 3, y + 1, c.hairL);
  img.set(x + 10, y + 1, c.hairL);
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
  if (c.tie) img.rect(x + 6, y + 14, 2, 6, c.tie);
  if (c.bun) {
    img.rect(x + 4, y - 3, 6, 3, c.hair);
    img.rect(x + 5, y - 4, 4, 2, c.hairL);
  }
  if (c.cap) {
    img.rect(x + 2, y - 2, 10, 2, c.cap);
    img.rect(x + 1, y, 12, 2, c.cap);
  }
  if (c.braid) img.rect(x + 1, y + 6, 1, 8, c.hair);
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
  if (c.tie) img.rect(x + 6, y + 14, 1, 6, c.tie);
  if (c.bun) img.rect(x + 1, y - 1, 4, 3, c.hair);
  if (c.cap) img.rect(x + 1, y - 1, 9, 2, c.cap);
  if (c.braid) img.rect(x + 2, y + 8, 1, 8, c.hair);
  if (c.extra === "glasses") img.set(x + 8, y + 6, c.glasses);
}

function paintUp(img, ox, oy, c, phase) {
  const x = ox + 9;
  const y = oy + 32;
  const arm = [0, 1, 0, -1][phase];
  const step = [0, 1, 0, -1][phase];
  img.rect(x + 2, y, 10, 8, c.hair);
  img.set(x + 3, y + 1, c.hairL);
  img.set(x + 10, y + 1, c.hairL);
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
  if (c.bun) img.rect(x + 4, y - 3, 6, 3, c.hair);
  if (c.cap) img.rect(x + 2, y - 2, 10, 3, c.cap);
  if (c.braid) img.rect(x + 11, y + 6, 1, 8, c.hair);
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
}
console.log("wrote", Object.keys(CASTS).length, "sheets to", out);
