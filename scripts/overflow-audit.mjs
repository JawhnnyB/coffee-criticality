#!/usr/bin/env node
/** Overflow, window bounds, text overlap, and phone touch targets.
 * Every line names the screen, the viewport, and the counts.
 * A hidden box that clips is a violation. A scrolling box is named and is not a violation.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, VIEWPORTS, collectOverflow } from "./audit-lib.mjs";

const BASE = process.env.PLAY_URL || "http://127.0.0.1:8080/";
const OUT = "docs/audit/2026-11-14-evidence";
mkdirSync(OUT, { recursive: true });
const only = process.env.AUDIT_WIDTH ? Number(process.env.AUDIT_WIDTH) : 0;
const ports = only ? VIEWPORTS.filter(([w]) => w === only) : VIEWPORTS;

const OPEN_APPS = ["settings", "music", "news", "radiation", "nrc", "academy", "design"];
const AFTER_DESIGN = ["control", "results", "coremap", "cam"];
const NOT_WALKED = ["cafe", "load-cab", "catch", "hide", "dusk-lot", "maintenance"];

const browser = await chromium.launch();
const report = { url: BASE, viewports: [] };

function tally(sample, phone) {
  const clips = [];
  const scrolls = [];
  for (const c of sample.clips) {
    const parts = c.overflow.split(/\s+/).filter(Boolean);
    const ox = parts[parts.length - 2] || parts[0] || "";
    const oy = parts[parts.length - 1] || parts[0] || "";
    const sx = c.scrollW > c.clientW + 2;
    const sy = c.scrollH > c.clientH + 2;
    const clip = (sx && /hidden|clip/.test(ox)) || (sy && /hidden|clip/.test(oy));
    const scroll = (sx && /auto|scroll/.test(ox)) || (sy && /auto|scroll/.test(oy));
    if (clip) clips.push(c);
    else if (scroll) scrolls.push(c);
  }
  const windowFails = sample.wins.filter((x) => x.off || x.under);
  const shortButtons = phone ? sample.buttons.filter((b) => b.h < 44 && b.h > 0) : [];
  return { clips, scrolls, windowFails, shortButtons, overlaps: sample.overlaps, wins: sample.wins, barTop: sample.barTop };
}

for (const [w, h] of ports) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const phone = w < 720;
  const screens = [];
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(600);
  const boot = page.locator("[data-testid=boot-log]");
  if (await boot.count()) {
    await boot.click();
    await page.waitForTimeout(300);
  }
  await page.waitForSelector("[data-testid=new-shift]", { timeout: 8000 }).catch(() => {});

  async function measure(screen) {
    await page.waitForTimeout(250);
    const sample = await collectOverflow(page);
    const row = { screen, w, h, opened: true, ...tally(sample, phone) };
    screens.push(row);
    const violations = row.clips.length + row.overlaps.length + row.windowFails.length + row.shortButtons.length;
    console.log(JSON.stringify({
      screen,
      w,
      h,
      clips: row.clips.length,
      scrolls: row.scrolls.length,
      overlaps: row.overlaps.length,
      windowFails: row.windowFails.length,
      shortButtons: row.shortButtons.length,
      violations,
    }));
  }

  await measure("title");
  const begin = page.locator("[data-testid=new-shift]");
  if (await begin.count()) await begin.click();
  const wipe = page.locator("[data-testid=wipe-confirm-yes]");
  if (await wipe.count()) await wipe.click();
  await page.waitForSelector("[data-testid=setup-screen]", { timeout: 8000 }).catch(() => {});
  await measure("setup");
  const go = page.locator("[data-testid=setup-continue]");
  if (await go.count()) {
    await go.click();
    await page.waitForSelector("[data-testid=desktop], [data-testid=phone-home]", { timeout: 8000 }).catch(() => {});
  }
  await measure("desktop");

  async function openApp(id) {
    if (phone) {
      const back = page.locator("[data-testid=phone-back]");
      if (await back.count()) await back.click();
      const home = page.locator(`[data-testid=home-${id}]`);
      if (!(await home.count())) return false;
      await home.click();
      return true;
    }
    const icon = page.locator(`[data-testid=icon-${id}]`);
    if (await icon.count()) {
      await icon.click();
      return true;
    }
    const start = page.locator("[data-testid=start-button]");
    if (await start.count()) {
      await start.click();
      const item = page.locator(`[role=menuitem][aria-label]`).filter({ hasText: new RegExp(id, "i") });
      if (await item.count()) {
        await item.first().click();
        return true;
      }
      await page.keyboard.press("Escape");
    }
    return false;
  }

  async function closeApp(id) {
    if (phone) {
      const back = page.locator("[data-testid=phone-back]");
      if (await back.count()) await back.click();
      return;
    }
    const close = page.locator(`[data-testid=close-${id}]`);
    if (await close.count()) await close.click();
  }

  for (const id of OPEN_APPS) {
    const opened = await openApp(id);
    if (!opened) {
      screens.push({ screen: id, w, h, opened: false, reason: "icon was not on the desktop" });
      console.log(JSON.stringify({ screen: id, w, h, opened: false, reason: "icon was not on the desktop" }));
      continue;
    }
    await page.waitForTimeout(400);
    await measure(id);
    await closeApp(id);
    await page.waitForTimeout(200);
  }
  for (const id of AFTER_DESIGN) {
    const opened = await openApp(id);
    if (!opened) {
      screens.push({ screen: id, w, h, opened: false, reason: "not opened: the icon needs a signed design, and this audit does not sign one" });
      console.log(JSON.stringify({ screen: id, w, h, opened: false, reason: "needs a signed design" }));
      continue;
    }
    await page.waitForTimeout(400);
    await measure(id);
    await closeApp(id);
  }
  for (const id of NOT_WALKED) {
    screens.push({ screen: id, w, h, opened: false, reason: "not opened: this audit does not walk the world" });
    console.log(JSON.stringify({ screen: id, w, h, opened: false, reason: "not opened: this audit does not walk the world" }));
  }

  report.viewports.push({ w, h, screens });
  await page.close();
}

report.violationCount = report.viewports.reduce((n, v) => {
  return n + v.screens.reduce((m, s) => {
    if (!s.opened) return m;
    return m + s.clips.length + s.overlaps.length + s.windowFails.length + s.shortButtons.length;
  }, 0);
}, 0);
writeFileSync(join(OUT, "overflow-audit.json"), JSON.stringify(report, null, 2));
writeFileSync("docs/audit/2026-11-14-overflow.md", md(report));
console.log(`Overflow audit: ${report.violationCount} violations across ${report.viewports.length} viewports.`);
await browser.close();
process.exit(report.violationCount ? 1 : 0);

function md(report) {
  const bits = report.viewports.map((v) => {
    const lines = [`### ${v.w}×${v.h}`, ""];
    for (const s of v.screens) {
      if (!s.opened) {
        lines.push(`- ${s.screen}: not opened. ${s.reason}`);
        continue;
      }
      const violations = s.clips.length + s.overlaps.length + s.windowFails.length + s.shortButtons.length;
      lines.push(`- ${s.screen}: clips ${s.clips.length}, scrolls ${s.scrolls.length}, overlaps ${s.overlaps.length}, window ${s.windowFails.length}, short buttons ${s.shortButtons.length}, violations ${violations}`);
    }
    return lines.join("\n");
  });
  return `# Overflow audit 2026-11-14

Overflow audit: ${report.violationCount} violations across ${report.viewports.length} viewports.

A violation is a hidden box whose scroll size exceeds its client size, a window past the taskbar, two text boxes that overlap, or a phone button shorter than 44px. A box that scrolls on purpose is counted as a scroll, not a violation.

${bits.join("\n\n")}

JSON: \`docs/audit/2026-11-14-evidence/overflow-audit.json\`.
`;
}
