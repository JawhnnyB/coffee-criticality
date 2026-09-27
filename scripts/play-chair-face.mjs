import { chromium } from "playwright";

const url = "http://127.0.0.1:8080/";
const browser = await chromium.launch({ headless: true });
const errors = [];
const page = await browser.newPage();
page.on("pageerror", (e) => errors.push("page " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console " + m.text());
});

async function shot(name, w = 1280, h = 720) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `/workspace/screenshots/${name}.png` });
}

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(400);
await page.evaluate(() => window.__controlsTest?.bootPlay());
await page.waitForTimeout(500);

const start = await page.evaluate(() => {
  const t = window.__controlsTest;
  return t
    ? { x: t.getX(), y: t.getY(), room: t.getRoom(), facing: t.getFacing(), sitting: t.getSitting(), mode: t.getMode() }
    : null;
});
console.log("start", start);

await shot("chair-cafe");

const x0 = start.x;
await page.evaluate(() => window.__controlsTest?.setKeys(["KeyA"]));
await page.waitForTimeout(450);
const afterA = await page.evaluate(() => {
  const t = window.__controlsTest;
  return { x: t.getX(), y: t.getY(), facing: t.getFacing(), sitting: t.getSitting() };
});
await page.evaluate(() => window.__controlsTest?.setKeys([]));
console.log("after A", afterA);

await page.evaluate(() => window.__controlsTest?.setKeys(["KeyD"]));
await page.waitForTimeout(450);
const afterD = await page.evaluate(() => {
  const t = window.__controlsTest;
  return { x: t.getX(), y: t.getY(), facing: t.getFacing() };
});
await page.evaluate(() => window.__controlsTest?.setKeys([]));
console.log("after D", afterD);

await page.evaluate(() => window.__controlsTest?.setKeys(["KeyW"]));
await page.waitForTimeout(350);
const afterW = await page.evaluate(() => {
  const t = window.__controlsTest;
  return { x: t.getX(), y: t.getY(), facing: t.getFacing() };
});
await page.evaluate(() => window.__controlsTest?.setKeys([]));

await page.evaluate(() => window.__controlsTest?.setKeys(["KeyS"]));
await page.waitForTimeout(350);
const afterS = await page.evaluate(() => {
  const t = window.__controlsTest;
  return { x: t.getX(), y: t.getY(), facing: t.getFacing() };
});
await page.evaluate(() => window.__controlsTest?.setKeys([]));
console.log("after W/S", afterW, afterS);
await shot("chair-walk");

// Walk toward Mabel (210, 150) and talk.
await page.evaluate(() => {
  const t = window.__controlsTest;
  t.warp("cafe", 200, 170);
});
await page.waitForTimeout(200);
await page.keyboard.press("KeyE");
await page.waitForTimeout(500);
const talk = await page.evaluate(() => window.__controlsTest?.getMode());
console.log("talk mode", talk);
await shot("chair-talk");

// Sit then stand
await page.keyboard.press("Escape");
await page.waitForTimeout(200);
await page.evaluate(() => {
  window.__controlsTest.warp("cafe", 160, 188);
});
await page.waitForTimeout(150);
await page.keyboard.press("KeyE");
await page.waitForTimeout(300);
const sat = await page.evaluate(() => window.__controlsTest.getSitting());
await page.evaluate(() => window.__controlsTest.setKeys(["KeyS"]));
await page.waitForTimeout(250);
await page.evaluate(() => window.__controlsTest.setKeys([]));
const stood = await page.evaluate(() => {
  const t = window.__controlsTest;
  return { sitting: t.getSitting(), x: t.getX(), y: t.getY() };
});
console.log("sit/stand", { sat, stood });
await shot("chair-stood");

const aLeft = afterA.x < x0 - 8;
const dRight = afterD.x > afterA.x + 8;
const wUp = afterW.y < afterD.y - 4;
const sDown = afterS.y > afterW.y + 4;
const free = start && !start.sitting && start.y > 192 && start.mode === "play";
const talked = talk === "dialogue";
const standOk = sat === true && stood.sitting === false;

const ok = aLeft && dRight && wUp && sDown && free && talked && standOk && errors.length === 0;
console.log(JSON.stringify({ ok, aLeft, dRight, wUp, sDown, free, talked, standOk, start, afterA, afterD, afterW, afterS, sat, stood, errors }, null, 2));
await browser.close();
process.exit(ok ? 0 : 2);
