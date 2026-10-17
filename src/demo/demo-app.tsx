import { useEffect, useState } from "react"
import { BookOpen, Check, Settings2, Sun } from "lucide-react"
import { navigate, usePathname } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useDemoBridge } from "./use-demo-bridge"

const TABS = [
  { id: "today", label: "Today", icon: Sun },
  { id: "journal", label: "Journal", icon: BookOpen },
  { id: "settings", label: "Settings", icon: Settings2 },
] as const

const HABITS = [
  { name: "Morning run", detail: "5 km easy pace", streak: 12 },
  { name: "Read 20 pages", detail: "The Design of Everyday Things", streak: 31 },
  { name: "No phone after 22:00", detail: "Charge it in the hallway", streak: 4 },
  { name: "Stretch", detail: "10 minutes, hips and back", streak: 9 },
  { name: "Write three lines", detail: "Anything, just three", streak: 18 },
]

const ENTRIES = [
  { day: "Thu 16", text: "Ran before sunrise. The streets were empty and the air smelled like rain." },
  { day: "Wed 15", text: "Skipped the run, stretched twice instead. Knee feels better." },
  { day: "Tue 14", text: "Finished chapter four. The bit about affordances finally clicked." },
  { day: "Mon 13", text: "Phone stayed in the hallway. Slept an hour longer than usual." },
]

function useWide() {
  const [wide, setWide] = useState(false)
  useEffect(() => {
    const update = () => setWide(window.innerWidth >= 600)
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])
  return wide
}

export function DemoApp() {
  const { config, log } = useDemoBridge()
  const pathname = usePathname()
  const wide = useWide()
  const [done, setDone] = useState<boolean[]>([true, true, false, true, false])
  const [selected, setSelected] = useState(0)

  const tab = (pathname.split("/")[2] ?? "today") as (typeof TABS)[number]["id"]
  const platform = config.spoofPlatform ? config.os : "web"
  const android = platform === "android"
  const dark = config.scheme === "dark"
  const { top, right, bottom, left } = config.insets
  const title = TABS.find((t) => t.id === tab)?.label ?? "Today"
  const doneCount = done.filter(Boolean).length

  return (
    <div
      className={cn("flex h-dvh flex-col overflow-hidden select-none", dark ? "bg-(--ink) text-(--paper)" : "bg-(--paper) text-(--ink)")}
      style={{ paddingLeft: left, paddingRight: right }}
    >
      <header style={{ paddingTop: top }} className="shrink-0">
        {android ? (
          <div className="flex h-16 items-center px-4 text-[1.375rem]">{title}</div>
        ) : (
          <div className="px-4 pt-1.5 pb-2">
            <h1 className="text-[2.125rem] leading-tight font-bold tracking-tight">{title}</h1>
          </div>
        )}
      </header>

      <main className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {tab === "today" && (
          <div className={cn("gap-6", wide ? "grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]" : "flex flex-col")}>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-baseline justify-between text-sm opacity-70">
                  <span>Thursday, October 16</span>
                  <span className="tabular-nums">
                    {doneCount} of {HABITS.length}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-current/10">
                  <div className="h-full rounded-full bg-(--signal)" style={{ width: `${(doneCount / HABITS.length) * 100}%` }} />
                </div>
              </div>
              <ul className="flex flex-col gap-2">
                {HABITS.map((h, i) => (
                  <li key={h.name}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelected(i)}
                      className={cn("flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left", wide && selected === i ? "bg-current/12" : "bg-current/6")}
                    >
                      <button
                        type="button"
                        aria-label={done[i] ? `Mark ${h.name} not done` : `Mark ${h.name} done`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setDone((d) => d.map((v, j) => (j === i ? !v : v)))
                        }}
                        className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", done[i] ? "bg-(--signal) text-(--ink)" : "bg-current/10")}
                      >
                        {done[i] && <Check className="size-4" strokeWidth={3} />}
                      </button>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{h.name}</span>
                        <span className="truncate text-sm opacity-60">{h.detail}</span>
                      </span>
                      <span className="ml-auto text-sm tabular-nums opacity-60">{h.streak}d</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {wide && (
              <section className="flex flex-col gap-6 rounded-3xl bg-current/6 p-6">
                <div className="flex flex-col gap-1">
                  <span className="text-sm opacity-60">Current streak</span>
                  <span className="text-6xl font-semibold tracking-tight tabular-nums">{HABITS[selected].streak}</span>
                  <span className="text-lg font-medium">{HABITS[selected].name}</span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <span className={cn("aspect-square w-full rounded-xl", (i + selected) % 4 === 3 ? "bg-current/10" : "bg-(--signal)")} />
                      <span className="text-xs opacity-60">{d}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm leading-relaxed opacity-70">
                  This panel only appears when the window is at least 600 wide. Unfold a foldable or turn an iPad to see the layout change.
                </p>
              </section>
            )}
          </div>
        )}

        {tab === "journal" && (
          <ol className={cn("gap-3 pt-1", wide ? "grid grid-cols-2" : "flex flex-col")}>
            {ENTRIES.map((e) => (
              <li key={e.day} className="flex flex-col gap-1.5 rounded-2xl bg-current/6 p-4">
                <span className="text-sm font-medium opacity-60">{e.day}</span>
                <p className="leading-relaxed">{e.text}</p>
              </li>
            ))}
          </ol>
        )}

        {tab === "settings" && (
          <div className="flex flex-col gap-6 pt-1">
            <dl className="flex flex-col overflow-hidden rounded-2xl bg-current/6">
              {[
                ["Device", config.deviceName],
                ["Platform", platform],
                ["Viewport", `${config.viewport.width} × ${config.viewport.height}`],
                ["Safe area", `${top} ${right} ${bottom} ${left}`],
                ["Scheme", config.scheme],
                ["Text size", `${Math.round(config.fontScale * 100)}%`],
                ["Posture", config.folded ? "folded" : config.landscape ? "landscape" : "portrait"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-4 py-3">
                  <dt className="opacity-60">{k}</dt>
                  <dd className="font-medium tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => log("log", `Hello from ${config.deviceName}`)} className="rounded-2xl bg-current/6 px-4 py-3 text-left font-medium">
                Send a test log
              </button>
              <button
                type="button"
                onClick={() => log("error", `TypeError: Cannot read properties of undefined (reading 'streak') on ${config.deviceName}`)}
                className="rounded-2xl bg-current/6 px-4 py-3 text-left font-medium"
              >
                Send a test error
              </button>
            </div>
          </div>
        )}
      </main>

      <nav
        style={{ paddingBottom: bottom }}
        className={cn("shrink-0", dark ? "bg-[color-mix(in_oklab,var(--ink)_80%,black)]" : "bg-[color-mix(in_oklab,var(--paper)_92%,var(--ink))]")}
      >
        <ul className={cn("grid grid-cols-3", android ? "h-20" : "h-[3.0625rem]")}>
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = id === tab
            return (
              <li key={id}>
                <a
                  href={`/demo/${id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(`/demo/${id}`)
                  }}
                  className={cn("flex h-full flex-col items-center justify-center", android ? "gap-1" : "gap-0.5", !active && !android && "opacity-45")}
                >
                  {android ? (
                    <span className={cn("flex h-8 w-16 items-center justify-center rounded-full", active && "bg-(--signal) text-(--ink)")}>
                      <Icon className="size-5" />
                    </span>
                  ) : (
                    <Icon className="size-6" strokeWidth={active ? 2.25 : 1.75} />
                  )}
                  <span className={cn(android ? "text-xs font-medium" : "text-[0.625rem] font-medium", android && !active && "opacity-70")}>{label}</span>
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
