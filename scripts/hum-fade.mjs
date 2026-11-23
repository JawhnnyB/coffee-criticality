/**
 * The night hum fades for 0.3 s, then the graph is dropped.
 *   node scripts/hum-fade.mjs
 */
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { chromium } from "../node_modules/playwright/index.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs/audit/2026-11-22-value/step-12d");
mkdirSync(outDir, { recursive: true });
const esbuild = process.env.ESBUILD ?? join(root, "node_modules/esbuild/bin/esbuild");
const entry = join(tmpdir(), "hum-entry.ts");
const bundle = join(tmpdir(), "hum-fade.js");
writeFileSync(
  entry,
  `export { startAmbience, stopAmbience } from ${JSON.stringify(join(root, "src/game/nightwatch/ambience.ts"))};\n` +
    `export { playbackBus } from ${JSON.stringify(join(root, "src/game/audio.ts"))};\n`,
);
const built = spawnSync(esbuild, [entry, "--bundle", "--format=iife", "--global-name=HUM", `--outfile=${bundle}`, "--platform=browser"], { encoding: "utf8" });
if (built.status !== 0) {
  console.error(built.stderr || built.stdout);
  process.exit(1);
}
const js = readFileSync(bundle);
const PAGE = `<!doctype html><body><script src="/hum.js"></script><script>
window.go = async () => {
  const { c, dest } = HUM.playbackBus();
  await c.resume();
  const an = c.createAnalyser();
  an.fftSize = 2048;
  dest.connect(an);
  const buf = new Float32Array(an.fftSize);
  const rms = () => {
    an.getFloatTimeDomainData(buf);
    let s = 0;
    for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
    return Math.sqrt(s / buf.length);
  };
  HUM.startAmbience();
  await new Promise((r) => setTimeout(r, 1600));
  const before = rms();
  const t0 = performance.now();
  HUM.stopAmbience();
  const samples = [];
  while (performance.now() - t0 < 480) {
    samples.push([Math.round(performance.now() - t0), Number(rms().toExponential(3))]);
    await new Promise((r) => setTimeout(r, 40));
  }
  return { state: c.state, before: Number(before.toExponential(3)), samples };
};
document.body.dataset.done = "1";
</script>`;
const server = await new Promise((resolve) => {
  const s = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/hum.js") {
      res.writeHead(200, { "content-type": "text/javascript" });
      res.end(js);
      return;
    }
    res.writeHead(200, { "content-type": "text/html" });
    res.end(PAGE);
  });
  s.listen(0, "127.0.0.1", () => resolve(s));
});
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage();
page.setDefaultTimeout(15000);
const errors = [];
const logs = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (msg) => logs.push(msg.text()));
await page.goto(`http://127.0.0.1:${server.address().port}/`);
await page.waitForFunction(() => document.body.dataset.done === "1");
const result = await page.evaluate(() => window.go());
await browser.close();
server.close();
const samples = result.samples;
const at = (ms) => samples.reduce((best, row) => (Math.abs(row[0] - ms) < Math.abs(best[0] - ms) ? row : best));
const early = at(40);
const mid = at(150);
const late = at(400);
const after = samples.filter((row) => row[0] >= 340);
const peakAfter = after.reduce((m, row) => Math.max(m, row[1]), 0);
const fading = mid[1] < early[1] * 0.85;
const gone = late[1] < result.before * 0.2;
const noClick = peakAfter < early[1] * 0.5;
const lines = [
  `AudioContext ${result.state}.`,
  `Level before the fade: ${result.before}.`,
  `Samples after stop, ms and rms: ${samples.map((row) => row[0] + ":" + row[1]).join(" ")}.`,
  `At ~40 ms ${early[1]}, at ~150 ms ${mid[1]}, at ~400 ms ${late[1]}.`,
  fading ? "The level is falling through the 0.3 s ramp." : "FAIL the level did not fall.",
  gone ? "By 0.4 s the hum is gone." : "FAIL the hum is still up after the ramp.",
  noClick ? "No click after the ramp. The peak stays under half the level at the start of the fade." : "FAIL a peak after the ramp.",
  errors.length ? `Page errors: ${errors.join(" | ")}` : "Page errors: 0.",
  logs.length ? `Console: ${logs.join(" | ")}` : "Console: 0.",
];
writeFileSync(join(outDir, "result.txt"), lines.join("\n") + "\n");
console.log(lines.join("\n"));
if (!fading || !gone || !noClick || errors.length || result.before < 1e-6) process.exit(1);
