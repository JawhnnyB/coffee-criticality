/**
 * Step 10. A day shift on the built game, CPU at 4×.
 * Busy time is TaskDuration over a wall-clock window.
 *   node scripts/day-prof.mjs http://127.0.0.1:8096/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8096/";
const out = new URL("../docs/audit/2026-11-22-value/step-10/", import.meta.url);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest);
await page.evaluate(() => window.__controlsTest.bootPlay());
await page.waitForTimeout(400);

const cdp = await page.context().newCDPSession(page);
await cdp.send("Performance.enable");
const val = (list, name) => list.metrics.find((m) => m.name === name)?.value ?? 0;

async function sample(label, ms, during) {
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const before = await cdp.send("Performance.getMetrics");
  const t0 = Date.now();
  const job = during ? during() : null;
  await page.waitForTimeout(ms);
  if (job) await job.catch(() => {});
  const after = await cdp.send("Performance.getMetrics");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  const dt = val(after, "Timestamp") - val(before, "Timestamp");
  const busy = val(after, "TaskDuration") - val(before, "TaskDuration");
  const wall = dt > 0 ? dt : (Date.now() - t0) / 1000;
  const pct = (100 * busy) / wall;
  const line = `${label}: busy ${busy.toFixed(2)}s of ${wall.toFixed(2)}s (${pct.toFixed(1)}%)`;
  console.log(line);
  return { label, busy, wall, pct, line };
}

const still = await sample("standing in the cafe", 5000);
await page.keyboard.down("ArrowRight");
const walk = await sample("walking the cafe", 5000);
await page.keyboard.up("ArrowRight");
await page.keyboard.down("ArrowUp");
const hall = await sample("walking toward the floor", 5000);
await page.keyboard.up("ArrowUp");
await page.screenshot({ path: new URL("walk.png", out).pathname });

const worst = Math.max(still.pct, walk.pct, hall.pct);
const lines = [
  "Day shift, built game, CPU throttled to 4×.",
  "Boot into the cafe was labelled. The walk was real keys.",
  still.line,
  walk.line,
  hall.line,
  `Worst ${worst.toFixed(1)}%. Target is under 40%.`,
  errors.length ? `page errors: ${errors.join(" | ")}` : "page errors: 0",
];
writeFileSync(new URL("result.txt", out), lines.join("\n") + "\n");
await browser.close();
if (worst >= 40 || errors.length) {
  console.log("FAIL");
  process.exit(1);
}
console.log("PASS");
