/**
 * Photoreal plates for Night Watch. The code-drawn scenes stay the fallback: a plate is used only
 * after its image has decoded. Missing files, node tests and a slow network all keep today's drawing.
 *
 * Owner, 20 November 2026, 23:32 ET: Imagine art is allowed for these plates and the rover sprite only.
 */

export interface PlateState {
  file: string;
  /** Logical 480×270 box the variant replaces, feathered at the edge. */
  box: [number, number, number, number];
}

export interface PlateSpec {
  file: string;
  states?: Record<string, PlateState>;
}

export const PLATES: Record<string, PlateSpec> = {
  containment: { file: "/nightwatch/plates/containment.webp" },
  pressurizer: { file: "/nightwatch/plates/pressurizer.webp" },
  msiv: { file: "/nightwatch/plates/msiv.webp" },
  drywell: { file: "/nightwatch/plates/drywell.webp" },
  torus: { file: "/nightwatch/plates/torus.webp" },
  tunnel: { file: "/nightwatch/plates/tunnel.webp" },
  cavity: { file: "/nightwatch/plates/cavity.webp" },
  blower: { file: "/nightwatch/plates/blower.webp" },
  discharge: { file: "/nightwatch/plates/discharge.webp" },
  cell: {
    file: "/nightwatch/plates/cell.webp",
    states: {
      heaterDark: { file: "/nightwatch/plates/cell-heaterDark.webp", box: [214, 150, 92, 20] },
    },
  },
  freeze: {
    file: "/nightwatch/plates/freeze.webp",
    states: {
      frostGone: { file: "/nightwatch/plates/freeze-frostGone.webp", box: [196, 110, 80, 64] },
    },
  },
  offgas: { file: "/nightwatch/plates/offgas.webp" },
  turbine: { file: "/nightwatch/plates/turbine.webp" },
  corridor: {
    file: "/nightwatch/plates/corridor.webp",
    states: {
      doorAjar: { file: "/nightwatch/plates/corridor-doorAjar.webp", box: [340, 66, 120, 204] },
      chair: { file: "/nightwatch/plates/corridor-chair.webp", box: [226, 170, 80, 64] },
      hardhat: { file: "/nightwatch/plates/corridor-hardhat.webp", box: [190, 222, 50, 26] },
    },
  },
  pool: {
    file: "/nightwatch/plates/pool.webp",
    states: {
      poolLow: { file: "/nightwatch/plates/pool-poolLow.webp", box: [10, 96, 460, 40] },
      toolBag: { file: "/nightwatch/plates/pool-toolBag.webp", box: [372, 66, 60, 36] },
    },
  },
  yard: { file: "/nightwatch/plates/yard.webp" },
  intake: {
    file: "/nightwatch/plates/intake.webp",
    states: {
      debris: { file: "/nightwatch/plates/intake-debris.webp", box: [70, 110, 340, 115] },
    },
  },
};

/** Eight walk frames, 96×192 each, facing right. */
export const ROVER_SHEET = "/nightwatch/rover.webp";

const loaded = new Map<string, HTMLImageElement>();

function ready(img: HTMLImageElement | undefined): HTMLImageElement | null {
  return img && img.complete && img.naturalWidth > 0 ? img : null;
}

function preload(src: string): Promise<void> {
  if (typeof Image === "undefined") return Promise.resolve();
  if (ready(loaded.get(src))) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      loaded.set(src, img);
      resolve();
    };
    // A missing plate is the code drawing. Do not reject the shift for it.
    img.onerror = () => resolve();
    img.src = src;
  });
}

/** Decode every plate, state crop and the rover sheet. Safe to call more than once. */
export function loadPlates(): Promise<void> {
  const files = [ROVER_SHEET];
  for (const spec of Object.values(PLATES)) {
    files.push(spec.file);
    if (spec.states) for (const st of Object.values(spec.states)) files.push(st.file);
  }
  return Promise.all(files.map(preload)).then(() => undefined);
}

export function plateFor(scene: string): HTMLImageElement | null {
  const spec = PLATES[scene];
  return spec ? ready(loaded.get(spec.file)) : null;
}

export function stateFor(scene: string, visual: string): HTMLImageElement | null {
  const st = PLATES[scene]?.states?.[visual];
  return st ? ready(loaded.get(st.file)) : null;
}

export function roverSheet(): HTMLImageElement | null {
  return ready(loaded.get(ROVER_SHEET));
}
