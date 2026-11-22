/**
 * Full night rotation on the built game. Labelled setup reaches the ending.
 * After that: real clicks. 8× is the test clock, labelled when it is set.
 *   node scripts/nw-rotation.mjs http://127.0.0.1:8091/
 */
import { mkdirSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8091/";
const out = new URL("../docs/audit/2026-11-21-rotation/r11/", import.meta.url);
mkdirSync(out, { recursive: true });

const pick = (ids) => {
  if (ids.includes("grid") || ids.includes("cold")) return "electrical";
  if (ids.some((i) => /^g/.test(i))) return "radiation";
  if (ids.some((i) => ["sump", "press", "pzrl", "pool", "dwp", "pool2", "moist", "cover"].includes(i))) return "leak";
  return "equipment";
};
const mins = (text) => {
  const m = String(text).match(/(\d+):(\d+)/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : -1;
};

const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});

async function shot(page, name) {
  await page.screenshot({ path: new URL(name, out).pathname, fullPage: false });
}

async function sweepNight(page) {
  await page.waitForFunction(() => typeof window.__controlsTest.setNightSpeed === "function");
  // Labelled setup: the fast clock, this shift only.
  await page.evaluate(() => window.__controlsTest.setNightSpeed(8));
  const z = (ms) => page.waitForTimeout(ms);
  const cams = await page.locator("[data-testid^='nw-cam-']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(7)));
  const thumb = () =>
    page.evaluate(() => {
      const c = document.querySelector("[data-testid='nw-canvas']");
      if (!c) return null;
      const t = document.createElement("canvas");
      t.width = 32;
      t.height = 18;
      const g = t.getContext("2d");
      g.drawImage(c, 0, 0, 32, 18);
      return Array.from(g.getImageData(0, 0, 32, 18).data.filter((_, i) => i % 4 !== 3));
    });
  const diff = (a, b) => {
    if (!a || !b) return 0;
    let n = 0;
    for (let i = 0; i < a.length; i += 3) {
      const d = (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2])) / 3;
      if (d > 22) n++;
    }
    return n;
  };
  const report = async (id, cat) => {
    try {
      await page.locator(`[data-testid='nw-cam-${id}']`).click({ timeout: 4000 });
      await z(120);
      const btn = page.locator("[data-testid='nw-report']");
      if (!(await btn.isEnabled().catch(() => false))) {
        await page.keyboard.press(" ");
        await z(100);
      }
      if (!(await btn.isEnabled().catch(() => false))) return "fail";
      await btn.click({ timeout: 4000 });
      await z(80);
      const catBtn = page.locator(`[data-testid='nw-cat-${cat}']`);
      if (!(await catBtn.isEnabled().catch(() => false))) return "fail";
      await catBtn.click({ timeout: 4000 });
      await z(80);
      const toast = await page.locator("[data-testid='nw-toast']").innerText().catch(() => "");
      if (/false report/i.test(toast)) return "false";
      if (/logged/i.test(toast)) return "logged";
      return "false";
    } catch {
      return "fail";
    }
  };
  const baseLine = {};
  const logged = {};
  let ci = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < 180000) {
    try {
      if (await page.locator("[data-testid='nw-summary']").count()) break;
      const coffee = await page.locator("[data-testid='nw-coffee']").innerText();
      const bar = await page.locator("[data-testid='nw-coffee'] span span").first().evaluate((e) => parseFloat(e.style.width)).catch(() => 80);
      if (bar < 16 && !coffee.includes("brewing") && !coffee.includes("0 pot")) {
        await page.keyboard.press("b");
        await z(80);
        continue;
      }
      if ((await page.locator("[data-testid='nw-coffee']").innerText()).includes("brewing")) {
        await z(150);
        continue;
      }
      const minute = mins(await page.locator("[data-testid='nw-clock']").innerText());
      const flashing = await page.locator("[data-testid^='nw-cam-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(7)));
      if (flashing.length) {
        const id = flashing[0];
        if (logged[id] == null || minute - logged[id] > 40) {
          const red = await page.locator("[data-testid^='nw-tile-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(8)));
          if ((await report(id, pick(red))) === "logged") {
            logged[id] = minute;
            baseLine[id] = null;
          }
        }
      }
      const id = cams[ci++ % cams.length];
      const camBtn = page.locator(`[data-testid='nw-cam-${id}']`);
      if (!(await camBtn.isEnabled().catch(() => false))) {
        await z(40);
        continue;
      }
      if (logged[id] != null && minute - logged[id] <= 40) {
        await camBtn.click({ timeout: 4000 }).catch(() => {});
        await z(480);
        baseLine[id] = await thumb();
        continue;
      }
      await camBtn.click({ timeout: 4000 });
      await z(480);
      const now = await thumb();
      if (baseLine[id] && diff(baseLine[id], now) >= 8) {
        const red = await page.locator("[data-testid^='nw-tile-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(8)));
        const cat = red.length ? pick(red) : id === "aux" ? "access" : id === "pool" ? "foreign" : "equipment";
        if ((await report(id, cat)) === "logged") logged[id] = minute;
      }
      baseLine[id] = await thumb();
    } catch {
      if (await page.locator("[data-testid='nw-summary']").count().catch(() => 0)) break;
      await z(80);
    }
  }
  const grade = await page.locator("[data-testid='nw-grade']").evaluate((e) => e.textContent || "").catch(() => "none");
  const stat = await page.locator("[data-testid='nw-summary'] p").evaluateAll((els) => els.map((e) => e.textContent || "")).catch(() => []);
  return { grade, stat: (stat.find((t) => t.includes("false reports")) || "").trim() };
}

async function bootMenu(page) {
  await page.goto(base);
  await page.waitForFunction(() => window.__controlsTest);
  const boot = page.locator("[data-testid='boot-log']");
  if (await boot.count()) {
    await boot.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(300);
  }
}

async function rotation(width, height, tag) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.setDefaultTimeout(8000);
  const z = (ms) => page.waitForTimeout(ms);
  const T = (f, ...a) => page.evaluate(([fn, args]) => window.__controlsTest[fn](...args), [f, a]);
  await bootMenu(page);
  // Labelled setup through the week's ending.
  await T("bootPlay");
  await z(300);
  await T("beginEnding");
  await z(400);
  await page.keyboard.down("ArrowRight");
  await z(1600);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.down("ArrowUp");
  await z(1600);
  await page.keyboard.up("ArrowUp");
  await page.locator("[data-testid='close-shift']").click();
  await z(600);
  await shot(page, `${tag}-ending.png`);
  await page.locator("[data-testid='rotate-nights']").click();
  await z(400);
  await shot(page, `${tag}-days-off.png`);
  await page.locator("[data-testid='report-nights']").click();
  await z(300);
  const grades = [];
  for (let night = 1; night <= 4; night++) {
    if (night === 3 && tag === "desk") {
      await shot(page, `${tag}-night3-opener-before-reload.png`);
      await page.reload();
      await page.waitForFunction(() => window.__controlsTest);
      const boot = page.locator("[data-testid='boot-log']");
      if (await boot.count()) await boot.click({ timeout: 3000 }).catch(() => {});
      await z(400);
      await page.locator("[data-testid='continue-shift']").click();
      await z(800);
      await shot(page, `${tag}-night3-opener-after-reload.png`);
    }
    await shot(page, `${tag}-night${night}-opener.png`);
    // Labelled: seed 1, the one the bot table already graded.
    await T("setNightSeed", 1);
    await page.locator("[data-testid='start-night']").click();
    await z(300);
    const result = await sweepNight(page);
    grades.push({ night, ...result });
    console.log(tag, JSON.stringify({ night, ...result, errors: errors.length }));
    await shot(page, `${tag}-night${night}-turnover.png`);
    await page.locator("[data-testid='nw-summary-leave']").click();
    await z(400);
  }
  await shot(page, `${tag}-dawn.png`);
  if (!(await page.locator("[data-testid='dawn-lot']").count()) && tag === "desk") {
    // The night was not done. Stand it again. This is the card the game gives you.
    await shot(page, `${tag}-night4-again.png`);
    await T("setNightSeed", 1);
    await page.locator("[data-testid='start-night']").click();
    const result = await sweepNight(page);
    grades.push({ night: "4-again", ...result });
    console.log(tag, JSON.stringify({ night: "4-again", ...result, errors: errors.length }));
    await shot(page, `${tag}-night4-again-turnover.png`);
    await page.locator("[data-testid='nw-summary-leave']").click();
    await z(400);
    await shot(page, `${tag}-dawn.png`);
  }
  const dawn = await page.locator("[data-testid='dawn-lot']").innerText().catch(() => "");
  console.log(tag, "DAWN", dawn.replace(/\s+/g, " ").slice(0, 180), "errors", errors.length);
  await page.close();
  return grades;
}

// Phone shots of nights 1 and 4 only. The week itself is the desk run.
async function phoneNights() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(8000);
  const z = (ms) => page.waitForTimeout(ms);
  const T = (f, ...a) => page.evaluate(([fn, args]) => window.__controlsTest[fn](...args), [f, a]);
  for (const night of [1, 4]) {
    await bootMenu(page);
    await T("bootPlay");
    await z(200);
    await T("setFlag", "rot:nights", true);
    await T("setFlag", "rot:reported", true);
    for (let i = 1; i < night; i++) await T("setFlag", `night:${i}:done`, true);
    await T("warp", "gate", 200, 200);
    await z(300);
    await shot(page, `phone-night${night}-opener.png`);
    await T("setNightSeed", 1);
    await page.locator("[data-testid='start-night']").click();
    const result = await sweepNight(page);
    console.log("phone", JSON.stringify({ night, ...result }));
    await shot(page, `phone-night${night}-turnover.png`);
  }
  await page.close();
}

await rotation(1280, 720, "desk");
if (!process.env.SKIP_PHONE) await phoneNights();
await browser.close();
