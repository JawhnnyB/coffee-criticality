import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
// Setup with hooks (labelled): boot into play and open the desk. After that: real clicks and keys only.
// The "player" uses only what is on screen: a flashing camera button and which annunciator tiles are red.
const w = 1280, h = 720;
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
// Wait (real time) for Jordan's first call on the radio, then click the camera he named, like a player would.
const names = await p.locator("[data-testid^='nw-cam-']").evaluateAll((els) => els.map((e) => [e.getAttribute("data-testid").slice(7), e.innerText.split("\n").slice(1).join(" ").toLowerCase()]));
let id = null;
for (let k = 0; k < 160 && !id; k++) {
  const last = (await p.locator("[data-testid='nw-radio']").innerText()).split("\n").at(-1).toLowerCase();
  const hit = names.find(([, nm]) => last.includes(nm));
  if (hit) id = hit[0]; else { if (k % 10 === 0) { const t = await p.locator("[data-testid='nw-coffee']").innerText(); if (/\b[0-9]\b/.test("")) {} } await z(1000); }
  const bar = await p.locator("[data-testid='nw-coffee'] span span").first().evaluate((e) => parseFloat(e.style.width)).catch(() => 100);
  if (bar < 14) { await p.keyboard.press("b"); await z(16000); await p.keyboard.press("Space"); }
}
console.log("radio:", (await p.locator("[data-testid='nw-radio']").innerText()).replace(/\n/g, " | "));
await p.locator(`[data-testid='nw-cam-${id}']`).click(); await z(120);
await p.locator("[data-testid='nw-canvas']").screenshot({ path: `shots/nw-switch-${id}.png` });
await z(2500);
await p.locator("[data-testid='nw-canvas']").screenshot({ path: `shots/nw-rover-${id}.png` });
await p.screenshot({ path: "shots/nw-rover-shift.png" });
console.log("camera", id, "errors", errs.length, errs[0] ?? "");
await b.close();
