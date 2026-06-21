import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : null

  const dateFilter = year
    ? { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) }
    : undefined

  const [eventTypes, events, trainings] = await Promise.all([
    db.eventType.findMany({
      where:   { trainingOnly: false },
      orderBy: { sortOrder: 'asc' },
    }),
    db.event.findMany({
      where:   dateFilter ? { competition: { date: dateFilter } } : {},
      include: { competition: { select: { poolType: true, date: true } } },
    }),
    db.trainingEntry.findMany({
      where:   dateFilter ? { date: dateFilter } : {},
      select:  { eventTypeId: true, poolType: true, timeMs: true, date: true },
    }),
  ])

  // Besten Wettkampfzeit pro eventTypeId + poolType
  const compMap: Record<string, { ms: number; date: string }> = {}
  for (const e of events) {
    const key = `${e.eventTypeId}:${e.competition.poolType}`
    if (!compMap[key] || e.timeMs < compMap[key].ms) {
      compMap[key] = { ms: e.timeMs, date: e.competition.date.toISOString() }
    }
  }

  // Besten Trainingszeit pro eventTypeId + poolType
  const trainMap: Record<string, { ms: number; date: string }> = {}
  for (const t of trainings) {
    const key = `${t.eventTypeId}:${t.poolType}`
    if (!trainMap[key] || t.timeMs < trainMap[key].ms) {
      trainMap[key] = { ms: t.timeMs, date: t.date.toISOString() }
    }
  }

  const bests = eventTypes.map((et) => ({
    eventTypeId: et.id,
    displayName: et.displayName,
    stroke:      et.stroke,
    distanceM:   et.distanceM,
    isRelay:     et.isRelay,
    sortOrder:   et.sortOrder,
    validKB:     et.validKB,
    validLB:     et.validLB,
    kb: {
      compMs:   compMap[`${et.id}:KURZBAHN`]?.ms   ?? null,
      compDate: compMap[`${et.id}:KURZBAHN`]?.date  ?? null,
      trainMs:  trainMap[`${et.id}:KURZBAHN`]?.ms   ?? null,
      trainDate:trainMap[`${et.id}:KURZBAHN`]?.date ?? null,
    },
    lb: {
      compMs:   compMap[`${et.id}:LANGBAHN`]?.ms   ?? null,
      compDate: compMap[`${et.id}:LANGBAHN`]?.date  ?? null,
      trainMs:  trainMap[`${et.id}:LANGBAHN`]?.ms   ?? null,
      trainDate:trainMap[`${et.id}:LANGBAHN`]?.date ?? null,
    },
  }))

  return NextResponse.json(bests)
}
