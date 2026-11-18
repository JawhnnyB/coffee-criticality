import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
// Real keys only after setup. Hold a direction and watch the clock label.
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("http://127.0.0.1:8090/"); await p.waitForFunction(() => window.__controlsTest);
const T = (f, ...a) => p.evaluate(([f, a]) => window.__controlsTest[f](...a), [f, a]);
await T("bootPlay"); await p.waitForTimeout(500);   // setup only (labelled): skip the title flow
const label = async () => { const m = await T("getMinutes"); return `${Math.floor(m / 60)}:${String(Math.floor(m % 60)).padStart(2, "0")} (${m.toFixed(1)}) room ${await T("getRoom")} x ${(await T("getX")).toFixed(0)}`; };
console.log("start", await label());
for (let i = 0; i < 6; i++) {
  for (const k of ["ArrowRight", "ArrowLeft"]) { await p.keyboard.down(k); await p.waitForTimeout(5000); await p.keyboard.up(k); }
  console.log(`after ${(i + 1) * 10}s walking`, await label());
}
await p.waitForTimeout(20000); console.log("after 20s standing", await label());
console.log("errors", errs.length); await b.close();
