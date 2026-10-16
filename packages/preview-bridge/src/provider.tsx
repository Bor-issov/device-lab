import { useEffect, useSyncExternalStore, type ReactNode } from "react"
import { SafeAreaFrameContext, SafeAreaInsetsContext } from "react-native-safe-area-context"
import { getPreviewConfig, isInLab, subscribe } from "./config"
import { setNavigateHandler } from "./runtime"

const ZERO = { top: 0, right: 0, bottom: 0, left: 0 }

export function usePreviewConfig() {
  return useSyncExternalStore(subscribe, getPreviewConfig, () => null)
}

/** "light" | "dark" inside the Lab, null everywhere else (pass through to your own theming). */
export function usePreviewColorScheme() {
  return usePreviewConfig()?.scheme ?? null
}

export function usePreviewFontScale() {
  return usePreviewConfig()?.fontScale ?? 1
}

type Props = {
  children: ReactNode
  /** Route sync from the Lab. With Expo Router: onNavigate={(path) => router.push(path)} */
  onNavigate?: (path: string) => void
}

// Overrides the safe-area contexts with the device's real insets. useSafeAreaInsets() and
// React Navigation headers read these; on web they would otherwise all be 0.
export function PreviewBridge({ children, onNavigate }: Props) {
  const config = usePreviewConfig()

  useEffect(() => {
    if (!onNavigate) return
    setNavigateHandler(onNavigate)
    return () => setNavigateHandler(null)
  }, [onNavigate])

  if (!isInLab) return <>{children}</>

  const insets = config?.insets ?? ZERO
  const frame = { x: 0, y: 0, width: config?.viewport.width ?? 0, height: config?.viewport.height ?? 0 }

  return (
    <SafeAreaFrameContext.Provider value={frame}>
      <SafeAreaInsetsContext.Provider value={insets}>{children}</SafeAreaInsetsContext.Provider>
    </SafeAreaFrameContext.Provider>
  )
}
