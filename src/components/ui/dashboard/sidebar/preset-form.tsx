import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Segmented } from "@/components/ui/dashboard/primitives/controls"
import { presetFromInput, type DeviceOs } from "@/lib/devices"
import { useLab } from "@/lib/store"

const field = "h-8 w-full min-w-0 rounded-lg bg-input px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:bg-accent"

const inRange = (n: number) => Number.isInteger(n) && n >= 200 && n <= 3000

export function PresetForm({ onDone }: { onDone: () => void }) {
  const savePreset = useLab((s) => s.savePreset)
  const [os, setOs] = useState<DeviceOs>("ios")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(form: HTMLFormElement) {
    const data = new FormData(form)
    const name = String(data.get("name") ?? "").trim()
    const width = Number(data.get("width"))
    const height = Number(data.get("height"))
    if (!name) return setError("Give it a name")
    if (!inRange(width) || !inRange(height)) return setError("Width and height between 200 and 3000")
    setSaving(true)
    try {
      await savePreset(presetFromInput({ name, os, width, height }))
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      className="mx-2 mb-3 flex flex-col gap-2 rounded-xl bg-muted p-2.5"
      onSubmit={(e) => {
        e.preventDefault()
        void submit(e.currentTarget)
      }}
    >
      <input name="name" placeholder="Name" maxLength={64} autoFocus className={field} />
      <div className="flex items-center gap-2">
        <input name="width" inputMode="numeric" placeholder="Width" aria-label="Width in points" className={`${field} font-mono`} />
        <span className="text-xs text-muted-foreground">×</span>
        <input name="height" inputMode="numeric" placeholder="Height" aria-label="Height in points" className={`${field} font-mono`} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Segmented
          label="Operating system"
          value={os}
          onChange={setOs}
          options={[
            { value: "ios", label: "iOS" },
            { value: "android", label: "Android" },
          ]}
        />
        <Button type="submit" size="sm" disabled={saving}>
          Save
        </Button>
      </div>
      {error && <p className="text-xs text-muted-foreground">{error}</p>}
    </form>
  )
}
