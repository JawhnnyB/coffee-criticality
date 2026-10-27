"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { integerScale } from "./artScale";
import { DEFAULT_PLAYER_LOOK, type HairId, type HoodieId, type PlayerLook } from "./artSpec";
import { Chatter } from "./Chatter";
import { isRevealing, subscribeReveal } from "./chatter";
import type { IntroBeat, RoleId } from "./content";
import { NPCS, ROLES } from "./content";
import {
  BEAT_PIP,
  BEAT_SCENE,
  BEAT_WHO,
  GUEST_NAME,
  NW,
  NH,
  focusOy,
  paintBadge,
  paintBeat,
  paintBrief,
  paintIris,
  paintLanyard,
  paintWipe,
  watchImages,
} from "./introPaint";
import { tintA6 } from "./pixel";

const HOODS: HoodieId[] = ["copper", "leaf", "steel", "gold"];
const HAIRS: HairId[] = ["brown", "ink", "silver", "copper"];

function useBox(ref: { current: HTMLElement | null }) {
  const [box, setBox] = useState({ w: 384, h: 216 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return box;
}

function Stage({
  testId,
  children,
}: {
  testId: string;
  children: (s: { zoom: number; dw: number; dh: number }) => ReactNode;
}) {
  const host = useRef<HTMLDivElement>(null);
  const box = useBox(host);
  const scale = integerScale(box.w, box.h, NW, NH);
  return (
    <div ref={host} className="absolute inset-0 z-20" data-testid={testId} style={{ background: "#1c1410" }}>
      <div
        style={{
          position: "absolute",
          left: scale.ox,
          top: scale.oy,
          width: scale.dw,
          height: scale.dh,
        }}
      >
        {children(scale)}
      </div>
    </div>
  );
}

function hit(
  zoom: number,
  x: number,
  y: number,
  w: number,
  h: number,
): CSSProperties {
  return {
    position: "absolute",
    left: x * zoom,
    top: y * zoom,
    width: w * zoom,
    height: h * zoom,
    margin: 0,
    padding: 0,
    border: 0,
    background: "transparent",
    display: "block",
    fontSize: 0,
    lineHeight: 0,
    cursor: "pointer",
  };
}

function isDefault(look: PlayerLook) {
  return look.hoodie === DEFAULT_PLAYER_LOOK.hoodie && look.hair === DEFAULT_PLAYER_LOOK.hair && look.glasses === DEFAULT_PLAYER_LOOK.glasses;
}

export function PixelBadge({
  look,
  onLook,
  onRole,
  onBack,
}: {
  look: PlayerLook;
  onLook: (next: PlayerLook) => void;
  onRole: (id: RoleId) => void;
  onBack: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cursor, setCursor] = useState(0);
  const [tick, setTick] = useState(0);
  const showPng = isDefault(look) && cursor === 0;

  useEffect(() => {
    return watchImages(
      [
        "/art/intro/badge.png",
        "/art/ui/portraits/portrait-player-smile.png",
        "/art/ui/portraits/portrait-player-smile-noglasses.png",
        "/art/gen/sprites/player_walk4.png",
      ],
      () => setTick((n) => n + 1),
    );
  }, [look.glasses]);

  useEffect(() => {
    if (showPng) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const walk = new Image();
    walk.src = "/art/gen/sprites/player_walk4.png";
    const paint = () => {
      if (!walk.complete || walk.naturalWidth < 32) return;
      ctx.imageSmoothingEnabled = false;
      paintBadge(ctx, { look, cursor, sprites: tintA6(walk, look) });
    };
    paint();
    walk.addEventListener("load", paint);
    return () => walk.removeEventListener("load", paint);
  }, [showPng, look, cursor, tick]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Escape") onBack();
      else if (e.code === "ArrowRight") setCursor((i) => Math.min(3, i + 1));
      else if (e.code === "ArrowLeft") setCursor((i) => Math.max(0, i - 1));
      else if (e.code === "ArrowDown") setCursor((i) => Math.min(3, i + 2));
      else if (e.code === "ArrowUp") setCursor((i) => Math.max(0, i - 2));
      else if (e.code === "Enter" || e.code === "Space") onRole(ROLES[cursor].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cursor, onBack, onRole]);

  return (
    <Stage testId="pixel-badge">
      {(scale) => (
        <>
          {showPng ? (
            <img
              src="/art/intro/badge.png"
              alt=""
              width={NW}
              height={NH}
              style={{ width: scale.dw, height: scale.dh, imageRendering: "pixelated", display: "block" }}
            />
          ) : (
            <canvas
              ref={canvasRef}
              width={NW}
              height={NH}
              style={{ width: scale.dw, height: scale.dh, imageRendering: "pixelated", display: "block" }}
            />
          )}
          {HOODS.map((id, i) => (
            <button
              key={id}
              type="button"
              aria-label={"Hoodie " + id}
              style={hit(scale.zoom, 84 + i * 16, 71, 13, 13)}
              onClick={() => onLook({ ...look, hoodie: id })}
            />
          ))}
          {HAIRS.map((id, i) => (
            <button
              key={id}
              type="button"
              aria-label={"Hair " + id}
              style={hit(scale.zoom, 84 + i * 16, 101, 13, 13)}
              onClick={() => onLook({ ...look, hair: id })}
            />
          ))}
          <button
            type="button"
            aria-label="Glasses"
            style={hit(scale.zoom, 84, 122, 70, 12)}
            onClick={() => onLook({ ...look, glasses: !look.glasses })}
          />
          {ROLES.map((r, i) => (
            <button
              key={r.id}
              type="button"
              data-testid={"role-" + r.id}
              aria-label={r.title}
              style={hit(scale.zoom, 176 + (i % 2) * 100, 54 + ((i / 2) | 0) * 60, 96, 56)}
              onClick={() => onRole(r.id)}
            />
          ))}
          <button type="button" aria-label="Back" style={hit(scale.zoom, 16, 184, 54, 14)} onClick={onBack} />
        </>
      )}
    </Stage>
  );
}

function useTalking() {
  const [talking, setTalking] = useState(isRevealing());
  useEffect(() => subscribeReveal(setTalking), []);
  return talking;
}

function lineBox(zoom: number, y: number): CSSProperties {
  return {
    position: "absolute",
    left: 78 * zoom,
    top: y * zoom,
    width: 230 * zoom,
    margin: 0,
    pointerEvents: "none",
    ["--intro-fs" as string]: `${8 * zoom}px`,
    ["--intro-lh" as string]: `${9 * zoom}px`,
  };
}

export function PixelBeat({
  index,
  exchange,
  beat,
  look,
  onContinue,
}: {
  index: number;
  exchange: number;
  beat: IntroBeat;
  look: PlayerLook;
  onContinue: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const talking = useTalking();
  const [oy, setOy] = useState(() => focusOy(beat.exchanges[exchange]?.focus ?? "0% 0%"));
  const oyRef = useRef(oy);
  const [wipe, setWipe] = useState(0);
  const [tick, setTick] = useState(0);
  const ex = beat.exchanges[Math.min(exchange, beat.exchanges.length - 1)];
  const target = focusOy(ex?.focus ?? "0% 0%");
  const you = !!(beat.you || ex?.you);
  const who = BEAT_WHO[index] ?? "priya";
  const scene = BEAT_SCENE[index] ?? "core";
  const speaker = who === "player" ? "YOU" : (GUEST_NAME[who] ?? NPCS[who as keyof typeof NPCS]?.name ?? who).toUpperCase();
  const line = ex?.line ?? "";

  useEffect(() => {
    const srcs = [
      `/art/intro/scene-${scene}.png`,
      `/art/ui/portraits/portrait-${who}-smile.png`,
      `/art/ui/portraits/portrait-${who}-talk.png`,
      "/art/ui/portraits/portrait-player-smile.png",
      "/art/ui/portraits/portrait-player-talk.png",
      "/art/ui/portraits/portrait-player-smile-noglasses.png",
      "/art/ui/portraits/portrait-player-talk-noglasses.png",
    ];
    return watchImages(srcs, () => setTick((n) => n + 1));
  }, [scene, who, look.glasses]);

  const beatSeen = useRef<number | null>(null);
  useEffect(() => {
    const forced = window.__ccOy;
    if (typeof forced === "number") {
      oyRef.current = forced;
      setOy(forced);
      beatSeen.current = index;
      return;
    }
    const beatChanged = beatSeen.current != null && beatSeen.current !== index;
    beatSeen.current = index;
    if (beatChanged || oyRef.current === target) {
      if (beatChanged) {
        oyRef.current = target;
        setOy(target);
      }
      return;
    }
    let raf = 0;
    const step = () => {
      if (typeof window.__ccOy === "number") return;
      const cur = oyRef.current;
      if (cur === target) return;
      const next = cur < target ? Math.min(target, cur + 2) : Math.max(target, cur - 2);
      oyRef.current = next;
      setOy(next);
      if (next !== target) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [index, target]);

  useEffect(() => {
    const on = () => {
      const n = window.__ccOy;
      if (typeof n === "number") {
        oyRef.current = n;
        setOy(n);
      }
    };
    window.addEventListener("cc-oy", on);
    return () => window.removeEventListener("cc-oy", on);
  }, []);

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    let step = 0;
    let raf = 0;
    const tickWipe = () => {
      step += 1;
      setWipe(step);
      if (step < 4) raf = requestAnimationFrame(tickWipe);
      else raf = requestAnimationFrame(() => setWipe(0));
    };
    raf = requestAnimationFrame(tickWipe);
    return () => cancelAnimationFrame(raf);
  }, [index]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    paintBeat(ctx, {
      scene,
      oy: typeof window.__ccOy === "number" ? window.__ccOy : oy,
      who,
      you,
      look,
      mouth: talking ? "talk" : "smile",
      kicker: beat.kicker,
      title: beat.title,
      speaker,
      pip: BEAT_PIP[index] ?? index + 1,
    });
    paintWipe(ctx, wipe);
  }, [scene, oy, who, you, look, talking, beat.kicker, beat.title, speaker, index, wipe, tick]);

  return (
    <Stage testId="pixel-beat">
      {(scale) => (
        <>
          <canvas
            ref={canvasRef}
            width={NW}
            height={NH}
            style={{ width: scale.dw, height: scale.dh, imageRendering: "pixelated", display: "block" }}
          />
          <div className="intro-line" style={lineBox(scale.zoom, 174)}>
            <Chatter key={index + ":" + exchange + ":" + line} text={line} voice={you ? "player" : who} className="intro-line" />
          </div>
          <button type="button" aria-label="Continue" data-testid="intro-continue" style={hit(scale.zoom, 0, 0, NW, NH)} onClick={onContinue} />
        </>
      )}
    </Stage>
  );
}

export function PixelBrief({
  day,
  kicker,
  title,
  holt,
  items,
  yesterday,
  onWalk,
}: {
  day: number;
  kicker: string;
  title: string;
  holt: string;
  items: string[];
  yesterday: string | null;
  onWalk: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const talking = useTalking();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    return watchImages(
      ["/art/intro/scene-control.png", "/art/ui/portraits/portrait-holt-smile.png", "/art/ui/portraits/portrait-holt-talk.png"],
      () => setTick((n) => n + 1),
    );
  }, []);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    paintBrief(ctx, { day, kicker, title, items, yesterday, mouth: talking ? "talk" : "smile" });
  }, [day, kicker, title, items, yesterday, talking, tick]);

  return (
    <Stage testId="pixel-brief">
      {(scale) => (
        <>
          <canvas
            ref={canvasRef}
            width={NW}
            height={NH}
            style={{ width: scale.dw, height: scale.dh, imageRendering: "pixelated", display: "block" }}
          />
          <div className="intro-line" style={lineBox(scale.zoom, 133)}>
            <Chatter key={day + holt} text={holt} voice="holt" className="intro-line" />
          </div>
          <button type="button" data-testid="brief-walk" aria-label="Walk in" style={hit(scale.zoom, 270, 186, 90, 22)} onClick={onWalk} />
        </>
      )}
    </Stage>
  );
}

