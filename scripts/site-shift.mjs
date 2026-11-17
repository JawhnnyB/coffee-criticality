/**
 * Real-input shift for the site-reactor review.
 * Clicks, taps and keys only. No bootPlay, warp, setBuild, forceEod or deskLaunch.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const out = "docs/audit/2026-11-18-site";
mkdirSync(out, { recursive: true });
const base = process.env.PLAY_URL || "http://127.0.0.1:8080/";

const TYPES = [
  { id: "pwr", label: /PWR/ },
  { id: "bwr", label: /BWR/ },
  { id: "pebble", label: /Pebble/ },
  { id: "msr", label: /MSR/ },
];

function log(lines, s) {
  lines.push(s);
  console.log(s);
}

async function bodyText(page) {
  return page.locator("body").innerText();
}

async function hud(page) {
  const inst = page.getByTestId("instrument");
  if (await inst.count()) return (await inst.innerText()).replace(/\s+/g, " ").slice(0, 220);
  return "";
}

async function roomName(page) {
  const text = await page.getByTestId("instrument").innerText().catch(() => "");
  const lines = text.split("\n").map((s) => s.trim()).filter(Boolean);
  const i = lines.findIndex((l) => l === "LESS" || l === "MORE");
  return i >= 0 ? lines[i + 1] || "" : "";
}

async function holdUntil(page, code, ms, needle) {
  await page.keyboard.down(code);
  const steps = Math.ceil(ms / 400);
  let hit = false;
  for (let i = 0; i < steps; i++) {
    await page.waitForTimeout(400);
    const now = (await roomName(page)).toLowerCase();
    if (needle && now === needle.toLowerCase()) {
      hit = true;
      break;
    }
  }
  await page.keyboard.up(code);
  return hit;
}

async function hold(page, code, ms) {
  await holdUntil(page, code, ms, "");
}

async function dismissTalk(page) {
  await finishTalk(page);
}

async function finishTalk(page) {
  for (let i = 0; i < 24; i++) {
    if (await page.getByTestId("instrument").count()) return true;
    const choice = page.locator("[data-testid=paper-talk] button");
    if (await choice.count()) {
      await choice.first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(400);
      continue;
    }
    const paper = page.getByTestId("paper-talk");
    if (await paper.count()) await paper.click({ force: true, position: { x: 40, y: 30 } }).catch(() => {});
    else await page.keyboard.press("Enter");
    await page.waitForTimeout(450);
  }
  return (await page.getByTestId("instrument").count()) > 0;
}

async function reach(page, needle, moves, lines, tag) {
  const want = needle.toLowerCase();
  for (const [code, ms] of moves) {
    await dismissTalk(page);
    const now = (await roomName(page)).toLowerCase();
    if (now === want) return true;
    if (await holdUntil(page, code, ms, needle)) return true;
  }
  await dismissTalk(page);
  const now = await roomName(page);
  log(lines, `${tag} looking for ${JSON.stringify(needle)} room: ${now || "(none)"} hud: ${await hud(page) || "(no instrument)"}`);
  return now.toLowerCase() === want;
}

async function throughMenus(page, type, lines) {
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(600);
  const begin = page.getByTestId("new-shift");
  await begin.waitFor({ timeout: 15000 });
  await begin.click();
  await page.waitForTimeout(300);
  const wipe = page.getByTestId("wipe-confirm-yes");
  if (await wipe.count()) await wipe.click();
  await page.getByTestId("setup-continue").click();
  await page.waitForTimeout(400);
  const start = page.getByTestId("start-button");
  if (await start.count()) await start.click();
  await page.getByTestId("start-shift").click();
  const role = page.getByTestId("role-transferred");
  await role.waitFor({ timeout: 15000 });
  await role.click();
  await page.waitForTimeout(300);

  for (let i = 0; i < 90; i++) {
    if (await page.getByTestId("instrument").count()) {
      log(lines, `${type.id} walked in`);
      return true;
    }
    const sign = page.locator("button").filter({ hasText: "Sign the unit" });
    if (await sign.count()) {
      await sign.first().click({ force: true, timeout: 8000 });
      log(lines, `${type.id} signed`);
      await page.waitForTimeout(400);
      continue;
    }
    if (i === 12 || i === 30) {
      const title = await page.locator("h2").first().innerText().catch(() => "");
      const buttons = await page.locator("button").allInnerTexts().catch(() => []);
      log(lines, `${type.id} stuck ${i} ${title.replace(/\s+/g, " ").slice(0, 60)} buttons ${buttons.slice(0, 6).join(" | ").replace(/\s+/g, " ").slice(0, 180)}`);
    }
    const walk = page.getByTestId("brief-walk");
    if (await walk.count()) {
      await walk.click({ force: true });
      await page.waitForTimeout(500);
      continue;
    }
    const intro = page.getByTestId("intro-continue");
    if (await intro.count()) {
      const kicker = await page.locator(".intro-line").innerText().catch(() => "");
      if (i % 6 === 0) log(lines, `${type.id} intro ${i}: ${kicker.replace(/\s+/g, " ").slice(0, 90)}`);
      await intro.click({ force: true, position: { x: 8, y: 8 } });
      await page.waitForTimeout(1150);
      if (await page.getByTestId("instrument").count()) {
        log(lines, `${type.id} walked in`);
        return true;
      }
      if (await page.getByTestId("brief-walk").count()) continue;
      if (await intro.count()) await intro.click({ force: true, position: { x: 8, y: 8 } });
      await page.waitForTimeout(180);
      continue;
    }
    const body = await bodyText(page);
    if (/Plant type|pick the courier/i.test(body)) {
      const pick = page.getByRole("button", { name: type.label });
      if (await pick.count()) {
        await pick.first().click();
        log(lines, `${type.id} type clicked`);
      } else log(lines, `${type.id} type button missing`);
    }
    const cont = page.getByTestId("builder-continue");
    if (await cont.count()) {
      await cont.first().click({ force: true, timeout: 8000 });
      await page.waitForTimeout(220);
      continue;
    }
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
  }
  log(lines, `${type.id} did not reach the floor`);
  return false;
}

async function reactorControl(page, lines, tag) {
  await dismissTalk(page);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  const deskBtn = page.getByTestId("pause-desktop");
  if (!(await deskBtn.count())) {
    log(lines, `${tag} pause desktop missing hud ${await hud(page)}`);
    await page.keyboard.press("Escape");
    return;
  }
  await deskBtn.click();
  await page.waitForTimeout(500);
  const phone = await page.getByTestId("phone-home").isVisible().catch(() => false);
  if (phone) {
    const home = page.getByTestId("home-control");
    if (await home.count()) await home.click();
    else log(lines, `${tag} phone reactor control missing`);
  } else {
    const start = page.getByTestId("start-button");
    if (await start.isVisible().catch(() => false)) await start.click();
    const item = page.getByRole("menuitem", { name: "Reactor Control" });
    if (await item.count()) await item.click();
    else log(lines, `${tag} reactor control menu item missing`);
  }
  await page.waitForTimeout(900);
  const ranges = page.locator("input[type=range]");
  const n = await ranges.count();
  log(lines, `${tag} reactor control ranges ${n}`);
  const panel0 = await page.getByTestId("site-panel").innerText().catch(() => "");
  log(lines, `${tag} site panel: ${panel0.replace(/\s+/g, " ").slice(0, 180)}`);
  await page.screenshot({ path: `${out}/${tag}-reactor-control.png` });
  if (n >= 2) {
    await ranges.nth(0).scrollIntoViewIfNeeded().catch(() => {});
    await ranges.nth(1).fill("50", { timeout: 8000 }).catch((e) => log(lines, `${tag} flow fill failed ${e.message.split("\n")[0]}`));
    await ranges.nth(0).fill("100", { timeout: 8000 }).catch((e) => log(lines, `${tag} rod fill failed ${e.message.split("\n")[0]}`));
    await page.waitForTimeout(1200);
  }
  await page.screenshot({ path: `${out}/${tag}-reactor-mid.png` });
  const call = page.getByTestId("plant-call");
  if (await call.count()) {
    await call.scrollIntoViewIfNeeded().catch(() => {});
    await call.click();
    await page.waitForTimeout(300);
    const ev = await page.getByTestId("plant-event").innerText().catch(() => "");
    log(lines, `${tag} event: ${ev.replace(/\s+/g, " ").slice(0, 180)}`);
    await page.screenshot({ path: `${out}/${tag}-event.png` });
    const which = tag.includes("390x844") ? "event-wrong" : "event-right";
    const choice = page.getByTestId(which);
    if (await choice.count()) {
      await choice.click({ force: true, timeout: 4000 });
      await page.waitForTimeout(400);
      const result = await page.getByTestId("event-result").innerText().catch(() => "");
      log(lines, `${tag} ${which}: ${result.replace(/\s+/g, " ").slice(0, 180)}`);
      await page.screenshot({ path: `${out}/${tag}-${which}.png` });
    }
  } else log(lines, `${tag} plant call missing`);
  const scram = page.getByRole("button", { name: "Scram" });
  if (await scram.count()) {
    await scram.first().scrollIntoViewIfNeeded().catch(() => {});
    await scram.first().click({ force: true, timeout: 4000 });
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: `${out}/${tag}-reactor-after.png` });
  const panel = await bodyText(page);
  log(lines, `${tag} scram text: ${/Scram/i.test(panel)}`);
  const close = page.getByTestId("close-control");
  if (await close.count()) await close.click({ force: true, timeout: 4000 }).catch((e) => log(lines, `${tag} close-control ${e.message.split("\n")[0]}`));
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(200);
  if (await page.getByTestId("pause-stage").count()) await page.keyboard.press("Escape").catch(() => {});
  const back = page.getByRole("button", { name: "Back to shift" });
  if (await back.count()) await back.click({ force: true, timeout: 4000 }).catch(() => {});
  const phoneBack = page.getByTestId("phone-back");
  if (await phoneBack.count()) await phoneBack.click({ force: true, timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(250);
  if ((await hud(page)) === "") await page.keyboard.press("Escape").catch(() => {});
}

async function oneShift(context, type, width, height) {
  const lines = [];
  const pageErrors = [];
  const missing = [];
  const tag = `${type.id}-${width}x${height}`;
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") pageErrors.push(msg.text().slice(0, 300));
  });
  page.on("response", (r) => {
    if (r.status() === 404) missing.push(r.url());
  });
  const inPlay = await throughMenus(page, type, lines);
  await page.waitForTimeout(400);
  await page.locator("canvas").first().click({ position: { x: 40, y: 40 } }).catch(() => {});
  await page.screenshot({ path: `${out}/${tag}-cafe.png` });
  const startHud = await hud(page);
  log(lines, `${tag} cafe hud: ${startHud || "missing"} inPlay ${inPlay}`);

  if (inPlay) {
    await dismissTalk(page);
    const approach = [
      ["KeyD", 800],
      ["KeyW", 800],
      ["KeyW", 400],
      ["KeyA", 400],
      ["KeyD", 800],
      ["KeyS", 400],
      ["KeyW", 400],
    ];
    let met = false;
    for (const [code, ms] of approach) {
      await hold(page, code, ms);
      await page.keyboard.press("KeyE");
      await page.waitForTimeout(300);
      if (await page.getByTestId("paper-talk").count()) {
        met = true;
        log(lines, `${tag} mabel talk open after ${code}`);
        const back = await finishTalk(page);
        log(lines, `${tag} talk closed ${back}`);
        break;
      }
    }
    if (!met) {
      const again = [
        ["KeyA", 1200],
        ["KeyS", 800],
        ["KeyW", 400],
        ["KeyD", 400],
        ["KeyW", 400],
        ["KeyD", 400],
        ["KeyW", 400],
        ["KeyE", 0],
      ];
      for (const [code, ms] of again) {
        if (ms > 0) await hold(page, code, ms);
        await page.keyboard.press("KeyE");
        await page.waitForTimeout(250);
        if (await page.getByTestId("paper-talk").count()) {
          met = true;
          log(lines, `${tag} mabel talk open on second sweep after ${code}`);
          log(lines, `${tag} talk closed ${await finishTalk(page)}`);
          break;
        }
      }
    }
    log(lines, `${tag} after mabel: ${await hud(page)} met ${met}`);

    if (!met) {
      await page.screenshot({ path: `${out}/${tag}-mabel-miss.png` });
      log(lines, `${tag} lot: false`);
      log(lines, `${tag} corridor: false`);
      log(lines, `${tag} control: false`);
      log(lines, `${tag} hall: false`);
    } else {
    let lot = await reach(page, "Lot / Campus", [["KeyD", 8000]], lines, tag);
    if (!lot && /cafe/i.test(await roomName(page))) {
      lot = await reach(
        page,
        "Lot / Campus",
        [
          ["KeyS", 800],
          ["KeyD", 6000],
          ["KeyW", 1600],
          ["KeyD", 8000],
        ],
        lines,
        tag,
      );
    }
    await page.screenshot({ path: `${out}/${tag}-lot.png` });
    log(lines, `${tag} lot: ${lot}`);

    const toHall = [["KeyD", 16000]];
    const corridor = await reach(page, "Main corridor", toHall, lines, tag);
    await page.screenshot({ path: `${out}/${tag}-corridor.png` });
    log(lines, `${tag} corridor: ${corridor}`);

    const toControl = [
      ["KeyS", 800],
      ["KeyD", 2400],
      ["KeyW", 4000],
    ];
    const control = await reach(page, "Control room", toControl, lines, tag);
    await page.screenshot({ path: `${out}/${tag}-control.png` });
    log(lines, `${tag} control: ${control}`);

    const toCore = [
      ["KeyW", 1200],
      ["KeyD", 6000],
    ];
    const core = await reach(page, "Reactor hall", toCore, lines, tag);
    await page.screenshot({ path: `${out}/${tag}-hall.png` });
    log(lines, `${tag} hall: ${core}`);
    }

    await reactorControl(page, lines, tag);

    const before = await hud(page);
    await hold(page, "KeyA", 4000);
    await hold(page, "KeyD", 4000);
    const after = await hud(page);
    log(lines, `${tag} clock before pace: ${before}`);
    log(lines, `${tag} clock after 8s pace: ${after}`);
  }

  log(lines, `${tag} pageErrors ${pageErrors.length}`);
  log(lines, `${tag} 404 ${missing.length}`);
  if (pageErrors.length) log(lines, pageErrors.slice(0, 6).join("\n"));
  if (missing.length) log(lines, [...new Set(missing)].slice(0, 8).join("\n"));
  await page.close();
  return lines.join("\n");
}

const browser = await chromium.launch({ headless: true });
const chunks = [];
const only = process.env.SHIFT_ONLY;
const phone = process.env.SHIFT_PHONE !== "0";
const width = Number(process.env.SHIFT_W || 0);
const height = Number(process.env.SHIFT_H || 0);
const chosen = only ? TYPES.filter((t) => t.id === only) : TYPES;
const jobs = width
  ? chosen.map((type) => [type, width, height])
  : [
      ...chosen.map((type) => [type, 1280, 720]),
      ...(only || !phone ? [] : chosen.map((type) => [type, 390, 844])),
    ];
for (const [type, w, h] of jobs) {
  const context = await browser.newContext({ viewport: { width: w, height: h } });
  try {
    chunks.push(await oneShift(context, type, w, h));
  } catch (err) {
    const line = `${type.id}-${w}x${h} THREW ${err instanceof Error ? err.message.split("\n")[0] : err}`;
    chunks.push(line);
    console.log(line);
  } finally {
    await context.close();
  }
}
await browser.close();
writeFileSync(`${out}/shift-log.txt`, chunks.join("\n\n") + "\n");
console.log("SHIFT_EXIT:0");
