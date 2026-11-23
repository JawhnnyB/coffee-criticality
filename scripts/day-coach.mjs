/**
 * Day 1 coach changes when the player walks, then when the flags move on.
 *   node scripts/day-coach.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-36/", import.meta.url);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(20000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));
await page.goto(`${base}?v=coach`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest);
await page.evaluate(() => window.__controlsTest.bootPlay());
await page.waitForTimeout(200);
const first = await page.getByTestId("day-coach").innerText();
await page.evaluate(() => window.__controlsTest.setKeys(["KeyD"]));
await page.waitForTimeout(400);
await page.evaluate(() => window.__controlsTest.setKeys([]));
const walked = await page.getByTestId("day-coach").innerText();
await page.evaluate(() => {
  window.__controlsTest.setFlag("plantEntered", true);
  window.__controlsTest.setFlag("holtTalked", true);
});
await page.waitForTimeout(200);
const peer = await page.getByTestId("day-coach").innerText();
await browser.close();

const lines = [
  `At the cafe. ${first}`,
  `After a step. ${walked}`,
  `After Holt is waiting. ${peer}`,
  `Page errors ${errors.length}.`,
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
if (first !== "Walk. WASD or the arrows.") process.exit(2);
if (walked !== "Walk east to the gate.") process.exit(3);
if (peer !== "P looks closer at what is wrong.") process.exit(4);
if (errors.length) process.exit(5);
console.log(lines.join("\n"));
