/**
 * Frame rate uses the same selected fill as text size.
 *   node scripts/fps-selected.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-1b/", import.meta.url);
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
await page.getByTestId("fps-30").click();
await page.getByTestId("text-large").click();
const cls = await page.evaluate(() => ({
  fpsOn: document.querySelector("[data-testid=fps-30]")?.className ?? "",
  fpsOff: document.querySelector("[data-testid=fps-auto]")?.className ?? "",
  textOn: document.querySelector("[data-testid=text-large]")?.className ?? "",
  textOff: document.querySelector("[data-testid=text-small]")?.className ?? "",
}));
await browser.close();

const lines = [
  `Frame 30 ${cls.fpsOn}. Frame auto ${cls.fpsOff}.`,
  `Text large ${cls.textOn}. Text small ${cls.textOff}.`,
  errors.length ? `Page errors: ${errors.join(" | ")}` : "Page errors: 0.",
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
console.log(lines.join("\n"));
const ok =
  cls.fpsOn === cls.textOn &&
  cls.fpsOn.includes("btn-primary") &&
  cls.fpsOff === cls.textOff &&
  cls.fpsOff.includes("btn-ghost") &&
  errors.length === 0;
if (!ok) process.exit(1);
