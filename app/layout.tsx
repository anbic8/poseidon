import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { BottomNav } from './_components/bottom-nav'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Poseidon – Schwimmtagebuch',
  description: 'Schwimmtagebuch für Wettkämpfe und Training',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Poseidon',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 flex items-center gap-6 h-14">
            <Link href="/" className="font-bold text-blue-600 text-lg shrink-0">
              Poseidon
            </Link>
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/training" className="text-sm text-gray-600 hover:text-gray-900">
              Training
            </Link>
            <Link href="/competitions" className="text-sm text-gray-600 hover:text-gray-900">
              Wettkämpfe
            </Link>
          </div>
        </nav>
        {/* pb-16 auf Mobile damit Inhalt nicht hinter Bottom-Nav verschwindet */}
        <main className="pb-16 sm:pb-0">{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}
