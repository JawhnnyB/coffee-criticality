// The cycle work with real clicks: Friday's plan on the real core with Priya's rules and her pass; a cycle-2
// exchange at Holt's plant; a cycle-3 exchange at Colt's plant with Colt's own portrait.
// Hooks only for labelled setup (boot, day 5, standing at the fuel desk, the outage's Cycle 1 example seen, the
// campaign week and plant, having met someone) and to read state.
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
execFileSync(process.env.ESBUILD ?? "/opt/npm-tools/node_modules/.bin/esbuild", [join(here, "../2026-11-25-cohesion/solve.ts"), "--bundle", "--platform=node", "--format=esm", "--outfile=/tmp/cc-solve.mjs", "--log-level=error"]);
const { solve } = await import("/tmp/cc-solve.mjs");
const [w, h] = (process.argv[2] ?? "1280x720").split("x").map(Number);
const tag = `${w}`;
const b = await chromium.launch();
const log = [];
const ok = (name, pass, extra = "") => log.push(`${pass ? "PASS" : "FAIL"} ${tag} ${name}${extra ? ` (${extra})` : ""}`);
const errs = [];
async function open(outage = false) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.setDefaultTimeout(10000);
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto("http://127.0.0.1:8093/"); await p.waitForFunction(() => window.__controlsTest);
  await p.evaluate((o) => {
    localStorage.clear();
    if (o) localStorage.setItem("cc.outage.v1", JSON.stringify({ custom: null, useCustom: false, history: [], draft: null, draftCycle: 2, discharged: [], tutorialSeen: true }));
  }, outage);
  await p.reload(); await p.waitForFunction(() => window.__controlsTest);
  const T = (f, ...a) => p.evaluate(([fn, args]) => window.__controlsTest[fn](...args), [f, a]);
  const z = (ms) => p.waitForTimeout(ms);
  await T("bootPlay"); await z(400);
  return { p, T, z, shot: (n) => p.screenshot({ path: `${n}-${tag}.png` }) };
}
async function talk(p, T, z, who, choose = 0) {
  await T("startTalk", who); await z(900);
  const seen = [];
  for (let k = 0; k < 40 && (await T("getMode")) === "dialogue"; k++) {
    const box = p.locator("[data-testid='paper-talk']");
    seen.push((await box.innerText().catch(() => "")).replace(/\s+/g, " "));
    const btns = box.locator("button.paper-btn");
    if (await btns.count()) { await btns.nth(Math.min(choose, (await btns.count()) - 1)).click(); await z(450); continue; }
    await box.click({ position: { x: 30, y: 20 } }); await z(420);
  }
  return seen;
}

