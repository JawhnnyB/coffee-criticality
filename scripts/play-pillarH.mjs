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
await page.waitForTimeout(400);
await page.evaluate(async () => {
  for (let i = 0; i < 80; i++) {
    if (window.__controlsTest) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("no __controlsTest");
});

await page.click("body");
await page.evaluate(() => window.__controlsTest.bootPlay());
await page.waitForTimeout(350);

async function firstMeet(id, checks) {
  await page.evaluate((npc) => {
    const t = window.__controlsTest;
    t.setFlag(npc + "Talked", false);
    t.startTalk(npc);
  }, id);
  await page.waitForTimeout(350);
  const got = await page.evaluate(() => {
    const paper = document.querySelector('[data-testid="paper-talk"]');
    return paper ? paper.innerText : "";
  });
  await page.screenshot({ path: `/workspace/screenshots/pillarH-${id}.png` });
  for (const c of checks) {
    if (!c.test(got)) throw new Error(`${id} intro missing ${c.need}: ${got.slice(0, 180)}`);
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(120);
  return got;
}

const mabel = await firstMeet("mabel", [
  { need: "beat", test: (t) => t.includes("Catch greater than heroics") },
  { need: "who", test: (t) => /Mabel Quinn|retired floor|Sit\. I'm Mabel/i.test(t) },
]);
const holt = await firstMeet("holt", [
  { need: "name", test: (t) => t.includes("Reginald Holt") || t.includes("I own the shift") },
  { need: "beat", test: (t) => t.includes("Volume") },
]);
const elena = await firstMeet("elena", [
  { need: "name", test: (t) => t.includes("Elena Vargas") },
  { need: "life", test: (t) => /child seat|Two at home|lighthouse/i.test(t) },
]);
const tommy = await firstMeet("tommy", [
  { need: "name", test: (t) => t.includes("Thomas Reyes") },
  { need: "lototo", test: (t) => /LOTOTO|lock, tag/i.test(t) },
]);
const marcus = await firstMeet("marcus", [
  { need: "name", test: (t) => t.includes("Marcus Hale") },
  { need: "verify", test: (t) => /two instruments|Independent verification/i.test(t) },
]);
const priya = await firstMeet("priya", [
  { need: "physics", test: (t) => /Delayed neutrons|three scales|not a license/i.test(t) },
]);
const jordan = await firstMeet("jordan", [
  { need: "name", test: (t) => t.includes("Jordan Kline") },
  { need: "share", test: (t) => /both names|transferred last outage|missed it alone/i.test(t) },
]);

async function academyAt(i, need) {
  await page.evaluate((n) => window.__controlsTest.setAcademy(n), i);
  await page.waitForTimeout(320);
  const got = await page.evaluate(() => ({
    title: window.__controlsTest.getAcademyTitle(),
    text: document.querySelector('[data-testid="academy-stage"]')?.innerText || "",
  }));
  const blob = got.title + " " + got.text;
  if (!need.test(blob)) throw new Error(`academy ${i} missing ${need.source}: ${got.title}`);
  return got.title;
}

const barriers = await academyAt(9, /barrier|clad|containment/i);
await page.screenshot({ path: "/workspace/screenshots/pillarH-barriers.png" });
const delayed = await academyAt(12, /delay|reactiv/i);
await page.screenshot({ path: "/workspace/screenshots/pillarH-delayed.png" });
const six = await academyAt(13, /six/i);
await page.screenshot({ path: "/workspace/screenshots/pillarH-six.png" });
const xenon = await academyAt(15, /xenon/i);
await page.screenshot({ path: "/workspace/screenshots/pillarH-xenon.png" });
const lototo = await academyAt(16, /LOTOTO|lock, tag/i);
await page.screenshot({ path: "/workspace/screenshots/pillarH-lototo.png" });
const period = await academyAt(19, /period/i);
await page.screenshot({ path: "/workspace/screenshots/pillarH-period.png" });
const beta = await academyAt(20, /β|dollar|prompt-critical/i);
await page.screenshot({ path: "/workspace/screenshots/pillarH-beta.png" });

await page.evaluate(() => {
  window.__controlsTest.warp("control", 300, 90);
  window.__controlsTest.openStillId("barriers");
});
await page.waitForTimeout(350);
const still = await page.evaluate(() => ({
  mode: window.__controlsTest.getMode(),
  text: document.body.innerText,
  img: document.querySelector("img")?.getBoundingClientRect()?.height ?? 0,
}));
await page.screenshot({ path: "/workspace/screenshots/pillarH-still-barriers.png" });
if (still.mode !== "still") throw new Error("protocol still not open");
if (!/Teaching/i.test(still.text)) throw new Error("still missing teaching line");

await page.keyboard.press("Escape");
await page.waitForTimeout(200);
await page.evaluate(() => window.__controlsTest.openStillId("delayed"));
await page.waitForTimeout(300);
await page.screenshot({ path: "/workspace/screenshots/pillarH-still-delayed.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(150);
await page.evaluate(() => window.__controlsTest.openStillId("lototo"));
await page.waitForTimeout(300);
await page.screenshot({ path: "/workspace/screenshots/pillarH-still-lototo.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(120);

await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => window.__controlsTest.setAcademy(10));
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/pillarH-mobile.png" });

const unique = [...new Set(errors)].filter((e) => !/favicon|og\.jpg|x-banner/i.test(e));
if (unique.length) {
  console.log(JSON.stringify({ ok: false, errors: unique, barriers, six }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      intros: { mabel: !!mabel, holt: !!holt, elena: !!elena, tommy: !!tommy, marcus: !!marcus, priya: !!priya, jordan: !!jordan },
      academy: { barriers, delayed, six, xenon, lototo, period, beta },
      still: still.mode,
      stillH: Math.round(still.img),
      screens: [
        "pillarH-mabel.png",
        "pillarH-holt.png",
        "pillarH-elena.png",
        "pillarH-tommy.png",
        "pillarH-marcus.png",
        "pillarH-priya.png",
        "pillarH-jordan.png",
        "pillarH-barriers.png",
        "pillarH-delayed.png",
        "pillarH-six.png",
        "pillarH-xenon.png",
        "pillarH-lototo.png",
        "pillarH-period.png",
        "pillarH-beta.png",
        "pillarH-still-barriers.png",
        "pillarH-still-delayed.png",
        "pillarH-still-lototo.png",
        "pillarH-mobile.png",
      ],
    },
    null,
    2,
  ),
);
await browser.close();
