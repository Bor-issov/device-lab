import { WINDOW_NAME_PREFIX, type PreviewConfig } from "./protocol"

// The Lab writes the device config into the iframe's name. window.name survives in-app
// navigation and full reloads, and each frame has its own, so it is the earliest reliable source.
//
// Trust boundary: whoever embeds the app controls window.name and postMessage, so the bridge only
// activates in development builds and only for a Lab served from a loopback origin. Every config
// is validated field by field before use. Accepted Lab origins: loopback http(s) (browser and
// `tauri dev`) and the Device Lab desktop app's own origins (tauri://localhost on Linux/macOS,
// http(s)://tauri.localhost on Windows). None of these can be claimed by a remote website.

declare const __DEV__: boolean | undefined

const isDev =
  typeof __DEV__ !== "undefined" ? Boolean(__DEV__) : typeof process !== "undefined" && process.env?.NODE_ENV !== "production"

const hasDom = typeof window !== "undefined" && typeof window.location !== "undefined" && typeof document !== "undefined"

const LOOPBACK_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d{1,5})?$/
const DESKTOP_ORIGINS = new Set(["tauri://localhost", "http://tauri.localhost", "https://tauri.localhost"])

const num = (v: unknown, min: number, max: number) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max
const oneOf = <T extends string>(v: unknown, values: readonly T[]): v is T => typeof v === "string" && (values as readonly string[]).includes(v)

export function isLoopbackOrigin(origin: unknown): origin is string {
  return typeof origin === "string" && (LOOPBACK_ORIGIN.test(origin) || DESKTOP_ORIGINS.has(origin))
}

export function parseConfig(raw: unknown): PreviewConfig | null {
  if (!raw || typeof raw !== "object") return null
  const c = raw as Record<string, unknown>
  const insets = c.insets as Record<string, unknown> | undefined
  const viewport = c.viewport as Record<string, unknown> | undefined
  const valid =
    isLoopbackOrigin(c.labOrigin) &&
    typeof c.deviceId === "string" &&
    /^[\w-]{1,64}$/.test(c.deviceId) &&
    typeof c.deviceName === "string" &&
    c.deviceName.length <= 64 &&
    oneOf(c.deviceKind, ["phone", "tablet", "fold", "flip"] as const) &&
    oneOf(c.os, ["ios", "android"] as const) &&
    typeof c.spoofPlatform === "boolean" &&
    oneOf(c.scheme, ["dark", "light"] as const) &&
    oneOf(c.dir, ["ltr", "rtl"] as const) &&
    num(c.fontScale, 0.5, 3) &&
    num(c.dpr, 0.5, 5) &&
    typeof c.folded === "boolean" &&
    typeof c.landscape === "boolean" &&
    !!insets &&
    ["top", "right", "bottom", "left"].every((k) => num(insets[k], 0, 300)) &&
    !!viewport &&
    num(viewport.width, 0, 5000) &&
    num(viewport.height, 0, 5000)
  if (!valid) return null
  return {
    labOrigin: c.labOrigin as string,
    deviceId: c.deviceId as string,
    deviceName: c.deviceName as string,
    deviceKind: c.deviceKind as PreviewConfig["deviceKind"],
    os: c.os as PreviewConfig["os"],
    spoofPlatform: c.spoofPlatform as boolean,
    scheme: c.scheme as PreviewConfig["scheme"],
    fontScale: c.fontScale as number,
    dir: c.dir as PreviewConfig["dir"],
    insets: { top: insets!.top as number, right: insets!.right as number, bottom: insets!.bottom as number, left: insets!.left as number },
    viewport: { width: viewport!.width as number, height: viewport!.height as number },
    dpr: c.dpr as number,
    folded: c.folded as boolean,
    landscape: c.landscape as boolean,
  }
}

function readWindowName(): PreviewConfig | null {
  if (!hasDom || !isDev || window.parent === window) return null
  try {
    if (typeof window.name === "string" && window.name.startsWith(WINDOW_NAME_PREFIX)) {
      return parseConfig(JSON.parse(window.name.slice(WINDOW_NAME_PREFIX.length)))
    }
  } catch {}
  return null
}

let current: PreviewConfig | null = readWindowName()
const listeners = new Set<() => void>()

/** The only origin the bridge sends to or accepts from. Fixed for the lifetime of the page. */
export const labOrigin: string | null = current?.labOrigin ?? null

export const isInLab = labOrigin !== null

export function getPreviewConfig() {
  return current
}

export function setPreviewConfig(raw: unknown) {
  const next = parseConfig(raw)
  if (!next || next.labOrigin !== labOrigin) return
  current = next
  try {
    window.name = WINDOW_NAME_PREFIX + JSON.stringify(next)
  } catch {}
  listeners.forEach((l) => l())
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
