"use client";

import { useEffect, useRef, useState } from "react";
import { Bezel } from "./Arcade";
import { duckHit, playHuntHit, playPeriodTick } from "./audio";
import type { PlantType } from "./plant";

const W = 320;
const H = 180;
const CX = 158;
const CY = 92;
const MAX_N = 96;
const HOLD_FISS = 12;
const HOLD_DIFF = 10;
const HOLD_MC = 8;
const NU = 2.43;

type Spark = { x: number; y: number; life: number; col: string };
type Neu = { x: number; y: number; vx: number; vy: number; th: boolean; live: boolean; w: number };
type Mat = "fuel" | "clad" | "water" | "rod" | "gap" | "graph" | "out" | "plug";

function randDir(spd: number) {
  const a = Math.random() * Math.PI * 2;
  return { vx: Math.cos(a) * spd, vy: Math.sin(a) * spd };
}

function Dth(type: PlantType, voidAmt: number) {
  if (type === "pebble") return 1.7;
  if (type === "msr") return 0.95;
  if (type === "bwr") return 0.72 + voidAmt * 0.55;
  return 0.52;
}

function matName(m: Mat, type: PlantType): string {
  if (m === "fuel") return type === "msr" ? "SALT · fuel + courier" : type === "pebble" ? "TRISO · kernel fission" : "PELLET · fission + Doppler";
  if (m === "clad") return type === "pebble" ? "SiC · particle vessel" : "CLAD · capture, not fission";
  if (m === "water") return type === "bwr" ? "H2O/steam · scatter + void" : "H2O · scatter / slow";
  if (m === "gap") return "He GAP · large D, long flight";
  if (m === "graph") return "GRAPHITE · scatter / slow";
  if (m === "rod") return type === "bwr" ? "ROD (from below) · eat thermal" : "ROD (from above) · eat thermal";
  if (m === "plug") return "FREEZE PLUG · drain / eat";
  return "OUT · leak / vessel";
}

