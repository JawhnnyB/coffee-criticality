/** The known-issues card. The words are docs/KNOWN-ISSUES.md. */
import text from "../../docs/KNOWN-ISSUES.md?raw";
import { UI } from "./uiStrings";

export function KnownIssues({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: "rgba(22,17,13,0.78)" }}
      data-testid="known-issues-panel"
    >
      <div className="cc-sheet max-h-full overflow-y-auto">
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{text.trim()}</div>
        <button type="button" className="btn-ghost mt-3" data-testid="known-issues-close" onClick={onClose}>
          {UI.back}
        </button>
      </div>
    </div>
  );
}
