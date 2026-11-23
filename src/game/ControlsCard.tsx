/** The controls card. Short lines. Keyboard, mouse, and a pad. */

const LINES = [
  "Walk with W A S D, the arrows, or the left stick.",
  "Mouse: click a button, a prompt, or the picture.",
  "E talks or uses. On a pad, A does that.",
  "P peer-checks. R reports. H hides. Three hides end the week.",
  "Esc or Start pauses. B is back.",
  "Menus: arrows or the stick, then Enter or A.",
  "Night: Space is the tablet. 1 to 8 pick cameras. B brews.",
  "Cabinets: arrows aim. Space or Enter acts. Mouse still works.",
];

export function ControlsCard({ onClose }: { onClose?: () => void }) {
  return (
    <div data-testid="controls-card">
      <p className="font-mono text-[10px] tracking-widest text-subtle">Controls</p>
      <ul className="mt-2 space-y-1 text-sm leading-relaxed text-fg">
        {LINES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {onClose ? (
        <button type="button" className="btn-ghost mt-3" data-testid="controls-close" onClick={onClose}>
          Back
        </button>
      ) : null}
    </div>
  );
}
