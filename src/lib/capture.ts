import { isNative, native, type Screenshot } from "@/lib/native"

// Cross-origin iframes cannot be drawn to a canvas. The desktop app has the webview snapshot itself
// and Rust crops and saves each shell. A plain browser falls back to the Screen Capture API and
// crops each device shell out of a single video frame.

type Region = { id: string; rect: DOMRect; radius: number }

function visibleRegions(): Region[] {
  return [...document.querySelectorAll<HTMLElement>("[data-device-shell]")]
    .map((el) => ({ id: el.dataset.deviceShell ?? "device", rect: el.getBoundingClientRect(), radius: Number(el.dataset.radius ?? 0) }))
    .filter(({ rect }) => rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth)
}

const paint = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 120))))

function fitsViewport(rect: DOMRect) {
  return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth
}

/**
 * Desktop only: saves one PNG per selected device to the app data folder and records it in SQLite.
 * WebKit snapshots the visible viewport, so every shell that fits on screen goes in one pass and
 * the rest are scrolled into view one at a time. The canvas scroll position is restored afterwards.
 */
export async function captureNative(): Promise<Screenshot[]> {
  const canvas = document.getElementById("lab-canvas")
  const scroll = canvas ? { top: canvas.scrollTop, left: canvas.scrollLeft } : null
  const pending = [...document.querySelectorAll<HTMLElement>("[data-device-shell]")]
  const saved: Screenshot[] = []

  try {
    while (pending.length) {
      let batch = pending.filter((el) => fitsViewport(el.getBoundingClientRect()))
      if (!batch.length) {
        // Larger than the viewport at this zoom: centre it and accept the visible part.
        pending[0].scrollIntoView({ block: "center", inline: "center" })
        await paint()
        batch = pending.filter((el) => fitsViewport(el.getBoundingClientRect()))
        if (!batch.length) batch = [pending[0]]
      }
      const regions = batch.map((el) => {
        const rect = el.getBoundingClientRect()
        return { deviceId: el.dataset.deviceShell ?? "device", x: rect.left, y: rect.top, width: rect.width, height: rect.height, radius: Number(el.dataset.radius ?? 0) }
      })
      saved.push(...(await native.screenshots.capture(regions, window.innerWidth)))
      for (const el of batch) pending.splice(pending.indexOf(el), 1)
    }
  } finally {
    if (canvas && scroll) canvas.scrollTo(scroll)
  }
  return saved
}

export const canCaptureNatively = isNative

function cropOffsets(video: HTMLVideoElement, surface: string | undefined) {
  const chromeX = (window.outerWidth - window.innerWidth) / 2
  const chromeTop = window.outerHeight - window.innerHeight - chromeX

  if (surface === "window") {
    const s = video.videoWidth / window.outerWidth
    return { s, ox: chromeX * s, oy: chromeTop * s }
  }
  if (surface === "monitor") {
    const s = video.videoWidth / window.screen.width
    return { s, ox: (window.screenX + chromeX) * s, oy: (window.screenY + chromeTop) * s }
  }
  // "browser" (a tab) maps 1:1 onto the viewport.
  return { s: video.videoWidth / window.innerWidth, ox: 0, oy: 0 }
}

function download(blob: Blob, name: string) {
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

export async function captureDevices(): Promise<number> {
  const regions = visibleRegions()

  if (!regions.length) return 0

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { displaySurface: "browser" },
    audio: false,
    preferCurrentTab: true,
    selfBrowserSurface: "include",
  } as DisplayMediaStreamOptions)

  try {
    const video = document.createElement("video")
    video.srcObject = stream
    video.muted = true
    await video.play()
    // Let the browser's share prompt disappear before grabbing the frame.
    await new Promise((r) => setTimeout(r, 400))

    const surface = stream.getVideoTracks()[0]?.getSettings().displaySurface
    const { s, ox, oy } = cropOffsets(video, surface)
    const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-")

    for (const { id, rect, radius } of regions) {
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(rect.width * s)
      canvas.height = Math.round(rect.height * s)
      const ctx = canvas.getContext("2d")
      if (!ctx) continue
      ctx.beginPath()
      ctx.roundRect(0, 0, canvas.width, canvas.height, radius * s)
      ctx.clip()
      ctx.drawImage(video, ox + rect.left * s, oy + rect.top * s, rect.width * s, rect.height * s, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"))
      if (blob) download(blob, `${id}-${stamp}.png`)
    }
    return regions.length
  } finally {
    stream.getTracks().forEach((t) => t.stop())
  }
}
