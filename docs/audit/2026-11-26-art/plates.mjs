// Art 5: the plates on the ending card, reached the long way with real clicks: a frightened week at Holt's plant
// (stand-down), another (transfer); a frightened week at Colt's (he calls everyone in); week 10 at each plant (finale).
// Hooks only for labelled setup (skipping the core builder and the first-week introductions, jumping to Friday's
// dusk, hides standing in for a week of hiding, a campaign already some weeks in) and to read state.
//   node docs/audit/2026-11-26-art/plates.mjs 1280x720   (and 390x844)
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
const [w, h] = (process.argv[2] ?? "1280x720").split("x").map(Number);
const tag = `${w}`;
const b = await chromium.launch();
const log = [];
const ok = (name, pass, extra = "") => log.push(`${pass ? "PASS" : "FAIL"} ${tag} ${name}${extra ? ` (${extra})` : ""}`);
const errs = [];

async function open(profile = null) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.setDefaultTimeout(8000);
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto("http://127.0.0.1:8093/"); await p.waitForFunction(() => window.__controlsTest);
  await p.evaluate((prof) => { localStorage.clear(); if (prof) localStorage.setItem("cc.profile", JSON.stringify(prof)); }, profile);
  await p.reload(); await p.waitForFunction(() => window.__controlsTest);
  const T = (f, ...a) => p.evaluate(([fn, args]) => window.__controlsTest[fn](...args), [f, a]);
  const z = (ms) => p.waitForTimeout(ms);
  const boot = p.locator("[data-testid='boot-log']"); if (await boot.count()) await boot.click({ timeout: 3000 }).catch(() => {});
  await z(500);
  return { p, T, z, shot: (n) => p.screenshot({ path: `${n}-${tag}.png` }) };
}

/** From the desk or the menu's New shift, through the badge, to the brief or the intro. */
async function toShift({ p, T, z }) {
  if ((await T("getMode")) === "setup") { await p.locator("[data-testid='setup-continue']").click(); await z(700); }
  const start = p.getByRole("button", { name: /start (a )?shift|start shift/i }).first();
  if ((await T("getMode")) === "desktop" && (await start.count())) { await start.click(); await z(700); }
  if ((await T("getMode")) !== "role") { await T("setRole"); await z(400); } // labelled fallback
  await p.locator("[data-testid^='role-']").first().click(); await z(700);
  await T("finishBuild"); await z(900); // labelled: skip designing the core
  if ((await T("getMode")) === "intro") { await T("setBrief"); await z(600); } // labelled: skip the first-week introductions
}
async function toPlay({ p, T, z }) {
  for (let k = 0; k < 40 && (await T("getMode")) !== "play"; k++) { await p.keyboard.press("Enter"); await z(350); }
}
async function walkToEnding({ p, T, z }) {
  await T("beginEnding"); await z(400); // labelled: Friday's dusk
  await p.keyboard.down("ArrowRight"); await z(1600); await p.keyboard.up("ArrowRight");
  await p.keyboard.down("ArrowUp"); await z(1600); await p.keyboard.up("ArrowUp");
  await p.locator("[data-testid='close-shift']").click(); await z(900);
}
async function fearWeek({ T, z }) {
  // Labelled: two hides, standing in for a week of heads down.
  await T("resolve", "hide"); await z(200);
  await T("setDay", 2); await z(300);
  await T("resolve", "hide"); await z(200);
}
async function newWeekFromEnding({ p, z }) {
  await p.locator("[data-testid='new-shift-ending']").click(); await z(500);
  await p.locator("[data-testid='wipe-confirm-yes']").click(); await z(900);
}

async function begin(ctx) {
  const { p, T, z } = ctx;
  await p.locator("[data-testid='new-shift']").click(); await z(700);
  if (["setup", "desktop", "role"].includes(await T("getMode"))) await toShift(ctx);
  await toPlay(ctx);
}
const want = w >= 768 ? 640 : 320;
async function plate(ctx, verdict, id) {
  const { p } = ctx;
  const card = p.locator(`[data-testid='verdict-${verdict}']`);
  ok(`${verdict}: the card`, (await card.count()) === 1);
  const img = card.locator("[data-testid='verdict-plate']");
  ok(`${verdict}: its plate`, (await img.count()) === 1);
  if (!(await img.count())) return;
  await img.evaluate((im) => (im.complete ? null : new Promise((r) => (im.onload = r))));
  const m = await img.evaluate((im) => ({ src: im.getAttribute("src"), nw: im.naturalWidth, nh: im.naturalHeight, cw: im.clientWidth, ch: im.clientHeight }));
  ok(`${verdict}: plate-${id}, 320x180 shown at ${want / 320}x`, m.src === `/art/plates/plate-${id}.png` && m.nw === 320 && m.nh === 180 && m.cw === want && m.ch === (want * 180) / 320, JSON.stringify(m));
  await img.scrollIntoViewIfNeeded();
  await ctx.shot(`05-${id}`);
}

// A. Holt's plant: a frightened week, the stand-down; another, the transfer.
{
  const ctx = await open();
  const { T } = ctx;
  await begin(ctx);
  await fearWeek(ctx);
  await walkToEnding(ctx);
  await plate(ctx, "standdown", "standdown");
  await newWeekFromEnding(ctx);
  await toShift(ctx);
  await toPlay(ctx);
  await fearWeek(ctx);
  await walkToEnding(ctx);
  await plate(ctx, "transfer", "transfer");
  await ctx.p.close();
}
// B. Colt's plant, a frightened week: he calls everyone in.
{
  const ctx = await open({ campaign: { plant: "colt", transferred: true, holt: { week: 3 }, colt: { week: 2 } } }); // labelled: a week in at Colt's
  await ctx.p.locator("[data-testid='plant-colt']").click(); await ctx.z(300);
  await begin(ctx);
  await fearWeek(ctx);
  await ctx.T("resolve", "hide"); await ctx.z(200);
  await walkToEnding(ctx);
  await plate(ctx, "regroup", "regroup");
  await ctx.p.close();
}
// C. Week 10 at each plant: the finale.
for (const [plant, id] of [["holt", "finale"], ["colt", "finale-colt"]]) {
  const prof = { campaign: { plant, transferred: plant === "colt", holt: { week: 10 }, colt: { week: 10 } } }; // labelled: nine weeks played
  const ctx = await open(prof);
  await ctx.p.locator(`[data-testid='plant-${plant}']`).click(); await ctx.z(300);
  await begin(ctx);
  await ctx.T("resolve", "report"); await ctx.z(200);
  await walkToEnding(ctx);
  await plate(ctx, "finale", id);
  await ctx.p.close();
}
ok("no page errors", errs.length === 0, errs.join(" | ").slice(0, 300));
console.log(log.join("\n"));
await b.close();
