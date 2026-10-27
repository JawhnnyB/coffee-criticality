import { ROOMS, residueKey, type ResidueHow, type RoomId } from "./content";
import { LOOKS, PAL, drawChibi, drawEmote, pix } from "./pixel";
import { A6_ROOMS } from "./roomArt";
import { ROOM_ATLAS, type AtlasStamp } from "./roomAtlas";
import { MY_DESK, SEC, flapOpen, portalLamp, secRequired } from "./security";
import { npcsHere, type GameState } from "./sim";

const artCache = new Map<string, HTMLImageElement>();
let camX = 0;
let camY = 0;
let lastRoom: RoomId | null = null;
let buf: HTMLCanvasElement | null = null;

function warm(src: string) {
  let im = artCache.get(src);
  if (!im) {
    im = new Image();
    im.crossOrigin = "anonymous";
    im.src = src;
    artCache.set(src, im);
  }
  return im;
}

function img(src: string) {
  const im = warm(src);
  return im.complete && im.naturalWidth > 0 ? im : null;
}

const WALKERS = ["player", "mabel", "holt", "elena", "tommy", "marcus", "priya", "jordan"];

/** Start atlas and walk-sheet loads. Call when a door fade begins so the next room is ready. */
export function preloadRoomArt(roomId?: string) {
  const ids = roomId && ROOM_ATLAS[roomId] ? [roomId] : Object.keys(ROOM_ATLAS);
  for (const id of ids) warm(ROOM_ATLAS[id].src);
  for (const who of WALKERS) warm(`/art/gen/sprites/${who}_walk4.png`);
  warm(DEE_SRC);
  warm(PORTAL_SRC);
}

const DEE_SRC = "/art/gen/sprites/dee_idle_32.png";
/** iris post red/amber/green 16x34 at x=0/16/32; lane flap closed x=52, open x=62 (6x34). Prop top sits at sheet y=1. */
const PORTAL_SRC = "/art/ui/security/portal-sprites.png";
const LAMP_COL = { red: 0, amber: 1, green: 2 } as const;

/** Day-1 guide line. 4px #3aa0c0, lit top, dark bottom, white chevrons every 28px. tools/artkit/security.py _line(). */
function drawGuide(g: CanvasRenderingContext2D) {
  const pts = SEC.guide;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    if (y0 === y1) {
      const xa = Math.min(x0, x1);
      const xb = Math.max(x0, x1);
      g.fillStyle = "#3aa0c0";
      g.fillRect(xa, y0 - 2, xb - xa, 4);
      g.fillStyle = "#7ebdcb";
      g.fillRect(xa, y0 - 2, xb - xa, 1);
      g.fillStyle = "#367d94";
      g.fillRect(xa, y0 + 1, xb - xa, 1);
      const d = x1 > x0 ? 1 : -1;
      g.fillStyle = "#f6f0d8";
      for (let xx = xa + 14; xx < xb - 8; xx += 28) {
        for (let k = 0; k < 3; k++) {
          g.fillRect(xx - d * k, y0 - 1 - k, 1, 1);
          g.fillRect(xx - d * k, y0 + k, 1, 1);
        }
      }
    } else {
      const ya = Math.min(y0, y1);
      const yb = Math.max(y0, y1);
      g.fillStyle = "#3aa0c0";
      g.fillRect(x0 - 2, ya, 4, yb - ya);
      g.fillStyle = "#7ebdcb";
      g.fillRect(x0 - 2, ya, 1, yb - ya);
      g.fillStyle = "#367d94";
      g.fillRect(x0 + 1, ya, 1, yb - ya);
      const d = y1 > y0 ? 1 : -1;
      g.fillStyle = "#f6f0d8";
      for (let yy = ya + 10; yy < yb - 6; yy += 28) {
        for (let k = 0; k < 3; k++) {
          g.fillRect(x0 - 1 - k, yy - d * k, 1, 1);
          g.fillRect(x0 + k, yy - d * k, 1, 1);
        }
      }
    }
  }
}

function getBuf(w: number, h: number) {
  if (!buf) buf = document.createElement("canvas");
  if (buf.width !== w || buf.height !== h) {
    buf.width = w;
    buf.height = h;
  }
  return buf;
}

