import type { Metadata } from "next"
import { StockOutView } from "@/components/stock-out-view"

export const metadata: Metadata = { title: "Stok Çıkışı · Plastvit Depo Stok" }

export default function Page() {
  return <StockOutView />
}
