/**
 * Frame rate lives in global settings. The menu and the pause menu can set it.
 * A new week does not clear it, and a reload keeps it.
 *   node scripts/settings-global.mjs http://127.0.0.1:8098/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8098/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-12e/", import.meta.url);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(20000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest && window.__framePace);
await page.getByTestId("menu-settings").click();
await page.getByTestId("fps-30").click();
await page.waitForTimeout(200);
const fromMenu = await page.evaluate(() => ({
  store: localStorage.getItem("cc.settings"),
  choice: window.__framePace.choice(),
  rate: window.__framePace.rate(),
}));
await page.evaluate(() => window.__controlsTest.bootPlay());
await page.waitForFunction(() => window.__controlsTest.getMode() === "play");
await page.keyboard.press("Escape");
await page.getByTestId("pause-frame-rate").waitFor();
await page.getByTestId("fps-60").click();
await page.waitForTimeout(200);
const fromPause = await page.evaluate(() => window.__framePace.choice());
await page.getByTestId("fps-30").click();
await page.waitForTimeout(100);
await page.getByTestId("pause-new-week").click();
await page.getByTestId("wipe-confirm-yes").click();
await page.waitForTimeout(400);
const afterWeek = await page.evaluate(() => ({
  store: localStorage.getItem("cc.settings"),
  choice: window.__framePace.choice(),
  rate: window.__framePace.rate(),
  mode: window.__controlsTest.getMode(),
}));
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest && window.__framePace);
await page.waitForTimeout(300);
const afterReload = await page.evaluate(() => ({
  store: localStorage.getItem("cc.settings"),
  choice: window.__framePace.choice(),
  rate: window.__framePace.rate(),
}));
await browser.close();

const lines = [
  `Menu click 30. Store ${fromMenu.store}. Choice ${fromMenu.choice}. Pace ${fromMenu.rate}.`,
  `Pause click 60. Choice ${fromPause}.`,
  `New week. Store ${afterWeek.store}. Choice ${afterWeek.choice}. Pace ${afterWeek.rate}. Mode ${afterWeek.mode}.`,
  `Reload. Store ${afterReload.store}. Choice ${afterReload.choice}. Pace ${afterReload.rate}.`,
  errors.length ? `Page errors: ${errors.join(" | ")}` : "Page errors: 0.",
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
console.log(lines.join("\n"));
const ok =
  fromMenu.store === '{"frameRate":"30"}' &&
  fromMenu.choice === "30" &&
  fromMenu.rate === "half" &&
  fromPause === "60" &&
  afterWeek.store === '{"frameRate":"30"}' &&
  afterWeek.choice === "30" &&
  afterWeek.rate === "half" &&
  afterReload.store === '{"frameRate":"30"}' &&
  afterReload.choice === "30" &&
  afterReload.rate === "half" &&
  errors.length === 0;
if (!ok) process.exit(1);
