"use client";

import { useEffect, useRef, useState } from "react";
import { Bezel } from "./Arcade";

const W = 320;
const H = 180;

function useKeys(onEsc: () => void) {
  const keys = useRef(new Set<string>());
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      if (e.code === "Escape") onEsc();
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [onEsc]);
  return keys;
}

type Wall = { x: number; y: number; w: number; h: number };
type Hole = {
  name: string;
  par: number;
  cup: { x: number; y: number };
  tee: { x: number; y: number };
  walls: Wall[];
  water?: { x: number; y: number; w: number; h: number };
};

const HOLES: Hole[] = [
  {
    name: "Cafe green",
    par: 2,
    tee: { x: 36, y: 90 },
    cup: { x: 270, y: 90 },
    walls: [
      { x: 8, y: 24, w: 304, h: 8 },
      { x: 8, y: 148, w: 304, h: 8 },
      { x: 8, y: 24, w: 8, h: 132 },
      { x: 304, y: 24, w: 8, h: 132 },
    ],
  },
  {
    name: "Kettle dogleg",
    par: 3,
    tee: { x: 32, y: 140 },
    cup: { x: 270, y: 44 },
    walls: [
      { x: 8, y: 16, w: 304, h: 8 },
      { x: 8, y: 156, w: 304, h: 8 },
      { x: 8, y: 16, w: 8, h: 148 },
      { x: 304, y: 16, w: 8, h: 148 },
      { x: 110, y: 16, w: 16, h: 90 },
      { x: 190, y: 70, w: 16, h: 94 },
    ],
  },
  {
    name: "Van bank",
    par: 3,
    tee: { x: 28, y: 40 },
    cup: { x: 28, y: 140 },
    walls: [
      { x: 8, y: 16, w: 304, h: 8 },
      { x: 8, y: 156, w: 304, h: 8 },
      { x: 8, y: 16, w: 8, h: 148 },
      { x: 304, y: 16, w: 8, h: 148 },
      { x: 70, y: 16, w: 180, h: 70 },
    ],
  },
  {
    name: "Lake lip",
    par: 4,
    tee: { x: 30, y: 90 },
    cup: { x: 280, y: 90 },
    walls: [
      { x: 8, y: 16, w: 304, h: 8 },
      { x: 8, y: 156, w: 304, h: 8 },
      { x: 8, y: 16, w: 8, h: 148 },
      { x: 304, y: 16, w: 8, h: 148 },
    ],
    water: { x: 118, y: 40, w: 84, h: 100 },
  },
  {
    name: "Island core",
    par: 4,
    tee: { x: 36, y: 150 },
    cup: { x: 160, y: 78 },
    walls: [
      { x: 8, y: 16, w: 304, h: 8 },
      { x: 8, y: 156, w: 304, h: 8 },
      { x: 8, y: 16, w: 8, h: 148 },
      { x: 304, y: 16, w: 8, h: 148 },
      { x: 70, y: 50, w: 70, h: 10 },
      { x: 180, y: 110, w: 70, h: 10 },
    ],
    water: { x: 96, y: 108, w: 128, h: 36 },
  },
];

