// Screenshots for the window style pass. Not part of npm test.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { checkedUrl } from "./browser-guard.mjs";

const req = createRequire(import.meta.url);
let playwright;
try {
  playwright = req("playwright");
} catch {
  playwright = createRequire("/home/claude/.npm-global/lib/node_modules/")("playwright");
}
const { chromium } = playwright;

const BASE = checkedUrl(process.env.WINDOW_STYLE_URL || "http://127.0.0.1:8094/");
const OUT = join(process.cwd(), "docs/audit");
mkdirSync(OUT, { recursive: true });

const ALARA = "ALARA with eyes open";
const BINOCULARS = "Binoculars from the platform. Two minutes. Then leave.";

async function boot(page) {
  await page.evaluate(() => {
    window.__controlsTest.wipe();
    window.__controlsTest.bootPlay();
    window.__controlsTest.openDesk();
  });
  await page.waitForFunction(() => {
    const d = document.querySelector("[data-testid=desktop]");
    return d && !d.hidden;
  });
  for (let i = 0; i < 8; i++) {
    const close = page.locator("[data-testid^=close-]");
    if ((await close.count()) === 0) break;
    await close.first().click();
    await page.waitForTimeout(180);
  }
}

async function openStatic(page, id, title, phone) {
  if (phone) {
    const back = page.locator("[data-testid=phone-back]");
    if (await back.count()) await back.first().click();
    await page.waitForSelector("[data-testid=phone-home]");
    await page.click(`[data-testid=home-${id}]`);
    await page.waitForSelector("[data-testid=fullscreen-app]");
  } else {
    await page.click("[data-testid=start-button]");
    await page.click(`[role=menuitem][aria-label="${title}"]`);
    await page.waitForSelector(`[data-testid=window-${id}]`);
  }
}

async function shot(page, name) {
  const file = join(OUT, name);
  await page.screenshot({ path: file });
  return file;
}

const notes = [];

async function run(w, h) {
  const phone = w < 720;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const tag = `${w}x${h}`;
  await page.goto(BASE);
  await page.waitForFunction(() => window.__controlsTest && typeof window.__controlsTest.wipe === "function", { timeout: 20000 });
  await boot(page);
  await page.waitForTimeout(250);
  await shot(page, `2026-11-08-style-desktop-${tag}.png`);

  const wide = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (wide) notes.push(`${tag} desktop has horizontal page scroll`);

  await openStatic(page, "control", "Reactor Control", phone);
  await page.waitForTimeout(400);
  await shot(page, `2026-11-08-style-reactor-control-${tag}.png`);
  const fit = await page.evaluate(() => {
    const labels = [...document.querySelectorAll(".schematic-label")].map((el) => {
      const r = el.getBoundingClientRect();
      return { t: (el.textContent || "").trim(), x: r.x, y: r.y, w: r.width, h: r.height };
    });
    const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const mpa = labels.find((l) => l.t.includes("MPA"));
    const heat = labels.find((l) => l.t === "HEAT");
    const win = document.querySelector("[data-testid=window-control], [data-testid=fullscreen-app]");
    const wr = win ? win.getBoundingClientRect() : null;
    const task = document.querySelector("[data-testid=taskbar]");
    const tr = task ? task.getBoundingClientRect() : null;
    return {
      overlap: !!(mpa && heat && hit(mpa, heat)),
      mpa,
      heat,
      winBottom: wr ? wr.bottom : null,
      taskTop: tr ? tr.top : null,
      pageWide: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });
  if (fit.overlap) notes.push(`${tag} MPA overlaps HEAT ${JSON.stringify(fit.mpa)} ${JSON.stringify(fit.heat)}`);
  if (!phone && fit.winBottom != null && fit.taskTop != null && fit.winBottom > fit.taskTop + 1) {
    notes.push(`${tag} reactor window extends into the taskbar (${fit.winBottom} > ${fit.taskTop})`);
  }
  if (fit.pageWide) notes.push(`${tag} reactor page scrolls horizontally`);

  await boot(page);
  await page.evaluate(() => {
    const t = window.__controlsTest;
    if (typeof t.setHold === "function") t.setHold(800);
    for (let i = 0; i < 24; i++) {
      t.setAcademy(i);
      if (t.getAcademyTitle() === "ALARA with eyes open") return;
    }
  });
  await page.waitForSelector("[data-testid=academy-tier]");
  await page.waitForFunction(() => {
    const vis = document.querySelector(".teach-body span[aria-hidden='true']");
    return vis && /shielding/.test(vis.textContent || "") && /leave/.test(vis.textContent || "");
  }, { timeout: 8000 }).catch(() => {});
  const option = page.getByRole("button", { name: BINOCULARS });
  await option.first().click();
  await page.waitForTimeout(200);
  await shot(page, `2026-11-08-style-academy-${tag}.png`);
  const quiz = await page.evaluate((needle) => {
    const btn = [...document.querySelectorAll("button")].find((b) => (b.innerText || "").includes(needle));
    const body = document.querySelector(".teach-body");
    const clip = (el) => (el ? el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 4 : true);
    return {
      btn: btn ? btn.innerText : "",
      btnClip: clip(btn),
      body: body ? body.innerText : "",
      bodyClip: clip(body),
    };
  }, "Time, distance");
  if (!quiz.btn.includes("still seeing")) notes.push(`${tag} quiz answer text missing: ${quiz.btn.slice(0, 80)}`);
  if (quiz.btnClip) notes.push(`${tag} quiz button clips`);
  if (!quiz.body.includes("shielding")) notes.push(`${tag} lesson body missing shielding`);
  if (quiz.bodyClip) notes.push(`${tag} lesson body clips`);

  await boot(page);
  await openStatic(page, "radiation", "Radiation", phone);
  await page.waitForTimeout(200);
  await shot(page, `2026-11-08-style-radiation-${tag}.png`);

  await boot(page);
  await openStatic(page, "news", "News", phone);
  await page.waitForTimeout(200);
  await shot(page, `2026-11-08-style-news-${tag}.png`);

  await boot(page);
  await openStatic(page, "results", "Results", phone);
  await page.waitForTimeout(200);
  await shot(page, `2026-11-08-style-results-${tag}.png`);

  const endWide = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (endWide) notes.push(`${tag} results page scrolls horizontally`);

  await browser.close();
}

await run(1100, 720);
await run(390, 844);
console.log(notes.length ? notes.join("\n") : "no clip notes");
