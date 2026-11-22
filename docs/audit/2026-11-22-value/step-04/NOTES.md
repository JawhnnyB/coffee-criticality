# Step 4: the nine baseline failures

Each one, and what changed. The game was not retuned. The injector still writes the share card.

1. `scripts/cabinet-rewards.test.mjs`. It bundled `sim.ts` with `import("esbuild")`. This repo does not depend on esbuild, so the file died before a test ran. It now loads esbuild from `ESBUILD_PKG`, a normal install, or the Vercel CLI copy. The six cabinet checks pass.
2. `scripts/desk-verdict.test.mjs`. Same missing import, against `nuclearLab.ts`. Same loader. The four verdict checks pass.
3. `injects project id on the script and meta when provided`. The test passed the name and id as extra arguments. `injectGrokPwaHead` takes one context object. The call is now `{ appName, projectId }`.
4. `does not duplicate grok:app_id`. Same dead arguments, so the id was never written and the count was 0. The context object is passed, and a second inject stays at one tag.
5. `injects x:creator tags when both creator values are set`. Same dead arguments. The context now carries `creator` and `creatorId`.
6. `does not duplicate x:creator tags`. Same fix. A second inject does not add a second pair.
7. `platform chrome injects twitter:card when the document has none`. The card was already injected. The test also forbade `og:title`. The injector writes the title with the card, using the document title. The test now expects `og:title` "Hello World".
8. `leaves an existing twitter:card alone`. The injector owns the share card and replaces an old `summary` card with `summary_large_image`, once. The test name is now `replaces an existing twitter:card with the platform card`.
9. `uses the app name in the injected title tag`. The name was passed as a bare string, so the title stayed "Grok App". It is now `{ appName: "Wild Race" }`.

Full suite, with the esbuild binary the other tests already use: 308 tests, 308 pass, 0 fail.
