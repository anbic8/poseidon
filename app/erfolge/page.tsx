'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatTime, formatDate } from '@/lib/time'
import { POOL_LABELS } from '@/lib/constants'
import type { PoolType } from '@/lib/types'

type CompInfo = { id: string; name: string; date: string; poolType: PoolType; location: string | null }
type EventTypeInfo = { id: string; displayName: string; stroke: string; distanceM: number }
type EventEntry = {
  id: string; timeMs: number; place: number | null; heat: string | null
  competition: CompInfo; eventType: EventTypeInfo
}

type Achievements = {
  personalBests: EventEntry[]
  podiums: EventEntry[]
  stats: {
    totalCompetitions: number
    totalEvents: number
    totalPBs: number
    medals: { gold: number; silver: number; bronze: number }
  }
}

const PLACE_EMOJI = ['🥇', '🥈', '🥉']
const PLACE_LABEL = ['Gold', 'Silber', 'Bronze']
const PLACE_BG    = [
  'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
  'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700',
  'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
]

export default function ErfolgePage() {
  const [data,    setData]    = useState<Achievements | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<'pb' | 'podium'>('podium')

  useEffect(() => {
    fetch('/api/stats/achievements').then((r) => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8 text-gray-400 dark:text-slate-500">Lädt…</div>
  if (!data)   return null

  const { personalBests, podiums, stats } = data

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Erfolge</h1>

      {/* Stats-Karten */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Wettkämpfe', value: stats.totalCompetitions },
          { label: 'Starts',     value: stats.totalEvents },
          { label: 'Bestzeiten', value: stats.totalPBs },
          { label: 'Medaillen',  value: stats.medals.gold + stats.medals.silver + stats.medals.bronze },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{value}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Medaillen-Übersicht */}
      {(stats.medals.gold + stats.medals.silver + stats.medals.bronze) > 0 && (
        <div className="flex gap-3">
          {[
            { emoji: '🥇', count: stats.medals.gold,   label: 'Gold'   },
            { emoji: '🥈', count: stats.medals.silver, label: 'Silber' },
            { emoji: '🥉', count: stats.medals.bronze, label: 'Bronze' },
          ].filter((m) => m.count > 0).map((m) => (
            <div key={m.label} className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-1.5">
              <span className="text-2xl">{m.emoji}</span>
              <span className="font-bold text-gray-900 dark:text-slate-100">{m.count}</span>
              <span className="text-sm text-gray-500 dark:text-slate-400">{m.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tab-Switcher */}
      <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-slate-800 p-1 w-fit">
        {([['podium', '🏅 Podiumsplätze'], ['pb', '⭐ Persönliche Bestzeiten']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Podiumsplätze */}
      {tab === 'podium' && (
        <section>
          {podiums.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-slate-700 py-10 text-center text-gray-500 dark:text-slate-500">
              Noch keine Podiumsplätze. Platzierungen bei Wettkämpfen eintragen um sie hier zu sehen.
            </div>
          ) : (
            <div className="space-y-2">
              {podiums.map((e) => {
                const placeIdx = (e.place ?? 4) - 1
                return (
                  <Link key={e.id} href={`/competitions/${e.competition.id}`}
                    className={`flex items-center gap-4 rounded-lg border p-4 hover:shadow-sm transition-shadow ${PLACE_BG[placeIdx] ?? 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}>
                    <span className="text-3xl shrink-0">{PLACE_EMOJI[placeIdx] ?? `${e.place}.`}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 dark:text-slate-200">{e.eventType.displayName}</p>
                      <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                        {e.competition.name} · {formatDate(e.competition.date)}
                        {e.competition.location && ` · ${e.competition.location}`}
                        <span className="ml-1 rounded-full bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 text-xs">
                          {POOL_LABELS[e.competition.poolType]}
                        </span>
                      </p>
                      {e.heat && <p className="text-xs text-gray-400 dark:text-slate-500">{e.heat}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-lg text-blue-700 dark:text-blue-400">{formatTime(e.timeMs)}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">{PLACE_LABEL[placeIdx]} Platz</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Persönliche Bestzeiten */}
      {tab === 'pb' && (
        <section>
          {personalBests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-slate-700 py-10 text-center text-gray-500 dark:text-slate-500">
              Noch keine Wettkampf-Einträge vorhanden.
            </div>
          ) : (
            <div className="space-y-2">
              {personalBests.map((e) => (
                <Link key={e.id} href={`/competitions/${e.competition.id}`}
                  className="flex items-center gap-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all">
                  <span className="text-2xl shrink-0">⭐</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-slate-200">{e.eventType.displayName}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                      {e.competition.name} · {formatDate(e.competition.date)}
                      <span className="ml-1 rounded-full bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 text-xs">
                        {POOL_LABELS[e.competition.poolType]}
                      </span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-lg text-blue-700 dark:text-blue-400">{formatTime(e.timeMs)}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Neue Bestzeit</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