function lampPool(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const cx = Math.round(x);
  const cy = Math.round(y);
  ctx.fillStyle = "rgba(255,226,160,0.22)";
  ctx.beginPath();
  ctx.ellipse(cx, cy, 22, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, cy, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function blitStamp(ctx: CanvasRenderingContext2D, atlas: CanvasImageSource, st: AtlasStamp) {
  ctx.drawImage(atlas, st.sx, st.sy, st.sw, st.sh, st.x, st.y, st.sw, st.sh);
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  viewW: number,
  viewH: number,
  now: number,
  _dt = 1 / 60,
) {
  pix(ctx);
  const room = ROOMS[s.room];
  const cover = Math.max(viewW / Math.max(1, room.w), viewH / Math.max(1, room.h));
  const zoom = Math.max(2, Math.min(5, Math.floor(cover)));
  const bw = Math.max(1, Math.min(room.w, Math.ceil(viewW / zoom)));
  const bh = Math.max(1, Math.min(room.h, Math.ceil(viewH / zoom)));
  const off = getBuf(bw, bh);
  const g = off.getContext("2d");
  if (!g) return;
  pix(g);

  const shakeX = s.shake > 0 ? Math.round(Math.sin(now * 48) * 2 * s.shake) : 0;
  const shakeY = s.shake > 0 ? Math.round(Math.cos(now * 41) * 2 * s.shake) : 0;
  let targetX = s.x;
  let targetY = s.y - 6;
  if (s.moving && !s.sitting) {
    if (s.facing === "right") targetX += 10;
    else if (s.facing === "left") targetX -= 10;
    else if (s.facing === "down") targetY += 8;
    else targetY -= 8;
  }
  if (room.w > bw) targetX = Math.max(bw / 2, Math.min(room.w - bw / 2, s.x));
  else targetX = room.w / 2;
  if (room.h > bh) targetY = Math.max(bh / 2, Math.min(room.h - bh / 2, s.y - 6));
  else targetY = room.h / 2;
  targetX += shakeX;
  targetY += shakeY;

  if (lastRoom !== s.room) {
    camX = targetX;
    camY = targetY;
    lastRoom = s.room;
  } else {
    camX += (targetX - camX) * 0.28;
    camY += (targetY - camY) * 0.28;
  }

  g.fillStyle = PAL.ink;
  g.fillRect(0, 0, bw, bh);
  g.save();
  g.translate(Math.round(bw / 2 - camX), Math.round(bh / 2 - camY));

  const a6Room = A6_ROOMS.has(room.id);
  const spec = a6Room ? ROOM_ATLAS[room.id] : undefined;
  const atlas = spec ? img(spec.src) : null;
  const usingA6 = !!(spec && atlas);
  if (usingA6 && atlas && spec) {
    g.drawImage(atlas, 0, 0, room.w, room.h, 0, 0, room.w, room.h);
    for (const st of spec.stamps) {
      if (st.kind !== "rug") continue;
      blitStamp(g, atlas, st);
    }
    for (const p of room.props) {
      if (p.kind !== "lamp") continue;
      lampPool(g, p.rect.x + p.rect.w / 2, p.rect.y + p.rect.h);
    }
  }

  if (usingA6 && s.room === "security" && secRequired(s)) drawGuide(g);

  fillEdge(g, room);

  const drawables: { y: number; draw: () => void }[] = [];

  if (usingA6 && atlas && spec) {
    for (const st of spec.stamps) {
      if (st.kind === "rug") continue;
      drawables.push({
        y: st.foot,
        draw: () => blitStamp(g, atlas, st),
      });
    }
    if (s.room === "control") {
      const board = room.props.find((p) => p.kind === "board");
      drawBoardA(g, board?.rect ?? { x: 64, y: 16, w: 80, h: 32 }, s.day, dayMark(s), now);
      drawables.push({
        y: 212,
        draw: () => drawPaperLog(g, s.day, dayMark(s)),
      });
    }
  }

  if (usingA6 && s.room === "security") {
    const sheet = img(PORTAL_SRC);
    const lamp = LAMP_COL[portalLamp(s, s.mode === "iris")];
    const dee = img(DEE_SRC);
    if (dee) {
      /* Cell origin (x-16, y-64): the feet land on SEC.dee.y, the desk (foot 96) covers her legs. */
      drawables.push({ y: SEC.dee.y, draw: () => g.drawImage(dee, SEC.dee.x - 16, SEC.dee.y - 64) });
    }
    if (sheet) {
      SEC.posts.forEach((r, i) => {
        drawables.push({ y: i === 0 ? 113 : 257, draw: () => g.drawImage(sheet, lamp * 16, 0, 16, 34, r.x, r.y - 1, 16, 34) });
      });
      const open = flapOpen(s);
      drawables.push({
        y: SEC.flap.y + SEC.flap.h,
        draw: () => g.drawImage(sheet, open ? 62 : 52, 0, 6, 34, SEC.flap.x + 5, SEC.flap.y - 1, 6, 34),
      });
    }
  }
  if (usingA6 && s.room === "engineering" && s.day === 1 && s.flags["sec:portal"] && !s.flags["sec:desk"] && Math.floor(now * 4) % 2 === 0) {
    const np = MY_DESK.nameplate;
    drawables.push({
      y: MY_DESK.rect.y + MY_DESK.rect.h + 1,
      draw: () => {
        g.fillStyle = "#e8b838";
        g.fillRect(np.x - 1, np.y - 1, np.w + 2, 1);
        g.fillRect(np.x - 1, np.y + np.h, np.w + 2, 1);
        g.fillRect(np.x - 1, np.y, 1, np.h);
        g.fillRect(np.x + np.w, np.y, 1, np.h);
      },
    });
  }
  for (const n of npcsHere(s)) {
    drawables.push({
      y: n.y,
      draw: () => {
        const facing = n.facing;
        drawChibi(g, n.x, n.y, LOOKS[n.id], facing, n.phase, n.moving, false, n.id);
        if (n.emote) drawEmote(g, n.x, n.y, n.emote, now);
      },
    });
  }
  drawables.push({
    y: s.y,
    draw: () =>
      drawChibi(g, s.x, s.y, LOOKS.player, s.facing, s.walkPhase, s.moving && !s.sitting, true, "player", s.playerLook, s.sitting),
  });

  drawables.sort((a, b) => a.y - b.y);
  for (const d of drawables) d.draw();
  if (usingA6) {
    g.fillStyle = "#3b2318";
    g.fillRect(0, 0, 1, room.h);
    g.fillRect(room.w - 1, 0, 1, room.h);
    g.fillRect(0, room.h - 1, room.w, 1);
    if (room.id === "gate") g.fillRect(0, 0, room.w, 1);
  }

  g.restore();

  ctx.fillStyle = PAL.ink;
  ctx.fillRect(0, 0, viewW, viewH);
  pix(ctx);
  const dw = bw * zoom;
  const dh = bh * zoom;
  const ox = Math.floor((viewW - dw) / 2);
  const oy = Math.floor((viewH - dh) / 2);
  ctx.drawImage(off, 0, 0, bw, bh, ox, oy, dw, dh);

  if (s.period !== "midday") {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = s.period === "morning" ? "#fff2dc" : "#f0c8a0";
    ctx.fillRect(ox, oy, dw, dh);
    ctx.restore();
  }

  if (s.fade > 0 && !s.mapHop) {
    ctx.fillStyle = `rgba(22,17,13,${Math.min(1, s.fade)})`;
    ctx.fillRect(0, 0, viewW, viewH);
  }
}

function fillEdge(ctx: CanvasRenderingContext2D, room: (typeof ROOMS)[RoomId]) {
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(-8, -8, room.w + 16, 8);
  ctx.fillRect(-8, room.h, room.w + 16, 8);
  ctx.fillRect(-8, 0, 8, room.h);
  ctx.fillRect(room.w, 0, 8, room.h);
}

/** 3×5 bitmap glyphs. Canvas fillText at 5px antialiases, then the integer zoom turns it to mush. */
const GLYPH: Record<string, string[]> = {
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["011", "100", "100", "100", "011"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["011", "100", "101", "101", "011"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "010"],
  K: ["101", "110", "100", "110", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["101", "111", "111", "101", "101"],
  N: ["110", "101", "101", "101", "101"],
  O: ["010", "101", "101", "101", "010"],
  P: ["110", "101", "110", "100", "100"],
  Q: ["010", "101", "101", "011", "001"],
  R: ["110", "101", "110", "101", "101"],
  S: ["011", "100", "010", "001", "110"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "011"],
  V: ["101", "101", "101", "010", "010"],
  W: ["101", "101", "111", "111", "101"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["110", "001", "010", "100", "111"],
  "3": ["110", "001", "110", "001", "110"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "110", "001", "110"],
  "6": ["011", "100", "110", "101", "011"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "110"],
  "-": ["000", "000", "111", "000", "000"],
  ".": ["000", "000", "000", "000", "010"],
  "/": ["001", "001", "010", "100", "100"],
  ":": ["000", "010", "000", "010", "000"],
  "!": ["010", "010", "010", "000", "010"],
  "=": ["000", "111", "000", "111", "000"],
  "·": ["000", "000", "010", "000", "000"],
  " ": ["000", "000", "000", "000", "000"],
};

export function glyphWidth(text: string, scale = 2) {
  const n = text.length;
  if (n <= 0) return 0;
  return n * 4 * scale - scale;
}

export function paintGlyphs(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  scale = 2,
) {
  const upper = text.toUpperCase();
  const adv = 4 * scale;
  ctx.fillStyle = color;
  let cx = Math.round(x);
  const cy = Math.round(y);
  for (const ch of upper) {
    const g = GLYPH[ch] ?? GLYPH[" "];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        if (g[row][col] === "1") ctx.fillRect(cx + col * scale, cy + row * scale, scale, scale);
      }
    }
    cx += adv;
  }
}

function pixText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  color: string,
  maxW: number,
) {
  const upper = text.toUpperCase();
  const wide = upper.length * 8 - 2;
  const scale = wide <= maxW ? 2 : 1;
  const adv = scale === 2 ? 8 : 4;
  const tw = upper.length * adv - scale;
  let x = Math.round(cx - tw / 2);
  ctx.fillStyle = color;
  for (const ch of upper) {
    const g = GLYPH[ch] ?? GLYPH[" "];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        if (g[row][col] === "1") ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
      }
    }
    x += adv;
  }
}

