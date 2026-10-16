"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { DEFAULT_SELECTION, getDevice, getInsets, getViewport, type DevicePose } from "@/lib/devices"
import type { ColorScheme, LogLevel, PreviewConfig, TextDirection } from "@/lib/protocol"

export type PanelId = "android" | "logs" | "setup"

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
}

export type LabState = Settings & Runtime & Actions

const DEFAULT_POSE: DevicePose = { landscape: false, folded: false }
const MAX_LOGS = 400
let logSeq = 0

const emptyRuntime: DeviceRuntime = { connected: false, route: null, errors: 0 }

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
          const logs = [...s.logs, { ...entry, id: ++logSeq, at: Date.now() }].slice(-MAX_LOGS)
          if (entry.level !== "error") return { logs }
          const rt = s.runtime[entry.deviceId] ?? emptyRuntime
          return { logs, runtime: { ...s.runtime, [entry.deviceId]: { ...rt, errors: rt.errors + 1 } } }
        }),

      clearLogs: () =>
        set((s) => {
          const runtime: Record<string, DeviceRuntime> = {}
          for (const [id, rt] of Object.entries(s.runtime)) runtime[id] = { ...rt, errors: 0 }
          return { logs: [], runtime }
        }),
    }),
    {
      name: "device-lab",
      version: 1,
      skipHydration: true,
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
