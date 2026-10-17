import { ChevronDown } from "lucide-react"
import type { SelectHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

/** Mobil cihazlarda yerel seçim ekranını açan, dokunmaya uygun select. */
export function NativeSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-12 w-full appearance-none rounded-lg border border-input bg-card px-3 pr-10 text-base font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  )
}
