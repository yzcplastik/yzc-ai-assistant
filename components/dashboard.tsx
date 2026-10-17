"use client"

import Link from "next/link"
import { AlertTriangle, ArrowDownToLine, ArrowRight, ArrowUpFromLine, Boxes, Package, Warehouse } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { MovementList } from "@/components/movement-list"
import { StockStatusBadge } from "@/components/status-badge"
import { formatDate, formatNumber, stockStatus } from "@/lib/format"
import { useStore } from "@/lib/store"
import { isInbound } from "@/lib/types"

export function Dashboard() {
  const { products, warehouses, movements } = useStore()

  const today = new Date().toDateString()
  const todaysMovements = movements.filter((m) => new Date(m.createdAt).toDateString() === today)
  const todayIn = todaysMovements.filter((m) => isInbound(m.type)).reduce((s, m) => s + m.quantity, 0)
  const todayOut = todaysMovements.filter((m) => !isInbound(m.type)).reduce((s, m) => s + m.quantity, 0)
  const critical = products
    .filter((p) => stockStatus(p.stock, p.criticalLevel) !== "normal")
    .sort((a, b) => a.stock / a.criticalLevel - b.stock / b.criticalLevel)

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${formatDate(new Date().toISOString())} · Depo durumuna genel bakış`}
      />

      {/* Hızlı işlemler */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Link
          href="/stok-giris"
          className="flex h-20 items-center gap-3 rounded-xl bg-primary px-4 text-primary-foreground transition-colors hover:bg-primary/90 lg:h-24"
        >
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary-foreground/15">
            <ArrowDownToLine className="size-6" aria-hidden />
          </span>
          <span className="flex flex-col">
            <span className="text-base font-extrabold">Stok Girişi</span>
            <span className="text-xs opacity-80">Ürün · Hammadde · İade</span>
          </span>
        </Link>
        <Link
          href="/stok-cikis"
          className="flex h-20 items-center gap-3 rounded-xl border-2 border-primary bg-card px-4 text-foreground transition-colors hover:bg-accent lg:h-24"
        >
          <span className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <ArrowUpFromLine className="size-6" aria-hidden />
          </span>
          <span className="flex flex-col">
            <span className="text-base font-extrabold">Stok Çıkışı</span>
            <span className="text-xs text-muted-foreground">Sevkiyat · Üretime verme</span>
          </span>
        </Link>
      </div>

      {/* Özet kartları */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Package} label="Toplam Ürün Kalemi" value={formatNumber(products.length)} />
        <StatCard icon={Warehouse} label="Depo" value={formatNumber(warehouses.length)} />
        <StatCard icon={ArrowDownToLine} label="Bugünkü Giriş" value={`+${formatNumber(todayIn)}`} tone="success" />
        <StatCard icon={ArrowUpFromLine} label="Bugünkü Çıkış" value={`−${formatNumber(todayOut)}`} tone="destructive" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Kritik stoklar */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-warning-foreground" aria-hidden />
              Kritik Stoklar
              <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-bold text-warning-foreground">{critical.length}</span>
            </CardTitle>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/kritik-stoklar" />}>
              Tümü <ArrowRight className="size-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {critical.length === 0 ? (
              <p className="text-sm text-muted-foreground">Kritik seviyede ürün yok.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {critical.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatNumber(p.stock)} / {formatNumber(p.criticalLevel)} {p.unit}
                      </p>
                    </div>
                    <StockStatusBadge stock={p.stock} critical={p.criticalLevel} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Son hareketler */}
        <div className="flex flex-col gap-3 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Boxes className="size-4 text-primary" aria-hidden />
              Son Hareketler
            </h2>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/hareketler" />}>
              Tümü <ArrowRight className="size-4" />
            </Button>
          </div>
          <MovementList movements={movements.slice(0, 6)} />
        </div>
      </div>
    </>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Package
  label: string
  value: string
  tone?: "default" | "success" | "destructive"
}) {
  const toneClass = tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "text-foreground"
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Icon className="size-4" aria-hidden />
          {label}
        </div>
        <p className={`text-2xl font-extrabold tabular-nums lg:text-3xl ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
