// The walk in to a night watch, with real keys: from the night's opener, "Walk in through the café", then across
// the lot, through the hall and north into Control, where the watch starts. Also the new mission board on a day.
// Hooks only for labelled setup (boot straight into play; the week's flags that open the night rotation) and to
// read state.   node docs/audit/2026-11-27-night/walk.mjs 1280x720   (and 390x844)
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
const [w, h] = (process.argv[2] ?? "1280x720").split("x").map(Number);
const tag = `${w}`;
const b = await chromium.launch();
const log = [];
const ok = (name, pass, extra = "") => log.push(`${pass ? "PASS" : "FAIL"} ${tag} ${name}${extra ? ` (${extra})` : ""}`);
const errs = [];
const p = await b.newPage({ viewport: { width: w, height: h } });
p.setDefaultTimeout(8000);
p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("http://127.0.0.1:8093/"); await p.waitForFunction(() => window.__controlsTest);
await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForFunction(() => window.__controlsTest);
const T = (f, ...a) => p.evaluate(([fn, args]) => window.__controlsTest[fn](...args), [f, a]);
const z = (ms) => p.waitForTimeout(ms);
const hold = async (key, ms) => { await p.keyboard.down(key); await z(ms); await p.keyboard.up(key); await z(60); };

// 1. A day: the mission board replaces the little site plan.
await T("bootPlay"); await z(1200); // labelled: straight into day 1
ok("no site plan in the corner any more", (await p.locator("[data-testid='site-plan']").count()) === 0);
if (w < 720) {
  // Phones start folded: one line, the thing to do now. MORE opens the board.
  const folded = await p.locator("[data-testid='mission-now-folded']").innerText().catch(() => "");
  ok("folded on a phone: just what to do now", /Mabel/.test(folded), folded);
  await p.locator("[data-testid='hud-fold']").click(); await z(300);
}
const board = p.locator("[data-testid='mission-board']");
ok("a mission board instead", (await board.count()) === 1);
const states = await p.locator("[data-testid^='mission-']").evaluateAll((els) => els.filter((e) => e.dataset.state).map((e) => `${e.dataset.testid.replace("mission-", "")}:${e.dataset.state}`));
ok("day 1: sitting with Mabel is the thing to do now", states[0] === "mabel:now", states.join(" "));
ok("the count reads none of four done", (await p.locator("[data-testid='mission-count']").innerText()).trim() === "0/4");
await p.screenshot({ path: `01-day-board-${tag}.png` });

// 2. The night: the week's flags that open the rotation (labelled), then the opener's own button.
await T("setFlag", "rot:nights", true); await T("setFlag", "rot:reported", true); await z(900);
ok("the night's opener", (await p.locator("[data-testid='night-opener']").count()) === 1);
ok("it offers the walk, and a way straight to the desk", (await p.locator("[data-testid='walk-in']").count()) === 1 && (await p.locator("[data-testid='start-night']").count()) === 1);
await p.locator("[data-testid='walk-in']").click(); await z(1300);
ok("in the café, in play", (await T("getRoom")) === "cafe" && (await T("getMode")) === "play");
const hud = await p.locator("[data-testid='instrument']").innerText();
ok("the corner says night", /NIGHT 1/.test(hud) && /18:00/.test(hud), hud.replace(/\s+/g, " ").slice(0, 60));
if (w < 720) {
  const folded = await p.locator("[data-testid='mission-now-folded']").innerText().catch(() => "");
  ok("tonight, folded: walk to the watch desk", /watch desk/.test(folded), folded);
} else ok("tonight's board: walk to the watch desk", (await p.locator("[data-testid='mission-walk']").getAttribute("data-state")) === "now");
ok("the day crew has gone home; Mabel is closing up", JSON.stringify(await T("getNpcs")) === '["mabel"]', JSON.stringify(await T("getNpcs")));
await z(500); await p.screenshot({ path: `02-cafe-night-${tag}.png` });

// Steer with the arrow keys toward a point; stop on a room change.
async function steer(tx, ty, room, budget = 60) {
  for (let k = 0; k < budget; k++) {
    if ((await T("getRoom")) !== room) return true;
    const x = await T("getX"); const y = await T("getY");
    const dx = tx - x; const dy = ty - y;
    if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return false;
    if (Math.abs(dy) > 6) await hold(dy < 0 ? "ArrowUp" : "ArrowDown", Math.min(400, Math.abs(dy) * 9));
    if (Math.abs(dx) > 4) await hold(dx < 0 ? "ArrowLeft" : "ArrowRight", Math.min(500, Math.abs(dx) * 9));
  }
  return (await T("getRoom")) !== room;
}
// Café: east door.
await steer(300, 128, "cafe");
await steer(330, 128, "cafe", 6);
await z(900);
ok("out onto the lot", (await T("getRoom")) === "gate", await T("getRoom"));
await z(400); await p.screenshot({ path: `03-lot-night-${tag}.png` });
ok("Jordan's on the lot with his rounds", (await T("getNpcs")).includes("jordan"), JSON.stringify(await T("getNpcs")));
await steer(260, 176, "gate", 10);
await steer(830, 176, "gate", 80);
await steer(860, 176, "gate", 8);
await z(900);
ok("through the plant door into the hall", (await T("getRoom")) === "corridor", await T("getRoom"));
await p.screenshot({ path: `04-hall-night-${tag}.png` });
await steer(192, 90, "corridor");
await steer(192, -10, "corridor", 12);
await z(1600);
ok("into Control, and the watch starts", (await p.locator("[data-testid='nightwatch-shift']").count()) === 1);
await p.screenshot({ path: `05-watch-${tag}.png` });
ok("the clock and sky are back to themselves", (await T("getMinutes")) < 1008);
ok("no page errors", errs.length === 0, errs.join(" | ").slice(0, 300));
console.log(log.join("\n"));
await b.close();
