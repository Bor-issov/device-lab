// Device catalog: releases from the last two years. Sizes are CSS points / Android dp (what the app
// layout sees) in the device's natural orientation. Every panel also carries its diagonal and the
// outer body in millimetres, so the Lab can draw each device at its real-world size.

export type DeviceOs = "ios" | "android" | "macos"
export type DeviceGroup = "iPhone" | "iPad" | "Mac" | "Foldable" | "Android" | "Tablet" | "Custom"
export type DeviceKind = "phone" | "tablet" | "fold" | "flip" | "trifold" | "laptop" | "desktop"
export type Cutout = "island" | "notch" | "punch" | "none"
export type HingeAxis = "vertical" | "horizontal"

export type Insets = { top: number; right: number; bottom: number; left: number }

/** One screen a device can show. Foldables list the open panel first, then each folded state. */
export type Panel = {
  label: string
  size: [number, number]
  /** Diagonal of the visible panel in inches. */
  inches: number
  /** Outer body in millimetres, same orientation as `size`. */
  body: [number, number]
  /** Device pixel ratio when it differs from the device default (inner panels of some folds). */
  dpr?: number
  /** Hinge lines across this panel as fractions of its width (vertical) or height (horizontal). */
  hinge?: { axis: HingeAxis; at: readonly number[] }
}

export type DeviceSpec = {
  id: string
  name: string
  group: DeviceGroup
  os: DeviceOs
  kind: DeviceKind
  year: number
  panels: Panel[]
  dpr: number
  /** Screen corner radius in CSS px. */
  radius: number
  cutout: Cutout
  insets: { top: number; bottom: number }
}

const HALF = { axis: "vertical", at: [0.5] } as const
const THIRDS = { axis: "vertical", at: [1 / 3, 2 / 3] } as const
const FLIP = { axis: "horizontal", at: [0.5] } as const

const one = (size: [number, number], inches: number, body: [number, number]): Panel[] => [{ label: "Screen", size, inches, body }]

const IPHONE = { group: "iPhone", os: "ios", kind: "phone", dpr: 3, radius: 62, cutout: "island", insets: { top: 62, bottom: 34 } } as const
const IPAD = { group: "iPad", os: "ios", kind: "tablet", dpr: 2, radius: 18, cutout: "none", insets: { top: 24, bottom: 20 } } as const
const MAC = { group: "Mac", os: "macos", kind: "laptop", dpr: 2, radius: 10, cutout: "none", insets: { top: 0, bottom: 0 } } as const
const FOLD = { group: "Foldable", os: "android", kind: "fold", cutout: "punch", insets: { top: 36, bottom: 24 } } as const
const ANDROID = { group: "Android", os: "android", kind: "phone", cutout: "punch", insets: { top: 40, bottom: 24 } } as const
const TABLET = { group: "Tablet", os: "android", kind: "tablet", dpr: 2, radius: 18, cutout: "none", insets: { top: 32, bottom: 24 } } as const

