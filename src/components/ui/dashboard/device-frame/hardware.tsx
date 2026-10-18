import { IMAC_STAND, isComputer, isFolded, LAPTOP_BASE, type DevicePose, type DeviceSpec, type HingeAxis } from "@/lib/devices"
import type { ColorScheme } from "@/lib/protocol"

type Side = "left" | "right" | "top"
type Key = { side: Side; at: number; len: number }

// Physical buttons in portrait coordinates: `at` and `len` are fractions of the edge length.
const KEYS: Record<string, Key[]> = {
  iphone: [
    { side: "left", at: 0.2, len: 0.04 },
    { side: "left", at: 0.27, len: 0.075 },
    { side: "left", at: 0.36, len: 0.075 },
    { side: "right", at: 0.3, len: 0.11 },
  ],
  ipad: [
    { side: "top", at: 0.84, len: 0.07 },
    { side: "right", at: 0.07, len: 0.05 },
    { side: "right", at: 0.13, len: 0.05 },
  ],
  android: [
    { side: "right", at: 0.22, len: 0.1 },
    { side: "right", at: 0.36, len: 0.06 },
  ],
  fold: [
    { side: "right", at: 0.28, len: 0.08 },
    { side: "right", at: 0.4, len: 0.07 },
  ],
  flip: [
    { side: "right", at: 0.55, len: 0.06 },
    { side: "right", at: 0.63, len: 0.05 },
  ],
  "android-tablet": [
    { side: "top", at: 0.12, len: 0.06 },
    { side: "top", at: 0.2, len: 0.08 },
  ],
}

function keySet(spec: DeviceSpec) {
  if (isComputer(spec)) return []
  if (spec.os === "ios") return spec.kind === "tablet" ? KEYS.ipad : spec.kind === "fold" ? KEYS.fold : KEYS.iphone
  if (spec.kind === "tablet") return KEYS["android-tablet"]
  if (spec.kind === "flip") return KEYS.flip
  if (spec.kind === "fold" || spec.kind === "trifold") return KEYS.fold
  return KEYS.android
}

// Keys stand 0.8 mm proud of the frame.
const KEY_DEPTH_MM = 0.8

// Landscape is the device turned counter-clockwise: left edge -> bottom, right -> top, top -> left.
export function SideKeys({ spec, pose, width, height, pxPerMm }: { spec: DeviceSpec; pose: DevicePose; width: number; height: number; pxPerMm: number }) {
  const depth = Math.max(1.5, KEY_DEPTH_MM * pxPerMm)
  const thick = depth + 2
  return keySet(spec).map((key, i) => {
    let style: React.CSSProperties
    if (!pose.landscape) {
      style =
        key.side === "top"
          ? { top: -depth, left: key.at * width, width: key.len * width, height: thick }
          : { [key.side]: -depth, top: key.at * height, height: key.len * height, width: thick }
    } else if (key.side === "left") {
      style = { bottom: -depth, left: key.at * width, width: key.len * width, height: thick }
    } else if (key.side === "right") {
      style = { top: -depth, left: key.at * width, width: key.len * width, height: thick }
    } else {
      style = { left: -depth, top: (1 - key.at - key.len) * height, height: key.len * height, width: thick }
    }
    return <span key={i} aria-hidden className="absolute rounded-sm bg-bezel-key" style={style} />
  })
}

// Drawn in page CSS px (inside the scaled screen layer).
export function Cutout({ spec, pose }: { spec: DeviceSpec; pose: DevicePose }) {
  const side = pose.landscape
  if (spec.cutout === "island") {
    return (
      <span
        aria-hidden
        className="absolute z-20 rounded-full bg-cutout"
        style={side ? { left: 11, top: "50%", width: 37, height: 125, translate: "0 -50%" } : { top: 11, left: "50%", width: 125, height: 37, translate: "-50% 0" }}
      />
    )
  }
  if (spec.cutout === "notch") {
    return (
      <span
        aria-hidden
        className="absolute z-20 bg-cutout"
        style={
          side
            ? { left: 0, top: "50%", width: 32, height: 162, translate: "0 -50%", borderRadius: "0 20px 20px 0" }
            : { top: 0, left: "50%", width: 162, height: 32, translate: "-50% 0", borderRadius: "0 0 20px 20px" }
        }
      />
    )
  }
  if (spec.cutout === "punch") {
    const size = spec.kind === "flip" && isFolded(spec, pose) ? 9 : 11
    return (
      <span
        aria-hidden
        className="absolute z-20 rounded-full bg-cutout"
        style={side ? { left: 12, top: "50%", width: size, height: size, translate: "0 -50%" } : { top: 12, left: "50%", width: size, height: size, translate: "-50% 0" }}
      />
    )
  }
  return null
}

