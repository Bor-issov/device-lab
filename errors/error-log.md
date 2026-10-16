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
