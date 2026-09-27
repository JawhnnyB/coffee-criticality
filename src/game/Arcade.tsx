"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { playHuntHit, playHuntMiss } from "./audio";

export type CabId = "catch" | "fish" | "plot" | "horde" | "delay" | "golf" | "rods" | "pebble" | "bowl" | "phys" | "load";

export type CabWall = "unit" | "after" | "compare";

export const CABS: { id: CabId; title: string; line: string; art: string; wall: CabWall }[] = [
  { id: "catch", title: "CATCH.CAB", line: "Hunt the lie. Clock's running.", art: "/art/gen/props/cab_catch.png?v=art101", wall: "unit" },
  { id: "delay", title: "DELAY.CAB", line: "The slope punches back.", art: "/art/gen/props/cab_delay.png?v=games", wall: "unit" },
  { id: "rods", title: "ROD.BANK", line: "Chase the demand. Overlap the banks.", art: "/art/gen/props/cab_rods.png?v=games", wall: "unit" },
  { id: "load", title: "LOAD.CAB", line: "The load is the opponent.", art: "/art/gen/props/cab_load.png?v=load", wall: "unit" },
  { id: "phys", title: "PHYS.CAB", line: "Fission, analog MC, leak at the edge.", art: "/art/gen/props/cab_phys.png?v=phys", wall: "unit" },
  { id: "pebble", title: "PEBBLE.CAB", line: "Drop TRISO. Core is the middle bin.", art: "/art/gen/props/cab_pebble.png?v=games", wall: "compare" },
  { id: "fish", title: "FISH.CAB", line: "Lake Master. Wait for the bite.", art: "/art/gen/props/cab_fish.png?v=art101", wall: "after" },
  { id: "golf", title: "GOLF.CAB", line: "Five holes on Mabel's lot.", art: "/art/gen/props/cab_golf.png?v=games", wall: "after" },
  { id: "bowl", title: "BOWL.CAB", line: "Three frames. Jordan's after-shift.", art: "/art/gen/props/cab_bowl.png?v=games", wall: "after" },
  { id: "horde", title: "HORDE.CAB", line: "Rounds. Six guns. Pixel night-shift.", art: "/art/gen/props/cab_horde.png?v=art101", wall: "after" },
  { id: "plot", title: "PLOT.CAB", line: "Pests. Drought. Cut what you can.", art: "/art/gen/props/cab_plot.png?v=art101", wall: "after" },
];

const WALLS: { id: CabWall; title: string; line: string }[] = [
  { id: "unit", title: "UNIT 1", line: "North wall. Catch, slope, banks, load, pin." },
  { id: "compare", title: "COMPARE", line: "Pebble is not this plant." },
  { id: "after", title: "AFTER-SHIFT", line: "South wall. Not the thesis." },
];

