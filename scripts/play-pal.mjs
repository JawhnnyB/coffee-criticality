import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(800);
await page.evaluate(() => window.__controlsTest?.bootPlay());
await page.waitForTimeout(500);
await page.screenshot({ path: "/workspace/screenshots/pal-cafe.png" });
await page.evaluate(() => {
  const t = window.__controlsTest;
  t.warp("engineering", 200, 160);
  t.setKeys([]);
});
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/pal-eng.png" });
await page.evaluate(() => window.__controlsTest.startTalk("priya"));
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/pal-priya-talk.png" });
await page.evaluate(() => {
  window.__controlsTest.warp("reactor", 176, 180);
});
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/pal-core.png" });
const probe = await page.evaluate(() => {
  const t = window.__controlsTest;
  return { room: t.getRoom(), x: t.getX(), y: t.getY(), sitting: t.getSitting() };
});
console.log(JSON.stringify(probe));
await browser.close();
