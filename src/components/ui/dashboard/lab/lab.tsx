import { useEffect, useState } from "react"
import { Canvas } from "@/components/ui/dashboard/canvas/canvas"
import { SidePanel } from "@/components/ui/dashboard/side-panel/side-panel"
import { Sidebar } from "@/components/ui/dashboard/sidebar/sidebar"
import { Toolbar } from "@/components/ui/dashboard/toolbar/toolbar"
import { useBridgeMessages } from "@/hooks/use-bridge-messages"
import { getDevice } from "@/lib/devices"
import { useLab } from "@/lib/store"

function useHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    // Settings, custom presets and log history all come from SQLite before the first real render.
    Promise.allSettled([useLab.persist.rehydrate(), useLab.getState().loadNative()]).then((results) => {
      for (const r of results) if (r.status === "rejected") console.error(r.reason)
      // Drop ids whose custom preset no longer exists.
      useLab.setState((s) => ({ selected: s.selected.filter((id) => getDevice(id)) }))
      setHydrated(true)
    })
  }, [])
  return hydrated
}

export function Lab() {
  useBridgeMessages()
  const hydrated = useHydrated()

  if (!hydrated) return <main className="h-full w-full bg-background" />

  return (
    <main className="flex h-full w-full max-w-full overflow-hidden">
      <Sidebar />
      <section className="flex min-w-0 flex-1 flex-col">
        <Toolbar />
        <div className="flex min-h-0 flex-1">
          <Canvas />
          <SidePanel />
        </div>
      </section>
    </main>
  )
}
