import { rejectUnlessLocal } from "@/lib/android/guard"
import type { NextRequest } from "next/server"
import { SERIAL_RE, resolveTools, screencap } from "@/lib/android/sdk"

export async function GET(request: NextRequest) {
  const denied = rejectUnlessLocal(request)
  if (denied) return denied
  const serial = request.nextUrl.searchParams.get("serial") ?? ""
  if (!SERIAL_RE.test(serial)) return new Response("Invalid serial", { status: 400 })

  const { adb } = resolveTools()
  if (!adb) return new Response("adb not found", { status: 404 })

  try {
    const png = await screencap(adb, serial)
    return new Response(new Uint8Array(png), {
      headers: { "content-type": "image/png", "cache-control": "no-store" },
    })
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "screencap failed", { status: 502 })
  }
}