export function PhysicsGame({
  onDone,
  onAbort,
  plantType = "pwr",
  startLab = "pin",
}: {
  onDone: (score: number) => void;
  onAbort: () => void;
  plantType?: PlantType;
  startLab?: "pin" | "mc";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"brief" | "play" | "end">("brief");
  const [lab, setLab] = useState<"pin" | "mc">(startLab);
  const [end, setEnd] = useState<{ ok: boolean; line: string; score: number } | null>(null);
  const [hud, setHud] = useState(startLab === "mc" ? "ANALOG MC" : "FISSION  ·  k∞");
  const [probe, setProbe] = useState(
    startLab === "mc" ? "Space fires the fission bank. σ is the opponent." : "Hover a region. Pellet, clad, water, rod.",
  );
  const endRef = useRef(false);
  const fireRef = useRef(false);

  useEffect(() => {
    if (phase !== "play") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const keys = new Set<string>();
    let board: "fiss" | "diff" | "mc" = lab === "mc" ? "mc" : "fiss";
    let insert = lab === "mc" ? 0.08 : 0.22;
    let curtain = 160;
    let tPlay = 0;
    let hold = 0;
    let dead = 0;
    let hot = 0;
    let banner = "";
    let bannerT = 0;
    let lastHud = "";
    let lastProbe = "";
    let probeAcc = 0;
    let lastFissSfx = 0;
    let evI = 0;
    let xe = 0;
    let voidAmt = 0;
    let doppler = 0;
    let reflRight = true;
    let coreL = 70;
    let coreR = 250;
    let born = 0;
    let absn = 0;
    let leak = 0;
    let kEma = 1;
    let acc = 0;
    let last = performance.now();
    let raf = 0;
    let mx = CX;
    let my = CY;
    let pointer = false;
    const sparks: Spark[] = [];
    const n: Neu[] = [];
    const below = plantType === "bwr";
    const salt = plantType === "msr";

    const FISS_EV: { at: number; kind: "xe" | "void" | "dop" }[] = [
      { at: 4.6, kind: "xe" },
      { at: 6.8, kind: "dop" },
      { at: 9.2, kind: "void" },
    ];
    const DIFF_EV: { at: number; kind: "tilt" | "refl" | "shrink" }[] = [
      { at: 3.2, kind: "tilt" },
      { at: 5.5, kind: "shrink" },
      { at: 7.8, kind: "refl" },
    ];
    const MC_EV: { at: number; kind: "bias" | "impl" }[] = [
      { at: 4.4, kind: "bias" },
      { at: 9.2, kind: "impl" },
    ];
    const N0 = 24;
    const bank: { x: number; y: number }[] = [];
    const kGens: number[] = [];
    let genFiss = 0;
    let genCap = 0;
    let genLeak = 0;
    let implicit = false;
    let sourceBias = false;
    let genStarted = 0;
    let bankReady = false;
    let fireClick = false;

    const rodGeom = () => {
      const rodH = 18 + insert * 118;
      if (salt) {
        return { x: CX - 6, y: 148 - insert * 40, w: 12, h: 10 + insert * 28 };
      }
      if (below) {
        return { x: CX + 52, y: 160 - rodH, w: 10, h: rodH };
      }
      return { x: CX + 52, y: 22, w: 10, h: rodH };
    };

    const spawn = (x: number, y: number, th: boolean, spd?: number) => {
      let slot = n.find((p) => !p.live);
      if (!slot) {
        if (n.length >= MAX_N) return;
        slot = { x, y, vx: 0, vy: 0, th, live: true, w: 1 };
        n.push(slot);
      }
      const s = spd ?? (th ? 42 : 96);
      const d = randDir(s);
      slot.x = x;
      slot.y = y;
      slot.vx = d.vx;
      slot.vy = d.vy;
      slot.th = th;
      slot.live = true;
      slot.w = 1;
    };

    const closeGen = () => {
      if (bankReady) return;
      if (genStarted <= 0 && genFiss + genCap + genLeak <= 0) return;
      const kGen = (NU * genFiss) / Math.max(1, N0);
      kGens.push(kGen);
      kEma = kGens.reduce((sum, x) => sum + x, 0) / kGens.length;
      bankReady = true;
      banner = "BANK READY";
      bannerT = 1.8;
      lastHud = "";
      let sigHud = 0.45;
      if (kGens.length >= 2) {
        const v = kGens.reduce((sum, x) => sum + (x - kEma) * (x - kEma), 0) / (kGens.length - 1);
        sigHud = Math.sqrt(Math.max(0, v) / kGens.length);
      }
      setHud(`BANK READY  k ${kEma.toFixed(2)} ± ${sigHud.toFixed(2)}  G ${kGens.length}`);
    };

    const fireGen = () => {
      if (board !== "mc") return;
      if (n.some((p) => p.live)) return;
      closeGen();
      const sites = bank.length ? bank.slice() : [{ x: CX, y: CY }];
      bank.length = 0;
      genFiss = 0;
      genCap = 0;
      genLeak = 0;
      bankReady = false;
      genStarted += 1;
      for (let i = 0; i < N0; i++) {
        const site = sourceBias ? sites[Math.floor(Math.random() * Math.min(3, sites.length))] : sites[Math.floor(Math.random() * sites.length)];
        const jx = site.x + (Math.random() - 0.5) * 10;
        const jy = site.y + (Math.random() - 0.5) * 10;
        spawn(jx, jy, true, 36);
      }
    };

    if (board === "mc") {
      for (let i = 0; i < N0; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 16;
        spawn(CX + Math.cos(a) * r, CY + Math.sin(a) * r, true, 36);
      }
      genStarted = 1;
    } else {
      for (let i = 0; i < 28; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 22;
        spawn(CX + Math.cos(a) * r, CY + Math.sin(a) * r, Math.random() < 0.55);
      }
    }

    const spark = (x: number, y: number, col: string) => {
      sparks.push({ x, y, life: 0.22 + Math.random() * 0.12, col });
    };

    const down = (e: KeyboardEvent) => {
      keys.add(e.code);
      if (e.code === "Escape") onAbort();
      if (e.code === "Space") {
        e.preventDefault();
        fireClick = true;
      }
    };
    const up = (e: KeyboardEvent) => keys.delete(e.code);
    const move = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width) * W;
      my = ((e.clientY - r.top) / r.height) * H;
    };
    const md = () => {
      pointer = true;
      fireClick = true;
    };
    const mu = () => {
      pointer = false;
    };
    const touchStart = () => {
      pointer = true;
      fireClick = true;
    };
    const touchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const r = canvas.getBoundingClientRect();
      mx = ((t.clientX - r.left) / r.width) * W;
      my = ((t.clientY - r.top) / r.height) * H;
      pointer = true;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mousedown", md);
    window.addEventListener("mouseup", mu);
    canvas.addEventListener("touchstart", touchStart, { passive: true });
    canvas.addEventListener("touchmove", touchMove, { passive: true });
    canvas.addEventListener("touchend", mu);

    const pebbleCenters = [
      [0, 0],
      [16, 0],
      [-16, 0],
      [8, 14],
      [-8, 14],
      [8, -14],
      [-8, -14],
    ];

    const matFiss = (x: number, y: number): Mat => {
      const dx = x - CX;
      const dy = y - CY;
      const r = Math.hypot(dx, dy);
      const rg = rodGeom();
      if (x > rg.x && x < rg.x + rg.w && y > rg.y && y < rg.y + rg.h) return salt ? "plug" : "rod";
      if (plantType === "msr") {
        if (r < 48) return "fuel";
        if (r < 72) return "graph";
        return "out";
      }
      if (plantType === "pebble") {
        for (const [px, py] of pebbleCenters) {
          const d = Math.hypot(x - (CX + px), y - (CY + py));
          if (d < 7) return "fuel";
          if (d < 9) return "clad";
        }
        if (r < 74) return "gap";
        return "out";
      }
      if (r < 26) return "fuel";
      if (r < 30) return "gap";
      if (r < 36) return "clad";
      if (r < 74) return "water";
      return "out";
    };

    const sigma = (m: Mat, th: boolean) => {
      if (m === "out") return 0;
      if (m === "gap") return 0.003;
      if (m === "rod" || m === "plug") return 0.28;
      if (m === "clad") return 0.1;
      if (m === "graph") return 0.07;
      if (m === "water") return (th ? 0.055 : 0.048) * (1 - voidAmt * 0.7);
      const cap = th ? 0.1 + xe * 0.18 : 0.035 + doppler * 0.16;
      const fis = th ? 0.09 : 0.02;
      return cap + fis + 0.03;
    };

    const collide = (p: Neu, m: Mat) => {
      const u = Math.random();
      if (m === "fuel") {
        const fisP = p.th ? (board === "mc" ? 0.58 : 0.48) : 0.12;
        const capP = p.th ? 0.28 + xe * 0.22 : 0.18 + doppler * 0.28;
        if (u < fisP) {
          p.live = false;
          if (board === "mc") {
            genFiss += p.w;
            bank.push({ x: p.x, y: p.y });
          } else {
            born += 1;
            const nu = Math.random() < NU - 2 ? 3 : 2;
            for (let i = 0; i < nu; i++) spawn(p.x, p.y, false, 90 + Math.random() * 20);
          }
          spark(p.x, p.y, "#c9a227");
          const t = typeof performance !== "undefined" ? performance.now() : Date.now();
          if (t - lastFissSfx > 90) {
            playHuntHit();
            lastFissSfx = t;
          }
          return;
        }
        if (u < fisP + capP) {
          if (board === "mc" && implicit && p.w > 0.18) {
            genCap += p.w * capP;
            p.w *= Math.max(0.12, 1 - capP);
            if (p.w < 0.22 && Math.random() < 0.5) {
              p.live = false;
            }
            spark(p.x, p.y, "#c4783a");
            return;
          }
          p.live = false;
          if (board === "mc") genCap += p.w;
          else absn += 1;
          spark(p.x, p.y, "#b85c4a");
          return;
        }
        const d = randDir(p.th ? 42 : 90);
        p.vx = d.vx;
        p.vy = d.vy;
        return;
      }
      if (m === "rod" || m === "clad" || m === "plug") {
        const eat = m === "clad" ? 0.42 : 0.9;
        if (u < eat) {
          p.live = false;
          if (board === "mc") genCap += p.w;
          else absn += 1;
          spark(p.x, p.y, m === "clad" ? "#c4783a" : "#8a7864");
          return;
        }
      }
      if (m === "water" || m === "graph") {
        if (!p.th && u < (m === "water" ? 0.58 : 0.28)) {
          p.th = true;
          spark(p.x, p.y, "#6b8f71");
        }
        if (u > 0.96) {
          p.live = false;
          if (board === "mc") genCap += p.w;
          else absn += 1;
          return;
        }
      }
      const d = randDir(p.th ? 40 : 88);
      p.vx = d.vx;
      p.vy = d.vy;
    };

    const bins = new Array(16).fill(0);

    const loop = (now: number) => {
      if (endRef.current) return;
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      tPlay += dt;
      bannerT = Math.max(0, bannerT - dt);
      xe = Math.max(0, xe - dt * 0.02);
      voidAmt = Math.max(0, voidAmt - dt * 0.015);
      doppler = Math.max(0, doppler - dt * 0.04);
      if (fireClick || fireRef.current) {
        fireGen();
        fireClick = false;
        fireRef.current = false;
      }

      if (board === "fiss") {
        while (evI < FISS_EV.length && tPlay >= FISS_EV[evI].at) {
          const kind = FISS_EV[evI].kind;
          if (kind === "xe") {
            xe = 0.85;
            banner = "XENON BUILD";
          } else if (kind === "dop") {
            doppler = 0.9;
            banner = "DOPPLER · FUEL HEAT";
          } else {
            voidAmt = 0.7;
            banner = plantType === "bwr" ? "VOID SWELL" : "MODERATOR VOID";
          }
          bannerT = 2.3;
          duckHit();
          evI += 1;
        }
        if (keys.has("KeyW") || keys.has("ArrowUp")) insert = Math.min(1, insert + 0.55 * dt);
        if (keys.has("KeyS") || keys.has("ArrowDown")) insert = Math.max(0, insert - 0.55 * dt);
        if (pointer) insert = Math.max(0, Math.min(1, below ? 1 - (my - 18) / 130 : (my - 18) / 130));
      } else if (board === "diff") {
        while (evI < DIFF_EV.length && tPlay >= DIFF_EV[evI].at) {
          const kind = DIFF_EV[evI].kind;
          if (kind === "tilt") {
            xe = 0.9;
            banner = "LEFT XENON";
          } else if (kind === "shrink") {
            coreL = 100;
            coreR = 220;
            banner = "CORE SHRINK · B² up";
          } else {
            reflRight = false;
            banner = "REFLECTOR DROP";
          }
          bannerT = 2.3;
          duckHit();
          evI += 1;
        }
        if (keys.has("KeyA") || keys.has("ArrowLeft")) curtain -= 90 * dt;
        if (keys.has("KeyD") || keys.has("ArrowRight")) curtain += 90 * dt;
        if (pointer) curtain += (mx - curtain) * 8 * dt;
        curtain = Math.max(28, Math.min(W - 28, curtain));
      } else {
        while (evI < MC_EV.length && tPlay >= MC_EV[evI].at) {
          const kind = MC_EV[evI].kind;
          if (kind === "bias") {
            sourceBias = true;
            banner = "SOURCE BIAS";
          } else {
            implicit = true;
            banner = "IMPLICIT CAPTURE";
          }
          bannerT = 2.3;
          duckHit();
          evI += 1;
        }
        if (keys.has("KeyW") || keys.has("ArrowUp")) insert = Math.min(1, insert + 0.55 * dt);
        if (keys.has("KeyS") || keys.has("ArrowDown")) insert = Math.max(0, insert - 0.55 * dt);
        if (pointer && !bankReady) insert = Math.max(0, Math.min(1, below ? 1 - (my - 18) / 130 : (my - 18) / 130));
      }

      if (banner !== lastHud) {
        lastHud = banner;
        if (banner) setHud(banner);
      }
      probeAcc += dt;
      if (probeAcc > 0.18) {
        probeAcc = 0;
        let nLive = 0;
        for (const p of n) if (p.live) nLive += 1;
        if (board === "mc" && bannerT <= 0) {
          let sigHud = 0.45;
          if (kGens.length >= 2) {
            const v = kGens.reduce((s, x) => s + (x - kEma) * (x - kEma), 0) / (kGens.length - 1);
            sigHud = Math.sqrt(Math.max(0, v) / kGens.length);
          }
          const hudLine = bankReady
            ? `BANK READY  k ${kEma.toFixed(2)} ± ${sigHud.toFixed(2)}  G ${kGens.length}`
            : `ANALOG MC  n ${nLive}  F ${genFiss.toFixed(0)}  C ${genCap.toFixed(0)}  L ${genLeak.toFixed(0)}`;
          if (hudLine !== lastHud) {
            lastHud = hudLine;
            setHud(hudLine);
          }
        }
        const line =
          board === "mc"
            ? implicit
              ? "IMPLICIT · weight survives capture. σ ~ 1/√G"
              : bankReady
                ? "BANK READY · Space / click next generation"
                : matName(matFiss(mx, my), plantType)
            : board === "fiss"
            ? matName(matFiss(mx, my), plantType)
            : mx > coreL && mx < coreR
              ? "CORE · source + Σ_a"
              : mx > 250
                ? reflRight
                  ? "REFLECTOR · albedo"
                  : "BARE EDGE · leak"
                : mx < 70
                  ? "REFLECTOR · bounce"
                  : Math.abs(mx - curtain) < 12
                    ? "BORON CURTAIN · Σ_a"
                    : "VESSEL / LEAK · PNL";
        if (line !== lastProbe) {
          lastProbe = line;
          setProbe(line);
        }
      }

      bins.fill(0);
      let live = 0;
      const dFac = Dth(plantType, voidAmt);
      for (const p of n) {
        if (!p.live) continue;
        live += 1;
        const spd = board === "diff" ? dFac : 1;
        p.x += p.vx * dt * spd;
        p.y += p.vy * dt * spd;

        if (board === "fiss" || board === "mc") {
          const m = matFiss(p.x, p.y);
          if (m === "out") {
            if (board === "mc") {
              if (Math.random() < 0.22) {
                p.live = false;
                genLeak += p.w;
                continue;
              }
              const dx = p.x - CX;
              const dy = p.y - CY;
              const r = Math.max(1, Math.hypot(dx, dy));
              const nx = dx / r;
              const ny = dy / r;
              const vr = p.vx * nx + p.vy * ny;
              if (vr > 0) {
                p.vx -= 2 * vr * nx;
                p.vy -= 2 * vr * ny;
              }
              p.x = CX + nx * 72;
              p.y = CY + ny * 72;
              continue;
            }
            const dx = p.x - CX;
            const dy = p.y - CY;
            const r = Math.max(1, Math.hypot(dx, dy));
            const nx = dx / r;
            const ny = dy / r;
            const vr = p.vx * nx + p.vy * ny;
            if (vr > 0) {
              p.vx -= 2 * vr * nx;
              p.vy -= 2 * vr * ny;
            }
            p.x = CX + nx * 72;
            p.y = CY + ny * 72;
            continue;
          }
          const sig = sigma(m, p.th);
          if (Math.random() < 1 - Math.exp(-sig * 88 * dt)) collide(p, m);
        } else {
          if (p.x < 14 || p.x > W - 14) {
            const left = p.x < 14;
            const bounce = left || reflRight;
            if (bounce && Math.random() < 0.82) {
              p.vx *= -1;
              p.x = left ? 16 : W - 16;
            } else {
              p.live = false;
              leak += 1;
              continue;
            }
          }
          if (p.y < 18 || p.y > H - 22) {
            p.vy *= -1;
            p.y = Math.max(20, Math.min(H - 24, p.y));
          }
          const inCore = p.x > coreL && p.x < coreR;
          const inCurt = Math.abs(p.x - curtain) < 9;
          const inXe = xe > 0.05 && p.x < 140 && inCore;
          let sig = inCore ? 0.07 : 0.05;
          if (inCurt) sig = 0.32;
          if (inXe) sig += 0.14;
          if (Math.random() < 1 - Math.exp(-sig * 70 * dt)) {
            if (inCurt || (inXe && Math.random() < 0.55)) {
              p.live = false;
              absn += 1;
              spark(p.x, p.y, "#b85c4a");
            } else if (inCore && Math.random() < 0.22) {
              p.live = false;
              born += 1;
              spawn(p.x, p.y, true, 50);
              spark(p.x, p.y, "#c9a227");
            } else {
              const d = randDir(48);
              p.vx = d.vx;
              p.vy = d.vy;
            }
          }
          const bi = Math.max(0, Math.min(15, Math.floor(((p.x - 16) / (W - 32)) * 16)));
          bins[bi] += 1;
        }
      }

      let still = 0;
      for (const p of n) if (p.live) still += 1;
      live = still;
      if (live < 22 && board !== "mc") {
        if (board === "fiss") {
          const a = Math.random() * Math.PI * 2;
          spawn(CX + Math.cos(a) * 8, CY + Math.sin(a) * 8, true);
        } else {
          spawn((coreL + coreR) / 2 + (Math.random() - 0.5) * 80, 40 + Math.random() * 100, true, 46);
        }
      }

      for (const s of sparks) s.life -= dt;
      for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].life <= 0) sparks.splice(i, 1);

      acc += dt;
      if (board !== "mc" && acc >= 0.45) {
        const den = absn + leak + 0.0001;
        const kInst = born / den;
        kEma = kEma * 0.55 + kInst * 0.45;
        born = 0;
        absn = 0;
        leak = 0;
        acc = 0;
      }

      if (board === "mc" && live === 0 && !bankReady) {
        closeGen();
      }

      let reason = "";
      let ok = false;
      let score = 0;
      if (board === "fiss") {
        const inBand = kEma > 0.88 && kEma < 1.14;
        if (inBand) hold += dt;
        else hold = Math.max(0, hold - dt * 0.18);
        if (kEma > 1.32) hot += dt;
        else hot = 0;
        if (kEma < 0.55) dead += dt;
        else dead = 0;
        if (hot > 1.8) {
          reason = "k ran away. Prompt in a pin is still a cliff. Teaching analog — not a license.";
          score = 0;
        } else if (dead > 2.4) {
          reason = "The chain died. Delayed neutrons still sitting, nothing to feed.";
          score = 1;
        } else if (hold >= HOLD_FISS) {
          board = "diff";
          hold = 0;
          tPlay = 0;
          evI = 0;
          xe = 0;
          voidAmt = 0;
          doppler = 0;
          born = 0;
          absn = 0;
          leak = 0;
          kEma = 1;
          banner = "DIFFUSION · P1";
          bannerT = 2.2;
          lastHud = "";
          setHud("DIFFUSION · P1");
          setProbe("J = −D ∇φ. Hold the hill. Edge is leak.");
          duckHit();
          for (const p of n) p.live = false;
          for (let i = 0; i < 40; i++) spawn(90 + Math.random() * 140, 36 + Math.random() * 110, true, 48);
        }
      } else if (board === "diff") {
        let peakI = 0;
        let peak = 0;
        let tot = 0;
        for (let i = 0; i < 16; i++) {
          tot += bins[i];
          if (bins[i] > peak) {
            peak = bins[i];
            peakI = i;
          }
        }
        const leakFrac = tot > 0 ? (bins[0] + bins[1] + bins[14] + bins[15]) / tot : 0;
        const centered = peakI >= 6 && peakI <= 9;
        const leakOk = leakFrac < 0.28;
        if (centered && leakOk) hold += dt;
        else hold = Math.max(0, hold - dt * 0.2);
        if (leakFrac > 0.52) dead += dt;
        else dead = 0;
        if (!centered) hot += dt;
        else hot = 0;
        if (dead > 2.2) {
          reason = "The hill walked out the side. Leakage is how a pin is not a plant.";
          score = 4;
        } else if (hold >= HOLD_DIFF) {
          ok = true;
          reason = "Pin held. Hill held. Fission in the pellet, P1 leak at the edge. Teaching analog — not OpenMC.";
          score = 8;
        }
      } else {
        let sig = 0.45;
        if (kGens.length >= 2) {
          const m = kEma;
          const v = kGens.reduce((s, x) => s + (x - m) * (x - m), 0) / (kGens.length - 1);
          sig = Math.sqrt(Math.max(0, v) / kGens.length);
        }
        const inBand = kGens.length >= 4 && kEma > 0.88 && kEma < 1.14 && sig < 0.1;
        if (inBand) hold += dt;
        else hold = Math.max(0, hold - dt * 0.12);
        if (kEma > 1.35 && kGens.length >= 3) hot += dt;
        else hot = 0;
        if (bankReady && tPlay > 22 && kGens.length < 3) dead += dt;
        else if (!bankReady) dead = Math.max(0, dead - dt);
        if (hot > 2) {
          reason = "k walked. Analog MC still has a cliff. Teaching analog — not OpenMC.";
          score = 0;
        } else if (dead > 3.2) {
          reason = "The bank sat. Fire the next generation. σ only falls with G.";
          score = 1;
        } else if (tPlay > 34 && (kGens.length < 4 || sig >= 0.1)) {
          reason = "Clock out. σ was still fat. 1/√G is a wait you cannot skip.";
          score = 2;
        } else if (hold >= HOLD_MC) {
          ok = true;
          reason = `Analog MC held. k ${kEma.toFixed(2)} ± ${sig.toFixed(2)} on ${kGens.length} generations. Classroom analog — not OpenMC.`;
          score = 9;
        }
      }

      if (reason) {
        endRef.current = true;
        setEnd({ ok, line: reason, score });
        setPhase("end");
        return;
      }

      playPeriodTick(board === "fiss" ? (kEma > 1.05 ? 6 : 14) : 18);

      ctx.fillStyle = "#07140f";
      ctx.fillRect(0, 0, W, H);

      if (board === "fiss" || board === "mc") {
        ctx.fillStyle = "#1a1410";
        ctx.beginPath();
        ctx.arc(CX, CY, 78, 0, Math.PI * 2);
        ctx.fill();
        if (plantType === "msr") {
          ctx.fillStyle = "#3a5a48";
          ctx.beginPath();
          ctx.arc(CX, CY, 72, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = doppler > 0.2 ? "#b89040" : "#c9a227";
          ctx.beginPath();
          ctx.arc(CX, CY, 48, 0, Math.PI * 2);
          ctx.fill();
        } else if (plantType === "pebble") {
          ctx.fillStyle = "#1c2428";
          ctx.beginPath();
          ctx.arc(CX, CY, 74, 0, Math.PI * 2);
          ctx.fill();
          for (const [px, py] of pebbleCenters) {
            ctx.fillStyle = "#8a7864";
            ctx.beginPath();
            ctx.arc(CX + px, CY + py, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#c9a227";
            ctx.beginPath();
            ctx.arc(CX + px, CY + py, 7, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = voidAmt > 0.2 ? "#2a4048" : "#3d5c66";
          ctx.beginPath();
          ctx.arc(CX, CY, 74, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#8a7864";
          ctx.beginPath();
          ctx.arc(CX, CY, 36, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = doppler > 0.2 ? "#8a5a28" : "#5a3a24";
          ctx.beginPath();
          ctx.arc(CX, CY, 26, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = doppler > 0.2 ? "#b89040" : "#7a5a38";
          ctx.beginPath();
          ctx.arc(CX, CY, 18, 0, Math.PI * 2);
          ctx.fill();
        }
        const rg = rodGeom();
        ctx.fillStyle = "#16110d";
        ctx.fillRect(rg.x, rg.y, rg.w, rg.h);
        ctx.fillStyle = "#3a2818";
        ctx.fillRect(rg.x + 1, rg.y + 1, Math.max(2, rg.w - 2), Math.max(4, rg.h - 2));
        ctx.fillStyle = "#c9a227";
        if (below) ctx.fillRect(rg.x, rg.y + rg.h, rg.w, 3);
        else ctx.fillRect(rg.x, rg.y - 3, rg.w, 3);
        ctx.fillStyle = "#8a7864";
        ctx.font = "6px monospace";
        if (plantType === "msr") {
          ctx.fillText("SALT", CX - 10, CY);
          ctx.fillText("C", CX + 54, CY);
        } else if (plantType === "pebble") {
          ctx.fillText("He", CX + 40, CY - 20);
        } else {
          ctx.fillText("PELLET", CX - 14, CY);
          ctx.fillText("CLAD", CX + 8, CY + 40);
          ctx.fillText("H2O", CX - 50, CY - 40);
        }
      } else {
        ctx.fillStyle = "#1a2218";
        ctx.fillRect(coreL, 18, coreR - coreL, H - 40);
        ctx.fillStyle = "#2a3a38";
        ctx.fillRect(24, 18, 46, H - 40);
        ctx.fillStyle = reflRight ? "#2a3a38" : "#1a1410";
        ctx.fillRect(250, 18, 46, H - 40);
        ctx.fillStyle = "#b85c4a";
        ctx.fillRect(curtain - 8, 18, 16, H - 40);
        if (xe > 0.05) {
          ctx.fillStyle = "rgba(184,92,74,0.18)";
          ctx.fillRect(coreL, 18, 70, H - 40);
        }
        let mxv = 1;
        for (const b of bins) if (b > mxv) mxv = b;
        for (let i = 0; i < 16; i++) {
          const h = (bins[i] / mxv) * 36;
          ctx.fillStyle = i >= 6 && i <= 9 ? "#6b8f71" : "#c9a227";
          ctx.fillRect(16 + i * 18, H - 20 - h, 16, h);
        }
        ctx.strokeStyle = "rgba(243,230,208,0.35)";
        ctx.beginPath();
        for (let i = 0; i < 15; i++) {
          const a = bins[i];
          const b = bins[i + 1];
          if (Math.abs(a - b) < 2) continue;
          const x0 = 24 + i * 18;
          const y0 = H - 22 - (a / mxv) * 36;
          const x1 = 24 + (i + 1) * 18;
          const y1 = H - 22 - (b / mxv) * 36;
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
        }
        ctx.stroke();
        ctx.fillStyle = "#8a7864";
        ctx.font = "6px monospace";
        ctx.fillText("J = −D ∇φ", 8, 34);
        ctx.fillText(`D ${Dth(plantType, voidAmt).toFixed(2)}`, 8, 44);
      }

      for (const p of n) {
        if (!p.live) continue;
        ctx.fillStyle = p.th ? "#6b8f71" : "#f3e6d0";
        ctx.fillRect(p.x - 1, p.y - 1, p.th ? 2 : 1, p.th ? 2 : 1);
      }
      for (const s of sparks) {
        ctx.globalAlpha = Math.max(0, s.life * 4);
        ctx.fillStyle = s.col;
        ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#f3e6d0";
      ctx.font = "8px monospace";
      if (board === "fiss") {
        ctx.fillText(`k∞ ${kEma.toFixed(2)}   rod ${Math.round(insert * 100)}%   hold ${hold.toFixed(1)}/${HOLD_FISS}   n ${live}`, 6, 12);
        ctx.fillStyle = "#8a7864";
        ctx.fillText("cream=fast  leaf=thermal  gold=fission  W in  S out", 6, 22);
      } else if (board === "mc") {
        let sig = 0.45;
        if (kGens.length >= 2) {
          const m = kEma;
          const v = kGens.reduce((s, x) => s + (x - m) * (x - m), 0) / (kGens.length - 1);
          sig = Math.sqrt(Math.max(0, v) / kGens.length);
        }
        ctx.fillText(`k ${kEma.toFixed(2)} ± ${sig.toFixed(2)}   G ${kGens.length}   N0 ${N0}   hold ${hold.toFixed(1)}/${HOLD_MC}`, 6, 12);
        ctx.fillStyle = "#8a7864";
        ctx.fillText(bankReady ? "BANK READY  Space/click next gen   analog k  σ ~ 1/√G" : implicit ? "implicit capture  weight lives  W/S rod" : "analog MC  fire the bank  not OpenMC", 6, 22);
        for (let i = 0; i < kGens.length; i++) {
          const x = 8 + i * 8;
          const y = H - 14 - kGens[i] * 18;
          ctx.fillStyle = "#c9a227";
          ctx.fillRect(x, y, 6, 2);
        }
      } else {
        ctx.fillText(`k_eff   φ hill   hold ${hold.toFixed(1)}/${HOLD_DIFF}   n ${live}   P1`, 6, 12);
        ctx.fillStyle = "#8a7864";
        ctx.fillText("A/D boron curtain  ·  edge is leak  ·  not OpenMC", 6, 22);
      }
      if (bannerT > 0) {
        ctx.fillStyle = "#b85c4a";
        ctx.font = "12px monospace";
        ctx.fillText(banner, Math.max(8, CX - 70), 44);
      }
      ctx.fillStyle = kEma > 1.2 ? "#b85c4a" : kEma > 0.88 && kEma < 1.14 ? "#6b8f71" : "#c9a227";
      ctx.fillRect(6, H - 8, Math.min(140, Math.max(2, kEma * 70)), 4);

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
      canvas.removeEventListener("touchstart", touchStart);
      canvas.removeEventListener("touchmove", touchMove);
      canvas.removeEventListener("touchend", mu);
    };
  }, [phase, onAbort, plantType, lab]);

  if (phase === "brief") {
    const typeLine =
      plantType === "bwr"
        ? "This unit is a BWR analog: rods from below, void in the water."
        : plantType === "pebble"
          ? "This unit is a pebble analog: TRISO kernels, SiC wall, helium courier (large D)."
          : plantType === "msr"
            ? "This unit is a circulating-salt analog: the salt is fuel and courier. Freeze plug eats. Graphite slows."
            : "This unit is a PWR analog: pellet, gap, clad, water, rod from above.";
    const mcBrief = lab === "mc";
    return (
      <Bezel>
        <p className="font-mono text-xs tracking-widest text-good">PHYS.CAB  ·  analog MC  ·  P1 diffusion  ·  teaching only</p>
        <h2 className="font-display mt-2 text-2xl text-good">{mcBrief ? "Fire the fission bank" : "Watch the neutrons"}</h2>
        {mcBrief ? (
          <p className="mt-3 font-mono text-xs leading-relaxed text-good/80">
            Analog generation k. N0 = 24 histories. Fission sites go in the bank. Space or click fires the next
            generation. k = ν × fissions / N0. σ is the stderr of generation k. It falls ~ 1/√G. Implicit capture is a
            transient: weight survives, Russian roulette. Leak at the pin edge. Classroom analog — not OpenMC, not a
            license.
          </p>
        ) : (
          <p className="mt-3 font-mono text-xs leading-relaxed text-good/80">
            Two boards. First a pin: fission in the pellet, scatter in the moderator, capture in clad and rod. Hold k∞
            near 1 through xenon, Doppler heat, and a void. Then a core: P1 diffusion. Flux is a hill. J = −D ∇φ. Leakage
            at the edge is why a pin is not a plant. Analog MC is the third lab: histories, a fission bank, k ± σ.
          </p>
        )}
        <p className="mt-2 font-mono text-xs leading-relaxed text-good/80">
          {typeLine} Cream = fast. Leaf = thermal. Gold flash = split. Red = eaten. Classroom analog — not OpenMC, not a
          license. ν ≈ {NU} U-235 thermal. DELAY.CAB is 0-D period. This cabinet has a shape.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-1 font-mono text-[10px] text-good/70">
          <span>PELLET · fission / Doppler</span>
          <span>CLAD · capture</span>
          <span>MOD · scatter / slow</span>
          <span>ROD / PLUG · eat thermal</span>
          <span>BANK · next generation</span>
          <span>σ · 1/√G opponent</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            data-testid="phys-start"
            onClick={() => {
              setLab("pin");
              setHud("FISSION  ·  k∞");
              setProbe("Hover a region. Pellet, clad, water, rod.");
              setPhase("play");
            }}
          >
            Watch the pin
          </button>
          <button
            type="button"
            className="btn-primary"
            data-testid="phys-mc"
            onClick={() => {
              setLab("mc");
              setHud("ANALOG MC");
              setProbe("Space fires the fission bank. σ is the opponent.");
              setPhase("play");
            }}
          >
            Run analog MC
          </button>
        </div>
        <button type="button" className="btn-ghost mt-2" onClick={onAbort}>
          Leave cabinet
        </button>
      </Bezel>
    );
  }

  if (phase === "end" && end) {
    const mcEnd = lab === "mc";
    return (
      <Bezel>
        <p className="font-mono text-xs tracking-widest text-good">
          {end.ok ? (mcEnd ? "K.HELD" : "PIN.AND.HILL") : mcEnd ? "BANK.SAT" : "LEAK.TEACHING"}
        </p>
        <h2 className="font-display mt-2 text-2xl text-good">
          {end.ok ? (mcEnd ? "σ fell with G" : "A pin is not a plant") : mcEnd ? "The bank sat" : "The crowd walked"}
        </h2>
        <p className="mt-3 font-mono text-sm leading-relaxed text-good/80">{end.line}</p>
        <button type="button" className="btn-primary mt-5" onClick={() => onDone(end.score)}>
          Leave cabinet
        </button>
      </Bezel>
    );
  }

  return (
    <Bezel>
      <p className="font-mono text-xs tracking-widest text-good">PHYS.CAB  ·  analog MC  ·  P1  ·  not a license</p>
      <p className="mt-1 font-mono text-[10px] text-good/80" data-testid="phys-hud">
        {hud}
      </p>
      <p className="font-mono text-[10px] text-good/60" data-testid="phys-probe">
        {probe}
      </p>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        data-testid="phys-canvas"
        className="mt-2 w-full cursor-crosshair border border-[#3d5c66] touch-none"
        style={{ imageRendering: "pixelated" }}
      />
      <p className="mt-2 font-mono text-[10px] leading-snug text-good/70">
        {lab === "mc"
          ? "Analog generation k. Space / click fires the bank. σ is the opponent. DELAY.CAB is the 0-D clock."
          : "Fission then P1 diffusion. Hover a region. DELAY.CAB is the 0-D clock."}
      </p>
      {lab === "mc" && (
        <button
          type="button"
          className="btn-primary mt-2"
          data-testid="phys-fire"
          onClick={() => {
            fireRef.current = true;
          }}
        >
          Fire next gen
        </button>
      )}
      <button type="button" className="btn-ghost mt-2" onClick={onAbort}>
        Leave cabinet
      </button>
    </Bezel>
  );
}
