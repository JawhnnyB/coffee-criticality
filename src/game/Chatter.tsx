import { useEffect, useRef, useState } from "react";
import { playVoice } from "./audio";
import { setRevealing, subscribeSkip } from "./chatter";

const STEP = 28;

function spoken(ch: string) {
  return /[A-Za-z0-9]/.test(ch);
}

/** Letter-by-letter line. Each glyph pops in. Spaces keep their width so the box does not jump. */
export function Chatter({ text, voice, className }: { text: string; voice: string; className?: string }) {
  const [count, setCount] = useState(0);
  const [instant, setInstant] = useState(false);
  const gen = useRef(0);

  useEffect(() => {
    const id = ++gen.current;
    let i = 0;
    let timer = 0;
    let dead = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alive = () => !dead && gen.current === id;

    const finish = (quiet: boolean) => {
      if (!alive()) return;
      window.clearTimeout(timer);
      setInstant(true);
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
    setInstant(false);
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

  const words: { ch: string; i: number }[][] = [];
  let word: { ch: string; i: number }[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === " ") {
      if (word.length) words.push(word);
      word = [];
      words.push([{ ch, i }]);
    } else {
      word.push({ ch, i });
    }
  }
  if (word.length) words.push(word);

  return (
    <p className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((group) => (
          <span key={group[0].i} className={group[0].ch === " " ? undefined : "inline-block whitespace-nowrap"}>
            {group.map(({ ch, i }) => (
              <span key={i} className={i < count ? (instant ? "chatter-set" : "chatter-ch") : "chatter-wait"}>
                {ch}
              </span>
            ))}
          </span>
        ))}
      </span>
    </p>
  );
}
