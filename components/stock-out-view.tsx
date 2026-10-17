"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MovementForm } from "@/components/movement-form"
import { MovementList } from "@/components/movement-list"
import { PageHeader } from "@/components/page-header"
import { useStore } from "@/lib/store"
import { OUTBOUND_TYPES } from "@/lib/types"

export function StockOutView() {
  const { movements } = useStore()
  const recent = movements.filter((m) => OUTBOUND_TYPES.includes(m.type)).slice(0, 5)

  return (
    <>
      <PageHeader
        title="Stok Çıkışı"
        description="Sevkiyat ve üretime verilen hammadde çıkışlarını fotoğrafla birlikte kaydedin."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardContent>
            <MovementForm
              types={OUTBOUND_TYPES}
              categoryFor={(t) => (t === "hammadde_cikis" ? "hammadde" : "urun")}
              photoHints={{
                cikis: "Yüklenen palet, araç plakası veya sevk irsaliyesinin fotoğrafını çekin.",
                hammadde_cikis: "Üretime verilen hammadde çuvallarının fotoğrafını çekin.",
              }}
            />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="text-base font-bold">Son Çıkışlar</h2>
          <MovementList movements={recent} emptyText="Henüz çıkış kaydı yok." />
        </div>
      </div>
    </>
  )
}
