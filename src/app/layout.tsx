import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import PinGuard from '@/components/PinGuard'
import { isPinRequired } from '@/lib/pin'
import './globals.css'

export const metadata: Metadata = {
  title: 'Haushalt - Household Chore Tracker',
  description: 'Track kids household chores and contributions',
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
