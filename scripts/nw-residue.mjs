/**
 * Day residue on a night, in the browser. Labelled setup, then the sweeper's clicks.
 *   node scripts/nw-residue.mjs http://127.0.0.1:8092/
 */
import { mkdirSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8092/";
const out = new URL("../docs/audit/2026-11-21-rotation/r12/", import.meta.url);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});

async function openNight(page, night, setup) {
  await page.goto(base);
  await page.waitForFunction(() => window.__controlsTest);
  const T = (f, ...a) => page.evaluate(([fn, args]) => window.__controlsTest[fn](...args), [f, a]);
  await T("bootPlay");
  await page.waitForTimeout(200);
  await setup(T);
  await T("setFlag", "rot:nights", true);
  await T("setFlag", "rot:reported", true);
  for (let i = 1; i < night; i++) await T("setFlag", `night:${i}:done`, true);
  await T("setNightSeed", 1);
  await T("warp", "gate", 200, 200);
  await page.waitForTimeout(300);
  await page.locator("[data-testid='start-night']").click();
  await page.waitForFunction(() => typeof window.__controlsTest.setNightSpeed === "function");
  await page.evaluate(() => window.__controlsTest.setNightSpeed(8));
}

const pick = (ids) => {
  if (ids.includes("grid") || ids.includes("cold")) return "electrical";
  if (ids.some((i) => /^g/.test(i))) return "radiation";
  if (ids.some((i) => ["sump", "press", "pzrl", "pool", "dwp", "pool2", "moist", "cover"].includes(i))) return "leak";
  return "equipment";
};

async function run(name, night, cam, setup) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.setDefaultTimeout(8000);
  await openNight(page, night, setup);
  const z = (ms) => page.waitForTimeout(ms);
  const t0 = Date.now();
  let shotCam = false;
  const logged = new Set();
  const stopAt = night === 1 ? 95 : 145;
  const seeAt = night === 1 ? 100 : 150;
  while (Date.now() - t0 < 120000) {
    if (await page.locator("[data-testid='nw-summary']").count()) break;
    const clock = await page.locator("[data-testid='nw-clock']").innerText().catch(() => "");
    const [h, m] = clock.split(":").map(Number);
    const minute = (h || 0) * 60 + (m || 0);
    if (!shotCam && minute >= seeAt) {
      await page.locator(`[data-testid='nw-cam-${cam}']`).click({ timeout: 4000 }).catch(() => {});
      await z(600);
      await page.screenshot({ path: new URL(`${name}-camera.png`, out).pathname });
      shotCam = true;
      console.log(name, "camera", clock);
    }
    const flashing = await page.locator("[data-testid^='nw-cam-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(7))).catch(() => []);
    const id = flashing.find((c) => !logged.has(c));
    if (id && minute < stopAt) {
      const tablet = await page.locator("[data-testid='nw-tablet']").innerText().catch(() => "");
      if (/lift tablet/i.test(tablet)) {
        await page.locator("[data-testid='nw-tablet']").click({ timeout: 3000 }).catch(() => {});
        await z(120);
      }
      await page.locator(`[data-testid='nw-cam-${id}']`).click({ timeout: 3000 }).catch(() => {});
      await z(80);
      const btn = page.locator("[data-testid='nw-report']");
      if (!(await btn.isEnabled().catch(() => false))) {
        await page.keyboard.press(" ");
        await z(100);
      }
      if (await btn.isEnabled().catch(() => false)) {
        await btn.click({ timeout: 3000 }).catch(() => {});
        await z(80);
        const red = await page.locator("[data-testid^='nw-tile-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(8))).catch(() => []);
        const cat = pick(red);
        await page.locator(`[data-testid='nw-cat-${cat}']`).click({ timeout: 3000 }).catch(() => {});
        await z(150);
        const toast = await page.locator("[data-testid='nw-toast']").innerText().catch(() => "");
        console.log(name, "file", clock, id, cat, red.join(","), toast.replace(/\s+/g, " ").slice(0, 120));
        if (/logged/i.test(toast) && !/false report/i.test(toast)) logged.add(id);
      }
    }
    await z(250);
  }
  const text = await page.locator("[data-testid='nw-summary']").innerText().catch(() => "no summary");
  await page.screenshot({ path: new URL(`${name}-turnover.png`, out).pathname });
  console.log(name, shotCam ? "shot" : "NO-SHOT", text.replace(/\s+/g, " ").slice(0, 700));
  await page.close();
}

await run("valve", 1, "aux", async (T) => {
  await T("setResidue", "valve", "hid");
});
await run("pump", 2, "turbine", async (T) => {
  await T("setMaintDone", false);
});
await browser.close();
