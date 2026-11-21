/**
 * Full Night Watch nights on the production build.
 * Hooks are only the labelled setup (boot, open the desk, unlock night 3).
 * After that: real clicks. Do not force an event on.
 *
 *   node scripts/nw-prod-night.mjs http://127.0.0.1:8091
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { chromium } from "../node_modules/playwright/index.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "docs/audit/2026-11-2x-plates-fix");
const shots = join(out, "night");
mkdirSync(shots, { recursive: true });
const base = process.argv[2] ?? "http://127.0.0.1:8091/";

const esbuild = process.env.ESBUILD ?? "/usr/lib/node_modules/vercel/node_modules/esbuild/bin/esbuild";
const bundle = join(tmpdir(), "nw-model.mjs");
const entry = join(tmpdir(), "nw-model-entry.ts");
writeFileSync(entry, `export { newNight } from ${JSON.stringify(join(root, "src/game/nightwatch/model.ts"))};\n`);
const built = spawnSync(esbuild, [entry, "--bundle", "--format=esm", "--platform=node", `--outfile=${bundle}`], { encoding: "utf8" });
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const { newNight } = await import(bundle);

function plan(nightNo) {
  const n = newNight("pwr", nightNo);
  const lines = [`night ${nightNo} seed events:`];
  for (const e of n.events) lines.push(`  event ${e.def.id} visual ${e.def.visual} camera ${e.def.camera} at ${e.start} min`);
  for (const o of n.oddities) lines.push(`  oddity ${o.def.id} visual ${o.def.visual} camera ${o.def.camera} ${o.start}-${o.end}`);
  return lines;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
const failed = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("requestfailed", (r) => failed.push(`${r.failure()?.errorText ?? "failed"} ${r.url()}`));
page.on("response", (r) => {
  if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
});
await page.goto(base);
await page.waitForFunction(() => window.__controlsTest);
const T = (f, ...a) => page.evaluate(([fn, args]) => window.__controlsTest[fn](...args), [f, a]);
const z = (ms) => page.waitForTimeout(ms);

// Labelled setup: boot into play and open the desk.
await T("bootPlay");
await z(400);
await T("openDesk");
await z(800);
const home = page.locator("[data-testid='home-nightwatch']");
if (await home.count()) await home.click();
else {
  await page.locator("[data-testid='start-button']").click();
  await z(300);
  await page.getByRole("menuitem", { name: "Night Watch" }).click();
}
await z(600);

const pick = (ids) => {
  if (ids.some((i) => /^g/.test(i))) return "radiation";
  if (ids.some((i) => ["sump", "press", "pzrl", "pool", "dwp", "pool2", "moist", "cover"].includes(i))) return "leak";
  if (ids.includes("grid") || ids.includes("cold")) return "electrical";
  return "equipment";
};

async function playNight(nightNo, { cameras, watch }) {
  const log = [...plan(nightNo)];
  await page.locator(`[data-testid='night-${nightNo}']`).click();
  await z(700);
  const shift = await page.locator("[data-testid='nightwatch-shift']").count();
  log.push(`shift open: ${shift}`);
  if (!shift) {
    log.push("could not open the shift");
    return log;
  }
  const tablet = page.locator("[data-testid='nw-tablet']");
  if (await tablet.count()) await tablet.click();
  else await page.keyboard.press("Space");
  await z(500);

  if (cameras) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Performance.enable");
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const before = await cdp.send("Performance.getMetrics");
    await z(5000);
    const after = await cdp.send("Performance.getMetrics");
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    const val = (list, name) => list.metrics.find((m) => m.name === name)?.value ?? 0;
    const dt = (val(after, "Timestamp") || val(after, "TimeStamp")) - (val(before, "Timestamp") || val(before, "TimeStamp"));
    const busy = val(after, "TaskDuration") - val(before, "TaskDuration");
    const wall = dt > 0 ? dt : 5;
    log.push(`main thread at 4×, tablet up, ${wall.toFixed(2)}s window: busy ${busy.toFixed(2)}s (${((100 * busy) / wall).toFixed(0)}%)`);
    const cams = await page.locator("[data-testid^='nw-cam-']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(7)));
    for (const [k, id] of cams.entries()) {
      await page.locator(`[data-testid='nw-cam-${id}']`).click();
      await z(400);
      await page.locator("[data-testid='nw-canvas']").screenshot({ path: join(shots, `cam-${id}.png`) });
      log.push(`camera ${k + 1} ${id}`);
    }
  }

  const seen = new Set();
  const watched = new Set();
  let reports = 0;
  let shotEvent = false;
  const t0 = Date.now();
  while (Date.now() - t0 < 9.5 * 60e3) {
    if (await page.locator("[data-testid='nw-summary']").count()) break;
    const coffee = await page.locator("[data-testid='nw-coffee']").innerText();
    const bar = await page.locator("[data-testid='nw-coffee'] span span").first().evaluate((e) => parseFloat(e.style.width));
    if (bar < 14 && !coffee.includes("brewing")) {
      await page.keyboard.press("b");
      await z(200);
    }
    const clock = await page.locator("[data-testid='nw-clock']").innerText();
    const minute = clock.split(":").reduce((h, m) => Number(h) * 60 + Number(m), 0);
    if (watch) {
      for (const item of watch) {
        if (watched.has(item.visual) || minute < item.start || minute > item.end) continue;
        watched.add(item.visual);
        await page.locator(`[data-testid='nw-cam-${item.camera}']`).click();
        await z(600);
        await page.locator("[data-testid='nw-canvas']").screenshot({ path: join(shots, `night3-${item.visual}.png`) });
        log.push(`${clock} looked at ${item.camera} for ${item.visual} (screenshot, not a forced event)`);
      }
    }
    const flashing = await page.locator("[data-testid^='nw-cam-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(7)));
    if (flashing.length && !coffee.includes("brewing")) {
      const id = flashing[0];
      await page.locator(`[data-testid='nw-cam-${id}']`).click();
      await z(400);
      if (!shotEvent) {
        await page.locator("[data-testid='nw-canvas']").screenshot({ path: join(shots, `event-${id}.png`) });
        shotEvent = true;
      }
      const red = await page.locator("[data-testid^='nw-tile-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(8)));
      const key = `${id}:${red.join(",")}`;
      if (!seen.has(key)) {
        seen.add(key);
        const cat = pick(red);
        await page.locator("[data-testid='nw-report']").click();
        await z(150);
        await page.locator(`[data-testid='nw-cat-${cat}']`).click();
        await z(250);
        reports++;
        const toast = await page.locator("[data-testid='nw-toast']").innerText().catch(() => "");
        log.push(`${clock} CAM ${id} red ${red.join(",") || "(none)"} -> ${cat}: ${toast}`);
      }
    }
    await z(1200);
  }
  const sum = page.locator("[data-testid='nw-summary']");
  log.push("summary: " + ((await sum.count()) ? (await sum.innerText()).replace(/\n/g, " | ").slice(0, 1200) : "none"));
  await page.screenshot({ path: join(shots, `summary-night-${nightNo}.png`) });
  log.push(`reports ${reports}`);
  return log;
}

const night1 = await playNight(1, { cameras: true, watch: null });
// Labelled setup: night 3 stays locked until nights 1 and 2 are survived. Mark them done, then leave.
await T("setFlag", "night:1:done", true);
await T("setFlag", "night:2:done", true);
await page.locator("[data-testid='nw-summary-leave']").click().catch(() => page.locator("[data-testid='nw-leave']").click());
await z(800);

const n3 = newNight("pwr", 3);
const watch = [];
for (const e of n3.events) {
  if (["doorAjar", "chair", "hardhat"].includes(e.def.visual)) watch.push({ visual: e.def.visual, camera: e.def.camera, start: e.start, end: e.start + e.def.escalate });
}
for (const o of n3.oddities) {
  if (["doorAjar", "chair", "hardhat"].includes(o.def.visual)) watch.push({ visual: o.def.visual, camera: o.def.camera, start: o.start, end: o.end });
}
const night3 = await playNight(3, { cameras: false, watch });
await page.locator("[data-testid='nw-summary-leave']").click().catch(() => {});

const tail = [
  `page errors: ${errors.length}`,
  ...errors.slice(0, 8),
  `failed requests: ${failed.length}`,
  ...failed.slice(0, 20),
];
writeFileSync(join(out, "night1.txt"), [...night1, "", ...tail].join("\n") + "\n");
writeFileSync(join(out, "night3.txt"), [...night3, "", ...tail].join("\n") + "\n");
console.log("--- night 1 ---");
console.log(night1.join("\n"));
console.log("--- night 3 ---");
console.log(night3.join("\n"));
console.log(tail.join("\n"));
await browser.close();
if (errors.length || failed.length) process.exit(1);
