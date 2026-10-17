import { useEffect } from "react"
import { emitTo } from "@tauri-apps/api/event"
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow"
import { handleBridgeMessage } from "@/hooks/use-bridge-messages"
import { bringBack, externalLabel, moveOutside, type ExternalAction, type ExternalBridge, type ExternalState } from "@/lib/external"
import { isNative, native } from "@/lib/native"
import { isBridgeMessage } from "@/lib/protocol"
import { useLab, type LabState } from "@/lib/store"

function snapshot(id: string, s: LabState): ExternalState {
  return {
    id,
    sourceUrl: s.sourceUrl,
    scheme: s.scheme,
    fontScale: s.fontScale,
    dir: s.dir,
    spoofPlatform: s.spoofPlatform,
    showChrome: s.showChrome,
    showHinge: s.showHinge,
    pose: s.poses[id],
    nonce: s.nonces[id] ?? 0,
    runtime: s.runtime[id],
    customDevices: s.customDevices,
  }
}

function onAction(id: string, action: ExternalAction) {
  const lab = useLab.getState()
  if (!lab.external.includes(id)) return
  if (action === "rotate") lab.rotate(id)
  else if (action === "fold") lab.toggleFold(id)
  else if (action === "reload") lab.reload(id)
  else if (action === "dock") bringBack(id)
  else if (action === "close") {
    bringBack(id)
    lab.removeDevice(id)
  }
}

// Lab side of "Move outside": opens windows from the frame context menu, mirrors state into every
// external window and applies the actions they send back.
export function useExternalFrames() {
  useEffect(() => {
    if (!isNative) return
    // A reloaded Lab starts with every frame docked; drop windows left from before.
    native.external.closeAll().catch(() => {})

    const sent = new Map<string, string>()
    function push(id: string, force = false) {
      const json = JSON.stringify(snapshot(id, useLab.getState()))
      if (!force && sent.get(id) === json) return
      sent.set(id, json)
      void emitTo(externalLabel(id), "external:state", JSON.parse(json) as ExternalState)
    }

    const win = getCurrentWebviewWindow()
    const subs = [
      win.listen<[number, number]>("external:menu", ({ payload: [x, y] }) => {
        const frame = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-device-frame]")
        if (frame?.dataset.deviceFrame) void moveOutside(frame.dataset.deviceFrame)
      }),
      win.listen<{ id: string; action: ExternalAction }>("external:action", ({ payload }) => onAction(payload.id, payload.action)),
      win.listen<{ id: string }>("external:ready", ({ payload }) => {
        if (useLab.getState().external.includes(payload.id)) push(payload.id, true)
      }),
      win.listen<ExternalBridge>("external:bridge", ({ payload }) => {
        if (useLab.getState().external.includes(payload.id) && isBridgeMessage(payload.message)) handleBridgeMessage(payload.id, payload.message)
      }),
      win.listen<string>("external:closed", ({ payload }) => useLab.getState().setExternal(payload, false)),
    ]

    const unsubscribe = useLab.subscribe((s) => {
      for (const id of s.external) {
        // Deselected in the sidebar (or its preset deleted) while outside.
        if (!s.selected.includes(id)) bringBack(id)
        else push(id)
      }
      for (const id of sent.keys()) if (!s.external.includes(id)) sent.delete(id)
    })

    return () => {
      unsubscribe()
      for (const sub of subs) void sub.then((unlisten) => unlisten())
    }
  }, [])
}
