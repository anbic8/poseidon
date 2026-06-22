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

function MobileTimeCol({ compMs, compDate, trainMs, trainDate, valid, allBest }: {
  compMs: number | null; compDate: string | null
  trainMs: number | null; trainDate: string | null
  valid: boolean; allBest: number
}) {
  return (
    <div className="text-center shrink-0 min-w-[68px]">
      {valid && compMs ? (
        <p
          className={`font-mono font-semibold ${compMs === allBest ? 'text-base text-blue-700 dark:text-blue-400' : 'text-sm text-blue-600 dark:text-blue-500'}`}
          title={compDate ? `WK vom ${formatDate(compDate)}` : undefined}>
          {formatTime(compMs)}
        </p>
      ) : (
        <p className="font-mono text-sm text-gray-300 dark:text-slate-600">—</p>
      )}
      {valid && trainMs && (
        <p className="font-mono text-[10px] text-gray-400 dark:text-slate-500"
          title={trainDate ? `TR vom ${formatDate(trainDate)}` : undefined}>
          {formatTime(trainMs)}
        </p>
      )}
    </div>
  )
}

export default function BestzeitenPage() {
  const [bests,   setBests]   = useState<BestTime[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats/bests').then((r) => r.json()).then(setBests).finally(() => setLoading(false))
  }, [])

  const individual = bests.filter((b) => !b.isRelay)
  const relays     = bests.filter((b) =>  b.isRelay)

  const grouped = STROKE_ORDER.map((stroke) => ({
    stroke, label: STROKE_LABELS[stroke] ?? stroke,
    events: individual.filter((b) => b.stroke === stroke),
  })).filter((g) => g.events.length > 0)

  const allGroups = [
    ...grouped,
    ...(relays.length > 0 ? [{ stroke: 'RELAY', label: 'Staffeln', events: relays }] : []),
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Bestzeiten</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Alltime-Bestzeiten · WK = Wettkampf · TR = Training
        </p>
      </div>

      {loading && <p className="text-gray-400 dark:text-slate-500">Lädt…</p>}

      {!loading && bests.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-slate-700 py-12 text-center text-gray-500 dark:text-slate-500">
          Noch keine Daten.{' '}
          <Link href="/training" className="text-blue-600 dark:text-blue-400 hover:underline">Training eintragen</Link> oder{' '}
          <Link href="/competitions" className="text-blue-600 dark:text-blue-400 hover:underline">Wettkampf anlegen</Link>.
        </div>
      )}

      {!loading && bests.length > 0 && (
        <>
          {/* ── Mobile: Karten-Layout ──────────────────────────────────────────── */}
          <div className="sm:hidden space-y-5">
            {allGroups.map(({ label, events }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2 px-1">
                  {label}
                </p>
                <div className="space-y-1.5">
                  {events.map((b) => {
                    const allBest = Math.min(
                      b.kb.compMs ?? Infinity, b.kb.trainMs ?? Infinity,
                      b.lb.compMs ?? Infinity, b.lb.trainMs ?? Infinity
                    )
                    return (
                      <div key={b.eventTypeId}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5">
                        <span className="flex-1 text-sm font-medium text-gray-700 dark:text-slate-300 truncate min-w-0">
                          {b.displayName}
                        </span>
                        {/* KB */}
                        <div className="flex flex-col items-center shrink-0 min-w-[68px]">
                          <p className="text-[9px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">KB</p>
                          <MobileTimeCol
                            compMs={b.kb.compMs} compDate={b.kb.compDate}
                            trainMs={b.kb.trainMs} trainDate={b.kb.trainDate}
                            valid={b.validKB} allBest={allBest}
                          />
                        </div>
                        {/* Trennlinie */}
                        <div className="w-px h-8 bg-gray-100 dark:bg-slate-700 shrink-0" />
                        {/* LB */}
                        <div className="flex flex-col items-center shrink-0 min-w-[68px]">
                          <p className="text-[9px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">LB</p>
                          <MobileTimeCol
                            compMs={b.lb.compMs} compDate={b.lb.compDate}
                            trainMs={b.lb.trainMs} trainDate={b.lb.trainDate}
                            valid={b.validLB} allBest={allBest}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400 dark:text-slate-500 px-1">
              Bestzeit = größere Schrift · Training klein darunter · Hover/Tippen zeigt Datum
            </p>
          </div>

          {/* ── Desktop: Vollständige Tabelle ────────────────────────────────── */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700 mb-3">
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
                {allGroups.map(({ stroke, label, events }) => (
                  <>
                    <tr key={`h-${stroke}`} className="bg-blue-50 dark:bg-blue-950/40">
                      <td colSpan={5} className="px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                        {label}
                      </td>
                    </tr>
                    {events.map((b) => {
                      const allBest = Math.min(
                        b.kb.compMs ?? Infinity, b.kb.trainMs ?? Infinity,
                        b.lb.compMs ?? Infinity, b.lb.trainMs ?? Infinity
                      )
                      return (
                        <tr key={b.eventTypeId}
                          className="border-t border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                          <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300">{b.displayName}</td>
                          <td className="px-3 py-2.5 text-center font-mono">
                            {b.validKB && b.kb.compMs ? (
                              <span className={`font-semibold cursor-help ${b.kb.compMs === allBest ? 'text-blue-700 dark:text-blue-400 text-base' : 'text-blue-600 dark:text-blue-500'}`}
                                title={b.kb.compDate ? `vom ${formatDate(b.kb.compDate)}` : undefined}>
                                {formatTime(b.kb.compMs)}
                              </span>
                            ) : <TimeCell ms={b.kb.compMs} date={b.kb.compDate} na={!b.validKB} />}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono text-gray-500 dark:text-slate-400 text-xs">
                            <TimeCell ms={b.kb.trainMs} date={b.kb.trainDate} na={!b.validKB} />
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono border-l border-gray-100 dark:border-slate-700">
                            {b.validLB && b.lb.compMs ? (
                              <span className={`font-semibold cursor-help ${b.lb.compMs === allBest ? 'text-blue-700 dark:text-blue-400 text-base' : 'text-blue-600 dark:text-blue-500'}`}
                                title={b.lb.compDate ? `vom ${formatDate(b.lb.compDate)}` : undefined}>
                                {formatTime(b.lb.compMs)}
                              </span>
                            ) : <TimeCell ms={b.lb.compMs} date={b.lb.compDate} na={!b.validLB} />}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono text-gray-500 dark:text-slate-400 text-xs">
                            <TimeCell ms={b.lb.trainMs} date={b.lb.trainDate} na={!b.validLB} />
                          </td>
                        </tr>
                      )
                    })}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hidden sm:block text-xs text-gray-400 dark:text-slate-500">
            Größere Schrift = absolute Alltime-Bestzeit · Hover zeigt Datum · — = keine Einträge
          </p>
        </>
      )}
    </div>
  )
}
