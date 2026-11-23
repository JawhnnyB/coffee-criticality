/** A pause that does not change the sim mode, so a night or a cabinet stays where it was. */

let on = false;

export function shiftHeld(): boolean {
  return on;
}

export function setShiftHeld(next: boolean) {
  on = next;
}
