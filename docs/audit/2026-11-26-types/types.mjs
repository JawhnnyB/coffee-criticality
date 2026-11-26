// Each reactor type's Friday, with real clicks and keys from the title screen: a BWR outage week (bundle bench), a
// BWR week without one (TIP trace), a pebble bed (pass count) and a molten-salt site (salt loop).
// Hooks only for labelled setup (a campaign already some weeks in, skipping the first-week introductions, jumping
// to Friday, standing at the reactor-hall desk) and to read state.
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
const [w, h] = (process.argv[2] ?? "1280x720").split("x").map(Number);
const tag = `${w}`;
const b = await chromium.launch();
const log = [];
const ok = (name, pass, extra = "") => log.push(`${pass ? "PASS" : "FAIL"} ${tag} ${name}${extra ? ` (${extra})` : ""}`);
const errs = [];

async function startAt(kind, week) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
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
const strip = async (p) => p.locator("[data-testid='week-strip']").innerText().catch(() => "");
const tapStrip = async (p, z) => { await p.locator("[data-testid='week-strip'] button").click(); await z(250); return p.locator("[data-testid='week-strip-more']").innerText().catch(() => ""); };

try {
// A. BWR, week 3: the outage. Design the bundle with real clicks.
{
  const ctx = await startAt("bwr", 3);
  const { p, T, z, shot } = ctx;
  ok("BWR site", (await T("getPlant"))?.type === "bwr");
  const more = await tapStrip(p, z);
  ok("BWR week strip: no soluble boron, outage Friday", /No soluble boron/.test(more) && /bundle bench/.test(more), more.replace(/\s+/g, " ").slice(0, 140));
  await toDesk(ctx);
  ok("BWR outage Friday: the bundle bench", (await p.locator("[data-testid='bundle-bench']").count()) === 1, `${await T("getMode")} day ${await T("getDay")} flags ${Object.keys(await T("getFlags")).filter((k) => /cw|plant/.test(k)).join(",")}`);
  const fails = async () => (await p.locator("[data-testid^='bundle-checks-'][data-ok='no']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").replace("bundle-checks-", "")))).sort().join(",");
  ok("the all-high start fails four checks", (await fails()) === "enrich,fz,hot,kboc", await fails());
  // Low enrichment round the edge of the bottom layer, then copy it up.
  await p.locator("[data-testid='pin-tool-L']").click();
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) if (r === 0 || c === 0 || r === 9 || c === 9) await p.locator(`[data-testid='pin-0-${r * 10 + c}']`).click();
  await p.locator("[data-testid='bundle-layer-0']").getByRole("button", { name: "Copy to all layers" }).click(); await z(200);
  ok("low edges: enrichment fixed, the bottom still peaks", (await fails()) === "fz,hot,kboc", await fails());
  // Gadolinia low in the bundle.
  await p.locator("[data-testid='pin-tool-G']").click();
  for (const [r, c] of [[2, 2], [2, 7], [7, 2], [7, 7], [4, 2], [2, 4], [7, 5], [5, 7]]) await p.locator(`[data-testid='pin-0-${r * 10 + c}']`).click();
  for (const [r, c] of [[2, 2], [2, 7], [7, 2], [7, 7], [4, 2], [2, 4]]) await p.locator(`[data-testid='pin-1-${r * 10 + c}']`).click();
  await z(300);
  ok("gadolinia low: every check passes", (await fails()) === "", await fails());
  await p.locator("[data-testid='bundle-axial']").scrollIntoViewIfNeeded(); await shot("01-bwr-bundle-bench");
  await p.locator("[data-testid='bundle-bench-sign']").click(); await z(800);
  const f = await T("getFlags");
  ok("signed: Friday's job done, no PWR outage opened", f.shuffle === true && !f.outageOpen);
  const wl = (await T("getWeekLog")).filter((e) => e.kind === "shuffle").map((e) => e.text).join(" | ");
  ok("the week log records the bundle, not an Fq", /Reload bundle signed, hottest pin/.test(wl), wl);
  const camp = await p.evaluate(() => JSON.parse(localStorage.getItem("cc.profile")).campaign.holt.lastDesk?.bundle?.length);
  ok("the bundle is kept for the TIP traces", camp === 3);
  await p.close();
}

