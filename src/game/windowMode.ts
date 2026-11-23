/** Desktop window. The week save does not store this. The browser build ignores it. */

export type WindowMode = "windowed" | "fullscreen" | "borderless";

export type RememberedWindow = { mode: WindowMode; width: number; height: number };

const KEY = "cc.window";
const DEFAULTS: RememberedWindow = { mode: "windowed", width: 1280, height: 720 };

export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function clean(raw: unknown): RememberedWindow {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const mode = o.mode === "fullscreen" || o.mode === "borderless" || o.mode === "windowed" ? o.mode : DEFAULTS.mode;
  const width = typeof o.width === "number" && o.width >= 320 && o.width <= 8000 ? Math.round(o.width) : DEFAULTS.width;
  const height = typeof o.height === "number" && o.height >= 240 && o.height <= 8000 ? Math.round(o.height) : DEFAULTS.height;
  return { mode, width, height };
}

export function readWindow(): RememberedWindow {
  try {
    if (typeof localStorage === "undefined") return { ...DEFAULTS };
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return clean(JSON.parse(raw));
  } catch {
    return { ...DEFAULTS };
  }
}

export function writeWindow(next: RememberedWindow) {
  const cleaned = clean(next);
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify(cleaned));
  } catch {
    /* private mode */
  }
  return cleaned;
}

/** Fullscreen must not replace the size the player will come back to. */
export function rememberResize(prev: RememberedWindow, width: number, height: number): RememberedWindow {
  if (prev.mode === "fullscreen") return prev;
  return writeWindow({ ...prev, width, height });
}

export async function applyWindow(next: RememberedWindow): Promise<RememberedWindow> {
  const cleaned = writeWindow(next);
  if (!isDesktop()) return cleaned;
  const { getCurrentWindow, LogicalSize } = await import("@tauri-apps/api/window");
  const win = getCurrentWindow();
  if (cleaned.mode === "fullscreen") {
    await win.setDecorations(true);
    await win.setFullscreen(true);
    return cleaned;
  }
  await win.setFullscreen(false);
  await win.setDecorations(cleaned.mode === "windowed");
  await win.setSize(new LogicalSize(cleaned.width, cleaned.height));
  return cleaned;
}

/** Restore the last mode and keep later resizes, except while fullscreen. */
export async function bootWindow(): Promise<void> {
  const saved = readWindow();
  await applyWindow(saved);
  if (!isDesktop()) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  const win = getCurrentWindow();
  await win.onResized(({ payload }) => {
    void win.scaleFactor().then((scale) => {
      const factor = scale || 1;
      rememberResize(readWindow(), payload.width / factor, payload.height / factor);
    });
  });
}
