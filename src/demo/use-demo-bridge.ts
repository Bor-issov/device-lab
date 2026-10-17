import { useEffect, useRef, useSyncExternalStore } from "react"
import { navigate, usePathname } from "@/lib/router"
import { BRIDGE_SOURCE, LAB_SOURCE, WINDOW_NAME_PREFIX, type LogLevel, type PreviewConfig } from "@/lib/protocol"

// Minimal web-only twin of packages/preview-bridge so the demo app speaks the same protocol.

const FALLBACK: PreviewConfig = {
  labOrigin: "",
  deviceId: "browser",
  deviceName: "Browser",
  deviceKind: "phone",
  os: "ios",
  spoofPlatform: true,
  scheme: "dark",
  fontScale: 1,
  dir: "ltr",
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
  viewport: { width: 0, height: 0 },
  dpr: 1,
  folded: false,
  landscape: false,
}

let current: PreviewConfig | null = null
const listeners = new Set<() => void>()

function readWindowConfig(): PreviewConfig | null {
  try {
    if (window.name.startsWith(WINDOW_NAME_PREFIX)) return JSON.parse(window.name.slice(WINDOW_NAME_PREFIX.length))
  } catch {
    // Not JSON: treat as no config.
  }
  return null
}

const store = {
  get: () => (current ??= readWindowConfig() ?? FALLBACK),
  set: (next: PreviewConfig) => {
    current = next
    listeners.forEach((l) => l())
  },
  subscribe: (l: () => void) => {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}

export function useDemoBridge() {
  const config = useSyncExternalStore(store.subscribe, store.get, () => FALLBACK)
  const pathname = usePathname()
  const deviceId = useRef("browser")
  const embedded = useRef(false)

  const post = (msg: Record<string, unknown>) => {
    // The demo is served by the Lab itself, so the only valid parent is this same origin.
    if (embedded.current) window.parent.postMessage({ source: BRIDGE_SOURCE, deviceId: deviceId.current, ...msg }, window.location.origin)
  }

  useEffect(() => {
    embedded.current = window.parent !== window
    deviceId.current = readWindowConfig()?.deviceId ?? new URLSearchParams(window.location.search).get("dl_device") ?? "browser"

    function onMessage(e: MessageEvent) {
      if (e.source !== window.parent || e.origin !== window.location.origin || e.data?.source !== LAB_SOURCE) return
      if (e.data.type === "config") store.set(e.data.config)
      if (e.data.type === "navigate" && typeof e.data.path === "string" && /^\/demo(\/[\w-]*)?$/.test(e.data.path)) navigate(e.data.path)
    }
    window.addEventListener("message", onMessage)
    post({ type: "hello", version: "demo" })
    return () => window.removeEventListener("message", onMessage)
  }, [])

  useEffect(() => {
    post({ type: "route", path: pathname })
  }, [pathname])

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * config.fontScale}px`
    document.documentElement.dir = config.dir
  }, [config.fontScale, config.dir])

  const log = (level: LogLevel, message: string) => {
    console[level](message)
    post({ type: "log", level, message })
  }

  return { config, log }
}
