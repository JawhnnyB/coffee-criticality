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
  for (let i = 0; i < 80; i++) {
    if (window.__controlsTest) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("no __controlsTest");
});
await page.click("body");
await page.evaluate(() => window.__controlsTest.bootPlay());
await page.waitForTimeout(400);

await page.evaluate(() => window.__controlsTest.warp("cafe", 160, 176));
await page.waitForTimeout(350);
await page.screenshot({ path: "/workspace/screenshots/pillarI-cafe.png" });

await page.evaluate(() => window.__controlsTest.warp("control", 80, 170));
await page.waitForTimeout(350);
await page.screenshot({ path: "/workspace/screenshots/pillarI-control.png" });

await page.evaluate(() => window.__controlsTest.warp("reactor", 160, 188));
await page.waitForTimeout(450);
const rx = await page.evaluate(() => {
  const t = window.__controlsTest;
  return { room: t.getRoom(), x: t.getX(), y: t.getY(), mode: t.getMode() };
});
await page.screenshot({ path: "/workspace/screenshots/game-reactor.png" });
await page.screenshot({ path: "/workspace/screenshots/pillarI-reactor.png" });

await page.evaluate(() => window.__controlsTest.openStillId("pwr"));
await page.waitForTimeout(500);
const stillText = await page.evaluate(() => document.body.innerText);
if (!/PRIMARY LOOP|VESSEL|HOT LEG|COLD LEG|Q =/.test(stillText)) {
  throw new Error("pwr still missing loop schematic: " + stillText.slice(0, 280));
}
const loop = await page.locator('[data-testid="loop-schematic"]').count();
if (!loop) throw new Error("no loop-schematic on pwr still");
await page.screenshot({ path: "/workspace/screenshots/pillarI-still-pwr.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

await page.evaluate(() => window.__controlsTest.warp("maintenance", 100, 170));
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/game-maint-pipes.png" });
await page.screenshot({ path: "/workspace/screenshots/pillarI-maint.png" });

await page.evaluate(() => window.__controlsTest.setAcademy(1));
await page.waitForTimeout(400);
const fluids = await page.evaluate(() => document.querySelector('[data-testid="academy-stage"]')?.innerText || "");
if (!/PRIMARY LOOP|Heat has to leave|16 MPa/.test(fluids)) {
  throw new Error("academy fluids missing loop: " + fluids.slice(0, 240));
}
if (await page.locator('[data-testid="loop-schematic"]').count() < 1) {
  throw new Error("academy fluids missing schematic");
}
await page.screenshot({ path: "/workspace/screenshots/pillarI-academy-fluids.png" });

await page.evaluate(() => window.__controlsTest.setAcademy(2));
await page.waitForTimeout(350);
const anatomy = await page.evaluate(() => document.querySelector('[data-testid="academy-stage"]')?.innerText || "");
if (!/vessel has names|CRDM/.test(anatomy)) throw new Error("anatomy missing: " + anatomy.slice(0, 200));
await page.screenshot({ path: "/workspace/screenshots/pillarI-academy-anatomy.png" });

await page.evaluate(() => window.__controlsTest.setAcademy(6));
await page.waitForTimeout(450);
const lab = await page.evaluate(() => document.querySelector('[data-testid="academy-stage"]')?.innerText || "");
if (!/Rod, assembly, core|k∞|PRIMARY LOOP/.test(lab)) throw new Error("lab missing generator: " + lab.slice(0, 240));
if (await page.locator('[data-testid="loop-schematic"]').count() < 1) throw new Error("lab missing schematic");
if (await page.locator('[data-testid="k-ladder"]').count() < 1) throw new Error("lab missing k-ladder");
await page.screenshot({ path: "/workspace/screenshots/pillarI-generator.png" });

await page.evaluate(() => window.__controlsTest.setAcademy(13));
await page.waitForTimeout(250);
const ac13 = await page.evaluate(() => document.querySelector('[data-testid="academy-stage"]')?.innerText || "");
if (!/Play DELAY.CAB/.test(ac13)) throw new Error("academy 13 shifted: " + ac13.slice(0, 160));
await page.evaluate(() => window.__controlsTest.setAcademy(14));
await page.waitForTimeout(250);
const ac14 = await page.evaluate(() => document.querySelector('[data-testid="academy-stage"]')?.innerText || "");
if (!/Play PHYS.CAB/.test(ac14)) throw new Error("academy 14 shifted: " + ac14.slice(0, 160));
await page.evaluate(() => window.__controlsTest.setAcademy(15));
await page.waitForTimeout(250);
const ac15 = await page.evaluate(() => document.querySelector('[data-testid="academy-stage"]')?.innerText || "");
if (!/Play analog MC/.test(ac15)) throw new Error("academy 15 shifted: " + ac15.slice(0, 160));

await page.evaluate(() => {
  window.__controlsTest.warp("reactor", 160, 188);
});
await page.waitForTimeout(300);
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/pillarI-mobile-reactor.png" });

console.log("rooms", rx);
if (errors.length) {
  console.log("errors", errors.slice(0, 8));
  throw new Error(errors[0]);
}
console.log("pillar I ok");
await browser.close();
