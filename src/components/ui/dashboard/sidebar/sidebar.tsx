import { DeviceList } from "./device-list"
import { SourceField } from "./source-field"

export function Sidebar() {
  return (
    <aside className="flex w-72 shrink-0 flex-col bg-surface">
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-5">
        <span aria-hidden className="size-3 rounded-[3px] bg-primary" />
        <span className="text-[15px] font-semibold tracking-tight">Device Lab</span>
      </div>
      <SourceField />
      <DeviceList />
    </aside>
  )
}
