import { useQuery } from "@tanstack/react-query"
import { isNative, native } from "@/lib/native"

// The desktop app probes the port from Rust (the CSP blocks arbitrary fetches). In a plain browser,
// a no-cors fetch resolves (opaque) when something answers and rejects when nothing is listening.
// The built-in demo is served by the Lab itself, so it is always reachable.
export function useDevServer(sourceUrl: string) {
  return useQuery({
    queryKey: ["dev-server", sourceUrl],
    queryFn: async () => {
      if (sourceUrl.startsWith(window.location.origin)) return true
      if (isNative) return native.probe(sourceUrl)
      try {
        await fetch(sourceUrl, { mode: "no-cors", cache: "no-store", signal: AbortSignal.timeout(2500) })
        return true
      } catch {
        return false
      }
    },
    refetchInterval: 5000,
    retry: false,
  })
}
