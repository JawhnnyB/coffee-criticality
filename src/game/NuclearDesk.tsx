"use client";

import { useState } from "react";
import type { DesignScale, PlantDesign } from "./plant";
import {
  computeKeff,
  diffusionCopy,
  downloadOpenMC,
  generateOpenMCPython,
  kAt,
  PART_TERMS,
  PHYSICS_TERMS,
  TERM_ART,
  TERM_LESSONS,
  type TermLesson,
} from "./nuclearLab";

const SCALES: { id: DesignScale; title: string; sub: string; art: string }[] = [
  { id: "rod", title: "Fuel rod", sub: "Infinite pin · reflective", art: "/art/gen/stills/term_pellet.png?v=pixel" },
  { id: "assembly", title: "Assembly", sub: "Lattice · axial leak", art: "/art/gen/stills/plate_assembly.png?v=pixel" },
  { id: "core", title: "Full core", sub: "Buckling + shuffle", art: "/art/gen/stills/plate_pwr.png?v=gauge" },
];

function fuelInk(k: number) {
  if (k >= 1.04) return "#2a86a0";
  if (k >= 0.98) return "#3d8a78";
  return "#5a7a84";
}

/** Pixel cutaway, not a photo. Pellet color follows this card's k. */
function ScaleDiagram({ kind, k }: { kind: "rod" | "assembly"; k: number }) {
  const fuel = fuelInk(k);
  const rods = kind === "rod" ? [{ x: 46, y: 8 }] : [
    { x: 8, y: 10 }, { x: 28, y: 10 }, { x: 48, y: 10 }, { x: 68, y: 10 },
    { x: 18, y: 36 }, { x: 38, y: 36 }, { x: 58, y: 36 },
    { x: 8, y: 62 }, { x: 28, y: 62 }, { x: 48, y: 62 }, { x: 68, y: 62 },
  ];
  const pellets = kind === "rod" ? [16, 28, 40, 52, 64, 76] : [4, 12];
  return (
    <svg viewBox="0 0 96 96" className="mt-1 h-[120px] w-full bg-[#f3e6d0]" role="img" aria-label={kind}>
      <rect x="1" y="1" width="94" height="94" fill="#f3e6d0" stroke="#1a1410" />
      {kind === "assembly" ? <rect x="4" y="4" width="88" height="88" fill="none" stroke="#1a1410" strokeWidth="2" /> : null}
      {rods.map((rod) => (
        <g key={rod.x + "-" + rod.y}>
          <rect x={rod.x} y={rod.y} width="20" height={kind === "rod" ? 80 : 22} fill="#5a646a" stroke="#1a1410" />
          <rect x={rod.x + 2} y={rod.y + 2} width="5" height={kind === "rod" ? 76 : 18} fill="#d5dde0" />
          <rect x={rod.x + 14} y={rod.y + 2} width="4" height={kind === "rod" ? 76 : 18} fill="#2a3236" />
          {pellets.map((py) => (
            <rect key={py} x={rod.x + 5} y={rod.y + py} width="10" height={kind === "rod" ? 8 : 5} fill={fuel} stroke="#1a1410" />
          ))}
          <rect x={rod.x + 2} y={rod.y - 3} width="16" height="4" fill="#3d5c66" stroke="#1a1410" />
        </g>
      ))}
    </svg>
  );
}

export function OpenMCPane({ plant, tall = true }: { plant: PlantDesign; tall?: boolean }) {
  let py = "# teaching export unavailable";
  try {
    py = generateOpenMCPython(plant);
  } catch {
    py = "# OpenMC export failed to build. Teaching model only — not a license.";
  }
  return (
    <div className="mt-4" data-testid="openmc-pane">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="teach-kicker">OPENMC  ·  live with every change  ·  teaching only</p>
        <button type="button" className="btn-ghost text-[11px]" data-testid="openmc-download" onClick={() => downloadOpenMC(plant)}>
          Download OpenMC .py
        </button>
      </div>
      <pre
        data-testid="openmc-source"
        className={
          "mt-2 overflow-auto rounded-md border border-border bg-[#0b0a09] p-4 font-mono text-[12px] leading-relaxed text-[#6b8f71] " +
          (tall ? "min-h-[22rem] max-h-[36rem]" : "max-h-72")
        }
      >
        {py}
      </pre>
      <p className="mt-1 text-[11px] leading-relaxed text-subtle">
        Teaching model only — not a license. First run fetches a minimal nuclide set (openmc-data-downloader). Full libraries:
        openmc.org/data. k in this file is OpenMC's; k on the cards is a classroom proxy.
      </p>
    </div>
  );
}

