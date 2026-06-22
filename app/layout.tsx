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
    capable:         true,
    statusBarStyle:  'default',
    title:           'Poseidon',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: Theme vor dem ersten Paint setzen */}
        <script dangerouslySetInnerHTML={{
          __html: `try{var t=localStorage.getItem('theme'),p=window.matchMedia('(prefers-color-scheme:dark)').matches;if(t==='dark'||(t===null&&p)){document.documentElement.classList.add('dark')}}catch(e){}`,
        }} />
        {/* Service Worker für PWA-Installation und Offline-Modus */}
        <script dangerouslySetInnerHTML={{
          __html: `if('serviceWorker'in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(e){console.log('SW:',e)})})}`,
        }} />
      </head>
      <body className={`${inter.className} bg-gray-50 dark:bg-slate-900 min-h-screen`}>
        {/* Desktop-Navigation */}
        <nav className="hidden sm:block bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 flex items-center gap-6 h-14">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/poseidon.png" alt="Poseidon" className="h-8 w-8 rounded-lg object-contain" />
              <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">Poseidon</span>
            </Link>
            <Link href="/"             className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200">Dashboard</Link>
            <Link href="/training"     className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200">Training</Link>
            <Link href="/competitions" className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200">Wettkämpfe</Link>
            <Link href="/bestzeiten"   className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200">Bestzeiten</Link>
            <Link href="/erfolge"      className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200">Erfolge</Link>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
        </nav>
        <main className="pb-20 sm:pb-0">{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}
