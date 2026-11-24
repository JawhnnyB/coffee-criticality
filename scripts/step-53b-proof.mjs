/**
 * Dawn paper, discharge, a puzzle mid-solve and solved, photo on and off
 * on three cameras, and the turnover replay. 1280×720 and 390×844.
 *   node scripts/step-53b-proof.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = fileURLToPath(new URL("../docs/audit/2026-11-22-value/step-53b/", import.meta.url));
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});
const notes = [];
const errors = [];

async function ready(page) {
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__controlsTest, { timeout: 20000 });
}

async function shot(page, name) {
  await page.screenshot({ path: join(outDir, `${name}.png`), animations: "disabled" });
  notes.push(`${name} ${page.viewportSize().width}x${page.viewportSize().height}`);
}

async function dawn(page, tag) {
  await ready(page);
  await page.evaluate(() => {
    const t = window.__controlsTest;
    t.bootPlay();
    t.setFlag("night:1:done", true);
    t.setFlag("night:1:grade:A", true);
    t.setFlag("night:2:done", true);
    t.setFlag("night:2:grade:B", true);
    t.setFlag("night:3:done", true);
    t.setFlag("night:3:grade:A", true);
    t.setFlag("night:4:done", true);
    t.setFlag("night:4:grade:C", true);
    t.setFlag("rot:reported", true);
    t.setFlag("rot:dawn", true);
    t.setFlag("rot:complete", true);
    t.setFlag("rot:nights", true);
  });
  const paper = page.getByTestId("dawn-paper");
  await paper.waitFor({ state: "visible", timeout: 15000 });
  await paper.scrollIntoViewIfNeeded();
  const text = (await paper.innerText()).replace(/\s+/g, " ").trim();
  if (!text.includes("plant paper") && !text.toLowerCase().includes("paper")) {
    throw new Error(`dawn paper empty: ${text.slice(0, 160)}`);
  }
  await shot(page, `dawn-paper-${tag}`);
  notes.push(`dawn-paper text ${tag}: ${text.slice(0, 180)}`);
}

async function discharge(page, tag) {
  await ready(page);
  await page.evaluate(() => {
    localStorage.setItem(
      "cc.outage.v1",
      JSON.stringify({
        custom: null,
        useCustom: false,
        history: [],
        draft: null,
        draftCycle: 2,
        tutorialSeen: true,
        discharged: null,
      }),
    );
    const t = window.__controlsTest;
    t.bootPlay();
    t.setDay(4);
    t.setFlag("outageOpen", true);
    t.openDesk();
  });
  const phone = page.viewportSize().width < 720;
  if (phone) {
    const opener = page.getByTestId("home-outage");
    await opener.waitFor({ state: "visible", timeout: 10000 });
    await opener.click();
  } else {
    await page.getByTestId("start-button").click();
    const opener = page.getByRole("menuitem", { name: "Refuelling Outage" });
    await opener.waitFor({ state: "visible", timeout: 10000 });
    await opener.click();
  }
  const board = page.getByTestId("outage-discharge");
  await board.waitFor({ state: "visible", timeout: 10000 });
  const rule = (await page.getByTestId("outage-rule").innerText()).trim();
  if (!rule.includes("least reactive")) throw new Error(`rule: ${rule}`);
  await board.scrollIntoViewIfNeeded();
  await shot(page, `discharge-${tag}`);
  notes.push(`discharge ${tag}: ${rule}`);
}

async function puzzles(page, tag) {
  await ready(page);
  await page.evaluate(() => {
    window.__controlsTest.bootPlay();
    window.__controlsTest.deskLaunch("shuffle");
  });
  await page.getByTestId("shuffle-challenges").click();
  await page.getByTestId("puzzle-1").click();
  await page.getByTestId("puzzle-board").waitFor({ state: "visible", timeout: 8000 });
  await page.getByTestId("puzzle-cell-0").click();
  await page.getByTestId("puzzle-cell-3").click();
  await page.getByTestId("puzzle-board").scrollIntoViewIfNeeded();
  const mid = (await page.getByTestId("puzzle-moves").innerText()).trim();
  if (!mid.includes("Moves 1")) throw new Error(`mid moves: ${mid}`);
  await shot(page, `puzzle-mid-${tag}`);
  await page.getByTestId("puzzle-cell-0").click();
  await page.getByTestId("puzzle-cell-2").click();
  await page.getByTestId("puzzle-cell-0").click();
  await page.getByTestId("puzzle-cell-1").click();
  await page.getByTestId("puzzle-grade").click();
  await page.getByTestId("puzzle-solved").waitFor({ state: "visible", timeout: 8000 });
  await page.getByTestId("puzzle-solved").scrollIntoViewIfNeeded();
  await shot(page, `puzzle-solved-${tag}`);
  notes.push(`puzzle ${tag}: ${mid}`);
}

async function cameras(page, tag) {
  await ready(page);
  await page.evaluate(() => {
    const t = window.__controlsTest;
    t.bootPlay();
    t.setFlag("rot:reported", true);
    t.setFlag("rot:nights", true);
  });
  const start = page.getByTestId("start-night");
  await start.waitFor({ state: "visible", timeout: 15000 });
  await start.click();
  await page.getByTestId("nw-tablet").waitFor({ state: "visible", timeout: 10000 });
  await page.waitForFunction(() => typeof window.__controlsTest.setNightSpeed === "function");
  await page.getByTestId("nw-tablet").click();
  const cams = page.locator("[data-testid^='nw-cam-']");
  const n = await cams.count();
  if (n < 3) throw new Error(`cameras ${n}`);
  await page.evaluate(() => window.__controlsTest.setNightSpeed(8));
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.__controlsTest.setNightSpeed(1));
  for (let i = 0; i < 3; i++) {
    await cams.nth(i).scrollIntoViewIfNeeded();
    await cams.nth(i).click();
    const photo = page.getByTestId("nw-photo");
    await photo.waitFor({ state: "visible" });
    if ((await photo.innerText()).includes("Photo on")) await photo.click();
    await page.waitForTimeout(200);
    await shot(page, `photo-off-cam${i + 1}-${tag}`);
    await photo.click();
    await page.waitForFunction(() => document.querySelector("[data-testid='nw-photo']")?.textContent?.includes("Photo on"));
    await page.waitForTimeout(200);
    await shot(page, `photo-on-cam${i + 1}-${tag}`);
    await photo.click();
  }
  await page.getByTestId("nw-leave").click();
  await page.getByTestId("nw-leave-yes").click();
  const replay = page.getByTestId("nw-replay");
  await replay.waitFor({ state: "visible", timeout: 8000 });
  await replay.scrollIntoViewIfNeeded();
  await replay.click();
  const frame = page.getByTestId("nw-replay-cam");
  await frame.waitFor({ state: "visible", timeout: 4000 });
  await shot(page, `replay-${tag}`);
  const cam = (await frame.innerText()).split("\n")[0].trim();
  notes.push(`replay ${tag}: ${cam}`);
}

const views = [
  [1280, 720, "1280"],
  [390, 844, "390"],
];

try {
  for (const [w, h, tag] of views) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on("pageerror", (e) => errors.push(`${tag} ${String(e).slice(0, 240)}`));
    try {
      await dawn(page, tag);
      await discharge(page, tag);
      await puzzles(page, tag);
      await cameras(page, tag);
    } catch (err) {
      const fail = join(outDir, `fail-${tag}.png`);
      await page.screenshot({ path: fail, animations: "disabled" }).catch(() => {});
      const body = await page.evaluate(() => document.body?.innerText?.slice(0, 500) ?? "").catch(() => "");
      errors.push(`${tag} ${String(err).slice(0, 400)} BODY ${body.replace(/\s+/g, " ").slice(0, 300)}`);
      break;
    }
    await page.close();
  }
} finally {
  await browser.close();
}

const report = [`errors ${errors.length}`, ...notes, ...errors.map((e) => `ERR ${e}`)].join("\n") + "\n";
writeFileSync(join(outDir, "result.txt"), report);
console.log(report);
if (errors.length) process.exit(1);
