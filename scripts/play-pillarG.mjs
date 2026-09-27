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
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/pillarG-cafe.png" });

// P0: dialogue choice.flag actually stamps mabelSat
await page.evaluate(() => {
  const t = window.__controlsTest;
  t.setFlag("mabelTalked", false);
  t.setFlag("mabelSat", false);
  t.startTalk("mabel");
});
await page.waitForTimeout(350);
const flagged = await page.evaluate(() => {
  const t = window.__controlsTest;
  t.choose("mabel-yes");
  return {
    mode: t.getMode(),
    mabelSat: t.getFlags().mabelSat,
    choice: t.getFlags()["choice:mabel-yes"],
  };
});
await page.waitForTimeout(250);
await page.screenshot({ path: "/workspace/screenshots/pillarG-talk-flag.png" });
if (!flagged.mabelSat) throw new Error("pickChoice did not apply choice.flag mabelSat");

await page.keyboard.press("Escape");
await page.waitForTimeout(200);

async function walkInDay(n) {
  await page.evaluate((d) => window.__controlsTest.setDay(d), n);
  await page.waitForTimeout(500);
  const brief = await page.evaluate(() => ({
    mode: window.__controlsTest.getMode(),
    room: window.__controlsTest.getRoom(),
    body: document.body.innerText,
  }));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(450);
  return brief;
}

// Day 2 commute starts at the van on the lot
const brief2 = await walkInDay(2);
const day2 = await page.evaluate(() => {
  const t = window.__controlsTest;
  return {
    day: t.getDay(),
    room: t.getRoom(),
    x: t.getX(),
    y: t.getY(),
    facing: t.getFacing(),
    mode: t.getMode(),
  };
});
await page.screenshot({ path: "/workspace/screenshots/pillarG-day2-lot.png" });
if (brief2.mode !== "brief") throw new Error("setDay(2) should open the brief, got " + brief2.mode);
if (brief2.room !== "gate") throw new Error("day 2 commute did not spawn on the lot, got " + brief2.room);
if (!/Yesterday/.test(brief2.body)) throw new Error("day 2 brief missing yesterday line");
if (day2.room !== "gate") throw new Error("after walk-in still not on lot, got " + day2.room);
if (day2.x < 160 || day2.x > 240) throw new Error("day 2 spawn not beside the van, x=" + day2.x);
if (day2.facing !== "right") throw new Error("day 2 should face the van, facing=" + day2.facing);

// Day 2 Tommy is on the lockout board
await page.evaluate(() => window.__controlsTest.warp("maintenance", 180, 168));
await page.waitForTimeout(250);
const d2npcs = await page.evaluate(() => window.__controlsTest.getNpcs());
if (!d2npcs.includes("tommy")) throw new Error("day 2 morning Tommy not in maintenance, got " + d2npcs.join(","));

// Day 3 Marcus at the dose sticker
await walkInDay(3);
await page.evaluate(() => window.__controlsTest.warp("maintenance", 140, 150));
await page.waitForTimeout(200);
const d3npcs = await page.evaluate(() => window.__controlsTest.getNpcs());
if (!d3npcs.includes("marcus")) throw new Error("day 3 Marcus not at the dose, got " + d3npcs.join(","));

// Day 4 Holt at the unsigned log
await walkInDay(4);
await page.evaluate(() => window.__controlsTest.warp("control", 110, 214));
await page.waitForTimeout(200);
const d4npcs = await page.evaluate(() => window.__controlsTest.getNpcs());
if (!d4npcs.includes("holt")) throw new Error("day 4 Holt not at the log, got " + d4npcs.join(","));

// Day 5 shuffle objective + Priya in reactor
await walkInDay(5);
const day5 = await page.evaluate(() => {
  const t = window.__controlsTest;
  t.warp("reactor", 96, 200);
  return {
    objective: t.getObjective(),
    room: t.getRoom(),
  };
});
await page.waitForTimeout(250);
await page.screenshot({ path: "/workspace/screenshots/pillarG-day5-reactor.png" });
if (!/shuffle|fuel/i.test(day5.objective)) throw new Error("day 5 objective not shuffle: " + day5.objective);
const d5npcs = await page.evaluate(() => window.__controlsTest.getNpcs());
if (!d5npcs.includes("priya")) throw new Error("day 5 Priya not at the shuffle desk, got " + d5npcs.join(","));

