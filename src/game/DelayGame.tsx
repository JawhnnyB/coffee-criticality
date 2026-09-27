"use client";

import { useEffect, useRef, useState } from "react";
import { Bezel } from "./Arcade";
import { duckHit, playPeriodTick } from "./audio";

/** Classroom Keepin U-235 thermal 6-group. Lambdas sped ~8× so a cabinet can feel them. Not a license. */
const BETA = 0.0065;
const LAMBDA = 0.055;
const SOURCE = 0.08;
const GROUPS = [
  { lam: 0.0124 * 8, beta: 0.000215, color: "#c9a227", name: "1 Br-87" },
  { lam: 0.0305 * 8, beta: 0.001424, color: "#c4783a", name: "2" },
  { lam: 0.111 * 8, beta: 0.001274, color: "#6b8f71", name: "3" },
  { lam: 0.301 * 8, beta: 0.002568, color: "#3d5c66", name: "4" },
  { lam: 1.14 * 8, beta: 0.000748, color: "#8a7864", name: "5" },
  { lam: 3.01 * 8, beta: 0.000273, color: "#b85c4a", name: "6" },
] as const;

const W = 320;
const H = 180;
const CX = 158;
const CY = 96;
const R = 62;

type Spark = { x: number; y: number; vx: number; vy: number; life: number; prompt: boolean; g: number };
type Frag = { x: number; y: number; g: number; age: number; tau: number };

function rodRho(insert: number) {
  const t = Math.max(0, Math.min(1, insert));
  return (0.9 - 2.8 * t) * BETA;
}

