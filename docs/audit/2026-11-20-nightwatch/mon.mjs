import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
// Setup with hooks (labelled): boot, pick Salt in the real builder, open the desk, launch Reactor Control.
// Then real clicks: open the freeze valve, wait for the drain, open the Plant Monitor from the Start menu.
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("http://127.0.0.1:8090/"); await p.waitForFunction(() => window.__controlsTest);
const T = (f, ...a) => p.evaluate(([f, a]) => window.__controlsTest[f](...a), [f, a]); const z = (ms) => p.waitForTimeout(ms);
await T("bootPlay"); await z(200); await T("setBuild"); await z(400);
const pick = p.locator('[data-testid="reactor-builder"] button', { hasText: "MSR" });
for (let i = 0; i < 10 && !(await pick.count()); i++) { await p.locator('[data-testid="builder-continue"]').first().click(); await z(150); }
await pick.first().click();
for (let i = 0; i < 12 && (await T("getMode")) === "build"; i++) { const c = p.locator('[data-testid="builder-continue"]'); if (await c.count()) await c.first().click(); else await p.locator('[data-testid="reactor-builder"] button.btn-primary').last().click(); await z(150); }
await T("warp", "parlor", 190, 170); await z(200); await T("openDesk"); await z(400);
const startAlarm = async () => p.locator("[data-testid='start-button']").getAttribute("data-alarm");
console.log("before: start button alarm", await startAlarm());
await T("deskLaunch", "reactor"); await z(2500);
await p.locator("button", { hasText: "Open the freeze valve" }).click();
await z(40000);
console.log("run scrammed:", (await T("getRun")).scram);
await p.keyboard.press("Escape"); await z(500);
await T("openDesk"); await z(600);
console.log("after: start button alarm", await startAlarm());
await p.locator("[data-testid='start-button']").click(); await z(300);
const item = p.getByRole("menuitem", { name: "Plant Monitor" });
console.log("start menu monitor icon alarm:", await item.locator("[data-alarm]").first().getAttribute("data-alarm"));
await item.click(); await z(800);
console.log("taskbar tab alarm:", await p.locator("[data-testid='task-monitor']").getAttribute("data-alarm"));
console.log("trip tile:", (await p.locator("[data-testid='pm-tile-trip']").innerText()).replace(/\n/g, " "), "· shift", await p.locator("[data-testid='pm-shift']").innerText());
await p.screenshot({ path: "shots/monitor-trip.png" });
console.log("errors", errs.length, errs[0] ?? "");
await b.close();
