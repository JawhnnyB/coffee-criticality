#!/usr/bin/env node
/** Overflow, window bounds, text overlap, and phone touch targets. */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, VIEWPORTS, collectOverflow } from "./audit-lib.mjs";

const BASE = process.env.PLAY_URL || "http://127.0.0.1:8080/";
const OUT = "docs/audit/2026-11-14-evidence";
mkdirSync(OUT, { recursive: true });
const only = process.env.AUDIT_WIDTH ? Number(process.env.AUDIT_WIDTH) : 0;
const ports = only ? VIEWPORTS.filter(([w]) => w === only) : VIEWPORTS;
const browser = await chromium.launch();
const report = { url: BASE, viewports: [] };

for (const [w, h] of ports) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(600);
  const boot = page.locator("[data-testid=boot-log]");
  if (await boot.count()) {
    await boot.click();
    await page.waitForTimeout(300);
  }
  await page.waitForSelector("[data-testid=new-shift]", { timeout: 8000 }).catch(() => {});
  const begin = page.locator("[data-testid=new-shift]");
  if (await begin.count()) await begin.click();
  const wipe = page.locator("[data-testid=wipe-confirm-yes]");
  if (await wipe.count()) await wipe.click();
  await page.waitForSelector("[data-testid=setup-screen]", { timeout: 8000 }).catch(() => {});
  const go = page.locator("[data-testid=setup-continue]");
  if (await go.count()) {
    await go.click();
    await page.waitForSelector("[data-testid=desktop], [data-testid=phone-home]", { timeout: 8000 }).catch(() => {});
  }
  const phone = w < 720;
  if (phone) {
    const home = page.locator("[data-testid=home-news]");
    if (await home.count()) await home.click();
  } else {
    const start = page.locator("[data-testid=start-button]");
    if (await start.count()) {
      await start.click();
      const item = page.locator('[role=menuitem][aria-label="News"]');
      if (await item.count()) await item.click();
    }
  }
  await page.waitForTimeout(400);
  const sample = await collectOverflow(page);
  const windowFails = sample.wins.filter((x) => x.off || x.under);
  const shortButtons = phone ? sample.buttons.filter((b) => b.h < 44 && b.h > 0) : [];
  report.viewports.push({
    w,
    h,
    barTop: sample.barTop,
    clips: sample.clips,
    wins: sample.wins,
    overlaps: sample.overlaps,
    windowFails,
    shortButtons,
  });
  console.log(JSON.stringify({
    w,
    h,
    clips: sample.clips.length,
    overlaps: sample.overlaps.length,
    windowFails: windowFails.length,
    shortButtons: shortButtons.length,
  }));
  await page.close();
}

report.violationCount = report.viewports.reduce(
  (n, v) => n + v.clips.length + v.overlaps.length + v.windowFails.length + v.shortButtons.length,
  0,
);
writeFileSync(join(OUT, "overflow-audit.json"), JSON.stringify(report, null, 2));
writeFileSync("docs/audit/2026-11-14-overflow.md", md(report));
console.log(`Overflow audit: ${report.violationCount} violations across ${report.viewports.length} viewports.`);
await browser.close();
process.exit(report.violationCount ? 1 : 0);

function md(report) {
  const bits = report.viewports.map((v) => {
    const lines = [`### ${v.w}×${v.h}`, "", `Taskbar top: ${v.barTop}. Windows: ${v.wins.length}.`];
    if (v.windowFails.length) lines.push("", "Windows outside the desktop:", ...v.windowFails.map((w) => `- ${w.id} bottom ${w.b}`));
    if (v.clips.length) lines.push("", "Scroll or clip:", ...v.clips.slice(0, 20).map((c) => `- ${c.testid || c.tag} ${c.className} ${c.overflow} ${c.scrollW}×${c.scrollH} in ${c.clientW}×${c.clientH}`));
    if (v.overlaps.length) lines.push("", "Overlapping text:", ...v.overlaps.slice(0, 15).map((o) => `- "${o.a}" × "${o.b}"`));
    if (v.shortButtons.length) lines.push("", "Buttons under 44px:", ...v.shortButtons.slice(0, 20).map((b) => `- ${b.testid || b.text} h=${b.h}`));
    if (!v.windowFails.length && !v.clips.length && !v.overlaps.length && !v.shortButtons.length) lines.push("", "No violations.");
    return lines.join("\n");
  });
  return `# Overflow audit 2026-11-14

Overflow audit: ${report.violationCount} violations across ${report.viewports.length} viewports.

A violation is a window past the taskbar, an overflow hidden or auto box whose scroll size exceeds its client size, two text boxes that overlap, or a phone button shorter than 44px.

${bits.join("\n\n")}

JSON: \`docs/audit/2026-11-14-evidence/overflow-audit.json\`.
`;
}
