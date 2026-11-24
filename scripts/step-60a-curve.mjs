/**
 * Trust at the end of a careful week, before and after the once-a-day host bonus.
 * Before is sim.ts alone (frozen +2 per good bowl or golf). After adds hostTrust.ts.
 *   ESBUILD=./node_modules/.bin/esbuild node scripts/step-60a-curve.mjs
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-curve-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  [
    `export { NPCS } from ${JSON.stringify(join(root, "src/game/content.ts"))};`,
    `export { socialTier } from ${JSON.stringify(join(root, "src/game/social.ts"))};`,
    `export { createState, openTalk, pickChoice, finishArcade, finishLeisure, finishTrainer, finishMaint, resolveIncident, useInteract, bumpTrust } from ${JSON.stringify(join(root, "src/game/sim.ts"))};`,
    `export { hostDayTrust } from ${JSON.stringify(join(root, "src/game/hostTrust.ts"))};`,
    `export { setMuted } from ${JSON.stringify(join(root, "src/game/audio.ts"))};`,
  ].join("\n"),
);
const out = join(dir, "curve.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`, "--loader:.png=empty"], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);

globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
const any = new Proxy(function () {}, {
  get: (_t, k) => (k === "currentTime" || k === "sampleRate" ? 44100 : k === Symbol.toPrimitive ? () => 0 : any),
  apply: () => any,
  construct: () => any,
  set: () => true,
});
globalThis.window ??= { AudioContext: any };
const W = await import(out);
W.setMuted(true);

function takeWarm(s) {
  for (const line of s.dialogue) {
    const fresh = (line.choices ?? []).filter((c) => !s.flags[`choice:${c.id}`] && ((c.trust ?? 0) > 0 || (c.culture ?? 0) > 0));
    if (!fresh.length) continue;
    fresh.sort((a, b) => (b.trust ?? 0) - (a.trust ?? 0) || (b.culture ?? 0) - (a.culture ?? 0));
    W.pickChoice(s, fresh[0]);
    return;
  }
}

function playWeek(talks, withHost) {
  const s = W.createState();
  const curve = [];
  for (let day = 1; day <= 4; day++) {
    s.day = day;
    s.incidentResolved = false;
    s.mode = "arcade";
    W.finishArcade(s, 4, 12);
    if (day === 1) {
      s.mode = "golf";
      W.finishLeisure(s, 5);
      s.mode = "bowl";
      W.finishLeisure(s, 5);
      if (withHost) {
        for (const [id, score] of [["golf", 5], ["bowl", 5]]) {
          const extra = W.hostDayTrust(s.flags, id, s.day, score);
          if (extra) W.bumpTrust(s, extra.npc, extra.trust);
        }
      }
      W.finishTrainer(s);
      s.nearId = "coffee";
      W.useInteract(s);
    }
    if (day === 2) {
      s.mode = "maint";
      W.finishMaint(s, 1);
    }
    if (!s.incidentResolved) {
      s.incidentOpen = true;
      W.resolveIncident(s, "report");
    }
    for (const id of Object.keys(W.NPCS)) {
      const n = day === 1 ? talks : 1;
      for (let t = 0; t < n; t++) {
        W.openTalk(s, id);
        takeWarm(s);
      }
    }
    const gain = (id) => s.trust[id] - W.NPCS[id].startTrust;
    curve.push({ day, mabel: gain("mabel"), jordan: gain("jordan"), elena: gain("elena") });
  }
  return { s, curve };
}

const lines = [];
lines.push("quiet week, one talk a day, one golf, one bowl. Gain since morning.");
lines.push("day | mabel before | jordan before | mabel after | jordan after");
const before = playWeek(1, false);
const after = playWeek(1, true);
for (let i = 0; i < 4; i++) {
  const b = before.curve[i];
  const a = after.curve[i];
  lines.push(`${b.day}   | +${b.mabel} | +${b.jordan} | +${a.mabel} | +${a.jordan}`);
}
const tier = (s, id) => W.socialTier(s.trust[id], W.NPCS[id].startTrust, 4);
lines.push(
  `end before mabel +${before.curve[3].mabel} t${tier(before.s, "mabel")} jordan +${before.curve[3].jordan} t${tier(before.s, "jordan")}`,
);
lines.push(
  `end after  mabel +${after.curve[3].mabel} t${tier(after.s, "mabel")} jordan +${after.curve[3].jordan} t${tier(after.s, "jordan")}`,
);

let jordanBefore = 0;
let jordanAfter = 0;
for (let i = 0; i < 20; i++) {
  const talks = 1 + (i % 3);
  const b = playWeek(talks, false);
  const a = playWeek(talks, true);
  if (tier(b.s, "jordan") >= 2) jordanBefore += 1;
  if (tier(a.s, "jordan") >= 2) jordanAfter += 1;
}
lines.push(`jordan tier 2 across 20 talk-patterns: before ${jordanBefore}/20 after ${jordanAfter}/20`);

const replay = W.createState();
replay.day = 1;
replay.mode = "bowl";
W.finishLeisure(replay, 5);
const once = W.hostDayTrust(replay.flags, "bowl", 1, 5);
if (once) W.bumpTrust(replay, once.npc, once.trust);
const afterOne = replay.trust.jordan;
replay.mode = "bowl";
W.finishLeisure(replay, 5);
const again = W.hostDayTrust(replay.flags, "bowl", 1, 5);
lines.push(
  `same-day replay: frozen pays again, extra is ${again ? "paid" : "not paid"}. jordan ${W.NPCS.jordan.startTrust} -> ${afterOne} -> ${replay.trust.jordan}`,
);

const text = lines.join("\n") + "\n";
const dest = join(root, "docs/audit/2026-11-22-value/step-60a");
mkdirSync(dest, { recursive: true });
writeFileSync(join(dest, "result.txt"), text);
console.log(text);