function inRect(x: number, y: number, r: Wall) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function GolfGame({ onDone, onAbort }: { onDone: (score: number) => void; onAbort: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [card, setCard] = useState<number[] | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (card) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let holeI = 0;
    let strokes = 0;
    const cardStrokes: number[] = [];
    let x = HOLES[0].tee.x;
    let y = HOLES[0].tee.y;
    let vx = 0;
    let vy = 0;
    let aim = 0;
    let power = 0;
    let charging = false;
    let sunkT = 0;
    let last = performance.now();
    let raf = 0;
    let mx = W / 2;
    let my = H / 2;

    const down = (e: KeyboardEvent) => {
      if (e.code === "Escape") onAbort();
      if (e.code === "Space") charging = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space" && charging) fire();
    };
    const move = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width) * W;
      my = ((e.clientY - r.top) / r.height) * H;
    };
    const md = (e: MouseEvent) => {
      e.preventDefault();
      charging = true;
    };
    const mu = () => {
      if (charging) fire();
    };
    const fire = () => {
      charging = false;
      const hole = HOLES[holeI];
      const moving = Math.hypot(vx, vy) > 6;
      if (moving || sunkT > 0) return;
      const p = 0.25 + power * 0.75;
      vx = Math.cos(aim) * (42 + p * 210);
      vy = Math.sin(aim) * (42 + p * 210);
      strokes += 1;
      power = 0;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mousedown", md);
    window.addEventListener("mouseup", mu);

    const loop = (now: number) => {
      if (doneRef.current) return;
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      const hole = HOLES[holeI];
      aim = Math.atan2(my - y, mx - x);
      if (charging) power = Math.min(1, power + dt * 0.9);

      const speed = Math.hypot(vx, vy);
      if (speed > 0.8) {
        x += vx * dt;
        y += vy * dt;
        const damp = Math.exp(-2.4 * dt);
        vx *= damp;
        vy *= damp;
        for (const w of hole.walls) {
          if (!inRect(x, y, w)) continue;
          if (x - vx * dt <= w.x || x - vx * dt >= w.x + w.w) vx *= -0.72;
          else vy *= -0.72;
          x += vx * dt * 2;
          y += vy * dt * 2;
        }
        if (hole.water && inRect(x, y, hole.water) && speed < 50) {
          x = hole.tee.x;
          y = hole.tee.y;
          vx = 0;
          vy = 0;
          strokes += 1;
        }
      } else {
        vx = 0;
        vy = 0;
      }

      const dCup = Math.hypot(x - hole.cup.x, y - hole.cup.y);
      if (dCup < 7 && Math.hypot(vx, vy) < 36 && sunkT <= 0) {
        sunkT = 0.7;
        vx = 0;
        vy = 0;
        x = hole.cup.x;
        y = hole.cup.y;
      }
      if (sunkT > 0) {
        sunkT -= dt;
        if (sunkT <= 0) {
          cardStrokes.push(strokes);
          holeI += 1;
          strokes = 0;
          if (holeI >= HOLES.length) {
            doneRef.current = true;
            setCard([...cardStrokes]);
            return;
          }
          x = HOLES[holeI].tee.x;
          y = HOLES[holeI].tee.y;
          vx = 0;
          vy = 0;
        }
      }

      ctx.fillStyle = "#1a3a24";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#2a4a30";
      ctx.fillRect(12, 28, 296, 124);
      if (hole.water) {
        ctx.fillStyle = "#3d5c66";
        ctx.fillRect(hole.water.x, hole.water.y, hole.water.w, hole.water.h);
      }
      ctx.fillStyle = "#1a1410";
      for (const w of hole.walls) ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = "#16110d";
      ctx.beginPath();
      ctx.arc(hole.cup.x, hole.cup.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c4783a";
      ctx.fillRect(hole.cup.x + 4, hole.cup.y - 18, 2, 18);
      ctx.fillStyle = "#c9a227";
      ctx.fillRect(hole.cup.x + 6, hole.cup.y - 18, 8, 6);

      if (Math.hypot(vx, vy) < 6 && sunkT <= 0) {
        ctx.strokeStyle = "rgba(243,230,208,0.5)";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(aim) * (20 + power * 50), y + Math.sin(aim) * (20 + power * 50));
        ctx.stroke();
      }
      ctx.fillStyle = "#f3e6d0";
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f3e6d0";
      ctx.font = "8px monospace";
      const tot = cardStrokes.reduce((a, b) => a + b, 0) + strokes;
      const par = HOLES.reduce((a, h) => a + h.par, 0);
      ctx.fillText(`${holeI + 1}/5  ${hole.name}  par ${hole.par}  this ${strokes}  card ${tot}/${par}`, 8, 14);
      ctx.fillStyle = "#8a7864";
      ctx.fillText("Aim mouse · hold click/space for power", 8, H - 8);
      if (charging) {
        ctx.fillStyle = "#c4783a";
        ctx.fillRect(200, H - 12, power * 100, 4);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mousedown", md);
      window.removeEventListener("mouseup", mu);
    };
  }, [card, onAbort]);

  if (card) {
    const tot = card.reduce((a, b) => a + b, 0);
    const par = HOLES.reduce((a, h) => a + h.par, 0);
    return (
      <Bezel>
        <p className="font-mono text-xs tracking-widest text-good">GOLF.CAB  ·  Mabel's lot</p>
        <h2 className="font-display mt-2 text-2xl text-good">
          {tot} strokes · par {par}
        </h2>
        <ul className="mt-3 font-mono text-xs text-good/80">
          {HOLES.map((h, i) => (
            <li key={h.name}>
              {i + 1}. {h.name}  {card[i]} / {h.par}
            </li>
          ))}
        </ul>
        <button type="button" className="btn-primary mt-5" onClick={() => onDone(Math.max(0, 10 - Math.max(0, tot - par)))}>
          Leave green
        </button>
      </Bezel>
    );
  }

  return (
    <Bezel>
      <p className="font-mono text-xs tracking-widest text-good">GOLF.CAB  ·  five holes  ·  parlor hours</p>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="mt-2 w-full cursor-crosshair border border-[#3d5c66] touch-none"
        style={{ imageRendering: "pixelated" }}
      />
      <button type="button" className="btn-ghost mt-2" onClick={onAbort}>
        Leave green
      </button>
    </Bezel>
  );
}

