import { chromium } from "playwright";

const url = "http://127.0.0.1:8080/";
const browser = await chromium.launch({ headless: true });
const errors = [];

async function shot(page, name, w=1280, h=720) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `/workspace/screenshots/${name}.png` });
}

const page = await browser.newPage();
page.on("pageerror", (e) => errors.push("page " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console " + m.text());
});
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(600);
await shot(page, "01-splash");

await page.getByRole("button", { name: "Begin" }).click();
await page.waitForTimeout(400);
await shot(page, "02-menu");

await page.getByRole("button", { name: "New shift" }).click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: /Transferred Engineer/ }).click();
await page.waitForTimeout(700);
await shot(page, "03-cafe");

const probe = await page.evaluate(() => {
  const t = window.__controlsTest;
  return t ? { x: t.getX(), y: t.getY(), room: t.getRoom(), facing: t.getFacing() } : null;
});
console.log("probe after start", probe);

await page.evaluate(() => window.__controlsTest?.setKeys(["KeyA"]));
await page.waitForTimeout(500);
const afterA = await page.evaluate(() => {
  const t = window.__controlsTest;
  return t ? { x: t.getX(), y: t.getY(), facing: t.getFacing() } : null;
});
await page.evaluate(() => window.__controlsTest?.setKeys([]));
console.log("after A", afterA);

await page.evaluate(() => window.__controlsTest?.setKeys(["KeyD"]));
await page.waitForTimeout(500);
const afterD = await page.evaluate(() => {
  const t = window.__controlsTest;
  return t ? { x: t.getX(), y: t.getY(), facing: t.getFacing() } : null;
});
await page.evaluate(() => window.__controlsTest?.setKeys([]));
console.log("after D", afterD);

await page.evaluate(() => window.__controlsTest?.setKeys(["KeyS"]));
await page.waitForTimeout(400);
await page.evaluate(() => window.__controlsTest?.setKeys([]));
await shot(page, "04-walk");

// walk to cafe door-ish and talk
await page.keyboard.press("KeyE");
await page.waitForTimeout(400);
await shot(page, "05-talk");

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
await shot(page, "06-mobile", 390, 844);

const aLeft = probe && afterA ? afterA.x < probe.x - 8 : false;
const dRight = afterA && afterD ? afterD.x > afterA.x + 8 : false;
console.log(JSON.stringify({ aLeft, dRight, probe, afterA, afterD, errors }, null, 2));
await browser.close();
process.exit(aLeft && dRight && errors.length === 0 ? 0 : 2);
