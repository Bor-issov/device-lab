import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { revealItemInDir } from "@tauri-apps/plugin-opener"
import { FolderOpen, Trash2 } from "lucide-react"
import { IconButton } from "@/components/ui/dashboard/primitives/controls"
import { getDevice } from "@/lib/devices"
import { native } from "@/lib/native"

const stamp = (at: number) =>
  new Date(at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })

// Captures saved by the desktop app (Rust crops the webview snapshot per device shell).
export function ShotsPanel() {
  const qc = useQueryClient()
  const { data: shots = [], isPending, error } = useQuery({ queryKey: ["screenshots"], queryFn: () => native.screenshots.list(120) })
  const remove = useMutation({
    mutationFn: native.screenshots.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["screenshots"] }),
  })

  if (isPending) return null
  if (error) return <p className="px-5 text-sm text-muted-foreground">{error.message}</p>
  if (!shots.length) {
    return (
      <p className="px-5 pt-6 text-sm leading-relaxed text-muted-foreground">
        Press the camera in the toolbar. Every visible device is saved as its own PNG, cut to the shell.
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-3 px-5 pb-6">
      {shots.map((shot) => (
        <li key={shot.id} className="flex flex-col gap-1.5">
          <div className="flex aspect-[3/4] items-center justify-center rounded-xl bg-background/70 p-2.5">
            <img src={native.screenshots.src(shot.path)} alt={`${getDevice(shot.deviceId)?.name ?? shot.deviceId} screenshot`} className="max-h-full max-w-full object-contain" loading="lazy" />
          </div>
          <div className="flex items-center gap-1">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs">{getDevice(shot.deviceId)?.name ?? shot.deviceId}</span>
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{stamp(shot.createdAt)}</span>
            </div>
            <IconButton label="Show in folder" side="top" onClick={() => void revealItemInDir(shot.path)}>
              <FolderOpen />
            </IconButton>
            <IconButton label="Delete" side="top" disabled={remove.isPending} onClick={() => remove.mutate(shot.id)}>
              <Trash2 />
            </IconButton>
          </div>
        </li>
      ))}
    </ul>
  )
}
