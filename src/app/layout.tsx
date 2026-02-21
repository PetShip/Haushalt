import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import PinGuard from '@/components/PinGuard'
import { isPinRequired } from '@/lib/pin'
import './globals.css'

export const metadata: Metadata = {
  title: 'Haushalt - Household Chore Tracker',
  description: 'Track kids household chores and contributions',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Haushalt',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pinRequired = await isPinRequired()

  return (
    <html lang="de">
      <body>
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <PinGuard pinRequired={pinRequired}>{children}</PinGuard>
        </main>
      </body>
    </html>
  )
}
