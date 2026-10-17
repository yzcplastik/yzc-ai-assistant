"use client"

import Link from "next/link"
import { ArrowDownToLine, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { StockStatusBadge } from "@/components/status-badge"
import { formatDateTime, formatNumber, stockStatus } from "@/lib/format"
import { useStore } from "@/lib/store"

export function CriticalStockView() {
  const { products, getWarehouse } = useStore()
  const list = products
    .map((p) => ({ ...p, status: stockStatus(p.stock, p.criticalLevel), ratio: p.criticalLevel ? p.stock / p.criticalLevel : 1 }))
    .filter((p) => p.status !== "normal")
    .sort((a, b) => a.ratio - b.ratio)

  const counts = {
    tukendi: list.filter((p) => p.status === "tukendi").length,
    kritik: list.filter((p) => p.status === "kritik").length,
    dusuk: list.filter((p) => p.status === "dusuk").length,
  }

  return (
    <>
      <PageHeader
        title="Kritik Stoklar"
        description="Kritik seviyenin altına düşen veya yaklaşan ürünler. Sipariş planlaması için takip edin."
        actions={
          <Button className="h-11" nativeButton={false} render={<Link href="/stok-giris" />}>
            <ArrowDownToLine className="size-4" /> Stok Girişi Yap
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <SummaryTile label="Tükendi" value={counts.tukendi} className="bg-destructive/10 text-destructive" />
        <SummaryTile label="Kritik" value={counts.kritik} className="bg-warning/20 text-warning-foreground" />
        <SummaryTile label="Düşük" value={counts.dusuk} className="bg-accent text-accent-foreground" />
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <CheckCircle2 className="size-10 text-success" aria-hidden />
            <p className="font-semibold">Tüm stoklar güvenli seviyede.</p>
            <p className="text-sm text-muted-foreground">Kritik seviyenin altında ürün bulunmuyor.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((p) => {
            const pct = Math.min(100, Math.round(p.ratio * 100))
            const barClass = p.status === "tukendi" ? "bg-destructive" : p.status === "kritik" ? "bg-warning" : "bg-primary"
            return (
              <li key={p.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-extrabold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.code} · {getWarehouse(p.warehouseId)?.name} · {p.category === "hammadde" ? "Hammadde" : "Ürün"}
                    </p>
                  </div>
                  <StockStatusBadge stock={p.stock} critical={p.criticalLevel} />
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Mevcut / Kritik</span>
                    <span className="text-xl font-extrabold tabular-nums">
                      {formatNumber(p.stock)} <span className="text-sm font-semibold text-muted-foreground">/ {formatNumber(p.criticalLevel)} {p.unit}</span>
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground">Eksik</span>
                    <span className="font-bold tabular-nums text-destructive">
                      {formatNumber(Math.max(0, p.criticalLevel - p.stock))} {p.unit}
                    </span>
                  </div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${p.name} stok doluluk oranı`}>
                  <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Son hareket: {formatDateTime(p.updatedAt)}</p>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

function SummaryTile({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-1 rounded-xl p-4 ${className}`}>
      <span className="text-3xl font-extrabold tabular-nums">{value}</span>
      <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
    </div>
  )
}
