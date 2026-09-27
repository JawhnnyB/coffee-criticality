#!/usr/bin/env node
/**
 * Playwright: open builder → toggle full-core → k changes → toggle depletion → download non-empty .py
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { checkedUrl } from "./browser-guard.mjs";

const url = checkedUrl(process.argv[2] || "http://127.0.0.1:8080/");
const timeoutMs = Number(process.env.BROWSER_SMOKE_TIMEOUT_MS || 60000);

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("dialog", (d) => d.accept());
  page.setDefaultTimeout(timeoutMs);
  const resp = await page.goto(url, { waitUntil: "networkidle", timeout: timeoutMs });
  if ((resp?.status() ?? 0) >= 400) process.exit(1);

  const begin = page.getByRole("button", { name: "Begin" });
  if (await begin.count()) await begin.click();
  await page.getByTestId("new-shift").click({ timeout: 8000 }).catch(async () => {
    await page.getByRole("button", { name: "New shift" }).click();
  });
  const role = page.locator("[data-testid^='role-']").first();
  await role.click();

  for (let i = 0; i < 5; i++) {
    const cont = page.getByTestId("builder-continue");
    if (await cont.count()) await cont.click();
    else break;
  }

  await page.getByTestId("k-core").waitFor({ timeout: 10000 });
  await page.getByTestId("term-Σ_a").click();
  await page.waitForTimeout(200);
  const sa = await page.locator("h3").first().innerText();
  if (!/Σ_a|eaten/i.test(sa)) throw new Error("Σ_a lesson did not open: " + sa);
  await page.getByRole("button", { name: "Close" }).click();
  await page.getByTestId("term-vessel").click();
  await page.waitForTimeout(200);
  const ves = await page.locator("h3").first().innerText();
  if (!/vessel|tank/i.test(ves)) throw new Error("vessel lesson did not open: " + ves);
  await page.getByRole("button", { name: "Close" }).click();
  await page.screenshot({ path: "/workspace/screenshots/term-vessel.png" });
  const kBefore = await page.getByTestId("k-core").innerText();
  await page.getByTestId("fullcore-toggle").click();
  await page.waitForTimeout(200);
  const kAfter = await page.getByTestId("k-core").innerText();
  if (kBefore === kAfter) throw new Error(`full-core did not change k (${kBefore})`);

  await page.getByTestId("depletion-toggle").click();
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 8000 }),
    page.getByTestId("openmc-download").click(),
  ]);
  const fail = await download.failure();
  if (fail) throw new Error(fail);
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  const py = Buffer.concat(chunks).toString("utf8");
  if (py.length < 400) throw new Error("downloaded .py too short");
  if (!py.includes("TEACHING MODEL ONLY")) throw new Error("disclaimer missing from download");
  if (!py.includes("DEPLETE = True") && !py.includes("full_core=True")) {
    throw new Error("toggles did not stamp the letter");
  }

  mkdirSync("/workspace/screenshots", { recursive: true });
  await page.screenshot({ path: "/workspace/screenshots/builder-waveF.png", fullPage: false });
  writeFileSync("/tmp/openmc-smoke.py", py);
  console.log(JSON.stringify({ ok: true, kBefore, kAfter, bytes: py.length, file: download.suggestedFilename() }, null, 2));
  process.exit(0);
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: String(err?.message || err) }, null, 2));
  process.exit(1);
} finally {
  await browser.close();
}
