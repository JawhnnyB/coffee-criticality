/**
 * Screenshot the current screens at 1100×720 and 1920×1080.
 * Usage: node scripts/shots.mjs [baseUrl]
 * Writes docs/preview/ui-qa/. Does not change art.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const base = process.argv[2] || "http://127.0.0.1:8080/";
const out = path.resolve("docs/preview/ui-qa");
fs.mkdirSync(out, { recursive: true });

const rooms = [
  ["cafe", 160, 200],
  ["parlor", 192, 210],
  ["corridor", 192, 190],
  ["control", 176, 190],
  ["engineering", 176, 190],
  ["breakroom", 144, 170],
  ["reactor", 176, 190],
  ["maintenance", 176, 190],
  ["gate", 420, 360],
];

const sizes = [
  [1100, 720],
  [1920, 1080],
];

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest?.begin, { timeout: 20000 });

async function shot(name) {
  await page.waitForTimeout(400);
  const file = path.join(out, `${name}.png`);
  await page.screenshot({ path: file });
  console.log(file);
}

for (const [w, h] of sizes) {
  await page.setViewportSize({ width: w, height: h });
  const tag = `${w}x${h}`;
  await page.evaluate(() => window.__controlsTest.begin());
  await shot(`menu-${tag}`);
  await page.evaluate(() => window.__controlsTest.setIntro(0));
  await shot(`intro-${tag}`);
  await page.evaluate(() => window.__controlsTest.setBuild());
  await shot(`builder-${tag}`);
  await page.evaluate(() => window.__controlsTest.bootPlay());
  await shot(`cafe-${tag}`);
  for (const [room, x, y] of rooms) {
    if (room === "cafe") continue;
    await page.evaluate(({ room, x, y }) => window.__controlsTest.warp(room, x, y), { room, x, y });
    await shot(`${room}-${tag}`);
  }
  await page.evaluate(() => window.__controlsTest.openCab("catch"));
  await shot(`cabinet-catch-${tag}`);
  await page.evaluate(() => window.__controlsTest.setAcademy(0));
  await shot(`academy-${tag}`);
}

await browser.close();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
