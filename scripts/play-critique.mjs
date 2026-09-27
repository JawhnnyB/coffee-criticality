import { chromium } from "playwright";

const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("pageerror", (e) => errors.push("page: " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console: " + m.text());
});

await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: "/workspace/screenshots/11-splash.png" });

await page.getByRole("button", { name: "Begin" }).click();
await page.waitForTimeout(350);
await page.screenshot({ path: "/workspace/screenshots/12-menu.png" });

await page.getByRole("button", { name: "New shift" }).click();
await page.waitForTimeout(200);
await page.getByRole("button", { name: /Transferred Engineer/ }).click();
await page.waitForTimeout(400);
const intro1 = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/13-intro.png" });

await page.getByRole("button", { name: "Continue" }).click();
await page.waitForTimeout(550);
await page.getByRole("button", { name: "Continue" }).click();
await page.waitForTimeout(550);
await page.getByRole("button", { name: "Walk in" }).click();
await page.waitForTimeout(700);

const start = await page.evaluate(() => {
  const t = window.__controlsTest;
  return { x: t.getX(), y: t.getY(), room: t.getRoom(), mode: t.getMode(), minutes: t.getMinutes(), mural: t.getMural() };
});
const cafeText = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/14-cafe.png" });

// A = left, D = right from spawn
await page.evaluate(() => window.__controlsTest.setKeys(["KeyA"]));
await page.waitForTimeout(450);
await page.evaluate(() => window.__controlsTest.setKeys([]));
const afterA = await page.evaluate(() => window.__controlsTest.getX());
await page.evaluate(() => window.__controlsTest.setKeys(["KeyD"]));
await page.waitForTimeout(450);
await page.evaluate(() => window.__controlsTest.setKeys([]));
const afterD = await page.evaluate(() => window.__controlsTest.getX());

// Reset toward spawn-ish then walk into mural
await page.evaluate(() => window.__controlsTest.setKeys(["KeyW"]));
await page.waitForTimeout(2000);
await page.evaluate(() => window.__controlsTest.setKeys([]));
const wallProbe = await page.evaluate(() => {
  const t = window.__controlsTest;
  return { x: t.getX(), y: t.getY(), mural: t.getMural() };
});
await page.screenshot({ path: "/workspace/screenshots/15-wall.png" });

// Walk down then left toward Mabel (176, 268)
await page.evaluate(() => window.__controlsTest.setKeys(["KeyS"]));
await page.waitForTimeout(700);
await page.evaluate(() => window.__controlsTest.setKeys(["KeyA"]));
await page.waitForTimeout(1200);
await page.evaluate(() => window.__controlsTest.setKeys([]));
const nearMabel = await page.evaluate(() => ({ x: window.__controlsTest.getX(), y: window.__controlsTest.getY() }));
await page.keyboard.press("KeyE");
await page.waitForTimeout(450);
const talkText = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/16-mabel.png" });

for (let i = 0; i < 8; i++) {
  const choice = page.getByRole("button", { name: /I'll say what I see/ });
  if (await choice.count()) {
    await choice.click();
    await page.waitForTimeout(400);
    break;
  }
  await page.keyboard.press("Space");
  await page.waitForTimeout(260);
}
const afterChoice = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/17-choice.png" });
await page.keyboard.press("Space");
await page.waitForTimeout(280);
await page.keyboard.press("Space");
await page.waitForTimeout(200);

// Walk to south door: x ~320, y south
const pos = await page.evaluate(() => ({ x: window.__controlsTest.getX(), y: window.__controlsTest.getY() }));
if (pos.x < 300) {
  await page.evaluate(() => window.__controlsTest.setKeys(["KeyD"]));
  await page.waitForTimeout(Math.min(1800, (320 - pos.x) * 8));
  await page.evaluate(() => window.__controlsTest.setKeys([]));
} else if (pos.x > 350) {
  await page.evaluate(() => window.__controlsTest.setKeys(["KeyA"]));
  await page.waitForTimeout(800);
  await page.evaluate(() => window.__controlsTest.setKeys([]));
}
await page.evaluate(() => window.__controlsTest.setKeys(["KeyS"]));
await page.waitForTimeout(2200);
await page.evaluate(() => window.__controlsTest.setKeys([]));
await page.waitForTimeout(1100);
const room2 = await page.evaluate(() => window.__controlsTest.getRoom());
const minutesLater = await page.evaluate(() => window.__controlsTest.getMinutes());
await page.screenshot({ path: "/workspace/screenshots/18-next-room.png" });

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
await page.screenshot({ path: "/workspace/screenshots/19-mobile.png" });

const result = {
  errors,
  introHasLake: /water is still holding|06:38/.test(intro1),
  cafeHasClock: /\d{2}:\d{2}/.test(cafeText),
  cafeHasObjective: /mabel/i.test(cafeText),
  checklistNotHuge: !cafeText.includes("Handle valve 14"),
  start,
  afterA,
  afterD,
  aIsLeft: afterA < start.x - 15,
  dIsRight: afterD > afterA + 15,
  wallProbe,
  didNotWalkThroughMural: wallProbe.y >= wallProbe.mural + 10,
  nearMabel,
  talkHasEmotion: /superstitious|hands are doing|I still taste|extra cup/i.test(talkText),
  talkHasChoice: /I'll say what I see|green is a color|Silence isn't/i.test(talkText + afterChoice),
  room2,
  minutesLater,
  timeAdvanced: minutesLater > start.minutes + 2,
};
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (errors.length) process.exit(1);
