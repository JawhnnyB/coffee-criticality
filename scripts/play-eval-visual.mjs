import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { spawnSync } from "child_process";

const url = "http://127.0.0.1:8080/";
const browser = await chromium.launch({ headless: true });
const errors = [];
const page = await browser.newPage();
page.on("pageerror", (e) => errors.push("page " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console " + m.text());
});

async function shot(name, w = 1280, h = 720) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `/workspace/screenshots/${name}.png` });
}

async function canvasPng(name) {
  const buf = await page.locator("canvas.pixel-canvas").screenshot();
  writeFileSync(`/tmp/${name}.png`, buf);
}

await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(600);
await page.evaluate(() => window.__controlsTest?.bootPlay());
await page.waitForTimeout(700);

await page.evaluate(() => window.__controlsTest?.warp("cafe", 176, 188));
await page.waitForTimeout(400);
await canvasPng("eval_cafe");
await shot("eval-cafe");

await page.evaluate(() => window.__controlsTest?.startTalk("mabel"));
await page.waitForTimeout(500);
await shot("eval-mabel-talk");
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

await page.evaluate(() => window.__controlsTest?.warp("engineering", 220, 170));
await page.waitForTimeout(300);
await page.evaluate(() => window.__controlsTest?.startTalk("priya"));
await page.waitForTimeout(500);
await shot("eval-priya-talk");
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

await page.evaluate(() => window.__controlsTest?.warp("breakroom", 140, 160));
await page.waitForTimeout(300);
await page.evaluate(() => window.__controlsTest?.startTalk("jordan"));
await page.waitForTimeout(500);
await shot("eval-jordan-talk");
await page.keyboard.press("Escape");

await page.evaluate(() => window.__controlsTest?.warp("gate", 200, 230));
await page.waitForTimeout(450);
await canvasPng("eval_gate");
await shot("eval-gate");

await page.evaluate(() => window.__controlsTest?.openStillId("gate"));
await page.waitForTimeout(400);
await shot("eval-gate-still");
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

for (const [room, x, y, file] of [
  ["parlor", 160, 170, "eval_parlor"],
  ["corridor", 160, 160, "eval_corridor"],
  ["control", 160, 160, "eval_control"],
  ["engineering", 180, 160, "eval_engineering"],
  ["breakroom", 160, 160, "eval_breakroom"],
  ["reactor", 176, 200, "eval_reactor"],
  ["maintenance", 180, 160, "eval_maint"],
]) {
  await page.evaluate(([r, xx, yy]) => window.__controlsTest?.warp(r, xx, yy), [room, x, y]);
  await page.waitForTimeout(280);
  await canvasPng(file);
}

await page.evaluate(() => window.__controlsTest?.setAcademy(1));
await page.waitForTimeout(500);
await shot("eval-academy-heat");

await page.evaluate(() => window.__controlsTest?.setAcademy(14));
await page.waitForTimeout(400);
await shot("eval-academy-six");

await page.evaluate(() => window.__controlsTest?.setIntro(1));
await page.waitForTimeout(400);
await shot("eval-intro-cafe");

await page.evaluate(() => window.__controlsTest?.setIntro(2));
await page.waitForTimeout(400);
await shot("eval-intro-gate");

await page.evaluate(() => window.__controlsTest?.setBuild());
await page.waitForTimeout(600);
await shot("eval-builder-priya");

const py = spawnSync("python3", ["-"], {
  input: `
from PIL import Image
from pathlib import Path

def nn(src, w, h, dest):
    im = Image.open(src).convert("RGBA")
    im = im.resize((w, h), Image.Resampling.NEAREST)
    Path(dest).parent.mkdir(parents=True, exist_ok=True)
    im.save(dest)
    print(dest, im.size)

S = Path("/workspace/public/art/gen/stills")
nn("/tmp/eval_cafe.png", 80, 48, S / "cafe_plate.png")
nn("/tmp/eval_cafe.png", 48, 32, S / "glimpse_cafe.png")
nn("/tmp/eval_gate.png", 80, 48, S / "gate_plate.png")
nn("/tmp/eval_gate.png", 48, 32, S / "glimpse_gate.png")
nn("/tmp/eval_parlor.png", 48, 32, S / "glimpse_parlor.png")
nn("/tmp/eval_corridor.png", 48, 32, S / "glimpse_corridor.png")
nn("/tmp/eval_control.png", 48, 32, S / "glimpse_control.png")
nn("/tmp/eval_engineering.png", 48, 32, S / "glimpse_engineering.png")
nn("/tmp/eval_breakroom.png", 48, 32, S / "glimpse_breakroom.png")
nn("/tmp/eval_reactor.png", 48, 32, S / "glimpse_reactor.png")
nn("/tmp/eval_maint.png", 48, 32, S / "glimpse_maintenance.png")
nn("/tmp/eval_corridor.png", 80, 48, S / "corridor_plate.png")
nn("/tmp/eval_control.png", 80, 48, S / "control_plate.png")
nn("/tmp/eval_engineering.png", 80, 48, S / "engineering_plate.png")
nn("/tmp/eval_breakroom.png", 80, 48, S / "breakroom_plate.png")
`,
  encoding: "utf8",
});
console.log(py.stdout);
if (py.status) console.log("py err", py.stderr);

await page.evaluate(() => window.__controlsTest?.bootPlay());
await page.waitForTimeout(300);
await page.evaluate(() => window.__controlsTest?.openStillId("gate"));
await page.waitForTimeout(400);
await shot("eval-gate-still-2");

await page.evaluate(() => window.__controlsTest?.setIntro(1));
await page.waitForTimeout(400);
await shot("eval-intro-cafe-2");

console.log("errors", errors.slice(0, 12));
await browser.close();
