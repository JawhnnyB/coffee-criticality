import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
const b = await chromium.launch(); const out = [];
for (const [w, h] of [[1280, 720], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto("http://127.0.0.1:8093/"); await p.waitForFunction(() => window.__controlsTest);
  const T = (f, ...a) => p.evaluate(([f, a]) => window.__controlsTest[f](...a), [f, a]); const z = (ms) => p.waitForTimeout(ms);
  // Labelled setup: day 3, maintenance done, already met Mabel; then open a conversation with her.
  await T("bootPlay"); await z(300); await T("setDay", 3); await T("setMaintDone", true); await T("setFlag", "social:met:mabel", true); await z(200);
  await T("startTalk", "mabel"); await z(700);
  const seen = [];
  for (let k = 0; k < 14; k++) {
    const text = (await p.locator("[data-testid='paper-talk']").innerText().catch(() => "")).replace(/\n/g, " ");
    if (text && !seen.includes(text)) seen.push(text);
    if (text.includes("Tommy came in")) await p.screenshot({ path: `shots/moment-mabel-${w}.png` });
    const choice = p.locator("[data-testid='paper-talk'] button.paper-btn").first();
    if (await choice.count()) {
      if (text.includes("good morning")) await p.screenshot({ path: `shots/moment-mabel-choice-${w}.png` });
      await choice.click(); await z(500); continue;
    }
    if (!(await p.locator("[data-testid='paper-talk']").count())) break;
    await p.locator("[data-testid='paper-talk']").click({ position: { x: 20, y: 20 } }); await z(450);
  }
  out.push([w, seen.map((t) => t.slice(0, 110)), "mode", await T("getMode"), "errors", errs]);
  await p.close();
}
for (const r of out) console.log(JSON.stringify(r, null, 1));
await b.close();