/** Magnetic jack: one step per cycle. Overlap the banks or worth spikes. */
export function RodsGame({ onDone, onAbort }: { onDone: (score: number) => void; onAbort: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [end, setEnd] = useState<{ ok: boolean; line: string; hold: number } | null>(null);
  const endRef = useRef(false);
  const keys = useKeys(onAbort);

  useEffect(() => {
    if (end) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const banks = [0, 0, 0, 0];
    const cool = [0, 0, 0, 0];
    let hold = 0;
    let last = performance.now();
    let raf = 0;
    let hover = -1;
    let click = false;
    let pull = false;
    let t = 0;
    let inBandT = 0;
    let scram = 0;

    const move = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width) * W;
      hover = mx > 24 && mx < 300 ? Math.min(3, Math.floor((mx - 24) / 72)) : -1;
    };
    const md = (e: MouseEvent) => {
      click = true;
      pull = e.button === 2;
    };
    const ctxMenu = (e: Event) => e.preventDefault();
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mousedown", md);
    canvas.addEventListener("contextmenu", ctxMenu);
    canvas.addEventListener("touchstart", () => {
      click = true;
    });

    const loop = (now: number) => {
      if (endRef.current) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      const freq = inBandT > 6 ? 1.55 : 0.7;
      const demand = 0.72 + 0.42 * Math.sin(t * freq);
      for (let i = 0; i < 4; i++) cool[i] = Math.max(0, cool[i] - dt);

      const shift = keys.current.has("ShiftLeft") || keys.current.has("ShiftRight");
      const want = [keys.current.has("Digit1"), keys.current.has("Digit2"), keys.current.has("Digit3"), keys.current.has("Digit4")];
      if (click && hover >= 0) want[hover] = true;
      const withdrawing = pull || shift;
      click = false;
      pull = false;

      for (let i = 0; i < 4; i++) {
        if (!want[i] || cool[i] > 0) continue;
        if (withdrawing) {
          if (i < 3 && banks[i + 1] > banks[i] + 8) continue;
          banks[i] = Math.max(0, banks[i] - 8);
        } else {
          const prev = i === 0 ? 228 : banks[i - 1];
          if (i > 0 && prev < 80) continue;
          banks[i] = Math.min(228, banks[i] + 8);
        }
        cool[i] = 0.28;
      }

      const worth = banks.map((s) => Math.sin((s / 228) * Math.PI) * (0.4 + s / 500));
      const dWorth = worth.reduce((a, b) => a + b, 0);
      const spike = worth.some((w, i) => i > 0 && banks[i] > 40 && banks[i - 1] < 70 && w > 0.35);
      const overlapOk = banks[0] < 40 || banks[1] > Math.max(0, banks[0] - 110);
      const inBand = Math.abs(dWorth - demand) < 0.28 && !spike && overlapOk && banks[0] > 24;
      if (inBand) {
        hold += dt;
        inBandT += dt;
      } else hold = Math.max(0, hold - dt * 0.22);

      if (scram > 0) {
        scram -= dt;
        for (let i = 0; i < 4; i++) banks[i] = Math.min(228, banks[i] + 320 * dt);
        if (scram <= 0) {
          endRef.current = true;
          setEnd({ ok: false, hold, line: "SCRAM. One bank through the fat of the S-curve. Worth spiked. Holt: volume, not a speech." });
          return;
        }
      } else if (spike && banks.some((s) => s > 180)) {
        scram = 0.85;
      }
      if (hold >= 12) {
        endRef.current = true;
        setEnd({ ok: true, hold, line: "Demand chased. Overlap held. Teaching model — not a rod procedure." });
        return;
      }

      ctx.fillStyle = "#07140f";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#f3e6d0";
      ctx.font = "8px monospace";
      ctx.fillText(`demand ${demand.toFixed(2)}  worth ${dWorth.toFixed(2)}  hold ${hold.toFixed(1)}/12`, 8, 12);
      const names = ["D", "C", "B", "A"];
      for (let i = 0; i < 4; i++) {
        const x = 28 + i * 72;
        ctx.fillStyle = hover === i ? "#3a2818" : "#1a1410";
        ctx.fillRect(x, 24, 56, 140);
        const h = (banks[i] / 228) * 120;
        ctx.fillStyle = spike && i === worth.indexOf(Math.max(...worth)) ? "#b85c4a" : "#c4783a";
        ctx.fillRect(x + 18, 150 - h, 20, h);
        ctx.fillStyle = "#6b8f71";
        ctx.fillRect(x + 22, 150 - h - 4, 12, 4);
        ctx.fillStyle = "#f3e6d0";
        ctx.fillText(`BANK ${names[i]}`, x + 8, 36);
        ctx.fillText(`${banks[i]}`, x + 16, 168);
      }
      ctx.fillStyle = "#c9a227";
      ctx.fillRect(8, H - 18, Math.max(2, Math.min(200, demand * 140)), 3);
      ctx.fillStyle = inBand ? "#6b8f71" : "#8a7864";
      ctx.fillRect(8, H - 14, Math.max(2, Math.min(200, dWorth * 140)), 3);
      ctx.fillStyle = inBand ? "#6b8f71" : "#8a7864";
      ctx.fillText(inBand ? "on demand — keep overlapping" : scram > 0 ? "SCRAM" : "gold=demand  1–4 in  shift/right-click out", 8, H - 4);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mousedown", md);
      canvas.removeEventListener("contextmenu", ctxMenu);
    };
  }, [end, keys, onAbort]);

  if (end) {
    return (
      <Bezel>
        <p className="font-mono text-xs tracking-widest text-good">ROD.BANK  ·  teaching only</p>
        <h2 className="font-display mt-2 text-2xl text-good">{end.ok ? "Overlap held" : "Worth spiked"}</h2>
        <p className="mt-3 font-mono text-sm leading-relaxed text-good/80">{end.line}</p>
        <button type="button" className="btn-primary mt-5" onClick={() => onDone(end.ok ? 7 : Math.round(end.hold))}>
          Leave board
        </button>
      </Bezel>
    );
  }

  return (
    <Bezel>
      <p className="font-mono text-xs tracking-widest text-good">ROD.BANK  ·  magnetic jack  ·  one step / cycle</p>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="mt-2 w-full cursor-pointer border border-[#3d5c66] touch-none"
        style={{ imageRendering: "pixelated" }}
      />
      <p data-testid="rods-hud" className="mt-2 font-mono text-[10px] text-good/70">
        PWR banks from above. 1–4 insert, shift or right-click withdraw. Gold bar is demand — chase it. C cannot run ahead of D.
        Worth is an S-curve. Not a license.
      </p>
      <button type="button" className="btn-ghost mt-2" onClick={onAbort}>
        Leave board
      </button>
    </Bezel>
  );
}

