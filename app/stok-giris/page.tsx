import type { Metadata } from "next"
import { StockInView } from "@/components/stock-in-view"

export const metadata: Metadata = { title: "Stok Girişi · Plastvit Depo Stok" }

export default function Page() {
  return <StockInView />
}
