// Nights 2 and 3 of the rotation at 1x, on the built game.
// Labelled setup: bootPlay, then flags that put the rotation at night N's opener.
// Real input after that. Policy "scan": sweep cameras, report only flashing ones (coffee test).
// Policy "sweep": also report a camera that changed since its last look, and log why each report was refused.
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
const [night = "2", policy = "scan"] = process.argv.slice(2);
const N = Number(night);
const tag = `n${N}-${policy}`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
const log = (...a) => console.log(`[${tag}]`, ...a);
await p.goto("http://127.0.0.1:8093/"); await p.waitForFunction(() => window.__controlsTest);
const T = (f, ...a) => p.evaluate(([f, a]) => window.__controlsTest[f](...a), [f, a]);
const z = (ms) => p.waitForTimeout(ms);
// --- labelled setup
await T("bootPlay"); await z(300);
for (const f of ["rot:nights", "rot:reported"]) await T("setFlag", f, true);
for (let k = 1; k < N; k++) { await T("setFlag", `night:${k}:done`, true); await T("setFlag", `night:${k}:grade:B`, true); }
await z(800);
const opener = p.locator("[data-testid='night-opener']");
log("opener:", (await opener.innerText().catch(() => "none")).replace(/\n/g, " | ").slice(0, 160));
// --- real input
await p.locator("[data-testid='start-night']").click(); await z(800);
await p.keyboard.press("Space"); await z(400);
const cams = await p.locator("[data-testid^='nw-cam-']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(7)));
const pick = (ids) => {
  if (ids.some((i) => /^g/.test(i))) return "radiation";
  if (ids.some((i) => ["sump", "press", "pzrl", "pool", "dwp", "pool2", "moist", "cover", "sgp", "steam"].includes(i))) return "leak";
  if (ids.includes("grid") || ids.includes("cold")) return "electrical";
  return "equipment";
};
const thumb = () => p.evaluate(() => {
  const c = document.querySelector("[data-testid='nw-canvas']"); const t = document.createElement("canvas"); t.width = 32; t.height = 18;
  const g = t.getContext("2d"); g.drawImage(c, 0, 0, 32, 18); return Array.from(g.getImageData(0, 0, 32, 18).data.filter((_, i) => i % 4 !== 3));
});
const diff = (a, c) => { let n = 0; for (let i = 0; i < a.length; i += 3) { const d = (Math.abs(a[i] - c[i]) + Math.abs(a[i + 1] - c[i + 1]) + Math.abs(a[i + 2] - c[i + 2])) / 3; if (d > 22) n++; } return n; };
const clock = () => p.locator("[data-testid='nw-clock']").innerText().catch(() => "?");
const coffee = () => p.locator("[data-testid='nw-coffee']").innerText().catch(() => "?");
const bar = () => p.locator("[data-testid='nw-coffee'] span span").first().evaluate((e) => parseFloat(e.style.width)).catch(() => -1);
const redTiles = () => p.locator("[data-testid^='nw-tile-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(8)));
const base = {}; let ci = 0, lastSweep = 0, brews = 0, lastHour = "", emptySince = null;
const report = async (cat, why) => {
  await p.locator("[data-testid='nw-report']").click(); await z(150);
  await p.locator(`[data-testid='nw-cat-${cat}']`).click(); await z(300);
  const toast = (await p.locator("[data-testid='nw-toast']").innerText().catch(() => "")).replace(/\n/g, " ");
  log(await clock(), "REPORT", why, "->", cat, "|", toast.slice(0, 110));
};
const t0 = Date.now();
while (Date.now() - t0 < 40 * 60e3) {
  if (await p.locator("[data-testid='nw-summary']").count()) break;
  const c = await clock(); const hour = c.slice(0, 2);
  const w = await bar();
  if (hour !== lastHour) { lastHour = hour; log(c, "coffee", w.toFixed?.(0) + "%", (await coffee()).replace(/\n/g, " ").slice(0, 60)); }
  if (w <= 0 && emptySince === null) { emptySince = c; log(c, "CUP EMPTY"); }
  if (w > 0) emptySince = null;
  const pots = await coffee();
  if (w < 14 && !pots.includes("brewing") && !/0 pots? left/.test(pots)) { await p.keyboard.press("b"); brews++; log(c, "brew", pots.replace(/\n/g, " ").slice(0, 50)); await z(300); }
  if ((await coffee()).includes("brewing")) { await z(1000); continue; }
  const flashing = await p.locator("[data-testid^='nw-cam-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(7)));
  if (flashing.length) {
    const id = flashing[0];
    await p.locator(`[data-testid='nw-cam-${id}']`).click(); await z(500);
    const red = await redTiles();
    await report(pick(red), `CAM ${id} flashing, red ${red.join(",")}`);
    base[id] = null; await z(800); continue;
  }
  if (Date.now() - lastSweep > 3000) {
    lastSweep = Date.now();
    const id = cams[ci++ % cams.length];
    await p.locator(`[data-testid='nw-cam-${id}']`).click(); await z(700);
    const now = await thumb();
    if (policy === "sweep" && base[id]) {
      const d = diff(base[id], now);
      if (d >= 6) {
        await p.locator("[data-testid='nw-canvas']").screenshot({ path: `shots/${tag}-${id}-${(await clock()).replace(":", "")}.png` });
        const red = await redTiles();
        const cat = red.length ? pick(red) : id === "aux" ? "access" : id === "pool" ? "foreign" : "equipment";
        await report(cat, `CAM ${id} changed (${d} cells), red ${red.join(",")}`);
      }
    }
    base[id] = now;
    continue;
  }
  await z(700);
}
const sum = p.locator("[data-testid='nw-summary']");
log("END", (await sum.innerText().catch(() => "no summary")).replace(/\n/g, " | ").slice(0, 900));
log("brews", brews, "errors", errs.length, errs.slice(0, 2).join(" || "));
await p.screenshot({ path: `shots/${tag}-end.png` });
await b.close();
