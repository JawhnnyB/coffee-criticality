/**
 * Human-style check for Night Watch events and oddities.
 *
 * Plates on, which is the game. Each visual is painted plain and changed,
 * side by side, at 480×270, at t = 1.25 s.
 *
 * A pixel counts when any channel moves by 24 or more.
 * The changed pixels are grouped into 4-connected regions.
 * An event passes only when the largest region is at least 0.3% of the frame
 * and that region holds at least 60% of the changed pixels (one place).
 * An oddity passes when the changed pixels are between 0.12% and 2% of the frame.
 *
 * The contact sheet of every event is written next to the table.
 * The old pixel-count proof stays in docs/audit/2026-11-21-rotation/visible.md.
 *
 *   node scripts/nw-visible.mjs [out-dir]
 */
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { chromium } from "../node_modules/playwright/index.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, process.argv[2] ?? "docs/audit/2026-11-22-value/step-12c");
mkdirSync(outDir, { recursive: true });
const esbuild = process.env.ESBUILD ?? join(root, "node_modules/esbuild/bin/esbuild");
const bundle = join(tmpdir(), "nw-cam-visible.js");
const built = spawnSync(
  esbuild,
  [join(root, "scripts/nw-cam-entry.ts"), "--bundle", "--format=iife", "--global-name=CAM", `--outfile=${bundle}`, "--platform=browser"],
  { encoding: "utf8" },
);
if (built.status !== 0) {
  console.error(built.stderr || built.stdout);
  process.exit(1);
}

const MIME = { ".webp": "image/webp", ".png": "image/png" };
const camJs = readFileSync(bundle);
const PAGE = `<!doctype html><canvas id=c width=960 height=270></canvas><script src="/cam.js"></script><script>
const W = 480, H = 270, FRAME = W * H;
function measure(a, b) {
  const mask = new Uint8Array(FRAME);
  let total = 0;
  for (let p = 0, i = 0; p < FRAME; p++, i += 4) {
    if (Math.abs(a[i] - b[i]) >= 24 || Math.abs(a[i + 1] - b[i + 1]) >= 24 || Math.abs(a[i + 2] - b[i + 2]) >= 24) {
      mask[p] = 1;
      total++;
    }
  }
  let largest = 0;
  const stack = [];
  for (let p = 0; p < FRAME; p++) {
    if (mask[p] !== 1) continue;
    mask[p] = 2;
    stack.push(p);
    let n = 0;
    while (stack.length) {
      const q = stack.pop();
      n++;
      const x = q % W;
      const y = (q / W) | 0;
      if (x > 0 && mask[q - 1] === 1) { mask[q - 1] = 2; stack.push(q - 1); }
      if (x + 1 < W && mask[q + 1] === 1) { mask[q + 1] = 2; stack.push(q + 1); }
      if (y > 0 && mask[q - W] === 1) { mask[q - W] = 2; stack.push(q - W); }
      if (y + 1 < H && mask[q + W] === 1) { mask[q + W] = 2; stack.push(q + W); }
    }
    if (n > largest) largest = n;
  }
  return { total, largest };
}
window.run = async (jobs) => {
  await CAM.loadPlates();
  CAM.setPlatesEnabled(true);
  const scratch = document.getElementById("c");
  const g = scratch.getContext("2d", { willReadFrequently: true });
  const seen = new Map();
  const shots = [];
  const rows = [];
  for (const job of jobs) {
    const key = job.scene + "\\0" + job.visual;
    if (!seen.has(key)) {
      CAM.resetFrameCaches();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, 960, 270);
      CAM.paintCamera(g, job.scene, [], 1.25, {});
      const plain = g.getImageData(0, 0, W, H).data;
      g.setTransform(1, 0, 0, 1, W, 0);
      CAM.paintCamera(g, job.scene, [job.visual], 1.25, {});
      const next = g.getImageData(W, 0, W, H).data;
      const m = measure(plain, next);
      seen.set(key, m);
      if (job.kind === "event") shots.push({ scene: job.scene, visual: job.visual, png: scratch.toDataURL("image/png") });
    }
    rows.push(Object.assign({}, job, seen.get(key)));
  }
  CAM.resetFrameCaches();
  const label = 18;
  const sheet = document.createElement("canvas");
  sheet.width = 960;
  sheet.height = Math.max(1, shots.length) * (H + label);
  const sg = sheet.getContext("2d");
  sg.fillStyle = "#141414";
  sg.fillRect(0, 0, sheet.width, sheet.height);
  sg.font = "13px sans-serif";
  sg.fillStyle = "#e6e6e6";
  const hold = new Image();
  for (let i = 0; i < shots.length; i++) {
    const y = i * (H + label);
    sg.fillText(shots[i].scene + "   " + shots[i].visual + "      plain  |  changed", 8, y + 13);
    await new Promise((resolve) => {
      hold.onload = () => { sg.drawImage(hold, 0, y + label); resolve(); };
      hold.src = shots[i].png;
    });
  }
  return { rows, sheet: shots.length ? sheet.toDataURL("image/png") : "" };
};
document.body.dataset.done = "1";
</script>`;

