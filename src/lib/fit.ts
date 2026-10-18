import { DEFAULT_POSE, getDevice, getFootprint, type DevicePose } from "@/lib/devices"

const CAPTION = 80
const PAD_X = 96
const PAD_Y = 112

/** Largest zoom (1 = real size) at which the tallest and the widest selected device fit the canvas. */
export function fitZoom(selected: string[], poses: Record<string, DevicePose>, canvas: { width: number; height: number }, pxPerMm: number) {
  let maxW = 0
  let maxH = 0
  for (const id of selected) {
    const spec = getDevice(id)
    if (!spec) continue
    const foot = getFootprint(spec, poses[id] ?? DEFAULT_POSE)
    maxW = Math.max(maxW, foot.width * pxPerMm)
    maxH = Math.max(maxH, foot.height * pxPerMm)
  }
  if (!maxH) return 0.8
  const z = Math.min((canvas.height - PAD_Y - CAPTION) / maxH, (canvas.width - PAD_X) / maxW, MAX_ZOOM)
  return Math.max(MIN_ZOOM, Math.floor(z * 100) / 100)
}

export const MIN_ZOOM = 0.2
export const MAX_ZOOM = 1.5
