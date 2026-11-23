/**
 * File names for the desktop save folder.
 * The same strings as save.ts. The week file itself is not edited.
 * The browser keeps using localStorage. Only the desktop shell calls this.
 */

export const LIVE_SAVE = "cc.save.v2";
export const OLD_SAVE = "cc.save.v1";
export const CORRUPT_SAVE = "cc.save.v2.corrupt";
/** Newest backup first. Three are kept. */
export const SAVE_BACKUPS = ["cc.save.v2.1", "cc.save.v2.2", "cc.save.v2.3"] as const;

export type SaveFiles = Map<string, string>;

/** Shift the previous live save into the backup slots, then store the new text. */
export function rotateSaves(files: SaveFiles, next: string): { files: SaveFiles; drop: string[] } {
  const out: SaveFiles = new Map(files);
  const drop: string[] = [];
  const prev = out.get(LIVE_SAVE);
  if (prev != null && prev !== next) {
    const mid = out.get(SAVE_BACKUPS[1]);
    if (mid != null) out.set(SAVE_BACKUPS[2], mid);
    else if (out.has(SAVE_BACKUPS[2])) {
      out.delete(SAVE_BACKUPS[2]);
      drop.push(SAVE_BACKUPS[2]);
    }
    const newest = out.get(SAVE_BACKUPS[0]);
    if (newest != null) out.set(SAVE_BACKUPS[1], newest);
    else if (out.has(SAVE_BACKUPS[1])) {
      out.delete(SAVE_BACKUPS[1]);
      drop.push(SAVE_BACKUPS[1]);
    }
    out.set(SAVE_BACKUPS[0], prev);
  }
  out.set(LIVE_SAVE, next);
  return { files: out, drop };
}
