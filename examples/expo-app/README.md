# Device Lab reference app

Expo SDK 58 + NativeWind 4.2.7 + Reanimated 4 + Expo Router, wired to `@device-lab/preview-bridge`.
The home screen prints every value the bridge controls (Platform, color scheme, window, safe area, font scale).

```bash
npm install
npx expo start --web     # then point Device Lab's App URL at http://localhost:8081
```

Bridge wiring: `babel.config.js` (Platform plugin), `src/app/_layout.tsx` (`<PreviewBridge>`),
`tailwind.config.js` (`darkMode: "class"`), `.npmrc` (`install-links=true` so the bridge is copied, not symlinked).
