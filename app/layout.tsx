import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import { StoreProvider } from '@/lib/store'
import { AppShell } from '@/components/app-shell'
import './globals.css'

const manrope = Manrope({ subsets: ['latin', 'latin-ext'], variable: '--font-manrope' })

export const metadata: Metadata = {
  title: 'Plastvit Depo Stok',
  description: 'Plastvit için modern depo ve stok takip sistemi. Stok giriş/çıkış, hammadde, iade, kritik stok ve raporlar.',
  generator: 'v0.app',
  applicationName: 'Plastvit Depo Stok',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#1e3a4c',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" className={`light bg-background ${manrope.variable}`}>
      <body className="font-sans antialiased">
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
