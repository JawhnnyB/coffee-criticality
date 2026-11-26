// The long game with real clicks: Holt's plant → stand-down → transfer → Colt's plant; Colt from the title screen
// with a Flux map Friday; an outage week; the week-10 finale.
// Hooks only for labelled setup (skipping the core builder, jumping to Friday or to Friday's dusk, hides standing
// in for a week of hiding, a campaign already some weeks in) and to read state.
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

// A. Holt's plant: a frightened week, the stand-down, another frightened week, the transfer, and Colt.
{
  const ctx = await open();
  const { p, T, z, shot } = ctx;
  ok("title: plant picker, Holt's plant chosen", (await p.locator("[data-testid='plant-holt']").getAttribute("aria-checked")) === "true");
  ok("title: week 1 of 10", /Week 1 of 10/.test(await p.locator("[data-testid='plant-line']").innerText()));
  await shot("01-title");
  await p.locator("[data-testid='new-shift']").click(); await z(700);
  await toShift(ctx);
  let f = await T("getFlags");
  ok("the badge stamps week 1 at Holt's plant", f["cw:1"] === true && !f["plant:colt"]);
  await toPlay(ctx);
  await fearWeek(ctx);
  await walkToEnding(ctx);
  ok("Fear ends the week in a stand-down", (await p.locator("[data-testid='verdict-standdown']").count()) === 1);
  ok("the button begins the stand-down week", /stand-down week/i.test(await p.locator("[data-testid='new-shift-ending']").innerText()));
  await p.locator("[data-testid='verdict-standdown']").scrollIntoViewIfNeeded(); await shot("02-standdown-called");
  await newWeekFromEnding(ctx);
  await toShift(ctx);
  f = await T("getFlags");
  ok("week 2 is a stand-down week", f["cw:2"] === true && f["standdown:active"] === true);
  for (let k = 0; k < 30 && (await T("getMode")) !== "brief"; k++) { await p.keyboard.press("Enter"); await z(350); }
  await z(1500);
  const strip = await p.locator("[data-testid='week-strip']").innerText().catch(() => "");
  ok("the brief says stand-down", /Week 2 of 10/.test(strip) && /STAND-DOWN/.test(strip), strip.slice(0, 90));
  const holtLine = await p.locator(".intro-line").first().innerText().catch(() => "");
  await z(2500);
  await shot("03-standdown-brief");
  ok("Holt opens the stand-down", /Work stops|heads down|Last week ended/.test((await p.locator(".intro-line").first().innerText().catch(() => "")) + holtLine));
  await toPlay(ctx);
  await fearWeek(ctx);
  await walkToEnding(ctx);
  ok("still afraid: the transfer ending", (await p.locator("[data-testid='verdict-transfer']").count()) === 1);
  ok("no nights or new week after a transfer", (await p.locator("[data-testid='rotate-nights']").count()) === 0 && (await p.locator("[data-testid='new-shift-ending']").count()) === 0);
  await p.locator("[data-testid='verdict-transfer']").scrollIntoViewIfNeeded(); await shot("04-transfer");
  await p.locator("[data-testid='transfer-colt']").click(); await z(900);
  ok("straight to the badge at the new plant", (await T("getMode")) === "role", await T("getMode"));
  await p.locator("[data-testid^='role-']").first().click(); await z(700);
  await T("finishBuild"); await z(900);
  if ((await T("getMode")) === "intro") { await T("setBrief"); await z(600); } // labelled: skip the introductions
  f = await T("getFlags");
  ok("Colt's plant, week 1, strangers", f["plant:colt"] === true && f["cw:1"] === true && !f["crew:returning"]);
  await toPlay(ctx);
  await T("startTalk", "holt"); await z(1200); // labelled: walk to Control
  const talk = await p.locator("[data-testid='paper-talk']").innerText().catch(() => "");
  ok("the director is Colt, in his own words", /COLT|Colt/.test(talk) && !/Holt|Reggie/.test(talk), talk.replace(/\s+/g, " ").slice(0, 140));
  await z(1800); await shot("05-colt-meets-you");
  const lines = (await T("getLines")).join(" | ");
  ok("Colt's first meeting, not Holt's", /Russ Colt/.test(lines) && !/Reginald Holt/.test(lines), lines.slice(0, 160));
  for (let k = 0; k < 14 && (await T("getMode")) === "dialogue"; k++) {
    const c = p.locator("[data-testid='paper-talk'] button.paper-btn").first();
    if (await c.count()) await c.click(); else await p.locator("[data-testid='paper-talk']").click({ position: { x: 20, y: 20 } });
    await z(450);
  }
  await p.keyboard.press("Escape"); await z(800);
  const crew = await p.locator("[data-testid='pause-stage']").innerText().catch(() => "");
  ok("crew page names Mr. Russell Colt", /Russell Colt/.test(crew) && !/Reginald/.test(crew));
  await p.close();
}