export const DEVICES: DeviceSpec[] = [
  { ...IPHONE, id: "iphone-18-pro-max", name: "iPhone 18 Pro Max", year: 2026, panels: one([440, 956], 6.9, [78.0, 163.4]) },
  { ...IPHONE, id: "iphone-18-pro", name: "iPhone 18 Pro", year: 2026, panels: one([402, 874], 6.3, [71.9, 150.0]) },
  {
    ...IPHONE,
    id: "iphone-duo",
    name: "iPhone Duo",
    kind: "fold",
    year: 2026,
    radius: 40,
    cutout: "punch",
    insets: { top: 50, bottom: 20 },
    panels: [
      { label: "Open", size: [890, 626], inches: 7.6, body: [164.6, 117.8], hinge: HALF },
      { label: "Folded", size: [466, 678], inches: 5.4, body: [84.1, 117.8] },
    ],
  },
  { ...IPHONE, id: "iphone-air", name: "iPhone Air", year: 2025, panels: one([420, 912], 6.5, [74.7, 156.2]) },
  { ...IPHONE, id: "iphone-17", name: "iPhone 17", year: 2025, panels: one([402, 874], 6.3, [71.5, 149.6]) },
  { ...IPHONE, id: "iphone-17e", name: "iPhone 17e", year: 2026, radius: 47, cutout: "notch", insets: { top: 47, bottom: 34 }, panels: one([390, 844], 6.1, [71.5, 146.7]) },

  { ...IPAD, id: "ipad-pro-13", name: "iPad Pro 13\" M5", year: 2025, panels: one([1032, 1376], 13, [215.5, 281.6]) },
  { ...IPAD, id: "ipad-pro-11", name: "iPad Pro 11\" M5", year: 2025, panels: one([834, 1210], 11, [177.5, 249.7]) },
  { ...IPAD, id: "ipad-air-13", name: "iPad Air 13\" M4", year: 2026, panels: one([1024, 1366], 13, [214.9, 280.6]) },
  { ...IPAD, id: "ipad-air-11", name: "iPad Air 11\" M4", year: 2026, panels: one([820, 1180], 11, [178.5, 247.6]) },
  { ...IPAD, id: "ipad-a16", name: "iPad A16", year: 2025, panels: one([820, 1180], 10.9, [179.5, 248.6]) },
  { ...IPAD, id: "ipad-mini", name: "iPad mini A17 Pro", year: 2024, radius: 22, panels: one([744, 1133], 8.3, [134.8, 195.4]) },

  // Macs: the default "looks like" resolution, front view of the lid (or the iMac head).
  { ...MAC, id: "macbook-pro-16", name: "MacBook Pro 16\" M5 Pro", year: 2026, panels: one([1728, 1117], 16.2, [355.7, 237.5]) },
  { ...MAC, id: "macbook-pro-14", name: "MacBook Pro 14\" M5", year: 2025, panels: one([1512, 982], 14.2, [312.6, 211]) },
  { ...MAC, id: "macbook-air-15", name: "MacBook Air 15\" M5", year: 2026, panels: one([1710, 1112], 15.3, [340.4, 228]) },
  { ...MAC, id: "macbook-air-13", name: "MacBook Air 13\" M5", year: 2026, panels: one([1470, 956], 13.6, [304.1, 206]) },
  { ...MAC, id: "macbook-neo", name: "MacBook Neo", year: 2026, panels: one([1204, 753], 13, [297.5, 195]) },
  { ...MAC, id: "imac-24", name: "iMac 24\" M4", kind: "desktop", year: 2024, radius: 0, panels: one([2240, 1260], 23.5, [547, 357]) },

  {
    ...FOLD,
    id: "galaxy-z-trifold",
    name: "Galaxy Z TriFold",
    kind: "trifold",
    year: 2025,
    dpr: 2.625,
    radius: 20,
    panels: [
      { label: "Open", size: [1080, 792], inches: 10, body: [214.1, 159.2], dpr: 2, hinge: THIRDS },
      { label: "Folded", size: [411, 960], inches: 6.5, body: [75.0, 159.2] },
    ],
  },
  {
    ...FOLD,
    id: "galaxy-z-fold-8-ultra",
    name: "Galaxy Z Fold 8 Ultra",
    year: 2026,
    dpr: 2.625,
    radius: 24,
    panels: [
      { label: "Open", size: [752, 835], inches: 8, body: [143.2, 158.4], dpr: 3, hinge: HALF },
      { label: "Folded", size: [411, 960], inches: 6.5, body: [72.8, 158.4] },
    ],
  },
  {
    ...FOLD,
    id: "galaxy-z-fold-8",
    name: "Galaxy Z Fold 8",
    year: 2026,
    dpr: 2.625,
    radius: 24,
    panels: [
      { label: "Open", size: [933, 704], inches: 7.6, body: [161.4, 123.9], hinge: HALF },
      { label: "Folded", size: [475, 751], inches: 5.5, body: [81.9, 123.9] },
    ],
  },
  {
    ...FOLD,
    id: "galaxy-z-flip-8",
    name: "Galaxy Z Flip 8",
    kind: "flip",
    year: 2026,
    dpr: 2.625,
    radius: 30,
    panels: [
      { label: "Open", size: [411, 960], inches: 6.9, body: [75.4, 166.9], hinge: FLIP },
      { label: "Folded", size: [361, 399], inches: 4.1, body: [75.4, 85.7] },
    ],
  },
  {
    ...FOLD,
    id: "pixel-11-pro-fold",
    name: "Pixel 11 Pro Fold",
    year: 2026,
    dpr: 2.625,
    radius: 26,
    insets: { top: 40, bottom: 24 },
    panels: [
      { label: "Open", size: [791, 820], inches: 8, body: [150.4, 155.2], hinge: HALF },
      { label: "Folded", size: [411, 892], inches: 6.5, body: [76.0, 155.2] },
    ],
  },
  {
    ...FOLD,
    id: "huawei-mate-xts",
    name: "Huawei Mate XTs",
    kind: "trifold",
    year: 2025,
    dpr: 2.75,
    radius: 22,
    panels: [
      { label: "Triple", size: [1158, 812], inches: 10.2, body: [219.0, 156.7], hinge: THIRDS },
      { label: "Dual", size: [745, 812], inches: 7.9, body: [146.0, 156.7], hinge: HALF },
      { label: "Single", size: [367, 812], inches: 6.4, body: [73.5, 156.7] },
    ],
  },
  {
    ...FOLD,
    id: "huawei-mate-x7",
    name: "Huawei Mate X7",
    year: 2025,
    dpr: 2.75,
    radius: 26,
    panels: [
      { label: "Open", size: [804, 879], inches: 8, body: [144.2, 156.8], hinge: HALF },
      { label: "Folded", size: [393, 889], inches: 6.49, body: [73.8, 156.8] },
    ],
  },
  {
    ...FOLD,
    id: "xiaomi-mix-flip-2",
    name: "Xiaomi Mix Flip 2",
    kind: "flip",
    year: 2025,
    dpr: 3,
    radius: 30,
    panels: [
      { label: "Open", size: [408, 971], inches: 6.86, body: [73.8, 166.9], hinge: FLIP },
      { label: "Folded", size: [403, 464], inches: 4.01, body: [73.8, 86.1] },
    ],
  },

  { ...ANDROID, id: "pixel-11-pro-xl", name: "Pixel 11 Pro XL", year: 2026, dpr: 3, radius: 40, panels: one([448, 997], 6.8, [76.5, 162.7]) },
  { ...ANDROID, id: "pixel-11-pro", name: "Pixel 11 Pro", year: 2026, dpr: 3, radius: 38, panels: one([427, 952], 6.3, [71.9, 152.7]) },
  { ...ANDROID, id: "pixel-11", name: "Pixel 11", year: 2026, dpr: 2.625, radius: 38, panels: one([412, 923], 6.3, [72.0, 152.8]) },
  { ...ANDROID, id: "galaxy-s26-ultra", name: "Galaxy S26 Ultra", year: 2026, dpr: 3.75, radius: 18, insets: { top: 36, bottom: 24 }, panels: one([384, 832], 6.9, [78.1, 163.6]) },
  { ...ANDROID, id: "galaxy-s26", name: "Galaxy S26", year: 2026, dpr: 3, radius: 34, insets: { top: 36, bottom: 24 }, panels: one([360, 780], 6.3, [71.7, 149.6]) },
  { ...ANDROID, id: "xiaomi-17-ultra", name: "Xiaomi 17 Ultra", year: 2026, dpr: 2.75, radius: 34, panels: one([436, 948], 6.9, [77.6, 162.9]) },
  { ...ANDROID, id: "xiaomi-17", name: "Xiaomi 17", year: 2025, dpr: 3, radius: 34, panels: one([407, 885], 6.3, [70.2, 151.1]) },
  { ...ANDROID, id: "huawei-pura-80-ultra", name: "Huawei Pura 80 Ultra", year: 2025, dpr: 3.25, radius: 30, panels: one([393, 876], 6.8, [76.6, 163.0]) },

  { ...TABLET, id: "galaxy-tab-s11-ultra", name: "Galaxy Tab S11 Ultra", year: 2025, panels: one([924, 1480], 14.6, [208.5, 326.3]) },
  { ...TABLET, id: "galaxy-tab-s11", name: "Galaxy Tab S11", year: 2025, panels: one([800, 1280], 11, [165.8, 253.8]) },
  { ...TABLET, id: "xiaomi-pad-8-pro", name: "Xiaomi Pad 8 Pro", year: 2025, dpr: 2.5, panels: one([854, 1280], 11.2, [173.4, 251.2]) },
]

