#!/usr/bin/env node
/** Unscrolled Reactor Design at 1280x720. Does not scroll the panel. */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.PLAY_URL || "http://127.0.0.1:8080/";
const outDir = "docs/audit/2026-11-16-visual";
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(600);
const boot = page.locator("[data-testid=boot-log]");
if (await boot.count()) await boot.click();
await page.waitForSelector("[data-testid=new-shift]", { timeout: 8000 });
await page.locator("[data-testid=new-shift]").click();
const wipe = page.locator("[data-testid=wipe-confirm-yes]");
if (await wipe.count()) await wipe.click();
await page.waitForSelector("[data-testid=setup-screen]", { timeout: 8000 });
await page.locator("[data-testid=setup-continue]").click();
await page.waitForSelector("[data-testid=desktop]", { timeout: 8000 });
await page.locator("[data-testid=icon-design]").click();
await page.waitForSelector("[data-testid=design-builder], [data-testid=why-drawing]", { timeout: 8000 });
await page.waitForTimeout(400);
const metrics = await page.evaluate(() => {
  const nodes = [...document.querySelectorAll("[data-testid=design-builder], [data-testid=why-drawing]")];
  for (const el of document.querySelectorAll("*")) {
    if (el.scrollTop) el.scrollTop = 0;
    if (el.scrollLeft) el.scrollLeft = 0;
  }
  const why = document.querySelector("[data-testid=why-drawing]");
  const box = why ? why.getBoundingClientRect() : null;
  return {
    hasBuilder: !!document.querySelector("[data-testid=design-builder]"),
    whyTop: box ? Math.round(box.top) : null,
    whyInView: box ? box.top >= 0 && box.bottom <= window.innerHeight : false,
    scrollers: nodes.map((n) => ({ id: n.getAttribute("data-testid"), scrollTop: n.scrollTop })),
  };
});
const shot = `${outDir}/builder-first-1280x720.png`;
await page.screenshot({ path: shot });
console.log(JSON.stringify({ shot, pageErrors: errors.length, ...metrics }));
await browser.close();
process.exit(errors.length ? 1 : 0);
