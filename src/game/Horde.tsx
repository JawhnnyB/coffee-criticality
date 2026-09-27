"use client";

import { useEffect, useRef, useState } from "react";
import { Bezel } from "./Arcade";
import { HORDE_MAPS } from "./hordeMaps";

type GunId = "pistol" | "pump" | "db" | "ak" | "m16" | "lmg";
type ZedKind = "chase" | "flank" | "rush" | "wander";

const GUNS: Record<
  GunId,
  { name: string; dmg: number; pellets: number; rpm: number; spread: number; mag: number; reload: number; speed: number }
> = {
  pistol: { name: "Pistol", dmg: 1, pellets: 1, rpm: 4.2, spread: 0.05, mag: 12, reload: 0.85, speed: 1 },
  pump: { name: "Pump", dmg: 0.7, pellets: 6, rpm: 1.15, spread: 0.32, mag: 6, reload: 1.7, speed: 0.95 },
  db: { name: "Double", dmg: 0.85, pellets: 8, rpm: 2.4, spread: 0.38, mag: 2, reload: 1.35, speed: 0.95 },
  ak: { name: "AK-47", dmg: 1.15, pellets: 1, rpm: 8.5, spread: 0.12, mag: 30, reload: 1.55, speed: 0.92 },
  m16: { name: "M16", dmg: 1.2, pellets: 1, rpm: 7.4, spread: 0.06, mag: 30, reload: 1.45, speed: 0.94 },
  lmg: { name: "LMG", dmg: 1.05, pellets: 1, rpm: 10.2, spread: 0.16, mag: 80, reload: 3.1, speed: 0.72 },
};

const ORDER: GunId[] = ["pistol", "pump", "db", "ak", "m16", "lmg"];
const KINDS: ZedKind[] = ["chase", "flank", "rush", "wander"];
const TS = 16;

type Zed = {
  x: number;
  y: number;
  hp: number;
  spd: number;
  hit: number;
  kind: ZedKind;
  wander: number;
  frame: number;
};
type Shot = { x: number; y: number; vx: number; vy: number; dmg: number; life: number };
type Cell = readonly [number, number];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

type Grid = { cols: number; rows: number; wall: Uint8Array; playerNo: Uint8Array };

function buildGrid(map: (typeof HORDE_MAPS)[number]): Grid {
  const cols = Math.floor(map.w / TS);
  const rows = Math.floor(map.h / TS);
  const wall = new Uint8Array(cols * rows);
  const playerNo = new Uint8Array(cols * rows);
  const mark = (cells: readonly Cell[], buf: Uint8Array) => {
    for (const [x, y] of cells) {
      if (x >= 0 && y >= 0 && x < cols && y < rows) buf[y * cols + x] = 1;
    }
  };
  mark(map.solid, wall);
  mark(map.solid, playerNo);
  mark(map.door, playerNo);
  mark(map.spawn, playerNo);
  return { cols, rows, wall, playerNo };
}

function cellBlocked(g: Grid, buf: Uint8Array, px: number, py: number, rad: number) {
  const x0 = Math.floor((px - rad) / TS);
  const y0 = Math.floor((py - rad) / TS);
  const x1 = Math.floor((px + rad) / TS);
  const y1 = Math.floor((py + rad) / TS);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (tx < 0 || ty < 0 || tx >= g.cols || ty >= g.rows) return true;
      if (buf[ty * g.cols + tx]) return true;
    }
  }
  return false;
}

function flowToward(
  g: Grid,
  gx: number,
  gy: number,
  dist: Int16Array,
  dirX: Int8Array,
  dirY: Int8Array,
) {
  const { cols, rows, wall } = g;
  dist.fill(32767);
  dirX.fill(0);
  dirY.fill(0);
  const tx = Math.max(0, Math.min(cols - 1, Math.floor(gx / TS)));
  const ty = Math.max(0, Math.min(rows - 1, Math.floor(gy / TS)));
  const start = ty * cols + tx;
  const q: number[] = [];
  if (wall[start]) {
    for (const [ox, oy] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ] as const) {
      const nx = tx + ox;
      const ny = ty + oy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const i = ny * cols + nx;
      if (!wall[i]) {
        dist[i] = 0;
        q.push(i);
        break;
      }
    }
  } else {
    dist[start] = 0;
    q.push(start);
  }
  const nbs: [number, number][] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  for (let qh = 0; qh < q.length; qh++) {
    const i = q[qh];
    const cx = i % cols;
    const cy = (i / cols) | 0;
    const d0 = dist[i];
    for (const [ox, oy] of nbs) {
      if (ox && oy) {
        if (cx + ox < 0 || cx + ox >= cols || cy + oy < 0 || cy + oy >= rows) continue;
        if (wall[cy * cols + (cx + ox)] || wall[(cy + oy) * cols + cx]) continue;
      }
      const nx = cx + ox;
      const ny = cy + oy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const j = ny * cols + nx;
      if (wall[j]) continue;
      const nd = d0 + (ox && oy ? 14 : 10);
      if (nd < dist[j]) {
        dist[j] = nd;
        q.push(j);
      }
    }
  }
  for (let i = 0; i < cols * rows; i++) {
    if (wall[i] || dist[i] === 32767) continue;
    const cx = i % cols;
    const cy = (i / cols) | 0;
    let best = dist[i];
    let bx = 0;
    let by = 0;
    for (const [ox, oy] of nbs) {
      const nx = cx + ox;
      const ny = cy + oy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const j = ny * cols + nx;
      if (dist[j] < best) {
        best = dist[j];
        bx = ox;
        by = oy;
      }
    }
    dirX[i] = bx;
    dirY[i] = by;
  }
}

