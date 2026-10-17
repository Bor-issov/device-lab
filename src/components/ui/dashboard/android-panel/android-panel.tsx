import { useState } from "react"
import { ArrowLeft, Circle, FoldHorizontal, Power, RotateCw, Square, UnfoldHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/dashboard/primitives/code-block"
import { Dot, IconButton } from "@/components/ui/dashboard/primitives/controls"
import { useAndroidInput, useAndroidStatus, useBootAvd } from "@/hooks/use-android"
import type { SdkStatus } from "@/lib/android/types"
import { isNative } from "@/lib/native"
import { useLab } from "@/lib/store"
import { cn } from "@/lib/utils"
import { LiveScreen } from "./live-screen"

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5 px-5 pb-7">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

function expoGoUrl(sourceUrl: string) {
  try {
    const port = new URL(sourceUrl).port || "8081"
    return `exp://10.0.2.2:${port}`
  } catch {
    return "exp://10.0.2.2:8081"
  }
}

export function AndroidPanel() {
  const { data, isPending, error } = useAndroidStatus(true)
  const boot = useBootAvd()
  const [picked, setSerial] = useState<string | null>(null)
  const sourceUrl = useLab((s) => s.sourceUrl)
  const [text, setText] = useState("")

  // Fall back to the first online device when nothing (or a device that went away) is picked.
  const online = data?.devices.filter((d) => d.state === "device") ?? []
  const active = online.find((d) => d.serial === picked) ?? online[0] ?? null
  const serial = active?.serial ?? null
  const input = useAndroidInput(serial)

  if (!isNative) return <p className="px-5 text-sm leading-relaxed text-muted-foreground">Android control runs through adb on this machine, so it needs the desktop app. Start it with pnpm app.</p>
  if (isPending) return <p className="px-5 text-sm text-muted-foreground">Looking for the Android SDK</p>
  if (error) return <p className="px-5 text-sm text-muted-foreground">{error.message}</p>
  if (!data?.adb || !data.emulator) return <AndroidSetup status={data} />

  return (
    <div className="flex flex-col">
      <Section title="Running">
        {online.length === 0 ? (
          <p className="text-sm text-muted-foreground">No device running. Boot one below.</p>
        ) : (
          <ul className="flex flex-col gap-px">
            {online.map((d) => (
              <li key={d.serial}>
                <button
                  type="button"
                  onClick={() => setSerial(d.serial)}
                  aria-pressed={d.serial === serial}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px]",
                    d.serial === serial ? "bg-muted text-foreground" : "text-muted-foreground"
                  )}
                >
                  <Dot on={d.serial === serial} />
                  <span className="flex-1 truncate">{d.model ?? d.serial}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{d.serial}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {active && (
        <Section
          title="Screen"
          aside={
            <Button variant="ghost" size="sm" onClick={() => input.mutate({ action: "openUrl", url: expoGoUrl(sourceUrl) })}>
              Open in Expo Go
            </Button>
          }
        >
          <LiveScreen serial={active.serial} onInput={(i) => input.mutate(i)} />
          <div className="flex flex-wrap items-center justify-center gap-1">
            <IconButton label="Back" side="top" onClick={() => input.mutate({ action: "key", key: "back" })}>
              <ArrowLeft />
            </IconButton>
            <IconButton label="Home" side="top" onClick={() => input.mutate({ action: "key", key: "home" })}>
              <Circle />
            </IconButton>
            <IconButton label="Recents" side="top" onClick={() => input.mutate({ action: "key", key: "recents" })}>
              <Square />
            </IconButton>
            <IconButton label="Rotate" side="top" disabled={!active.emulator} onClick={() => input.mutate({ action: "rotate" })}>
              <RotateCw />
            </IconButton>
            <IconButton label="Fold" side="top" disabled={!active.emulator} onClick={() => input.mutate({ action: "fold" })}>
              <FoldHorizontal />
            </IconButton>
            <IconButton label="Unfold" side="top" disabled={!active.emulator} onClick={() => input.mutate({ action: "unfold" })}>
              <UnfoldHorizontal />
            </IconButton>
            <IconButton label="Shut down" side="top" disabled={!active.emulator} onClick={() => input.mutate({ action: "kill" })}>
              <Power />
            </IconButton>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!text) return
              input.mutate({ action: "text", text })
              setText("")
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type into the focused field"
              className="h-8 min-w-0 flex-1 rounded-lg bg-input px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:bg-accent"
            />
            <Button type="submit" variant="subtle" size="default">
              Send
            </Button>
          </form>
          {input.error && <p className="text-xs text-muted-foreground">{input.error.message}</p>}
        </Section>
      )}

      <Section title="Virtual devices">
        {data.avds.length === 0 ? (
          <p className="text-sm text-muted-foreground">No AVDs yet. Create one with the commands in Setup below.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {data.avds.map((avd) => (
              <li key={avd.name} className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px]">{avd.displayName}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{avd.foldable ? "foldable" : (avd.device ?? avd.name)}</span>
                </div>
                <Button size="sm" disabled={boot.isPending && boot.variables === avd.name} onClick={() => boot.mutate(avd.name)}>
                  Boot
                </Button>
              </li>
            ))}
          </ul>
        )}
        {boot.isSuccess && <p className="text-xs text-muted-foreground">Booting headless. It shows up under Running in 20 to 60 seconds.</p>}
        {boot.error && <p className="text-xs text-muted-foreground">{boot.error.message}</p>}
      </Section>

      <Section title="Create a foldable AVD">
        <CodeBlock code={AVD_COMMANDS} />
      </Section>
    </div>
  )
}

const AVD_COMMANDS = `sdkmanager "system-images;android-36;google_apis_playstore;x86_64"
avdmanager create avd -n Pixel_Fold \\
  -k "system-images;android-36;google_apis_playstore;x86_64" \\
  -d pixel_9_pro_fold
avdmanager create avd -n Pixel_Phone \\
  -k "system-images;android-36;google_apis_playstore;x86_64" \\
  -d pixel_9`

function AndroidSetup({ status }: { status: SdkStatus | undefined }) {
  const rows = [
    { label: "SDK", value: status?.sdkPath },
    { label: "adb", value: status?.adb },
    { label: "emulator", value: status?.emulator },
  ]
  return (
    <div className="flex flex-col">
      <Section title="Android SDK">
        <ul className="flex flex-col gap-1.5">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center gap-2.5 text-[13px]">
              <Dot on={Boolean(r.value)} />
              <span className="w-16 text-muted-foreground">{r.label}</span>
              <span className="truncate font-mono text-[11px]">{r.value ?? "not found"}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The real Android emulator runs on Linux for free and supports foldable postures. Install the SDK once, then boot devices from here.
        </p>
      </Section>
      <Section title="1. Install the SDK (Arch)">
        <CodeBlock
          code={`yay -S android-sdk-cmdline-tools-latest android-sdk-platform-tools android-emulator
# let your user write to the SDK so sdkmanager can add system images
sudo groupadd -f android-sdk && sudo gpasswd -a $USER android-sdk
sudo setfacl -R -m g:android-sdk:rwx -m d:g:android-sdk:rwX /opt/android-sdk
export ANDROID_HOME=/opt/android-sdk
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"`}
        />
        <p className="text-xs text-muted-foreground">Or install Android Studio and use its Device Manager. Add the exports to your shell profile.</p>
      </Section>
      <Section title="2. Enable KVM">
        <CodeBlock code={`sudo usermod -aG kvm $USER   # log out and back in`} />
      </Section>
      <Section title="3. Create devices">
        <CodeBlock code={AVD_COMMANDS} />
      </Section>
      <Section title="4. Restart Device Lab">
        <p className="text-sm text-muted-foreground">Restart Device Lab so it picks up ANDROID_HOME. This panel refreshes on its own.</p>
      </Section>
    </div>
  )
}
