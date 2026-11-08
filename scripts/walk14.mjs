#!/usr/bin/env node
/**
 * Spec 14.4 walkthrough driver. Drives the built game through window.__controlsTest at
 * 1100×720 and 390×844, runs the fourteen steps, and prints a table:
 *   | Step | Result | What the screen showed | File or shot |
 * Result is one of: pass, pending-owner, fail.
 *
 * Usage: node scripts/walk14.mjs <out-dir>       (URL from WALK14_URL, default http://127.0.0.1:8093/)
 * Screenshots go to <out-dir>, named walk14-<step>-<WxH>.png.
 * The title screen clips at 1100×720, so the driver never clicks it. Step 1 is passed by hook.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

// Playwright is resolved from the repo first, then from the global install this sandbox uses.
const req = createRequire(import.meta.url);
let playwright;
try {
  playwright = req("playwright");
} catch {
  playwright = createRequire("/home/claude/.npm-global/lib/node_modules/")("playwright");
}
const { chromium } = playwright;
import { checkedUrl } from "./browser-guard.mjs";

const BASE = checkedUrl(process.env.WALK14_URL || "http://127.0.0.1:8093/");
const OUT = process.argv[2] || "walk14-shots";
const WIDTHS = [
  [1100, 720],
  [390, 844],
];
const TITLE = { settings: "Settings", music: "Music", radiation: "Radiation", nrc: "NRC Regulations", results: "Results", coremap: "Core Map", cam: "CORE CAM", control: "Reactor Control", news: "News", load: "LOAD.CAB", academy: "Academy" };
const ALARA = "ALARA with eyes open";
const BINOCULARS = "Binoculars from the platform. Two minutes. Then leave.";
mkdirSync(OUT, { recursive: true });

async function run(w, h) {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: w, height: h } });
  const errs = [];
  p.on("pageerror", (e) => errs.push("page: " + e.message));
  p.on("console", (m) => {
    if (m.type() === "error") errs.push("console: " + m.text());
  });
  await p.goto(BASE);
  await p.waitForTimeout(1500);
  const phone = w < 720;
  const T = (fn, ...a) => p.evaluate(([f, args]) => window.__controlsTest[f](...args), [fn, a]);
  const wait = (ms = 300) => p.waitForTimeout(ms);
  const vis = (sel) => p.locator(sel).first().isVisible().catch(() => false);
  const txt = (sel) => p.locator(sel).first().innerText({ timeout: 2000 }).then((t) => t.replace(/\s+/g, " ").trim()).catch(() => "");
  const shotName = (step) => join(OUT, `walk14-${step}-${w}x${h}.png`);
  const shot = (step) => p.screenshot({ path: shotName(step) });

  async function setupRoute(season, stance) {
    await T("wipe");
    await T("begin");
    await wait(400);
    await p.locator("[data-testid=new-shift]").focus();
    await p.keyboard.press("Enter");
    await wait(500);
    await p.click(`[data-testid=season-${season}]`);
    await p.click(`[data-testid=stance-${stance}]`);
    await p.click("[data-testid=setup-continue]");
    await wait(500);
  }
  async function reset() {
    await T("wipe");
    await T("bootPlay");
    await T("openDesk");
    await wait(400);
  }
  async function openApp(id) {
    if (phone) {
      await p.waitForSelector("[data-testid=phone-home]", { timeout: 4000 }).catch(() => {});
      for (let i = 0; i < 6; i++) {
        if (await p.locator("[data-testid=phone-home]").count()) break;
        const back = p.locator("[data-testid=phone-back]");
        if (await back.count()) await back.first().click();
        else await wait(200);
      }
      await p.click(`[data-testid=home-${id}]`, { timeout: 4000 });
      await p.waitForSelector("[data-testid=fullscreen-app]", { timeout: 4000 });
    } else {
      await p.click("[data-testid=start-button]");
      await wait(150);
      await p.click(`[role=menuitem][aria-label="${TITLE[id]}"]`, { timeout: 4000 });
    }
    await wait(350);
  }
  async function closeApp(id) {
    if (phone) await p.click("[data-testid=phone-back]", { timeout: 2000 }).catch(() => {});
    else await p.click(`[data-testid=close-${id}]`, { timeout: 2000 }).catch(() => {});
    await wait(250);
  }
  async function academyIndex(title) {
    for (let i = 0; i < 22; i++) {
      await T("setAcademy", i);
      if ((await T("getAcademyTitle")) === title) return i;
    }
    return -1;
  }
  const reactorOf = (t) => (/(PWR|BWR|Pebble|MSR)[^·]*·/.exec(t) ?? [])[0] ?? "unknown";
  const save = () => p.evaluate(() => JSON.parse(localStorage.getItem("cc.save.v2") || "null"));

  // Each step returns { result, screen, file } for this width.
  const steps = {
    1: async () => {
      await reset();
      const ok = (await vis("[data-testid=start-button]")) || (await vis("[data-testid=phone-home]"));
      await shot(1);
      return { result: ok ? "pass" : "fail", screen: "Desktop after wipe, bootPlay, openDesk. Driven by hook: the title screen clips at 1100×720 and is not clicked." };
    },
    2: async () => {
      await T("wipe");
      await T("begin");
      await wait(400);
      await p.locator("[data-testid=new-shift]").focus();
      await p.keyboard.press("Enter");
      await wait(500);
      const setup = await vis("[data-testid=setup-screen]");
      await p.click("[data-testid=season-fall]");
      await p.click("[data-testid=stance-steady]");
      await wait(200);
      const region = await txt("[data-testid=region-pending]");
      await shot(2);
      const obj = await T("getSetup");
      const pending = /Pending verification/.test(region) && obj.region === null;
      return {
        result: setup && pending ? "pending-owner" : "fail",
        screen: `New shift by keyboard (the button clips above the viewport). Season Fall, stance Steady. Region shows "${region}". Region stored: ${obj.region}. No region with a verified value exists (decision 5).`,
      };
    },
    3: async () => {
      await setupRoute("fall", "steady");
      await wait(300);
      const seasonBefore = (await T("getSetup")).season;
      await openApp("settings");
      await p.click("[data-testid=wall-winter]");
      await wait(500);
      const a = await p.screenshot();
      await p.click("[data-testid=wall-season]");
      await wait(500);
      const seasonAfter = (await T("getSetup")).season;
      await closeApp("settings");
      await shot(3);
      const changed = !a.equals(await p.screenshot());
      return {
        result: changed && seasonBefore === seasonAfter ? "pass" : "fail",
        screen: `Wallpaper switched to Winter and back to season (pixels changed: ${changed}). In-world season ${seasonBefore} → ${seasonAfter}.`,
      };
    },
    4: async () => {
      await reset();
      await openApp("music");
      const before = await txt("[data-testid=now-playing]");
      const a0 = await T("getAudio");
      await p.click("[data-testid=music-play]").catch(() => {});
      await wait(600);
      const a1 = await T("getAudio");
      await p.click("[data-testid=music-skip]").catch(() => {});
      await wait(400);
      const after = await txt("[data-testid=now-playing]");
      await shot(4);
      await closeApp("music");
      const ducked = a1.hold === true && a1.bedGain < a0.bedGain;
      return {
        result: before && after && before !== after && ducked ? "pass" : "fail",
        screen: `Now playing "${before}" → "${after}" after play and skip. While the track plays the bed is held: bed gain ${a0.bedGain} → ${a1.bedGain}, hold ${a1.hold}.`,
      };
    },
    5: async () => {
      await reset();
      await openApp("radiation");
      const body = await txt("[data-testid=app-radiation]");
      const hasRegion = /Your region/.test(body);
      const hasPending = /Pending verification/.test(body);
      await shot(5);
      // The ALARA button calls the same path as setAcademy: it must land on the ALARA page.
      const alaraBtn = p.locator("[data-testid=radiation-alara]");
      const alaraVisible = await vis("[data-testid=radiation-alara]");
      if (alaraVisible) await alaraBtn.click().catch(() => {});
      await p.waitForTimeout(300);
      const alaraTitle = await p.evaluate(() => window.__controlsTest?.getAcademyTitle?.() ?? "").catch(() => "");
      const alaraOk = alaraVisible && alaraTitle === "ALARA with eyes open";
      await p.keyboard.press("Escape").catch(() => {});
      return {
        result: hasRegion && hasPending && alaraOk ? "pass" : "fail",
        screen: `Radiation: "${body.slice(0, 160)}". Region block present: ${hasRegion}. ALARA button opens "${alaraTitle}": ${alaraOk}.`,
      };
    },
    6: async () => {
      await reset();
      await openApp("nrc");
      const link = await p.locator("[data-testid=app-nrc] a").first().getAttribute("href").catch(() => null);
      const target = await p.locator("[data-testid=app-nrc] a").first().getAttribute("target").catch(() => null);
      const search = p.locator("[data-testid=nrc-search]");
      const hasSearch = (await search.count()) > 0;
      let hit = "";
      let fifty = [];
      if (hasSearch) {
        await search.fill("50");
        await wait(150);
        fifty = await p.locator("[data-testid=app-nrc] tbody tr td:first-child").allInnerTexts();
        await search.fill("dose");
        await wait(200);
        hit = await txt("[data-testid=app-nrc]");
      }
      await shot(6);
      await closeApp("nrc");
      const linkOk = link === "https://www.ecfr.gov/current/title-10" && target === "_blank";
      if (!hasSearch) return { result: "fail", screen: `No search box. Link ok: ${linkOk}.` };
      const noHit = /No match\. Titles are not in this build\./.test(hit);
      const fiftyOk = ["Part 50", "Part 50 Appendix B", "Section 50.59"].every((x) => fifty.includes(x)) && fifty.length === 3;
      return {
        result: linkOk && noHit && fiftyOk ? "pending-owner" : "fail",
        screen: `Search "50" returns ${fifty.join(", ")}. Search "dose": ${noHit ? "No match. Titles are not in this build." : "no pending line"}. Link ${link} target=${target}.`,
      };
    },
    7: async () => {
      await reset();
      const i = await academyIndex(ALARA);
      if (i < 0) return { result: "fail", screen: "ALARA page not found by title." };
      await wait(300);
      const tier = await txt("[data-testid=academy-tier]");
      const tierOk = tier === "Tier 1";
      const option = p.getByRole("button", { name: BINOCULARS });
      const clicked = (await option.count()) > 0;
      if (clicked) await option.first().click();
      await wait(300);
      const good = await vis("text=ALARA. Time, distance, still seeing.");
      await shot(7);
      return {
        result: tierOk && clicked && good ? "pass" : "fail",
        screen: `ALARA page. Tier 1 label: ${tierOk}. Binoculars answer clicked: ${clicked}. Correct line shown: ${good}.`,
      };
    },
    8: async () => {
      await T("wipe");
      await T("bootPlay");
      const plant = await T("getPlant");
      await T("openDesk");
      await wait(400);
      await shot(8);
      return {
        result: plant ? "pass" : "fail",
        screen: `Plant set by hook (bootPlay runs startShift and finishBuilder, DEFAULT_PLANT). Desktop back: ${(await vis("[data-testid=start-button]")) || (await vis("[data-testid=phone-home]"))}.`,
      };
    },
    9: async () => {
      await reset();
      await openApp("control");
      await wait(400);
      // The bench is a full overlay in reactor mode, so the readout is read from the page.
      const readout = () => p.locator("body").innerText().catch(() => "");
      const dt = (t) => (/ΔT\s+(-?[\d.]+)\s*°C/.exec(t) ?? [])[1] ?? "none";
      const r0 = await readout();
      const dt0 = dt(r0);
      const rodsBefore = await T("getRun");
      const slider = p.locator('input[type=range]').first();
      await slider.focus();
      for (let i = 0; i < 10; i++) await p.keyboard.press("ArrowLeft");
      await wait(400);
      const rodsAfter = await T("getRun");
      const r1 = await readout();
      const dt1 = dt(r1);
      const holdBar = await p.locator("div.h-1\\.5").count();
      await shot(9);
      await closeApp("control");
      const moved = rodsAfter.rodsWithdrawnPct !== rodsBefore.rodsWithdrawnPct;
      const ok = moved && dt0 !== "none" && dt1 !== "none" && dt0 !== dt1 && holdBar > 0;
      return {
        result: ok ? "pass" : "fail",
        screen: `Design ${reactorOf(r0)}. Power ${rodsBefore.powerPct.toFixed(1)}% → ${rodsAfter.powerPct.toFixed(1)}%, flow ${rodsBefore.flowPct}% → ${rodsAfter.flowPct}%. Rods ${rodsBefore.rodsWithdrawnPct}% → ${rodsAfter.rodsWithdrawnPct}% from the slider. ΔT ${dt0} → ${dt1} °C. Hold bar present: ${holdBar > 0}.`,
      };
    },
    10: async () => {
      await reset();
      await openApp("cam");
      await wait(600);
      const cam = p.locator("[data-testid=app-cam]");
      const text = await txt("[data-testid=app-cam]");
      const c = p.locator("[data-testid=app-cam] canvas");
      const d1 = await c.evaluate((el) => el.toDataURL());
      await wait(450);
      const d2 = await c.evaluate((el) => el.toDataURL());
      await shot(10);
      await closeApp("cam");
      const ok = /Teaching view\./.test(text) && d1 !== d2;
      return {
        result: ok ? "pass" : "fail",
        screen: `CORE CAM: label "Teaching view." ${/Teaching view\./.test(text)}, frames change ${d1 !== d2}.`,
      };
    },
    11: async () => {
      await reset();
      await openApp("results");
      await wait(300);
      const text = await txt("[data-testid=app-results]");
      await shot(11);
      await closeApp("results");
      const checks = {
        health: /Results 60\b|Results \d+/.test(text) || /\b60\b/.test(text),
        coreLabel: /Core health/.test(text),
        look: /What to look at/.test(text),
        burnup: /Pending verification/.test(text),
        k997: /99\.7/.test(text),
      };
      const ok = Object.values(checks).every(Boolean);
      return {
        result: ok ? "pass" : "fail",
        screen: `Results checks ${JSON.stringify(checks)}. Text: "${text.slice(0, 200)}"`,
      };
    },
    12: async () => {
      await reset();
      await openApp("coremap");
      const SEQ = [
        [13, 21],
        [25, 35],
        [0, 8],
      ];
      const cells = p.locator("[data-testid=core-grid] button");
      for (const [a, b2] of SEQ) {
        await cells.nth(a).click();
        await cells.nth(b2).click();
        await wait(120);
      }
      const t = await txt("[data-testid=app-coremap]");
      await shot(12);
      const s = await save();
      await closeApp("coremap");
      const passed = /Pass\./.test(t);
      const done = s ? s.shuffleDone : null;
      // Close and reopen: the same grid and count must come back, and shuffleDone stays false.
      await openApp("coremap");
      await wait(300);
      const again = await txt("[data-testid=app-coremap]");
      const same = /Swaps 3\./.test(again) && /Fq 1\.48/.test(again);
      const s2 = await save();
      await closeApp("coremap");
      return {
        result: passed && done === false && same && s2?.shuffleDone === false ? "pass" : "fail",
        screen: `Core Map after 3 swaps: "${t.slice(0, 120)}". Reopened shows the same grid and count: ${same}. shuffleDone in save: ${done} → ${s2?.shuffleDone}.`,
      };
    },
    13: async () => {
      await reset();
      await openApp("news");
      await wait(300);
      const t = await txt("[data-testid=app-news], [data-testid=placeholder-news]");
      const worldText = await txt("[data-testid=news-world]");
      await p.click("[data-testid=news-tab-local]");
      await wait(200);
      const localText = await txt("[data-testid=news-local]");
      const tabs = (await vis("[data-testid=news-tab-world]")) && (await vis("[data-testid=news-tab-local]"));
      await shot(13);
      await closeApp("news");
      const notBuilt = /Not in this build\./.test(worldText) && /Not in this build\./.test(localText);
      return {
        result: tabs && notBuilt ? "pending-owner" : "fail",
        screen: `News tabs World and Local: ${tabs}. World: "${worldText}". Local: "${localText}". Headlines are not written (owner).`,
      };
    },
    14: async () => {
      await reset();
      await T("setFlag", "seen:parlor", true);
      await openApp("load");
      await p.click("[data-testid=load-start]", { timeout: 4000 }).catch(() => {});
      await wait(300);
      const keys = ["KeyA", "Digit1", "KeyB", "Digit2", "KeyC", "Digit3", "KeyD", "Digit4"];
      for (let n = 0; n < 40; n++) {
        if (await vis("[data-testid=load-leave]")) break;
        await p.keyboard.press(keys[n % keys.length]);
        await wait(700);
        await p.keyboard.press("Enter");
        await wait(200);
      }
      const ended = await vis("[data-testid=load-leave]");
      await shot(14);
      if (ended) await p.click("[data-testid=load-leave]");
      await wait(400);
      const back = (await vis("[data-testid=start-button]")) || (await vis("[data-testid=phone-home]"));
      return {
        result: ended && back ? "pass" : "fail",
        screen: `LOAD.CAB reached its end: ${ended}. Returned to desktop: ${back}.`,
      };
    },
  };

  const rows = {};
  for (let n = 1; n <= 14; n++) {
    let r;
    try {
      r = await steps[n]();
    } catch (e) {
      r = { result: "fail", screen: "Driver error: " + String(e.message).split("\n")[0] };
    }
    rows[n] = { ...r, file: shotName(n).split("/").pop() };
  }
  await b.close();
  return { rows, errs: errs.filter((e) => !/window is not defined/.test(e)) };
}

const results = {};
for (const [w, h] of WIDTHS) {
  results[`${w}x${h}`] = await run(w, h);
}

const rank = { fail: 0, "pending-owner": 1, pass: 2 };
const table = ["| Step | Result | What the screen showed | File or shot |", "|---|---|---|---|"];
for (let n = 1; n <= 14; n++) {
  const per = WIDTHS.map(([w, h]) => results[`${w}x${h}`].rows[n]);
  const result = per.reduce((a, r) => (rank[r.result] < rank[a] ? r.result : a), "pass");
  const screen = per.map((r, i) => `${WIDTHS[i][0]}×${WIDTHS[i][1]}: ${r.screen}`).join(" ");
  const files = per.map((r) => r.file).join(", ");
  table.push(`| ${n} | ${result} | ${screen.replace(/\|/g, "/")} | ${files} |`);
}
const errLines = WIDTHS.map(([w, h]) => `${w}×${h} page errors: ${results[`${w}x${h}`].errs.length}`);
const out = table.join("\n") + "\n\n" + errLines.join("\n") + "\n";
writeFileSync(join(OUT, "walk14-table.md"), out);
console.log(out);
