/** How many nights are on the log. Kept out of the camera module so the menu does not load it. */
export function nightsDone(flags: Record<string, boolean>): number {
  let n = 0;
  while (flags[`night:${n + 1}:done`]) n++;
  return n;
}
