
"use client"

import { useCallback, useEffect, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { supabase } from "@/lib/supabase"

type Siparis = {
  id: string
  siparis_no: string
  musteri_adi: string
  musteri_telefon: string | null
  teslimat_adresi: string | null
  aciklama: string | null
  durum: string
  created_at: string
  yukleme_fotografi_url: string | null
}

type Urun = {
  id: string
  ad: string
  kod: string | null
  birim: string | null
  depo_id: string | null
}

type SiparisKalemi = {
  id: string
  siparis_id: string
  urun_id: string
  miktar: number
}

const BUCKET = "siparis-yukleme"
const AKTIF_DURUMLAR = [
  "yeni",
  "hazirlaniyor",
  "sevke_hazir",
]

const GECMIS_DURUMLAR = [
  "teslim_edildi",
  "iptal",
]
const DURUM_ADLARI: Record<string, string> = {
  yeni: "Yeni Sipariş",
  hazirlaniyor: "Hazırlanıyor",
  sevke_hazir: "Sevke Hazır",
  teslim_edildi: "Teslim Edildi",
  iptal: "İptal Edildi",
}
export default function SiparislerPage() {
  const [siparisler, setSiparisler] = useState<Siparis[]>([])
  const aktifSiparisler = siparisler.filter((siparis) =>
  AKTIF_DURUMLAR.includes(siparis.durum)
)

const gecmisSiparisler = siparisler.filter((siparis) =>
  GECMIS_DURUMLAR.includes(siparis.durum)
)
  const [siparisKalemleri, setSiparisKalemleri] = useState<
  SiparisKalemi[]
>([])
  const [urunler, setUrunler] = useState<Urun[]>([])
  const [depolar, setDepolar] = useState<Depo[]>([])
  const [rol, setRol] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [islemId, setIslemId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [formAcik, setFormAcik] = useState(false)

  const [musteriAdi, setMusteriAdi] = useState("")
  const [telefon, setTelefon] = useState("")
  const [adres, setAdres] = useState("")
  const [aciklama, setAciklama] = useState("")
  const [urunId, setUrunId] = useState("")
  const depoId = urunler.find(
  (urun) => urun.id === urunId
)?.depo_id ?? ""
  const [miktar, setMiktar] = useState("")

  const [fotograflar, setFotograflar] = useState<
    Record<string, File>
  >({})
  const [yuklenenYollar, setYuklenenYollar] = useState<
    Record<string, string>
  >({})

  const yukle = useCallback(async () => {
    setLoading(true)
    setError("")

    const [siparisSonuc, urunSonuc, depoSonuc, kullaniciSonuc, kalemSonuc] =
      await Promise.all([
        supabase
          .from("siparisler")
          .select(
            "id, siparis_no, musteri_adi, musteri_telefon, teslimat_adresi, aciklama, durum, created_at, yukleme_fotografi_url"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("urunler")
          .select("id, ad, kod, birim, depo_id")
          .order("ad"),
        supabase
          .from("depolar")
          .select("id, ad")
          .order("ad"),
        supabase.auth.getUser(),
        supabase
  .from("siparis_kalemleri")
  .select("id, siparis_id, urun_id, miktar"),
      ])
if (kalemSonuc.error) {
  setError("Sipariş kalemleri alınamadı: " + kalemSonuc.error.message)
} else {
  setSiparisKalemleri(kalemSonuc.data ?? [])
}
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

    if (kullaniciSonuc.error) {
      setError((onceki) =>
        [onceki, kullaniciSonuc.error!.message]
          .filter(Boolean)
          .join(" | ")
      )
      setRol("")
    } else if (kullaniciSonuc.data.user) {
      const { data, error: rolHatasi } = await supabase
        .from("kullanici_rolleri")
        .select("rol")
        .eq("user_id", kullaniciSonuc.data.user.id)
        .in("rol", [
          "yonetici",
          "calisan",
          "satis_temsilcisi",
        ])

      if (rolHatasi) {
        setError((onceki) =>
          [onceki, rolHatasi.message]
            .filter(Boolean)
            .join(" | ")
        )
        setRol("")
      } else {
        const roller = (data ?? []).map((kayit) => kayit.rol)

        setRol(
          roller.includes("yonetici")
            ? "yonetici"
            : roller.includes("calisan")
              ? "calisan"
              : roller.includes("satis_temsilcisi")
                ? "satis_temsilcisi"
                : ""
        )
      }
    } else {
      setRol("")
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void yukle()
  }, [yukle])

  const depoYetkisi =
    rol === "yonetici" || rol === "calisan"

  const siparisOlusturmaYetkisi =
    rol === "yonetici" || rol === "satis_temsilcisi"

  const seciliUrun = urunler.find(
    (urun) => urun.id === urunId
  )

  const uygunUrunler = urunler.filter(
  (urun) =>
    urun.depo_id !== null &&
    urun.ad.toLocaleLowerCase("tr-TR").includes("palet")
)
  async function siparisKaydet(event: FormEvent<HTMLFormElement>) {
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

    const { error: kayitHatasi } = await supabase.rpc(
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
    setMiktar("")
    setFormAcik(false)

    await yukle()
  }

  async function sevkeHazirYap(siparis: Siparis) {
    if (
      !window.confirm(
        `${siparis.siparis_no} numaralı sipariş sevke hazır yapılsın mı?`
      )
    ) {
      return
    }

    setIslemId(siparis.id)
    setError("")
    setMessage("")

    try {
      const { error: islemHatasi } = await supabase.rpc(
        "siparis_sevke_hazir",
        { p_siparis_id: siparis.id }
      )

      if (islemHatasi) throw islemHatasi

      await yukle()
      setMessage(
        `${siparis.siparis_no} numaralı sipariş sevke hazır yapıldı.`
      )
    } catch (hata) {
      setError(
        hata instanceof Error
          ? hata.message
          : "Sevke hazırlama başarısız."
      )
    } finally {
      setIslemId(null)
    }
  }

  function fotografSec(
    siparisId: string,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const dosya = event.target.files?.[0]
    if (!dosya) return

    const izinliTurler = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ]

    if (!izinliTurler.includes(dosya.type)) {
      setError("Yalnızca JPG, PNG veya WebP yükleyebilirsiniz.")
      return
    }

    if (dosya.size > 10 * 1024 * 1024) {
      setError("Fotoğraf en fazla 10 MB olabilir.")
      return
    }

    setError("")
    setFotograflar((onceki) => ({
      ...onceki,
      [siparisId]: dosya,
    }))
    setYuklenenYollar((onceki) => {
      const yeni = { ...onceki }
      delete yeni[siparisId]
      return yeni
    })
  }

  async function fotografYukle(siparis: Siparis) {
    const dosya = fotograflar[siparis.id]

    if (!dosya) {
      setError("Önce bir yükleme fotoğrafı seçin.")
      return
    }

    setIslemId(siparis.id)
    setError("")
    setMessage("")

    try {
      const uzanti =
        dosya.type === "image/png"
          ? "png"
          : dosya.type === "image/webp"
            ? "webp"
            : "jpg"

      const dosyaYolu =
        `${siparis.id}/${crypto.randomUUID()}.${uzanti}`

      const { error: yuklemeHatasi } = await supabase.storage
        .from(BUCKET)
        .upload(dosyaYolu, dosya, {
          contentType: dosya.type,
          upsert: false,
        })

      if (yuklemeHatasi) throw yuklemeHatasi

      setYuklenenYollar((onceki) => ({
        ...onceki,
        [siparis.id]: dosyaYolu,
      }))

      setMessage(
        "Fotoğraf yüklendi. Teslimatı onaylayabilirsiniz."
      )
    } catch (hata) {
      setError(
        hata instanceof Error
          ? "Fotoğraf yüklenemedi: " + hata.message
          : "Fotoğraf yüklenemedi."
      )
    } finally {
      setIslemId(null)
    }
  }

  async function teslimEt(siparis: Siparis) {
    const dosyaYolu = yuklenenYollar[siparis.id]

    if (!dosyaYolu) {
      setError("Önce yükleme fotoğrafını yükleyin.")
      return
    }

    if (
      !window.confirm(
        `${siparis.siparis_no} numaralı sipariş teslim edilsin mi?\n\n` +
        "Bu işlem stoktan sipariş miktarını düşecektir."
      )
    ) {
      return
    }

    setIslemId(siparis.id)
    setError("")
    setMessage("")

    try {
      const { error: teslimHatasi } = await supabase.rpc(
        "siparis_teslim_et",
        {
          p_siparis_id: siparis.id,
          p_fotograf_url: dosyaYolu,
        }
      )

      if (teslimHatasi) throw teslimHatasi

      setYuklenenYollar((onceki) => {
        const yeni = { ...onceki }
        delete yeni[siparis.id]
        return yeni
      })

      setFotograflar((onceki) => {
        const yeni = { ...onceki }
        delete yeni[siparis.id]
        return yeni
      })

      await yukle()
      setMessage(
        `${siparis.siparis_no} numaralı sipariş teslim edildi. ` +
        "Stok hareketi kaydedildi."
      )
    } catch (hata) {
      setError(
        hata instanceof Error
          ? "Teslimat başarısız: " + hata.message
          : "Teslimat başarısız."
      )
    } finally {
      setIslemId(null)
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

        {siparisOlusturmaYetkisi && (
          <button
            type="button"
            onClick={() => setFormAcik(!formAcik)}
            className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white"
          >
            {formAcik ? "Vazgeç" : "+ Yeni Sipariş"}
          </button>
        )}
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

      {formAcik && siparisOlusturmaYetkisi && (
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
            />
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

      <h2 className="text-lg font-semibold">
  Aktif Siparişler ({aktifSiparisler.length})
</h2>

      {loading && <p>Siparişler yükleniyor...</p>}

      {!loading && siparisler.length === 0 && (
        <p className="rounded-lg border p-4">
          Henüz kayıtlı sipariş bulunmuyor.
        </p>
      )}
{!loading && aktifSiparisler.length === 0 && (
  <p className="rounded-lg border bg-slate-50 p-4 text-slate-600">
    Şu anda aktif sipariş bulunmuyor.
  </p>
)}
      {aktifSiparisler.map((siparis) => (
        <div
          key={siparis.id}
          className="space-y-3 rounded-xl border bg-white p-4"
        >
          <div>
            <p className="font-semibold">
              Sipariş #{siparis.siparis_no}
            </p>
            <p>Müşteri: {siparis.musteri_adi}</p>
            {siparisKalemleri
  .filter((kalem) => kalem.siparis_id === siparis.id)
  .map((kalem) => {
    const urun = urunler.find(
      (u) => u.id === kalem.urun_id
    )

    return (
      <div
        key={kalem.id}
        className="mt-2 rounded-lg bg-slate-100 p-3"
      >
        <p className="font-semibold">
          Ürün: {urun?.ad ?? "Ürün bulunamadı"}
        </p>

        <p>
          Miktar: {kalem.miktar} {urun?.birim ?? "Adet"}
        </p>
      </div>
    )
  })}

{siparis.musteri_telefon && (
  <p>Telefon: {siparis.musteri_telefon}</p>
)}

{siparis.teslimat_adresi && (
  <p>Teslimat Adresi: {siparis.teslimat_adresi}</p>
)}

{siparis.aciklama && (
  <p>Açıklama: {siparis.aciklama}</p>
)}

<p>
  Durum: {DURUM_ADLARI[siparis.durum] ?? siparis.durum}
</p>
            <p className="text-sm text-slate-500">
              {new Date(siparis.created_at).toLocaleString("tr-TR")}
            </p>
          </div>

          {depoYetkisi &&
            ["yeni", "hazirlaniyor"].includes(siparis.durum) && (
              <button
                type="button"
                disabled={islemId !== null}
                onClick={() => void sevkeHazirYap(siparis)}
                className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white disabled:opacity-50"
              >
                {islemId === siparis.id
                  ? "İşleniyor..."
                  : "Sevke Hazır"}
              </button>
            )}

          {depoYetkisi && siparis.durum === "sevke_hazir" && (
            <div className="space-y-3 rounded-lg bg-slate-50 p-4">
              <p className="font-medium">
                Yükleme Fotoğrafı
              </p>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  fotografSec(siparis.id, event)
                }
                disabled={islemId !== null}
                className="block w-full text-sm"
              />

              {fotograflar[siparis.id] && (
                <p className="text-sm text-slate-600">
                  Seçilen: {fotograflar[siparis.id].name}
                </p>
              )}

              {!yuklenenYollar[siparis.id] ? (
                <button
                  type="button"
                  disabled={
                    islemId !== null ||
                    !fotograflar[siparis.id]
                  }
                  onClick={() => void fotografYukle(siparis)}
                  className="rounded-lg bg-blue-700 px-4 py-2 font-medium text-white disabled:opacity-50"
                >
                  {islemId === siparis.id
                    ? "Yükleniyor..."
                    : "Fotoğrafı Yükle"}
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-green-700">
                    Fotoğraf başarıyla yüklendi.
                  </p>

                  <button
                    type="button"
                    disabled={islemId !== null}
                    onClick={() => void teslimEt(siparis)}
                    className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
                  >
                    {islemId === siparis.id
                      ? "İşleniyor..."
                      : "Teslim Edildi"}
                  </button>
                </div>
              )}
            </div>
          )}

          {siparis.durum === "teslim_edildi" && (
            <p className="text-sm font-medium text-green-700">
              Teslimat tamamlandı.
            </p>
          )}
        </div>
      ))}
            <details className="rounded-xl border bg-white p-4">
        <summary className="cursor-pointer text-lg font-semibold">
          Geçmiş Siparişler ({gecmisSiparisler.length})
        </summary>

        <div className="mt-4 space-y-3">
          {gecmisSiparisler.length === 0 ? (
            <p className="text-sm text-slate-500">
              Henüz geçmiş sipariş bulunmuyor.
            </p>
          ) : (
            gecmisSiparisler.map((siparis) => (
              <div
                key={siparis.id}
                className="rounded-lg border bg-slate-50 p-4"
              >
                <p className="font-semibold">
                  Sipariş #{siparis.siparis_no}
                </p>

                <p>Müşteri: {siparis.musteri_adi}</p>

                {siparisKalemleri
                  .filter((kalem) => kalem.siparis_id === siparis.id)
                  .map((kalem) => {
                    const urun = urunler.find(
                      (u) => u.id === kalem.urun_id
                    )

                    return (
                      <div key={kalem.id} className="my-2">
                        <p>Ürün: {urun?.ad ?? "Ürün bulunamadı"}</p>
                        <p>
                          Miktar: {kalem.miktar} {urun?.birim ?? "Adet"}
                        </p>
                      </div>
                    )
                  })}

                <p>
                  Durum: {DURUM_ADLARI[siparis.durum] ?? siparis.durum}
                </p>

                <p className="text-sm text-slate-500">
                  {new Date(siparis.created_at).toLocaleString("tr-TR")}
                </p>
              </div>
            ))
          )}
        </div>
      </details>
    </div>
  )
}
