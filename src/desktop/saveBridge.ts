/**
 * On the desktop build, the week save lives in the OS app-data folder.
 * The browser build never calls this. localStorage stays the web store.
 */
import { invoke } from "@tauri-apps/api/core";
import { CORRUPT_SAVE, LIVE_SAVE, OLD_SAVE, rotateSaves, SAVE_BACKUPS, type SaveFiles } from "../game/deskSave";
import { isDesktop } from "../game/windowMode";

const MIRROR = [LIVE_SAVE, OLD_SAVE, CORRUPT_SAVE];
const ALL = [LIVE_SAVE, ...SAVE_BACKUPS, OLD_SAVE, CORRUPT_SAVE];

async function readFile(name: string): Promise<string | null> {
  return invoke<string | null>("read_save_file", { name });
}

async function writeFile(name: string, body: string): Promise<void> {
  await invoke("write_save_file", { name, body });
}

async function removeFile(name: string): Promise<void> {
  await invoke("remove_save_file", { name });
}

async function loadFiles(): Promise<SaveFiles> {
  const files: SaveFiles = new Map();
  for (const name of ALL) {
    const body = await readFile(name);
    if (body != null) files.set(name, body);
  }
  return files;
}

let chain: Promise<void> = Promise.resolve();

function queue(job: () => Promise<void>) {
  chain = chain.then(job).catch(() => undefined);
}

async function persistLive(next: string) {
  const loaded = await loadFiles();
  const { files, drop } = rotateSaves(loaded, next);
  for (const name of drop) await removeFile(name);
  for (const [name, body] of files) {
    if (loaded.get(name) !== body) await writeFile(name, body);
  }
}

function hookStorage() {
  const setItem = localStorage.setItem.bind(localStorage);
  const removeItem = localStorage.removeItem.bind(localStorage);
  localStorage.setItem = (key: string, value: string) => {
    setItem(key, value);
    if (key === LIVE_SAVE) queue(() => persistLive(value));
    else if (key === OLD_SAVE || key === CORRUPT_SAVE) queue(() => writeFile(key, value));
  };
  localStorage.removeItem = (key: string) => {
    removeItem(key);
    if (key === LIVE_SAVE || key === OLD_SAVE || key === CORRUPT_SAVE) queue(() => removeFile(key));
  };
}

/** Pull the OS files into localStorage before the game looks for a week. */
export async function hydrateDeskSaves(): Promise<void> {
  if (!isDesktop()) return;
  try {
    const files = await loadFiles();
    const live = files.get(LIVE_SAVE);
    if (live != null) localStorage.setItem(LIVE_SAVE, live);
    const old = files.get(OLD_SAVE);
    if (old != null) localStorage.setItem(OLD_SAVE, old);
    const bad = files.get(CORRUPT_SAVE);
    if (bad != null) localStorage.setItem(CORRUPT_SAVE, bad);
  } catch {
    /* The week stays in the webview store if the folder cannot be read. */
  }
  hookStorage();
}
