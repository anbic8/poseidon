'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatTime, formatDate } from '@/lib/time'
import { STROKE_LABELS } from '@/lib/constants'

const STROKE_ORDER = ['FREISTIL', 'RUECKEN', 'BRUST', 'SCHMETTERLING', 'LAGEN']

type BestTime = {
  eventTypeId: string
  displayName: string
  stroke: string
  distanceM: number
  isRelay: boolean
  sortOrder: number
  validKB: boolean
  validLB: boolean
  kb: { compMs: number | null; compDate: string | null; trainMs: number | null; trainDate: string | null }
  lb: { compMs: number | null; compDate: string | null; trainMs: number | null; trainDate: string | null }
}

function TimeCell({ ms, date, na }: { ms: number | null; date?: string | null; na?: boolean }) {
  if (na)  return <span className="text-gray-200 dark:text-slate-700">—</span>
  if (!ms) return <span className="text-gray-300 dark:text-slate-600">—</span>
  return (
    <span title={date ? `vom ${formatDate(date)}` : undefined} className="cursor-help">
      {formatTime(ms)}
    </span>
  )
}

export default function BestzeitenPage() {
  const [bests,  setBests]  = useState<BestTime[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats/bests')
      .then((r) => r.json())
      .then(setBests)
      .finally(() => setLoading(false))
  }, [])

  const individual = bests.filter((b) => !b.isRelay)
  const relays     = bests.filter((b) =>  b.isRelay)

  const grouped = STROKE_ORDER.map((stroke) => ({
    stroke,
    label:  STROKE_LABELS[stroke] ?? stroke,
    events: individual.filter((b) => b.stroke === stroke),
  })).filter((g) => g.events.length > 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Bestzeiten</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Alltime-Bestzeiten · Hover über eine Zeit zeigt das Datum
        </p>
      </div>

      {loading && <p className="text-gray-400 dark:text-slate-500">Lädt…</p>}

      {!loading && bests.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-slate-700 py-12 text-center text-gray-500 dark:text-slate-500">
          Noch keine Daten. <Link href="/training" className="text-blue-600 dark:text-blue-400 hover:underline">Training eintragen</Link> oder{' '}
          <Link href="/competitions" className="text-blue-600 dark:text-blue-400 hover:underline">Wettkampf anlegen</Link>.
        </div>
      )}

      {!loading && bests.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700 mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Disziplin</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-600 dark:text-slate-400" colSpan={2}>Kurzbahn</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-600 dark:text-slate-400 border-l border-gray-200 dark:border-slate-700" colSpan={2}>Langbahn</th>
                </tr>
                <tr className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 text-xs text-gray-400 dark:text-slate-500">
                  <th className="px-4 py-1.5" />
                  <th className="px-3 py-1.5 font-medium">Wettkampf</th>
                  <th className="px-3 py-1.5 font-medium">Training</th>
                  <th className="px-3 py-1.5 font-medium border-l border-gray-200 dark:border-slate-700">Wettkampf</th>
                  <th className="px-3 py-1.5 font-medium">Training</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800">
                {grouped.map(({ stroke, label, events }) => (
                  <>
                    <tr key={`h-${stroke}`} className="bg-blue-50 dark:bg-blue-950/40">
                      <td colSpan={5} className="px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                        {label}
                      </td>
                    </tr>
                    {events.map((b) => {
                      // Beste Zeit markieren
                      const kbBest = Math.min(b.kb.compMs ?? Infinity, b.kb.trainMs ?? Infinity)
                      const lbBest = Math.min(b.lb.compMs ?? Infinity, b.lb.trainMs ?? Infinity)
                      const allBest = Math.min(kbBest, lbBest)

                      return (
                        <tr key={b.eventTypeId}
                          className="border-t border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                          <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300">{b.displayName}</td>
                          {/* KB Wettkampf */}
                          <td className="px-3 py-2.5 text-center font-mono">
                            {b.validKB && b.kb.compMs ? (
                              <span className={`font-semibold ${b.kb.compMs === allBest ? 'text-blue-700 dark:text-blue-400 text-base' : 'text-blue-600 dark:text-blue-500'}`}
                                title={b.kb.compDate ? `vom ${formatDate(b.kb.compDate)}` : undefined}>
                                {formatTime(b.kb.compMs)}
                              </span>
                            ) : <TimeCell ms={b.kb.compMs} date={b.kb.compDate} na={!b.validKB} />}
                          </td>
                          {/* KB Training */}
                          <td className="px-3 py-2.5 text-center font-mono text-gray-500 dark:text-slate-400 text-xs">
                            <TimeCell ms={b.kb.trainMs} date={b.kb.trainDate} na={!b.validKB} />
                          </td>
                          {/* LB Wettkampf */}
                          <td className="px-3 py-2.5 text-center font-mono border-l border-gray-100 dark:border-slate-700">
                            {b.validLB && b.lb.compMs ? (
                              <span className={`font-semibold ${b.lb.compMs === allBest ? 'text-blue-700 dark:text-blue-400 text-base' : 'text-blue-600 dark:text-blue-500'}`}
                                title={b.lb.compDate ? `vom ${formatDate(b.lb.compDate)}` : undefined}>
                                {formatTime(b.lb.compMs)}
                              </span>
                            ) : <TimeCell ms={b.lb.compMs} date={b.lb.compDate} na={!b.validLB} />}
                          </td>
                          {/* LB Training */}
                          <td className="px-3 py-2.5 text-center font-mono text-gray-500 dark:text-slate-400 text-xs">
                            <TimeCell ms={b.lb.trainMs} date={b.lb.trainDate} na={!b.validLB} />
                          </td>
                        </tr>
                      )
                    })}
                  </>
                ))}

                {relays.length > 0 && (
                  <>
                    <tr className="bg-blue-50 dark:bg-blue-950/40">
                      <td colSpan={5} className="px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                        Staffeln
                      </td>
                    </tr>
                    {relays.map((b) => (
                      <tr key={b.eventTypeId}
                        className="border-t border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300">{b.displayName}</td>
                        <td className="px-3 py-2.5 text-center font-mono font-semibold text-blue-700 dark:text-blue-400">
                          <TimeCell ms={b.kb.compMs} date={b.kb.compDate} na={!b.validKB} />
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-gray-500 dark:text-slate-400 text-xs">
                          <TimeCell ms={b.kb.trainMs} date={b.kb.trainDate} na={!b.validKB} />
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono font-semibold text-blue-700 dark:text-blue-400 border-l border-gray-100 dark:border-slate-700">
                          <TimeCell ms={b.lb.compMs} date={b.lb.compDate} na={!b.validLB} />
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-gray-500 dark:text-slate-400 text-xs">
                          <TimeCell ms={b.lb.trainMs} date={b.lb.trainDate} na={!b.validLB} />
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500">
            Größere Zahl = Alltime-Bestzeit · Hover zeigt Datum · — = keine Einträge · grau = Disziplin für diesen Bahntyp nicht vorgesehen
          </p>
        </>
      )}
    </div>
  )
}
