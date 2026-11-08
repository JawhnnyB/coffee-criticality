/**
 * The Local news engine (spec 10). Pure: same inputs, same items. The shipped pool is empty, so the tab
 * says "Not in this build." until the owner writes items. The tests carry their own pool.
 * Nothing here names a town, a company or a person. A residue hide is never labelled as a catch.
 */

export type LocalKind = "catch" | "hide" | "note";

export interface LocalItem {
  id: string;
  kind: LocalKind;
  text: string;
  /** Only these seasons. Empty or unset means any season. */
  seasons?: readonly string[];
  /** Only these stances. Empty or unset means any stance. */
  stances?: readonly string[];
  /** Earliest day the item can show. */
  minDay?: number;
  /** "hide": only when the residue has a hide. "clean": only when it has none. Unset: either. */
  residue?: "hide" | "clean";
}

export interface LocalContext {
  seed: number;
  season: string | null;
  stance: string | null;
  day: number;
  /** How many residue entries read "hid". */
  residueHides: number;
}

/** The shipped pool. Empty until the owner writes the items. */
export const SHIPPED_LOCAL_POOL: readonly LocalItem[] = [];

/** The label a line carries. A hide is never a catch. */
export function localLabel(kind: LocalKind): "Catch" | "Hide" | "Note" {
  if (kind === "hide") return "Hide";
  if (kind === "catch") return "Catch";
  return "Note";
}

/** Small seeded generator (mulberry32). Same seed, same sequence. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function eligible(item: LocalItem, ctx: LocalContext): boolean {
  if (item.seasons && item.seasons.length > 0 && (ctx.season === null || !item.seasons.includes(ctx.season))) return false;
  if (item.stances && item.stances.length > 0 && (ctx.stance === null || !item.stances.includes(ctx.stance))) return false;
  if (item.minDay !== undefined && ctx.day < item.minDay) return false;
  if (item.residue === "hide" && ctx.residueHides <= 0) return false;
  if (item.residue === "clean" && ctx.residueHides > 0) return false;
  return true;
}

/**
 * Picks 3 to 5 items when the pool has enough eligible items (fewer if it does not). Order is seeded.
 * Returns [] for an empty pool, which is what ships.
 */
export function pickLocal(pool: readonly LocalItem[], ctx: LocalContext): LocalItem[] {
  const list = pool.filter((item) => eligible(item, ctx));
  if (list.length === 0) return [];
  const rand = rng(ctx.seed);
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  const want = Math.min(copy.length, 3 + Math.floor(rand() * 3));
  return copy.slice(0, want);
}
