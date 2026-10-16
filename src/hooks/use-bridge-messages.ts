"use client"

import { useEffect } from "react"
import { buildConfig, useLab } from "@/lib/store"
import { deviceIdForMessage, frameIds, postToFrame } from "@/lib/frames"
import { LAB_SOURCE, isBridgeMessage } from "@/lib/protocol"

// Single window listener for every frame: handshake, route reports, console forwarding, nav sync.
export function useBridgeMessages() {
  useEffect(() => {
    let lastSynced: string | null = null

    function onMessage(event: MessageEvent) {
      if (!isBridgeMessage(event.data)) return
      const id = deviceIdForMessage(event)
      if (!id) return
      const lab = useLab.getState()
      const msg = event.data

      if (msg.type === "hello") {
        lab.markConnected(id)
        const config = buildConfig(id, lab)
        if (config) postToFrame(id, { source: LAB_SOURCE, type: "config", config })
        return
      }

      if (msg.type === "route") {
        lab.setRoute(id, msg.path)
        if (!lab.syncNav || msg.path === lastSynced) return
        lastSynced = msg.path
        for (const other of frameIds()) {
          if (other !== id && useLab.getState().runtime[other]?.route !== msg.path) {
            postToFrame(other, { source: LAB_SOURCE, type: "navigate", path: msg.path })
          }
        }
        return
      }

      if (msg.type === "log") {
        lab.pushLog({ deviceId: id, level: msg.level, message: String(msg.message).slice(0, 4000) })
      }
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])
}
