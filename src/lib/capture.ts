"use client"

// Cross-origin iframes cannot be drawn to a canvas, so capture the screen through the
// Screen Capture API and crop each device shell out of a single video frame.

type Region = { id: string; rect: DOMRect; radius: number }

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
  const regions: Region[] = [...document.querySelectorAll<HTMLElement>("[data-device-shell]")]
    .map((el) => ({ id: el.dataset.deviceShell ?? "device", rect: el.getBoundingClientRect(), radius: Number(el.dataset.radius ?? 0) }))
    .filter(({ rect }) => rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth)

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
