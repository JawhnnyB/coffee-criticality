/**
 * Screenshots of each day-1 and night-1 teaching line at 1280×720 and 390×844.
 *   node scripts/step-45c-proof.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = fileURLToPath(new URL("../docs/audit/2026-11-22-value/step-45c/", import.meta.url));
mkdirSync(outDir, { recursive: true });

const DAY = [
  ["day-walk", "Walk. WASD or the arrows."],
  ["day-mabel", "E sits with Mabel."],
  ["day-gate", "Walk east to the gate."],
  ["day-holt", "E talks to Holt."],
  ["day-peer", "P looks closer at what is wrong."],
  ["day-incident", "R reports. H hides. P looks with you."],
];
const NIGHT = [
  ["night-tablet", "Space opens the tablet."],
  ["night-oddity", "That is an oddity. Leave it."],
  ["night-jordan", "Jordan named a camera. Check it."],
  ["night-flash", "A flash is an alarm. Open that camera."],
  ["night-report", "Report the kind that fits."],
];

const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});
const notes = [];
const errors = [];

async function shot(page, name, line) {
  const coach = page.getByTestId(name.startsWith("night") ? "nw-coach" : "day-coach");
  await coach.scrollIntoViewIfNeeded();
  const text = (await coach.innerText()).trim();
  if (text !== line) throw new Error(`${name}: saw ${JSON.stringify(text)} wanted ${JSON.stringify(line)}`);
  await page.screenshot({ path: join(outDir, `${name}.png`), animations: "disabled" });
  notes.push(`${name} ${page.viewportSize().width}x${page.viewportSize().height} ${text}`);
}

async function dayShots(page, tag) {
  page.on("pageerror", (e) => errors.push(`${tag} ${String(e).slice(0, 200)}`));
  await page.goto(`${base}?v=45c-day-${tag}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__controlsTest);
  await page.evaluate(() => window.__controlsTest.bootPlay());
  await page.waitForTimeout(250);
  await shot(page, `day-walk-${tag}`, DAY[0][1]);
  await page.evaluate(() => window.__controlsTest.setKeys(["KeyD"]));
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__controlsTest.setKeys([]));
  await page.evaluate(() => window.__controlsTest.setFlag("mabelTalked", false));
  await page.waitForTimeout(150);
  let seen = (await page.getByTestId("day-coach").innerText()).trim();
  if (seen === DAY[0][1]) {
    await page.evaluate(() => window.__controlsTest.setKeys(["KeyD"]));
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      window.__controlsTest.setKeys([]);
      window.__controlsTest.setFlag("mabelTalked", false);
    });
    await page.waitForTimeout(150);
  }
  await shot(page, `day-mabel-${tag}`, DAY[1][1]);
  await page.evaluate(() => window.__controlsTest.setFlag("mabelTalked", true));
  await page.waitForTimeout(120);
  await shot(page, `day-gate-${tag}`, DAY[2][1]);
  await page.evaluate(() => window.__controlsTest.setFlag("plantEntered", true));
  await page.waitForTimeout(120);
  await shot(page, `day-holt-${tag}`, DAY[3][1]);
  await page.evaluate(() => window.__controlsTest.setFlag("holtTalked", true));
  await page.waitForTimeout(120);
  await shot(page, `day-peer-${tag}`, DAY[4][1]);
  await page.evaluate(() => window.__controlsTest.openIncident());
  await page.waitForTimeout(200);
  await shot(page, `day-incident-${tag}`, DAY[5][1]);
}

async function untilLine(page, line, ms = 25000) {
  const start = Date.now();
  let last = "";
  while (Date.now() - start < ms) {
    const loc = page.getByTestId("nw-coach");
    if (await loc.count()) {
      last = (await loc.innerText()).trim();
      if (last === line) return;
    }
    await page.waitForTimeout(40);
  }
  const clock = await page.getByTestId("nw-clock").innerText().catch(() => "?");
  throw new Error(`missed ${JSON.stringify(line)} last ${JSON.stringify(last)} clock ${clock}`);
}

async function nightShots(page, tag) {
  page.on("pageerror", (e) => errors.push(`${tag} night ${String(e).slice(0, 200)}`));
  await page.goto(`${base}?v=45c-night-${tag}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__controlsTest);
  await page.evaluate(() => {
    window.__controlsTest.bootPlay();
    window.__controlsTest.setNightSeed(3);
    window.__controlsTest.setFlag("rot:nights", true);
    window.__controlsTest.setFlag("rot:reported", true);
  });
  await page.waitForTimeout(300);
  await page.getByTestId("start-night").scrollIntoViewIfNeeded();
  await page.getByTestId("start-night").click();
  await page.getByTestId("nw-coach").waitFor();
  await page.evaluate(() => window.__controlsTest.setNightSpeed(0));
  await shot(page, `night-tablet-${tag}`, NIGHT[0][1]);
  await page.keyboard.press(" ");
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__controlsTest.setNightSpeed(12));
  await page.getByTestId("nw-cam-intake").click();
  await untilLine(page, NIGHT[1][1]);
  await page.evaluate(() => window.__controlsTest.setNightSpeed(0));
  await shot(page, `night-oddity-${tag}`, NIGHT[1][1]);
  await page.getByTestId("nw-cam-turbine").click();
  await page.evaluate(() => window.__controlsTest.setNightSpeed(12));
  await untilLine(page, NIGHT[2][1]);
  await page.evaluate(() => window.__controlsTest.setNightSpeed(0));
  await shot(page, `night-jordan-${tag}`, NIGHT[2][1]);
  await page.getByTestId("nw-cam-yard").click();
  await page.evaluate(() => window.__controlsTest.setNightSpeed(16));
  await untilLine(page, NIGHT[3][1]);
  await page.evaluate(() => window.__controlsTest.setNightSpeed(0));
  await shot(page, `night-flash-${tag}`, NIGHT[3][1]);
  await page.locator('[data-testid^="nw-cam-"][data-alarm="1"]').first().click();
  await untilLine(page, NIGHT[4][1], 4000);
  await shot(page, `night-report-${tag}`, NIGHT[4][1]);
}

for (const view of [
  { w: 1280, h: 720, tag: "1280" },
  { w: 390, h: 844, tag: "390" },
]) {
  const page = await browser.newPage({ viewport: { width: view.w, height: view.h } });
  page.setDefaultTimeout(20000);
  await dayShots(page, view.tag);
  await page.close();
  const night = await browser.newPage({ viewport: { width: view.w, height: view.h } });
  night.setDefaultTimeout(20000);
  await nightShots(night, view.tag);
  await night.close();
}

await browser.close();
notes.push(`Page errors ${errors.length}.`);
for (const e of errors) notes.push(e);
writeFileSync(join(outDir, "result.txt"), notes.join("\n") + "\n");
console.log(notes.join("\n"));
if (errors.length) process.exit(2);
