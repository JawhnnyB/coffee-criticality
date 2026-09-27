#!/usr/bin/env node
/**
 * Playwright week path: boot play → afternoon Control → catch → academy → canCloseShift.
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { checkedUrl } from "./browser-guard.mjs";

const url = checkedUrl(process.argv[2] || "http://127.0.0.1:8080/");
const timeoutMs = Number(process.env.BROWSER_SMOKE_TIMEOUT_MS || 60000);

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("dialog", (d) => d.accept());
  await page.goto(url, { waitUntil: "networkidle", timeout: timeoutMs });
  await page.waitForFunction(() => !!window.__controlsTest, { timeout: 15000 });

  mkdirSync("/workspace/screenshots", { recursive: true });

  await page.evaluate(() => window.__controlsTest.bootPlay());
  await page.waitForTimeout(400);
  await page.screenshot({ path: "/workspace/screenshots/waveG-cafe.png" });

  await page.evaluate(() => {
    const t = window.__controlsTest;
    t.setMinutes(12 * 60 + 10);
    t.warp("control", 152, 80);
    t.reportHere();
    t.setMinutes(16 * 60 + 30);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: "/workspace/screenshots/waveG-control.png" });

  const close = await page.evaluate(() => window.__controlsTest.canClose());
  if (!close) throw new Error("canCloseShift false after academy + catch + afternoon");

  await page.evaluate(() => window.__controlsTest.save());
  const has = await page.evaluate(() => window.__controlsTest.hasSave());
  if (!has) throw new Error("save did not persist");

  await page.evaluate(() => {
    localStorage.setItem("cc.save.v1", "{not json");
  });
  const afterCorrupt = await page.evaluate(() => window.__controlsTest.hasSave());
  if (afterCorrupt) throw new Error("corrupt save was not wiped");

  console.log(JSON.stringify({ ok: true, canClose: close, screens: ["waveG-cafe.png", "waveG-control.png"] }, null, 2));
  process.exit(0);
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: String(err?.message || err) }, null, 2));
  process.exit(1);
} finally {
  await browser.close();
}
