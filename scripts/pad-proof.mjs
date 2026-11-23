/**
 * A standard-mapping pad, stubbed on navigator.getGamepads.
 * Menu, settings, a day walk, pause, and one cabinet.
 *   node scripts/pad-proof.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-1c/", import.meta.url);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: "/tmp/cc-pad-proof", size: { width: 1280, height: 720 } },
});
await context.addInitScript(() => {
  const state = { axes: [0, 0, 0, 0], pressed: Array(16).fill(false) };
  window.__padState = state;
  navigator.getGamepads = () => [
    {
      id: "Proof Standard Pad",
      index: 0,
      connected: true,
      mapping: "standard",
      timestamp: performance.now(),
      axes: state.axes.slice(),
      buttons: state.pressed.map((p) => ({ pressed: !!p, value: p ? 1 : 0, touched: !!p })),
    },
  ];
});
const page = await context.newPage();
page.setDefaultTimeout(20000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));

const pulse = async (index) => {
  await page.evaluate((i) => {
    window.__padState.pressed[i] = true;
  }, index);
  await page.waitForTimeout(160);
  await page.evaluate((i) => {
    window.__padState.pressed[i] = false;
  }, index);
  await page.waitForTimeout(160);
};
const focusId = () => page.evaluate(() => document.activeElement?.getAttribute("data-testid") || "");

await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest);
await page.getByTestId("pixel-menu").waitFor();
const mapping = await page.evaluate(() => navigator.getGamepads()[0]?.mapping ?? "");
let menuFocus = "";
for (let i = 0; i < 8 && menuFocus !== "menu-settings"; i++) {
  await pulse(13);
  menuFocus = await focusId();
}
await page.screenshot({ path: new URL("menu.png", outDir).pathname });
await pulse(0);
await page.getByTestId("settings-fields").waitFor();
await page.screenshot({ path: new URL("settings.png", outDir).pathname });
await pulse(1);
await page.waitForFunction(() => !document.querySelector("[data-testid=settings-fields]"));
await page.evaluate(() => window.__controlsTest.bootPlay());
await page.waitForFunction(() => window.__controlsTest.getMode() === "play");
const x0 = await page.evaluate(() => window.__controlsTest.getX());
await page.evaluate(() => {
  window.__padState.axes[0] = 1;
});
await page.waitForTimeout(700);
const x1 = await page.evaluate(() => window.__controlsTest.getX());
await page.evaluate(() => {
  window.__padState.axes[0] = 0;
});
await page.screenshot({ path: new URL("walk.png", outDir).pathname });
await pulse(9);
await page.waitForFunction(() => window.__controlsTest.getMode() === "pause");
const paused = await page.getByTestId("pause-stage").isVisible();
await page.screenshot({ path: new URL("pause.png", outDir).pathname });
await pulse(9);
await page.waitForFunction(() => window.__controlsTest.getMode() === "play");
await page.evaluate(() => {
  window.__padKeys = [];
  window.addEventListener("keydown", (e) => window.__padKeys.push(e.code));
  window.__controlsTest.openCab("fish");
});
await page.waitForFunction(() => window.__controlsTest.getMode() === "fish");
await page.evaluate(() => {
  window.__padState.axes[0] = 1;
});
await page.waitForTimeout(400);
await page.evaluate(() => {
  window.__padState.axes[0] = 0;
});
await pulse(0);
const cabKeys = await page.evaluate(() => window.__padKeys.slice(0, 8));
const cabMode = await page.evaluate(() => window.__controlsTest.getMode());
await page.screenshot({ path: new URL("cabinet.png", outDir).pathname });

const video = page.video();
await context.close();
if (video) await video.saveAs(new URL("pad.webm", outDir).pathname);
await browser.close();

const lines = [
  `Mapping ${mapping}. Menu focus ${menuFocus}.`,
  `Walk x ${x0} to ${x1}.`,
  `Pause visible ${paused}.`,
  `Cabinet ${cabMode}. Keys ${cabKeys.join(" ")}.`,
  errors.length ? `Page errors: ${errors.join(" | ")}` : "Page errors: 0.",
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
console.log(lines.join("\n"));
const ok =
  mapping === "standard" &&
  menuFocus === "menu-settings" &&
  x1 > x0 + 5 &&
  paused &&
  cabMode === "fish" &&
  cabKeys.includes("ArrowRight") &&
  cabKeys.includes("Space") &&
  errors.length === 0;
if (!ok) process.exit(1);
