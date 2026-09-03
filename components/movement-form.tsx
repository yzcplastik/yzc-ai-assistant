"use client"

import { CheckCircle2, Minus, Plus } from "lucide-react"
import { useMemo, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect } from "@/components/native-select"
import { PhotoUpload } from "@/components/photo-upload"
import { StockStatusBadge } from "@/components/status-badge"
import { formatDateTime, formatNumber } from "@/lib/format"
import { useStore } from "@/lib/store"
import { MOVEMENT_LABELS, type MovementType, type ProductCategory } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MovementFormProps {
  types: MovementType[]
  /** Hangi hareket tipinin hangi ürün kategorisini listelediği */
  categoryFor: (type: MovementType) => ProductCategory
  photoHints?: Partial<Record<MovementType, string>>
}

export function MovementForm({ types, categoryFor, photoHints }: MovementFormProps) {
  const { products, warehouses, addMovement } = useStore()
  const [type, setType] = useState<MovementType>(types[0])
  const [productId, setProductId] = useState("")
  const [warehouseId, setWarehouseId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [note, setNote] = useState("")
  const [photo, setPhoto] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const category = categoryFor(type)
  const filteredProducts = useMemo(
    () => products.filter((p) => p.category === category).sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [products, category],
  )
  const selectedProduct = products.find((p) => p.id === productId)

  const changeType = (t: MovementType) => {
    setType(t)
    if (categoryFor(t) !== category) setProductId("")
    setError(null)
    setSuccess(null)
  }

  const changeProduct = (id: string) => {
    setProductId(id)
    const p = products.find((x) => x.id === id)
    if (p) setWarehouseId(p.warehouseId)
  }

  const step = (delta: number) => {
    const current = Number(quantity) || 0
    setQuantity(String(Math.max(0, current + delta)))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!productId) return setError("Lütfen bir ürün seçin.")
    if (!warehouseId) return setError("Lütfen bir depo seçin.")
    const qty = Number(quantity)
    if (!qty || qty <= 0) return setError("Miktar sıfırdan büyük olmalıdır.")

    const result = addMovement({ productId, warehouseId, type, quantity: qty, note, photo })
    if (!result.ok) return setError(result.error)

    const p = products.find((x) => x.id === productId)
    setSuccess(`${MOVEMENT_LABELS[type]} kaydedildi: ${p?.name} · ${formatNumber(qty)} ${p?.unit} · ${formatDateTime(new Date().toISOString())}`)
    setQuantity("")
    setNote("")
    setPhoto(null)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {/* İşlem tipi */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">İşlem Türü</legend>
        <div className={cn("grid gap-2", types.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
          {types.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => changeType(t)}
              className={cn(
                "h-12 rounded-lg border px-2 text-sm font-semibold transition-colors",
                type === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              {MOVEMENT_LABELS[t]}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Ürün */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="product">{category === "hammadde" ? "Hammadde" : "Ürün"}</Label>
        <NativeSelect id="product" value={productId} onChange={(e) => changeProduct(e.target.value)} required>
          <option value="">Seçin...</option>
          {filteredProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code}) — {formatNumber(p.stock)} {p.unit}
            </option>
          ))}
        </NativeSelect>
        {selectedProduct && (
          <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              Mevcut stok: <strong className="text-foreground tabular-nums">{formatNumber(selectedProduct.stock)} {selectedProduct.unit}</strong>
            </span>
            <StockStatusBadge stock={selectedProduct.stock} critical={selectedProduct.criticalLevel} />
          </div>
        )}
      </div>

      {/* Depo */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="warehouse">Depo</Label>
        <NativeSelect id="warehouse" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required>
          <option value="">Seçin...</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name} · {w.location}</option>
          ))}
        </NativeSelect>
      </div>

      {/* Miktar */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="quantity">Miktar {selectedProduct ? `(${selectedProduct.unit})` : ""}</Label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="size-12 shrink-0" aria-label="Azalt" onClick={() => step(-1)}>
            <Minus className="size-5" />
          </Button>
          <Input
            id="quantity"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            placeholder="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-12 text-center text-2xl font-extrabold tabular-nums md:text-2xl"
          />
          <Button type="button" variant="outline" className="size-12 shrink-0" aria-label="Artır" onClick={() => step(1)}>
            <Plus className="size-5" />
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[10, 50, 100, 500].map((n) => (
            <Button key={n} type="button" variant="secondary" className="h-10 text-sm" onClick={() => step(n)}>
              +{n}
            </Button>
          ))}
        </div>
      </div>

      {/* Fotoğraf */}
      <PhotoUpload value={photo} onChange={setPhoto} hint={photoHints?.[type]} />

      {/* Not */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="note">Not (isteğe bağlı)</Label>
        <Textarea
          id="note"
          rows={2}
          placeholder="Tedarikçi, sipariş no, parti no veya açıklama"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-20 text-base"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm font-medium text-success">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          {success}
        </p>
      )}

      <Button type="submit" className="h-14 text-base font-bold">
        {MOVEMENT_LABELS[type]} Kaydet
      </Button>
    </form>
  )
}
