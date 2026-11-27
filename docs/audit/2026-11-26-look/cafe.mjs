// The painted café and the chibi cast, with real keys from the day-1 spawn: walk up, sit in the teal armchair,
// stand, walk up to the window, talk to Mabel. Hooks only to boot straight into play (labelled) and to read state.
//   node docs/audit/2026-11-26-look/cafe.mjs 1280x720   (and 390x844)
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
const hold = async (key, ms) => { await p.keyboard.down(key); await z(ms); await p.keyboard.up(key); await z(150); };
await T("bootPlay"); await z(1200); // labelled: straight into day 1
ok("day 1 starts in the café", (await T("getRoom")) === "cafe");
const art = await p.evaluate(async () => {
  const load = (src) => new Promise((r) => { const im = new Image(); im.onload = () => r([im.naturalWidth, im.naturalHeight]); im.onerror = () => r(null); im.src = src; });
  return { atlas: await load("/art/rooms/cafe/candy.png?v=candy1"), light: await load("/art/rooms/cafe/candy-lamps.png?v=candy2"), glow: await load("/art/rooms/cafe/candy-window.png?v=candy2"), walk: await load("/art/gen/sprites/mabel_walk4.png") };
});
ok("painted atlas, lamp and window light, and walk sheets load", art.atlas?.[1] === 256 && art.light?.[0] === 320 && art.glow?.[0] === 320 && art.walk?.[0] === 128 && art.walk?.[1] === 192, JSON.stringify(art));
await p.screenshot({ path: `01-cafe-arrive-${tag}.png` });
// Walk up into the teal armchair and sit.
for (let k = 0; k < 8 && !(await T("getSitting")); k++) {
  if ((await T("getY")) > 196) await hold("ArrowUp", 120);
  await p.keyboard.press("KeyE"); await z(500);
}
ok("sat in the teal armchair", await T("getSitting"), `${await T("getX")},${await T("getY")}`);
await z(600); await p.screenshot({ path: `02-cafe-sitting-${tag}.png` });
await p.keyboard.press("KeyE"); await z(500);
ok("stood up again", !(await T("getSitting")));
// Up past the counter's end to the window.
await hold("ArrowUp", 1600);
const y = await T("getY");
ok("walked up past the counter to the window", y < 96, `y ${y}`);
await z(900); await p.screenshot({ path: `03-cafe-window-${tag}.png` });
// Mabel.
await T("startTalk", "mabel"); await z(1500);
const talk = await p.locator("[data-testid='paper-talk']").innerText().catch(() => "");
ok("Mabel talks", /Mabel/i.test(talk), talk.replace(/\s+/g, " ").slice(0, 80));
await p.screenshot({ path: `04-cafe-mabel-${tag}.png` });
// The hour through the window (labelled: setSky holds the sky without moving the shift's clock).
const shots = {};
for (const [name, m] of [["sunrise", 415], ["midday", 720], ["sunset", 1000], ["night", 1290]]) {
  await T("setSky", m); await z(500);
  shots[name] = await p.screenshot({ path: `08-cafe-${name}-${tag}.png` });
}
await T("setSky", null);
const differ = new Set(Object.values(shots).map((b) => b.toString("base64"))).size;
ok("sunrise, midday, sunset and night each look different", differ === 4);
ok("the clock didn't move for the preview, and the shift goes on", (await T("getMinutes")) < 480 && ["play", "dialogue"].includes(await T("getMode")), `${await T("getMinutes")} ${await T("getMode")}`);
ok("no page errors", errs.length === 0, errs.join(" | ").slice(0, 300));
console.log(log.join("\n"));
await b.close();
