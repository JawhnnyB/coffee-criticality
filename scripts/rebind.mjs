/**
 * A rebound key is saved, and a reload keeps it.
 *   node scripts/rebind.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-16/", import.meta.url);
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
await page.getByTestId("menu-settings").click();
await page.getByTestId("bind-interact").click();
await page.keyboard.press("KeyF");
await page.waitForTimeout(100);
const saved = await page.evaluate(() => localStorage.getItem("cc.settings"));
const label = await page.getByTestId("bind-interact").innerText();
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest);
await page.getByTestId("menu-settings").click();
const again = await page.getByTestId("bind-interact").innerText();
await browser.close();

const lines = [
  `After press. Label ${label}. Store ${saved}.`,
  `Reload. Label ${again}.`,
  errors.length ? `Page errors: ${errors.join(" | ")}` : "Page errors: 0.",
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
console.log(lines.join("\n"));
const parsed = JSON.parse(saved);
const ok = parsed.binds.interact === "KeyF" && label.includes("F") && again.includes("F") && errors.length === 0;
if (!ok) process.exit(1);
