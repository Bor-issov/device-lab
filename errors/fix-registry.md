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

## 2026-10-18 - Real-world device sizes and stable folds
- Each panel stores its diagonal (inches) and body (mm); geometry = mm x px-per-mm x zoom. The page keeps its
  CSS viewport and is scaled into the screen with one transform, so the body height stays fixed across folds.
- Rotate / fold: the iframe takes the final viewport in one step; only the shell tweens and the page fades in.
- Outside windows pick one zoom that fits every fold state, so folding never rescales the device.
- px per mm on Linux: GDK monitor geometry / width_mm (screen_px_per_mm command), else 96 / 25.4.

## 2026-10-18 - Checking iframe rAF / rendering in WebKitGTK without the Tauri app
- `python3 -I` script with gi WebKit2 4.1 + Gtk 3, `GDK_BACKEND=x11`, snapshot via Gdk.pixbuf_get_from_window
  (no pycairo). Serve `dist/` with `python3 -m http.server` on 127.0.0.1; seed localStorage `device-lab` first.
- Cross-origin frames can be scrolled with a UserScript (ALL_FRAMES) that listens for postMessage.
