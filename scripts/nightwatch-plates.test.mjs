import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-nw-plates-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  `export { PLATES, ROVER_SHEET } from ${JSON.stringify(join(root, "src/game/nightwatch/plates.ts"))};\n` +
    `export { SCENE_NAMES } from ${JSON.stringify(join(root, "src/game/nightwatch/cameras.ts"))};\n` +
    `export { siteWatch } from ${JSON.stringify(join(root, "src/game/nightwatch/model.ts"))};\n`,
);
const out = join(dir, "nw.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const W = await import(out);

/** Lossy and lossless WebP width and height, from the file header. No decoder. */
function webpSize(buf) {
  assert.equal(buf.toString("ascii", 0, 4), "RIFF");
  assert.equal(buf.toString("ascii", 8, 12), "WEBP");
  const kind = buf.toString("ascii", 12, 16);
  if (kind === "VP8X") return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
  if (kind === "VP8 ") return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  if (kind === "VP8L") {
    const b = buf.readUInt32LE(21);
    return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
  }
  throw new Error(`unknown webp chunk ${kind}`);
}

function fileOf(urlPath) {
  return join(root, "public", urlPath.replace(/^\//, ""));
}

const visuals = new Set();
for (const site of ["pwr", "bwr", "pebble", "msr"]) {
  const w = W.siteWatch(site);
  for (const e of w.events) visuals.add(e.visual);
  for (const o of w.oddities) visuals.add(o.visual);
}

test("every scene has a plate file, 960×540 and at most 180 KB, and so does every state", () => {
  for (const name of W.SCENE_NAMES) {
    const spec = W.PLATES[name];
    assert.ok(spec, `${name} has a PLATES entry`);
    const buf = readFileSync(fileOf(spec.file));
    const { w, h } = webpSize(buf);
    assert.equal(w, 960, spec.file);
    assert.equal(h, 540, spec.file);
    assert.ok(buf.length <= 180 * 1024, `${spec.file} is ${buf.length} bytes`);
    for (const [visual, st] of Object.entries(spec.states ?? {})) {
      assert.ok(visuals.has(visual), `${name} state ${visual} is a real model visual`);
      const [x, y, bw, bh] = st.box;
      assert.ok(x >= 0 && y >= 0 && x + bw <= 480 && y + bh <= 270, `${name} ${visual} box`);
      const sb = readFileSync(fileOf(st.file));
      const size = webpSize(sb);
      assert.equal(size.w, 960, st.file);
      assert.equal(size.h, 540, st.file);
      assert.ok(sb.length <= 180 * 1024, `${st.file} is ${sb.length} bytes`);
    }
  }
});

test("the rover sheet, if shipped, is eight frames, and the whole nightwatch folder fits the budget", () => {
  const rover = fileOf(W.ROVER_SHEET);
  try {
    const buf = readFileSync(rover);
    const { w, h } = webpSize(buf);
    assert.equal(w, 768, "rover width");
    assert.equal(h, 192, "rover height");
  } catch (e) {
    if (e && e.code !== "ENOENT") throw e;
  }
  const dirp = join(root, "public", "nightwatch");
  let total = 0;
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else total += st.size;
    }
  };
  walk(dirp);
  const videos = readdirSync(dirp).some((n) => n.endsWith(".webm"));
  const cap = (videos ? 4.7 : 3.5) * 1024 * 1024;
  assert.ok(total <= cap, `public/nightwatch is ${total} bytes`);
});
