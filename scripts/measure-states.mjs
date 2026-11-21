/**
 * Measure where each Night Watch state plate differs from its base.
 *
 * Method (the 21 November review): absolute difference, blur about 2 px, threshold 45,
 * erode, then the bounding box in logical 480×270 coordinates. Run with Playwright so
 * the blur is the browser's, the same pixels the game composites.
 *
 *   node scripts/measure-states.mjs
 *
 * Exits 1 when a stored `measured` rect in plates.ts does not match a fresh run.
 */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "../node_modules/playwright/index.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIME = { ".webp": "image/webp", ".html": "text/html", ".js": "text/javascript", ".png": "image/png" };

function serve(dir) {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/measure.html") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(PAGE);
      return;
    }
    const rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const path = join(dir, rel);
    if (!path.startsWith(dir)) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      const buf = readFileSync(path);
      res.writeHead(200, { "content-type": MIME[extname(path)] ?? "application/octet-stream" });
      res.end(buf);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

const PAGE = `<!doctype html><body><script>
async function load(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}
function round2(n) { return Math.round(n / 2); }
/** Max-channel absolute difference, blur(2px), threshold 45, 4-neighbour erode, logical box. */
async function measure(baseSrc, stateSrc) {
  const W = 960, H = 540;
  const base = await load(baseSrc);
  const state = await load(stateSrc);
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(base, 0, 0, W, H);
  const a = g.getImageData(0, 0, W, H);
  g.drawImage(state, 0, 0, W, H);
  const b = g.getImageData(0, 0, W, H);
  const d = g.createImageData(W, H);
  for (let i = 0; i < a.data.length; i += 4) {
    const m = Math.max(
      Math.abs(a.data[i] - b.data[i]),
      Math.abs(a.data[i + 1] - b.data[i + 1]),
      Math.abs(a.data[i + 2] - b.data[i + 2]),
    );
    d.data[i] = d.data[i + 1] = d.data[i + 2] = m;
    d.data[i + 3] = 255;
  }
  const blur = document.createElement("canvas");
  blur.width = W; blur.height = H;
  const bg = blur.getContext("2d", { willReadFrequently: true });
  bg.putImageData(d, 0, 0);
  g.filter = "blur(2px)";
  g.drawImage(blur, 0, 0);
  g.filter = "none";
  const bd = g.getImageData(0, 0, W, H).data;
  const mask = new Uint8Array(W * H);
  for (let i = 0, p = 0; i < bd.length; i += 4, p++) mask[p] = bd[i] >= 45 ? 1 : 0;
  const er = new Uint8Array(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const p = y * W + x;
      er[p] = mask[p] && mask[p - 1] && mask[p + 1] && mask[p - W] && mask[p + W] ? 1 : 0;
    }
  }
  let x0 = W, y0 = H, x1 = -1, y1 = -1, n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!er[y * W + x]) continue;
    n++;
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  if (x1 < 0) return { logical: null, pixels: 0 };
  const dev = [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
  return { logical: dev.map(round2), pixels: n };
}
window.run = async (pairs) => {
  const out = [];
  for (const [scene, visual, base, state] of pairs) {
    const m = await measure(base, state);
    out.push({ scene, visual, ...m });
  }
  return out;
};
document.body.dataset.done = "1";
</script>`;

function stored() {
  const src = readFileSync(join(root, "src/game/nightwatch/plates.ts"), "utf8");
  const pairs = [];
  const stateRe = /file:\s*"(\/nightwatch\/plates\/([a-z]+)-([A-Za-z0-9]+)\.webp)"[^\n]*measured:\s*\[([^\]]+)\]/g;
  let m;
  while ((m = stateRe.exec(src))) {
    pairs.push({
      scene: m[2],
      visual: m[3],
      file: m[1],
      measured: m[4].split(",").map((n) => Number(n.trim())),
    });
  }
  if (pairs.length !== 8) throw new Error(`expected 8 state plates, parsed ${pairs.length}`);
  return pairs;
}

const server = await serve(join(root, "public"));
const port = server.address().port;
const pairs = stored();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${port}/measure.html`);
await page.waitForFunction(() => document.body.dataset.done === "1");
const jobs = pairs.map((p) => {
  const base = `/nightwatch/plates/${p.scene}.webp`;
  return [p.scene, p.visual, base, p.file];
});
const measured = await page.evaluate((jobs) => window.run(jobs), jobs);
await browser.close();
server.close();

let bad = 0;
console.log("scene visual measured stored pixels");
for (let i = 0; i < pairs.length; i++) {
  const got = measured[i].logical;
  const want = pairs[i].measured;
  const same = got && got.length === 4 && got.every((n, k) => n === want[k]);
  if (!same) bad++;
  console.log(
    pairs[i].scene,
    pairs[i].visual,
    JSON.stringify(got),
    JSON.stringify(want),
    measured[i].pixels,
    same ? "ok" : "DIFF",
  );
}
if (bad) {
  console.error(`${bad} measured rects differ from plates.ts`);
  process.exit(1);
}
console.log("all measured rects match");
