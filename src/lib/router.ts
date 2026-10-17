import { useSyncExternalStore } from "react"

// Tiny history router for the demo app: pushState + popstate, nothing else.

const NAV_EVENT = "devicelab:navigate"

export function isDemoPath(pathname: string) {
  return pathname === "/demo" || pathname.startsWith("/demo/")
}

// Frames moved outside the Lab load /external/<device id> in their own window.
export function externalIdFromPath(pathname: string) {
  const match = /^\/external\/([\w-]{1,64})$/.exec(pathname)
  return match ? match[1] : null
}

export function navigate(path: string) {
  if (path === window.location.pathname) return
  window.history.pushState(null, "", path)
  window.dispatchEvent(new Event(NAV_EVENT))
}

function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener)
  window.addEventListener(NAV_EVENT, listener)
  return () => {
    window.removeEventListener("popstate", listener)
    window.removeEventListener(NAV_EVENT, listener)
  }
}

export function usePathname() {
  return useSyncExternalStore(subscribe, () => window.location.pathname)
}
