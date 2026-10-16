import { rejectUnlessLocal } from "@/lib/android/guard"
import { getStatus } from "@/lib/android/sdk"

export async function GET(request: Request) {
  const denied = rejectUnlessLocal(request)
  if (denied) return denied
  return Response.json(await getStatus())
}
