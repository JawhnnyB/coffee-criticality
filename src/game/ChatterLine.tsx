import { useEffect, useRef, useState } from "react";
import { playVoice } from "./audio";
import { setRevealing, subscribeSkip } from "./chatter";

declare global {
  interface Window {
    __ccHold?: number;
    __ccOy?: number;
  }
}

const STEP = 28;

function spoken(ch: string) {
  return /[A-Za-z0-9]/.test(ch);
}

function holdCount() {
  const n = window.__ccHold;
  return typeof n === "number" ? n : null;
}

/** One element, one size, one baseline. Characters appear by slicing the string — never by transforming glyphs. */
export function Chatter({ text, voice, className }: { text: string; voice: string; className?: string }) {
  const [count, setCount] = useState(0);
  const gen = useRef(0);

  useEffect(() => {
    const id = ++gen.current;
    let i = 0;
    let timer = 0;
    let dead = false;
    const alive = () => !dead && gen.current === id;
    const held = holdCount();
    if (held != null) {
      const n = Math.max(0, Math.min(text.length, held));
      setCount(n);
      setRevealing(n < text.length);
      const onHold = () => {
        if (!alive()) return;
        const next = holdCount();
        if (next == null) return;
        const c = Math.max(0, Math.min(text.length, next));
        setCount(c);
        setRevealing(c < text.length);
      };
      window.addEventListener("cc-hold", onHold);
      return () => {
        dead = true;
        window.removeEventListener("cc-hold", onHold);
        setRevealing(false);
      };
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = (quiet: boolean) => {
      if (!alive()) return;
      window.clearTimeout(timer);
      setCount(text.length);
      setRevealing(false);
      if (!quiet && reduce && text.length) playVoice(voice);
    };

    if (reduce || text.length === 0) {
      finish(false);
      return () => {
        dead = true;
      };
    }

    setCount(0);
    setRevealing(true);
    const off = subscribeSkip(() => finish(true));

    const step = () => {
      if (!alive()) return;
      i += 1;
      setCount(i);
      const ch = text[i - 1] ?? "";
      if (spoken(ch)) playVoice(voice);
      if (i >= text.length) {
        setRevealing(false);
        return;
      }
      const breath = /[.!?]/.test(ch) ? 110 : ch === "," || ch === "—" ? 50 : 0;
      timer = window.setTimeout(step, STEP + breath);
    };
    timer = window.setTimeout(step, 40);

    return () => {
      dead = true;
      window.clearTimeout(timer);
      off();
      setRevealing(false);
    };
  }, [text, voice]);

  return (
    <p className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{text.slice(0, count)}</span>
    </p>
  );
}
