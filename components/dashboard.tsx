
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Boxes,
  ClipboardList,
  Package,
  Warehouse,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { MovementList } from "@/components/movement-list"
import { formatDate, formatNumber } from "@/lib/format"
import { useStore } from "@/lib/store"
import { isInbound } from "@/lib/types"
import { supabase } from "@/lib/supabase"

type Siparis = {
  id: string
  siparis_no: string
  musteri_adi: string
  durum: string
}

const DURUMLAR = [
  { kod: "yeni", ad: "Yeni" },
  { kod: "hazirlaniyor", ad: "Hazırlanıyor" },
  { kod: "sevke_hazir", ad: "Sevke Hazır" },
  { kod: "teslim_edildi", ad: "Teslim Edildi" },
]

export function Dashboard() {
  const router = useRouter()

async function cikisYap() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    alert("Çıkış yapılamadı: " + error.message)
    return
  }

  router.replace("/login")
  router.refresh()
}
  const { products, warehouses, movements } = useStore()
  const [siparisler, setSiparisler] = useState<Siparis[]>([])
  const [aktifEmail, setAktifEmail] = useState("")
  const [aktifRol, setAktifRol] = useState("")
  const [siparisYukleniyor, setSiparisYukleniyor] = useState(true)
  const [siparisHatasi, setSiparisHatasi] = useState("")

  useEffect(() => {
    let aktif = true

    async function siparisleriGetir() {
      const { data, error } = await supabase
        .from("siparisler")
        .select("id, siparis_no, musteri_adi, durum")
        .order("created_at", { ascending: false })

      if (!aktif) return

      if (error) {
        setSiparisHatasi(error.message)
      } else {
        setSiparisler(data ?? [])
      }

      setSiparisYukleniyor(false)
    }

    void siparisleriGetir()

    return () => {
      aktif = false
    }
  }, [])
