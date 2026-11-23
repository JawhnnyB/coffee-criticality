/**
 * Photoreal plates for Night Watch. The code-drawn scenes stay the fallback: a plate is used only
 * after its image has decoded. Missing files, node tests and a slow network all keep today's drawing.
 *
 * Owner, 20 November 2026, 23:32 ET: Imagine art is allowed for these plates and the rover sprite only.
 */

export interface PlateState {
  file: string;
  /** Logical 480×270 box the variant replaces, feathered at the edge. Measured change plus 8 px, clipped to the frame. */
  box: [number, number, number, number];
  /** Tight rectangle where this file actually differs from the base plate, logical pixels. */
  measured: [number, number, number, number];
}

export interface PlateSpec {
  file: string;
  states?: Record<string, PlateState>;
  /** Cherenkov glow centres in the pool photo, logical pixels. */
  glow?: [number, number][];
}

/** Words are painted into the plate files by scripts/bake-signs.mjs. Photo frames do not draw marks() on top. */
export const SIGNS_BAKED = true;

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
      heaterDark: { file: "/nightwatch/plates/cell-heaterDark.webp", measured: [89, 79, 305, 89], box: [81, 71, 321, 105] },
    },
  },
  freeze: {
    file: "/nightwatch/plates/freeze.webp",
    states: {
      frostGone: { file: "/nightwatch/plates/freeze-frostGone.webp", measured: [209, 1, 149, 179], box: [201, 0, 165, 188] },
    },
  },
  offgas: { file: "/nightwatch/plates/offgas.webp" },
  turbine: { file: "/nightwatch/plates/turbine.webp" },
  corridor: {
    file: "/nightwatch/plates/corridor.webp",
    states: {
      doorAjar: { file: "/nightwatch/plates/corridor-doorAjar.webp", measured: [313, 55, 142, 215], box: [305, 47, 158, 223] },
      chair: { file: "/nightwatch/plates/corridor-chair.webp", measured: [191, 169, 48, 63], box: [183, 161, 64, 79] },
      hardhat: { file: "/nightwatch/plates/corridor-hardhat.webp", measured: [236, 166, 149, 52], box: [228, 158, 165, 68] },
    },
  },
  pool: {
    file: "/nightwatch/plates/pool.webp",
    glow: [
      [85, 204], [149, 205], [183, 172], [292, 157],
      [311, 173], [344, 204], [394, 206], [419, 204],
    ],
    states: {
      poolLow: { file: "/nightwatch/plates/pool-poolLow.webp", measured: [0, 144, 480, 126], box: [0, 136, 480, 134] },
      toolBag: { file: "/nightwatch/plates/pool-toolBag.webp", measured: [375, 43, 51, 28], box: [367, 35, 67, 44] },
    },
  },
  yard: { file: "/nightwatch/plates/yard.webp" },
  intake: {
    file: "/nightwatch/plates/intake.webp",
    states: {
      debris: { file: "/nightwatch/plates/intake-debris.webp", measured: [0, 33, 476, 237], box: [0, 25, 480, 245] },
    },
  },
};

/** Eight walk frames, 96×192 each, facing right. */
export const ROVER_SHEET = "/nightwatch/rover.webp";

const loaded = new Map<string, ImageBitmap | HTMLImageElement>();
let platesOn = true;
let generation = 0;

/** The visibility audit turns this off to measure the code drawing. The game leaves it on. */
export function setPlatesEnabled(on: boolean) {
  platesOn = on;
}

function ready(img: ImageBitmap | HTMLImageElement | undefined): (ImageBitmap | HTMLImageElement) | null {
  if (!img) return null;
  if ("close" in img) return img.width > 0 ? img : null;
  return img.complete && img.naturalWidth > 0 ? img : null;
}

function preload(src: string): Promise<void> {
  if (typeof Image === "undefined") return Promise.resolve();
  if (ready(loaded.get(src))) return Promise.resolve();
  const gen = generation;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const keep = (bmp: ImageBitmap | HTMLImageElement) => {
        if (gen !== generation) {
          if ("close" in bmp) bmp.close();
          img.src = "";
          resolve();
          return;
        }
        loaded.set(src, bmp);
        if (bmp !== img) img.src = "";
        resolve();
      };
      if (typeof createImageBitmap === "function") {
        createImageBitmap(img).then(keep).catch(() => keep(img));
      } else keep(img);
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

export function plateFor(scene: string): ImageBitmap | HTMLImageElement | null {
  if (!platesOn) return null;
  const spec = PLATES[scene];
  return spec ? ready(loaded.get(spec.file)) : null;
}

export function stateFor(scene: string, visual: string): ImageBitmap | HTMLImageElement | null {
  if (!platesOn) return null;
  const st = PLATES[scene]?.states?.[visual];
  return st ? ready(loaded.get(st.file)) : null;
}

export function roverSheet(): ImageBitmap | HTMLImageElement | null {
  if (!platesOn) return null;
  return ready(loaded.get(ROVER_SHEET));
}

/** Drop decoded plates. close() frees the pixels. A finished shift does not keep the photos. */
export function releasePlates() {
  generation += 1;
  for (const img of loaded.values()) {
    if ("close" in img) {
      try {
        img.close();
      } catch {
        /* already closed */
      }
    } else {
      img.onload = null;
      img.onerror = null;
      img.src = "";
    }
  }
  loaded.clear();
}
