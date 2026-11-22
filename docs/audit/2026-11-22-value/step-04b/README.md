# Step 4b

esbuild is a devDependency, pinned at 0.28.2. That is the version `npm` resolves for the `^0.28.1` range Vite 8.2.1 asks for. `package.json` has no caret.

`scripts/esbuild-mod.mjs` imports that package. The Vercel CLI path is gone. `ESBUILD_PKG` can still point at another copy.

`import("esbuild")` reports 0.28.2. Cabinet and desk tests pass with no `ESBUILD` override (step-04b/result.txt). The full suite, also with no override, is 308 pass and 0 fail (step-04b/suite.txt).
