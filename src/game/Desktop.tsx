"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { PAL } from "./palette";
import { isMuted, setMuted } from "./audio";
import {
  APPS,
  CABINET_FOUND_FLAG,
  MINI_MODES,
  PARLOR_OS,
  PHONE_BREAKPOINT,
  SEASON_INFO,
  appForMode,
  clockText,
  pinnedVisible,
  themeSeason,
  visibleApps,
  type AppDef,
  type AppId,
  type Season,
} from "./parlorOS";
import {
  TASKBAR_H,
  MIN_W,
  MIN_H,
  cascadeAt,
  closeWin,
  dragWin,
  focusKindOf,
  focusWin,
  focusedWin,
  keyRoute,
  minimizeWin,
  openWin,
  type FocusKind,
  type WinState,
} from "./deskWindows";
import { particleCount, makePool, stepPool, type Particle } from "./particles";
import { AppBody, type AppCtx } from "./ParlorApps";
import { AppGlyph } from "./icons/glyphs";
import type { DesktopSave, GameState, Mode, ResultsSave } from "./sim";
import type { PlantDesign } from "./plant";

/** Titles for sim overlays that have no registry entry. */
const SIM_TITLE: Record<string, string> = { shuffle: "Fuel shuffle" };

const WIN_W = 470;
const WIN_H = 400;

/** Frame accent only. Wallpapers stay on SEASON_INFO. */
const SEASON_FRAME: Record<Season, string> = {
  spring: PAL.leaf,
  summer: PAL.copper,
  fall: PAL.gold,
  winter: PAL.steel,
};

export interface DesktopProps {
  /** True while the desktop is the screen: its own mode, or hosting an overlay. */
  shown: boolean;
  s: GameState;
  /** The sim mode that the desktop hosts right now, or null. */
  simMode: Mode | null;
  /** The sim overlay, rendered inside the window that hosts it. */
  simContent: ReactNode;
  onLaunchSim: (app: AppDef) => void;
  onAbortSim: () => void;
  onLeave: () => void;
  onMenu: () => void;
  onStartShift: () => void;
  onSaveShift: () => void;
  onPatch: (patch: Partial<DesktopSave>) => void;
  onDesign: (plant: PlantDesign) => void;
  onResults: (patch: Partial<ResultsSave>) => void;
  onAcademy: (index: number) => void;
}

