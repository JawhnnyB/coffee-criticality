import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const errors = [];
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.getByRole("button", { name: "Begin" }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: "/workspace/screenshots/30-menu.png" });
await page.getByRole("button", { name: "New shift" }).click();
await page.getByRole("button", { name: /Transferred/ }).click();
await page.waitForTimeout(500);
const builderText = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/31-builder.png" });
await page.evaluate(() => window.__controlsTest.finishBuild());
await page.waitForTimeout(400);
const introMode = await page.evaluate(() => window.__controlsTest.getMode());
const plant = await page.evaluate(() => window.__controlsTest.getPlant());
await page.screenshot({ path: "/workspace/screenshots/31-intro-art.png" });
await page.getByRole("button", { name: "Continue" }).click();
await page.waitForTimeout(350);
await page.getByRole("button", { name: "Morning brief" }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/32-brief.png" });
await page.getByRole("button", { name: "Walk in" }).click();
await page.waitForTimeout(500);

const startMin = await page.evaluate(() => window.__controlsTest.getMinutes());
await page.evaluate(() => window.__controlsTest.warp("cafe", 110, 150));
await page.waitForTimeout(200);
await page.keyboard.press("KeyE");
await page.waitForTimeout(450);
const talkMin = await page.evaluate(() => window.__controlsTest.getMinutes());
const talkMode = await page.evaluate(() => window.__controlsTest.getMode());
const talkText = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/33-talk-portrait.png" });
const say = page.getByRole("button", { name: /I'll say what I see/ });
if (await say.count()) {
  await say.click();
  await page.waitForTimeout(300);
}
await page.keyboard.press("Space");
await page.waitForTimeout(250);
const afterTalkMin = await page.evaluate(() => window.__controlsTest.getMinutes());

await page.evaluate(() => window.__controlsTest.warp("cafe", 270, 130));
await page.waitForTimeout(200);
await page.keyboard.press("KeyE");
await page.waitForTimeout(400);
const arcadeMode = await page.evaluate(() => window.__controlsTest.getMode());
await page.screenshot({ path: "/workspace/screenshots/34-arcade.png" });
if (arcadeMode === "arcade") {
  for (let r = 0; r < 4; r++) {
    const btns = page.locator("button").filter({ hasText: /OPEN|IN SERVICE|40 mSv|—/ });
    const n = await btns.count();
    if (n) await btns.first().click();
    else {
      const all = page.locator("button");
      const c = await all.count();
      if (c > 1) await all.nth(1).click();
    }
    await page.waitForTimeout(800);
  }
  const back = page.getByRole("button", { name: /Back to the cafe|Leave cabinet|Back to clock-out/ });
  if (await back.count()) await back.click();
  await page.waitForTimeout(300);
}

await page.evaluate(() => window.__controlsTest.warp("control", 64, 120));
await page.waitForTimeout(200);
await page.keyboard.press("KeyE");
await page.waitForTimeout(400);
const academyMode = await page.evaluate(() => window.__controlsTest.getMode());
await page.screenshot({ path: "/workspace/screenshots/37-academy.png" });
if (academyMode === "academy") {
  await page.getByRole("button", { name: "Close" }).click();
  await page.waitForTimeout(250);
}

await page.evaluate(() => window.__controlsTest.warp("engineering", 112, 192));
await page.waitForTimeout(200);
await page.keyboard.press("KeyE");
await page.waitForTimeout(400);
const trainerMode = await page.evaluate(() => window.__controlsTest.getMode());
await page.screenshot({ path: "/workspace/screenshots/35-trainer.png" });
if (trainerMode === "reactor") {
  await page.screenshot({ path: "/workspace/screenshots/36-trainer-pwr.png" });
  await page.getByRole("button", { name: "Leave" }).click();
  await page.waitForTimeout(200);
}

await page.evaluate(() => window.__controlsTest.warp("maintenance", 200, 160));
await page.waitForTimeout(200);
await page.keyboard.press("KeyE");
await page.waitForTimeout(350);
const incidentMode = await page.evaluate(() => window.__controlsTest.getMode());
if (incidentMode === "incident") {
  await page.keyboard.press("KeyR");
  await page.waitForTimeout(300);
}
await page.screenshot({ path: "/workspace/screenshots/37-still-or-board.png" });

await page.keyboard.press("Escape");
await page.waitForTimeout(300);
const pauseMode = await page.evaluate(() => window.__controlsTest.getMode());
const pauseText = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/pause-map.png" });
if (pauseMode === "pause") {
  await page.getByRole("button", { name: "Resume" }).click();
  await page.waitForTimeout(200);
}

await page.evaluate(() => {
  const t = window.__controlsTest;
  t.warp("cafe", 160, 176);
  t.setMinutes(16 * 60 + 30);
});
await page.waitForTimeout(400);
const late = await page.evaluate(() => ({
  mode: window.__controlsTest.getMode(),
  min: window.__controlsTest.getMinutes(),
  period: window.__controlsTest.getPeriod(),
}));
await page.screenshot({ path: "/workspace/screenshots/38-late-day.png" });

const closeBtn = page.getByRole("button", { name: "Close the shift" });
if (await closeBtn.count()) {
  await closeBtn.click();
  await page.waitForTimeout(400);
}
await page.screenshot({ path: "/workspace/screenshots/39-eod.png" });
const eodMode = await page.evaluate(() => window.__controlsTest.getMode());
const eodHasArcade = await page.getByRole("button", { name: "Catch cabinet" }).count();
if (eodHasArcade) {
  await page.getByRole("button", { name: "Catch cabinet" }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "/workspace/screenshots/39-eod-arcade.png" });
  const leave = page.getByRole("button", { name: /Leave cabinet|Back to clock-out/ });
  if (await leave.count()) await leave.click();
  await page.waitForTimeout(300);
}
const clock = page.getByRole("button", { name: /Clock out|Close the week/ });
if (await clock.count()) {
  await clock.click();
  await page.waitForTimeout(400);
}
const day2Mode = await page.evaluate(() => ({
  mode: window.__controlsTest.getMode(),
  day: window.__controlsTest.getDay(),
}));
await page.screenshot({ path: "/workspace/screenshots/32-day2-brief.png" });

await page.evaluate(() => window.__controlsTest.setDay(5));
await page.waitForTimeout(300);
const d5brief = await page.evaluate(() => ({
  mode: window.__controlsTest.getMode(),
  day: window.__controlsTest.getDay(),
}));
if (await page.getByRole("button", { name: "Walk in" }).count()) {
  await page.getByRole("button", { name: "Walk in" }).click();
  await page.waitForTimeout(300);
}
await page.evaluate(() => window.__controlsTest.warp("reactor", 80, 120));
await page.waitForTimeout(200);
await page.keyboard.press("KeyE");
await page.waitForTimeout(400);
const shuffleMode = await page.evaluate(() => window.__controlsTest.getMode());
await page.screenshot({ path: "/workspace/screenshots/shuffle.png" });
if (shuffleMode === "shuffle") {
  const leave = page.getByRole("button", { name: /Leave desk/ });
  if (await leave.count()) await leave.click();
  await page.waitForTimeout(250);
}

await page.evaluate(() => window.__controlsTest.warp("cafe", 160, 176));
await page.waitForTimeout(150);
const ax0 = await page.evaluate(() => window.__controlsTest.getX());
await page.evaluate(() => window.__controlsTest.setKeys(["KeyA"]));
await page.waitForTimeout(400);
await page.evaluate(() => window.__controlsTest.setKeys([]));
const ax1 = await page.evaluate(() => window.__controlsTest.getX());
const aIsLeft = ax1 < ax0 - 4;

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(200);
await page.screenshot({ path: "/workspace/screenshots/41-mobile-menu.png" });

console.log(
  JSON.stringify(
    {
      errors,
      builderTextHasPriya: /Priya|ACADEMIC/.test(builderText),
      introMode,
      plant,
      startMin,
      talkMode,
      talkFrozen: Math.abs(talkMin - startMin) < 3,
      afterTalkMin,
      talkHasChoice: /green|Sit/.test(talkText),
      arcadeMode,
      academyMode,
      trainerMode,
      pauseMode,
      pauseHasMap: /Plant map|Cafe/.test(pauseText),
      pauseHasHearts: /Relationships|Mabel/.test(pauseText),
      late,
      eodMode,
      eodHasArcade: eodHasArcade > 0,
      day2Mode,
      d5brief,
      shuffleMode,
      aIsLeft,
    },
    null,
    2,
  ),
);
await browser.close();