// B. BWR, week 2: no outage. The TIP trace.
{
  const ctx = await startAt("bwr", 2);
  const { p, T, z, shot } = ctx;
  await toDesk(ctx);
  ok("BWR week without an outage: the TIP trace", (await p.locator("[data-testid='tip-trace']").count()) === 1);
  for (let i = 0; i < 12 && !(await p.locator("[data-testid='tip-trace-sign']").isEnabled()); i++) { await p.locator(`[data-testid='tip-node-${i}']`).click(); await z(120); }
  ok("the trace is found and shown", (await p.locator("[data-testid='tip-found'], [data-testid='tip-shown']").count()) === 1);
  await shot("02-bwr-tip");
  await p.locator("[data-testid='tip-trace-sign']").click(); await z(600);
  ok("signed the trace", (await T("getFlags")).shuffle === true);
  await p.close();
}

// C. Pebble bed, week 4: the pass count by keyboard on the sliders.
{
  const ctx = await startAt("pebble", 4);
  const { p, T, z, shot } = ctx;
  ok("pebble site", (await T("getPlant"))?.type === "pebble");
  ok("pebble week strip: running in, no outages", /Running in/.test(await strip(p)));
  await toDesk(ctx);
  ok("pebble Friday: the pass count", (await p.locator("[data-testid='pass-desk']").count()) === 1);
  ok("two passes at 95 fails", !(await p.locator("[data-testid='pass-desk-sign']").isEnabled()));
  await p.locator("[data-testid='pass-slider']").focus();
  for (let k = 0; k < 13; k++) await p.keyboard.press("ArrowRight");
  await p.locator("[data-testid='burnup-slider']").focus();
  for (let k = 0; k < 5; k++) await p.keyboard.press("ArrowLeft");
  await z(200);
  const set = `${await p.locator("[data-testid='pass-count']").innerText()} / ${await p.locator("[data-testid='pass-burnup']").innerText()}`;
  ok("HTR-PM's 15 passes at 90 GWd/t holds", await p.locator("[data-testid='pass-desk-sign']").isEnabled(), set);
  await shot("03-pebble-passes");
  await p.locator("[data-testid='pass-desk-sign']").click(); await z(600);
  ok("signed the pass count", (await T("getFlags")).shuffle === true);
  await p.close();
}

// D. Molten salt, week 5: the salt loop.
{
  const ctx = await startAt("msr", 5);
  const { p, T, z, shot } = ctx;
  ok("salt site", (await T("getPlant"))?.type === "msr");
  ok("salt week strip", /Salt week 5/.test(await strip(p)));
  await toDesk(ctx);
  ok("salt Friday: the salt loop", (await p.locator("[data-testid='salt-desk']").count()) === 1);
  ok("last month's settings drift out of the band", (await p.locator("[data-testid='salt-checks-band']").getAttribute("data-ok")) === "no");
  await p.locator("[data-testid='salt-feed']").focus();
  for (let k = 0; k < 16; k++) await p.keyboard.press("ArrowRight");
  await p.locator("[data-testid='salt-sparge']").focus();
  for (let k = 0; k < 4; k++) await p.keyboard.press("ArrowRight");
  await p.locator("[data-testid='salt-cleanup']").focus();
  for (let k = 0; k < 2; k++) await p.keyboard.press("ArrowRight");
  await z(200);
  const band = await p.locator("[data-testid='salt-checks-band']").innerText();
  ok("feed 2.8, strip 50%, clean 1%: in the band all week", (await p.locator("[data-testid='salt-checks-band']").getAttribute("data-ok")) === "yes", band.replace(/\s+/g, " "));
  await shot("04-salt-loop");
  await p.locator("[data-testid='salt-desk-sign']").click(); await z(600);
  ok("signed the salt week", (await T("getFlags")).shuffle === true);
  await p.close();
}
} catch (e) {
  log.push(`ERROR ${tag} ${String(e).split("\n")[0]}`);
}
ok("no page errors", errs.length === 0, errs.join(" | ").slice(0, 300));
console.log(log.join("\n"));
await b.close();