export function PebbleGame({ onDone, onAbort }: { onDone: (score: number) => void; onAbort: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [end, setEnd] = useState<number | null>(null);
  const endRef = useRef(false);

  useEffect(() => {
    if (end !== null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    type Peg = { x: number; y: number };
    const pegs: Peg[] = [];
    for (let row = 0; row < 7; row++) {
      const n = 6 + (row % 2);
      for (let i = 0; i < n; i++) {
        pegs.push({ x: 40 + i * 40 + (row % 2 ? 20 : 0), y: 36 + row * 16 });
      }
    }
    const bins = [0, 2, 4, 8, 4, 2, 0];
    type Ball = { x: number; y: number; vx: number; vy: number; live: boolean };
    let balls: Ball[] = [];
    let left = 7;
    let score = 0;
    let last = performance.now();
    let raf = 0;
    let dropX = W / 2;
    let gateX = 90;
    let gateV = 56;
    const GATE_W = 54;

    const down = (e: KeyboardEvent) => {
      if (e.code === "Escape") onAbort();
      if (e.code === "Space" || e.code === "KeyE") drop();
      if (e.code === "KeyA" || e.code === "ArrowLeft") dropX -= 16;
      if (e.code === "KeyD" || e.code === "ArrowRight") dropX += 16;
    };
    const move = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      dropX = ((e.clientX - r.left) / r.width) * W;
    };
    const md = () => drop();
    const drop = () => {
      if (left <= 0) return;
      if (balls.some((b) => b.live && b.y < 40)) return;
      left -= 1;
      balls.push({ x: Math.max(24, Math.min(W - 24, dropX)), y: 18, vx: (Math.random() - 0.5) * 20, vy: 10, live: true });
    };
    window.addEventListener("keydown", down);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mousedown", md);

    const loop = (now: number) => {
      if (endRef.current) return;
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      gateX += gateV * dt;
      if (gateX < 28 || gateX > W - 28 - GATE_W) {
        gateV *= -1;
        gateX = Math.max(28, Math.min(W - 28 - GATE_W, gateX));
      }
      for (const b of balls) {
        if (!b.live) continue;
        b.vy += 220 * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < 16 || b.x > W - 16) b.vx *= -0.8;
        if (b.y > 16 && b.y < 28 && b.vy > 0 && (b.x < gateX || b.x > gateX + GATE_W)) {
          b.vx += b.x < gateX ? -50 : 50;
          b.vy = Math.abs(b.vy) * 0.4 + 20;
          b.y = 30;
        }
        for (const p of pegs) {
          const dx = b.x - p.x;
          const dy = b.y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 64 && d2 > 0) {
            const d = Math.sqrt(d2);
            b.x = p.x + (dx / d) * 8;
            b.y = p.y + (dy / d) * 8;
            const nx = dx / d;
            const ny = dy / d;
            const dot = b.vx * nx + b.vy * ny;
            b.vx = (b.vx - 1.6 * dot * nx) * 0.72 + (Math.random() - 0.5) * 18;
            b.vy = (b.vy - 1.6 * dot * ny) * 0.72;
          }
        }
        if (b.y > 158) {
          b.live = false;
          const i = Math.max(0, Math.min(6, Math.floor(b.x / (W / 7))));
          score += bins[i];
        }
      }
      if (left <= 0 && balls.every((b) => !b.live)) {
        endRef.current = true;
        setEnd(score);
        return;
      }

      ctx.fillStyle = "#1a1410";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#2a221b";
      ctx.fillRect(12, 12, W - 24, 156);
      ctx.fillStyle = "#c4783a";
      for (const p of pegs) ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      ctx.fillStyle = "#3a2818";
      ctx.fillRect(12, 20, Math.max(0, gateX - 12), 8);
      ctx.fillRect(gateX + GATE_W, 20, Math.max(0, W - 12 - (gateX + GATE_W)), 8);
      ctx.fillStyle = "#6b8f71";
      ctx.fillRect(gateX, 20, GATE_W, 8);
      const labels = ["out", "C", "fuel", "CORE", "fuel", "C", "out"];
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = i === 3 ? "#6b8f71" : i === 0 || i === 6 ? "#3a2818" : "#c4783a";
        ctx.fillRect(i * (W / 7) + 2, 160, W / 7 - 4, 16);
        ctx.fillStyle = "#f3e6d0";
        ctx.font = "7px monospace";
        ctx.fillText(labels[i], i * (W / 7) + 6, 172);
      }
      for (const b of balls) {
        if (!b.live && b.y > 170) continue;
        ctx.fillStyle = "#c9a227";
        ctx.fillRect(b.x - 3, b.y - 3, 6, 6);
      }
      ctx.fillStyle = "#f3e6d0";
      ctx.fillRect(dropX - 4, 8, 8, 6);
      ctx.font = "8px monospace";
      ctx.fillText(`TRISO  left ${left}  score ${score}  hopper gate  click to drop`, 8, 10);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mousedown", md);
    };
  }, [end, onAbort]);

  if (end !== null) {
    return (
      <Bezel>
        <p className="font-mono text-xs tracking-widest text-good">PEBBLE.CAB  ·  TRISO  ·  teaching only</p>
        <h2 className="font-display mt-2 text-2xl text-good">{end} in the catcher</h2>
        <p className="mt-3 font-mono text-sm text-good/80">
          A pebble is not a plant. Helium is the courier. Leakage is the bins on the edge.
        </p>
        <button type="button" className="btn-primary mt-5" onClick={() => onDone(Math.min(8, Math.floor(end / 4)))}>
          Leave hopper
        </button>
      </Bezel>
    );
  }

  return (
    <Bezel>
      <p className="font-mono text-xs tracking-widest text-good">PEBBLE.CAB  ·  drop 7  ·  core is the middle bin</p>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="cab-play mt-2 cursor-pointer touch-none"
        style={{ imageRendering: "pixelated" }}
      />
      <p className="mt-2 font-mono text-[10px] text-good/70">Moving hopper gate. Time the drop. Core is the middle bin.</p>
      <button type="button" className="btn-ghost mt-2" onClick={onAbort}>
        Leave hopper
      </button>
    </Bezel>
  );
}

