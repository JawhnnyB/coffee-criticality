/**
 * Step 10c. Auto stays at 60 on a 1× and a 4× CPU, steps down at 6×,
 * and the settings chips force 60, 30, and Auto. The choice survives a reload.
 *   node scripts/frame-rate.mjs http://127.0.0.1:8099/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8099/";
const out = new URL("../docs/audit/2026-11-22-value/step-10c/", import.meta.url);
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

async function busyFor(ms) {
  const before = await cdp.send("Performance.getMetrics");
  await page.waitForTimeout(ms);
  const after = await cdp.send("Performance.getMetrics");
  const wall = val(after, "Timestamp") - val(before, "Timestamp");
  const busy = val(after, "TaskDuration") - val(before, "TaskDuration");
  const pct = wall > 0 ? (100 * busy) / wall : 0;
  return pct;
}

async function stamp() {
  return page.evaluate(() => ({
    rate: window.__framePace.rate(),
    choice: window.__framePace.choice(),
    hold: window.__framePace.hold(),
  }));
}

const lines = ["Frame rate. Auto, or a saved 60 or 30.", "Update step is 1/60s either way."];

async function run(name, rate, ms, lo, hi, settle) {
  await cdp.send("Emulation.setCPUThrottlingRate", { rate });
  await page.waitForTimeout(settle ?? (rate === 1 ? 800 : 3500));
  const gaps = await intervals(ms);
  const info = await stamp();
  const stat = describe(`${name} rate ${info.rate} choice ${info.choice} hold ${info.hold.toFixed(1)}`, gaps, lo, hi);
  const pct = await busyFor(4000);
  const busyLine = `${name} busy ${pct.toFixed(1)}%`;
  console.log(busyLine);
  lines.push(stat.line, busyLine);
  return { stat, pct, info, gaps };
}

async function setFps(id) {
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  const mode = await page.evaluate(() => window.__controlsTest.getMode());
  if (mode !== "desktop") await page.evaluate(() => window.__controlsTest.openDesk());
  if (!(await page.locator("[data-testid='settings-app']").count())) {
    await page.locator("[data-testid='icon-settings']").click();
  }
  const chip = page.locator(`[data-testid='fps-${id}']`);
  await chip.scrollIntoViewIfNeeded();
  await chip.click();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  if ((await page.evaluate(() => window.__controlsTest.getMode())) !== "play") {
    await page.getByTestId("start-button").click();
    await page.getByRole("button", { name: "Back to shift" }).click();
  }
  await page.waitForFunction(() => window.__controlsTest.getMode() === "play");
  await page.evaluate(() => window.__controlsTest.save());
}

const one = await run("1× auto", 1, 10000, 14, 22, 4500);
const four = await run("4× auto", 4, 10000, 14, 22);
const six = await run("6× auto", 6, 10000, 28, 42, 8000);

await setFps("60");
const picked60 = await stamp();
lines.push(`clicked 60, choice ${picked60.choice}`);
const forced60 = await run("60 at 6×", 6, 8000, 14, 22);

await setFps("30");
const forced30 = await run("30 at 1×", 1, 8000, 28, 42);

await setFps("auto");
const back = await run("auto at 1×", 1, 8000, 14, 22, 3000);

await setFps("30");
const beforeReload = await stamp();
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest && window.__framePace);
await page.evaluate(() => window.__controlsTest.load());
await page.waitForTimeout(1500);
const afterReload = await stamp();
lines.push(`saved choice before reload ${beforeReload.choice}, after ${afterReload.choice}`);
const kept = await run("30 after reload", 1, 6000, 28, 42, 120);

await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
lines.push(errors.length ? `page errors: ${errors.join(" | ")}` : "page errors: 0");
lines.push("", "1× intervals", ...one.gaps.map((n) => n.toFixed(2)));
lines.push("", "4× intervals", ...four.gaps.map((n) => n.toFixed(2)));
lines.push("", "6× intervals", ...six.gaps.map((n) => n.toFixed(2)));
writeFileSync(new URL("result.txt", out), lines.join("\n") + "\n");

const expect = (stat, info, rate, choice, lo) =>
  stat.off === 0 && stat.n > (lo < 20 ? 300 : 120) && info.rate === rate && info.choice === choice;

const ok =
  expect(one.stat, one.info, "full", "auto", 14) &&
  expect(four.stat, four.info, "full", "auto", 14) &&
  expect(six.stat, six.info, "half", "auto", 28) &&
  picked60.choice === "60" &&
  forced60.info.rate === "full" &&
  forced60.info.choice === "60" &&
  forced60.stat.mean > 15 &&
  forced60.stat.mean < 20 &&
  forced60.stat.off <= 6 &&
  expect(forced30.stat, forced30.info, "half", "30", 28) &&
  expect(back.stat, back.info, "full", "auto", 14) &&
  beforeReload.choice === "30" &&
  afterReload.choice === "30" &&
  expect(kept.stat, kept.info, "half", "30", 28) &&
  !errors.length;

console.log(ok ? "PASS" : "FAIL");
await browser.close();
process.exit(ok ? 0 : 1);
