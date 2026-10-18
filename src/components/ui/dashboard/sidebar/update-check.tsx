import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getVersion } from "@tauri-apps/api/app"
import { relaunch } from "@tauri-apps/plugin-process"
import { check, type Update } from "@tauri-apps/plugin-updater"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { isNative } from "@/lib/native"

type Step =
  | { step: "checking" }
  | { step: "latest" }
  | { step: "available"; update: Update }
  | { step: "installing"; update: Update; progress: number | null }
  | { step: "error"; message: string }

// Release notes come from .github/release-notes.md through latest.json: "- " lines become a list.
function Notes({ body }: { body: string | undefined }) {
  const lines = (body ?? "").split("\n").map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return null
  return (
    <ul className="flex max-h-72 flex-col gap-2.5 overflow-y-auto">
      {lines.map((line) => (
        <li key={line} className="flex gap-2.5 text-[13px] leading-relaxed">
          <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
          <span>{line.replace(/^[-*]\s+/, "")}</span>
        </li>
      ))}
    </ul>
  )
}

// Sidebar footer: current version plus "Check for updates", which opens the update dialog.
export function UpdateCheck() {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<Step>({ step: "checking" })
  const { data: version } = useQuery({ queryKey: ["app-version"], queryFn: getVersion, enabled: isNative, staleTime: Infinity })

  if (!isNative) return null

  async function checkNow() {
    setState({ step: "checking" })
    setOpen(true)
    try {
      const update = await check({ timeout: 20_000 })
      setState(update ? { step: "available", update } : { step: "latest" })
    } catch (err) {
      setState({ step: "error", message: String(err) })
    }
  }

  async function install(update: Update) {
    let total = 0
    let done = 0
    setState({ step: "installing", update, progress: null })
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") total = event.data.contentLength ?? 0
        else if (event.event === "Progress") {
          done += event.data.chunkLength
          setState({ step: "installing", update, progress: total ? done / total : null })
        }
      })
      await relaunch()
    } catch (err) {
      setState({ step: "error", message: String(err) })
    }
  }

  const installing = state.step === "installing"

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 px-5 py-3">
      <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{version ? `v${version}` : ""}</span>
      <Button variant="ghost" size="sm" onClick={() => void checkNow()}>
        Check for updates
      </Button>

      <Dialog open={open} onOpenChange={(next) => !installing && setOpen(next)}>
        <DialogContent showCloseButton={false}>
          {state.step === "checking" && (
            <DialogHeader>
              <DialogTitle>Checking for updates</DialogTitle>
              <DialogDescription>Looking for a newer Device Lab release.</DialogDescription>
            </DialogHeader>
          )}

          {state.step === "latest" && (
            <DialogHeader>
              <DialogTitle>You are up to date</DialogTitle>
              <DialogDescription>Device Lab {version} is the newest release.</DialogDescription>
            </DialogHeader>
          )}

          {state.step === "error" && (
            <DialogHeader>
              <DialogTitle>Could not update</DialogTitle>
              <DialogDescription className="break-words">{state.message}</DialogDescription>
            </DialogHeader>
          )}

          {(state.step === "available" || state.step === "installing") && (
            <>
              <DialogHeader>
                <DialogTitle>Device Lab {state.update.version}</DialogTitle>
                <DialogDescription>
                  You have {version}. This update brings:
                </DialogDescription>
              </DialogHeader>
              <Notes body={state.update.body} />
              {state.step === "installing" && (
                <div className="flex flex-col gap-2">
                  <div className="h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${Math.round((state.progress ?? 0) * 100)}%` }} />
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                    {state.progress === null ? "Downloading" : `Downloading ${Math.round(state.progress * 100)}%`}, the app restarts when done
                  </span>
                </div>
              )}
            </>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="subtle" disabled={installing} />}>Dismiss</DialogClose>
            {(state.step === "available" || installing) && (
              <Button disabled={installing} onClick={() => state.step === "available" && void install(state.update)}>
                {installing ? "Updating" : "Update"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
