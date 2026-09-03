import type { Metadata } from "next"
import { ReportsView } from "@/components/reports-view"

export const metadata: Metadata = { title: "Raporlar · Plastvit Depo Stok" }

export default function Page() {
  return <ReportsView />
}
