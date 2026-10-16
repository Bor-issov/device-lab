"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { getDevice } from "@/lib/devices"
import { useLab } from "@/lib/store"
import { cn } from "@/lib/utils"

const time = (at: number) => new Date(at).toLocaleTimeString([], { hour12: false })

// First line is the message; anything after it (stack frames) stays collapsed.
function LogMessage({ message }: { message: string }) {
  const [head, ...rest] = message.split("\n")
  const text = "pt-1 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap"
  if (!rest.length) return <pre className={`${text} text-foreground`}>{head}</pre>
  return (
    <details>
      <summary className={`${text} cursor-pointer list-none text-foreground`}>{head}</summary>
      <pre className={`${text} text-muted-foreground`}>{rest.join("\n")}</pre>
    </details>
  )
}

export function LogsPanel() {
  const logs = useLab((s) => s.logs)
  const clearLogs = useLab((s) => s.clearLogs)
  const [device, setDevice] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const devices = [...new Set(logs.map((l) => l.deviceId))]
  const visible = device ? logs.filter((l) => l.deviceId === device) : logs

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [visible.length])

  return (
    <div className="flex flex-col gap-3 px-5 pb-6">
      <div className="flex flex-wrap items-center gap-1">
        <Button variant="ghost" size="sm" aria-pressed={device === null} onClick={() => setDevice(null)}>
          All
        </Button>
        {devices.map((id) => (
          <Button key={id} variant="ghost" size="sm" aria-pressed={device === id} onClick={() => setDevice(id)}>
            {getDevice(id)?.name ?? id}
          </Button>
        ))}
        <Button variant="subtle" size="sm" className="ml-auto" onClick={clearLogs} disabled={!logs.length}>
          Clear
        </Button>
      </div>

      {visible.length === 0 ? (
        <p className="pt-6 text-sm leading-relaxed text-muted-foreground">
          Console warnings, errors and uncaught exceptions from every frame land here once the bridge is installed.
        </p>
      ) : (
        <ol className="flex flex-col gap-1">
          {visible.map((l) => (
            <li key={l.id} className={cn("rounded-lg px-3 py-2", l.level === "error" ? "bg-muted" : "bg-transparent")}>
              <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                <span className="tabular-nums">{time(l.at)}</span>
                <span className="truncate">{getDevice(l.deviceId)?.name ?? l.deviceId}</span>
                <span className={cn("ml-auto", l.level === "error" && "text-primary")}>{l.level}</span>
              </div>
              <LogMessage message={l.message} />
            </li>
          ))}
        </ol>
      )}
      <div ref={endRef} />
    </div>
  )
}
