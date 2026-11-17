/**
 * What the hall and the cutaway should copy from Reactor Control.
 * Not part of the sim. A tripped pump sets flowMul to 0 so the arrows stop.
 * A tube leak sets tubeMark.
 */
export interface SiteFace {
  flowMul: number;
  tubeMark: boolean;
}

let face: SiteFace = { flowMul: 1, tubeMark: false };

export function publishFace(next: SiteFace) {
  face = { flowMul: next.flowMul, tubeMark: next.tubeMark };
}

export function readFace(): SiteFace {
  return face;
}
