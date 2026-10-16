// Wire format between the Lab (parent window) and the preview bridge running inside each frame.
// Keep in sync with device-lab src/lib/protocol.ts.

export type DeviceOs = "ios" | "android"
export type DeviceKind = "phone" | "tablet" | "fold" | "flip"
export type Insets = { top: number; right: number; bottom: number; left: number }

export const LAB_SOURCE = "devicelab"
export const BRIDGE_SOURCE = "devicelab-bridge"
export const WINDOW_NAME_PREFIX = "devicelab:"

export type ColorScheme = "dark" | "light"
export type TextDirection = "ltr" | "rtl"

export type PreviewConfig = {
  deviceId: string
  deviceName: string
  deviceKind: DeviceKind
  os: DeviceOs
  spoofPlatform: boolean
  scheme: ColorScheme
  fontScale: number
  dir: TextDirection
  insets: Insets
  viewport: { width: number; height: number }
  dpr: number
  folded: boolean
  landscape: boolean
}

export type LabMessage =
  | { source: typeof LAB_SOURCE; type: "config"; config: PreviewConfig }
  | { source: typeof LAB_SOURCE; type: "navigate"; path: string }

export type LogLevel = "log" | "warn" | "error"

export type BridgeMessage =
  | { source: typeof BRIDGE_SOURCE; type: "hello"; deviceId: string; version: string }
  | { source: typeof BRIDGE_SOURCE; type: "route"; deviceId: string; path: string }
  | { source: typeof BRIDGE_SOURCE; type: "log"; deviceId: string; level: LogLevel; message: string }

export function isBridgeMessage(data: unknown): data is BridgeMessage {
  return typeof data === "object" && data !== null && (data as { source?: unknown }).source === BRIDGE_SOURCE
}
