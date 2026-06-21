import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PoolType } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const poolType = searchParams.get('poolType') as PoolType | null
  const trainingOnly = searchParams.get('trainingOnly')

  const where: Record<string, unknown> = {}

  if (poolType === 'KURZBAHN') where.validKB = true
  if (poolType === 'LANGBAHN') where.validLB = true

  // trainingOnly=false → nur Wettkampf-Disziplinen
  // trainingOnly=true oder nicht gesetzt → alle Disziplinen
  if (trainingOnly === 'false') {
    where.trainingOnly = false
  }

  const eventTypes = await db.eventType.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json(eventTypes)
}