// B. Colt's plant from the title, a campaign one week in: the Friday flux map.
{
  const ctx = await open({ campaign: { plant: "holt", transferred: false, holt: { week: 1 }, colt: { week: 2 } } }); // labelled: Colt's week 1 already played
  const { p, T, z, shot } = ctx;
  await p.locator("[data-testid='plant-colt']").click(); await z(300);
  ok("pick Colt's plant on the title", (await p.locator("[data-testid='plant-colt']").getAttribute("aria-checked")) === "true");
  ok("Colt's plant is at week 2", /lighter game[\s\S]*Week 2 of 10/.test(await p.locator("[data-testid='plant-line']").innerText()));
  await shot("06-title-colt");
  await p.locator("[data-testid='new-shift']").click(); await z(700);
  await toShift(ctx);
  for (let k = 0; k < 30 && (await T("getMode")) !== "brief"; k++) { await p.keyboard.press("Enter"); await z(350); }
  await z(800);
  const strip = p.locator("[data-testid='week-strip']");
  ok("brief: week 2, middle of cycle, Colt's plant", /Week 2 of 10 · Cycle 1 · Middle of cycle/.test(await strip.innerText()) && /Colt's plant/.test(await strip.innerText()));
  ok("Colt left something on your desk", /On your desk/.test(await p.locator("[data-testid='week-strip-line']").innerText()));
  await strip.locator("button").click(); await z(300);
  ok("tap: the cycle in numbers", /Boron ≈ 620 ppm/.test(await p.locator("[data-testid='week-strip-more']").innerText()));
  await z(2500); await shot("07-colt-brief");
  await toPlay(ctx);
  await T("setDay", 5); await z(300); // labelled: Friday
  await T("warp", "engineering", 96, 150); await z(300);
  await p.keyboard.down("ArrowUp"); await z(80); await p.keyboard.up("ArrowUp"); await z(200);
  await p.keyboard.press("KeyE"); await z(900);
  ok("Friday with no outage: the flux map", (await p.locator("[data-testid='flux-map']").count()) === 1, await T("getMode"));
  ok("no fuel moves on a flux map day", (await p.locator("[data-testid='shuffle-plan-note']").count()) === 0);
  for (const i of [0, 7, 21]) { await p.locator(`[data-testid='flux-cell-${i}']`).click(); await z(250); }
  const read = await p.locator(`[data-testid='flux-cell-7']`).innerText();
  ok("a tap reads the detector", /%/.test(read), read);
  for (let i = 0; i < 36 && !(await p.locator("[data-testid='flux-sign']").isEnabled()); i++) { await p.locator(`[data-testid='flux-cell-${i}']`).click(); await z(120); }
  await shot("08-flux-map");
  await p.locator("[data-testid='flux-sign']").click(); await z(800);
  const f = await T("getFlags");
  ok("signing the flux map closes Friday's job, and opens no outage", f.shuffle === true && !f.outageOpen);
  await p.close();
}

// C. Holt's plant, week 3: the Friday is the reload. Week 10: the finale.
{
  const ctx = await open({ campaign: { plant: "holt", holt: { week: 3 }, colt: { week: 1 } } }); // labelled: two weeks already played
  const { p, T, z, shot } = ctx;
  await p.locator("[data-testid='new-shift']").click(); await z(700);
  await toShift(ctx);
  for (let k = 0; k < 30 && (await T("getMode")) !== "brief"; k++) { await p.keyboard.press("Enter"); await z(350); }
  await z(600);
  ok("week 3: end of cycle", /Week 3 of 10 · Cycle 1 · End of cycle/.test(await p.locator("[data-testid='week-strip']").innerText()));
  await toPlay(ctx);
  await T("setDay", 5); await z(300);
  await T("warp", "engineering", 96, 150); await z(300);
  await p.keyboard.down("ArrowUp"); await z(80); await p.keyboard.up("ArrowUp"); await z(200);
  await p.keyboard.press("KeyE"); await z(900);
  ok("outage week: the shuffle desk", (await T("getMode")) === "shuffle" && (await p.locator("[data-testid='shuffle-plan-note']").count()) === 1);
  await p.close();
}
{
  const ctx = await open({ campaign: { plant: "holt", holt: { week: 10 }, colt: { week: 1 } } }); // labelled: nine weeks already played
  const { p, T, z, shot } = ctx;
  await p.locator("[data-testid='new-shift']").click(); await z(700);
  await toShift(ctx);
  for (let k = 0; k < 30 && (await T("getMode")) !== "brief"; k++) { await p.keyboard.press("Enter"); await z(350); }
  await z(600);
  await p.locator("[data-testid='week-strip'] button").click(); await z(300);
  ok("week 10: the equilibrium core, none of the starting fuel left", /Equilibrium core/.test(await p.locator("[data-testid='week-strip']").innerText()) && /None of the starting fuel/.test(await p.locator("[data-testid='week-strip-more']").innerText()));
  await z(2000); await shot("09-week-10-brief");
  await toPlay(ctx);
  await T("resolve", "report"); await z(200);
  await walkToEnding(ctx);
  ok("the finale", (await p.locator("[data-testid='verdict-finale']").count()) === 1);
  ok("then week 1 again", /week 1/i.test(await p.locator("[data-testid='new-shift-ending']").innerText()));
  await p.locator("[data-testid='verdict-finale']").scrollIntoViewIfNeeded(); await shot("10-finale");
  await p.close();
}
ok("no page errors", errs.length === 0, errs.join(" | ").slice(0, 300));
console.log(log.join("\n"));
await b.close();
