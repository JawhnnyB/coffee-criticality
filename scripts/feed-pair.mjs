/**
 * Paint a few camera pairs, plain beside the change, and write PNGs.
 *   node scripts/feed-pair.mjs docs/audit/2026-11-22-value/step-12a
 */
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { chromium } from "../node_modules/playwright/index.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, process.argv[2] ?? "docs/audit/2026-11-22-value/step-12a");
mkdirSync(outDir, { recursive: true });
const esbuild = process.env.ESBUILD ?? join(root, "node_modules/esbuild/bin/esbuild");
const bundle = join(tmpdir(), "nw-cam-pair.js");
const built = spawnSync(esbuild, [join(root, "scripts/nw-cam-entry.ts"), "--bundle", "--format=iife", "--global-name=CAM", `--outfile=${bundle}`, "--platform=browser"], { encoding: "utf8" });
if (built.status !== 0) {
  console.error(built.stderr || built.stdout);
  process.exit(1);
}
const jobs = [
  ["pool-bag", "pool", "toolBag", 1.2],
  ["yard-van-far", "yard", "van:0.15", 1.2],
  ["yard-van-near", "yard", "van:0.9", 1.2],
  ["tunnel-drip", "tunnel", "condensate", 1.4],
  ["drywell-puddle", "drywell", "puddle", 1.4],
];
const PAGE = `<!doctype html><canvas id=c width=1920 height=540></canvas><script src="/cam.js"></script><script>
window.go = async (jobs) => {
  await CAM.loadPlates();
  const c = document.getElementById("c");
  const g = c.getContext("2d");
  const out = [];
  for (const [name, scene, visual, t] of jobs) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, 1920, 540);
    CAM.resetFrameCaches();
    g.setTransform(2, 0, 0, 2, 0, 0);
    CAM.paintCamera(g, scene, [], t, {});
    const plain = g.getImageData(0, 0, 960, 540);
    CAM.resetFrameCaches();
    g.setTransform(2, 0, 0, 2, 960, 0);
    CAM.paintCamera(g, scene, [visual], t, {});
    out.push(name);
  }
  return c.toDataURL("image/png");
};
document.body.dataset.done = "1";
</script>`;
const camJs = readFileSync(bundle);
const MIME = { ".webp": "image/webp", ".png": "image/png" };
const server = await new Promise((resolve) => {
  const s = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/cam.js") {
      res.writeHead(200, { "content-type": "text/javascript" });
      res.end(camJs);
      return;
    }
    if (url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(PAGE);
      return;
    }
    const rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const path = join(root, "public", rel);
    try {
      const buf = readFileSync(path);
      res.writeHead(200, { "content-type": MIME[extname(path)] ?? "application/octet-stream" });
      res.end(buf);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  s.listen(0, "127.0.0.1", () => resolve(s));
});
const port = server.address().port;
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForFunction(() => document.body.dataset.done === "1");
for (const job of jobs) {
  const url = await page.evaluate((j) => window.go([j]), job);
  const buf = Buffer.from(url.split(",")[1], "base64");
  writeFileSync(join(outDir, `${job[0]}.png`), buf);
  console.log(job[0], buf.length);
}
await browser.close();
server.close();
console.log("wrote", outDir);
