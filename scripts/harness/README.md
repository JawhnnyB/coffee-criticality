# Browser test build

A stand-alone build of the game for Playwright runs, without the TanStack Start server. Sign-in is stubbed out
(`stubs/auth.tsx`). Uses esbuild and Tailwind v4's `compile()`; needs `react`, `react-dom`, `esbuild`,
`tailwindcss` and `playwright` reachable from `/opt/npm-tools/node_modules` (edit `NM` in `build.mjs` for another
location).

```
node scripts/harness/build.mjs "$PWD" /tmp/cc-outv
node scripts/harness/serve.mjs /tmp/cc-outv "$PWD/public" 8093 &
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node docs/audit/2026-11-25-cohesion/flow.mjs 1280x720
```

The game's test hooks are on `window.__controlsTest`. Use them only for labelled setup and for reading state;
play with real clicks and keys.
