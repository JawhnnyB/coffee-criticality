/** Shared walk for the font and overflow audits. No test hooks. */
import { createRequire } from "node:module";

const req = createRequire(import.meta.url);
export const { chromium } = req("playwright");

export const VIEWPORTS = [
  [1280, 720],
  [1440, 900],
  [1920, 1080],
  [768, 1024],
  [390, 844],
];

const APPROVED = ["Pixelify Sans", "CCPixel3x5", "CCPixel5x7"];

function lin(c) {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}
export function contrast(fg, bg) {
  const L = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
  const a = L(fg);
  const b = L(bg);
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

export function parseColor(s) {
  if (!s) return null;
  const m = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (!m) return null;
  const a = m[4] == null ? 1 : Number(m[4]);
  if (a < 0.15) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3]), a];
}

/** Palette pairs from GROK_ART_101, plus the wood and muted tones the shell actually paints. */
export const PALETTE = {
  cream: [243, 230, 208],
  copper: [196, 120, 58],
  leaf: [107, 143, 113],
  ink: [22, 17, 13],
  steel: [61, 92, 102],
  gold: [201, 162, 39],
  wood: [106, 74, 50],
  muted: [181, 164, 140],
  ash: [138, 120, 100],
  woodDark: [58, 40, 24],
};

export function paletteTable() {
  const pairs = [
    ["ink", "cream"],
    ["cream", "ink"],
    ["cream", "woodDark"],
    ["cream", "wood"],
    ["wood", "cream"],
    ["muted", "ink"],
    ["muted", "cream"],
    ["ash", "cream"],
    ["ash", "ink"],
    ["copper", "ink"],
    ["copper", "cream"],
    ["gold", "ink"],
    ["gold", "cream"],
    ["leaf", "ink"],
    ["leaf", "cream"],
    ["ink", "gold"],
    ["ink", "copper"],
  ];
  return pairs.map(([fg, bg]) => {
    const ratio = contrast(PALETTE[fg], PALETTE[bg]);
    return { fg, bg, fgHex: hex(PALETTE[fg]), bgHex: hex(PALETTE[bg]), ratio: round(ratio), pass: ratio >= 4.5 };
  });
}

function hex(rgb) {
  return "#" + rgb.map((n) => n.toString(16).padStart(2, "0")).join("");
}
function round(n) {
  return Math.round(n * 100) / 100;
}

export function judgeFamily(family, size) {
  const primary = String(family || "")
    .split(",")[0]
    .replace(/["']/g, "")
    .trim();
  const pixel = primary === "CCPixel3x5" || primary === "CCPixel5x7";
  const readable = primary === "Pixelify Sans";
  const approved = APPROVED.includes(primary);
  const onGrid = pixel && [10, 20, 30].some((n) => Math.abs(size - n) < 0.6);
  const reasons = [];
  if (!approved) reasons.push(`face ${primary || "(empty)"} is not approved`);
  if (readable && size < 13.5) reasons.push(`readable ${size}px is under 14`);
  if (pixel && size < 9.5) reasons.push(`pixel ${size}px is under 10`);
  if (pixel && !onGrid) reasons.push(`pixel ${size}px is off the 10/20/30 grid`);
  return { primary, pixel, readable, reasons };
}

/** Collect visible text. fontSize 0 and empty nodes are counted aside, not as violations. */
export async function collectText(page) {
  return page.evaluate(() => {
    const out = [];
    const skipped = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let n;
    while ((n = walker.nextNode())) {
      const raw = n.textContent || "";
      const text = raw.replace(/\s+/g, " ").trim();
      const el = n.parentElement;
      if (!el) continue;
      const cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize) || 0;
      if (!text || size === 0) {
        if (size === 0 || el.getAttribute("data-testid") === "intro-continue") {
          skipped.push({
            reason: "font-size 0 or empty. IntroScreens hit() is a transparent target over canvas art, not text.",
            testid: el.getAttribute("data-testid"),
            size,
          });
        }
        continue;
      }
      if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5);
      if (!rects.length) continue;
      const r = rects[0];
      const inView = r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw;
      if (!inView) continue;
      const top = document.elementFromPoint(r.x + Math.min(r.width, 8), r.y + r.height / 2);
      if (top && top !== el && !el.contains(top) && !top.contains(el)) continue;
      let bg = null;
      let bgEl = el;
      while (bgEl) {
        const b = getComputedStyle(bgEl).backgroundColor;
        const m = b.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
        if (m && (m[4] == null || Number(m[4]) > 0.5)) {
          bg = b;
          break;
        }
        bgEl = bgEl.parentElement;
      }
      out.push({
        text: text.slice(0, 40),
        family: cs.fontFamily,
        size,
        weight: cs.fontWeight,
        color: cs.color,
        background: bg,
        tag: el.tagName.toLowerCase(),
        testid: el.getAttribute("data-testid"),
        box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        inViewport: true,
      });
    }
    return { nodes: out, skipped: skipped.slice(0, 8), skippedCount: skipped.length };
  });
}

