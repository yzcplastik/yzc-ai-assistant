
"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Siparis = {
  id: string
  siparis_no: string
  musteri_adi: string
  durum: string
  created_at: string
}

type Urun = {
  id: string
  ad: string
  kod: string | null
  birim: string | null
  depo_id: string | null
}

type Depo = {
  id: string
  ad: string
}

export default function SiparislerPage() {
  const [siparisler, setSiparisler] = useState<Siparis[]>([])
  const [urunler, setUrunler] = useState<Urun[]>([])
  const [depolar, setDepolar] = useState<Depo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [formAcik, setFormAcik] = useState(false)

  const [musteriAdi, setMusteriAdi] = useState("")
  const [telefon, setTelefon] = useState("")
  const [adres, setAdres] = useState("")
  const [aciklama, setAciklama] = useState("")
  const [urunId, setUrunId] = useState("")
  const [depoId, setDepoId] = useState("")
  const [miktar, setMiktar] = useState("")

  const yukle = useCallback(async () => {
    setLoading(true)
    setError("")

    const [siparisSonuc, urunSonuc, depoSonuc] =
      await Promise.all([
        supabase
          .from("siparisler")
          .select("id, siparis_no, musteri_adi, durum, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("urunler")
          .select("id, ad, kod, birim, depo_id")
          .order("ad"),
        supabase
          .from("depolar")
          .select("id, ad")
          .order("ad"),
      ])

    if (siparisSonuc.error) {
      setError(siparisSonuc.error.message)
    } else {
      setSiparisler(siparisSonuc.data ?? [])
    }

    if (urunSonuc.error) {
      setError((onceki) =>
        [onceki, urunSonuc.error!.message]
          .filter(Boolean)
          .join(" | ")
      )
    } else {
      setUrunler(urunSonuc.data ?? [])
    }

    if (depoSonuc.error) {
      setError((onceki) =>
        [onceki, depoSonuc.error!.message]
          .filter(Boolean)
          .join(" | ")
      )
    } else {
      setDepolar(depoSonuc.data ?? [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void yukle()
  }, [yukle])

  const seciliUrun = urunler.find(
    (urun) => urun.id === urunId
  )

  const uygunUrunler = urunler.filter(
    (urun) => !depoId || urun.depo_id === depoId
  )

  async function siparisKaydet(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setError("")
    setMessage("")

    if (!musteriAdi.trim() || !urunId || !depoId) {
      setError("Müşteri, depo ve ürün seçimi zorunludur.")
      return
    }

    const sayisalMiktar = Number(miktar)

    if (!Number.isFinite(sayisalMiktar) || sayisalMiktar <= 0) {
      setError("Geçerli bir miktar girin.")
      return
    }

    setSaving(true)

    const { data, error: kayitHatasi } = await supabase.rpc(
      "yeni_siparis_olustur",
      {
        p_musteri_adi: musteriAdi.trim(),
        p_musteri_telefon: telefon.trim(),
        p_teslimat_adresi: adres.trim(),
        p_aciklama: aciklama.trim(),
        p_urun_id: urunId,
        p_depo_id: depoId,
        p_miktar: sayisalMiktar,
      }
    )

    setSaving(false)

    if (kayitHatasi) {
      setError("Sipariş kaydedilemedi: " + kayitHatasi.message)
      return
    }

    setMessage("Sipariş başarıyla oluşturuldu.")
    setMusteriAdi("")
    setTelefon("")
    setAdres("")
    setAciklama("")
    setUrunId("")
    setDepoId("")
    setMiktar("")
    setFormAcik(false)

    if (data) {
      await yukle()
    }
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Siparişler</h1>
          <p className="text-sm text-slate-500">
            Satış, hazırlık ve teslimat takibi
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFormAcik(!formAcik)}
          className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white"
        >
          {formAcik ? "Vazgeç" : "+ Yeni Sipariş"}
        </button>
      </div>

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

      {formAcik && (
        <form
          onSubmit={siparisKaydet}
          className="space-y-4 rounded-xl border bg-white p-5"
        >
          <h2 className="text-lg font-semibold">
            Yeni Sipariş Oluştur
          </h2>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Müşteri Adı *
            </label>
            <input
              required
              value={musteriAdi}
              onChange={(e) => setMusteriAdi(e.target.value)}
              className="w-full rounded-lg border p-3"
              placeholder="Müşteri veya firma adı"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Telefon
            </label>
            <input
              type="tel"
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              className="w-full rounded-lg border p-3"
              placeholder="Telefon numarası"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Teslimat Adresi
            </label>
            <textarea
              value={adres}
              onChange={(e) => setAdres(e.target.value)}
              className="w-full rounded-lg border p-3"
              rows={2}
              placeholder="Teslimat adresi"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Depo *
            </label>
            <select
              required
              value={depoId}
              onChange={(e) => {
                setDepoId(e.target.value)
                setUrunId("")
              }}
              className="w-full rounded-lg border p-3"
            >
              <option value="">Depo seçiniz</option>
              {depolar.map((depo) => (
                <option key={depo.id} value={depo.id}>
                  {depo.ad}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Ürün *
            </label>
            <select
              required
              value={urunId}
              onChange={(e) => setUrunId(e.target.value)}
              className="w-full rounded-lg border p-3"
            >
              <option value="">Ürün seçiniz</option>
              {uygunUrunler.map((urun) => (
                <option key={urun.id} value={urun.id}>
                  {urun.ad} {urun.kod ? `(${urun.kod})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Miktar * {seciliUrun?.birim
                ? `(${seciliUrun.birim})`
                : ""}
            </label>
            <input
              required
              type="number"
              min="0.001"
              step="any"
              value={miktar}
              onChange={(e) => setMiktar(e.target.value)}
              className="w-full rounded-lg border p-3"
              placeholder="Miktar giriniz"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Açıklama
            </label>
            <textarea
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              className="w-full rounded-lg border p-3"
              rows={2}
              placeholder="Sipariş notu"
            />
          </div>

          <button
            type="submit"
            disabled={saving || loading}
            className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Kaydediliyor..." : "Siparişi Kaydet"}
          </button>
        </form>
      )}

      <h2 className="text-lg font-semibold">Sipariş Listesi</h2>

      {loading && <p>Siparişler yükleniyor...</p>}

      {!loading && !error && siparisler.length === 0 && (
        <p className="rounded-lg border p-4">
          Henüz kayıtlı sipariş bulunmuyor.
        </p>
      )}

      {siparisler.map((siparis) => (
        <div
          key={siparis.id}
          className="rounded-xl border bg-white p-4"
        >
          <p className="font-semibold">
            Sipariş #{siparis.siparis_no}
          </p>
          <p>Müşteri: {siparis.musteri_adi}</p>
          <p>Durum: {siparis.durum}</p>
          <p className="text-sm text-slate-500">
            {new Date(siparis.created_at).toLocaleString("tr-TR")}
          </p>
        </div>
      ))}
    </div>
  )
}
