/**
 * One command: typecheck, production build, and the Nitro preview.
 *   npm run ship-check
 *
 * `vite preview` is not this check. It cannot serve the Nitro build.
 * The preview here is scripts/preview-built.mjs.
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.SHIP_PORT ?? "8094";
const lines = [];
const say = (s) => {
  console.log(s);
  lines.push(s);
};

function run(cmd, args) {
  say(`$ ${cmd} ${args.join(" ")}`);
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: root, stdio: "inherit" });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function previewAnswers() {
  const child = spawn("node", ["scripts/preview-built.mjs"], {
    cwd: root,
    env: { ...process.env, PORT: port },
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let buf = "";
  child.stdout.on("data", (d) => {
    buf += d;
  });
  child.stderr.on("data", (d) => {
    buf += d;
  });
  const url = `http://127.0.0.1:${port}/`;
  try {
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(url);
        if (res.status === 200) return res.status;
      } catch {
        /* not up yet */
      }
      if (child.exitCode != null) throw new Error(`preview exited ${child.exitCode}\n${buf.slice(-500)}`);
      await new Promise((r) => setTimeout(r, 250));
    }
    throw new Error(`preview never returned 200\n${buf.slice(-500)}`);
  } finally {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      child.kill("SIGKILL");
    }
  }
}

try {
  await run("npm", ["run", "typecheck"]);
  await run("npm", ["run", "build"]);
  const status = await previewAnswers();
  say(`preview http://127.0.0.1:${port}/ HTTP ${status}`);
  const out = join(root, "docs/audit/2026-11-22-value/step-05");
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "result.txt"), lines.join("\n") + "\n");
  process.exit(0);
} catch (err) {
  say(`FAIL ${err.message}`);
  process.exit(1);
}
