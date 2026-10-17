import { emitTo } from "@tauri-apps/api/event"
import { getDevice, getShellSize, type DevicePose, type DeviceSpec } from "@/lib/devices"
import { native } from "@/lib/native"
import type { BridgeMessage, ColorScheme, LabMessage, TextDirection } from "@/lib/protocol"
import { useLab, type DeviceRuntime } from "@/lib/store"

// Frames moved outside the Lab. Wire format between the main window and each external window
// (label `external-<device id>`, page /external/<device id>):
//   Lab -> external   external:state, external:post (a message for the frame's iframe)
//   external -> Lab   external:ready, external:action, external:bridge (a message from the iframe)
//   Rust -> Lab       external:menu (right click position), external:action (Bring back), external:closed

export type ExternalAction = "rotate" | "fold" | "reload" | "dock" | "close"

export type ExternalState = {
  id: string
  sourceUrl: string
  scheme: ColorScheme
  fontScale: number
  dir: TextDirection
  spoofPlatform: boolean
  showChrome: boolean
  showHinge: boolean
  pose: DevicePose | undefined
  nonce: number
  runtime: DeviceRuntime | undefined
  customDevices: DeviceSpec[]
}

export type ExternalPost = { id: string; message: LabMessage }
export type ExternalBridge = { id: string; message: BridgeMessage }

export const externalLabel = (id: string) => `external-${id}`

const BAR = 40
const GAP = 10
const PAD = 8
const MIN_WIDTH = 280

// Real size (zoom 1) unless the device is taller or wider than the screen.
export function externalLayout(spec: DeviceSpec, pose: DevicePose) {
  const shell = getShellSize(spec, pose)
  const fit = Math.min(1, (window.screen.availHeight - 160) / shell.height, (window.screen.availWidth - 120) / shell.width)
  const zoom = Math.max(0.2, Math.floor(fit * 100) / 100)
  return {
    zoom,
    width: Math.ceil(Math.max(shell.width * zoom, MIN_WIDTH) + PAD * 2),
    height: Math.ceil(shell.height * zoom + BAR + GAP + PAD * 2),
  }
}

export async function moveOutside(id: string) {
  const spec = getDevice(id)
  const lab = useLab.getState()
  if (!spec || !lab.selected.includes(id)) return
  const { width, height } = externalLayout(spec, lab.poses[id] ?? { landscape: false, folded: false })
  lab.setExternal(id, true)
  try {
    await native.external.open(id, spec.name, width, height)
  } catch (err) {
    console.error("external_open", err)
    useLab.getState().setExternal(id, false)
  }
}

export function bringBack(id: string) {
  useLab.getState().setExternal(id, false)
  native.external.close(id).catch((err) => console.error("external_close", err))
}

export function sendExternal(id: string, message: LabMessage) {
  void emitTo(externalLabel(id), "external:post", { id, message } satisfies ExternalPost)
}
