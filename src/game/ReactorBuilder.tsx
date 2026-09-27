"use client";

import { useState } from "react";
import { NuclearDesk, OpenMCPane } from "./NuclearDesk";
import { PlantHud } from "./PlantHud";
import { TeachMeta, TeachPriya, TYPE_THUMB } from "./TeachFrame";
import {
  DEFAULT_PLANT,
  plantTitle,
  withTypeDefaults,
  type PlantDesign,
  type PlantType,
} from "./plant";

const STEPS = [
  {
    title: "This is Unit 1. It is yours.",
    priya: "Dr. Priya Sharma. Reactor engineering. Before you walk the floor, you design the core you will be responsible for. Teaching model only — not a license. Heat still has to leave.",
  },
  {
    title: "Plant type",
    priya: "This site is a PWR. BWR, pebble, and salt are comparison models from the teaching archive. Same law: heat leaves with the courier.",
  },
  {
    title: "Power",
    priya: "More megawatts is not more virtue. It is more heat that still has to leave. Pick a rating you can hold with two hands.",
  },
  {
    title: "ΔT and flow",
    priya: "Q = ṁ × cp × ΔT. High flow is polite. High ΔT is loud. Hold twenty-eight to thirty-six unless you like the scram bell.",
  },
  {
    title: "Fuel",
    priya: "Enrichment is not courage. It is how hard the flux will lean on the cladding. We will shuffle this in a week. Watch k at rod, assembly, and core.",
  },
  {
    title: "Scale, depletion, lattice",
    priya: "Same equation, three boundaries. Full-core unlocks Friday shuffle. Depletion poisons k∞ and stamps OpenMC stubs. Teaching proxies — not OpenMC.",
  },
  {
    title: "Your unit",
    priya: "Look at it. The k ladder will follow you onto the floor. When you are sure, we walk to the lake and then to Mabel.",
  },
];

