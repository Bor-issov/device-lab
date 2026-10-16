"use client"

import { useQuery } from "@tanstack/react-query"

// no-cors fetch resolves (opaque) when something answers and rejects when nothing is listening.
export function useDevServer(sourceUrl: string) {
  return useQuery({
    queryKey: ["dev-server", sourceUrl],
    queryFn: async () => {
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
