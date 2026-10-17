import type { Metadata } from "next"
import { ProductsView } from "@/components/products-view"

export const metadata: Metadata = { title: "Ürünler · Plastvit Depo Stok" }

export default function Page() {
  return <ProductsView />
}
