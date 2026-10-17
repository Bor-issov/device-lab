import type { ReactElement } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SetupPanel } from "./setup-panel"

// Bridge install guide, opened from a frame's "no bridge" label.
export function SetupDialog({ trigger }: { trigger: ReactElement }) {
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="px-5 pt-5 pb-4">
          <DialogTitle>Bridge setup</DialogTitle>
          <DialogDescription>For Expo and React Native web apps.</DialogDescription>
        </DialogHeader>
        <div className="scrollbar-quiet min-h-0 overflow-y-auto">
          <SetupPanel />
        </div>
      </DialogContent>
    </Dialog>
  )
}
