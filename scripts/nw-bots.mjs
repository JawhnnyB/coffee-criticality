/**
 * Night rotation bots at 8×. Labelled setup reaches one night. After that: real clicks.
 *   node scripts/nw-bots.mjs http://127.0.0.1:8092
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8092/";
const outDir = new URL("../docs/audit/2026-11-21-rotation/", import.meta.url);
const rows = [];
const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});

const pick = (ids) => {
  if (ids.includes("grid") || ids.includes("cold")) return "electrical";
  if (ids.some((i) => /^g/.test(i))) return "radiation";
  if (ids.some((i) => ["sump", "press", "pzrl", "pool", "dwp", "pool2", "moist", "cover"].includes(i))) return "leak";
  return "equipment";
};
const mins = (text) => {
  const m = String(text).match(/(\d+):(\d+)/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : -1;
};

async function play(policy, seed, nightNo) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  const z = (ms) => page.waitForTimeout(ms);
  await page.goto(base);
  await page.waitForFunction(() => window.__controlsTest);
  const T = (f, ...a) => page.evaluate(([fn, args]) => window.__controlsTest[fn](...args), [f, a]);
  await T("bootPlay");
  await z(200);
  await T("setFlag", "rot:nights", true);
  await T("setFlag", "rot:reported", true);
  for (let i = 1; i < nightNo; i++) await T("setFlag", `night:${i}:done`, true);
  await T("setNightSeed", seed);
  await T("warp", "gate", 200, 200);
  await z(400);
  await page.locator("[data-testid='start-night']").click();
  await page.waitForFunction(() => typeof window.__controlsTest.setNightSpeed === "function");
  await T("setNightSpeed", 8);
  const cams = await page.locator("[data-testid^='nw-cam-']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(7)));
  const thumb = () =>
    page.evaluate(() => {
      const c = document.querySelector("[data-testid='nw-canvas']");
      if (!c) return null;
      const t = document.createElement("canvas");
      t.width = 32;
      t.height = 18;
      const g = t.getContext("2d");
      g.drawImage(c, 0, 0, 32, 18);
      return Array.from(g.getImageData(0, 0, 32, 18).data.filter((_, i) => i % 4 !== 3));
    });
  const diff = (a, b) => {
    if (!a || !b) return 0;
    let n = 0;
    for (let i = 0; i < a.length; i += 3) {
      const d = (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2])) / 3;
      if (d > 22) n++;
    }
    return n;
  };
  const baseLine = {};
  const logged = {};
  let ci = 0;
  const report = async (id, cat) => {
    try {
      await page.locator(`[data-testid='nw-cam-${id}']`).click({ timeout: 4000 });
      await z(120);
      const btn = page.locator("[data-testid='nw-report']");
      if (!(await btn.isEnabled().catch(() => false))) {
        await page.keyboard.press(" ");
        await z(100);
      }
      if (!(await btn.isEnabled().catch(() => false))) return "fail";
      await btn.click({ timeout: 4000 });
      await z(80);
      const catBtn = page.locator(`[data-testid='nw-cat-${cat}']`);
      if (!(await catBtn.isEnabled().catch(() => false))) return "fail";
      await catBtn.click({ timeout: 4000 });
      await z(80);
      const toast = await page.locator("[data-testid='nw-toast']").innerText().catch(() => "");
      if (/false report/i.test(toast)) return "false";
      if (/logged/i.test(toast)) return "logged";
      return "false";
    } catch {
      return "fail";
    }
  };
  const t0 = Date.now();
  while (Date.now() - t0 < 180000) {
    try {
    if (await page.locator("[data-testid='nw-summary']").count()) break;
    const coffee = await page.locator("[data-testid='nw-coffee']").innerText();
    const bar = await page.locator("[data-testid='nw-coffee'] span span").first().evaluate((e) => parseFloat(e.style.width)).catch(() => 80);
    if (bar < 16 && !coffee.includes("brewing") && !coffee.includes("0 pot")) {
      await page.keyboard.press("b");
      await z(80);
      continue;
    }
    if ((await page.locator("[data-testid='nw-coffee']").innerText()).includes("brewing")) {
      await z(150);
      continue;
    }
    const minute = mins(await page.locator("[data-testid='nw-clock']").innerText());
    const flashing = await page.locator("[data-testid^='nw-cam-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(7)));
    if (flashing.length) {
      const id = flashing[0];
      if (logged[id] == null || minute - logged[id] > 40) {
        const red = await page.locator("[data-testid^='nw-tile-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(8)));
        const result = await report(id, pick(red));
        if (result === "logged") {
          logged[id] = minute;
          baseLine[id] = null;
        }
      }
      if (policy === "flash") {
        await z(100);
        continue;
      }
    }
    if (policy === "sweep") {
      const id = cams[ci++ % cams.length];
      const camBtn = page.locator(`[data-testid='nw-cam-${id}']`);
      if (!(await camBtn.isEnabled().catch(() => false))) {
        await z(40);
        continue;
      }
      if (logged[id] != null && minute - logged[id] <= 40) {
        // Still look, so the baseline follows the crew clearing the event. Do not file.
        await camBtn.click({ timeout: 4000 }).catch(() => {});
        await z(480);
        baseLine[id] = await thumb();
        continue;
      }
      await camBtn.click({ timeout: 4000 });
      // The feed is static for a third of a second after a switch. A settled frame is the look.
      await z(480);
      const now = await thumb();
      if (baseLine[id] && diff(baseLine[id], now) >= 8) {
        const red = await page.locator("[data-testid^='nw-tile-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(8)));
        const cat = red.length ? pick(red) : id === "aux" ? "access" : id === "pool" ? "foreign" : "equipment";
        const result = await report(id, cat);
        if (result === "logged") logged[id] = minute;
      }
      baseLine[id] = await thumb();
      continue;
      continue;
    }
    await z(200);
    } catch (err) {
      errors.push(String(err).slice(0, 140));
      if (await page.locator("[data-testid='nw-summary']").count().catch(() => 0)) break;
      await z(80);
    }
  }
  const paras = await page.locator("[data-testid='nw-summary'] p").evaluateAll((els) => els.map((e) => e.textContent || "")).catch(() => []);
  const stat = paras.find((t) => t.includes("false reports")) || "";
  const gradeText = await page.locator("[data-testid='nw-grade']").evaluate((e) => e.textContent || "").catch(() => "");
  const clock = await page.locator("[data-testid='nw-clock']").innerText().catch(() => "");
  const grade = (gradeText.match(/Grade ([A-F])/) || [])[1] ?? "timeout";
  const early = Number((stat.match(/\((\d+) early\)/) || [])[1] ?? 0);
  const missed = Number((stat.match(/missed (\d+)/) || [])[1] ?? 0);
  const falses = Number((stat.match(/false reports (\d+)/) || [])[1] ?? 0);
  const row = { policy, seed, night: nightNo, grade, early, missed, falses, errors: errors.length, clock, ms: Date.now() - t0 };
  console.log(JSON.stringify(row));
  rows.push(row);
  await page.close().catch(() => {});
}

const seeds = [1, 2];
const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
if (only) {
  await play(only[0], Number(only[1]), Number(only[2]));
} else {
for (const policy of ["flash", "sweep"]) {
  for (const seed of seeds) {
    for (let night = 1; night <= 4; night++) {
      try {
        await play(policy, seed, night);
      } catch (err) {
        const row = { policy, seed, night, grade: "error", early: 0, missed: 0, falses: 0, errors: 1, clock: String(err).slice(0, 180), ms: 0 };
        console.log(JSON.stringify(row));
        rows.push(row);
      }
    }
  }
}
}
const rank = { A: 4, B: 3, C: 2, D: 1, F: 0, timeout: 0 };
const avg = (list) => list.reduce((s, r) => s + (rank[r.grade] ?? 0), 0) / list.length;
const flash = rows.filter((r) => r.policy === "flash");
const sweep = rows.filter((r) => r.policy === "sweep");
const falseAvg = rows.reduce((s, r) => s + r.falses, 0) / rows.length;
const lines = [
  "# Bot table",
  "",
  "8× clock. Labelled setup opens one night. The rest is clicks.",
  "",
  "| Policy | Seed | Night | Grade | Early | Missed | False |",
  "| --- | ---: | ---: | --- | ---: | ---: | ---: |",
  ...rows.map((r) => `| ${r.policy} | ${r.seed} | ${r.night} | ${r.grade} | ${r.early} | ${r.missed} | ${r.falses} |`),
  "",
  `Flash average rank ${avg(flash).toFixed(2)} (C is 2; target C or worse).`,
  `Sweeper average rank ${avg(sweep).toFixed(2)} (B is 3; target B or better).`,
  `False reports per night ${falseAvg.toFixed(2)} (target 1 or fewer).`,
  "",
];
mkdirSync(outDir, { recursive: true });
writeFileSync(new URL("bots.md", outDir), lines.join("\n"));
console.log(lines.join("\n"));
await browser.close();
