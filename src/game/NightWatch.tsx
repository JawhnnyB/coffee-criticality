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
import { siteKind } from "./plantLoops";
import { CAM_H, CAM_PX, CAM_W, lookOf, paintCamera } from "./nightwatch/cameras";
import { loadPlates } from "./nightwatch/plates";
import { startAmbience, stopAmbience } from "./nightwatch/ambience";
import {
  CATEGORY_LABEL,
  COFFEE,
  FALSE_REPORT_LIMIT,
  NIGHT_MINUTES,
  alarms,
  brew,
  clock,
  newNight,
  radio,
  readings,
  report,
  score,
  setTablet,
  tick,
  visualsOn,
  type Category,
  type Night,
} from "./nightwatch/model";

/** Real seconds per game minute: a night is about seven and a half minutes. */
const SECONDS_PER_MINUTE = 1.25;
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
        minHeight: 36,
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

export function nightsDone(flags: Record<string, boolean>): number {
  let n = 0;
  while (flags[`night:${n + 1}:done`]) n++;
  return n;
}

export function NightWatchApp({ s }: { s: GameState }) {
  const [running, setRunning] = useState<number | null>(null);
  const done = nightsDone(s.flags);
  const site = siteKind(s.plant);
  useEffect(() => {
    void loadPlates();
  }, []);
  if (running !== null) return <NightShift s={s} nightNo={running} onLeave={() => setRunning(null)} />;
  return (
    <div className="app-pad" data-testid="app-nightwatch" style={{ fontFamily: "var(--font-body)", color: PAL.ink, lineHeight: 1.5 }}>
      <p style={{ margin: 0 }}>Night Watch · {SITE_LABEL[site]} Unit 1</p>
      <p style={{ fontSize: "var(--text-small)" }}>
        Midnight to six. Eight cameras, one annunciator wall, one coffee machine. Something on site will go wrong before the board knows it. Find it on a camera and report what you
        see. Report the wrong thing, or a light that only flickers, and it counts against you. Three false reports and the supervisor sends you home.
      </p>
      <p style={{ fontSize: "var(--text-small)" }}>Watching the cameras drains your coffee. When it runs out the tablet goes down until you brew more.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        {[1, 2, 3, 4, 5].map((k) => (
          <Btn key={k} onClick={() => setRunning(k)} disabled={k > done + 1} on={s.flags[`night:${k}:done`]} testId={`night-${k}`}>
            Night {k}
            {s.flags[`night:${k}:done`] ? " ✓" : ""}
          </Btn>
        ))}
      </div>
      <p style={{ fontSize: "var(--text-small)", marginTop: 8 }}>
        Keys: Space lifts the tablet, 1 to 8 switch cameras, R reports, B brews.
      </p>
    </div>
  );
}

