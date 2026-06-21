import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const now = new Date()

  const [next, last] = await Promise.all([
    db.competition.findFirst({
      where:   { date: { gte: now } },
      orderBy: { date: 'asc' },
    }),
    db.competition.findFirst({
      where:   { date: { lt: now } },
      orderBy: { date: 'desc' },
      include: { _count: { select: { events: true } } },
    }),
  ])

  return NextResponse.json({ next, last })
}
