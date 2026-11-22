# Step 6: preview is the built game

`npm run preview` is `node scripts/preview-built.mjs`. That is the Nitro server. `vite preview` is no longer the command.

This run used the build from step 5. `PORT=8095 npm run preview` listened on `http://127.0.0.1:8095/`. The homepage returned HTTP 200. The title is Coffee & Criticality.
