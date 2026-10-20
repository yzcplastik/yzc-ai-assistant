
"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Musteri = {
  id: string
  musteri_adi: string
  telefon: string | null
  adres: string | null
}

type SiparisGecmisi = {
  id: string
  siparis_no: string
  musteri_adi: string
  durum: string
  created_at: string
  siparis_kalemleri: {
    miktar: number
    urunler: {
      ad: string
      birim: string | null
    } | null
  }[]
}

export default function MusterilerPage() {
  const [musteriler, setMusteriler] = useState<Musteri[]>([])
  const [siparisler, setSiparisler] = useState<SiparisGecmisi[]>([])
  const [arama, setArama] = useState("")
  const [gecmisAcikId, setGecmisAcikId] = useState<string | null>(null)
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

    const [musteriSonuc, rolSonuc, siparisSonuc] = await Promise.all([
      supabase
        .from("musteriler")
        .select("id, musteri_adi, telefon, adres")
        .order("musteri_adi"),
      supabase
        .from("kullanici_rolleri")
        .select("rol")
        .eq("user_id", kullanici.user.id),
      
supabase
  .from("siparisler")
  .select(`
    id,
    siparis_no,
    musteri_adi,
    durum,
    created_at,
    siparis_kalemleri (
      miktar,
      urunler (
        ad,
        birim
      )
    )
  `)
  .order("created_at", { ascending: false }),

    ])

if (siparisSonuc.error) {
  setError("Sipariş geçmişi alınamadı: " + siparisSonuc.error.message)
} else {
  setSiparisler(siparisSonuc.data ?? [])
}

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
  onClick={() =>
    setGecmisAcikId(
      gecmisAcikId === musteri.id ? null : musteri.id
    )
  }
  className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800"
>
  {gecmisAcikId === musteri.id
    ? "Sipariş Geçmişini Kapat"
    : "Sipariş Geçmişi"}
</button>

{gecmisAcikId === musteri.id && (
  <div className="space-y-3 rounded-lg bg-slate-50 p-3">
    {siparisler.filter(
      (siparis) =>
        siparis.musteri_adi.toLocaleLowerCase("tr-TR") ===
        musteri.musteri_adi.toLocaleLowerCase("tr-TR")
    ).length === 0 ? (
      <p>Bu müşteriye ait sipariş bulunamadı.</p>
    ) : (
      siparisler
        .filter(
          (siparis) =>
            siparis.musteri_adi.toLocaleLowerCase("tr-TR") ===
            musteri.musteri_adi.toLocaleLowerCase("tr-TR")
        )
        .map((siparis) => (
          <div
            key={siparis.id}
            className="space-y-1 rounded-lg border bg-white p-3"
          >
            <p className="font-semibold">
              Sipariş No: {siparis.siparis_no}
            </p>

            <p>
              Tarih:{" "}
              {new Date(siparis.created_at).toLocaleDateString("tr-TR")}
            </p>

            <p>
              Durum:{" "}
              {({
                yeni: "Yeni Sipariş",
                hazirlaniyor: "Hazırlanıyor",
                sevke_hazir: "Sevke Hazır",
                teslim_edildi: "Teslim Edildi",
                iptal: "İptal Edildi",
              } as Record<string, string>)[siparis.durum] ?? siparis.durum}
            </p>

            {siparis.siparis_kalemleri.map((kalem, index) => (
              <p key={index}>
                Ürün: {kalem.urunler?.ad ?? "Bilinmeyen ürün"} —{" "}
                {kalem.miktar} {kalem.urunler?.birim ?? "adet"}
              </p>
            ))}
          </div>
        ))
    )}
  </div>
)}


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
