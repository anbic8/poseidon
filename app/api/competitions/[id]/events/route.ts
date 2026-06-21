import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { parseTimeInput, timeInputSchema } from '@/lib/time'

const createEventSchema = z.object({
  eventTypeId:   z.string().min(1, 'Disziplin erforderlich'),
  timeInput:     timeInputSchema,
  teamTimeInput: timeInputSchema.optional(),
  relayLeg:      z.number().int().min(1).max(4).optional().nullable(),
  relayStroke:   z.string().optional().nullable(),
  heat:          z.string().optional(),
  lane:          z.number().int().positive().optional().nullable(),
  place:         z.number().int().min(1).optional().nullable(),
  notes:         z.string().optional(),
})

type Params = { params: { id: string } }

export async function POST(req: NextRequest, { params }: Params) {
  const body   = await req.json()
  const result = createEventSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ errors: result.error.flatten() }, { status: 400 })
  }

  const { timeInput, teamTimeInput, ...rest } = result.data
  const event = await db.event.create({
    data: {
      ...rest,
      competitionId: params.id,
      timeMs:     parseTimeInput(timeInput)!,
      teamTimeMs: teamTimeInput ? parseTimeInput(teamTimeInput) : null,
    },
    include: { eventType: true },
  })
  return NextResponse.json(event, { status: 201 })
}
