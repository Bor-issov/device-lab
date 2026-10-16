"use client"

import type { LabMessage } from "@/lib/protocol"

// Live iframe registry. Messages from frames are attributed by window identity, never by claimed id.
const frames = new Map<string, HTMLIFrameElement>()

export function registerFrame(id: string, el: HTMLIFrameElement | null) {
  if (el) frames.set(id, el)
  else frames.delete(id)
}

export function postToFrame(id: string, message: LabMessage) {
  frames.get(id)?.contentWindow?.postMessage(message, "*")
}

export function deviceIdForSource(source: MessageEventSource | null) {
  if (!source) return null
  for (const [id, el] of frames) if (el.contentWindow === source) return id
  return null
}

export function frameIds() {
  return [...frames.keys()]
}

export function buildFrameUrl(sourceUrl: string, deviceId: string) {
  try {
    const url = new URL(sourceUrl)
    url.searchParams.set("dl", "1")
    url.searchParams.set("dl_device", deviceId)
    return url.toString()
  } catch {
    return "about:blank"
  }
}
