/**
 * Nights 2 and 3, one pot, 1×, seed 1, R10 sweeper.
 * The careful model (tablet up, brew only when the cup is nearly empty) is
 * graded first. The browser run is the sweeper from value-week.mjs, at 1×.
 * Shots land in /tmp until the browser closes, so Vite does not reload the night.
 *   PW_CHROME=... node scripts/step-60b-proof.mjs http://127.0.0.1:8080/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "../node_modules/playwright/index.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv[2] ?? "http://127.0.0.1:8080/";
const scratch = join(tmpdir(), "cc-60b");
mkdirSync(scratch, { recursive: true });
const beat = (line) => {
  writeFileSync(join(scratch, "heartbeat.txt"), `${new Date().toISOString()} ${line}\n`);
  console.log(line);
};

function carefulGrades() {
  const dir = join(scratch, "bundle");
  mkdirSync(dir, { recursive: true });
  const entry = join(dir, "entry.ts");
  writeFileSync(entry, `export * from ${JSON.stringify(join(root, "src/game/nightwatch/model.ts"))};\n`);
  const out = join(dir, "model.mjs");
  const built = spawnSync(process.env.ESBUILD ?? join(root, "node_modules/.bin/esbuild"), [entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
    encoding: "utf8",
    cwd: root,
  });
  if (built.status !== 0) throw new Error(built.stderr || built.stdout);
  return out;
}

const modelUrl = carefulGrades();
const W = await import(modelUrl);

function ownAlarm(n, e) {
  if (n.minute < e.start || e.caughtAt !== null || e.doneAt !== null) return false;
  if (!Object.keys(e.def.effect).length) return false;
  const a = W.alarms({ ...n, events: [e] });
  return Object.keys(e.def.effect).some((id) => a.includes(id));
}

/** Same cup policy as step 60: brew on a quiet minute once the cup is under about ten minutes. */
function careful(site, night, seed) {
  const n = W.newNight(site, night, seed);
  W.setTablet(n, true);
  let emptyMin = 0;
  let missed = 0;
  while (!n.over) {
    const hot = n.events.find((e) => ownAlarm(n, e));
    const per = (n.tablet ? W.COFFEE.tablet : W.COFFEE.desk) * (n.drain || 1);
    if (n.brewing === 0 && n.brewsLeft > 0 && n.coffee <= per * 10 && !hot) W.brew(n);
    if (n.brewing === 0 && n.coffee > 0 && !n.tablet) W.setTablet(n, true);
    const see = n.brewing === 0 && n.coffee > 0;
    if (hot && see) {
      n.camera = hot.def.camera;
      W.report(n, hot.def.accept[0]);
    } else if (hot) missed += 1;
    if (n.coffee === 0 && n.brewing === 0) emptyMin += 1;
    if (n.over) break;
    W.tick(n, 1);
  }
  const g = W.grade(n);
  return { letter: g.letter, points: g.points, coffee: Math.round(n.coffee * 10) / 10, emptyMin, missed, brewed: (W.nightPlan(night).brews ?? 1) - n.brewsLeft, left: n.brewsLeft, falseReports: n.falseReports, why: n.over?.why ?? "" };
}

const modelLines = [];
let modelWorse = false;
for (const site of ["pwr", "bwr", "pebble", "msr"]) {
  for (const seed of [1, 3, 7]) {
    for (const night of [2, 3]) {
      const r = careful(site, night, seed);
      const line = `model ${site} night ${night} seed ${seed}: ${r.points} ${r.letter} coffee ${r.coffee} empty ${r.emptyMin} missed ${r.missed} left ${r.left} false ${r.falseReports} ${r.why}`;
      modelLines.push(line);
      if (r.letter === "D" || r.letter === "F") modelWorse = true;
    }
  }
}
beat(`model worse than C: ${modelWorse}`);
for (const line of modelLines) beat(line);

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

const browser = await chromium.launch({
  ...(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {}),
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});

