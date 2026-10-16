import type { DevicePose, DeviceSpec } from "@/lib/devices"
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
  "iphone-se": [
    { side: "left", at: 0.17, len: 0.035 },
    { side: "left", at: 0.25, len: 0.07 },
    { side: "left", at: 0.34, len: 0.07 },
    { side: "right", at: 0.25, len: 0.08 },
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
  if (spec.os === "ios") return spec.kind === "tablet" ? KEYS.ipad : spec.chin ? KEYS["iphone-se"] : KEYS.iphone
  if (spec.kind === "tablet") return KEYS["android-tablet"]
  if (spec.kind === "fold" || spec.kind === "flip") return KEYS[spec.kind]
  return KEYS.android
}

const KEY_DEPTH = 3

// Landscape is the device turned counter-clockwise: left edge -> bottom, right -> top, top -> left.
export function SideKeys({ spec, pose, width, height }: { spec: DeviceSpec; pose: DevicePose; width: number; height: number }) {
  return keySet(spec).map((key, i) => {
    let style: React.CSSProperties
    if (!pose.landscape) {
      style =
        key.side === "top"
          ? { top: -KEY_DEPTH, left: key.at * width, width: key.len * width, height: KEY_DEPTH + 2 }
          : { [key.side]: -KEY_DEPTH, top: key.at * height, height: key.len * height, width: KEY_DEPTH + 2 }
    } else if (key.side === "left") {
      style = { bottom: -KEY_DEPTH, left: key.at * width, width: key.len * width, height: KEY_DEPTH + 2 }
    } else if (key.side === "right") {
      style = { top: -KEY_DEPTH, left: key.at * width, width: key.len * width, height: KEY_DEPTH + 2 }
    } else {
      style = { left: -KEY_DEPTH, top: (1 - key.at - key.len) * height, height: key.len * height, width: KEY_DEPTH + 2 }
    }
    return <span key={i} aria-hidden className="absolute rounded-sm bg-bezel-key" style={style} />
  })
}

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
    const size = spec.kind === "flip" && pose.folded ? 9 : 11
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

// Front camera that sits in the bezel (tablets): long edge on iPad, short edge on Android tablets.
export function BezelCamera({ spec, pose, bezel }: { spec: DeviceSpec; pose: DevicePose; bezel: number }) {
  if (spec.kind !== "tablet") return null
  const onTop = spec.os === "ios" ? pose.landscape : !pose.landscape
  const offset = bezel / 2 - 3
  return (
    <span
      aria-hidden
      className="absolute z-10 size-1.5 rounded-full bg-cutout"
      style={onTop ? { top: offset, left: "50%", translate: "-50% 0" } : { right: offset, top: "50%", translate: "0 -50%" }}
    />
  )
}

// iPhone SE style chin: earpiece above the screen, home button below (sides in landscape).
export function Chin({ spec, pose, width, height }: { spec: DeviceSpec; pose: DevicePose; width: number; height: number }) {
  if (!spec.chin) return null
  const chin = spec.chin + spec.bezel
  return (
    <>
      <span
        aria-hidden
        className="absolute rounded-full bg-bezel-key"
        style={pose.landscape ? { left: chin / 2 - 3, top: height / 2 - 23, width: 6, height: 46 } : { top: chin / 2 - 3, left: width / 2 - 23, width: 46, height: 6 }}
      />
      <span
        aria-hidden
        className="absolute size-11 rounded-full bg-bezel-key"
        style={pose.landscape ? { right: chin / 2 - 22, top: height / 2 - 22 } : { bottom: chin / 2 - 22, left: width / 2 - 22 }}
      />
    </>
  )
}

export function HomeIndicator({ spec, pose, scheme }: { spec: DeviceSpec; pose: DevicePose; scheme: ColorScheme }) {
  if (spec.chin) return null
  const color = scheme === "dark" ? "bg-(--paper)" : "bg-(--ink)"
  const width = spec.os === "android" ? 108 : spec.kind === "tablet" ? 200 : pose.landscape ? 210 : 134
  const thickness = spec.os === "android" ? 4 : 5
  return (
    <span
      aria-hidden
      className={`absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full ${color}`}
      style={{ width, height: thickness }}
    />
  )
}

export function Hinge({ axis }: { axis: "vertical" | "horizontal" }) {
  const band = axis === "vertical" ? "inset-y-0 left-1/2 w-4 -translate-x-1/2" : "inset-x-0 top-1/2 h-4 -translate-y-1/2"
  const line = axis === "vertical" ? "inset-y-0 left-1/2 w-px -translate-x-1/2" : "inset-x-0 top-1/2 h-px -translate-y-1/2"
  return (
    <>
      <span aria-hidden className={`pointer-events-none absolute z-10 bg-black/5 ${band}`} />
      <span aria-hidden className={`pointer-events-none absolute z-10 bg-black/15 ${line}`} />
    </>
  )
}
