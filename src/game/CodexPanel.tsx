/**
 * The in-game codex. A note stays locked until play opens it. Drafts for the owner.
 */
import { CODEX, codexUnlocked, type CodexPlay } from "./codex";
import { PAL } from "./palette";

export function CodexPanel({ play }: { play: CodexPlay }) {
  const open = CODEX.filter((e) => codexUnlocked(e.id, play)).length;
  return (
    <section data-testid="codex" style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${PAL.steel}` }}>
      <h2 style={{ fontFamily: "var(--font-title)", fontSize: "var(--text-title-sm)", margin: 0 }}>How real is this?</h2>
      <p style={{ fontSize: "var(--text-small)", margin: "8px 0 0" }} data-testid="codex-draft">
        Draft notes for the owner. Teaching model only. Not regulations, and not a procedure. {open} of {CODEX.length} opened by play.
      </p>
      <ol style={{ listStyle: "none", margin: "10px 0 0", padding: 0 }}>
        {CODEX.map((entry) => {
          const unlocked = codexUnlocked(entry.id, play);
          return (
            <li key={entry.id} data-testid={`codex-${entry.id}`} data-open={unlocked ? "1" : "0"} style={{ marginTop: 10 }}>
              <p style={{ margin: 0, fontSize: "var(--text-small)" }}>
                <b>{entry.title}.</b> {unlocked ? entry.body : `Still locked. ${entry.opens}`}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
