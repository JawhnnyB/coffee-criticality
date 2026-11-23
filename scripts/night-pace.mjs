/**
 * Night pace uses the same filled button as text size.
 *   node scripts/night-pace.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-38/", import.meta.url);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(20000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));
await page.goto(`${base}?v=pace`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest);
await page.evaluate(() => localStorage.removeItem("cc.settings"));
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest);
await page.getByTestId("menu-settings").click();
await page.getByTestId("pace-standard").waitFor();
const before = await page.getByTestId("pace-standard").getAttribute("class");
const ghost = await page.getByTestId("pace-nuke").getAttribute("class");
await page.getByTestId("pace-nuke").click();
const after = await page.getByTestId("pace-nuke").getAttribute("class");
const standardNow = await page.getByTestId("pace-standard").getAttribute("class");
const stored = await page.evaluate(() => localStorage.getItem("cc.settings"));
await browser.close();

const lines = [
  `Standard before the click: ${before}`,
  `Nuke before the click: ${ghost}`,
  `Nuke after the click: ${after}`,
  `Standard after the click: ${standardNow}`,
  `Saved: ${stored}`,
  `Page errors ${errors.length}.`,
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
if (!before?.includes("btn-primary")) process.exit(2);
if (!ghost?.includes("btn-ghost")) process.exit(3);
if (!after?.includes("btn-primary")) process.exit(4);
if (!standardNow?.includes("btn-ghost")) process.exit(5);
if (!stored?.includes('"nightPace":"nuke"')) process.exit(6);
if (errors.length) process.exit(7);
console.log(lines.join("\n"));
