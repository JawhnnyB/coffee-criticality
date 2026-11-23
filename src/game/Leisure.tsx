"use client";

import { TUNE, type CabLevel } from "./cabLevels";
import { cabContext, cabFont } from "./cabCanvas";
import { useEffect, useRef, useState } from "react";
import { PAL } from "./palette";
import { Bezel } from "./Arcade";

const FISH = [
  { id: "carp", name: "Carp", src: "/art/gen/ui/fish_carp.png?v=fish", spd: 42, twitch: 0.35, radius: 22, hold: 1.05 },
  { id: "cat", name: "Catfish", src: "/art/gen/ui/fish_cat.png?v=fish", spd: 48, twitch: 0.45, radius: 20, hold: 1.15 },
  { id: "sun", name: "Sunfish", src: "/art/gen/ui/fish_sun.png?v=fish", spd: 58, twitch: 0.8, radius: 18, hold: 1.25 },
  { id: "blue", name: "Bluegill", src: "/art/gen/ui/fish_blue.png?v=fish", spd: 64, twitch: 0.95, radius: 16, hold: 1.3 },
  { id: "crappie", name: "Crappie", src: "/art/gen/ui/fish_crappie.png?v=fish", spd: 72, twitch: 1.15, radius: 16, hold: 1.35 },
  { id: "bass", name: "Largemouth bass", src: "/art/gen/ui/fish_bass.png?v=fish", spd: 88, twitch: 1.4, radius: 15, hold: 1.45 },
  { id: "perch", name: "Perch", src: "/art/gen/ui/fish_perch.png?v=fish", spd: 100, twitch: 1.8, radius: 14, hold: 1.55 },
  { id: "pike", name: "Pike", src: "/art/gen/ui/fish_pike.png?v=fish", spd: 118, twitch: 2.2, radius: 13, hold: 1.7 },
  { id: "trout", name: "Trout", src: "/art/gen/ui/fish_trout.png?v=fish", spd: 132, twitch: 2.6, radius: 12, hold: 1.85 },
  { id: "bow", name: "Bowfin", src: "/art/gen/ui/fish_bow.png?v=fish", spd: 150, twitch: 3.4, radius: 11, hold: 2.05 },
] as const;

type Kind = (typeof FISH)[number];

