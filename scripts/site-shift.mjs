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

async function holdUntil(page, code, ms, needle) {
  await page.keyboard.down(code);
  const steps = Math.ceil(ms / 400);
  let hit = false;
  for (let i = 0; i < steps; i++) {
    await page.waitForTimeout(400);
    const now = (await hud(page)).toLowerCase();
    if (needle && now.includes(needle.toLowerCase())) {
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
  for (let i = 0; i < 10; i++) {
    if (!(await page.getByTestId("paper-talk").count())) return;
    await page.keyboard.press("Enter");
    await page.waitForTimeout(280);
  }
}

async function reach(page, needle, moves, lines, tag) {
  const want = needle.toLowerCase();
  for (const [code, ms] of moves) {
    await dismissTalk(page);
    const now = (await hud(page)).toLowerCase();
    if (now.includes(want)) return true;
    if (await holdUntil(page, code, ms, needle)) return true;
  }
  await dismissTalk(page);
  const now = await hud(page);
  log(lines, `${tag} looking for ${JSON.stringify(needle)} hud: ${now || "(no instrument)"}`);
  return now.toLowerCase().includes(want);
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
    const sign = page.getByRole("button", { name: "Sign the unit" });
    if ((await sign.count()) && (await sign.first().isVisible().catch(() => false))) {
      await sign.first().click();
      log(lines, `${type.id} signed`);
      await page.waitForTimeout(400);
      continue;
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
      await cont.first().click();
      await page.waitForTimeout(180);
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
  await page.screenshot({ path: `${out}/${tag}-reactor-control.png` });
  if (n >= 2) {
    await ranges.nth(1).fill("50");
    await ranges.nth(0).fill("100");
    await page.waitForTimeout(2800);
  }
  await page.screenshot({ path: `${out}/${tag}-reactor-after.png` });
  const panel = await bodyText(page);
  log(lines, `${tag} scram text: ${/Scram/i.test(panel)}`);
  const close = page.getByTestId("close-control");
  if (await close.count()) await close.click().catch(() => {});
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  if (await page.getByTestId("pause-stage").count()) await page.keyboard.press("Escape");
  const back = page.getByRole("button", { name: "Back to shift" });
  if (await back.count()) await back.click().catch(() => {});
  await page.waitForTimeout(250);
  if ((await hud(page)) === "") await page.keyboard.press("Escape");
}

async function oneShift(browser, type, width, height) {
  const lines = [];
  const pageErrors = [];
  const missing = [];
  const tag = `${type.id}-${width}x${height}`;
  const page = await browser.newPage({ viewport: { width, height } });
  page.on("pageerror", (e) => pageErrors.push(String(e)));
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
    const toLot = [
      ["KeyW", 1000],
      ["KeyD", 5000],
    ];
    const lot = await reach(page, "Lot / Campus", toLot, lines, tag);
    await page.screenshot({ path: `${out}/${tag}-lot.png` });
    log(lines, `${tag} lot: ${lot}`);

    const toHall = [
      ["KeyD", 8000],
      ["KeyW", 4500],
      ["KeyS", 8000],
      ["KeyD", 2000],
      ["KeyW", 4500],
    ];
    const corridor = await reach(page, "Main corridor", toHall, lines, tag);
    await page.screenshot({ path: `${out}/${tag}-corridor.png` });
    log(lines, `${tag} corridor: ${corridor}`);

    const toControl = [
      ["KeyD", 2500],
      ["KeyW", 2500],
    ];
    const control = await reach(page, "Control room", toControl, lines, tag);
    await page.screenshot({ path: `${out}/${tag}-control.png` });
    log(lines, `${tag} control: ${control}`);

    const toCore = [
      ["KeyW", 1400],
      ["KeyD", 3000],
    ];
    const core = await reach(page, "Reactor hall", toCore, lines, tag);
    await page.screenshot({ path: `${out}/${tag}-hall.png` });
    log(lines, `${tag} hall: ${core}`);

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
const jobs = [
  ...(only ? TYPES.filter((t) => t.id === only) : TYPES).map((type) => [type, 1280, 720]),
  ...(only ? [] : [[TYPES[0], 390, 844]]),
];
for (const [type, w, h] of jobs) {
  try {
    chunks.push(await oneShift(browser, type, w, h));
  } catch (err) {
    const line = `${type.id}-${w}x${h} THREW ${err instanceof Error ? err.message.split("\n")[0] : err}`;
    chunks.push(line);
    console.log(line);
  }
}
await browser.close();
writeFileSync(`${out}/shift-log.txt`, chunks.join("\n\n") + "\n");
console.log("SHIFT_EXIT:0");
