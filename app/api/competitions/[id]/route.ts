import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const updateSchema = z.object({
  name:     z.string().min(1).optional(),
  location: z.string().nullable().optional(),
  date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  poolType: z.enum(['KURZBAHN', 'LANGBAHN']).optional(),
  notes:    z.string().nullable().optional(),
})

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const competition = await db.competition.findUnique({
    where:   { id: params.id },
    include: {
      events: {
        include:  { eventType: true },
        orderBy:  { createdAt: 'asc' },
      },
    },
  })
  if (!competition) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(competition)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const body   = await req.json()
  const result = updateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ errors: result.error.flatten() }, { status: 400 })
  }
  const { date, ...rest } = result.data
  const data: Record<string, unknown> = { ...rest }
  if (date) data.date = new Date(date)

  const competition = await db.competition.update({
    where: { id: params.id },
    data,
  })
  return NextResponse.json(competition)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await db.competition.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
