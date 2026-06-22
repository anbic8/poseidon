import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  name:     z.string().min(1, 'Name erforderlich'),
  location: z.string().optional(),
  date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  poolType: z.enum(['KURZBAHN', 'LANGBAHN']),
  notes:    z.string().optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const year = searchParams.get('year')

  const where: Record<string, unknown> = {}
  if (year) {
    const y = parseInt(year, 10)
    where.date = { gte: new Date(`${y}-01-01`), lt: new Date(`${y + 1}-01-01`) }
  }

  const competitions = await db.competition.findMany({
    where,
    include:  { _count: { select: { events: true } } },
    orderBy:  { date: 'desc' },
  })
  return NextResponse.json(competitions)
}

export async function POST(req: NextRequest) {
  const body   = await req.json()
  const result = createSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ errors: result.error.flatten() }, { status: 400 })
  }
  const { date, ...rest } = result.data
  const competition = await db.competition.create({
    data: { ...rest, date: new Date(date) },
  })
  return NextResponse.json(competition, { status: 201 })
}