function serve() {
  const server = createServer((req, res) => {
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

const server = await serve();
const port = server.address().port;
const browser = await chromium.launch();
const page = await browser.newPage();
page.setDefaultTimeout(120000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForFunction(() => document.body.dataset.done === "1");
const jobs = await page.evaluate(() => {
  const sites = ["pwr", "bwr", "pebble", "msr"];
  const out = [];
  for (const site of sites) {
    const w = CAM.siteWatch(site);
    for (const cam of w.cameras) {
      const kind = new Map();
      for (const e of w.events) if (e.camera === cam.id) kind.set(e.visual, "event");
      for (const o of w.oddities) if (o.camera === cam.id && !kind.has(o.visual)) kind.set(o.visual, "oddity");
      for (const [visual, k] of kind) out.push({ site, camera: cam.id, scene: cam.scene, visual, kind: k });
    }
  }
  return out;
});
const result = await page.evaluate((jobs) => window.run(jobs), jobs);
await browser.close();
server.close();

const frame = 480 * 270;
const eventMin = frame * 0.003;
const oneShare = 0.6;
const oddMin = frame * 0.0012;
const oddMax = frame * 0.02;
let eventFails = 0;
let oddFails = 0;
const lines = [
  "# Night Watch, human check",
  "",
  "Plain and changed, side by side, at 480×270. One moment, t = 1.25 s. Plates on.",
  "A pixel counts when any channel moves by 24 or more. Regions are 4-connected.",
  `An event passes when the largest region is at least ${eventMin.toFixed(1)} pixels (0.3% of the frame) and that region is at least 60% of the changed pixels, so the change is in one place.`,
  `An oddity passes when the changed pixels are between ${oddMin.toFixed(1)} and ${oddMax.toFixed(1)} (0.12% to 2%).`,
  "The same scene and visual is one picture. Shared events are listed once per site and drawn once on the sheet.",
  "",
  "| Site | Camera | Scene | Visual | Kind | Changed px | Changed % | Largest px | Largest % | Share | Rule |",
  "| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |",
];
for (const r of result.rows) {
  const changedPct = (100 * r.total) / frame;
  const largestPct = (100 * r.largest) / frame;
  const share = r.total ? r.largest / r.total : 0;
  let rule = "pass";
  if (r.kind === "oddity") {
    if (r.total < oddMin) {
      rule = "FAIL <0.12%";
      oddFails++;
    } else if (r.total > oddMax) {
      rule = "FAIL >2%";
      oddFails++;
    }
  } else {
    const small = r.largest < eventMin;
    const split = share < oneShare;
    if (small || split) {
      eventFails++;
      rule = small && split ? "FAIL <0.3% and not one place" : small ? "FAIL <0.3%" : "FAIL not one place";
    }
  }
  lines.push(
    `| ${r.site} | ${r.camera} | ${r.scene} | ${r.visual} | ${r.kind} | ${r.total} | ${changedPct.toFixed(2)} | ${r.largest} | ${largestPct.toFixed(2)} | ${(100 * share).toFixed(0)}% | ${rule} |`,
  );
}
lines.push("");
lines.push(errors.length ? `Page errors: ${errors.join(" | ")}` : "Page errors: 0.");
lines.push(eventFails ? `${eventFails} event ${eventFails === 1 ? "row fails" : "rows fail"}.` : "Every event is one place and at least 0.3%.");
lines.push(oddFails ? `${oddFails} oddity ${oddFails === 1 ? "row fails" : "rows fail"}.` : "Every oddity is inside 0.12%–2%.");
lines.push("Contact sheet: events.png. Each row is plain on the left, changed on the right.");
writeFileSync(join(outDir, "visible.md"), lines.join("\n") + "\n");
if (result.sheet) {
  writeFileSync(join(outDir, "events.png"), Buffer.from(result.sheet.split(",")[1], "base64"));
}
console.log(lines.join("\n"));
if (errors.length || eventFails || oddFails) process.exit(1);
