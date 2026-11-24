/**
 * Every levelled cabinet shows Level 3 on the bezel.
 *   node scripts/step-58-proof.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = fileURLToPath(new URL("../docs/audit/2026-11-22-value/step-58/", import.meta.url));
mkdirSync(outDir, { recursive: true });

const CABS = [
  ["catch", "arcade"],
  ["rods", "rods"],
  ["pebble", "pebble"],
  ["fish", "fish"],
  ["golf", "golf"],
  ["bowl", "bowl"],
  ["horde", "horde"],
  ["plot", "plot"],
];

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
    page.on("pageerror", (e) => errors.push(`${tag} ${String(e).slice(0, 180)}`));
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__controlsTest, { timeout: 25000 });
    await page.evaluate(() => window.__controlsTest.bootPlay());
    for (const [id, mode] of CABS) {
      await page.evaluate(
        ([cab, launch]) => {
          window.__controlsTest.setFlag(`cab:${cab}:2`, true);
          window.__controlsTest.setFlag(`cab:${cab}:3`, true);
          window.__controlsTest.deskLaunch(launch);
        },
        [id, mode],
      );
      const label = page.getByTestId("cab-level").first();
      await label.waitFor({ state: "visible", timeout: 10000 });
      const text = ((await label.innerText()) ?? "").replace(/\s+/g, " ").trim();
      if (text.toUpperCase() !== "LEVEL 3") throw new Error(`${id} ${tag} ${text}`);
      await page.screenshot({ path: join(outDir, `${id}-${tag}.png`), animations: "disabled" });
      notes.push(`${id} ${tag} ${text}`);
    }
    await page.close();
  }
} catch (err) {
  errors.push(String(err).slice(0, 500));
} finally {
  await browser.close();
}

const report = [`errors ${errors.length}`, ...notes, ...errors.map((e) => `ERR ${e}`)].join("\n") + "\n";
writeFileSync(join(outDir, "result.txt"), report);
console.log(report);
if (errors.length) process.exit(1);
