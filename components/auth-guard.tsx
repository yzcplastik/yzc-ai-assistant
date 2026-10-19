
"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export function AuthGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [rol, setRol] = useState("")

  const stokSayfasi =
    pathname === "/stok-giris" ||
    pathname.startsWith("/stok-giris/") ||
    pathname === "/stok-cikis" ||
    pathname.startsWith("/stok-cikis/")

  const stokYetkisi =
    rol === "yonetici" || rol === "calisan"

  useEffect(() => {
    let active = true

    async function checkAuth() {
      setLoading(true)

      const { data, error } = await supabase.auth.getUser()

      if (!active) return

      const user = !error ? data.user : null
      setAuthenticated(!!user)

      if (!user) {
        setRol("")
        setLoading(false)

        if (pathname !== "/login") {
          router.replace("/login")
        }
        return
      }

      const { data: rolKaydi } = await supabase
        .from("kullanici_rolleri")
        .select("rol")
        .eq("user_id", user.id)
        .maybeSingle()

      if (!active) return

      const kullaniciRolu = rolKaydi?.rol ?? ""
      setRol(kullaniciRolu)
      setLoading(false)

      const stokAdresi =
        pathname === "/stok-giris" ||
        pathname.startsWith("/stok-giris/") ||
        pathname === "/stok-cikis" ||
        pathname.startsWith("/stok-cikis/")

      if (
        stokAdresi &&
        !["yonetici", "calisan"].includes(kullaniciRolu)
      ) {
        router.replace("/")
      }
    }

    void checkAuth()

    const { data: listener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return

        if (!session) {
          setAuthenticated(false)
          setRol("")
          setLoading(false)

          if (pathname !== "/login") {
            router.replace("/login")
          }
        }
      })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [pathname, router])

  if (pathname === "/login") {
    return <>{children}</>
  }

  if (loading || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Oturum kontrol ediliyor...</p>
      </div>
    )
  }

  if (stokSayfasi && !stokYetkisi) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Bu sayfaya erişim yetkiniz bulunmuyor.</p>
      </div>
    )
  }

  return <>{children}</>
}