function TermWindow({ lesson, onClose }: { lesson: TermLesson; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0a09]/85 p-3 sm:p-6" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto border border-[#6a4a32] bg-[#f3e6d0] p-6 text-[#16110d] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-mono text-xs tracking-widest text-[#6b8f71]">CLOSE-UP LESSON  ·  TWO-GROUP  ·  TEACHING ONLY  ·  NOT A LICENSE</p>
        <h3 className="font-display mt-2 text-3xl leading-tight">{lesson.title}</h3>
        {TERM_ART[lesson.id] ? (
          <img
            src={TERM_ART[lesson.id]}
            alt=""
            className="mt-4 aspect-video w-full max-w-2xl object-contain teach-pixel"
            style={{ imageRendering: "pixelated" }}
          />
        ) : null}
        <section className="mt-5">
          <h4 className="font-mono text-xs tracking-widest text-[#6a4a32]">IN ONE BREATH</h4>
          <p className="mt-2 text-lg leading-8">{lesson.plain}</p>
        </section>
        <section className="mt-6">
          <h4 className="font-mono text-xs tracking-widest text-[#6a4a32]">WHAT THE NEUTRON DOES</h4>
          <ol className="mt-2 list-decimal space-y-2 pl-6 text-base leading-7">
            {lesson.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </section>
        <section className="mt-6">
          <h4 className="font-mono text-xs tracking-widest text-[#6a4a32]">THE SYMBOL</h4>
          <p className="mt-2 text-base leading-7">{lesson.what}</p>
        </section>
        <section className="mt-6">
          <h4 className="font-mono text-xs tracking-widest text-[#6a4a32]">IN THE EQUATION</h4>
          <pre className="mt-2 overflow-x-auto border border-[#6a4a32] bg-[#16110d] p-4 font-mono text-[15px] leading-relaxed text-[#6b8f71]">
            {lesson.equation}
          </pre>
        </section>
        <section className="mt-6">
          <h4 className="font-mono text-xs tracking-widest text-[#6a4a32]">WHERE IT SHOWS UP HERE</h4>
          <p className="mt-2 text-base leading-7">{lesson.where}</p>
        </section>
        <section className="mt-6">
          <h4 className="font-mono text-xs tracking-widest text-[#6a4a32]">WHY IT MATTERS ON THE FLOOR</h4>
          <p className="mt-2 text-base leading-7">{lesson.why}</p>
        </section>
        <p className="mt-6 text-sm text-[#6a4a32]">
          Classroom continuum. OpenMC transports. Catch {">"} heroics. Not a license.
        </p>
        <button type="button" className="btn-primary mt-5" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export function NuclearDesk({
  plant,
  onChange,
  compact = false,
  showExport = true,
  hideCode = false,
}: {
  plant: PlantDesign;
  onChange: (p: PlantDesign) => void;
  compact?: boolean;
  showExport?: boolean;
  hideCode?: boolean;
}) {
  const k = computeKeff(plant);
  const { eq, note, terms } = diffusionCopy(plant);
  const [term, setTerm] = useState<string | null>(null);
  const lesson = term ? TERM_LESSONS[term] : null;

  return (
    <div className={compact ? "mt-3" : "mt-4"}>
      <div className="grid grid-cols-3 gap-2">
        {SCALES.map((sc) => {
          const kv = kAt(plant, sc.id);
          const on = plant.scale === sc.id;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => onChange({ ...plant, scale: sc.id })}
              className={"border p-2 text-left " + (on ? "border-accent bg-accent/10" : "border-border bg-surface")}
            >
              <div className="teach-kicker">{sc.title}</div>
              {sc.id === "core" ? (
                <img
                  src={sc.art}
                  alt=""
                  className="mt-1 h-[120px] w-full bg-[#f3e6d0] object-contain teach-pixel"
                  style={{ imageRendering: "pixelated" }}
                />
              ) : (
                <ScaleDiagram kind={sc.id} k={kv} />
              )}
              <div className="mt-1 font-mono text-xs text-good" data-testid={"k-" + sc.id}>
                k ≈ {kv.toFixed(3)}
              </div>
              {!compact && <div className="text-[10px] text-subtle">{sc.sub}</div>}
            </button>
          );
        })}
      </div>

      <p className="mt-2 font-mono text-[11px] text-good" data-testid="k-ladder">
        k∞ {k.kInf.toFixed(3)} · rod {k.kRod.toFixed(3)} · asm {k.kAsm.toFixed(3)} · core {k.kCore.toFixed(3)}
        <span className="ml-2 text-subtle">teaching proxy</span>
      </p>

      {!compact && (
        <>
          <pre className="mt-3 overflow-x-auto border border-border bg-[#16110d] p-3 font-mono text-[14px] leading-relaxed text-[#f3e6d0]">
            {eq}
          </pre>
          <p className="mt-2 text-xs leading-relaxed text-muted">{note}</p>
        </>
      )}

      <details className="mt-3 border border-border bg-bg px-3 py-2">
        <summary className="cursor-pointer teach-kicker">Optional deep-dive · terms, parts, physics</summary>
        <p className="mt-3 teach-kicker">DIFFUSION TERMS  ·  click for the lesson</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {terms.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTerm(t)}
              className="border border-[#c4783a] bg-[#16110d] px-3 py-2 font-mono text-[12px] text-[#8a7864] hover:border-good hover:text-[#f3e6d0]"
              data-testid={"term-" + t}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="mt-3 teach-kicker">CORE PARTS  ·  same window, more pictures</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PART_TERMS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTerm(t)}
              className="border border-[#6b8f71] bg-[#16110d] px-3 py-2 font-mono text-[12px] text-[#8a7864] hover:border-good hover:text-[#f3e6d0]"
              data-testid={"term-" + t}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="mt-3 teach-kicker">CORE PHYSICS  ·  delayed · six-factor · Doppler · xenon · period · β · MTC</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PHYSICS_TERMS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTerm(t)}
              className="border border-[#c9a227] bg-[#16110d] px-3 py-2 font-mono text-[12px] text-[#8a7864] hover:border-good hover:text-[#f3e6d0]"
              data-testid={"term-" + t}
            >
              {t}
            </button>
          ))}
        </div>
      </details>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={"border px-2 py-1 text-[11px] " + (plant.depletion ? "border-good bg-good/15 text-fg" : "border-border text-muted")}
          data-testid="depletion-toggle"
          onClick={() => onChange({ ...plant, depletion: !plant.depletion, burnupMWd_kg: plant.depletion ? 0 : Math.max(plant.burnupMWd_kg, 20) })}
        >
          Full depletion {plant.depletion ? "on" : "off"}
        </button>
        <button
          type="button"
          className={"border px-2 py-1 text-[11px] " + (plant.fullCore ? "border-good bg-good/15 text-fg" : "border-border text-muted")}
          data-testid="fullcore-toggle"
          onClick={() => onChange({ ...plant, fullCore: !plant.fullCore, scale: plant.fullCore ? plant.scale : "core" })}
        >
          Full-core lattice {plant.fullCore ? "on" : "off"}
        </button>
        <button
          type="button"
          className={"border px-2 py-1 text-[11px] " + (plant.reflector ? "border-good bg-good/15 text-fg" : "border-border text-muted")}
          onClick={() => onChange({ ...plant, reflector: !plant.reflector })}
        >
          Reflector {plant.reflector ? "on" : "off"}
        </button>
        {showExport ? (
          <button type="button" className="btn-ghost text-[11px]" onClick={() => downloadOpenMC(plant)}>
            Download OpenMC .py
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-[10px] text-subtle">Teaching model only — not a license. k is a classroom proxy.</p>
      {!hideCode ? <OpenMCPane plant={plant} tall={!compact} /> : null}
      {lesson ? <TermWindow lesson={lesson} onClose={() => setTerm(null)} /> : null}
    </div>
  );
}
