import { WINDOW_NAME_PREFIX, type PreviewConfig } from "./protocol"

// The Lab writes the device config into the iframe's name. window.name survives in-app
// navigation and full reloads, and each frame has its own, so it is the earliest reliable source.

const hasDom = typeof window !== "undefined" && typeof window.location !== "undefined" && typeof document !== "undefined"

function readWindowName(): PreviewConfig | null {
  if (!hasDom) return null
  try {
    if (typeof window.name === "string" && window.name.startsWith(WINDOW_NAME_PREFIX)) {
      return JSON.parse(window.name.slice(WINDOW_NAME_PREFIX.length)) as PreviewConfig
    }
  } catch {}
  return null
}

let current: PreviewConfig | null = readWindowName()
const listeners = new Set<() => void>()

export const isInLab =
  hasDom && window.parent !== window && (current !== null || new URLSearchParams(window.location.search).get("dl") === "1")

export function getPreviewConfig() {
  return current
}

export function setPreviewConfig(next: PreviewConfig) {
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