useEffect(() => {
  let aktif = true

  async function kullaniciGetir() {
    const { data: kullanici } = await supabase.auth.getUser()

    if (!aktif) return

    const user = kullanici.user

    if (!user) {
      setAktifEmail("")
      setAktifRol("")
      return
    }

    setAktifEmail(user.email ?? "")

    const { data: rolKaydi } = await supabase
      .from("kullanici_rolleri")
      .select("rol")
      .eq("user_id", user.id)
      .maybeSingle()

    if (aktif) {
      setAktifRol(rolKaydi?.rol ?? "Rol bulunamadı")
    }
  }

  void kullaniciGetir()

  return () => {
    aktif = false
  }
}, [])
  const today = new Date().toDateString()
  const todaysMovements = movements.filter(
    (m) => new Date(m.createdAt).toDateString() === today
  )

  const todayIn = todaysMovements
    .filter((m) => isInbound(m.type))
    .reduce((s, m) => s + m.quantity, 0)

  const todayOut = todaysMovements
    .filter((m) => !isInbound(m.type))
    .reduce((s, m) => s + m.quantity, 0)

  const siparisSayisi = (durum: string) =>
    siparisler.filter((s) => s.durum === durum).length

  const durumAdi = (durum: string) =>
    DURUMLAR.find((d) => d.kod === durum)?.ad ?? durum

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${formatDate(new Date().toISOString())} · Depo ve sipariş durumuna genel bakış`}
      />
<div className="mb-6 flex justify-end">
  <div className="rounded-xl border bg-card px-4 py-3 text-sm shadow-sm">
    <p className="text-xs text-muted-foreground">
      Aktif Kullanıcı
    </p>

    <p className="font-semibold">
      {aktifEmail || "Kullanıcı yükleniyor..."}
    </p>

    <p className="text-xs text-muted-foreground">
      {aktifRol === "yonetici"
        ? "Yönetici"
        : aktifRol === "calisan"
          ? "Depo Çalışanı"
          : aktifRol === "satis_temsilcisi"
            ? "Satış Temsilcisi"
            : aktifRol || "Rol yükleniyor..."}
    </p>
<button
  type="button"
  onClick={cikisYap}
  className="mt-3 w-full rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
>
  Çıkış Yap
</button>
  </div>
</div>
      {/* Hızlı işlemler */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Link
          href="/stok-giris"
          className="flex h-20 items-center gap-3 rounded-xl bg-primary px-4 text-primary-foreground transition-colors hover:bg-primary/90 lg:h-24"
        >
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary-foreground/15">
            <ArrowDownToLine className="size-6" aria-hidden />
          </span>
          <span className="flex flex-col">
            <span className="text-base font-extrabold">Stok Girişi</span>
            <span className="text-xs opacity-80">
              Ürün · Hammadde · İade
            </span>
          </span>
        </Link>

        <Link
          href="/stok-cikis"
          className="flex h-20 items-center gap-3 rounded-xl border-2 border-primary bg-card px-4 text-foreground transition-colors hover:bg-accent lg:h-24"
        >
          <span className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <ArrowUpFromLine className="size-6" aria-hidden />
          </span>
          <span className="flex flex-col">
            <span className="text-base font-extrabold">Stok Çıkışı</span>
            <span className="text-xs text-muted-foreground">
              Sevkiyat · Üretime verme
            </span>
          </span>
        </Link>
      </div>

      {/* Stok özet kartları */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Package}
          label="Toplam Ürün Kalemi"
          value={formatNumber(products.length)}
        />
        <StatCard
          icon={Warehouse}
          label="Depo"
          value={formatNumber(warehouses.length)}
        />
        <StatCard
          icon={ArrowDownToLine}
          label="Bugünkü Giriş"
          value={`+${formatNumber(todayIn)}`}
          tone="success"
        />
        <StatCard
          icon={ArrowUpFromLine}
          label="Bugünkü Çıkış"
          value={`−${formatNumber(todayOut)}`}
          tone="destructive"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Sipariş takip paneli */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList
                className="size-4 text-primary"
                aria-hidden
              />
              Sipariş Takibi
            </CardTitle>

            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/siparisler" />}
            >
              Tümü <ArrowRight className="size-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {siparisYukleniyor ? (
              <p className="text-sm text-muted-foreground">
                Siparişler yükleniyor...
              </p>
            ) : siparisHatasi ? (
              <p className="text-sm text-red-600">
                Siparişler yüklenemedi: {siparisHatasi}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {DURUMLAR.map((durum) => (
                    <div
                      key={durum.kod}
                      className="rounded-lg bg-muted p-3"
                    >
                      <p className="text-xs text-muted-foreground">
                        {durum.ad}
                      </p>
                      <p className="text-2xl font-extrabold tabular-nums">
                        {siparisSayisi(durum.kod)}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  Toplam {siparisler.length} sipariş
                </p>

                {siparisler.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Henüz kayıtlı sipariş bulunmuyor.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {siparisler.slice(0, 5).map((siparis) => (
                      <li
                        key={siparis.id}
                        className="py-2.5"
                      >
                        <p className="text-sm font-semibold">
                          #{siparis.siparis_no}
                        </p>
                        <p className="truncate text-sm">
                          {siparis.musteri_adi}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {durumAdi(siparis.durum)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Son stok hareketleri */}
        <div className="flex flex-col gap-3 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Boxes className="size-4 text-primary" aria-hidden />
              Son Hareketler
            </h2>

            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/hareketler" />}
            >
              Tümü <ArrowRight className="size-4" />
            </Button>
          </div>

          <MovementList movements={movements.slice(0, 6)} />
        </div>
      </div>
    </>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Package
  label: string
  value: string
  tone?: "default" | "success" | "destructive"
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : "text-foreground"

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Icon className="size-4" aria-hidden />
          {label}
        </div>

        <p
          className={`text-2xl font-extrabold tabular-nums lg:text-3xl ${toneClass}`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  )
}
