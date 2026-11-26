#!/usr/bin/env node
// Colt's plant (coltVoice.ts): every line Holt speaks, and every line about him, has a Colt version written by hand.
// The lines are collected by running the game's own content code over every state it branches on, so a new Holt
// line added later fails this test until Colt's version is written.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-colt-"));
const entry = join(dir, "entry.ts");
const out = join(dir, "colt.mjs");
const mods = ["campaign", "content", "week", "socialScenes", "crewMoments", "floorTalks", "parlorPrizes", "coltVoice", "nightwatch/rotationScenes"];
writeFileSync(entry, mods.map((f, i) => `export * as m${i} from ${JSON.stringify(join(root, `src/game/${f}.ts`))};`).join("\n"));
const b = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`, "--loader:.png=empty", "--external:@tauri-apps/*"], { encoding: "utf8", cwd: root });
if (b.status !== 0) throw new Error(b.stderr || b.stdout);
const M = await import(out);
const [K, C, W, S, CM, FT, PP, V, RS] = mods.map((_, i) => M[`m${i}`]);

const HOLT = /Holt|Reggie|Reginald/;

/** Every text Holt says, or that names him, across the game's content. */
export function collect() {
  const said = new Set(); // spoken by Holt
  const about = new Set(); // someone else naming Holt
  const line = (l) => {
    if (!l) return;
    const holt = l.speaker === "Holt" || l.who === "holt";
    if (holt) said.add(l.text);
    else if (HOLT.test(l.text)) about.add(l.text);
    for (const c of l.choices ?? []) {
      if (holt) said.add(c.reply);
      else if (HOLT.test(c.reply)) about.add(c.reply);
      if (HOLT.test(c.label)) about.add(c.label);
    }
  };
  const ids = Object.keys(C.NPCS);
  const res = ["open", "caught", "hid"];
  for (const npc of ids)
    for (const day of [1, 2, 3, 4, 5])
      for (const first of [true, false])
        for (const log of res)
          for (const other of res)
            for (const culture of [0, 30])
              for (const returning of [false, true])
                for (const ending of [false, true])
                  for (const ended of ["a", "c"])
                    for (const hides of [0, 1, 3])
                      for (const extra of [{}, { holtBoard: true, holtVolume: true, elenaSecondEyes: true, tommySentence: true, priyaPeak: true, hid: true }]) {
                        const flags = { ...extra };
                        if (!first) flags[`${npc}Talked`] = true;
                        if (returning) flags["crew:returning"] = true;
                        const residue = { valve: other, tag: other, dose: other, log };
                        for (const wk of [{ catches: 5, reports: 2 }, { catches: 0, reports: 0 }])
                          C.talkLines(npc, flags, culture, "morning", day, "transferred", residue, ending, ended, { ...wk, hides, trust: 50 }).forEach(line);
                      }
  for (const npc of ids) for (const sc of S.SCENES[npc] ?? []) { sc.lines.forEach(line); if (HOLT.test(sc.known ?? "")) about.add(sc.known); }
  for (const m of CM.MOMENTS) { m.lines.forEach(line); if (HOLT.test(m.known ?? "")) about.add(m.known); }
  for (const t of FT.ALL_FLOOR_TALKS) {
    for (const cul of ["guarded", "respect", "comfort", "distrust", "fear"]) FT.floorLines(t, cul).forEach(line);
    for (const s of [t.scene, t.title, t.ask, t.trust?.label, t.trust?.reply, t.callout?.label, t.callout?.reply, t.says?.text]) if (s && HOLT.test(s)) about.add(s);
  }
  const days = [];
  for (const week of [1, 2, 3, 10]) for (const standDown of [false, true]) for (const d of W.WEEK) days.push(K.dayVariant(d, { week, plant: "colt", standDown: false }), K.dayVariant(d, { week, plant: "holt", standDown }));
  for (const d of days) {
    if (d.holt.startsWith("Holt: Last week ended") || /^Holt: (Yesterday people|I'm not counting|Every blank gets|Last day\.)/.test(d.holt)) continue; // stand-down: Holt's plant only
    said.add(d.holt);
    for (const s of [d.kicker, d.title, ...d.items, ...d.goals.map((g) => g.label)]) if (HOLT.test(s)) about.add(s);
  }
  for (const k of Object.keys(W.INCIDENTS)) for (const s of Object.values(W.INCIDENTS[k])) if (HOLT.test(s)) about.add(s);
  for (const hides of [0, 3]) for (const ended of ["a", "c", null])
    for (const f of [{}, { elenaSecondEyes: true }, { holtVolume: true }, { tommySentence: true }, { priyaPeak: true }, { delayPrompt: true }, { catchMiss: true }, { hid: true }]) {
      const t = W.eodNpcLine({ hides, ended, flags: f });
      if (HOLT.test(t)) (t.startsWith("Holt:") ? said : about).add(t);
    }
  for (const log of res) for (const flags of [{}, { holtBoard: true, elenaVan: true }].map((f) => ({ ...f, ...Object.fromEntries(ids.map((i) => [`${i}Talked`, true])) }))) for (const r of C.floorTies({ valve: log, tag: log, dose: log, log }, flags)) {
    if (HOLT.test(r.pair)) about.add(r.pair);
    if (HOLT.test(r.line)) about.add(r.line);
  }
  for (const trust of [0, 50]) { const t = C.relationLine("holt", {}, trust); if (t) about.add(t); }
  for (const n of [1, 2, 3, 4]) for (const again of [false, true]) for (const held of [false, true]) {
    const sc = RS.openerScene(n, again, { held, hides: held ? 0 : 3, trust: { holt: 50 }, returning: again });
    if (HOLT.test(sc.title)) about.add(sc.title);
    sc.lines.forEach(line);
  }
  about.add(PP.NO_TOY_FOR_HOLT);
  about.add(C.NPCS.holt.name);
  about.add(C.NPCS.holt.note);
  said.add(C.NPCS.holt.meet);
  about.add(C.NPC_INTRO.holt.who);
  said.add(C.NPC_INTRO.holt.beat);
  said.delete(undefined);
  return { said: [...said].filter(Boolean), about: [...about].filter(Boolean) };
}

const all = collect();

test("every line Holt speaks has its own Colt line, written by hand", () => {
  const missing = all.said.filter((t) => !V.coltWritten(t));
  assert.deepEqual(missing, [], `${missing.length} Holt lines with no Colt version`);
});

test("every line about Holt is rewritten or marked as a plain name swap", () => {
  const missing = all.about.filter((t) => !V.coltWritten(t) && !V.NAME_SWAP_OK.includes(t));
  assert.deepEqual(missing, [], `${missing.length} lines about Holt with no Colt version`);
});

test("Colt's lines never name Holt, and Holt's plant is untouched", () => {
  for (const t of [...all.said, ...all.about]) {
    assert.equal(V.plantText(t, "holt"), t);
    const c = V.plantText(t, "colt");
    assert.doesNotMatch(c, HOLT, `still names Holt: ${c}`);
  }
});

test("Colt is a different man, not Holt with a new name", () => {
  const same = all.said.filter((t) => V.plantText(t, "colt").replace(/Colt|Russ(ell)?/g, "Holt") === t);
  assert.ok(same.length <= 3, `too many of Holt's own lines kept word for word: ${same.join(" | ")}`);
});

test("the leftover map entries all point at a real line (nothing stale)", () => {
  const known = new Set([...all.said, ...all.about, ...V.EXTRA_KEYS]);
  const stale = Object.keys(V.COLT_LINES).filter((k) => !known.has(k));
  assert.deepEqual(stale, []);
});

if (process.env.DUMP_COLT) writeFileSync(process.env.DUMP_COLT, JSON.stringify(all, null, 2));
