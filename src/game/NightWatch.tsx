/**
 * Night Watch: the overnight shift. The window shows the nights; starting one takes the whole screen.
 * Model: nightwatch/model.ts. Cameras: nightwatch/cameras.ts. Progress: flags "night:<n>:done".
 *
 * Controls: Space or the tablet button lifts and lowers the camera tablet; 1 to 8 switch cameras;
 * R opens the report; B brews coffee. Every control is also a button, sized for a thumb.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { PAL } from "./palette";
import { bumpTrust, pushMsg, type GameState } from "./sim";
import { writeSave } from "./save";
import { siteKind } from "./plantLoops";
import { CAM_H, CAM_PX, CAM_W, lookOf, paintCamera, resetFrameCaches } from "./nightwatch/cameras";
import { loadPlates, releasePlates } from "./nightwatch/plates";
import { startAmbience, stopAmbience } from "./nightwatch/ambience";
import { juiceClass, prefersReducedMotion } from "./reducedMotion";
import { binds } from "./binds";
import { shiftHeld } from "./hold";
import {
  CATEGORY_LABEL,
  COFFEE,
  FALSE_REPORT_LIMIT,
  NIGHT_MINUTES,
  SECONDS_PER_MINUTE,
  alarms,
  brew,
  clock,
  fatigueOf,
  gameMinutes,
  liveOn,
  newNight,
  oddityOn,
  radio,
  readings,
  relieve,
  report,
  score,
  setTablet,
  tick,
  visualsOn,
  type Category,
  type Night,
} from "./nightwatch/model";
import { nightCoachLine } from "./nightwatch/nightCoach";
import { applyCarry, carryover } from "./nightwatch/carryover";
import { noteEndless, readEndless } from "./nightwatch/endless";
import { dawnCrewLine, noteARotation, readCrew } from "./nightwatch/crewUnlock";
import { paperLines, writePaper } from "./nightwatch/paper";
import { gazeReplay } from "./nightwatch/gazeReplay";
import { readDaily, recordDaily } from "./nightwatch/daily";
import { nightsDone } from "./nightwatch/progress";
import { noteCodexCamera, noteCodexCatch } from "./codex";
import { elenaLine, oddityNotes, openerLine, recordNight, turnoverRows } from "./nightwatch/turnover";

const SITE_LABEL = { pwr: "PWR", bwr: "BWR", pebble: "Pebble bed", msr: "Salt" } as const;

const MONO: CSSProperties = { fontFamily: "var(--font-mono, monospace)" };

function Btn({ onClick, children, danger, on, disabled, testId, title }: { onClick: () => void; children: ReactNode; danger?: boolean; on?: boolean; disabled?: boolean; testId?: string; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      title={title}
      style={{
        ...MONO,
        minHeight: 44,
        padding: "4px 10px",
        background: danger ? PAL.bad : on ? PAL.gold : PAL.ink,
        color: danger || on ? PAL.ink : PAL.goldL,
        border: `2px solid ${danger ? PAL.bad : PAL.goldL}`,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "default" : "pointer",
        fontSize: 12,
        letterSpacing: 1,
      }}
    >
      {children}
    </button>
  );
}

export function NightWatchApp({ s }: { s: GameState }) {
  const [running, setRunning] = useState<number | null>(null);
  const [daily, setDaily] = useState(false);
  const site = siteKind(s.plant);
  const board = readDaily();
  if (running !== null || daily) {
    return (
      <NightShift
        s={s}
        nightNo={running ?? 2}
        replay
        daily={daily}
        seed={daily ? board.seed : undefined}
        onLeave={() => {
          setRunning(null);
          setDaily(false);
        }}
      />
    );
  }
  const open = !!s.flags["rot:nights"];
  const done = open ? [1, 2, 3, 4].filter((k) => s.flags[`night:${k}:done`]) : [];
  return (
    <div className="app-pad" data-testid="app-nightwatch" style={{ fontFamily: "var(--font-body)", color: PAL.ink, lineHeight: 1.5 }}>
      <p style={{ margin: 0 }}>{open ? `Replay nights · ${SITE_LABEL[site]} Unit 1` : `Night Watch · ${SITE_LABEL[site]} Unit 1`}</p>
      <p style={{ fontSize: "var(--text-small)" }}>{open ? "A replay does not change Elena's trust or the grade on the log." : "Your night rotation starts after this week."}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        {open && done.length === 0 ? <p style={{ fontSize: "var(--text-small)" }}>No night is on the log yet.</p> : null}
        {done.map((k) => (
          <Btn key={k} onClick={() => setRunning(k)} testId={`night-${k}`}>
            Replay night {k}
          </Btn>
        ))}
        <Btn onClick={() => setDaily(true)} testId="night-daily">
          Daily night
        </Btn>
      </div>
      <p data-testid="daily-seed" style={{ fontSize: "var(--text-small)", marginTop: 8 }}>
        Seed {board.seed}
      </p>
      <div data-testid="daily-board" style={{ fontSize: "var(--text-small)" }}>
        {board.rows.length === 0 ? <p style={{ margin: 0 }}>No score yet today.</p> : board.rows.map((row, i) => <p key={`${row.at}-${i}`} style={{ margin: 0 }}>{row.points} {row.letter}</p>)}
      </div>
    </div>
  );
}

function NightShift({ s, nightNo: asked, onLeave, onStay, replay = false, endless = false, daily = false, seed }: { s: GameState; nightNo: number; onLeave: () => void; onStay?: () => void; replay?: boolean; endless?: boolean; daily?: boolean; seed?: number }) {
  const nightNo = useRef(asked).current;
  const site = siteKind(s.plant);
  const night = useRef<Night>(newNight(site, nightNo, seed));
  const n = night.current;
  const carried = useRef(false);
  if (!carried.current) {
    carried.current = true;
    n.replay = replay;
    if (!replay) applyCarry(n, carryover({ residue: s.residue, maintDone: s.maintDone, shuffleDone: s.shuffleDone, ended: s.ended, weekLog: s.weekLog }, nightNo));
  }
  const [, setFrame] = useState(0);
  const [reporting, setReporting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [toast, setToast] = useState<string>("");
  const [switching, setSwitching] = useState(0);
  const [bestNights, setBestNights] = useState<number | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    void loadPlates();
    startAmbience();
    calm.current = prefersReducedMotion();
    const api = window.__controlsTest;
    if (api) api.setNightSpeed = (n: number) => {
      speed.current = n;
    };
    return () => {
      const el = canvas.current;
      if (el) {
        el.width = 0;
        el.height = 0;
      }
      stopAmbience();
      resetFrameCaches();
      releasePlates();
      if (window.__controlsTest) delete window.__controlsTest.setNightSpeed;
    };
  }, []);
  const rewarded = useRef(false);
  const calm = useRef(false);
  const photo = useRef(false);
  const [photoOn, setPhotoOn] = useState(false);
  const [juice, setJuice] = useState("");
  const markJuice = (kind: string) => {
    if (prefersReducedMotion()) return;
    setJuice(kind);
    window.setTimeout(() => setJuice((cur) => (cur === kind ? "" : cur)), 450);
  };
  const speed = useRef(1);
  const seenAlarm = useRef("");
  const seenRadio = useRef(0);

  const rerender = () => setFrame((f) => f + 1);
  const say = (t: string) => {
    setToast(t);
    window.setTimeout(() => setToast((cur) => (cur === t ? "" : cur)), 3500);
  };

  const pickCamera = (id: string) => {
    if (!n.tablet) setTablet(n, true);
    if (n.camera !== id) {
      setSwitching(1);
      startAmbience()?.static();
    }
    n.camera = id;
    const scene = n.watch.cameras.find((c) => c.id === id)?.scene ?? "";
    noteCodexCamera(s.flags, scene, site);
    setReporting(false);
    rerender();
  };
  const toggleTablet = () => {
    if (!setTablet(n, !n.tablet)) say(n.brewing > 0 ? "The coffee is brewing." : "Too tired to focus. Brew coffee.");
    setReporting(false);
    rerender();
  };
  const doBrew = () => {
    if (!brew(n)) say(n.brewsLeft <= 0 ? "The pot is empty. No more tonight." : "Already brewing.");
    else markJuice("brew");
    rerender();
  };
  const file = (c: Category) => {
    const r = report(n, c);
    setReporting(false);
    if (r.ok) {
      if (r.event) noteCodexCatch(s.flags, r.event.def.id, r.event.def.accept);
      say(r.early ? "Logged before the board knew. The crew is on it." : "Logged. The crew is on it.");
      markJuice("catch");
    } else if (r.reason === "logged") say("Already logged. The crew is on it.");
    else say(r.reason === "wrong-kind" ? "That is not what is wrong there. Logged as a false report." : "Nothing safety-related on this camera. Logged as a false report.");
    rerender();
  };

  // The clock, coffee and plant run on real time while the shift is on.
  useEffect(() => {
    let last = performance.now();
    let acc = 0;
    let nextFeed = 0;
    let raf = 0;
    const loop = (now: number) => {
      if (shiftHeld()) {
        last = now;
        raf = requestAnimationFrame(loop);
        return;
      }
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      if (!n.over) tick(n, gameMinutes(dt, speed.current));
      setSwitching((v) => (v > 0 ? Math.max(0, v - dt * 3.5) : 0));
      const c = canvas.current?.getContext("2d");
      // Real CCTV is about 15 frames a second. The clock above this still moves every quarter second.
      if (c && n.tablet && now >= nextFeed) {
        nextFeed = now + 1000 / 15;
        const cam = n.watch.cameras.find((x) => x.id === n.camera)!;
        c.setTransform(CAM_PX, 0, 0, CAM_PX, 0, 0);
        paintCamera(c, cam.scene, visualsOn(n, cam.id), now / 1000, {
          switching: 0,
          tripped: n.over?.why === "trip",
          fatigue: calm.current ? 0 : fatigueOf(n),
          calm: calm.current,
          photo: photo.current,
        });
      }
      acc += dt;
      if (acc > 0.25) {
        acc = 0;
        rerender();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // The night lives in a ref; one loop per shift.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Static over the feed while it switches.
  useEffect(() => {
    const c = canvas.current?.getContext("2d");
    if (!c || !n.tablet || switching <= 0) return;
    const cam = n.watch.cameras.find((x) => x.id === n.camera)!;
    c.setTransform(CAM_PX, 0, 0, CAM_PX, 0, 0);
    paintCamera(c, cam.scene, visualsOn(n, cam.id), performance.now() / 1000, { switching: calm.current ? switching * 0.3 : switching, tripped: n.over?.why === "trip", calm: calm.current, photo: photo.current });
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (n.over) return;
      const b = binds();
      if (e.key === " " || e.code === b.confirm) {
        e.preventDefault();
        toggleTablet();
      } else if (/^[1-8]$/.test(e.key)) {
        const cam = n.watch.cameras[Number(e.key) - 1];
        if (cam) pickCamera(cam.id);
      } else if (e.code === b.report || e.key === "r" || e.key === "R") {
        if (n.tablet) setReporting((v) => !v);
      } else if (e.key === "b" || e.key === "B") doBrew();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A survived night: progress, and Elena's trust (she takes over at six).
  useEffect(() => {
    if (!n.over || rewarded.current) return;
    rewarded.current = true;
    const g = recordNight(s.flags, n, nightNo, replay || n.replay);
    if (endless && n.over) {
      const passed = n.over.why === "dawn" && (g.letter === "A" || g.letter === "B" || g.letter === "C");
      const survived = passed ? Math.max(0, nightNo - 4) : Math.max(0, nightNo - 5);
      setBestNights(noteEndless(survived, passed ? g.points : 0).nights);
    }
    if (daily) recordDaily(g.points, g.letter);
    if (!replay && !n.replay && g.trust) bumpTrust(s, "elena", g.trust);
    if (!replay && !n.replay) pushMsg(s, g.done ? `Night ${nightNo} watched. Grade ${g.letter}.` : `Night ${nightNo} is a ${g.letter}. Elena sends you back.`);
    if (!replay && !n.replay) writeSave(s, true);
    startAmbience()?.duck(true);
  });

  const r = readings(n);
  const lit = new Set(alarms(n, r));
  const tripped = n.over?.why === "trip";
  // Cameras flash red when something on them has set off an alarm.
  const camAlarm = new Set(
    n.events.filter((e) => e.caughtAt === null && n.minute >= e.start && Object.keys(e.def.effect).some((id) => lit.has(id))).map((e) => e.def.camera),
  );
  const anyAlarm = lit.size > 0 || tripped;
  useEffect(() => {
    startAmbience()?.setTension(tripped ? 1 : Math.min(1, lit.size / 3));
  }, [lit.size, tripped]);
  const alarmKey = [...camAlarm].sort().join(",");
  useEffect(() => {
    if (alarmKey && alarmKey !== seenAlarm.current) startAmbience()?.chime();
    seenAlarm.current = alarmKey;
  }, [alarmKey]);
  const radioLines = radio(n);
  const coach = nightCoachLine({
    night: n.night,
    minute: n.minute,
    tablet: n.tablet,
    camera: n.camera,
    falseReports: n.falseReports,
    oddityHere: oddityOn(n, n.camera) !== null,
    liveHere: liveOn(n, n.camera) !== null,
    events: n.events.map((e) => ({
      id: e.def.id,
      camera: e.def.camera,
      start: e.start,
      open: e.caughtAt === null && e.doneAt === null,
      flashing: e.caughtAt === null && e.doneAt === null && n.minute >= e.start && Object.keys(e.def.effect).some((id) => lit.has(id)),
      visual: e.def.visual,
      tiles: Object.keys(e.def.effect),
    })),
    catalog: [
      ...n.watch.events.map((e) => ({ id: e.id, camera: e.camera, visual: e.visual, tiles: Object.keys(e.effect) })),
      ...n.events
        .filter((e) => !n.watch.events.some((w) => w.id === e.def.id))
        .map((e) => ({ id: e.def.id, camera: e.def.camera, visual: e.def.visual, tiles: Object.keys(e.def.effect) })),
    ],
  });
  useEffect(() => {
    if (seenRadio.current && radioLines.length > seenRadio.current) startAmbience()?.squelch();
    seenRadio.current = radioLines.length;
  }, [radioLines.length]);
  const cam = n.watch.cameras.find((c) => c.id === n.camera)!;

  return (
    <div
      data-testid="nightwatch-shift"
      style={{ position: "fixed", inset: 0, zIndex: 60, background: PAL.ink, color: PAL.goldL, display: "flex", flexDirection: "column", ...MONO, overflow: "auto" }}
    >
      {juice ? <div className="cc-juice" data-testid="nw-juice" data-juice={juice} /> : null}
      <style>{`@keyframes nwflash { 0%,49% { background: ${PAL.bad}; color: ${PAL.ink} } 50%,100% { background: ${PAL.copperD}; color: ${PAL.goldL} } }`}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "6px 10px", borderBottom: `2px solid ${PAL.copperD}` }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <span data-testid="nw-clock" style={{ fontSize: 18, color: PAL.cream }}>
            {clock(n.minute)}
          </span>
          <span>
            NIGHT {nightNo} · {SITE_LABEL[site].toUpperCase()} UNIT 1
          </span>
          <span title="Coffee" data-testid="nw-coffee" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            ☕
            <span style={{ display: "inline-block", width: 80, height: 8, background: PAL.copperD }}>
              <span style={{ display: "block", height: 8, width: `${(n.coffee / COFFEE.max) * 80}px`, background: n.coffee < 20 ? PAL.bad : PAL.gold }} />
            </span>
            {n.brewing > 0 ? "brewing…" : `${n.brewsLeft} pot${n.brewsLeft === 1 ? "" : "s"} left`}
          </span>
          <span data-testid="nw-false">
            FALSE REPORTS {n.falseReports}/{FALSE_REPORT_LIMIT}
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <Btn onClick={doBrew} disabled={n.brewing > 0 || n.brewsLeft <= 0 || !!n.over} testId="nw-brew">
            Brew (B)
          </Btn>
          <Btn onClick={toggleTablet} on={n.tablet} disabled={!!n.over} testId="nw-tablet">
            {n.tablet ? "Lower tablet" : "Lift tablet"} (Space)
          </Btn>
          <Btn
            onClick={() => {
              if (replay || n.over) onLeave();
              else setLeaving(true);
            }}
            testId="nw-leave"
          >
            {replay ? (n.over ? "Back to the desk" : "Leave the shift") : n.over ? "Back to the desk" : "Leave the watch"}
          </Btn>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: 10, alignItems: "flex-start" }}>
        {/* Camera tablet */}
        <div style={{ flex: "1 1 340px", maxWidth: 700 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginBottom: 6 }} data-testid="nw-cams">
            {n.watch.cameras.map((c, k) => {
              const flash = camAlarm.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickCamera(c.id)}
                  disabled={!!n.over}
                  data-testid={`nw-cam-${c.id}`}
                  data-alarm={flash ? "1" : "0"}
                  aria-label={flash ? `${c.name}, alarm` : c.name}
                  style={{
                    ...MONO,
                    minHeight: 36,
                    fontSize: 10,
                    textAlign: "left",
                    padding: "3px 5px",
                    border: `2px solid ${n.camera === c.id && n.tablet ? PAL.cream : PAL.copperD}`,
                    background: PAL.ink,
                    color: PAL.goldL,
                    animation: flash ? "nwflash 0.8s infinite" : undefined,
                    cursor: "pointer",
                  }}
                >
                  CAM {k + 1}{flash ? " ▲" : ""}
                  <br />
                  {c.name}
                </button>
              );
            })}
          </div>
          <div style={{ position: "relative", width: "100%", aspectRatio: `${CAM_W} / ${CAM_H}`, background: PAL.ink, border: `2px solid ${PAL.copperD}` }}>
            <canvas
              ref={canvas}
              width={CAM_W * CAM_PX}
              height={CAM_H * CAM_PX}
              data-testid="nw-canvas"
              style={{ width: "100%", height: "100%", imageRendering: "auto", display: n.tablet ? "block" : "none" }}
            />
            {n.tablet ? (
              <>
                <div style={{ ...MONO, position: "absolute", left: 10, top: 8, fontSize: 11, letterSpacing: 1, color: "#e8e8e0", textShadow: "0 0 2px #000, 1px 1px 0 #000" }}>
                  <span style={{ color: "#ff3b30" }}>●</span> REC CAM{String(n.watch.cameras.indexOf(cam) + 1).padStart(2, "0")} {cam.name.toUpperCase()}
                </div>
                <div style={{ ...MONO, position: "absolute", right: 10, top: 8, fontSize: 11, letterSpacing: 1, color: "#e8e8e0", textShadow: "0 0 2px #000, 1px 1px 0 #000" }}>
                  {lookOf(cam.scene) === "ir" ? "IR " : ""}
                  {clock(n.minute)}:{String(Math.floor((n.minute % 1) * 60)).padStart(2, "0")}
                </div>
              </>
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 12, color: PAL.goldL }}>
                {n.brewing > 0
                  ? "The machine gurgles. The board hums. Nobody else is awake."
                  : n.coffee <= 0
                    ? "Your eyes won't hold the screen. Brew coffee."
                    : anyAlarm
                      ? "Something on the board is red. Lift the tablet."
                      : "The tablet is face down. The hum of the transformers, and nothing else."}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <Btn onClick={() => setReporting((v) => !v)} disabled={!n.tablet || !!n.over} danger={reporting} testId="nw-report">
              Report what's on CAM {n.watch.cameras.indexOf(cam) + 1} (R)
            </Btn>
            <Btn
              testId="nw-photo"
              on={photoOn}
              onClick={() => {
                photo.current = !photo.current;
                setPhotoOn(photo.current);
              }}
            >
              {photoOn ? "Photo on" : "Photo"}
            </Btn>
          </div>
          {reporting ? (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }} data-testid="nw-report-menu">
              {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
                <Btn key={c} onClick={() => file(c)} testId={`nw-cat-${c}`}>
                  {CATEGORY_LABEL[c]}
                </Btn>
              ))}
            </div>
          ) : null}
          {coach ? (
            <div data-testid="nw-coach" style={{ ...MONO, marginTop: 6, fontSize: 12, lineHeight: 1.4, color: PAL.cream }}>
              {coach}
            </div>
          ) : null}
          <div data-testid="nw-radio" style={{ ...MONO, marginTop: 6, fontSize: 11, lineHeight: 1.5, color: PAL.goldL, opacity: 0.9 }}>
            {radioLines
              .slice(-3)
              .map((line, k, all) => (
                <div key={line} style={{ opacity: k === all.length - 1 ? 1 : 0.55 }}>
                  📻 {line}
                </div>
              ))}
          </div>
          {toast ? (
            <div data-testid="nw-toast" style={{ marginTop: 6, color: PAL.cream }}>
              {toast}
            </div>
          ) : null}
        </div>
        {/* Annunciator wall */}
        <div style={{ flex: "1 1 300px", maxWidth: 460 }}>
          <div style={{ marginBottom: 4, color: PAL.cream }}>ANNUNCIATORS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))", gap: 4 }} data-testid="nw-annunciators">
            <div
              data-testid="nw-tile-trip"
              style={{ padding: "4px 6px", border: `1px solid ${PAL.copperD}`, animation: tripped ? "nwflash 0.8s infinite" : undefined, color: tripped ? undefined : PAL.leafL }}
            >
              <div style={{ fontSize: 10 }}>REACTOR TRIP</div>
              <div style={{ fontSize: 14 }}>{tripped ? "TRIPPED" : "NORMAL"}</div>
            </div>
            {n.watch.metrics.map((m) => {
              const on = lit.has(m.id);
              const v = r[m.id];
              const shown = m.ratio ? `×${v.toFixed(1)} normal` : `${v.toFixed(m.digits)} ${m.unit}`;
              return (
                <div
                  key={m.id}
                  data-testid={`nw-tile-${m.id}`}
                  data-alarm={on ? "1" : "0"}
                  style={{ padding: "4px 6px", border: `1px solid ${PAL.copperD}`, animation: on ? "nwflash 0.8s infinite" : undefined }}
                >
                  <div style={{ fontSize: 10, opacity: 0.85 }}>{m.label.toUpperCase()}</div>
                  <div style={{ fontSize: 14 }}>{shown}</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {leaving && !n.over && !replay ? (
        <div data-testid="nw-leave-ask" style={{ margin: "8px 10px", padding: 10, border: `2px solid ${PAL.gold}`, background: PAL.ink }}>
          <p style={{ margin: 0 }}>Leave the watch? Elena will log it as relieved.</p>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Btn
              testId="nw-leave-yes"
              danger
              onClick={() => {
                relieve(n);
                setLeaving(false);
                rerender();
              }}
            >
              Yes
            </Btn>
            <Btn testId="nw-leave-no" onClick={() => setLeaving(false)}>
              No
            </Btn>
          </div>
        </div>
      ) : null}
      {n.over ? <Summary n={n} nightNo={nightNo} onLeave={onLeave} onStay={onStay} endless={endless} best={bestNights} /> : null}
      <div style={{ padding: "0 10px 10px", fontSize: 10, opacity: 0.7 }}>
        {Math.max(0, Math.round(((NIGHT_MINUTES - n.minute) / Math.max(speed.current, 0.01)) * SECONDS_PER_MINUTE / 60))} real min until 06:00.
      </div>
    </div>
  );
}

function Summary({ n, nightNo, onLeave, onStay, endless, best }: { n: Night; nightNo: number; onLeave: () => void; onStay?: () => void; endless?: boolean; best: number | null }) {
  const sc = score(n);
  const g = recordNight({}, n, nightNo, true);
  const rows = turnoverRows(n);
  const notes = oddityNotes(n);
  const passed = n.over?.why === "dawn" && (g.letter === "A" || g.letter === "B" || g.letter === "C");
  const head = n.over?.why === "trip" ? `${clock(n.over.at)}. The lights drop to emergency. Grade F.` : n.over?.why === "relieved" ? `${clock(n.over!.at)}. Elena takes the chair.` : "06:00 turnover.";
  return (
    <div data-testid="nw-summary" style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", padding: 12, background: "rgba(22,17,13,0.55)" }}>
      <div className="paper" style={{ display: "flex", flexDirection: "column", flex: 1, maxWidth: 560, margin: "0 auto", minHeight: 0, width: "100%", padding: 16, fontFamily: "var(--font-body)", color: "#16110d", lineHeight: 1.45 }}>
        <p className="font-mono text-[10px] tracking-widest text-[#6a4a32]" style={{ margin: 0 }}>{head}</p>
        <h2 className={"font-display text-3xl " + juiceClass(prefersReducedMotion())} style={{ margin: "8px 0 0" }} data-testid="nw-grade" data-juice="grade">Grade {g.letter}</h2>
        <p data-testid="nw-seed" style={{ margin: "4px 0 0", fontSize: 12, color: "#6a4a32" }}>Seed {n.seed}</p>
        {endless ? (
          <p data-testid="endless-best" style={{ margin: "4px 0 0", fontSize: 12 }}>
            Best: {best ?? 0} nights.
          </p>
        ) : null}
        <p style={{ margin: "8px 0 0", fontSize: 14 }}>{elenaLine(g.letter, n.curt, n.over?.why)}</p>
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#6a4a32" }}>
          Caught {sc.caught} ({sc.early} early) · missed {sc.missed} · false reports {sc.falseReports}
        </p>
        <div style={{ overflowY: "auto", overflowX: "hidden", flex: "1 1 auto", minHeight: 0, marginTop: 8 }}>
          {rows.map((row) => (
            <div key={`${row.time}-${row.title}`} style={{ marginTop: 8, fontSize: 13 }}>
              <div>
                {row.time} · CAM{String(row.camIndex + 1).padStart(2, "0")} {row.camera} · {row.title} · {row.how}
                {row.fromDays ? " · from days" : ""}
              </div>
              {row.tile ? <div data-testid="nw-board-tile">{row.tile}</div> : null}
              {row.missed ? (
                <div>
                  <Still n={n} camera={n.watch.cameras[row.camIndex]?.id ?? "aux"} minute={row.stillMinute} />
                  <div>
                    It was on CAM{String(row.camIndex + 1).padStart(2, "0")} from {row.time}. You looked at CAM{String(row.camIndex + 1).padStart(2, "0")} {row.looks} times after that.
                  </div>
                </div>
              ) : null}
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 13 }}>
            {notes.map((line) => (
              <div key={line}>{line}</div>
            ))}
            {n.log
              .filter((l) => l.includes("False report") || l.includes("wrong kind"))
              .map((l, i) => (
                <div key={i}>{l}</div>
              ))}
          </div>
        </div>
        {endless && passed && onStay ? (
          <button type="button" className="paper-btn" style={{ minHeight: 44, marginTop: 8, width: "100%", flex: "0 0 auto" }} data-testid="endless-stay" onClick={onStay}>
            Stay
          </button>
        ) : null}
        <GazeReplay n={n} />
        <button type="button" className="paper-btn-primary" style={{ minHeight: 44, marginTop: 12, width: "100%", flex: "0 0 auto" }} data-testid="nw-summary-leave" onClick={onLeave}>
          {n.over?.why === "dawn" && (g.letter === "A" || g.letter === "B" || g.letter === "C") ? "Sleep" : "Back"}
        </button>
      </div>
    </div>
  );
}

function GazeReplay({ n }: { n: Night }) {
  const frames = gazeReplay(n.gaze);
  const [i, setI] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  if (frames.length === 0) return null;
  const play = () => {
    if (timer.current) clearTimeout(timer.current);
    let k = 0;
    const step = () => {
      setI(k);
      const hold = frames[k].holdMs;
      k += 1;
      if (k < frames.length) timer.current = setTimeout(step, hold);
      else timer.current = setTimeout(() => setI(-1), hold);
    };
    step();
  };
  const frame = i >= 0 ? frames[i] : null;
  return (
    <div style={{ marginTop: 8, flex: "0 0 auto" }}>
      <button type="button" className="paper-btn" style={{ minHeight: 44, width: "100%" }} data-testid="nw-replay" onClick={play}>
        Replay at 10×
      </button>
      {frame ? (
        <div data-testid="nw-replay-cam" style={{ marginTop: 6, fontSize: 13 }}>
          {frame.camera}
          <Still n={n} camera={frame.camera} minute={frame.from} />
        </div>
      ) : null}
    </div>
  );
}

function Still({ n, camera, minute }: { n: Night; camera: string; minute: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = ref.current?.getContext("2d");
    if (!c) return;
    const cam = n.watch.cameras.find((x) => x.id === camera);
    if (!cam) return;
    c.setTransform(CAM_PX, 0, 0, CAM_PX, 0, 0);
    paintCamera(c, cam.scene, visualsOn({ ...n, minute }, camera), minute, { calm: true });
  }, [n, camera, minute]);
  return <canvas ref={ref} width={CAM_W * CAM_PX} height={CAM_H * CAM_PX} style={{ width: "100%", maxWidth: 320, marginTop: 4 }} />;
}

const CARD: CSSProperties = { fontFamily: "var(--font-body)", color: "#16110d", lineHeight: 1.5, maxWidth: 560, width: "100%" };

function bestLetter(flags: Record<string, boolean>, night: number): string {
  for (const letter of ["A", "B", "C", "D", "F"]) if (flags[`night:${night}:grade:${letter}`]) return letter;
  return "";
}

/** Days off, the night openers, the shifts, and the lot at dawn. Flags only. */
export function NightRotation({ s, onNewWeek, onMenu }: { s: GameState; onNewWeek: () => void; onMenu: () => void }) {
  const next = Math.min(4, nightsDone(s.flags) + 1);
  const [phase, setPhase] = useState<"off" | "opener" | "shift" | "dawn">(() => {
    if (s.flags["rot:dawn"]) return "dawn";
    if (!s.flags["rot:reported"]) return "off";
    return "opener";
  });
  const [endless, setEndless] = useState(0);
  const again = bestLetter(s.flags, next) === "D" || bestLetter(s.flags, next) === "F";
  const weekLine = s.ended === "a" ? "The week held. You still wake at the wrong hour." : s.hides >= 3 ? "You keep replaying the things you did not say." : "The plant is someone else's problem until midnight.";
  const grades = [1, 2, 3, 4].map((k) => bestLetter(s.flags, k)).filter(Boolean);
  const avg = grades.length ? grades.reduce((sum, letter) => sum + { A: 4, B: 3, C: 2, D: 1, F: 0 }[letter as "A"], 0) / grades.length : 2;
  const dawnLine = avg >= 3.2 ? "The lot is pale. Elena nods once and keeps walking." : avg >= 2 ? "Dawn on the lot. The log is what it is." : "The lot is empty. A night like that has to be stood again.";
  const last = (bestLetter(s.flags, 4) || "C") as "A";
  const letters = [1, 2, 3, 4].map((k) => bestLetter(s.flags, k));
  const paper = paperLines({
    grades: letters,
    hides: s.hides,
    ended: s.ended,
    shuffleDone: s.shuffleDone,
    discharged: !!s.flags["outage:discharged"],
    dischargeMatch: !!s.flags["outage:discharge:match"],
    valve: s.residue.valve,
    tag: s.residue.tag,
    dose: s.residue.dose,
    log: s.residue.log,
  });
  const [crewHeard, setCrewHeard] = useState(true);
  useEffect(() => {
    if (phase !== "dawn") return;
    const heard = readCrew().seen;
    noteARotation(letters);
    writePaper(paper);
    setCrewHeard(heard);
  }, [phase, letters.join(""), paper.join("|")]);
  if (endless > 0) {
    return (
      <NightShift
        key={endless}
        s={s}
        nightNo={endless}
        replay
        endless
        onStay={() => setEndless(endless + 1)}
        onLeave={() => setEndless(0)}
      />
    );
  }
  if (phase === "shift") {
    return (
      <NightShift
        s={s}
        nightNo={next}
        onLeave={() => {
          if (s.flags["night:4:done"]) {
            s.flags["rot:dawn"] = true;
            s.flags["rot:complete"] = true;
            writeSave(s, true);
            setPhase("dawn");
          } else {
            writeSave(s, true);
            setPhase("opener");
          }
        }}
      />
    );
  }
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center overflow-y-auto overflow-x-hidden bg-bg/55 p-3 pb-28 sm:items-center sm:p-6">
      {phase === "off" ? (
        <div className="paper mx-auto w-full p-4 sm:p-5" style={CARD} data-testid="days-off">
          <p className="font-mono text-[10px] tracking-widest text-[#6a4a32]">Days off</p>
          <h2 className="font-display mt-2 text-3xl">Three days off</h2>
          <p className="mt-3 text-sm leading-relaxed">Three days off. You sleep wrong for two of them.</p>
          <p className="mt-2 text-sm leading-relaxed">{weekLine}</p>
          <p className="mt-3 text-[11px] text-[#6a4a32]">Teaching model only. The three days off are a story beat, not a work-hour rule. This game does not say how long a real watch may be.</p>
          <button
            type="button"
            className="paper-btn-primary mt-5 w-full"
            style={{ minHeight: 44 }}
            data-testid="report-nights"
            onClick={() => {
              s.flags["rot:reported"] = true;
              writeSave(s, true);
              setPhase("opener");
            }}
          >
            Report for nights
          </button>
        </div>
      ) : null}
      {phase === "opener" ? (
        <div className="paper mx-auto w-full p-4 sm:p-5" style={CARD} data-testid="night-opener">
          <p className="font-mono text-[10px] tracking-widest text-[#6a4a32]">{again ? `Night ${next}, again` : `Night ${next}`}</p>
          <h2 className="font-display mt-2 text-3xl">{again ? "Stand it again" : "18:00 turnover"}</h2>
          <p className="mt-3 text-sm leading-relaxed">{openerLine(next, again)}</p>
          <button type="button" className="paper-btn-primary mt-5 w-full" style={{ minHeight: 44 }} data-testid="start-night" onClick={() => { writeSave(s, true); setPhase("shift"); }}>
            Take the watch
          </button>
        </div>
      ) : null}
      {phase === "dawn" ? (
        <div className="paper mx-auto w-full p-4 sm:p-5" style={CARD} data-testid="dawn-lot">
          <p className="font-mono text-[10px] tracking-widest text-[#6a4a32]">Dawn · Lot</p>
          <h2 className="font-display mt-2 text-3xl">The lot at dawn</h2>
          <p className="mt-3 text-sm leading-relaxed">{dawnLine}</p>
          <p className="mt-2 text-sm leading-relaxed">Elena: {elenaLine(last, !!s.flags["log:curt"] || s.residue.log === "hid")}</p>
          {dawnCrewLine(letters, crewHeard) ? (
            <p className="mt-2 text-sm leading-relaxed" data-testid="dawn-crew">
              {dawnCrewLine(letters, crewHeard)}
            </p>
          ) : null}
          <div className="mt-3" data-testid="dawn-paper">
            <p className="font-mono text-[10px] tracking-widest text-[#6a4a32]">The plant paper</p>
            {paper.map((line) => (
              <p key={line} className="mt-1 text-sm leading-relaxed">
                {line}
              </p>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-2">
            <button type="button" className="paper-btn-primary" style={{ minHeight: 44 }} data-testid="dawn-new-week" onClick={onNewWeek}>
              New week
            </button>
            <button type="button" className="paper-btn" style={{ minHeight: 44 }} data-testid="dawn-endless" onClick={() => setEndless(5)}>
              Night Shift Endless
            </button>
            <p data-testid="endless-best" className="text-sm">
              Best: {readEndless().nights} nights.
            </p>
            <button type="button" className="paper-btn" style={{ minHeight: 44 }} data-testid="dawn-menu" onClick={onMenu}>
              Menu
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
