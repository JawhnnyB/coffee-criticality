// Real clicks through three conversations at two sizes. Hooks only for labelled setup (day, flags) and to open the talk.
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
const SHOTS = process.argv[2] ?? ".";
const b = await chromium.launch(); const out = [];
const cases = [
  { npc: "tommy", day: 1, flags: {}, shot: "tommy-first" },
  { npc: "marcus", day: 4, flags: { marcusTalked: true }, shot: "marcus-day4" },
  { npc: "elena", day: 3, flags: { elenaTalked: true }, shot: "elena-day3" },
];
for (const [w, h] of [[1280, 720], [390, 844]]) {
  for (const c of cases) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
    await p.goto("http://127.0.0.1:8093/"); await p.waitForFunction(() => window.__controlsTest);
    const T = (f, ...a) => p.evaluate(([f, a]) => window.__controlsTest[f](...a), [f, a]); const z = (ms) => p.waitForTimeout(ms);
    await T("bootPlay"); await z(300); await T("setDay", c.day);
    for (const [k, v] of Object.entries(c.flags)) await T("setFlag", k, v);
    await z(200); await T("startTalk", c.npc); await z(700);
    const seen = []; let overflow = 0; let shot = false;
    for (let k = 0; k < 16; k++) {
      const box = p.locator("[data-testid='paper-talk']");
      if (!(await box.count())) break;
      const text = (await box.innerText().catch(() => "")).replace(/\n/g, " ");
      if (text && !seen.includes(text)) seen.push(text);
      overflow = Math.max(overflow, await box.evaluate((el) => el.scrollHeight - el.clientHeight));
      const choice = box.locator("button.paper-btn").first();
      if (await choice.count()) {
        if (!shot) { await z(2500); await p.screenshot({ path: `${SHOTS}/${c.shot}-${w}.png` }); shot = true; }
        await choice.click(); await z(500); continue;
      }
      await box.click({ position: { x: 20, y: 20 } }); await z(450);
    }
    if (!shot) await p.screenshot({ path: `${SHOTS}/${c.shot}-${w}.png` });
    out.push({ w, npc: c.npc, day: c.day, lines: seen.map((t) => t.slice(0, 160)), overflowPx: overflow, mode: await T("getMode"), errors: errs });
    await p.close();
  }
}
console.log(JSON.stringify(out, null, 1));
await b.close();
