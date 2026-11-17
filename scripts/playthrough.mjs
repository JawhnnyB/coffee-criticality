#!/usr/bin/env node
/**
 * One in-game day, mouse and keyboard only. No window.__controlsTest.
 * Production URL: PLAY_URL or http://127.0.0.1:8094/
 *
 * CCPixel3x5 draws at half the CSS font-size (500 units in a 1000 em).
 * A 24px CSS body is 12px of ink. A 20px CSS label is 10px of ink.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const req = createRequire(import.meta.url);
const { chromium } = req("playwright");
const BASE = process.env.PLAY_URL || "http://127.0.0.1:8094/";
const OUT = process.argv[2] || "screenshots/playthrough-2026-11-14";
mkdirSync(OUT, { recursive: true });

const ONLY = process.env.PLAY_WIDTH ? Number(process.env.PLAY_WIDTH) : 0;
const WIDTHS = (ONLY ? [[ONLY, ONLY < 720 ? 844 : 720]] : [
  [1280, 720],
  [390, 844],
]);

const b = await chromium.launch();
const ledger = [];

async function scene(page, name, tag, width, fn) {
  const pageErrors = [];
  const consoleErrors = [];
  const onPage = (e) => pageErrors.push(e.message);
  const onConsole = (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  };
  page.on("pageerror", onPage);
  page.on("console", onConsole);
  let note = "";
  let ok = false;
  try {
    note = (await fn()) || "";
    ok = true;
  } catch (err) {
    note = String(err && err.message ? err.message : err).split("\n")[0];
  }
  const file = `${tag}.png`;
  await page.screenshot({ path: join(OUT, file) }).catch(() => {});
  page.off("pageerror", onPage);
  page.off("console", onConsole);
  const row = { scene: name, width, ok, note, file, pageErrors, consoleErrors };
  ledger.push(row);
  console.log(JSON.stringify({ scene: name, width, ok, note: note.slice(0, 240), pageErrors: pageErrors.length, consoleErrors: consoleErrors.length }));
}

async function hold(page, code, ms) {
  await page.keyboard.down(code);
  await page.waitForTimeout(ms);
  await page.keyboard.up(code);
}

async function hud(page) {
  const loc = page.locator("[data-testid=instrument]");
  if (!(await loc.count())) return "";
  return (await loc.innerText()).replace(/\s+/g, " ");
}

async function ink(page, selector) {
  const el = page.locator(selector).first();
  if (!(await el.count())) return null;
  return el.evaluate((node) => {
    const cs = getComputedStyle(node);
    const size = parseFloat(cs.fontSize);
    const family = cs.fontFamily;
    const pixel = /CCPixel3x5/i.test(family);
    return { css: size, ink: pixel ? size * 0.5 : size, family: family.slice(0, 40), text: (node.textContent || "").replace(/\s+/g, " ").slice(0, 60) };
  });
}

async function boxes(page) {
  return page.evaluate(() => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const bar = document.querySelector("[aria-label=Taskbar]");
    const barTop = bar ? bar.getBoundingClientRect().top : null;
    const wins = [...document.querySelectorAll("[data-testid^=window-]")].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        id: el.getAttribute("data-testid"),
        x: Math.round(r.x),
        y: Math.round(r.y),
        r: Math.round(r.right),
        b: Math.round(r.bottom),
        under: barTop != null && r.bottom > barTop + 1,
        off: r.x < -1 || r.y < -1 || r.right > vw + 1 || (barTop != null && r.bottom > barTop + 1),
      };
    });
    const icons = [...document.querySelectorAll("[data-testid^=icon-]")].map((el) => {
      const r = el.getBoundingClientRect();
      return { id: el.getAttribute("data-testid"), t: (el.innerText || "").replace(/\s+/g, " "), y: Math.round(r.y), b: Math.round(r.bottom), h: Math.round(r.height) };
    });
    let iconOverlap = false;
    for (let i = 0; i < icons.length; i++) {
      for (let j = i + 1; j < icons.length; j++) {
        const a = icons[i];
        const b2 = icons[j];
        if (a.y < b2.b && b2.y < a.b) iconOverlap = true;
      }
    }
    const map = document.querySelector("[data-testid=app-coremap]");
    const scroll = map ? map.scrollWidth > map.clientWidth + 2 : null;
    return { vw, vh, barTop: barTop == null ? null : Math.round(barTop), wins, icons, iconOverlap, scroll };
  });
}

for (const [w, h] of WIDTHS) {
  const page = await b.newPage({ viewport: { width: w, height: h } });
  const phone = w < 720;
  const tag = `${w}x${h}`;
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2200);

  await scene(page, "title", `01-title-${tag}`, w, async () => {
    const box = await page.locator("[data-testid=new-shift]").boundingBox();
    if (!box) throw new Error("Begin button missing");
    if (box.y < 0 || box.y + box.height > h) throw new Error(`Begin off screen y=${Math.round(box.y)} h=${Math.round(box.height)}`);
    return `Begin fully on screen y=${Math.round(box.y)} h=${Math.round(box.height)} bottom=${Math.round(box.y + box.height)}`;
  });

  await scene(page, "new-shift", `02-setup-${tag}`, w, async () => {
    await page.locator("[data-testid=new-shift]").click();
    const wipe = page.locator("[data-testid=wipe-confirm-yes]");
    if (await wipe.count()) await wipe.click();
    await page.waitForSelector("[data-testid=setup-screen]", { timeout: 8000 });
    await page.click("[data-testid=season-spring]");
    await page.click("[data-testid=stance-steady]");
    const btn = page.locator("[data-testid=setup-continue]");
    const box = await btn.boundingBox();
    if (!box || box.y < 0 || box.y + box.height > h) throw new Error(`Continue off screen ${JSON.stringify(box)}`);
    await btn.click();
    await page.waitForSelector("[data-testid=desktop], [data-testid=phone-home]", { timeout: 8000 });
    return `Continue on screen y=${Math.round(box.y)} bottom=${Math.round(box.y + box.height)}. Desktop open.`;
  });

  await scene(page, "reactor-design", `03-design-${tag}`, w, async () => {
    if (phone) await page.click("[data-testid=home-design]");
    else await page.click("[data-testid=icon-design]");
    await page.waitForSelector("[data-testid=reactor-builder], [data-testid=design-builder]", { timeout: 8000 });
    for (let i = 0; i < 8; i++) {
      const sign = page.getByRole("button", { name: "Sign the unit" });
      if (await sign.count()) {
        await sign.first().click();
        break;
      }
      const next = page.locator("[data-testid=builder-continue]");
      if (!(await next.count())) break;
      await next.first().click();
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(300);
    const measure = await boxes(page);
    const read = await ink(page, ".schematic-label");
    const leave = page.locator("[data-testid=close-design], [data-testid=phone-back]");
    if (await leave.count()) await leave.first().click();
    const bad = measure.wins.filter((x) => x.under || x.off);
    if (bad.length) throw new Error(`window box ${JSON.stringify(bad)}`);
    return `schematic ${JSON.stringify(read)} windows ${JSON.stringify(measure.wins)} icons overlap ${measure.iconOverlap}`;
  });

  await scene(page, "reactor-control", `04-control-${tag}`, w, async () => {
    if (phone) await page.click("[data-testid=home-control]");
    else {
      await page.click("[data-testid=start-button]");
      await page.click('[role=menuitem][aria-label="Reactor Control"]');
    }
    await page.waitForTimeout(400);
    const slider = page.locator("input[type=range]").first();
    await slider.waitFor({ timeout: 6000 });
    const box = await slider.boundingBox();
    if (box) await page.mouse.click(box.x + box.width * 0.7, box.y + box.height / 2);
    const measure = await boxes(page);
    const bad = measure.wins.filter((x) => x.under || x.off);
    if (!phone && bad.length) throw new Error(`window under or off ${JSON.stringify(bad)}`);
    return `slider clicked at 70%. ${JSON.stringify(measure.wins)} bar ${measure.barTop}`;
  });

  async function openApp(id, label) {
    if (phone) {
      const back = page.locator("[data-testid=phone-back]");
      if (await back.count()) await back.first().click();
      await page.click(`[data-testid=home-${id}]`);
    } else {
      const close = page.locator(`[data-testid=close-${id}]`);
      if (!(await close.count())) {
        await page.click("[data-testid=start-button]");
        await page.click(`[role=menuitem][aria-label="${label}"]`);
      }
    }
  }

  await scene(page, "core-cam", `05-cam-${tag}`, w, async () => {
    await openApp("cam", "CORE CAM");
    await page.waitForSelector("[data-testid=app-cam]", { timeout: 6000 });
    const t = await page.locator("[data-testid=app-cam]").innerText();
    const measure = await boxes(page);
    const cam = await page.locator("[data-testid=app-cam] canvas").boundingBox();
    if (cam && (cam.y < 0 || cam.y + cam.height > h + 2)) throw new Error(`cam canvas clipped ${JSON.stringify(cam)}`);
    return `${t.replace(/\s+/g, " ").slice(0, 180)} box ${JSON.stringify(measure.wins)}`;
  });

  await scene(page, "results", `06-results-${tag}`, w, async () => {
    await openApp("results", "Results");
    await page.waitForSelector("[data-testid=app-results]", { timeout: 6000 });
    const size = await ink(page, "[data-testid=app-results] p");
    const t = await page.locator("[data-testid=app-results]").innerText();
    if (size && size.ink < 12) throw new Error(`results ink ${size.ink}px css ${size.css}`);
    return `${JSON.stringify(size)} ${t.replace(/\s+/g, " ").slice(0, 140)}`;
  });

  await scene(page, "core-map", `07-coremap-${tag}`, w, async () => {
    await openApp("coremap", "Core Map");
    await page.waitForSelector("[data-testid=app-coremap]", { timeout: 6000 });
    const measure = await boxes(page);
    if (measure.scroll) throw new Error("core map horizontal scroll");
    return `horizontal scroll false. grid fits.`;
  });

  await scene(page, "news", `08-news-${tag}`, w, async () => {
    await openApp("news", "News");
    await page.waitForSelector("[data-testid=news-world]", { timeout: 6000 });
    const world = await page.locator("[data-testid=news-world]").innerText();
    await page.click("[data-testid=news-tab-local]");
    const local = await page.locator("[data-testid=news-local]").innerText();
    const blob = `${world} ${local}`;
    if (/Not in this build|Headlines are not written/i.test(blob)) throw new Error(blob);
    const measure = await boxes(page);
    const bad = measure.wins.filter((x) => x.under || x.off);
    if (!phone && bad.length) throw new Error(`news window ${JSON.stringify(bad)}`);
    const label = await ink(page, "[data-testid=desk-clock]");
    return `World: ${world.replace(/\s+/g, " ")} Local: ${local.replace(/\s+/g, " ")} clock ${JSON.stringify(label)} icons ${JSON.stringify(measure.icons)} overlap ${measure.iconOverlap}`;
  });

  async function closeDesk() {
    if (phone) {
      const back = page.locator("[data-testid=phone-back]");
      if (await back.count()) await back.first().click();
    } else {
      for (let i = 0; i < 6; i++) {
        const c = page.locator("[data-testid^=close-]");
        if (!(await c.count())) break;
        await c.first().click().catch(() => {});
        await page.waitForTimeout(80);
      }
    }
  }

  async function reachPlay() {
    await closeDesk();
    if (phone) await page.click("[data-testid=start-shift]");
    else {
      await page.click("[data-testid=start-button]");
      await page.click("[data-testid=start-shift]");
    }
    const wipe = page.locator("[data-testid=wipe-confirm-yes]");
    if (await wipe.count()) await wipe.click();
    await page.waitForTimeout(300);
    const role = page.locator("[data-testid=role-transferred]");
    if (await role.count()) {
      const box = await role.boundingBox();
      if (!box || box.y < 0 || box.y + box.height > h) throw new Error(`role button off screen ${JSON.stringify(box)}`);
      await role.click();
    }
    for (let i = 0; i < 70; i++) {
      if (await page.locator("[data-testid=instrument]").count()) return await hud(page);
      const sign = page.getByRole("button", { name: "Sign the unit" });
      if (await sign.count()) {
        await sign.first().click();
        await page.waitForTimeout(400);
        continue;
      }
      const next = page.locator("[data-testid=builder-continue]");
      if (await next.count()) {
        await next.first().click();
        await page.waitForTimeout(200);
        continue;
      }
      const walk = page.locator("[data-testid=brief-walk]");
      if (await walk.count()) {
        await walk.click();
        await page.waitForTimeout(500);
        continue;
      }
      const intro = page.locator("[data-testid=intro-continue]");
      if (await intro.count()) {
        // One click skips the line reveal. The next, after the lock, advances.
        await intro.click({ force: true, position: { x: 8, y: 8 } });
        await page.waitForTimeout(1200);
        if (await page.locator("[data-testid=instrument]").count()) return await hud(page);
        if (await intro.count()) await intro.click({ force: true, position: { x: 8, y: 8 } });
        await page.waitForTimeout(200);
        continue;
      }
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1200);
    }
    throw new Error("never reached the floor");
  }

  async function near(re) {
    const t = (await page.locator("body").innerText()).toLowerCase();
    return re.test(t);
  }

  async function arm() {
    const c = page.locator("canvas");
    if (await c.count()) await c.click({ position: { x: 80, y: 80 } }).catch(() => {});
  }

  async function finishTalk() {
    for (let i = 0; i < 16; i++) {
      if (!(await page.locator("[data-testid=paper-talk]").count())) return;
      const choice = page.locator("[data-testid=paper-talk] button").first();
      if (await choice.count()) await choice.click();
      else await page.keyboard.press("Enter");
      await page.waitForTimeout(300);
    }
  }

  await scene(page, "cafe", `09-cafe-${tag}`, w, async () => {
    const text = await reachPlay();
    if (!/Cafe/i.test(text)) throw new Error(`not in the cafe: ${text}`);
    await arm();
    return text;
  });

  await scene(page, "mabel", `10-mabel-${tag}`, w, async () => {
    await arm();
    await hold(page, "KeyD", 1200);
    await hold(page, "KeyW", 900);
    for (const [k, ms] of [["KeyA", 200], ["KeyW", 180], ["KeyA", 180], ["KeyS", 160], ["KeyD", 160]]) {
      if (await near(/quinn/)) break;
      await hold(page, k, ms);
    }
    if (!(await near(/quinn/))) throw new Error(`Mabel not in range. hud ${await hud(page)}`);
    await page.keyboard.press("KeyE");
    await page.waitForTimeout(400);
    if (!(await page.locator("[data-testid=paper-talk]").count())) throw new Error("dialogue did not open");
    const line = (await page.locator("[data-testid=paper-talk]").innerText()).replace(/\s+/g, " ").slice(0, 160);
    return `Dialogue open: ${line}`;
  });

  await scene(page, "lot", `11-lot-${tag}`, w, async () => {
    await finishTalk();
    await arm();
    await hold(page, "KeyD", 1800);
    if (!(await near(/lot|campus/))) {
      await hold(page, "KeyS", 250);
      await hold(page, "KeyD", 1600);
    }
    if (!(await near(/lot|campus/))) throw new Error(`lot not reached. hud ${await hud(page)}`);
    const text = await hud(page);
    if (!/DUSK|Afternoon/i.test(text)) return `Lot on foot. Not dusk. ${text}`;
    return text;
  });

  await scene(page, "control-room", `12-control-room-${tag}`, w, async () => {
    await hold(page, "KeyD", 9500);
    if (!(await near(/corridor|hall/))) throw new Error(`hall not reached. hud ${await hud(page)}`);
    await hold(page, "KeyW", 450);
    await hold(page, "KeyD", 2200);
    await hold(page, "KeyW", 1600);
    if (!(await near(/control/))) throw new Error(`control not reached. hud ${await hud(page)}`);
    return await hud(page);
  });

  await scene(page, "second-person", `13-holt-${tag}`, w, async () => {
    await hold(page, "KeyA", 500);
    await hold(page, "KeyW", 1000);
    for (const [k, ms] of [["KeyA", 180], ["KeyW", 160], ["KeyS", 160], ["KeyD", 160]]) {
      if (await near(/holt/)) break;
      await hold(page, k, ms);
    }
    if (!(await near(/holt/))) throw new Error(`Holt not in range. hud ${await hud(page)}`);
    await page.keyboard.press("KeyE");
    await page.waitForTimeout(400);
    if (!(await page.locator("[data-testid=paper-talk]").count())) throw new Error("Holt dialogue did not open");
    return (await page.locator("[data-testid=paper-talk]").innerText()).replace(/\s+/g, " ").slice(0, 140);
  });

  await scene(page, "paper-log", `14-paper-${tag}`, w, async () => {
    await finishTalk();
    await arm();
    await hold(page, "KeyD", 700);
    await hold(page, "KeyS", 400);
    if (!(await near(/paper|board|valve/))) throw new Error(`log not in range. hud ${await hud(page)}`);
    return `At the board. ${await hud(page)}`;
  });

  await scene(page, "catch", `15-catch-${tag}`, w, async () => {
    await page.keyboard.press("KeyE");
    await page.waitForTimeout(500);
    const paper = page.locator("[data-testid=paper-incident]");
    if (!(await paper.count())) throw new Error("incident paper did not open");
    await paper.getByText("Report").click();
    await page.waitForTimeout(600);
    return `Reported. hud ${await hud(page)}`;
  });

  await scene(page, "load-cab", `16-load-${tag}`, w, async () => {
    await arm();
    await hold(page, "KeyS", 2200);
    await hold(page, "KeyA", 3000);
    await hold(page, "KeyA", 4000);
    await hold(page, "KeyS", 2500);
    if (!(await near(/load|parlor/))) throw new Error(`LOAD.CAB not reached. hud ${await hud(page)}`);
    await page.keyboard.press("KeyE");
    await page.waitForTimeout(500);
    const start = page.locator("[data-testid=load-start]");
    if (await start.count()) await start.click();
    for (let i = 0; i < 6; i++) {
      if (await page.locator("[data-testid=load-leave]").count()) break;
      await page.keyboard.press("Digit1");
      await page.waitForTimeout(250);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(200);
    }
    const leave = page.locator("[data-testid=load-leave]");
    if (!(await leave.count())) throw new Error(`cabinet did not finish. hud ${await hud(page)}`);
    await leave.click();
    return "LOAD.CAB finished and left";
  });

  if (w >= 720) {
    await scene(page, "hide", `17-hide-${tag}`, w, async () => {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(400);
      const menu = page.getByRole("button", { name: "Main menu" });
      if (await menu.count()) await menu.click({ timeout: 3000 });
      await page.waitForTimeout(400);
      if (await page.locator("[data-testid=new-shift]").count()) await page.locator("[data-testid=new-shift]").click();
      if (await page.locator("[data-testid=wipe-confirm-yes]").count()) await page.locator("[data-testid=wipe-confirm-yes]").click();
      if (await page.locator("[data-testid=setup-screen]").count()) {
        await page.click("[data-testid=season-spring]");
        await page.click("[data-testid=stance-steady]");
        await page.click("[data-testid=setup-continue]");
      }
      await page.waitForTimeout(300);
      await reachPlay();
      await arm();
      await hold(page, "KeyD", 1200);
      await hold(page, "KeyW", 900);
      await hold(page, "KeyD", 1800);
      await hold(page, "KeyD", 9500);
      await hold(page, "KeyW", 450);
      await hold(page, "KeyD", 2200);
      await hold(page, "KeyW", 1600);
      await hold(page, "KeyD", 400);
      await hold(page, "KeyW", 1000);
      await page.keyboard.press("KeyE");
      await page.waitForTimeout(500);
      const paper = page.locator("[data-testid=paper-incident]");
      if (!(await paper.count())) throw new Error(`no incident on the second run. hud ${await hud(page)}`);
      await paper.getByText("Hide").click();
      await page.waitForTimeout(500);
      return `Hid. hud ${await hud(page)}`;
    });
  }

  await page.close();
}

writeFileSync(join(OUT, "ledger.json"), JSON.stringify(ledger, null, 2));
const failed = ledger.filter((r) => !r.ok);
console.log(`scenes ${ledger.length} failed ${failed.length}`);
await b.close();
process.exit(failed.length ? 1 : 0);
