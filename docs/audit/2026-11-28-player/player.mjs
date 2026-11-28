// The player's new look, with real input where a player has it: from a fresh start through the intro to the badge
// screen, toggling the glasses and trying the hair colours with real clicks; then in the café, walking each way
// with real keys so the front, side and back (satchel) all show. Hooks only for labelled setup (boot straight into
// play for the walk; setLook to show the no-glasses walker in the room) and to read state.
//   node docs/audit/2026-11-28-player/player.mjs 1280x720   (and 390x844)
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
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await p.goto("http://127.0.0.1:8093/"); await p.waitForFunction(() => window.__controlsTest);
await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForFunction(() => window.__controlsTest);
const T = (f, ...a) => p.evaluate(([fn, args]) => window.__controlsTest[fn](...args), [f, a]);
const z = (ms) => p.waitForTimeout(ms);
const hold = async (key, ms) => { await p.keyboard.down(key); await z(ms); await p.keyboard.up(key); await z(200); };

// 1. Fresh start to the badge screen, clicking through as a player would.
await z(600);
await p.getByRole("button", { name: "Begin", exact: true }).click(); await z(800);
await p.locator("[data-testid='setup-continue']").click(); await z(900);
// Desktop has a Start menu; the phone desk shows Start shift straight away.
if (!(await p.locator("[data-testid='start-shift']").first().isVisible().catch(() => false))) {
  await p.locator("[data-testid='start-button']").click(); await z(400);
}
await p.locator("[data-testid='start-shift']").first().click(); await z(900);
for (let i = 0; i < 30 && (await T("getMode")) !== "role"; i++) {
  const cont = p.locator("[data-testid='intro-continue'], [data-testid='brief-walk']").first();
  if (await cont.count()) await cont.click().catch(() => {});
  else await p.keyboard.press("Enter");
  await z(450);
}
ok("reached the badge screen with real clicks", (await T("getMode")) === "role", await T("getMode"));
await z(500);
await p.screenshot({ path: `01-badge-glasses-${tag}.png` });
await p.getByRole("button", { name: "Glasses" }).click(); await z(400);
await p.screenshot({ path: `02-badge-noglasses-${tag}.png` });
await p.getByRole("button", { name: "Glasses" }).click(); await z(200);
for (const hair of ["ink", "silver", "copper"]) {
  await p.getByRole("button", { name: `Hair ${hair}` }).click(); await z(300);
  await p.screenshot({ path: `03-badge-hair-${hair}-${tag}.png` });
}
await p.getByRole("button", { name: "Hair brown" }).click(); await z(300);

// 2. In the café, walking each way with real keys.
await T("bootPlay"); await z(1200); // labelled: straight into day 1
ok("day 1 in the café", (await T("getRoom")) === "cafe");
await p.screenshot({ path: `04-cafe-front-${tag}.png` });
await hold("KeyD", 320); ok("facing right after D", (await T("getFacing")) === "right");
await p.screenshot({ path: `05-cafe-side-${tag}.png` });
await hold("KeyW", 280); ok("facing up after W", (await T("getFacing")) === "up");
await p.screenshot({ path: `06-cafe-back-${tag}.png` });
await hold("KeyA", 320); ok("facing left after A", (await T("getFacing")) === "left");
await p.screenshot({ path: `07-cafe-left-${tag}.png` });
await hold("KeyS", 200); ok("facing down after S", (await T("getFacing")) === "down");
await T("setLook", "copper", "brown", false); await z(400); // labelled: the picker's no-glasses choice, in the room
await p.screenshot({ path: `08-cafe-noglasses-${tag}.png` });
await T("setLook", "copper", "brown", true); await z(200);

ok("no page or console errors", errs.length === 0, errs.slice(0, 3).join(" | "));
console.log(log.join("\n"));
await b.close();
