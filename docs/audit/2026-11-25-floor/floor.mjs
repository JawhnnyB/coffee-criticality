// Overheard exchanges in two floor cultures, the crew page, the prize shelf and a gift, with real clicks.
// Hooks only for labelled setup (boot, who you've met, choices standing in for a week of play, tokens in the jar,
// a cleared cabinet) and to read state.
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
const [w, h] = (process.argv[2] ?? "1280x720").split("x").map(Number);
const tag = `${w}`;
const b = await chromium.launch();
const log = [];
const ok = (name, pass, extra = "") => log.push(`${pass ? "PASS" : "FAIL"} ${tag} ${name}${extra ? ` (${extra})` : ""}`);
const errs = [];

async function fresh() {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.setDefaultTimeout(8000);
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto("http://127.0.0.1:8093/"); await p.waitForFunction(() => window.__controlsTest);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("cc.profile", JSON.stringify({ tokens: { tokens: 12, pocket: [] } })); });
  await p.reload(); await p.waitForFunction(() => window.__controlsTest);
  const T = (f, ...a) => p.evaluate(([fn, args]) => window.__controlsTest[fn](...args), [f, a]);
  await T("bootPlay"); await p.waitForTimeout(400);
  return { p, T };
}
const z = (p, ms) => p.waitForTimeout(ms);
async function talk(p, T, who, { choose = 0, shotAt = null, name = "" } = {}) {
  await T("startTalk", who); await z(p, 900);
  const seen = [];
  for (let k = 0; k < 40 && (await T("getMode")) === "dialogue"; k++) {
    const box = p.locator("[data-testid='paper-talk']");
    const text = (await box.innerText().catch(() => "")).split("\n").filter(Boolean);
    seen.push(text.slice(1).join(" · "));
    if (shotAt && text.join(" ").includes(shotAt) && name) { await z(p, 1800); await p.screenshot({ path: `${name}-${tag}.png` }); shotAt = null; }
    const btns = box.locator("button.paper-btn");
    if (await btns.count()) { await btns.nth(Math.min(choose, (await btns.count()) - 1)).click(); await z(p, 500); continue; }
    await box.click({ position: { x: 30, y: 20 } }); await z(p, 450);
  }
  await z(p, 300);
  return seen;
}

// 1. A guarded floor: meet Tommy, then walk in on Tommy and Marcus.
{
  const { p, T } = await fresh();
  await talk(p, T, "tommy");
  const second = await talk(p, T, "tommy", { choose: 1, shotAt: "Marcus", name: "01-guarded-tommy-marcus" });
  ok("2nd talk opens with Tommy and Marcus", second.some((l) => /MARCUS/i.test(l)), second.slice(0, 3).join(" | ").slice(0, 160));
  const flags = await T("getFlags");
  ok("the call-out choice is recorded", flags["choice:floor-tommy-marcus-c"] === true);
  // Labelled: a week of backing people up and saying things out loud (choices standing in for play).
  for (const id of ["mabel-sit", "elena-seat", "soc-elena-2a", "marcus-forty", "jordan-out", "holt-line", "tommy-four"]) await T("setFlag", `choice:${id}`, true);
  await T("resolve", "peer"); await z(p, 300);
  await T("setFlag", "marcusTalked", true); // labelled: met Marcus, so his crew entry shows
  const third = await talk(p, T, "tommy", { choose: 0, shotAt: "Mabel", name: "02-respect-tommy-mabel" });
  ok("3rd talk: Tommy and Mabel, on a floor of respect", third.some((l) => /apprentice/i.test(l)), third.slice(0, 3).join(" | ").slice(0, 160));
  await p.keyboard.press("Escape"); await z(p, 700);
  const card = p.locator("[data-testid='floor-culture']");
  if (!(await card.count())) { await p.keyboard.press("KeyP").catch(() => {}); await z(p, 600); }
  ok("crew page shows the floor culture", (await card.getAttribute("data-culture").catch(() => null)) === "respect");
  const crew = await p.locator("[data-testid='crew-marcus']").innerText().catch(() => "");
  ok("crew page: what others say about Marcus", /Tommy says Marcus/.test(crew), crew.slice(0, 140));
  await card.scrollIntoViewIfNeeded().catch(() => {});
  await p.screenshot({ path: `03-crew-page-${tag}.png` });
  await p.close();
}

// 2. A floor of distrust: lots said out loud, little trust. Jordan and Tommy at the sign-up sheet.
{
  const { p, T } = await fresh();
  for (const id of ["marcus-forty", "jordan-out", "holt-line", "tommy-four", "mabel-catch"]) await T("setFlag", `choice:${id}`, true);
  await T("resolve", "report"); await z(p, 300);
  await talk(p, T, "jordan");
  const second = await talk(p, T, "jordan", { choose: 0, shotAt: "sheet", name: "04-distrust-jordan-tommy" });
  ok("distrust: the sign-up sheet becomes surveillance", second.some((l) => /engineering can see/i.test(l)), second.slice(0, 3).join(" | ").slice(0, 160));
  await p.close();
}

// 3. Tokens, the shelf, and Jordan's pin.
{
  const { p, T } = await fresh();
  await T("setFlag", "cab:bowl:2", true); // labelled: BOWL.CAB level 1 cleared
  await talk(p, T, "jordan");
  await T("forceEod"); await z(p, 900);
  await p.getByRole("button", { name: "Mabel's arcade" }).click(); await z(p, 800);
  const shelf = p.locator("[data-testid='prize-shelf']");
  ok("prize shelf in the arcade", (await shelf.count()) === 1);
  ok("12 tokens in the jar", (await p.locator("[data-testid='token-count']").innerText()) === "12");
  ok("Jordan's pin is on the shelf", (await p.locator("[data-testid='toy-jordan']").getAttribute("data-state")) === "shelf");
  ok("Mabel's kettle waits on her cabinet", (await p.locator("[data-testid='toy-mabel']").getAttribute("data-state")) === "locked");
  ok("no toy for Holt, and Mabel says why", /Reggie doesn't take presents/.test(await p.locator("[data-testid='toy-holt']").innerText()));
  await shelf.scrollIntoViewIfNeeded(); await p.screenshot({ path: `05-prize-shelf-${tag}.png` });
  await p.locator("[data-testid='buy-jordan']").click(); await z(p, 400);
  ok("bought: in your pocket", (await p.locator("[data-testid='toy-jordan']").getAttribute("data-state")) === "pocket");
  ok("tokens spent", (await p.locator("[data-testid='token-count']").innerText()) === "6");
  await p.getByRole("button", { name: /Back to clock-out|Back/ }).last().click(); await z(p, 600);
  await p.locator("[data-testid='eod-next']").click(); await z(p, 1200);
  for (let k = 0; k < 8 && (await T("getMode")) !== "play"; k++) { await p.keyboard.press("Enter"); await z(p, 600); }
  const gift = await talk(p, T, "jordan", { choose: 1, shotAt: "Lane two", name: "06-gift-jordan" });
  ok("Jordan gets his pin", gift.some((l) => /Lane two/i.test(l)), gift.slice(0, 2).join(" | ").slice(0, 140));
  ok("and keeps it", (await T("getFlags"))["gift:jordan"] === true);
  await p.close();
}
ok("no page errors", errs.length === 0, errs.join(" | ").slice(0, 300));
console.log(log.join("\n"));
await b.close();
