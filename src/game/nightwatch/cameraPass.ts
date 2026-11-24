/**
 * The camera pass: exposure breathing, grain, the rolling bar, scanlines and vignette.
 * Photo mode turns that pass off. It does not redraw the scene.
 */
export function cameraPass(opts: { photo?: boolean }): { breathe: boolean; grain: boolean; bar: boolean; vignette: boolean } {
  if (opts.photo) return { breathe: false, grain: false, bar: false, vignette: false };
  return { breathe: true, grain: true, bar: true, vignette: true };
}