// Week log on EOD + pause
await page.evaluate(() => {
  const t = window.__controlsTest;
  t.reportHere();
  t.forceEod();
});
await page.waitForTimeout(450);
const eod = await page.evaluate(() => {
  const log = document.querySelector('[data-testid="week-log"]');
  return {
    mode: window.__controlsTest.getMode(),
    logText: log ? log.textContent : "",
    paper: !!document.querySelector('[data-testid="paper-eod"]'),
    weekLog: window.__controlsTest.getWeekLog(),
  };
});
await page.screenshot({ path: "/workspace/screenshots/pillarG-eod.png" });
if (!eod.paper) throw new Error("EOD paper missing");
if (!eod.weekLog.length) throw new Error("week log empty at EOD");

const briefAfter = await walkInDay(2);
if (!/Yesterday/.test(briefAfter.body) && !/Caught on the paper/.test(briefAfter.body)) {
  throw new Error("day 2 brief after a catch did not carry yesterday");
}
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
const pause = await page.evaluate(() => {
  const log = document.querySelector('[data-testid="week-log-pause"]');
  return {
    mode: window.__controlsTest.getMode(),
    hasLog: !!(log && log.textContent && /WEEK LOG/.test(log.textContent)),
    text: log ? log.textContent : "",
  };
});
await page.screenshot({ path: "/workspace/screenshots/pillarG-pause.png" });
if (pause.mode !== "pause") throw new Error("pause not open, mode=" + pause.mode);
if (!pause.hasLog) throw new Error("pause missing week log");

await page.keyboard.press("Escape");
await page.waitForTimeout(250);

// Ending walk: lot at dusk, not a slideshow
await page.evaluate(() => window.__controlsTest.beginEnding());
await page.waitForTimeout(500);
const dusk = await page.evaluate(() => {
  const t = window.__controlsTest;
  return {
    room: t.getRoom(),
    mode: t.getMode(),
    period: t.getPeriod(),
    minutes: t.getMinutes(),
    facing: t.getFacing(),
    y: t.getY(),
    objective: t.getObjective(),
    prompt: t.getClosePrompt(),
    endingWalk: t.getFlags().endingWalk,
  };
});
await page.evaluate(() => window.__controlsTest.pose({ x: 336, y: 200, facing: "up", hold: 1.2 }));
await page.waitForTimeout(500);
await page.screenshot({ path: "/workspace/screenshots/pillarG-ending-lot.png" });
if (dusk.room !== "gate") throw new Error("ending walk not on the lot");
if (dusk.mode !== "play") throw new Error("ending walk should be playable, mode=" + dusk.mode);
if (!dusk.endingWalk) throw new Error("endingWalk flag missing");
if (dusk.facing !== "up") throw new Error("ending walk should face the lake");
if (!/stack|lot|lake/i.test(dusk.objective)) throw new Error("ending objective: " + dusk.objective);

const closeBtn = page.locator('[data-testid="close-shift"]');
if (await closeBtn.count()) {
  await closeBtn.click();
} else {
  await page.keyboard.press("k");
}
await page.waitForTimeout(450);
const closed = await page.evaluate(() => {
  return {
    mode: window.__controlsTest.getMode(),
    paper: !!document.querySelector('[data-testid="paper-ending"]'),
    text: (document.querySelector('[data-testid="paper-ending"]') || document.body).textContent,
  };
});
await page.screenshot({ path: "/workspace/screenshots/pillarG-ending-paper.png" });
if (closed.mode !== "ending") throw new Error("close on dusk lot did not paper the week, mode=" + closed.mode);
if (!closed.paper) throw new Error("ending paper missing");
if (!/Teaching model/i.test(closed.text)) throw new Error("ending paper missing teaching line");

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
await page.screenshot({ path: "/workspace/screenshots/pillarG-mobile.png" });

const unique = [...new Set(errors)].filter((e) => !/favicon|og\.jpg|x-banner/i.test(e));
if (unique.length) {
  console.log(JSON.stringify({ ok: false, errors: unique, flagged, day2, day5, dusk, closed }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mabelSat: flagged.mabelSat,
      day2: { room: day2.room, x: Math.round(day2.x), y: Math.round(day2.y), facing: day2.facing },
      occupancy: { d2: d2npcs, d3: d3npcs, d4: d4npcs, d5: d5npcs },
      day5objective: day5.objective,
      eodLog: eod.weekLog.map((e) => e.kind),
      pauseLog: pause.hasLog,
      dusk: { room: dusk.room, mode: dusk.mode, period: dusk.period, facing: dusk.facing },
      endingPaper: closed.paper,
      screens: [
        "pillarG-cafe.png",
        "pillarG-talk-flag.png",
        "pillarG-day2-lot.png",
        "pillarG-day5-reactor.png",
        "pillarG-eod.png",
        "pillarG-pause.png",
        "pillarG-ending-lot.png",
        "pillarG-ending-paper.png",
        "pillarG-mobile.png",
      ],
    },
    null,
    2,
  ),
);
await browser.close();
