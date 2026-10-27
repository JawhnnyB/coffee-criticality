/**
 * Stage 2b intro shots at 1100×720 and 1920×1080.
 * Usage: node scripts/shots-intro.mjs [baseUrl]
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const base = process.argv[2] || "http://127.0.0.1:8080/";
const out = path.resolve("docs/preview/ui-qa");
fs.mkdirSync(out, { recursive: true });

const sizes = [
  [1100, 720],
  [1920, 1080],
];

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push("console: " + msg.text());
});
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest?.begin, { timeout: 20000 });

async function shot(name) {
  await page.waitForTimeout(80);
  const file = path.join(out, `${name}.png`);
  await page.screenshot({ path: file });
  console.log(file);
}

for (const [w, h] of sizes) {
  await page.setViewportSize({ width: w, height: h });
  const tag = `${w}x${h}`;
  await page.evaluate(() => {
    window.__controlsTest.setHold(null);
    window.__controlsTest.setOy(null);
    window.__controlsTest.setLook("copper", "brown", true);
    window.__controlsTest.setRole();
  });
  await page.waitForTimeout(250);
  await shot(`badge-${tag}`);

  await page.evaluate(() => {
    window.__controlsTest.setLook("gold", "silver", false);
    window.__controlsTest.setRole();
  });
  await page.waitForTimeout(300);
  await shot(`badge-look-${tag}`);

  await page.evaluate(() => window.__controlsTest.setLook("copper", "brown", true));

  const beats = [
    ["cafe", 1, 0],
    ["lot", 2, 0],
    ["wing", 3, 0],
    ["door", 7, 0],
  ];
  for (const [name, i] of beats) {
    await page.evaluate(
      ({ i }) => {
        const line = window.__ccLineLen || 24;
        window.__controlsTest.setHold(line);
        window.__controlsTest.setOy(null);
        window.__controlsTest.setIntro(i, 0);
      },
      { i },
    );
    await page.waitForTimeout(500);
    await shot(`intro-${name}-${tag}`);
  }

  await page.evaluate(() => {
    window.__controlsTest.setHold(24);
    window.__controlsTest.setOy(null);
    window.__controlsTest.setIntro(1, 0);
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__controlsTest.setOy(31));
  await page.waitForTimeout(80);
  await shot(`intro-cafe-pan-${tag}`);
  await page.evaluate(() => {
    window.__controlsTest.setOy(null);
    window.__controlsTest.setIntro(1, 1);
  });
  await page.waitForTimeout(700);
  await shot(`intro-cafe-pan-settled-${tag}`);

  await page.evaluate(() => {
    window.__controlsTest.setHold(40);
    window.__controlsTest.setOy(null);
    window.__controlsTest.setBrief();
  });
  await page.waitForTimeout(450);
  await shot(`brief-${tag}`);

  await page.evaluate(() => {
    window.__controlsTest.setHold(12);
    window.__controlsTest.setAcademy(0);
  });
  await page.waitForTimeout(300);
  await shot(`typed-academy-${tag}`);
}

await page.evaluate(() => window.__controlsTest.setHold(null));
await browser.close();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
