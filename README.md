<p align="center"><img src="public/logo/logo.svg" width="56" alt="Device Lab logo"></p>

# Device Lab

Desktop app that previews one web or Expo app on many devices at once: iPhones, iPads, foldables and Android
phones, each drawn at its real point / dp size with its hardware (Dynamic Island, notch, punch-hole, hinge, home
indicator). Point it at your dev server and every frame reloads together.

Built with Tauri 2 (Rust + Tokio + SQLite) and React 19, Vite, Tailwind CSS 4.

## Features

- **Device canvas**: 19 built-in devices plus your own sizes. Rotate, fold / unfold, reload or remove each frame,
  or all at once. Zoom and fit to window.
- **Move outside**: right click a frame (or use its caption button) to put it in its own window on the desktop,
  with rotate, fold, reload, bring back and close above it.
- **App settings per frame**: dark / light, text size S to XL, LTR / RTL, iOS / Android platform, nav sync.
- **Logs**: console warnings, errors and crashes from every frame, kept across sessions.
- **Screenshots**: one PNG per device, cut to the device shell (Linux for now).
- **Android emulator**: boot AVDs, live screen, tap / swipe / type, back / home / recents, rotate, fold, open
  the app in Expo Go. Shows up when an Android SDK is installed.
- **Updates**: Check for updates in the sidebar shows what is new and installs it in place.

## Install

Download the installer for your OS from [Releases](https://github.com/Bor-issov/device-lab/releases/latest):

| OS | File |
| --- | --- |
| Windows | `.exe` (setup) or `.msi` |
| macOS | `.dmg` (Apple Silicon and Intel) |
| Linux | `.AppImage`, `.deb` or `.rpm` |

Builds are not code signed yet. Windows SmartScreen and macOS Gatekeeper will warn on first launch
(macOS: right click the app, Open). In-app updates are signed and verified.

## Use it with your app

1. Start your app's dev server (for example `npx expo start --web` or `next dev`).
2. Put its URL in **App URL** in the sidebar.
3. Pick devices from the list.

Any web app renders at each device size. Expo / React Native web apps can add the **preview bridge**
(`packages/preview-bridge`) for safe-area insets, per-device color scheme, Platform.OS per device, logs and
navigation sync. Click **no bridge** under any frame for the install steps.

## Development

Requirements: Node LTS, pnpm, Rust (stable), and the
[Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS.

```bash
pnpm install
pnpm app          # desktop app in dev mode (Vite on 127.0.0.1:1420 + Rust)
pnpm dev          # UI only in a browser, native features off
pnpm typecheck && pnpm lint
cd src-tauri && cargo clippy --all-targets -- -D warnings && cargo test
pnpm app:build    # installers for the current OS
```

| Path | What |
| --- | --- |
| `src/` | React UI (Lab, device frames, panels, built-in demo app at `/demo`) |
| `src-tauri/` | Rust backend: SQLite, screenshots, Android (adb / emulator), external windows |
| `packages/preview-bridge` | Bridge package for Expo / React Native web apps |
| `examples/expo-app` | Reference Expo app using the bridge |
| `integrations/ios-screenshots` | GitHub Actions workflow for real iOS Simulator screenshots |

## Releases

1. Bump the version in `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` and `package.json`.
2. Write what is new in `.github/release-notes.md` (shown in the release and in the app's update dialog).
3. `git tag vX.Y.Z && git push origin vX.Y.Z`. The release workflow builds every OS into a draft release.
4. Publish the draft. Installed apps see the update once it is published.

## License

[MIT](LICENSE)
