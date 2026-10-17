const dateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
})

const shortDateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
})

const numberFormatter = new Intl.NumberFormat("tr-TR")

export const formatDateTime = (iso: string) => dateTimeFormatter.format(new Date(iso))
export const formatDate = (iso: string) => dateFormatter.format(new Date(iso))
export const formatShortDate = (iso: string) => shortDateFormatter.format(new Date(iso))
export const formatNumber = (n: number) => numberFormatter.format(n)

export function stockStatus(stock: number, critical: number): "tukendi" | "kritik" | "dusuk" | "normal" {
  if (stock <= 0) return "tukendi"
  if (stock < critical) return "kritik"
  if (stock < critical * 1.25) return "dusuk"
  return "normal"
}
