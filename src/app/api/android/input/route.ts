import { rejectUnlessLocal } from "@/lib/android/guard"
import { SERIAL_RE, adb, resolveTools, shellQuote } from "@/lib/android/sdk"

const KEYS = { back: "4", home: "3", recents: "187", power: "26", volumeUp: "24", volumeDown: "25" } as const
const URL_RE = /^(exp|exps|https?):\/\/[\w.:/?&=%-]{1,256}$/

type Body =
  | { serial: string; action: "tap"; x: number; y: number }
  | { serial: string; action: "swipe"; x: number; y: number; x2: number; y2: number; duration?: number }
  | { serial: string; action: "key"; key: keyof typeof KEYS }
  | { serial: string; action: "text"; text: string }
  | { serial: string; action: "rotate" | "fold" | "unfold" | "kill" }
  | { serial: string; action: "openUrl"; url: string }

const int = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? String(Math.max(0, Math.round(n))) : null)

function toArgs(body: Body): string[] | null {
  switch (body.action) {
    case "tap": {
      const [x, y] = [int(body.x), int(body.y)]
      return x && y ? ["shell", "input", "tap", x, y] : null
    }
    case "swipe": {
      const pts = [body.x, body.y, body.x2, body.y2].map(int)
      if (pts.some((p) => p === null)) return null
      return ["shell", "input", "swipe", ...(pts as string[]), int(body.duration ?? 250) ?? "250"]
    }
    case "key":
      return body.key in KEYS ? ["shell", "input", "keyevent", KEYS[body.key]] : null
    case "text": {
      if (typeof body.text !== "string" || !body.text || body.text.length > 500) return null
      return ["shell", "input", "text", shellQuote(body.text.replaceAll(" ", "%s"))]
    }
    case "rotate":
      return ["emu", "rotate"]
    case "fold":
      return ["emu", "fold"]
    case "unfold":
      return ["emu", "unfold"]
    case "kill":
      return ["emu", "kill"]
    case "openUrl":
      return URL_RE.test(body.url)
        ? ["shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", shellQuote(body.url)]
        : null
    default:
      return null
  }
}

export async function POST(request: Request) {
  const denied = rejectUnlessLocal(request)
  if (denied) return denied
  const body = (await request.json().catch(() => null)) as Body | null
  if (!body || typeof body.serial !== "string" || !SERIAL_RE.test(body.serial)) {
    return Response.json({ error: "Invalid serial" }, { status: 400 })
  }

  const args = toArgs(body)
  if (!args) return Response.json({ error: "Invalid action" }, { status: 400 })

  const tools = resolveTools()
  if (!tools.adb) return Response.json({ error: "adb not found" }, { status: 404 })

  try {
    const output = await adb(tools.adb, body.serial, args)
    return Response.json({ ok: true, output: output.trim() })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "adb failed" }, { status: 502 })
  }
}
