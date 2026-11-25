// Week end → Elena's van → days off → four night openers → dawn → new week → a returning crew on day 1.
// Real clicks and keys. Hooks only for labelled setup (boot into the plant, week-one relationships, the ending,
// marking nights done instead of playing them, skipping the core builder) and to read state.
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
const [w, h] = (process.argv[2] ?? "1280x720").split("x").map(Number);
const tag = `${w}`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: w, height: h } });
p.setDefaultTimeout(8000);
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
const log = [];
const ok = (name, pass, extra = "") => log.push(`${pass ? "PASS" : "FAIL"} ${tag} ${name}${extra ? ` (${extra})` : ""}`);
const z = (ms) => p.waitForTimeout(ms);
const T = (f, ...a) => p.evaluate(([fn, args]) => window.__controlsTest[fn](...args), [f, a]);
const shot = (n) => p.screenshot({ path: `${n}-${tag}.png` });
const lines = async (sel) => (await p.locator(`${sel} [data-testid='scene-line']`).allInnerTexts()).map((t) => t.replace(/\s+/g, " "));

await p.goto("http://127.0.0.1:8093/"); await p.waitForFunction(() => window.__controlsTest);
await p.evaluate(() => { localStorage.clear(); }); await p.reload(); await p.waitForFunction(() => window.__controlsTest);
await T("bootPlay"); await z(400);
// Labelled: week one's relationships, as if they'd been earned.
for (const f of ["tommyTalked", "tommyLock", "jordanTalked", "jordanTrust", "mabelTalked", "mabelChalk", "elenaTalked", "elenaVan", "social:tommy:1", "social:tommy:2", "social:tommy:3"]) await T("setFlag", f, true);
await T("resolve", "report"); await z(200);
await T("beginEnding"); await z(400);
await p.keyboard.down("ArrowRight"); await z(1600); await p.keyboard.up("ArrowRight");
await p.keyboard.down("ArrowUp"); await z(1600); await p.keyboard.up("ArrowUp");
await p.locator("[data-testid='close-shift']").click(); await z(700);
ok("ending card", (await p.locator("[data-testid='paper-ending']").count()) === 1);
const endText = await p.locator("[data-testid='paper-ending']").innerText();
ok("no old slogan on the ending", !/Unfinished power|hiss kept talking|Catch greater than heroics/.test(endText), endText.split("\n")[2]?.slice(0, 80));
await shot("01-ending");

await p.locator("[data-testid='rotate-nights']").click(); await z(3200);
ok("Elena's van at dusk", (await p.locator("[data-testid='van-scene']").count()) === 1, (await lines("[data-testid='van-scene']")).join(" | ").slice(0, 160));
ok("days off with the crew", (await lines("[data-testid='days-off-scene']")).length >= 3);
await shot("02-van-and-days-off");
await p.locator("[data-testid='report-nights']").click(); await z(2500);
for (let n = 1; n <= 4; n++) {
  const card = p.locator(`[data-testid='opener-${n}']`);
  ok(`night ${n} opener`, (await card.count()) === 1, (await lines(`[data-testid='opener-${n}']`)).join(" | ").slice(0, 140));
  await shot(`03-opener-${n}`);
  await T("setFlag", `night:${n}:done`, true); await T("setFlag", `night:${n}:grade:A`, true); await z(2200); // labelled: the night itself is not played here
}
// Labelled: the fourth night ends at dawn; reload and continue, as a player coming back would.
await T("setFlag", "rot:dawn", true); await T("setFlag", "rot:complete", true); await T("save"); await z(300);
await p.reload(); await p.waitForFunction(() => window.__controlsTest);
const boot = p.locator("[data-testid='boot-log']"); if (await boot.count()) await boot.click({ timeout: 3000 }).catch(() => {});
await z(400); await p.locator("[data-testid='continue-shift']").click(); await z(1200);
ok("dawn on the lot", (await p.locator("[data-testid='dawn-lot']").count()) === 1);
await shot("04-dawn");

await p.locator("[data-testid='dawn-new-week']").click(); await z(500);
ok("new week says the crew remembers", (await p.locator("[data-testid='wipe-crew-note']").count()) === 1);
ok("a stranger option", (await p.locator("[data-testid='wipe-confirm-strangers']").count()) === 1);
await shot("05-new-week");
await p.locator("[data-testid='wipe-confirm-yes']").click(); await z(900);
ok("to the desk", (await T("getMode")) === "desktop", await T("getMode"));
const start = p.getByRole("button", { name: /start (a )?shift|start shift/i }).first();
if (await start.count()) { await start.click(); await z(700); }
if ((await T("getMode")) !== "role") { await T("setRole", "transferred"); await z(400); } // labelled fallback
const badge = p.locator("[data-testid^='role-']").first();
if ((await T("getMode")) === "role" && (await badge.count())) { await badge.click(); await z(700); }
ok("badge picked, builder open", (await T("getMode")) === "build", await T("getMode"));
await T("finishBuild"); await z(900); // labelled: skip designing the core
ok("returning week skips the introductions", (await T("getMode")) === "brief", await T("getMode"));
const flags = await T("getFlags");
ok("the crew came back", flags.tommyLock === true && flags.jordanTrust === true && flags["crew:returning"] === true && !flags.hid);
await shot("06-week-two-brief");
for (let k = 0; k < 8 && (await T("getMode")) !== "play"; k++) { await p.keyboard.press("Enter"); await z(600); }
ok("into the plant, week two", (await T("getMode")) === "play", await T("getMode"));
for (const who of ["tommy", "jordan"]) {
  await T("startTalk", who); await z(900);
  const said = (await T("getLines")).join(" | ");
  ok(`${who} says welcome back`, /back/i.test(said), said.slice(0, 120));
  await shot(`07-welcome-${who}`);
  for (let k = 0; k < 10 && (await T("getMode")) === "dialogue"; k++) {
    const c = p.locator("[data-testid='paper-talk'] button.paper-btn").first();
    if (await c.count()) await c.click(); else await p.locator("[data-testid='paper-talk']").click({ position: { x: 20, y: 20 } });
    await z(450);
  }
}
ok("no page errors", errs.length === 0, errs.join(" | ").slice(0, 300));
console.log(log.join("\n"));
await b.close();
