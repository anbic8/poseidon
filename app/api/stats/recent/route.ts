import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const limit = parseInt(searchParams.get('limit') ?? '10', 10)

  const [events, trainings] = await Promise.all([
    db.event.findMany({
      include:  { competition: { select: { name: true, date: true, poolType: true } }, eventType: true },
      orderBy:  { competition: { date: 'desc' } },
      take:     limit,
    }),
    db.trainingEntry.findMany({
      include:  { eventType: true },
      orderBy:  { date: 'desc' },
      take:     limit,
    }),
  ])

  const merged = [
    ...events.map((e) => ({
      id:          e.id,
      type:        'competition' as const,
      date:        e.competition.date.toISOString(),
      displayName: e.eventType.displayName,
      poolType:    e.competition.poolType,
      timeMs:      e.timeMs,
      context:     e.competition.name,
    })),
    ...trainings.map((t) => ({
      id:          t.id,
      type:        'training' as const,
      date:        t.date.toISOString(),
      displayName: t.eventType.displayName,
      poolType:    t.poolType,
      timeMs:      t.timeMs,
      context:     null,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)

  return NextResponse.json(merged)
}
