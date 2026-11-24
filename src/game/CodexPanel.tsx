/**
 * The in-game codex. Draft notes for the owner. Step 63 hides a note until play opens it.
 */
import { CODEX } from "./codex";
import { PAL } from "./palette";

export function CodexPanel() {
  return (
    <section data-testid="codex" style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${PAL.steel}` }}>
      <h2 style={{ fontFamily: "var(--font-title)", fontSize: "var(--text-title-sm)", margin: 0 }}>How real is this?</h2>
      <p style={{ fontSize: "var(--text-small)", margin: "8px 0 0" }} data-testid="codex-draft">
        Draft notes for the owner. Teaching model only. Not regulations, and not a procedure.
      </p>
      <ol style={{ listStyle: "none", margin: "10px 0 0", padding: 0 }}>
        {CODEX.map((entry) => (
          <li key={entry.id} data-testid={`codex-${entry.id}`} style={{ marginTop: 10 }}>
            <p style={{ margin: 0, fontSize: "var(--text-small)" }}>
              <b>{entry.title}.</b> {entry.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
