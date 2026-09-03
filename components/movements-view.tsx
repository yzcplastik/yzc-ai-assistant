"use client"

import { Search } from "lucide-react"
import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MovementList } from "@/components/movement-list"
import { NativeSelect } from "@/components/native-select"
import { PageHeader } from "@/components/page-header"
import { useStore } from "@/lib/store"
import { MOVEMENT_LABELS, type MovementType } from "@/lib/types"
import { cn } from "@/lib/utils"

type Range = "all" | "today" | "7d" | "30d"
const RANGES: { value: Range; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "today", label: "Bugün" },
  { value: "7d", label: "7 Gün" },
  { value: "30d", label: "30 Gün" },
]

export function MovementsView() {
  const { movements, warehouses, getProduct } = useStore()
  const [query, setQuery] = useState("")
  const [type, setType] = useState<MovementType | "all">("all")
  const [warehouseId, setWarehouseId] = useState("all")
  const [range, setRange] = useState<Range>("all")
  const [onlyPhoto, setOnlyPhoto] = useState(false)

  const filtered = useMemo(() => {
    const now = Date.now()
    const q = query.trim().toLocaleLowerCase("tr")
    return movements.filter((m) => {
      if (type !== "all" && m.type !== type) return false
      if (warehouseId !== "all" && m.warehouseId !== warehouseId) return false
      if (onlyPhoto && !m.photo) return false
      if (range !== "all") {
        const t = new Date(m.createdAt).getTime()
        if (range === "today" && new Date(m.createdAt).toDateString() !== new Date().toDateString()) return false
        if (range === "7d" && now - t > 7 * 86400000) return false
        if (range === "30d" && now - t > 30 * 86400000) return false
      }
      if (q) {
        const p = getProduct(m.productId)
        const hay = `${p?.name ?? ""} ${p?.code ?? ""} ${m.note ?? ""}`.toLocaleLowerCase("tr")
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [movements, type, warehouseId, range, onlyPhoto, query, getProduct])

  return (
    <>
      <PageHeader title="Stok Hareketleri" description={`${filtered.length} kayıt listeleniyor. Detay ve fotoğraf için kayda dokunun.`} />

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            aria-label="Ürün, kod veya not ara"
            placeholder="Ürün, kod veya not ara..."
            className="h-12 pl-9 text-base"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              aria-pressed={range === r.value}
              onClick={() => setRange(r.value)}
              className={cn(
                "h-10 rounded-lg border text-sm font-semibold transition-colors",
                range === r.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ftype" className="text-xs">İşlem Türü</Label>
            <NativeSelect id="ftype" className="h-11" value={type} onChange={(e) => setType(e.target.value as MovementType | "all")}>
              <option value="all">Tümü</option>
              {(Object.keys(MOVEMENT_LABELS) as MovementType[]).map((t) => (
                <option key={t} value={t}>{MOVEMENT_LABELS[t]}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fwh" className="text-xs">Depo</Label>
            <NativeSelect id="fwh" className="h-11" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              <option value="all">Tümü</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </NativeSelect>
          </div>
          <label className="flex h-11 items-center gap-2 self-end rounded-lg border border-border px-3 text-sm font-medium">
            <input type="checkbox" className="size-4 accent-primary" checked={onlyPhoto} onChange={(e) => setOnlyPhoto(e.target.checked)} />
            Sadece fotoğraflı
          </label>
        </div>
      </div>

      <MovementList movements={filtered} emptyText="Filtreye uygun hareket bulunamadı." />
    </>
  )
}
