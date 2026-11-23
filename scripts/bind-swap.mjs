/**
 * Binding Down to E swaps with Use. Reset puts the defaults back.
 *   node scripts/bind-swap.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-1a/", import.meta.url);
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
await page.evaluate(() => localStorage.removeItem("cc.settings"));
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest);
await page.getByTestId("menu-settings").click();
await page.getByTestId("bind-down").click();
await page.keyboard.press("KeyE");
await page.waitForTimeout(80);
const down = await page.getByTestId("bind-down").innerText();
const use = await page.getByTestId("bind-interact").innerText();
const saved = await page.evaluate(() => localStorage.getItem("cc.settings"));
await page.getByTestId("bind-reset").click();
await page.waitForTimeout(40);
const down2 = await page.getByTestId("bind-down").innerText();
const use2 = await page.getByTestId("bind-interact").innerText();
await browser.close();

const binds = JSON.parse(saved).binds;
const none = Object.values(binds).some((code) => !code);
const lines = [
  `After E. Down label ${down}. Use label ${use}.`,
  `Store down ${binds.down}. Store use ${binds.interact}. None ${none}.`,
  `After reset. Down ${down2}. Use ${use2}.`,
  errors.length ? `Page errors: ${errors.join(" | ")}` : "Page errors: 0.",
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
console.log(lines.join("\n"));
const ok =
  binds.down === "KeyE" &&
  binds.interact === "KeyS" &&
  down.includes("E") &&
  use.includes("S") &&
  !none &&
  down2.includes("S") &&
  use2.includes("E") &&
  errors.length === 0;
if (!ok) process.exit(1);
