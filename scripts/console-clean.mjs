/**
 * Production console. A real new shift, then a few seconds in the cafe.
 * Passes only when the page logged no warnings and no errors.
 *   node scripts/console-clean.mjs http://127.0.0.1:8099/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8099/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-12/", import.meta.url);
mkdirSync(outDir, { recursive: true });
const out = outDir.pathname;

const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const lines = [];
page.on("console", (msg) => {
  const t = msg.type();
  if (t === "warning" || t === "error" || t === "assert") lines.push(`${t} | ${msg.text().replace(/\s+/g, " ").slice(0, 400)}`);
});
page.on("pageerror", (err) => lines.push(`pageerror | ${String(err).replace(/\s+/g, " ").slice(0, 400)}`));
page.on("response", (res) => {
  if (res.status() >= 400) lines.push(`http ${res.status()} | ${res.url().slice(0, 240)}`);
});

async function intoPlay() {
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(800);
  const boot = page.locator("[data-testid='boot-log']");
  if (await boot.count()) await boot.click({ timeout: 2000 }).catch(() => {});
  const begin = page.getByTestId("new-shift");
  await begin.waitFor({ timeout: 15000 });
  await begin.click();
  await page.waitForTimeout(250);
  const wipe = page.getByTestId("wipe-confirm-yes");
  if (await wipe.count()) await wipe.click();
  await page.getByTestId("setup-continue").click();
  await page.waitForTimeout(300);
  const start = page.getByTestId("start-button");
  if (await start.count()) await start.click();
  await page.getByTestId("start-shift").click();
  await page.getByTestId("role-transferred").waitFor({ timeout: 15000 });
  await page.getByTestId("role-transferred").click();
  await page.waitForTimeout(250);
  for (let i = 0; i < 140; i++) {
    const mode = await page.evaluate(() => window.__controlsTest?.getMode?.() ?? "").catch(() => "");
    if (i % 10 === 0) process.stdout.write(`step ${i} ${mode}\n`);
    if (mode === "play") return "play";
    if (mode === "intro" || mode === "brief") {
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1300);
      continue;
    }
    const sign = page.locator("button").filter({ hasText: "Sign the unit" });
    if (await sign.count()) {
      await sign.first().click({ force: true, timeout: 8000 });
      await page.waitForTimeout(300);
      continue;
    }
    const body = await page.locator("body").innerText();
    if (/Plant type|pick the courier/i.test(body)) {
      const pickBtn = page.getByRole("button", { name: /PWR/ });
      if (await pickBtn.count()) await pickBtn.first().click();
    }
    const cont = page.getByTestId("builder-continue");
    if (await cont.count()) {
      await cont.first().click({ force: true, timeout: 8000 });
      await page.waitForTimeout(180);
      continue;
    }
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
  }
  return await page.evaluate(() => window.__controlsTest?.getMode?.() ?? "stuck").catch(() => "stuck");
}

const mode = await intoPlay();
await page.keyboard.down("ArrowRight");
await page.waitForTimeout(600);
await page.keyboard.up("ArrowRight");
const mute = page.getByTestId("mute");
if (await mute.count()) {
  await mute.click();
  await page.waitForTimeout(200);
  await mute.click();
}
await page.waitForTimeout(1500);
const text = [
  `mode ${mode}`,
  lines.length ? lines.join("\n") : "no warnings or errors",
].join("\n") + "\n";
writeFileSync(`${out}result.txt`, text);
console.log(text);
await browser.close();
if (lines.length || mode !== "play") {
  console.log("FAIL");
  process.exit(1);
}
console.log("PASS");
