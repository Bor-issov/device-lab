import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AndroidInput } from "@/lib/android/types"
import { isNative, native } from "@/lib/native"

export function useAndroidStatus(enabled: boolean) {
  return useQuery({
    queryKey: ["android-status"],
    queryFn: native.android.status,
    enabled: enabled && isNative,
    refetchInterval: 3000,
  })
}

export function useBootAvd() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: native.android.boot,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["android-status"] }),
  })
}

export function useAndroidInput(serial: string | null) {
  return useMutation({
    mutationFn: (input: AndroidInput) => {
      if (!serial) throw new Error("No device selected")
      return native.android.input(serial, input)
    },
  })
}