export function ReactorBuilder({
  onDone,
}: {
  onDone: (plant: PlantDesign) => void;
}) {
  const [i, setI] = useState(0);
  const [plant, setPlant] = useState<PlantDesign>(DEFAULT_PLANT);

  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  const plantTypeStep = i === 1;

  return (
    <div className="absolute inset-0 z-30 overflow-x-hidden overflow-y-auto bg-bg px-4 pb-28 pt-12 sm:px-8" data-testid="reactor-builder">
      <div className="teach-grid">
        <div className="teach-span-12">
          <TeachMeta>
            UNIT 1 · PRIYA · {i + 1}/{STEPS.length} · teaching only
          </TeachMeta>
          <div className="mt-2 flex gap-1">
            {STEPS.map((_, n) => (
              <span key={n} className={"h-2 w-6 " + (n <= i ? "bg-good" : "bg-border")} />
            ))}
          </div>
        </div>

        {plantTypeStep ? (
          <>
            <div className="teach-span-4">
              <h2 className="teach-title">{step.title}</h2>
              <div className="mt-3">
                <TeachPriya line={step.priya} size={96} />
              </div>
            </div>
            <div className="teach-span-8 min-w-0">
              <p className="teach-kicker">At a glance · pick the courier</p>
              <Picker
                value={plant.type}
                onChange={(type) => setPlant(withTypeDefaults(plant, type as PlantType))}
                options={[
                  { id: "pwr", label: "PWR — this site", note: "CRDMs on top. Liquid primary ~16 MPa. Steam generator. Pressurizer." },
                  { id: "bwr", label: "BWR — comparison", note: "Boils in the vessel. Rods from below. Steam to turbine. No SG. ~7 MPa." },
                  { id: "pebble", label: "Pebble / TRISO", note: "Helium courier ~6 MPa. Packed pebbles, graphite reflector, TRISO onion." },
                  { id: "msr", label: "MSR / salt", note: "Fuel dissolved in salt. Graphite channels. Freeze plug / drain tank. Near-atm." },
                ]}
              />
              <p className="mt-3 break-words text-sm leading-relaxed text-muted">
                Small cards compare silhouettes. The panel to the right is the only labeled drawing for this site.
                Teaching only — not a license.
              </p>
            </div>
            <div className="teach-span-4 min-w-0">
              <Nav i={i} last={last} plant={plant} onBack={() => setI(i - 1)} onNext={() => setI(i + 1)} onDone={onDone} />
            </div>
            <div className="teach-span-12 min-w-0">
              <PlantHud plant={plant} />
            </div>
          </>
        ) : (
          <>
            <div className="teach-span-7">
              <h2 className="teach-title">{step.title}</h2>
              <div className="mt-3">
                <TeachPriya line={step.priya} size={96} />
              </div>
              {i === 2 && (
                <Picker
                  value={String(plant.powerMW)}
                  onChange={(v) => setPlant({ ...plant, powerMW: Number(v) })}
                  options={[
                    { id: "900", label: "900 MWe", note: "Quieter core. More margin." },
                    { id: "1100", label: "1,100 MWe — this site", note: "The number on the stack." },
                    { id: "1300", label: "1,300 MWe", note: "More heat. Same law." },
                  ]}
                />
              )}
              {i === 3 && (
                <div className="mt-4 space-y-4">
                  <label className="block text-xs text-muted">
                    Core ΔT {plant.dT} °C
                    <input
                      type="range"
                      min={plant.type === "bwr" ? 6 : plant.type === "pebble" ? 80 : plant.type === "msr" ? 30 : 24}
                      max={plant.type === "bwr" ? 16 : plant.type === "pebble" ? 350 : plant.type === "msr" ? 90 : 40}
                      value={plant.dT}
                      onChange={(e) => setPlant({ ...plant, dT: Number(e.target.value) })}
                      className="mt-1 w-full"
                    />
                  </label>
                  <label className="block text-xs text-muted">
                    Primary flow {plant.flow}%
                    <input
                      type="range"
                      min={70}
                      max={120}
                      value={plant.flow}
                      onChange={(e) => setPlant({ ...plant, flow: Number(e.target.value) })}
                      className="mt-1 w-full"
                    />
                  </label>
                </div>
              )}
              {i === 4 && (
                <Picker
                  value={String(plant.enrich)}
                  onChange={(v) => setPlant({ ...plant, enrich: Number(v) })}
                  options={[
                    { id: "3.5", label: "3.5% U-235", note: "Softer flux. Longer shuffle later." },
                    { id: "4.5", label: "4.5% — this site", note: "The number Priya already loves." },
                    { id: "5", label: "5.0%", note: "Peak will shout if you stack it in the middle." },
                    { id: "8.5", label: "8.5% — pebble typical", note: "TRISO teaching default." },
                  ]}
                />
              )}
              {i === 5 && (
                <label className="mt-4 block text-xs text-muted">
                  Classroom burnup {plant.burnupMWd_kg} MWd/kgU
                  <input
                    type="range"
                    min={0}
                    max={60}
                    value={plant.burnupMWd_kg}
                    onChange={(e) => setPlant({ ...plant, burnupMWd_kg: Number(e.target.value) })}
                    className="mt-1 w-full"
                  />
                </label>
              )}
              {i === 6 && <p className="mt-4 font-mono text-sm text-good">{plantTitle(plant)}</p>}
              {i >= 2 && <NuclearDesk plant={plant} onChange={setPlant} compact={i < 5} showExport={i >= 5} hideCode />}
              <div className="mt-6">
                <Nav i={i} last={last} plant={plant} onBack={() => setI(i - 1)} onNext={() => setI(i + 1)} onDone={onDone} />
              </div>
            </div>
            <div className="teach-span-5">
              <PlantHud plant={plant} />
            </div>
          </>
        )}

        {i >= 5 ? (
          <div className="teach-span-12">
            <OpenMCPane plant={plant} tall />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Nav({
  i,
  last,
  plant,
  onBack,
  onNext,
  onDone,
}: {
  i: number;
  last: boolean;
  plant: PlantDesign;
  onBack: () => void;
  onNext: () => void;
  onDone: (plant: PlantDesign) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {i > 0 && (
        <button type="button" className="btn-ghost" onClick={onBack}>
          Back
        </button>
      )}
      {last ? (
        <button type="button" className="btn-primary" onClick={() => onDone(plant)}>
          Sign the unit
        </button>
      ) : (
        <button type="button" className="btn-primary" data-testid="builder-continue" onClick={onNext}>
          Continue
        </button>
      )}
    </div>
  );
}

function Picker({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string; note: string }[];
}) {
  const pictured = options.every((o) => o.id in TYPE_THUMB);
  return (
    <div className={"mt-3 grid gap-2 " + (pictured ? "grid-cols-2" : "grid-cols-1")}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={
            "flex flex-col items-stretch border px-2 py-2 text-left text-sm " +
            (value === o.id ? "border-accent bg-[#f3e6d0] text-[#16110d]" : "border-border bg-surface text-fg hover:border-border-strong")
          }
        >
          {TYPE_THUMB[o.id] ? (
            <img
              src={TYPE_THUMB[o.id]}
              alt=""
              className="mb-2 h-16 w-full object-contain teach-pixel"
              style={{ imageRendering: "pixelated" }}
            />
          ) : null}
          <div className="font-medium">{o.label}</div>
          <div className={"mt-0.5 text-xs " + (value === o.id ? "text-[#3a2818]" : "text-muted")}>{o.note}</div>
        </button>
      ))}
    </div>
  );
}
