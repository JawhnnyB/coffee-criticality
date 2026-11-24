/** True when the browser asks for less motion. False during server render, where `window` does not exist. */
import { useEffect, useState } from "react";
import { reducedMotionOn } from "./frameRate";

export function systemReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The settings switch, or the browser's own request. */
export function prefersReducedMotion(): boolean {
  return reducedMotionOn() || systemReducedMotion();
}

/**
 * False on the first paint, on the server and in the browser, so a saved
 * switch does not mismatch the server HTML. The effect reads the real value.
 */
export function usePrefersReducedMotion(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const read = () => setOn(prefersReducedMotion());
    read();
    window.addEventListener("cc-settings", read);
    return () => window.removeEventListener("cc-settings", read);
  }, []);
  return on;
}

/** Screen juice. Empty when motion should stay still. */
export function juiceClass(reduced: boolean): string {
  return reduced ? "" : "cc-juice";
}
