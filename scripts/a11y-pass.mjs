/**
 * Focus ring, menu label, and an alarm mark that is a shape.
 *   node scripts/a11y-pass.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-18/", import.meta.url);
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
const menu = await page.getByTestId("pixel-menu").getAttribute("aria-label");
await page.keyboard.press("ArrowDown");
const ring = await page.evaluate(() => {
  const el = document.activeElement;
  const s = el ? getComputedStyle(el) : null;
  return { tag: el?.tagName ?? "", width: s?.outlineWidth ?? "", style: s?.outlineStyle ?? "" };
});
await browser.close();

const lines = [
  `Menu label ${menu}.`,
  `Focus ${ring.tag}. Outline ${ring.width} ${ring.style}.`,
  errors.length ? `Page errors: ${errors.join(" | ")}` : "Page errors: 0.",
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
console.log(lines.join("\n"));
const ok = menu === "Main menu" && ring.tag === "BUTTON" && ring.style === "solid" && ring.width !== "0px" && errors.length === 0;
if (!ok) process.exit(1);
