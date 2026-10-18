import { create } from "zustand"
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware"
import {
  canRotate,
  DEFAULT_POSE,
  DEFAULT_SELECTION,
  getDevice,
  getDpr,
  getInsets,
  getViewport,
  isComputer,
  isFolded,
  MM_PER_INCH,
  nextFold,
  normalizePose,
  REPLACED_IDS,
  setCustomDevices,
  specFromPreset,
  type DevicePose,
  type DeviceSpec,
  type Preset,
} from "@/lib/devices"
import { isNative, native, type StoredLog } from "@/lib/native"
import type { ColorScheme, LogLevel, PreviewConfig, TextDirection } from "@/lib/protocol"
import { externalIdFromPath } from "@/lib/router"

export type PanelId = "android" | "logs" | "shots"

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
  /** Selected devices currently moved outside into their own window. */
  external: string[]
  /** CSS px per real millimetre on this screen; zoom 1 draws every device at its real size. */
  pxPerMm: number
}

type Actions = {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  toggleDevice: (id: string) => void
  removeDevice: (id: string) => void
  setExternal: (id: string, on: boolean) => void
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
  savePreset: (preset: Preset) => Promise<void>
  deletePreset: (id: string) => Promise<void>
}

export type LabState = Settings & Runtime & Actions

// The CSS reference pixel is 1/96 inch; used until the monitor reports its physical size.
export const CSS_PX_PER_MM = 96 / MM_PER_INCH
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

// External frame windows mirror state pushed by the Lab and never write settings themselves.
const readOnly = typeof window !== "undefined" && externalIdFromPath(window.location.pathname) !== null

const sqliteStorage: StateStorage = {
  getItem: (name) => native.settings.load(name),
  setItem: (name, value) => {
    if (readOnly) return
    pendingWrite = { name, value }
    clearTimeout(writeTimer)
    writeTimer = setTimeout(flushSettings, 250)
  },
  removeItem: (name) => native.settings.remove(name),
}

if (isNative && !readOnly) window.addEventListener("beforeunload", flushSettings)

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
      zoom: 0.8,
      showChrome: true,
      showHinge: true,
      syncNav: false,
      panel: null,

      nonces: {},
      runtime: {},
      logs: [],
      customDevices: [],
      external: [],
      pxPerMm: CSS_PX_PER_MM,

      set: (key, value) => set({ [key]: value } as Pick<Settings, typeof key>),

      toggleDevice: (id) =>
        set((s) => ({
          selected: s.selected.includes(id) ? s.selected.filter((d) => d !== id) : [...s.selected, id],
        })),

      removeDevice: (id) => set((s) => ({ selected: s.selected.filter((d) => d !== id) })),

      setExternal: (id, on) =>
        set((s) => (s.external.includes(id) === on ? s : { external: on ? [...s.external, id] : s.external.filter((d) => d !== id) })),

      rotate: (id) =>
        set((s) => {
          const spec = getDevice(id)
          if (spec && !canRotate(spec)) return s
          const pose = s.poses[id] ?? DEFAULT_POSE
          return { poses: { ...s.poses, [id]: { ...pose, landscape: !pose.landscape } } }
        }),

      rotateAll: () =>
        set((s) => {
          const rotatable = s.selected.filter((id) => {
            const spec = getDevice(id)
            return spec ? canRotate(spec) : false
          })
          const anyPortrait = rotatable.some((id) => !(s.poses[id] ?? DEFAULT_POSE).landscape)
          const poses = { ...s.poses }
          for (const id of rotatable) poses[id] = { ...(poses[id] ?? DEFAULT_POSE), landscape: anyPortrait }
          return { poses }
        }),

      toggleFold: (id) =>
        set((s) => {
          const spec = getDevice(id)
          if (!spec) return s
          const pose = s.poses[id] ?? DEFAULT_POSE
          return { poses: { ...s.poses, [id]: { ...pose, fold: nextFold(spec, pose) } } }
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
        const [presets, history, pxPerMm] = await Promise.all([
          native.presets.list(),
          native.logs.recent(MAX_LOGS),
          native.screenPxPerMm().catch(() => null),
        ])
        const customDevices = presets.map(specFromPreset)
        setCustomDevices(customDevices)
        logSeq = Math.max(logSeq, ...history.map((l) => l.id))
        set({ customDevices, logs: history.map((l) => ({ ...l, past: true })), pxPerMm: pxPerMm ?? CSS_PX_PER_MM })
      },

      savePreset: async (preset) => {
        if (isNative) await native.presets.save(preset)
        const spec = specFromPreset(preset)
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
      version: 2,
      migrate: (persisted, version) => (version < 2 ? migrateCatalog(persisted as Partial<Settings>) : persisted) as Settings,
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

// v2: retired devices map to their successors, `folded` becomes a fold index, and zoom now means
// real size (1 = the physical device), so the old point-based zoom is dropped.
function migrateCatalog(old: Partial<Settings>): Partial<Settings> {
  const current = (id: string) => REPLACED_IDS[id] ?? id
  const selected = [...new Set((old.selected ?? DEFAULT_SELECTION).map(current))]
  const poses: Record<string, DevicePose> = {}
  for (const [id, pose] of Object.entries(old.poses ?? {})) poses[current(id)] = normalizePose(pose, getDevice(current(id)))
  const next = { ...old, selected, poses }
  delete next.zoom
  return next
}

export function usePose(id: string) {
  return useLab((s) => s.poses[id] ?? DEFAULT_POSE)
}

export function buildConfig(id: string, s: Pick<LabState, "poses" | "scheme" | "fontScale" | "dir" | "spoofPlatform">): PreviewConfig | null {
  const spec = getDevice(id)
  if (!spec) return null
  const pose = s.poses[id] ?? DEFAULT_POSE
  const computer = isComputer(spec)
  return {
    labOrigin: typeof window === "undefined" ? "" : window.location.origin,
    deviceId: spec.id,
    deviceName: spec.name,
    // The bridge protocol knows four kinds and two systems: a trifold reports as a fold, and a Mac
    // reports as a tablet that never spoofs Platform.OS (its browser is the web).
    deviceKind: spec.kind === "trifold" ? "fold" : spec.kind === "laptop" || spec.kind === "desktop" ? "tablet" : spec.kind,
    os: spec.os === "macos" ? "ios" : spec.os,
    spoofPlatform: s.spoofPlatform && !computer,
    scheme: s.scheme,
    fontScale: s.fontScale,
    dir: s.dir,
    insets: getInsets(spec, pose),
    viewport: getViewport(spec, pose),
    dpr: getDpr(spec, pose),
    folded: isFolded(spec, pose),
    landscape: pose.landscape,
  }
}
