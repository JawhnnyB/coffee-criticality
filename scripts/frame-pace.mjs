/**
 * Step 10b. Frame intervals on a fast run and on a 4× CPU, plus the busy window.
 *   node scripts/frame-pace.mjs http://127.0.0.1:8097/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8097/";
const out = new URL("../docs/audit/2026-11-22-value/step-10b/", import.meta.url);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(20000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 180)));
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest && window.__framePace);
await page.evaluate(() => window.__controlsTest.bootPlay());
await page.waitForTimeout(2500);

const cdp = await page.context().newCDPSession(page);
await cdp.send("Performance.enable");
const val = (list, name) => list.metrics.find((m) => m.name === name)?.value ?? 0;

async function intervals(ms) {
  await page.evaluate(() => window.__framePace.start());
  await page.waitForTimeout(ms);
  return page.evaluate(() => window.__framePace.stop());
}

function describe(name, gaps, lo, hi) {
  const n = gaps.length;
  const mean = n ? gaps.reduce((a, b) => a + b, 0) / n : 0;
  const min = n ? Math.min(...gaps) : 0;
  const max = n ? Math.max(...gaps) : 0;
  const off = gaps.filter((g) => g < lo || g > hi).length;
  const line = `${name}: n ${n} mean ${mean.toFixed(2)} min ${min.toFixed(2)} max ${max.toFixed(2)} outside ${lo}-${hi}: ${off}`;
  console.log(line);
  return { line, off, n, mean };
}

const full = await intervals(10000);
const fullInfo = await page.evaluate(() => ({ rate: window.__framePace.rate(), hold: window.__framePace.hold(), work: window.__framePace.work() }));
const fullStat = describe(`60 Hz rate ${fullInfo.rate} hold ${fullInfo.hold.toFixed(1)} work ${fullInfo.work.toFixed(1)}`, full, 14, 22);

const x0 = await page.evaluate(() => window.__controlsTest.getX());
await page.keyboard.down("ArrowRight");
await page.waitForTimeout(1000);
await page.keyboard.up("ArrowRight");
const x1 = await page.evaluate(() => window.__controlsTest.getX());

await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await page.waitForTimeout(3500);
const slow = await intervals(10000);
const slowInfo = await page.evaluate(() => ({ rate: window.__framePace.rate(), hold: window.__framePace.hold(), work: window.__framePace.work() }));
const slowStat = describe(`4× rate ${slowInfo.rate} hold ${slowInfo.hold.toFixed(1)} work ${slowInfo.work.toFixed(1)}`, slow, 28, 42);

const y0 = await page.evaluate(() => window.__controlsTest.getX());
await page.keyboard.down("ArrowRight");
await page.waitForTimeout(1000);
await page.keyboard.up("ArrowRight");
const y1 = await page.evaluate(() => window.__controlsTest.getX());

const before = await cdp.send("Performance.getMetrics");
await page.waitForTimeout(5000);
const after = await cdp.send("Performance.getMetrics");
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
const wall = val(after, "Timestamp") - val(before, "Timestamp");
const busy = val(after, "TaskDuration") - val(before, "TaskDuration");
const pct = wall > 0 ? (100 * busy) / wall : 0;
const busyLine = `4× standing: busy ${busy.toFixed(2)}s of ${wall.toFixed(2)}s (${pct.toFixed(1)}%)`;
console.log(busyLine);

const lines = [
  "Adaptive picture rate. Full display rate until pictures land later than 20 ms, or the thread hold stays over 6 ms.",
  "Back to the display rate only after the hold stays under 4 ms. Update step is 1/60s either way.",
  fullStat.line,
  slowStat.line,
  busyLine,
  `Walk at full rate, 1s: x ${x0.toFixed(1)} → ${x1.toFixed(1)} (${(x1 - x0).toFixed(1)} px)`,
  `Walk at 4×, 1s: x ${y0.toFixed(1)} → ${y1.toFixed(1)} (${(y1 - y0).toFixed(1)} px)`,
  errors.length ? `page errors: ${errors.join(" | ")}` : "page errors: 0",
  "",
  "60 Hz intervals",
  ...full.map((n) => n.toFixed(2)),
  "",
  "4× intervals",
  ...slow.map((n) => n.toFixed(2)),
];
writeFileSync(new URL("result.txt", out), lines.join("\n") + "\n");
await browser.close();
const ok = fullStat.off === 0 && fullStat.n > 400 && slowStat.off === 0 && slowStat.n > 200 && pct < 40 && !errors.length;
console.log(ok ? "PASS" : "FAIL");
process.exit(ok ? 0 : 1);
