/** Letter-reveal gate. Sim and the typewriter share this so a click can finish a line without advancing it. */

let revealing = false;
const subs = new Set<() => void>();

export function isRevealing() {
  return revealing;
}

export function setRevealing(v: boolean) {
  revealing = v;
}

export function requestSkip() {
  if (!revealing) return;
  revealing = false;
  for (const fn of subs) fn();
}

export function subscribeSkip(fn: () => void) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}
