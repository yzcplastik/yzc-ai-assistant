import type { Movement, Product, Warehouse } from "./types"

const daysAgo = (d: number, h = 9, m = 0) => {
  const date = new Date()
  date.setDate(date.getDate() - d)
  date.setHours(h, m, 0, 0)
  return date.toISOString()
}

export const seedWarehouses: Warehouse[] = [
  { id: "w1", name: "Ana Depo", location: "Fabrika - Zemin Kat", description: "Bitmiş ürün deposu" },
  { id: "w2", name: "Hammadde Deposu", location: "Fabrika - Arka Bölüm", description: "Granül ve katkı maddeleri" },
  { id: "w3", name: "Sevkiyat Deposu", location: "Lojistik Alanı", description: "Sevkiyata hazır paletler" },
]

export const seedProducts: Product[] = [
  { id: "p1", name: "PP Granül (Doğal)", code: "HM-001", category: "hammadde", unit: "kg", stock: 4200, criticalLevel: 2000, warehouseId: "w2", updatedAt: daysAgo(0, 8, 15) },
  { id: "p2", name: "HDPE Granül (Siyah)", code: "HM-002", category: "hammadde", unit: "kg", stock: 850, criticalLevel: 1500, warehouseId: "w2", updatedAt: daysAgo(1, 14, 40) },
  { id: "p3", name: "Masterbatch Mavi", code: "HM-010", category: "hammadde", unit: "kg", stock: 60, criticalLevel: 100, warehouseId: "w2", updatedAt: daysAgo(2, 11, 5) },
  { id: "p4", name: "UV Stabilizatör", code: "HM-015", category: "hammadde", unit: "kg", stock: 240, criticalLevel: 80, warehouseId: "w2", updatedAt: daysAgo(4, 10, 20) },
  { id: "p5", name: "Kasa 40x60 Delikli", code: "UR-101", category: "urun", unit: "adet", stock: 1280, criticalLevel: 500, warehouseId: "w1", updatedAt: daysAgo(0, 16, 30) },
  { id: "p6", name: "Kasa 30x50 Kapalı", code: "UR-102", category: "urun", unit: "adet", stock: 320, criticalLevel: 400, warehouseId: "w1", updatedAt: daysAgo(1, 9, 10) },
  { id: "p7", name: "Palet 100x120", code: "UR-201", category: "urun", unit: "adet", stock: 96, criticalLevel: 60, warehouseId: "w3", updatedAt: daysAgo(3, 13, 45) },
  { id: "p8", name: "Bidon 20 L", code: "UR-301", category: "urun", unit: "adet", stock: 45, criticalLevel: 150, warehouseId: "w1", updatedAt: daysAgo(0, 7, 50) },
  { id: "p9", name: "Kova 10 L Kapaklı", code: "UR-302", category: "urun", unit: "adet", stock: 740, criticalLevel: 300, warehouseId: "w3", updatedAt: daysAgo(5, 15, 0) },
  { id: "p10", name: "Sepet Küçük", code: "UR-401", category: "urun", unit: "adet", stock: 0, criticalLevel: 100, warehouseId: "w1", updatedAt: daysAgo(6, 12, 25) },
]

export const seedMovements: Movement[] = [
  { id: "m1", productId: "p1", warehouseId: "w2", type: "hammadde_giris", quantity: 2000, note: "Tedarikçi: Petkim", photo: null, createdAt: daysAgo(0, 8, 15), createdBy: "Depo Sorumlusu" },
  { id: "m2", productId: "p5", warehouseId: "w1", type: "giris", quantity: 400, note: "Üretim hattı 2", photo: null, createdAt: daysAgo(0, 16, 30), createdBy: "Depo Sorumlusu" },
  { id: "m3", productId: "p8", warehouseId: "w1", type: "cikis", quantity: 120, note: "Sipariş #4521", photo: null, createdAt: daysAgo(0, 7, 50), createdBy: "Sevkiyat" },
  { id: "m4", productId: "p2", warehouseId: "w2", type: "hammadde_cikis", quantity: 650, note: "Üretime verildi", photo: null, createdAt: daysAgo(1, 14, 40), createdBy: "Üretim" },
  { id: "m5", productId: "p6", warehouseId: "w1", type: "iade", quantity: 20, note: "Müşteri iadesi - hasarlı", photo: null, createdAt: daysAgo(1, 9, 10), createdBy: "Sevkiyat" },
  { id: "m6", productId: "p3", warehouseId: "w2", type: "hammadde_cikis", quantity: 40, note: "Mavi kasa üretimi", photo: null, createdAt: daysAgo(2, 11, 5), createdBy: "Üretim" },
  { id: "m7", productId: "p7", warehouseId: "w3", type: "cikis", quantity: 30, note: "Sipariş #4498", photo: null, createdAt: daysAgo(3, 13, 45), createdBy: "Sevkiyat" },
  { id: "m8", productId: "p4", warehouseId: "w2", type: "hammadde_giris", quantity: 100, note: "Tedarikçi: BASF", photo: null, createdAt: daysAgo(4, 10, 20), createdBy: "Depo Sorumlusu" },
  { id: "m9", productId: "p9", warehouseId: "w3", type: "giris", quantity: 300, note: "Üretim hattı 1", photo: null, createdAt: daysAgo(5, 15, 0), createdBy: "Depo Sorumlusu" },
  { id: "m10", productId: "p10", warehouseId: "w1", type: "cikis", quantity: 100, note: "Sipariş #4470", photo: null, createdAt: daysAgo(6, 12, 25), createdBy: "Sevkiyat" },
]
