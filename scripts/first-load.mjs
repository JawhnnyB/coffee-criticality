/**
 * Bytes transferred before the main menu is on screen.
 *   node scripts/first-load.mjs http://127.0.0.1:8099/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8099/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-13/", import.meta.url);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 180)));
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.getByTestId("menu-settings").waitFor();
const rows = await page.evaluate(() => {
  const nav = performance.getEntriesByType("navigation")[0];
  const list = [];
  if (nav) list.push({ name: nav.name, transfer: nav.transferSize, decoded: nav.decodedBodySize });
  for (const e of performance.getEntriesByType("resource")) {
    list.push({ name: e.name, transfer: e.transferSize, decoded: e.decodedBodySize });
  }
  return list;
});
await browser.close();
const transfer = rows.reduce((n, r) => n + r.transfer, 0);
const decoded = rows.reduce((n, r) => n + r.decoded, 0);
const mb = (n) => (n / (1024 * 1024)).toFixed(2);
const lines = [
  `Before the menu. ${rows.length} responses.`,
  `Transferred ${transfer} bytes (${mb(transfer)} MB).`,
  `Decoded ${decoded} bytes (${mb(decoded)} MB).`,
  `Target is under 3 MB transferred.`,
  transfer < 3 * 1024 * 1024 ? "Under 3 MB." : "FAIL over 3 MB.",
  errors.length ? `Page errors: ${errors.join(" | ")}` : "Page errors: 0.",
  "",
  ...rows
    .slice()
    .sort((a, b) => b.transfer - a.transfer)
    .map((r) => `${r.transfer}\t${r.decoded}\t${r.name.replace(base, "/")}`),
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
console.log(lines.slice(0, 8).join("\n"));
if (transfer >= 3 * 1024 * 1024 || errors.length) process.exit(1);
