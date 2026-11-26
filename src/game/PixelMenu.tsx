"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { integerCover, integerScale } from "./artScale";
import { isMuted, setMuted, unlockAudio } from "./audio";
import { frameChoice, setFrameChoice, bootSettings, type FrameChoice } from "./frameRate";
import { SettingsFields } from "./SettingsFields";
import { UI } from "./uiStrings";
import { GAME_VERSION } from "./version";
import { KnownIssues } from "./KnownIssues";
import { hostOwnsKey } from "./keyGate";

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
  saveNote,
  onBegin,
  onContinue,
  onHow,
  onCredits,
  plantPick,
}: {
  saved: boolean;
  saveNote: string;
  onBegin: () => void;
  onContinue: () => void;
  onHow: () => void;
  onCredits: () => void;
  /** Holt's plant or Colt's (campaign.ts), above New shift. */
  plantPick?: ReactNode;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const box = useBox(host);
  const phone = box.w > 0 && box.w < 720;
  const scale = phone ? integerCover(box.w, box.h, MW, MH) : integerScale(box.w, box.h, MW, MH);
  const [sel, setSel] = useState(0);
  const [mute, setMute] = useState(isMuted());
  const [sheet, setSheet] = useState(false);
  const [issues, setIssues] = useState(false);
  const [fps, setFps] = useState<FrameChoice>("auto");
  const sceneRef = useRef<HTMLImageElement | null>(null);
  const partsRef = useRef<HTMLImageElement | null>(null);
  const chipsRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    bootSettings();
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
    } else {
      setFps(frameChoice());
      setSheet(true);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (!hostOwnsKey("menu", e.code)) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (issues) {
        if (e.code === "Escape") setIssues(false);
        return;
      }
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
    <div ref={host} className="absolute inset-0 z-30" style={{ background: "#16110d", overflow: "clip" }} data-testid="pixel-menu" role="menu" aria-label="Main menu">
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
          maxWidth: "none",
          maxHeight: "none",
          imageRendering: "pixelated",
        }}
      />
      <div
        className="absolute z-10 flex flex-col gap-2 p-2"
        style={
          phone
            ? { left: 12, right: 12, bottom: 16, background: "#16110d" }
            : {
                left: scale.ox + Math.max(0, Math.round((scale.dw - 280) / 2)),
                width: 280,
                bottom: Math.max(12, box.h - (scale.oy + scale.dh) + 16),
                background: "#16110d",
              }
        }
      >
        {plantPick}
        <button type="button" data-testid="new-shift" className="btn-primary" onClick={() => activate(0)}>
          {UI.menuBegin}
        </button>
        <button type="button" data-testid="continue-shift" className="btn-ghost" disabled={!saved} onClick={() => activate(1)}>
          {UI.menuContinue}
        </button>
        {saveNote ? (
          <p data-testid="save-note" style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-small)", color: "#f3e6d0", margin: 0 }}>
            {saveNote}
          </p>
        ) : null}
        <button type="button" data-testid="menu-settings" className="btn-ghost" onClick={() => activate(2)}>
          {UI.menuSettings}
        </button>
        <button type="button" data-testid="mute" className="btn-ghost" onClick={toggleMute}>
          {mute ? UI.soundOff : UI.soundOn}
        </button>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-small)", color: "#f3e6d0", margin: 0 }}>
          {UI.teaching}
        </p>
        <p data-testid="game-version" style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-small)", color: "#f3e6d0", margin: 0 }}>
          {GAME_VERSION}
        </p>
      </div>
      {sheet ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: "rgba(22,17,13,0.72)" }}>
          <div className="cc-sheet" style={{ maxHeight: "92vh", overflowY: "auto" }}>
            <h2 className="cc-title">SETTINGS</h2>
            <p style={{ fontFamily: "\"CCPixel3x5\", monospace", fontSize: 16, margin: "10px 0 0", color: "#f3e6d0" }}>{UI.frameRate}</p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["auto", "Auto"],
                  ["60", "60"],
                  ["30", "30"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={fps === id ? "btn-primary" : "btn-ghost"}
                  data-testid={`fps-${id}`}
                  aria-pressed={fps === id}
                  onClick={() => {
                    setFrameChoice(id);
                    setFps(id);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <SettingsFields />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="cc-btn" style={{ flex: 1, width: "auto" }} onClick={onHow}>
                HOW TO PLAY
              </button>
              <button type="button" className="cc-btn" style={{ flex: 1, width: "auto" }} data-testid="known-issues" onClick={() => setIssues(true)}>
                {UI.knownIssues}
              </button>
            </div>
            <button type="button" className="cc-btn" onClick={onCredits}>
              CREDITS
            </button>
            <button type="button" className="cc-btn" onClick={() => setSheet(false)}>
              BACK
            </button>
          </div>
        </div>
      ) : null}
      {issues ? <KnownIssues onClose={() => setIssues(false)} /> : null}
    </div>
  );
}

export function PixelRead({ title, children, onBack }: { title: string; children: ReactNode; onBack: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const box = useBox(host);
  const scale = integerScale(box.w, box.h, MW, MH);
  return (
    <div ref={host} className="absolute inset-0 z-30" style={{ background: "#16110d", overflow: "clip" }}>
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
          maxWidth: "none",
          maxHeight: "none",
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
