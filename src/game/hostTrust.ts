/**
 * Extra trust from a good bowl or a good round of golf.
 * sim.ts already pays +2 on every good round. That file is frozen, so this does not change it.
 * The extra is +2, and only the first good round of that cabinet on a day pays it.
 */
export const HOST_DAY_TRUST = 2;

export function hostDayTrust(
  flags: Record<string, boolean>,
  id: string,
  day: number,
  score: number,
): { npc: "jordan" | "mabel"; trust: number } | null {
  if (score < 3) return null;
  const npc = id === "bowl" ? "jordan" : id === "golf" ? "mabel" : null;
  if (!npc) return null;
  const key = `cab:${id}:trust:d${day}`;
  if (flags[key]) return null;
  flags[key] = true;
  return { npc, trust: HOST_DAY_TRUST };
}
