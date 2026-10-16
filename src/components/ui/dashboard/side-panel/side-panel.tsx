"use client"

import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { X } from "lucide-react"
import { AndroidPanel } from "@/components/ui/dashboard/android-panel/android-panel"
import { LogsPanel } from "@/components/ui/dashboard/logs-panel/logs-panel"
import { SetupPanel } from "@/components/ui/dashboard/setup-panel/setup-panel"
import { IconButton, Segmented } from "@/components/ui/dashboard/primitives/controls"
import { useLab, type PanelId } from "@/lib/store"

gsap.registerPlugin(useGSAP)

export function SidePanel() {
  const panel = useLab((s) => s.panel)
  const set = useLab((s) => s.set)
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (panel) gsap.from(ref.current, { x: 40, autoAlpha: 0, duration: 0.45, ease: "power3.out" })
    },
    { dependencies: [panel !== null] }
  )

  if (!panel) return null

  return (
    <aside ref={ref} className="flex w-[420px] shrink-0 flex-col bg-surface">
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 px-4">
        <Segmented<PanelId>
          label="Panel"
          value={panel}
          onChange={(v) => set("panel", v)}
          options={[
            { value: "android", label: "Android" },
            { value: "logs", label: "Logs" },
            { value: "setup", label: "Setup" },
          ]}
        />
        <IconButton label="Close panel" onClick={() => set("panel", null)}>
          <X />
        </IconButton>
      </div>
      <div className="scrollbar-quiet min-h-0 flex-1 overflow-y-auto">
        {panel === "android" && <AndroidPanel />}
        {panel === "logs" && <LogsPanel />}
        {panel === "setup" && <SetupPanel />}
      </div>
    </aside>
  )
}
