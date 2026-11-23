/** Player-facing chrome. Story lines stay in their scene files. No line over two phone rows. */

export const UI = {
  menuBegin: "Begin",
  menuContinue: "Continue",
  menuSettings: "Settings",
  soundOn: "Sound on",
  soundOff: "Sound off",
  teaching: "Teaching model, not a license",
  paused: "Paused",
  clockStopped: "The clock is stopped.",
  resume: "Resume",
  controls: "Controls",
  back: "Back",
  keysNote: "Esc still pauses. Arrows still walk.",
  textSize: "Text size",
  small: "Small",
  normal: "Normal",
  large: "Large",
  motionOn: "Reduced motion on",
  motionOff: "Reduced motion off",
  shakeOn: "Screen shake on",
  shakeOff: "Screen shake off",
  master: "Master",
  music: "Music",
  sound: "Sound",
  ambience: "Ambience",
  frameRate: "Frame rate",
  howTitle: "How to play",
  knownIssues: "Known issues",
  keys: "Keys",
  resetKeys: "Reset keys",
  window: "Window",
  windowed: "Windowed",
  fullscreen: "Fullscreen",
  borderless: "Borderless",
} as const;

export const CONTROL_LINES = [
  "Walk with W A S D, the arrows, or the left stick.",
  "Mouse: click a button, a prompt, or the picture.",
  "E talks or uses. On a pad, A does that.",
  "P peer-checks. R reports. H hides. Three hides end the week.",
  "Esc or Start pauses. B is back.",
  "Menus: arrows or the stick, then Enter or A.",
  "Night: Space is the tablet. 1 to 8 pick cameras. B brews.",
  "Cabinets: arrows aim. Space or Enter acts. Mouse still works.",
  "Keys can be changed in Settings. Esc still pauses.",
] as const;

export function chromeLines(): string[] {
  return [...Object.values(UI), ...CONTROL_LINES];
}
