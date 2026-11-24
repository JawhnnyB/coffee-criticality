/**
 * Twenty careful rotations. Nights follow the night-tune bot, and they also
 * drink coffee: the tablet stays up, and a pot is brewed in a quiet minute
 * once the cup is under about ten minutes. Days talk, catch, and report.
 *   ESBUILD=./node_modules/.bin/esbuild node scripts/step-60-sweep.mjs
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-bal-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  [
    `export * from ${JSON.stringify(join(root, "src/game/nightwatch/model.ts"))};`,
    `export { TRUST_DELTA, recordNight } from ${JSON.stringify(join(root, "src/game/nightwatch/turnover.ts"))};`,
    `export { NPCS } from ${JSON.stringify(join(root, "src/game/content.ts"))};`,
    `export { socialTier } from ${JSON.stringify(join(root, "src/game/social.ts"))};`,
    `export { createState, openTalk, pickChoice, finishArcade, finishLeisure, finishTrainer, finishMaint, resolveIncident, useInteract } from ${JSON.stringify(join(root, "src/game/sim.ts"))};`,
    `export { setMuted } from ${JSON.stringify(join(root, "src/game/audio.ts"))};`,
  ].join("\n"),
);
const out = join(dir, "bal.mjs");
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

function ownAlarm(n, e) {
  if (n.minute < e.start || e.caughtAt !== null || e.doneAt !== null) return false;
  if (!Object.keys(e.def.effect).length) return false;
  const a = W.alarms({ ...n, events: [e] });
  return Object.keys(e.def.effect).some((id) => a.includes(id));
}

function looking(n) {
  return n.brewing === 0 && n.coffee > 0;
}

/** Careful watcher who also keeps a cup. Reports only while the tablet can be up. */
function careful(site, night, seed) {
  const n = W.newNight(site, night, seed);
  W.setTablet(n, true);
  let lied = false;
  let emptyMin = 0;
  let brewed = 0;
  let missed = 0;
  let minC = n.coffee;
  while (!n.over) {
    const hot = n.events.find((e) => ownAlarm(n, e));
    const per = (n.tablet ? W.COFFEE.tablet : W.COFFEE.desk) * (n.drain || 1);
    if (n.brewing === 0 && n.brewsLeft > 0 && n.coffee <= per * 10 && !hot) {
      if (W.brew(n)) brewed += 1;
    }
    if (looking(n) && !n.tablet) W.setTablet(n, true);
    const see = looking(n);
    if (hot) {
      if (see) {
        n.camera = hot.def.camera;
        W.report(n, hot.def.accept[0]);
      } else missed += 1;
    } else if (see && night === 1) {
      const silent = n.events.find(
        (e) =>
          (e.def.id === "lhra-door" || e.def.id === "pool-fme") &&
          e.caughtAt === null &&
          e.doneAt === null &&
          n.minute >= e.start + 6 &&
          n.minute < e.start + e.def.escalate,
      );
      if (silent) {
        n.camera = silent.def.camera;
        W.report(n, silent.def.accept[0]);
      } else if (!lied) {
        const odd = n.oddities.find(
          (o) =>
            n.minute >= o.start &&
            n.minute < o.end &&
            !n.events.some((e) => e.def.camera === o.def.camera && n.minute >= e.start && e.caughtAt === null && e.doneAt === null),
        );
        if (odd) {
          n.camera = odd.def.camera;
          W.report(n, "foreign");
          lied = true;
        }
      }
    }
    if (n.coffee === 0 && n.brewing === 0) emptyMin += 1;
    if (n.over) break;
    W.tick(n, 1);
    if (n.coffee < minC) minC = n.coffee;
  }
  const g = W.grade(n);
  return { letter: g.letter, points: g.points, coffee: Math.round(n.coffee * 10) / 10, emptyMin, brewed, left: n.brewsLeft, missed, falseReports: n.falseReports };
}

function takeWarm(s) {
  for (const line of s.dialogue) {
    const fresh = (line.choices ?? []).filter((c) => !s.flags[`choice:${c.id}`] && ((c.trust ?? 0) > 0 || (c.culture ?? 0) > 0));
    if (!fresh.length) continue;
    fresh.sort((a, b) => (b.trust ?? 0) - (a.trust ?? 0) || (b.culture ?? 0) - (a.culture ?? 0));
    W.pickChoice(s, fresh[0]);
    return;
  }
}

