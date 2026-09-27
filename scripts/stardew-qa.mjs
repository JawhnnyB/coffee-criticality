import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const errors = [];
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.getByRole("button", { name: "Begin" }).click();
await page.waitForTimeout(250);
await page.getByRole("button", { name: "New shift" }).click();
await page.getByRole("button", { name: /Transferred/ }).click();
await page.waitForTimeout(500);
await page.getByRole("button", { name: "Walk in" }).click();
await page.waitForTimeout(700);
await page.screenshot({ path: "/workspace/screenshots/42-cafe-stardew.png" });

const before = await page.evaluate(() => ({ x: window.__controlsTest.getX(), y: window.__controlsTest.getY(), room: window.__controlsTest.getRoom(), mode: window.__controlsTest.getMode() }));
await page.evaluate(() => window.__controlsTest.setKeys(["KeyA"]));
await page.waitForTimeout(400);
const afterA = await page.evaluate(() => ({ x: window.__controlsTest.getX(), y: window.__controlsTest.getY(), facing: window.__controlsTest.getFacing() }));
await page.evaluate(() => window.__controlsTest.setKeys([]));
await page.evaluate(() => window.__controlsTest.setKeys(["KeyD"]));
await page.waitForTimeout(400);
const afterD = await page.evaluate(() => ({ x: window.__controlsTest.getX(), facing: window.__controlsTest.getFacing() }));
await page.evaluate(() => window.__controlsTest.setKeys([]));
await page.screenshot({ path: "/workspace/screenshots/43-cafe-walk.png" });

await page.evaluate(() => window.__controlsTest.warp("cafe", 110, 150));
await page.waitForTimeout(200);
await page.keyboard.press("KeyE");
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/44-talk-stardew.png" });
const talk = await page.evaluate(() => window.__controlsTest.getMode());

await page.evaluate(() => window.__controlsTest.warp("gate", 192, 120));
await page.waitForTimeout(300);
await page.screenshot({ path: "/workspace/screenshots/45-gate.png" });

await page.evaluate(() => window.__controlsTest.warp("control", 176, 160));
await page.waitForTimeout(300);
await page.screenshot({ path: "/workspace/screenshots/46-control.png" });

await page.evaluate(() => window.__controlsTest.warp("reactor", 208, 180));
await page.waitForTimeout(300);
await page.screenshot({ path: "/workspace/screenshots/47-reactor.png" });

console.log(JSON.stringify({ errors, before, afterA, afterD, aGoesLeft: afterA.x < before.x, dGoesRight: afterD.x > afterA.x, talk }, null, 2));
await browser.close();