export const DEVICE_GROUPS: DeviceGroup[] = ["iPhone", "iPad", "Mac", "Foldable", "Android", "Tablet"]

export const DEFAULT_SELECTION = ["iphone-18-pro", "ipad-pro-11", "galaxy-z-fold-8-ultra", "pixel-11"]

/** Retired catalog ids and the current device that replaces each. */
export const REPLACED_IDS: Record<string, string> = {
  "iphone-17-pro-max": "iphone-18-pro-max",
  "iphone-17-pro": "iphone-18-pro",
  "iphone-16e": "iphone-17e",
  "iphone-13-mini": "iphone-17e",
  "iphone-se": "iphone-17e",
  "galaxy-z-fold-7": "galaxy-z-fold-8-ultra",
  "galaxy-z-fold-6": "galaxy-z-fold-8-ultra",
  "pixel-9-pro-fold": "pixel-11-pro-fold",
  "galaxy-z-flip-7": "galaxy-z-flip-8",
  "pixel-10-pro-xl": "pixel-11-pro-xl",
  "pixel-10": "pixel-11",
  "galaxy-s25-ultra": "galaxy-s26-ultra",
  "galaxy-s25": "galaxy-s26",
  "pixel-tablet": "galaxy-tab-s11",
}

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

/** Custom device as stored in SQLite. */
export type Preset = {
  id: string
  name: string
  os: "ios" | "android"
  kind: "phone" | "tablet"
  size: [number, number]
  dpr: number
  radius: number
  bezel: number
  cutout: Cutout
  insets: { top: number; bottom: number }
}

