// node serve.mjs <outdir> <public> <port>: static files, build first, then public.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
const [out, pub, port] = process.argv.slice(2);
const T = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".md": "text/plain", ".txt": "text/plain" };
createServer(async (q, r) => {
  const u = decodeURIComponent(new URL(q.url, "http://x").pathname);
  for (const base of [out, pub]) {
    const p = join(base, u === "/" ? "index.html" : u);
    try { if ((await stat(p)).isFile()) { r.writeHead(200, { "content-type": T[extname(p)] ?? "application/octet-stream" }); r.end(await readFile(p)); return; } } catch {}
  }
  r.writeHead(404); r.end("not found");
}).listen(+port, "127.0.0.1");
