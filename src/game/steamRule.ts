/** When Maintenance draws valve steam. Reads residue. Does not change it.
 * Day 1 and the valve not caught: on. A catch is off. A hide stays on. Later days are off.
 */
export function maintenanceSteamOn(day: number, valve: "open" | "caught" | "hid"): boolean {
  return day === 1 && valve !== "caught";
}
