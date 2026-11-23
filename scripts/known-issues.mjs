/**
 * Version on the menu. Known issues open beside How to play. Not in storage.
 *   node scripts/known-issues.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-20/", import.meta.url);
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
await page.getByTestId("game-version").waitFor();
const version = (await page.getByTestId("game-version").innerText()).trim();
await page.getByTestId("menu-settings").click();
const howBox = await page.getByRole("button", { name: "HOW TO PLAY" }).boundingBox();
const issuesBox = await page.getByTestId("known-issues").boundingBox();
await page.getByTestId("known-issues").click();
await page.getByTestId("known-issues-panel").waitFor();
const panel = await page.getByTestId("known-issues-panel").innerText();
const stored = await page.evaluate(() => Object.entries(localStorage).map(([k, v]) => `${k}=${v}`).join("\n"));
await browser.close();

const beside = !!howBox && !!issuesBox && Math.abs(howBox.y - issuesBox.y) < 8 && issuesBox.x > howBox.x;
const lines = [
  `Version ${version}.`,
  `Beside how-to ${beside}. How x ${howBox?.x ?? "none"}. Issues x ${issuesBox?.x ?? "none"}.`,
  `Panel has delay rods ${panel.includes("Delay rods")}. Panel has generated ${panel.toLowerCase().includes("generated")}.`,
  `Storage has version ${stored.includes(version)}.`,
  errors.length ? `Page errors: ${errors.join(" | ")}` : "Page errors: 0.",
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
console.log(lines.join("\n"));
const ok =
  version === "0.20" &&
  beside &&
  panel.includes("Delay rods") &&
  panel.toLowerCase().includes("generated") &&
  !stored.includes(version) &&
  errors.length === 0;
if (!ok) process.exit(1);
