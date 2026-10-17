
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

  useEffect(() => {
    let active = true

    async function checkAuth() {
      const { data, error } = await supabase.auth.getUser()

      if (!active) return

      const loggedIn = !error && !!data.user
      setAuthenticated(loggedIn)
      setLoading(false)

      if (!loggedIn && pathname !== "/login") {
        router.replace("/login")
      }
    }

    checkAuth()

    const { data: listener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return

        setAuthenticated(!!session)
        setLoading(false)

        if (!session && pathname !== "/login") {
          router.replace("/login")
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

  return <>{children}</>
}
