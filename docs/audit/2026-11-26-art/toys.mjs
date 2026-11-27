// Art 3: the six toys on Mabel's shelf, and one held up in its gift scene, with real clicks.
// Hooks only for labelled setup (boot, tokens in the jar, cleared cabinets) and to read state.
//   node docs/audit/2026-11-26-art/toys.mjs 1280x720   (and 390x844)
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
const [w, h] = (process.argv[2] ?? "1280x720").split("x").map(Number);
const tag = `${w}`;
const b = await chromium.launch();
const log = [];
const ok = (name, pass, extra = "") => log.push(`${pass ? "PASS" : "FAIL"} ${tag} ${name}${extra ? ` (${extra})` : ""}`);
const errs = [];
const z = (p, ms) => p.waitForTimeout(ms);

const p = await b.newPage({ viewport: { width: w, height: h } });
p.setDefaultTimeout(8000);
p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("http://127.0.0.1:8093/"); await p.waitForFunction(() => window.__controlsTest);
await p.evaluate(() => { localStorage.clear(); localStorage.setItem("cc.profile", JSON.stringify({ tokens: { tokens: 20, pocket: [] } })); });
await p.reload(); await p.waitForFunction(() => window.__controlsTest);
const T = (f, ...a) => p.evaluate(([fn, args]) => window.__controlsTest[fn](...args), [f, a]);
await T("bootPlay"); await z(p, 400);
// Labelled: four cabinets cleared at level 1 (golf, bowl, fish, pebble), so four toys are on the shelf and two are shadows.
for (const cab of ["golf", "bowl", "fish", "pebble"]) await T("setFlag", `cab:${cab}:2`, true);

async function talk(who, { choose = 0, shotAt = null, name = "" } = {}) {
  await T("startTalk", who); await z(p, 900);
  const seen = [];
  let item = null;
  for (let k = 0; k < 40 && (await T("getMode")) === "dialogue"; k++) {
    const box = p.locator("[data-testid='paper-talk']");
    const text = (await box.innerText().catch(() => "")).split("\n").filter(Boolean);
    seen.push(text.slice(1).join(" · "));
    const held = p.locator("[data-testid='talk-item']");
    if (await held.count()) item = await held.evaluate((im) => ({ src: im.getAttribute("src"), nw: im.naturalWidth, w: im.getBoundingClientRect().width, top: im.getBoundingClientRect().top }));
    if (shotAt && text.join(" ").includes(shotAt) && name) { await z(p, 1800); await p.screenshot({ path: `${name}-${tag}.png` }); shotAt = null; }
    const btns = box.locator("button.paper-btn");
    if (await btns.count()) { await btns.nth(Math.min(choose, (await btns.count()) - 1)).click(); await z(p, 500); continue; }
    await box.click({ position: { x: 30, y: 20 } }); await z(p, 450);
  }
  await z(p, 300);
  return { seen, item };
}

const hello = await talk("jordan");
ok("first meeting holds nothing up", hello.item === null);
await T("forceEod"); await z(p, 900);
await p.getByRole("button", { name: "Mabel's arcade" }).click(); await z(p, 800);
const shelf = p.locator("[data-testid='prize-shelf']");
const arts = await p.locator("[data-testid^='toy-art-']").evaluateAll((ims) => ims.map((im) => ({ id: im.dataset.testid, nw: im.naturalWidth, w: im.getBoundingClientRect().width, f: getComputedStyle(im).filter })));
ok("six toy pictures on the shelf", arts.length === 6, arts.map((a) => a.id).join(","));
ok("each loaded at 24 px, shown at 48 (2x)", arts.every((a) => a.nw === 24 && Math.round(a.w) === 48), JSON.stringify(arts.map((a) => [a.nw, a.w])));
const states = Object.fromEntries(await Promise.all(["mabel", "jordan", "elena", "tommy", "marcus", "priya"].map(async (n) => [n, await p.locator(`[data-testid='toy-${n}']`).getAttribute("data-state")])));
ok("four on the shelf, two still shadows", Object.values(states).filter((s) => s === "shelf").length === 4 && states.tommy === "locked" && states.marcus === "locked", JSON.stringify(states));
ok("a locked toy is a shadow", arts.filter((a) => /brightness\(0\)/.test(a.f)).length === 2);
await shelf.scrollIntoViewIfNeeded(); await z(p, 300);
await shelf.screenshot({ path: `03-shelf-${tag}.png` });
await p.locator("[data-testid='buy-jordan']").click(); await z(p, 400);
ok("bought Jordan's pin", (await p.locator("[data-testid='toy-jordan']").getAttribute("data-state")) === "pocket");
await p.getByRole("button", { name: /Back to clock-out|Back/ }).last().click(); await z(p, 600);
await p.locator("[data-testid='eod-next']").click(); await z(p, 1200);
for (let k = 0; k < 8 && (await T("getMode")) !== "play"; k++) { await p.keyboard.press("Enter"); await z(p, 600); }
const gift = await talk("jordan", { choose: 1, shotAt: "Lane two", name: "03-gift-jordan" });
ok("Jordan gets his pin", gift.seen.some((l) => /Lane two/i.test(l)));
ok("the pin is held up over the talk", gift.item?.src === "/art/ui/toys/toy-jordan.png" && gift.item.nw === 24 && Math.round(gift.item.w) === 72, JSON.stringify(gift.item));
ok("and on screen", gift.item && gift.item.top >= 0, JSON.stringify(gift.item));
ok("and he keeps it", (await T("getFlags"))["gift:jordan"] === true);
ok("no page errors", errs.length === 0, errs.join(" | ").slice(0, 300));
console.log(log.join("\n"));
await b.close();
