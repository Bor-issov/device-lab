"use client"

import { useEffect, useMemo, useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { FoldHorizontal, RotateCcw, RotateCw, UnfoldHorizontal, X } from "lucide-react"
import { getDevice, getHinge, getInsets, getViewport, isFoldable } from "@/lib/devices"
import { buildFrameUrl, postToFrame, registerFrame } from "@/lib/frames"
import { LAB_SOURCE, WINDOW_NAME_PREFIX } from "@/lib/protocol"
import { buildConfig, useLab, usePose } from "@/lib/store"
import { Dot, IconButton } from "@/components/ui/dashboard/primitives/controls"
import { BezelCamera, Chin, Cutout, Hinge, HomeIndicator, SideKeys } from "./hardware"
import { StatusBar } from "./status-bar"

gsap.registerPlugin(useGSAP)

type Geometry = { outerW: number; outerH: number; screenW: number; screenH: number; screenX: number; screenY: number }

export function DeviceFrame({ id }: { id: string }) {
  const spec = getDevice(id)
  const pose = usePose(id)
  const zoom = useLab((s) => s.zoom)
  const sourceUrl = useLab((s) => s.sourceUrl)
  const scheme = useLab((s) => s.scheme)
  const fontScale = useLab((s) => s.fontScale)
  const dir = useLab((s) => s.dir)
  const spoofPlatform = useLab((s) => s.spoofPlatform)
  const showChrome = useLab((s) => s.showChrome)
  const showHinge = useLab((s) => s.showHinge)
  const nonce = useLab((s) => s.nonces[id] ?? 0)
  const runtime = useLab((s) => s.runtime[id])
  const { rotate, toggleFold, reload, removeDevice } = useLab.getState()

  const figureRef = useRef<HTMLElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const prevGeo = useRef<Geometry | null>(null)

  const config = useMemo(
    () => buildConfig(id, { poses: { [id]: pose }, scheme, fontScale, dir, spoofPlatform }),
    [id, pose, scheme, fontScale, dir, spoofPlatform]
  )
  const configJson = JSON.stringify(config)
  const src = useMemo(() => buildFrameUrl(sourceUrl, id), [sourceUrl, id])

  useEffect(() => {
    if (config) postToFrame(id, { source: LAB_SOURCE, type: "config", config })
    // configJson captures every field that matters to the frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, configJson])

  useEffect(() => () => registerFrame(id, null), [id])

  const geo: Geometry | null = useMemo(() => {
    if (!spec) return null
    const vp = getViewport(spec, pose)
    const chin = spec.chin ?? 0
    const padX = spec.bezel + (pose.landscape ? chin : 0)
    const padY = spec.bezel + (pose.landscape ? 0 : chin)
    return { outerW: vp.width + padX * 2, outerH: vp.height + padY * 2, screenW: vp.width, screenH: vp.height, screenX: padX, screenY: padY }
  }, [spec, pose])

  // Entrance.
  useGSAP(
    () => {
      gsap.from(figureRef.current, { autoAlpha: 0, y: 24, duration: 0.7, ease: "power3.out" })
    },
    { scope: figureRef }
  )

  // Rotate / fold: tween every box from its previous geometry to the one React just rendered.
  useGSAP(
    () => {
      const prev = prevGeo.current
      prevGeo.current = geo
      if (!prev || !geo || (prev.screenW === geo.screenW && prev.screenH === geo.screenH)) return
      const tween = { duration: 0.55, ease: "power3.inOut" }
      gsap.from(boxRef.current, { width: prev.outerW * zoom, height: prev.outerH * zoom, ...tween })
      gsap.from(bodyRef.current, { width: prev.outerW, height: prev.outerH, ...tween })
      gsap.from(screenRef.current, { width: prev.screenW, height: prev.screenH, left: prev.screenX, top: prev.screenY, ...tween })
    },
    { dependencies: [geo?.screenW, geo?.screenH] }
  )

  if (!spec || !geo || !config) return null

  const insets = getInsets(spec, pose)
  const hinge = getHinge(spec, pose)
  const outerRadius = spec.radius ? spec.radius + spec.bezel : spec.bezel * 3

  return (
    <figure ref={figureRef} className="flex flex-col items-center gap-5" data-device-frame={id}>
      <div ref={boxRef} className="relative" style={{ width: geo.outerW * zoom, height: geo.outerH * zoom }}>
        <div
          ref={bodyRef}
          className="absolute top-0 left-0 origin-top-left"
          style={{ width: geo.outerW, height: geo.outerH, transform: `scale(${zoom})` }}
        >
          <SideKeys spec={spec} pose={pose} width={geo.outerW} height={geo.outerH} />
          <div
            data-device-shell={id}
            data-radius={outerRadius * zoom}
            className="absolute inset-0 bg-bezel"
            style={{ borderRadius: outerRadius }}
          >
            <Chin spec={spec} pose={pose} width={geo.outerW} height={geo.outerH} />
            <BezelCamera spec={spec} pose={pose} bezel={spec.bezel} />
            <div
              ref={screenRef}
              className="absolute overflow-hidden bg-stage"
              style={{ left: geo.screenX, top: geo.screenY, width: geo.screenW, height: geo.screenH, borderRadius: spec.radius }}
            >
              <iframe
                key={`${nonce}-${spoofPlatform}-${src}`}
                ref={(el) => registerFrame(id, el)}
                src={src}
                name={`${WINDOW_NAME_PREFIX}${configJson}`}
                title={`${spec.name} preview`}
                allow="clipboard-write; fullscreen"
                className="block size-full bg-stage"
              />
              {showChrome && <StatusBar spec={spec} pose={pose} scheme={scheme} insetTop={insets.top} />}
              {showChrome && <HomeIndicator spec={spec} pose={pose} scheme={scheme} />}
              {hinge && showHinge && <Hinge axis={hinge} />}
              <Cutout spec={spec} pose={pose} />
            </div>
          </div>
        </div>
      </div>

      <figcaption className="flex flex-col items-center gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-medium text-foreground">{spec.name}</span>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {geo.screenW} × {geo.screenH}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-2 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <Dot on={Boolean(runtime?.connected)} />
            {runtime?.connected ? (runtime.route ?? "/") : "no bridge"}
            {runtime?.errors ? <span className="text-foreground">· {runtime.errors} err</span> : null}
          </span>
          <IconButton label="Rotate" onClick={() => rotate(id)}>
            <RotateCw />
          </IconButton>
          {isFoldable(spec) && (
            <IconButton label={pose.folded ? "Unfold" : "Fold"} onClick={() => toggleFold(id)} pressed={pose.folded}>
              {pose.folded ? <UnfoldHorizontal /> : <FoldHorizontal />}
            </IconButton>
          )}
          <IconButton label="Reload" onClick={() => reload(id)}>
            <RotateCcw />
          </IconButton>
          <IconButton label="Remove" onClick={() => removeDevice(id)}>
            <X />
          </IconButton>
        </div>
      </figcaption>
    </figure>
  )
}
