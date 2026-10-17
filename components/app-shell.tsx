"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Boxes, Menu } from "lucide-react"
import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { MOBILE_NAV_ITEMS, NAV_ITEMS } from "@/lib/nav"
import { useStore } from "@/lib/store"
import { stockStatus } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

function useActive(href: string) {
  const pathname = usePathname()
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
        <Boxes className="size-5" aria-hidden />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-base font-extrabold tracking-tight">Plastvit</span>
        {!compact && <span className="text-xs font-medium text-sidebar-foreground/70">Depo Stok Takip</span>}
      </div>
    </div>
  )
}

function NavLink({ href, label, icon: Icon, badge, onClick }: { href: string; label: string; icon: typeof Boxes; badge?: number; onClick?: () => void }) {
  const active = useActive(href)
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="rounded-full bg-sidebar-primary px-2 py-0.5 text-xs font-bold text-sidebar-primary-foreground">{badge}</span>
      ) : null}
    </Link>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { products } = useStore()
  const [open, setOpen] = useState(false)
  const criticalCount = products.filter((p) => stockStatus(p.stock, p.criticalLevel) !== "normal").length

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col gap-6 bg-sidebar px-4 py-6 text-sidebar-foreground lg:flex">
        <Brand />
        <nav aria-label="Ana menü" className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              badge={item.href === "/kritik-stoklar" ? criticalCount : undefined}
            />
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-4 text-xs leading-relaxed text-sidebar-foreground/70">
          Ürün, depo ve hareket kayıtları Supabase üzerinde kalıcı olarak saklanır.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur lg:hidden">
          <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight text-foreground">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Boxes className="size-4" aria-hidden />
            </span>
            Plastvit
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Menüyü aç" />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-sidebar text-sidebar-foreground">
              <SheetHeader>
                <SheetTitle className="text-sidebar-foreground">
                  <Brand />
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobil menü" className="flex flex-col gap-1 px-2">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    badge={item.href === "/kritik-stoklar" ? criticalCount : undefined}
                    onClick={() => setOpen(false)}
                  />
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 px-4 pb-24 pt-5 lg:px-8 lg:pb-10 lg:pt-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <nav
          aria-label="Alt menü"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          <ul className="grid grid-cols-5">
            {MOBILE_NAV_ITEMS.map((item) => (
              <MobileNavItem key={item.href} {...item} badge={item.href === "/kritik-stoklar" ? criticalCount : undefined} />
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}

function MobileNavItem({ href, shortLabel, icon: Icon, badge }: { href: string; shortLabel: string; icon: typeof Boxes; badge?: number }) {
  const active = useActive(href)
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", active && "bg-accent")}>
          <Icon className="size-5" aria-hidden />
        </span>
        {shortLabel}
        {badge ? (
          <span className="absolute right-1/2 top-1.5 translate-x-4 rounded-full bg-warning px-1.5 text-[10px] font-bold text-warning-foreground">
            {badge}
          </span>
        ) : null}
      </Link>
    </li>
  )
}
