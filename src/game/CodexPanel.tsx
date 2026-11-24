/**
 * The in-game codex. A note stays locked until play opens it.
 * Watchstander notes are optional and off until the player asks. Drafts for the owner.
 */
import { useState } from "react";
import { CODEX, WATCHSTANDER, codexUnlocked, type CodexPlay } from "./codex";
import { PAL } from "./palette";

const NOTES_KEY = "cc.codex.notes";

export function CodexPanel({ play }: { play: CodexPlay }) {
  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem(NOTES_KEY) === "1";
    } catch {
      return false;
    }
  });
  const open = CODEX.filter((e) => codexUnlocked(e.id, play)).length;
  const toggle = () => {
    const next = !notes;
    setNotes(next);
    try {
      localStorage.setItem(NOTES_KEY, next ? "1" : "0");
    } catch {
      /* private mode */
    }
  };
  return (
    <section data-testid="codex" style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${PAL.steel}` }}>
      <h2 style={{ fontFamily: "var(--font-title)", fontSize: "var(--text-title-sm)", margin: 0 }}>How real is this?</h2>
      <p style={{ fontSize: "var(--text-small)", margin: "8px 0 0" }} data-testid="codex-draft">
        Draft notes for the owner. Teaching model only. Not regulations, and not a procedure. {open} of {CODEX.length} opened by play.
      </p>
      <button
        type="button"
        data-testid="codex-notes"
        aria-pressed={notes}
        onClick={toggle}
        style={{ marginTop: 8, minHeight: 44, fontFamily: "inherit", fontSize: "var(--text-small)", background: notes ? PAL.copper : PAL.cream, color: notes ? PAL.cream : PAL.ink, border: `2px solid ${PAL.outline}`, padding: "4px 10px", cursor: "pointer" }}
      >
        {notes ? "Watchstander notes on" : "Watchstander notes"}
      </button>
      <ol style={{ listStyle: "none", margin: "10px 0 0", padding: 0 }}>
        {CODEX.map((entry) => {
          const unlocked = codexUnlocked(entry.id, play);
          const extra = notes && unlocked ? WATCHSTANDER[entry.id] : "";
          return (
            <li key={entry.id} data-testid={`codex-${entry.id}`} data-open={unlocked ? "1" : "0"} style={{ marginTop: 10 }}>
              <p style={{ margin: 0, fontSize: "var(--text-small)" }}>
                <b>{entry.title}.</b> {unlocked ? entry.body : `Still locked. ${entry.opens}`}
              </p>
              {extra ? (
                <p style={{ margin: "2px 0 0", fontSize: "var(--text-small)", color: PAL.copperD }} data-testid={`codex-note-${entry.id}`}>
                  Watchstander note, draft: {extra}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
