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
await page.waitForTimeout(400);
await page.evaluate(async () => {
  for (let i = 0; i < 80; i++) {
    if (window.__controlsTest) return;
    await new Promise((r) => setTimeout(r, 50));
  }
});

await page.click("body");
await page.waitForTimeout(200);

await page.evaluate(() => window.__controlsTest.bootPlay());
await page.waitForTimeout(500);
const cafe = await page.evaluate(() => window.__controlsTest.getAudio());
await page.screenshot({ path: "/workspace/screenshots/pillarF-cafe.png" });

await page.evaluate(() => window.__controlsTest.warp("gate", 336, 220));
await page.waitForTimeout(500);
const lot = await page.evaluate(() => window.__controlsTest.getAudio());
await page.screenshot({ path: "/workspace/screenshots/pillarF-lot.png" });

await page.evaluate(() => window.__controlsTest.warp("control", 200, 180));
await page.waitForTimeout(400);
const plant = await page.evaluate(() => window.__controlsTest.getAudio());

await page.evaluate(() => window.__controlsTest.warp("reactor", 208, 180));
await page.waitForTimeout(450);
const core = await page.evaluate(() => window.__controlsTest.getAudio());
await page.screenshot({ path: "/workspace/screenshots/pillarF-core.png" });

await page.evaluate(() => window.__controlsTest.warp("maintenance", 80, 128));
await page.waitForTimeout(450);
const valve = await page.evaluate(() => window.__controlsTest.getAudio());
await page.screenshot({ path: "/workspace/screenshots/pillarF-valve.png" });

await page.evaluate(() => window.__controlsTest.warp("cafe", 200, 188));
await page.waitForTimeout(250);
await page.keyboard.press("e");
await page.waitForTimeout(300);
const sit = await page.evaluate(() => ({
  sitting: window.__controlsTest.getSitting(),
  audio: window.__controlsTest.getAudio(),
}));
await page.screenshot({ path: "/workspace/screenshots/pillarF-sit.png" });

await page.keyboard.press("Escape");
await page.waitForTimeout(350);
const paused = await page.evaluate(() => ({
  mode: window.__controlsTest.getMode(),
  audio: window.__controlsTest.getAudio(),
}));
await page.screenshot({ path: "/workspace/screenshots/pillarF-pause.png" });

await page.keyboard.press("Escape");
await page.waitForTimeout(200);
await page.click('[data-testid="mute"]');
await page.waitForTimeout(200);
const muted = await page.evaluate(() => window.__controlsTest.getAudio());
await page.screenshot({ path: "/workspace/screenshots/pillarF-mute.png" });

await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => window.__controlsTest.warp("cafe", 160, 176));
await page.waitForTimeout(350);
await page.screenshot({ path: "/workspace/screenshots/pillarF-mobile.png" });

console.log(
  JSON.stringify(
    {
      errors,
      cafe,
      lot: { bed: lot.bed, ctx: lot.ctx },
      plant: { bed: plant.bed },
      core: { bed: core.bed, core: core.core },
      valve: { steam: valve.steam, bed: valve.bed },
      sit: sit.sitting,
      paused: { mode: paused.mode, duck: paused.audio.duck },
      muted: muted.muted,
    },
    null,
    2,
  ),
);
await browser.close();
