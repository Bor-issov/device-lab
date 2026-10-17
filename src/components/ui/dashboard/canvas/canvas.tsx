import { Button } from "@/components/ui/button"
import { DeviceFrame } from "@/components/ui/dashboard/device-frame/device-frame"
import { useDevServer } from "@/hooks/use-dev-server"
import { useLab } from "@/lib/store"

export function Canvas() {
  const selected = useLab((s) => s.selected)
  const sourceUrl = useLab((s) => s.sourceUrl)
  const set = useLab((s) => s.set)
  const { data: reachable } = useDevServer(sourceUrl)

  return (
    <div id="lab-canvas" className="scrollbar-quiet relative min-h-0 min-w-0 flex-1 overflow-auto bg-stage">
      {reachable === false && (
        <div className="pointer-events-none sticky top-5 z-30 flex justify-center px-6">
          <div className="pointer-events-auto flex max-w-2xl items-center gap-4 rounded-full bg-popover py-1.5 pr-1.5 pl-5 text-sm text-popover-foreground">
            <span>
              Nothing answers at <span className="font-mono text-xs">{sourceUrl}</span>. Run{" "}
              <span className="font-mono text-xs">npx expo start --web</span>
            </span>
            <Button variant="inverse" size="sm" className="rounded-full" onClick={() => set("sourceUrl", `${window.location.origin}/demo`)}>
              Open demo app
            </Button>
          </div>
        </div>
      )}

      {selected.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
          <p className="text-lg font-medium">Pick devices from the list</p>
          <p className="max-w-sm text-sm text-muted-foreground">Every device renders the same app URL side by side and reloads together.</p>
        </div>
      ) : (
        <div className="flex min-h-full flex-wrap content-start items-start justify-center gap-x-16 gap-y-16 px-12 pt-14 pb-20">
          {selected.map((id) => (
            <DeviceFrame key={id} id={id} />
          ))}
        </div>
      )}
    </div>
  )
}
