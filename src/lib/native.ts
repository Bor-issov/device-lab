import { Channel, convertFileSrc, invoke, isTauri } from "@tauri-apps/api/core"
import type { AndroidInput, SdkStatus } from "@/lib/android/types"
import type { DeviceSpec } from "@/lib/devices"
import type { LogLevel } from "@/lib/protocol"

// Typed wrappers around the Rust commands. The UI also runs in a plain browser (`pnpm dev`)
// for quick iteration; there `isNative` is false and callers fall back or hide native features.

export const isNative = isTauri()

async function call<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(cmd, args)
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err))
  }
}

export type StoredLog = { id: number; deviceId: string; level: LogLevel; message: string; at: number }
export type Screenshot = { id: number; deviceId: string; path: string; width: number; height: number; createdAt: number }
export type CaptureRegion = { deviceId: string; x: number; y: number; width: number; height: number; radius: number }
export type Preset = Pick<DeviceSpec, "id" | "name" | "os" | "size" | "dpr" | "radius" | "bezel" | "cutout" | "insets"> & {
  kind: "phone" | "tablet"
}

export const native = {
  settings: {
    load: (key: string) => call<string | null>("settings_load", { key }),
    save: (key: string, value: string) => call<void>("settings_save", { key, value }),
    remove: (key: string) => call<void>("settings_remove", { key }),
  },
  presets: {
    list: () => call<Preset[]>("presets_list"),
    save: (preset: Preset) => call<Preset>("preset_save", { preset }),
    remove: (id: string) => call<void>("preset_delete", { id }),
  },
  logs: {
    recent: (limit: number) => call<StoredLog[]>("logs_recent", { limit }),
    append: (entries: Omit<StoredLog, "id">[]) => call<void>("logs_append", { entries }),
    clear: () => call<void>("logs_clear"),
  },
  screenshots: {
    capture: (regions: CaptureRegion[], viewportWidth: number) => call<Screenshot[]>("capture_devices", { regions, viewportWidth }),
    list: (limit: number) => call<Screenshot[]>("screenshots_list", { limit }),
    remove: (id: number) => call<void>("screenshot_delete", { id }),
    src: (path: string) => convertFileSrc(path),
  },
  external: {
    open: (id: string, title: string, width: number, height: number) => call<void>("external_open", { id, title, width, height }),
    close: (id: string) => call<void>("external_close", { id }),
    closeAll: () => call<void>("external_close_all"),
  },
  probe: (url: string) => call<boolean>("probe_url", { url }),
  android: {
    status: () => call<SdkStatus>("android_status"),
    boot: (avd: string) => call<void>("android_boot", { avd }),
    input: (serial: string, input: AndroidInput) => call<string>("android_input", { serial, input }),
    /** Starts the adb screencap stream; returns a stop function. */
    stream: async (serial: string, onFrame: (png: ArrayBuffer) => void) => {
      const channel = new Channel<ArrayBuffer>()
      channel.onmessage = onFrame
      const id = await call<number>("android_screen_start", { serial, onFrame: channel })
      return () => {
        channel.onmessage = () => {}
        void call<void>("android_screen_stop", { id })
      }
    },
  },
}
