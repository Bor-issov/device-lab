import { useEffect, useMemo, useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { FoldHorizontal, RotateCcw, RotateCw, SquareArrowOutUpRight, UnfoldHorizontal, X } from "lucide-react"
import { canRotate, getDevice, getFootprint, getGeometry, getHinges, getInsets, getPanel, getViewport, isComputer, isFoldable, isFolded, nextFold } from "@/lib/devices"
import { moveOutside } from "@/lib/external"
import { buildFrameUrl, postToFrame, registerFrame } from "@/lib/frames"
import { isNative } from "@/lib/native"
import { LAB_SOURCE, WINDOW_NAME_PREFIX } from "@/lib/protocol"
import { buildConfig, useLab, usePose } from "@/lib/store"
import { Dot, IconButton } from "@/components/ui/dashboard/primitives/controls"
import { SetupDialog } from "@/components/ui/dashboard/setup-panel/setup-dialog"
import { BezelCamera, Cutout, Hinges, HomeIndicator, ImacStand, LaptopBase, SideKeys } from "./hardware"
import { StatusBar } from "./status-bar"

gsap.registerPlugin(useGSAP)

// Everything in screen px: real millimetres times px per mm times zoom.
type Layout = {
  pose: string
  k: number
  boxW: number
  boxH: number
  bodyX: number
  bodyW: number
  bodyH: number
  screenX: number
  screenY: number
  screenW: number
  screenH: number
  /** Screen px per CSS px of the page inside. */
  scale: number
}

/** `bare` drops the caption: external windows draw their own bar above the shell. */
export function DeviceFrame({ id, bare = false }: { id: string; bare?: boolean }) {
  const spec = getDevice(id)
  const pose = usePose(id)
  const zoom = useLab((s) => s.zoom)
  const pxPerMm = useLab((s) => s.pxPerMm)
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
  const pageRef = useRef<HTMLDivElement>(null)
  const prevLayout = useRef<Layout | null>(null)

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

  const vp = spec ? getViewport(spec, pose) : null

  const layout: Layout | null = useMemo(() => {
    if (!spec) return null
    const k = pxPerMm * zoom
    const { body, screen, mmPerPx } = getGeometry(spec, pose)
    const foot = getFootprint(spec, pose)
    return {
      pose: `${pose.landscape}-${pose.fold}`,
      k,
      boxW: foot.width * k,
      boxH: foot.height * k,
      bodyX: ((foot.width - body.width) / 2) * k,
      bodyW: body.width * k,
      bodyH: body.height * k,
      screenX: screen.x * k,
      screenY: screen.y * k,
      screenW: screen.width * k,
      screenH: screen.height * k,
      scale: mmPerPx * k,
    }
  }, [spec, pose, pxPerMm, zoom])

  // Entrance.
  useGSAP(
    () => {
      gsap.from(figureRef.current, { autoAlpha: 0, y: 24, duration: 0.7, ease: "power3.out" })
    },
    { scope: figureRef }
  )

  // Rotate / fold: the page inside takes its new viewport at once (one resize, like the real
  // device), while the hardware tweens from its previous shape. Zoom changes snap.
  useGSAP(
    () => {
      const prev = prevLayout.current
      prevLayout.current = layout
      if (!prev || !layout || prev.pose === layout.pose || prev.k !== layout.k) return
      const tween = { duration: 0.55, ease: "power3.inOut" }
      gsap.from(boxRef.current, { width: prev.boxW, height: prev.boxH, ...tween })
      gsap.from(bodyRef.current, { left: prev.bodyX, width: prev.bodyW, height: prev.bodyH, ...tween })
      gsap.from(screenRef.current, { left: prev.screenX, top: prev.screenY, width: prev.screenW, height: prev.screenH, ...tween })
      gsap.from(pageRef.current, { opacity: 0, duration: 0.35, delay: 0.2, ease: "power2.out" })
    },
    { dependencies: [layout?.pose, layout?.k] }
  )

  if (!spec || !layout || !vp || !config) return null

  const insets = getInsets(spec, pose)
  const hinges = getHinges(spec, pose)
  const panel = getPanel(spec, pose)
  const computer = isComputer(spec)
  const screenRadius = spec.radius * layout.scale
  const outerRadius = computer ? Math.max(screenRadius, 3 * layout.k) : screenRadius + Math.min(layout.screenX, layout.screenY)
  const shellRadius = spec.kind === "laptop" ? `${outerRadius}px ${outerRadius}px ${outerRadius * 0.3}px ${outerRadius * 0.3}px` : outerRadius
  const next = isFoldable(spec) ? nextFold(spec, pose) : 0
  const foldLabel = next === 0 ? "Unfold" : spec.panels.length > 2 ? `Fold to ${spec.panels[next].label.toLowerCase()}` : "Fold"
  const folded = isFolded(spec, pose)

  return (
    <figure ref={figureRef} className="flex flex-col items-center gap-5" data-device-frame={id}>
      <div ref={boxRef} className="relative" style={{ width: layout.boxW, height: layout.boxH }}>
        <div ref={bodyRef} className="absolute top-0" style={{ left: layout.bodyX, width: layout.bodyW, height: layout.bodyH }}>
          <SideKeys spec={spec} pose={pose} width={layout.bodyW} height={layout.bodyH} pxPerMm={layout.k} />
          <div data-device-shell={id} data-radius={outerRadius} className="absolute inset-0 bg-bezel" style={{ borderRadius: shellRadius }}>
            <BezelCamera spec={spec} pose={pose} x={layout.screenX} y={layout.screenY} pxPerMm={layout.k} />
            <div
              ref={screenRef}
              className="absolute overflow-hidden bg-stage"
              style={{ left: layout.screenX, top: layout.screenY, width: layout.screenW, height: layout.screenH, borderRadius: screenRadius }}
            >
              <div ref={pageRef} className="absolute top-0 left-0 origin-top-left" style={{ width: vp.width, height: vp.height, transform: `scale(${layout.scale})` }}>
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
                {hinges && showHinge && <Hinges axis={hinges.axis} at={hinges.at} />}
                <Cutout spec={spec} pose={pose} />
              </div>
            </div>
          </div>
        </div>
        {spec.kind === "laptop" && <LaptopBase width={layout.bodyW} top={layout.bodyH} pxPerMm={layout.k} />}
        {spec.kind === "desktop" && <ImacStand width={layout.bodyW} top={layout.bodyH} pxPerMm={layout.k} />}
      </div>

      {!bare && (
        <figcaption className="flex flex-col items-center gap-2">
          <div className="flex items-baseline gap-3">
            <span className="text-sm font-medium text-foreground">{spec.name}</span>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {vp.width} × {vp.height} · {panel.inches}&Prime;
            </span>
          </div>
          <div className="flex items-center gap-1">
            {runtime?.connected ? (
              <span className="mr-2 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                <Dot on />
                {runtime.route ?? "/"}
                {runtime.errors ? <span className="text-foreground">· {runtime.errors} err</span> : null}
              </span>
            ) : (
              <SetupDialog
                trigger={
                  <button type="button" className="mr-2 flex cursor-pointer items-center gap-1.5 rounded-md px-1 font-mono text-[11px] text-muted-foreground focus-visible:text-foreground">
                    <Dot on={false} />
                    no bridge
                  </button>
                }
              />
            )}
            {canRotate(spec) && (
              <IconButton label="Rotate" onClick={() => rotate(id)}>
                <RotateCw />
              </IconButton>
            )}
            {isFoldable(spec) && (
              <IconButton label={foldLabel} onClick={() => toggleFold(id)} pressed={folded}>
                {next === 0 ? <UnfoldHorizontal /> : <FoldHorizontal />}
              </IconButton>
            )}
            <IconButton label="Reload" onClick={() => reload(id)}>
              <RotateCcw />
            </IconButton>
            {isNative && (
              <IconButton label="Move outside" onClick={() => void moveOutside(id)}>
                <SquareArrowOutUpRight />
              </IconButton>
            )}
            <IconButton label="Remove" onClick={() => removeDevice(id)}>
              <X />
            </IconButton>
          </div>
        </figcaption>
      )}
    </figure>
  )
}
