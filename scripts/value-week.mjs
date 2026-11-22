/**
 * Step 8. One week and four nights, desk and phone.
 * Mornings, the dusk walk, end-of-day buttons, and nights are real clicks.
 * The day clock only moves while you walk, so each afternoon is the labelled
 * end-of-day hook. Nights use the labelled 16× clock and real camera clicks.
 *   node scripts/value-week.mjs http://127.0.0.1:8096/
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, devices } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8096/";
const step = process.env.VALUE_STEP ?? "08";
const outDir = new URL(`../docs/audit/2026-11-22-value/step-${step}/`, import.meta.url);
mkdirSync(outDir, { recursive: true });
const out = outDir.pathname;

const pick = (ids) => {
  if (ids.includes("grid") || ids.includes("cold")) return "electrical";
  if (ids.some((i) => /^g/.test(i))) return "radiation";
  if (ids.some((i) => ["sump", "press", "pzrl", "pool", "dwp", "pool2", "moist", "cover"].includes(i))) return "leak";
  return "equipment";
};
const mins = (text) => {
  const m = String(text).match(/(\d+):(\d+)/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : -1;
};

const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});

function shot(page, name) {
  return page.screenshot({ path: `${out}${name}.png` }).catch(() => {});
}

async function sweepNight(page) {
  await page.waitForFunction(() => typeof window.__controlsTest.setNightSpeed === "function");
  await page.evaluate(() => window.__controlsTest.setNightSpeed(16));
  const z = (ms) => page.waitForTimeout(ms);
  const cams = await page.locator("[data-testid^='nw-cam-']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(7)));
  const report = async (id, cat) => {
    try {
      await page.locator(`[data-testid='nw-cam-${id}']`).click({ timeout: 3000 });
      await z(80);
      const btn = page.locator("[data-testid='nw-report']");
      if (!(await btn.isEnabled().catch(() => false))) {
        await page.keyboard.press(" ");
        await z(80);
      }
      if (!(await btn.isEnabled().catch(() => false))) return "fail";
      await btn.click({ timeout: 3000 });
      await z(60);
      const catBtn = page.locator(`[data-testid='nw-cat-${cat}']`);
      if (!(await catBtn.isEnabled().catch(() => false))) return "fail";
      await catBtn.click({ timeout: 3000 });
      await z(60);
      const toast = await page.locator("[data-testid='nw-toast']").innerText().catch(() => "");
      if (/logged/i.test(toast)) return "logged";
      return "false";
    } catch {
      return "fail";
    }
  };
  const logged = {};
  let ci = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < 90000) {
    if (await page.locator("[data-testid='plant-phone']").count()) return { grade: "crash", stat: "plant phone" };
    if (await page.locator("[data-testid='nw-summary']").count()) break;
    const coffee = await page.locator("[data-testid='nw-coffee']").innerText().catch(() => "");
    const bar = await page.locator("[data-testid='nw-coffee'] span span").first().evaluate((e) => parseFloat(e.style.width)).catch(() => 80);
    if (bar < 16 && coffee && !coffee.includes("brewing") && !coffee.includes("0 pot")) {
      await page.keyboard.press("b");
      await z(60);
      continue;
    }
    if (coffee.includes("brewing")) {
      await z(120);
      continue;
    }
    const minute = mins(await page.locator("[data-testid='nw-clock']").innerText().catch(() => ""));
    const flashing = await page.locator("[data-testid^='nw-cam-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(7)));
    if (flashing.length) {
      const id = flashing[0];
      if (logged[id] == null || minute - logged[id] > 40) {
        const red = await page.locator("[data-testid^='nw-tile-'][data-alarm='1']").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid").slice(8)));
        if ((await report(id, pick(red))) === "logged") logged[id] = minute;
      }
    }
    const id = cams[ci++ % Math.max(1, cams.length)];
    if (!id) {
      await z(80);
      continue;
    }
    await page.locator(`[data-testid='nw-cam-${id}']`).click({ timeout: 3000 }).catch(() => {});
    await z(180);
  }
  const grade = await page.locator("[data-testid='nw-grade']").evaluate((e) => e.textContent || "").catch(() => "none");
  const stat = await page.locator("[data-testid='nw-summary'] p").evaluateAll((els) => els.map((e) => e.textContent || "")).catch(() => []);
  const wide = await page.evaluate(() => {
    const el = document.querySelector("[data-testid='nightwatch-shift']");
    if (!el) return 0;
    return el.scrollWidth - el.clientWidth;
  });
  return { grade, stat: (stat.find((t) => t.includes("false")) || stat[0] || "").trim(), wide, ms: Date.now() - t0 };
}

async function fitOf(page, testid) {
  return page.evaluate((id) => {
    const el = document.querySelector(`[data-testid='${id}']`);
    if (!el) return "missing";
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (r.width < 2 || r.height < 2) return "empty";
    const fully = r.left >= -1 && r.top >= -1 && r.right <= vw + 1 && r.bottom <= vh + 1;
    if (fully) return "ok";
    let node = el.parentElement;
    while (node) {
      const s = getComputedStyle(node);
      const scrolls = (s.overflowY === "auto" || s.overflowY === "scroll") && node.scrollHeight > node.clientHeight + 4;
      if (scrolls && r.left >= -1 && r.right <= vw + 1) return "scroll";
      node = node.parentElement;
    }
    return "cut";
  }, testid);
}

async function pageWide(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

async function stateLine(page) {
  return page.evaluate(() => {
    const t = window.__controlsTest;
    if (!t) return "no hook";
    return `mode ${t.getMode()} day ${t.getDay()} room ${t.getRoom()} ${Math.floor(t.getMinutes())}`;
  }).catch((e) => e.message.split("\n")[0]);
}

async function throughMenus(page, lines) {
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
  const boot = page.locator("[data-testid='boot-log']");
  if (await boot.count()) await boot.click({ timeout: 2000 }).catch(() => {});
  const begin = page.getByTestId("new-shift");
  await begin.waitFor({ timeout: 15000 });
  await begin.click();
  await page.waitForTimeout(250);
  const wipe = page.getByTestId("wipe-confirm-yes");
  if (await wipe.count()) await wipe.click();
  await page.getByTestId("setup-continue").click();
  await page.waitForTimeout(300);
  const start = page.getByTestId("start-button");
  if (await start.count()) await start.click();
  await page.getByTestId("start-shift").click();
  await page.getByTestId("role-transferred").waitFor({ timeout: 15000 });
  await page.getByTestId("role-transferred").click();
  await page.waitForTimeout(250);
  for (let i = 0; i < 100; i++) {
    if (await page.locator("[data-testid='plant-phone']").count()) {
      lines.push("plant phone during setup");
      return false;
    }
    const mode = await page.evaluate(() => window.__controlsTest?.getMode?.() ?? "").catch(() => "");
    if (mode === "play" || (await page.getByTestId("instrument").count())) {
      lines.push("walked in");
      return true;
    }
    if (mode === "intro" || mode === "brief") {
      // One press finishes the line or steps it. The lock is about a second.
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1300);
      continue;
    }
    const sign = page.locator("button").filter({ hasText: "Sign the unit" });
    if (await sign.count()) {
      await sign.first().click({ force: true, timeout: 8000 });
      lines.push("signed");
      await page.waitForTimeout(300);
      continue;
    }
    const body = await page.locator("body").innerText();
    if (/Plant type|pick the courier/i.test(body)) {
      const pickBtn = page.getByRole("button", { name: /PWR/ });
      if (await pickBtn.count()) await pickBtn.first().click();
      else lines.push("PWR button missing");
    }
    const cont = page.getByTestId("builder-continue");
    if (await cont.count()) {
      await cont.first().click({ force: true, timeout: 8000 });
      await page.waitForTimeout(180);
      continue;
    }
    await page.waitForTimeout(250);
  }
  lines.push(`did not reach the floor (last mode ${await page.evaluate(() => window.__controlsTest?.getMode?.() ?? "?").catch(() => "?")})`);
  return false;
}

async function runSize(name, contextOptions) {
  const lines = [];
  const bugs = [];
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors = [];
  const missing = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text().slice(0, 300));
  });
  page.on("response", (r) => {
    if (r.status() >= 400) missing.push(`${r.status()} ${r.url()}`);
  });
  const note = async (label) => {
    const wide = await pageWide(page);
    const line = `${label} | ${await stateLine(page)} | page-wide ${wide}`;
    lines.push(line);
    console.log(name, line);
    if (wide > 8) bugs.push(`${label} page wider than the window by ${wide}px`);
    if (await page.locator("[data-testid='plant-phone']").count()) bugs.push(`${label} plant phone`);
  };

  const inPlay = await throughMenus(page, lines);
  await shot(page, `${name}-arrive`);
  await note("arrive");
  if (!inPlay) bugs.push("did not walk in");

  if (inPlay) {
    for (let day = 1; day <= 5; day++) {
      const walk = page.getByTestId("brief-walk");
      if (await walk.count()) {
        await page.keyboard.press("Enter");
        await page.waitForTimeout(1200);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(400);
      }
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(900);
      await page.keyboard.up("ArrowRight");
      await page.keyboard.press("KeyE");
      await page.waitForTimeout(200);
      if (day === 1 || day === 5) await shot(page, `${name}-day${day}`);
      await note(`day ${day} morning`);
      await page.evaluate(() => window.__controlsTest.forceEod());
      await page.waitForTimeout(350);
      if (day === 1 || day === 5) await shot(page, `${name}-eod${day}`);
      await note(`day ${day} eod`);
      if (name === "phone" && day === 1) {
        await page.setViewportSize({ width: 390, height: 664 });
        await page.waitForTimeout(200);
        const shortFit = await fitOf(page, "eod-next");
        lines.push(`short eod button ${shortFit}`);
        console.log(name, "short eod", shortFit);
        await shot(page, `${name}-eod-short`);
        if (shortFit === "cut" || shortFit === "missing" || shortFit === "empty") bugs.push(`short phone end-of-day button is ${shortFit}`);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(150);
      }
      const label = day < 5 ? "Clock out · next morning" : "Walk the lot at dusk";
      const next = page.getByRole("button", { name: label });
      if (!(await next.count())) bugs.push(`day ${day} missing "${label}"`);
      else await next.click();
      await page.waitForTimeout(400);
    }
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(2200);
    await page.keyboard.up("ArrowUp");
    await shot(page, `${name}-dusk`);
    await note("dusk");
    const close = page.getByTestId("close-shift");
    if (await close.count()) await close.click();
    else bugs.push("dusk close button missing");
    await page.waitForTimeout(400);
    await shot(page, `${name}-ending`);
    const rotate = page.getByTestId("rotate-nights");
    if (!(await rotate.count())) bugs.push("rotate to nights missing");
    else await rotate.click();
    await page.waitForTimeout(400);
    const report = page.getByTestId("report-nights");
    if (!(await report.count())) bugs.push("report nights missing");
    else await report.click();
    await page.waitForTimeout(300);

    for (let night = 1; night <= 4; night++) {
      await shot(page, `${name}-night${night}`);
      await page.evaluate(() => window.__controlsTest.setNightSeed(1));
      const start = page.getByTestId("start-night");
      if (!(await start.count())) {
        bugs.push(`night ${night} start missing`);
        const text = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 240);
        lines.push(`night ${night} stuck: ${text}`);
        break;
      }
      await start.click();
      await page.waitForTimeout(250);
      if (name === "phone" && night === 1) {
        for (const id of ["nw-false", "nw-brew", "nw-tablet", "nw-leave"]) {
          const fit = await fitOf(page, id);
          lines.push(`${id} ${fit}`);
          console.log(name, id, fit);
          if (fit !== "ok") bugs.push(`night bar ${id} is ${fit}`);
        }
        await shot(page, `${name}-night-bar`);
      }
      const result = await sweepNight(page);
      lines.push(`night ${night} ${JSON.stringify(result)}`);
      console.log(name, "night", night, JSON.stringify(result));
      if (result.grade === "crash" || result.grade === "none") bugs.push(`night ${night} did not finish (${result.grade})`);
      if ((result.wide ?? 0) > 8) bugs.push(`night ${night} board wider than its frame by ${result.wide}px`);
      await shot(page, `${name}-night${night}-end`);
      const leave = page.getByTestId("nw-summary-leave");
      if (await leave.count()) await leave.click();
      else bugs.push(`night ${night} no turnover leave`);
      await page.waitForTimeout(350);
    }
    await shot(page, `${name}-after-nights`);
    await note("after nights");
    const dawn = await page.locator("[data-testid='dawn-lot']").count();
    lines.push(dawn ? "dawn lot is up" : "dawn lot is not up");
    if (!dawn) {
      const text = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 280);
      lines.push(`after nights text: ${text}`);
    }
  }

  const phoneUp = await page.locator("[data-testid='plant-phone']").count();
  if (phoneUp) bugs.push("plant phone at the end");
  await context.close();
  return { lines, bugs, errors: [...new Set(errors)], missing: [...new Set(missing)].slice(0, 40) };
}

const only = process.argv[3] ?? "both";
let desk;
let phone;
if (only === "phone") {
  desk = JSON.parse(readFileSync(`${out}result.json`, "utf8")).desk;
} else {
  desk = await runSize("desk", { viewport: { width: 1280, height: 720 } });
}
if (only === "desk") {
  phone = { lines: [], bugs: ["phone size not run"], errors: [], missing: [] };
} else {
  phone = await runSize("phone", {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: devices["iPhone 13"].userAgent,
  });
}
const report = { desk, phone };
writeFileSync(`${out}result.json`, JSON.stringify(report, null, 2) + "\n");
const bugLines = [];
for (const [name, part] of [["desk 1280×720", desk], ["phone 390×844", phone]]) {
  bugLines.push(`## ${name}`);
  if (!part.bugs.length && !part.errors.length) bugLines.push("No bugs filed from this size.");
  for (const b of part.bugs) bugLines.push(`- ${b}`);
  for (const e of part.errors) bugLines.push(`- console: ${e}`);
  const interesting = part.missing.filter((u) => !u.includes("favicon") && !u.includes("manifest"));
  for (const u of interesting) bugLines.push(`- http: ${u}`);
  bugLines.push("");
}
writeFileSync(`${out}bugs.md`, bugLines.join("\n") + "\n");
await browser.close();
console.log("PASS");
console.log(bugLines.join("\n"));
