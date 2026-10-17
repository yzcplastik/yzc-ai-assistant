import type { Metadata } from "next"
import { CriticalStockView } from "@/components/critical-stock-view"

export const metadata: Metadata = { title: "Kritik Stoklar · Plastvit Depo Stok" }

export default function Page() {
  return <CriticalStockView />
}
