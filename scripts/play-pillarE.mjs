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

await page.evaluate(() => window.__controlsTest.bootPlay());
await page.waitForTimeout(400);
await page.evaluate(() =>
  window.__controlsTest.pose({ x: 160, y: 176, facing: "down", phase: 0, moving: false, sitting: false }),
);
await page.waitForTimeout(200);
await page.screenshot({ path: "/workspace/screenshots/pillarE-idle.png" });

const frames = [];
for (let f = 0; f < 4; f++) {
  await page.evaluate(
    (frame) =>
      window.__controlsTest.pose({
        x: 176,
        y: 176,
        facing: "right",
        phase: frame + 0.05,
        moving: true,
        sitting: false,
      }),
    f,
  );
  await page.waitForTimeout(180);
  const shot = `/workspace/screenshots/pillarE-walk${f}.png`;
  await page.screenshot({ path: shot });
  frames.push(
    await page.evaluate(() => {
      const t = window.__controlsTest;
      return { moving: t.getMoving(), phase: t.getPhase(), facing: t.getFacing() };
    }),
  );
}

await page.evaluate(() => window.__controlsTest.warp("cafe", 200, 188));
await page.waitForTimeout(200);
await page.keyboard.press("e");
await page.waitForTimeout(350);
const sit = await page.evaluate(() => {
  const t = window.__controlsTest;
  return { sitting: t.getSitting(), prompt: document.body.innerText.includes("Stand"), x: t.getX(), y: t.getY() };
});
await page.screenshot({ path: "/workspace/screenshots/pillarE-sit.png" });

await page.evaluate(() =>
  window.__controlsTest.pose({ x: 160, y: 176, facing: "down", phase: 0.1, moving: false, sitting: false }),
);
await page.waitForTimeout(180);
await page.screenshot({ path: "/workspace/screenshots/pillarE-blink.png" });

await page.evaluate(() => window.__controlsTest.warp("reactor", 208, 180));
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/pillarE-core.png" });

await page.evaluate(() => window.__controlsTest.warp("maintenance", 80, 128));
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/pillarE-steam.png" });

await page.evaluate(() => window.__controlsTest.warp("cafe", 88, 150));
await page.evaluate(() => window.__controlsTest.setFlag("mabelTalked", false));
await page.waitForTimeout(350);
await page.screenshot({ path: "/workspace/screenshots/pillarE-emote.png" });

await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() =>
  window.__controlsTest.pose({ x: 176, y: 176, facing: "right", phase: 1.05, moving: true, sitting: false }),
);
await page.waitForTimeout(250);
await page.screenshot({ path: "/workspace/screenshots/pillarE-mobile.png" });

console.log(JSON.stringify({ errors, frames, sit }, null, 2));
await browser.close();
