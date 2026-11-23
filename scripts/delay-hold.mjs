/**
 * Delay rods stop while paused, and left follows the bind.
 *   node scripts/delay-hold.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-1d/", import.meta.url);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(20000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest);
await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem("cc.settings") || "{}");
  raw.binds = {
    up: "KeyW",
    down: "KeyS",
    left: "KeyF",
    right: "KeyD",
    interact: "KeyE",
    peer: "KeyP",
    report: "KeyR",
    hide: "KeyH",
    confirm: "Space",
  };
  localStorage.setItem("cc.settings", JSON.stringify(raw));
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest);
await page.evaluate(() => window.__controlsTest.bootPlay());
await page.waitForFunction(() => window.__controlsTest.getMode() === "play");
await page.evaluate(() => window.__controlsTest.openCab("delay"));
await page.waitForFunction(() => window.__controlsTest.getMode() === "delay");
await page.getByRole("button", { name: "Hold the slope" }).click();
await page.locator("canvas[data-cab-w]").waitFor();
await page.waitForTimeout(150);

const slide = await page.evaluate(async () => {
  const edge = () => {
    const c = document.querySelector("canvas[data-cab-w]");
    if (!c) return -1;
    const copy = document.createElement("canvas");
    copy.width = c.width;
    copy.height = c.height;
    const g = copy.getContext("2d");
    if (!g) return -1;
    g.drawImage(c, 0, 0);
    const img = g.getImageData(0, 0, copy.width, copy.height).data;
    let best = -1;
    let bestH = 0;
    for (let x = 0; x < copy.width; x += 2) {
      let run = 0;
      let maxRun = 0;
      for (let y = 0; y < copy.height; y += 2) {
        const i = (y * copy.width + x) * 4;
        if (img[i] === 22 && img[i + 1] === 17 && img[i + 2] === 13) {
          run += 2;
          if (run > maxRun) maxRun = run;
        } else run = 0;
      }
      if (maxRun > bestH) {
        bestH = maxRun;
        best = x;
      }
    }
    return best;
  };
  const tap = async (code) => {
    const down = new KeyboardEvent("keydown", { code, key: code.slice(3).toLowerCase(), bubbles: true });
    window.dispatchEvent(down);
    const seen = [edge()];
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => requestAnimationFrame(r));
      seen.push(edge());
    }
    window.dispatchEvent(new KeyboardEvent("keyup", { code, key: code.slice(3).toLowerCase(), bubbles: true }));
    return seen;
  };
  const f = await tap("KeyF");
  const a = await tap("KeyA");
  return { f, a };
});

await page.keyboard.press("Escape");
await page.getByTestId("hold-pause").waitFor();
const mode = await page.evaluate(() => window.__controlsTest.getMode());
const hash = () =>
  page.evaluate(() => {
    const c = document.querySelector("canvas[data-cab-w]");
    const copy = document.createElement("canvas");
    copy.width = c.width;
    copy.height = c.height;
    const g = copy.getContext("2d");
    g.drawImage(c, 0, 0);
    const d = g.getImageData(0, 0, copy.width, copy.height).data;
    let h = 0;
    for (let i = 0; i < d.length; i += 64) h = (h * 33 + d[i] + d[i + 1]) | 0;
    return h;
  });
const still1 = await hash();
await page.waitForTimeout(450);
const still2 = await hash();
await page.getByTestId("hold-resume").click();
await page.waitForTimeout(350);
const moved = await hash();
await browser.close();

const drop = Math.min(...slide.f) - slide.f[0];
let aEnd = slide.a.length;
for (let i = 1; i < slide.a.length; i++) {
  if (Math.abs(slide.a[i] - slide.a[i - 1]) > 40) {
    aEnd = i;
    break;
  }
}
const aHeld = slide.a.slice(0, aEnd);
const drift = Math.max(...aHeld) - Math.min(...aHeld);
const lines = [
  `F samples ${slide.f.join(" ")}.`,
  `A samples ${slide.a.join(" ")}. Held ${aHeld.join(" ")}.`,
  `Paused mode ${mode}. Canvas ${still1} then ${still2}. After resume ${moved}.`,
  errors.length ? `Page errors: ${errors.join(" | ")}` : "Page errors: 0.",
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
console.log(lines.join("\n"));
const ok =
  slide.f[0] > 0 &&
  drop < -8 &&
  drift <= 4 &&
  mode === "delay" &&
  still1 === still2 &&
  moved !== still2 &&
  errors.length === 0;
if (!ok) process.exit(1);
