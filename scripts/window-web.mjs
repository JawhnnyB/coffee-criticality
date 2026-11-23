/**
 * The browser build does not show the desktop window buttons.
 *   node scripts/window-web.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-24/", import.meta.url);
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
await page.getByTestId("settings-fields").waitFor();
const count = await page.locator("[data-testid=window-borderless]").count();
const text = await page.getByTestId("text-normal").getAttribute("class");
await browser.close();

const lines = [
  `Web window buttons ${count}.`,
  `Text size class ${text}.`,
  errors.length ? `Page errors: ${errors.join(" | ")}` : "Page errors: 0.",
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
console.log(lines.join("\n"));
if (count !== 0 || errors.length) process.exit(1);
