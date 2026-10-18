# Features

## [v2.6] Release v0.3.0 (2026-10-18)
- Version 0.3.0 (tauri.conf.json, Cargo.toml, package.json), release notes for real sizes and new catalog
- Update check times out after 20 s

## [v2.5] Real-world device sizes, 2025-2026 catalog (2026-10-18)
- Catalog limited to the last two years: iPhone 18 Pro/Pro Max, iPhone Duo, Air, 17, 17e; iPad Pro M5, Air M4,
  iPad A16, mini A17 Pro; MacBook Pro 16/14, Air 15/13, MacBook Neo, iMac 24; Galaxy Z TriFold, Fold 8 Ultra,
  Fold 8, Flip 8, Pixel 11 Pro Fold, Huawei Mate XTs, Mate X7, Xiaomi Mix Flip 2; Pixel 11 Pro XL/Pro/11,
  Galaxy S26 Ultra/S26, Xiaomi 17 Ultra/17, Huawei Pura 80 Ultra; Galaxy Tab S11 Ultra/S11, Xiaomi Pad 8 Pro
- Retired ids map to their successors on load (settings v2 migration), poses become fold indexes
- Panels: size (CSS px / dp), diagonal, body mm, optional dpr and hinge lines. Foldables list states open first;
  Mate XTs cycles triple -> dual -> single, TriFold draws two hinges
- Zoom 1 = real size; "Real size" toolbar button; zoom 20-150%. px per mm from GDK on Linux (96 dpi elsewhere)
- Fold / rotate: page resized once, shell tweens; body height constant across folds (no stretch, no rescale)
- Macs: lid + base / iMac head + stand, bezel camera, no rotate, no status bar; bridge sees them as tablet + web
- Not yet run in `pnpm app` (typecheck, lint, vite build, clippy, cargo test pass; UI verified in WebKitGTK 2.54)

## [v2.4] Open source (2026-10-18)
- Repo Bor-issov/device-lab public under MIT (LICENSE, license fields in package.json and Cargo.toml)
- README rewritten for the desktop app (features, install, bridge, development, releases)
- Public repo makes the v0.2.0 update feed (releases/latest/download/latest.json) reachable without auth

## [v2.3] Updates, panel cleanup, Android SDK (2026-10-18) - release v0.2.0
- Check for updates (sidebar footer, desktop only): dialog with the release notes, Update (download + install +
  relaunch, progress bar) and Dismiss. tauri-plugin-updater + plugin-process, endpoint = GitHub latest.json
- Release workflow signs updater artifacts (TAURI_SIGNING_PRIVATE_KEY secrets) and writes latest.json;
  release notes come from .github/release-notes.md (GitHub release body + update dialog)
- Setup panel removed: "no bridge" label on a frame opens the bridge guide in a dialog
- Android tab + toolbar icon only when adb or the emulator is found
- Shots panel: masonry columns, each shot keeps its own shape (was squeezed into 3:4 boxes)
- Dialog (shadcn base-nova) on the dark surface, no rings or borders
- Android SDK installed on the dev machine: ~/Android/Sdk (API 36 google_apis x86_64), JDK 21 in ~/Android/jdk,
  AVDs Pixel_Fold and Pixel_9

## [v2.2] Move frames outside (2026-10-18)
- Right click inside a frame: WebKitGTK "Open Frame in New Window" replaced by "Move outside" (Linux);
  caption button "Move outside" on every platform (desktop only)
- Frame spawns in its own borderless transparent window (label external-<id>, page /external/<id>),
  real size unless taller/wider than the screen, drag bar on top: rotate, fold (foldables), reload, bring back, close
- Lab stays source of truth: state pushed over Tauri events, actions and bridge messages sent back
  (logs, route, errors, sync nav keep working for outside frames)
- Canvas lists outside frames with "Bring back"; Alt+F4 on the window docks it; closing the Lab closes all
- Right click inside an outside frame offers "Bring back" (Linux)
- Not yet run in `pnpm app` (typecheck, lint, vite build, clippy, cargo test pass)

## [v2.1] Cross-platform release builds (2026-10-17)
- .github/workflows/release.yml: tauri-action matrix (macos-latest universal, windows-latest, ubuntu-22.04)
  builds on tag `v*` or manual run, uploads to a draft GitHub Release
- Bundle targets "all": Windows .msi + NSIS .exe, macOS .dmg + .app, Linux .deb + .rpm + .AppImage
- Android SDK lookup adds Windows (%LOCALAPPDATA%\Android\Sdk) and macOS (~/Library/Android/sdk) defaults
- adb/emulator spawned with CREATE_NO_WINDOW on Windows (no console flash per screencap frame)
- Unsigned builds for now (Gatekeeper / SmartScreen warnings); native capture still Linux-only
- Deps to latest: Rust 1.99 (rust-version 1.94), sqlx 0.9, TypeScript 6.0.3, ESLint 10, React 19.3.1, @types/node 26
  - Held back: TypeScript 7 (typescript-eslint supports <6.1), gtk/cairo-rs 0.18 (Tauri/wry/webkit2gtk use gtk 0.18)

