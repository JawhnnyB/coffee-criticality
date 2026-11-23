/**
 * Daily night from the Night Watch app. Replay, local board, no week flag.
 *   node scripts/daily.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-44/", import.meta.url);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(20000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));
await page.goto(`${base}?v=daily`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest);
await page.evaluate(() => {
  localStorage.removeItem("cc.daily");
  window.__controlsTest.bootPlay();
  window.__controlsTest.openDesk();
});
await page.waitForTimeout(300);
if (await page.getByTestId("home-nightwatch").count()) await page.getByTestId("home-nightwatch").click();
else {
  await page.getByTestId("start-button").click();
  await page.getByRole("menuitem", { name: "Night Watch" }).click();
}
await page.getByTestId("night-daily").waitFor();
const listed = await page.getByTestId("daily-seed").innerText();
await page.getByTestId("night-daily").click();
await page.waitForFunction(() => typeof window.__controlsTest.setNightSpeed === "function");
await page.evaluate(() => window.__controlsTest.setNightSpeed(400));
await page.getByTestId("nw-summary").waitFor();
const shown = await page.getByTestId("nw-seed").innerText();
await page.getByTestId("nw-summary-leave").click();
await page.getByTestId("daily-board").waitFor();
const board = await page.getByTestId("daily-board").innerText();
const saved = await page.evaluate(() => ({ daily: localStorage.getItem("cc.daily") || "", week: localStorage.getItem("cc.save.v2") || "" }));
await browser.close();

const lines = [
  `App. ${listed}`,
  `Turnover. ${shown}`,
  `Board. ${board.replace(/\n/g, " ")}`,
  saved.week.includes("night:2:done") ? "Week save gained night:2." : "Week save has no night:2.",
  `Page errors ${errors.length}.`,
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
const seed = listed.replace("Seed ", "").trim();
if (!shown.endsWith(seed)) process.exit(2);
if (!saved.daily.includes(seed)) process.exit(3);
if (board.includes("No score yet")) process.exit(4);
if (saved.week.includes("night:2:done")) process.exit(5);
if (errors.length) process.exit(6);
console.log(lines.join("\n"));
