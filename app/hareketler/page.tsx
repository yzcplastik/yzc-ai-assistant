import type { Metadata } from "next"
import { MovementsView } from "@/components/movements-view"

export const metadata: Metadata = { title: "Stok Hareketleri · Plastvit Depo Stok" }

export default function Page() {
  return <MovementsView />
}
