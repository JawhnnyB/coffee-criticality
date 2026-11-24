"use client";

/**
 * The taskbar under the plant. The shift is one task on Parlor OS; the cameras, the plant data, the Academy
 * and the music sit beside it. Rules: shiftBar.ts. Looks: the desktop's own taskbar, in the season's colours.
 */
import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import { PAL } from "./palette";
import { TASKBAR_H } from "./deskWindows";
import { SEASON_INFO, clockText, themeSeason, seasonOrDefault, CABINET_FOUND_FLAG, type AppId } from "./parlorOS";
import { monitorState } from "./nightwatch/monitor";
import { siteKind } from "./plantLoops";
import { TRACKS, musicPlayer, onMusic } from "./parlorMusic";
import { unlockAudio } from "./audio";
import { dayDef } from "./week";
import { barTasks, canLaunch, dataChip, realClock, shiftTaskLabel } from "./barRules";
import type { GameState } from "./sim";

export interface ShiftBarProps {
  s: GameState;
  mode: string;
  /** Start: the desktop, with the start menu open. */
  onStart: () => void;
  /** The plant's own tab. Clicking the task in front minimizes it, as on any desktop: the desktop shows. */
  onMinimize: () => void;
  onOpen: (app: AppId) => void;
}

/** Clicking the bar must not take the keyboard away from the plant. */
const keepFocus = (e: MouseEvent) => e.preventDefault();

function useMusic() {
  const player = musicPlayer();
  const [, setTick] = useState(0);
  useEffect(() => onMusic(() => setTick((n) => n + 1)), []);
  return player;
}

/** Below 980 px the tabs use short names and the track title goes; below 560 px your own clock goes too. */
function useWidth() {
  const [w, setW] = useState(() => (typeof window === "undefined" ? 1280 : window.innerWidth));
  useEffect(() => {
    const read = () => setW(window.innerWidth);
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);
  return w;
}

function useRealClock(clock24: boolean) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return realClock(now, clock24);
}