## [v2.0] Desktop app - Tauri v2 + Vite + Rust/Tokio + SQLite (2026-10-17)
- Next.js removed. Frontend is Vite 8 + React 19 + TS + Tailwind 4 (same shadcn/GSAP/Zustand/TanStack UI, ported 1:1)
- Single entry (index.html -> src/main.tsx); /demo/* served by SPA fallback renders the built-in demo (src/demo)
- Rust backend (src-tauri): Tokio async commands, SQLite via sqlx + migrations at <app data>/device-lab.db
  - settings_* (Zustand persist storage, debounced), presets_* (custom devices), logs_* (history, last 5000),
    screenshots + capture_devices, probe_url (TCP probe), android_* (adb/emulator via tokio::process)
- Android live screen streams raw PNG frames over a Tauri Channel (android_screen_start/stop)
- Native screenshots: WebKitGTK snapshot of the webview, cairo crop per shell with rounded corners, PNGs in
  <app data>/screenshots, Shots panel (thumbnails via asset protocol, show in folder, delete)
- Custom device presets: Custom group in the sidebar, any width/height, iOS/Android defaults, stored in SQLite
- Logs keep history across sessions (earlier sessions shown dimmed, not counted in the error badge)
- Bridge 0.2.0 accepts the desktop origins (tauri://localhost, http(s)://tauri.localhost)
- Sync nav: a newly added frame joins the shared route instead of pulling every frame back to its start route
- Verified in the real webview (dev and production origin): demo + Expo example connect, capture, presets, log
  history, probe, asset thumbnails

## [v1.2] Security hardening (2026-10-16)
- Lab binds to 127.0.0.1; adb routes also reject non-loopback x-forwarded-for
- Bridge: dev builds only, loopback Lab origin only, pinned postMessage origin both ways, config validation,
  same-origin navigation only; Lab posts to frame origins and checks inbound origin

## [v1.1] Bridge verified on a real Expo app (2026-10-16)
- examples/expo-app: Expo SDK 58 + NativeWind 4.2.7 + Reanimated 4 + Expo Router "Bridge check" app
- Verified in the Lab: Platform.OS/select per device (ios/android), per-device insets and viewport,
  dark/light per frame, fold reflow, console error forwarding, nav sync through Expo Router
- Platform spoof moved from Metro resolver to Babel plugin (`@device-lab/preview-bridge/babel`)
- Bridge sets both `dark` and `light` classes; Firefox error messages prefixed to stacks
- Logs panel: first line shown, stack collapsed

## [v1.0] Device Lab - initial build (2026-10-16)
- Device canvas: one app URL rendered in iframes at real point/dp sizes inside drawn device shells
- Catalog (src/lib/devices.ts): iPhone 17 Pro Max/17 Pro/Air/16e/13 mini/SE, iPad Pro 13/11, Air 11, mini, Galaxy Z Fold 7/6, Pixel 9 Pro Fold, Galaxy Z Flip 7, Pixel 10 Pro XL/10, Galaxy S25 Ultra/S25, Pixel Tablet
- Hardware chrome: Dynamic Island, notch, punch-hole, side keys, SE chin/home button, tablet bezel camera, status bar, home indicator, hinge overlay
- Per-device: rotate, fold/unfold (GSAP size tween), reload, remove, bridge status + current route + error count
- Global: Dark/Light, text size S-XL, LTR/RTL, Platform (iOS/Android vs web), Chrome/Hinge toggles, Sync nav, zoom + fit, rotate all, reload all, capture screenshots (Screen Capture API crop)
- Side panel: Android (real emulator via adb: list/boot AVDs, live screencap view, tap/swipe/text, back/home/recents, rotate, fold/unfold, open in Expo Go, shut down), Logs (console warn/error + uncaught from every frame), Setup (bridge install guide)
- Built-in demo app at /demo (habit tracker) speaking the bridge protocol, two-pane layout at >= 600 wide
- packages/preview-bridge: Expo/RN-web package (safe-area context override, Appearance + PixelRatio patch, dark/light class, dir, text zoom, console forwarding, route reporting, navigate, Babel Platform shim)
- integrations/ios-screenshots: GitHub Actions macOS workflow + Maestro flow for real iOS Simulator screenshots

## Key files
- src/main.tsx (entry), src/providers.tsx, src/styles/globals.css, index.html, vite.config.ts
- src/components/ui/dashboard/{lab,sidebar,toolbar,canvas,device-frame,side-panel,android-panel,logs-panel,shots-panel,setup-panel,primitives,external-frame}
- src/lib/{devices,store,protocol,frames,capture,fit,native,router}.ts, src/lib/android/types.ts
- src/lib/external.ts, src/hooks/use-external-frames.ts, src/components/ui/dashboard/external-frame
- src/demo/{demo-app.tsx,use-demo-bridge.ts}
- src-tauri/src/{lib,db,capture,probe,state,error,external,screen}.rs, src-tauri/src/android/{sdk,commands}.rs
- src-tauri/migrations/0001_init.sql, src-tauri/tauri.conf.json, src-tauri/capabilities/{default,external}.json

## Tech stack
- Tauri 2.12 (WebKitGTK on Linux), Rust 1.99, Tokio, sqlx 0.9 (SQLite), cairo-rs (capture)
- Vite 8.3, React 19.3, TypeScript 6.0, Tailwind CSS 4.3 (@tailwindcss/vite), Geist via fontsource
- shadcn (base-nova, Base UI): button, slider, tooltip (hover/transition classes stripped)
- GSAP 3.15 + @gsap/react, Zustand 5 (persist -> SQLite settings key `device-lab`; localStorage in browser dev), TanStack Query 5
- No Supabase yet (no server data needed for v1.0)

## Commands
- `pnpm app` (tauri dev: Vite on 127.0.0.1:1420 + Rust) / `pnpm app:build` (host OS installers)
- Release: bump version (tauri.conf.json, Cargo.toml, package.json), edit .github/release-notes.md,
  `git tag vX.Y.Z && git push --tags`, publish the draft release (updater only sees published releases)
- `pnpm dev` (UI only in a browser, native features off) / `pnpm build` / `pnpm typecheck` / `pnpm lint`
- `cd src-tauri && cargo clippy --all-targets -- -D warnings && cargo test`
- `pnpm bridge:pack` -> packages/preview-bridge/device-lab-preview-bridge-0.1.0.tgz
