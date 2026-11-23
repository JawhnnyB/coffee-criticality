# Steps 21–23

One desktop shell, three unsigned builds, on GitHub Actions. Windows, Linux, and macOS (Apple silicon). No certificate. No Steam.

The web game stays the TanStack Start deploy. The desktop window loads a client-only bundle (`vite.desktop.config.ts`, auth off). That bundle built here: 299 modules, `dist-desktop/index.html`.

This sandbox has Rust 1.99. `cargo check` stopped because `pkg-config` is missing (`glib-2.0`). WebKit and GTK are not installed, and this sandbox cannot install them. The Linux binary was not linked here. The proof is the Actions run on `g/value-100` and the downloadable artifacts from `.github/workflows/desktop.yml`.

Runs [45155820480](https://github.com/JawhnnyB/coffee-criticality/actions/runs/45155820480) and [45156121413](https://github.com/JawhnnyB/coffee-criticality/actions/runs/45156121413) failed in about two minutes. The hook is `npm --prefix .. run desktop:build`, and the Tauri CLI runs that hook from the directory that contains `package.json`. `..` was the empty parent of the checkout (`/home/runner/work/coffee-criticality/package.json`). The hook is now `npm run desktop:build`. Linux also installs WebKitGTK 4.1. Each job bundles one installer: nsis, deb, dmg.
