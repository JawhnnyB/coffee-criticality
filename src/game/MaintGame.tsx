"use client";

import { useEffect, useRef, useState } from "react";
import { Bezel } from "./Arcade";
import { playHuntHit, playHuntMiss } from "./audio";

const W = 320;
const H = 180;
const CLOCK = 32;

type Tag = { x: number; y: number; w: number; h: number; lie: boolean; label: string };

function layout(): Tag[] {
  const labels = ["LOCK", "TAG", "TRY", "ISO", "LOTO", "LOTO", "TAG", "ISO", "SVC"];
  const lie = 8;
  const tags: Tag[] = [];
  for (let i = 0; i < 9; i++) {
    const c = i % 3;
    const r = Math.floor(i / 3);
    tags.push({
      x: 18 + c * 100 + (r % 2) * 10,
      y: 28 + r * 46,
      w: 86,
      h: 40,
      lie: i === lie,
      label: i === lie ? "SVC" : labels[i],
    });
  }
  return tags;
}

/** Timed visual hunt. IN SERVICE does not hang on a dead pump. Not a checklist. */
export function MaintGame({
  onDone,
  onAbort,
}: {
  onDone: (score: number) => void;
  onAbort: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"brief" | "play" | "end">("brief");
  const [end, setEnd] = useState<{ ok: boolean; time: number } | null>(null);

  useEffect(() => {
    if (phase !== "play") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const tags = layout();
    let clock = CLOCK;
    let flash = 0;
    let hitFlash = 0;
    let shake = 0;
    let last = performance.now();
    let raf = 0;
    let over = false;

    const hit = (mx: number, my: number) => {
      if (over) return;
      const r = canvas.getBoundingClientRect();
      const x = ((mx - r.left) / r.width) * W;
      const y = ((my - r.top) / r.height) * H;
      let found: Tag | undefined;
      let best = 1e9;
      for (const t of tags) {
        if (x < t.x || x > t.x + t.w || y < t.y || y > t.y + t.h) continue;
        const d = (x - (t.x + t.w / 2)) ** 2 + (y - (t.y + t.h / 2)) ** 2;
        if (d < best) {
          best = d;
          found = t;
        }
      }
      if (!found) {
        flash = 0.22;
        shake = 0.16;
        clock -= 2;
        playHuntMiss();
        return;
      }
      if (found.lie) {
        over = true;
        playHuntHit();
        setEnd({ ok: true, time: Math.max(0, clock) });
        setPhase("end");
        return;
      }
      flash = 0.3;
      shake = 0.24;
      clock -= 4;
      playHuntMiss();
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
      clock -= dt;
      flash = Math.max(0, flash - dt);
      hitFlash = Math.max(0, hitFlash - dt);
      shake = Math.max(0, shake - dt);
      if (clock <= 0) {
        over = true;
        setEnd({ ok: false, time: 0 });
        setPhase("end");
        return;
      }

      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4);
      ctx.fillStyle = "#0a1210";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#1a1814";
      ctx.fillRect(70, 22, 180, 130);
      ctx.fillStyle = "#2a3238";
      ctx.fillRect(120, 36, 80, 90);
      ctx.fillStyle = "#3d5c66";
      ctx.fillRect(132, 48, 56, 40);
      ctx.fillStyle = "#8a7864";
      ctx.font = "7px monospace";
      ctx.fillText("PUMP 2A  ·  dead on purpose", 86, 34);

      for (const t of tags) {
        ctx.fillStyle = t.lie ? "#c4783a" : "#6b8f71";
        ctx.beginPath();
        ctx.moveTo(t.x + 8, t.y + 6);
        ctx.lineTo(t.x + t.w - 8, t.y + 6);
        ctx.lineTo(t.x + t.w - 8, t.y + t.h - 10);
        ctx.lineTo(t.x + t.w / 2, t.y + t.h - 2);
        ctx.lineTo(t.x + 8, t.y + t.h - 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#07140f";
        ctx.font = "8px monospace";
        ctx.fillText(t.lie ? "SVC" : t.label, t.x + 22, t.y + 24);
      }

      if (flash > 0) {
        ctx.fillStyle = `rgba(184,92,74,${flash * 0.4})`;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.fillStyle = "#07140f";
      ctx.fillRect(0, 0, W, 16);
      ctx.fillStyle = clock < 8 ? "#b85c4a" : "#f3e6d0";
      ctx.font = "8px monospace";
      ctx.fillText(`LOTOTO  hunt  ${clock.toFixed(1)}s  ·  catch the orange`, 6, 11);
      ctx.fillStyle = "#8a7864";
      ctx.fillText("IN SERVICE does not hang here.", 6, H - 6);
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
  }, [phase, onAbort]);

  if (phase === "brief") {
    return (
      <Bezel>
        <p className="font-mono text-xs tracking-widest text-good">LOTOTO  ·  PUMP 2A  ·  teaching only</p>
        <h2 className="font-display mt-2 text-2xl text-good">Hunt the orange.</h2>
        <p className="mt-3 font-mono text-xs leading-relaxed text-good/80">
          Clock is running. One IN SERVICE tag on a pump that is supposed to be dead. Catch it in the picture. Not a checklist.
        </p>
        <button type="button" className="btn-primary mt-5" onClick={() => setPhase("play")}>
          Start hunt
        </button>
        <button type="button" className="btn-ghost mt-2" onClick={onAbort}>
          Leave board
        </button>
      </Bezel>
    );
  }

  if (phase === "end" && end) {
    return (
      <Bezel>
        <p className="font-mono text-xs tracking-widest text-good">LOTOTO  ·  PUMP 2A</p>
        <h2 className="font-display mt-2 text-2xl text-good">{end.ok ? "The pump stays quiet" : "The orange walked"}</h2>
        <p className="mt-3 font-mono text-sm leading-relaxed text-good/80">
          {end.ok
            ? "Tommy: That's a lockout. Finish the sentence. Teaching only."
            : "Look again. IN SERVICE does not hang here."}
        </p>
        <button type="button" className="btn-primary mt-5" onClick={() => onDone(end.ok ? 1 : 0)}>
          Back to the wing
        </button>
      </Bezel>
    );
  }

  return (
    <Bezel>
      <p className="font-mono text-xs tracking-widest text-good">LOTOTO  ·  hunt the lie</p>
      <canvas
        ref={canvasRef}
        data-testid="maint-canvas"
        width={W}
        height={H}
        className="mt-2 w-full cursor-crosshair border border-[#3d5c66] touch-none"
        style={{ imageRendering: "pixelated" }}
      />
      <p className="mt-2 font-mono text-[10px] text-good/70">Click the orange. Misses eat the clock.</p>
      <button type="button" className="btn-ghost mt-2" onClick={onAbort}>
        Leave board
      </button>
    </Bezel>
  );
}
