import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-preview-"));
const out = join(dir, "preview.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/lib/preview-path-prefix.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const { previewPathPrefix, prefixRewrite } = await import(out);

const HOST = "preview.grok.mil";
const PREFIX = "/hds-abc123-8080-xyz";

test("a preview host keeps the port-id prefix", () => {
  assert.equal(previewPathPrefix(HOST, "/hds-abc123-8080-xyz/"), PREFIX);
  assert.equal(previewPathPrefix(HOST, "/hds-abc123-8080-xyz/play"), PREFIX);
});

test("the site root has no prefix", () => {
  assert.equal(previewPathPrefix(HOST, "/"), undefined);
});

test("a non-preview host is left alone", () => {
  assert.equal(previewPathPrefix("example.com", "/hds-abc123-8080-xyz/"), undefined);
  assert.equal(previewPathPrefix("localhost", "/"), undefined);
});

test("prefixRewrite strips the prefix on the way in and adds it on the way out", () => {
  const rewrite = prefixRewrite(PREFIX);
  const input = new URL("https://preview.grok.mil/hds-abc123-8080-xyz/play");
  assert.equal(rewrite.input({ url: input }).pathname, "/play");
  const root = new URL("https://preview.grok.mil/hds-abc123-8080-xyz");
  assert.equal(rewrite.input({ url: root }).pathname, "/");
  const plain = new URL("https://preview.grok.mil/");
  assert.equal(rewrite.input({ url: plain }).pathname, "/");
  const out = new URL("https://preview.grok.mil/play");
  assert.equal(rewrite.output({ url: out }).pathname, "/hds-abc123-8080-xyz/play");
});
