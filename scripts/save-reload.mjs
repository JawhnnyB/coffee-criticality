/**
 * One save, a real tab reload, and a Continue click, for each mode.
 *   node scripts/save-reload.mjs http://127.0.0.1:8092/
 *
 * Setup uses the labelled test hooks. The reload and the Continue click are real.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8092/";
const out = new URL("../docs/audit/2026-11-22-value/step-02/", import.meta.url);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});

function shot(page, name) {
  return page.screenshot({ path: new URL(name, out).pathname });
}

async function open() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(base);
  await page.waitForFunction(() => window.__controlsTest);
  const T = (f, ...a) => page.evaluate(([fn, args]) => window.__controlsTest[fn](...args), [f, a]);
  return { ctx, page, errors, T };
}

/** Reload the tab and press Continue. Not a hook. */
async function continueFromMenu(page) {
  await page.reload();
  await page.waitForFunction(() => window.__controlsTest);
  const boot = page.locator("[data-testid='boot-log']");
  if (await boot.count()) await boot.click({ timeout: 2000 }).catch(() => {});
  const btn = page.locator("[data-testid='continue-shift']");
  await btn.waitFor({ state: "visible" });
  if (await btn.isDisabled()) throw new Error("Continue is disabled");
  await btn.click();
  await page.waitForTimeout(500);
}

const log = [];
const note = (mode, row) => {
  log.push({ mode, ...row });
  console.log(mode, JSON.stringify(row));
};

