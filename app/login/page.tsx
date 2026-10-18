
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    const normalizedPhone = phone.replace(/\D/g, "")
    const localPhone = normalizedPhone.startsWith("90") && normalizedPhone.length === 12
      ? normalizedPhone.slice(2)
      : normalizedPhone.startsWith("0") && normalizedPhone.length === 11
        ? normalizedPhone.slice(1)
        : normalizedPhone

    if (!/^5\d{9}$/.test(localPhone)) {
      setError("Geçerli bir cep telefonu numarası girin.")
      return
    }

    setLoading(true)

    try {
      const email = `${localPhone}@personel.plastvit.invalid`
      const { error: loginError } = await signIn(email, password)

      if (loginError) {
        setError("Telefon numarası veya şifre hatalı.")
        return
      }

      router.replace("/")
      router.refresh()
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-center text-slate-900">
          PLASTVIT
        </h1>

        <p className="text-center text-slate-500 mt-2 mb-8">
          Depo ve Stok Takip Sistemi
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2">
              Telefon Numarası
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border p-3"
              placeholder="05XX XXX XX XX"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border p-3"
              placeholder="Şifreniz"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal-700 p-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          YZC Plastik – Yetkili Personel Girişi
        </p>
      </div>
    </main>
  )
}
