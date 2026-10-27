/** Letter-reveal gate. Sim and the typewriter share this so a click can finish a line without advancing it. */

let revealing = false;
const subs = new Set<() => void>();
const revealSubs = new Set<(v: boolean) => void>();

export function isRevealing() {
  return revealing;
}

export function setRevealing(v: boolean) {
  revealing = v;
  for (const fn of revealSubs) fn(v);
}

export function subscribeReveal(fn: (v: boolean) => void) {
  revealSubs.add(fn);
  fn(revealing);
  return () => {
    revealSubs.delete(fn);
  };
}

export function requestSkip() {
  if (!revealing) return;
  setRevealing(false);
  for (const fn of subs) fn();
}

export function subscribeSkip(fn: () => void) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}
