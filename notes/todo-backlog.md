# Todo Backlog

## Next
- [ ] Run "Move outside" in `pnpm app`: right click menu item, transparent window on KDE Wayland, drag, rotate resize, bring back, Alt+F4, Lab close
- [x] Bridge verified against examples/expo-app (NativeWind 4.2.7 + Reanimated 4 + Expo Router)
- [ ] Re-test with Gluestack once Gluestack v5 / NativeWind v5 stop crashing on react-native-web 0.21
- [x] Android SDK installed (~/Android/Sdk, API 36), AVDs Pixel_Fold + Pixel_9, booted from the Lab with live view
- [ ] Verify fold/unfold and Expo Go open on Pixel_Fold
- [ ] Push integrations/ios-screenshots into the app repo and run the workflow once (untested so far)

- [x] Run release workflow once (run 39070632832, 2026-10-18: macOS, Windows, Linux all green, draft v0.1.0)
- [ ] Smoke-test installers on Windows and macOS (Android panel, presets, logs, SQLite)
- [ ] Code signing: Apple Developer ID + notarization, Windows Azure Trusted Signing
- [x] Auto-updates via tauri-plugin-updater + GitHub Releases latest.json (v0.2.0)
- [ ] First real in-app update: ship v0.2.1 and update from the installed v0.2.0
- [ ] Browser viewport mode for frames without the bridge (content under status bar / island, see error-log)
- [ ] Native capture on Windows/macOS (WebView2 CapturePreview / WKWebView takeSnapshot)
- [ ] Optional full-resolution capture (render at zoom 1 off screen) instead of on-screen scale
- [ ] Persist custom presets in browser dev mode too (only SQLite today)
- [ ] App icon/logo pass (public/logo/logo.svg is a placeholder mark)

## Later
- [ ] Faster Android stream (scrcpy H.264 over WebSocket instead of screencap polling)
- [ ] Scroll sync across frames
- [x] Custom device presets (add sizes in the UI, SQLite)
- [ ] Edit existing custom presets (cutout, radius, insets)
- [ ] Side-by-side diff of GitHub Actions iOS screenshots vs Lab frames
- [ ] Device groups / saved layouts (Supabase if sharing is needed)