export async function collectOverflow(page) {
  return page.evaluate(() => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const bar = document.querySelector("[aria-label=Taskbar]");
    const barTop = bar ? bar.getBoundingClientRect().top : null;
    const clips = [];
    for (const el of document.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      const mode = `${cs.overflow} ${cs.overflowX} ${cs.overflowY}`;
      if (!/hidden|auto|scroll/.test(mode)) continue;
      if (el.clientWidth < 2 || el.clientHeight < 2) continue;
      const sx = el.scrollWidth > el.clientWidth + 2;
      const sy = el.scrollHeight > el.clientHeight + 2;
      if (!sx && !sy) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      clips.push({
        tag: el.tagName.toLowerCase(),
        testid: el.getAttribute("data-testid"),
        className: String(el.className).slice(0, 80),
        overflow: mode.trim(),
        scrollW: el.scrollWidth,
        clientW: el.clientWidth,
        scrollH: el.scrollHeight,
        clientH: el.clientHeight,
      });
    }
    const wins = [...document.querySelectorAll("[data-testid^=window-]")].map((el) => {
      const r = el.getBoundingClientRect();
      const under = barTop != null && r.bottom > barTop + 1;
      const off = r.x < -1 || r.y < -1 || r.right > vw + 1 || under;
      return {
        id: el.getAttribute("data-testid"),
        x: Math.round(r.x),
        y: Math.round(r.y),
        r: Math.round(r.right),
        b: Math.round(r.bottom),
        under,
        off,
      };
    });
    const texts = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const text = (n.textContent || "").replace(/\s+/g, " ").trim();
      if (!text) continue;
      const el = n.parentElement;
      if (!el) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) {
        if (r.width < 1 || r.height < 1) continue;
        if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
        const top = document.elementFromPoint(Math.min(vw - 1, Math.max(0, r.x + 4)), Math.min(vh - 1, Math.max(0, r.y + r.height / 2)));
        if (top && top !== el && !el.contains(top) && !top.contains(el)) continue;
        texts.push({ text: text.slice(0, 24), x: r.x, y: r.y, r: r.right, b: r.bottom });
      }
    }
    const overlaps = [];
    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        const a = texts[i];
        const b = texts[j];
        const iw = Math.min(a.r, b.r) - Math.max(a.x, b.x);
        const ih = Math.min(a.b, b.b) - Math.max(a.y, b.y);
        if (iw > 4 && ih > 4) overlaps.push({ a: a.text, b: b.text, iw: Math.round(iw), ih: Math.round(ih) });
        if (overlaps.length > 30) break;
      }
      if (overlaps.length > 30) break;
    }
    const buttons = [...document.querySelectorAll("button, [role=button]")].map((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > vh) return null;
      const top = document.elementFromPoint(Math.min(vw - 1, r.x + r.width / 2), Math.min(vh - 1, r.y + r.height / 2));
      if (top && top !== el && !el.contains(top) && !top.contains(el)) return null;
      return {
        testid: el.getAttribute("data-testid"),
        text: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 24),
        h: Math.round(r.height),
        w: Math.round(r.width),
      };
    }).filter(Boolean);
    return { barTop: barTop == null ? null : Math.round(barTop), clips, wins, overlaps, buttons };
  });
}

export async function reachDesktop(page) {
  await page.goto(process.env.PLAY_URL || "http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500);
  const stages = ["title"];
  const begin = page.locator("[data-testid=new-shift]");
  if (await begin.count()) {
    await begin.click();
    const wipe = page.locator("[data-testid=wipe-confirm-yes]");
    if (await wipe.count()) await wipe.click();
    await page.waitForSelector("[data-testid=setup-screen]", { timeout: 8000 }).catch(() => {});
    stages.push("setup");
    const go = page.locator("[data-testid=setup-continue]");
    if (await go.count()) {
      await go.click();
      await page.waitForSelector("[data-testid=desktop], [data-testid=phone-home]", { timeout: 8000 }).catch(() => {});
      stages.push("desktop");
    }
  }
  return stages;
}
