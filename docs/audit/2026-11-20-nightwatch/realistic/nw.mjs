import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
// Setup with hooks (labelled): boot into play and open the desk. After that: real clicks and keys only.
// The "player" uses only what is on screen: a flashing camera button and which annunciator tiles are red.
const [size = "1280x720", full = "full"] = process.argv.slice(2);
const [w, h] = size.split("x").map(Number);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: w, height: h } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("http://127.0.0.1:8090/"); await p.waitForFunction(() => window.__controlsTest);
const T = (f, ...a) => p.evaluate(([f, a]) => window.__controlsTest[f](...a), [f, a]); const z = (ms) => p.waitForTimeout(ms);
await T("bootPlay"); await z(300); await T("openDesk"); await z(700);
// Open Night Watch: phone grid, or the Start menu on desktop.
const home = p.locator("[data-testid='home-nightwatch']");
if (await home.count()) await home.click();
else { await p.locator("[data-testid='start-button']").click(); await z(300); await p.getByRole("menuitem", { name: "Night Watch" }).click(); }
await z(800);
await p.locator("[data-testid='night-1']").click(); await z(600);
console.log("shift open:", await p.locator("[data-testid='nightwatch-shift']").count());
await p.keyboard.press("Space"); await z(500);
// One still per camera, at the start of the night (no events yet).
const cams = await p.locator("[data-testid^='nw-cam-']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(7)));
for (const [k, id] of cams.entries()) { await p.keyboard.press(String(k + 1)); await z(450); await p.locator("[data-testid='nw-canvas']").screenshot({ path: `shots/nw-cam-${id}-${w}.png` }); }
await p.screenshot({ path: `shots/nw-shift-${w}.png` });
if (full !== "full") { console.log("errors", errs.length, errs[0] ?? ""); await b.close(); process.exit(0); }
const pick = (ids) => {
  if (ids.some((i) => /^g/.test(i))) return "radiation";
  if (ids.some((i) => ["sump", "press", "pzrl", "pool", "dwp", "pool2", "moist", "cover"].includes(i))) return "leak";
  if (ids.includes("grid") || ids.includes("cold")) return "electrical";
  return "equipment";
};
let reports = 0; const seen = new Set();
const t0 = Date.now();
while (Date.now() - t0 < 9.5 * 60e3) {
  if (await p.locator("[data-testid='nw-summary']").count()) break;
  const coffee = await p.locator("[data-testid='nw-coffee']").innerText();
  const bar = await p.locator("[data-testid='nw-coffee'] span span").first().evaluate((e) => parseFloat(e.style.width));
  if (bar < 14 && !coffee.includes("brewing")) { await p.keyboard.press("b"); await z(200); }
  const flashing = await p.locator("[data-testid^='nw-cam-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(7)));
  if (flashing.length && !(await p.locator("[data-testid='nw-coffee']").innerText()).includes("brewing")) {
    const id = flashing[0];
    await p.locator(`[data-testid='nw-cam-${id}']`).click(); await z(500);
    const red = await p.locator("[data-testid^='nw-tile-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(8)));
    const cat = pick(red);
    await p.locator("[data-testid='nw-canvas']").screenshot({ path: `shots/nw-event-${id}-${w}.png` });
    await p.locator("[data-testid='nw-report']").click(); await z(200);
    await p.locator(`[data-testid='nw-cat-${cat}']`).click(); await z(300);
    reports++;
    console.log(await p.locator("[data-testid='nw-clock']").innerText(), `CAM ${id} flashing; red tiles ${red.join(",")} -> report ${cat}:`, await p.locator("[data-testid='nw-toast']").innerText().catch(() => ""));
  }
  await z(1500);
}
const sum = p.locator("[data-testid='nw-summary']");
console.log("summary:", (await sum.count()) ? (await sum.innerText()).replace(/\n/g, " | ").slice(0, 900) : "none");
await p.screenshot({ path: `shots/nw-summary-${w}.png` });
await p.locator("[data-testid='nw-summary-leave']").click().catch(() => {}); await z(500);
console.log("night 1 done flag:", await p.locator("[data-testid='night-1']").innerText().catch(() => "?"));
console.log("reports", reports, "errors", errs.length, errs[0] ?? "");
await b.close();
