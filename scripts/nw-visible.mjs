/**
 * Prove every Night Watch event and oddity changes the camera frame.
 *
 * Playwright, the production paintCamera (bundled), plates served from public/.
 * For each site, camera and visual, plus rover:0.5 and van:0.5 on the yard:
 * paint with and without the visual at three times, count pixels that move by
 * 24 or more, and fail under 0.4% of the 960×540 frame. The code drawing is
 * measured with plates turned off. A plate that moves fewer than half as many
 * pixels as the code drawing is flagged.
 *
 *   node scripts/nw-visible.mjs
 */
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { chromium } from "../node_modules/playwright/index.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs/audit/2026-11-2x-plates-fix");
const esbuild = process.env.ESBUILD ?? "/usr/lib/node_modules/vercel/node_modules/esbuild/bin/esbuild";
const bundle = join(tmpdir(), "nw-cam.js");
const built = spawnSync(
  esbuild,
  [
    join(root, "scripts/nw-cam-entry.ts"),
    "--bundle",
    "--format=iife",
    "--global-name=CAM",
    `--outfile=${bundle}`,
    "--platform=browser",
  ],
  { encoding: "utf8" },
);
if (built.status !== 0) {
  console.error(built.stderr || built.stdout);
  process.exit(1);
}

const MIME = { ".webp": "image/webp", ".js": "text/javascript", ".html": "text/html", ".png": "image/png" };
const camJs = readFileSync(bundle);

function serve() {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/cam.js") {
      res.writeHead(200, { "content-type": "text/javascript" });
      res.end(camJs);
      return;
    }
    if (url.pathname === "/" || url.pathname === "/visible.html") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(PAGE);
      return;
    }
    const rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const path = join(root, "public", rel);
    if (!path.startsWith(join(root, "public"))) {
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

const PAGE = `<!doctype html><canvas id=c width=960 height=540></canvas><script src="/cam.js"></script><script>
const TIMES = [0.45, 1.25, 2.5];
function changed(a, b) {
  let n = 0;
  for (let i = 0; i < a.length; i += 4) {
    if (Math.abs(a[i] - b[i]) >= 24 || Math.abs(a[i + 1] - b[i + 1]) >= 24 || Math.abs(a[i + 2] - b[i + 2]) >= 24) n++;
  }
  return n;
}
window.run = async (jobs) => {
  await CAM.loadPlates();
  const g = document.getElementById("c").getContext("2d", { willReadFrequently: true });
  const cache = new Map();
  const rows = [];
  for (const job of jobs) {
    const key = job.scene + "\\0" + job.visual;
    if (!cache.has(key)) {
      const hit = { plate: 0, code: 0 };
      for (const on of [true, false]) {
        CAM.setPlatesEnabled(on);
        CAM.resetFrameCaches();
        let best = 0;
        for (const t of TIMES) {
          g.setTransform(2, 0, 0, 2, 0, 0);
          CAM.paintCamera(g, job.scene, [], t, {});
          const a = g.getImageData(0, 0, 960, 540).data;
          g.setTransform(2, 0, 0, 2, 0, 0);
          CAM.paintCamera(g, job.scene, [job.visual], t, {});
          const b = g.getImageData(0, 0, 960, 540).data;
          best = Math.max(best, changed(a, b));
        }
        hit[on ? "plate" : "code"] = best;
      }
      cache.set(key, hit);
    }
    const hit = cache.get(key);
    rows.push({ ...job, plate: hit.plate, code: hit.code });
  }
  CAM.setPlatesEnabled(true);
  CAM.resetFrameCaches();
  return rows;
};
document.body.dataset.done = "1";
</script>`;

const server = await serve();
const port = server.address().port;
const browser = await chromium.launch();
const page = await browser.newPage();
page.setDefaultTimeout(180000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForFunction(() => document.body.dataset.done === "1");
const jobs = await page.evaluate(() => {
  const sites = ["pwr", "bwr", "pebble", "msr"];
  const jobs = [];
  for (const site of sites) {
    const w = CAM.siteWatch(site);
    for (const cam of w.cameras) {
      const visuals = new Set();
      for (const e of w.events) if (e.camera === cam.id) visuals.add(e.visual);
      for (const o of w.oddities) if (o.camera === cam.id) visuals.add(o.visual);
      if (cam.id === "yard") {
        visuals.add("rover:0.5");
        visuals.add("van:0.5");
      }
      for (const visual of visuals) jobs.push({ site, camera: cam.id, scene: cam.scene, visual });
    }
  }
  return jobs;
});
const rows = await page.evaluate((jobs) => window.run(jobs), jobs);
await browser.close();
server.close();

const total = 960 * 540;
const minPx = total * 0.004;
let fails = 0;
const lines = [
  "# Night Watch visibility",
  "",
  "Pixels that change by 24 or more, best of three times (0.45 s, 1.25 s, 2.5 s), on a 960×540 frame.",
  `A visual fails under ${Math.ceil(minPx)} pixels (0.4% of the frame).`,
  "Plate is the game path (photos loaded). Code is the same paint with plates turned off.",
  "The same scene and visual draws the same frame on every site, so those rows share one count.",
  "",
  "| Site | Camera | Scene | Visual | Plate px | Code px | Plate % | Flag |",
  "| --- | --- | --- | --- | ---: | ---: | ---: | --- |",
];
for (const r of rows) {
  const pct = ((100 * r.plate) / total).toFixed(2);
  const flags = [];
  if (r.plate < minPx) {
    flags.push("FAIL <0.4%");
    fails++;
  }
  if (r.code > 0 && r.plate * 2 < r.code) flags.push("plate < half of code");
  lines.push(`| ${r.site} | ${r.camera} | ${r.scene} | ${r.visual} | ${r.plate} | ${r.code} | ${pct} | ${flags.join("; ") || ""} |`);
}
lines.push("");
lines.push(errors.length ? `Page errors: ${errors.join(" | ")}` : "Page errors: 0.");
lines.push(fails ? `${fails} visuals under 0.4%.` : "Every visual clears 0.4%.");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "visible.md"), lines.join("\n") + "\n");
console.log(lines.join("\n"));
if (errors.length || fails) process.exit(1);
