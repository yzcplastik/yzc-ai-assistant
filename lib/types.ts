export type ProductCategory = "urun" | "hammadde"

export type MovementType =
  | "giris"
  | "cikis"
  | "hammadde_giris"
  | "hammadde_cikis"
  | "iade"

export interface Warehouse {
  id: string
  name: string
  location: string
  description?: string
}

export interface Product {
  id: string
  name: string
  code: string
  category: ProductCategory
  unit: string
  stock: number
  criticalLevel: number
  warehouseId: string
  updatedAt: string
}

export interface Movement {
  id: string
  productId: string
  warehouseId: string
  type: MovementType
  quantity: number
  note?: string
  photo?: string | null
  createdAt: string
  createdBy: string
}

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  giris: "Ürün Girişi",
  cikis: "Ürün Çıkışı",
  hammadde_giris: "Hammadde Girişi",
  hammadde_cikis: "Hammadde Çıkışı",
  iade: "İade",
}

export const INBOUND_TYPES: MovementType[] = ["giris", "hammadde_giris", "iade"]
export const OUTBOUND_TYPES: MovementType[] = ["cikis", "hammadde_cikis"]

export function isInbound(type: MovementType) {
  return INBOUND_TYPES.includes(type)
}