/** Follow the fish with the mouse. Harder fish run faster and juke. */
export function FishGame({ onDone, onAbort, level = 1 }: { onDone: (score: number) => void; onAbort: () => void; level?: CabLevel }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState<string[] | null>(null);
  const [hud, setHud] = useState({ name: "Cast", lock: 0, n: 0, got: 0, line: "Put the cursor on the fish. Hold it." });

  useEffect(() => {
    if (done) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = cabContext(canvas);
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const W = 320;
    const H = 140;
    const lake = new Image();
    lake.src = "/art/gen/ui/lake_dock.png?v=fish";
    const imgs = FISH.map((f) => {
      const im = new Image();
      im.src = f.src;
      return im;
    });

    const mouse = { x: W / 2, y: H / 2, in: false };
    const held = new Set<string>();
    let kind: Kind | null = null;
    let fx = 20;
    let fy = 70;
    let ang = 0;
    let lock = 0;
    let casts = 0;
    const creel: string[] = [];
    let last = performance.now();
    let raf = 0;
    let twitchT = 0;

    const spawn = () => {
      kind = FISH[Math.floor(Math.random() * FISH.length)];
      const fromLeft = Math.random() < 0.5;
      fx = fromLeft ? 16 : W - 16;
      fy = 28 + Math.random() * (H - 50);
      ang = fromLeft ? 0.15 + Math.random() * 0.4 : Math.PI - 0.15 - Math.random() * 0.4;
      lock = 0;
      twitchT = 0;
      setHud({
        name: kind.name,
        lock: 0,
        n: casts,
        got: creel.length,
        line: `Keep the cursor on the ${kind.name.toLowerCase()}.`,
      });
    };

    const finishSwim = (caught: boolean) => {
      if (caught && kind) creel.push(kind.name);
      casts += 1;
      kind = null;
      lock = 0;
      if (casts >= 6) {
        setDone([...creel]);
        return;
      }
      setHud({
        name: caught ? "On the stringer" : "It got away",
        lock: 0,
        n: casts,
        got: creel.length,
        line: "Click the water for the next fish.",
      });
    };

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width) * W;
      mouse.y = ((e.clientY - r.top) / r.height) * H;
      mouse.in = true;
    };
    const onClick = () => {
      if (!kind && casts < 6) spawn();
    };
    const onKey = (e: KeyboardEvent) => {
      held.add(e.code);
      if (e.code === "Enter" || e.code === "Space") onClick();
    };
    const onUp = (e: KeyboardEvent) => held.delete(e.code);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (kind) {
        twitchT += dt;
        if (held.has("ArrowLeft") || held.has("KeyA")) mouse.x = Math.max(0, mouse.x - 70 * dt);
        if (held.has("ArrowRight") || held.has("KeyD")) mouse.x = Math.min(W, mouse.x + 70 * dt);
        if (held.has("ArrowUp") || held.has("KeyW")) mouse.y = Math.max(0, mouse.y - 70 * dt);
        if (held.has("ArrowDown") || held.has("KeyS")) mouse.y = Math.min(H, mouse.y + 70 * dt);
        if (held.has("ArrowLeft") || held.has("ArrowRight") || held.has("ArrowUp") || held.has("ArrowDown") || held.has("KeyA") || held.has("KeyD") || held.has("KeyW") || held.has("KeyS")) {
          mouse.in = true;
        }
        if (twitchT > 1 / Math.max(0.2, kind.twitch)) {
          twitchT = 0;
          ang += (Math.random() - 0.5) * (0.6 + kind.twitch * 0.7);
        }
        ang += Math.sin(now / (180 / (1 + kind.twitch))) * kind.twitch * 0.012;
        fx += Math.cos(ang) * kind.spd * TUNE.fishSpeed[level - 1] * dt;
        fy += Math.sin(ang) * kind.spd * TUNE.fishSpeed[level - 1] * 0.55 * dt;
        if (fy < 18 || fy > H - 16) {
          ang = -ang;
          fy = Math.max(18, Math.min(H - 16, fy));
        }
        const dist = Math.hypot(mouse.x - fx, mouse.y - fy);
        const on = mouse.in && dist < kind.radius;
        lock = on ? Math.min(1, lock + dt / kind.hold) : Math.max(0, lock - dt * 0.7);
        if (lock >= 1) finishSwim(true);
        else if (fx < -12 || fx > W + 12) finishSwim(false);
        else {
          setHud({
            name: kind.name,
            lock,
            n: casts,
            got: creel.length,
            line: on ? "Holding…" : "Stay on it.",
          });
        }
      }

      if (lake.complete && lake.naturalWidth) ctx.drawImage(lake, 0, 0, W, H);
      else {
        ctx.fillStyle = "#2a5a68";
        ctx.fillRect(0, 0, W, H);
      }
      if (kind) {
        const im = imgs[FISH.findIndex((f) => f.id === kind!.id)] ?? imgs[0];
        ctx.save();
        ctx.translate(fx, fy);
        ctx.scale(Math.cos(ang) < 0 ? -1 : 1, 1);
        if (im.complete) ctx.drawImage(im, -10, -6, 20, 12);
        else {
          ctx.fillStyle = "#c9a227";
          ctx.fillRect(-8, -4, 16, 8);
        }
        ctx.restore();
        ctx.strokeStyle = lock > 0.02 ? "#6b8f71" : "#c4783a";
        ctx.beginPath();
        ctx.arc(fx, fy, kind.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#1a1410";
        ctx.fillRect(24, H - 10, 272, 4);
        ctx.fillStyle = "#6b8f71";
        ctx.fillRect(24, H - 10, 272 * lock, 4);
      } else {
        ctx.fillStyle = "#f3e6d0";
        ctx.font = cabFont(10);
        ctx.fillText("Click the water", 110, 72);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onUp);
    };
  }, [done]);

  if (done) {
    return (
      <Bezel>
        <p className="font-mono text-xs tracking-widest text-good">LAKE.MASTER</p>
        <h2 className="font-display mt-2 text-2xl text-good">{done.length} in the creel</h2>
        <p className="mt-2 font-mono text-sm text-good/80">{done.length ? done.join(", ") : "The lake kept them."}</p>
        <button type="button" className="btn-primary mt-5" onClick={() => onDone(done.length)}>
          Back
        </button>
      </Bezel>
    );
  }

  return (
    <Bezel>
      <p className="font-mono text-xs tracking-widest text-good">
        FISH.CAB  ·  {hud.name}  ·  {hud.n}/6
      </p>
      <h2 className="font-display mt-1 text-lg text-good">{hud.line}</h2>
      <canvas
        ref={canvasRef}
        width={320}
        height={140}
        className="mt-2 w-full cursor-crosshair border border-[#3d5c66]"
        style={{ imageRendering: "pixelated" }}
      />
      <p className="mt-2 font-mono text-xs text-good/70">
        In the creel {hud.got} · carp is lazy · bowfin will not wait
      </p>
      <button type="button" className="btn-ghost mt-3" onClick={onAbort}>
        Leave dock
      </button>
    </Bezel>
  );
}