export function DelayGame({ onDone, onAbort }: { onDone: (score: number) => void; onAbort: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"brief" | "play" | "end">("brief");
  const [end, setEnd] = useState<{ ok: boolean; hold: number; reason: string; fail: "prompt" | "bury" | null } | null>(null);
  const [bannerHud, setBannerHud] = useState("");
  const endRef = useRef(false);

  useEffect(() => {
    if (phase !== "play") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const keys = new Set<string>();
    let insert = 0.22;
    let rodX = CX;
    let n = 1;
    const C = GROUPS.map((g) => (g.beta / LAMBDA) * n / g.lam);
    let hold = 0;
    let dead = 0;
    let sparks: Spark[] = [];
    let frags: Frag[] = [];
    let emitAcc = 0;
    let last = performance.now();
    let raf = 0;
    let mx = CX;
    let my = CY;
    let pointer = false;
    let tPlay = 0;
    let xe = 0;
    let banner = "";
    let bannerT = 0;
    let lockInsert = 0;
    const EVENTS: { at: number; kind: "drop" | "xe" | "withdraw" }[] = [
      { at: 3.4, kind: "drop" },
      { at: 7.8, kind: "xe" },
      { at: 12.2, kind: "withdraw" },
    ];
    let evI = 0;
    let wave = 1;
    let lastBanner = "";
    const HOLD_WAVE1 = 10;
    const HOLD_TOTAL = 18;

    const down = (e: KeyboardEvent) => {
      keys.add(e.code);
      if (e.code === "Escape") onAbort();
    };
    const up = (e: KeyboardEvent) => keys.delete(e.code);
    const move = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width) * W;
      my = ((e.clientY - r.top) / r.height) * H;
    };
    const md = () => {
      pointer = true;
    };
    const mu = () => {
      pointer = false;
    };
    const touch = (e: TouchEvent) => {
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
    canvas.addEventListener("touchstart", touch, { passive: true });
    canvas.addEventListener("touchmove", touch, { passive: true });
    canvas.addEventListener("touchend", mu);

    const spawnPrompt = (x: number, y: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 70 + Math.random() * 90;
        sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.28 + Math.random() * 0.18, prompt: true, g: -1 });
      }
    };
    const spawnFrag = (x: number, y: number) => {
      const roll = Math.random() * BETA;
      let acc = 0;
      let g = 5;
      for (let i = 0; i < GROUPS.length; i++) {
        acc += GROUPS[i].beta;
        if (roll <= acc) {
          g = i;
          break;
        }
      }
      const tau = Math.max(0.25, -Math.log(0.15 + Math.random() * 0.7) / GROUPS[g].lam);
      const a = Math.random() * Math.PI * 2;
      const d = 8 + Math.random() * 28;
      frags.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, g, age: 0, tau });
    };

    const loop = (now: number) => {
      if (endRef.current) return;
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      tPlay += dt;
      while (evI < EVENTS.length && tPlay >= EVENTS[evI].at) {
        const kind = EVENTS[evI].kind;
        if (kind === "drop") {
          insert = Math.min(1, insert + 0.26);
          banner = "BANK DROP";
        } else if (kind === "xe") {
          xe = 0.5;
          banner = "XENON BUILD";
        } else {
          insert = Math.max(0, insert - 0.22);
          banner = "ROD WITHDRAW";
        }
        bannerT = 2.4;
        lockInsert = 0.55;
        duckHit();
        evI += 1;
      }
      if (wave === 1 && hold >= HOLD_WAVE1 && evI >= EVENTS.length) {
        wave = 2;
        insert = Math.min(1, insert + 0.3);
        xe = 0.62;
        banner = "WAVE 2";
        bannerT = 2.6;
        lockInsert = 0.55;
        duckHit();
      }
      if (banner !== lastBanner) {
        lastBanner = banner;
        if (banner) setBannerHud(banner);
      }
      xe = Math.max(0, xe - dt * 0.07);
      bannerT = Math.max(0, bannerT - dt);
      lockInsert = Math.max(0, lockInsert - dt);

      if (keys.has("KeyA") || keys.has("ArrowLeft")) rodX -= 90 * dt;
      if (keys.has("KeyD") || keys.has("ArrowRight")) rodX += 90 * dt;
      if (keys.has("KeyW") || keys.has("ArrowUp")) insert = Math.min(1, insert + 0.55 * dt);
      if (keys.has("KeyS") || keys.has("ArrowDown")) insert = Math.max(0, insert - 0.55 * dt);
      if (pointer && lockInsert <= 0) {
        rodX += (mx - rodX) * 6 * dt;
        insert = Math.max(0, Math.min(1, (my - 28) / 120));
      } else if (pointer) {
        rodX += (mx - rodX) * 6 * dt;
      }
      rodX = Math.max(CX - 48, Math.min(CX + 48, rodX));

      const rho = rodRho(insert) - xe * BETA;
      const dollars = rho / BETA;
      let delayed = 0;
      for (let i = 0; i < 6; i++) delayed += GROUPS[i].lam * C[i];
      const dn = ((rho - BETA) / LAMBDA) * n + delayed + SOURCE;
      n = Math.max(0.02, n + dn * dt);
      for (let i = 0; i < 6; i++) {
        C[i] += ((GROUPS[i].beta / LAMBDA) * n - GROUPS[i].lam * C[i]) * dt;
        C[i] = Math.max(0, C[i]);
      }

      emitAcc += n * dt * 14;
      while (emitAcc >= 1) {
        emitAcc -= 1;
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * 36;
        const x = CX + Math.cos(a) * d;
        const y = CY + Math.sin(a) * d;
        spawnPrompt(x, y, 1);
        if (Math.random() < 0.18) spawnFrag(x, y);
      }

      const rodTop = 28 + (1 - insert) * 86;
      const rodH = 18 + insert * 78;
      const rodL = rodX - 5;
      const rodR = rodX + 5;
      const rodB = rodTop + rodH;

      for (const s of sparks) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt;
        const dx = s.x - CX;
        const dy = s.y - CY;
        if (dx * dx + dy * dy > R * R) {
          const ang = Math.atan2(dy, dx);
          s.x = CX + Math.cos(ang) * (R - 1);
          s.y = CY + Math.sin(ang) * (R - 1);
          s.vx *= -0.4;
          s.vy *= -0.4;
        }
        if (s.x > rodL && s.x < rodR && s.y > rodTop && s.y < rodB) {
          s.life = 0;
        }
      }
      sparks = sparks.filter((s) => s.life > 0);

      for (const f of frags) {
        f.age += dt;
        if (f.x > rodL && f.x < rodR && f.y > rodTop && f.y < rodB) {
          f.age = 99;
        }
        if (f.age >= f.tau && f.age < 90) {
          const a = Math.random() * Math.PI * 2;
          const sp = 40 + Math.random() * 40;
          sparks.push({
            x: f.x,
            y: f.y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 0.55,
            prompt: false,
            g: f.g,
          });
          f.age = 99;
        }
      }
      frags = frags.filter((f) => f.age < 90);

      const inBand = dollars > 0.12 && dollars < 0.62 && n > 0.35 && n < 8;
      if (inBand) hold += dt;
      else hold = Math.max(0, hold - dt * 0.12);
      if (n < 0.12) dead += dt;
      else dead = 0;

      const T = dn > 0.02 ? n / dn : 99;
      playPeriodTick(T);

      let reason = "";
      let ok = false;
      let fail: "prompt" | "bury" | null = null;
      if (dollars >= 0.98 || n > 28) {
        reason = "Prompt-critical. $1 is a cliff. The delay is spent.";
        fail = "prompt";
      } else if (dead > 2.2) {
        reason = "Subcritical. You buried it. Delayed neutrons still sitting, nothing to feed.";
        fail = "bury";
      } else if (hold >= HOLD_TOTAL && wave >= 2) {
        ok = true;
        reason = "Two transients. Delayed neutrons bought you a slope. Teaching model — not a license.";
      }
      if (reason) {
        endRef.current = true;
        setEnd({ ok, hold, reason, fail });
        setPhase("end");
        return;
      }

      ctx.fillStyle = "#07140f";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#1a1410";
      ctx.beginPath();
      ctx.arc(CX, CY, R + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2a3238";
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = inBand ? "#6b8f71" : dollars > 0.75 ? "#b85c4a" : "#c4783a";
      ctx.lineWidth = 2;
      ctx.stroke();

      for (let ring = 1; ring <= 3; ring++) {
        ctx.strokeStyle = "rgba(243,230,208,0.08)";
        ctx.beginPath();
        ctx.arc(CX, CY, (R * ring) / 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = "#16110d";
      ctx.fillRect(rodL, rodTop, 10, rodH);
      ctx.fillStyle = "#3a2818";
      ctx.fillRect(rodL + 1, rodTop + 1, 8, Math.max(4, rodH - 2));
      ctx.fillStyle = "#c9a227";
      ctx.fillRect(rodL, rodTop - 3, 10, 3);

      for (const f of frags) {
        const g = GROUPS[f.g];
        const pulse = 0.55 + Math.sin((f.age / f.tau) * Math.PI * 6) * 0.45;
        ctx.fillStyle = g.color;
        ctx.globalAlpha = 0.4 + pulse * 0.6;
        const rad = f.g === 0 ? 4 : 2;
        ctx.fillRect(f.x - rad, f.y - rad, rad * 2, rad * 2);
        ctx.globalAlpha = 1;
        const left = Math.max(0, 1 - f.age / f.tau);
        ctx.fillStyle = "#f3e6d0";
        ctx.fillRect(f.x - 4, f.y - 6, 8 * left, 1);
      }
      for (const s of sparks) {
        ctx.fillStyle = s.prompt ? "#f3e6d0" : GROUPS[Math.max(0, s.g)]?.color ?? "#6b8f71";
        ctx.fillRect(s.x - 1, s.y - 1, s.prompt ? 1 : 2, s.prompt ? 1 : 2);
      }

      ctx.fillStyle = "#f3e6d0";
      ctx.font = "8px monospace";
      ctx.fillText(`n ${n.toFixed(2)}   $ ${dollars.toFixed(2)}   T ${T > 40 ? "—" : T.toFixed(1) + "s"}`, 6, 12);
      ctx.fillStyle = "#8a7864";
      ctx.fillText(`rod ${Math.round(insert * 100)}% in   hold ${hold.toFixed(1)}/${HOLD_TOTAL}${xe > 0.05 ? "   Xe" : ""}${wave > 1 ? "   W2" : ""}`, 6, 22);
      if (bannerT > 0) {
        ctx.fillStyle = "#b85c4a";
        ctx.font = "12px monospace";
        ctx.fillText(banner, CX - 40, 44);
        ctx.font = "8px monospace";
      }
      ctx.fillStyle = dollars >= 0.8 ? "#b85c4a" : inBand ? "#6b8f71" : "#c9a227";
      ctx.fillRect(6, H - 10, Math.min(120, Math.max(2, (dollars + 0.2) * 80)), 4);
      ctx.fillStyle = "#8a7864";
      ctx.fillText("$0", 6, H - 14);
      ctx.fillText("$1 cliff", 90, H - 14);
      ctx.fillText("A/D slide  W in  S out  or drag", 150, H - 8);

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
      canvas.removeEventListener("touchstart", touch);
      canvas.removeEventListener("touchmove", touch);
      canvas.removeEventListener("touchend", mu);
    };
  }, [phase, onAbort]);

  if (phase === "brief") {
    return (
      <Bezel>
        <p className="font-mono text-xs tracking-widest text-good">DELAY.CAB  ·  teaching only</p>
        <h2 className="font-display mt-2 text-2xl text-good">Ride the delayed slope</h2>
        <p className="mt-3 font-mono text-xs leading-relaxed text-good/80">
          Most neutrons fly <span className="text-good">now</span> — cream sparks, too fast to catch. A few come later from a
          fragment that has to β-decay first. Those sit, pulse, then emit. That wait is why a core has a period you can walk.
        </p>
        <p className="mt-2 font-mono text-xs leading-relaxed text-good/80">
          Slide the rod. Insert (W) eats neutrons. Withdraw (S) feeds them. Hold $0.12–$0.62. The slope punches back: a bank drop,
          xenon, a withdraw — then a second transient if you stay in band. Recover without going prompt. $1 is the cliff.
          Classroom Keepin groups, sped so you can feel them. Not a license.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-1 font-mono text-[10px] text-good/70">
          {GROUPS.map((g) => (
            <div key={g.name} className="flex items-center gap-1">
              <span className="inline-block h-2 w-2" style={{ background: g.color }} />
              {g.name}
            </div>
          ))}
        </div>
        <button type="button" className="btn-primary mt-4" onClick={() => setPhase("play")}>
          Hold the slope
        </button>
        <button type="button" className="btn-ghost mt-2" onClick={onAbort}>
          Leave cabinet
        </button>
      </Bezel>
    );
  }

  if (phase === "end" && end) {
    return (
      <Bezel>
        <p className="font-mono text-xs tracking-widest text-good">{end.ok ? "BAND.HELD" : "SCRAM.TEACHING"}</p>
        <h2 className="font-display mt-2 text-2xl text-good">{end.ok ? "The delay bought you time" : "The clock ran out"}</h2>
        <p className="mt-3 font-mono text-sm leading-relaxed text-good/80">{end.reason}</p>
        <p className="mt-2 font-mono text-xs text-good/70">Held {end.hold.toFixed(1)}s · β ≈ 0.0065 U-235 thermal · teaching proxy</p>
        <button type="button" className="btn-primary mt-5" onClick={() => onDone(end.ok ? 9 : end.fail === "prompt" ? 0 : 1)}>
          Leave cabinet
        </button>
      </Bezel>
    );
  }

  return (
    <Bezel>
      <p className="font-mono text-xs tracking-widest text-good">DELAY.CAB  ·  6-group  ·  not a license</p>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="mt-2 w-full cursor-crosshair border border-[#3d5c66] touch-none"
        style={{ imageRendering: "pixelated" }}
      />
      <p data-testid="delay-banner" className="mt-1 font-mono text-[10px] tracking-widest text-[#b85c4a]">
        {bannerHud || "hold the slope"}
      </p>
      <p className="mt-2 font-mono text-[10px] leading-snug text-good/70">
        Cream = prompt. Colored sits = precursors. Gold is Br-87 — the long wait. Catch is a slope. Heroics is the cliff.
      </p>
      <button type="button" className="btn-ghost mt-2" onClick={onAbort}>
        Leave cabinet
      </button>
    </Bezel>
  );
}
