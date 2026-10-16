import { Suspense } from "react"
import { DemoApp } from "./demo-app"

export default function DemoPage() {
  return (
    <Suspense>
      <DemoApp />
    </Suspense>
  )
}
