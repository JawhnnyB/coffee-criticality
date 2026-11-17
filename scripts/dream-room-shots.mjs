#!/usr/bin/env node
/**
 * Two pictures of the control room, catch versus hide. Dialogue is closed by
 * staying in play. The toast may sit at the top; the board and the paper log
 * are the difference.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { checkedUrl } from "./browser-guard.mjs";

const req = createRequire(import.meta.url);
const { chromium } = req("playwright");
const BASE = checkedUrl(process.env.WALK14_URL || "http://127.0.0.1:8093/");
const OUT = process.argv[2] || "screenshots/dream-1113";
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto(BASE);
await p.waitForFunction(() => window.__controlsTest && typeof window.__controlsTest.wipe === "function", { timeout: 20000 });

async function shot(how, file) {
  await p.evaluate(() => window.__controlsTest.wipe());
  await p.evaluate(() => window.__controlsTest.bootPlay());
  await p.waitForTimeout(400);
  await p.evaluate((way) => {
    window.__controlsTest.setDay(1);
    window.__controlsTest.warp("control", 160, 200);
    window.__controlsTest.resolve(way);
  }, how);
  await p.waitForTimeout(700);
  const residue = await p.evaluate(() => window.__controlsTest.getResidue());
  const mode = await p.evaluate(() => window.__controlsTest.getMode());
  const room = await p.evaluate(() => window.__controlsTest.getRoom());
  await p.screenshot({ path: join(OUT, file) });
  return { residue, mode, room, file };
}

const hid = await shot("hide", "02-hid-cafe-1280.png");
const caught = await shot("report", "02-caught-cafe-1280.png");
console.log(JSON.stringify({ hid, caught, pageErrors: errs }, null, 2));
await b.close();
