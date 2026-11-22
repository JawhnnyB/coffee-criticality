/**
 * The menu names the save. Real reload, then read the line. No Continue needed.
 *   node scripts/save-note.mjs http://127.0.0.1:8092/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8092/";
const out = new URL("../docs/audit/2026-11-22-value/step-03/", import.meta.url);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--disable-background-timer-throttling"] });

function expectNote(data) {
  const d = new Date(data.savedAt);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const flags = data.flags ?? {};
  let where = `Day ${data.day}`;
  if (flags["rot:dawn"] || flags["rot:complete"]) where = "Dawn";
  else if (flags["rot:nights"]) {
    let n = 0;
    while (flags[`night:${n + 1}:done`]) n += 1;
    where = `Night ${Math.min(4, n + 1)}`;
  }
  return `Saved ${hh}:${mm}, ${where}`;
}

async function once(name, setup) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(base);
  await page.waitForFunction(() => window.__controlsTest);
  const T = (f, ...a) => page.evaluate(([fn, args]) => window.__controlsTest[fn](...args), [f, a]);
  await T("bootPlay");
  await setup(T);
  if (!(await T("save"))) throw new Error(`${name}: save refused`);
  await page.reload();
  await page.waitForFunction(() => window.__controlsTest);
  const boot = page.locator("[data-testid='boot-log']");
  if (await boot.count()) await boot.click({ timeout: 2000 }).catch(() => {});
  const note = (await page.locator("[data-testid='save-note']").innerText()).trim();
  const want = await page.evaluate(expectNote, await page.evaluate(() => JSON.parse(localStorage.getItem("cc.save.v2"))));
  await page.screenshot({ path: new URL(`${name}.png`, out).pathname });
  await page.close();
  if (note !== want) throw new Error(`${name}: menu said "${note}", save says "${want}"`);
  if (errors.length) throw new Error(`${name}: ${errors.join(" | ")}`);
  console.log(name, note);
  return note;
}

const day = await once("day", async () => {});
const night = await once("night", async (T) => {
  await T("setFlag", "rot:nights", true);
  await T("setFlag", "rot:reported", true);
  await T("setFlag", "night:1:done", true);
});
const dawn = await once("dawn", async (T) => {
  await T("setFlag", "rot:nights", true);
  await T("setFlag", "rot:dawn", true);
  await T("setFlag", "rot:complete", true);
});
if (!day.endsWith("Day 1") || !night.endsWith("Night 2") || !dawn.endsWith("Dawn")) {
  throw new Error(`labels ${day} | ${night} | ${dawn}`);
}
writeFileSync(new URL("result.json", out), JSON.stringify({ day, night, dawn }, null, 2) + "\n");
await browser.close();
console.log("PASS");
