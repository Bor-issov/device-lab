import { create } from "zustand"
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware"
import { DEFAULT_SELECTION, getDevice, getInsets, getViewport, setCustomDevices, type DevicePose, type DeviceSpec } from "@/lib/devices"
import { isNative, native, type StoredLog } from "@/lib/native"
import type { ColorScheme, LogLevel, PreviewConfig, TextDirection } from "@/lib/protocol"

export type PanelId = "android" | "logs" | "shots" | "setup"

export type DeviceRuntime = {
  connected: boolean
  route: string | null
  errors: number
}

export type LogEntry = {
  id: number
  deviceId: string
  level: LogLevel
  message: string
  at: number
  /** Restored from the SQLite history of an earlier session. */
  past?: boolean
}

type Settings = {
  sourceUrl: string
  selected: string[]
  poses: Record<string, DevicePose>
  scheme: ColorScheme
  fontScale: number
  dir: TextDirection
  spoofPlatform: boolean
  zoom: number
  showChrome: boolean
  showHinge: boolean
  syncNav: boolean
  panel: PanelId | null
}

type Runtime = {
  nonces: Record<string, number>
  runtime: Record<string, DeviceRuntime>
  logs: LogEntry[]
  customDevices: DeviceSpec[]
}

type Actions = {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  toggleDevice: (id: string) => void
  removeDevice: (id: string) => void
  rotate: (id: string) => void
  rotateAll: () => void
  toggleFold: (id: string) => void
  reload: (id: string) => void
  reloadAll: () => void
  togglePanel: (panel: PanelId) => void
  markConnected: (id: string) => void
  setRoute: (id: string, route: string) => void
  pushLog: (entry: Omit<LogEntry, "id" | "at">) => void
  clearLogs: () => void
  loadNative: () => Promise<void>
  savePreset: (spec: DeviceSpec) => Promise<void>
  deletePreset: (id: string) => Promise<void>
}

export type LabState = Settings & Runtime & Actions

const DEFAULT_POSE: DevicePose = { landscape: false, folded: false }
const MAX_LOGS = 400
let logSeq = 0

const emptyRuntime: DeviceRuntime = { connected: false, route: null, errors: 0 }

// Desktop: settings live in SQLite through Rust. Writes are debounced because sliders fire
// many updates per second. Browser dev: plain localStorage.
let pendingWrite: { name: string; value: string } | null = null
let writeTimer: ReturnType<typeof setTimeout> | undefined

function flushSettings() {
  if (!pendingWrite) return
  const { name, value } = pendingWrite
  pendingWrite = null
  native.settings.save(name, value).catch((err) => console.error("settings_save", err))
}

const sqliteStorage: StateStorage = {
  getItem: (name) => native.settings.load(name),
  setItem: (name, value) => {
    pendingWrite = { name, value }
    clearTimeout(writeTimer)
    writeTimer = setTimeout(flushSettings, 250)
  },
  removeItem: (name) => native.settings.remove(name),
}

if (isNative) window.addEventListener("beforeunload", flushSettings)

// Log history is appended to SQLite in batches.
let logQueue: Omit<StoredLog, "id">[] = []
let logTimer: ReturnType<typeof setTimeout> | undefined

function queueLog(entry: Omit<StoredLog, "id">) {
  if (!isNative) return
  logQueue.push(entry)
  logTimer ??= setTimeout(() => {
    logTimer = undefined
    const batch = logQueue
    logQueue = []
    for (let i = 0; i < batch.length; i += 500) native.logs.append(batch.slice(i, i + 500)).catch(() => {})
  }, 500)
}

function presetToSpec(p: Awaited<ReturnType<typeof native.presets.list>>[number]): DeviceSpec {
  return { ...p, group: "Custom" }
}

