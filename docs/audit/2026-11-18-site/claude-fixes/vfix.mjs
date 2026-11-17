import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
// Setup with hooks (labelled): boot, pick the type in the real builder, open the desk, launch Reactor Control.
// The checks themselves use real slider moves and real button clicks. getRun only reads.
const [label] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("http://127.0.0.1:8090/"); await p.waitForFunction(() => window.__controlsTest);
const T = (f, ...a) => p.evaluate(([f, a]) => window.__controlsTest[f](...a), [f, a]); const z = (ms) => p.waitForTimeout(ms);
await T("bootPlay"); await z(200); await T("setBuild"); await z(400);
const pick = p.locator('[data-testid="reactor-builder"] button', { hasText: label });
for (let i = 0; i < 10 && !(await pick.count()); i++) { await p.locator('[data-testid="builder-continue"]').first().click(); await z(150); }
await pick.first().click();
for (let i = 0; i < 12 && (await T("getMode")) === "build"; i++) { const c = p.locator('[data-testid="builder-continue"]'); if (await c.count()) await c.first().click(); else await p.locator('[data-testid="reactor-builder"] button.btn-primary').last().click(); await z(150); }
await T("warp", "parlor", 190, 170); await z(200); await T("openDesk"); await z(300); await T("deskLaunch", "reactor"); await z(800);
const r = p.locator('input[type="range"]');
const text = () => p.locator("body").innerText();
const pct = async () => (await T("getRun")).powerPct.toFixed(1);
const log = (...a) => console.log(label, ...a);
const passedShown = async () => (await text()).includes("BAND.HELD");
if (label === "MSR") {
  await z(3000);
  log("before drain power", await pct());
  await p.locator("button", { hasText: "Open the freeze valve" }).click();
  for (const s of [4, 12, 20, 35]) { await z(s === 4 ? 4000 : s === 12 ? 8000 : s === 20 ? 8000 : 15000); const run = await T("getRun"); log(`t+${s}s power`, run.powerPct.toFixed(1), "scram", run.scram, "BAND.HELD shown", await passedShown(), "|", ((await text()).match(/Plug \w+|Salt level \d+%|Fission heat[^\n]*|Fuel salt drained[^\n]*/g) ?? []).join(" · ")); }
  await p.screenshot({ path: "shots/vfix-msr-drained.png" });
}
if (label === "BWR") {
  // Same rods. Recirc steps down, then up. Read power each second; the bench kinetics decide it.
  await r.nth(0).fill("80"); await z(500);
  const seq = [];
  for (const f of ["70", "120"]) {
    if (!(await r.nth(1).count())) break;
    await r.nth(1).fill(f);
    for (let i = 0; i < 6; i++) { await z(1000); seq.push(`${f}%:${await pct()}`); if (!(await r.nth(1).count())) break; }
  }
  log("rods 80, recirc stepped:", seq.join(" "), "| BAND.HELD", await passedShown());
}
if (label === "Pebble") {
  await r.nth(0).fill("90"); await r.nth(1).fill("100"); await z(20000);
  const a = (await text()).match(/Outlet \d+ °C/)?.[0]; const pa = await pct();
  await r.nth(1).fill("60"); await z(4000);
  const b2 = (await text()).match(/Outlet \d+ °C/)?.[0];
  log("blower 100%:", a, "at power", pa, "| blower 60%:", b2, "at power", await pct());
}
// A plant call, answered right, then the result line. Real clicks.
if (!(await T("getRun")).scram && !(await passedShown())) {
  const call = p.locator('[data-testid="plant-call"]');
  if (await call.count()) {
    await call.click(); await z(300);
    const title = await p.locator('[data-testid="event-right"]').innerText().catch(() => "none");
    await p.locator('[data-testid="event-right"]').click().catch(() => {}); await z(1500);
    log("event right answer:", title.slice(0, 60), "→", (await p.locator('[data-testid="event-result"]').innerText().catch(() => "no result")).slice(0, 80), "| run", JSON.stringify(await T("getRun")).slice(0, 90));
  } else log("no plant-call button");
}
log("errors", errs.length, errs[0] ?? "");
await b.close();
