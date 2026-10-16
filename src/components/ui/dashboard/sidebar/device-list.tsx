"use client"

import { DEVICE_GROUPS, DEVICES } from "@/lib/devices"
import { useLab } from "@/lib/store"
import { Dot } from "@/components/ui/dashboard/primitives/controls"
import { cn } from "@/lib/utils"

export function DeviceList() {
  const selected = useLab((s) => s.selected)
  const toggleDevice = useLab((s) => s.toggleDevice)

  return (
    <nav aria-label="Devices" className="scrollbar-quiet min-h-0 flex-1 overflow-y-auto px-3 pb-6">
      {DEVICE_GROUPS.map((group) => {
        const devices = DEVICES.filter((d) => d.group === group)
        const count = devices.filter((d) => selected.includes(d.id)).length
        return (
          <div key={group} className="pb-5">
            <div className="flex items-baseline justify-between px-2 pb-1.5">
              <span className="text-xs font-medium text-muted-foreground">{group}</span>
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                {count}/{devices.length}
              </span>
            </div>
            <ul className="flex flex-col gap-px">
              {devices.map((d) => {
                const on = selected.includes(d.id)
                const [w, h] = d.cover ?? d.size
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleDevice(d.id)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] focus-visible:bg-muted",
                        on ? "bg-muted text-foreground" : "text-muted-foreground"
                      )}
                    >
                      <Dot on={on} />
                      <span className="flex-1 truncate">{d.name}</span>
                      <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                        {d.cover ? `${w}/${d.size[0]}` : `${w}×${h}`}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
