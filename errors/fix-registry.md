# Fix Registry

## 2026-10-16 - set-state-in-effect
- Derive instead of sync: input uses `key={sourceUrl}` + `defaultValue` (uncontrolled) instead of mirroring state
- Android device pick: compute `active = picked ?? first online` during render, no effect
- Demo config: module store + `useSyncExternalStore` (server snapshot = fallback) instead of setState on mount

## 2026-10-16 - Turbopack trace warning
- Add `/*turbopackIgnore: true*/` as first arg of runtime `path.join` calls in server-only helpers

## 2026-10-16 - Firefox iframe allow warnings
- Keep `allow="clipboard-write; fullscreen"` only

## 2026-10-16 - Platform spoof under Expo
- Use a Babel plugin keyed on `api.caller(c => c.platform) === "web"` and filename outside node_modules.
  Metro resolveRequest wrappers are bypassed by Expo for aliased modules.

## 2026-10-16 - NativeWind v5 RC circular import
- Pin nativewind@4.2.7 + tailwindcss@^3.4.17, darkMode "class", babel jsxImportSource "nativewind".

## 2026-10-16 - Stale file: dependency copy
- `rm -rf node_modules/@device-lab && npm i <path>`; or bump the bridge version.

## 2026-10-16 - Local tool security
- Bind dev/prod servers to 127.0.0.1 instead of trusting Host headers.
- postMessage: pin targetOrigin, check event.origin + event.source, validate payload schema, normalise paths with
  `new URL(path, location.origin)` and compare origins.
- Gate embed bridges to development builds.

## 2026-10-17 - cairo PNG output in a Tauri app
- Add `cairo-rs = { version = "0.18", features = ["png"] }` for target linux (same version gtk uses).

## 2026-10-17 - Capturing a webview larger than the screen
- Snapshot APIs return the visible region. Capture what fits, scrollIntoView the rest one by one, restore scroll.

## 2026-10-17 - Sync nav and newly mounted frames
- Track frames that just said hello; their first route is a boot route, not a navigation. Send them to the
  shared route instead of broadcasting theirs.

## 2026-10-17 - Verifying native Tauri features without WebDriver
- Temporary module imported from main.tsx behind `import.meta.env.VITE_SELFTEST`, reports through a command
  into SQLite; build with `VITE_SELFTEST=1 pnpm tauri build --debug --no-bundle`, read results with sqlite3,
  delete the module afterwards.
