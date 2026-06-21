import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { BottomNav } from './_components/bottom-nav'
import { ThemeToggle } from './_components/theme-toggle'
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
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: Theme vor dem ersten Paint setzen */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme'),p=window.matchMedia('(prefers-color-scheme:dark)').matches;if(t==='dark'||(t===null&&p)){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body className={`${inter.className} bg-gray-50 dark:bg-slate-900 min-h-screen`}>
        <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 flex items-center gap-6 h-14">
            <Link href="/" className="font-bold text-blue-600 dark:text-blue-400 text-lg shrink-0">
              Poseidon
            </Link>
            <Link href="/" className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hidden sm:block">
              Dashboard
            </Link>
            <Link href="/training" className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hidden sm:block">
              Training
            </Link>
            <Link href="/competitions" className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hidden sm:block">
              Wettkämpfe
            </Link>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
        </nav>
        <main className="pb-16 sm:pb-0">{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}
