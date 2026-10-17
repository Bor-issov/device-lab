// Device catalog. Sizes are CSS points / Android dp (what the app layout sees), portrait.
// Foldable dp values are derived from panel pixels / density and are close approximations.

export type DeviceOs = "ios" | "android"
export type DeviceGroup = "iPhone" | "iPad" | "Foldable" | "Android" | "Tablet" | "Custom"
export type DeviceKind = "phone" | "tablet" | "fold" | "flip"
export type Cutout = "island" | "notch" | "punch" | "none"

export type Insets = { top: number; right: number; bottom: number; left: number }

export type DeviceSpec = {
  id: string
  name: string
  group: DeviceGroup
  os: DeviceOs
  kind: DeviceKind
  size: [number, number]
  cover?: [number, number]
  dpr: number
  radius: number
  bezel: number
  chin?: number
  cutout: Cutout
  insets: { top: number; bottom: number }
}

export const DEVICES: DeviceSpec[] = [
  { id: "iphone-17-pro-max", name: "iPhone 17 Pro Max", group: "iPhone", os: "ios", kind: "phone", size: [440, 956], dpr: 3, radius: 62, bezel: 12, cutout: "island", insets: { top: 62, bottom: 34 } },
  { id: "iphone-17-pro", name: "iPhone 17 Pro", group: "iPhone", os: "ios", kind: "phone", size: [402, 874], dpr: 3, radius: 62, bezel: 12, cutout: "island", insets: { top: 62, bottom: 34 } },
  { id: "iphone-air", name: "iPhone Air", group: "iPhone", os: "ios", kind: "phone", size: [420, 912], dpr: 3, radius: 62, bezel: 10, cutout: "island", insets: { top: 62, bottom: 34 } },
  { id: "iphone-16e", name: "iPhone 16e", group: "iPhone", os: "ios", kind: "phone", size: [390, 844], dpr: 3, radius: 47, bezel: 13, cutout: "notch", insets: { top: 47, bottom: 34 } },
  { id: "iphone-13-mini", name: "iPhone 13 mini", group: "iPhone", os: "ios", kind: "phone", size: [375, 812], dpr: 3, radius: 44, bezel: 13, cutout: "notch", insets: { top: 50, bottom: 34 } },
  { id: "iphone-se", name: "iPhone SE", group: "iPhone", os: "ios", kind: "phone", size: [375, 667], dpr: 2, radius: 0, bezel: 14, chin: 64, cutout: "none", insets: { top: 20, bottom: 0 } },

  { id: "ipad-pro-13", name: "iPad Pro 13\"", group: "iPad", os: "ios", kind: "tablet", size: [1032, 1376], dpr: 2, radius: 18, bezel: 18, cutout: "none", insets: { top: 24, bottom: 20 } },
  { id: "ipad-pro-11", name: "iPad Pro 11\"", group: "iPad", os: "ios", kind: "tablet", size: [834, 1210], dpr: 2, radius: 18, bezel: 18, cutout: "none", insets: { top: 24, bottom: 20 } },
  { id: "ipad-air-11", name: "iPad Air 11\"", group: "iPad", os: "ios", kind: "tablet", size: [820, 1180], dpr: 2, radius: 18, bezel: 20, cutout: "none", insets: { top: 24, bottom: 20 } },
  { id: "ipad-mini", name: "iPad mini", group: "iPad", os: "ios", kind: "tablet", size: [744, 1133], dpr: 2, radius: 22, bezel: 20, cutout: "none", insets: { top: 24, bottom: 20 } },

  { id: "galaxy-z-fold-7", name: "Galaxy Z Fold 7", group: "Foldable", os: "android", kind: "fold", size: [750, 832], cover: [411, 960], dpr: 2.625, radius: 24, bezel: 9, cutout: "punch", insets: { top: 36, bottom: 24 } },
  { id: "galaxy-z-fold-6", name: "Galaxy Z Fold 6", group: "Foldable", os: "android", kind: "fold", size: [707, 823], cover: [369, 905], dpr: 2.625, radius: 22, bezel: 10, cutout: "punch", insets: { top: 36, bottom: 24 } },
  { id: "pixel-9-pro-fold", name: "Pixel 9 Pro Fold", group: "Foldable", os: "android", kind: "fold", size: [791, 820], cover: [411, 923], dpr: 2.625, radius: 26, bezel: 10, cutout: "punch", insets: { top: 40, bottom: 24 } },
  { id: "galaxy-z-flip-7", name: "Galaxy Z Flip 7", group: "Foldable", os: "android", kind: "flip", size: [411, 960], cover: [361, 399], dpr: 2.625, radius: 30, bezel: 10, cutout: "punch", insets: { top: 36, bottom: 24 } },

  { id: "pixel-10-pro-xl", name: "Pixel 10 Pro XL", group: "Android", os: "android", kind: "phone", size: [448, 998], dpr: 3, radius: 40, bezel: 11, cutout: "punch", insets: { top: 44, bottom: 24 } },
  { id: "pixel-10", name: "Pixel 10", group: "Android", os: "android", kind: "phone", size: [412, 923], dpr: 2.625, radius: 38, bezel: 11, cutout: "punch", insets: { top: 40, bottom: 24 } },
  { id: "galaxy-s25-ultra", name: "Galaxy S25 Ultra", group: "Android", os: "android", kind: "phone", size: [384, 832], dpr: 3.75, radius: 18, bezel: 10, cutout: "punch", insets: { top: 36, bottom: 24 } },
  { id: "galaxy-s25", name: "Galaxy S25", group: "Android", os: "android", kind: "phone", size: [360, 780], dpr: 3, radius: 34, bezel: 10, cutout: "punch", insets: { top: 36, bottom: 24 } },

  { id: "pixel-tablet", name: "Pixel Tablet", group: "Tablet", os: "android", kind: "tablet", size: [800, 1280], dpr: 2, radius: 18, bezel: 24, cutout: "none", insets: { top: 32, bottom: 24 } },
]

