import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
// Setup with hooks (labelled): boot into play, put the player next to Mabel. Then real keys and clicks only.
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("http://127.0.0.1:8090/"); await p.waitForFunction(() => window.__controlsTest);
const T = (f, ...a) => p.evaluate(([f, a]) => window.__controlsTest[f](...a), [f, a]); const z = (ms) => p.waitForTimeout(ms);
await T("bootPlay"); await z(400);
const talk = async (n) => {
  await T("warp", "cafe", 190, 150); await z(200);
  await p.keyboard.press("ArrowRight"); await z(150);
  await p.keyboard.press("KeyE"); await z(400);
  const lines = [];
  for (let i = 0; i < 25 && (await T("getMode")) === "dialogue"; i++) {
    const txt = await p.locator("body").innerText();
    lines.push(txt.slice(0, 4000));
    const choice = p.locator("[data-testid^='choice-'], button:has-text('Black. Like the log should read.')");
    if (await p.locator("button", { hasText: "Black. Like the log should read." }).count()) { await p.locator("button", { hasText: "Black. Like the log should read." }).click(); await z(300); continue; }
    const anyChoice = p.locator("[data-testid='dialogue'] button, [data-testid='dialogue-stage'] button");
    if (await p.locator("button", { hasText: "Just the coffee." }).count()) { await p.locator("button", { hasText: "Just the coffee." }).click(); await z(300); continue; }
    await p.keyboard.press("Space"); await z(250);
  }
  return lines.join("\n");
};
for (let n = 1; n <= 5; n++) {
  const said = await talk(n);
  const scene = said.includes("This kettle sat behind the old board");
  console.log(`talk ${n}: mode after ${await T("getMode")} · kettle scene shown: ${scene}`);
  if (scene) { await p.screenshot({ path: "shots/social-scene.png" }); }
}
const toast = await p.locator("body").innerText();
console.log("tier toast seen:", /Mabel · Colleague/.test(toast));
await p.keyboard.press("Escape"); await z(600);
const crew = p.locator("[data-testid='crew-mabel']");
console.log("crew panel:", (await crew.count()) ? (await crew.innerText()).replace(/\n/g, " | ") : "missing");
await p.screenshot({ path: "shots/social-crew.png" });
console.log("errors", errs.length, errs[0] ?? "");
await b.close();
