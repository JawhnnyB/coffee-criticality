import { STILLS, ROOMS, type RoomId } from "./content";
import { TILE, WALL } from "./const";
import { DEBUG_ART, WALK_H, WALK_W } from "./artSpec";
import {
  LOOKS,
  PAL,
  asphaltFloor,
  curbFloor,
  drawChibi,
  drawEmote,
  drawDoor,
  drawDoorGlimpse,
  drawPropPixel,
  drawWindow,
  grassFloor,
  kettleGlow,
  lampGlow,
  lotSkyline,
  metalFloor,
  pix,
  skyBand,
  steam,
  stoneFloor,
  stripeFloor,
  wallpaper,
  windMotes,
  windowWash,
  woodFloor,
} from "./pixel";
import { glimpseSrc } from "./site";
import { npcsHere, type GameState } from "./sim";

const artCache = new Map<string, HTMLImageElement>();
let camX = 0;
let camY = 0;
let lastRoom: RoomId | null = null;
let buf: HTMLCanvasElement | null = null;

function img(src: string) {
  let im = artCache.get(src);
  if (!im) {
    im = new Image();
    im.crossOrigin = "anonymous";
    im.src = src;
    artCache.set(src, im);
  }
  return im.complete && im.naturalWidth > 0 ? im : null;
}

function getBuf(w: number, h: number) {
  if (!buf) buf = document.createElement("canvas");
  if (buf.width !== w || buf.height !== h) {
    buf.width = w;
    buf.height = h;
  }
  return buf;
}

function floorTile(ctx: CanvasRenderingContext2D, kind: string, x: number, y: number, seed: number) {
  if (kind === "wood") woodFloor(ctx, x, y, seed);
  else if (kind === "grass") grassFloor(ctx, x, y, seed);
  else if (kind === "asphalt") asphaltFloor(ctx, x, y, seed);
  else if (kind === "curb") curbFloor(ctx, x, y, seed);
  else if (kind === "stripe") stripeFloor(ctx, x, y, seed);
  else if (kind === "metal") metalFloor(ctx, x, y, seed);
  else stoneFloor(ctx, x, y, seed);
}

function drawTiles(ctx: CanvasRenderingContext2D, room: (typeof ROOMS)[RoomId], period: GameState["period"]) {
  const cols = Math.ceil(room.w / TILE);
  const rows = Math.ceil(room.h / TILE);
  const outdoor = room.floorKind === "grass" || room.floorKind === "asphalt";
  if (outdoor) {
    skyBand(ctx, 0, 0, room.w, WALL, period);
    if (room.id === "gate") lotSkyline(ctx, room.w, WALL);
  } else {
    wallpaper(ctx, 0, 0, room.w, WALL, room.accent, room.id === "control" || room.id === "reactor" || room.id === "maintenance");
  }

  for (const win of room.windows ?? []) {
    drawWindow(ctx, win.rect.x, win.rect.y, win.rect.w, win.rect.h, img(STILLS[win.still]?.src ?? room.art));
    if (period === "afternoon") {
      ctx.strokeStyle = PAL.copper;
      ctx.lineWidth = 1;
      ctx.strokeRect(win.rect.x + 0.5, win.rect.y + 0.5, win.rect.w - 1, win.rect.h - 1);
    }
    if (!outdoor) windowWash(ctx, win.rect.x, win.rect.y, win.rect.w, win.rect.h, period);
  }

  for (let ty = Math.floor(WALL / TILE); ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const x = tx * TILE;
      const y = ty * TILE;
      if (y < WALL - 2 && !outdoor) continue;
      const seed = tx * 13 + ty * 7 + room.w;
      let kind: string = room.floorKind;
      for (const p of room.floorPatches ?? []) {
        if (x >= p.rect.x && x < p.rect.x + p.rect.w && y >= p.rect.y && y < p.rect.y + p.rect.h) {
          kind = p.kind;
          break;
        }
      }
      if (room.id === "corridor" && ty >= 6 && ty <= 7) kind = "asphalt";
      if (room.id === "maintenance" && kind === "asphalt") kind = "stripe";
      if (room.id === "gate" && kind === "asphalt" && (tx - 10) % 4 === 0) kind = "stripe";
      floorTile(ctx, kind, x, y, seed);
    }
  }

  if (DEBUG_ART) {
    ctx.strokeStyle = "rgba(243,230,208,0.18)";
    ctx.lineWidth = 1;
    for (let tx = 0; tx <= cols; tx++) {
      ctx.beginPath();
      ctx.moveTo(tx * TILE + 0.5, 0);
      ctx.lineTo(tx * TILE + 0.5, room.h);
      ctx.stroke();
    }
    for (let ty = 0; ty <= rows; ty++) {
      ctx.beginPath();
      ctx.moveTo(0, ty * TILE + 0.5);
      ctx.lineTo(room.w, ty * TILE + 0.5);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(196,120,58,0.85)";
    ctx.strokeRect(0.5, WALL - 0.5, room.w - 1, 1);
    ctx.strokeRect(8.5, WALL + 8.5, WALK_W - 1, WALK_H - 1);
  }
}

