import { useEffect } from "react"
import { buildConfig, useLab } from "@/lib/store"
import { deviceIdForMessage, frameIds, postToFrame } from "@/lib/frames"
import { sendExternal } from "@/lib/external"
import { LAB_SOURCE, isBridgeMessage, type BridgeMessage, type LabMessage } from "@/lib/protocol"

let lastSynced: string | null = null
// Frames that just said hello. Their first route is where they booted, not a user navigation,
// so with sync on they are sent to the shared route instead of dragging every frame back.
const fresh = new Set<string>()

// Frames moved outside live in another window; their messages travel over Tauri events.
function send(id: string, message: LabMessage) {
  if (useLab.getState().external.includes(id)) sendExternal(id, message)
  else postToFrame(id, message)
}

// Handshake, route reports, console forwarding, nav sync. `id` is already attributed to a frame.
export function handleBridgeMessage(id: string, msg: BridgeMessage) {
  const lab = useLab.getState()

  if (msg.type === "hello") {
    fresh.add(id)
    lab.markConnected(id)
    const config = buildConfig(id, lab)
    if (config) send(id, { source: LAB_SOURCE, type: "config", config })
    return
  }

  if (msg.type === "route") {
    lab.setRoute(id, msg.path)
    const booting = fresh.delete(id)
    if (booting && lab.syncNav && lastSynced && msg.path !== lastSynced) {
      send(id, { source: LAB_SOURCE, type: "navigate", path: lastSynced })
      return
    }
    if (!lab.syncNav || msg.path === lastSynced) return
    lastSynced = msg.path
    for (const other of [...frameIds(), ...lab.external]) {
      if (other !== id && useLab.getState().runtime[other]?.route !== msg.path) {
        send(other, { source: LAB_SOURCE, type: "navigate", path: msg.path })
      }
    }
    return
  }

  if (msg.type === "log") {
    lab.pushLog({ deviceId: id, level: msg.level, message: String(msg.message).slice(0, 4000) })
  }
}

// Single window listener for every frame in the Lab window.
export function useBridgeMessages() {
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!isBridgeMessage(event.data)) return
      const id = deviceIdForMessage(event)
      if (id) handleBridgeMessage(id, event.data)
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])
}
