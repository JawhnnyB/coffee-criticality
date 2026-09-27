import { chromium } from "playwright";

const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.getByRole("button", { name: "Begin" }).click();
await page.getByRole("button", { name: "New shift" }).click();
await page.getByRole("button", { name: /Transferred Engineer/ }).click();
await page.waitForTimeout(400);

await page.evaluate(() => window.__controlsTest.warp("control", 360, 360));
await page.waitForTimeout(500);
await page.screenshot({ path: "/workspace/screenshots/20-control-mismatch.png" });

await page.evaluate(() => window.__controlsTest.warp("corridor", 500, 180));
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/21-corridor.png" });

await page.evaluate(() => window.__controlsTest.warp("reactor", 200, 400));
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/22-reactor.png" });

await page.evaluate(() => {
  window.__controlsTest.warp("cafe", 340, 310);
  window.__controlsTest.setMinutes(14 * 60 + 10);
});
await page.waitForTimeout(500);
const afternoon = await page.evaluate(() => window.__controlsTest.getPeriod());
await page.screenshot({ path: "/workspace/screenshots/23-afternoon.png" });

console.log(JSON.stringify({ errors, afternoon }, null, 2));
await browser.close();
