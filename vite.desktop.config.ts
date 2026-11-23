/**
 * Client-only bundle for the desktop shell. The web deploy stays on TanStack Start.
 * Auth is off so the window does not ask for a server.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

const root = fileURLToPath(new URL("./src/desktop", import.meta.url));

export default defineConfig({
  root,
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  envDir: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    outDir: fileURLToPath(new URL("./dist-desktop", import.meta.url)),
    emptyOutDir: true,
  },
  server: { host: "127.0.0.1", port: 1420, strictPort: true },
});