export type PresetInput = { name: string; os: Preset["os"]; width: number; height: number }

// Sensible hardware defaults for a custom size: tablet past 600 on the short side,
// island on iOS phones, punch-hole on Android phones.
export function presetFromInput(input: PresetInput, id = `custom-${Date.now().toString(36)}`): Preset {
  const short = Math.min(input.width, input.height)
  const tablet = short >= 600
  const ios = input.os === "ios"
  return {
    id,
    name: input.name.trim(),
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

// Presets have no physical data: assume the common phone density (0.16 mm per point) for the screen
// and draw the stored bezel around it.
const PRESET_MM_PER_PX = 0.16

export function specFromPreset(p: Preset): DeviceSpec {
  const [w, h] = p.size
  const mm = (n: number) => Math.round(n * PRESET_MM_PER_PX * 10) / 10
  const inches = (Math.hypot(w, h) * PRESET_MM_PER_PX) / 25.4
  return {
    id: p.id,
    name: p.name,
    group: "Custom",
    os: p.os,
    kind: p.kind,
    year: new Date().getFullYear(),
    panels: [{ label: "Screen", size: p.size, inches, body: [mm(w + p.bezel * 2), mm(h + p.bezel * 2)] }],
    dpr: p.dpr,
    radius: p.radius,
    cutout: p.cutout,
    insets: p.insets,
  }
}

/** `fold` indexes `panels`: 0 is fully open, higher folds further. */
export type DevicePose = { landscape: boolean; fold: number }

export const DEFAULT_POSE: DevicePose = { landscape: false, fold: 0 }

export function isFoldable(spec: DeviceSpec) {
  return spec.panels.length > 1
}

export function isComputer(spec: DeviceSpec) {
  return spec.kind === "laptop" || spec.kind === "desktop"
}

export function canRotate(spec: DeviceSpec) {
  return !isComputer(spec)
}

export function getPanel(spec: DeviceSpec, pose: DevicePose) {
  return spec.panels[Math.min(Math.max(pose.fold, 0), spec.panels.length - 1)]
}

export function isFolded(spec: DeviceSpec, pose: DevicePose) {
  return isFoldable(spec) && getPanel(spec, pose) !== spec.panels[0]
}

/** Next state of the fold button: folds one step further, and from fully folded opens again. */
export function nextFold(spec: DeviceSpec, pose: DevicePose) {
  const at = spec.panels.indexOf(getPanel(spec, pose))
  return at + 1 < spec.panels.length ? at + 1 : 0
}

export function getDpr(spec: DeviceSpec, pose: DevicePose) {
  return getPanel(spec, pose).dpr ?? spec.dpr
}

export function getViewport(spec: DeviceSpec, pose: DevicePose) {
  const [w, h] = getPanel(spec, pose).size
  return pose.landscape ? { width: h, height: w } : { width: w, height: h }
}

export const MM_PER_INCH = 25.4

export type Geometry = {
  /** Outer body in millimetres. */
  body: { width: number; height: number }
  /** Visible screen inside the body in millimetres. */
  screen: { x: number; y: number; width: number; height: number }
  /** Millimetres per CSS px of the page inside. */
  mmPerPx: number
}

// Real-world layout of the current pose. The screen sits centred in the body; laptops and the iMac
// keep the same bezel on top as on the sides and put the rest below (hinge area, chin).
export function getGeometry(spec: DeviceSpec, pose: DevicePose): Geometry {
  const panel = getPanel(spec, pose)
  const vp = getViewport(spec, pose)
  const mmPerPx = (panel.inches * MM_PER_INCH) / Math.hypot(vp.width, vp.height)
  const width = vp.width * mmPerPx
  const height = vp.height * mmPerPx
  const [bw, bh] = panel.body
  const raw = pose.landscape ? { width: bh, height: bw } : { width: bw, height: bh }
  // Never let a rounded spec put the screen outside its body.
  const body = { width: Math.max(raw.width, width + 2), height: Math.max(raw.height, height + 2) }
  const x = (body.width - width) / 2
  const y = isComputer(spec) ? x : (body.height - height) / 2
  return { body, screen: { x, y, width, height }, mmPerPx }
}

/** Outer size in millimetres including what hangs below a computer's screen (laptop base, iMac stand). */
export function getFootprint(spec: DeviceSpec, pose: DevicePose) {
  const { body } = getGeometry(spec, pose)
  if (spec.kind === "laptop") return { width: body.width + LAPTOP_BASE.overhang * 2, height: body.height + LAPTOP_BASE.height }
  if (spec.kind === "desktop") return { width: body.width, height: body.height + IMAC_STAND.height }
  return body
}

/** Laptop base seen from the front: a slab slightly wider than the lid. Millimetres. */
export const LAPTOP_BASE = { height: 7, overhang: 6, scoop: 0.16 }
/** iMac stand seen from the front, millimetres; `neck` is a fraction of the body width. */
export const IMAC_STAND = { height: 110, neck: 0.27, foot: 8 }

export function getInsets(spec: DeviceSpec, pose: DevicePose): Insets {
  const { top, bottom } = spec.insets
  if (!pose.landscape || spec.kind === "tablet" || (spec.os === "ios" && spec.kind !== "phone")) return { top, right: 0, bottom, left: 0 }
  if (spec.os === "ios") {
    // iOS phones hide the status bar in landscape; the sensor housing moves to the side.
    const side = spec.cutout === "none" ? 0 : top
    return { top: 0, right: side, bottom: spec.cutout === "none" ? 0 : 21, left: side }
  }
  return { top: 24, right: 0, bottom: bottom, left: spec.cutout === "punch" ? 36 : 0 }
}

// Hinge lines of the current panel in viewport terms. Landscape is the device turned
// counter-clockwise: a vertical line at x = f ends up horizontal at y = 1 - f, and a horizontal
// line at y = f ends up vertical at x = f.
export function getHinges(spec: DeviceSpec, pose: DevicePose): { axis: HingeAxis; at: number[] } | null {
  const hinge = getPanel(spec, pose).hinge
  if (!hinge) return null
  if (!pose.landscape) return { axis: hinge.axis, at: [...hinge.at] }
  return hinge.axis === "vertical" ? { axis: "horizontal", at: hinge.at.map((f) => 1 - f) } : { axis: "vertical", at: [...hinge.at] }
}

export function showsStatusBar(spec: DeviceSpec, pose: DevicePose) {
  return !isComputer(spec) && !(pose.landscape && spec.os === "ios" && spec.kind === "phone")
}

/** Default pose for anything persisted before fold states existed (`folded: boolean`). */
export function normalizePose(raw: unknown, spec?: DeviceSpec): DevicePose {
  const p = (raw ?? {}) as { landscape?: unknown; fold?: unknown; folded?: unknown }
  const landscape = p.landscape === true
  if (typeof p.fold === "number" && Number.isInteger(p.fold) && p.fold >= 0) return { landscape, fold: p.fold }
  return { landscape, fold: p.folded === true && spec ? spec.panels.length - 1 : 0 }
}
