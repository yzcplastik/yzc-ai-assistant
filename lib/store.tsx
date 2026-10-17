"use client"

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react"
import useSWR from "swr"
import { supabase } from "./supabase"
import { isInbound, type Movement, type MovementType, type Product, type Warehouse } from "./types"

interface NewMovementInput { productId: string; warehouseId: string; type: MovementType; quantity: number; note?: string; photo?: string | null; createdBy?: string }
interface NewProductInput { name: string; code: string; category: Product["category"]; unit: string; stock: number; criticalLevel: number; warehouseId: string }
interface StoreValue {
  warehouses: Warehouse[]; products: Product[]; movements: Movement[]; loading: boolean; error: string | null
  addMovement: (input: NewMovementInput) => Promise<{ ok: true } | { ok: false; error: string }>
  addProduct: (input: NewProductInput) => Promise<Product | null>
  updateProduct: (id: string, input: Omit<NewProductInput, "stock">) => Promise<Product | null>
  addWarehouse: (input: Omit<Warehouse, "id">) => Promise<Warehouse | null>
  getProduct: (id: string) => Product | undefined; getWarehouse: (id: string) => Warehouse | undefined
}
const StoreContext = createContext<StoreValue | null>(null)
const friendlyError = (error: { message?: string } | null) => error?.message || "İşlem tamamlanamadı. Lütfen tekrar deneyin."

type Row = Record<string, unknown>
const loadInventory = async () => {
  const [w, p, h, m] = await Promise.all([
    supabase.from("depolar").select("id, ad, konum").order("ad"),
    supabase.from("urunler").select("id, ad, kod, birim, minimum_stok, mevcut_stok, kategori, depo_id, created_at").order("ad"),
    supabase.from("hammaddeler").select("id, ad, kod, birim, minimum_stok, mevcut_stok, depo_id, created_at").order("ad"),
    supabase.from("stok_hareketleri").select("id, islem_turu, urun_id, hammadde_id, depo_id, miktar, fotograf_url, notlar, created_at, olusturan").order("created_at", { ascending: false }),
  ])
  const failure = [w, p, h, m].find((result) => result.error)
  if (failure?.error) throw new Error(friendlyError(failure.error))
  const warehouses: Warehouse[] = ((w.data ?? []) as Row[]).map((r) => ({ id: String(r.id), name: String(r.ad), location: String(r.konum ?? ""), description: undefined }))
  const warehouseIds = new Set(warehouses.map((x) => x.id))
  const products: Product[] = [...((p.data ?? []) as Row[]).map((r) => ({ id: String(r.id), name: String(r.ad), code: String(r.kod ?? ""), category: "urun" as const, unit: String(r.birim ?? "adet"), stock: Number(r.mevcut_stok ?? 0), criticalLevel: Number(r.minimum_stok ?? 0), warehouseId: warehouseIds.has(String(r.depo_id)) ? String(r.depo_id) : "", updatedAt: String(r.created_at ?? new Date().toISOString()) })), ...((h.data ?? []) as Row[]).map((r) => ({ id: String(r.id), name: String(r.ad), code: String(r.kod ?? ""), category: "hammadde" as const, unit: String(r.birim ?? "kg"), stock: Number(r.mevcut_stok ?? 0), criticalLevel: Number(r.minimum_stok ?? 0), warehouseId: warehouseIds.has(String(r.depo_id)) ? String(r.depo_id) : "", updatedAt: String(r.created_at ?? new Date().toISOString()) }))]
  const movements: Movement[] = ((m.data ?? []) as Row[]).map((r) => ({ id: String(r.id), productId: String(r.urun_id ?? r.hammadde_id ?? ""), warehouseId: String(r.depo_id ?? ""), type: String(r.islem_turu) as MovementType, quantity: Number(r.miktar), note: r.notlar ? String(r.notlar) : undefined, photo: r.fotograf_url ? String(r.fotograf_url) : null, createdAt: String(r.created_at ?? new Date().toISOString()), createdBy: String(r.olusturan ?? "Depo Sorumlusu") }))
  return { warehouses, products, movements }
}

