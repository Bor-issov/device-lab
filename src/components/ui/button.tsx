import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// No hover states, no transitions, no borders: press and focus feedback only.
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-sm font-medium whitespace-nowrap select-none outline-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground active:bg-primary/85 focus-visible:bg-primary/85",
        subtle: "bg-muted text-foreground active:bg-accent focus-visible:bg-accent",
        ghost: "bg-transparent text-muted-foreground active:bg-muted focus-visible:bg-muted aria-pressed:bg-muted aria-pressed:text-foreground",
        inverse: "bg-foreground text-background active:bg-foreground/85 focus-visible:bg-foreground/85",
      },
      size: {
        default: "h-8 px-3",
        sm: "h-7 rounded-md px-2.5 text-xs",
        lg: "h-10 px-4",
        icon: "size-8",
        "icon-sm": "size-7 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