type Cell = { stage: 0 | 1 | 2 | 3; wet: number; grow: number; pest: boolean; walk: number; dest: number };

function freshPlot(): Cell[] {
  return Array.from({ length: 9 }, () => ({ stage: 0, wet: 0, grow: 0, pest: false, walk: 0, dest: -1 }));
}

function neighbors(i: number) {
  const c = i % 3;
  const r = Math.floor(i / 3);
  const out: number[] = [];
  if (c > 0) out.push(i - 1);
  if (c < 2) out.push(i + 1);
  if (r > 0) out.push(i - 3);
  if (r < 2) out.push(i + 3);
  return out;
}

const PLOT_TILE = 16;
const PLOT_SCALE = 6;

/**
 * One bed of the plot, drawn on a 16 by 16 grid: soil, a seed, a sprout that droops when dry,
 * a ripe plant, and the pest. The word for the state stays on the button for screen readers.
 */
function PlotTile({ cell }: { cell: Cell }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = cell.pest ? (cell.walk > 0.45 ? 5 : 4) : cell.stage === 2 ? (cell.wet > 0.2 ? 2 : 6) : cell.stage;
  useEffect(() => {
    const g = ref.current?.getContext("2d");
    if (!g) return;
    const px = (x: number, y: number, w: number, h: number, c: string) => {
      g.fillStyle = c;
      g.fillRect(x, y, w, h);
    };
    const wet = state === 2;
    // Soil: furrows, darker when watered.
    px(0, 0, 16, 16, wet ? PAL.woodDark : PAL.woodMid);
    for (let y = 2; y < 16; y += 4) px(0, y, 16, 1, wet ? PAL.outline : PAL.woodDark);
    for (let i = 0; i < 6; i++) px((i * 7 + 3) % 15, (i * 5 + 1) % 15, 1, 1, wet ? PAL.steelD : PAL.wood);
    if (state === 1) {
      px(7, 9, 2, 2, PAL.creamD);
      px(7, 9, 1, 1, PAL.cream);
      px(6, 11, 4, 1, PAL.woodDark);
    }
    if (state === 2) {
      px(7, 6, 2, 7, PAL.leafD);
      px(4, 6, 3, 2, PAL.leaf);
      px(9, 4, 3, 2, PAL.leaf);
      px(5, 5, 1, 1, PAL.leafL);
      px(10, 3, 1, 1, PAL.leafL);
      px(2, 13, 2, 1, PAL.sky);
      px(12, 12, 2, 1, PAL.sky);
    }
    if (state === 6) {
      px(7, 8, 2, 5, PAL.goldD);
      px(4, 9, 3, 2, PAL.gold);
      px(9, 8, 3, 2, PAL.gold);
      px(3, 11, 1, 1, PAL.goldD);
      px(12, 10, 1, 1, PAL.goldD);
    }
    if (state === 3) {
      px(7, 5, 2, 9, PAL.leafD);
      px(3, 8, 4, 2, PAL.leaf);
      px(9, 7, 4, 2, PAL.leaf);
      px(4, 11, 3, 2, PAL.leaf);
      px(9, 11, 3, 2, PAL.leaf);
      px(5, 2, 6, 5, PAL.bad);
      px(6, 1, 4, 1, PAL.bad);
      px(6, 3, 2, 2, PAL.copperL);
      px(7, 0, 2, 2, PAL.leafD);
      px(5, 6, 6, 1, PAL.badD);
    }
    if (state === 4 || state === 5) {
      const dx = state === 5 ? 2 : 0;
      px(4 + dx, 6, 8, 6, PAL.outline);
      px(5 + dx, 5, 6, 1, PAL.outline);
      px(5 + dx, 7, 6, 4, PAL.wine);
      px(6 + dx, 7, 1, 4, PAL.bad);
      px(9 + dx, 7, 1, 4, PAL.bad);
      px(11 + dx, 7, 2, 2, PAL.outline);
      px(12 + dx, 7, 1, 1, PAL.cream);
      px(4 + dx, 12, 1, 2, PAL.outline);
      px(7 + dx, 12, 1, 2, PAL.outline);
      px(10 + dx, 12, 1, 2, PAL.outline);
      px(12 + dx, 4, 1, 2, PAL.outline);
      if (state === 5) px(1, 8, 2, 1, PAL.cream);
    }
  }, [state]);
  return (
    <canvas
      ref={ref}
      width={PLOT_TILE}
      height={PLOT_TILE}
      aria-hidden
      style={{ width: PLOT_TILE * PLOT_SCALE, height: PLOT_TILE * PLOT_SCALE, imageRendering: "pixelated", display: "block", margin: 0, border: 0 }}
    />
  );
}

