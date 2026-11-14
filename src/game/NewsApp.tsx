import { useEffect, useState } from "react";
import { PAL } from "./palette";
import { pickLocal, SHIPPED_LOCAL_POOL, localLabel, type LocalItem } from "./localNews";
import type { GameState } from "./sim";

const FIELD = { fontFamily: "CCPixel3x5, monospace", color: PAL.ink } as const;
const QUIET_WORLD = "The wire is quiet. Nothing has come in for this shift.";
const QUIET_LOCAL = "The plant paper is blank today.";

interface WorldItem {
  id: string;
  headline: string;
  source: string;
  date: string;
}

/** News: two tabs. World reads the committed list (empty until the owner writes it). Local is the seeded engine. */
export function NewsApp({ s }: { s: GameState }) {
  const [tab, setTab] = useState<"world" | "local">("world");
  const [world, setWorld] = useState<WorldItem[] | null>(null);
  useEffect(() => {
    let live = true;
    fetch("data/news.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((j) => live && setWorld(Array.isArray(j) ? (j as WorldItem[]) : []))
      .catch(() => live && setWorld([]));
    return () => {
      live = false;
    };
  }, []);
  const residueHides = Object.values(s.residue).filter((v) => v === "hid").length;
  const local: LocalItem[] = pickLocal(SHIPPED_LOCAL_POOL, {
    seed: s.setup.seed,
    season: s.setup.season,
    stance: s.setup.stance,
    day: s.day,
    residueHides,
  });
  return (
    <div className="p-3" style={FIELD} data-testid="app-news">
      <p style={{ margin: 0, fontSize: 14 }}>News</p>
      <div className="mt-2 flex gap-2" role="tablist">
        {(["world", "local"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            data-testid={`news-tab-${t}`}
            onClick={() => setTab(t)}
            style={{ fontFamily: "inherit", fontSize: 12, border: `1px solid ${PAL.ink}`, padding: "2px 8px", background: tab === t ? PAL.cream : "transparent", color: PAL.ink }}
          >
            {t === "world" ? "World" : "Local"}
          </button>
        ))}
      </div>
      {tab === "world" ? (
        <div style={{ marginTop: 10, fontSize: 24 }} data-testid="news-world">
          {world === null ? null : world.length === 0 ? <p>{QUIET_WORLD}</p> : world.map((w) => <p key={w.id}>{`${w.headline} · ${w.source} · ${w.date}`}</p>)}
        </div>
      ) : (
        <div style={{ marginTop: 10, fontSize: 24 }} data-testid="news-local">
          {local.length === 0 ? (
            <p>{QUIET_LOCAL}</p>
          ) : (
            local.map((item) => (
              <p key={item.id}>
                {localLabel(item.kind)}: {item.text}
              </p>
            ))
          )}
        </div>
      )}
    </div>
  );
}
