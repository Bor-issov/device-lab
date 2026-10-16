# Features

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
- src/components/ui/dashboard/{lab,sidebar,toolbar,canvas,device-frame,side-panel,android-panel,logs-panel,setup-panel,primitives}
- src/lib/{devices,store,protocol,frames,capture,fit}.ts, src/lib/android/{sdk,guard}.ts
- src/app/api/android/{status,boot,screen,input}/route.ts
- src/app/demo/[[...tab]]/

## Tech stack
- Next.js 16.4 (App Router, cacheComponents), React 19.3, TypeScript 5.9, Tailwind CSS 4.3
- shadcn (base-nova, Base UI): button, slider, tooltip (hover/transition classes stripped)
- GSAP 3.15 + @gsap/react, Zustand 5 (persist, localStorage key `device-lab`), TanStack Query 5
- No Supabase yet (no server data needed for v1.0)

## Commands
- `pnpm dev` / `pnpm build` / `pnpm typecheck` / `pnpm lint`
- `pnpm bridge:pack` -> packages/preview-bridge/device-lab-preview-bridge-0.1.0.tgz
