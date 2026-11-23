/**
 * Plant Monitor: the passive board, day and night. Live from the day's run (nightwatch/monitor.ts).
 * When something is wrong its tile flashes, and so do its taskbar tab and desktop icon.
 */
import type { CSSProperties } from "react";
import { PAL } from "./palette";
import type { GameState } from "./sim";
import { siteKind } from "./plantLoops";
import { monitorState } from "./nightwatch/monitor";
import { nightsDone } from "./nightwatch/progress";

const MONO: CSSProperties = { fontFamily: "var(--font-mono, monospace)" };

export function PlantMonitorApp({ s }: { s: GameState }) {
  const site = siteKind(s.plant);
  const st = monitorState(site, s.run, s.minutes);
  const hour = (s.minutes / 60) % 24;
  const hist = s.run.history.slice(-60);
  const done = nightsDone(s.flags);
  return (
    <div className="app-pad" data-testid="app-monitor" style={{ ...MONO, background: PAL.ink, color: PAL.goldL, minHeight: "100%" }}>
      <style>{`@keyframes pmflash { 0%,49% { background: ${PAL.bad}; color: ${PAL.ink} } 50%,100% { background: ${PAL.copperD}; color: ${PAL.goldL} } }`}</style>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "baseline" }}>
        <span style={{ fontSize: 16, color: PAL.cream }}>PLANT MONITOR · UNIT 1</span>
        <span data-testid="pm-shift">{st.shift.toUpperCase()} SHIFT</span>
        <span>{st.alarms.length ? `${st.alarms.length} ALARM${st.alarms.length > 1 ? "S" : ""}` : "ALL NORMAL"}</span>
      </div>

      {/* 24 hours: night shaded, now marked. */}
      <div style={{ position: "relative", height: 14, margin: "8px 0", background: PAL.copperD }} aria-label="Day and night" data-testid="pm-day">
        <div style={{ position: "absolute", left: 0, width: `${(6 / 24) * 100}%`, top: 0, bottom: 0, background: PAL.outline }} />
        <div style={{ position: "absolute", left: `${(22 / 24) * 100}%`, right: 0, top: 0, bottom: 0, background: PAL.outline }} />
        <div style={{ position: "absolute", left: `${(hour / 24) * 100}%`, top: -2, bottom: -2, width: 2, background: PAL.cream }} />
        {[0, 6, 12, 18].map((h) => (
          <span key={h} style={{ position: "absolute", left: `${(h / 24) * 100}%`, top: 14, fontSize: 9 }}>
            {String(h).padStart(2, "0")}
          </span>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 4, marginTop: 14 }}>
        <div data-testid="pm-tile-trip" style={{ padding: "4px 6px", border: `1px solid ${PAL.copperD}`, animation: st.tripped ? "pmflash 0.8s infinite" : undefined }}>
          <div style={{ fontSize: 10 }}>REACTOR TRIP</div>
          <div style={{ fontSize: 14 }}>{st.tripped ? "TRIPPED" : "NORMAL"}</div>
        </div>
        {st.values.map(({ m, v, alarm }) => (
          <div key={m.id} data-testid={`pm-tile-${m.id}`} data-alarm={alarm ? "1" : "0"} style={{ padding: "4px 6px", border: `1px solid ${PAL.copperD}`, animation: alarm ? "pmflash 0.8s infinite" : undefined }}>
            <div style={{ fontSize: 10, opacity: 0.85 }}>{m.label.toUpperCase()}</div>
            <div style={{ fontSize: 14 }}>{m.ratio ? `×${v.toFixed(1)} normal` : `${v.toFixed(m.digits)} ${m.unit}`}</div>
          </div>
        ))}
      </div>

      {hist.length > 1 ? (
        <svg viewBox="0 0 300 50" width="100%" style={{ maxWidth: 420, marginTop: 10, background: PAL.outline }} aria-label="Core ΔT, last run">
          <polyline
            fill="none"
            stroke={PAL.gold}
            strokeWidth={1.5}
            points={hist.map((h, i) => `${(i / (hist.length - 1)) * 296 + 2},${48 - Math.min(46, Math.max(0, (h.dT / Math.max(1, ...hist.map((x) => x.dT))) * 44))}`).join(" ")}
          />
          <text x={200} y={46} fontSize={7} fill={PAL.cream}>
            CORE ΔT, LAST RUN
          </text>
        </svg>
      ) : null}
      <p style={{ fontSize: 11, opacity: 0.8, marginTop: 8 }}>
        Alarms here: a reactor trip, core ΔT above its band, power above 104%. Night Watch: {done} of 5 nights watched.
      </p>
    </div>
  );
}
