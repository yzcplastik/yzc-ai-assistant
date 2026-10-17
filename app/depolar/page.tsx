import type { Metadata } from "next"
import { WarehousesView } from "@/components/warehouses-view"

export const metadata: Metadata = { title: "Depolar · Plastvit Depo Stok" }

export default function Page() {
  return <WarehousesView />
}
