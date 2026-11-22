// The night rotation, end to end, on Grok's g/rotation-nights build.
// Setup with hooks (labelled): bootPlay, then beginEnding to reach the week's ending screen.
// After that: real clicks and keys only. Policy "flash": react only to flashing cameras and red tiles.
// Policy "sweep": the same, plus cycle every camera and report a camera that changed since its first look.
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
const [policy = "flash", size = "1280x720", tag = policy] = process.argv.slice(2);
const [w, h] = size.split("x").map(Number);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: w, height: h } });
const p = await ctx.newPage();
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
const log = (...a) => console.log(`[${tag}]`, ...a);
await p.goto("http://127.0.0.1:8092/"); await p.waitForFunction(() => window.__controlsTest);
const T = (f, ...a) => p.evaluate(([f, a]) => window.__controlsTest[f](...a), [f, a]);
const z = (ms) => p.waitForTimeout(ms);
// --- labelled setup
await T("bootPlay"); await z(300); await T("beginEnding"); await z(1200);
// Walk the lot for real (the ending needs about 2 s of walking), then the close-shift prompt.
await p.keyboard.down("ArrowRight"); await z(1500); await p.keyboard.up("ArrowRight"); await p.keyboard.down("ArrowUp"); await z(1500); await p.keyboard.up("ArrowUp");
await p.locator("[data-testid='close-shift']").click(); await z(1200);
log("ending screen:", await p.locator("[data-testid='paper-ending']").count(), "rotate button:", await p.locator("[data-testid='rotate-nights']").count());
await p.screenshot({ path: `shots/rot-${tag}-0-ending.png` });
// --- real input from here
await p.locator("[data-testid='rotate-nights']").click(); await z(500);
log("days off:", await p.locator("[data-testid='days-off']").count());
await p.screenshot({ path: `shots/rot-${tag}-1-daysoff.png` });
await p.locator("[data-testid='report-nights']").click(); await z(400);
log("opener:", (await p.locator("[data-testid='night-opener']").innerText()).replace(/\n/g, " | "));
await p.screenshot({ path: `shots/rot-${tag}-2-opener.png` });
await p.locator("[data-testid='start-night']").click(); await z(800);
log("shift open:", await p.locator("[data-testid='nightwatch-shift']").count());
await p.keyboard.press("Space"); await z(400);
const pick = (ids) => {
  if (ids.some((i) => /^g/.test(i))) return "radiation";
  if (ids.some((i) => ["sump", "press", "pzrl", "pool", "dwp", "pool2", "moist", "cover"].includes(i))) return "leak";
  if (ids.includes("grid") || ids.includes("cold")) return "electrical";
  return "equipment";
};
const cams = await p.locator("[data-testid^='nw-cam-']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(7)));
log("cameras:", cams.join(","));
// A 32x18 thumbnail of the feed: grain, scanlines and the rolling bar average out at this size.
const thumb = () => p.evaluate(() => {
  const c = document.querySelector("[data-testid='nw-canvas']"); const t = document.createElement("canvas"); t.width = 32; t.height = 18;
  const g = t.getContext("2d"); g.drawImage(c, 0, 0, 32, 18); return Array.from(g.getImageData(0, 0, 32, 18).data.filter((_, i) => i % 4 !== 3));
});
const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 3) { const d = (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2])) / 3; if (d > 22) n++; } return n; };
const base = {}; const reported = new Set(); let ci = 0, reports = 0, lastSweep = 0;
const brewing = async () => (await p.locator("[data-testid='nw-coffee']").innerText()).includes("brewing");
const report = async (cat, why) => {
  await p.locator("[data-testid='nw-report']").click(); await z(150);
  await p.locator(`[data-testid='nw-cat-${cat}']`).click(); await z(250);
  reports++;
  log(await p.locator("[data-testid='nw-clock']").innerText(), why, "->", cat, ":", (await p.locator("[data-testid='nw-toast']").innerText().catch(() => "")).slice(0, 90));
};
const t0 = Date.now();
while (Date.now() - t0 < 10 * 60e3) {
  if (await p.locator("[data-testid='nw-summary']").count()) break;
  const bar = await p.locator("[data-testid='nw-coffee'] span span").first().evaluate((e) => parseFloat(e.style.width)).catch(() => 100);
  if (bar < 14 && !(await brewing())) { await p.keyboard.press("b"); await z(200); }
  if (await brewing()) { await z(1000); continue; }
  const flashing = await p.locator("[data-testid^='nw-cam-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(7)));
  if (flashing.length) {
    const id = flashing[0];
    await p.locator(`[data-testid='nw-cam-${id}']`).click(); await z(500);
    const red = await p.locator("[data-testid^='nw-tile-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(8)));
    await report(pick(red), `CAM ${id} flashing, red ${red.join(",")}`);
    reported.add(id); base[id] = null;
    await z(800); continue;
  }
  if (policy === "sweep" && Date.now() - lastSweep > 3000) {
    lastSweep = Date.now();
    const id = cams[ci++ % cams.length];
    await p.locator(`[data-testid='nw-cam-${id}']`).click(); await z(700);
    const now = await thumb();
    if (!base[id]) base[id] = now;
    else {
      const d = diff(base[id], now);
      if (d >= 6) {
        await p.locator("[data-testid='nw-canvas']").screenshot({ path: `shots/rot-${tag}-sweep-${id}.png` });
        const red = await p.locator("[data-testid^='nw-tile-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(8)));
        const cat = red.length ? pick(red) : id === "aux" ? "access" : id === "pool" ? "foreign" : "equipment";
        await report(cat, `CAM ${id} changed (${d} cells)`);
        base[id] = now;
      }
    }
    continue;
  }
  await z(1000);
}
const sum = p.locator("[data-testid='nw-summary']");
log("grade:", await p.locator("[data-testid='nw-grade']").innerText().catch(() => "none"));
log("turnover:", (await sum.innerText().catch(() => "none")).replace(/\n/g, " | ").slice(0, 1400));
await p.screenshot({ path: `shots/rot-${tag}-3-turnover.png`, fullPage: true });
await sum.screenshot({ path: `shots/rot-${tag}-3-sheet.png` }).catch(() => {});
await p.locator("[data-testid='nw-summary-leave']").click().catch((e) => log("no leave button", String(e).slice(0, 80))); await z(700);
log("after leave, opener:", (await p.locator("[data-testid='night-opener']").innerText().catch(() => "none")).replace(/\n/g, " | "));
// Persistence, the way a player meets it: reload the tab, then Continue.
log("save exists before reload:", await T("hasSave"));
await p.reload(); await p.waitForFunction(() => window.__controlsTest); await z(2500);
await T("begin"); await z(800);
const cont = p.locator("[data-testid='continue-shift']");
log("continue button:", await cont.count());
if (await cont.count()) { await cont.click(); await z(1500); }
log("after reload: opener", await p.locator("[data-testid='night-opener']").count(), "| days off", await p.locator("[data-testid='days-off']").count(), "| ending", await p.locator("[data-testid='paper-ending']").count(), "|", (await p.locator("[data-testid='night-opener']").innerText().catch(() => "")).replace(/\n/g, " | "));
await p.screenshot({ path: `shots/rot-${tag}-4-reload.png` });
log("reports", reports, "errors", errs.length, errs.slice(0, 3).join(" || "));
await b.close();