export const useLab = create<LabState>()(
  persist(
    (set) => ({
      sourceUrl: "http://localhost:8081",
      selected: DEFAULT_SELECTION,
      poses: {},
      scheme: "dark",
      fontScale: 1,
      dir: "ltr",
      spoofPlatform: true,
      zoom: 0.55,
      showChrome: true,
      showHinge: true,
      syncNav: false,
      panel: null,

      nonces: {},
      runtime: {},
      logs: [],
      customDevices: [],

      set: (key, value) => set({ [key]: value } as Pick<Settings, typeof key>),

      toggleDevice: (id) =>
        set((s) => ({
          selected: s.selected.includes(id) ? s.selected.filter((d) => d !== id) : [...s.selected, id],
        })),

      removeDevice: (id) => set((s) => ({ selected: s.selected.filter((d) => d !== id) })),

      rotate: (id) =>
        set((s) => {
          const pose = s.poses[id] ?? DEFAULT_POSE
          return { poses: { ...s.poses, [id]: { ...pose, landscape: !pose.landscape } } }
        }),

      rotateAll: () =>
        set((s) => {
          const anyPortrait = s.selected.some((id) => !(s.poses[id] ?? DEFAULT_POSE).landscape)
          const poses = { ...s.poses }
          for (const id of s.selected) poses[id] = { ...(poses[id] ?? DEFAULT_POSE), landscape: anyPortrait }
          return { poses }
        }),

      toggleFold: (id) =>
        set((s) => {
          const pose = s.poses[id] ?? DEFAULT_POSE
          return { poses: { ...s.poses, [id]: { ...pose, folded: !pose.folded } } }
        }),

      reload: (id) =>
        set((s) => ({
          nonces: { ...s.nonces, [id]: (s.nonces[id] ?? 0) + 1 },
          runtime: { ...s.runtime, [id]: emptyRuntime },
        })),

      reloadAll: () =>
        set((s) => {
          const nonces = { ...s.nonces }
          for (const id of s.selected) nonces[id] = (nonces[id] ?? 0) + 1
          return { nonces, runtime: {} }
        }),

      togglePanel: (panel) => set((s) => ({ panel: s.panel === panel ? null : panel })),

      markConnected: (id) =>
        set((s) => ({ runtime: { ...s.runtime, [id]: { ...(s.runtime[id] ?? emptyRuntime), connected: true } } })),

      setRoute: (id, route) =>
        set((s) => ({ runtime: { ...s.runtime, [id]: { ...(s.runtime[id] ?? emptyRuntime), route } } })),

      pushLog: (entry) =>
        set((s) => {
          const at = Date.now()
          queueLog({ ...entry, at })
          const logs = [...s.logs, { ...entry, id: ++logSeq, at }].slice(-MAX_LOGS)
          if (entry.level !== "error") return { logs }
          const rt = s.runtime[entry.deviceId] ?? emptyRuntime
          return { logs, runtime: { ...s.runtime, [entry.deviceId]: { ...rt, errors: rt.errors + 1 } } }
        }),

      clearLogs: () => {
        if (isNative) native.logs.clear().catch(() => {})
        set((s) => {
          const runtime: Record<string, DeviceRuntime> = {}
          for (const [id, rt] of Object.entries(s.runtime)) runtime[id] = { ...rt, errors: 0 }
          return { logs: [], runtime }
        })
      },

      loadNative: async () => {
        if (!isNative) return
        const [presets, history] = await Promise.all([native.presets.list(), native.logs.recent(MAX_LOGS)])
        const customDevices = presets.map(presetToSpec)
        setCustomDevices(customDevices)
        logSeq = Math.max(logSeq, ...history.map((l) => l.id))
        set({ customDevices, logs: history.map((l) => ({ ...l, past: true })) })
      },

      savePreset: async (spec) => {
        const { id, name, os, size, dpr, radius, bezel, cutout, insets } = spec
        const kind = spec.kind === "tablet" ? "tablet" : "phone"
        if (isNative) await native.presets.save({ id, name, os, kind, size, dpr, radius, bezel, cutout, insets })
        set((s) => {
          const customDevices = [...s.customDevices.filter((d) => d.id !== spec.id), spec]
          setCustomDevices(customDevices)
          return { customDevices, selected: s.selected.includes(spec.id) ? s.selected : [...s.selected, spec.id] }
        })
      },

      deletePreset: async (id) => {
        if (isNative) await native.presets.remove(id)
        set((s) => {
          const customDevices = s.customDevices.filter((d) => d.id !== id)
          setCustomDevices(customDevices)
          return { customDevices, selected: s.selected.filter((d) => d !== id) }
        })
      },
    }),
    {
      name: "device-lab",
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => (isNative ? sqliteStorage : localStorage)),
      partialize: (s): Settings => ({
        sourceUrl: s.sourceUrl,
        selected: s.selected,
        poses: s.poses,
        scheme: s.scheme,
        fontScale: s.fontScale,
        dir: s.dir,
        spoofPlatform: s.spoofPlatform,
        zoom: s.zoom,
        showChrome: s.showChrome,
        showHinge: s.showHinge,
        syncNav: s.syncNav,
        panel: s.panel,
      }),
    }
  )
)

export function usePose(id: string) {
  return useLab((s) => s.poses[id] ?? DEFAULT_POSE)
}

export function buildConfig(id: string, s: Pick<LabState, "poses" | "scheme" | "fontScale" | "dir" | "spoofPlatform">): PreviewConfig | null {
  const spec = getDevice(id)
  if (!spec) return null
  const pose = s.poses[id] ?? DEFAULT_POSE
  return {
    labOrigin: typeof window === "undefined" ? "" : window.location.origin,
    deviceId: spec.id,
    deviceName: spec.name,
    deviceKind: spec.kind,
    os: spec.os,
    spoofPlatform: s.spoofPlatform,
    scheme: s.scheme,
    fontScale: s.fontScale,
    dir: s.dir,
    insets: getInsets(spec, pose),
    viewport: getViewport(spec, pose),
    dpr: spec.dpr,
    folded: pose.folded && Boolean(spec.cover),
    landscape: pose.landscape,
  }
}
