'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { formatTime, formatDate } from '@/lib/time'
import { STROKE_LABELS, POOL_LABELS } from '@/lib/constants'
import type { Competition, PoolType } from '@/lib/types'

const ProgressChart = dynamic(
  () => import('./_components/progress-chart').then((m) => m.ProgressChart),
  { ssr: false, loading: () => <div className="h-44 flex items-center justify-center text-gray-400 text-sm">Lädt Chart…</div> }
)

// ── Types ─────────────────────────────────────────────────────────────────────

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

type RecentActivity = {
  id: string
  type: 'competition' | 'training'
  date: string
  displayName: string
  poolType: PoolType
  timeMs: number
  context: string | null
}

type Summary = {
  competitions: { total: number; filtered: number }
  trainings:    { total: number; filtered: number }
}

type ChartPoint = { date: string; timeMs: number; competitionName: string }

const STROKE_ORDER = ['FREISTIL', 'RUECKEN', 'BRUST', 'SCHMETTERLING', 'LAGEN']
const currentYear  = new Date().getFullYear()
const YEARS        = Array.from({ length: 5 }, (_, i) => currentYear - i)

// ── Helfer ────────────────────────────────────────────────────────────────────

function TimeCell({ ms, date, na }: { ms: number | null; date?: string | null; na?: boolean }) {
  if (na) return <span className="text-gray-200">—</span>
  if (!ms) return <span className="text-gray-300">—</span>
  return (
    <span title={date ? formatDate(date) : undefined}>
      {formatTime(ms)}
    </span>
  )
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function CompCard({ title, comp }: { title: string; comp: Competition | null }) {
  if (!comp) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 px-4 py-3">
        <p className="text-xs text-gray-400 uppercase tracking-wide">{title}</p>
        <p className="text-sm text-gray-400 mt-1">—</p>
      </div>
    )
  }
  return (
    <Link href={`/competitions/${comp.id}`}
      className="rounded-lg border border-gray-200 bg-white px-4 py-3 block hover:border-blue-300 transition-colors">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{title}</p>
      <p className="font-semibold text-gray-800 mt-0.5 truncate">{comp.name}</p>
      <p className="text-xs text-gray-500 mt-0.5">
        {formatDate(comp.date)}{comp.location ? ` · ${comp.location}` : ''}{' '}
        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs">{POOL_LABELS[comp.poolType]}</span>
      </p>
    </Link>
  )
}

