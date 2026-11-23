/**
 * The turnover shows the seed that dealt the night.
 *   node scripts/night-seed.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-42/", import.meta.url);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(20000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));
await page.goto(`${base}?v=seed`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest);
await page.evaluate(() => {
  window.__controlsTest.bootPlay();
  window.__controlsTest.setNightSeed(42);
  window.__controlsTest.setFlag("rot:reported", true);
  window.__controlsTest.setFlag("rot:nights", true);
});
await page.waitForTimeout(250);
await page.getByTestId("start-night").click();
await page.waitForFunction(() => typeof window.__controlsTest.setNightSpeed === "function");
await page.evaluate(() => window.__controlsTest.setNightSpeed(400));
await page.getByTestId("nw-seed").waitFor();
const shown = await page.getByTestId("nw-seed").innerText();
await browser.close();

const lines = [`Turnover. ${shown}`, `Page errors ${errors.length}.`];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
if (shown !== "Seed 42") process.exit(2);
if (errors.length) process.exit(3);
console.log(lines.join("\n"));
