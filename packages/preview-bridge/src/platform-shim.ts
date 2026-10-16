// The babel plugin (babel.js) points `react-native` imports in *app* code at this file on web.
// Libraries in node_modules keep the real react-native-web Platform, so their web code paths stay intact.

import { Platform as WebPlatform } from "react-native"
import { getPreviewConfig } from "./config"

export * from "react-native"

const config = getPreviewConfig()
const os = config?.spoofPlatform ? config.os : null

type Spec<T> = { ios?: T; android?: T; native?: T; web?: T; default?: T }

export const Platform = (
  os
    ? {
        ...WebPlatform,
        OS: os,
        Version: os === "ios" ? "18.0" : 35,
        isPad: os === "ios" && config?.deviceKind === "tablet",
        isTV: false,
        isVision: false,
        select<T>(spec: Spec<T>): T | undefined {
          if (os in spec) return spec[os]
          if ("native" in spec) return spec.native
          return spec.default
        },
      }
    : WebPlatform
) as typeof WebPlatform
