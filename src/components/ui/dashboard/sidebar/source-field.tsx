import { Button } from "@/components/ui/button"
import { Dot } from "@/components/ui/dashboard/primitives/controls"
import { useDevServer } from "@/hooks/use-dev-server"
import { useLab } from "@/lib/store"

const EXPO_DEFAULT = "http://localhost:8081"

export function SourceField() {
  const sourceUrl = useLab((s) => s.sourceUrl)
  const set = useLab((s) => s.set)
  const { data: reachable, isPending } = useDevServer(sourceUrl)
  // The Lab only renders after client hydration, so window is always defined here.
  const demoUrl = typeof window === "undefined" ? null : `${window.location.origin}/demo`

  function commit(input: HTMLInputElement) {
    const next = input.value.trim()
    try {
      new URL(next)
      set("sourceUrl", next)
    } catch {
      input.value = sourceUrl
    }
  }

  const usingDemo = demoUrl !== null && sourceUrl.startsWith(demoUrl)

  return (
    <div className="flex flex-col gap-2.5 px-5 pb-6">
      <label htmlFor="source-url" className="text-xs text-muted-foreground">
        App URL
      </label>
      <input
        id="source-url"
        key={sourceUrl}
        defaultValue={sourceUrl}
        spellCheck={false}
        onBlur={(e) => commit(e.currentTarget)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(e.currentTarget)
          if (e.key === "Escape") e.currentTarget.value = sourceUrl
        }}
        className="h-9 w-full rounded-lg bg-input px-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus-visible:bg-accent"
        placeholder={EXPO_DEFAULT}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <Dot on={reachable === true} />
          {isPending ? "Checking" : reachable ? "Reachable" : "Not reachable"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => set("sourceUrl", usingDemo ? EXPO_DEFAULT : (demoUrl ?? EXPO_DEFAULT))}
        >
          {usingDemo ? "Use Expo :8081" : "Use demo app"}
        </Button>
      </div>
    </div>
  )
}