async function uploadPhoto(dataUrl: string | null | undefined) {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl ?? null
  const blob = await (await fetch(dataUrl)).blob()
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from("stok-fotograflari").upload(path, blob, { contentType: "image/jpeg", upsert: false })
  if (error) throw new Error(`Fotoğraf yüklenemedi: ${error.message}`)
  return supabase.storage.from("stok-fotograflari").getPublicUrl(path).data.publicUrl
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { data, error, isLoading, mutate } = useSWR("inventory", loadInventory, { revalidateOnFocus: true })
  const warehouses = data?.warehouses ?? [], products = data?.products ?? [], movements = data?.movements ?? []
  const addMovement = useCallback(async (input: NewMovementInput) => {
    try {
      const product = products.find((p) => p.id === input.productId)
      if (!product) return { ok: false as const, error: "Ürün veya hammadde bulunamadı." }
      if (!Number.isFinite(input.quantity) || input.quantity <= 0) return { ok: false as const, error: "Miktar sıfırdan büyük olmalıdır." }
      const photoUrl = await uploadPhoto(input.photo)
      const { error: rpcError } = await supabase.rpc("kaydet_stok_hareketi", { p_islem_turu: input.type, p_urun_id: product.category === "urun" ? product.id : null, p_hammadde_id: product.category === "hammadde" ? product.id : null, p_depo_id: input.warehouseId, p_miktar: input.quantity, p_fotograf_url: photoUrl, p_notlar: input.note?.trim() || null, p_olusturan: input.createdBy ?? "Depo Sorumlusu" })
      if (rpcError) return { ok: false as const, error: friendlyError(rpcError) }
      await mutate(); return { ok: true as const }
    } catch (e) { return { ok: false as const, error: e instanceof Error ? e.message : "İşlem tamamlanamadı." } }
  }, [products, mutate])
  const addProduct = useCallback(async (input: NewProductInput) => {
    const table = input.category === "hammadde" ? "hammaddeler" : "urunler"
    const { data: row, error: insertError } = await supabase.from(table).insert({ ad: input.name, kod: input.code, birim: input.unit, mevcut_stok: 0, minimum_stok: input.criticalLevel, depo_id: input.warehouseId, ...(input.category === "urun" ? { kategori: "urun" } : {}) }).select("id, ad, kod, birim, mevcut_stok, minimum_stok, depo_id, created_at").single()
    if (insertError || !row) return null
    if (input.stock > 0) {
      const { error: movementError } = await supabase.rpc("kaydet_stok_hareketi", { p_islem_turu: input.category === "hammadde" ? "hammadde_giris" : "giris", p_urun_id: input.category === "urun" ? row.id : null, p_hammadde_id: input.category === "hammadde" ? row.id : null, p_depo_id: input.warehouseId, p_miktar: input.stock, p_fotograf_url: null, p_notlar: "Başlangıç stoku", p_olusturan: "Depo Sorumlusu" })
      if (movementError) { await supabase.from(table).delete().eq("id", row.id); return null }
    }
    await mutate();
    return { id: String(row.id), name: String(row.ad), code: String(row.kod ?? ""), category: input.category, unit: String(row.birim), stock: input.stock, criticalLevel: Number(row.minimum_stok), warehouseId: String(row.depo_id), updatedAt: String(row.created_at) }
  }, [mutate])
  const updateProduct = useCallback(async (id: string, input: Omit<NewProductInput, "stock">) => {
    const table = input.category === "hammadde" ? "hammaddeler" : "urunler"
    const { data: row, error: updateError } = await supabase.from(table).update({ ad: input.name, kod: input.code, birim: input.unit, minimum_stok: input.criticalLevel, depo_id: input.warehouseId, ...(input.category === "urun" ? { kategori: "urun" } : {}) }).eq("id", id).select("id, ad, kod, birim, mevcut_stok, minimum_stok, depo_id, created_at").single()
    if (updateError || !row) return null
    await mutate()
    return { id: String(row.id), name: String(row.ad), code: String(row.kod ?? ""), category: input.category, unit: String(row.birim), stock: Number(row.mevcut_stok ?? 0), criticalLevel: Number(row.minimum_stok ?? 0), warehouseId: String(row.depo_id ?? ""), updatedAt: String(row.created_at ?? new Date().toISOString()) }
  }, [mutate])
  const addWarehouse = useCallback(async (input: Omit<Warehouse, "id">) => { const { data: row, error: insertError } = await supabase.from("depolar").insert({ ad: input.name, konum: input.location }).select("id, ad, konum").single(); if (insertError || !row) return null; await mutate(); return { id: String(row.id), name: String(row.ad), location: String(row.konum ?? ""), description: input.description } }, [mutate])
  const value = useMemo<StoreValue>(() => ({ warehouses, products, movements, loading: isLoading, error: error?.message ?? null, addMovement, addProduct, addWarehouse, getProduct: (id) => products.find((p) => p.id === id), getWarehouse: (id) => warehouses.find((w) => w.id === id) }), [warehouses, products, movements, isLoading, error, addMovement, addProduct, addWarehouse])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
export function useStore() { const ctx = useContext(StoreContext); if (!ctx) throw new Error("useStore, StoreProvider içinde kullanılmalıdır."); return ctx }
