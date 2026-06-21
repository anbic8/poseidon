'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const LINKS = [
  { href: '/',             label: 'Dashboard',  icon: '📊' },
  { href: '/training',     label: 'Training',   icon: '🏊' },
  { href: '/competitions', label: 'Wettkämpfe', icon: '🏆' },
  { href: '/bestzeiten',   label: 'Bestzeiten', icon: '⭐' },
  { href: '/erfolge',      label: 'Erfolge',    icon: '🎯' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const update = () => setDark(document.documentElement.classList.contains('dark'))
    update()
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  function toggleTheme() {
    const html = document.documentElement
    if (html.classList.contains('dark')) {
      html.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setDark(false)
    } else {
      html.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setDark(true)
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900
      border-t border-gray-200 dark:border-slate-800 sm:hidden">
      <div className="grid grid-cols-6">
        {LINKS.map(({ href, label, icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center py-1.5 px-0.5 text-[10px] leading-tight transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-slate-400'
              }`}>
              <span className="text-xl leading-none mb-0.5">{icon}</span>
              <span className={isActive ? 'font-medium' : ''}>{label}</span>
            </Link>
          )
        })}
        {/* Theme-Toggle als 6. Slot */}
        <button onClick={toggleTheme}
          className="flex flex-col items-center py-1.5 px-0.5 text-[10px] leading-tight text-gray-500 dark:text-slate-400">
          <span className="text-xl leading-none mb-0.5">{dark ? '☀️' : '🌙'}</span>
          <span>Theme</span>
        </button>
      </div>
    </nav>
  )
}
