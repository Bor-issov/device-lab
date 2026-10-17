import { useEffect, useRef, useState } from "react"
import type { AndroidInput } from "@/lib/android/types"
import { native } from "@/lib/native"

// Rust streams adb screencap frames over a Tauri channel as fast as the device returns them.
// Click to tap, drag to swipe.
export function LiveScreen({ serial, onInput }: { serial: string; onInput: (input: AndroidInput) => void }) {
  const [src, setSrc] = useState<string | null>(null)
  const [fps, setFps] = useState(0)
  const imgRef = useRef<HTMLImageElement>(null)
  const start = useRef<{ x: number; y: number; t: number } | null>(null)

  useEffect(() => {
    let alive = true
    let current: string | null = null
    let frames = 0
    let windowStart = performance.now()

    const stop = native.android.stream(serial, (png) => {
      if (!alive) return
      const next = URL.createObjectURL(new Blob([png], { type: "image/png" }))
      setSrc(next)
      if (current) URL.revokeObjectURL(current)
      current = next
      frames++
      const now = performance.now()
      if (now - windowStart > 1000) {
        setFps(Math.round((frames * 1000) / (now - windowStart)))
        frames = 0
        windowStart = now
      }
    })

    return () => {
      alive = false
      stop.then((fn) => fn()).catch(() => {})
      if (current) URL.revokeObjectURL(current)
    }
  }, [serial])

  function toDevice(clientX: number, clientY: number) {
    const img = imgRef.current
    if (!img) return null
    const rect = img.getBoundingClientRect()
    return {
      x: ((clientX - rect.left) / rect.width) * img.naturalWidth,
      y: ((clientY - rect.top) / rect.height) * img.naturalHeight,
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex min-h-64 w-full items-center justify-center rounded-xl bg-background/70 p-3">
        {src ? (
          <img
            ref={imgRef}
            src={src}
            alt="Android screen"
            draggable={false}
            className="max-h-[560px] w-auto cursor-pointer rounded-lg select-none"
            onPointerDown={(e) => {
              const p = toDevice(e.clientX, e.clientY)
              if (p) start.current = { ...p, t: performance.now() }
            }}
            onPointerUp={(e) => {
              const from = start.current
              const to = toDevice(e.clientX, e.clientY)
              start.current = null
              if (!from || !to) return
              const dist = Math.hypot(to.x - from.x, to.y - from.y)
              if (dist < 12) onInput({ action: "tap", x: to.x, y: to.y })
              else {
                const duration = Math.min(800, Math.max(120, performance.now() - from.t))
                onInput({ action: "swipe", x: from.x, y: from.y, x2: to.x, y2: to.y, duration })
              }
            }}
          />
        ) : (
          <span className="text-sm text-muted-foreground">Waiting for the first frame</span>
        )}
      </div>
      <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{fps} fps via adb screencap</span>
    </div>
  )
}
