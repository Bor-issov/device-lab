import { useState } from "react"
import { Check, Copy } from "lucide-react"

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="relative rounded-lg bg-background/70">
      {label && <div className="px-3 pt-2.5 font-mono text-[11px] text-muted-foreground">{label}</div>}
      <pre className="px-3 py-2.5 pr-10 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-foreground">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy"}
        className="absolute top-1.5 right-1.5 flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground focus-visible:bg-muted active:bg-muted"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  )
}
