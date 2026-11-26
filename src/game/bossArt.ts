/**
 * Whose face sits in the director's chair. At Colt's plant (coltVoice.ts), Holt's portraits and sprites are
 * swapped for Colt's own: grey hair, a short grey beard, a sage zip-up instead of the tie. The game sets this from
 * the shift's plant; every art lookup for a person goes through artId().
 */
let boss: "holt" | "colt" = "holt";

export function setBossArt(plant: "holt" | "colt") {
  boss = plant;
}

export function artId<T extends string>(who: T): T | "colt" {
  return who === "holt" && boss === "colt" ? "colt" : who;
}
