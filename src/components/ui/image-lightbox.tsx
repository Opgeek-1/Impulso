"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"

interface ImageLightboxProps {
  src: string
  alt?: string
  children: React.ReactNode
}

export function ImageLightbox({ src, alt = "", children }: ImageLightboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className="cursor-zoom-in"
        onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); setOpen(true) } }}
      >
        {children}
      </div>
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop
            className="fixed inset-0 z-[300] bg-black/80 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
          />
          <DialogPrimitive.Popup
            className={cn(
              "fixed inset-0 z-[300] flex items-center justify-center p-6 outline-none cursor-zoom-out",
              "duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
            )}
            onClick={() => setOpen(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}