// A. Friday's plan on the real core.
{
  const { p, T, z, shot } = await open(true);
  await T("setDay", 5); await z(200);
  await T("warp", "engineering", 96, 150); await z(300);
  await p.keyboard.down("ArrowUp"); await z(80); await p.keyboard.up("ArrowUp"); await z(200);
  await p.keyboard.press("KeyE"); await z(800);
  const enrich = (await T("getPlant"))?.enrich ?? 4.5;
  const { swaps } = solve(enrich);
  const cells = p.locator("div.grid.grid-cols-6 > button");
  for (const [a, c] of swaps) { await cells.nth(a).click(); await cells.nth(c).click(); }
  await p.getByRole("button", { name: "Sign the shuffle" }).click(); await z(800);
  await p.locator("[data-testid='shift-start']").click(); await z(900);
  const item = p.getByRole("menuitem", { name: /Refuelling Outage/i }).first();
  if (await item.count()) await item.click(); else await T("deskLaunch", "desktop");
  await z(1200);
  for (let k = 0; k < 2 && !(await p.locator("[data-testid='outage-friday']").count()); k++) {
    const icon = p.getByText("Refuelling Outage", { exact: false }).first();
    if (await icon.count()) { await (k === 0 ? icon.dblclick() : icon.click()).catch(() => {}); await z(1200); }
  }
  await p.locator("[data-testid='outage-friday-lay']").click(); await z(500);
  const rules = await p.locator("[data-testid='outage-friday-rules']").innerText().catch(() => "");
  ok("Priya says which real-core rules she applied", /outer flats/.test(rules) && /most-burned/.test(rules), rules.slice(0, 100));
  await p.locator("[data-testid='outage-run']").click();
  const verdict = p.locator("[data-testid='outage-friday-verdict']");
  await verdict.waitFor({ timeout: 120000 });
  const first = await verdict.innerText();
  ok("judged against the plant's own pattern", /plant's own pattern/.test(first), first.slice(0, 140));
  let holds = await verdict.getAttribute("data-holds");
  for (let pass = 0; pass < 3 && holds !== "yes"; pass++) {
    await p.locator("[data-testid='outage-friday-priya']").click();
    await z(1500);
    const working = await p.locator("[data-testid='outage-friday-priya']").innerText().catch(() => "");
    await p.evaluate(() => getSelection()?.removeAllRanges());
    if (pass === 0) { ok("Priya shows her work", /swaps tried/.test(working), working); await shot("01-priya-working"); }
    await p.waitForFunction(() => !document.querySelector("[data-testid='outage-friday-priya']")?.textContent?.includes("swaps tried") && !!document.querySelector("[data-testid='outage-friday-verdict']"), null, { timeout: 180000 });
    await p.waitForFunction(() => !document.querySelector("[data-testid='outage-run']")?.textContent?.includes("Running"), null, { timeout: 120000 });
    await z(500);
    holds = await verdict.getAttribute("data-holds");
  }
  ok("after Priya's pass, Friday's plan holds on the real core", holds === "yes", (await verdict.innerText()).slice(0, 140));
  await p.evaluate(() => getSelection()?.removeAllRanges()); await verdict.scrollIntoViewIfNeeded(); await shot("02-friday-holds");
  await p.close();
}

// B. Week 5 at Holt's plant: Tommy's second talk opens on a cycle-2 exchange.
{
  const { p, T, z, shot } = await open();
  await T("setFlag", "cw:5", true); // labelled: campaign week 5
  await talk(p, T, z, "tommy");
  let shotDone = false;
  await T("startTalk", "tommy"); await z(1200);
  const lines = (await T("getLines")).join(" | ");
  ok("week 5: Tommy and Jordan at the second lock", /Two locks\?|second lock|wrong breaker/i.test(lines), lines.slice(0, 160));
  await z(800);
  const box = p.locator("[data-testid='paper-talk']");
  for (let k = 0; k < 6 && !shotDone; k++) { const t = await box.innerText().catch(() => ""); if (/JORDAN|Jordan/.test(t)) { await z(1500); await shot("03-cycle2-tommy-jordan"); shotDone = true; break; } await box.click({ position: { x: 30, y: 20 } }); await z(500); }
  ok("the exchange shows on screen", shotDone);
  await p.close();
}

// C. Week 8 at Colt's plant: Colt's own face, and a cycle-3 exchange in his words.
{
  const { p, T, z, shot } = await open();
  await T("setFlag", "plant:colt", true); // labelled: a shift at Colt's plant
  await T("setFlag", "cw:8", true); // labelled: campaign week 8
  await talk(p, T, z, "holt"); // meet Colt first
  await T("startTalk", "holt"); await z(1200);
  const portrait = await p.locator("[data-testid='paper-talk'] img").first().getAttribute("src").catch(() => "");
  ok("Colt has his own portrait", /portrait-colt-/.test(portrait ?? ""), portrait ?? "");
  const lines = (await T("getLines")).join(" | ");
  ok("week 8: Colt and Priya at the repeating core, in Colt's words", /pattern/i.test(lines) && !/Holt|Reggie/.test(lines), lines.slice(0, 180));
  await z(1500); await shot("04-colt-cycle3");
  await p.close();
}
ok("no page errors", errs.length === 0, errs.join(" | ").slice(0, 300));
console.log(log.join("\n"));
await b.close();