function spawnZed(round: number, r: () => number, map: (typeof HORDE_MAPS)[number]): Zed {
  const cell = map.spawn[Math.floor(r() * map.spawn.length)] ?? [1, 1];
  const kind = KINDS[Math.min(3, Math.floor(r() * (1 + round / 3)))];
  const spd = kind === "rush" ? 40 + round * 4 : kind === "wander" ? 20 + round * 2 : 26 + round * 3;
  const hp = kind === "rush" ? 0.8 + round * 0.35 : 1.1 + round * 0.55;
  return {
    x: cell[0] * TS + 8,
    y: cell[1] * TS + 8,
    hp,
    spd,
    hit: 0,
    kind,
    wander: r() * Math.PI * 2,
    frame: r(),
  };
}

export function HordeGame({ onDone, onAbort }: { onDone: (score: number) => void; onAbort: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [end, setEnd] = useState<{ round: number; kills: number; map: string } | null>(null);
  const endRef = useRef(false);
  const mapRef = useRef(HORDE_MAPS[Math.floor(Math.random() * HORDE_MAPS.length)]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || end) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const map = mapRef.current;
    const W = map.w;
    const H = map.h;
    const grid = buildGrid(map);
    const dist = new Int16Array(grid.cols * grid.rows);
    const dirX = new Int8Array(grid.cols * grid.rows);
    const dirY = new Int8Array(grid.cols * grid.rows);
    let flowT = 0;
    const rand = rng((Math.random() * 1e9) | 0);
    const mapImg = new Image();
    mapImg.src = map.src;
    const zedImg = [new Image(), new Image()];
    zedImg[0].src = "/art/gen/ui/zed_0.png?v=map";
    zedImg[1].src = "/art/gen/ui/zed_1.png?v=map";

    const keys = new Set<string>();
    let mx = W / 2;
    let my = H / 2;
    let firing = false;
    const wantGun = { current: "pistol" as GunId };
    const down = (e: KeyboardEvent) => {
      keys.add(e.code);
      if (e.code === "Escape") onAbort();
      const n = e.code.startsWith("Digit") ? Number(e.code.slice(5)) : 0;
      if (n >= 1 && n <= 6) wantGun.current = ORDER[n - 1];
    };
    const up = (e: KeyboardEvent) => keys.delete(e.code);
    const move = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width) * W;
      my = ((e.clientY - r.top) / r.height) * H;
    };
    const md = (e: MouseEvent) => {
      e.preventDefault();
      firing = true;
    };
    const mu = () => {
      firing = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mousedown", md);
    window.addEventListener("mouseup", mu);

    let x = W / 2;
    let y = H / 2;
    let hp = 6;
    let iFrame = 0;
    let gun: GunId = "pistol";
    const owned = new Set<GunId>(["pistol"]);
    let ammo = GUNS.pistol.mag;
    let reloadT = 0;
    let cool = 0;
    let kills = 0;
    let round = 1;
    let toSpawn = 6;
    let waveWait = 1.4;
    let zeds: Zed[] = [];
    let shots: Shot[] = [];
    let last = performance.now();
    let raf = 0;

    const fire = () => {
      const g = GUNS[gun];
      if (reloadT > 0 || ammo <= 0) {
        if (ammo <= 0 && reloadT <= 0) reloadT = g.reload;
        return;
      }
      if (cool > 0) return;
      const ang = Math.atan2(my - y, mx - x);
      for (let i = 0; i < g.pellets; i++) {
        const a = ang + (Math.random() - 0.5) * g.spread * 2;
        shots.push({ x, y, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220, dmg: g.dmg, life: 0.55 });
      }
      ammo -= 1;
      cool = 1 / g.rpm;
      if (ammo <= 0) reloadT = g.reload;
    };

    const stepPlayer = (px: number, py: number, dx: number, dy: number) => {
      let nx = px + dx;
      let ny = py + dy;
      if (cellBlocked(grid, grid.playerNo, nx, py, 6)) nx = px;
      if (cellBlocked(grid, grid.playerNo, nx, ny, 6)) ny = py;
      return { x: nx, y: ny };
    };
    const stepZed = (px: number, py: number, dx: number, dy: number) => {
      let nx = px + dx;
      let ny = py + dy;
      if (cellBlocked(grid, grid.wall, nx, py, 6)) nx = px;
      if (cellBlocked(grid, grid.wall, nx, ny, 6)) ny = py;
      return { x: nx, y: ny };
    };

    const loop = (now: number) => {
      if (endRef.current) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      iFrame = Math.max(0, iFrame - dt);
      cool = Math.max(0, cool - dt);
      if (reloadT > 0) {
        reloadT -= dt;
        if (reloadT <= 0) ammo = GUNS[gun].mag;
      }
      if (wantGun.current !== gun && owned.has(wantGun.current)) {
        gun = wantGun.current;
        ammo = GUNS[gun].mag;
        reloadT = 0;
      }

      const g = GUNS[gun];
      let vx = 0;
      let vy = 0;
      if (keys.has("KeyA") || keys.has("ArrowLeft")) vx -= 1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) vx += 1;
      if (keys.has("KeyW") || keys.has("ArrowUp")) vy -= 1;
      if (keys.has("KeyS") || keys.has("ArrowDown")) vy += 1;
      const len = Math.hypot(vx, vy) || 1;
      const moved = stepPlayer(x, y, (vx / len) * 78 * g.speed * dt, (vy / len) * 78 * g.speed * dt);
      x = moved.x;
      y = moved.y;
      if (firing || keys.has("Space")) fire();

      flowT -= dt;
      if (flowT <= 0) {
        flowToward(grid, x, y, dist, dirX, dirY);
        flowT = 0.12;
      }

      if (waveWait > 0) waveWait -= dt;
      else if (toSpawn > 0) {
        const burst = Math.min(1 + Math.floor(round / 3), toSpawn);
        for (let i = 0; i < burst; i++) zeds.push(spawnZed(round, rand, map));
        toSpawn -= burst;
        waveWait = Math.max(0.22, 0.55 - round * 0.03);
      }

      for (const z of zeds) {
        z.frame += dt * 6;
        z.wander += dt * (z.kind === "wander" ? 2.2 : 0.4);
        const ti = Math.max(0, Math.min(grid.cols - 1, Math.floor(z.x / TS)));
        const tj = Math.max(0, Math.min(grid.rows - 1, Math.floor(z.y / TS)));
        const fi = tj * grid.cols + ti;
        let fx = dirX[fi];
        let fy = dirY[fi];
        if (z.kind === "flank") {
          const px = Math.floor(x / TS);
          const py = Math.floor(y / TS);
          fx += py > tj ? 1 : -1;
          fy += px > ti ? -1 : 1;
        }
        if (z.kind === "wander" && dist[fi] > 40) {
          fx += Math.cos(z.wander);
          fy += Math.sin(z.wander);
        }
        if (fx === 0 && fy === 0) {
          fx = x - z.x;
          fy = y - z.y;
        }
        const fl = Math.hypot(fx, fy) || 1;
        let n = stepZed(z.x, z.y, (fx / fl) * z.spd * dt, (fy / fl) * z.spd * dt);
        if (n.x === z.x && n.y === z.y) {
          n = stepZed(z.x, z.y, (-fy / fl) * z.spd * dt, (fx / fl) * z.spd * dt);
        }
        z.x = n.x;
        z.y = n.y;
        z.hit = Math.max(0, z.hit - dt);
        if (iFrame <= 0 && (x - z.x) ** 2 + (y - z.y) ** 2 < 12 * 12) {
          hp -= 1;
          iFrame = 0.7;
          if (hp <= 0) {
            endRef.current = true;
            setEnd({ round, kills, map: map.name });
            return;
          }
        }
      }

      for (let i = 0; i < zeds.length; i++) {
        for (let j = i + 1; j < zeds.length; j++) {
          const a = zeds[i];
          const b = zeds[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > 1 && d2 < 100) {
            const d = Math.sqrt(d2);
            const p = ((10 - d) / d) * 0.35;
            a.x += dx * p;
            a.y += dy * p;
            b.x -= dx * p;
            b.y -= dy * p;
          }
        }
      }

      for (const s of shots) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt;
        if (cellBlocked(grid, grid.wall, s.x, s.y, 2)) s.life = 0;
        for (const z of zeds) {
          if (z.hp <= 0) continue;
          if ((s.x - z.x) ** 2 + (s.y - z.y) ** 2 < 9 * 9) {
            z.hp -= s.dmg;
            z.hit = 0.08;
            s.life = 0;
            if (z.hp <= 0) kills += 1;
          }
        }
      }
      shots = shots.filter((s) => s.life > 0 && s.x > -4 && s.x < W + 4);
      zeds = zeds.filter((z) => z.hp > 0);

      if (toSpawn <= 0 && zeds.length === 0 && waveWait <= 0) {
        round += 1;
        const next = ORDER[Math.min(ORDER.length - 1, round - 1)];
        owned.add(next);
        gun = next;
        wantGun.current = next;
        ammo = GUNS[gun].mag;
        reloadT = 0;
        toSpawn = 5 + round * 3;
        waveWait = 1.6;
        hp = Math.min(6, hp + 1);
      }

      ctx.fillStyle = "#1a1814";
      ctx.fillRect(0, 0, W, H);
      if (mapImg.complete && mapImg.naturalWidth) ctx.drawImage(mapImg, 0, 0, W, H);
      else {
        ctx.fillStyle = "#242018";
        ctx.fillRect(0, 0, W, H);
      }
      for (const z of zeds) {
        const im = zedImg[Math.floor(z.frame) % 2];
        ctx.save();
        if (z.hit > 0) ctx.globalAlpha = 0.55;
        if (im.complete) ctx.drawImage(im, z.x - 8, z.y - 20, 16, 24);
        else {
          ctx.fillStyle = "#4a6a3a";
          ctx.fillRect(z.x - 5, z.y - 11, 10, 14);
        }
        ctx.restore();
      }
      for (const s of shots) {
        ctx.fillStyle = "#f3e6d0";
        ctx.fillRect(s.x - 1, s.y - 1, 2, 2);
      }
      ctx.fillStyle = iFrame > 0 ? "#c4783a" : "#f3e6d0";
      ctx.fillRect(x - 4, y - 11, 8, 16);
      ctx.fillStyle = "#c4783a";
      ctx.fillRect(x - 2, y - 14, 4, 4);
      const aim = Math.atan2(my - y, mx - x);
      ctx.fillStyle = "#16110d";
      ctx.fillRect(x + Math.cos(aim) * 7 - 1, y + Math.sin(aim) * 7 - 1, 5, 2);

      ctx.fillStyle = "#f3e6d0";
      ctx.font = "8px monospace";
      ctx.fillText(`R${round}  ${map.name}  ${GUNS[gun].name}  ${reloadT > 0 ? "REL" : ammo + "/" + GUNS[gun].mag}  K${kills}`, 6, 16);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i < hp ? "#b85c4a" : "#3a322a";
        ctx.fillRect(6 + i * 8, H - 12, 6, 5);
      }
      ctx.fillStyle = "#8a7864";
      ctx.fillText("WASD  mouse  1-6  click", 150, H - 8);
      if (waveWait > 0.4 && zeds.length === 0) {
        ctx.fillStyle = "#c9a227";
        ctx.font = "12px monospace";
        ctx.fillText(`ROUND ${round}`, W / 2 - 32, H / 2);
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
  }, [end, onAbort]);

  if (end) {
    return (
      <Bezel>
        <p className="font-mono text-xs tracking-widest text-good">HORDE.CAB</p>
        <h2 className="font-display mt-2 text-2xl text-good">
          Round {end.round} · {end.kills} down
        </h2>
        <p className="mt-2 font-mono text-sm text-good/80">Died on {end.map}. Next insert picks another of the eight lots.</p>
        <button type="button" className="btn-primary mt-5" onClick={() => onDone(end.kills)}>
          Leave cabinet
        </button>
      </Bezel>
    );
  }

  return (
    <Bezel>
      <p className="font-mono text-xs tracking-widest text-good">HORDE.CAB  ·  {mapRef.current.name}  ·  1–6 guns</p>
      <canvas
        ref={canvasRef}
        width={mapRef.current.w}
        height={mapRef.current.h}
        className="cab-play mt-2 cursor-crosshair"
        style={{ imageRendering: "pixelated" }}
      />
      <p className="mt-2 font-mono text-[10px] leading-snug text-good/70">
        They spawn in the dark rooms outside. Doors are theirs. You hold the floor.
      </p>
      <button type="button" className="btn-ghost mt-2" onClick={onAbort}>
        Leave cabinet
      </button>
    </Bezel>
  );
}
