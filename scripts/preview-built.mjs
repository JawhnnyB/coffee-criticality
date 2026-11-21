/**
 * Serve the production build.
 *
 * `vite preview` asks TanStack Start for dist/server/server.js. This repo's Nitro
 * build uses the Vercel preset, which writes .vercel/output instead, so that file
 * is never there. Nitro records the working command in .vercel/output/nitro.json:
 * srvx, static files from .vercel/output/static, server entry the function bundle.
 *
 *   node scripts/preview-built.mjs
 *   PORT=8091 node scripts/preview-built.mjs
 */
import { spawn } from "node:child_process";
import { existsSync, symlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const func = join(root, ".vercel/output/functions/__server.func");
const entry = join(func, "index.mjs");
const stat = join(root, ".vercel/output/static");
if (!existsSync(entry)) {
  console.error("No production build. Run npm run build first.");
  process.exit(1);
}
// The Vercel function bundle imports these beside the PGLite chunk. The build
// does not copy them, and a missing file crashes the preview on the first request.
const libs = join(func, "_libs");
const dist = join(root, "node_modules/@electric-sql/pglite/dist");
for (const name of ["pglite.data", "pglite.wasm", "initdb.wasm"]) {
  const dest = join(libs, name);
  if (!existsSync(dest)) symlinkSync(join(dist, name), dest);
}
const port = process.env.PORT ?? "8091";
const child = spawn(
  join(root, "node_modules/.bin/srvx"),
  ["--prod", "--host", "127.0.0.1", "--port", port, "--static", stat, entry],
  { stdio: "inherit" },
);
child.on("exit", (code) => process.exit(code ?? 0));

