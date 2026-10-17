import { StrictMode, lazy, Suspense } from "react"
import { createRoot } from "react-dom/client"
import "@fontsource-variable/geist"
import "@fontsource-variable/geist-mono"
import "@/styles/globals.css"
import { Providers } from "@/providers"
import { isDemoPath } from "@/lib/router"

// One entry for both pages. Tauri and the Vite dev server fall back to index.html for unknown
// paths, so /demo/* lands here too and renders the built-in demo app instead of the Lab.
const Lab = lazy(() => import("@/components/ui/dashboard/lab/lab").then((m) => ({ default: m.Lab })))
const DemoApp = lazy(() => import("@/demo/demo-app").then((m) => ({ default: m.DemoApp })))

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isDemoPath(window.location.pathname) ? (
      <Suspense>
        <DemoApp />
      </Suspense>
    ) : (
      <Providers>
        <Suspense fallback={<main className="h-full w-full bg-background" />}>
          <Lab />
        </Suspense>
      </Providers>
    )}
  </StrictMode>
)
