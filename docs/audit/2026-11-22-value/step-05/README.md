# Step 5: one ship check

`npm run ship-check` runs typecheck, `npm run build`, then the Nitro preview. It exits 0 only if the homepage answers HTTP 200.

This run: typecheck passed, the build passed, preview `http://127.0.0.1:8094/` returned 200. The command itself exited 0. The lines are in `result.txt`.

`vite preview` is still the old `preview` script. It cannot serve this build. Step 6 points `npm run preview` at the Nitro server.
