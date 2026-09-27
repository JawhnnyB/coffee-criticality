"use client";

import { useEffect, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  ACADEMY,
  CAFE_SPAWN,
  INTRO,
  NPCS,
  ROLES,
  ROOMS,
  SITE,
  STILLS,
  TAGLINE,
  THESIS,
  TITLE,
  NPC_INTRO,
  cultureStage,
  periodLabel,
  relationLine,
  trustState,
  type Period,
  type RoomId,
} from "./content";
import { Arcade, ArcadeHall } from "./Arcade";
import { FishGame, PlotGame } from "./Leisure";
import { HordeGame } from "./Horde";
import { DelayGame } from "./DelayGame";
import { PhysicsGame } from "./PhysicsGame";
import { BowlGame, GolfGame, PebbleGame, RodsGame } from "./MoreGames";
import { LoadGame } from "./LoadGame";
import { ReactorTrainer } from "./ReactorTrainer";
import { ReactorBuilder } from "./ReactorBuilder";
import { FuelShuffle } from "./FuelShuffle";
import { MaintGame } from "./MaintGame";
import { isMuted, playBed, playBlip, setMuted, unlockAudio, syncWorld, getAudioProbe, bedForRoom } from "./audio";
import { isRevealing, requestSkip } from "./chatter";
import { Chatter } from "./Chatter";
import { heartCount, tintPlayer } from "./pixel";
import { drawWorld } from "./render";
import { DEFAULT_PLANT, plantTitle, type PlantDesign } from "./plant";
import { hasSave, hydrateSave, peekSave, wipeSave, writeSave } from "./save";
import { computeKeff } from "./nuclearLab";
import { NuclearDesk } from "./NuclearDesk";
import { LoopSchematic } from "./LoopSchematic";
import { DEPARTMENTS, dayDef, eodNpcLine, yesterdayLine } from "./week";
import { DEFAULT_PLAYER_LOOK, HAIR_HEX, HOODIE_HEX, type HairId, type HoodieId, type PlayerLook } from "./artSpec";
import { MAP_HUD, ROOM_BLURB, ROOM_LINKS } from "./site";
import { TeachMeta, TeachPriya, TYPE_THUMB } from "./TeachFrame";
import {
  abortOverlay,
  beginDay,
  beginEndingWalk,
  closeAcademy,
  closeStill,
  createState,
  dayIncident,
  emptyActions,
  finishArcade,
  finishBuilder,
  finishDay,
  finishLeisure,
  finishMaint,
  finishShuffle,
  finishTrainer,
  nextDay,
  npcsHere,
  openAcademy,
  openArcade,
  openCab,
  openShufflePractice,
  pickChoice,
  startShift,
  travelTo,
  tryCloseShift,
  canCloseShift,
  unstick,
  openTalk,
  openStill,
  update,
  type Actions,
  type GameState,
  type Mode,
  type ParlorScores,
} from "./sim";
import type { Choice, Line, NpcId, RoleId } from "./content";

const GAME_CODES = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyE",
  "KeyP",
  "KeyR",
  "KeyH",
  "KeyK",
  "Space",
  "Enter",
  "Escape",
]);

const PLAY_MODES: Mode[] = [
  "play",
  "dialogue",
  "incident",
  "pause",
  "academy",
  "arcade",
  "reactor",
  "still",
  "shuffle",
  "maint",
  "cabs",
  "fish",
  "plot",
  "floor",
  "horde",
  "delay",
  "golf",
  "rods",
  "pebble",
  "bowl",
  "phys",
  "load",
  "ending",
];

function AuthChip() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <div className="h-8 w-8 animate-pulse rounded-full bg-surface" />;
  if (user) return <UserButton />;
  return (
    <Link
      to="/login"
      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted hover:border-border-strong hover:text-fg"
    >
      Sign in
    </Link>
  );
}

