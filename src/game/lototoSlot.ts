import { rng } from "./parlorMusic";

/**
 * Orange IN SERVICE slot, 0–8. Uses the parlor seeded generator.
 * The first draw of that generator sits near 0 for small seeds, so the slot is the second draw.
 * Same seed, same slot. Clock, penalty, culture, and trust are not decided here.
 */
export function lieSlot(seed: number): number {
  const roll = rng(seed);
  roll();
  return Math.floor(roll() * 9);
}
