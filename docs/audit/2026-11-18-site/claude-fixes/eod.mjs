import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
// Setup with hooks (labelled): boot and pick the type in the real builder. After that: real arrow keys only, until the day ends.
const [label, tag] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
const bad = []; p.on("response", (r) => { if (r.status() >= 400) bad.push(r.status() + " " + r.url()); });
await p.goto("http://127.0.0.1:8090/"); await p.waitForFunction(() => window.__controlsTest);
const T = (f, ...a) => p.evaluate(([f, a]) => window.__controlsTest[f](...a), [f, a]); const z = (ms) => p.waitForTimeout(ms);
await T("bootPlay"); await z(200); await T("setBuild"); await z(400);
const pick = p.locator('[data-testid="reactor-builder"] button', { hasText: label });
for (let i = 0; i < 10 && !(await pick.count()); i++) { await p.locator('[data-testid="builder-continue"]').first().click(); await z(150); }
await pick.first().click();
for (let i = 0; i < 12 && (await T("getMode")) === "build"; i++) { const c = p.locator('[data-testid="builder-continue"]'); if (await c.count()) await c.first().click(); else await p.locator('[data-testid="reactor-builder"] button.btn-primary').last().click(); await z(150); }
for (let i = 0; i < 120 && (await T("getMode")) !== "play"; i++) {
  const btn = p.locator("button.btn-primary:visible").first();
  if ((await T("getMode")) !== "intro" && (await btn.count())) await btn.click().catch(() => {}); else await p.keyboard.press("Space");
  await z(350);
}
const t0 = Date.now(); let mode = await T("getMode"); let n = 0;
console.log(tag, "start", mode, await T("getMinutes"));
while (Date.now() - t0 < 40 * 60e3) {
  mode = await T("getMode");
  if (mode !== "play") {
    // Dismiss dialogue with Enter if a talk opens, otherwise stop: the day closed.
    if (mode !== "eod" && mode !== "title" && mode !== "menu") { await p.keyboard.press("Space"); await z(300); if (++n % 50 === 0) console.log(tag, "waiting in", mode); if (n > 4000) break; continue; }
    break;
  }
  const k = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"][n++ % 4];
  await p.keyboard.down(k); await z(2500); await p.keyboard.up(k);
  if (n % 40 === 0) console.log(tag, "min", (await T("getMinutes")).toFixed(0), "mode", mode, "room", await T("getRoom"));
}
console.log(tag, "end mode", mode, "minutes", (await T("getMinutes")).toFixed(0), "day", await T("getDay"), "real s", ((Date.now() - t0) / 1000).toFixed(0));
await z(1500); await p.screenshot({ path: `shots/eod-${tag}.png` });
const site = await p.locator('[data-testid="eod-site"]').count();
console.log(tag, "eod-site box", site, "data-site", await p.locator('[data-site]').first().getAttribute("data-site").catch(() => "none"));
console.log(tag, "errors", errs.length, errs[0] ?? "", "http>=400", bad.length, bad[0] ?? "");
await b.close();
