import { Appearance, PixelRatio } from "react-native"
import { getPreviewConfig, isInLab, setPreviewConfig, subscribe } from "./config"
import { BRIDGE_SOURCE, LAB_SOURCE, type LogLevel } from "./protocol"

const VERSION = "0.1.0"
const STYLE_ID = "devicelab-bridge"

type Post = (msg: { type: "hello"; version: string } | { type: "route"; path: string } | { type: "log"; level: LogLevel; message: string }) => void

let installed = false
let navigateHandler: ((path: string) => void) | null = null

export function setNavigateHandler(handler: ((path: string) => void) | null) {
  navigateHandler = handler
}

export function installRuntime() {
  if (installed || !isInLab) return
  installed = true

  const deviceId = () => getPreviewConfig()?.deviceId ?? new URLSearchParams(window.location.search).get("dl_device") ?? "unknown"
  const post: Post = (msg) => {
    try {
      window.parent.postMessage({ source: BRIDGE_SOURCE, deviceId: deviceId(), ...msg }, "*")
    } catch {}
  }

  patchAppearance()
  patchPixelRatio()
  forwardConsole(post)
  reportRoutes(post)

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent) return
    const data = event.data
    if (!data || data.source !== LAB_SOURCE) return
    if (data.type === "config" && data.config) setPreviewConfig(data.config)
    if (data.type === "navigate" && typeof data.path === "string" && data.path.startsWith("/")) navigate(data.path)
  })

  subscribe(applyDocument)
  applyDocument()
  post({ type: "hello", version: VERSION })
}

// useColorScheme() in react-native-web reads Appearance at call time, so patching the object is enough.
function patchAppearance() {
  const appearance = Appearance as unknown as {
    getColorScheme: () => "light" | "dark" | null
    addChangeListener: (l: (p: { colorScheme: "light" | "dark" }) => void) => { remove: () => void }
  }
  const original = appearance.getColorScheme.bind(appearance)
  const listeners = new Set<(p: { colorScheme: "light" | "dark" }) => void>()
  let last = getPreviewConfig()?.scheme

  appearance.getColorScheme = () => getPreviewConfig()?.scheme ?? original()
  appearance.addChangeListener = (listener) => {
    listeners.add(listener)
    return { remove: () => listeners.delete(listener) }
  }
  subscribe(() => {
    const scheme = getPreviewConfig()?.scheme
    if (!scheme || scheme === last) return
    last = scheme
    listeners.forEach((l) => l({ colorScheme: scheme }))
  })
}

function patchPixelRatio() {
  ;(PixelRatio as unknown as { getFontScale: () => number }).getFontScale = () => getPreviewConfig()?.fontScale ?? 1
}

function applyDocument() {
  const config = getPreviewConfig()
  if (!config) return
  const root = document.documentElement
  // Both classes: Tailwind/NativeWind `dark:` (class strategy) and Gluestack's `:root.light` override
  // of its prefers-color-scheme block, which would otherwise follow the OS inside the iframe.
  root.classList.toggle("dark", config.scheme === "dark")
  root.classList.toggle("light", config.scheme === "light")
  root.style.colorScheme = config.scheme
  root.dir = config.dir
  root.style.setProperty("--dl-font-scale", String(config.fontScale))
  root.style.setProperty("--dl-safe-top", `${config.insets.top}px`)
  root.style.setProperty("--dl-safe-right", `${config.insets.right}px`)
  root.style.setProperty("--dl-safe-bottom", `${config.insets.bottom}px`)
  root.style.setProperty("--dl-safe-left", `${config.insets.left}px`)

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style")
    style.id = STYLE_ID
    // Phones have no scrollbars. Top-level RN-web Text nodes carry a css-text-* class;
    // nested Text uses css-textHasAncestor-*, so zoom never compounds.
    style.textContent = `
      html, body, * { scrollbar-width: none; }
      *::-webkit-scrollbar { display: none; }
      [class*="css-text-"] { zoom: var(--dl-font-scale, 1); }
    `
    document.head.appendChild(style)
  }
}

function stringify(value: unknown) {
  if (value instanceof Error) {
    // Firefox stacks omit the message line; Chrome stacks start with it.
    const head = `${value.name}: ${value.message}`
    return value.stack?.startsWith(head) ? value.stack : value.stack ? `${head}\n${value.stack}` : head
  }
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function forwardConsole(post: Post) {
  for (const level of ["warn", "error"] as const) {
    const original = console[level].bind(console)
    console[level] = (...args: unknown[]) => {
      original(...args)
      post({ type: "log", level, message: args.map(stringify).join(" ").slice(0, 4000) })
    }
  }
  window.addEventListener("error", (e) => post({ type: "log", level: "error", message: stringify(e.error ?? e.message) }))
  window.addEventListener("unhandledrejection", (e) => post({ type: "log", level: "error", message: `Unhandled rejection: ${stringify(e.reason)}` }))
}

function currentPath() {
  const url = new URL(window.location.href)
  for (const key of [...url.searchParams.keys()]) if (key === "dl" || key.startsWith("dl_")) url.searchParams.delete(key)
  return url.pathname + url.search + url.hash
}

function reportRoutes(post: Post) {
  let last = ""
  const emit = () => {
    const path = currentPath()
    if (path === last) return
    last = path
    post({ type: "route", path })
  }
  for (const method of ["pushState", "replaceState"] as const) {
    const original = history[method].bind(history)
    history[method] = (...args: Parameters<History["pushState"]>) => {
      const result = original(...args)
      queueMicrotask(emit)
      return result
    }
  }
  window.addEventListener("popstate", emit)
  emit()
}

// Prefer the app's router (PreviewBridge onNavigate). Fallback: push the URL and let the
// router's popstate listener pick it up, which React Navigation / Expo Router do on web.
function navigate(path: string) {
  if (path === currentPath()) return
  if (navigateHandler) return navigateHandler(path)
  history.pushState(history.state, "", path)
  window.dispatchEvent(new PopStateEvent("popstate", { state: history.state }))
}
