import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { parseTimeInput, timeInputSchema } from '@/lib/time'

const createSchema = z.object({
  eventTypeId: z.string().min(1, 'Disziplin erforderlich'),
  poolType:    z.enum(['KURZBAHN', 'LANGBAHN']),
  timeInput:   timeInputSchema,
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  notes:       z.string().optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const eventTypeId = searchParams.get('eventTypeId')
  const poolType    = searchParams.get('poolType')
  const year        = searchParams.get('year')

  const where: Record<string, unknown> = {}

  if (eventTypeId) where.eventTypeId = eventTypeId
  if (poolType)    where.poolType = poolType

  if (year) {
    const y = parseInt(year, 10)
    where.date = {
      gte: new Date(`${y}-01-01`),
      lt:  new Date(`${y + 1}-01-01`),
    }
  }

  const trainings = await db.trainingEntry.findMany({
    where,
    include:  { eventType: true },
    orderBy:  { date: 'desc' },
  })

  return NextResponse.json(trainings)
}

export async function POST(req: NextRequest) {
  const body   = await req.json()
  const result = createSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ errors: result.error.flatten() }, { status: 400 })
  }

  const { eventTypeId, poolType, timeInput, date, notes } = result.data

  const entry = await db.trainingEntry.create({
    data: {
      eventTypeId,
      poolType,
      timeMs: parseTimeInput(timeInput)!,
      date:   new Date(date),
      notes,
    },
    include: { eventType: true },
  })

  return NextResponse.json(entry, { status: 201 })
}
