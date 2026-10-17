"use client"

import { Pencil, Plus, Search } from "lucide-react"
import { useMemo, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/native-select"
import { PageHeader } from "@/components/page-header"
import { StockStatusBadge } from "@/components/status-badge"
import { formatDateTime, formatNumber } from "@/lib/format"
import { useStore } from "@/lib/store"
import type { Product, ProductCategory } from "@/lib/types"

export function ProductsView() {
  const { products, warehouses, loading } = useStore()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const filtered = useMemo(() => products.filter((p) => {
    const text = `${p.name} ${p.code}`.toLocaleLowerCase("tr")
    return text.includes(query.toLocaleLowerCase("tr")) && (category === "all" || p.category === category)
  }).sort((a, b) => a.name.localeCompare(b.name, "tr")), [products, query, category])

  return <>
    <PageHeader title="Ürünler" description="Ürün ve hammaddeleri tek ekrandan yönetin." actions={<ProductDialog />} />
    <div className="mb-5 flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-3 size-5 text-muted-foreground" aria-hidden /><Input aria-label="Ürün ara" className="h-11 pl-10 text-base" placeholder="Ürün adı veya kodu ara..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      <NativeSelect aria-label="Kategori filtresi" className="h-11 sm:w-44" value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">Tüm kategoriler</option><option value="urun">Ürünler</option><option value="hammadde">Hammaddeler</option></NativeSelect>
    </div>
    <Card><CardContent className="p-0"><div className="hidden grid-cols-[1.6fr_1fr_0.8fr_1fr_1.1fr_auto] gap-4 border-b px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid"><span>Ad / Kod</span><span>Kategori</span><span>Depo</span><span>Stok</span><span>Son güncelleme</span><span /></div>
      {loading ? <p className="p-8 text-center text-sm text-muted-foreground">Ürünler yükleniyor...</p> : filtered.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Aramanızla eşleşen kayıt bulunamadı.</p> : <div className="divide-y">{filtered.map((p) => <ProductRow key={`${p.category}-${p.id}`} product={p} />)}</div>}
    </CardContent></Card>
  </>
}

function ProductRow({ product }: { product: Product }) {
  const { warehouses } = useStore()
  const [open, setOpen] = useState(false)
  const warehouse = warehouses.find((w) => w.id === product.warehouseId)
  return <div className="flex flex-col gap-3 px-5 py-4 md:grid md:grid-cols-[1.6fr_1fr_0.8fr_1fr_1.1fr_auto] md:items-center md:gap-4"><div><p className="font-bold">{product.name}</p><p className="text-xs text-muted-foreground">{product.code || "Kod yok"}</p></div><span className="w-fit rounded-full bg-muted px-2 py-1 text-xs font-semibold">{product.category === "hammadde" ? "Hammadde" : "Ürün"} · {product.unit}</span><span className="text-sm">{warehouse?.name ?? "Depo yok"}</span><div><p className="font-extrabold tabular-nums">{formatNumber(product.stock)} <span className="text-xs font-semibold text-muted-foreground">{product.unit}</span></p><StockStatusBadge stock={product.stock} critical={product.criticalLevel} /></div><span className="text-xs text-muted-foreground">{formatDateTime(product.updatedAt)}</span><Button variant="ghost" size="icon" aria-label={`${product.name} düzenle`} onClick={() => setOpen(true)}><Pencil className="size-4" /></Button><ProductDialog product={product} open={open} onOpenChange={setOpen} /></div>
}

function ProductDialog({ product, open: controlledOpen, onOpenChange }: { product?: Product; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const { warehouses, addProduct, updateProduct } = useStore()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [name, setName] = useState(product?.name ?? "")
  const [code, setCode] = useState(product?.code ?? "")
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? "urun")
  const [unit, setUnit] = useState(product?.unit ?? "adet")
  const [stock, setStock] = useState(String(product?.stock ?? 0))
  const [critical, setCritical] = useState(String(product?.criticalLevel ?? 0))
  const [warehouseId, setWarehouseId] = useState(product?.warehouseId ?? warehouses[0]?.id ?? "")
  const [error, setError] = useState<string | null>(null)
  const submit = async (e: FormEvent) => { e.preventDefault(); setError(null); if (!name.trim() || !warehouseId) return setError("Ürün adı ve depo zorunludur."); const input = { name: name.trim(), code: code.trim(), category, unit, criticalLevel: Math.max(0, Number(critical) || 0), warehouseId }; const result = product ? await updateProduct(product.id, input) : await addProduct({ ...input, stock: Math.max(0, Number(stock) || 0) }); if (!result) return setError("Kayıt yapılamadı. Veritabanı izinlerini kontrol edin."); setOpen(false) }
  return <Dialog open={open} onOpenChange={setOpen}>{!product && <DialogTrigger render={<Button className="h-11" />}><Plus className="size-4" /> Yeni Kayıt</DialogTrigger>}<DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{product ? "Ürünü Düzenle" : "Yeni Ürün / Hammadde"}</DialogTitle><DialogDescription>Stok kartı bilgilerini girin.</DialogDescription></DialogHeader><form onSubmit={submit} className="flex flex-col gap-4"><div className="grid grid-cols-2 gap-2">{(["urun", "hammadde"] as ProductCategory[]).map((c) => <button key={c} type="button" onClick={() => { setCategory(c); setUnit(c === "hammadde" ? "kg" : "adet") }} className={`h-11 rounded-lg border text-sm font-semibold ${category === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>{c === "urun" ? "Ürün" : "Hammadde"}</button>)}</div><div className="flex flex-col gap-2"><Label htmlFor="product-name">Ürün adı</Label><Input id="product-name" value={name} onChange={(e) => setName(e.target.value)} required /></div><div className="grid grid-cols-2 gap-3"><div className="flex flex-col gap-2"><Label htmlFor="product-code">Ürün kodu</Label><Input id="product-code" value={code} onChange={(e) => setCode(e.target.value)} /></div><div className="flex flex-col gap-2"><Label htmlFor="product-unit">Birim</Label><NativeSelect id="product-unit" value={unit} onChange={(e) => setUnit(e.target.value)}><option value="adet">Adet</option><option value="kg">Kg</option></NativeSelect></div></div>{!product && <div className="flex flex-col gap-2"><Label htmlFor="product-stock">Başlangıç stoku</Label><Input id="product-stock" type="number" min="0" step="0.01" value={stock} onChange={(e) => setStock(e.target.value)} /></div>}<div className="flex flex-col gap-2"><Label htmlFor="product-critical">Kritik stok seviyesi</Label><Input id="product-critical" type="number" min="0" step="0.01" value={critical} onChange={(e) => setCritical(e.target.value)} /></div><div className="flex flex-col gap-2"><Label htmlFor="product-warehouse">Depo</Label><NativeSelect id="product-warehouse" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</NativeSelect></div>{error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}<Button type="submit" className="h-12 text-base font-bold">Kaydet</Button></form></DialogContent></Dialog>
}
