
"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Musteri = {
  id: string
  musteri_adi: string
  telefon: string | null
  adres: string | null
}

export default function MusterilerPage() {
  const [musteriler, setMusteriler] = useState<Musteri[]>([])
  const [arama, setArama] = useState("")
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null)
  const [telefon, setTelefon] = useState("")
  const [adres, setAdres] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [yetkili, setYetkili] = useState(false)

  const yukle = useCallback(async () => {
    setLoading(true)
    setError("")

    const { data: kullanici, error: oturumHatasi } =
      await supabase.auth.getUser()

    if (oturumHatasi || !kullanici.user) {
      setError("Müşterileri görmek için oturum açmalısınız.")
      setLoading(false)
      return
    }

    const [musteriSonuc, rolSonuc] = await Promise.all([
      supabase
        .from("musteriler")
        .select("id, musteri_adi, telefon, adres")
        .order("musteri_adi"),
      supabase
        .from("kullanici_rolleri")
        .select("rol")
        .eq("user_id", kullanici.user.id),
    ])

    if (musteriSonuc.error) {
      setError(musteriSonuc.error.message)
    } else {
      setMusteriler(musteriSonuc.data ?? [])
    }

    if (rolSonuc.error) {
      setError(rolSonuc.error.message)
      setYetkili(false)
    } else {
      setYetkili(
        (rolSonuc.data ?? []).some(
          (kayit) =>
            kayit.rol === "yonetici" ||
            kayit.rol === "satis_temsilcisi"
        )
      )
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void yukle()
  }, [yukle])

  function duzenle(musteri: Musteri) {
    setDuzenlenenId(musteri.id)
    setTelefon(musteri.telefon ?? "")
    setAdres(musteri.adres ?? "")
    setError("")
    setMessage("")
  }

  async function kaydet() {
    if (!duzenlenenId || saving || !yetkili) return

    setSaving(true)
    setError("")
    setMessage("")

    const { error: kayitHatasi } = await supabase.rpc(
      "musteri_bilgilerini_guncelle",
      {
        p_musteri_id: duzenlenenId,
        p_telefon: telefon,
        p_adres: adres,
      }
    )

    setSaving(false)

    if (kayitHatasi) {
      setError("Kaydedilemedi: " + kayitHatasi.message)
      return
    }

    setDuzenlenenId(null)
    setMessage("Müşteri bilgileri güncellendi.")
    await yukle()
  }

  const filtreliMusteriler = musteriler.filter((musteri) =>
    musteri.musteri_adi
      .toLocaleLowerCase("tr-TR")
      .includes(arama.trim().toLocaleLowerCase("tr-TR"))
  )

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4">
      <h1 className="text-2xl font-bold">Müşteriler</h1>

      <p className="text-sm text-slate-600">
        Firma telefon ve adres bilgilerini buradan yönetin.
        Siparişlerdeki bilgiler ayrı saklanır.
      </p>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p className="rounded-lg bg-green-50 p-3 text-green-700">
          {message}
        </p>
      )}

      <input
        type="search"
        placeholder="Müşteri adıyla ara..."
        value={arama}
        onChange={(e) => setArama(e.target.value)}
        className="w-full rounded-lg border p-3"
      />

      {loading ? (
        <p>Müşteriler yükleniyor...</p>
      ) : (
        <p className="text-sm text-slate-500">
          Toplam {filtreliMusteriler.length} müşteri
        </p>
      )}

      {!loading &&
        filtreliMusteriler.map((musteri) => (
          <div
            key={musteri.id}
            className="space-y-3 rounded-xl border bg-white p-4"
          >
            <h2 className="text-lg font-semibold">
              {musteri.musteri_adi}
            </h2>

<button
  type="button"
  className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800"
  disabled
>
  Sipariş Geçmişi
</button>

            {duzenlenenId === musteri.id ? (
              <>
                <label className="block text-sm font-medium">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  className="w-full rounded-lg border p-3"
                  placeholder="Firma telefonu"
                />

                <label className="block text-sm font-medium">
                  Adres
                </label>
                <textarea
                  value={adres}
                  onChange={(e) => setAdres(e.target.value)}
                  className="w-full rounded-lg border p-3"
                  rows={3}
                  placeholder="Firma adresi"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void kaydet()}
                    disabled={saving}
                    className="rounded-lg bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
                  >
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDuzenlenenId(null)}
                    disabled={saving}
                    className="rounded-lg border px-4 py-2"
                  >
                    Vazgeç
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>Telefon: {musteri.telefon || "Belirtilmedi"}</p>
                <p>Adres: {musteri.adres || "Belirtilmedi"}</p>

                {yetkili && (
                  <button
                    type="button"
                    onClick={() => duzenle(musteri)}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-white"
                  >
                    Düzenle
                  </button>
                )}
              </>
            )}
          </div>
        ))}
    </div>
  )
}
