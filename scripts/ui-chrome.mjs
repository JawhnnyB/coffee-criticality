/**
 * Menu and settings read the chrome file. Story lines stay where they were.
 *   node scripts/ui-chrome.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-19/", import.meta.url);
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
await page.getByTestId("new-shift").waitFor();
const begin = (await page.getByTestId("new-shift").innerText()).trim();
await page.getByTestId("menu-settings").click();
await page.getByText("Text size", { exact: true }).waitFor();
await page.getByText("Esc still pauses. Arrows still walk.", { exact: true }).waitFor();
const frame = await page.getByText("Frame rate", { exact: true }).count();
await page.getByRole("button", { name: "HOW TO PLAY" }).click();
await page.getByTestId("controls-card").waitFor();
const card = await page.getByTestId("controls-card").innerText();
await browser.close();

const lines = [
  `Begin reads ${begin}.`,
  `Settings shows Text size. Frame rate count ${frame}.`,
  `Card has stick ${card.includes("left stick")}. Card has mouse ${card.toLowerCase().includes("mouse")}.`,
  errors.length ? `Page errors: ${errors.join(" | ")}` : "Page errors: 0.",
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
console.log(lines.join("\n"));
const ok = begin === "Begin" && frame > 0 && card.includes("left stick") && card.toLowerCase().includes("mouse") && errors.length === 0;
if (!ok) process.exit(1);
