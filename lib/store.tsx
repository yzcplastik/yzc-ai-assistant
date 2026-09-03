"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { seedMovements, seedProducts, seedWarehouses } from "./seed"
import { isInbound, type Movement, type MovementType, type Product, type Warehouse } from "./types"

interface NewMovementInput {
  productId: string
  warehouseId: string
  type: MovementType
  quantity: number
  note?: string
  photo?: string | null
  createdBy?: string
}

interface NewProductInput {
  name: string
  code: string
  category: Product["category"]
  unit: string
  stock: number
  criticalLevel: number
  warehouseId: string
}

interface StoreValue {
  warehouses: Warehouse[]
  products: Product[]
  movements: Movement[]
  addMovement: (input: NewMovementInput) => { ok: true } | { ok: false; error: string }
  addProduct: (input: NewProductInput) => Product
  addWarehouse: (input: Omit<Warehouse, "id">) => Warehouse
  getProduct: (id: string) => Product | undefined
  getWarehouse: (id: string) => Warehouse | undefined
}

const StoreContext = createContext<StoreValue | null>(null)

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

/**
 * Veri katmanı. Şu an bellek içi örnek verilerle çalışır.
 * Supabase bağlandığında bu dosyadaki fonksiyonlar tablolara yazacak şekilde güncellenir.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(seedWarehouses)
  const [products, setProducts] = useState<Product[]>(seedProducts)
  const [movements, setMovements] = useState<Movement[]>(seedMovements)

  const addMovement = useCallback<StoreValue["addMovement"]>(
    (input) => {
      const product = products.find((p) => p.id === input.productId)
      if (!product) return { ok: false, error: "Ürün bulunamadı." }
      if (!Number.isFinite(input.quantity) || input.quantity <= 0)
        return { ok: false, error: "Miktar sıfırdan büyük olmalıdır." }

      const inbound = isInbound(input.type)
      if (!inbound && input.quantity > product.stock)
        return { ok: false, error: `Yetersiz stok. Mevcut: ${product.stock} ${product.unit}` }

      const now = new Date().toISOString()
      const movement: Movement = {
        id: uid(),
        productId: input.productId,
        warehouseId: input.warehouseId,
        type: input.type,
        quantity: input.quantity,
        note: input.note?.trim() || undefined,
        photo: input.photo ?? null,
        createdAt: now,
        createdBy: input.createdBy ?? "Depo Sorumlusu",
      }

      setMovements((prev) => [movement, ...prev])
      setProducts((prev) =>
        prev.map((p) =>
          p.id === input.productId
            ? {
                ...p,
                stock: inbound ? p.stock + input.quantity : p.stock - input.quantity,
                warehouseId: input.warehouseId,
                updatedAt: now,
              }
            : p,
        ),
      )
      return { ok: true }
    },
    [products],
  )

  const addProduct = useCallback<StoreValue["addProduct"]>((input) => {
    const product: Product = { ...input, id: uid(), updatedAt: new Date().toISOString() }
    setProducts((prev) => [product, ...prev])
    return product
  }, [])

  const addWarehouse = useCallback<StoreValue["addWarehouse"]>((input) => {
    const warehouse: Warehouse = { ...input, id: uid() }
    setWarehouses((prev) => [...prev, warehouse])
    return warehouse
  }, [])

  const value = useMemo<StoreValue>(
    () => ({
      warehouses,
      products,
      movements,
      addMovement,
      addProduct,
      addWarehouse,
      getProduct: (id) => products.find((p) => p.id === id),
      getWarehouse: (id) => warehouses.find((w) => w.id === id),
    }),
    [warehouses, products, movements, addMovement, addProduct, addWarehouse],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore, StoreProvider içinde kullanılmalıdır.")
  return ctx
}
