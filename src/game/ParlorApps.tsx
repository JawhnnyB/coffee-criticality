"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { PAL } from "./palette";
import { ReactorBuilder } from "./ReactorBuilder";
import { NuclearDesk } from "./NuclearDesk";
import { TrackPlayer, TRACKS } from "./parlorMusic";
import { setMuted, isMuted, unlockAudio } from "./audio";
import { CoreCamApp, CoreMapApp, ResultsApp } from "./ReactorApps";
import { NewsApp } from "./NewsApp";
import { ACADEMY } from "./content";
import { NRC_ROWS, filterNrc } from "./nrcIndex";
import type { DesktopSave, GameState, ResultsSave } from "./sim";
import type { PlantDesign } from "./plant";
import {
  ACCENTS,
  APPS,
  NOT_BUILT,
  REGION_PENDING,
  SEASONS,
  SEASON_INFO,
  STANCES,
  STANCE_INFO,
  TEXT_SCALES,
  clockText,
  seasonOrDefault,
  stanceOrDefault,
  type AppDef,
  type AppId,
  type Season,
  type Stance,
  DEFAULT_SEASON,
  DEFAULT_STANCE,
} from "./parlorOS";

/* ---------------------------------------------------------------- boot */

/** Authored boot lines. Original text, no real systems named. */
export const BOOT_LINES = [
  "PARLOR OS  ·  Unit 1 desk, Lake Master",
  "Checking the kettle. It is warm.",
  "Mounting the parlor. Mabel's counter is up.",
  "Reading the plant log. Two entries, both honest.",
  "Loading the Academy. Tier one. Read it anyway.",
  "Loading the reactor bench. Teaching model only.",
  "Starting the clock. The clock is the shift.",
  "Ready. Press any key or click to continue.",
];

const BOOT_STEP_MS = 300;
export const BOOT_MS = BOOT_LINES.length * BOOT_STEP_MS + 400;

/**
 * The start-up log. Skippable: any key or click finishes it. Reduced motion shows the last frame only.
 * No music here. The first click unlocks audio, and nothing plays until a player asks for it.
 */
