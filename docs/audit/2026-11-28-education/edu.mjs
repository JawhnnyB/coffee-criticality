// The educational side as a player meets it: the Academy opened from the taskbar, paged with real clicks, and the
// rod, physics and xenon cabinets opened from their Academy pages. Hooks only for labelled setup (boot straight
// into day 1) and to read state. Screenshots back the findings in README.md.
//   node docs/audit/2026-11-28-education/edu.mjs
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("http://127.0.0.1:8093/"); await p.waitForFunction(() => window.__controlsTest);
await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForFunction(() => window.__controlsTest);
const T = (f, ...a) => p.evaluate(([fn, args]) => window.__controlsTest[fn](...args), [f, a]);
const z = (ms) => p.waitForTimeout(ms);
await T("bootPlay"); await z(1200); // labelled: straight into day 1
const open = async () => { await p.getByRole("button", { name: "Academy", exact: true }).first().click(); await z(900); };
const toTitle = async (title) => {
  for (let i = 0; i < 25; i++) {
    const t = (await p.locator(".teach-title").first().innerText()).toLowerCase();
    if (t === title.toLowerCase()) return true;
    await p.getByRole("button", { name: "Next", exact: true }).click(); await z(200);
  }
  return false;
};
await open();
await z(2500); await p.screenshot({ path: "01-academy-first-page.png" });
const titles = [];
for (let i = 0; i < 22; i++) { titles.push(await p.locator(".teach-title").first().innerText()); await p.getByRole("button", { name: "Next", exact: true }).click(); await z(150); }
console.log(`pages ${titles.length}: ${titles.join(" | ")}`);
for (const [title, shot] of [["Control rods are a spare absorber", "02-rods-page"], ["Reactivity in three stages", "03-reactivity-page"], ["Xenon and the iodine pit", "04-xenon-page"], ["Monte Carlo methods", "05-mc-page"]]) {
  await toTitle(title); await z(3500); await p.screenshot({ path: `${shot}.png`, fullPage: true });
}
await toTitle("Control rods are a spare absorber");
await p.locator("[data-testid='play-rods']").click(); await z(1500);
console.log("rods mode", await T("getMode"));
await p.keyboard.down("Digit1"); await z(2500); await p.keyboard.up("Digit1"); await z(300);
await p.screenshot({ path: "06-rod-bank-D-inserted.png" });
console.log("rods hud:", await p.locator("[data-testid='rods-hud']").innerText().catch(() => ""));
console.log("errors", errs.length, errs.slice(0, 2).join(" | "));
await b.close();