export function BowlGame({ onDone, onAbort }: { onDone: (score: number) => void; onAbort: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [end, setEnd] = useState<number | null>(null);
  const endRef = useRef(false);

  useEffect(() => {
    if (end !== null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    type Pin = { x: number; y: number; up: boolean; vx: number; vy: number };
    const layout = (): Pin[] => {
      const p: Pin[] = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c <= r; c++) {
          p.push({ x: 160 + (c - r / 2) * 18, y: 36 + r * 16, up: true, vx: 0, vy: 0 });
        }
      }
      return p;
    };
    let pins = layout();
    let bx = 160;
    let by = 160;
    let bvx = 0;
    let bvy = 0;
    let rolling = false;
    let aim = 0;
    let power = 0.5;
    let charging = false;
    let balls = 0;
    let frame = 0;
    let score = 0;
    let last = performance.now();
    let raf = 0;

    const fire = () => {
      if (rolling) return;
      charging = false;
      rolling = true;
      balls += 1;
      bvx = Math.sin(aim) * (80 + power * 160);
      bvy = -Math.cos(aim) * (80 + power * 180);
    };
    const down = (e: KeyboardEvent) => {
      if (e.code === "Escape") onAbort();
      if (e.code === "Space") charging = true;
      if (e.code === "KeyA" || e.code === "ArrowLeft") aim -= 0.08;
      if (e.code === "KeyD" || e.code === "ArrowRight") aim += 0.08;
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space" && charging) fire();
    };
    const md = () => {
      charging = true;
    };
    const mu = () => {
      if (charging) fire();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    canvas.addEventListener("mousedown", md);
    window.addEventListener("mouseup", mu);

    const resetFrame = (knocked: number) => {
      score += knocked;
      frame += 1;
      balls = 0;
      pins = layout();
      bx = 160;
      by = 160;
      bvx = 0;
      bvy = 0;
      rolling = false;
      if (frame >= 3) {
        endRef.current = true;
        setEnd(score);
      }
    };

    const loop = (now: number) => {
      if (endRef.current) return;
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      if (charging) power = Math.min(1, power + dt * 0.8);
      if (!rolling) {
        if (keysAim()) {
          /* aim from keys already applied */
        }
      } else {
        bx += bvx * dt;
        by += bvy * dt;
        bvy += 8 * dt;
        bvx *= Math.exp(-0.4 * dt);
        if (bx < 70 || bx > 250) bvx *= -0.7;
        for (const p of pins) {
          if (!p.up) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            continue;
          }
          const d2 = (p.x - bx) ** 2 + (p.y - by) ** 2;
          if (d2 < 80) {
            p.up = false;
            p.vx = (p.x - bx) * 8;
            p.vy = (p.y - by) * 8;
            bvx *= 0.7;
            bvy *= 0.7;
          }
        }
        for (let i = 0; i < pins.length; i++) {
          if (pins[i].up) continue;
          for (let j = 0; j < pins.length; j++) {
            if (i === j || !pins[j].up) continue;
            const d2 = (pins[i].x - pins[j].x) ** 2 + (pins[i].y - pins[j].y) ** 2;
            if (d2 < 70) {
              pins[j].up = false;
              pins[j].vx = pins[i].vx * 0.6;
              pins[j].vy = pins[i].vy * 0.6;
            }
          }
        }
        if (by < 12 || (Math.hypot(bvx, bvy) < 8 && by < 120)) {
          const knocked = pins.filter((p) => !p.up).length;
          if (knocked === 10 || balls >= 2) resetFrame(knocked);
          else {
            rolling = false;
            bx = 160;
            by = 160;
            bvx = 0;
            bvy = 0;
            power = 0.5;
          }
        }
      }

      ctx.fillStyle = "#2a221b";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#c9a227";
      ctx.fillRect(70, 12, 180, 156);
      ctx.fillStyle = "#b89040";
      ctx.fillRect(70, 12, 8, 156);
      ctx.fillRect(242, 12, 8, 156);
      for (const p of pins) {
        ctx.fillStyle = p.up ? "#f3e6d0" : "#8a7864";
        ctx.fillRect(p.x - 3, p.y - 6, 6, 10);
        ctx.fillStyle = "#b85c4a";
        ctx.fillRect(p.x - 3, p.y - 6, 6, 2);
      }
      ctx.fillStyle = "#16110d";
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.fill();
      if (!rolling) {
        ctx.strokeStyle = "#f3e6d0";
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.sin(aim) * 40, by - Math.cos(aim) * 40);
        ctx.stroke();
        ctx.fillStyle = "#c4783a";
        ctx.fillRect(12, H - 14, power * 80, 4);
      }
      ctx.fillStyle = "#f3e6d0";
      ctx.font = "8px monospace";
      ctx.fillText(`frame ${frame + 1}/3  ball ${balls + (rolling ? 0 : 1)}  score ${score}  A/D aim  hold fire`, 8, 12);

      raf = requestAnimationFrame(loop);
    };
    function keysAim() {
      return false;
    }
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      canvas.removeEventListener("mousedown", md);
      window.removeEventListener("mouseup", mu);
    };
  }, [end, onAbort]);

  if (end !== null) {
    return (
      <Bezel>
        <p className="font-mono text-xs tracking-widest text-good">BOWL.CAB  ·  Jordan's frames</p>
        <h2 className="font-display mt-2 text-2xl text-good">{end} pins</h2>
        <p className="mt-3 font-mono text-sm text-good/80">The parlor does what a speech cannot. Three frames. Go back to the floor.</p>
        <button type="button" className="btn-primary mt-5" onClick={() => onDone(Math.min(8, Math.floor(end / 4)))}>
          Leave lane
        </button>
      </Bezel>
    );
  }

  return (
    <Bezel>
      <p className="font-mono text-xs tracking-widest text-good">BOWL.CAB  ·  three frames  ·  not the plant floor</p>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="mt-2 w-full cursor-pointer border border-[#3d5c66] touch-none"
        style={{ imageRendering: "pixelated" }}
      />
      <button type="button" className="btn-ghost mt-2" onClick={onAbort}>
        Leave lane
      </button>
    </Bezel>
  );
}
