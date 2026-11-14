#!/usr/bin/env node
/**
 * Font audit against the running game. Visible text only.
 * IntroScreens hit targets use fontSize 0 over canvas art and are not text.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, VIEWPORTS, collectText, judgeFamily, paletteTable, contrast, parseColor } from "./audit-lib.mjs";

const BASE = process.env.PLAY_URL || "http://127.0.0.1:8080/";
const OUT = "docs/audit/2026-11-14-evidence";
const SHOTS = "docs/audit/2026-11-14-visual";
mkdirSync(OUT, { recursive: true });
mkdirSync(SHOTS, { recursive: true });

const only = process.env.AUDIT_WIDTH ? Number(process.env.AUDIT_WIDTH) : 0;
const ports = only ? VIEWPORTS.filter(([w]) => w === only) : VIEWPORTS;
const palette = paletteTable();
const browser = await chromium.launch();
const report = { url: BASE, palette, viewports: [] };

for (const [w, h] of ports) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(800);
  const boot = page.locator("[data-testid=boot-log]");
  if (await boot.count()) {
    await boot.click();
    await page.waitForTimeout(400);
  }
  await page.waitForSelector("[data-testid=new-shift]", { timeout: 8000 }).catch(() => {});
  const faces = await page.evaluate(async () => {
    const names = ["16px Pixelify Sans", "20px CCPixel5x7", "10px CCPixel3x5"];
    const loaded = {};
    for (const n of names) loaded[n] = document.fonts.check(n);
    return loaded;
  });
  const stages = [];
  const pairCounts = new Map();
  async function snap(name) {
    const sample = await collectText(page);
    const violations = [];
    for (const node of sample.nodes) {
      const j = judgeFamily(node.family, node.size);
      if (j.reasons.length) violations.push({ ...node, reasons: j.reasons, primary: j.primary });
      const fg = parseColor(node.color);
      const bg = parseColor(node.background);
      if (fg && bg) {
        const ratio = Math.round(contrast(fg, bg) * 100) / 100;
        const key = `${node.color}|${node.background}`;
        const prev = pairCounts.get(key) || { color: node.color, background: node.background, ratio, count: 0, sample: node.text };
        prev.count += 1;
        pairCounts.set(key, prev);
      }
    }
    stages.push({ name, nodes: sample.nodes.length, skipped: sample.skippedCount, violations });
    if (name === "title" || name === "setup" || name === "desktop") {
      await page.screenshot({ path: join(SHOTS, `${name}-${w}x${h}.png`) }).catch(() => {});
    }
    return violations;
  }
  await snap("title");
  const begin = page.locator("[data-testid=new-shift]");
  if (await begin.count()) {
    await begin.click();
    const wipe = page.locator("[data-testid=wipe-confirm-yes]");
    if (await wipe.count()) await wipe.click();
    await page.waitForSelector("[data-testid=setup-screen]", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(300);
    await snap("setup");
    const go = page.locator("[data-testid=setup-continue]");
    if (await go.count()) {
      await go.click();
      await page.waitForSelector("[data-testid=desktop], [data-testid=phone-home]", { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(400);
      await snap("desktop");
      const phone = w < 720;
      if (phone) {
        const home = page.locator("[data-testid=home-news]");
        if (await home.count()) await home.click();
      } else {
        const start = page.locator("[data-testid=start-button]");
        if (await start.count()) {
          await start.click();
          const item = page.locator('[role=menuitem][aria-label="News"]');
          if (await item.count()) await item.click();
        }
      }
      await page.waitForTimeout(400);
      await page.screenshot({ path: join(SHOTS, `window-news-${w}x${h}.png`) }).catch(() => {});
      const clock = page.locator("[data-testid=desk-clock]");
      if (await clock.count()) {
        const box = await clock.boundingBox();
        if (box) {
          await page.screenshot({
            path: join(SHOTS, `taskbar-${w}x${h}.png`),
            clip: { x: 0, y: Math.max(0, h - 48), width: w, height: Math.min(48, h) },
          }).catch(() => {});
        }
      }
      await snap("news");
    }
  }
  const violations = stages.flatMap((s) => s.violations.map((v) => ({ stage: s.name, ...v })));
  report.viewports.push({ w, h, faces, pageErrors, stages: stages.map(({ violations: v, ...rest }) => ({ ...rest, violationCount: v.length })), violations, usedPairs: [...pairCounts.values()] });
  console.log(JSON.stringify({ w, h, violations: violations.length, pageErrors: pageErrors.length, stages: stages.map((s) => `${s.name}:${s.nodes}/${s.violations.length}`) }));
  await page.close();
}

const failPalette = palette.filter((p) => !p.pass);
report.paletteFails = failPalette;
report.violationCount = report.viewports.reduce((n, v) => n + v.violations.length, 0);
const usedFails = [];
for (const v of report.viewports) {
  for (const n of v.violations) usedFails.push(n);
}
const seen = new Map();
for (const v of report.viewports) {
  const nodes = v.usedPairs || [];
  for (const p of nodes) {
    const key = `${p.color}|${p.background}`;
    if (!seen.has(key)) seen.set(key, { ...p, count: 0 });
    seen.get(key).count += p.count;
  }
}
report.usedPairs = [...seen.values()];
const usedFailCount = report.usedPairs.filter((p) => p.ratio != null && p.ratio < 4.5).length;
writeFileSync(join(OUT, "font-audit.json"), JSON.stringify(report, null, 2));
const line = `Font audit: ${report.violationCount} text violations, ${usedFailCount} on-screen colour pairs under 4.5:1, ${failPalette.length} listed palette pairs under 4.5:1, across ${report.viewports.length} viewports.`;
writeFileSync("docs/audit/2026-11-14-font.md", md(report, line));
console.log(line);
await browser.close();
process.exit(report.violationCount || usedFailCount ? 1 : 0);

function md(report, line) {
  const rows = report.palette
    .map((p) => `| ${p.fg} on ${p.bg} | ${p.fgHex} / ${p.bgHex} | ${p.ratio}:1 | ${p.pass ? "PASS" : "FAIL"} |`)
    .join("\n");
  const bits = report.viewports.map((v) => {
    const head = `### ${v.w}×${v.h}\n\nStages: ${v.stages.map((s) => `${s.name} ${s.nodes} nodes, ${s.violationCount} violations`).join("; ")}. Page errors: ${v.pageErrors.length}.\n`;
    if (!v.violations.length) return head + "\nNo text violations.\n";
    const list = v.violations
      .slice(0, 40)
      .map((n) => `- ${n.stage} \`${n.text}\` ${n.primary} ${n.size}px — ${n.reasons.join("; ")}`)
      .join("\n");
    return head + "\n" + list + "\n";
  });
  return `# Font audit 2026-11-14

${line}

Pixelify Sans is bundled at \`public/fonts/\` under the SIL Open Font License (\`public/fonts/OFL-PixelifySans.txt\`). \`@font-face\` uses \`font-display: block\`.

IntroScreens \`hit()\` sets \`fontSize: 0\` on a transparent absolute target over the canvas (role picker and intro continue). Those nodes are not text and are not violations.

Body, dialogue, news, and buttons use Pixelify Sans at 16px (secondary 14px). Window titles and screen headings use CCPixel5x7 at 20 or 30. Chips, the taskbar clock, and the season label use CCPixel3x5 at 10 or 20.

## Palette contrast

Computed from the hex values in GROK_ART_101 and the shell palette. A pair under 4.5:1 is not used for body text. On-screen pairs are listed after the viewports.

| Pair | Hex | Ratio | Result |
|---|---|---|---|
${rows}

## On-screen pairs

${(report.usedPairs || []).map((p) => `- ${p.color} on ${p.background}: ${p.ratio}:1 ${p.ratio >= 4.5 ? "PASS" : "FAIL"} (${p.count}) e.g. ${p.sample}`).join("\n") || "(none)"}

## Viewports

${bits.join("\n")}

JSON: \`docs/audit/2026-11-14-evidence/font-audit.json\`.
`;
}