try {
  {
    const { ctx, page, errors, T } = await open();
    await T("bootPlay");
    await T("warp", "control", 152, 80);
    await T("setMinutes", 13 * 60 + 17);
    if (!(await T("save"))) throw new Error("play: save refused");
    const before = await page.evaluate(() => ({
      room: window.__controlsTest.getRoom(),
      minutes: window.__controlsTest.getMinutes(),
      day: window.__controlsTest.getDay(),
    }));
    await shot(page, "play-before.png");
    await continueFromMenu(page);
    const after = await page.evaluate(() => ({
      room: window.__controlsTest.getRoom(),
      minutes: window.__controlsTest.getMinutes(),
      day: window.__controlsTest.getDay(),
      mode: window.__controlsTest.getMode(),
    }));
    await shot(page, "play-after.png");
    if (after.mode !== "play" || after.room !== before.room || after.day !== before.day || Math.abs(after.minutes - before.minutes) > 1) {
      throw new Error(`play: Continue did not restore ${JSON.stringify({ before, after })}`);
    }
    note("play", { ok: true, before, after, errors });
    await ctx.close();
  }

  {
    const { ctx, page, errors, T } = await open();
    await T("bootPlay");
    await T("setMinutes", 16 * 60 + 30);
    await T("openDesk");
    await page.locator("[data-testid='icon-settings']").click();
    await page.locator("[data-testid='clock-24']").click();
    await page.waitForTimeout(200);
    const beforeClock = (await page.locator("[data-testid='desk-clock']").innerText()).trim();
    const before = await page.evaluate(() => ({
      clock24: window.__controlsTest.getDesk().clock24,
      mode: window.__controlsTest.getMode(),
      minutes: window.__controlsTest.getMinutes(),
    }));
    if (!before.clock24) throw new Error("desktop: 24-hour clock did not stick before the reload");
    await shot(page, "desktop-before.png");
    await continueFromMenu(page);
    const after = await page.evaluate(() => ({
      clock24: window.__controlsTest.getDesk().clock24,
      mode: window.__controlsTest.getMode(),
      minutes: window.__controlsTest.getMinutes(),
    }));
    await page.locator("body").click({ position: { x: 40, y: 40 } }).catch(() => {});
    await page.keyboard.press("Escape");
    await page.locator("[data-testid='pause-desktop']").waitFor({ state: "visible", timeout: 4000 });
    await page.locator("[data-testid='pause-desktop']").click();
    await page.locator("[data-testid='desktop']").waitFor();
    const afterClock = (await page.locator("[data-testid='desk-clock']").innerText()).trim();
    await shot(page, "desktop-after.png");
    if (!after.clock24 || Math.abs(after.minutes - before.minutes) > 1 || !afterClock.startsWith(beforeClock.slice(0, 5))) {
      throw new Error(`desktop: setting did not survive ${JSON.stringify({ before, after, beforeClock, afterClock })}`);
    }
    note("desktop", {
      ok: true,
      before,
      after,
      beforeClock,
      afterClock,
      screen: "Continue returns to the world. The desktop is stored as play. Reopening it shows the same clock.",
      errors,
    });
    await ctx.close();
  }

  {
    const { ctx, page, errors, T } = await open();
    await T("bootPlay");
    await T("setFlag", "rot:nights", true);
    await T("setFlag", "rot:reported", true);
    await T("setFlag", "night:1:done", true);
    await T("setFlag", "night:1:grade:A", true);
    if (!(await T("save"))) throw new Error("rotation: save refused");
    await shot(page, "rotation-before.png");
    await continueFromMenu(page);
    const card = page.locator("[data-testid='night-opener']");
    await card.waitFor({ state: "visible" });
    const text = (await card.innerText()).replace(/\s+/g, " ");
    await shot(page, "rotation-after.png");
    if (!text.includes("Night 2")) throw new Error(`rotation: opener was not night 2: ${text}`);
    note("rotation", { ok: true, opener: text.slice(0, 180), errors });
    await ctx.close();
  }

  {
    const { ctx, page, errors, T } = await open();
    await T("bootPlay");
    await T("setDay", 4);
    await T("openDesk");
    await page.locator("[data-testid='start-button']").click();
    await page.getByRole("menuitem", { name: "Refuelling Outage" }).click();
    await page.locator("[data-testid='outage-grid']").waitFor();
    if (await page.locator("[data-testid='start-menu']").count()) await page.locator("[data-testid='start-button']").click();
    const cells = page.locator("[data-testid^='outage-cell-']");
    const n = await cells.count();
    const texts = [];
    for (let i = 0; i < n; i++) texts.push((await cells.nth(i).innerText()).trim());
    const fuel = texts.map((t, i) => (t ? i : -1)).filter((i) => i >= 0).slice(0, 8);
    let pair = null;
    let swapped = null;
    for (let p = 0; p < fuel.length && !pair; p++) {
      for (let q = p + 1; q < fuel.length; q++) {
        const i = fuel[p];
        const j = fuel[q];
        await cells.nth(i).click();
        await cells.nth(j).click();
        await page.waitForTimeout(50);
        if (!(await page.locator("[data-testid='outage-reset']").count())) continue;
        const now = [(await cells.nth(i).innerText()).trim(), (await cells.nth(j).innerText()).trim()];
        if (now[0] === texts[i] && now[1] === texts[j]) continue;
        pair = [i, j];
        swapped = now;
        break;
      }
    }
    if (!pair) {
      await shot(page, "outage-fail.png");
      throw new Error(`outage: no swap stuck among ${fuel.length} cells`);
    }
    const [a, b] = pair;
    await page.locator("[data-testid='start-button']").click();
    await page.getByRole("menuitem", { name: "Save shift" }).click();
    await page.waitForTimeout(200);
    const before = await page.evaluate(() => ({
      day: window.__controlsTest.getDay(),
      draft: JSON.parse(localStorage.getItem("cc.outage.v1") || "{}").draft != null,
    }));
    await shot(page, "outage-before.png");
    await continueFromMenu(page);
    const mid = await page.evaluate(() => ({
      day: window.__controlsTest.getDay(),
      mode: window.__controlsTest.getMode(),
      draft: JSON.parse(localStorage.getItem("cc.outage.v1") || "{}").draft != null,
    }));
    await page.locator("body").click({ position: { x: 40, y: 40 } }).catch(() => {});
    await page.keyboard.press("Escape");
    await page.locator("[data-testid='pause-desktop']").click();
    await page.locator("[data-testid='start-button']").click();
    await page.getByRole("menuitem", { name: "Refuelling Outage" }).click();
    await page.locator("[data-testid='outage-reset']").waitFor();
    const cells2 = page.locator("[data-testid^='outage-cell-']");
    const back = [(await cells2.nth(a).innerText()).trim(), (await cells2.nth(b).innerText()).trim()];
    await shot(page, "outage-after.png");
    if (mid.day !== 4 || mid.mode !== "play" || !mid.draft || back[0] !== swapped[0] || back[1] !== swapped[1]) {
      throw new Error(`outage: did not survive ${JSON.stringify({ before, mid, swapped, back })}`);
    }
    note("outage", { ok: true, day: mid.day, cells: { from: [texts[a], texts[b]], swapped, back }, errors });
    await ctx.close();
  }
} finally {
  await browser.close();
  writeFileSync(new URL("result.json", out), JSON.stringify(log, null, 2) + "\n");
}

if (log.length !== 4 || log.some((r) => !r.ok)) {
  console.error("FAIL", log.length);
  process.exit(1);
}
console.log("PASS 4");