// ── Hauptseite ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [year,       setYear]       = useState<number>(currentYear)
  const [bests,      setBests]      = useState<BestTime[]>([])
  const [recent,     setRecent]     = useState<RecentActivity[]>([])
  const [summary,    setSummary]    = useState<Summary | null>(null)
  const [nextComp,   setNextComp]   = useState<Competition | null>(null)
  const [lastComp,   setLastComp]   = useState<Competition | null>(null)
  const [chartData,  setChartData]  = useState<ChartPoint[]>([])
  const [chartType,  setChartType]  = useState('')
  const [chartPool,  setChartPool]  = useState<PoolType>('KURZBAHN')
  const [loading,    setLoading]    = useState(true)

  const loadDashboard = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/stats/bests?year=${year}`).then((r) => r.json()),
      fetch('/api/stats/recent?limit=8').then((r) => r.json()),
      fetch(`/api/stats/summary?year=${year}`).then((r) => r.json()),
      fetch('/api/competitions/upcoming').then((r) => r.json()),
    ]).then(([b, r, s, u]) => {
      setBests(b)
      setRecent(r)
      setSummary(s)
      setNextComp(u.next ?? null)
      setLastComp(u.last ?? null)
    }).finally(() => setLoading(false))
  }, [year])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  useEffect(() => {
    if (!chartType) { setChartData([]); return }
    fetch(`/api/stats/progress?eventTypeId=${chartType}&poolType=${chartPool}`)
      .then((r) => r.json())
      .then(setChartData)
  }, [chartType, chartPool])

  const individualBests = bests.filter((b) => !b.isRelay)
  const relayBests      = bests.filter((b) => b.isRelay)

  const groupedByStroke = STROKE_ORDER.map((stroke) => ({
    stroke,
    label:  STROKE_LABELS[stroke] ?? stroke,
    events: individualBests.filter((b) => b.stroke === stroke),
  })).filter((g) => g.events.length > 0)

  // Optionen für den Chart-Selector (nur Competition-Disziplinen)
  const chartOptions = bests.filter((b) => !b.isRelay)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Saison-Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Saison:</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Stats-Karten */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Wettkämpfe (Saison)"
            value={summary.competitions.filtered}
            sub={`${summary.competitions.total} gesamt`}
          />
          <StatCard
            label="Training (Saison)"
            value={summary.trainings.filtered}
            sub={`${summary.trainings.total} gesamt`}
          />
          <CompCard title="Letzter Wettkampf" comp={lastComp} />
          <CompCard title="Nächster Wettkampf" comp={nextComp} />
        </div>
      )}

      {loading && (
        <p className="text-center text-gray-400 text-sm py-8">Lade Daten…</p>
      )}

      {/* Bestzeiten-Tabelle */}
      {!loading && bests.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Bestzeiten {year}
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-40">Disziplin</th>
                  <th className="text-center px-3 py-2.5 font-medium text-gray-600" colSpan={2}>
                    Kurzbahn 25m
                  </th>
                  <th className="text-center px-3 py-2.5 font-medium text-gray-600 border-l border-gray-200" colSpan={2}>
                    Langbahn 50m
                  </th>
                </tr>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-400">
                  <th className="px-4 py-1.5" />
                  <th className="px-3 py-1.5 font-medium">Wettkampf</th>
                  <th className="px-3 py-1.5 font-medium">Training</th>
                  <th className="px-3 py-1.5 font-medium border-l border-gray-200">Wettkampf</th>
                  <th className="px-3 py-1.5 font-medium">Training</th>
                </tr>
              </thead>
              <tbody>
                {groupedByStroke.map(({ stroke, label, events }) => (
                  <>
                    <tr key={`header-${stroke}`} className="bg-blue-50">
                      <td colSpan={5} className="px-4 py-1.5 text-xs font-semibold text-blue-700 uppercase tracking-wide">
                        {label}
                      </td>
                    </tr>
                    {events.map((b) => (
                      <tr key={b.eventTypeId}
                        className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-gray-700">{b.displayName}</td>
                        <td className="px-3 py-2.5 text-center font-mono font-semibold text-blue-700">
                          <TimeCell ms={b.kb.compMs} date={b.kb.compDate} na={!b.validKB} />
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-gray-500 text-xs">
                          <TimeCell ms={b.kb.trainMs} date={b.kb.trainDate} na={!b.validKB} />
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono font-semibold text-blue-700 border-l border-gray-100">
                          <TimeCell ms={b.lb.compMs} date={b.lb.compDate} na={!b.validLB} />
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-gray-500 text-xs">
                          <TimeCell ms={b.lb.trainMs} date={b.lb.trainDate} na={!b.validLB} />
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
                {relayBests.length > 0 && (
                  <>
                    <tr className="bg-blue-50">
                      <td colSpan={5} className="px-4 py-1.5 text-xs font-semibold text-blue-700 uppercase tracking-wide">
                        Staffeln
                      </td>
                    </tr>
                    {relayBests.map((b) => (
                      <tr key={b.eventTypeId}
                        className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-gray-700">{b.displayName}</td>
                        <td className="px-3 py-2.5 text-center font-mono font-semibold text-blue-700">
                          <TimeCell ms={b.kb.compMs} date={b.kb.compDate} na={!b.validKB} />
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-gray-500 text-xs">
                          <TimeCell ms={b.kb.trainMs} date={b.kb.trainDate} na={!b.validKB} />
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono font-semibold text-blue-700 border-l border-gray-100">
                          <TimeCell ms={b.lb.compMs} date={b.lb.compDate} na={!b.validLB} />
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-gray-500 text-xs">
                          <TimeCell ms={b.lb.trainMs} date={b.lb.trainDate} na={!b.validLB} />
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Wettkampfzeit = fett blau · Trainingszeit = grau · — = keine Daten · Hover zeigt Datum
          </p>
        </section>
      )}

      {/* Letzte Aktivitäten */}
      {!loading && recent.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Letzte Aktivitäten</h2>
          <div className="space-y-1.5">
            {recent.map((a) => (
              <div key={`${a.type}-${a.id}`}
                className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-2.5">
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  a.type === 'competition'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {a.type === 'competition' ? 'WK' : 'TR'}
                </span>
                <span className="text-xs text-gray-400 shrink-0 w-20">{formatDate(a.date)}</span>
                <span className="flex-1 text-sm text-gray-700 truncate">
                  {a.displayName}
                  {a.context && <span className="text-gray-400"> · {a.context}</span>}
                </span>
                <span className="font-mono text-sm font-semibold text-blue-700 shrink-0">
                  {formatTime(a.timeMs)}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {a.poolType === 'KURZBAHN' ? 'KB' : 'LB'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Zeitverlauf-Chart */}
      {!loading && chartOptions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Zeitverlauf</h2>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap gap-3 mb-4">
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Disziplin wählen —</option>
                {STROKE_ORDER.map((stroke) => {
                  const opts = chartOptions.filter((b) => b.stroke === stroke)
                  if (!opts.length) return null
                  return (
                    <optgroup key={stroke} label={STROKE_LABELS[stroke] ?? stroke}>
                      {opts.map((b) => (
                        <option key={b.eventTypeId} value={b.eventTypeId}>{b.displayName}</option>
                      ))}
                    </optgroup>
                  )
                })}
              </select>

              <div className="flex gap-2">
                {(['KURZBAHN', 'LANGBAHN'] as PoolType[]).map((pt) => (
                  <button
                    key={pt}
                    onClick={() => setChartPool(pt)}
                    className={`rounded-md px-3 py-1.5 text-sm border transition-colors ${
                      chartPool === pt
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pt === 'KURZBAHN' ? 'KB' : 'LB'}
                  </button>
                ))}
              </div>
            </div>

            <ProgressChart data={chartData} />
          </div>
        </section>
      )}

      {!loading && bests.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center text-gray-500">
          <p className="text-lg mb-2">Noch keine Daten.</p>
          <p className="text-sm">
            <Link href="/training" className="text-blue-600 hover:underline">Trainingszeit eintragen</Link>
            {' '}oder{' '}
            <Link href="/competitions" className="text-blue-600 hover:underline">Wettkampf anlegen</Link>
          </p>
        </div>
      )}
    </div>
  )
}
