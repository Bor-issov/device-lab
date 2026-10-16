import { installRuntime } from "./runtime"

// No-op outside the Lab (native builds, plain browser tabs).
installRuntime()

export { PreviewBridge, usePreviewColorScheme, usePreviewConfig, usePreviewFontScale } from "./provider"
export { getPreviewConfig, isInLab } from "./config"
export type { PreviewConfig } from "./protocol"
