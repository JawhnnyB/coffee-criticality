import { applyWorldPostFx, postFxOn, type Light } from "./postfx";
import { ROOMS, residueKey, type ResidueHow, type RoomId } from "./content";
import { boardFace } from "./boardMark";
import { LOOKS, PAL, drawChibi, drawEmote, pix, steam } from "./pixel";
import { maintenanceSteamOn } from "./steamRule";
import { A6_ROOMS } from "./roomArt";
import { ROOM_ATLAS, type AtlasStamp } from "./roomAtlas";
import { HALL_PIPES, drawHallReactor, drawLaggedPipe, drawLotRoof, drawMimic, type HallState } from "./hallPlant";
import { PLANTS, cherenkov, siteKind, sitePower } from "./plantLoops";
import { readFace } from "./siteFace";
import { worldZoom } from "./artScale";
import { SEASON_INFO, seasonOrDefault } from "./parlorOS";
import { npcsHere, type GameState } from "./sim";
import { shakeOn } from "./frameRate";

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
  for (const who of [...WALKERS, "colt"]) warm(`/art/gen/sprites/${who}_walk4.png`);
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
  const zoom = worldZoom(viewW, viewH, room.w, room.h);
  const bw = Math.max(1, Math.min(room.w, Math.ceil(viewW / zoom)));
  const bh = Math.max(1, Math.min(room.h, Math.ceil(viewH / zoom)));
  const off = getBuf(bw, bh);
  const g = off.getContext("2d");
  if (!g) return;
  pix(g);

  const allowShake = shakeOn() && s.shake > 0;
  const shakeX = allowShake ? Math.round(Math.sin(now * 48) * 2 * s.shake) : 0;
  const shakeY = allowShake ? Math.round(Math.cos(now * 41) * 2 * s.shake) : 0;
  let targetX = s.x;
  let targetY = s.y - 6;
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
    // The same glide at any frame rate. At 60 frames a second this is the old 0.28 a frame.
    const ease = 1 - Math.pow(0.72, Math.max(0, Math.min(0.1, _dt)) * 60);
    camX += (targetX - camX) * ease;
    camY += (targetY - camY) * ease;
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
    if (s.room === "corridor") drawHallRunner(g, room.w, room.h);
    for (const p of room.props) {
      if (p.kind !== "lamp") continue;
      lampPool(g, p.rect.x + p.rect.w / 2, p.rect.y + p.rect.h);
    }
  }

  fillEdge(g, room);

  const drawables: { y: number; draw: () => void }[] = [];

  if (usingA6 && atlas && spec) {
    // The reactor hall draws its vessel and its two main pipes for the site's reactor type.
    const hall = s.room === "reactor";
    const HALL_REDRAWN = new Set(["core", "pipe_run", "pipe_corner", "pipe_v"]);
    for (const st of spec.stamps) {
      if (st.kind === "rug") continue;
      if (hall && HALL_REDRAWN.has(st.kind)) continue;
      drawables.push({
        y: st.foot,
        draw: () => blitStamp(g, atlas, st),
      });
    }
    if (hall) {
      const kind = siteKind(s.plant);
      const power = sitePower(s.run);
      const ran = s.run.history.length > 0 || s.run.powerPct > 0;
      const level = s.run.scram ? 0.08 : power;
      const face = readFace();
      const st: HallState = {
        kind,
        glow: cherenkov(PLANTS[kind], level > 0.02) ? level : 0,
        flow: (ran ? Math.max(0, s.run.flowPct / 100) : 1) * face.flowMul,
        hot: level > 0.02,
        tubeMark: face.tubeMark,
      };
      const t = now;
      const pipes = HALL_PIPES[kind];
      // Out of the vessel to the right and down the wall; back in from the left, past valve 14.
      drawables.push({ y: 112, draw: () => drawLaggedPipe(g, 224, 99, 62, 10, pipes.out, 1, st.flow, t) });
      drawables.push({ y: 176, draw: () => drawLaggedPipe(g, 275, 104, 10, 72, pipes.out, 1, st.flow, t) });
      drawables.push({ y: 128, draw: () => drawLaggedPipe(g, 96, 115, 50, 10, pipes.back, 1, st.flow, t) });
      drawables.push({ y: 144, draw: () => drawHallReactor(g, { x: 144, y: 64, w: 81, h: 83 }, st, t) });
    }
    if (s.room === "gate") {
      const kind = siteKind(s.plant);
      const running = !s.run.scram && sitePower(s.run) > 0.02;
      // Over the roof of the reactor building stamp, above its facade.
      drawables.push({ y: 192.5, draw: () => drawLotRoof(g, { x: 1249, y: 97, w: 190, h: 64 }, kind, running, now) });
    }
    if (s.room === "control") {
      const kind = siteKind(s.plant);
      const level = s.run.scram ? 0.08 : sitePower(s.run);
      const ran = s.run.history.length > 0 || s.run.powerPct > 0;
      const face = readFace();
      const st: HallState = {
        kind,
        glow: cherenkov(PLANTS[kind], level > 0.02) ? level : 0,
        flow: (ran ? Math.max(0, s.run.flowPct / 100) : 1) * face.flowMul,
        hot: level > 0.02,
        tubeMark: face.tubeMark,
      };
      // The wall panel beside the window becomes the plant mimic.
      drawables.push({ y: 30, draw: () => drawMimic(g, { x: 190, y: 6, w: 44, h: 22 }, PLANTS[kind], st, now) });
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
  for (const p of room.props) {
    if (p.kind === "laptop") drawLaptop(g, p.rect.x, p.rect.y);
  }
  if (s.room === "maintenance" && maintenanceSteamOn(s.day, s.residue.valve)) {
    const valve = room.props.find((p) => p.kind === "valve");
    const vx = valve ? valve.rect.x + Math.round(valve.rect.w / 2) : 120;
    const vy = valve ? valve.rect.y : 120;
    steam(g, vx, vy, now, true);
  }
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

  if (postFxOn()) {
    const tx = Math.round(bw / 2 - camX);
    const ty = Math.round(bh / 2 - camY);
    const toScreenX = (wx: number) => ox + (wx + tx) * zoom;
    const toScreenY = (wy: number) => oy + (wy + ty) * zoom;
    const lights: Light[] = [];
    for (const p of room.props) {
      if (p.kind !== "lamp") continue;
      lights.push({
        x: toScreenX(p.rect.x + p.rect.w / 2),
        y: toScreenY(p.rect.y + p.rect.h / 2),
        r: 70 * zoom,
        color: "rgba(255,206,140,0.9)",
        strength: 0.55,
      });
    }
    for (const win of room.windows ?? []) {
      lights.push({
        x: toScreenX(win.rect.x + win.rect.w / 2),
        y: toScreenY(win.rect.y + win.rect.h),
        r: 90 * zoom,
        color: "rgba(170,210,255,0.8)",
        strength: 0.25,
      });
    }
    applyWorldPostFx(ctx, { x: ox, y: oy, w: dw, h: dh }, lights);
  }

  if (s.period !== "midday") {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = s.period === "morning" ? "#fff2dc" : "#f0c8a0";
    ctx.fillRect(ox, oy, dw, dh);
    ctx.restore();
  }
  // Lot scenes take the season's tint on the same path as the day tint. Rooms are not repainted.
  if (room.id === "gate") {
    ctx.fillStyle = SEASON_INFO[seasonOrDefault(s.setup.season)].lotTint;
    ctx.fillRect(ox, oy, dw, dh);
  }

  if (s.fade > 0 && !s.mapHop) {
    ctx.fillStyle = `rgba(22,17,13,${Math.min(1, s.fade)})`;
    ctx.fillRect(0, 0, viewW, viewH);
  }
}

/** A pixel laptop, open, on the cafe counter. Palette only. Its position is the laptop prop's corner. */
function drawLaptop(g: CanvasRenderingContext2D, x: number, y: number) {
  g.fillStyle = PAL.steelD;
  g.fillRect(x + 4, y + 9, 22, 2);
  g.fillStyle = PAL.steel;
  g.fillRect(x + 5, y + 2, 20, 8);
  g.fillStyle = PAL.leafL;
  g.fillRect(x + 7, y + 4, 16, 4);
  g.fillStyle = PAL.ink;
  g.fillRect(x + 8, y + 5, 6, 1);
  g.fillRect(x + 8, y + 7, 10, 1);
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

/** One strip of carpet: ink edge, cream border, body, and a lighter line inside each long edge. */
function runnerStrip(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, along: "x" | "y") {
  g.fillStyle = PAL.outline;
  g.fillRect(x, y, w, h);
  g.fillStyle = PAL.cream;
  g.fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle = PAL.badD;
  g.fillRect(x + 3, y + 3, w - 6, h - 6);
  g.fillStyle = PAL.bad;
  if (along === "x") {
    g.fillRect(x + 3, y + 5, w - 6, 1);
    g.fillRect(x + 3, y + h - 6, w - 6, 1);
  } else {
    g.fillRect(x + 5, y + 3, 1, h - 6);
    g.fillRect(x + w - 6, y + 3, 1, h - 6);
  }
}

/**
 * The corridor is the hub of Unit 1 and its floor was bare. A carpet runner joins the four doors.
 * It is floor decoration only: nothing blocks, and nothing in content.ts changes.
 */
function drawHallRunner(g: CanvasRenderingContext2D, roomW: number, roomH: number) {
  const band = 28;
  const midY = Math.round(roomH / 2);
  const midX = Math.round(roomW / 2);
  runnerStrip(g, midX - band / 2, 50, band, roomH - 50 - 26, "y");
  runnerStrip(g, 8, midY - band / 2, roomW - 16, band, "x");
  // Where the two strips cross: one body, and a cream diamond.
  g.fillStyle = PAL.badD;
  g.fillRect(midX - band / 2 + 3, midY - band / 2 + 3, band - 6, band - 6);
  g.fillStyle = PAL.cream;
  for (let i = 0; i < 4; i++) g.fillRect(midX - i, midY - 3 + i, i * 2 + 1, 1);
  for (let i = 0; i < 3; i++) g.fillRect(midX - 2 + i, midY + 1 + i, 5 - i * 2, 1);
}

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
  const face = boardFace(day, mark);
  const pulse = face.leaf ? 0.2 : 0.45 + Math.abs(Math.sin(now * 3.2)) * 0.5;
  const x = Math.round(rect.x);
  const y = Math.round(rect.y);
  const w = Math.round(rect.w);
  const h = Math.round(rect.h);
  ctx.fillStyle = face.leaf ? PAL.leaf : `rgba(201,162,39,${0.45 + pulse * 0.5})`;
  ctx.fillRect(x + 6, y + h - 7, w - 12, 3);
  const color = face.leaf ? PAL.leaf : PAL.gold;
  const parts = face.line.toUpperCase().split(" ");
  const plateW = Math.max(...parts.map((part) => part.length * 8)) + 8;
  const plateH = parts.length * 12 + 4;
  const plateX = x + 4;
  const plateY = y - plateH - 4;
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(plateX, plateY, plateW, plateH);
  parts.forEach((part, i) => {
    pixText(ctx, part, plateX + 4 + (part.length * 8 - 2) / 2, plateY + 2 + i * 12, color, plateW - 4);
  });
}

function drawPaperLog(ctx: CanvasRenderingContext2D, day: number, mark: ResidueHow) {
  const face = boardFace(day, mark);
  const x = 88;
  const y = 164;
  const w = 104;
  const h = 48;
  ctx.fillStyle = face.leaf ? PAL.leaf : PAL.gold;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = PAL.cream;
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  pixText(ctx, "PAPER LOG", x + w / 2, y + 6, PAL.ink, w - 8);
  pixText(ctx, face.paperMid, x + w / 2, y + 18, PAL.ink, w - 8);
  pixText(ctx, face.paperFoot, x + w / 2, y + 30, face.leaf ? PAL.leaf : "#8a3a32", w - 8);
}

export function roomName(id: RoomId) {
  return ROOMS[id].name;
}
