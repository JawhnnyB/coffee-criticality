// Art 4: the moving cutaways on the BWR bundle bench, the pebble desk and the salt desk, from the title screen with
// real clicks and keys. Hooks only for labelled setup (a campaign some weeks in, skipping the first-week
// introductions, jumping to Friday, standing at the reactor-hall desk) and to read state.
//   node docs/audit/2026-11-26-art/desks.mjs 1280x720   (and 390x844)
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
const [w, h] = (process.argv[2] ?? "1280x720").split("x").map(Number);
const tag = `${w}`;
const b = await chromium.launch();
const log = [];
const ok = (name, pass, extra = "") => log.push(`${pass ? "PASS" : "FAIL"} ${tag} ${name}${extra ? ` (${extra})` : ""}`);
const errs = [];

async function startAt(kind, week, opts = {}) {
  const p = await b.newPage({ viewport: { width: w, height: h }, ...opts });
  p.setDefaultTimeout(8000);
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto("http://127.0.0.1:8093/"); await p.waitForFunction(() => window.__controlsTest);
  await p.evaluate((wk) => { localStorage.clear(); localStorage.setItem("cc.profile", JSON.stringify({ campaign: { plant: "holt", holt: { week: wk }, colt: { week: 1 } } })); }, week); // labelled: weeks already played
  await p.reload(); await p.waitForFunction(() => window.__controlsTest);
  const T = (f, ...a) => p.evaluate(([fn, args]) => window.__controlsTest[fn](...args), [f, a]);
  const z = (ms) => p.waitForTimeout(ms);
  const boot = p.locator("[data-testid='boot-log']"); if (await boot.count()) await boot.click({ timeout: 3000 }).catch(() => {});
  await z(400);
  await p.locator("[data-testid='new-shift']").click(); await z(700);
  if ((await T("getMode")) === "setup") { await p.locator("[data-testid='setup-continue']").click(); await z(700); }
  const start = p.getByRole("button", { name: /start (a )?shift|start shift/i }).first();
  if ((await T("getMode")) === "desktop" && (await start.count())) { await start.click(); await z(700); }
  if ((await T("getMode")) !== "role") { await T("setRole"); await z(400); }
  await p.locator("[data-testid^='role-']").first().click(); await z(800);
  // The builder: pick the site's type, then continue through it.
  const label = { pwr: "PWR", bwr: "BWR", pebble: "Pebble / TRISO", msr: "MSR / salt" }[kind];
  const typeBtn = p.getByRole("button", { name: new RegExp(`^${label.replace(/[/]/g, "\\/")}`) }).first();
  for (let k = 0; k < 10 && !(await typeBtn.count()); k++) { await p.locator("[data-testid='builder-continue']").click(); await z(350); }
  await typeBtn.click(); await z(300);
  for (let k = 0; k < 14 && (await T("getMode")) === "build"; k++) {
    const next = p.locator("[data-testid='builder-continue']");
    if (await next.count()) await next.click();
    else await p.getByRole("button", { name: "Sign the unit" }).click();
    await z(350);
  }
  if ((await T("getMode")) === "build") { await T("finishBuild"); await z(500); } // labelled fallback
  if ((await T("getMode")) === "intro") { await T("setBrief"); await z(600); } // labelled: skip the introductions
  for (let k = 0; k < 30 && (await T("getMode")) !== "brief"; k++) { await p.keyboard.press("Enter"); await z(300); }
  await z(600);
  return { p, T, z, shot: (n) => p.screenshot({ path: `${n}-${tag}.png` }) };
}
async function toDesk({ p, T, z }) {
  for (let k = 0; k < 40 && (await T("getMode")) !== "play"; k++) { await p.keyboard.press("Enter"); await z(300); }
  await T("setDay", 5); await z(300); // labelled: Friday
  await T("warp", "engineering", 96, 150); await z(300); // labelled: at the reactor-hall desk
  await p.keyboard.down("ArrowUp"); await z(80); await p.keyboard.up("ArrowUp"); await z(200);
  await p.keyboard.press("KeyE"); await z(900);
}
const snap = (p, id) => p.locator(`[data-testid='${id}'] canvas`).evaluate((c) => c.toDataURL());
async function checkArt(ctx, id, desk) {
  const { p, z } = ctx;
  const fig = p.locator(`[data-testid='${id}']`);
  ok(`${desk}: the cutaway is there`, (await fig.count()) === 1);
  const size = await fig.locator("canvas").evaluate((c) => ({ nw: c.width, nh: c.height, w: c.getBoundingClientRect().width, h: c.getBoundingClientRect().height }));
  const scale = size.w / size.nw;
  ok(`${desk}: 96x72 at a whole-number scale`, size.nw === 96 && size.nh === 72 && Number.isInteger(scale) && Math.abs(size.h / size.nh - scale) < 0.01, JSON.stringify(size));
  ok(`${desk}: ${w < 640 ? "2x on a phone" : "3x on a wide screen"}`, scale === (w < 640 ? 2 : 3));
  const a = await snap(p, id); await z(450); const c = await snap(p, id);
  ok(`${desk}: it moves`, a !== c);
}

try {
{
  const ctx = await startAt("bwr", 3);
  const { p } = ctx;
  await toDesk(ctx);
  ok("BWR outage Friday: the bundle bench", (await p.locator("[data-testid='bundle-bench']").count()) === 1);
  await checkArt(ctx, "bundle-art", "bundle bench");
  await ctx.shot("04-bundle-bench");
  await p.close();
}
{
  const ctx = await startAt("pebble", 4);
  const { p, z } = ctx;
  await toDesk(ctx);
  ok("pebble Friday: the pass desk", (await p.locator("[data-testid='pass-desk']").count()) === 1);
  await p.locator("[data-testid='pass-slider']").focus();
  for (let k = 0; k < 13; k++) await p.keyboard.press("ArrowRight"); // 15 passes, like HTR-PM
  await z(200);
  await checkArt(ctx, "pass-art", "pass desk");
  await ctx.shot("04-pass-desk");
  await p.close();
}
{
  const ctx = await startAt("msr", 5);
  const { p, z } = ctx;
  await toDesk(ctx);
  ok("salt Friday: the salt desk", (await p.locator("[data-testid='salt-desk']").count()) === 1);
  await checkArt(ctx, "salt-art", "salt desk");
  await ctx.shot("04-salt-desk");
  await p.close();
}
{
  // Reduced motion: one still frame, and it still follows the desk.
  const ctx = await startAt("msr", 5, { reducedMotion: "reduce" });
  const { p, z } = ctx;
  await toDesk(ctx);
  const fig = p.locator("[data-testid='salt-art']");
  ok("reduced motion: the salt bowl holds still", (await fig.getAttribute("data-still")) === "1");
  const a = await snap(p, "salt-art"); await z(500); const c = await snap(p, "salt-art");
  ok("reduced motion: no frames change by themselves", a === c);
  await p.locator("[data-testid='salt-sparge']").focus();
  for (let k = 0; k < 6; k++) await p.keyboard.press("ArrowRight");
  await z(200);
  ok("reduced motion: more stripping redraws the still", (await snap(p, "salt-art")) !== c);
  await p.close();
}
} catch (e) {
  errs.push(String(e));
}
ok("no page errors", errs.length === 0, errs.join(" | ").slice(0, 300));
console.log(log.join("\n"));
await b.close();
