# Steps 21–23

One desktop shell, three unsigned builds, on GitHub Actions. Windows, Linux, and macOS (Apple silicon). No certificate. No Steam.

The web game stays the TanStack Start deploy. The desktop window loads a client-only bundle (`vite.desktop.config.ts`, auth off). That bundle built here: 299 modules, `dist-desktop/index.html`.

This sandbox has Rust 1.99. `cargo check` stopped because `pkg-config` is missing (`glib-2.0`). WebKit and GTK are not installed, and this sandbox cannot install them. The Linux binary was not linked here. The proof is the Actions run on `g/value-100` and the downloadable artifacts from `.github/workflows/desktop.yml`.