export function CastFace({ id, zoom = 4, live = false }: { id: string; zoom?: number; live?: boolean }) {
  const talking = useTalking();
  const mouth = live && talking ? "talk" : "smile";
  const src = `/art/ui/portraits/portrait-${id}-${mouth}.png`;
  const px = 48 * zoom;
  return (
    <img
      src={src}
      alt=""
      width={48}
      height={48}
      className="shrink-0 self-start"
      style={{ width: px, height: px, imageRendering: "pixelated" }}
    />
  );
}

/** Iris screen. Hold E / Space (or press and hold the button) to scan; let go and it returns to ALIGN. */
export function PixelIris({
  irisT,
  seconds,
  look,
  onHold,
  onWalkOn,
}: {
  irisT: number;
  seconds: number;
  look: PlayerLook;
  onHold: (down: boolean) => void;
  onWalkOn: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tick, setTick] = useState(0);
  const state = irisT >= seconds ? "match" : irisT > 0 ? "scan" : "align";
  useEffect(() => {
    return watchImages(
      ["align", "scan", "match"].map((n) => `/art/intro/scene-iris-${n}.png`).concat(["/art/ui/portraits/portrait-player-smile.png", "/art/ui/portraits/portrait-player-smile-noglasses.png"]),
      () => setTick((n) => n + 1),
    );
  }, []);
  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    paintIris(ctx, { state, progress: irisT / seconds, look });
  }, [state, irisT, seconds, look, tick]);
  return (
    <Stage testId="pixel-iris">
      {(scale) => (
        <>
          <canvas
            ref={canvasRef}
            width={NW}
            height={NH}
            style={{ width: scale.dw, height: scale.dh, imageRendering: "pixelated", display: "block" }}
          />
          <button
            type="button"
            data-testid="iris-hold"
            aria-label={state === "match" ? "Walk on" : "Hold to scan"}
            style={hit(scale.zoom, 284, 186, 80, 22)}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture?.(e.pointerId);
              if (state === "match") onWalkOn();
              else onHold(true);
            }}
            onPointerUp={() => onHold(false)}
            onPointerCancel={() => onHold(false)}
          />
        </>
      )}
    </Stage>
  );
}

