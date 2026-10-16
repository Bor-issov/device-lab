"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { SdkStatus } from "@/lib/android/sdk"

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
  return data
}

export function useAndroidStatus(enabled: boolean) {
  return useQuery({
    queryKey: ["android-status"],
    queryFn: async (): Promise<SdkStatus> => {
      const res = await fetch("/api/android/status", { cache: "no-store" })
      if (!res.ok) throw new Error(`Status failed (${res.status})`)
      return res.json()
    },
    enabled,
    refetchInterval: 3000,
  })
}

export function useBootAvd() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (avd: string) => postJson("/api/android/boot", { avd }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["android-status"] }),
  })
}

export type AndroidInput =
  | { action: "tap"; x: number; y: number }
  | { action: "swipe"; x: number; y: number; x2: number; y2: number; duration?: number }
  | { action: "key"; key: "back" | "home" | "recents" | "power" | "volumeUp" | "volumeDown" }
  | { action: "text"; text: string }
  | { action: "rotate" | "fold" | "unfold" | "kill" }
  | { action: "openUrl"; url: string }

export function useAndroidInput(serial: string | null) {
  return useMutation({
    mutationFn: (input: AndroidInput) => postJson("/api/android/input", { serial, ...input }),
  })
}
