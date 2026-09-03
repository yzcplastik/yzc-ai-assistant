"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MovementForm } from "@/components/movement-form"
import { MovementList } from "@/components/movement-list"
import { PageHeader } from "@/components/page-header"
import { useStore } from "@/lib/store"
import { INBOUND_TYPES } from "@/lib/types"

export function StockInView() {
  const { movements } = useStore()
  const recent = movements.filter((m) => INBOUND_TYPES.includes(m.type)).slice(0, 5)

  return (
    <>
      <PageHeader
        title="Stok Girişi"
        description="Ürün girişi, hammadde girişi ve iade kayıtlarını fotoğrafla birlikte kaydedin."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardContent>
            <MovementForm
              types={INBOUND_TYPES}
              categoryFor={(t) => (t === "hammadde_giris" ? "hammadde" : "urun")}
              photoHints={{
                giris: "Üretimden gelen palet veya ürün etiketinin fotoğrafını çekin.",
                hammadde_giris: "Tedarikçi irsaliyesi ve hammadde çuvallarının fotoğrafını çekin.",
                iade: "İade edilen ürünün ve varsa hasarın fotoğrafını çekin.",
              }}
            />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="text-base font-bold">Son Girişler</h2>
          <MovementList movements={recent} emptyText="Henüz giriş kaydı yok." />
        </div>
      </div>
    </>
  )
}