export function Bezel({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 flex items-stretch justify-center bg-[#0b0908]/88 p-2 sm:p-4">
      <div className="cabinet w-full max-w-6xl">
        <div className="cabinet-marquee">
          <span>Mabel’s parlor</span>
          <span>CRT · teaching only</span>
        </div>
        <div className="cabinet-screen">{children}</div>
        <div className="cabinet-deck" aria-hidden>
          <span />
        </div>
      </div>
    </div>
  );
}

export function ArcadeHall({
  onPick,
  onAbort,
  fromEod = false,
}: {
  onPick: (id: CabId) => void;
  onAbort: () => void;
  fromEod?: boolean;
}) {
  return (
    <Bezel>
      <p className="font-mono text-xs tracking-widest text-good">MABEL.PARLOR</p>
      <h2 className="font-display mt-2 text-2xl text-good">Same bezel. Different jobs.</h2>
      <p className="mt-2 font-mono text-xs text-good/70">
        North wall is Unit 1. South is after-shift. Pebble is a comparison. The floor still wants a catch.
      </p>
      <div className="mt-4 space-y-4">
        {WALLS.map((w) => (
          <div key={w.id}>
            <p className="font-mono text-[10px] tracking-widest text-good/80">
              {w.title}
              <span className="ml-2 text-good/50">{w.line}</span>
            </p>
            <div className={"mt-1 grid gap-2 " + (w.id === "compare" ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-5")}>
              {CABS.filter((c) => c.wall === w.id).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onPick(c.id)}
                  className="flex flex-col items-center border border-good/30 bg-[#07140f] px-2 py-3 text-center hover:bg-good/10"
                  data-testid={"cab-" + c.id}
                >
                  <img src={c.art} alt="" width={32} height={48} className="h-8 w-5" style={{ imageRendering: "pixelated" }} />
                  <span className="mt-1 font-mono text-[10px] tracking-widest text-good">{c.title}</span>
                  <span className="mt-0.5 font-mono text-[9px] leading-snug text-good/70">{c.line}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="btn-ghost mt-4" onClick={onAbort}>
        {fromEod ? "Back to clock-out" : "Back"}
      </button>
    </Bezel>
  );
}

const CW = 320;
const CH = 200;
const BOARDS = 5;
const CLOCK = 48;

type Kind = "valve" | "tag" | "dose" | "log" | "gauge" | "breaker" | "seal" | "wheel" | "switch" | "stamp";
type Item = {
  x: number;
  y: number;
  w: number;
  h: number;
  lie: boolean;
  kind: Kind;
  open?: boolean;
  svc?: boolean;
  hot?: boolean;
  unsigned?: boolean;
  red?: boolean;
  on?: boolean;
  broken?: boolean;
  phase?: number;
};
type Deco = { x: number; y: number; w: number; h: number; label: string; ink: string };
type Board = { items: Item[]; deco: Deco[]; prompt: string; kind: Kind };

function pickLie(n: number) {
  return Math.floor(Math.random() * n);
}

function clutter(n: number, ink = "#3a3228"): Deco[] {
  const out: Deco[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      x: 4 + ((i * 73) % 300),
      y: 18 + ((i * 41) % 160),
      w: 10 + (i % 3) * 4,
      h: 3,
      label: i % 2 ? "14-R" : "P2A",
      ink,
    });
  }
  return out;
}

function gridItems(cols: number, rows: number, w: number, h: number, ox: number, oy: number, gap: number, kind: Kind, lie: number, mark: (it: Item, i: number, isLie: boolean) => void): Item[] {
  const items: Item[] = [];
  const n = cols * rows;
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const it: Item = {
      x: ox + c * (w + gap),
      y: oy + r * (h + gap),
      w,
      h,
      lie: i === lie,
      kind,
    };
    mark(it, i, i === lie);
    items.push(it);
  }
  return items;
}

function makeValve(): Board {
  const lie = pickLie(12);
  return {
    kind: "valve",
    prompt: "One stem is OPEN. Every tag says SHUT. Catch the stem.",
    deco: clutter(6, "#2a3228"),
    items: gridItems(4, 3, 70, 50, 8, 22, 8, "valve", lie, (it, _i, isLie) => {
      it.open = isLie;
    }),
  };
}

function makeTag(): Board {
  const lie = pickLie(8);
  return {
    kind: "tag",
    prompt: "Seven green LOTOTO. One orange IN SERVICE. Catch the orange.",
    deco: [
      { x: 14, y: 22, w: 40, h: 8, label: "2A", ink: "#8a7864" },
      { x: 250, y: 22, w: 40, h: 8, label: "HUNG", ink: "#8a7864" },
      { x: 80, y: 20, w: 28, h: 10, label: "LOTO", ink: "#2a4a30" },
      { x: 180, y: 168, w: 36, h: 10, label: "LOTO", ink: "#2a4a30" },
    ],
    items: gridItems(4, 2, 68, 64, 12, 34, 10, "tag", lie, (it, _i, isLie) => {
      it.svc = isLie;
    }),
  };
}

function makeDose(): Board {
  const lie = pickLie(15);
  return {
    kind: "dose",
    prompt: "Wall of 0.04. One sticker is 40. Catch the hot one.",
    deco: clutter(5, "#1a2218"),
    items: gridItems(5, 3, 54, 44, 8, 26, 8, "dose", lie, (it, _i, isLie) => {
      it.hot = isLie;
    }),
  };
}

function makeLog(): Board {
  const lie = pickLie(8);
  const items: Item[] = [];
  for (let i = 0; i < 8; i++) {
    items.push({ x: 12, y: 22 + i * 20, w: 296, h: 18, lie: i === lie, kind: "log", unsigned: i === lie });
  }
  return { kind: "log", prompt: "One line has no initials. Catch the unsigned.", deco: [], items };
}

function makeGauge(): Board {
  const lie = pickLie(8);
  return {
    kind: "gauge",
    prompt: "Seven needles in green. One in the red. Catch the gauge.",
    deco: clutter(4, "#1a1410"),
    items: gridItems(4, 2, 68, 68, 12, 28, 8, "gauge", lie, (it, i, isLie) => {
      it.red = isLie;
      it.phase = i * 0.7;
    }),
  };
}

function makeBreaker(): Board {
  const lie = pickLie(10);
  return {
    kind: "breaker",
    prompt: "Nine dark. One lamp still green. Catch the live breaker.",
    deco: clutter(5, "#1a1814"),
    items: gridItems(5, 2, 54, 68, 10, 28, 8, "breaker", lie, (it, _i, isLie) => {
      it.on = isLie;
    }),
  };
}

function makeSeal(): Board {
  const lie = pickLie(8);
  return {
    kind: "seal",
    prompt: "Seven seals hold. One tape is torn. Catch the break.",
    deco: clutter(4, "#3a2818"),
    items: gridItems(4, 2, 68, 68, 12, 28, 8, "seal", lie, (it, _i, isLie) => {
      it.broken = isLie;
    }),
  };
}

function makeWheel(): Board {
  const lie = pickLie(9);
  return {
    kind: "wheel",
    prompt: "Eight wheels shut. One is ninety degrees. Catch the open.",
    deco: clutter(5, "#2a3238"),
    items: gridItems(3, 3, 92, 50, 12, 24, 8, "wheel", lie, (it, _i, isLie) => {
      it.open = isLie;
    }),
  };
}

function makeSwitch(): Board {
  const lie = pickLie(10);
  return {
    kind: "switch",
    prompt: "Nine down. One up. Catch the live switch.",
    deco: clutter(4, "#1a1814"),
    items: gridItems(5, 2, 54, 68, 10, 28, 8, "switch", lie, (it, _i, isLie) => {
      it.on = isLie;
    }),
  };
}

function makeStamp(): Board {
  const lie = pickLie(6);
  const items: Item[] = [];
  for (let i = 0; i < 6; i++) {
    items.push({ x: 12, y: 26 + i * 26, w: 296, h: 22, lie: i === lie, kind: "stamp", unsigned: i === lie });
  }
  return { kind: "stamp", prompt: "Five stamps have a time. One is blank. Catch the blank.", deco: clutter(3), items };
}

function makeHang(): Board {
  const lie = pickLie(9);
  const items: Item[] = [];
  for (let i = 0; i < 9; i++) {
    const c = i % 3;
    const r = Math.floor(i / 3);
    items.push({
      x: 18 + c * 96 + (r % 2) * 8,
      y: 28 + r * 52,
      w: 78,
      h: 46,
      lie: i === lie,
      kind: "tag",
      svc: i === lie,
    });
  }
  return {
    kind: "tag",
    prompt: "Tags overlap. One orange peeks. Catch IN SERVICE.",
    deco: [
      { x: 8, y: 18, w: 40, h: 8, label: "RACK", ink: "#8a7864" },
      { x: 240, y: 18, w: 50, h: 8, label: "2A-HANG", ink: "#8a7864" },
    ],
    items,
  };
}

function makeBadge(): Board {
  const lie = pickLie(12);
  return {
    kind: "dose",
    prompt: "Eleven 0.04 badges. One 40. Catch the hot badge.",
    deco: clutter(6, "#1a2218"),
    items: gridItems(4, 3, 70, 50, 8, 22, 8, "dose", lie, (it, _i, isLie) => {
      it.hot = isLie;
    }),
  };
}

const POOL: (() => Board)[] = [
  makeValve,
  makeTag,
  makeDose,
  makeLog,
  makeGauge,
  makeBreaker,
  makeSeal,
  makeWheel,
  makeSwitch,
  makeStamp,
  makeHang,
  makeBadge,
];

function shuffleFive(): Board[] {
  const idx = POOL.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = idx[i];
    idx[i] = idx[j];
    idx[j] = t;
  }
  return idx.slice(0, BOARDS).map((i) => POOL[i]());
}

function drawValve(ctx: CanvasRenderingContext2D, it: Item) {
  const x = it.x + 18;
  const y = it.y + 14;
  ctx.fillStyle = "#2a3238";
  ctx.fillRect(x, y + 6, 22, 16);
  ctx.fillStyle = "#3d5c66";
  ctx.fillRect(x + 2, y + 8, 18, 12);
  ctx.save();
  ctx.translate(x + 11, y + 6);
  ctx.rotate(it.open ? Math.PI / 2 : 0);
  ctx.fillStyle = it.open ? "#b85c4a" : "#c9a227";
  ctx.fillRect(-2, -14, 4, 14);
  ctx.fillRect(-6, -16, 12, 4);
  ctx.restore();
  ctx.fillStyle = "#8a7864";
  ctx.font = "7px monospace";
  ctx.fillText("14-R SHUT", it.x + 8, it.y + it.h - 6);
}

function drawTag(ctx: CanvasRenderingContext2D, it: Item) {
  ctx.fillStyle = "#2a3238";
  ctx.fillRect(it.x + 22, it.y + 4, 24, 24);
  ctx.fillStyle = "#1a1410";
  ctx.fillRect(it.x + 18, it.y + 26, 32, 8);
  ctx.fillStyle = it.svc ? "#c4783a" : "#6b8f71";
  ctx.beginPath();
  ctx.moveTo(it.x + 16, it.y + 36);
  ctx.lineTo(it.x + 36, it.y + 36);
  ctx.lineTo(it.x + 36, it.y + 56);
  ctx.lineTo(it.x + 26, it.y + 62);
  ctx.lineTo(it.x + 16, it.y + 56);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#07140f";
  ctx.font = "6px monospace";
  ctx.fillText(it.svc ? "SVC" : "LOTO", it.x + 20, it.y + 50);
}

function drawDose(ctx: CanvasRenderingContext2D, it: Item, blink = false) {
  const glow = it.hot && blink;
  ctx.fillStyle = it.hot ? "#3a1810" : "#1a2218";
  ctx.fillRect(it.x + 4, it.y + 6, it.w - 10, it.h - 14);
  ctx.strokeStyle = glow ? "#f3e6d0" : it.hot ? "#b85c4a" : "#6b8f71";
  ctx.strokeRect(it.x + 4.5, it.y + 6.5, it.w - 11, it.h - 15);
  ctx.fillStyle = it.hot ? "#b85c4a" : "#c9a227";
  ctx.font = "8px monospace";
  ctx.fillText(it.hot ? "40" : "0.04", it.x + (it.hot ? 18 : 12), it.y + 24);
  ctx.fillStyle = "#8a7864";
  ctx.font = "6px monospace";
  ctx.fillText("mSv/h", it.x + 12, it.y + 36);
}

function drawLog(ctx: CanvasRenderingContext2D, it: Item) {
  ctx.fillStyle = it.lie ? "#2a2218" : "#1a1814";
  ctx.fillRect(it.x, it.y, it.w, it.h - 2);
  ctx.fillStyle = it.unsigned ? "#b85c4a" : "#f3e6d0";
  ctx.font = "8px monospace";
  const who = it.unsigned ? "—     " : "EV    ";
  ctx.fillText(`${who}07:${12 + (it.y % 7)}   14-R  SHUT`, it.x + 8, it.y + 12);
}

function drawGauge(ctx: CanvasRenderingContext2D, it: Item, moving: boolean) {
  const cx = it.x + it.w / 2;
  const cy = it.y + 30;
  ctx.fillStyle = "#1a1410";
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#6b8f71";
  ctx.stroke();
  ctx.fillStyle = "#2a4a30";
  ctx.beginPath();
  ctx.arc(cx, cy, 16, Math.PI * 0.75, Math.PI * 1.55);
  ctx.lineTo(cx, cy);
  ctx.fill();
  ctx.fillStyle = "#5a2018";
  ctx.beginPath();
  ctx.arc(cx, cy, 16, Math.PI * 1.55, Math.PI * 2.15);
  ctx.lineTo(cx, cy);
  ctx.fill();
  let ang = it.red ? -0.35 : 2.4;
  if (moving) {
    const p = it.phase ?? 0;
    if (it.red) ang = -0.15 + Math.sin(p) * 0.45;
    else ang = 2.15 + Math.sin(p * 0.8) * 0.28;
  }
  ctx.strokeStyle = it.red || (moving && it.red) ? "#b85c4a" : "#f3e6d0";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(ang) * 14, cy + Math.sin(ang) * 14);
  ctx.stroke();
  ctx.fillStyle = "#8a7864";
  ctx.font = "6px monospace";
  ctx.fillText("P2A", it.x + 24, it.y + it.h - 6);
}

function drawBreaker(ctx: CanvasRenderingContext2D, it: Item) {
  ctx.fillStyle = "#1a1410";
  ctx.fillRect(it.x + 8, it.y + 8, 38, 52);
  ctx.fillStyle = it.on ? "#6b8f71" : "#2a2218";
  ctx.fillRect(it.x + 16, it.y + 14, 22, 12);
  ctx.fillStyle = "#3a2818";
  ctx.fillRect(it.x + 18, it.y + 32, 18, 22);
  ctx.fillStyle = it.on ? "#c9a227" : "#8a7864";
  ctx.fillRect(it.x + 22, it.y + (it.on ? 34 : 42), 10, 8);
  ctx.fillStyle = "#8a7864";
  ctx.font = "6px monospace";
  ctx.fillText(it.on ? "ON" : "OFF", it.x + 16, it.y + it.h - 6);
}

function drawSeal(ctx: CanvasRenderingContext2D, it: Item) {
  ctx.fillStyle = "#2a3238";
  ctx.fillRect(it.x + 14, it.y + 10, 40, 40);
  ctx.strokeStyle = it.broken ? "#b85c4a" : "#c9a227";
  ctx.strokeRect(it.x + 18, it.y + 14, 32, 32);
  ctx.fillStyle = it.broken ? "#b85c4a" : "#c4783a";
  if (it.broken) {
    ctx.fillRect(it.x + 20, it.y + 28, 28, 3);
    ctx.fillRect(it.x + 32, it.y + 18, 3, 24);
  } else {
    ctx.beginPath();
    ctx.arc(it.x + 34, it.y + 30, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#8a7864";
  ctx.font = "6px monospace";
  ctx.fillText(it.broken ? "TEAR" : "SEAL", it.x + 22, it.y + it.h - 6);
}

function drawWheel(ctx: CanvasRenderingContext2D, it: Item) {
  const cx = it.x + it.w / 2;
  const cy = it.y + 24;
  ctx.strokeStyle = "#3d5c66";
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(it.open ? Math.PI / 2 : 0);
  ctx.strokeStyle = it.open ? "#b85c4a" : "#c9a227";
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(16, 0);
  ctx.moveTo(0, -16);
  ctx.lineTo(0, 16);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "#8a7864";
  ctx.font = "6px monospace";
  ctx.fillText(it.open ? "90°" : "SHUT", it.x + 28, it.y + it.h - 6);
}

function drawSwitch(ctx: CanvasRenderingContext2D, it: Item) {
  ctx.fillStyle = "#1a1410";
  ctx.fillRect(it.x + 12, it.y + 10, 30, 48);
  ctx.fillStyle = "#2a3238";
  ctx.fillRect(it.x + 20, it.y + 16, 14, 34);
  ctx.fillStyle = it.on ? "#c9a227" : "#8a7864";
  ctx.fillRect(it.x + 22, it.y + (it.on ? 18 : 36), 10, 12);
  ctx.fillStyle = "#8a7864";
  ctx.font = "6px monospace";
  ctx.fillText(it.on ? "UP" : "DN", it.x + 20, it.y + it.h - 6);
}

function drawStamp(ctx: CanvasRenderingContext2D, it: Item) {
  ctx.fillStyle = it.lie ? "#2a2218" : "#1a1814";
  ctx.fillRect(it.x, it.y, it.w, it.h - 2);
  ctx.strokeStyle = "#3d5c66";
  ctx.strokeRect(it.x + 4, it.y + 3, 70, 14);
  ctx.fillStyle = it.unsigned ? "#b85c4a" : "#f3e6d0";
  ctx.font = "8px monospace";
  ctx.fillText(it.unsigned ? "TIME  —:—  2A" : `TIME  07:${10 + (it.y % 9)}  2A`, it.x + 10, it.y + 14);
}

function drawItem(ctx: CanvasRenderingContext2D, it: Item, day: number, t: number) {
  const moving = day >= 3;
  const blink = moving && it.hot && Math.sin(t * 8) > 0;
  if (it.kind === "valve") drawValve(ctx, it);
  else if (it.kind === "tag") drawTag(ctx, it);
  else if (it.kind === "dose") drawDose(ctx, it, blink);
  else if (it.kind === "log") drawLog(ctx, it);
  else if (it.kind === "gauge") drawGauge(ctx, it, moving);
  else if (it.kind === "breaker") drawBreaker(ctx, it);
  else if (it.kind === "seal") drawSeal(ctx, it);
  else if (it.kind === "wheel") drawWheel(ctx, it);
  else if (it.kind === "switch") drawSwitch(ctx, it);
  else drawStamp(ctx, it);
}

function hitItem(board: Board, x: number, y: number): Item | undefined {
  let found: Item | undefined;
  let best = 1e9;
  for (const o of board.items) {
    if (x < o.x || x > o.x + o.w || y < o.y || y > o.y + o.h) continue;
    const cx = o.x + o.w / 2;
    const cy = o.y + o.h / 2;
    const d = (x - cx) ** 2 + (y - cy) ** 2;
    if (d < best) {
      best = d;
      found = o;
    }
  }
  return found;
}

/** Timed visual hunt. The lie is in the picture, not the caption. */
export function Arcade({
  onDone,
  onAbort,
  fromEod = false,
  day = 1,
}: {
  onDone: (score: number, leftover?: number) => void;
  onAbort: () => void;
  fromEod?: boolean;
  day?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"brief" | "play" | "end">("brief");
  const [end, setEnd] = useState<{ caught: number; time: number } | null>(null);

  useEffect(() => {
    if (phase !== "play") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const deck = shuffleFive();
    let round = 0;
    let board = deck[0];
    let clock = CLOCK;
    let caught = 0;
    let miss = 0;
    let flash = 0;
    let hitFlash = 0;
    let shake = 0;
    let last = performance.now();
    let raf = 0;
    let over = false;
    let tPlay = 0;

    const hit = (mx: number, my: number) => {
      if (over) return;
      const r = canvas.getBoundingClientRect();
      const x = ((mx - r.left) / r.width) * CW;
      const y = ((my - r.top) / r.height) * CH;
      const it = hitItem(board, x, y);
      if (!it) {
        miss += 1;
        flash = 0.28;
        shake = 0.22;
        clock -= 3;
        playHuntMiss();
        return;
      }
      if (it.lie) {
        caught += 1;
        hitFlash = 0.22;
        clock += 1.4;
        playHuntHit();
        round += 1;
        if (round >= BOARDS) {
          over = true;
          setEnd({ caught, time: Math.max(0, clock) });
          setPhase("end");
          return;
        }
        board = deck[round];
      } else {
        miss += 1;
        flash = 0.32;
        shake = 0.28;
        clock -= 4;
        playHuntMiss();
      }
    };

    const click = (e: MouseEvent) => hit(e.clientX, e.clientY);
    const touch = (e: TouchEvent) => {
      const t = e.touches[0] || e.changedTouches[0];
      if (t) hit(t.clientX, t.clientY);
    };
    const key = (e: KeyboardEvent) => {
      if (e.code === "Escape") onAbort();
    };
    canvas.addEventListener("mousedown", click);
    canvas.addEventListener("touchend", touch, { passive: true });
    window.addEventListener("keydown", key);

    const loop = (now: number) => {
      if (over) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      tPlay += dt;
      clock -= dt;
      flash = Math.max(0, flash - dt);
      hitFlash = Math.max(0, hitFlash - dt);
      shake = Math.max(0, shake - dt);
      if (day >= 3) {
        for (const it of board.items) {
          if (it.kind === "gauge" || it.hot) it.phase = (it.phase ?? 0) + dt * (it.lie ? 2.6 : 1.1);
        }
      }
      if (clock <= 0) {
        over = true;
        setEnd({ caught, time: 0 });
        setPhase("end");
        return;
      }

      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6);
      ctx.fillStyle = "#0a1210";
      ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = "#1a1814";
      for (let i = 0; i < 18; i++) {
        ctx.fillRect((i * 47) % CW, (i * 31) % CH, 14, 3);
      }
      for (const d of board.deco) {
        ctx.fillStyle = d.ink;
        ctx.font = "6px monospace";
        ctx.fillText(d.label, d.x, d.y);
      }
      for (const it of board.items) drawItem(ctx, it, day, tPlay);

      if (flash > 0) {
        ctx.fillStyle = `rgba(184,92,74,${flash * 0.45})`;
        ctx.fillRect(0, 0, CW, CH);
      }
      if (hitFlash > 0) {
        ctx.fillStyle = `rgba(107,143,113,${hitFlash * 0.4})`;
        ctx.fillRect(0, 0, CW, CH);
      }
      ctx.fillStyle = "#07140f";
      ctx.fillRect(0, 0, CW, 16);
      ctx.fillStyle = clock < 10 ? "#b85c4a" : "#f3e6d0";
      ctx.font = "8px monospace";
      ctx.fillText(`CATCH  ${round + 1}/${BOARDS}   ${clock.toFixed(1)}s   caught ${caught}   miss ${miss}`, 6, 11);
      ctx.fillStyle = "#8a7864";
      ctx.fillText(board.prompt, 6, CH - 6);
      ctx.restore();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousedown", click);
      canvas.removeEventListener("touchend", touch);
      window.removeEventListener("keydown", key);
    };
  }, [phase, onAbort, day]);

  if (phase === "brief") {
    return (
      <Bezel>
        <p className="font-mono text-xs tracking-widest text-good">CATCH.CAB  ·  hunt  ·  teaching only</p>
        <h2 className="font-display mt-2 text-2xl text-good">Eyes first. Clock second.</h2>
        <p className="mt-3 font-mono text-xs leading-relaxed text-good/80">
          Five boards from a bigger rack. One lie each — in the picture, not the caption. Open stem, orange tag, hot sticker,
          unsigned line, red needle. Misses cost time. The floor is not a quiz.
        </p>
        <button type="button" className="btn-primary mt-5" onClick={() => setPhase("play")}>
          Start hunt
        </button>
        <button type="button" className="btn-ghost mt-2" onClick={onAbort}>
          Leave cabinet
        </button>
      </Bezel>
    );
  }

  if (phase === "end" && end) {
    const ok = end.caught >= 4;
    return (
      <Bezel>
        <p className="font-mono text-xs tracking-widest text-good">CATCH.CAB</p>
        <h2 className="font-mono mt-2 text-2xl text-good">
          {end.caught} / {BOARDS} CAUGHT
        </h2>
        <p className="mt-3 max-w-md font-mono text-sm leading-relaxed text-good/80">
          {ok
            ? "Eyes that can catch a tag can catch a person. The floor is not a game. The skill is the same."
            : "Look again. Hide paths grow when the first glance is loyal to the paper."}
        </p>
        <button type="button" className="btn-primary mt-6" onClick={() => onDone(end.caught, end.time)}>
          {fromEod ? "Back to clock-out" : "Leave cabinet"}
        </button>
      </Bezel>
    );
  }

  return (
    <Bezel>
      <p className="font-mono text-xs tracking-widest text-good">CATCH.CAB  ·  hunt the lie</p>
      <canvas
        ref={canvasRef}
        data-testid="catch-canvas"
        width={CW}
        height={CH}
        className="mt-2 w-full cursor-crosshair border border-[#3d5c66] touch-none"
        style={{ imageRendering: "pixelated" }}
      />
      <p className="mt-2 font-mono text-[10px] text-good/70">Click the lie. Misses eat the clock. Esc leaves.</p>
      <button type="button" className="btn-ghost mt-2" onClick={onAbort}>
        Leave cabinet
      </button>
    </Bezel>
  );
}