/** BADGE ISSUED. White flash for 80 ms (the photo), then the card on its lanyard with the live portrait. */
export function PixelBadgeIssued({ look, role, onClose }: { look: PlayerLook; role: string; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tick, setTick] = useState(0);
  const [flash, setFlash] = useState(true);
  const [vh, setVh] = useState(() => (typeof window === "undefined" ? 720 : window.innerHeight));
  useEffect(() => {
    const t = window.setTimeout(() => setFlash(false), 80);
    const on = () => setVh(window.innerHeight);
    window.addEventListener("resize", on);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", on);
    };
  }, []);
  useEffect(() => {
    return watchImages(
      ["/art/ui/security/badge-lanyard.png", "/art/ui/portraits/portrait-player-smile.png", "/art/ui/portraits/portrait-player-smile-noglasses.png"],
      () => setTick((n) => n + 1),
    );
  }, []);
  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, 112, 160);
    paintLanyard(ctx, { look, role });
  }, [look, role, tick]);
  const zoom = Math.max(2, Math.min(4, Math.floor((vh * 0.56) / 160)));
  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-[#16110d]/90 px-4"
      data-testid="badge-issued"
      onClick={onClose}
      role="button"
      tabIndex={-1}
    >
      <p className="font-display text-xs uppercase tracking-[0.2em] text-[#e0a850]">Badge issued</p>
      <canvas ref={canvasRef} width={112} height={160} style={{ width: 112 * zoom, height: 160 * zoom, imageRendering: "pixelated" }} />
      <p className="font-mono text-[11px] text-[#a8937a]">That's you for the next few years. Lose it and you write a report. · Space</p>
      {flash ? <div className="pointer-events-none absolute inset-0 bg-white" data-testid="badge-flash" /> : null}
    </div>
  );
}
