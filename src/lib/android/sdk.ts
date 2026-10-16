// Server-only helpers around adb and the Android emulator. Every call uses execFile (no shell)
// and callers validate serials / AVD names before they reach here.

import { execFile, spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"

const run = promisify(execFile)

export const SERIAL_RE = /^[\w.:-]{1,64}$/
export const AVD_RE = /^[\w.-]{1,64}$/

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

function onPath(bin: string) {
  for (const dir of (process.env.PATH ?? "").split(path.delimiter)) {
    const candidate = path.join(/*turbopackIgnore: true*/ dir, bin)
    if (dir && existsSync(candidate)) return candidate
  }
  return null
}

export function resolveTools() {
  const sdkPath =
    [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, path.join(/*turbopackIgnore: true*/ os.homedir(), "Android", "Sdk"), "/opt/android-sdk"]
      .filter((p): p is string => Boolean(p))
      .find((p) => existsSync(p)) ?? null

  const fromSdk = (...parts: string[]) => {
    if (!sdkPath) return null
    const p = path.join(/*turbopackIgnore: true*/ sdkPath, ...parts)
    return existsSync(p) ? p : null
  }

  return {
    sdkPath,
    adb: fromSdk("platform-tools", "adb") ?? onPath("adb"),
    emulator: fromSdk("emulator", "emulator") ?? onPath("emulator"),
  }
}

function avdHome() {
  return process.env.ANDROID_AVD_HOME ?? path.join(/*turbopackIgnore: true*/ os.homedir(), ".android", "avd")
}

async function readAvdConfig(name: string) {
  try {
    const raw = await readFile(path.join(/*turbopackIgnore: true*/ avdHome(), `${name}.avd`, "config.ini"), "utf8")
    const map = new Map<string, string>()
    for (const line of raw.split("\n")) {
      const i = line.indexOf("=")
      if (i > 0) map.set(line.slice(0, i).trim(), line.slice(i + 1).trim())
    }
    return map
  } catch {
    return new Map<string, string>()
  }
}

export async function listAvds(emulator: string): Promise<AvdInfo[]> {
  const { stdout } = await run(emulator, ["-list-avds"], { timeout: 10_000 })
  const names = stdout
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && AVD_RE.test(l))

  return Promise.all(
    names.map(async (name) => {
      const cfg = await readAvdConfig(name)
      return {
        name,
        displayName: cfg.get("avd.ini.displayname") ?? name.replaceAll("_", " "),
        foldable: cfg.get("hw.sensor.hinge") === "yes",
        device: cfg.get("hw.device.name") ?? null,
      }
    })
  )
}

export async function listDevices(adb: string): Promise<AdbDevice[]> {
  const { stdout } = await run(adb, ["devices", "-l"], { timeout: 10_000 })
  return stdout
    .split("\n")
    .slice(1)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [serial, state, ...rest] = line.split(/\s+/)
      const model = rest.find((p) => p.startsWith("model:"))?.slice(6).replaceAll("_", " ") ?? null
      return { serial, state, model, emulator: serial.startsWith("emulator-") }
    })
    .filter((d) => SERIAL_RE.test(d.serial))
}

export async function getStatus(): Promise<SdkStatus> {
  const tools = resolveTools()
  const status: SdkStatus = { ...tools, avds: [], devices: [], error: null }
  try {
    if (tools.emulator) status.avds = await listAvds(tools.emulator)
    if (tools.adb) status.devices = await listDevices(tools.adb)
  } catch (err) {
    status.error = err instanceof Error ? err.message : String(err)
  }
  return status
}

export function bootAvd(emulator: string, avd: string) {
  const child = spawn(emulator, ["-avd", avd, "-no-window", "-no-audio", "-no-boot-anim"], {
    detached: true,
    stdio: "ignore",
  })
  child.unref()
}

export async function screencap(adb: string, serial: string) {
  const { stdout } = await run(adb, ["-s", serial, "exec-out", "screencap", "-p"], {
    encoding: "buffer",
    maxBuffer: 64 * 1024 * 1024,
    timeout: 10_000,
  })
  return stdout
}

export async function adb(adbPath: string, serial: string, args: string[]) {
  const { stdout } = await run(adbPath, ["-s", serial, ...args], { timeout: 15_000 })
  return stdout
}

// `adb shell` joins its arguments into one command for the device shell, so quote for sh.
export function shellQuote(value: string) {
  return `'${value.replaceAll("'", `'\\''`)}'`
}
