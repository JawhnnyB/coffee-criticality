/**
 * Arrows and a pad move focus. The mouse opens the controls card.
 *   node scripts/controls-card.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-15/", import.meta.url);
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
await page.getByTestId("pixel-menu").waitFor();
await page.keyboard.press("ArrowDown");
await page.waitForTimeout(50);
const first = await page.evaluate(() => ({
  tag: document.activeElement?.tagName ?? "",
  text: (document.activeElement?.textContent ?? "").trim().slice(0, 24),
  inMenu: !!document.activeElement?.closest("[data-testid=pixel-menu]"),
}));
await page.keyboard.press("ArrowDown");
await page.waitForTimeout(50);
const second = await page.evaluate(() => (document.activeElement?.textContent ?? "").trim().slice(0, 24));
const buttons = Array(16).fill(false);
buttons[13] = true;
await page.evaluate((b) => {
  window.__padInject = { axes: [0, 0.9], buttons: b };
}, buttons);
await page.waitForTimeout(80);
const afterPad = await page.evaluate(() => (document.activeElement?.textContent ?? "").trim().slice(0, 24));
await page.evaluate(() => {
  window.__padInject = null;
});
await page.evaluate(() => window.__controlsTest.bootPlay());
await page.waitForFunction(() => window.__controlsTest.getMode() === "play");
await page.keyboard.press("Escape");
await page.getByTestId("pause-stage").waitFor();
await page.getByTestId("pause-controls").click();
await page.getByTestId("controls-card").waitFor();
const card = await page.getByTestId("controls-card").innerText();
await browser.close();

const lines = [
  `Menu arrow. In menu ${first.inMenu}. Tag ${first.tag}. Text ${first.text}. Next ${second}.`,
  `Pad down. Focus ${afterPad}.`,
  `Pause click. Card has stick ${card.includes("left stick")}. Card has mouse ${card.toLowerCase().includes("mouse")}.`,
  errors.length ? `Page errors: ${errors.join(" | ")}` : "Page errors: 0.",
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
console.log(lines.join("\n"));
const ok =
  first.inMenu &&
  first.tag === "BUTTON" &&
  second !== first.text &&
  afterPad !== second &&
  card.includes("left stick") &&
  card.toLowerCase().includes("mouse") &&
  errors.length === 0;
if (!ok) process.exit(1);
