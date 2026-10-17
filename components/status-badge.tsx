import { cn } from "@/lib/utils"
import { stockStatus } from "@/lib/format"
import { isInbound, MOVEMENT_LABELS, type MovementType } from "@/lib/types"

const STATUS_STYLES = {
  tukendi: { label: "Tükendi", className: "bg-destructive/10 text-destructive" },
  kritik: { label: "Kritik", className: "bg-warning/20 text-warning-foreground" },
  dusuk: { label: "Düşük", className: "bg-accent text-accent-foreground" },
  normal: { label: "Normal", className: "bg-success/15 text-success" },
} as const

export function StockStatusBadge({ stock, critical, className }: { stock: number; critical: number; className?: string }) {
  const s = STATUS_STYLES[stockStatus(stock, critical)]
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold", s.className, className)}>
      {s.label}
    </span>
  )
}

export function MovementTypeBadge({ type, className }: { type: MovementType; className?: string }) {
  const inbound = isInbound(type)
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap",
        type === "iade"
          ? "bg-warning/20 text-warning-foreground"
          : inbound
            ? "bg-success/15 text-success"
            : "bg-destructive/10 text-destructive",
        className,
      )}
    >
      {MOVEMENT_LABELS[type]}
    </span>
  )
}
