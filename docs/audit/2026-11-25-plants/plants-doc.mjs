import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const r = spawnSync(process.env.ESBUILD ?? "esbuild", ["src/game/coltVoice.ts", "--bundle", "--platform=node", "--format=esm", "--outfile=/tmp/cv.mjs"], { encoding: "utf8" });
if (r.status) throw new Error(r.stderr);
const V = await import("/tmp/cv.mjs");
const rows = Object.entries(V.COLT_LINES).map(([h, c]) => `| ${h.replace(/\|/g, "/")} | ${c.replace(/\|/g, "/")} |`);
const out = `# Two plants: draft for owner approval

AI-drafted. Needs the owner's approval, and counts toward the Steam AI disclosure.

## What changed

- **Ten weeks.** Each three-week block is one fuel cycle: start, middle, end. Fuel shuffles happen on the Friday of weeks 3, 6 and 9. Every other Friday is a **flux map**: no fuel moves, you find the peak of the core you signed last time by reading detectors one assembly at a time. Week 10 is the **equilibrium core**: three reloads have taken out every starting assembly. A tap on the strip above each morning brief shows the cycle in numbers (teaching numbers, typical of a large PWR).
- **Stand-down.** At Holt's plant, a week that ends in Fear makes the next week a stand-down: Holt calls everyone in, and the brief and his lines change. If the stand-down week ends in Fear too, you **request a transfer**: an honest ending, and the way into Colt's plant.
- **Colt's plant.** Pick it on the title screen, or arrive by transfer. Same crew, same reactor, same incidents. The director is **Mr. Russell Colt** ("Russ" to Mabel). The floor starts 3 points ahead on trust and on calling things out, and it takes three hides, not two, to put heads down. Your choices still move it. No stand-downs: if heads go down, Colt buys the coffee and asks what he did. Every morning he leaves something on your desk.
- Each plant keeps its own week and its own crew memory. A week abandoned before its ending replays.
- Saves from before this change play as the original single week, unchanged.

## Decisions for the owner

- Colt's first name. I used Russell ("Russ").
- Colt uses Holt's portrait and sprite for now. He needs his own art.
- Week 1 now ends in a flux map, not the shuffle. The first shuffle is week 3.
- The three-point head start and three-hide limit at Colt's plant.

## Every Holt line and its Colt line

${V.COLT_PATTERNS.length} lines are built from numbers: see \`COLT_PATTERNS\` in \`src/game/coltVoice.ts\`.

| Holt's plant | Colt's plant |
|---|---|
${rows.join("\n")}

## Colt's desk notes, one per day

${V.COLT_DESK.map((d, i) => `${i + 1}. ${d}`).join("\n")}
`;
writeFileSync("docs/two-plants-draft.md", out);
console.log(rows.length);
