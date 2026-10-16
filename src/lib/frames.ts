"use client"

import type { LabMessage } from "@/lib/protocol"

// Live iframe registry. Messages from frames are attributed by window identity and origin, never by claimed id.
const frames = new Map<string, HTMLIFrameElement>()

export function registerFrame(id: string, el: HTMLIFrameElement | null) {
  if (el) frames.set(id, el)
  else frames.delete(id)
}

function originOf(el: HTMLIFrameElement) {
  try {
    return new URL(el.src).origin
  } catch {
    return null
  }
}

// Target the frame's own origin so config never goes to a page the frame navigated away to.
export function postToFrame(id: string, message: LabMessage) {
  const el = frames.get(id)
  const origin = el && originOf(el)
  if (origin && origin !== "null") el.contentWindow?.postMessage(message, origin)
}

export function deviceIdForMessage(event: MessageEvent) {
  if (!event.source) return null
  for (const [id, el] of frames) {
    if (el.contentWindow === event.source && originOf(el) === event.origin) return id
  }
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
