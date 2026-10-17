# Error Log

## 2026-10-16 - react-hooks/set-state-in-effect lint errors
- Where: sidebar/source-field.tsx, android-panel/android-panel.tsx, demo/use-demo-bridge.ts
- Symptom: `Calling setState synchronously within an effect can trigger cascading renders`
- Status: fixed (see fix-registry.md)

## 2026-10-16 - Turbopack file-tracing warning on Android SDK helper
- Where: src/lib/android/sdk.ts (path.join with os.homedir()/PATH entries)
- Symptom: build warning that dynamic paths may pull the whole project into the trace
- Status: fixed

## 2026-10-16 - Firefox Feature Policy warnings from iframe allow list
- Symptom: `Skipping unsupported feature name "clipboard-read"` / `autoplay` per frame render
- Status: fixed (allow list trimmed)

## 2026-10-16 - Platform spoof never applied under Expo
- Symptom: Platform.OS stayed "web" in Lab frames; platform-shim absent from the bundle
- Cause: Expo CLI resolver chain aliases react-native -> react-native-web and resolves it before custom resolveRequest
- Status: fixed (Babel plugin)

## 2026-10-16 - Gluestack v5 alpha + NativeWind v5 RC crash on web
- Symptom: `TypeError: can't access property "default", _exportsFlatList2 is undefined` (browser),
  `Cannot read properties of undefined (reading 'default')` in SSR render
- Cause: react-native-css web resolver swaps react-native-web internals for wrappers -> circular FlatList import
- Status: upstream issue, not the Lab. Example app uses NativeWind 4.2.7 instead

## 2026-10-16 - Example app frames blank on first Lab load
- Symptom: white frames, "no bridge" for ~15 s
- Cause: four frames compiling/downloading a 7 MB dev bundle at once (not a crash)
- Status: documented in Setup panel

## 2026-10-16 - Bridge updates not picked up after npm install
- Symptom: example app kept old bridge code
- Cause: same package version, npm kept the existing copied folder
- Status: workaround documented (rm -rf node_modules/@device-lab then reinstall)

## 2026-10-16 - Error stack without message in Logs (Firefox)
- Status: fixed (prefix `Name: message` when stack lacks it)

## 2026-10-16 - Security review findings (automated)
- [HIGH] adb routes trusted the Host header; next dev/start listened on all interfaces, so a LAN client could spoof Host/Origin
- [MEDIUM] bridge posted routes/console output with targetOrigin "*"
- [MEDIUM] bridge accepted config/navigate from any parent origin; "//host" paths passed the startsWith("/") check
- Status: fixed on fix/security-hardening

## 2026-10-17 - cairo ImageSurface has no write_to_png
- `no method named write_to_png found for struct ImageSurface` (cairo-rs re-exported by gtk lacks the png feature)
- Status: fixed

## 2026-10-17 - Native capture cut off devices below the fold
- WebKit snapshot covers the visible viewport only; shells partly off screen came out half transparent
- Status: fixed (capture in passes, scroll each remaining shell into view)

## 2026-10-17 - Sync nav reset every frame when a device was added
- New frame reports its boot route (/demo); with Sync nav on that route was broadcast to all frames
- Status: fixed (first route after hello is answered with navigate to the shared route instead)

## 2026-10-17 - WebKitWebDriver not available on Arch webkit2gtk-4.1
- tauri-driver end-to-end testing not possible out of the box; verified with a temporary in-app self-test
- Status: worked around

## 2026-10-18 - Plain web apps render under the drawn status bar / Dynamic Island
- Netfocus (Next.js PWA, localhost:3000, no bridge): header starts at y=24, iPhone 17 Pro top inset is 62, so the
  logo sits under the island and status bar overlay. Android (40/36) and SE (20) are tighter but clear.
- Frames without the bridge get env(safe-area-inset-*) = 0, devicePixelRatio 1, (hover: hover), desktop UA
- Status: open (proposed: browser viewport mode for frames without a bridge)

## 2026-10-18 - Update button cannot reach latest.json
- Repo was private: https://github.com/Bor-issov/device-lab/releases/latest/download/latest.json returned 404
- Status: fixed (repo made public under MIT)
