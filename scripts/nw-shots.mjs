/**
 * In-game frames of each state plate on and off, plus the eight rover poses.
 * Writes docs/audit/2026-11-2x-plates-fix/shots/.
 */
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { chromium } from "../node_modules/playwright/index.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "docs/audit/2026-11-2x-plates-fix/shots");
mkdirSync(out, { recursive: true });
const esbuild = process.env.ESBUILD ?? "/usr/lib/node_modules/vercel/node_modules/esbuild/bin/esbuild";
const bundle = join(tmpdir(), "nw-cam-shots.js");
const built = spawnSync(esbuild, [join(root, "scripts/nw-cam-entry.ts"), "--bundle", "--format=iife", "--global-name=CAM", `--outfile=${bundle}`, "--platform=browser"], { encoding: "utf8" });
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const camJs = readFileSync(bundle);
const PAGE = `<!doctype html><canvas id=c width=960 height=540></canvas><script src="/cam.js"></script><script>
window.paint = (scene, vis) => {
  const g = document.getElementById("c").getContext("2d");
  g.setTransform(2, 0, 0, 2, 0, 0);
  CAM.paintCamera(g, scene, vis, 1.25, {});
};
document.body.dataset.done = "1";
</script>`;
const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  if (url.pathname === "/cam.js") {
    res.writeHead(200, { "content-type": "text/javascript" });
    res.end(camJs);
    return;
  }
  if (url.pathname.startsWith("/nightwatch/")) {
    const buf = readFileSync(join(root, "public", url.pathname.slice(1)));
    res.writeHead(200, { "content-type": "image/webp" });
    res.end(buf);
    return;
  }
  res.writeHead(200, { "content-type": "text/html" });
  res.end(PAGE);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
await page.goto(`http://127.0.0.1:${server.address().port}/`);
await page.waitForFunction(() => document.body.dataset.done === "1");
await page.evaluate(() => CAM.loadPlates());
await page.waitForTimeout(400);
const states = [
  ["corridor", "doorAjar"],
  ["corridor", "chair"],
  ["corridor", "hardhat"],
  ["pool", "poolLow"],
  ["pool", "toolBag"],
  ["freeze", "frostGone"],
  ["cell", "heaterDark"],
  ["intake", "debris"],
];
const canvas = page.locator("#c");
for (const [scene, visual] of states) {
  await page.evaluate(([s]) => window.paint(s, []), [scene]);
  await canvas.screenshot({ path: join(out, `${scene}-off.png`) });
  await page.evaluate(([s, v]) => window.paint(s, [v]), [scene, visual]);
  await canvas.screenshot({ path: join(out, `${scene}-${visual}.png`) });
}
for (let i = 0; i < 8; i++) {
  await page.evaluate((i) => window.paint("yard", [`rover:${(0.15 + i / 40).toFixed(3)}`]), i);
  // Frame index is floor(t * 8). Hold t so each call is a different pose.
  await page.evaluate((i) => {
    const g = document.getElementById("c").getContext("2d");
    g.setTransform(2, 0, 0, 2, 0, 0);
    CAM.paintCamera(g, "yard", ["rover:0.55"], 0.05 + i * 0.125, {});
  }, i);
  await canvas.screenshot({ path: join(out, `rover-${i}.png`) });
}
await browser.close();
server.close();
console.log("shots", out);
