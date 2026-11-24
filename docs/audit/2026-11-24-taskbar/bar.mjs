// The plant's taskbar, with real clicks. Hooks only for labelled setup (boot into the plant, start a talk) and to read state.
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
const b = await chromium.launch();
const log = [];
const ok = (name, pass, extra = "") => log.push(`${pass ? "PASS" : "FAIL"} ${name}${extra ? ` (${extra})` : ""}`);
for (const [w, h] of [[1280, 720], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto("http://127.0.0.1:8093/"); await p.waitForFunction(() => window.__controlsTest);
  const T = (f, ...a) => p.evaluate(([f, a]) => window.__controlsTest[f](...a), [f, a]);
  const z = (ms) => p.waitForTimeout(ms);
  const tag = `${w}`;
  await T("bootPlay"); await z(800); // setup: straight into the plant
  const bar = p.locator("[data-testid='shift-bar']");
  ok(`${tag} bar under the plant`, (await bar.count()) === 1 && (await T("getMode")) === "play");
  const box = await bar.boundingBox();
  ok(`${tag} bar sits on the bottom edge`, !!box && Math.abs(box.y + box.height - h) <= 1, box ? `${box.y}+${box.height}` : "none");
  const over = await bar.evaluate((el) => Math.max(el.scrollWidth - el.clientWidth, ...[...el.querySelectorAll("div")].map((d) => d.scrollWidth - d.clientWidth)));
  ok(`${tag} bar has no overflow`, over <= 0, `${over}px`);
  await p.screenshot({ path: `plant-${w}.png` });

  // Cameras: the desk opens with the feeds, and the plant clock stops.
  await p.locator("[data-testid='shift-task-nightwatch']").click(); await z(900);
  const m0 = await T("getMinutes");
  ok(`${tag} cameras open on the desk`, (await T("getMode")) === "desktop" && (await p.locator("[data-testid='live-feeds']").count()) === 1);
  ok(`${tag} plant tab on the desk taskbar`, w < 720 || (await p.locator("[data-testid='task-plant']").count()) === 1);
  await z(1500);
  const m1 = await T("getMinutes");
  ok(`${tag} plant clock stopped while out`, m1 === m0, `${m0} -> ${m1}`);
  await p.screenshot({ path: `cameras-${w}.png` });
  if (w >= 720) {
    await p.locator("[data-testid^='feed-']").first().click(); await z(400);
    ok(`${tag} a feed enlarges`, (await p.locator("[data-testid^='feed-']").count()) === 1);
    await p.screenshot({ path: `camera-big-${w}.png` });
    await p.locator("[data-testid='task-plant']").click(); await z(700);
  } else {
    await p.keyboard.press("Escape"); await z(400);
    if ((await T("getMode")) !== "play") { await p.keyboard.press("Escape"); await z(500); }
  }
  ok(`${tag} back into the plant`, (await T("getMode")) === "play");

  // Music: play from the bar, open the Music app, close it, still playing.
  await p.locator("[data-testid='shift-music']").click(); await z(400);
  ok(`${tag} music plays from the bar`, (await p.locator("[data-testid='shift-music']").getAttribute("aria-label")) === "Pause music");
  await p.locator("[data-testid='shift-task-music']").click(); await z(800);
  const np = (await p.locator("[data-testid='now-playing']").innerText().catch(() => "")) || "";
  ok(`${tag} Music app shows the same track`, np.startsWith("Now playing"), np);
  await p.keyboard.press("Escape"); await z(300);
  if ((await T("getMode")) !== "play") { await p.keyboard.press("Escape"); await z(500); }
  ok(`${tag} closing the app keeps the music`, (await T("getMode")) === "play" && (await p.locator("[data-testid='shift-music']").getAttribute("aria-label")) === "Pause music");
  await p.screenshot({ path: `music-${w}.png` });
  await p.locator("[data-testid='shift-music']").click(); await z(300);

  // Plant data.
  await p.locator("[data-testid='shift-task-monitor']").click(); await z(800);
  ok(`${tag} plant data opens the monitor`, (await p.locator("[data-testid='app-monitor']").count()) === 1);
  await p.screenshot({ path: `data-${w}.png` });
  await p.keyboard.press("Escape"); await z(300);
  if ((await T("getMode")) !== "play") { await p.keyboard.press("Escape"); await z(500); }

  // Academy runs in a desk window.
  await p.locator("[data-testid='shift-task-academy']").click(); await z(1000);
  ok(`${tag} Academy launches`, (await T("getMode")) === "academy");
  await p.screenshot({ path: `academy-${w}.png` });
  if (w < 720) { await p.getByRole("button", { name: "Close" }).first().click(); await z(500); } // the phone's own button
  else { await p.keyboard.press("Escape"); await z(500); }
  for (let k = 0; k < 3 && (await T("getMode")) !== "play"; k++) { await p.keyboard.press("Escape"); await z(500); }
  ok(`${tag} back from the Academy`, (await T("getMode")) === "play", await T("getMode"));

  // Start opens the start menu on a wide desk.
  if (w >= 720) {
    await p.locator("[data-testid='shift-start']").click(); await z(800);
    ok(`${tag} Start opens the start menu`, (await p.locator("[role='menu'][aria-label='Start menu']").count()) === 1);
    await p.keyboard.press("Escape"); await z(300); await p.keyboard.press("Escape"); await z(500);
  }

  // A conversation: the bar stays, but waits.
  await T("startTalk", "mabel"); await z(600);
  const dis = await p.locator("[data-testid='shift-task-music']").isDisabled().catch(() => null);
  ok(`${tag} tabs wait during a talk`, (await T("getMode")) === "dialogue" && dis === true);
  await p.screenshot({ path: `talk-${w}.png` });

  ok(`${tag} no page errors`, errs.length === 0, errs.join(" | ").slice(0, 300));
  await p.close();
}
console.log(log.join("\n"));
await b.close();
