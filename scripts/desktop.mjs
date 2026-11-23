// Cross-platform desktop vite. Windows cmd cannot take VAR=value prefixes.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dev = process.argv[2] === "dev";
const vite = join(root, "node_modules", "vite", "bin", "vite.js");
const args = dev
  ? [vite, "--config", "vite.desktop.config.ts", "--host", "127.0.0.1", "--port", "1420", "--strictPort"]
  : [vite, "build", "--config", "vite.desktop.config.ts"];
const result = spawnSync(process.execPath, args, {
  cwd: root,
  env: { ...process.env, VITE_AUTH_ENABLED: "false" },
  stdio: "inherit",
});
process.exit(result.status ?? 1);
