import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { parseTimeInput, timeInputSchema } from '@/lib/time'

const updateSchema = z.object({
  eventTypeId: z.string().min(1).optional(),
  poolType:    z.enum(['KURZBAHN', 'LANGBAHN']).optional(),
  timeInput:   timeInputSchema.optional(),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes:       z.string().nullable().optional(),
})

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const entry = await db.trainingEntry.findUnique({
    where:   { id: params.id },
    include: { eventType: true },
  })
  if (!entry) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(entry)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const body   = await req.json()
  const result = updateSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ errors: result.error.flatten() }, { status: 400 })
  }

  const { timeInput, date, ...rest } = result.data
  const data: Record<string, unknown> = { ...rest }

  if (timeInput) data.timeMs = parseTimeInput(timeInput)!
  if (date)      data.date   = new Date(date)

  const entry = await db.trainingEntry.update({
    where:   { id: params.id },
    data,
    include: { eventType: true },
  })

  return NextResponse.json(entry)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await db.trainingEntry.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
