import { rejectUnlessLocal } from "@/lib/android/guard"
import { AVD_RE, bootAvd, resolveTools } from "@/lib/android/sdk"

export async function POST(request: Request) {
  const denied = rejectUnlessLocal(request)
  if (denied) return denied
  const { avd } = (await request.json().catch(() => ({}))) as { avd?: string }
  if (!avd || !AVD_RE.test(avd)) return Response.json({ error: "Invalid AVD name" }, { status: 400 })

  const { emulator } = resolveTools()
  if (!emulator) return Response.json({ error: "Android emulator binary not found" }, { status: 404 })

  bootAvd(emulator, avd)
  return Response.json({ ok: true })
}