export function GameApp() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createState());
  const keysRef = useRef<Set<string>>(new Set());
  const edgesRef = useRef<Set<string>>(new Set());
  const stickRef = useRef({ x: 0, y: 0, active: false });
  const modeRef = useRef<Mode>("splash");
  const sigRef = useRef("");
  const [mode, setMode] = useState<Mode>("splash");
  const [ready, setReady] = useState(false);
  const [touch, setTouch] = useState(false);
  const [saved, setSaved] = useState(false);
  const [askWipe, setAskWipe] = useState(false);
  const [look, setLook] = useState<PlayerLook>(DEFAULT_PLAYER_LOOK);
  const [, bump] = useState(0);
  const refresh = () => bump((n) => n + 1);

  const applyMode = (next: Mode) => {
    stateRef.current.mode = next;
    modeRef.current = next;
    setMode(next);
  };

  useEffect(() => {
    setReady(true);
    setTouch(window.matchMedia("(pointer: coarse)").matches);
    unlockAudio();
    const keys = keysRef.current;
    const edges = edgesRef.current;

    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (GAME_CODES.has(e.code)) e.preventDefault();
      if (!keys.has(e.code)) edges.add(e.code);
      keys.add(e.code);
    };
    const up = (e: KeyboardEvent) => keys.delete(e.code);
    const clear = () => keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") clear();
    });

    window.__controlsTest = {
      getX: () => stateRef.current.x,
      getY: () => stateRef.current.y,
      getFacing: () => stateRef.current.facing,
      getRoom: () => stateRef.current.room,
      getMode: () => stateRef.current.mode,
      getMinutes: () => stateRef.current.minutes,
      getPeriod: () => stateRef.current.period,
      getMural: () => ROOMS[stateRef.current.room].muralH,
      getDay: () => stateRef.current.day,
      setKeys: (codes: string[]) => {
        keys.clear();
        for (const c of codes) keys.add(c);
      },
      begin: () => {
        stateRef.current.mode = "menu";
        modeRef.current = "menu";
        setMode("menu");
      },
      bootPlay: () => {
        const s = stateRef.current;
        startShift(s, "transferred");
        finishBuilder(s, s.plant ?? DEFAULT_PLANT);
        s.mode = "play";
        s.room = "cafe";
        s.x = CAFE_SPAWN.x;
        s.y = CAFE_SPAWN.y;
        s.facing = CAFE_SPAWN.facing;
        s.sitting = false;
        s.flags.mabelTalked = true;
        s.flags.mabelSat = true;
        s.flags["seen:cafe"] = true;
        unstick(s);
        modeRef.current = "play";
        setMode("play");
      },
      warp: (room, x, y) => {
        const s = stateRef.current;
        s.room = room as GameState["room"];
        s.x = x;
        s.y = y;
        s.flags[`seen:${room}`] = true;
        s.mode = "play";
        modeRef.current = "play";
        setMode("play");
        bump((n) => n + 1);
      },
      setMinutes: (n: number) => {
        const s = stateRef.current;
        s.minutes = n;
        s.period = n < 11 * 60 + 30 ? "morning" : n < 14 * 60 ? "midday" : "afternoon";
        s.timeLabel = `${String(Math.floor(n / 60) % 24).padStart(2, "0")}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
        if (n >= 16 * 60 + 20) s.closePrompt = true;
      },
      finishBuild: () => {
        const s = stateRef.current;
        finishBuilder(s, s.plant ?? DEFAULT_PLANT);
        modeRef.current = s.mode;
        setMode(s.mode);
      },
      setDay: (n: number) => {
        const s = stateRef.current;
        s.day = n;
        beginDay(s);
        modeRef.current = s.mode;
        setMode(s.mode);
      },
      getPlant: () => stateRef.current.plant,
      save: () => writeSave(stateRef.current, true),
      load: () => {
        const ok = hydrateSave(stateRef.current);
        if (ok) {
          modeRef.current = stateRef.current.mode;
          setMode(stateRef.current.mode);
        }
        return ok;
      },
      hasSave: () => hasSave(),
      wipe: () => {
        wipeSave();
        setSaved(false);
        return true;
      },
      getObjective: () => stateRef.current.objective,
      getCatch: () => stateRef.current.catches,
      setFlag: (k: string, v: boolean) => {
        stateRef.current.flags[k] = v;
      },
      canClose: () => canCloseShift(stateRef.current),
      reportHere: () => {
        const s = stateRef.current;
        s.flags.glitchSeen = true;
        s.flags.glitchVisible = true;
        s.incidentResolved = true;
        s.reports += 1;
        s.catches += 1;
        s.flags.academy = true;
        s.flags.trainer = true;
        s.flags.mabelTalked = true;
        s.flags.mabelSat = true;
        s.weekLog.push({ day: s.day, kind: "report", text: `Day ${s.day} · Caught on the paper.` });
      },
      travel: (room) => {
        const s = stateRef.current;
        travelTo(s, room as GameState["room"]);
        modeRef.current = s.mode;
        setMode(s.mode);
      },
      startTalk: (npc) => {
        const s = stateRef.current;
        openTalk(s, npc as NpcId);
        modeRef.current = s.mode;
        setMode(s.mode);
        bump((n) => n + 1);
      },
      openIncident: () => {
        const s = stateRef.current;
        s.incidentOpen = true;
        s.mode = "incident";
        modeRef.current = "incident";
        setMode("incident");
      },
      setIntro: (i: number) => {
        const s = stateRef.current;
        s.introI = Math.max(0, Math.min(INTRO.length - 1, i));
        s.mode = "intro";
        modeRef.current = "intro";
        setMode("intro");
      },
      setBuild: () => {
        const s = stateRef.current;
        s.mode = "build";
        modeRef.current = "build";
        setMode("build");
      },
      setAcademy: (i: number) => {
        const s = stateRef.current;
        s.academyI = Math.max(0, Math.min(ACADEMY.length - 1, i));
        s.mode = "academy";
        s.flags.academy = true;
        modeRef.current = "academy";
        setMode("academy");
      },
      openStillId: (id: string) => {
        const s = stateRef.current;
        openStill(s, id);
        modeRef.current = s.mode;
        setMode(s.mode);
      },
      getAcademyTitle: () => ACADEMY[stateRef.current.academyI]?.title ?? "",
      forceEod: () => {
        const s = stateRef.current;
        s.incidentResolved = true;
        s.flags.academy = true;
        s.flags.trainer = true;
        s.minutes = 16 * 60 + 30;
        s.period = "afternoon";
        s.timeLabel = "16:30";
        s.closePrompt = true;
        if (!s.weekLog.some((e) => e.day === s.day)) {
          s.weekLog.push({ day: s.day, kind: "note", text: `Day ${s.day} · Shift closed.` });
        }
        finishDay(s);
        modeRef.current = s.mode;
        setMode(s.mode);
      },
      beginEnding: () => {
        const s = stateRef.current;
        beginEndingWalk(s);
        modeRef.current = s.mode;
        setMode(s.mode);
      },
      choose: (id: string) => {
        const s = stateRef.current;
        for (let i = 0; i < s.dialogue.length; i++) {
          const c = s.dialogue[i]?.choices?.find((x) => x.id === id);
          if (c) {
            s.dialogueI = i;
            pickChoice(s, c);
            return;
          }
        }
      },
      getFlags: () => ({ ...stateRef.current.flags }),
      getWeekLog: () => stateRef.current.weekLog.map((e) => ({ ...e })),
      getNpcs: () => npcsHere(stateRef.current).map((n) => n.id),
      openCab: (id: string) => {
        const s = stateRef.current;
        openCab(s, id as Parameters<typeof openCab>[1], "play");
        modeRef.current = s.mode;
        setMode(s.mode);
      },
      getEnded: () => stateRef.current.ended,
      getTimeLabel: () => stateRef.current.timeLabel,
      getClosePrompt: () => stateRef.current.closePrompt,
      getSitting: () => stateRef.current.sitting,
      getMoving: () => stateRef.current.moving,
      getPhase: () => stateRef.current.walkPhase,
      getAudio: () => getAudioProbe(),
      pose: (opts) => {
        const s = stateRef.current;
        if (opts.x != null) s.x = opts.x;
        if (opts.y != null) s.y = opts.y;
        if (opts.facing) s.facing = opts.facing as GameState["facing"];
        if (opts.phase != null) s.walkPhase = opts.phase;
        if (opts.moving != null) s.moving = opts.moving;
        if (opts.sitting != null) s.sitting = opts.sitting;
        s.poseHold = opts.hold ?? 0.55;
        s.mode = "play";
        modeRef.current = "play";
        setMode("play");
      },
    };

    let last = performance.now();
    let raf = 0;
    let saveAcc = 0;
    const onPlantDl = () => {
      writeSave(stateRef.current, false);
    };
    window.addEventListener("cc-plant-download", onPlantDl);
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const a = collectActions(keys, edges, stickRef.current);
      const s = stateRef.current;
      if (edges.has("KeyK")) tryCloseShift(s);
      update(s, a, dt);
      syncWorld({
        room: s.room,
        period: s.period,
        mode: s.mode,
        valveSteam: s.room === "maintenance" && s.day === 1 && !s.incidentResolved,
        dt,
      });
      if (s.mode === "play") {
        saveAcc += dt;
        if (saveAcc >= 60) {
          writeSave(s);
          saveAcc = 0;
        }
      }
      if (s.mode !== modeRef.current) {
        modeRef.current = s.mode;
        setMode(s.mode);
      }
      const sig = [
        s.mode,
        s.introI,
        s.dialogueI,
        s.timeLabel,
        s.period,
        s.objective,
        s.nearLabel,
        s.toastT > 0 ? s.toast : "",
        s.announceT > 0.2 ? s.announce : "",
        s.fade > 0.05 ? "f" : "o",
        s.culture,
        s.room,
        s.stillId ?? "",
        s.academyI,
        s.closePrompt ? "c" : "",
        s.day,
        s.shuffleDone ? "sh" : "",
        s.weekLog.length,
        s.flags.endingWalk ? "ew" : "",
        s.ended ?? "",
        s.introLock > 0 ? "L" : "",
        isRevealing() ? "R" : "",
      ].join("|");
      if (sig !== sigRef.current) {
        sigRef.current = sig;
        bump((n) => n + 1);
      }
      edges.clear();
      if (PLAY_MODES.includes(s.mode)) {
        paint(canvasRef.current, wrapRef.current, s, now / 1000, dt);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      window.removeEventListener("cc-plant-download", onPlantDl);
      delete window.__controlsTest;
    };
  }, []);

  useEffect(() => {
    if (mode === "menu") setSaved(hasSave());
  }, [mode]);

  const s = stateRef.current;
  const stage = cultureStage(s.culture);
  const playing = PLAY_MODES.includes(mode);
  const line = s.dialogue[s.dialogueI] as Line | undefined;
  const pendingChoices = line?.choices?.filter((c) => !s.flags[`choice:${c.id}`]) ?? [];

  const goMenu = (next: Mode) => {
    unlockAudio();
    playBlip("click");
    if (next === "menu") playBed("menu");
    if (next === "play") playBed(bedForRoom(s.room, "play"));
    applyMode(next);
    refresh();
  };

  const pickRole = (id: RoleId) => {
    unlockAudio();
    playBlip("ok");
    playBed("cafe");
    startShift(s, id, look);
    setSaved(false);
    setAskWipe(false);
    applyMode("build");
    refresh();
  };

  const beginNewWeek = () => {
    wipeSave();
    setSaved(false);
    setAskWipe(false);
    unlockAudio();
    playBlip("ok");
    playBed("menu");
    applyMode("role");
    refresh();
  };

  const pulse = (code: string) => {
    edgesRef.current.add(code);
    refresh();
  };

  return (
    <div className="relative flex h-svh min-h-[100dvh] flex-col overflow-hidden bg-bg text-fg">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-3 p-3 sm:p-4">
        {!playing && mode !== "splash" && mode !== "brief" && mode !== "intro" ? (
          <div className="pointer-events-auto max-w-[58%] rounded-lg border border-border bg-bg-elevated/90 px-3 py-2 backdrop-blur-sm">
            <p className="font-display text-[11px] uppercase tracking-[0.16em] text-muted">{SITE}</p>
            <p className="font-display text-lg leading-none text-fg">{TITLE}</p>
          </div>
        ) : (
          <div className="pointer-events-none h-8" />
        )}
        <div className="pointer-events-auto flex items-center gap-2">
          <MuteToggle />
          <AuthChip />
        </div>
      </header>

      <div ref={wrapRef} className="relative min-h-0 flex-1">
        {!playing && (
          <MenuBackdrop
            scene={
              mode === "intro"
                ? INTRO[s.introI]?.scene
                : mode === "brief"
                  ? "/art/gen/stills/intro_control.jpg"
                  : mode === "role"
                    ? "/art/gen/stills/intro_threshold.jpg"
                    : undefined
            }
          />
        )}

        <canvas
          ref={canvasRef}
          className={
            "pixel-canvas absolute inset-0 h-full w-full touch-none " + (playing ? "" : "pointer-events-none opacity-0")
          }
          style={{ touchAction: "none", imageRendering: "pixelated" }}
        />

        {!ready && <div className="absolute inset-0 z-50 bg-bg" />}

        {mode === "play" && (
          <Hud
            room={ROOMS[s.room].name}
            roomId={s.room}
            culture={s.culture}
            stage={stage}
            time={s.timeLabel}
            period={s.period}
            toast={s.toastT > 0 ? s.toast : ""}
            objective={s.objective}
            day={s.day}
            nearLabel={s.nearLabel}
          />
        )}

        {mode === "play" && s.announceT > 0.15 && (
          <div className="pointer-events-none absolute inset-x-0 top-[22%] z-20 text-center">
            <p className="font-display text-xl text-fg sm:text-2xl">{s.announce}</p>
          </div>
        )}

        {mode === "splash" && (
          <Panel onActivate={() => goMenu("menu")} hint="Click anywhere · Enter">
            <p className="font-display text-xs uppercase tracking-[0.2em] text-muted">Lake Master</p>
            <h1 className="font-display mt-2 max-w-xl text-4xl leading-[1.05] text-fg sm:text-5xl">{TITLE}</h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-muted">{TAGLINE}</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-subtle">{THESIS}</p>
            <button
              type="button"
              className="btn-primary mt-6"
              onClick={(e) => {
                e.stopPropagation();
                goMenu("menu");
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                goMenu("menu");
              }}
            >
              Begin
            </button>
          </Panel>
        )}

        {mode === "menu" && (
          <Panel>
            <h1 className="font-display text-3xl text-fg sm:text-4xl">{TITLE}</h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              Design Unit 1 with Priya. Then walk {SITE} for a week. Catch errors. Do not hide them.
            </p>
            <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
              {saved ? (
                <button
                  type="button"
                  className={peekSave()?.ended ? "btn-ghost" : "btn-primary"}
                  data-testid="continue-shift"
                  onClick={() => {
                    if (!hydrateSave(s)) {
                      setSaved(false);
                      return;
                    }
                    unlockAudio();
                    playBlip("ok");
                    const next = s.mode === "splash" || s.mode === "menu" ? "play" : s.mode;
                    s.mode = next;
                    if (next === "play") playBed(bedForRoom(s.room, "play"));
                    else playBed("menu");
                    applyMode(next);
                    refresh();
                  }}
                >
                  {peekSave()?.ended ? `Review week · Day ${peekSave()?.day ?? 1}` : `Continue · Day ${peekSave()?.day ?? 1}`}
                </button>
              ) : null}
              <button
                type="button"
                className={saved && !peekSave()?.ended ? "btn-ghost" : "btn-primary"}
                data-testid="new-shift"
                onClick={() => {
                  if (saved) {
                    setAskWipe(true);
                    return;
                  }
                  beginNewWeek();
                }}
              >
                New shift
              </button>
              <button type="button" className="btn-ghost" onClick={() => goMenu("how")} onPointerDown={() => goMenu("how")}>
                How to play
              </button>
              <button type="button" className="btn-ghost" onClick={() => goMenu("credits")} onPointerDown={() => goMenu("credits")}>
                Thesis / credits
              </button>
              <MuteToggle />
            </div>
          </Panel>
        )}

        {mode === "how" && (
          <Panel>
            <h2 className="font-display text-2xl">How to play</h2>
            <ul className="mt-4 max-w-md space-y-2 text-sm leading-relaxed text-muted">
              <li>New shift starts at the academic designer — you build the core you will walk. It discards a saved week.</li>
              <li>WASD or stick — walk. A is left, D is right. Clock pauses while you talk, study, or play.</li>
              <li>E — the near prompt (Talk / Academy / Hang tag / Shuffle / Look / Catch).</li>
              <li>P — peer-check. R — report. H — hide (three hides close the week as unfinished power).</li>
              <li>ESC — pause for the plant map, hearts, Academy, arcade. K closes the shift.</li>
              <li>Mabel's parlor: same bezel, different jobs. North wall is Unit 1. South is after-shift. Pebble is a comparison.</li>
              <li>Academy in Control. Priya's ΔT bench. Tommy's LOTOTO. Day 5: fuel shuffle.</li>
              <li>Teaching model only — not a real plant, not a license.</li>
            </ul>
            <button type="button" className="btn-primary mt-6" onPointerDown={() => goMenu("menu")}>
              Back
            </button>
          </Panel>
        )}

        {mode === "credits" && (
          <Panel>
            <h2 className="font-display text-2xl">Thesis</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              A reactor only makes power in the right environment. People are the same. Mistakes are expected.
              Hiding them is the hazard. Catch greater than heroics.
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-subtle">
              Director: Mr. Reginald Holt. Cafe: Dr. Mabel Quinn. Academic designer: Dr. Priya Sharma. Site: {SITE} on
              Lake Master. Education is frozen teaching content — not a license.
            </p>
            <button type="button" className="btn-primary mt-6" onPointerDown={() => goMenu("menu")}>
              Back
            </button>
          </Panel>
        )}

        {mode === "role" && (
          <Panel>
            <p className="font-display text-xs uppercase tracking-[0.18em] text-accent">Badge</p>
            <h2 className="font-display mt-2 text-2xl">Who walks in</h2>
            <p className="mt-2 text-sm text-muted">Flavor only. First you design the unit with Priya. Then you walk it.</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <LookPreview look={look} />
              <div className="text-left">
                <p className="font-mono text-sm font-semibold uppercase tracking-[0.16em] text-[#f3e6d0]">Hoodie</p>
                <div className="mt-1 flex gap-1">
                  {(["copper", "leaf", "steel", "gold"] as HoodieId[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      aria-label={"Hoodie " + id}
                      className={"h-7 w-7 border-2 " + (look.hoodie === id ? "border-[#f3e6d0]" : "border-[#6a4a32]")}
                      style={{ background: HOODIE_HEX[id] }}
                      onClick={() => setLook((l) => ({ ...l, hoodie: id }))}
                    />
                  ))}
                </div>
                <p className="mt-3 font-mono text-sm font-semibold uppercase tracking-[0.16em] text-[#f3e6d0]">Hair</p>
                <div className="mt-1 flex gap-1">
                  {(["brown", "ink", "silver", "copper"] as HairId[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      aria-label={"Hair " + id}
                      className={"h-7 w-7 border-2 " + (look.hair === id ? "border-[#f3e6d0]" : "border-[#6a4a32]")}
                      style={{ background: HAIR_HEX[id] }}
                      onClick={() => setLook((l) => ({ ...l, hair: id }))}
                    />
                  ))}
                </div>
                <label className="mt-2 flex items-center gap-2 font-mono text-[11px] text-muted">
                  <input
                    type="checkbox"
                    checked={look.glasses}
                    onChange={(e) => setLook((l) => ({ ...l, glasses: e.target.checked }))}
                  />
                  Glasses
                </label>
              </div>
            </div>
            <div className="mt-5 grid w-full max-w-xl gap-2 sm:grid-cols-2">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="rounded-lg border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-border-strong hover:bg-surface-hot"
                  data-testid={"role-" + r.id}
                  onClick={() => pickRole(r.id)}
                >
                  <div className="font-medium text-fg">{r.title}</div>
                  <div className="mt-1 text-xs leading-relaxed text-muted">{r.line}</div>
                </button>
              ))}
            </div>
            <button type="button" className="btn-ghost mt-4" onClick={() => goMenu("menu")}>
              Back
            </button>
          </Panel>
        )}

        {mode === "build" && (
          <ReactorBuilder
            onDone={(plant) => {
              finishBuilder(s, plant);
              applyMode("intro");
              playBlip("ok");
              refresh();
            }}
          />
        )}

        {mode === "intro" && INTRO[s.introI] && (
          <Panel hint={s.introLock > 0 ? "" : "Space or Continue"}>
            <img src={INTRO[s.introI].art} alt="" className="mb-4 h-[120px] w-[214px] max-w-full object-contain" style={{ imageRendering: "pixelated" }} />
            <p className="font-display text-xs uppercase tracking-[0.18em] text-accent">{INTRO[s.introI].kicker}</p>
            <h2 className="font-display mt-3 max-w-lg text-3xl leading-tight text-fg">{INTRO[s.introI].title}</h2>
            <div className="mt-5 flex w-full max-w-md items-center gap-4 text-left">
              <img
                src={INTRO[s.introI].sprite}
                alt=""
                className="h-16 w-8 shrink-0"
                style={{ imageRendering: "pixelated" }}
              />
              <Chatter text={INTRO[s.introI].line} voice={INTRO[s.introI].kicker} className="dialogue-line text-sm leading-relaxed text-fg" />
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">{INTRO[s.introI].body}</p>
            {s.plant && s.introI === 0 ? <p className="mt-3 font-mono text-xs text-good">{plantTitle(s.plant)}</p> : null}
            <button
              type="button"
              className="btn-primary mt-6 disabled:opacity-40"
              disabled={s.introLock > 0 && !isRevealing()}
              onClick={() => {
                if (isRevealing()) requestSkip();
                else pulse("Enter");
              }}
            >
              {s.introI < INTRO.length - 1 ? "Continue" : "Morning brief"}
            </button>
          </Panel>
        )}

        {mode === "brief" && (
          <Panel hint={s.introLock > 0 ? "" : "Space · Walk in"}>
            <div key={s.day} className="flex w-full flex-col items-center">
              <p className="font-display text-xs uppercase tracking-[0.18em] text-accent">{dayDef(s.day).kicker}</p>
              <h2 className="font-display mt-3 max-w-lg text-3xl leading-tight text-fg">{dayDef(s.day).title}</h2>
              <Chatter text={dayDef(s.day).holt} voice="holt" className="dialogue-line mt-3 max-w-md text-sm leading-relaxed text-muted" />
              {yesterdayLine(s.day, s.weekLog) ? (
                <p className="mt-3 max-w-md text-sm leading-relaxed text-subtle">{yesterdayLine(s.day, s.weekLog)}</p>
              ) : null}
              <ul className="mt-4 max-w-md space-y-1.5 text-left text-sm leading-relaxed text-subtle">
                {dayDef(s.day).items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {s.plant ? <p className="mt-3 font-mono text-xs text-good">{plantTitle(s.plant)}</p> : null}
            <button
              type="button"
              className="btn-primary mt-6 disabled:opacity-40"
              disabled={s.introLock > 0 && !isRevealing()}
              onClick={() => {
                if (isRevealing()) requestSkip();
                else pulse("Enter");
              }}
            >
              Walk in
            </button>
            </div>
          </Panel>
        )}

        {mode === "dialogue" && line && (
          <DialogueStage
            line={line}
            npc={s.talkNpc}
            role={s.talkNpc ? NPCS[s.talkNpc].role : ""}
            beat={s.talkNpc ? NPC_INTRO[s.talkNpc].beat : undefined}
            who={s.talkNpc && s.dialogueI === 0 ? NPC_INTRO[s.talkNpc].who : undefined}
            time={s.timeLabel}
            room={ROOMS[s.room].name}
            hearts={s.talkNpc ? heartCount(s.trust[s.talkNpc]) : 0}
            pendingChoices={pendingChoices}
            onChoice={(c) => {
              pickChoice(s, c);
              playBlip("ok");
              refresh();
            }}
            onContinue={() => pulse("Enter")}
          />
        )}

        {mode === "still" && s.stillId === "scores" && (
          <ScoresBoard
            scores={s.scores}
            onClose={() => {
              closeStill(s);
              applyMode("play");
              refresh();
            }}
          />
        )}

        {mode === "still" && s.stillId && s.stillId !== "scores" && STILLS[s.stillId] && (
          <StillStage
            still={STILLS[s.stillId]}
            stillId={s.stillId}
            onClose={() => {
              closeStill(s);
              applyMode("play");
              refresh();
            }}
          />
        )}

        {mode === "cabs" && (
          <ArcadeHall
            fromEod={s.returnMode === "eod"}
            onPick={(id) => {
              openCab(s, id, s.returnMode === "eod" ? "eod" : "play");
              applyMode(s.mode);
              refresh();
            }}
            onAbort={() => {
              abortOverlay(s);
              applyMode(s.mode);
              refresh();
            }}
          />
        )}

        {mode === "fish" && (
          <FishGame
            onDone={(score) => {
              finishLeisure(s, score);
              applyMode(s.mode);
              playBlip("ok");
              refresh();
            }}
            onAbort={() => {
              abortOverlay(s);
              applyMode(s.mode);
              refresh();
            }}
          />
        )}
        {mode === "plot" && (
          <PlotGame
            onDone={(score) => {
              finishLeisure(s, score);
              applyMode(s.mode);
              playBlip("ok");
              refresh();
            }}
            onAbort={() => {
              abortOverlay(s);
              applyMode(s.mode);
              refresh();
            }}
          />
        )}

        {mode === "horde" && (
          <HordeGame
            onDone={(score) => {
              finishLeisure(s, score);
              applyMode(s.mode);
              playBlip("ok");
              refresh();
            }}
            onAbort={() => {
              abortOverlay(s);
              applyMode(s.mode);
              refresh();
            }}
          />
        )}
        {mode === "delay" && (
          <DelayGame
            onDone={(score) => {
              finishLeisure(s, score);
              applyMode(s.mode);
              playBlip("ok");
              refresh();
            }}
            onAbort={() => {
              abortOverlay(s);
              applyMode(s.mode);
              refresh();
            }}
          />
        )}
        {mode === "golf" && (
          <GolfGame
            onDone={(score) => {
              finishLeisure(s, score);
              applyMode(s.mode);
              playBlip("ok");
              refresh();
            }}
            onAbort={() => {
              abortOverlay(s);
              applyMode(s.mode);
              refresh();
            }}
          />
        )}
        {mode === "rods" && (
          <RodsGame
            onDone={(score) => {
              finishLeisure(s, score);
              applyMode(s.mode);
              playBlip("ok");
              refresh();
            }}
            onAbort={() => {
              abortOverlay(s);
              applyMode(s.mode);
              refresh();
            }}
          />
        )}
        {mode === "pebble" && (
          <PebbleGame
            onDone={(score) => {
              finishLeisure(s, score);
              applyMode(s.mode);
              playBlip("ok");
              refresh();
            }}
            onAbort={() => {
              abortOverlay(s);
              applyMode(s.mode);
              refresh();
            }}
          />
        )}
        {mode === "bowl" && (
          <BowlGame
            onDone={(score) => {
              finishLeisure(s, score);
              applyMode(s.mode);
              playBlip("ok");
              refresh();
            }}
            onAbort={() => {
              abortOverlay(s);
              applyMode(s.mode);
              refresh();
            }}
          />
        )}
        {mode === "phys" && (
          <PhysicsGame
            plantType={s.plant?.type ?? "pwr"}
            startLab={s.flags.physMc ? "mc" : "pin"}
            onDone={(score) => {
              s.flags.physMc = false;
              finishLeisure(s, score);
              applyMode(s.mode);
              playBlip("ok");
              refresh();
            }}
            onAbort={() => {
              s.flags.physMc = false;
              abortOverlay(s);
              applyMode(s.mode);
              refresh();
            }}
          />
        )}
        {mode === "load" && (
          <LoadGame
            onDone={(score) => {
              finishLeisure(s, score);
              applyMode(s.mode);
              playBlip("ok");
              refresh();
            }}
            onAbort={() => {
              abortOverlay(s);
              applyMode(s.mode);
              refresh();
            }}
          />
        )}

        {mode === "arcade" && (
          <Arcade
            day={s.day}
            fromEod={s.returnMode === "eod"}
            onDone={(score, leftover = 0) => {
              finishArcade(s, score, leftover);
              applyMode(s.mode);
              playBlip("ok");
              refresh();
            }}
            onAbort={() => {
              abortOverlay(s);
              applyMode(s.mode);
              refresh();
            }}
          />
        )}

        {mode === "reactor" && (
          <ReactorTrainer
            site={s.plant?.type ?? "pwr"}
            onPass={() => {
              finishTrainer(s);
              applyMode(s.mode);
              playBlip("ok");
              refresh();
            }}
            onAbort={() => {
              abortOverlay(s);
              applyMode(s.mode);
              refresh();
            }}
          />
        )}

        {mode === "shuffle" && (
          <FuelShuffle
            plant={s.plant ?? DEFAULT_PLANT}
            practice={s.returnMode === "academy" || s.day < 5 || !!s.flags.cabPractice}
            onDone={(fq, map) => {
              finishShuffle(s, fq, map);
              applyMode(s.mode);
              playBlip("ok");
              refresh();
            }}
            onAbort={() => {
              abortOverlay(s);
              applyMode(s.mode);
              refresh();
            }}
          />
        )}

        {mode === "maint" && (
          <MaintGame
            onDone={(score) => {
              finishMaint(s, score);
              applyMode("play");
              playBlip("ok");
              refresh();
            }}
            onAbort={() => {
              abortOverlay(s);
              applyMode("play");
              refresh();
            }}
          />
        )}

        {mode === "incident" && (
          <IncidentStage
            title={dayIncident(s).title}
            body={dayIncident(s).body}
            report={dayIncident(s).report}
            peer={dayIncident(s).peer}
            hide={dayIncident(s).hide}
            time={s.timeLabel}
            room={ROOMS[s.room].name}
            onReport={() => {
              playBlip("ok");
              keysRef.current.clear();
              edgesRef.current.add("KeyR");
              refresh();
            }}
            onPeer={() => {
              playBlip("ok");
              edgesRef.current.add("KeyP");
              refresh();
            }}
            onHide={() => {
              playBlip("warn");
              edgesRef.current.add("KeyH");
              refresh();
            }}
          />
        )}

        {mode === "academy" && (
          <AcademyStage
            index={s.academyI}
            done={s.academyDone}
            plant={s.plant}
            onPlant={(p) => {
              s.plant = p;
              refresh();
            }}
            onPrev={() => {
              s.academyI = (s.academyI + ACADEMY.length - 1) % ACADEMY.length;
              refresh();
            }}
            onNext={() => {
              s.academyI = (s.academyI + 1) % ACADEMY.length;
              refresh();
            }}
            onJump={(i) => {
              s.academyI = i;
              refresh();
            }}
            onTrainer={() => {
              s.returnMode = "academy";
              applyMode("reactor");
              refresh();
            }}
            onShuffle={() => {
              if (s.day >= 5 || s.plant?.fullCore) {
                openShufflePractice(s);
                applyMode("shuffle");
              }
              refresh();
            }}
            onDelay={() => {
              s.returnMode = "academy";
              applyMode("delay");
              refresh();
            }}
            onRods={() => {
              s.returnMode = "academy";
              applyMode("rods");
              refresh();
            }}
            onPhys={() => {
              s.flags.physMc = false;
              s.returnMode = "academy";
              applyMode("phys");
              refresh();
            }}
            onLoad={() => {
              s.returnMode = "academy";
              applyMode("load");
              refresh();
            }}
            onMc={() => {
              s.flags.physMc = true;
              s.returnMode = "academy";
              applyMode("phys");
              refresh();
            }}
            onClose={() => {
              closeAcademy(s);
              applyMode(s.mode);
              refresh();
            }}
            canShuffle={s.day >= 5 || !!s.plant?.fullCore}
          />
        )}

        {mode === "pause" && (
          <PauseStage
            s={s}
            stage={stage}
            onResume={() => goMenu("play")}
            onSave={() => {
              writeSave(s, false);
              setSaved(true);
              refresh();
            }}
            onAcademy={() => {
              openAcademy(s);
              applyMode("academy");
              refresh();
            }}
            onArcade={() => {
              openArcade(s, "play");
              applyMode("cabs");
              refresh();
            }}
            onTravel={(id) => {
              travelTo(s, id);
              applyMode(s.mode);
              refresh();
            }}
            onClose={() => {
              tryCloseShift(s);
              applyMode(s.mode);
              refresh();
            }}
            onMenu={() => {
              writeSave(s);
              setAskWipe(false);
              playBed("menu");
              applyMode("menu");
            }}
            onNewWeek={() => setAskWipe(true)}
          />
        )}

        {mode === "eod" && (
          <div className="absolute inset-0 z-30 flex items-end justify-center overflow-y-auto bg-bg/70 p-3 pb-28 sm:items-center sm:p-6">
            <div className="paper mx-auto w-full max-w-xl p-4 sm:p-5" data-testid="paper-eod">
              <img
                src="/art/gen/stills/plate_lake.png?v=key"
                alt=""
                className="mb-3 h-[120px] w-[214px] max-w-full object-contain sm:h-[180px] sm:w-[320px]"
                style={{ imageRendering: "pixelated" }}
              />
              <div className="mb-3 flex gap-2">
                {(["mabel", "elena", "holt", "priya"] as const).map((id) => (
                  <img key={id} src={`/art/gen/portraits/${id}_talk.png?v=eval1`} alt="" className="h-12 w-12 object-contain" />
                ))}
              </div>
              <p className="font-mono text-[10px] tracking-widest text-[#8a7864]">Shift log · {dayDef(s.day).name}</p>
              <h2 className="font-display mt-2 text-3xl">{s.day < 5 ? "The floor writes back" : "The week writes back"}</h2>
              <p className="mt-3 text-sm leading-relaxed">
                Culture {stage} ({s.culture}). Reports {s.reports}. Catches {s.catches}. Hides {s.hides}.
                {s.shuffleDone ? ` Fq ${s.fq.toFixed(2)}.` : ""}
              </p>
              {s.plant ? <p className="mt-2 font-mono text-xs text-[#3d5c44]">{plantTitle(s.plant)}</p> : null}
              <p className="mt-2 text-sm leading-relaxed text-[#6a4a32]">
                {eodNpcLine({ hides: s.hides, ended: s.ended, flags: s.flags })}
              </p>
              {s.weekLog.length > 0 ? (
                <ul className="mt-3 space-y-1 text-left text-[12px] leading-relaxed text-[#3a2818]" data-testid="week-log">
                  {s.weekLog.slice(-6).map((e, i) => (
                    <li key={`${e.day}-${e.kind}-${i}`}>
                      {e.kind === "hide" ? "Hid · " : e.kind === "peer" ? "Catch · " : e.kind === "report" ? "Report · " : e.kind === "shuffle" ? "Shuffle · " : ""}
                      {e.text}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-2 text-[11px] text-[#8a7864]">
                {s.hides >= 3
                  ? "Three hides close the week as unfinished power — even if the culture number looks fine."
                  : s.ended === "a"
                    ? "Honest catches outnumbered silence. Holt can fund a real review."
                    : "Skill without a safe floor is unfinished power. The numbers can still run."}
              </p>
              <p className="mt-2 text-[11px] text-[#8a7864]">Teaching model — not a license. Catch greater than heroics.</p>
              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  className="paper-btn"
                  onClick={() => {
                    openArcade(s, "eod");
                    applyMode("cabs");
                    refresh();
                  }}
                >
                  Mabel's arcade
                </button>
                <button
                  type="button"
                  className="paper-btn"
                  onClick={() => {
                    openAcademy(s);
                    applyMode("academy");
                    refresh();
                  }}
                >
                  Academy
                </button>
                <button
                  type="button"
                  className="paper-btn-primary"
                  onClick={() => {
                    nextDay(s);
                    applyMode(s.mode);
                    refresh();
                  }}
                >
                  {s.day >= 5 ? "Walk the lot at dusk" : "Clock out · next morning"}
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === "ending" && (
          <div className="absolute inset-0 z-30 flex items-end justify-center overflow-y-auto bg-bg/55 p-3 pb-28 sm:items-center sm:p-6">
            <div className="paper mx-auto w-full max-w-xl p-4 sm:p-5" data-testid="paper-ending">
              <p className="font-mono text-[10px] tracking-widest text-[#8a7864]">Dusk · Lot · Lake north</p>
              <h2 className="font-display mt-2 text-3xl">{s.ended === "a" ? "The floor holds" : "Unfinished power"}</h2>
              <p className="mt-3 text-sm leading-relaxed">
                {s.ended === "a"
                  ? "You caught it cheap. Elena, Tommy, Priya, Holt still have names. The floor held because people did. The stack is still breathing."
                  : "Hides outran catches. Culture can look fine on a poster while the hiss keeps talking. The lot is quiet. The plant is not."}
              </p>
              {s.weekLog.length > 0 ? (
                <ul className="mt-3 space-y-1 text-left text-[12px] leading-relaxed text-[#3a2818]" data-testid="week-log-ending">
                  {s.weekLog.slice(-6).map((e, i) => (
                    <li key={`${e.day}-${e.kind}-${i}`}>{e.text}</li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-3 text-sm leading-relaxed text-[#6a4a32]">
                Every plant, every person, every kid needs an environment that lets them thrive. Be allowed to err.
                Grow into who you need to be. Reach criticality surrounded by those who love you enough to catch you.
              </p>
              <p className="mt-3 text-[11px] text-[#8a7864]">Teaching model — not a license. Catch greater than heroics.</p>
              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  className="paper-btn-primary"
                  data-testid="new-shift-ending"
                  onClick={() => setAskWipe(true)}
                >
                  New shift
                </button>
                <button
                  type="button"
                  className="paper-btn"
                  onClick={() => {
                    goMenu("menu");
                  }}
                >
                  Main menu
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === "play" && s.closePrompt && (
          <div className="pointer-events-none absolute inset-x-0 bottom-20 z-20 flex justify-center px-4 sm:bottom-12">
            <button
              type="button"
              className="pointer-events-auto paper px-4 py-2 font-display text-sm text-[#16110d]"
              data-testid="close-shift"
              onClick={() => {
                tryCloseShift(s);
                applyMode(s.mode);
                refresh();
              }}
            >
              The {s.flags.endingWalk ? "stack is breathing · Close the week" : "light is long · Close the shift"}
            </button>
          </div>
        )}

        {touch && (mode === "play" || mode === "dialogue" || mode === "incident") && (
          <TouchPad stickRef={stickRef} edges={edgesRef} />
        )}
      </div>

      {askWipe ? (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-bg/85 p-4"
          data-testid="wipe-confirm"
        >
          <div className="paper w-full max-w-sm p-5">
            <p className="font-display text-2xl text-[#16110d]">Start a new week?</p>
            <p className="mt-2 text-sm leading-relaxed text-[#3a2818]">
              This discards Day {peekSave()?.day ?? s.day}
              {(peekSave()?.plant ?? s.plant) ? ` and ${plantTitle((peekSave()?.plant ?? s.plant)!)}` : ""}. Culture,
              catches, and the saved shift go with it.
            </p>
            <p className="mt-2 text-[11px] text-[#8a7864]">You pick a badge again. Priya's designer is first.</p>
            <div className="mt-5 flex flex-col gap-2">
              <button type="button" className="btn-primary" data-testid="wipe-confirm-yes" onClick={beginNewWeek}>
                New week
              </button>
              <button type="button" className="btn-ghost" data-testid="wipe-confirm-no" onClick={() => setAskWipe(false)}>
                Keep this week
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function paperMood(mood?: Line["mood"]) {
  if (mood === "warm") return "text-[#c4783a]";
  if (mood === "tired") return "text-[#8a7864]";
  if (mood === "sharp") return "text-[#b85c4a]";
  if (mood === "soft") return "text-[#3d5c44]";
  if (mood === "wry") return "text-[#6a4a32]";
  return "text-[#c4783a]";
}

function PixelPortrait({ npc }: { npc: NpcId }) {
  return (
    <img
      src={`/art/gen/portraits/${npc}_talk.png?v=eval1`}
      alt=""
      width={192}
      height={192}
      className="h-48 w-48 shrink-0 self-start bg-transparent object-contain sm:self-auto"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

function HeartRow({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} of 5 hearts`}>
      {Array.from({ length: 5 }, (_, i) => (
        <img
          key={i}
          src={i < n ? "/art/gen/ui/heart_on.png?v=leftover" : "/art/gen/ui/heart_off.png?v=leftover"}
          alt=""
          className="h-3 w-3"
          style={{ imageRendering: "pixelated" }}
        />
      ))}
    </div>
  );
}