function dayMark(s: GameState): ResidueHow {
  const key = residueKey(s.day);
  return key ? s.residue[key] : "open";
}

function drawBoardA(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; w: number; h: number },
  day: number,
  mark: ResidueHow,
  now: number,
) {
  const caught = mark === "caught";
  const pulse = caught ? 0.2 : 0.45 + Math.abs(Math.sin(now * 3.2)) * 0.5;
  const x = Math.round(rect.x);
  const y = Math.round(rect.y);
  const w = Math.round(rect.w);
  const h = Math.round(rect.h);
  ctx.fillStyle = caught ? PAL.leaf : `rgba(201,162,39,${0.45 + pulse * 0.5})`;
  ctx.fillRect(x + 6, y + h - 7, w - 12, 3);
  const line =
    day === 1 ? (caught ? "14-R CLOSED" : "14-B OPEN")
    : day === 2 ? (caught ? "2A LOCKED" : "2A IN SVC")
    : day === 3 ? (caught ? "0.04 mSv/h" : "40 mSv/h")
    : day === 4 ? (caught ? "LOG SIGNED" : mark === "hid" ? "YOUR NAME" : "NO INITIALS")
    : "SHUFFLE DAY";
  const color = caught ? PAL.leaf : PAL.gold;
  const parts = line.toUpperCase().split(" ");
  parts.forEach((part, i) => {
    const tw = part.length * 8 - 2;
    pixText(ctx, part, x + w - 8 - tw / 2, y - 24 + i * 12, color, tw + 4);
  });
}

