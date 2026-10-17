import { CodeBlock } from "@/components/ui/dashboard/primitives/code-block"

const STEPS: { title: string; body?: string; code?: string; label?: string }[] = [
  {
    title: "Pack the bridge",
    body: "Run once in the Device Lab folder. It builds a tarball your Expo app installs like any package.",
    code: "pnpm bridge:pack",
  },
  {
    title: "Install it in your Expo app",
    code: `npx expo install react-dom react-native-web @expo/metro-runtime react-native-safe-area-context
npm i ~/projects/device-lab/packages/preview-bridge/device-lab-preview-bridge-0.2.0.tgz

# after pulling bridge updates (same version number), force a fresh copy
rm -rf node_modules/@device-lab && npm i ~/projects/device-lab/packages/preview-bridge/device-lab-preview-bridge-0.2.0.tgz`,
  },
  {
    title: "Add the Babel plugin",
    body: "Lets app code see Platform.OS as ios or android inside the Lab. Only files outside node_modules are rewritten, and only for web builds, so NativeWind, Gluestack and Reanimated keep their web paths.",
    label: "babel.config.js",
    code: `module.exports = function (api) {
  api.cache(true)
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins: ["@device-lab/preview-bridge/babel"],
  }
}`,
  },
  {
    title: "Wrap the root layout",
    label: "app/_layout.tsx",
    code: `import { Stack, router, type Href } from "expo-router"
import { PreviewBridge, usePreviewColorScheme } from "@device-lab/preview-bridge"
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider"

export default function RootLayout() {
  const scheme = usePreviewColorScheme()
  return (
    <PreviewBridge onNavigate={(path) => router.push(path as Href)}>
      <GluestackUIProvider mode={scheme ?? "system"}>
        <Stack />
      </GluestackUIProvider>
    </PreviewBridge>
  )
}`,
  },
  {
    title: "Use class-based dark mode",
    body: "The Lab sets light or dark per frame with a class on <html>, so each device can differ from your OS. NativeWind v4 (Tailwind v3):",
    label: "tailwind.config.js",
    code: `module.exports = {
  darkMode: "class",
  // ...
}`,
  },
  {
    title: "NativeWind v5 / Tailwind v4 instead",
    label: "global.css",
    code: `@custom-variant dark (&:where(.dark, .dark *));`,
  },
  {
    title: "Start the web build",
    body: "Keep the App URL on the left at http://localhost:8081. Every save hot-reloads all frames. The first load compiles one bundle per frame, so give it a few seconds.",
    code: "npx expo start --web",
  },
]

const NOTES = [
  "Read insets with useSafeAreaInsets(). SafeAreaView and NativeWind safe-area classes read CSS env() on web, which the Lab cannot set.",
  "Native-only modules (camera, haptics, secure store, notifications) need a .web.ts fallback or a mock.",
  "Text size: the bridge scales Text via CSS zoom and reports PixelRatio.getFontScale(). Close to the real thing, not identical.",
  "For real iOS pixels, use the GitHub Actions workflow in integrations/ios-screenshots. It is free on public repos.",
  "Known issue (not the Lab): Gluestack v5 alpha with NativeWind v5 RC crashes on react-native-web 0.21 with a circular FlatList import. Stay on NativeWind 4.2.7 until it is fixed.",
  "examples/expo-app is a working reference: Expo SDK 58, NativeWind 4.2.7, Reanimated 4, Expo Router.",
]

export function SetupPanel() {
  return (
    <div className="flex flex-col gap-7 px-5 pb-8">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Without the bridge, frames still render your app at each device size. With it you also get safe areas, per-device color scheme, the Platform switch, logs and navigation sync.
      </p>
      <ol className="flex flex-col gap-7">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex flex-col gap-2.5">
            <div className="flex items-baseline gap-2.5">
              <span className="font-mono text-xs text-primary tabular-nums">{i + 1}</span>
              <h3 className="text-sm font-medium">{step.title}</h3>
            </div>
            {step.body && <p className="text-[13px] leading-relaxed text-muted-foreground">{step.body}</p>}
            {step.code && <CodeBlock code={step.code} label={step.label} />}
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-2.5 rounded-xl bg-muted p-4">
        <h3 className="text-sm font-medium">Good to know</h3>
        <ul className="flex flex-col gap-2">
          {NOTES.map((n) => (
            <li key={n} className="text-[13px] leading-relaxed text-muted-foreground">
              {n}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
