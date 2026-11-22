/**
 * Crash card. A render throw and a later throw each show one card.
 * The copy button is a real click. The clipboard is read back.
 *   node scripts/plant-phone.mjs http://127.0.0.1:8096/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8096/";
const out = new URL("../docs/audit/2026-11-22-value/step-07/", import.meta.url);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding"],
});

async function crash(name, fire) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(base).origin });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__plantPhone);
  await fire(page);
  const card = page.locator("[data-testid='plant-phone']");
  await card.waitFor();
  const count = await card.count();
  if (count !== 1) throw new Error(`${name}: ${count} cards`);
  const title = (await page.locator("#plant-phone-title").innerText()).trim();
  const message = (await page.locator("[data-testid='plant-phone-message']").innerText()).trim();
  if (title !== "The plant phone rang.") throw new Error(`${name}: title "${title}"`);
  if (title.includes("!") || message.includes("!")) throw new Error(`${name}: exclamation`);
  await page.locator("[data-testid='plant-phone-copy']").click();
  await page.locator("[data-testid='plant-phone-copied']").waitFor();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  await page.screenshot({ path: new URL(`${name}.png`, out).pathname });
  await context.close();
  if (!clip.includes("The plant phone rang.")) throw new Error(`${name}: clipboard missed the heading\n${clip}`);
  if (!clip.includes(message)) throw new Error(`${name}: clipboard missed the message\n${clip}`);
  console.log(name, JSON.stringify(message));
  return { name, title, message, clipHead: clip.split("\n").slice(0, 3) };
}

const render = await crash("render", (page) => page.evaluate(() => window.__plantPhone.breakRender()));
const event = await crash("event", (page) => page.evaluate(() => window.__plantPhone.breakLater()));
if (!render.message.startsWith("Render proof.")) throw new Error(render.message);
if (!event.message.startsWith("Event proof.")) throw new Error(event.message);
writeFileSync(new URL("result.json", out), JSON.stringify({ render, event }, null, 2) + "\n");
await browser.close();
console.log("PASS");
