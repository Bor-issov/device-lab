import type { ReactElement, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type IconButtonProps = {
  label: string
  children: ReactNode
  onClick?: () => void
  pressed?: boolean
  disabled?: boolean
  side?: "top" | "bottom" | "left" | "right"
  className?: string
}

export function IconButton({ label, children, onClick, pressed, disabled, side = "bottom", className }: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            aria-pressed={pressed}
            disabled={disabled}
            onClick={onClick}
            className={className}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}

type SegmentedProps<T extends string | number> = {
  label: string
  value: T
  options: { value: T; label: ReactNode; title?: string }[]
  onChange: (value: T) => void
}

export function Segmented<T extends string | number>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.title}
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-6 min-w-8 cursor-pointer rounded-md px-2 text-xs font-medium",
              active ? "bg-foreground text-background" : "text-muted-foreground focus-visible:text-foreground"
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function Toggle({ label, pressed, onChange, icon }: { label: string; pressed: boolean; onChange: (v: boolean) => void; icon?: ReactElement }) {
  return (
    <Button variant="ghost" size="sm" aria-pressed={pressed} onClick={() => onChange(!pressed)} className="gap-1.5">
      {icon}
      {label}
    </Button>
  )
}

export function Dot({ on, className }: { on: boolean; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-1.5 shrink-0 rounded-full", on ? "bg-primary" : "bg-muted-foreground/40", className)} />
}