const SITES = ["pwr", "bwr", "pebble", "msr"];
const lines = [];
const runs = [];
for (let i = 0; i < 20; i++) {
  const site = SITES[i % 4];
  const seed = 1 + Math.floor(i / 4);
  const nights = [1, 2, 3, 4].map((night) => careful(site, night, seed));
  const elena = nights.reduce((sum, r) => sum + W.TRUST_DELTA[r.letter], 0);
  const s = W.createState();
  const npcs = Object.keys(W.NPCS);
  const talks = 1 + (i % 3);
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
    for (const id of npcs) {
      const n = day === 1 ? talks : 1;
      for (let t = 0; t < n; t++) {
        W.openTalk(s, id);
        takeWarm(s);
      }
    }
  }
  s.trust.elena += elena;
  const gain = (id) => s.trust[id] - W.NPCS[id].startTrust;
  const row = {
    i: i + 1,
    site,
    seed,
    nights: nights.map((r) => r.letter).join(""),
    coffeeEnd: nights.map((r) => r.coffee),
    empty: nights.reduce((a, r) => a + r.emptyMin, 0),
    missed: nights.reduce((a, r) => a + r.missed, 0),
    pots: nights.map((r) => r.brewed),
    culture: s.culture,
    elena: gain("elena"),
    mabel: gain("mabel"),
    jordan: gain("jordan"),
    mabelTier: W.socialTier(s.trust.mabel, W.NPCS.mabel.startTrust, 4),
    jordanTier: W.socialTier(s.trust.jordan, W.NPCS.jordan.startTrust, 4),
    elenaTier: W.socialTier(s.trust.elena, W.NPCS.elena.startTrust, 4),
  };
  runs.push(row);
  lines.push(
    `#${row.i} ${site} seed ${seed} nights ${row.nights} coffee ${row.coffeeEnd.join("/")} empty ${row.empty} missed ${row.missed} pots ${row.pots.join("/")} culture ${row.culture} elena +${row.elena} (t${row.elenaTier}) mabel +${row.mabel} (t${row.mabelTier}) jordan +${row.jordan} (t${row.jordanTier})`,
  );
}

const required = W.createState();
for (let day = 1; day <= 4; day++) {
  required.day = day;
  required.incidentResolved = false;
  if (day === 1) W.finishTrainer(required);
  if (day === 2) {
    required.mode = "maint";
    W.finishMaint(required, 1);
  }
  if (!required.incidentResolved) {
    required.incidentOpen = true;
    W.resolveIncident(required, "report");
  }
}
lines.push(`required-only culture ${required.culture} (no cabinets, no extra talks)`);

const emptyRuns = runs.filter((r) => r.empty > 0).length;
const missedRuns = runs.filter((r) => r.missed > 0).length;
const held = runs.filter((r) => r.culture >= 42).length;
const honest = runs.filter((r) => r.culture >= 28).length;
const host2 = runs.filter((r) => r.mabelTier >= 2 && r.jordanTier >= 2).length;
const n1b = runs.filter((r) => r.nights[0] === "B").length;
const n4c = runs.filter((r) => r.nights[3] === "C").length;
const summary = [
  `runs 20`,
  `night1 B ${n1b}/20`,
  `night4 C ${n4c}/20`,
  `cup hit empty ${emptyRuns}/20`,
  `alarm minutes unseen ${missedRuns}/20`,
  `culture >= 28 ${honest}/20`,
  `culture held (>=42) ${held}/20`,
  `mabel and jordan tier 2 ${host2}/20`,
  `culture min ${Math.min(...runs.map((r) => r.culture))} max ${Math.max(...runs.map((r) => r.culture))}`,
  `night4 coffee min ${Math.min(...runs.map((r) => r.coffeeEnd[3]))}`,
].join("\n");

const text = summary + "\n" + lines.join("\n") + "\n";
const outDir = join(root, "docs/audit/2026-11-22-value/step-60");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "result.txt"), text);
console.log(text);
