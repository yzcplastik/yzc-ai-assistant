"use client"

import { MapPin, Package, Plus, Warehouse as WarehouseIcon } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/native-select"
import { PageHeader } from "@/components/page-header"
import { StockStatusBadge } from "@/components/status-badge"
import { formatDateTime, formatNumber, stockStatus } from "@/lib/format"
import { useStore } from "@/lib/store"
import type { ProductCategory } from "@/lib/types"

export function WarehousesView() {
  const { warehouses, products } = useStore()
  const [selectedId, setSelectedId] = useState<string>(warehouses[0]?.id ?? "")
  const selected = warehouses.find((w) => w.id === selectedId) ?? warehouses[0]
  const items = products
    .filter((p) => p.warehouseId === selected?.id)
    .sort((a, b) => a.name.localeCompare(b.name, "tr"))

  return (
    <>
      <PageHeader
        title="Depolar"
        description="Depoları ve içerdikleri ürünleri görüntüleyin, yeni depo veya ürün ekleyin."
        actions={
          <>
            <AddWarehouseDialog />
            <AddProductDialog defaultWarehouseId={selected?.id} />
          </>
        }
      />

      {/* Depo seçimi */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {warehouses.map((w) => {
          const wp = products.filter((p) => p.warehouseId === w.id)
          const crit = wp.filter((p) => stockStatus(p.stock, p.criticalLevel) !== "normal").length
          const active = w.id === selected?.id
          return (
            <button
              key={w.id}
              type="button"
              aria-pressed={active}
              onClick={() => setSelectedId(w.id)}
              className={`flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-colors ${
                active ? "border-primary bg-card" : "border-transparent bg-card hover:border-border"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`flex size-9 items-center justify-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <WarehouseIcon className="size-5" aria-hidden />
                </span>
                <span className="font-extrabold">{w.name}</span>
              </div>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5" aria-hidden />
                {w.location}
              </span>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1"><Package className="size-3.5" aria-hidden />{wp.length} kalem</span>
                {crit > 0 && <span className="rounded-full bg-warning/20 px-2 py-0.5 text-warning-foreground">{crit} kritik</span>}
              </div>
            </button>
          )
        })}
      </div>

      {/* Ürün listesi */}
      {selected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{selected.name} · Ürünler</CardTitle>
            {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Bu depoda ürün yok.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {items.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold">{p.name}</p>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                          {p.category === "hammadde" ? "Hammadde" : "Ürün"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.code} · Son güncelleme {formatDateTime(p.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-lg font-extrabold tabular-nums">
                        {formatNumber(p.stock)} <span className="text-xs font-semibold text-muted-foreground">{p.unit}</span>
                      </span>
                      <StockStatusBadge stock={p.stock} critical={p.criticalLevel} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}

function AddWarehouseDialog() {
  const { addWarehouse } = useStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addWarehouse({ name: name.trim(), location: location.trim(), description: description.trim() || undefined })
    setName(""); setLocation(""); setDescription("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="h-11" />}>
        <Plus className="size-4" /> Yeni Depo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Depo</DialogTitle>
          <DialogDescription>Depo adı ve konumunu girin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="wname">Depo Adı</Label>
            <Input id="wname" className="h-11 text-base" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Örn. Yarı Mamul Deposu" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="wloc">Konum</Label>
            <Input id="wloc" className="h-11 text-base" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Örn. Fabrika - 1. Kat" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="wdesc">Açıklama</Label>
            <Input id="wdesc" className="h-11 text-base" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button type="submit" className="h-12 text-base font-bold">Kaydet</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddProductDialog({ defaultWarehouseId }: { defaultWarehouseId?: string }) {
  const { warehouses, addProduct } = useStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [category, setCategory] = useState<ProductCategory>("urun")
  const [unit, setUnit] = useState("adet")
  const [stock, setStock] = useState("0")
  const [critical, setCritical] = useState("100")
  const [warehouseId, setWarehouseId] = useState(defaultWarehouseId ?? warehouses[0]?.id ?? "")

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !warehouseId) return
    addProduct({
      name: name.trim(),
      code: code.trim() || `${category === "hammadde" ? "HM" : "UR"}-${Date.now().toString().slice(-4)}`,
      category,
      unit,
      stock: Math.max(0, Number(stock) || 0),
      criticalLevel: Math.max(0, Number(critical) || 0),
      warehouseId,
    })
    setName(""); setCode(""); setStock("0"); setCritical("100")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o && defaultWarehouseId) setWarehouseId(defaultWarehouseId) }}>
      <DialogTrigger render={<Button className="h-11" />}>
        <Plus className="size-4" /> Yeni Ürün
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Ürün / Hammadde</DialogTitle>
          <DialogDescription>Stok takibine yeni bir kalem ekleyin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            {(["urun", "hammadde"] as ProductCategory[]).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => { setCategory(c); setUnit(c === "hammadde" ? "kg" : "adet") }}
                className={`h-11 rounded-lg border text-sm font-semibold ${category === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
              >
                {c === "urun" ? "Ürün" : "Hammadde"}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pname">Ürün Adı</Label>
            <Input id="pname" className="h-11 text-base" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pcode">Ürün Kodu</Label>
              <Input id="pcode" className="h-11 text-base" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Otomatik" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="punit">Birim</Label>
              <NativeSelect id="punit" className="h-11" value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="adet">adet</option>
                <option value="kg">kg</option>
                <option value="ton">ton</option>
                <option value="palet">palet</option>
                <option value="koli">koli</option>
              </NativeSelect>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pstock">Başlangıç Stoku</Label>
              <Input id="pstock" type="number" inputMode="decimal" min={0} className="h-11 text-base" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pcrit">Kritik Seviye</Label>
              <Input id="pcrit" type="number" inputMode="decimal" min={0} className="h-11 text-base" value={critical} onChange={(e) => setCritical(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pwh">Depo</Label>
            <NativeSelect id="pwh" className="h-11" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </NativeSelect>
          </div>
          <Button type="submit" className="h-12 text-base font-bold">Kaydet</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
