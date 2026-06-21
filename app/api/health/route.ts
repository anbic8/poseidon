import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()

  try {
    await db.$queryRaw`SELECT 1`

    return NextResponse.json({
      status:    'ok',
      db:        'ok',
      dbLatency: `${Date.now() - start}ms`,
      timestamp: new Date().toISOString(),
      version:   process.env.npm_package_version ?? 'unknown',
      timezone:  process.env.TZ ?? 'not set',
    })
  } catch (err: unknown) {
    return NextResponse.json(
      {
        status:    'error',
        db:        'unreachable',
        error:     err instanceof Error ? err.message : 'unknown',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
