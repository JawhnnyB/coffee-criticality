"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { integerScale } from "./artScale";
import { isMuted, setMuted, unlockAudio } from "./audio";

/** Native layout from tools/artkit/menu.py. Do not redraw it. */
const MW = 384;
const MH = 216;
const BTN_X = 150;
const BTN_W = 84;
const BTN_H = 14;
const BTN_Y = [84, 103, 122] as const;
const SPRITE_W = 100;
const SPRITE_H = 16;
const SOUND = { x: 332, y: 5, w: 46, h: 11 };

const ACTIONS = ["begin", "continue", "settings"] as const;

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

export function PixelMenu({
  saved,
  onBegin,
  onContinue,
  onHow,
  onCredits,
}: {
  saved: boolean;
  onBegin: () => void;
  onContinue: () => void;
  onHow: () => void;
  onCredits: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const box = useBox(host);
  const scale = integerScale(box.w, box.h, MW, MH);
  const [sel, setSel] = useState(0);
  const [mute, setMute] = useState(isMuted());
  const [sheet, setSheet] = useState(false);
  const sceneRef = useRef<HTMLImageElement | null>(null);
  const partsRef = useRef<HTMLImageElement | null>(null);
  const chipsRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const load = (src: string) => {
      const im = new Image();
      im.src = src;
      return im;
    };
    sceneRef.current = load("/art/ui/menu-scene.png");
    partsRef.current = load("/art/ui/menu-parts.png");
    chipsRef.current = load("/art/ui/menu-chips.png");
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    const scene = sceneRef.current;
    const parts = partsRef.current;
    const chips = chipsRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, MW, MH);
    const paint = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, MW, MH);
      if (sel !== 0 && scene && parts && scene.complete && parts.complete) {
        const x = BTN_X - 6;
        const y = BTN_Y[0];
        ctx.drawImage(scene, x, y, SPRITE_W, SPRITE_H, x, y, SPRITE_W, SPRITE_H);
        ctx.drawImage(parts, 0, SPRITE_H, SPRITE_W, SPRITE_H, x, y, SPRITE_W, SPRITE_H);
        const by = BTN_Y[sel];
        ctx.drawImage(parts, 0, sel * 32, SPRITE_W, SPRITE_H, BTN_X - 6, by, SPRITE_W, SPRITE_H);
      }
      if (mute && chips && chips.complete) {
        ctx.drawImage(chips, 0, 11, SOUND.w, SOUND.h, SOUND.x, SOUND.y, SOUND.w, SOUND.h);
      }
    };
    paint();
    const imgs = [scene, parts, chips];
    for (const im of imgs) im?.addEventListener("load", paint);
    return () => {
      for (const im of imgs) im?.removeEventListener("load", paint);
    };
  }, [sel, mute]);

  const activate = (i: number) => {
    unlockAudio();
    if (i === 0) onBegin();
    else if (i === 1) {
      if (saved) onContinue();
    } else setSheet(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (sheet) {
        if (e.code === "Escape") setSheet(false);
        return;
      }
      if (e.code === "ArrowDown") setSel((s) => Math.min(2, s + 1));
      else if (e.code === "ArrowUp") setSel((s) => Math.max(0, s - 1));
      else if (e.code === "Enter" || e.code === "Space") activate(sel);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const toggleMute = () => {
    unlockAudio();
    const next = !mute;
    setMuted(next);
    setMute(next);
  };

  return (
    <div ref={host} className="absolute inset-0 z-30 overflow-hidden" style={{ background: "#16110d" }} data-testid="pixel-menu">
      <img
        src="/art/ui/menu.png"
        alt=""
        width={MW}
        height={MH}
        draggable={false}
        style={{
          position: "absolute",
          left: scale.ox,
          top: scale.oy,
          width: scale.dw,
          height: scale.dh,
          imageRendering: "pixelated",
        }}
      />
      <canvas
        ref={canvasRef}
        width={MW}
        height={MH}
        aria-hidden
        style={{
          position: "absolute",
          left: scale.ox,
          top: scale.oy,
          width: scale.dw,
          height: scale.dh,
          imageRendering: "pixelated",
          pointerEvents: "none",
        }}
      />
      {ACTIONS.map((id, i) => (
        <button
          key={id}
          type="button"
          data-testid={id === "begin" ? "new-shift" : id === "continue" ? "continue-shift" : "menu-settings"}
          aria-label={id}
          className="cc-hit"
          style={{
            left: scale.ox + BTN_X * scale.zoom,
            top: scale.oy + BTN_Y[i] * scale.zoom,
            width: BTN_W * scale.zoom,
            height: BTN_H * scale.zoom,
          }}
          onMouseEnter={() => setSel(i)}
          onMouseLeave={() => setSel(0)}
          onClick={() => activate(i)}
        />
      ))}
      <button
        type="button"
        data-testid="mute"
        aria-label={mute ? "Sound off" : "Sound on"}
        className="cc-hit"
        style={{
          left: scale.ox + SOUND.x * scale.zoom,
          top: scale.oy + SOUND.y * scale.zoom,
          width: SOUND.w * scale.zoom,
          height: SOUND.h * scale.zoom,
        }}
        onClick={toggleMute}
      />
      {sheet ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: "rgba(22,17,13,0.72)" }}>
          <div className="cc-sheet">
            <h2 className="cc-title">SETTINGS</h2>
            <button type="button" className="cc-btn" onClick={onHow}>
              HOW TO PLAY
            </button>
            <button type="button" className="cc-btn" onClick={onCredits}>
              CREDITS
            </button>
            <button type="button" className="cc-btn" onClick={() => setSheet(false)}>
              BACK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PixelRead({ title, children, onBack }: { title: string; children: ReactNode; onBack: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const box = useBox(host);
  const scale = integerScale(box.w, box.h, MW, MH);
  return (
    <div ref={host} className="absolute inset-0 z-30 overflow-hidden" style={{ background: "#16110d" }}>
      <img
        src="/art/ui/menu-scene.png"
        alt=""
        width={MW}
        height={MH}
        draggable={false}
        style={{
          position: "absolute",
          left: scale.ox,
          top: scale.oy,
          width: scale.dw,
          height: scale.dh,
          imageRendering: "pixelated",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4" style={{ background: "rgba(22,17,13,0.55)" }}>
        <div className="cc-sheet max-h-full overflow-y-auto">
          <h2 className="cc-title">{title}</h2>
          <div className="cc-prose">{children}</div>
          <button type="button" className="cc-btn" onClick={onBack}>
            BACK
          </button>
        </div>
      </div>
    </div>
  );
}
