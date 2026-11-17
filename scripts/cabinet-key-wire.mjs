#!/usr/bin/env node
/**
 * Real KeyboardEvents on the running page.
 * Setup uses window.__controlsTest. This is a wiring check, not a playthrough.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.PLAY_URL || "http://127.0.0.1:8080/";
const outDir = "docs/audit/2026-11-16-evidence";
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 720 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForFunction(() => window.__controlsTest, { timeout: 8000 });
await page.evaluate(() => window.__controlsTest.bootPlay());
await page.waitForTimeout(300);
const before = await page.evaluate(() => ({ x: window.__controlsTest.getX(), y: window.__controlsTest.getY(), mode: window.__controlsTest.getMode() }));
await page.evaluate(() => window.__controlsTest.openCab("delay"));
await page.waitForTimeout(300);
const opened = await page.evaluate(() => window.__controlsTest.getMode());
await page.keyboard.down("KeyD");
await page.waitForTimeout(500);
const during = await page.evaluate(() => ({ x: window.__controlsTest.getX(), y: window.__controlsTest.getY(), mode: window.__controlsTest.getMode() }));
await page.keyboard.up("KeyD");
const report = { before, opened, during, pageErrors: errors.length, dx: during.x - before.x, dy: during.y - before.y };
writeFileSync(`${outDir}/r6-browser-wire.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
await browser.close();
process.exit(errors.length || during.mode !== "delay" || during.x !== before.x || during.y !== before.y ? 1 : 0);
