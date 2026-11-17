/**
 * Real clicks through the shared screens, after a PWR sign-in.
 * No bootPlay, warp, setBuild, forceEod, or deskLaunch.
 * Cabinet games stay closed: they appear only after the parlor is found on foot.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const out = "docs/audit/2026-11-18-site";
mkdirSync(out, { recursive: true });
const base = process.env.PLAY_URL || "http://127.0.0.1:8080/";
const width = Number(process.env.SHIFT_W || 1280);
const height = Number(process.env.SHIFT_H || 720);
const tag = `screens-${width}x${height}`;

const APPS = [
  ["Settings", "settings", "settings-app"],
  ["Music", "music", "music-app"],
  ["News", "news", "app-news"],
  ["Radiation", "radiation", "app-radiation"],
  ["NRC Regulations", "nrc", "app-nrc"],
  ["Results", "results", "app-results"],
  ["Core Map", "coremap", "app-coremap"],
  ["CORE CAM", "cam", "app-cam"],
  ["Academy", "academy", "academy-stage"],
  ["Reactor Control", "control", "site-panel"],
  ["Reactor Design", "design", "design-edit"],
];

function log(lines, s) {
  lines.push(s);
  console.log(s);
}

async function shot(page, name) {
  await page.screenshot({ path: `${out}/${tag}-${name}.png` }).catch(() => {});
}

async function leaveOverlay(page) {
  const phoneBack = page.getByTestId("phone-back");
  if (await phoneBack.count()) {
    await phoneBack.click({ force: true }).catch(() => {});
    await page.waitForTimeout(250);
  }
  const closer = page.locator("[data-testid^='close-']");
  if (await closer.count()) {
    await closer.first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(200);
  }
  if (await page.getByTestId("academy-stage").count()) {
    const close = page.getByRole("button", { name: "Close" });
    if (await close.count()) await close.first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(200);
  }
  const back = page.getByRole("button", { name: "Back to shift" });
  if (await back.count()) await back.click({ force: true }).catch(() => {});
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
}

async function reachFloor(page, lines) {
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(700);
  await page.getByTestId("pixel-menu").waitFor({ timeout: 15000 });
  await shot(page, "title");
  log(lines, `${tag} title pixel-menu`);
  await page.getByTestId("menu-settings").click();
  await page.waitForTimeout(300);
  await shot(page, "title-settings");
  log(lines, `${tag} title settings sheet`);
  const how = page.getByRole("button", { name: "HOW TO PLAY" });
  if (await how.count()) {
    await how.click();
    await page.waitForTimeout(300);
    await shot(page, "how-to-play");
    log(lines, `${tag} how to play`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  }
  if (!(await page.getByTestId("pixel-menu").count())) {
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.getByTestId("pixel-menu").waitFor({ timeout: 15000 });
  }
  if (await page.getByTestId("menu-settings").count()) {
    await page.getByTestId("menu-settings").click();
    await page.waitForTimeout(200);
  }
  const credits = page.getByRole("button", { name: "CREDITS" });
  if (await credits.count()) {
    await credits.click();
    await page.waitForTimeout(300);
    await shot(page, "credits");
    log(lines, `${tag} credits`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  }
  if (!(await page.getByTestId("new-shift").count())) {
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.getByTestId("new-shift").waitFor({ timeout: 15000 });
  }
  await page.getByTestId("new-shift").click();
  await page.waitForTimeout(300);
  const wipe = page.getByTestId("wipe-confirm-yes");
  if (await wipe.count()) await wipe.click();
  await page.getByTestId("setup-screen").waitFor({ timeout: 10000 });
  await shot(page, "setup");
  log(lines, `${tag} setup region ${(await page.getByTestId("region-pending").innerText().catch(() => "")).slice(0, 40)}`);
  await page.getByTestId("setup-continue").click();
  await page.waitForTimeout(400);
  const start = page.getByTestId("start-button");
  if (await start.count()) await start.click();
  await page.getByTestId("start-shift").click();
  await page.getByTestId("role-transferred").click();
  await page.waitForTimeout(300);

  for (let i = 0; i < 90; i++) {
    if (await page.getByTestId("instrument").count()) {
      log(lines, `${tag} walked in`);
      return true;
    }
    const sign = page.locator("button").filter({ hasText: "Sign the unit" });
    if (await sign.count()) {
      await sign.first().click({ force: true, timeout: 8000 });
      log(lines, `${tag} signed`);
      await page.waitForTimeout(400);
      continue;
    }
    const walk = page.getByTestId("brief-walk");
    if (await walk.count()) {
      await walk.click({ force: true });
      await page.waitForTimeout(400);
      continue;
    }
    const intro = page.getByTestId("intro-continue");
    if (await intro.count()) {
      await intro.click({ force: true, position: { x: 8, y: 8 } });
      await page.waitForTimeout(900);
      continue;
    }
    const body = await page.locator("body").innerText();
    if (/Plant type|pick the courier/i.test(body)) {
      const picked = page.getByRole("button", { name: /this site/ });
      if (await picked.count()) {
        const next = page.getByTestId("builder-continue");
        if (await next.count()) {
          await next.first().click({ force: true, timeout: 8000 });
          await page.waitForTimeout(250);
        }
      } else {
        const pick = page.getByRole("button", { name: /^PWR/ });
        if (await pick.count()) {
          await pick.first().click();
          log(lines, `${tag} type clicked`);
        }
      }
      continue;
    }
    const cont = page.getByTestId("builder-continue");
    if (await cont.count()) {
      await cont.first().click({ force: true, timeout: 8000 });
      await page.waitForTimeout(200);
      continue;
    }
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
  }
  log(lines, `${tag} did not reach the floor`);
  return false;
}

async function openApp(page, title, id) {
  for (let i = 0; i < 5; i++) {
    const home = await page.getByTestId("phone-home").isVisible().catch(() => false);
    const start = await page.getByTestId("start-button").isVisible().catch(() => false);
    if (home || start) break;
    await leaveOverlay(page);
  }
  const phone = await page.getByTestId("phone-home").isVisible().catch(() => false);
  if (phone) {
    const icon = page.getByTestId(`home-${id}`);
    if (!(await icon.count())) return "missing-icon";
    await icon.click({ force: true });
  } else {
    const start = page.getByTestId("start-button");
    if (await start.count()) await start.click({ force: true });
    await page.waitForTimeout(200);
    const item = page.getByRole("menuitem", { name: title });
    if (!(await item.count())) return "missing-menu";
    await item.click({ force: true });
  }
  await page.waitForTimeout(700);
  return "opened";
}

async function main() {
  const lines = [];
  const pageErrors = [];
  const missing = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") pageErrors.push(msg.text().slice(0, 300));
  });
  page.on("response", (r) => {
    if (r.status() === 404) missing.push(r.url());
  });
  try {
    const inPlay = await reachFloor(page, lines);
    if (inPlay) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(400);
      if (await page.getByTestId("pause-stage").count()) {
        await shot(page, "pause");
        log(lines, `${tag} pause map`);
        const academy = page.getByRole("button", { name: "Academy" });
        if (await academy.count()) {
          await academy.click();
          await page.waitForTimeout(500);
          const heat = await page.getByTestId("academy-stage").innerText().catch(() => "");
          log(lines, `${tag} pause academy: ${heat.replace(/\s+/g, " ").slice(0, 160)}`);
          await shot(page, "academy");
          const close = page.getByRole("button", { name: "Close" });
          if (await close.count()) await close.first().click();
          await page.waitForTimeout(300);
        }
        await page.keyboard.press("Escape");
        await page.waitForTimeout(300);
        if (!(await page.getByTestId("pause-stage").count())) await page.keyboard.press("Escape");
        await page.waitForTimeout(200);
      }
      const desk = page.getByTestId("pause-desktop");
      if (await desk.count()) await desk.click();
      else log(lines, `${tag} pause desktop missing`);
      await page.waitForTimeout(600);
      await shot(page, "desktop");
      const phone = await page.getByTestId("phone-home").isVisible().catch(() => false);
      log(lines, `${tag} desktop phone-home ${phone}`);

      for (const [title, id, marker] of APPS) {
        const how = await openApp(page, title, id);
        const seen = await page.getByTestId(marker).count();
        log(lines, `${tag} app ${id} ${how} marker ${marker} ${seen}`);
        await shot(page, `app-${id}`);
        if (id === "design" && (seen || (await page.getByTestId("design-builder").count()))) {
          const rebuild = page.getByTestId("design-rebuild");
          if (await rebuild.count()) {
            await rebuild.click({ force: true });
            await page.waitForTimeout(400);
          }
          for (let step = 0; step < 4 && !(await page.getByTestId("type-locked").count()); step++) {
            const next = page.getByTestId("builder-continue");
            if (!(await next.count())) break;
            await next.first().click({ force: true, timeout: 4000 }).catch(() => {});
            await page.waitForTimeout(300);
          }
          const locked = await page.getByTestId("type-locked").count();
          const lockedText = await page.getByTestId("type-locked").innerText().catch(() => "");
          log(lines, `${tag} type-locked count ${locked} text ${lockedText.replace(/\s+/g, " ")}`);
          const bwr = page.getByRole("button", { name: /^BWR/ });
          if (await bwr.count()) {
            const disabled = await bwr.first().isDisabled().catch(() => false);
            await bwr.first().click({ force: true }).catch(() => {});
            await page.waitForTimeout(200);
            const still = await page.getByTestId("type-locked").innerText().catch(() => "");
            const label = await page.getByRole("button", { name: /this site/ }).innerText().catch(() => "");
            log(lines, `${tag} BWR button disabled ${disabled} after click lock ${still.replace(/\s+/g, " ")} site ${label.replace(/\s+/g, " ")}`);
          }
          await shot(page, "type-lock");
        }
        await leaveOverlay(page);
        if (!(await page.getByTestId("desktop").count()) && !(await page.getByTestId("phone-home").count())) {
          await page.keyboard.press("Escape");
          await page.waitForTimeout(200);
          const again = page.getByTestId("pause-desktop");
          if (await again.count()) await again.click().catch(() => {});
          await page.waitForTimeout(400);
        }
      }
    }
  } catch (err) {
    log(lines, `${tag} THREW ${err instanceof Error ? err.message.split("\n")[0] : err}`);
    await shot(page, "threw");
  }
  log(lines, `${tag} pageErrors ${pageErrors.length}`);
  log(lines, `${tag} 404 ${missing.length}`);
  if (pageErrors.length) log(lines, pageErrors.slice(0, 8).join("\n"));
  if (missing.length) log(lines, [...new Set(missing)].slice(0, 12).join("\n"));
  writeFileSync(`${out}/${tag}.txt`, lines.join("\n") + "\n");
  await context.close();
  await browser.close();
  console.log("SCREENS_EXIT:0");
}

await main();
