import { chromium } from "/root/work/coffee/node_modules/playwright/index.mjs";
// Setup uses the labelled test hooks (bootPlay, openDesk). After that, only clicks and keys.
const [size = "1280x720"] = process.argv.slice(2);
const [w, h] = size.split("x").map(Number);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: w, height: h } });
const errs = [];
const bad = [];
p.on("pageerror", (e) => errs.push(String(e)));
p.on("requestfailed", (r) => bad.push(`${r.failure()?.errorText} ${r.url()}`));
p.on("response", (r) => {
  if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
});
await p.goto("http://127.0.0.1:8090/");
await p.waitForFunction(() => window.__controlsTest);
const T = (f, ...a) => p.evaluate(([f, a]) => window.__controlsTest[f](...a), [f, a]);
const z = (ms) => p.waitForTimeout(ms);
await T("bootPlay");
await z(300);
await T("openDesk");
await z(700);
const home = p.locator("[data-testid='home-nightwatch']");
if (await home.count()) await home.click();
else {
  await p.locator("[data-testid='start-button']").click();
  await z(300);
  await p.getByRole("menuitem", { name: "Night Watch" }).click();
}
await z(800);
await p.locator("[data-testid='night-1']").click();
await z(600);
const shift = await p.locator("[data-testid='nightwatch-shift']").count();
await p.locator("[data-testid='nw-tablet']").click();
await z(400);
const label = await p.locator("[data-testid='nw-tablet']").innerText().catch(() => "");
await p.screenshot({ path: `shots/shift-${w}.png` });
const first = await p.locator("[data-testid='nw-canvas']").screenshot({ path: `shots/first-${w}.png` });
const cams = await p.locator("[data-testid^='nw-cam-']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(7)));
for (const [k, id] of cams.entries()) {
  await p.keyboard.press(String((k % 8) + 1));
  await z(350);
  await p.locator("[data-testid='nw-canvas']").screenshot({ path: `shots/cam-${id}-${w}.png` });
}
const overflow = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
const cdp = await p.context().newCDPSession(p);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
const frame = await p.evaluate(async () => {
  const samples = [];
  let last = performance.now();
  await new Promise((resolve) => {
    let n = 0;
    const step = (t) => {
      samples.push(t - last);
      last = t;
      n += 1;
      if (n < 40) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  return { avg, n: samples.length };
});
await p.screenshot({ path: `shots/shift-${w}.png` });
console.log(JSON.stringify({ size, shift, label, cams: cams.length, overflow, frame, errors: errs, bad, firstBytes: first.length }));
await b.close();
