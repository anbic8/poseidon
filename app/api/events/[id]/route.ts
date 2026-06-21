import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { parseTimeInput, timeInputSchema } from '@/lib/time'

const updateEventSchema = z.object({
  eventTypeId:   z.string().min(1).optional(),
  timeInput:     timeInputSchema.optional(),
  teamTimeInput: timeInputSchema.optional().nullable(),
  relayLeg:      z.number().int().min(1).max(4).optional().nullable(),
  relayStroke:   z.string().optional().nullable(),
  heat:          z.string().optional().nullable(),
  lane:          z.number().int().positive().optional().nullable(),
  place:         z.number().int().min(1).optional().nullable(),
  notes:         z.string().optional().nullable(),
})

type Params = { params: { id: string } }

export async function PUT(req: NextRequest, { params }: Params) {
  const body   = await req.json()
  const result = updateEventSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ errors: result.error.flatten() }, { status: 400 })
  }

  const { timeInput, teamTimeInput, ...rest } = result.data
  const data: Record<string, unknown> = { ...rest }

  if (timeInput) data.timeMs = parseTimeInput(timeInput)!
  if (teamTimeInput !== undefined) {
    data.teamTimeMs = teamTimeInput ? parseTimeInput(teamTimeInput) : null
  }

  const event = await db.event.update({
    where:   { id: params.id },
    data,
    include: { eventType: true },
  })
  return NextResponse.json(event)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await db.event.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