function NightShift({ s, nightNo, onLeave }: { s: GameState; nightNo: number; onLeave: () => void }) {
  const site = siteKind(s.plant);
  const night = useRef<Night>(newNight(site, nightNo));
  const n = night.current;
  const [, setFrame] = useState(0);
  const [reporting, setReporting] = useState(false);
  const [toast, setToast] = useState<string>("");
  const [switching, setSwitching] = useState(0);
  useEffect(() => {
    void loadPlates();
    startAmbience();
    return () => stopAmbience();
  }, []);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const rewarded = useRef(false);

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
    rerender();
  };
  const file = (c: Category) => {
    const r = report(n, c);
    setReporting(false);
    if (r.ok) say(r.early ? "Logged before the board knew. The crew is on it." : "Logged. The crew is on it.");
    else say(r.reason === "wrong-kind" ? "That is not what is wrong there. Logged as a false report." : "Nothing safety-related on this camera. Logged as a false report.");
    rerender();
  };

  // The clock, coffee and plant run on real time while the shift is on.
  useEffect(() => {
    let last = performance.now();
    let acc = 0;
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      if (!n.over) tick(n, dt / SECONDS_PER_MINUTE);
      setSwitching((v) => (v > 0 ? Math.max(0, v - dt * 3.5) : 0));
      const c = canvas.current?.getContext("2d");
      if (c && n.tablet) {
        const cam = n.watch.cameras.find((x) => x.id === n.camera)!;
        c.setTransform(CAM_PX, 0, 0, CAM_PX, 0, 0);
        paintCamera(c, cam.scene, visualsOn(n, cam.id), now / 1000, { switching: 0, tripped: n.over?.why === "trip" });
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
    paintCamera(c, cam.scene, visualsOn(n, cam.id), performance.now() / 1000, { switching, tripped: n.over?.why === "trip" });
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (n.over) return;
      if (e.key === " ") {
        e.preventDefault();
        toggleTablet();
      } else if (/^[1-8]$/.test(e.key)) {
        const cam = n.watch.cameras[Number(e.key) - 1];
        if (cam) pickCamera(cam.id);
      } else if (e.key === "r" || e.key === "R") {
        if (n.tablet) setReporting((v) => !v);
      } else if (e.key === "b" || e.key === "B") doBrew();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A survived night: progress, and Elena's trust (she takes over at six).
  useEffect(() => {
    if (n.over?.why !== "dawn" || rewarded.current) return;
    rewarded.current = true;
    s.flags[`night:${nightNo}:done`] = true;
    bumpTrust(s, "elena", 2);
    pushMsg(s, `Night ${nightNo} watched. Elena has the plant.`);
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
  const cam = n.watch.cameras.find((c) => c.id === n.camera)!;

  return (
    <div
      data-testid="nightwatch-shift"
      style={{ position: "fixed", inset: 0, zIndex: 60, background: PAL.ink, color: PAL.goldL, display: "flex", flexDirection: "column", ...MONO, overflow: "auto" }}
    >
      <style>{`@keyframes nwflash { 0%,49% { background: ${PAL.bad}; color: ${PAL.ink} } 50%,100% { background: ${PAL.copperD}; color: ${PAL.goldL} } }`}</style>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: "6px 10px", borderBottom: `2px solid ${PAL.copperD}` }}>
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
        <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <Btn onClick={doBrew} disabled={n.brewing > 0 || n.brewsLeft <= 0 || !!n.over} testId="nw-brew">
            Brew (B)
          </Btn>
          <Btn onClick={toggleTablet} on={n.tablet} disabled={!!n.over} testId="nw-tablet">
            {n.tablet ? "Lower tablet" : "Lift tablet"} (Space)
          </Btn>
          <Btn onClick={onLeave} testId="nw-leave">
            {n.over ? "Back to the desk" : "Leave the shift"}
          </Btn>
        </span>
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
                  CAM {k + 1}
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
          <div data-testid="nw-radio" style={{ ...MONO, marginTop: 6, fontSize: 11, lineHeight: 1.5, color: PAL.goldL, opacity: 0.9 }}>
            {radio(n)
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

      {n.over ? <Summary n={n} nightNo={nightNo} onLeave={onLeave} /> : null}
      <div style={{ padding: "0 10px 10px", fontSize: 10, opacity: 0.7 }}>
        {Math.max(0, Math.round(((NIGHT_MINUTES - n.minute) * SECONDS_PER_MINUTE) / 60))} real min until 06:00.
      </div>
    </div>
  );
}

function Summary({ n, nightNo, onLeave }: { n: Night; nightNo: number; onLeave: () => void }) {
  const sc = score(n);
  const head =
    n.over?.why === "dawn"
      ? "06:00. The van pulls into the lot."
      : n.over?.why === "trip"
        ? `${clock(n.over.at)}. The lights drop to emergency. The plant tripped.`
        : `${clock(n.over!.at)}. The supervisor takes the chair.`;
  const close =
    n.over?.why === "dawn"
      ? "Elena: \"Walk me through the log.\""
      : n.over?.why === "trip"
        ? `Nobody reported it: ${n.over.cause}. It found its own way to the board.`
        : "Three reports about nothing. Tomorrow, report what is wrong, not what is strange.";
  return (
    <div data-testid="nw-summary" style={{ margin: "0 10px 10px", padding: 10, border: `2px solid ${PAL.gold}`, background: PAL.ink, color: PAL.cream }}>
      <div style={{ fontSize: 16 }}>{head}</div>
      <div style={{ marginTop: 4 }}>
        Night {nightNo}: caught {sc.caught} ({sc.early} before the alarm) · ran their course {sc.missed} · false reports {sc.falseReports}
      </div>
      <div style={{ marginTop: 4 }}>{close}</div>
      <div style={{ marginTop: 6, fontSize: 11, opacity: 0.85 }}>
        {n.log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <Btn onClick={onLeave} testId="nw-summary-leave">
          Back to the desk
        </Btn>
      </div>
    </div>
  );
}