function DialogueStage({
  line,
  npc,
  role,
  beat,
  who,
  time,
  room,
  hearts,
  pendingChoices,
  onChoice,
  onContinue,
}: {
  line: Line;
  npc: NpcId | null;
  role: string;
  beat?: string;
  who?: string;
  time: string;
  room: string;
  hearts: number;
  pendingChoices: Choice[];
  onChoice: (c: Choice) => void;
  onContinue: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3 pb-24 sm:p-5 sm:pb-8">
      <div
        className="paper pointer-events-auto mx-auto flex max-w-2xl flex-col gap-3 p-3 sm:flex-row sm:gap-4 sm:p-4"
        data-testid="paper-talk"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          if (isRevealing()) requestSkip();
          else onContinue();
        }}
      >
        {npc ? <PixelPortrait npc={npc} /> : null}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-widest text-[#8a7864]">
            {time} · {room} · clock frozen
          </p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <div>
              <p className={"font-display text-xs font-semibold uppercase tracking-[0.14em] " + paperMood(line.mood)}>
                {line.speaker}
              </p>
              {role ? <p className="text-[11px] text-[#8a7864]">{role}</p> : null}
              {beat ? <p className="text-[11px] leading-snug text-[#6a4a32]">{beat}</p> : null}
            </div>
            <HeartRow n={hearts} />
          </div>
          {who ? <p className="mt-2 text-[12px] leading-relaxed text-[#6a4a32]">{who}</p> : null}
          <Chatter
            key={`${line.speaker}-${line.text}`}
            text={line.text}
            voice={line.speaker}
            className="dialogue-line mt-2 font-display text-base leading-relaxed"
          />
          {pendingChoices.length > 0 ? (
            <div className="mt-3 flex flex-col gap-2">
              {pendingChoices.slice(0, 3).map((c) => (
                <button key={c.id} type="button" className="paper-btn" onClick={() => onChoice(c)}>
                  {c.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-[#8a7864]">Click or Space skips the line. Again to continue. Esc leaves.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function IncidentStage({
  title,
  body,
  report,
  peer,
  hide,
  time,
  room,
  onReport,
  onPeer,
  onHide,
}: {
  title: string;
  body: string;
  report: string;
  peer: string;
  hide: string;
  time: string;
  room: string;
  onReport: () => void;
  onPeer: () => void;
  onHide: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-bg/55 p-3 pb-24 sm:items-center sm:p-6">
      <div
        className="paper flex w-full max-w-2xl flex-col gap-3 p-3 sm:flex-row sm:gap-4 sm:p-5 max-h-[min(74vh,36rem)] overflow-y-auto"
        data-testid="paper-incident"
      >
        <img
          src="/art/gen/portraits/elena_talk.png?v=eval1"
          alt=""
          width={192}
          height={192}
          className="h-48 w-48 shrink-0 object-contain"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-widest text-[#8a7864]">
            {time} · {room} · Just Culture
          </p>
          <h2 className="font-display mt-1 text-2xl">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed">{body}</p>
          <p className="mt-1 text-[11px] text-[#8a7864]">The cheaper truth. Teaching model — not a license.</p>
          <div className="mt-4 flex flex-col gap-2">
            <button type="button" className="paper-btn" onPointerDown={onReport}>
              <span className="font-mono text-[11px] text-[#6a4a32]">R · Report.</span> {report}
            </button>
            <button type="button" className="paper-btn" onPointerDown={onPeer}>
              <span className="font-mono text-[11px] text-[#6a4a32]">P · Peer-check.</span> {peer}
            </button>
            <button type="button" className="paper-btn" onPointerDown={onHide}>
              <span className="font-mono text-[11px] text-[#6a4a32]">H · Hide.</span> {hide}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoresBoard({ scores, onClose }: { scores: ParlorScores; onClose: () => void }) {
  const row = (label: string, value: string) => (
    <div className="flex items-baseline justify-between border-b border-[#c9a227]/20 py-1.5 font-mono text-sm">
      <span className="tracking-widest text-[#c9a227]">{label}</span>
      <span className="text-[#f3e6d0]">{value}</span>
    </div>
  );
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#16110d]/90 px-4 pb-24 pt-16" data-testid="scores-board">
      <div className="w-full max-w-md border-8 border-[#3a2818] bg-[#1a1410] p-5 shadow-[0_0_0_3px_#c9a227]">
        <p className="font-mono text-xs tracking-widest text-[#c9a227]">MABEL.BOARD  ·  chalk</p>
        <h2 className="font-display mt-2 text-2xl text-[#f3e6d0]">The parlor remembers</h2>
        <div className="mt-4">
          {row("CATCH", scores.catchBest ? `${scores.catchBest}/5  leftover ${scores.catchTime.toFixed(1)}s` : "—")}
          {row("HORDE", scores.hordeBest ? String(scores.hordeBest) : "—")}
          {row("GOLF", scores.golfBest ? String(scores.golfBest) : "—")}
          {row("DELAY", scores.delayEvents ? `wave ${scores.delayEvents}` : "—")}
          {row("PHYS", scores.physBest ? String(scores.physBest) : "—")}
          {row("LOAD", scores.loadBest ? String(scores.loadBest) : "—")}
        </div>
        <p className="mt-3 font-mono text-[10px] text-[#8a7864]">Teaching only. Holt reads the board.</p>
        <button type="button" className="btn-primary mt-5" onClick={onClose}>
          Back
        </button>
      </div>
    </div>
  );
}

function StillStage({
  still,
  stillId,
  onClose,
}: {
  still: { src: string; title: string; body: string; teaching?: boolean; video?: string; photo?: boolean };
  stillId?: string;
  onClose: () => void;
}) {
  const showLoop = stillId === "pwr" || stillId === "mural_criticality" || (still.src.includes("cutaway_pwr_loop") && stillId !== "bwr");
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#16110d]" data-testid="still-stage">
      <div className="relative min-h-0 flex-1">
        {still.video ? (
          <video
            key={still.video}
            src={still.video}
            poster={still.src}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : (
          <img
            src={still.src}
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            style={{ imageRendering: still.photo ? "auto" : "pixelated" }}
          />
        )}
      </div>
      <div className="shrink-0 border-t border-border bg-bg-elevated px-4 py-3 pb-6">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-lg text-fg">{still.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{still.body}</p>
              {still.teaching ? <p className="mt-1 text-xs text-subtle">Teaching model only — not a license.</p> : null}
            </div>
            <button type="button" className="btn-primary shrink-0" onClick={onClose}>
              Back
            </button>
          </div>
          {showLoop ? (
            <div className="mt-3">
              <LoopSchematic />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AcademyQuiz({
  options,
}: {
  options: { id: string; label: string; ok: boolean; good: string; bad: string }[];
}) {
  const [pick, setPick] = useState<string | null>(null);
  return (
    <div className="mt-4 flex flex-col gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={
            "rounded-md border px-3 py-2.5 text-left text-sm " +
            (pick === o.id
              ? o.ok
                ? "border-good bg-good/20 text-fg"
                : "border-bad bg-bad/20 text-fg"
              : "border-border bg-surface text-fg hover:border-border-strong")
          }
          onClick={() => setPick(o.id)}
        >
          {o.label}
          {pick === o.id ? (o.ok ? " — " + o.good : " — " + o.bad) : ""}
        </button>
      ))}
    </div>
  );
}

function AcademyStage({
  index,
  done,
  plant,
  onPlant,
  onPrev,
  onNext,
  onJump,
  onTrainer,
  onShuffle,
  onDelay,
  onRods,
  onPhys,
  onLoad,
  onMc,
  onClose,
  canShuffle = false,
}: {
  index: number;
  done: boolean[];
  plant: PlantDesign | null;
  onPlant: (p: PlantDesign) => void;
  onPrev: () => void;
  onNext: () => void;
  onJump: (i: number) => void;
  onTrainer: () => void;
  onShuffle: () => void;
  onDelay: () => void;
  onRods: () => void;
  onPhys: () => void;
  onLoad: () => void;
  onMc: () => void;
  onClose: () => void;
  canShuffle?: boolean;
}) {
  const page = ACADEMY[index];
  const still = STILLS[page.still];
  const tracks: { id: NonNullable<(typeof ACADEMY)[number]["track"]>; label: string }[] = [
    { id: "culture", label: "Culture" },
    { id: "heat", label: "Heat" },
    { id: "safety", label: "Safety" },
    { id: "physics", label: "Physics" },
    { id: "fuel", label: "Fuel" },
  ];
  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-bg px-4 pb-28 pt-16 sm:px-8" data-testid="academy-stage">
      <div className="teach-grid">
        <div className="teach-span-12">
          <TeachMeta>
            UNIT 1 · PRIYA · {index + 1}/{ACADEMY.length} · {done.filter(Boolean).length} read · teaching only
          </TeachMeta>
          <div className="mt-2 flex flex-wrap gap-1">
            {tracks.map((t) => {
              const jump = ACADEMY.findIndex((p) => p.track === t.id);
              const on = page.track === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={"px-2 py-1 font-mono text-[10px] tracking-widest " + (on ? "instrument text-fg" : "border border-border text-subtle")}
                  onClick={() => jump >= 0 && onJump(jump)}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <h2 className="teach-title mt-3">{page.title}</h2>
        </div>
        <div className="teach-span-7">
          <TeachPriya line={page.body} size={96} />
          <p className="mt-2 text-[11px] text-subtle">Teaching model only — not a license. k-numbers stay classroom proxies.</p>
        {page.extra === "trainer" && (
          <button type="button" className="btn-primary mt-4" onClick={onTrainer}>
            Open ΔT bench
          </button>
        )}
        {page.extra === "shuffle" && (
          canShuffle ? (
            <button type="button" className="btn-primary mt-4" onClick={onShuffle}>
              Open fuel shuffle
            </button>
          ) : (
            <p className="mt-3 text-sm text-muted">Unlock the full-core lattice in the designer, or wait for Friday. Teaching only.</p>
          )
        )}
        {page.extra === "fluids" && (
          <p className="mt-3 font-mono text-xs text-good">
            IN cold leg → downcomer → lower plenum → core up → OUT hot leg → steam generator. PWR classroom ~16 MPa, liquid. BWR boils in-vessel instead. Teaching only.
          </p>
        )}
        {page.extra === "anatomy" && (
          <ul className="mt-4 space-y-1 text-left text-sm text-muted">
            {[
              "Reactor pressure vessel — thick steel, ~16 MPa classroom",
              "CRDMs on the head — rods from above",
              "Downcomer annulus · core barrel · fuel assemblies",
              "Hot leg · steam generator U-tubes (heat leaves here)",
              "Cold leg · reactor coolant pump",
              "Pressurizer — keeps the primary from boiling",
            ].map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        {page.extra === "alara" && (
          <AcademyQuiz
            options={[
              { id: "hero", label: "Stand in the shine until you are sure.", ok: false, good: "", bad: "That is how rooms go blind." },
              { id: "good", label: "Binoculars from the platform. Two minutes. Then leave.", ok: true, good: "ALARA. Time, distance, still seeing.", bad: "" },
              { id: "far", label: "Don't look. Distance is infinite if you never see it.", ok: false, good: "", bad: "Infinite distance is another kind of hide." },
            ]}
          />
        )}
        {page.extra === "barriers" && (
          <ul className="mt-4 space-y-1 text-left text-sm text-muted">
            {[
              "Fuel ceramic — the split happens here",
              "Clad — first wall the water is allowed to see",
              "Reactor coolant system — the pressure boundary",
              "Containment — last wall before the weather",
              "People who still look — the cheap layer",
            ].map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        {page.extra === "barriers" && (
          <p className="mt-2 font-mono text-[11px] text-good/80">
            PWR/BWR live on those four walls. MSR has no pellet and no clad — the salt is the fuel, graphite and a freeze-plug drain are the cheap layers. Pebble: SiC on each TRISO is the particle's own vessel.
          </p>
        )}
        {page.extra === "star" && (
          <AcademyQuiz
            options={[
              { id: "skip", label: "Twist it. Review later if it hisses.", ok: false, good: "", bad: "Faster is how occurrence reports get born." },
              { id: "star", label: "Stop. Think. Act. Review. The hiss is the stop.", ok: true, good: "STAR. Questioning attitude is a protocol.", bad: "" },
              { id: "hero", label: "If you know the plant, skip the tag.", ok: false, good: "", bad: "Knowing is how pride skips the sentence." },
            ]}
          />
        )}
        {page.extra === "comms" && (
          <AcademyQuiz
            options={[
              { id: "nod", label: "A nod is enough if you both heard it.", ok: false, good: "", bad: "A nod is how blanks get initials." },
              { id: "three", label: "Say it. Hear it back. Acknowledge.", ok: true, good: "Three-way. Elena will not be the only name.", bad: "" },
              { id: "after", label: "Write it after the shift if it mattered.", ok: false, good: "", bad: "After is how hides grow." },
            ]}
          />
        )}
        {page.extra === "reactivity" && (
          <>
            <AcademyQuiz
              options={[
                { id: "pull", label: "Count rate jumped. Pull more rods to catch it.", ok: false, good: "", bad: "Prompt is a cliff. Stop." },
                { id: "stop", label: "Count rate jumped. Stop. Period is shortening.", ok: true, good: "Reactivity management. The delay is the clock.", bad: "" },
                { id: "wait", label: "Green board. Wait and see.", ok: false, good: "", bad: "Green boards hide expensive rooms." },
              ]}
            />
            <button type="button" className="btn-primary mt-4" onClick={onDelay} data-testid="play-delay">
              Play DELAY.CAB
            </button>
          </>
        )}
        {page.extra === "six" && (
          <>
            <p className="mt-3 font-mono text-xs text-good">
              k∞ = ε · p · f · η. Then two non-leakage doors. Rod ≈ k∞. Core ≈ k∞ × PNL. A pin is not a plant.
            </p>
            <button type="button" className="btn-primary mt-4" onClick={onPhys} data-testid="play-phys">
              Play PHYS.CAB
            </button>
          </>
        )}
        {page.extra === "mc" && (
          <>
            <p className="mt-3 font-mono text-xs text-good">
              Analog generation k. Fire the bank. σ ~ 1/√G. Implicit capture is an event. OpenMC stays a letter.
            </p>
            <button type="button" className="btn-primary mt-4" onClick={onMc} data-testid="play-mc">
              Play analog MC
            </button>
          </>
        )}
        {page.extra === "feedback" && (
          <AcademyQuiz
            options={[
              { id: "pos", label: "Hotter fuel should raise k. More splits.", ok: false, good: "", bad: "Doppler fattens resonances. k falls. Negative is the catch." },
              { id: "dop", label: "Hot fuel fattens U-238 traps. k falls. Prompt, negative.", ok: true, good: "Doppler. The pellet argues with you.", bad: "" },
              { id: "void", label: "Void the PWR on purpose to raise power.", ok: false, good: "", bad: "This site is a PWR. Void is not a knob." },
            ]}
          />
        )}
        {page.extra === "xenon" && (
          <>
            <AcademyQuiz
              options={[
                { id: "go", label: "Trip, then restart as soon as the board is green.", ok: false, good: "", bad: "Iodine is still feeding xenon. The pit is hours away." },
                { id: "pit", label: "After a trip, xenon climbs. Wait, or already have the boron.", ok: true, good: "Iodine pit. The core is still changing.", bad: "" },
                { id: "fuel", label: "Xenon is extra fuel. Burn it out by pulling rods.", ok: false, good: "", bad: "Xe-135 eats neutrons. It is not fuel." },
              ]}
            />
            <button type="button" className="btn-primary mt-4" onClick={onLoad} data-testid="play-load">
              Play LOAD.CAB
            </button>
          </>
        )}
        {page.extra === "lototo" && (
          <AcademyQuiz
            options={[
              { id: "green", label: "Board is green. Twist it. Tag it after.", ok: false, good: "", bad: "A leftover IN SERVICE tag is how people go home late." },
              { id: "try", label: "Lock. Tag. Try. Zero energy. Then the hand.", ok: true, good: "LOTOTO. Isolation is a sentence.", bad: "" },
              { id: "tommy", label: "Tommy can hang it later. You're faster.", ok: false, good: "", bad: "Faster is how occurrence reports get born." },
            ]}
          />
        )}
        {page.extra === "verify" && (
          <AcademyQuiz
            options={[
              { id: "same", label: "Two people watching the same twist is independent.", ok: false, good: "", bad: "That is concurrent. Independent walks away and comes back." },
              { id: "two", label: "Two people, two times, one component. Own eyes.", ok: true, good: "Independent verification. Marcus will write it once.", bad: "" },
              { id: "one", label: "One good engineer is enough if they are sure.", ok: false, good: "", bad: "Sure is how stickers walk a decimal." },
            ]}
          />
        )}
        {page.extra === "conservative" && (
          <AcademyQuiz
            options={[
              { id: "fine", label: "Probably fine. Keep the board green.", ok: false, good: "", bad: "Proceeding because green is how rooms go expensive." },
              { id: "prove", label: "Prove it is safe to go — not unsafe to stop.", ok: true, good: "Conservative decision-making. Stop-work is allowed.", bad: "" },
              { id: "holt", label: "Holt wants volume, so keep moving.", ok: false, good: "", bad: "Holt wants times. A hide is not volume." },
            ]}
          />
        )}
        {page.extra === "period" && (
          <>
            <p className="mt-3 font-mono text-xs text-good">
              Delayed: T ≈ (β − ρ) / (λ̄ ρ) — a slope. Prompt: T ≈ ℓ / ρ — a cliff. ℓ ~ 10⁻⁴ s thermal. If the count rate surprises you, stop.
            </p>
            <button type="button" className="btn-primary mt-4" onClick={onDelay}>
              Play DELAY.CAB
            </button>
          </>
        )}
        {page.extra === "beta" && (
          <>
            <AcademyQuiz
              options={[
                { id: "more", label: "You want more β. Higher is safer, always.", ok: false, good: "", bad: "β is a mix, not a trophy. Know where the cliff is." },
                { id: "dollar", label: "ρ / β. One dollar is prompt-critical. We do not live there.", ok: true, good: "Dollars name the cliff. Delayed neutrons are the clock.", bad: "" },
                { id: "switch", label: "k is a switch. Delayed is a footnote.", ok: false, good: "", bad: "k has no clock on these cards. The floor does." },
              ]}
            />
            <button type="button" className="btn-ghost mt-3" onClick={onRods}>
              Play ROD.BANK
            </button>
          </>
        )}
        {page.extra === "types" && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(["pwr", "bwr", "pebble", "msr"] as const).map((id) => (
              <div key={id} className={"overflow-hidden border " + (plant?.type === id ? "border-accent bg-[#f3e6d0]" : "border-border bg-surface")}>
                <img
                  src={TYPE_THUMB[id] ?? STILLS[id].src}
                  alt=""
                  className="h-16 w-full object-contain teach-pixel"
                  style={{ imageRendering: "pixelated" }}
                />
                <p className={"px-2 pt-2 text-xs font-medium " + (plant?.type === id ? "text-[#16110d]" : "text-fg")}>{STILLS[id].title}</p>
                <p className={"px-2 pb-2 text-[11px] leading-snug " + (plant?.type === id ? "text-[#3a2818]" : "text-muted")}>{STILLS[id].body}</p>
              </div>
            ))}
          </div>
        )}
        {page.extra === "msr" && (
          <div className="mt-4 grid gap-3">
            {(["msr", "msr_fhr", "msr_fast"] as const).map((id) => (
              <div key={id} className="overflow-hidden rounded-md border border-border bg-surface">
                {STILLS[id].video ? (
                  <video
                    src={STILLS[id].video}
                    poster={STILLS[id].src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="aspect-video w-full object-cover"
                  />
                ) : (
                  <img src={STILLS[id].src} alt="" className="aspect-video w-full object-contain teach-pixel" style={{ imageRendering: "pixelated" }} />
                )}
                <p className="px-2 pt-2 text-xs font-medium text-fg">{STILLS[id].title}</p>
                <p className="px-2 pb-2 text-[11px] leading-snug text-muted">{STILLS[id].body}</p>
              </div>
            ))}
            <p className="font-mono text-[11px] text-good/80">
              Circulating fuel: some delayed-neutron precursors are born in the pipe, not the core. β_eff is smaller than β. FHR does not have that sentence — the fuel sits still. Teaching proxy.
            </p>
          </div>
        )}
        {(page.extra === "lab" || page.extra === "export") && plant && (
          <NuclearDesk plant={plant} onChange={onPlant} compact={page.extra === "export"} showExport />
        )}
        {page.extra === "lab" && (
          <button type="button" className="btn-primary mt-4" onClick={onPhys} data-testid="play-phys-lab">
            Play PHYS.CAB
          </button>
        )}
        {(page.extra === "lab" || page.extra === "export") && !plant && (
          <p className="mt-3 text-sm text-muted">Sign a unit with Priya first. The desk needs a design.</p>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={onPrev}>
            Previous
          </button>
          <button type="button" className="btn-ghost" onClick={onNext}>
            Next
          </button>
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
        </div>
        <div className="teach-span-5">
          {still ? (
            <div className="teach-ink">
              <p className="teach-kicker">{still.title} · teaching only</p>
              <img
                src={still.src}
                alt=""
                className="mt-2 aspect-video w-full object-contain teach-pixel"
                style={{ imageRendering: "pixelated" }}
              />
              <p className="mt-2 text-[12px] leading-relaxed text-[#b5a48c]">{still.body}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MuteToggle() {
  const [mute, setMute] = useState(isMuted());
  return (
    <button
      type="button"
      data-testid="mute"
      className="btn-ghost"
      onClick={() => {
        unlockAudio();
        setMuted(!mute);
        setMute(!mute);
      }}
    >
      {mute ? "Sound off" : "Sound on"}
    </button>
  );
}

function PauseStage({
  s,
  stage,
  onResume,
  onSave,
  onAcademy,
  onArcade,
  onClose,
  onMenu,
  onNewWeek,
  onTravel,
}: {
  s: GameState;
  stage: string;
  onResume: () => void;
  onSave: () => void;
  onAcademy: () => void;
  onArcade: () => void;
  onClose: () => void;
  onMenu: () => void;
  onNewWeek: () => void;
  onTravel: (id: RoomId) => void;
}) {
  const [focus, setFocus] = useState<RoomId>(s.room);
  const here = npcsHere(s);
  const k = s.plant ? computeKeff(s.plant) : null;
  const visited = !!s.flags[`seen:${focus}`];
  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-bg/80 px-4 pb-28 pt-16 sm:px-8" data-testid="pause-stage">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="instrument inline-block px-2 py-1 font-mono text-[11px] tracking-widest text-fg">
            SHIFT PAUSED · DAY {s.day} · {s.timeLabel} · {stage}
          </p>
          <h2 className="font-display mt-2 text-2xl">Plant map</h2>
          <MiniMap room={s.room} focus={focus} onFocus={setFocus} flags={s.flags} onTravel={onTravel} period={s.period} />
          <p className="mt-2 grid grid-cols-3 gap-1 font-mono text-[10px] text-subtle">
            <span>Cafe · Lot · Hall</span>
            <span>Control · Core</span>
            <span>Eng · Maint · Break · Arcade</span>
          </p>
          <p className="mt-2 text-sm text-fg">{ROOM_BLURB[focus]}</p>
          <p className="font-mono text-[11px] text-subtle">{ROOM_LINKS[focus]} · teaching layout — not a license</p>
          {focus !== s.room && visited ? (
            <button type="button" className="btn-primary mt-2" onClick={() => onTravel(focus)}>
              Walk there
            </button>
          ) : focus !== s.room ? (
            <p className="mt-2 font-mono text-[11px] text-subtle">Walk there first. The map remembers rooms you have stood in.</p>
          ) : null}
          <ul className="mt-4 space-y-1 text-sm text-subtle">
            {s.goals.map((g) => (
              <li key={g.id} className={g.done ? "text-good" : ""}>
                {g.done ? "Done · " : "Open · "}
                {g.label}
              </li>
            ))}
          </ul>
          {s.weekLog.length > 0 ? (
            <div className="mt-4" data-testid="week-log-pause">
              <p className="font-mono text-[10px] tracking-widest text-subtle">WEEK LOG</p>
              <ul className="mt-1 space-y-1 text-sm text-muted">
                {s.weekLog.slice(-6).map((e, i) => (
                  <li key={`${e.day}-${e.kind}-${i}`}>{e.text}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="mt-3 text-sm text-muted">
            In {ROOMS[s.room].name} now:{" "}
            {here.length ? here.map((n) => NPCS[n.id].name.split(" ")[0]).join(", ") : "just you"}
          </p>
          {k && s.plant ? (
            <p className="mt-2 font-mono text-xs text-good">
              {plantTitle(s.plant)} · k∞ {k.kInf.toFixed(3)} · core {k.kCore.toFixed(3)} · teaching proxy
            </p>
          ) : null}
        </div>
        <div>
          <h2 className="font-display text-2xl">Relationships</h2>
          <p className="mt-1 text-xs text-subtle">Hearts are trust. Departments move when people do.</p>
          <div className="mt-3 space-y-2">
            {(Object.keys(NPCS) as NpcId[]).map((id) => {
              const met = !!s.flags[`${id}Talked`];
              return (
                <div key={id} className="flex items-center justify-between gap-2 border border-border bg-surface px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <img src={`/art/gen/portraits/${id}_talk.png?v=eval1`} alt="" className="h-8 w-8 object-contain" />
                    <div>
                    <div className="text-sm text-fg">{NPCS[id].name}</div>
                    <div className="text-[11px] text-subtle">
                      {NPCS[id].role} · {met ? trustState(s.trust[id]) : "Not introduced"}
                    </div>
                    {met ? <div className="text-[11px] text-muted">{relationLine(id, s.flags, s.trust[id])}</div> : null}
                    <div className="text-[11px] text-[#8a7864]">{met ? NPC_INTRO[id].who : NPC_INTRO[id].beat}</div>
                    </div>
                  </div>
                  {met ? <HeartRow n={heartCount(s.trust[id])} /> : <span className="text-[11px] text-subtle">—</span>}
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted">
            {DEPARTMENTS.map((d) => {
              const avg = d.members.reduce((n, id) => n + s.trust[id], 0) / d.members.length;
              return (
                <div key={d.id} className="border border-border px-2 py-1">
                  {d.label}
                  <div className="text-fg">{trustState(avg)}</div>
                </div>
              );
            })}
          </div>
          {s.plant ? <p className="mt-3 font-mono text-xs text-good">{plantTitle(s.plant)}</p> : null}
          <div className="mt-5 flex flex-col gap-2">
            <button type="button" className="btn-primary" onClick={onResume}>
              Resume
            </button>
            <button type="button" className="btn-ghost" onClick={onSave}>
              Save shift
            </button>
            <MuteToggle />
            <button type="button" className="btn-ghost" onClick={onAcademy}>
              Academy
            </button>
            <button type="button" className="btn-ghost" onClick={onArcade}>
              Mabel's arcade
            </button>
            <button type="button" className="btn-ghost" onClick={onClose}>
              Close shift
            </button>
            <button type="button" className="btn-ghost" onClick={onMenu}>
              Main menu
            </button>
            <button type="button" className="btn-ghost" data-testid="pause-new-week" onClick={onNewWeek}>
              New week
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniMap({
  room,
  focus,
  onFocus,
  flags,
  onTravel,
  period,
}: {
  room: string;
  focus?: RoomId;
  onFocus?: (id: RoomId) => void;
  flags?: Record<string, boolean>;
  onTravel?: (id: RoomId) => void;
  period?: string;
}) {
  const hud = MAP_HUD[room as RoomId] ?? MAP_HUD.cafe;
  const active = focus ?? (room as RoomId);
  const wash =
    period === "afternoon" ? "rgba(61,92,102,0.28)" : period === "morning" ? "rgba(196,120,58,0.16)" : "transparent";
  return (
    <div className="relative mt-3 w-full border border-border bg-[#12100e]" aria-label="Plant map">
      <img
        src="/art/gen/ui/site_plan.png?v=art101"
        alt=""
        width={320}
        height={180}
        className="w-full"
        style={{ imageRendering: "pixelated" }}
      />
      <span className="pointer-events-none absolute inset-0" style={{ background: wash }} />
      {(Object.keys(MAP_HUD) as RoomId[]).map((id) => {
        const p = MAP_HUD[id];
        const on = id === room;
        const lit = id === active;
        const seen = !!flags?.[`seen:${id}`];
        return (
          <button
            key={id}
            type="button"
            className={
              "absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[9px] tracking-wide " +
              (on ? "text-[#c9a227]" : lit ? "text-[#f3e6d0]" : seen ? "text-[#f3e6d0]/80" : "text-[#f3e6d0]/35")
            }
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            onClick={() => {
              if (id === active && seen && id !== room) onTravel?.(id);
              else onFocus?.(id);
            }}
          >
            {p.label}
          </button>
        );
      })}
      <img
        src="/art/gen/ui/pip.png?v=art101"
        alt=""
        className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${hud.x}%`, top: `${hud.y}%`, imageRendering: "pixelated" }}
      />
    </div>
  );
}

function MenuBackdrop({ scene }: { scene?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduce, setReduce] = useState(false);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    const v = videoRef.current;
    if (!v || reduce) return;
    const play = () => {
      v.muted = true;
      void v.play().catch(() => {});
    };
    play();
    const unlock = () => play();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [reduce]);
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-bg">
      {scene ? (
        <img src={scene} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          {(!live || reduce) && (
            <img
              src="/art/gen/stills/plate_lake.png?v=waveF"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {!reduce && (
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster="/art/menu-still.jpg"
              onPlaying={() => setLive(true)}
              onError={() => setLive(false)}
            >
              <source src="/art/menu-loop.mp4" type="video/mp4" />
            </video>
          )}
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-bg/25 to-bg/30" />
    </div>
  );
}

function LookPreview({ look }: { look: PlayerLook }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const im = new Image();
    im.src = "/art/gen/sprites/player_idle_32.png?v=hair3";
    im.onload = () => {
      const tinted = tintPlayer(im, look);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tinted as CanvasImageSource, 0, 0, 32, 64, 0, 0, 128, 256);
    };
  }, [look]);
  return <canvas ref={ref} width={128} height={256} className="h-32 w-16" aria-hidden />;
}

function Panel({
  children,
  dim,
  onActivate,
  hint,
}: {
  children: ReactNode;
  dim?: boolean;
  onActivate?: () => void;
  hint?: string;
}) {
  return (
    <div
      className={
        "absolute inset-0 z-30 flex flex-col items-center justify-center overflow-y-auto px-5 pb-28 pt-24 " +
        (dim ? "bg-bg/70 backdrop-blur-[2px]" : "bg-transparent")
      }
      onPointerDown={
        onActivate
          ? (e) => {
              if (e.button !== 0) return;
              onActivate();
            }
          : undefined
      }
      onClick={onActivate}
    >
      <div className="stage-copy flex w-full max-w-xl flex-col items-center text-center">
        {children}
        {hint ? <p className="stage-hint mt-4 text-sm">{hint}</p> : null}
      </div>
    </div>
  );
}

function Hud({
  room,
  roomId,
  culture,
  stage,
  time,
  period,
  toast,
  objective,
  day,
  nearLabel,
}: {
  room: string;
  roomId: RoomId;
  culture: number;
  stage: string;
  time: string;
  period: Period;
  toast: string;
  objective: string;
  day: number;
  nearLabel: string;
}) {
  const hud = MAP_HUD[roomId] ?? MAP_HUD.cafe;
  const wash =
    period === "afternoon" ? "rgba(61,92,102,0.28)" : period === "morning" ? "rgba(196,120,58,0.16)" : "transparent";
  return (
    <>
      <div className="instrument pointer-events-none absolute left-3 top-14 z-10 px-2.5 py-2 sm:left-4 sm:top-16" data-testid="instrument">
        <div className="flex items-baseline gap-2 font-mono text-[11px]">
          <span className="text-base tabular leading-none text-fg">{time}</span>
          <span className="text-muted">
            Day {day} · {periodLabel(period)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-fg">
          <img src="/art/gen/ui/pip.png?v=art101" alt="" className="h-2 w-2" style={{ imageRendering: "pixelated" }} />
          {room}
        </div>
        <div className="relative mt-2 hidden h-[45px] w-[80px] border border-border sm:block" data-testid="site-plan">
          <img
            src="/art/gen/ui/site_plan.png?v=art101"
            alt=""
            width={80}
            height={45}
            className="h-full w-full"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="pointer-events-none absolute inset-0" style={{ background: wash }} />
          <span
            className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 bg-warn"
            style={{ left: `${hud.x}%`, top: `${hud.y}%` }}
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-display text-xs text-fg">{stage}</span>
          <div className="h-1 w-14 overflow-hidden bg-surface" aria-hidden>
            <div className="h-full bg-accent" style={{ width: `${Math.max(4, Math.min(100, culture))}%` }} />
          </div>
        </div>
        <p className="font-display mt-1 max-w-[12.5rem] text-sm leading-snug text-muted">{objective}</p>
      </div>
      {nearLabel ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-10 z-20 flex justify-center px-4 sm:bottom-8">
          <p className="border border-accent bg-bg-elevated px-3 py-1.5 font-mono text-sm tracking-wide text-fg">
            E · {nearLabel}
          </p>
        </div>
      ) : null}
      {toast && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-10 flex justify-center px-4 sm:bottom-10">
          <div className="max-w-lg border border-border bg-bg-elevated/92 px-3 py-2 text-center font-display text-sm text-fg">
            {toast}
          </div>
        </div>
      )}
    </>
  );
}

function Choice({ k, label, onClick }: { k: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onPointerDown={onClick}
      className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5 text-left hover:border-border-strong hover:bg-surface-hot"
    >
      <span className="grid h-8 w-8 place-items-center rounded-sm border border-border-strong text-xs font-medium text-fg">
        {k}
      </span>
      <span className="text-sm text-fg">{label}</span>
    </button>
  );
}

function TouchPad({
  stickRef,
  edges,
}: {
  stickRef: MutableRefObject<{ x: number; y: number; active: boolean }>;
  edges: MutableRefObject<Set<string>>;
}) {
  const origin = useRef<{ id: number; x: number; y: number } | null>(null);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-between p-3 pb-20 sm:pb-3">
      <div
        className="pointer-events-auto h-32 w-32 rounded-full border border-border bg-bg-elevated/50"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          origin.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
          stickRef.current.active = true;
        }}
        onPointerMove={(e) => {
          if (!origin.current || origin.current.id !== e.pointerId) return;
          const dx = e.clientX - origin.current.x;
          const dy = e.clientY - origin.current.y;
          const m = Math.hypot(dx, dy);
          const dz = 12;
          if (m < dz) {
            stickRef.current.x = 0;
            stickRef.current.y = 0;
            return;
          }
          const scale = Math.min(1, (m - dz) / 48);
          stickRef.current.x = (dx / m) * scale;
          stickRef.current.y = (dy / m) * scale;
        }}
        onPointerUp={() => {
          origin.current = null;
          stickRef.current = { x: 0, y: 0, active: false };
        }}
        onPointerCancel={() => {
          origin.current = null;
          stickRef.current = { x: 0, y: 0, active: false };
        }}
      />
      <div className="pointer-events-auto grid grid-cols-2 gap-2">
        {(
          [
            ["E", "KeyE"],
            ["P", "KeyP"],
            ["R", "KeyR"],
            ["H", "KeyH"],
          ] as const
        ).map(([label, code]) => (
          <button
            key={code}
            type="button"
            className="h-12 w-12 rounded-full border border-border bg-bg-elevated/85 text-sm font-medium text-fg"
            onPointerDown={(e) => {
              e.preventDefault();
              edges.current.add(code);
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function collectActions(
  keys: Set<string>,
  edges: Set<string>,
  stick: { x: number; y: number; active: boolean },
): Actions {
  const a = emptyActions();
  if (keys.has("KeyA") || keys.has("ArrowLeft")) a.moveX -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) a.moveX += 1;
  if (keys.has("KeyW") || keys.has("ArrowUp")) a.moveY -= 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) a.moveY += 1;
  if (typeof navigator !== "undefined") {
    const pads = navigator.getGamepads?.() ?? [];
    for (const pad of pads) {
      if (!pad) continue;
      const lx = pad.axes[0] ?? 0;
      const ly = pad.axes[1] ?? 0;
      const m = Math.hypot(lx, ly);
      if (m >= 0.18) {
        const scale = (m - 0.18) / (1 - 0.18);
        a.moveX += (lx / m) * scale;
        a.moveY += (ly / m) * scale;
      }
      if (pad.buttons[12]?.pressed) a.moveY -= 1;
      if (pad.buttons[13]?.pressed) a.moveY += 1;
      if (pad.buttons[14]?.pressed) a.moveX -= 1;
      if (pad.buttons[15]?.pressed) a.moveX += 1;
      if (pad.buttons[0]?.pressed) edges.add("KeyE");
    }
  }
  if (stick.active) {
    a.moveX += stick.x;
    a.moveY += stick.y;
  }
  a.moveX = Math.max(-1, Math.min(1, a.moveX));
  a.moveY = Math.max(-1, Math.min(1, a.moveY));
  a.interact = edges.has("KeyE");
  a.peer = edges.has("KeyP");
  a.report = edges.has("KeyR");
  a.hide = edges.has("KeyH");
  a.confirm = edges.has("Space") || edges.has("Enter");
  a.heldConfirm = keys.has("Space") || keys.has("Enter");
  a.back = edges.has("Escape");
  a.pause = edges.has("Escape");
  return a;
}

function paint(
  canvas: HTMLCanvasElement | null,
  wrap: HTMLDivElement | null,
  s: GameState,
  now: number,
  dt: number,
) {
  if (!canvas || !wrap) return;
  const rect = wrap.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.floor(rect.width));
  const h = Math.max(1, Math.floor(rect.height));
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawWorld(ctx, s, w, h, now, dt);
}

declare global {
  interface Window {
    __controlsTest?: {
      getX: () => number;
      getY: () => number;
      getFacing: () => string;
      getRoom: () => string;
      getMode: () => string;
      getMinutes: () => number;
      getPeriod: () => string;
      getMural: () => number;
      getDay: () => number;
      setKeys: (codes: string[]) => void;
      begin: () => void;
      bootPlay: () => void;
      warp: (room: string, x: number, y: number) => void;
      setMinutes: (n: number) => void;
      finishBuild: () => void;
      setDay: (n: number) => void;
      getPlant: () => unknown;
      save: () => boolean;
      load: () => boolean;
      hasSave: () => boolean;
      wipe: () => boolean;
      getObjective: () => string;
      getCatch: () => number;
      setFlag: (k: string, v: boolean) => void;
      canClose: () => boolean;
      reportHere: () => void;
      travel: (room: string) => void;
      startTalk: (npc: string) => void;
      openIncident: () => void;
      setIntro: (i: number) => void;
      setBuild: () => void;
      setAcademy: (i: number) => void;
      openStillId: (id: string) => void;
      getAcademyTitle: () => string;
      forceEod: () => void;
      beginEnding: () => void;
      choose: (id: string) => void;
      getFlags: () => Record<string, boolean>;
      getWeekLog: () => { day: number; kind: string; text: string }[];
      getNpcs: () => string[];
      openCab: (id: string) => void;
      getEnded: () => "a" | "c" | null;
      getTimeLabel: () => string;
      getClosePrompt: () => boolean;
      getSitting: () => boolean;
      getMoving: () => boolean;
      getPhase: () => number;
      getAudio: () => {
        muted: boolean;
        bed: string | null;
        period: string | null;
        duck: number;
        ctx: string;
        steam: number;
        core: number;
        unlocked: boolean;
      };
      pose: (opts: {
        x?: number;
        y?: number;
        facing?: string;
        phase?: number;
        moving?: boolean;
        sitting?: boolean;
        hold?: number;
      }) => void;
    };
  }
}