export function BootLog({ reduced, onDone }: { reduced: boolean; onDone: () => void }) {
  const [shown, setShown] = useState(reduced ? BOOT_LINES.length : 0);
  const doneRef = useRef(false);
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => {
      setShown((n) => {
        if (n >= BOOT_LINES.length) {
          window.clearInterval(t);
          return n;
        }
        return n + 1;
      });
    }, BOOT_STEP_MS);
    const end = window.setTimeout(finish, BOOT_MS);
    return () => {
      window.clearInterval(t);
      window.clearTimeout(end);
    };
    // finish is stable for the life of this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  useEffect(() => {
    const key = () => {
      unlockAudio();
      finish();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="absolute inset-0 z-30 flex cursor-pointer flex-col justify-center bg-[#16110d] px-6 sm:px-12"
      onPointerDown={() => {
        unlockAudio();
        finish();
      }}
      data-testid="boot-log"
      role="presentation"
    >
      <div className="mx-auto w-full max-w-xl" style={{ fontFamily: "CCPixel3x5, monospace", fontSize: 14, lineHeight: 1.7 }}>
        {BOOT_LINES.slice(0, shown).map((line, i) => (
          <p key={i} style={{ color: i === 0 ? PAL.copperL : PAL.cream, margin: 0 }}>
            {line}
          </p>
        ))}
        {shown >= BOOT_LINES.length ? (
          <p style={{ color: PAL.ash, marginTop: 16, fontSize: 12 }}>Press any key or click to continue.</p>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- setup */

/** New shift only. Season and stance, one sentence each. Region is shown as pending, never chosen. */
export function SetupScreen({
  season: initialSeason,
  stance: initialStance,
  onBack,
  onDone,
}: {
  season: string | null;
  stance: string | null;
  onBack: () => void;
  onDone: (season: Season, stance: Stance) => void;
}) {
  const [season, setSeason] = useState<Season>(seasonOrDefault(initialSeason ?? DEFAULT_SEASON));
  const [stance, setStance] = useState<Stance>(stanceOrDefault(initialStance ?? DEFAULT_STANCE));
  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-[#16110d] px-4 pb-10 pt-16 sm:px-10" data-testid="setup-screen">
      <div className="mx-auto max-w-xl" style={{ fontFamily: "CCPixel3x5, monospace", color: PAL.cream }}>
        <p style={{ color: PAL.ash, fontSize: 12, letterSpacing: 2 }}>NEW SHIFT · SETUP</p>
        <h2 style={{ fontFamily: "CCPixel5x7, monospace", fontSize: 24, margin: "8px 0 16px" }}>Set the shift</h2>

        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontSize: 12, color: PAL.muted, marginBottom: 8 }}>Season</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SEASONS.map((id) => (
              <Pick key={id} selected={season === id} testId={`season-${id}`} onClick={() => setSeason(id)}>
                {SEASON_INFO[id].label}
              </Pick>
            ))}
          </div>
          <p data-testid="season-change" style={{ fontSize: 12, color: PAL.muted, margin: "8px 0 0", minHeight: 36 }}>
            {SEASON_INFO[season].change}
          </p>
        </fieldset>

        <fieldset style={{ border: 0, padding: 0, margin: "18px 0 0" }}>
          <legend style={{ fontSize: 12, color: PAL.muted, marginBottom: 8 }}>Starting stance</legend>
          <div className="grid grid-cols-3 gap-2">
            {STANCES.map((id) => (
              <Pick key={id} selected={stance === id} testId={`stance-${id}`} onClick={() => setStance(id)}>
                {STANCE_INFO[id].label}
              </Pick>
            ))}
          </div>
          <p data-testid="stance-change" style={{ fontSize: 12, color: PAL.muted, margin: "8px 0 0", minHeight: 36 }}>
            {STANCE_INFO[stance].change}
          </p>
        </fieldset>

        <div style={{ marginTop: 18, borderTop: `1px solid ${PAL.wood}`, paddingTop: 12 }}>
          <p style={{ fontSize: 12, margin: 0 }}>
            Region: <span data-testid="region-pending" style={{ color: PAL.gold }}>{REGION_PENDING}</span>
          </p>
          <p style={{ fontSize: 12, color: PAL.ash, margin: "4px 0 0" }}>
            No region is chosen in this build. Every region line says it is pending.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" data-testid="setup-continue" onClick={() => onDone(season, stance)}>
            Continue to the desktop
          </button>
          <button type="button" className="btn-ghost" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

function Pick({
  selected,
  onClick,
  children,
  testId,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={selected}
      onClick={onClick}
      style={{
        fontFamily: "CCPixel3x5, monospace",
        fontSize: 12,
        padding: "8px 6px",
        background: selected ? PAL.copper : PAL.surface,
        color: selected ? PAL.ink : PAL.cream,
        border: `2px solid ${selected ? PAL.copperL : PAL.wood}`,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------- apps */

const FIELD: CSSProperties = { fontFamily: "CCPixel3x5, monospace", fontSize: 12, color: PAL.ink };

function Row({ label, children, note }: { label: string; children: ReactNode; note?: string }) {
  return (
    <div style={{ padding: "8px 0", borderBottom: `1px solid ${PAL.creamD}` }}>
      <div style={{ ...FIELD, fontWeight: 700 }}>{label}</div>
      <div className="mt-1 flex flex-wrap gap-1">{children}</div>
      {note ? <div style={{ ...FIELD, color: PAL.ash, marginTop: 4 }}>{note}</div> : null}
    </div>
  );
}

function Chip({ on, onClick, children, testId }: { on: boolean; onClick: () => void; children: ReactNode; testId?: string }) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={on}
      onClick={onClick}
      style={{
        ...FIELD,
        padding: "4px 6px",
        background: on ? PAL.copper : PAL.cream,
        color: PAL.ink,
        border: `2px solid ${on ? PAL.copperD : PAL.wood}`,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export interface AppCtx {
  s: GameState;
  refresh: () => void;
  /** Patch the desktop settings. The caller writes the save when it can. */
  onPatch: (patch: Partial<DesktopSave>) => void;
  /** Apps the start menu shows right now. Settings uses it for the pin list. */
  visible: AppDef[];
  onDesign: (plant: PlantDesign) => void;
  onResults: (patch: Partial<ResultsSave>) => void;
  /** Open the Academy on one page, by index. Same route as the Academy icon. */
  onAcademy: (index: number) => void;
}

/** The body of a static or placeholder app. Sim and mini apps are mounted by the game, not here. */
export function AppBody({ app, ctx }: { app: AppDef; ctx: AppCtx }) {
  if (app.id === "settings") return <SettingsApp ctx={ctx} />;
  if (app.id === "music") return <MusicApp ctx={ctx} />;
  if (app.id === "design") return <DesignApp ctx={ctx} />;
  if (app.id === "cam") return <CoreCamApp s={ctx.s} />;
  if (app.id === "results") return <ResultsApp s={ctx.s} />;
  if (app.id === "coremap") return <CoreMapApp s={ctx.s} onResults={ctx.onResults} />;
  if (app.id === "news") return <NewsApp s={ctx.s} />;
  if (app.id === "radiation") return <RadiationApp ctx={ctx} />;
  if (app.id === "nrc") return <NrcApp />;
  if (app.kind === "placeholder") return <PlaceholderApp app={app} />;
  return null;
}

export function PlaceholderApp({ app }: { app: AppDef }) {
  return (
    <div className="p-4" style={{ ...FIELD, color: PAL.ink }} data-testid={`placeholder-${app.id}`}>
      <p style={{ fontFamily: "CCPixel5x7, monospace", fontSize: 16, margin: 0 }}>{app.title}</p>
      <p style={{ marginTop: 10, fontSize: 14 }}>{app.note ?? NOT_BUILT}</p>
    </div>
  );
}

/** Labels only (spec 8.2). Every value is pending verification. No unit numbers, no half-life, no essay. */
const RAD_ROWS: { label: string }[] = [
  { label: "Units: becquerel (Bq), gray (Gy), sievert (Sv)" },
  { label: "Half-life" },
  { label: "Shielding, by material and thickness" },
  { label: "Time, distance, shielding" },
  { label: "Dose" },
  { label: "Contamination" },
];

/** Region slots (spec 12). None is selectable, and none has a value. Data: public/data/background.json. */
const REGION_SLOTS = Array.from({ length: 9 }, (_, i) => `Region slot ${i + 1}`);

export function RadiationApp({ ctx }: { ctx: AppCtx }) {
  const alara = ACADEMY.findIndex((p) => p.title === "ALARA with eyes open");
  return (
    <div className="p-3" style={{ ...FIELD, color: PAL.ink }} data-testid="app-radiation">
      <p style={{ fontFamily: "CCPixel5x7, monospace", fontSize: 16, margin: 0 }}>Radiation</p>
      <table style={{ fontSize: 12, marginTop: 10, borderCollapse: "collapse" }}>
        <tbody>
          {RAD_ROWS.map((r) => (
            <tr key={r.label}>
              <td style={{ paddingRight: 12, paddingBottom: 6 }}>{r.label}</td>
              <td style={{ paddingBottom: 6 }}>Pending verification</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 14, marginTop: 10, margin: "10px 0 0" }}>Your region</p>
      <p style={{ fontSize: 12, margin: "2px 0 6px" }} data-testid="radiation-region">
        {REGION_PENDING}
      </p>
      <ul style={{ fontSize: 12, margin: 0, paddingLeft: 0, listStyle: "none" }} data-testid="region-slots">
        {REGION_SLOTS.map((name) => (
          <li key={name} style={{ paddingBottom: 2 }}>
            {name}: Pending verification
          </li>
        ))}
      </ul>
      <button
        type="button"
        data-testid="radiation-alara"
        onClick={() => ctx.onAcademy(alara)}
        style={{ fontFamily: "inherit", fontSize: 12, marginTop: 10, textDecoration: "underline", background: "transparent", border: 0, color: PAL.copper, padding: 0 }}
      >
        ALARA with eyes open
      </button>
    </div>
  );
}

export function NrcApp() {
  const [q, setQ] = useState("");
  const rows = filterNrc(NRC_ROWS, q);
  const needle = q.trim();
  return (
    <div className="p-3" style={{ ...FIELD, color: PAL.ink }} data-testid="app-nrc">
      <p style={{ fontFamily: "CCPixel5x7, monospace", fontSize: 16, margin: 0 }}>NRC Regulations</p>
      <p style={{ fontSize: 12, marginTop: 10 }}>
        <a href="https://www.ecfr.gov/current/title-10" target="_blank" rel="noopener noreferrer" style={{ color: PAL.copper, textDecoration: "underline" }}>
          Title 10 (Energy), eCFR
        </a>{" "}
        · official text, opens in a new tab
      </p>
      <label style={{ display: "block", fontSize: 12, marginTop: 10 }}>
        Search
        <input
          type="search"
          data-testid="nrc-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ display: "block", marginTop: 4, fontFamily: "inherit", fontSize: 12, color: PAL.ink, background: PAL.cream, border: `1px solid ${PAL.ink}`, padding: "2px 4px", width: "100%", maxWidth: 260 }}
        />
      </label>
      <table style={{ fontSize: 12, marginTop: 10, borderCollapse: "collapse" }}>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td style={{ paddingRight: 12, paddingBottom: 6 }}>{r.label}</td>
              <td style={{ paddingBottom: 6 }}>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {needle !== "" && rows.length === 0 ? (
        <p style={{ fontSize: 12, marginTop: 8 }} data-testid="nrc-no-match">
          No match. Titles are not in this build.
        </p>
      ) : null}
    </div>
  );
}

function SettingsApp({ ctx }: { ctx: AppCtx }) {
  const d = ctx.s.desktop;
  const setup = ctx.s.setup;
  const pinned = d.pinned;
  const pinnedIds = pinned as string[];
  const movable = (id: string, dir: -1 | 1) => {
    const i = pinnedIds.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= pinnedIds.length) return;
    const next = [...pinnedIds];
    [next[i], next[j]] = [next[j], next[i]];
    ctx.onPatch({ pinned: next });
  };
  const togglePin = (id: string) => {
    ctx.onPatch({ pinned: pinnedIds.includes(id) ? pinnedIds.filter((x) => x !== id) : [...pinnedIds, id] });
  };
  return (
    <div className="p-3" style={{ ...FIELD }} data-testid="settings-app">
      <Row label="Wallpaper" note="The season's set by default. Or any season's set.">
        <Chip on={d.wallpaper === "season"} onClick={() => ctx.onPatch({ wallpaper: "season" })} testId="wall-season">
          Season
        </Chip>
        {SEASONS.map((id) => (
          <Chip key={id} on={d.wallpaper === id} onClick={() => ctx.onPatch({ wallpaper: id })} testId={`wall-${id}`}>
            {SEASON_INFO[id].label}
          </Chip>
        ))}
      </Row>
      <Row label="Theme" note="Follow the season, or pick one.">
        <Chip on={d.followSeason} onClick={() => ctx.onPatch({ followSeason: true, wallpaper: "season" })} testId="theme-follow">
          Follow season
        </Chip>
        {SEASONS.map((id) => (
          <Chip
            key={id}
            on={!d.followSeason && d.wallpaper === id}
            onClick={() => ctx.onPatch({ followSeason: false, wallpaper: id })}
            testId={`theme-${id}`}
          >
            {SEASON_INFO[id].label}
          </Chip>
        ))}
      </Row>
      <Row label="Accent" note="Copper, leaf, or gold only.">
        {ACCENTS.map((a) => (
          <Chip key={a.id} on={d.accent === a.hex} onClick={() => ctx.onPatch({ accent: a.hex })} testId={`accent-${a.id}`}>
            {a.label}
          </Chip>
        ))}
      </Row>
      <Row label="Pinned apps" note="Pinned icons sit on the desktop. Move them with the arrows.">
        {ctx.visible.map((app) => {
          const i = pinnedIds.indexOf(app.id);
          return (
            <span key={app.id} className="flex items-center gap-1">
              <Chip on={i >= 0} onClick={() => togglePin(app.id)} testId={`pin-${app.id}`}>
                {i >= 0 ? "Pinned" : "Pin"} {app.title}
              </Chip>
              {i >= 0 ? (
                <>
                  <Chip on={false} onClick={() => movable(app.id, -1)} testId={`up-${app.id}`}>
                    ↑
                  </Chip>
                  <Chip on={false} onClick={() => movable(app.id, 1)} testId={`down-${app.id}`}>
                    ↓
                  </Chip>
                </>
              ) : null}
            </span>
          );
        })}
      </Row>
      <Row label="Text size">
        {TEXT_SCALES.map((t) => (
          <Chip key={t.id} on={d.textScale === t.value} onClick={() => ctx.onPatch({ textScale: t.value })} testId={`text-${t.id}`}>
            {t.label}
          </Chip>
        ))}
      </Row>
      <Row label="Motion">
        <Chip on={d.reducedMotion} onClick={() => ctx.onPatch({ reducedMotion: !d.reducedMotion })} testId="reduced-motion">
          Reduced motion {d.reducedMotion ? "on" : "off"}
        </Chip>
      </Row>
      <Row label="Reactor colours" note="Lightness and symbols, not hue alone.">
        <Chip on={d.colorSafe} onClick={() => ctx.onPatch({ colorSafe: !d.colorSafe })} testId="color-safe">
          Colour-safe bands {d.colorSafe ? "on" : "off"}
        </Chip>
      </Row>
      <Row label="Sound">
        <label style={FIELD}>
          Music volume{" "}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={d.music}
            onChange={(e) => ctx.onPatch({ music: Number(e.target.value) })}
            data-testid="music-volume"
          />
        </label>
        <label style={FIELD}>
          Effects volume{" "}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={d.sfx}
            onChange={(e) => ctx.onPatch({ sfx: Number(e.target.value) })}
            data-testid="sfx-volume"
          />
        </label>
        <Chip on={d.musicOn} onClick={() => ctx.onPatch({ musicOn: !d.musicOn })} testId="music-on">
          Music {d.musicOn ? "on" : "off"}
        </Chip>
      </Row>
      <Row label="Clock">
        <Chip on={!d.clock24} onClick={() => ctx.onPatch({ clock24: false })} testId="clock-12">
          12 hour
        </Chip>
        <Chip on={d.clock24} onClick={() => ctx.onPatch({ clock24: true })} testId="clock-24">
          24 hour
        </Chip>
        <span style={FIELD}>Now {clockText(ctx.s.minutes, d.clock24)}</span>
      </Row>
      <Row label="Season" note={`Set at setup: ${SEASON_INFO[seasonOrDefault(setup.season)].label}. Region: ${REGION_PENDING}.`}>
        <span />
      </Row>
      {import.meta.env.DEV ? (
        <Row label="Show all apps" note="Dev build only. Off by default.">
          <Chip on={d.showAllApps} onClick={() => ctx.onPatch({ showAllApps: !d.showAllApps })} testId="show-all">
            Show all apps {d.showAllApps ? "on" : "off"}
          </Chip>
        </Row>
      ) : null}
      <p style={{ ...FIELD, color: PAL.ash, marginTop: 10 }}>
        Settings are saved with the shift. A new shift keeps them.
      </p>
    </div>
  );
}

function MusicApp({ ctx }: { ctx: AppCtx }) {
  const playerRef = useRef<TrackPlayer | null>(null);
  if (!playerRef.current) playerRef.current = new TrackPlayer();
  const player = playerRef.current;
  const [now, setNow] = useState<Season | null>(null);
  const [playing, setPlaying] = useState(false);
  const [vol, setVol] = useState(ctx.s.desktop.music);
  const setup = seasonOrDefault(ctx.s.setup.season);
  const shown = now ?? setup;

  useEffect(() => {
    return () => player.stop();
  }, [player]);

  useEffect(() => {
    player.setVolume(vol);
  }, [vol, player]);

  const play = () => {
    unlockAudio();
    if (!player.playing) player.start(now ?? setup);
    setNow(player.current);
    setPlaying(true);
  };
  const pause = () => {
    player.stop();
    setPlaying(false);
  };
  const skip = () => {
    if (!player.playing) player.start(now ?? setup);
    player.skip();
    setNow(player.current);
    setPlaying(true);
  };

  return (
    <div className="p-3" style={FIELD} data-testid="music-app">
      <p style={{ fontFamily: "CCPixel5x7, monospace", fontSize: 16, margin: 0 }}>Music</p>
      <p data-testid="now-playing" style={{ margin: "8px 0", color: PAL.ink }}>
        {playing && now ? `Now playing: ${TRACKS[now].title}` : "Stopped. Pick a play button to start."}
      </p>
      <div className="flex flex-wrap gap-1">
        {!playing ? (
          <Chip on={false} onClick={play} testId="music-play">
            Play
          </Chip>
        ) : (
          <Chip on={false} onClick={pause} testId="music-pause">
            Pause
          </Chip>
        )}
        <Chip on={false} onClick={skip} testId="music-skip">
          Skip
        </Chip>
      </div>
      <label style={{ ...FIELD, display: "block", marginTop: 10 }}>
        Volume{" "}
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={vol}
          onChange={(e) => setVol(Number(e.target.value))}
          data-testid="music-app-volume"
        />
      </label>
      <p style={{ ...FIELD, color: PAL.ash, margin: "10px 0 4px" }}>Season playlist</p>
      <ol style={{ margin: 0, paddingLeft: 16 }}>
        {SEASONS.map((id) => (
          <li key={id} style={{ ...FIELD, color: id === shown ? PAL.copper : PAL.ink, fontWeight: id === shown ? 700 : 400 }}>
            {SEASON_INFO[id].label} · {TRACKS[id].title}
          </li>
        ))}
      </ol>
      <p style={{ ...FIELD, color: PAL.ash, marginTop: 10 }}>
        Procedural, written in code. The existing bed ducks while a track plays.
      </p>
    </div>
  );
}

function DesignApp({ ctx }: { ctx: AppCtx }) {
  const [rebuild, setRebuild] = useState(false);
  const plant = ctx.s.plant;
  if (!plant || rebuild) {
    return (
      <div data-testid="design-builder" className="relative h-full w-full overflow-hidden">
        <ReactorBuilder
          onDone={(p) => {
            ctx.onDesign(p);
            setRebuild(false);
          }}
        />
        {plant ? (
          <button type="button" className="btn-ghost" style={{ position: "absolute", right: 8, top: 8 }} onClick={() => setRebuild(false)}>
            Keep the design
          </button>
        ) : null}
      </div>
    );
  }
  return (
    <div className="relative h-full w-full overflow-auto p-2" data-testid="design-edit">
      <div className="mb-2 flex flex-wrap gap-2">
        <button type="button" className="btn-ghost" onClick={() => setRebuild(true)} data-testid="design-rebuild">
          Rebuild with the builder
        </button>
      </div>
      <NuclearDesk
        plant={plant}
        onChange={(p) => {
          ctx.onDesign(p);
        }}
      />
    </div>
  );
}

/** Used by the desktop for the mini-game icon color and the placeholders. Keeps the palette in one place. */
export const APP_ICON_TONE: Record<AppId, string> = {
  settings: PAL.steel,
  music: PAL.leaf,
  design: PAL.copper,
  control: PAL.copperD,
  academy: PAL.goldD,
  news: PAL.wood,
  radiation: PAL.wood,
  nrc: PAL.wood,
  results: PAL.steelD,
  coremap: PAL.steelD,
  cam: PAL.steelD,
  catch: PAL.leafD,
  fish: PAL.leafD,
  plot: PAL.leafD,
  horde: PAL.leafD,
  delay: PAL.leafD,
  golf: PAL.leafD,
  rods: PAL.leafD,
  pebble: PAL.leafD,
  bowl: PAL.leafD,
  phys: PAL.leafD,
  load: PAL.leafD,
  lototo: PAL.leafD,
};

export { APPS };
