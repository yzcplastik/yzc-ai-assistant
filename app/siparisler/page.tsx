
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Siparis = {
  id: string
  durum: string
  created_at: string
}

export default function SiparislerPage() {
  const [siparisler, setSiparisler] = useState<Siparis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function yukle() {
      const { data, error } = await supabase
        .from("siparisler")
        .select("id, durum, created_at")
        .order("created_at", { ascending: false })

      if (error) {
        setError("Siparişler yüklenemedi: " + error.message)
      } else {
        setSiparisler(data ?? [])
      }

      setLoading(false)
    }

    void yukle()
  }, [])

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Siparişler</h1>
        <p className="text-sm text-slate-500">
          Satış, hazırlık ve teslimat takibi
        </p>
      </div>

      {loading && <p>Siparişler yükleniyor...</p>}

      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && siparisler.length === 0 && (
        <p className="rounded-lg border p-4">
          Henüz kayıtlı sipariş bulunmuyor.
        </p>
      )}

      {siparisler.map((siparis) => (
        <div key={siparis.id} className="rounded-xl border bg-white p-4">
          <p className="font-semibold">
            Sipariş #{siparis.id.slice(0, 8)}
          </p>
          <p>Durum: {siparis.durum}</p>
          <p className="text-sm text-slate-500">
            {new Date(siparis.created_at).toLocaleString("tr-TR")}
          </p>
        </div>
      ))}
    </div>
  )
}
