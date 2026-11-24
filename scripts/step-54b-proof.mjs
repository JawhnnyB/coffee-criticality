/**
 * Day shift with the corner monitor, and the outage window beside its notes.
 *   PW_CHROME=... node scripts/step-54b-proof.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = fileURLToPath(new URL("../docs/audit/2026-11-22-value/step-54b/", import.meta.url));
mkdirSync(outDir, { recursive: true });

function hit(a, b) {
  return a.right > b.left + 1 && a.left < b.right - 1 && a.bottom > b.top + 1 && a.top < b.bottom - 1;
}

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
    await page.waitForFunction(() => window.__controlsTest?.bootPlay, { timeout: 25000 });
    await page.evaluate(() => window.__controlsTest.bootPlay());
    const mon = page.getByTestId("corner-monitor");
    await mon.waitFor({ timeout: 10000 });
    const monText = (await mon.innerText()).replace(/\s+/g, " ").trim();
    if (!/MONITOR/.test(monText) || !/DAY/.test(monText)) throw new Error(`${tag} monitor: ${monText}`);
    const boxes = await page.evaluate(() => {
      const box = (id) => {
        const el = document.querySelector(`[data-testid='${id}']`);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, r: r.right, b: r.bottom, w: r.width, h: r.height };
      };
      return { mon: box("corner-monitor"), hud: box("instrument"), scroll: document.documentElement.scrollWidth, vw: window.innerWidth };
    });
    if (!boxes.mon || boxes.mon.x < -1 || boxes.mon.y < -1 || boxes.mon.r > boxes.vw + 1) throw new Error(`${tag} monitor off screen ${JSON.stringify(boxes.mon)}`);
    if (boxes.hud && hit(boxes.mon, boxes.hud)) throw new Error(`${tag} monitor overlaps the instrument`);
    await page.screenshot({ path: join(outDir, `day-${tag}.png`) });
    notes.push(`day ${tag}: ${monText}`);

    await page.evaluate(() => {
      localStorage.setItem(
        "cc.outage.v1",
        JSON.stringify({ custom: null, useCustom: false, history: [], draft: null, draftCycle: 2, tutorialSeen: true, discharged: null }),
      );
      const t = window.__controlsTest;
      t.setDay(4);
      t.setFlag("outageOpen", true);
      t.openDesk();
    });
    if (w < 720) await page.getByTestId("home-outage").click();
    else {
      await page.getByTestId("start-button").click();
      await page.getByRole("menuitem", { name: "Refuelling Outage" }).click();
    }
    await page.getByTestId("outage-discharge").waitFor({ timeout: 10000 });
    const lay = await page.evaluate(() => {
      const box = (id) => {
        const el = document.querySelector(`[data-testid='${id}']`);
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, r: r.right, b: r.bottom, w: r.width, h: r.height };
      };
      const grid = document.querySelector("[data-testid='outage-discharge-grid']");
      const bg = getComputedStyle(grid).backgroundColor;
      const rule = box("outage-rule");
      const g = box("outage-discharge-grid");
      const win = document.querySelector("[data-testid='window-outage']") || document.querySelector("[data-testid='fullscreen-app']");
      const wr = win.getBoundingClientRect();
      return {
        bg,
        grid: g,
        rule,
        scroll: document.documentElement.scrollWidth,
        vw: window.innerWidth,
        win: { x: wr.x, r: wr.right, y: wr.y, b: wr.bottom },
      };
    });
    if (lay.bg.includes("22, 17, 13") || lay.bg.includes("26, 20, 16")) throw new Error(`${tag} grid still on the ink plate ${lay.bg}`);
    if (hit(lay.grid, lay.rule)) throw new Error(`${tag} notes overlap the map`);
    const beside = lay.rule.x >= lay.grid.r - 2;
    const below = lay.rule.y >= lay.grid.b - 2;
    if (w >= 720 && !beside) throw new Error(`${tag} notes are not beside the map ${JSON.stringify(lay)}`);
    if (w < 720 && !below) throw new Error(`${tag} notes are not under the map ${JSON.stringify(lay)}`);
    if (lay.scroll > lay.vw + 1) throw new Error(`${tag} page scrolls sideways ${lay.scroll}`);
    if (lay.grid.r > lay.win.r + 1 || lay.rule.r > lay.win.r + 1) throw new Error(`${tag} outage past the window`);
    await page.screenshot({ path: join(outDir, `outage-${tag}.png`) });
    notes.push(`outage ${tag}: plate ${lay.bg} map ${Math.round(lay.grid.w)}×${Math.round(lay.grid.h)} notes ${beside ? "beside" : "under"}`);
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
