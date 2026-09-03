import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  History,
  LayoutDashboard,
  Warehouse,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  shortLabel: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", shortLabel: "Panel", icon: LayoutDashboard },
  { href: "/stok-giris", label: "Stok Girişi", shortLabel: "Giriş", icon: ArrowDownToLine },
  { href: "/stok-cikis", label: "Stok Çıkışı", shortLabel: "Çıkış", icon: ArrowUpFromLine },
  { href: "/depolar", label: "Depolar", shortLabel: "Depolar", icon: Warehouse },
  { href: "/hareketler", label: "Stok Hareketleri", shortLabel: "Hareket", icon: History },
  { href: "/kritik-stoklar", label: "Kritik Stoklar", shortLabel: "Kritik", icon: AlertTriangle },
  { href: "/raporlar", label: "Raporlar", shortLabel: "Rapor", icon: BarChart3 },
]

export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((i) =>
  ["/", "/stok-giris", "/stok-cikis", "/hareketler", "/kritik-stoklar"].includes(i.href),
)
