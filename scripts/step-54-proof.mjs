/**
 * The plant monitor in the corner of a day shift, at 1280×720 and 390×844.
 * It leaves when the night rotation starts.
 *   node scripts/step-54-proof.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = fileURLToPath(new URL("../docs/audit/2026-11-22-value/step-54/", import.meta.url));
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  ...(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {}),
  args: ["--disable-background-timer-throttling"],
});
const notes = [];
const errors = [];

try {
  for (const [w, h, tag] of [
    [1280, 720, "1280"],
    [390, 844, "390"],
  ]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on("pageerror", (e) => errors.push(`${tag} ${String(e).slice(0, 200)}`));
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__controlsTest);
    await page.evaluate(() => window.__controlsTest.bootPlay());
    const box = page.getByTestId("corner-monitor");
    await box.waitFor({ state: "visible", timeout: 10000 });
    const text = (await box.innerText()).replace(/\s+/g, " ").trim();
    if (!text.includes("MONITOR")) throw new Error(`${tag} ${text}`);
    await page.screenshot({ path: join(outDir, `day-${tag}.png`), animations: "disabled" });
    await page.evaluate(() => window.__controlsTest.setFlag("rot:nights", true));
    await page.waitForFunction(() => !document.querySelector("[data-testid='corner-monitor']"));
    notes.push(`${tag} ${text}`);
    await page.close();
  }
} catch (err) {
  errors.push(String(err).slice(0, 400));
} finally {
  await browser.close();
}

const report = [`errors ${errors.length}`, ...notes, ...errors.map((e) => `ERR ${e}`)].join("\n") + "\n";
writeFileSync(join(outDir, "result.txt"), report);
console.log(report);
if (errors.length) process.exit(1);
