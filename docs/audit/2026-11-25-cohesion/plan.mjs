// Friday's fuel shuffle signed with real clicks → the outage lays the real core out by it → the cycle runs.
// Then the taskbar step-out and step-back animations, and the end-of-day card easing in.
// Hooks only for labelled setup (boot, day 5, standing at the fuel desk, skipping the outage's Cycle 1 example and
// discharge pick) and to read state.
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// solve.ts finds a signable Friday plan with the game's own shuffle model, and the swaps to reach it.
const here = dirname(fileURLToPath(import.meta.url));
execFileSync(process.env.ESBUILD ?? "/opt/npm-tools/node_modules/.bin/esbuild", [join(here, "solve.ts"), "--bundle", "--platform=node", "--format=esm", "--outfile=/tmp/cc-solve.mjs", "--log-level=error"]);
const { solve } = await import("/tmp/cc-solve.mjs");
const [w, h] = (process.argv[2] ?? "1280x720").split("x").map(Number);
const tag = `${w}`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: w, height: h } });
p.setDefaultTimeout(10000);
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
const log = [];
const ok = (name, pass, extra = "") => log.push(`${pass ? "PASS" : "FAIL"} ${tag} ${name}${extra ? ` (${extra})` : ""}`);
const z = (ms) => p.waitForTimeout(ms);
const T = (f, ...a) => p.evaluate(([fn, args]) => window.__controlsTest[fn](...args), [f, a]);
const shot = (n) => p.screenshot({ path: `${n}-${tag}.png` });
const wrapClass = () => p.evaluate(() => document.querySelector("canvas.pixel-canvas")?.parentElement?.className ?? "");

await p.goto("http://127.0.0.1:8093/"); await p.waitForFunction(() => window.__controlsTest);
await p.evaluate(() => {
  localStorage.clear();
  // Labelled: Cycle 1's worked example seen, discharge step skipped, so Cycle 2 opens on the plant's pattern.
  localStorage.setItem("cc.outage.v1", JSON.stringify({ custom: null, useCustom: false, history: [], draft: null, draftCycle: 2, discharged: [], tutorialSeen: true }));
});
await p.reload(); await p.waitForFunction(() => window.__controlsTest);
await T("bootPlay"); await z(400);

// Step out and back: the plant shrinks into its tab, then grows back.
await p.locator("[data-testid='shift-task-music']").click();
await z(60);
ok("plant shrinks on the way out", (await wrapClass()).includes("cc-plant-out"));
await z(800);
ok("desk opens after", (await T("getMode")) === "desktop");
if (w >= 720) await p.locator("[data-testid='task-plant']").click(); else { await p.keyboard.press("Escape"); await z(300); await p.keyboard.press("Escape"); }
await z(60);
ok("plant grows back on return", (await wrapClass()).includes("cc-plant-in"), await T("getMode"));
await z(600);

// Friday: the fuel desk in Engineering.
await T("setDay", 5); await z(200);
await T("warp", "engineering", 96, 150); await z(300);
await p.keyboard.down("ArrowUp"); await z(80); await p.keyboard.up("ArrowUp"); await z(200);
await p.keyboard.press("KeyE"); await z(800);
ok("fuel desk opens the shuffle", (await T("getMode")) === "shuffle", await T("getMode"));
ok("the shuffle says it's the plan the outage carries out", (await p.locator("[data-testid='shuffle-plan-note']").count()) === 1);
const enrich = (await T("getPlant"))?.enrich ?? 4.5;
const { swaps } = solve(enrich);
const cells = p.locator("div.grid.grid-cols-6 > button");
for (const [a, c] of swaps) { await cells.nth(a).click(); await cells.nth(c).click(); }
await z(300);
await shot("08-friday-shuffle");
await p.getByRole("button", { name: "Sign the shuffle" }).click(); await z(800);
const f = await T("getFlags");
ok("signing Friday's plan hands over the outage", f.shuffle === true && f.outageOpen === true);

// The outage, from the taskbar's Start.
await p.locator("[data-testid='shift-start']").click(); await z(900);
const outageItem = p.getByRole("menuitem", { name: /Refuelling Outage/i }).first();
if (await outageItem.count()) await outageItem.click(); else await T("deskLaunch", "desktop");
await z(1200);
if (!(await p.locator("[data-testid='outage-friday']").count())) {
  const icon = p.getByText("Refuelling Outage", { exact: false }).first();
  if (await icon.count()) { await icon.dblclick().catch(() => {}); await z(1000); }
}
ok("the outage shows Friday's plan", (await p.locator("[data-testid='outage-friday']").count()) === 1);
const before = await p.locator("[data-testid='outage-friday-rim']").innerText().catch(() => "");
await p.locator("[data-testid='outage-friday-lay']").click(); await z(500);
const after = await p.locator("[data-testid='outage-friday-rim']").innerText().catch(() => "");
ok("laying it out changes the real core", before !== after, `${before} → ${after}`);
await p.locator("[data-testid='outage-run']").click();
await p.locator("[data-testid='outage-friday-verdict']").waitFor({ timeout: 120000 });
const verdict = await p.locator("[data-testid='outage-friday-verdict']").innerText();
ok("the cycle says whether Friday's plan holds", /Friday's plan/.test(verdict), verdict.slice(0, 120));
await p.locator("[data-testid='outage-friday-verdict']").scrollIntoViewIfNeeded();
await shot("09-outage-friday");

ok("no page errors", errs.length === 0, errs.join(" | ").slice(0, 300));
console.log(log.join("\n"));
await b.close();
