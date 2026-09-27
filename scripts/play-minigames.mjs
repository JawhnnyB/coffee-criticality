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

async function cab(id, shot, need) {
  await page.evaluate((c) => window.__controlsTest.openCab(c), id);
  await page.waitForTimeout(450);
  const mode = await page.evaluate(() => window.__controlsTest.getMode());
  if (mode !== id && !(id === "catch" && mode === "arcade")) {
    throw new Error(`${id} mode=${mode}`);
  }
  const text = await page.evaluate(() => document.body.innerText);
  if (/Check tags|Which of the following|multiple choice/i.test(text)) {
    throw new Error(`${id} quiz language: ${text.slice(0, 220)}`);
  }
  for (const n of need) {
    if (!text.includes(n)) throw new Error(`${id} missing "${n}": ${text.slice(0, 220)}`);
  }
  await page.screenshot({ path: `/workspace/screenshots/game-${id}.png` });
  if (shot === "play") {
    const btn = page.getByRole("button", { name: /Hold the slope|Start hunt|Watch the pin|Face the load|Play|drop/i }).first();
    if (await btn.count()) {
      await btn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: `/workspace/screenshots/game-${id}-play.png` });
    }
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
}

await cab("delay", "play", ["DELAY.CAB", "delayed"]);
await page.evaluate(() => window.__controlsTest.openCab("delay"));
await page.waitForTimeout(200);
await page.getByRole("button", { name: /Hold the slope/i }).click();
await page.waitForTimeout(3800);
const delayPlay = await page.evaluate(() => {
  const b = document.querySelector('[data-testid="delay-banner"]');
  return (b?.textContent || "") + "\n" + document.body.innerText;
});
if (!/BANK DROP/.test(delayPlay)) throw new Error("delay missing BANK DROP: " + delayPlay.slice(0, 220));
if (!/6-group|DELAY.CAB/.test(delayPlay)) throw new Error("delay play missing chrome: " + delayPlay.slice(0, 180));
await page.screenshot({ path: "/workspace/screenshots/game-delay-play.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

await cab("catch", "play", ["CATCH.CAB", "hunt"]);
await page.evaluate(() => window.__controlsTest.openCab("catch"));
await page.waitForTimeout(200);
await page.getByRole("button", { name: /Start hunt/i }).click();
await page.waitForTimeout(500);
const catchPlay = await page.evaluate(() => document.body.innerText);
if (!/CATCH.CAB/.test(catchPlay)) throw new Error("catch play missing: " + catchPlay.slice(0, 180));
if (/Check tags|multiple choice/i.test(catchPlay)) throw new Error("catch is a quiz again");
const catchCanvas = page.locator('[data-testid="catch-canvas"]');
if (await catchCanvas.count()) {
  const box = await catchCanvas.boundingBox();
  if (box) await page.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.4);
}
await page.screenshot({ path: "/workspace/screenshots/game-catch-play.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

await cab("golf", "", ["GOLF.CAB"]);
await cab("rods", "", ["ROD.BANK", "demand"]);
await cab("pebble", "", ["PEBBLE.CAB"]);
await cab("bowl", "", ["BOWL.CAB"]);
await cab("phys", "play", ["PHYS.CAB", "fission"]);
await cab("load", "play", ["LOAD.CAB", "opponent"]);

await page.evaluate(() => window.__controlsTest.openCab("load"));
await page.waitForTimeout(250);
await page.click('[data-testid="load-start"]');
await page.waitForTimeout(500);
const loadPlay = await page.evaluate(() => {
  const h = document.querySelector('[data-testid="load-hud"]');
  return (h?.textContent || "") + "\n" + document.body.innerText;
});
if (!/LOAD.CAB/.test(loadPlay)) throw new Error("load play missing chrome: " + loadPlay.slice(0, 180));
if (!/pulse|Gold|xenon|leak/i.test(loadPlay)) throw new Error("load play missing opponent copy: " + loadPlay.slice(0, 180));
if (/Check tags|Which of the following|multiple choice/i.test(loadPlay)) throw new Error("load is a quiz: " + loadPlay.slice(0, 180));
const loadCanvas = page.locator('[data-testid="load-canvas"]');
if (await loadCanvas.count()) {
  const box = await loadCanvas.boundingBox();
  if (box) await page.mouse.click(box.x + box.width * 0.22, box.y + box.height * 0.28);
}
await page.waitForTimeout(350);
await page.screenshot({ path: "/workspace/screenshots/game-load-play.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

await page.evaluate(() => window.__controlsTest.openCab("phys"));
await page.waitForTimeout(200);
await page.getByRole("button", { name: /Watch the pin/i }).click();
await page.waitForTimeout(4800);
const physPlay = await page.evaluate(() => {
  const b = document.querySelector('[data-testid="phys-hud"]');
  return (b?.textContent || "") + "\n" + document.body.innerText;
});
if (!/XENON BUILD|PHYS.CAB|FISSION|k/.test(physPlay)) throw new Error("phys play missing: " + physPlay.slice(0, 180));
await page.screenshot({ path: "/workspace/screenshots/game-phys-play.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

await page.evaluate(() => window.__controlsTest.openCab("phys"));
await page.waitForTimeout(250);
const physBrief = await page.evaluate(() => document.body.innerText);
if (!/Run analog MC/.test(physBrief)) throw new Error("phys brief missing analog MC: " + physBrief.slice(0, 220));
if (/OpenMC in the browser/i.test(physBrief)) throw new Error("phys claimed OpenMC in the browser");
if (/Check tags|Which of the following|multiple choice/i.test(physBrief)) throw new Error("phys MC is a quiz: " + physBrief.slice(0, 180));
await page.click('[data-testid="phys-mc"]');
await page.waitForTimeout(900);
const mcHud = await page.evaluate(() => {
  const b = document.querySelector('[data-testid="phys-hud"]');
  const p = document.querySelector('[data-testid="phys-probe"]');
  return (b?.textContent || "") + "\n" + (p?.textContent || "") + "\n" + document.body.innerText;
});
if (!/ANALOG MC|analog/i.test(mcHud)) throw new Error("mc play missing analog: " + mcHud.slice(0, 220));
if (!/k|F |BANK|σ|1\/√G/.test(mcHud)) throw new Error("mc play missing tally: " + mcHud.slice(0, 220));
if (/OpenMC in the browser/i.test(mcHud)) throw new Error("mc claimed OpenMC in the browser");
if (/Check tags|Which of the following|multiple choice/i.test(mcHud)) throw new Error("mc is a quiz");
await page.waitForTimeout(4000);
const mcEv = await page.evaluate(() => {
  const b = document.querySelector('[data-testid="phys-hud"]');
  return (b?.textContent || "") + "\n" + document.body.innerText;
});
if (!/SOURCE BIAS|BANK READY|IMPLICIT|ANALOG MC|k /.test(mcEv)) throw new Error("mc event missing: " + mcEv.slice(0, 220));
const fireBtn = page.locator('[data-testid="phys-fire"]');
if (await fireBtn.count()) {
  await fireBtn.click();
  await page.waitForTimeout(700);
}
const mcBank = await page.evaluate(() => {
  const b = document.querySelector('[data-testid="phys-hud"]');
  return (b?.textContent || "") + "\n" + document.body.innerText;
});
if (!/BANK READY|k \d|G \d|σ|±/.test(mcBank)) throw new Error("mc bank missing: " + mcBank.slice(0, 220));
await page.screenshot({ path: "/workspace/screenshots/game-phys-mc.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

await page.evaluate(() => window.__controlsTest.setAcademy(6));
await page.waitForTimeout(350);
const acLab = await page.evaluate(() => document.querySelector('[data-testid="academy-stage"]')?.innerText || "");
if (!/Play PHYS.CAB/.test(acLab)) throw new Error("academy lab missing PHYS: " + acLab.slice(0, 200));
await page.click('[data-testid="play-phys-lab"]');
await page.waitForTimeout(400);
const afterLab = await page.evaluate(() => window.__controlsTest.getMode());
if (afterLab !== "phys") throw new Error("academy play-phys-lab mode=" + afterLab);
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

await page.evaluate(() => window.__controlsTest.setAcademy(13));
await page.waitForTimeout(350);
const ac = await page.evaluate(() => document.querySelector('[data-testid="academy-stage"]')?.innerText || "");
if (!/Play DELAY.CAB/.test(ac)) throw new Error("academy reactivity missing play button: " + ac.slice(0, 200));
await page.screenshot({ path: "/workspace/screenshots/game-academy-delay.png" });
await page.click('[data-testid="play-delay"]');
await page.waitForTimeout(400);
const after = await page.evaluate(() => window.__controlsTest.getMode());
if (after !== "delay") throw new Error("academy play-delay mode=" + after);
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

await page.evaluate(() => window.__controlsTest.setAcademy(14));
await page.waitForTimeout(350);
const acPhys = await page.evaluate(() => document.querySelector('[data-testid="academy-stage"]')?.innerText || "");
if (!/Play PHYS.CAB/.test(acPhys)) throw new Error("academy six missing PHYS: " + acPhys.slice(0, 200));
await page.click('[data-testid="play-phys"]');
await page.waitForTimeout(400);
const afterPhys = await page.evaluate(() => window.__controlsTest.getMode());
if (afterPhys !== "phys") throw new Error("academy play-phys mode=" + afterPhys);
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

await page.evaluate(() => window.__controlsTest.setAcademy(15));
await page.waitForTimeout(350);
const acMc = await page.evaluate(() => document.querySelector('[data-testid="academy-stage"]')?.innerText || "");
if (!/Play analog MC/.test(acMc)) throw new Error("academy mc missing play button: " + acMc.slice(0, 200));
if (!/Monte Carlo|fission bank|1\/√G/.test(acMc)) throw new Error("academy mc missing analog copy: " + acMc.slice(0, 200));
if (/OpenMC in the browser/i.test(acMc)) throw new Error("academy mc claimed OpenMC in the browser");
await page.click('[data-testid="play-mc"]');
await page.waitForTimeout(400);
const afterMc = await page.evaluate(() => window.__controlsTest.getMode());
if (afterMc !== "phys") throw new Error("academy play-mc mode=" + afterMc);
const mcFromAc = await page.evaluate(() => document.body.innerText);
if (!/Fire the fission bank|Run analog MC|analog generation k/i.test(mcFromAc)) {
  throw new Error("academy play-mc brief not analog: " + mcFromAc.slice(0, 220));
}
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

await page.evaluate(() => window.__controlsTest.setAcademy(17));
await page.waitForTimeout(350);
const acLoad = await page.evaluate(() => document.querySelector('[data-testid="academy-stage"]')?.innerText || "");
if (!/Play LOAD.CAB/.test(acLoad)) throw new Error("academy xenon missing LOAD: " + acLoad.slice(0, 200));
if (!/opponent|xenon follows power/i.test(acLoad)) throw new Error("academy xenon missing load copy: " + acLoad.slice(0, 200));
await page.click('[data-testid="play-load"]');
await page.waitForTimeout(400);
const afterLoad = await page.evaluate(() => window.__controlsTest.getMode());
if (afterLoad !== "load") throw new Error("academy play-load mode=" + afterLoad);
const loadFromAc = await page.evaluate(() => document.body.innerText);
if (!/LOAD.CAB|the load is the opponent/i.test(loadFromAc)) {
  throw new Error("academy play-load brief missing: " + loadFromAc.slice(0, 220));
}
if (/Check tags|Which of the following|multiple choice/i.test(loadFromAc)) {
  throw new Error("load brief is a quiz: " + loadFromAc.slice(0, 180));
}
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

await page.evaluate(() => {
  window.__controlsTest.warp("parlor", 176, 140);
});
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/game-parlor.png" });

await page.evaluate(() => window.__controlsTest.openCab("floor"));
await page.waitForTimeout(350);
const hall = await page.evaluate(() => document.body.innerText);
if (!/UNIT 1/.test(hall)) throw new Error("hall missing UNIT 1: " + hall.slice(0, 220));
if (!/AFTER-SHIFT/.test(hall)) throw new Error("hall missing AFTER-SHIFT: " + hall.slice(0, 220));
if (!/LOAD.CAB/.test(hall)) throw new Error("hall missing LOAD.CAB: " + hall.slice(0, 220));
if (!/Same bezel/.test(hall)) throw new Error("hall missing bezel line: " + hall.slice(0, 220));
await page.screenshot({ path: "/workspace/screenshots/game-cabs.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

if (errors.length) {
  console.log("errors", errors.slice(0, 8));
  throw new Error(errors[0]);
}
console.log("minigames ok");
await browser.close();
