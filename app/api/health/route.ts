import { NextResponse } from 'next/server'

// DB-Healthcheck kommt in Phase 2 wenn Prisma-Schema und Models definiert sind
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