async function sweepNight(page) {
  await page.waitForFunction(() => typeof window.__controlsTest.setNightSpeed === "function", { timeout: 20000 });
  await page.evaluate(() => window.__controlsTest.setNightSpeed(1));
  const pots = (await page.locator("[data-testid='nw-coffee']").innerText()).replace(/\s+/g, " ").trim();
  const footer = await page.evaluate(() => {
    const el = document.querySelector("[data-testid='nightwatch-shift']");
    const host = el?.parentElement;
    return (host?.innerText || "").replace(/\s+/g, " ").slice(-80);
  });
  beat(`shift open pots="${pots}" footer="${footer}"`);
  const z = (ms) => page.waitForTimeout(ms);
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
  const baseLine = {};
  const logged = {};
  let ci = 0;
  let lastBeat = 0;
  let lastMinute = -1;
  const t0 = Date.now();
  const budget = 16 * 60 * 1000;
  while (Date.now() - t0 < budget) {
    try {
      if (await page.locator("[data-testid='plant-phone']").count()) {
        return { grade: "crash", stat: "plant phone", head: "", reason: "plant phone", pots, footer, ms: Date.now() - t0 };
      }
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
      if (Date.now() - lastBeat > 20000 || (minute >= 0 && minute - lastMinute >= 30)) {
        lastBeat = Date.now();
        lastMinute = minute;
        const falseText = await page.locator("[data-testid='nw-false']").innerText().catch(() => "");
        beat(`t ${Math.round((Date.now() - t0) / 1000)}s clock ${minute} ${coffee.replace(/\s+/g, " ").trim()} ${falseText.replace(/\s+/g, " ").trim()}`);
      }
      const flashing = await page.locator("[data-testid^='nw-cam-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(7)));
      if (flashing.length) {
        const id = flashing[0];
        if (logged[id] == null || minute - logged[id] > 40) {
          const red = await page.locator("[data-testid^='nw-tile-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(8)));
          if ((await report(id, pick(red))) === "logged") {
            logged[id] = minute;
            baseLine[id] = null;
          }
        }
      }
      const id = cams[ci++ % cams.length];
      const camBtn = page.locator(`[data-testid='nw-cam-${id}']`);
      if (!(await camBtn.isEnabled().catch(() => false))) {
        await z(40);
        continue;
      }
      if (logged[id] != null && minute - logged[id] <= 40) {
        await camBtn.click({ timeout: 4000 }).catch(() => {});
        await z(480);
        baseLine[id] = await thumb();
        continue;
      }
      await camBtn.click({ timeout: 4000 });
      await z(480);
      const now = await thumb();
      if (baseLine[id] && diff(baseLine[id], now) >= 8) {
        const red = await page.locator("[data-testid^='nw-tile-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(8)));
        const cat = red.length ? pick(red) : id === "aux" ? "access" : id === "pool" ? "foreign" : "equipment";
        if ((await report(id, cat)) === "logged") logged[id] = minute;
      }
      baseLine[id] = await thumb();
    } catch (err) {
      if (await page.locator("[data-testid='nw-summary']").count().catch(() => 0)) break;
      beat(`loop ${String(err).slice(0, 160)}`);
      await z(80);
    }
  }
  const coffeeEnd = await page.locator("[data-testid='nw-coffee']").innerText().then((t) => t.replace(/\s+/g, " ").trim()).catch(() => "");
  const gradeText = await page.locator("[data-testid='nw-grade']").evaluate((e) => e.textContent || "").catch(() => "none");
  const paras = await page.locator("[data-testid='nw-summary'] p").evaluateAll((els) => els.map((e) => e.textContent || "")).catch(() => []);
  const head = (paras[0] || "").trim();
  const stat = (paras.find((t) => t.includes("false")) || paras[1] || "").trim();
  const seedLine = await page.locator("[data-testid='nw-seed']").innerText().catch(() => "");
  let reason = "";
  if (/F/.test(gradeText) || /D/.test(gradeText) || gradeText === "none" || gradeText === "crash") {
    let why = "score";
    if (/emergency/i.test(head)) why = "trip";
    else if (/Elena takes/i.test(head)) why = "relieved";
    else if (/missed [1-9]/.test(stat)) why = "misses";
    else if (gradeText === "none") why = "no turnover";
    reason = `${why}. ${head} ${stat}`.replace(/\s+/g, " ").trim();
  }
  return { grade: gradeText, stat, head, reason, pots, footer, coffeeEnd, seedLine, ms: Date.now() - t0 };
}

const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
await page.addInitScript(() => {
  localStorage.setItem("cc.settings", JSON.stringify({ nightPace: "standard", frameRate: "60" }));
  for (const k of ["cc.save.v1", "cc.save.v2", "cc.save.v2.1", "cc.save.v2.2", "cc.save.v2.3"]) localStorage.removeItem(k);
});
const browserLines = [];
try {
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => window.__controlsTest && window.__controlsTest.bootPlay, { timeout: 25000 });
  await page.evaluate(() => {
    window.__controlsTest.bootPlay();
    window.__controlsTest.setFlag("night:1:done", true);
    window.__controlsTest.setFlag("rot:reported", true);
    window.__controlsTest.setFlag("rot:nights", true);
  });
  for (const night of [2, 3]) {
    const opener = page.getByTestId("night-opener");
    await opener.waitFor({ timeout: 15000 });
    const head = (await opener.locator("p").first().innerText()).replace(/\s+/g, " ").trim();
    beat(`opener ${head}`);
    if (!new RegExp(`Night ${night}\\b`).test(head)) throw new Error(`expected night ${night}, saw ${head}`);
    await page.evaluate(() => window.__controlsTest.setNightSeed(1));
    await page.getByTestId("start-night").click();
    const result = await sweepNight(page);
    browserLines.push(`browser night ${night} ${JSON.stringify(result)}`);
    beat(browserLines.at(-1));
    await page.screenshot({ path: join(scratch, `night-${night}-turnover.png`) });
    const letter = (result.grade.match(/[ABCDF]/) || ["none"])[0];
    const worse = letter === "D" || letter === "F" || letter === "none";
    if (worse && night === 2) {
      await page.evaluate(() => window.__controlsTest.setFlag("night:2:done", true));
      browserLines.push("night 2 was not a pass, so the proof set night:2:done to reach night 3");
      beat(browserLines.at(-1));
    }
    const leave = page.getByTestId("nw-summary-leave");
    if (await leave.count()) await leave.click();
    else browserLines.push(`night ${night} no leave button`);
    await page.waitForTimeout(400);
  }
} catch (err) {
  errors.push(String(err).slice(0, 500));
  beat(`ERR ${errors.at(-1)}`);
  await page.screenshot({ path: join(scratch, "error.png") }).catch(() => {});
} finally {
  await browser.close();
}

const report = [
  `model worse than C: ${modelWorse}`,
  ...modelLines,
  ...browserLines,
  ...errors.map((e) => `ERR ${e}`),
].join("\n") + "\n";
writeFileSync(join(scratch, "result.txt"), report);
console.log(report);
if (errors.length) process.exit(1);
