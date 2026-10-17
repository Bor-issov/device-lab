import { useEffect, useMemo, useRef, useState } from "react"
import { emitTo } from "@tauri-apps/api/event"
import { LogicalSize } from "@tauri-apps/api/dpi"
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow"
import { FoldHorizontal, RotateCcw, RotateCw, SquareArrowDownLeft, UnfoldHorizontal, X } from "lucide-react"
import { getDevice, isFoldable, setCustomDevices } from "@/lib/devices"
import { externalLayout, type ExternalAction, type ExternalPost, type ExternalState } from "@/lib/external"
import { deviceIdForMessage, postToFrame } from "@/lib/frames"
import { isBridgeMessage } from "@/lib/protocol"
import { useLab, usePose } from "@/lib/store"
import { DeviceFrame } from "@/components/ui/dashboard/device-frame/device-frame"
import { Dot, IconButton } from "@/components/ui/dashboard/primitives/controls"

// Rotate / fold tween length in DeviceFrame, plus a little slack.
const TWEEN_MS = 600

function apply(state: ExternalState) {
  setCustomDevices(state.customDevices)
  const { id } = state
  useLab.setState({
    sourceUrl: state.sourceUrl,
    selected: [id],
    scheme: state.scheme,
    fontScale: state.fontScale,
    dir: state.dir,
    spoofPlatform: state.spoofPlatform,
    showChrome: state.showChrome,
    showHinge: state.showHinge,
    poses: state.pose ? { [id]: state.pose } : {},
    nonces: { [id]: state.nonce },
    runtime: state.runtime ? { [id]: state.runtime } : {},
    customDevices: state.customDevices,
  })
}

function act(id: string, action: ExternalAction) {
  void emitTo("main", "external:action", { id, action })
}

// One frame on the desktop in its own transparent window. Everything it shows comes from the Lab;
// every button is sent back to the Lab, which updates its store and pushes the new state here.
export function ExternalFrame({ id }: { id: string }) {
  const [ready, setReady] = useState(false)
  const spec = getDevice(id)
  const pose = usePose(id)
  const runtime = useLab((s) => s.runtime[id])

  useEffect(() => {
    const win = getCurrentWebviewWindow()
    const subs = [
      win.listen<ExternalState>("external:state", ({ payload }) => {
        if (payload.id !== id) return
        apply(payload)
        setReady(true)
      }),
      win.listen<ExternalPost>("external:post", ({ payload }) => {
        if (payload.id === id) postToFrame(id, payload.message)
      }),
    ]
    void Promise.all(subs).then(() => emitTo("main", "external:ready", { id }))

    // The bridge talks to this window; relay what the frame says to the Lab.
    function onMessage(event: MessageEvent) {
      if (isBridgeMessage(event.data) && deviceIdForMessage(event) === id) void emitTo("main", "external:bridge", { id, message: event.data })
    }
    window.addEventListener("message", onMessage)

    return () => {
      window.removeEventListener("message", onMessage)
      for (const sub of subs) void sub.then((unlisten) => unlisten())
    }
  }, [id])

  const layout = useMemo(() => (spec && ready ? externalLayout(spec, pose) : null), [spec, pose, ready])
  const prevLayout = useRef(layout)

  // Fit the window to the shell. On rotate / fold grow to cover both sizes while the shell
  // tweens, then shrink to the final one; content is pinned top-left so nothing jumps.
  useEffect(() => {
    if (!layout) return
    useLab.setState({ zoom: layout.zoom })
    const win = getCurrentWebviewWindow()
    const prev = prevLayout.current
    prevLayout.current = layout
    const final = new LogicalSize(layout.width, layout.height)
    if (!prev || (prev.width === layout.width && prev.height === layout.height)) {
      void win.setSize(final)
      return
    }
    void win.setSize(new LogicalSize(Math.max(prev.width, layout.width), Math.max(prev.height, layout.height)))
    const timer = setTimeout(() => void win.setSize(final), TWEEN_MS)
    return () => clearTimeout(timer)
  }, [layout])

  if (!spec || !ready) return null

  return (
    <main className="flex h-full flex-col items-start gap-2.5 p-2">
      <div data-tauri-drag-region className="flex h-10 cursor-grab items-center gap-1 rounded-full bg-popover py-1 pr-1 pl-4 text-popover-foreground">
        <span data-tauri-drag-region className="mr-2 flex items-center gap-2 text-xs font-medium select-none">
          <Dot on={Boolean(runtime?.connected)} />
          {spec.name}
        </span>
        <IconButton label="Rotate" onClick={() => act(id, "rotate")}>
          <RotateCw />
        </IconButton>
        {isFoldable(spec) && (
          <IconButton label={pose.folded ? "Unfold" : "Fold"} onClick={() => act(id, "fold")} pressed={pose.folded}>
            {pose.folded ? <UnfoldHorizontal /> : <FoldHorizontal />}
          </IconButton>
        )}
        <IconButton label="Reload" onClick={() => act(id, "reload")}>
          <RotateCcw />
        </IconButton>
        <IconButton label="Bring back" onClick={() => act(id, "dock")}>
          <SquareArrowDownLeft />
        </IconButton>
        <IconButton label="Close" onClick={() => act(id, "close")}>
          <X />
        </IconButton>
      </div>
      <DeviceFrame id={id} bare />
    </main>
  )
}
