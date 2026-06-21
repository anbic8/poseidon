'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/',             label: 'Dashboard',  icon: '📊' },
  { href: '/training',     label: 'Training',   icon: '🏊' },
  { href: '/competitions', label: 'Wettkämpfe', icon: '🏆' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 sm:hidden">
      <div className="grid grid-cols-3">
        {LINKS.map(({ href, label, icon }) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center py-2 px-1 text-xs transition-colors ${
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
            >
              <span className="text-2xl leading-none mb-0.5">{icon}</span>
              <span className={isActive ? 'font-medium' : ''}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
