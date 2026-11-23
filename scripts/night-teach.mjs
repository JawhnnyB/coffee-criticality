/**
 * Night 1 opens with one coach line. Space lifts the tablet and that line goes.
 *   node scripts/night-teach.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-37/", import.meta.url);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(20000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));
await page.goto(`${base}?v=nightcoach`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest);
await page.evaluate(() => {
  window.__controlsTest.bootPlay();
  window.__controlsTest.setNightSeed(3);
  window.__controlsTest.setFlag("rot:nights", true);
  window.__controlsTest.setFlag("rot:reported", true);
});
await page.waitForTimeout(300);
await page.getByTestId("start-night").click();
await page.getByTestId("nw-coach").waitFor();
const first = await page.getByTestId("nw-coach").innerText();
await page.keyboard.press(" ");
await page.waitForTimeout(400);
const after = await page.getByTestId("nw-coach").count();
await browser.close();

const lines = [
  `Night 1, tablet down. ${first}`,
  `After Space, coach lines on screen: ${after}.`,
  `Page errors ${errors.length}.`,
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
if (first !== "Space opens the tablet.") process.exit(2);
if (after !== 0) process.exit(3);
if (errors.length) process.exit(4);
console.log(lines.join("\n"));
