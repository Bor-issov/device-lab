import { useState } from "react"
import { Plus, X } from "lucide-react"
import { DEVICE_GROUPS, DEVICES, type DeviceSpec } from "@/lib/devices"
import { useLab } from "@/lib/store"
import { Dot, IconButton } from "@/components/ui/dashboard/primitives/controls"
import { cn } from "@/lib/utils"
import { PresetForm } from "./preset-form"

function DeviceRow({ d, on, onToggle, onDelete }: { d: DeviceSpec; on: boolean; onToggle: () => void; onDelete?: () => void }) {
  const [w, h] = d.cover ?? d.size
  return (
    <li className="flex items-center gap-0.5">
      <button
        type="button"
        aria-pressed={on}
        onClick={onToggle}
        className={cn(
          "flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] focus-visible:bg-muted",
          on ? "bg-muted text-foreground" : "text-muted-foreground"
        )}
      >
        <Dot on={on} />
        <span className="flex-1 truncate">{d.name}</span>
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{d.cover ? `${w}/${d.size[0]}` : `${w}×${h}`}</span>
      </button>
      {onDelete && (
        <IconButton label={`Delete ${d.name}`} side="right" onClick={onDelete}>
          <X />
        </IconButton>
      )}
    </li>
  )
}

function GroupHeader({ title, count, total, action }: { title: string; count: number; total: number; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 px-2 pb-1.5">
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      <span className="flex items-center gap-1">
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {count}/{total}
        </span>
        {action}
      </span>
    </div>
  )
}

export function DeviceList() {
  const selected = useLab((s) => s.selected)
  const toggleDevice = useLab((s) => s.toggleDevice)
  const customDevices = useLab((s) => s.customDevices)
  const deletePreset = useLab((s) => s.deletePreset)
  const [adding, setAdding] = useState(false)

  return (
    <nav aria-label="Devices" className="scrollbar-quiet min-h-0 flex-1 overflow-y-auto px-3 pb-6">
      {DEVICE_GROUPS.map((group) => {
        const devices = DEVICES.filter((d) => d.group === group)
        return (
          <div key={group} className="pb-5">
            <GroupHeader title={group} count={devices.filter((d) => selected.includes(d.id)).length} total={devices.length} />
            <ul className="flex flex-col gap-px">
              {devices.map((d) => (
                <DeviceRow key={d.id} d={d} on={selected.includes(d.id)} onToggle={() => toggleDevice(d.id)} />
              ))}
            </ul>
          </div>
        )
      })}

      <div className="pb-5">
        <GroupHeader
          title="Custom"
          count={customDevices.filter((d) => selected.includes(d.id)).length}
          total={customDevices.length}
          action={
            <IconButton label={adding ? "Cancel" : "Add a custom size"} side="right" pressed={adding} onClick={() => setAdding((v) => !v)}>
              <Plus />
            </IconButton>
          }
        />
        {adding && <PresetForm onDone={() => setAdding(false)} />}
        {customDevices.length === 0 && !adding ? (
          <p className="px-2 text-xs leading-relaxed text-muted-foreground">Any width and height, saved on this machine.</p>
        ) : (
          <ul className="flex flex-col gap-px">
            {customDevices.map((d) => (
              <DeviceRow
                key={d.id}
                d={d}
                on={selected.includes(d.id)}
                onToggle={() => toggleDevice(d.id)}
                onDelete={() => deletePreset(d.id).catch((err) => console.error(err))}
              />
            ))}
          </ul>
        )}
      </div>
    </nav>
  )
}
