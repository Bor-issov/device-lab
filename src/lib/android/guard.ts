// These routes drive adb on this machine. The real boundary is the server binding: `pnpm dev` / `pnpm start`
// listen on 127.0.0.1 only, so LAN clients cannot connect at all. The Host check below is defence in depth
// against DNS rebinding; Origin + JSON content type stop cross-site browser requests.

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]", "::1"])

export function rejectUnlessLocal(request: Request): Response | null {
  const host = request.headers.get("host") ?? ""
  const hostname = host.replace(/:\d+$/, "")
  if (!LOOPBACK.has(hostname)) return Response.json({ error: "Loopback only" }, { status: 403 })

  // Behind a reverse proxy, refuse anything forwarded for a non-loopback client.
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded && forwarded.split(",").some((ip) => !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(ip.trim()))) {
    return Response.json({ error: "Loopback only" }, { status: 403 })
  }

  if (request.method !== "GET") {
    const origin = request.headers.get("origin")
    if (origin && new URL(origin).host !== host) return Response.json({ error: "Cross-origin" }, { status: 403 })
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ error: "Expected JSON" }, { status: 415 })
    }
  }
  return null
}
