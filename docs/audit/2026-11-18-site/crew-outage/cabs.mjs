import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
// Setup with hooks (labelled): boot, find the parlor (warp), open the desk, launch each cabinet. Watch for errors.
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("http://127.0.0.1:8090/"); await p.waitForFunction(() => window.__controlsTest);
const T = (f, ...a) => p.evaluate(([f, a]) => window.__controlsTest[f](...a), [f, a]); const z = (ms) => p.waitForTimeout(ms);
await T("bootPlay"); await z(300); await T("warp", "parlor", 190, 170); await z(400);
for (const mode of ["arcade", "fish", "plot", "horde", "golf", "rods", "pebble", "bowl"]) {
  await T("openDesk"); await z(300);
  const before = errs.length;
  await T("deskLaunch", mode); await z(1800);
  const m = await T("getMode");
  const canvas = await p.locator("canvas").count();
  await p.screenshot({ path: `shots/cab-${mode}.png` });
  console.log(mode.padEnd(7), "mode", m, "canvases", canvas, "new errors", errs.length - before);
  await p.keyboard.press("Escape"); await z(400); await p.keyboard.press("Escape"); await z(300);
}
console.log("errors", errs.length, errs[0] ?? "");
await b.close();
