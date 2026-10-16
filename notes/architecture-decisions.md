# Architecture Decisions

## 2026-10-16 - iOS preview via react-native-web, not a simulator
No Mac available or wanted. iOS Simulator only runs on macOS. Lab renders the Expo web build inside
device-sized iframes. Real iOS pixels come from GitHub Actions macOS runners (free on public repos).

## 2026-10-16 - Config transport: iframe name + postMessage
Device config is written to the iframe `name` (window.name survives in-app navigation and reloads,
and is per-frame, unlike sessionStorage which same-origin frames share). Live changes go via postMessage.
Bridge sends `hello`, Lab answers with `config`. Lab attributes messages by `event.source` window identity.

## 2026-10-16 - Platform.OS spoof through a Babel plugin, app code only
`@device-lab/preview-bridge/babel` rewrites `react-native` imports to `@device-lab/preview-bridge/platform`
for files outside node_modules, web builds only (babel caller platform). Libraries (NativeWind, Gluestack,
Reanimated) keep Platform.OS === "web" so their DOM paths work.
Superseded: a Metro `resolveRequest` wrapper. Expo's resolver chain aliases react-native -> react-native-web
and resolves it before custom resolvers run (custom resolveRequest is only a fallback), so it never fired.

## 2026-10-16 - Safe areas via context override
On web, SafeAreaProvider measures CSS env() (0 in an iframe) and overwrites initialMetrics, so the
bridge provides SafeAreaInsetsContext/SafeAreaFrameContext directly. SafeAreaView and NativeWind
`*-safe` classes still read env() and stay at 0 (documented in Setup panel).

## 2026-10-16 - Android: adb screencap polling, no extra deps
Live view polls `adb exec-out screencap -p` (roughly 3-8 fps). Input via `adb shell input`, posture via
`adb emu fold/unfold`. Routes are loopback-only, same-origin, JSON-only (src/lib/android/guard.ts),
and every adb call goes through execFile with validated serials/AVD names.

## 2026-10-16 - Screenshots via Screen Capture API
Cross-origin iframes cannot be drawn to canvas, so capture grabs one frame of the tab/window/screen
and crops each device shell. Tab capture is exact; window/monitor capture estimates browser chrome offsets.

## 2026-10-16 - Bridge distribution as tarball
`npm pack` tarball instead of `file:` link so Metro resolves react/react-native from the app's own
node_modules (a symlink would resolve upward into the Lab's node_modules and duplicate React).

## 2026-10-16 - Theme classes: both `dark` and `light`
Bridge toggles `dark` and `light` on <html>. Gluestack's CSS has a prefers-color-scheme block that only
`:root.light` overrides; with `dark` alone, an OS in dark mode wins over a Lab frame set to light.

## 2026-10-16 - Reference app on NativeWind 4.2.7
examples/expo-app: Expo SDK 58, NativeWind 4.2.7 (Tailwind v3, darkMode "class"), Reanimated 4, Expo Router,
web output "single". Gluestack v5 alpha + NativeWind v5 RC (what `gluestack-ui@latest init` installs) crashes
on react-native-web 0.21 with a circular FlatList import in react-native-css, independent of the Lab.
Bridge installed with `install-links=true` (.npmrc) so the file: dependency is copied, not symlinked.

## 2026-10-16 - Security boundary for the Lab and the bridge
- Lab server binds 127.0.0.1 (`pnpm dev` / `pnpm start` use `-H 127.0.0.1`). This is the real protection for the
  adb routes; the Host check stays as DNS-rebinding defence, plus Origin/JSON checks and an x-forwarded-for check.
- Bridge activates only in development builds (`__DEV__` / NODE_ENV) and only when the config's `labOrigin` is a
  loopback origin. postMessage targets that origin; inbound messages must come from window.parent AND that origin.
- Every config is schema-validated (enums, numeric ranges, id pattern). Navigate paths must be same-origin
  (`/` but not `//`, no backslashes, resolved origin unchanged).
- Lab posts to each frame's own src origin and attributes inbound messages by window identity + origin.
- Trade-off: a Lab on another machine or a non-loopback hostname will not connect to the bridge. Revisit with an
  explicit allowlist if that is ever needed.
