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
await page.waitForTimeout(300);

await page.evaluate(() => window.__controlsTest.setAcademy(4));
await page.waitForTimeout(800);
const types = await page.evaluate(() => document.querySelector('[data-testid="academy-stage"]')?.innerText || "");
if (!/PWR|BWR|pebble|MSR/i.test(types)) throw new Error("types page empty: " + types.slice(0, 200));
const vids = await page.evaluate(() => document.querySelectorAll("video").length);
if (vids < 4) throw new Error("expected looping cutaways, got " + vids);
await page.screenshot({ path: "/workspace/screenshots/reactors-academy.png" });

for (const id of ["pwr", "bwr", "pebble", "msr"]) {
  await page.evaluate((s) => window.__controlsTest.openStillId(s), id);
  await page.waitForTimeout(600);
  const t = await page.evaluate(() => document.body.innerText);
  if (id === "msr" && !/salt|freeze|off-gas|⁷Li|Li/i.test(t)) throw new Error("msr still weak");
  if (id === "bwr" && !/below|turbine|separat/i.test(t)) throw new Error("bwr still weak");
  if (id === "pebble" && !/TRISO|helium|pebble/i.test(t)) throw new Error("pebble still weak");
  const v = await page.evaluate(() => document.querySelector("video")?.currentSrc || "");
  if (!v.includes(`/video/${id}.mp4`)) throw new Error(id + " still missing video: " + v);
  await page.screenshot({ path: `/workspace/screenshots/reactor-${id}.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
}

if (errors.length) {
  console.log(errors.slice(0, 6));
  throw new Error(errors[0]);
}
console.log("cutaways ok", vids, "videos on academy");
await browser.close();
