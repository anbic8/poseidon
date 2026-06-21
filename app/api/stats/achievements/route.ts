import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const events = await db.event.findMany({
    include: {
      competition: { select: { id: true, name: true, date: true, poolType: true, location: true } },
      eventType:   { select: { id: true, displayName: true, stroke: true, distanceM: true } },
    },
    orderBy: { competition: { date: 'asc' } },
  })

  // ── Persönliche Bestzeiten berechnen ────────────────────────────────────────
  // Für jede Disziplin + Bahntyp-Kombination: wann wurde erstmals eine neue Bestzeit geschwommen?
  const bestSoFar: Record<string, number> = {}
  const personalBests: typeof events = []

  for (const e of events) {
    const key = `${e.eventTypeId}:${e.competition.poolType}`
    const prev = bestSoFar[key]
    if (prev === undefined || e.timeMs < prev) {
      personalBests.push(e)
      bestSoFar[key] = e.timeMs
    }
  }

  // Neueste PBs zuerst
  personalBests.reverse()

  // ── Podiumsplätze ────────────────────────────────────────────────────────────
  const podiums = events
    .filter((e) => e.place !== null && e.place <= 3)
    .sort((a, b) => (a.place ?? 99) - (b.place ?? 99) || new Date(b.competition.date).getTime() - new Date(a.competition.date).getTime())

  // ── Statistiken ──────────────────────────────────────────────────────────────
  const competitionIds = new Set(events.map((e) => e.competitionId))
  const medals = {
    gold:   events.filter((e) => e.place === 1).length,
    silver: events.filter((e) => e.place === 2).length,
    bronze: events.filter((e) => e.place === 3).length,
  }

  return NextResponse.json({
    personalBests,
    podiums,
    stats: {
      totalCompetitions: competitionIds.size,
      totalEvents:       events.length,
      totalPBs:          personalBests.length,
      medals,
    },
  })
}
