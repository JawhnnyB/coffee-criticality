"use client";

import { useState } from "react";
import { refreshMix, unlockAudio } from "./audio";
import {
  mixLevels,
  reducedMotionOn,
  setMixLevel,
  setReducedMotion,
  setShakeOn,
  setTextSize,
  shakeOn,
  textSize,
  type Mix,
  type TextSize,
} from "./frameRate";

const ROWS: { key: keyof Mix; label: string; test: string }[] = [
  { key: "master", label: "Master", test: "vol-master" },
  { key: "music", label: "Music", test: "vol-music" },
  { key: "sound", label: "Sound", test: "vol-sound" },
  { key: "ambience", label: "Ambience", test: "vol-ambience" },
];

const SIZES: { id: TextSize; label: string }[] = [
  { id: "small", label: "Small" },
  { id: "normal", label: "Normal" },
  { id: "large", label: "Large" },
];

/** Volume, text size, motion, and screen shake. Saved in cc.settings, not the week. */
export function SettingsFields() {
  const [mix, setMix] = useState<Mix>(() => mixLevels());
  const [text, setText] = useState<TextSize>(() => textSize());
  const [motion, setMotion] = useState(() => reducedMotionOn());
  const [shake, setShake] = useState(() => shakeOn());

  const slide = (key: keyof Mix, raw: string) => {
    unlockAudio();
    setMixLevel(key, Number(raw));
    refreshMix();
    setMix(mixLevels());
  };

  return (
    <div data-testid="settings-fields" className="flex flex-col gap-2">
      {ROWS.map((row) => (
        <label key={row.key} className="flex flex-col gap-1 text-[11px] text-fg">
          {row.label}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={mix[row.key]}
            data-testid={row.test}
            aria-label={row.label}
            onChange={(e) => slide(row.key, e.target.value)}
          />
        </label>
      ))}
      <p className="font-mono text-[10px] tracking-widest text-subtle">Text size</p>
      <div className="grid grid-cols-3 gap-2">
        {SIZES.map((row) => (
          <button
            key={row.id}
            type="button"
            className={text === row.id ? "btn-primary" : "btn-ghost"}
            data-testid={`text-${row.id}`}
            aria-pressed={text === row.id}
            onClick={() => {
              setTextSize(row.id);
              setText(row.id);
            }}
          >
            {row.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn-ghost"
        data-testid="reduced-motion-global"
        aria-pressed={motion}
        onClick={() => {
          const next = !motion;
          setReducedMotion(next);
          setMotion(next);
        }}
      >
        {motion ? "Reduced motion on" : "Reduced motion off"}
      </button>
      <button
        type="button"
        className="btn-ghost"
        data-testid="shake-toggle"
        aria-pressed={shake}
        onClick={() => {
          const next = !shake;
          setShakeOn(next);
          setShake(next);
        }}
      >
        {shake ? "Screen shake on" : "Screen shake off"}
      </button>
    </div>
  );
}
