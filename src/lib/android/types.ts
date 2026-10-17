// Shapes returned by the Rust android_* commands (src-tauri/src/android).

export type AvdInfo = { name: string; displayName: string; foldable: boolean; device: string | null }
export type AdbDevice = { serial: string; state: string; model: string | null; emulator: boolean }

export type SdkStatus = {
  sdkPath: string | null
  adb: string | null
  emulator: string | null
  avds: AvdInfo[]
  devices: AdbDevice[]
  error: string | null
}

export type AndroidKey = "back" | "home" | "recents" | "power" | "volumeUp" | "volumeDown"

export type AndroidInput =
  | { action: "tap"; x: number; y: number }
  | { action: "swipe"; x: number; y: number; x2: number; y2: number; duration?: number }
  | { action: "key"; key: AndroidKey }
  | { action: "text"; text: string }
  | { action: "rotate" | "fold" | "unfold" | "kill" }
  | { action: "openUrl"; url: string }