function useSize(ref: RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

export function Desktop(props: DesktopProps) {
  const { shown, s, simMode, simContent, onLaunchSim, onAbortSim, onLeave, onMenu, onStartShift, onSaveShift, onPatch, onDesign, onResults, onAcademy } = props;
  const rootRef = useRef<HTMLDivElement>(null);
  const size = useSize(rootRef);
  const [wins, setWins] = useState<WinState[]>([]);
  const [startOpen, setStartOpen] = useState(false);
  const [phoneApp, setPhoneApp] = useState<AppId | null>(null);
  const [muteTick, setMuteTick] = useState(0);

  const d = s.desktop;
  const phone = size.w > 0 && size.w < PHONE_BREAKPOINT;
  const season: Season = themeSeason(d.followSeason, d.wallpaper, s.setup.season);
  const info = SEASON_INFO[season];
  const hasShift = s.role !== null;
  const input = { hasPlant: !!s.plant, foundCabinets: !!s.flags[CABINET_FOUND_FLAG], showAll: d.showAllApps && import.meta.env.DEV };
  const apps = visibleApps(input);
  const pinned = pinnedVisible(d.pinned, input);
  const screen = { w: size.w, h: size.h };
  // A game or bench needs room: sim windows open near full size, and clamp to the screen when it is smaller.
  const simW = Math.max(MIN_W, Math.min(960, size.w - 24));
  const simH = Math.max(MIN_H, Math.min(640, size.h - TASKBAR_H - 24));

  const ctx: AppCtx = { s, refresh: () => undefined, onPatch, visible: apps, onDesign, onResults, onAcademy };

  // Latest values for the window key listener, which is bound once.
  const live = useRef({
    wins,
    startOpen,
    phone,
    phoneApp,
    simMode,
    hasShift,
    shown,
    onLeave,
    onAbortSim,
    close: (_w: WinState) => {},
  });
  live.current = {
    wins,
    startOpen,
    phone,
    phoneApp,
    simMode,
    hasShift,
    shown,
    onLeave,
    onAbortSim,
    close: live.current.close,
  };

  // Leaving the desktop closes its own windows. A running sim overlay is handled by the game.
  useEffect(() => {
    if (!shown) {
      setWins([]);
      setStartOpen(false);
      setPhoneApp(null);
    }
  }, [shown]);

  // The overlay the desktop hosts gets a window of its own. Only one sim window at a time.
  useEffect(() => {
    if (phone) return;
    setWins((prev) => {
      let next = prev.filter((w) => !w.sim || w.simMode === simMode);
      if (simMode && !next.some((w) => w.sim && w.simMode === simMode)) {
        const app = appForMode(simMode);
        const title = app?.title ?? SIM_TITLE[simMode] ?? PARLOR_OS;
        const at = cascadeAt(next, screen, simW, simH);
        next = openWin(
          next,
          {
            id: `sim:${simMode}`,
            appId: app?.id ?? simMode,
            title,
            x: at.x,
            y: at.y,
            w: simW,
            h: simH,
            z: 0,
            minimized: false,
            sim: true,
            simMode,
            game: MINI_MODES.includes(simMode),
          },
          screen,
        );
      }
      return next;
    });
    // screen is read from the element; it changes with the size, which is in the deps below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simMode, phone, size.w, size.h]);

  // Keys. Capture phase, so a game listening on the window never hears a key the desktop has routed away.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const v = live.current;
      if (!v.shown) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const focus = currentFocus(v);
      const route = keyRoute(focus, e.code);
      if (route === "block") {
        e.stopImmediatePropagation();
        return;
      }
      if (route === "desktop" && e.code === "Escape") {
        e.stopImmediatePropagation();
        e.preventDefault();
        escape(v);
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, []);

  function escape(v: typeof live.current) {
    if (v.startOpen) {
      setStartOpen(false);
      return;
    }
    if (v.phone) {
      if (v.phoneApp) setPhoneApp(null);
      else if (!v.simMode && v.hasShift) v.onLeave();
      return;
    }
    const f = focusedWin(v.wins);
    if (f) {
      v.close(f);
      return;
    }
    // Nothing focused. A minimized game stays where it is. Leave only when a shift exists.
    if (!v.wins.some((w) => w.sim) && v.hasShift) v.onLeave();
  }

  function currentFocus(v: typeof live.current): FocusKind {
    if (v.phone) {
      if (v.simMode) return MINI_MODES.includes(v.simMode) ? "mini" : "sim-app";
      if (v.phoneApp) return "static";
      return "none";
    }
    return focusKindOf(focusedWin(v.wins));
  }

  const focusWindow = (id: string) => setWins((w) => focusWin(w, id));
  const drag = (id: string, dx: number, dy: number) => setWins((w) => w.map((x) => (x.id === id ? dragWin(x, dx, dy, screen) : x)));
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const held = timers.current;
    return () => {
      for (const t of held) window.clearTimeout(t);
    };
  }, []);
  const [closing, setClosing] = useState<ReadonlySet<string>>(new Set());

  const finishClose = (w: WinState) => {
    if (w.sim) live.current.onAbortSim();
    else setWins((list) => closeWin(list, w.id));
    setClosing((prev) => {
      if (!prev.has(w.id)) return prev;
      const next = new Set(prev);
      next.delete(w.id);
      return next;
    });
  };

  const close = (w: WinState) => {
    if (d.reducedMotion || closing.has(w.id)) {
      finishClose(w);
      return;
    }
    setClosing((prev) => {
      const next = new Set(prev);
      next.add(w.id);
      return next;
    });
    const t = window.setTimeout(() => finishClose(w), 140);
    timers.current.push(t);
  };
  live.current.close = close;
  const minimize = (id: string) => setWins((w) => minimizeWin(w, id));

  const openStatic = (app: AppDef) => {
    setStartOpen(false);
    if (phone) {
      setPhoneApp(app.id);
      return;
    }
    setWins((prev) => {
      const at = cascadeAt(prev, screen, WIN_W, WIN_H);
      return openWin(
        prev,
        {
          id: `app:${app.id}`,
          appId: app.id,
          title: app.title,
          x: at.x,
          y: at.y,
          w: WIN_W,
          h: WIN_H,
          z: 0,
          minimized: false,
          sim: false,
          game: false,
        },
        screen,
      );
    });
  };

  const openApp = (app: AppDef) => {
    setStartOpen(false);
    if (app.kind === "sim" || app.kind === "mini") {
      // One game runs at a time. A second launch brings the running window forward and changes nothing.
      if (simMode) {
        if (!phone) focusWindow(`sim:${simMode}`);
        return;
      }
      onLaunchSim(app);
      return;
    }
    openStatic(app);
  };

  const focused = focusedWin(wins);
  const simOpenOnPhone = phone && !!simMode;

  return (
    <div
      ref={rootRef}
      data-testid="desktop"
      data-season={season}
      aria-hidden={!shown}
      hidden={!shown}
      className="absolute inset-0 z-40 overflow-hidden"
      style={
        {
          background: info.wall,
          fontFamily: "CCPixel3x5, monospace",
          color: PAL.ink,
          ["--accent" as string]: d.accent,
          ["--ui-scale" as string]: String(d.textScale),
        } as CSSProperties
      }
    >
      <WallPaper season={season} />
      <ParticleLayer kind={info.particle} active={shown && !d.reducedMotion} />

      {phone ? (
        <PhoneHome
          apps={apps}
          accent={SEASON_FRAME[season]}
          phoneApp={phoneApp}
          simOpen={simOpenOnPhone}
          simContent={simContent}
          simMode={simMode}
          ctx={ctx}
          hasShift={hasShift}
          onOpen={openApp}
          onBackToGrid={() => setPhoneApp(null)}
          onLeave={onLeave}
          onMenu={onMenu}
          onStartShift={onStartShift}
          onAbortSim={onAbortSim}
        />
      ) : (
        <>
          <div className="absolute left-0 top-0 flex flex-col gap-3 p-3" style={{ bottom: TASKBAR_H }}>
            {pinned.map((app) => (
              <DeskIcon key={app.id} app={app} onOpen={() => openApp(app)} />
            ))}
          </div>

          {wins.map((w) => (
            <WindowFrame
              key={w.id}
              win={w}
              focused={focused?.id === w.id}
              onFocus={() => focusWindow(w.id)}
              onDrag={(dx, dy) => drag(w.id, dx, dy)}
              onClose={() => close(w)}
              onMinimize={() => minimize(w.id)}
              hidden={w.minimized}
              accent={SEASON_FRAME[season]}
              cabinet={w.game}
              popping={!d.reducedMotion && !closing.has(w.id) && !w.minimized}
              closing={closing.has(w.id)}
            >
              {w.sim ? (
                simContent
              ) : (
                <AppBody app={APPS[w.appId as AppId]} ctx={ctx} />
              )}
            </WindowFrame>
          ))}

          {startOpen ? (
            <StartMenu
              apps={apps}
              hasShift={hasShift}
              onOpen={openApp}
              onStartShift={() => {
                setStartOpen(false);
                onStartShift();
              }}
              onSave={() => {
                setStartOpen(false);
                onSaveShift();
              }}
              onLeave={() => {
                setStartOpen(false);
                onLeave();
              }}
              onMenu={() => {
                setStartOpen(false);
                onMenu();
              }}
            />
          ) : null}
        </>
      )}

      {!phone ? (
        <Taskbar
          season={info.label}
          taskbar={info.taskbar}
          clock={clockText(s.minutes, d.clock24)}
          wins={wins}
          apps={apps}
          onOpenApp={openApp}
          focusedId={focused?.id ?? null}
          startOpen={startOpen}
          onStart={() => setStartOpen((v) => !v)}
          onWin={(w) => {
            if (w.minimized) focusWindow(w.id);
            else if (focused?.id === w.id) minimize(w.id);
            else focusWindow(w.id);
          }}
          muted={isMuted()}
          onSound={() => {
            setMuted(!isMuted());
            setMuteTick((n) => n + 1);
          }}
          muteTick={muteTick}
        />
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- pieces */

function WallPaper({ season }: { season: Season }) {
  // Two palette tints in a pixel check, over the season colour. No image files.
  const tint = season === "winter" ? PAL.steel : season === "spring" ? PAL.leaf : PAL.ink;
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        opacity: 0.12,
        backgroundImage: `linear-gradient(45deg, ${tint} 25%, transparent 25%), linear-gradient(-45deg, ${tint} 25%, transparent 25%)`,
        backgroundSize: "16px 16px",
        imageRendering: "pixelated",
        pointerEvents: "none",
      }}
    />
  );
}

/** One canvas, one pool, pixel squares. Paused when not shown. Empty under reduced motion. */
function ParticleLayer({ kind, active }: { kind: "rain" | "heat" | "leaves" | "snow"; active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const size = useRef({ w: 0, h: 0 });
  useEffect(() => {
    const c = ref.current;
    if (!c || !active) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let pool: Particle[] = [];
    let raf = 0;
    let last = performance.now();
    const fit = () => {
      const r = c.getBoundingClientRect();
      const w = Math.max(1, Math.floor(r.width));
      const h = Math.max(1, Math.floor(r.height));
      if (w !== size.current.w || h !== size.current.h) {
        size.current = { w, h };
        c.width = w;
        c.height = h;
        pool = makePool(kind, w, h, false);
      }
    };
    fit();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      fit();
      stepPool(pool, kind, size.current.w, size.current.h, dt);
      ctx.clearRect(0, 0, size.current.w, size.current.h);
      for (const p of pool) {
        ctx.fillStyle = p.color;
        if (p.len > 1) ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.len);
        else ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [kind, active]);
  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ imageRendering: "pixelated", opacity: active ? 0.85 : 0 }}
      data-particles={active ? particleCount(size.current.w || 1, size.current.h || 1, false) : 0}
    />
  );
}

function AppIcon({ app }: { app: AppDef }) {
  return (
    <span
      className="flex items-center justify-center"
      aria-label={app.short}
      data-app-icon={app.id}
      style={{
        width: 44,
        height: 44,
        background: PAL.woodDark,
        border: `2px solid ${PAL.woodDark}`,
        boxShadow: `inset 0 0 0 2px ${PAL.creamD}`,
        color: PAL.cream,
      }}
    >
      <AppGlyph id={app.id} />
    </span>
  );
}

function DeskIcon({ app, onOpen }: { app: AppDef; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={app.title}
      data-testid={`icon-${app.id}`}
      className="flex w-28 flex-col items-center gap-1"
      style={{ color: PAL.cream, fontFamily: "CCPixel3x5, monospace", fontSize: 12, textShadow: `1px 1px 0 ${PAL.ink}`, background: "transparent" }}
    >
      <AppIcon app={app} />
      <span className="text-center leading-tight">{app.title}</span>
    </button>
  );
}

function WindowFrame({
  win,
  focused,
  onFocus,
  onDrag,
  onClose,
  onMinimize,
  hidden,
  accent,
  cabinet,
  popping,
  closing,
  children,
}: {
  win: WinState;
  focused: boolean;
  onFocus: () => void;
  onDrag: (dx: number, dy: number) => void;
  onClose: () => void;
  onMinimize: () => void;
  hidden: boolean;
  accent: string;
  cabinet: boolean;
  popping: boolean;
  closing: boolean;
  children: ReactNode;
}) {
  const drag = useRef<{ x: number; y: number } | null>(null);
  const motion = closing ? " desk-win-out" : popping ? " desk-win-in" : "";
  return (
    <section
      role="dialog"
      aria-label={win.title}
      data-testid={`window-${win.appId}`}
      data-focused={focused ? "true" : "false"}
      onPointerDown={onFocus}
      className={"desk-win absolute" + motion}
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: 10 + win.z,
        display: hidden ? "none" : "flex",
        flexDirection: "column",
        minWidth: MIN_W,
        minHeight: MIN_H,
      }}
    >
      <div className="desk-frame-edge" style={{ background: accent }} aria-hidden />
      <header
        onPointerDown={(e) => {
          onFocus();
          if ((e.target as HTMLElement).closest("button")) return;
          drag.current = { x: e.clientX, y: e.clientY };
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const dx = e.clientX - drag.current.x;
          const dy = e.clientY - drag.current.y;
          drag.current = { x: e.clientX, y: e.clientY };
          if (dx || dy) onDrag(dx, dy);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        className="desk-titlebar"
        style={{ fontFamily: "CCPixel3x5, monospace", touchAction: "none", cursor: "move" }}
      >
        <span className="desk-stamp" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span className={focused ? "desk-latch" : "desk-latch desk-latch-off"} aria-hidden />
        <span className="desk-title-text">{win.title}</span>
        <span className="flex gap-1" style={{ flexShrink: 0 }}>
          <button type="button" aria-label={`Minimize ${win.title}`} onClick={onMinimize} style={chromeBtn}>
            <PixelMin />
          </button>
          <button type="button" aria-label={`Close ${win.title}`} data-testid={`close-${win.appId}`} onClick={onClose} style={chromeBtn}>
            <PixelClose />
          </button>
        </span>
      </header>
      <div data-testid="window-body" className={"desk-well relative min-h-0 flex-1" + (cabinet ? " desk-cabinet" : "")}>
        <div className="desk-well-pad">
          <div className="desk-well-fit">{children}</div>
        </div>
      </div>
    </section>
  );
}

function PixelMin() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden shapeRendering="crispEdges">
      <rect x="3" y="12" width="10" height="2" fill="#16110d" />
    </svg>
  );
}

function PixelClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden shapeRendering="crispEdges">
      <rect x="3" y="3" width="2" height="2" fill="#16110d" />
      <rect x="5" y="5" width="2" height="2" fill="#16110d" />
      <rect x="7" y="7" width="2" height="2" fill="#16110d" />
      <rect x="9" y="9" width="2" height="2" fill="#16110d" />
      <rect x="11" y="11" width="2" height="2" fill="#16110d" />
      <rect x="11" y="3" width="2" height="2" fill="#16110d" />
      <rect x="9" y="5" width="2" height="2" fill="#16110d" />
      <rect x="5" y="9" width="2" height="2" fill="#16110d" />
      <rect x="3" y="11" width="2" height="2" fill="#16110d" />
    </svg>
  );
}

const chromeBtn: CSSProperties = {
  width: 22,
  height: 18,
  background: PAL.cream,
  color: PAL.ink,
  border: `2px solid ${PAL.woodDark}`,
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

function Taskbar({
  season,
  taskbar,
  clock,
  wins,
  apps,
  onOpenApp,
  focusedId,
  startOpen,
  onStart,
  onWin,
  muted,
  onSound,
  muteTick,
}: {
  season: string;
  taskbar: string;
  clock: string;
  wins: WinState[];
  apps: AppDef[];
  onOpenApp: (app: AppDef) => void;
  focusedId: string | null;
  startOpen: boolean;
  onStart: () => void;
  onWin: (w: WinState) => void;
  muted: boolean;
  onSound: () => void;
  muteTick: number;
}) {
  void muteTick;
  return (
    <nav
      aria-label="Taskbar"
      data-testid="taskbar"
      className="absolute inset-x-0 bottom-0 flex items-center gap-2 px-2"
      style={{ height: TASKBAR_H, background: taskbar, color: PAL.cream, borderTop: `2px solid ${PAL.woodDark}`, fontFamily: "CCPixel3x5, monospace", fontSize: 12, overflow: "hidden" }}
    >
      <button
        type="button"
        onClick={onStart}
        aria-expanded={startOpen}
        data-testid="start-button"
        style={{ height: 26, padding: "0 10px", background: PAL.copper, color: PAL.ink, border: `2px solid ${PAL.woodDark}`, fontFamily: "CCPixel3x5, monospace", fontSize: 12, cursor: "pointer", flexShrink: 0 }}
      >
        Start
      </button>
      <div className="flex shrink-0 items-center gap-1">
        {apps.map((app) => (
          <button
            key={app.id}
            type="button"
            data-app-icon={app.id}
            aria-label={app.short}
            onClick={() => onOpenApp(app)}
            style={{
              width: 28,
              height: 26,
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              color: PAL.cream,
              border: "1px solid transparent",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <AppGlyph id={app.id} />
          </button>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
        {wins.map((w) => (
          <button
            key={w.id}
            type="button"
            aria-pressed={focusedId === w.id && !w.minimized}
            onClick={() => onWin(w)}
            className="truncate"
            style={{
              maxWidth: 140,
              height: 26,
              padding: "0 8px",
              background: focusedId === w.id && !w.minimized ? PAL.surface : "transparent",
              color: PAL.cream,
              border: `1px solid ${w.minimized ? PAL.ash : PAL.cream}`,
              fontFamily: "CCPixel3x5, monospace",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {w.title}
          </button>
        ))}
      </div>
      <span style={{ color: PAL.creamD }}>{season}</span>
      <button
        type="button"
        onClick={onSound}
        data-testid="desk-sound"
        aria-label={muted ? "Sound off" : "Sound on"}
        style={{ height: 26, padding: "0 6px", background: "transparent", color: PAL.cream, border: `1px solid ${PAL.cream}`, fontFamily: "CCPixel3x5, monospace", fontSize: 12, cursor: "pointer" }}
      >
        {muted ? "SOUND OFF" : "SOUND ON"}
      </button>
      <span data-testid="desk-clock" style={{ minWidth: 66, textAlign: "right" }}>
        {clock}
      </span>
    </nav>
  );
}

function StartMenu({
  apps,
  hasShift,
  onOpen,
  onStartShift,
  onSave,
  onLeave,
  onMenu,
}: {
  apps: AppDef[];
  hasShift: boolean;
  onOpen: (app: AppDef) => void;
  onStartShift: () => void;
  onSave: () => void;
  onLeave: () => void;
  onMenu: () => void;
}) {
  return (
    <div
      role="menu"
      aria-label="Start menu"
      data-testid="start-menu"
      className="absolute left-2 flex flex-col gap-2 p-3"
      style={{ bottom: TASKBAR_H + 6, width: "min(360px, calc(100% - 16px))", background: PAL.cream, border: `2px solid ${PAL.outline}`, boxShadow: `4px 4px 0 ${PAL.ink}`, zIndex: 60 }}
    >
      <div className="grid grid-cols-4 gap-2">
        {apps.map((app) => (
          <button
            key={app.id}
            type="button"
            role="menuitem"
            aria-label={app.title}
            onClick={() => onOpen(app)}
            className="flex flex-col items-center gap-1"
            style={{ background: "transparent", color: PAL.ink, fontFamily: "CCPixel3x5, monospace", fontSize: 12, cursor: "pointer" }}
          >
            <AppIcon app={app} />
            <span className="text-center leading-tight">{app.title}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 border-t pt-2" style={{ borderColor: PAL.creamD }}>
        <button type="button" role="menuitem" data-testid="start-shift" onClick={onStartShift} className="btn-primary">
          Start shift
        </button>
        {hasShift ? (
          <>
            <button type="button" role="menuitem" onClick={onSave} className="btn-ghost">
              Save shift
            </button>
            <button type="button" role="menuitem" onClick={onLeave} className="btn-ghost">
              Back to shift
            </button>
          </>
        ) : (
          <button type="button" role="menuitem" onClick={onMenu} className="btn-ghost">
            Main menu
          </button>
        )}
      </div>
    </div>
  );
}

/** The phone layout: the home grid replaces the desktop. An app is full screen, with a back control. */
function PhoneHome({
  apps,
  accent,
  phoneApp,
  simOpen,
  simContent,
  simMode,
  ctx,
  hasShift,
  onOpen,
  onBackToGrid,
  onLeave,
  onMenu,
  onStartShift,
  onAbortSim,
}: {
  apps: AppDef[];
  accent: string;
  phoneApp: AppId | null;
  simOpen: boolean;
  simContent: ReactNode;
  simMode: Mode | null;
  ctx: AppCtx;
  hasShift: boolean;
  onOpen: (app: AppDef) => void;
  onBackToGrid: () => void;
  onLeave: () => void;
  onMenu: () => void;
  onStartShift: () => void;
  onAbortSim: () => void;
}) {
  if (simOpen) {
    const app = appForMode(simMode ?? "");
    return (
      <FullScreen title={app?.title ?? SIM_TITLE[simMode ?? ""] ?? PARLOR_OS} accent={accent} onBack={onAbortSim}>
        {simContent}
      </FullScreen>
    );
  }
  if (phoneApp) {
    const app = APPS[phoneApp];
    return (
      <FullScreen title={app.title} accent={accent} onBack={onBackToGrid}>
        <AppBody app={app} ctx={ctx} />
      </FullScreen>
    );
  }
  return (
    <div className="absolute inset-0 flex flex-col gap-3 overflow-x-hidden overflow-y-auto p-4" data-testid="phone-home">
      <p style={{ fontFamily: "CCPixel5x7, monospace", fontSize: 16, color: PAL.cream, margin: 0 }}>{PARLOR_OS}</p>
      <div className="grid grid-cols-4 gap-3">
        {apps.map((app) => (
          <button
            key={app.id}
            type="button"
            aria-label={app.title}
            onClick={() => onOpen(app)}
            data-testid={`home-${app.id}`}
            className="flex flex-col items-center gap-1"
            style={{ background: "transparent", color: PAL.cream, fontFamily: "CCPixel3x5, monospace", fontSize: 12, textShadow: `1px 1px 0 ${PAL.ink}` }}
          >
            <AppIcon app={app} />
            <span className="text-center leading-tight">{app.title}</span>
          </button>
        ))}
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        <button type="button" className="btn-primary" data-testid="start-shift" onClick={onStartShift}>
          Start shift
        </button>
        {hasShift ? (
          <button type="button" className="btn-ghost" onClick={onLeave}>
            Back to shift
          </button>
        ) : (
          <button type="button" className="btn-ghost" onClick={onMenu}>
            Main menu
          </button>
        )}
      </div>
    </div>
  );
}

function FullScreen({ title, accent, onBack, children }: { title: string; accent: string; onBack: () => void; children: ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: PAL.cream }} data-testid="fullscreen-app">
      <div className="desk-frame-edge" style={{ background: accent }} aria-hidden />
      <header className="desk-titlebar" style={{ height: 40, fontFamily: "CCPixel3x5, monospace" }}>
        <button type="button" onClick={onBack} aria-label="Back" data-testid="phone-back" style={{ ...chromeBtn, width: 56, height: 28, fontFamily: "CCPixel3x5, monospace", fontSize: 12 }}>
          Back
        </button>
        <span className="desk-title-text">{title}</span>
      </header>
      <div className="desk-well relative min-h-0 flex-1" data-testid="window-body">
        <div className="desk-well-pad">
          <div className="desk-well-fit">{children}</div>
        </div>
      </div>
    </div>
  );
}
