import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const errors = [];
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.getByRole("button", { name: "Begin" }).click();
await page.getByRole("button", { name: "New shift" }).click();
await page.getByRole("button", { name: /Transferred Engineer/ }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: "/workspace/screenshots/07-cafe-fixed.png" });

// walk toward Mabel (left + up)
await page.evaluate(() => window.__controlsTest?.setKeys(["KeyA", "KeyW"]));
await page.waitForTimeout(900);
await page.evaluate(() => window.__controlsTest?.setKeys([]));
await page.waitForTimeout(80);
await page.keyboard.press("KeyE");
await page.waitForTimeout(350);
const probe = await page.evaluate(() => {
  const t = window.__controlsTest;
  return { x: t?.getX(), y: t?.getY(), room: t?.getRoom(), text: document.body.innerText.slice(0, 400) };
});
await page.screenshot({ path: "/workspace/screenshots/08-mabel.png" });

// to gate via south door
await page.keyboard.press("Escape");
await page.waitForTimeout(100);
await page.evaluate(() => window.__controlsTest?.setKeys(["KeyS"]));
await page.waitForTimeout(1400);
await page.evaluate(() => window.__controlsTest?.setKeys([]));
const room2 = await page.evaluate(() => window.__controlsTest?.getRoom());
await page.screenshot({ path: "/workspace/screenshots/09-next-room.png" });

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(200);
await page.screenshot({ path: "/workspace/screenshots/10-mobile-cafe.png" });

console.log(JSON.stringify({ probe, room2, errors }, null, 2));
await browser.close();
