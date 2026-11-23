/**
 * Endless starts from the dawn lot as night 5, and does not write a week flag.
 *   node scripts/endless.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-43/", import.meta.url);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(20000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));
await page.goto(`${base}?v=endless`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest);
await page.evaluate(() => {
  window.__controlsTest.bootPlay();
  window.__controlsTest.setFlag("rot:dawn", true);
  window.__controlsTest.setFlag("rot:complete", true);
  window.__controlsTest.setFlag("rot:nights", true);
});
await page.getByTestId("dawn-endless").click();
await page.getByTestId("nightwatch-shift").waitFor();
const text = await page.getByTestId("nightwatch-shift").innerText();
const save = await page.evaluate(() => localStorage.getItem("cc.save.v2") || "");
await browser.close();

const lines = [
  text.includes("NIGHT 5") ? "Shift reads NIGHT 5." : `Shift text did not say NIGHT 5. ${text.slice(0, 180)}`,
  save.includes("night:5") ? "Week save contains night:5." : "Week save has no night:5.",
  `Page errors ${errors.length}.`,
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
if (!text.includes("NIGHT 5")) process.exit(2);
if (save.includes("night:5")) process.exit(3);
if (errors.length) process.exit(4);
console.log(lines.join("\n"));
