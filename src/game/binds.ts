/** Rebindable keys. Saved in cc.settings with the volume. Escape always pauses. */

const KEY = "cc.settings";

export type Act = "up" | "down" | "left" | "right" | "interact" | "peer" | "report" | "hide" | "confirm";

export const ACTS: { id: Act; label: string }[] = [
  { id: "up", label: "Up" },
  { id: "down", label: "Down" },
  { id: "left", label: "Left" },
  { id: "right", label: "Right" },
  { id: "interact", label: "Use" },
  { id: "peer", label: "Peer check" },
  { id: "report", label: "Report" },
  { id: "hide", label: "Hide" },
  { id: "confirm", label: "Confirm" },
];

const DEFAULTS: Record<Act, string> = {
  up: "KeyW",
  down: "KeyS",
  left: "KeyA",
  right: "KeyD",
  interact: "KeyE",
  peer: "KeyP",
  report: "KeyR",
  hide: "KeyH",
  confirm: "Space",
};

let cache: Record<Act, string> | null = null;

function readAll(): Record<string, unknown> {
  try {
    if (typeof localStorage === "undefined") return {};
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as Record<string, unknown>;
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

function writeAll(next: Record<string, unknown>) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
}

export function binds(): Record<Act, string> {
  if (cache) return cache;
  const saved = readAll().binds;
  const next = { ...DEFAULTS };
  if (saved && typeof saved === "object") {
    for (const id of Object.keys(DEFAULTS) as Act[]) {
      const v = (saved as Record<string, unknown>)[id];
      if (typeof v === "string" && v.length > 0 && v.length < 24 && v !== "Escape") next[id] = v;
    }
  }
  cache = next;
  return next;
}

export function isBound(code: string): boolean {
  return Object.values(binds()).includes(code);
}

export function setBind(act: Act, code: string) {
  if (!code || code === "Escape" || code.length > 24) return;
  const next = { ...binds() };
  for (const id of Object.keys(next) as Act[]) {
    if (id !== act && next[id] === code) next[id] = DEFAULTS[id] === code ? "" : DEFAULTS[id];
  }
  next[act] = code;
  cache = next;
  writeAll({ ...readAll(), binds: next });
}

export function keyLabel(code: string): string {
  if (!code) return "None";
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Arrow")) return code.slice(5);
  if (code === "Space") return "Space";
  return code;
}

export function actHeld(has: (code: string) => boolean, act: Act, arrow: string): boolean {
  const code = binds()[act];
  return (!!code && has(code)) || has(arrow);
}
