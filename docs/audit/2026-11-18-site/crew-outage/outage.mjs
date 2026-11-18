import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
// Setup with hooks (labelled): boot, set day 4 (the outage's fallback day), open the desk. Then real clicks only.
const [w, h] = (process.argv[2] ?? "1280x720").split("x").map(Number);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: w, height: h } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
const bad = []; p.on("response", (r) => { if (r.status() >= 400) bad.push(r.status() + " " + r.url()); });
await p.goto("http://127.0.0.1:8090/"); await p.waitForFunction(() => window.__controlsTest);
const T = (f, ...a) => p.evaluate(([f, a]) => window.__controlsTest[f](...a), [f, a]); const z = (ms) => p.waitForTimeout(ms);
await T("bootPlay"); await z(300); await T("setDay", 4); await z(200); await T("openDesk"); await z(800);
let icon = p.getByText("Refuelling Outage", { exact: true }).first();
if (!(await icon.count())) { await p.locator("button", { hasText: /start|menu/i }).first().click().catch(() => {}); await z(400); icon = p.getByText("Refuelling Outage", { exact: true }).first(); }
console.log("icon found:", await icon.count());
await icon.dblclick().catch(async () => icon.click()); await z(1200);
if (!(await p.locator("[data-testid='app-outage']").count())) { await icon.click().catch(() => {}); await z(1200); }
console.log("app open:", await p.locator("[data-testid='app-outage']").count());
await p.screenshot({ path: `shots/outage-open-${w}.png` });
const t0 = Date.now();
await p.locator("[data-testid='outage-run']").click();
await p.locator("[data-testid='outage-result']").waitFor({ timeout: 60000 });
console.log(`plant pattern run in ${Date.now() - t0} ms:`, (await p.locator("[data-testid='outage-result'] p").first().innerText()).replace(/\n/g, " "));
console.log("  ", (await p.locator("[data-testid='outage-result'] p").nth(1).innerText()).replace(/\n/g, " "));
await p.locator("[data-testid='outage-view-power']").click(); await z(300);
await p.screenshot({ path: `shots/outage-result-${w}.png`, fullPage: false });
// Move fresh fuel to the rim: swap the centre-row fresh assembly with a rim one, by tapping two cells.
await p.locator("[data-testid='outage-view-fuel']").click(); await z(200);
const cells = p.locator("[data-testid^='outage-cell-']");
const n = await cells.count();
const labels = [];
for (let i = 0; i < n; i++) labels.push(await cells.nth(i).getAttribute("aria-label"));
// Fresh fuel inside the core, burned fuel on the rim (rows/columns 13-15 or A-C in plant naming).
const pos = (l) => l.split(":")[0];
const rimName = (name) => { const col = "RPNMLKJHGFEDCBA".indexOf(name[0]); const row = parseInt(name.slice(1), 10) - 1; return Math.max(Math.abs(col - 7), Math.abs(row - 7)) >= 6; };
const freshIdx = labels.findIndex((l) => l.includes("fresh") && !rimName(pos(l)) && !l.startsWith("H08"));
const rimIdx = labels.findIndex((l) => l.includes("burned") && rimName(pos(l)));
console.log("swap", pos(labels[freshIdx]), "(" + labels[freshIdx].split(": ")[1] + ") <->", pos(labels[rimIdx]), "(" + labels[rimIdx].split(": ")[1] + ")");
await cells.nth(freshIdx).click(); await z(100); await cells.nth(rimIdx).click(); await z(300);
await p.locator("[data-testid='outage-run']").click();
await p.locator("[data-testid='outage-verdict']").waitFor({ timeout: 60000 });
console.log("after swap:", (await p.locator("[data-testid='outage-result'] p").first().innerText()).replace(/\n/g, " "), "·", await p.locator("[data-testid='outage-verdict']").innerText());
await p.screenshot({ path: `shots/outage-swapped-${w}.png` });
// Bad paste is refused in words.
await p.locator("summary", { hasText: "Data:" }).click(); await z(200);
await p.locator("[data-testid='outage-paste']").fill('{"version": 2}');
await p.locator("[data-testid='outage-use-paste']").click(); await z(200);
console.log("bad paste:", await p.locator("[data-testid='app-outage']").getByText('Expected "version": 1.').count() ? 'refused: Expected "version": 1.' : "NOT refused");
console.log("errors", errs.length, errs[0] ?? "", "http>=400", bad.length, bad[0] ?? "");
await b.close();
