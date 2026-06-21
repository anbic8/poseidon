import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [comps, trains] = await Promise.all([
    db.competition.findMany({ select: { date: true } }),
    db.trainingEntry.findMany({ select: { date: true } }),
  ])

  const years = new Set<number>()
  for (const c of comps)  years.add(new Date(c.date).getFullYear())
  for (const t of trains) years.add(new Date(t.date).getFullYear())

  return NextResponse.json(Array.from(years).sort((a, b) => b - a))
}
