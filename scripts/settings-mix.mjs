/**
 * Volume, text size, reduced motion, and screen shake.
 *   node scripts/settings-mix.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-14/", import.meta.url);
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
await page.getByTestId("menu-settings").click();
await page.getByTestId("fps-30").click();
await page.getByTestId("vol-master").fill("0.4");
await page.getByTestId("vol-music").fill("0");
await page.getByTestId("vol-sound").fill("0.6");
await page.getByTestId("vol-ambience").fill("0.25");
await page.getByTestId("text-large").click();
await page.getByTestId("reduced-motion-global").click();
await page.getByTestId("shake-toggle").click();
await page.waitForTimeout(150);
const fromMenu = await page.evaluate(() => ({
  store: localStorage.getItem("cc.settings"),
  text: document.documentElement.dataset.text,
  motion: document.documentElement.dataset.motion || "",
}));
await page.evaluate(() => window.__controlsTest.bootPlay());
await page.waitForFunction(() => window.__controlsTest.getMode() === "play");
await page.keyboard.press("Escape");
await page.getByTestId("settings-fields").waitFor();
const fromPause = await page.evaluate(() => ({
  master: document.querySelector("[data-testid=vol-master]").value,
  music: document.querySelector("[data-testid=vol-music]").value,
  sound: document.querySelector("[data-testid=vol-sound]").value,
  ambience: document.querySelector("[data-testid=vol-ambience]").value,
  text: document.documentElement.dataset.text,
  motion: document.documentElement.dataset.motion || "",
  shake: document.querySelector("[data-testid=shake-toggle]").textContent,
}));
await page.getByTestId("pause-new-week").click();
await page.getByTestId("wipe-confirm-yes").click();
await page.waitForTimeout(400);
const afterWeek = await page.evaluate(() => localStorage.getItem("cc.settings"));
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest);
await page.waitForTimeout(200);
const afterReload = await page.evaluate(() => ({
  store: localStorage.getItem("cc.settings"),
  text: document.documentElement.dataset.text || "",
  motion: document.documentElement.dataset.motion || "",
}));
await browser.close();

const lines = [
  `Menu. Store ${fromMenu.store}. Text ${fromMenu.text}. Motion ${fromMenu.motion || "off"}.`,
  `Pause. Master ${fromPause.master}. Music ${fromPause.music}. Sound ${fromPause.sound}. Ambience ${fromPause.ambience}. Text ${fromPause.text}. Motion ${fromPause.motion || "off"}. Shake ${fromPause.shake}.`,
  `New week. Store ${afterWeek}.`,
  `Reload. Store ${afterReload.store}. Text ${afterReload.text || "unset"}. Motion ${afterReload.motion || "off"}.`,
  errors.length ? `Page errors: ${errors.join(" | ")}` : "Page errors: 0.",
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
console.log(lines.join("\n"));
const saved = JSON.parse(fromMenu.store);
const kept = JSON.parse(afterWeek);
const re = JSON.parse(afterReload.store);
const ok =
  saved.frameRate === "30" &&
  saved.master === 0.4 &&
  saved.music === 0 &&
  saved.sound === 0.6 &&
  saved.ambience === 0.25 &&
  saved.text === "large" &&
  saved.reducedMotion === true &&
  saved.shake === false &&
  fromMenu.text === "large" &&
  fromMenu.motion === "reduce" &&
  fromPause.master === "0.4" &&
  fromPause.shake === "Screen shake off" &&
  kept.master === 0.4 &&
  kept.frameRate === "30" &&
  re.text === "large" &&
  re.shake === false &&
  errors.length === 0;
if (!ok) process.exit(1);
