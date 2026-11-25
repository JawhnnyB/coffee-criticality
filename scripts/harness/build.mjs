// Browser test build of Coffee & Criticality: esbuild for the app, Tailwind v4's compile() for the CSS.
// node build.mjs <repo> <outdir>
import * as esbuild from "/opt/npm-tools/node_modules/esbuild/lib/main.js";
import { compile } from "/opt/npm-tools/node_modules/tailwindcss/dist/lib.mjs";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
const [repo, out] = process.argv.slice(2);
const H = dirname(new URL(import.meta.url).pathname);
mkdirSync(out, { recursive: true });
const NM = "/opt/npm-tools/node_modules";
const plugin = {
  name: "cc",
  setup(b) {
    b.onResolve({ filter: /^@\/lib\/auth\// }, () => ({ path: join(H, "stubs/auth.tsx") }));
    b.onResolve({ filter: /^@tanstack\/react-router$/ }, () => ({ path: join(H, "stubs/auth.tsx") }));
    b.onResolve({ filter: /^@tauri-apps\// }, (a) => ({ path: a.path, external: true }));
    b.onResolve({ filter: /^@\// }, (a) => b.resolve("./" + a.path.slice(2), { resolveDir: join(repo, "src"), kind: a.kind }));
    b.onResolve({ filter: /\?raw$/ }, (a) => ({ path: resolve(a.resolveDir, a.path.replace(/\?raw$/, "")), namespace: "raw" }));
    b.onLoad({ filter: /.*/, namespace: "raw" }, (a) => ({ contents: `export default ${JSON.stringify(readFileSync(a.path, "utf8"))};`, loader: "js" }));
  },
};
await esbuild.build({
  entryPoints: [join(H, "entry.tsx")], bundle: true, format: "esm", splitting: true, outdir: out, platform: "browser",
  jsx: "automatic", loader: { ".png": "file", ".jpg": "file", ".svg": "file", ".woff2": "file" }, nodePaths: [NM],
  resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".mjs"], define: { "process.env.NODE_ENV": '"development"', "import.meta.env": "{}" },
  plugins: [plugin], logLevel: "warning", sourcemap: false,
});
// Tailwind: candidates are every class-ish token in the source.
const css = readFileSync(join(repo, "src/styles.css"), "utf8");
const cands = new Set();
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(tsx?|jsx?)$/.test(f)) for (const t of readFileSync(p, "utf8").split(/[\s"'`{}()<>,;=]+/)) if (t && t.length < 80) cands.add(t); } };
walk(join(repo, "src"));
const tw = await compile(css, { base: repo, loadStylesheet: async (id, base) => {
  const p = id === "tailwindcss" ? join(NM, "tailwindcss/index.css") : resolve(base, id);
  return { path: p, base: dirname(p), content: readFileSync(p, "utf8") };
} });
writeFileSync(join(out, "app.css"), tw.build([...cands]));
writeFileSync(join(out, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script type="module" src="/entry.js"></script></body></html>`);
console.log("built", out);
