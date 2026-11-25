"use client";

/**
 * Mabel's prize shelf, under the cabinets in the parlor. Rules: parlorPrizes.ts (named so it never clashes with this file on a case-insensitive disk).
 * Six toys, one per person but Holt. A toy goes on the shelf when you clear level 1 of that person's cabinet.
 * Card text uses divs: the cabinet screen colours every <p> cream for its dark glass, which vanishes on a light card.
 */
import { useState } from "react";
import { NO_TOY_FOR_HOLT, TOYS, buyToy, readJar, toyState, writeJar, type Jar } from "./parlorPrizes";
import { SPEAKER } from "./floorTalks";

export function PrizeShelf({ flags, onBought }: { flags: Record<string, boolean>; onBought?: () => void }) {
  const [jar, setJar] = useState<Jar>(readJar);
  return (
    <section className="mt-5" data-testid="prize-shelf" aria-label="Mabel's prize shelf">
      <p className="font-mono text-[10px] tracking-widest text-[#c9a227]">
        PRIZE SHELF
        <span className="ml-2 text-[#b5a48c]">
          Tokens in the jar: <span data-testid="token-count" className="text-[#f3e6d0]">{jar.tokens}</span> · a run pays 1, clearing the level pays 2, up to 3 a cabinet a day
        </span>
      </p>
      <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {TOYS.map((toy) => {
          const st = toyState(toy, flags, jar);
          const who = SPEAKER[toy.npc];
          return (
            <div key={toy.npc} className="border border-[#c4783a]/50 bg-[#f3e6d0] px-2 py-2 text-[#2a2218]" data-testid={`toy-${toy.npc}`} data-state={st}>
              <div className="font-mono text-[10px] tracking-widest">
                {toy.name.toUpperCase()} · {who}
              </div>
              <div className="mt-0.5 text-[10px] leading-snug text-[#6a4a32]">{st === "locked" ? `Clear ${toy.cabTitle} level 1 to put it on the shelf.` : toy.blurb}</div>
              {st === "shelf" ? (
                <button
                  type="button"
                  className="btn-ghost mt-1 w-full text-[11px]"
                  style={{ color: "#16110d", borderColor: "#16110d" }}
                  disabled={jar.tokens < toy.cost}
                  data-testid={`buy-${toy.npc}`}
                  onClick={() => {
                    const next = buyToy(toy, flags, jar);
                    if (!next) return;
                    writeJar(next);
                    setJar(next);
                    onBought?.();
                  }}
                >
                  {jar.tokens < toy.cost ? `${toy.cost} tokens (${toy.cost - jar.tokens} more)` : `Take it · ${toy.cost} tokens`}
                </button>
              ) : null}
              {st === "pocket" ? <div className="mt-1 text-[10px] text-[#3d5c44]">In your pocket. Give it to {who} next time you talk.</div> : null}
              {st === "given" ? <div className="mt-1 text-[10px] text-[#3d5c44]">Given. {who} kept it.</div> : null}
            </div>
          );
        })}
      </div>
      <p className="mt-1 text-[10px] text-[#b5a48c]" data-testid="toy-holt">
        Holt · Mabel: &ldquo;{NO_TOY_FOR_HOLT}&rdquo;
      </p>
    </section>
  );
}
