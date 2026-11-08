/**
 * The NRC starter index (spec 9, GROK_PHASES §9). Numbers and status only. No titles, no summaries, no
 * per-section URLs: those need the owner to verify each one against eCFR first. Search covers only these strings.
 */
export interface NrcRow {
  label: string;
  status: string;
}

const STARTER = ["Part 19", "Part 20", "Part 21", "Part 26", "Part 50", "Part 50 Appendix B", "Section 50.59", "Part 52", "Part 55", "Part 100"];

export const NRC_ROWS: readonly NrcRow[] = [
  ...STARTER.map((n) => ({ label: n, status: "verify before publish" })),
  { label: "Part 73", status: "exists, and is not described here." },
];

/** Matches the query against the label and status text on screen. An empty query returns every row. */
export function filterNrc(rows: readonly NrcRow[], query: string): NrcRow[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return rows.slice();
  return rows.filter((r) => `${r.label} ${r.status}`.toLowerCase().includes(needle));
}