export const DEVICE_GROUPS: DeviceGroup[] = ["iPhone", "iPad", "Foldable", "Android", "Tablet"]

export const DEFAULT_SELECTION = ["iphone-17-pro", "ipad-pro-11", "galaxy-z-fold-7", "pixel-10"]

const byId = new Map(DEVICES.map((d) => [d.id, d]))

// User presets live in SQLite and are registered here once loaded, so every getDevice() caller
// (frames, fit, logs, config) sees them without knowing where they came from.
let custom: DeviceSpec[] = []

export function setCustomDevices(specs: DeviceSpec[]) {
  for (const d of custom) byId.delete(d.id)
  custom = specs
  for (const d of custom) byId.set(d.id, d)
}

export function getDevice(id: string) {
  return byId.get(id)
}

export type PresetInput = { name: string; os: DeviceOs; width: number; height: number }

// Sensible hardware defaults for a custom size: tablet past 600 on the short side,
// island on iOS phones, punch-hole on Android phones.
export function presetFromInput(input: PresetInput, id = `custom-${Date.now().toString(36)}`): DeviceSpec {
  const short = Math.min(input.width, input.height)
  const tablet = short >= 600
  const ios = input.os === "ios"
  return {
    id,
    name: input.name.trim(),
    group: "Custom",
    os: input.os,
    kind: tablet ? "tablet" : "phone",
    size: [short, Math.max(input.width, input.height)],
    dpr: ios ? (tablet ? 2 : 3) : tablet ? 2 : 2.625,
    radius: tablet ? 18 : ios ? 55 : 36,
    bezel: tablet ? 18 : 11,
    cutout: tablet ? "none" : ios ? "island" : "punch",
    insets: tablet ? { top: ios ? 24 : 32, bottom: ios ? 20 : 24 } : ios ? { top: 62, bottom: 34 } : { top: 40, bottom: 24 },
  }
}

export function isFoldable(spec: DeviceSpec) {
  return spec.kind === "fold" || spec.kind === "flip"
}

export type DevicePose = { landscape: boolean; folded: boolean }

export function getViewport(spec: DeviceSpec, pose: DevicePose) {
  const [w, h] = pose.folded && spec.cover ? spec.cover : spec.size
  return pose.landscape ? { width: h, height: w } : { width: w, height: h }
}

export function getInsets(spec: DeviceSpec, pose: DevicePose): Insets {
  const { top, bottom } = spec.insets
  if (!pose.landscape || spec.kind === "tablet") return { top, right: 0, bottom, left: 0 }
  if (spec.os === "ios") {
    // iOS phones hide the status bar in landscape; the sensor housing moves to the side.
    const side = spec.cutout === "none" ? 0 : top
    return { top: 0, right: side, bottom: spec.cutout === "none" ? 0 : 21, left: side }
  }
  return { top: 24, right: 0, bottom: bottom, left: spec.cutout === "punch" ? 36 : 0 }
}

// The hinge runs along the long axis of the unfolded inner panel.
export function getHinge(spec: DeviceSpec, pose: DevicePose): "vertical" | "horizontal" | null {
  if (!isFoldable(spec) || pose.folded) return null
  const portraitAxis = spec.kind === "flip" ? "horizontal" : "vertical"
  if (!pose.landscape) return portraitAxis
  return portraitAxis === "vertical" ? "horizontal" : "vertical"
}

export function showsStatusBar(spec: DeviceSpec, pose: DevicePose) {
  return !(pose.landscape && spec.os === "ios" && spec.kind === "phone")
}