export function ShiftBar({ s, mode, onStart, onMinimize, onOpen }: ShiftBarProps) {
  const width = useWidth();
  const phone = width < 980;
  const tiny = width < 560;
  const d = s.desktop;
  const season = themeSeason(d.followSeason, d.wallpaper, s.setup.season);
  const info = SEASON_INFO[season];
  const tasks = barTasks({
    hasPlant: !!s.plant,
    foundCabinets: !!s.flags[CABINET_FOUND_FLAG],
    showAll: false,
    outageOpen: !!s.flags.outageOpen || s.day >= 4,
  });
  const live = canLaunch(mode);
  const wait = live ? undefined : "Finish the conversation first";
  const st = s.plant ? monitorState(siteKind(s.plant), s.run, s.minutes) : null;
  const chip = st ? dataChip(st) : null;
  const player = useMusic();
  const you = useRealClock(d.clock24);

  const tab = (on: boolean, alarm = false): CSSProperties => ({
    animation: alarm ? "shiftalarm 0.8s infinite" : undefined,
    height: 26,
    padding: tiny ? "0 5px" : phone ? "0 6px" : "0 8px",
    background: on ? PAL.surface : "transparent",
    color: PAL.cream,
    border: `1px solid ${PAL.cream}`,
    opacity: !on && !live ? 0.55 : 1,
    fontFamily: "var(--font-body)",
    fontSize: "var(--text-small)",
    lineHeight: "1.2",
    whiteSpace: "nowrap",
    cursor: live || on ? "pointer" : "not-allowed",
    flexShrink: 0,
  });

  const toggleMusic = () => {
    unlockAudio();
    if (player.playing) {
      player.stop();
      return;
    }
    player.setVolume(d.music);
    player.start(player.current ?? seasonOrDefault(s.setup.season));
  };

  return (
    <nav
      aria-label="Taskbar"
      data-testid="shift-bar"
      className="relative z-40 flex shrink-0 items-center gap-1 px-1 sm:gap-2 sm:px-2"
      style={{ height: TASKBAR_H, background: info.taskbar, color: PAL.cream, borderTop: `2px solid ${PAL.outline}`, fontFamily: "var(--font-body)", fontSize: "var(--text-small)", lineHeight: "1.4" }}
    >
      <style>{`@keyframes shiftalarm { 0%,49% { background: ${PAL.bad}; } 50%,100% { background: transparent; } }`}</style>
      <button
        type="button"
        onMouseDown={keepFocus}
        onClick={onStart}
        disabled={!live}
        title={wait ?? "Start: Parlor OS"}
        data-testid="shift-start"
        data-alarm={chip?.alarm ? "1" : "0"}
        style={{ ...tab(false, chip?.alarm), background: chip?.alarm ? undefined : PAL.copper, color: PAL.ink, border: `2px solid ${PAL.outline}`, opacity: live ? 1 : 0.55 }}
      >
        {chip?.alarm ? "▲ " : ""}Start
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <button
          type="button"
          onMouseDown={keepFocus}
          onClick={live ? onMinimize : undefined}
          aria-pressed
          aria-disabled={!live}
          title={wait ?? "The plant. Click to minimize it to the desktop."}
          data-testid="shift-task-plant"
          style={{ ...tab(true), maxWidth: phone ? 96 : 220, overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {shiftTaskLabel(s.day, dayDef(s.day).name, phone, tiny)}
        </button>
        {tasks.map((t) => {
          const data = t.id === "monitor" && chip;
          return (
            <button
              key={t.id}
              type="button"
              onMouseDown={keepFocus}
              onClick={() => onOpen(t.id)}
              disabled={!live}
              title={wait ?? (data ? `${t.tip}: reactor power ${chip.text}${chip.alarm ? ", alarm" : ""}` : t.tip)}
              aria-label={data ? `${t.label}, ${chip.text}${chip.alarm ? ", alarm" : ""}` : t.label}
              data-testid={`shift-task-${t.id}`}
              data-alarm={data && chip.alarm ? "1" : "0"}
              style={tab(false, !!(data && chip.alarm))}
            >
              {/* On a phone the data tab is its live reading alone. */}
              {data && tiny ? null : phone ? t.short : t.label}
              {data ? <span style={{ marginLeft: tiny ? 0 : 6, color: chip.alarm ? PAL.cream : PAL.goldL }}>{chip.text}</span> : null}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onMouseDown={keepFocus}
        onClick={toggleMusic}
        aria-label={player.playing ? "Pause music" : "Play music"}
        title={player.playing && player.current ? `Now playing: ${TRACKS[player.current].title}. Click to pause.` : "Play the season's track"}
        data-testid="shift-music"
        style={{ ...tab(player.playing), opacity: 1, cursor: "pointer", maxWidth: phone ? 40 : 230, overflow: "hidden", textOverflow: "ellipsis", ...(tiny ? { padding: "0 5px" } : {}) }}
      >
        {player.playing ? "II" : "▶"}
        {!phone ? <span style={{ marginLeft: 6 }}>{player.playing && player.current ? `♪ ${TRACKS[player.current].title}` : "Music off"}</span> : null}
      </button>
      <span
        data-testid="shift-clock"
        title="The plant's clock. It stops while the desktop is open."
        style={{ flexShrink: 0, textAlign: "right", color: PAL.goldL, fontFamily: "var(--font-body)", fontSize: "var(--text-small)", lineHeight: "1.2" }}
      >
        {tiny ? clockText(s.minutes, d.clock24) : `Plant ${clockText(s.minutes, d.clock24)}`}
      </span>
      {!tiny ? (
        <span
          data-testid="shift-you"
          title="Your clock, outside the game."
          style={{ flexShrink: 0, paddingLeft: 8, borderLeft: `1px solid ${PAL.ash}`, color: PAL.cream, fontFamily: "var(--font-body)", fontSize: "var(--text-small)", lineHeight: "1.2" }}
        >
          You {you}
        </span>
      ) : null}
    </nav>
  );
}
