import { getDevice, getViewport, type DevicePose } from "@/lib/devices"

const CAPTION = 80
const PAD_X = 96
const PAD_Y = 112

// Largest zoom at which the tallest (and widest) selected device fits the canvas.
export function fitZoom(selected: string[], poses: Record<string, DevicePose>, canvas: { width: number; height: number }) {
  let maxW = 0
  let maxH = 0
  for (const id of selected) {
    const spec = getDevice(id)
    if (!spec) continue
    const pose = poses[id] ?? { landscape: false, folded: false }
    const vp = getViewport(spec, pose)
    const chin = (spec.chin ?? 0) * 2
    maxW = Math.max(maxW, vp.width + spec.bezel * 2 + (pose.landscape ? chin : 0))
    maxH = Math.max(maxH, vp.height + spec.bezel * 2 + (pose.landscape ? 0 : chin))
  }
  if (!maxH) return 0.55
  const z = Math.min((canvas.height - PAD_Y - CAPTION) / maxH, (canvas.width - PAD_X) / maxW, 1)
  return Math.max(0.2, Math.floor(z * 100) / 100)
}
