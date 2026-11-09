// Visual window rules. Needs the dev server (WINDOW_STYLE_URL, default http://127.0.0.1:8094/).
import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { checkedUrl } from "./browser-guard.mjs";

const req = createRequire(import.meta.url);
let playwright;
try {
  playwright = req("playwright");
} catch {
  playwright = createRequire("/home/claude/.npm-global/lib/node_modules/")("playwright");
}
const { chromium } = playwright;

const BASE = checkedUrl(process.env.WINDOW_STYLE_URL || "http://127.0.0.1:8094/");

function overlap(a, b) {
  if (!a || !b) return false;
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

test("window body padding, text floor, and taskbar icons", async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 720 } });
  try {
    await page.goto(BASE);
    await page.waitForFunction(() => window.__controlsTest && typeof window.__controlsTest.wipe === "function", { timeout: 20000 });
    await page.evaluate(() => {
      window.__controlsTest.wipe();
      window.__controlsTest.bootPlay();
      window.__controlsTest.openDesk();
    });
    await page.waitForSelector("[data-testid=taskbar]");

    const taskIcons = await page.locator("[data-testid=taskbar] [data-app-icon]").count();
    await page.click("[data-testid=start-button]");
    await page.waitForSelector("[data-testid=start-menu]");
    const menuIcons = await page.locator("[data-testid=start-menu] [data-app-icon]").count();
    assert.ok(taskIcons > 0, "taskbar has app icons");
    assert.equal(taskIcons, menuIcons, "taskbar icon count equals the app count");

    const start = await page.locator("[data-testid=start-button]").boundingBox();
    const icons = await page.locator("[data-testid=taskbar] [data-app-icon]").all();
    for (const icon of icons) {
      const box = await icon.boundingBox();
      assert.equal(overlap(start, box), false, "taskbar icon overlaps Start");
    }

    await page.click("[role=menuitem][aria-label='Settings']");
    await page.waitForSelector("[data-testid=window-settings] [data-testid=window-body]");
    const layout = await page.evaluate(() => {
      const body = document.querySelector("[data-testid=window-settings] [data-testid=window-body]");
      const badPad = [];
      for (const child of body.children) {
        const pad = parseFloat(getComputedStyle(child).paddingLeft);
        if (!(pad > 0)) badPad.push(child.className || child.tagName);
      }
      const small = [];
      const nodes = body.querySelectorAll("button, p, td, li, label, h1, h2, h3, span, a");
      for (const el of nodes) {
        if (el.closest(".schematic-label, .cc-label-sm")) continue;
        const text = (el.innerText || "").trim();
        if (!text) continue;
        if (el !== document.activeElement && el.querySelector("button, p, td, li, label")) {
          if (el.tagName !== "BUTTON") continue;
        }
        const fs = parseFloat(getComputedStyle(el).fontSize);
        const floor = el.tagName === "BUTTON" || !el.className.includes("label") ? 12 : 10;
        if (fs + 0.01 < floor) small.push({ tag: el.tagName, fs, text: text.slice(0, 48) });
      }
      const pageWide = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      return { badPad, small, pageWide };
    });
    assert.deepEqual(layout.badPad, [], "a window body child has no left padding");
    assert.deepEqual(layout.small, [], "body text or a button is under 12px");
    assert.equal(layout.pageWide, false, "horizontal page scroll");
  } finally {
    await browser.close();
  }
});
