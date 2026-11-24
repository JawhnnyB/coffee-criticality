/**
 * Daily night with catches, so the board stores a grade that is not an empty F.
 *   node scripts/daily-catch.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { chromium } from "../node_modules/playwright/index.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundledDir = mkdtempSync(join(tmpdir(), "cc-daily-"));
const entry = join(bundledDir, "entry.ts");
writeFileSync(entry, `export { newNight } from ${JSON.stringify(join(root, "src/game/nightwatch/model.ts"))};\n`);
const built = spawnSync(join(root, "node_modules/esbuild/bin/esbuild"), [entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${join(bundledDir, "night.mjs")}`], { encoding: "utf8" });
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const { newNight } = await import(join(bundledDir, "night.mjs"));

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = new URL("../docs/audit/2026-11-22-value/step-45e/", import.meta.url);
mkdirSync(outDir, { recursive: true });

function planFor(seed) {
  const n = newNight("pwr", 2, seed);
  return n.events.map((e) => ({ id: e.def.id, camera: e.def.camera, start: e.start, accept: e.def.accept, tiles: Object.keys(e.def.effect) }));
}

const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(20000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));
await page.goto(`${base}?v=daily-catch`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__controlsTest);
await page.evaluate(() => {
  localStorage.removeItem("cc.daily");
  window.__controlsTest.bootPlay();
  window.__controlsTest.openDesk();
});
await page.waitForTimeout(300);
if (await page.getByTestId("home-nightwatch").count()) await page.getByTestId("home-nightwatch").click();
else {
  await page.getByTestId("start-button").click();
  await page.getByRole("menuitem", { name: "Night Watch" }).click();
}
await page.getByTestId("night-daily").waitFor();
const listed = await page.getByTestId("daily-seed").innerText();
const weekBefore = await page.evaluate(() => localStorage.getItem("cc.save.v2") || "");
const seed = Number(listed.replace(/\D/g, ""));
const plan = planFor(seed);
await page.getByTestId("night-daily").click();
await page.waitForFunction(() => typeof window.__controlsTest.setNightSpeed === "function");
await page.evaluate(() => window.__controlsTest.setNightSpeed(6));
await page.keyboard.press(" ");
const logged = {};
const t0 = Date.now();
while (Date.now() - t0 < 200000) {
  if (await page.getByTestId("nw-summary").count()) break;
  const bar = await page.locator("[data-testid='nw-coffee'] span span").first().evaluate((e) => parseFloat(e.style.width)).catch(() => 80);
  const coffee = await page.getByTestId("nw-coffee").innerText();
  if (bar < 16 && !coffee.includes("brewing") && !coffee.includes("0 pot")) {
    await page.keyboard.press("b");
    await page.waitForTimeout(80);
    continue;
  }
  if (coffee.includes("brewing")) {
    await page.waitForTimeout(120);
    continue;
  }
  const flashing = await page.locator("[data-testid^='nw-cam-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(7)));
  if (!flashing.length) {
    await page.waitForTimeout(70);
    continue;
  }
  const id = flashing[0];
  const minute = await page.getByTestId("nw-clock").innerText();
  const m = minute.match(/(\d+):(\d+)/);
  const at = m ? Number(m[1]) * 60 + Number(m[2]) : 0;
  const red = await page.locator("[data-testid^='nw-tile-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(8)));
  const due = plan
    .filter((e) => e.camera === id && at + 1 >= e.start && logged[e.id] == null && e.tiles.length)
    .sort((a, b) => b.tiles.filter((t) => red.includes(t)).length - a.tiles.filter((t) => red.includes(t)).length)[0];
  if (!due || due.tiles.filter((t) => red.includes(t)).length === 0) {
    await page.waitForTimeout(70);
    continue;
  }
  await page.getByTestId(`nw-cam-${id}`).click();
  await page.waitForTimeout(70);
  const report = page.getByTestId("nw-report");
  if (!(await report.isEnabled().catch(() => false))) {
    await page.keyboard.press(" ");
    await page.waitForTimeout(70);
  }
  if (await report.isEnabled().catch(() => false)) {
    await report.click();
    await page.waitForTimeout(50);
    const cat = page.getByTestId(`nw-cat-${due.accept[0]}`);
    if (await cat.isEnabled().catch(() => false)) {
      await cat.click();
      logged[due.id] = at;
    }
  }
  await page.waitForTimeout(50);
}
await page.getByTestId("nw-summary").waitFor({ timeout: 8000 });
const grade = (await page.getByTestId("nw-grade").innerText()).trim();
const head = (await page.locator("[data-testid='nw-summary'] p").first().innerText()).trim();
const stat = await page.locator("[data-testid='nw-summary'] p").evaluateAll((els) => els.map((e) => e.textContent || "").find((t) => t.includes("Caught")) || "");
await page.getByTestId("nw-summary-leave").click();
await page.getByTestId("daily-board").waitFor();
const board = (await page.getByTestId("daily-board").innerText()).replace(/\n/g, " ");
const saved = await page.evaluate(() => ({ daily: localStorage.getItem("cc.daily") || "", week: localStorage.getItem("cc.save.v2") || "" }));
await browser.close();
const lines = [
  `App. ${listed}`,
  `Plan. ${plan.map((e) => `${e.id}@${e.start}:${e.accept[0]}`).join(", ")}`,
  `Turnover. ${grade}. ${head}`,
  `Stat. ${stat}`,
  `Board. ${board}`,
  `Saved. ${saved.daily}`,
  saved.week === weekBefore ? "Week save unchanged." : "Week save changed.",
  saved.week.includes("night:2:done") ? "Week save gained night:2." : "Week save has no night:2.",
  `Page errors ${errors.length}.`,
];
writeFileSync(new URL("result.txt", outDir), lines.join("\n") + "\n");
console.log(lines.join("\n"));
const letter = (grade.match(/[A-F]/) || [""])[0];
const caught = Number((stat.match(/Caught (\d+)/) || [])[1] ?? 0);
if (caught < 1) process.exit(2);
if (letter === "F" && /emergency|takes the chair/i.test(head)) process.exit(3);
if (!letter || !saved.daily.includes(`"${letter}"`)) process.exit(4);
if (board.includes("No score yet")) process.exit(5);
if (saved.week !== weekBefore) process.exit(6);
if (errors.length) process.exit(7);
