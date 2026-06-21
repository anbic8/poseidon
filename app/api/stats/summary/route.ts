import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : null

  const dateFilter = year
    ? { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) }
    : undefined

  const [totalComps, filteredComps, totalTrains, filteredTrains] = await Promise.all([
    db.competition.count(),
    db.competition.count(dateFilter ? { where: { date: dateFilter } } : undefined),
    db.trainingEntry.count(),
    db.trainingEntry.count(dateFilter ? { where: { date: dateFilter } } : undefined),
  ])

  return NextResponse.json({
    competitions: { total: totalComps,  filtered: filteredComps  },
    trainings:    { total: totalTrains, filtered: filteredTrains },
  })
}
