"use client"

import { useState } from "react"
import { Camera, Maximize, Plug, RefreshCw, RotateCw, ScrollText, Smartphone } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { IconButton, Segmented, Toggle } from "@/components/ui/dashboard/primitives/controls"
import { captureDevices } from "@/lib/capture"
import { fitZoom } from "@/lib/fit"
import { useLab, type PanelId } from "@/lib/store"

const FONT_SCALES = [
  { value: 0.85, label: "S" },
  { value: 1, label: "M" },
  { value: 1.15, label: "L" },
  { value: 1.3, label: "XL" },
]

export function Toolbar() {
  const s = useLab()
  const errors = s.logs.filter((l) => l.level === "error").length
  const [capturing, setCapturing] = useState(false)

  function fit() {
    const canvas = document.getElementById("lab-canvas")
    if (!canvas) return
    s.set("zoom", fitZoom(s.selected, s.poses, { width: canvas.clientWidth, height: canvas.clientHeight }))
  }

  async function capture() {
    setCapturing(true)
    try {
      await captureDevices()
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "NotAllowedError")) console.error(err)
    } finally {
      setCapturing(false)
    }
  }

  const panelButton = (id: PanelId, label: string, icon: React.ReactNode) => (
    <IconButton label={label} pressed={s.panel === id} onClick={() => s.togglePanel(id)}>
      {icon}
    </IconButton>
  )

  return (
    <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-5 gap-y-2 bg-surface px-5 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          label="Color scheme"
          value={s.scheme}
          onChange={(v) => s.set("scheme", v)}
          options={[
            { value: "dark", label: "Dark" },
            { value: "light", label: "Light" },
          ]}
        />
        <Segmented label="Text size" value={s.fontScale} onChange={(v) => s.set("fontScale", v)} options={FONT_SCALES} />
        <Segmented
          label="Layout direction"
          value={s.dir}
          onChange={(v) => s.set("dir", v)}
          options={[
            { value: "ltr", label: "LTR" },
            { value: "rtl", label: "RTL" },
          ]}
        />
        <Segmented
          label="Platform reported to app code"
          value={s.spoofPlatform ? "native" : "web"}
          onChange={(v) => s.set("spoofPlatform", v === "native")}
          options={[
            { value: "native", label: "iOS / Android", title: "Platform.OS matches each device (needs the bridge)" },
            { value: "web", label: "Web", title: "Platform.OS stays 'web'" },
          ]}
        />
      </div>

      <div className="flex items-center gap-1">
        <Toggle label="Chrome" pressed={s.showChrome} onChange={(v) => s.set("showChrome", v)} />
        <Toggle label="Hinge" pressed={s.showHinge} onChange={(v) => s.set("showHinge", v)} />
        <Toggle label="Sync nav" pressed={s.syncNav} onChange={(v) => s.set("syncNav", v)} />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <div className="mr-1 flex w-36 items-center gap-2.5">
          <Slider
            aria-label="Zoom"
            min={20}
            max={100}
            step={1}
            value={[Math.round(s.zoom * 100)]}
            onValueChange={(v) => s.set("zoom", (Array.isArray(v) ? v[0] : v) / 100)}
          />
          <span className="w-9 text-right font-mono text-xs text-muted-foreground tabular-nums">{Math.round(s.zoom * 100)}%</span>
        </div>
        <IconButton label="Fit to canvas" onClick={fit}>
          <Maximize />
        </IconButton>
        <IconButton label="Rotate all" onClick={s.rotateAll}>
          <RotateCw />
        </IconButton>
        <IconButton label="Reload all" onClick={s.reloadAll}>
          <RefreshCw />
        </IconButton>
        <IconButton label="Capture screenshots" onClick={capture} disabled={capturing}>
          <Camera />
        </IconButton>
        <span aria-hidden className="mx-1.5 h-4 w-px" />
        {panelButton("android", "Android emulator", <Smartphone />)}
        {panelButton(
          "logs",
          errors ? `Logs (${errors} errors)` : "Logs",
          <span className="relative">
            <ScrollText />
            {errors > 0 && <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-primary" />}
          </span>
        )}
        {panelButton("setup", "Bridge setup", <Plug />)}
      </div>
    </header>
  )
}
