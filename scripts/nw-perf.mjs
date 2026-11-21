/**
 * Re-time paintCamera with the 21 November review harness.
 * Same scenes, same 40-frame loop, CPU at 1× and 4×. Playwright from this repo.
 *
 *   node scripts/nw-perf.mjs
 */
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { chromium } from "../node_modules/playwright/index.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const esbuild = process.env.ESBUILD ?? "/usr/lib/node_modules/vercel/node_modules/esbuild/bin/esbuild";
const bundle = join(tmpdir(), "nw-cam-perf.js");
const built = spawnSync(
  esbuild,
  [join(root, "scripts/nw-cam-entry.ts"), "--bundle", "--format=iife", "--global-name=CAM", `--outfile=${bundle}`, "--platform=browser"],
  { encoding: "utf8" },
);
if (built.status !== 0) {
  console.error(built.stderr || built.stdout);
  process.exit(1);
}
const camJs = readFileSync(bundle);
const PAGE = `<!doctype html><body><canvas id=c width=960 height=540></canvas><script src="/cam.js"></script><script>
window.bench = async (scene, vis, n) => {
  const g = document.getElementById("c").getContext("2d");
  g.setTransform(2, 0, 0, 2, 0, 0);
  for (let i = 0; i < 10; i++) CAM.paintCamera(g, scene, vis, i / 30, {});
  g.getImageData(0, 0, 1, 1);
  const t0 = performance.now();
  for (let i = 0; i < n; i++) CAM.paintCamera(g, scene, vis, i / 30, {});
  g.getImageData(0, 0, 1, 1);
  return (performance.now() - t0) / n;
};
CAM.loadPlates().then(() => { document.body.dataset.done = "1"; });
</script>`;

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  if (url.pathname === "/cam.js") {
    res.writeHead(200, { "content-type": "text/javascript" });
    res.end(camJs);
    return;
  }
  if (url.pathname.startsWith("/nightwatch/")) {
    try {
      const buf = readFileSync(join(root, "public", decodeURIComponent(url.pathname).replace(/^\/+/, "")));
      res.writeHead(200, { "content-type": "image/webp" });
      res.end(buf);
      return;
    } catch {
      res.writeHead(404);
      res.end();
      return;
    }
  }
  res.writeHead(200, { "content-type": "text/html" });
  res.end(PAGE);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForFunction(() => document.body.dataset.done === "1");
const cdp = await page.context().newCDPSession(page);
const scenes = [
  ["turbine", []],
  ["corridor", ["doorAjar"]],
  ["tunnel", []],
  ["pool", []],
];
const after = {};
for (const rate of [1, 4]) {
  await cdp.send("Emulation.setCPUThrottlingRate", { rate });
  after[rate] = {};
  for (const [scene, vis] of scenes) {
    const ms = await page.evaluate(([s, v]) => window.bench(s, v, 40), [scene, vis]);
    after[rate][scene] = ms;
    console.log(`${rate}x`, scene, ms.toFixed(1), "ms");
  }
}
await browser.close();
server.close();

const before = {
  turbine: { p1: 5.5, c1: 7.9, p4: 29, c4: 29 },
  corridor: { p1: 8.4, c1: 7.1, p4: 39, c4: 29 },
  tunnel: { p1: 12.5, c1: 13.6, p4: 60, c4: 61 },
  pool: { p1: 8.5, c1: 9.9, p4: 28, c4: 33 },
};
const label = { turbine: "turbine", corridor: "corridor (door ajar)", tunnel: "tunnel (infrared)", pool: "pool" };
const lines = [
  "# Night Watch frame time",
  "",
  "Harness: the 21 November review (`paintCamera` alone, 960×540, 40 frames, Chromium CPU throttle). Plates loaded.",
  "Before numbers are that review. After is this branch: graded plate cached (infrared desaturation included), no per-frame `ctx.filter` or saturation fill, scanlines and vignette in one overlay.",
  "The feed itself now paints at 15 fps in the shift. That does not change the per-frame number below.",
  "",
  "| Scene | 1× before | 1× after | 4× before | 4× after |",
  "| --- | ---: | ---: | ---: | ---: |",
];
for (const [scene] of scenes) {
  const b = before[scene];
  lines.push(
    `| ${label[scene]} | ${b.p1.toFixed(1)} ms | ${after[1][scene].toFixed(1)} ms | ${b.p4} ms | ${after[4][scene].toFixed(1)} ms |`,
  );
}
const worst = Math.max(...scenes.map(([s]) => after[4][s]));
lines.push("");
lines.push(`Target was 8 ms per feed frame at 4×. Worst scene after the change: ${worst.toFixed(1)} ms.`);
lines.push(worst <= 8 ? "The target was met." : "The target was not met. The number above is the measurement, not a pass.");
const dir = join(root, "docs/audit/2026-11-2x-plates-fix");
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "perf.md"), lines.join("\n") + "\n");
console.log(lines.join("\n"));
