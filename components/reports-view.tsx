"use client"

import { Download } from "lucide-react"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { formatDateTime, formatNumber, formatShortDate, stockStatus } from "@/lib/format"
import { useStore } from "@/lib/store"
import { isInbound, MOVEMENT_LABELS, type MovementType } from "@/lib/types"

export function ReportsView() {
  const { products, warehouses, movements, getProduct, getWarehouse } = useStore()

  const last7 = useMemo(() => {
    const days: { key: string; label: string; in: number; out: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({ key: d.toDateString(), label: formatShortDate(d.toISOString()), in: 0, out: 0 })
    }
    for (const m of movements) {
      const day = days.find((x) => x.key === new Date(m.createdAt).toDateString())
      if (!day) continue
      if (isInbound(m.type)) day.in += m.quantity
      else day.out += m.quantity
    }
    return days
  }, [movements])
  const maxDay = Math.max(1, ...last7.map((d) => Math.max(d.in, d.out)))

  const byType = useMemo(() => {
    const acc = {} as Record<MovementType, { count: number; qty: number }>
    for (const t of Object.keys(MOVEMENT_LABELS) as MovementType[]) acc[t] = { count: 0, qty: 0 }
    for (const m of movements) {
      acc[m.type].count += 1
      acc[m.type].qty += m.quantity
    }
    return acc
  }, [movements])

  const byWarehouse = warehouses.map((w) => {
    const ps = products.filter((p) => p.warehouseId === w.id)
    return {
      ...w,
      items: ps.length,
      urun: ps.filter((p) => p.category === "urun").reduce((s, p) => s + p.stock, 0),
      hammadde: ps.filter((p) => p.category === "hammadde").reduce((s, p) => s + p.stock, 0),
      critical: ps.filter((p) => stockStatus(p.stock, p.criticalLevel) !== "normal").length,
      moves: movements.filter((m) => m.warehouseId === w.id).length,
    }
  })

  const photoCount = movements.filter((m) => m.photo).length

  const exportCsv = () => {
    const header = ["Tarih", "İşlem", "Ürün", "Kod", "Depo", "Miktar", "Birim", "Not", "Fotoğraf", "İşlemi Yapan"]
    const rows = movements.map((m) => {
      const p = getProduct(m.productId)
      return [
        formatDateTime(m.createdAt),
        MOVEMENT_LABELS[m.type],
        p?.name ?? "",
        p?.code ?? "",
        getWarehouse(m.warehouseId)?.name ?? "",
        String(m.quantity),
        p?.unit ?? "",
        m.note ?? "",
        m.photo ? "Var" : "Yok",
        m.createdBy,
      ]
    })
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `plastvit-stok-hareketleri-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHeader
        title="Raporlar"
        description="Depo bazlı stok özeti, işlem türlerine göre dağılım ve haftalık hareket grafiği."
        actions={
          <Button variant="outline" className="h-11" onClick={exportCsv}>
            <Download className="size-4" /> CSV İndir
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Toplam Hareket" value={formatNumber(movements.length)} />
        <Tile label="Fotoğraflı Kayıt" value={formatNumber(photoCount)} />
        <Tile label="Toplam Ürün Stoku" value={formatNumber(products.filter((p) => p.category === "urun").reduce((s, p) => s + p.stock, 0))} sub="adet" />
        <Tile label="Toplam Hammadde" value={formatNumber(products.filter((p) => p.category === "hammadde").reduce((s, p) => s + p.stock, 0))} sub="kg" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Haftalık grafik */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Son 7 Gün · Giriş / Çıkış</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-2" role="img" aria-label="Son 7 günün giriş ve çıkış miktarları">
              {last7.map((d) => (
                <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-40 w-full items-end justify-center gap-1">
                    <div className="w-full max-w-4 rounded-t bg-success" style={{ height: `${(d.in / maxDay) * 100}%` }} title={`Giriş: ${formatNumber(d.in)}`} />
                    <div className="w-full max-w-4 rounded-t bg-destructive" style={{ height: `${(d.out / maxDay) * 100}%` }} title={`Çıkış: ${formatNumber(d.out)}`} />
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground">{d.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-success" />Giriş</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-destructive" />Çıkış</span>
            </div>
          </CardContent>
        </Card>

        {/* İşlem türü dağılımı */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">İşlem Türlerine Göre</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {(Object.keys(byType) as MovementType[]).map((t) => {
                const total = movements.length || 1
                const pct = Math.round((byType[t].count / total) * 100)
                return (
                  <li key={t} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{MOVEMENT_LABELS[t]}</span>
                      <span className="text-muted-foreground tabular-nums">{byType[t].count} işlem · {formatNumber(byType[t].qty)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${isInbound(t) ? (t === "iade" ? "bg-warning" : "bg-success") : "bg-destructive"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Depo tablosu */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Depo Bazlı Özet</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Depo</TableHead>
                <TableHead className="text-right">Kalem</TableHead>
                <TableHead className="text-right">Ürün (adet)</TableHead>
                <TableHead className="text-right">Hammadde (kg)</TableHead>
                <TableHead className="text-right">Kritik</TableHead>
                <TableHead className="text-right">Hareket</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byWarehouse.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-semibold">{w.name}<span className="block text-xs font-normal text-muted-foreground">{w.location}</span></TableCell>
                  <TableCell className="text-right tabular-nums">{w.items}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(w.urun)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(w.hammadde)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {w.critical > 0 ? <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-bold text-warning-foreground">{w.critical}</span> : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{w.moves}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="text-2xl font-extrabold tabular-nums">
        {value} {sub && <span className="text-sm font-semibold text-muted-foreground">{sub}</span>}
      </span>
    </div>
  )
}
