import { chromium } from "playwright";

const url = "http://127.0.0.1:8080/";
const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("pageerror", (e) => errors.push("page " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console " + m.text());
});

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(500);
await page.evaluate(async () => {
  for (let i = 0; i < 80; i++) {
    if (window.__controlsTest) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("no __controlsTest");
});

await page.evaluate(() => window.__controlsTest.bootPlay());
await page.waitForTimeout(600);

const cafeHud = await page.evaluate(() => {
  const t = window.__controlsTest;
  const plan = document.querySelector('[data-testid="site-plan"]');
  const inst = document.querySelector('[data-testid="instrument"]');
  const cs = plan ? getComputedStyle(plan) : null;
  return {
    room: t.getRoom(),
    mode: t.getMode(),
    time: t.getTimeLabel(),
    minutes: t.getMinutes(),
    instrument: inst ? inst.textContent.replace(/\s+/g, " ").trim() : "",
    planVisible: !!(plan && cs && cs.display !== "none"),
    planSize: plan ? { w: Math.round(plan.getBoundingClientRect().width), h: Math.round(plan.getBoundingClientRect().height) } : null,
    bodyHasDay: document.body.innerText.includes("Day 1"),
  };
});
await page.screenshot({ path: "/workspace/screenshots/pillarD-cafe.png" });

await page.evaluate(() => {
  window.__controlsTest.setFlag("mabelTalked", false);
  window.__controlsTest.startTalk("mabel");
});
await page.waitForTimeout(500);
const t0 = await page.evaluate(() => window.__controlsTest.getMinutes());
await page.waitForTimeout(1400);
const talk = await page.evaluate((frozenAt) => {
  const t = window.__controlsTest;
  const paper = document.querySelector('[data-testid="paper-talk"]');
  const text = paper ? paper.innerText : "";
  return {
    mode: t.getMode(),
    minutes: t.getMinutes(),
    frozen: t.getMinutes() === frozenAt,
    hasClockFrozen: text.includes("clock frozen"),
    hasRole: text.includes("Cafe & Arcade keeper"),
    hasPaperBtn: !!paper?.querySelector(".paper-btn"),
    speaker: text.includes("Mabel"),
    firstLine: text.includes("Sit. The floor will still be there"),
  };
}, t0);
await page.screenshot({ path: "/workspace/screenshots/pillarD-talk.png" });

await page.keyboard.press("Escape");
await page.waitForTimeout(400);

await page.evaluate(() => window.__controlsTest.openIncident());
await page.waitForTimeout(500);
const incident = await page.evaluate(() => {
  const paper = document.querySelector('[data-testid="paper-incident"]');
  const text = paper ? paper.innerText : "";
  return {
    mode: window.__controlsTest.getMode(),
    hasJustCulture: text.includes("Just Culture"),
    hasLicense: text.includes("not a license"),
    hasReport: text.includes("R · Report"),
    hasPeer: text.includes("P · Peer-check"),
    hasHide: text.includes("H · Hide"),
    hasValve: text.includes("Valve 14"),
    paperBtns: paper ? paper.querySelectorAll(".paper-btn").length : 0,
  };
});
await page.screenshot({ path: "/workspace/screenshots/pillarD-incident.png" });

await page.keyboard.press("Escape");
await page.waitForTimeout(300);

await page.keyboard.press("Escape");
await page.waitForTimeout(450);
const paused = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="pause-stage"]');
  return {
    mode: window.__controlsTest.getMode(),
    hasPaused: !!(el && el.innerText.includes("SHIFT PAUSED")),
  };
});
await page.screenshot({ path: "/workspace/screenshots/pillarD-pause.png" });

await page.keyboard.press("Escape");
await page.waitForTimeout(300);

await page.evaluate(() => window.__controlsTest.setMinutes(16 * 60 + 25));
await page.waitForTimeout(400);
const close = await page.evaluate(() => {
  const btn = document.querySelector('[data-testid="close-shift"]');
  return {
    prompt: window.__controlsTest.getClosePrompt(),
    text: btn ? btn.textContent.trim() : "",
  };
});
await page.screenshot({ path: "/workspace/screenshots/pillarD-close.png" });

await page.evaluate(() => window.__controlsTest.forceEod());
await page.waitForTimeout(500);
const eod = await page.evaluate(() => {
  const paper = document.querySelector('[data-testid="paper-eod"]');
  const text = paper ? paper.innerText : "";
  return {
    mode: window.__controlsTest.getMode(),
    hasShiftLog: text.includes("Shift log"),
    hasFloor: text.includes("The floor writes back"),
    hasClockOut: text.includes("Clock out"),
  };
});
await page.screenshot({ path: "/workspace/screenshots/pillarD-eod.png" });

await page.evaluate(() => window.__controlsTest.bootPlay());
await page.waitForTimeout(400);
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(500);
const mobileHud = await page.evaluate(() => {
  const plan = document.querySelector('[data-testid="site-plan"]');
  const inst = document.querySelector('[data-testid="instrument"]');
  const cs = plan ? getComputedStyle(plan) : null;
  return {
    planVisible: !!(plan && cs && cs.display !== "none"),
    instrument: inst ? inst.textContent.replace(/\s+/g, " ").trim() : "",
    overflowX: document.documentElement.scrollWidth > 390 + 2,
  };
});
await page.screenshot({ path: "/workspace/screenshots/pillarD-mobile.png" });

await page.evaluate(() => {
  window.__controlsTest.setFlag("mabelTalked", false);
  window.__controlsTest.startTalk("mabel");
});
await page.waitForTimeout(500);
await page.screenshot({ path: "/workspace/screenshots/pillarD-mobile-talk.png" });

await page.keyboard.press("Escape");
await page.waitForTimeout(250);
await page.evaluate(() => window.__controlsTest.openIncident());
await page.waitForTimeout(500);
const mobileIncident = await page.evaluate(() => {
  const paper = document.querySelector('[data-testid="paper-incident"]');
  const r = paper ? paper.getBoundingClientRect() : null;
  return {
    overflowX: document.documentElement.scrollWidth > 390 + 2,
    paperBottom: r ? Math.round(r.bottom) : null,
    viewport: 844,
    clearsPad: r ? r.bottom <= 844 - 48 : false,
  };
});
await page.screenshot({ path: "/workspace/screenshots/pillarD-mobile-incident.png" });

const out = {
  errors,
  cafeHud,
  talk,
  incident,
  paused,
  close,
  eod,
  mobileHud,
  mobileIncident,
};
console.log(JSON.stringify(out, null, 2));
await browser.close();
