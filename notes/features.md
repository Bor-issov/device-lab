# Features

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
- src/components/ui/dashboard/{lab,sidebar,toolbar,canvas,device-frame,side-panel,android-panel,logs-panel,shots-panel,setup-panel,primitives}
- src/lib/{devices,store,protocol,frames,capture,fit,native,router}.ts, src/lib/android/types.ts
- src/demo/{demo-app.tsx,use-demo-bridge.ts}
- src-tauri/src/{lib,db,capture,probe,state,error}.rs, src-tauri/src/android/{sdk,commands}.rs
- src-tauri/migrations/0001_init.sql, src-tauri/tauri.conf.json, src-tauri/capabilities/default.json

## Tech stack
- Tauri 2.12 (WebKitGTK on Linux), Rust 1.91, Tokio, sqlx 0.8 (SQLite), cairo-rs (capture)
- Vite 8.3, React 19.3, TypeScript 5.9, Tailwind CSS 4.3 (@tailwindcss/vite), Geist via fontsource
- shadcn (base-nova, Base UI): button, slider, tooltip (hover/transition classes stripped)
- GSAP 3.15 + @gsap/react, Zustand 5 (persist -> SQLite settings key `device-lab`; localStorage in browser dev), TanStack Query 5
- No Supabase yet (no server data needed for v1.0)

## Commands
- `pnpm app` (tauri dev: Vite on 127.0.0.1:1420 + Rust) / `pnpm app:build` (deb, rpm, AppImage)
- `pnpm dev` (UI only in a browser, native features off) / `pnpm build` / `pnpm typecheck` / `pnpm lint`
- `cd src-tauri && cargo clippy --all-targets -- -D warnings && cargo test`
- `pnpm bridge:pack` -> packages/preview-bridge/device-lab-preview-bridge-0.1.0.tgz
