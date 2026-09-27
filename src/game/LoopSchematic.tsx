"use client";

/** Classroom PWR primary loop. Labels are the teaching. Not a license. */
export function LoopSchematic({ hot = true }: { hot?: boolean }) {
  const core = hot ? "#2a86a0" : "#8a9088";
  const glow = hot ? "#7ec8d8" : "#c8c4b8";
  return (
    <div className="overflow-hidden rounded-md border border-border bg-[#0a1220] p-2" data-testid="loop-schematic">
      <p className="font-mono text-[10px] tracking-widest text-good">PRIMARY LOOP  ·  this site  ·  teaching only</p>
      <svg viewBox="0 0 320 100" className="mt-1 h-[100px] w-full" aria-hidden>
        <rect x="8" y="10" width="70" height="72" rx="6" fill="#3d5c66" stroke="#1a1410" />
        <rect x="22" y="22" width="42" height="48" rx="4" fill={core} />
        <rect x="30" y="30" width="26" height="18" fill={glow} opacity="0.7" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={28 + i * 7} y="6" width="4" height="16" fill="#2a3840" />
        ))}
        <text x="18" y="18" fill="#f3e6d0" fontSize="7" fontFamily="monospace">
          VESSEL
        </text>
        <text x="24" y="64" fill="#f3e6d0" fontSize="6" fontFamily="monospace">
          CORE
        </text>
        <path d="M78 34 H118" stroke="#c4783a" strokeWidth="5" fill="none" />
        <text x="84" y="28" fill="#c4783a" fontSize="6" fontFamily="monospace">
          HOT LEG
        </text>
        <rect x="118" y="14" width="36" height="50" rx="4" fill="#8a7864" stroke="#1a1410" />
        <path d="M126 22 C140 22 140 56 154 56" stroke="#f3e6d0" strokeWidth="1.5" fill="none" />
        <path d="M128 26 C138 26 138 52 152 52" stroke="#f3e6d0" strokeWidth="1.5" fill="none" />
        <text x="122" y="74" fill="#f3e6d0" fontSize="6" fontFamily="monospace">
          SG
        </text>
        <rect x="168" y="8" width="22" height="40" rx="3" fill="#6b8f71" stroke="#1a1410" />
        <text x="170" y="56" fill="#6b8f71" fontSize="6" fontFamily="monospace">
          PZR
        </text>
        <circle cx="210" cy="62" r="10" fill="#3d5c66" stroke="#1a1410" />
        <circle cx="210" cy="62" r="4" fill="#c9a227" />
        <text x="200" y="82" fill="#f3e6d0" fontSize="6" fontFamily="monospace">
          RCP
        </text>
        <path d="M154 58 H210" stroke="#3d5c66" strokeWidth="5" fill="none" />
        <path d="M200 62 H78" stroke="#3d5c66" strokeWidth="5" fill="none" />
        <path d="M78 62 V34" stroke="#3d5c66" strokeWidth="4" fill="none" />
        <text x="110" y="96" fill="#8a7864" fontSize="6" fontFamily="monospace">
          COLD LEG · DOWNCOMER
        </text>
        <text x="232" y="24" fill="#6b8f71" fontSize="7" fontFamily="monospace">
          Q = ṁ × cp × ΔT
        </text>
        <text x="232" y="38" fill="#8a7864" fontSize="6" fontFamily="monospace">
          ~16 MPa liquid
        </text>
        <text x="232" y="50" fill="#8a7864" fontSize="6" fontFamily="monospace">
          CRDM from above
        </text>
        <text x="232" y="62" fill="#8a7864" fontSize="6" fontFamily="monospace">
          not a license
        </text>
      </svg>
    </div>
  );
}