function periodTint(period: GameState["period"], indoor: boolean): string {
  if (period === "morning") return indoor ? "rgba(243,230,208,0.07)" : "rgba(243,230,208,0.08)";
  if (period === "midday") return "rgba(0,0,0,0)";
  return indoor ? "rgba(18,16,14,0.16)" : "rgba(18,16,14,0.12)";
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
  // Cover the viewport. Crop with the camera instead of floating the room in ink.
  const cover = Math.max(viewW / Math.max(1, room.w), viewH / Math.max(1, room.h));
  const zoom = Math.max(1, Math.ceil(cover));
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

  drawTiles(g, room, s.period);

  fillEdge(g, room);

  const outdoor = room.floorKind === "grass" || room.floorKind === "asphalt";
  if (outdoor) windMotes(g, room.w, room.h, now, WALL);

  for (const p of room.props) {
    if (p.kind === "lamp") lampGlow(g, p.rect.x + p.rect.w / 2, p.rect.y + p.rect.h, now, s.period);
    if (p.kind === "kettle") kettleGlow(g, p.rect.x + p.rect.w / 2, p.rect.y + p.rect.h, now);
  }

  const FLOOR_PROP = new Set(["rug"]);
  const WALL_PROP = new Set(["poster", "board", "prints", "dose", "crane"]);
  const drawables: { y: number; draw: () => void }[] = [];

  for (const p of room.props) {
    if (FLOOR_PROP.has(p.kind)) {
      drawPropPixel(g, p.kind, p.rect.x, p.rect.y, p.rect.w, p.rect.h, room.accent, now, p.label);
    }
  }

  for (const p of room.props) {
    if (!WALL_PROP.has(p.kind)) continue;
    drawPropPixel(g, p.kind, p.rect.x, p.rect.y, p.rect.w, p.rect.h, room.accent, now, p.label);
  }

  if (s.room === "control") {
    const board = room.props.find((p) => p.kind === "board");
    drawBoardA(g, board?.rect ?? { x: 64, y: 16, w: 80, h: 32 }, s.day, s.incidentResolved, now);
  }

  for (const p of room.props) {
    if (FLOOR_PROP.has(p.kind) || WALL_PROP.has(p.kind)) continue;
    const py = p.rect.y + p.rect.h;
    drawables.push({
      y: py,
      draw: () => {
        drawPropPixel(g, p.kind, p.rect.x, p.rect.y, p.rect.w, p.rect.h, room.accent, now, p.label);
      },
    });
  }

  for (const d of room.doors) {
    const north = d.rect.y <= WALL + 8;
    const west = d.rect.x <= 24;
    const east = d.rect.x + d.rect.w >= room.w - 24;
    const dx = west || east ? d.rect.x : d.rect.x;
    const dy = north ? WALL - 20 : d.rect.y;
    const dw = d.rect.w;
    const dh = north ? 20 + d.rect.h : d.rect.h;
    const open = s.pendingRoom === d.to && s.fade > 0;
    const paint = () => {
      drawDoorGlimpse(g, dx, dy, dw, dh, img(glimpseSrc(d.to)));
      drawDoor(g, dx, dy, dw, dh, d.label, north, open ? Math.round(6 * Math.min(1, s.fade)) : 0);
    };
    if (north) paint();
    else drawables.push({ y: d.rect.y + d.rect.h, draw: paint });
  }

  if (s.room === "cafe") {
    const counter = room.props.find((p) => p.kind === "counter");
    const kx = counter ? counter.rect.x + 56 : 72;
    const ky = counter ? counter.rect.y + 8 : 78;
    const sy = counter ? counter.rect.y + 12 : 90;
    drawables.push({ y: sy, draw: () => steam(g, kx, ky, now, false) });
  }
  if (s.room === "breakroom") {
    const kettle = room.props.find((p) => p.kind === "kettle");
    if (kettle) {
      drawables.push({
        y: kettle.rect.y + kettle.rect.h,
        draw: () => steam(g, kettle.rect.x + 8, kettle.rect.y, now, false),
      });
    }
  }
  if (s.room === "reactor") {
    const core = room.props.find((p) => p.kind === "core");
    if (core) {
      drawables.push({
        y: core.rect.y + 10,
        draw: () => {
          const glow = img("/art/gen/fx/core_glow.png?v=waveD");
          if (glow) {
            const pulse = 14 + Math.round(Math.sin(now * 3) * 2);
            g.save();
            g.globalAlpha = 0.62 + Math.sin(now * 3) * 0.28;
            g.drawImage(
              glow,
              0,
              0,
              glow.naturalWidth,
              glow.naturalHeight,
              Math.round(core.rect.x + core.rect.w / 2 - pulse / 2),
              Math.round(core.rect.y + 6),
              pulse,
              pulse,
            );
            g.restore();
          }
          steam(g, core.rect.x + core.rect.w / 2, core.rect.y + 8, now, true);
        },
      });
    }
  }
  if (s.room === "maintenance" && s.day === 1 && !s.incidentResolved) {
    const valve = room.props.find((p) => p.kind === "valve");
    const vx = valve ? valve.rect.x + valve.rect.w / 2 : 80;
    const vy = valve ? valve.rect.y : 96;
    const sy = valve ? valve.rect.y + valve.rect.h : 140;
    drawables.push({ y: sy, draw: () => steam(g, vx, vy, now, true) });
  }

  if (s.room === "control") {
    drawables.push({
      y: 212,
      draw: () => drawPaperLog(g, s.day, s.incidentResolved, now),
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

  g.restore();

  ctx.fillStyle = PAL.ink;
  ctx.fillRect(0, 0, viewW, viewH);
  pix(ctx);
  const dw = bw * zoom;
  const dh = bh * zoom;
  const ox = Math.floor((viewW - dw) / 2);
  const oy = Math.floor((viewH - dh) / 2);
  ctx.drawImage(off, 0, 0, bw, bh, ox, oy, dw, dh);

  ctx.fillStyle = periodTint(s.period, !outdoor);
  ctx.fillRect(0, 0, viewW, viewH);

  if (s.fade > 0) {
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
  " ": ["000", "000", "000", "000", "000"],
};

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

function drawBoardA(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; w: number; h: number },
  day: number,
  resolved: boolean,
  now: number,
) {
  const pulse = resolved ? 0.2 : 0.45 + Math.abs(Math.sin(now * 3.2)) * 0.5;
  const x = Math.round(rect.x);
  const y = Math.round(rect.y);
  const w = Math.round(rect.w);
  const h = Math.round(rect.h);
  ctx.fillStyle = resolved ? PAL.leaf : `rgba(201,162,39,${0.45 + pulse * 0.5})`;
  ctx.fillRect(x + 6, y + h - 7, w - 12, 3);
  const line =
    day === 1 ? (resolved ? "14-R CLOSED" : "14-B OPEN")
    : day === 2 ? (resolved ? "2A LOCKED" : "2A IN SVC")
    : day === 3 ? (resolved ? "0.04 mSv/h" : "40 mSv/h")
    : day === 4 ? (resolved ? "LOG SIGNED" : "NO INITIALS")
    : "SHUFFLE DAY";
  // Right side of the board. A centered line sits on Holt's head.
  const color = resolved ? PAL.leaf : PAL.gold;
  const parts = line.toUpperCase().split(" ");
  parts.forEach((part, i) => {
    const tw = part.length * 8 - 2;
    pixText(ctx, part, x + w - 8 - tw / 2, y - 24 + i * 12, color, tw + 4);
  });
}

function drawPaperLog(ctx: CanvasRenderingContext2D, day: number, resolved: boolean, now: number) {
  const x = 36;
  const y = 164;
  const w = 104;
  const h = 48;
  ctx.fillStyle = resolved ? PAL.leaf : PAL.gold;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = PAL.cream;
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  const mid = day === 4 && !resolved ? "- 07:12" : day === 1 ? "14-R CLOSED" : "EV 07:12";
  const foot = resolved ? "CAUGHT" : day === 1 ? "!= 14-B" : day === 4 ? "BLANK" : "CHECK";
  pixText(ctx, "PAPER LOG", x + w / 2, y + 6, PAL.ink, w - 8);
  pixText(ctx, mid, x + w / 2, y + 18, PAL.ink, w - 8);
  pixText(ctx, foot, x + w / 2, y + 30, resolved ? PAL.leaf : "#8a3a32", w - 8);
  void now;
}

export function roomName(id: RoomId) {
  return ROOMS[id].name;
}
