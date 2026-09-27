import { chromium } from "playwright";

const url = "http://127.0.0.1:8080/";
const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(500);
await page.evaluate(async () => {
  for (let i = 0; i < 80; i++) {
    if (window.__controlsTest) return;
    await new Promise((r) => setTimeout(r, 50));
  }
});

await page.evaluate(() => window.__controlsTest.bootPlay());
await page.waitForTimeout(500);
await page.screenshot({ path: "/workspace/screenshots/pillarC-cafe.png" });

const cafe = await page.evaluate(() => {
  const t = window.__controlsTest;
  return { room: t.getRoom(), x: t.getX(), y: t.getY() };
});

await page.evaluate(() => window.__controlsTest.warp("cafe", 200, 188));
await page.waitForTimeout(250);
await page.keyboard.press("e");
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/pillarC-sit.png" });
const sitPrompt = await page.evaluate(() => document.body.innerText.includes("Stand"));

await page.evaluate(() => window.__controlsTest.setKeys(["KeyS"]));
await page.waitForTimeout(300);
await page.evaluate(() => window.__controlsTest.setKeys([]));
await page.waitForTimeout(200);

await page.evaluate(() => window.__controlsTest.warp("control", 200, 180));
await page.waitForTimeout(450);
await page.screenshot({ path: "/workspace/screenshots/pillarC-control.png" });

await page.evaluate(() => window.__controlsTest.warp("gate", 336, 220));
await page.waitForTimeout(400);
await page.evaluate(() => window.__controlsTest.setMinutes(14 * 60 + 30));
await page.waitForTimeout(500);
await page.screenshot({ path: "/workspace/screenshots/pillarC-lot-dusk.png" });

await page.evaluate(() => window.__controlsTest.warp("breakroom", 128, 140));
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/pillarC-break.png" });

await page.keyboard.press("Escape");
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/pillarC-pause.png" });

await page.setViewportSize({ width: 390, height: 844 });
await page.keyboard.press("Escape");
await page.waitForTimeout(200);
await page.evaluate(() => window.__controlsTest.warp("cafe", 160, 176));
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/pillarC-mobile.png" });

console.log(JSON.stringify({ errors, cafe, sitPrompt }, null, 2));
await browser.close();