export function PlotGame({ onDone, onAbort, level = 1 }: { onDone: (score: number) => void; onAbort: () => void; level?: CabLevel }) {
  const [grid, setGrid] = useState<Cell[]>(freshPlot);
  const [cut, setCut] = useState(0);
  const [clock, setClock] = useState<number>(TUNE.plotClock[level - 1]);
  const [done, setDone] = useState(false);
  const [canCd, setCanCd] = useState(0);
  const cutRef = useRef(0);
  const doneRef = useRef(false);
  const canRef = useRef(0);

  useEffect(() => {
    if (done) return;
    let last = performance.now();
    let t: number = TUNE.plotClock[level - 1];
    let raf = 0;
    const loop = (now: number) => {
      if (doneRef.current) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t -= dt;
      setClock(t);
      canRef.current = Math.max(0, canRef.current - dt);
      setCanCd(canRef.current);
      setGrid((g) => {
        const n = g.map((c) => ({ ...c }));
        for (let i = 0; i < n.length; i++) {
          const c = n[i];
          if (c.stage === 2) {
            c.wet = Math.max(0, c.wet - dt * 0.18);
            c.grow += dt * (c.wet > 0.15 ? 1 : 0.18);
            if (c.grow > 3.2) {
              c.stage = 3;
              c.grow = 0;
            }
          }
          if ((c.stage === 2 || c.stage === 3) && !c.pest && Math.random() < dt * 0.05 * TUNE.plotPest[level - 1]) {
            c.pest = true;
            c.walk = 0;
            const opts = neighbors(i);
            c.dest = opts[Math.floor(Math.random() * opts.length)] ?? i;
          }
          if (c.pest) {
            c.walk += dt * 0.55;
            if (c.walk >= 1 && c.dest >= 0 && c.dest !== i && !n[c.dest].pest) {
              n[c.dest].pest = true;
              n[c.dest].walk = 0;
              const next = neighbors(c.dest);
              n[c.dest].dest = next[Math.floor(Math.random() * next.length)] ?? c.dest;
              if (n[c.dest].stage === 3) {
                n[c.dest].stage = 0;
                n[c.dest].wet = 0;
                n[c.dest].grow = 0;
              }
              c.pest = false;
              c.walk = 0;
              c.dest = -1;
            }
          }
        }
        return n;
      });
      if (t <= 0) {
        doneRef.current = true;
        setDone(true);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [done]);

  const tap = (i: number) => {
    if (doneRef.current) return;
    setGrid((g) => {
      const n = g.map((c) => ({ ...c }));
      const c = n[i];
      if (c.pest) {
        c.pest = false;
        c.walk = 0;
        c.dest = -1;
        return n;
      }
      if (c.stage === 0) c.stage = 1;
      else if (c.stage === 1) {
        c.stage = 2;
        c.wet = 1;
        c.grow = 0;
      } else if (c.stage === 2) {
        if (canRef.current > 0) return n;
        c.wet = 1;
        canRef.current = 1.35;
        setCanCd(1.35);
      } else if (c.stage === 3) {
        cutRef.current += 1;
        setCut(cutRef.current);
        n[i] = { stage: 0, wet: 0, grow: 0, pest: false, walk: 0, dest: -1 };
      }
      return n;
    });
  };

  const label = (c: Cell) => {
    if (c.pest) return c.walk > 0.45 ? "pest →" : "pest";
    if (c.stage === 0) return "dirt";
    if (c.stage === 1) return "seed";
    if (c.stage === 2) return c.wet > 0.2 ? "wet" : "dry";
    return "ripe";
  };

  return (
    <Bezel>
      <p className="font-mono text-xs tracking-widest text-good">PLOT.CAB  ·  Mabel's dirt</p>
      <h2 className="font-display mt-1 text-xl text-good">Seed. Water. Squash. Cut.</h2>
      <p className="font-mono text-[10px] text-good/70">
        {done
          ? `Basket ${cut}`
          : `${clock.toFixed(1)}s  ·  harvest ${cut}  ·  pests walk  ·  can ${canCd > 0 ? canCd.toFixed(1) + "s" : "ready"}`}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-1">
        {grid.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => tap(i)}
            aria-label={label(c)}
            data-plot={label(c)}
            className="block border-2 border-[#1a1410] p-0"
            style={{ width: PLOT_TILE * PLOT_SCALE + 4, height: PLOT_TILE * PLOT_SCALE + 4, background: "#3a2818" }}
          >
            <PlotTile cell={c} />
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        {done ? (
          <button type="button" className="btn-primary" onClick={() => onDone(cut)}>
            Basket {cut}
          </button>
        ) : (
          <button type="button" className="btn-ghost" onClick={onAbort}>
            Leave plot
          </button>
        )}
      </div>
    </Bezel>
  );
}

