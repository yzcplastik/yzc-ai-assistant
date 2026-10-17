"use client"

import { Camera, Clock, User } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MovementTypeBadge } from "@/components/status-badge"
import { formatDateTime, formatNumber } from "@/lib/format"
import { useStore } from "@/lib/store"
import { isInbound, MOVEMENT_LABELS, type Movement } from "@/lib/types"
import { cn } from "@/lib/utils"

export function MovementList({ movements, emptyText = "Henüz hareket yok." }: { movements: Movement[]; emptyText?: string }) {
  const { getProduct, getWarehouse } = useStore()
  const [selected, setSelected] = useState<Movement | null>(null)

  if (movements.length === 0) {
    return <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{emptyText}</p>
  }

  return (
    <>
      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {movements.map((m) => {
          const product = getProduct(m.productId)
          const warehouse = getWarehouse(m.warehouseId)
          const inbound = isInbound(m.type)
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setSelected(m)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
              >
                {m.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photo} alt="" className="size-12 shrink-0 rounded-lg border border-border object-cover" />
                ) : (
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Camera className="size-5" aria-hidden />
                  </span>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{product?.name ?? "Silinmiş ürün"}</span>
                    <MovementTypeBadge type={m.type} className="hidden sm:inline-flex" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" aria-hidden />
                      {formatDateTime(m.createdAt)}
                    </span>
                    <span>{warehouse?.name}</span>
                    <MovementTypeBadge type={m.type} className="sm:hidden" />
                  </div>
                </div>
                <span className={cn("shrink-0 text-base font-extrabold tabular-nums", inbound ? "text-success" : "text-destructive")}>
                  {inbound ? "+" : "−"}
                  {formatNumber(m.quantity)}
                  <span className="ml-1 text-xs font-semibold text-muted-foreground">{product?.unit}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          {selected && (
            <MovementDetail movement={selected} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function MovementDetail({ movement }: { movement: Movement }) {
  const { getProduct, getWarehouse } = useStore()
  const product = getProduct(movement.productId)
  const warehouse = getWarehouse(movement.warehouseId)
  const inbound = isInbound(movement.type)

  return (
    <>
      <DialogHeader>
        <DialogTitle>{MOVEMENT_LABELS[movement.type]}</DialogTitle>
        <DialogDescription>{product?.name}{product?.code ? ` · ${product.code}` : ""}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        {movement.photo ? (
          <figure className="overflow-hidden rounded-xl border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={movement.photo} alt={`${product?.name ?? "Ürün"} hareket fotoğrafı`} className="max-h-80 w-full object-contain" />
            <figcaption className="flex items-center gap-1.5 border-t border-border bg-card px-3 py-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" aria-hidden />
              Çekim / kayıt zamanı: {formatDateTime(movement.createdAt)}
            </figcaption>
          </figure>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">Bu kayıtta fotoğraf yok.</p>
        )}
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Miktar</dt>
            <dd className={cn("text-lg font-extrabold tabular-nums", inbound ? "text-success" : "text-destructive")}>
              {inbound ? "+" : "−"}{formatNumber(movement.quantity)} {product?.unit}
            </dd>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Depo</dt>
            <dd className="font-semibold">{warehouse?.name}</dd>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Tarih / Saat</dt>
            <dd className="font-semibold">{formatDateTime(movement.createdAt)}</dd>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <dt className="flex items-center gap-1 text-xs text-muted-foreground"><User className="size-3" aria-hidden />İşlemi Yapan</dt>
            <dd className="font-semibold">{movement.createdBy}</dd>
          </div>
        </dl>
        {movement.note && (
          <div className="rounded-lg border border-border p-3 text-sm">
            <span className="block text-xs text-muted-foreground">Not</span>
            {movement.note}
          </div>
        )}
      </div>
    </>
  )
}