function drawPaperLog(ctx: CanvasRenderingContext2D, day: number, mark: ResidueHow) {
  const x = 88;
  const y = 164;
  const w = 104;
  const h = 48;
  const caught = mark === "caught";
  ctx.fillStyle = caught ? PAL.leaf : PAL.gold;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = PAL.cream;
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  let mid = "EV 07:12";
  let foot = "CHECK";
  if (day === 1) {
    mid = "14-R CLOSED";
    foot = caught ? "CAUGHT" : mark === "hid" ? "HID" : "!= 14-B";
  } else if (day === 2) {
    mid = caught ? "2A LOCKED" : "2A IN SVC";
    foot = caught ? "CAUGHT" : mark === "hid" ? "HID" : "CHECK";
  } else if (day === 3) {
    mid = caught ? "0.04" : "40";
    foot = caught ? "CAUGHT" : mark === "hid" ? "HID" : "CHECK";
  } else if (day === 4) {
    mid = caught ? "SIGNED" : mark === "hid" ? "YOUR NAME" : "- 07:12";
    foot = caught ? "CAUGHT" : mark === "hid" ? "HID" : "BLANK";
  } else {
    mid = "SHUFFLE";
    foot = "DAY";
  }
  pixText(ctx, "PAPER LOG", x + w / 2, y + 6, PAL.ink, w - 8);
  pixText(ctx, mid, x + w / 2, y + 18, PAL.ink, w - 8);
  pixText(ctx, foot, x + w / 2, y + 30, caught ? PAL.leaf : "#8a3a32", w - 8);
}

export function roomName(id: RoomId) {
  return ROOMS[id].name;
}
