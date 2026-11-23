/** The controls card. Short lines. Keyboard, mouse, and a pad. */
import { CONTROL_LINES, UI } from "./uiStrings";

export function ControlsCard({ onClose }: { onClose?: () => void }) {
  return (
    <div data-testid="controls-card">
      <p className="font-mono text-[10px] tracking-widest text-subtle">{UI.controls}</p>
      <ul className="mt-2 space-y-1 text-sm leading-relaxed text-fg">
        {CONTROL_LINES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {onClose ? (
        <button type="button" className="btn-ghost mt-3" data-testid="controls-close" onClick={onClose}>
          {UI.back}
        </button>
      ) : null}
    </div>
  );
}
