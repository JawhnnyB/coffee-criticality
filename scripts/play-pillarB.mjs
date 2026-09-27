import { chromium } from "playwright";

const url = "http://127.0.0.1:8080/";
const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("pageerror", (e) => errors.push("page " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console " + m.text());
});

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(500);
await page.evaluate(async () => {
  const wait = () => new Promise((r) => setTimeout(r, 50));
  for (let i = 0; i < 80; i++) {
    if (window.__controlsTest) return;
    await wait();
  }
  throw new Error("no __controlsTest");
});

await page.evaluate(() => window.__controlsTest.bootPlay());
await page.waitForTimeout(400);

// Stand just inside cafe east door, walk into the lot.
await page.evaluate(() => window.__controlsTest.warp("cafe", 292, 120));
await page.evaluate(() => window.__controlsTest.setKeys(["KeyD"]));
await page.waitForTimeout(900);
await page.evaluate(() => window.__controlsTest.setKeys([]));
await page.waitForTimeout(700);

const lot = await page.evaluate(() => {
  const t = window.__controlsTest;
  return { room: t.getRoom(), x: t.getX(), y: t.getY(), facing: t.getFacing() };
});
await page.screenshot({ path: "/workspace/screenshots/pillarB-lot.png" });

await page.evaluate(() => window.__controlsTest.warp("control", 176, 160));
await page.waitForTimeout(500);
await page.screenshot({ path: "/workspace/screenshots/pillarB-control.png" });

await page.evaluate(() => window.__controlsTest.warp("maintenance", 80, 140));
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/pillarB-maint.png" });

await page.evaluate(() => window.__controlsTest.warp("breakroom", 128, 140));
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/pillarB-break.png" });

await page.evaluate(() => window.__controlsTest.warp("engineering", 80, 140));
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/pillarB-eng.png" });

await page.evaluate(() => window.__controlsTest.warp("corridor", 192, 120));
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/pillarB-hall.png" });

await page.evaluate(() => window.__controlsTest.warp("reactor", 208, 180));
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/pillarB-reactor.png" });

await page.keyboard.press("Escape");
await page.waitForTimeout(400);
const paused = await page.evaluate(() => window.__controlsTest.getMode());
await page.screenshot({ path: "/workspace/screenshots/pillarB-pause.png" });

await page.evaluate(() => {
  window.__controlsTest.setFlag("seen:cafe", true);
  window.__controlsTest.setFlag("seen:gate", true);
  window.__controlsTest.travel("cafe");
});
await page.waitForTimeout(900);
const afterTravel = await page.evaluate(() => {
  const t = window.__controlsTest;
  return { room: t.getRoom(), x: t.getX(), y: t.getY(), facing: t.getFacing(), mode: t.getMode() };
});
await page.screenshot({ path: "/workspace/screenshots/pillarB-travel-cafe.png" });

await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => window.__controlsTest.warp("gate", 336, 200));
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/pillarB-mobile-lot.png" });

console.log(JSON.stringify({ errors, lot, paused, afterTravel }, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
