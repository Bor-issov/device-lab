// These routes drive adb on this machine. Only accept same-origin JSON requests to a loopback host,
// so other sites (simple text/plain POSTs) and LAN clients cannot reach them.

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]", "::1"])

export function rejectUnlessLocal(request: Request): Response | null {
  const host = request.headers.get("host") ?? ""
  const hostname = host.replace(/:\d+$/, "")
  if (!LOOPBACK.has(hostname)) return Response.json({ error: "Loopback only" }, { status: 403 })

  if (request.method !== "GET") {
    const origin = request.headers.get("origin")
    if (origin && new URL(origin).host !== host) return Response.json({ error: "Cross-origin" }, { status: 403 })
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ error: "Expected JSON" }, { status: 415 })
    }
  }
  return null
}
