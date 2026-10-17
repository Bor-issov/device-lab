# Todo Backlog

## Next
- [x] Bridge verified against examples/expo-app (NativeWind 4.2.7 + Reanimated 4 + Expo Router)
- [ ] Re-test with Gluestack once Gluestack v5 / NativeWind v5 stop crashing on react-native-web 0.21
- [ ] Install the Android SDK + create Pixel_Fold AVD, verify live view, fold/unfold, Expo Go open
- [ ] Push integrations/ios-screenshots into the app repo and run the workflow once (untested so far)

- [ ] Run release workflow once (manual dispatch), smoke-test installers on Windows and macOS
- [ ] Code signing: Apple Developer ID + notarization, Windows Azure Trusted Signing
- [ ] Auto-updates via tauri-plugin-updater + GitHub Releases latest.json
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
