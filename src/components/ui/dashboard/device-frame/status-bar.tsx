import { showsStatusBar, type DevicePose, type DeviceSpec } from "@/lib/devices"
import type { ColorScheme } from "@/lib/protocol"

function Signal() {
  return (
    <svg viewBox="0 0 18 12" className="h-[0.7em] w-auto" fill="currentColor" aria-hidden>
      <rect x="0" y="8" width="3" height="4" rx="1" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
      <rect x="10" y="3" width="3" height="9" rx="1" />
      <rect x="15" y="0" width="3" height="12" rx="1" />
    </svg>
  )
}

function Wifi() {
  return (
    <svg viewBox="0 0 16 12" className="h-[0.7em] w-auto" fill="currentColor" aria-hidden>
      <path d="M8 2.2c2.4 0 4.6.9 6.3 2.5l1.2-1.3A10.8 10.8 0 0 0 8 .4C5.2.4 2.5 1.5.5 3.4l1.2 1.3A9 9 0 0 1 8 2.2Z" />
      <path d="M8 5.6c1.5 0 2.9.6 4 1.6l1.2-1.3A7.6 7.6 0 0 0 8 3.8 7.6 7.6 0 0 0 2.8 5.9L4 7.2a5.9 5.9 0 0 1 4-1.6Z" />
      <path d="M8 9c.6 0 1.2.2 1.7.6L8 11.6 6.3 9.6C6.8 9.2 7.4 9 8 9Z" />
    </svg>
  )
}

function Battery() {
  return (
    <svg viewBox="0 0 27 12" className="h-[0.72em] w-auto" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="23" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.45" />
      <rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor" />
      <path d="M25 4v4c.8-.3 1.5-1.1 1.5-2S25.8 4.3 25 4Z" fill="currentColor" fillOpacity="0.45" />
    </svg>
  )
}

const IOS_FONT = { fontFamily: '-apple-system, "SF Pro Text", var(--font-geist-sans), system-ui, sans-serif' }
const ANDROID_FONT = { fontFamily: 'Roboto, "Google Sans Text", var(--font-geist-sans), system-ui, sans-serif' }

export function StatusBar({ spec, pose, scheme, insetTop }: { spec: DeviceSpec; pose: DevicePose; scheme: ColorScheme; insetTop: number }) {
  if (!showsStatusBar(spec, pose)) return null
  const color = scheme === "dark" ? "text-(--paper)" : "text-(--ink)"

  if (spec.os === "ios" && spec.kind === "phone") {
    const height = spec.cutout === "island" ? 54 : spec.cutout === "notch" ? 46 : 20
    const gap = spec.cutout === "island" ? 125 : spec.cutout === "notch" ? 162 : 0
    const small = spec.cutout === "none"
    return (
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center font-semibold ${color} ${small ? "text-xs" : "text-[17px]"}`}
        style={{ height, ...IOS_FONT }}
      >
        <span className={`flex justify-center ${small ? "" : "pl-4"}`}>{small ? "" : "9:41"}</span>
        <span style={{ width: gap }} className="text-center">{small ? "9:41" : ""}</span>
        <span className={`flex items-center justify-center gap-1.5 ${small ? "" : "pr-4"}`}>
          <Signal />
          <Wifi />
          <Battery />
        </span>
      </div>
    )
  }

  if (spec.os === "ios") {
    return (
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 z-10 flex h-6 items-center justify-between px-5 text-xs font-semibold ${color}`}
        style={IOS_FONT}
      >
        <span>
          9:41 <span className="pl-1">Thu Oct 16</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Wifi />
          <span>100%</span>
          <Battery />
        </span>
      </div>
    )
  }

  const compact = spec.kind === "flip" && pose.folded
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between font-medium ${color} ${compact ? "px-6 text-[11px]" : "px-5 text-[13px]"}`}
      style={{ height: Math.min(insetTop, 40), ...ANDROID_FONT }}
    >
      <span>9:41</span>
      <span className="flex items-center gap-1.5">
        <Wifi />
        <Signal />
        <Battery />
      </span>
    </div>
  )
}
