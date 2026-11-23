/**
 * Escape pauses a cabinet without leaving it. Resume stays in the game.
 *   node scripts/pause-hold.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-17/", import.meta.url);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(20000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest);
await page.evaluate(() => window.__controlsTest.bootPlay());
await page.waitForFunction(() => window.__controlsTest.getMode() === "play");
await page.evaluate(() => window.__controlsTest.openCab("fish"));
await page.waitForTimeout(200);
const before = await page.evaluate(() => window.__controlsTest.getMode());
await page.keyboard.press("Escape");
await page.getByTestId("hold-pause").waitFor();
const held = await page.evaluate(() => window.__controlsTest.getMode());
await page.getByTestId("hold-resume").click();
await page.waitForTimeout(100);
const after = await page.evaluate(() => ({
  mode: window.__controlsTest.getMode(),
  card: document.querySelector("[data-testid=hold-pause]") ? "up" : "down",
}));
await browser.close();

const lines = [
  `Opened ${before}.`,
  `Escape. Mode ${held}. Card up.`,
  `Resume. Mode ${after.mode}. Card ${after.card}.`,
  errors.length ? `Page errors: ${errors.join(" | ")}` : "Page errors: 0.",
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
console.log(lines.join("\n"));
const ok = before === "fish" && held === "fish" && after.mode === "fish" && after.card === "down" && errors.length === 0;
if (!ok) process.exit(1);