// Front camera that sits in the bezel: long edge on iPad, short edge on Android tablets, top of the
// lid on Macs. `x` / `y` are the bezel widths in px; the camera sits in the middle of its bezel.
export function BezelCamera({ spec, pose, x, y, pxPerMm }: { spec: DeviceSpec; pose: DevicePose; x: number; y: number; pxPerMm: number }) {
  if (spec.kind !== "tablet" && !isComputer(spec)) return null
  const onTop = isComputer(spec) || (spec.os === "ios" ? pose.landscape : !pose.landscape)
  const size = Math.max(3, 1.6 * pxPerMm)
  return (
    <span
      aria-hidden
      className="absolute z-10 rounded-full bg-cutout"
      style={{
        width: size,
        height: size,
        ...(onTop ? { top: y / 2, left: "50%", translate: "-50% -50%" } : { right: x / 2, top: "50%", translate: "50% -50%" }),
      }}
    />
  )
}

export function HomeIndicator({ spec, pose, scheme }: { spec: DeviceSpec; pose: DevicePose; scheme: ColorScheme }) {
  if (isComputer(spec)) return null
  const color = scheme === "dark" ? "bg-(--paper)" : "bg-(--ink)"
  const width = spec.os === "android" ? 108 : spec.kind !== "phone" ? 200 : pose.landscape ? 210 : 134
  const thickness = spec.os === "android" ? 4 : 5
  return (
    <span
      aria-hidden
      className={`absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full ${color}`}
      style={{ width, height: thickness }}
    />
  )
}

export function Hinges({ axis, at }: { axis: HingeAxis; at: number[] }) {
  const vertical = axis === "vertical"
  return at.map((f) => (
    <span key={f} aria-hidden className="pointer-events-none absolute z-10" style={vertical ? { top: 0, bottom: 0, left: `${f * 100}%` } : { left: 0, right: 0, top: `${f * 100}%` }}>
      <span className={`absolute bg-black/5 ${vertical ? "inset-y-0 w-4 -translate-x-1/2" : "inset-x-0 h-4 -translate-y-1/2"}`} />
      <span className={`absolute bg-black/15 ${vertical ? "inset-y-0 w-px -translate-x-1/2" : "inset-x-0 h-px -translate-y-1/2"}`} />
    </span>
  ))
}

/** Laptop base seen from the front, under a lid `width` px wide. */
export function LaptopBase({ width, top, pxPerMm }: { width: number; top: number; pxPerMm: number }) {
  const height = LAPTOP_BASE.height * pxPerMm
  const overhang = LAPTOP_BASE.overhang * pxPerMm
  const scoop = width * LAPTOP_BASE.scoop
  return (
    <div aria-hidden className="absolute left-0 bg-bezel-key" style={{ top, width: width + overhang * 2, height, borderRadius: `0 0 ${height * 1.2}px ${height * 1.2}px` }}>
      <span className="absolute top-0 left-1/2 -translate-x-1/2 bg-bezel" style={{ width: scoop, height: height * 0.35, borderRadius: `0 0 ${height}px ${height}px` }} />
    </div>
  )
}

/** iMac stand seen from the front, centred under a head `width` px wide. */
export function ImacStand({ width, top, pxPerMm }: { width: number; top: number; pxPerMm: number }) {
  const neck = width * IMAC_STAND.neck
  const height = IMAC_STAND.height * pxPerMm
  const foot = IMAC_STAND.foot * pxPerMm
  return (
    <div aria-hidden className="absolute left-1/2 -translate-x-1/2" style={{ top, width: neck, height }}>
      <span className="absolute inset-x-0 top-0 bg-bezel-key" style={{ bottom: foot }} />
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-sm bg-bezel-key" style={{ width: neck * 1.04, height: foot }} />
    </div>
  )
}
