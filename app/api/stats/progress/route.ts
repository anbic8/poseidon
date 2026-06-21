import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const eventTypeId = searchParams.get('eventTypeId')
  const poolType    = searchParams.get('poolType') as 'KURZBAHN' | 'LANGBAHN' | null

  if (!eventTypeId || !poolType) return NextResponse.json([])

  const events = await db.event.findMany({
    where:   { eventTypeId, competition: { poolType } },
    include: { competition: { select: { date: true, name: true } } },
    orderBy: { competition: { date: 'asc' } },
  })

  return NextResponse.json(
    events.map((e) => ({
      date:            e.competition.date.toISOString(),
      timeMs:          e.timeMs,
      competitionName: e.competition.name,
    }))
  )
}
